interface YclientsConfig {
  token: string;
  authCookie: string;
  chainId: string;
  categoryId: string;
  branchIds: string[];
}

interface YclientsService {
  id: number;
  title: string;
  price_min: number;
  category_id?: number;
}

interface YclientsSubscriptionType {
  id: number;
  title: string;
  cost: number;
  allow_freeze: boolean;
  freeze_limit: number;
  freeze_limit_unit_id: number;
  balance_container: {
    links: Array<{
      service: { id: number };
      count: number;
    }>;
  };
}

export class YclientsAPI {
  private config: YclientsConfig;

  constructor(config: YclientsConfig) {
    this.config = config;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.token}`,
      'Accept': 'application/json',
      'Cookie': `auth=${this.config.authCookie}`,
      'Content-Type': 'application/json'
    };
  }

  async getServices(): Promise<YclientsService[]> {
    const url = `https://yclients.com/api/v1/chain/${this.config.chainId}/services/composites?category_id=${this.config.categoryId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Yclients API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  async getSubscriptionTypes(): Promise<YclientsSubscriptionType[]> {
    let allSubscriptionTypes: YclientsSubscriptionType[] = [];
    let page = 1;
    const limit = 250;
    let hasMore = true;

    while (hasMore) {
      const url = `https://yclients.com/api/v1/chain/${this.config.chainId}/loyalty/abonement_types?page=${page}&limit=${limit}&include[0]=balance_container&include[1]=abonements_count&include[2]=attached_salon_ids&is_archived=0&filter[category_id]=0`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Yclients API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const subscriptionTypes = data.data || [];
      
      allSubscriptionTypes = allSubscriptionTypes.concat(subscriptionTypes);
      
      // Если получили меньше чем лимит, значит это последняя страница
      hasMore = subscriptionTypes.length === limit;
      page++;
      
      // Защита от бесконечного цикла (максимум 50 страниц = 12500 записей)
      if (page > 50) {
        console.warn('Reached maximum page limit for subscription types sync');
        break;
      }
    }

    return allSubscriptionTypes;
  }

  async createSubscriptionType(subscriptionData: {
    title: string;
    cost: number;
    services: Array<{ serviceId: number; count: number }>;
    allowFreeze: boolean;
    freezeLimit: number;
    packageType: string;
  }): Promise<YclientsSubscriptionType> {
    const url = `https://yclients.com/api/v1/chain/${this.config.chainId}/loyalty/abonement_types`;
    
    const payload = {
      title: subscriptionData.title,
      salon_group_id: parseInt(this.config.chainId),
      cost: subscriptionData.cost,
      salon_ids: this.config.branchIds.map(Number),
      period: 2,
      period_unit_id: 4, // год
      allow_freeze: subscriptionData.allowFreeze,
      freeze_limit: subscriptionData.freezeLimit,
      freeze_limit_unit_id: subscriptionData.freezeLimit > 0 ? 1 : 0, // дни
      is_booking_when_frozen_allowed: false,
      balance_container: {
        links: subscriptionData.services.map(service => ({
          service: { id: service.serviceId },
          count: service.count
        }))
      },
      category_id: parseInt(this.config.categoryId) || null
    };

    console.log('Creating subscription type with payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Yclients API error response:', errorText);
      throw new Error(`Yclients API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.data;
  }
}

export function createYclientsService(config: YclientsConfig): YclientsAPI {
  return new YclientsAPI(config);
}
