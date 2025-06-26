import puppeteer from 'puppeteer';
import { Offer } from '@shared/schema';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { execSync } from 'child_process';

interface PaymentScheduleItem {
  date: string;
  amount: number;
  description: string;
}

export class PDFGenerator {
  async generateOfferPDF(offer: Offer): Promise<Buffer> {
    let executablePath;
    try {
      executablePath = execSync('which chromium', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.log('Chromium not found, using default');
      executablePath = undefined;
    }

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--run-all-compositor-stages-before-draw',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-ipc-flooding-protection'
      ]
    });

    try {
      const page = await browser.newPage();
      
      const htmlContent = this.generateOfferHTML(offer);
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private getServiceNames(selectedServices: any[]): string {
    return selectedServices.map(service => service.name).join(', ');
  }

  private getTotalSessions(selectedServices: any[]): number {
    return selectedServices.reduce((total, service) => total + service.quantity, 0);
  }

  private getPackageDiscount(packageType: string): number {
    switch (packageType) {
      case 'vip': return 50;
      case 'standard': return 30;
      case 'economy': return 20;
      default: return 0;
    }
  }

  private getPackagePerks(packageType: string): any {
    switch (packageType) {
      case 'vip':
        return {
          massage: 'Курс массажа вокруг глаз на аппарате Bork D617 - 10 сеансов',
          card: 'Золотая карта',
          cardDiscount: '35',
          giftSessions: '3',
          freezeOption: 'Бессрочно',
          bonusPercent: '20'
        };
      case 'standard':
        return {
          massage: 'Курс массажа вокруг глаз на аппарате Bork D617 - 5 сеансов',
          card: 'Серебряная карта',
          cardDiscount: '30',
          giftSessions: '1',
          freezeOption: '6 мес',
          bonusPercent: '10'
        };
      case 'economy':
        return {
          massage: 'Курс массажа вокруг глаз на аппарате Bork D617 - 3 сеанса',
          card: 'Бронзовая карта',
          cardDiscount: '25',
          giftSessions: '0',
          freezeOption: '3 мес',
          bonusPercent: '0'
        };
      default:
        return {
          massage: 'Курс массажа вокруг глаз на аппарате Bork D617 - 3 сеанса',
          card: 'Бронзовая карта',
          cardDiscount: '25',
          giftSessions: '0',
          freezeOption: '3 мес',
          bonusPercent: '0'
        };
    }
  }

  private generateOfferHTML(offer: Offer): string {
    const selectedServices = offer.selectedServices as any[];
    const packagePerks = this.getPackagePerks(offer.selectedPackage);
    const discountPercentage = this.getPackageDiscount(offer.selectedPackage);

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Приложение №1 к договору-оферте</title>
    <style>
        @page { 
            margin: 20mm; 
            size: A4; 
        }
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            margin: 0;
            padding: 20mm;
            color: #000;
        }
        .title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 30px;
        }
        .subtitle {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 25px;
        }
        .section {
            margin-bottom: 15px;
        }
        .service-name {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .details {
            margin-bottom: 15px;
        }
        .perks-list {
            margin-left: 20px;
            margin-bottom: 10px;
        }
        .cost-section {
            margin-top: 30px;
            margin-bottom: 20px;
        }
        .cost-item {
            margin-bottom: 5px;
        }
        .footer-note {
            margin-top: 40px;
            font-size: 11pt;
            text-align: center;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="title">
        Приложение № 1 к договору-оферте на оказание услуг по системе абонементов в студиях аппаратной косметологии «Виви» (Текст договора-оферты размещен на vivilaser.ru)
    </div>

    <div class="subtitle">
        Стороны договорились о следующих услугах, входящих в Абонемент
    </div>

    <div class="section">
        <div class="service-name">1. Наименование услуги "${this.getServiceNames(selectedServices)}"</div>
    </div>

    <div class="section">
        <div class="details">2. Количество сеансов: ${this.getTotalSessions(selectedServices)}</div>
    </div>

    <div class="section">
        <div class="details">2. Индивидуальная скидка от стоимости прайса-листа: ${discountPercentage}%</div>
    </div>

    <div class="section">
        <div class="details">3. Право на подарки:</div>
        <div class="perks-list">
            <p>за приглашение подруг - 1 зона за каждую подругу;</p>
            <p>отзывы на Яндекс.Карты и 2ГИС - 1 зона за каждый честный отзыв;</p>
            <p>за рекомендации в соцсетях - 1 зона за упоминание в соцсетях.</p>
        </div>
    </div>

    <div class="section">
        <div class="details">4. ${packagePerks.massage}</div>
    </div>

    <div class="section">
        <div class="details">5. ${packagePerks.card}, дающая скидку навсегда в размере ${packagePerks.cardDiscount}% на</div>
        <div class="perks-list">
            <p>поддерживающие процедуры выбранных зон во всех студиях сети «Виви»</p>
        </div>
    </div>

    <div class="section">
        <div class="details">6. Количество дополнительных подарочных сеансов: ${packagePerks.giftSessions}</div>
    </div>

    <div class="section">
        <div class="details">7. Возможность заморозки карты: ${packagePerks.freezeOption}</div>
    </div>

    <div class="section">
        <div class="details">8. Начисление на бонусный счет: ${packagePerks.bonusPercent}% от стоимости абонемента</div>
    </div>

    <div class="cost-section">
        <div class="cost-item">Стоимость абонемента: ${this.formatAmount(offer.finalCost)} руб.</div>
        <div class="cost-item">Первоначальный взнос: ${this.formatAmount(offer.downPayment)} руб.</div>
        ${offer.installmentMonths && offer.installmentMonths > 1 ? `
            <div class="cost-item">Размер платежа: ${this.formatAmount(offer.monthlyPayment || 0)} руб.</div>
            <div class="cost-item">Количество платежей: ${offer.installmentMonths}</div>
        ` : ''}
    </div>

    <div class="footer-note">
        Условия действуют только при своевременной оплате. При просрочке платежа более чем на 5 дней стоимость посещения пересчитывается по стандартному прайсу и дополнительные условия (скидки, пакеты, бонусы и привилегии) аннулируются.
    </div>
</body>
</html>
    `;
  }

  private getPackageName(packageType: string): string {
    switch (packageType) {
      case 'vip': return 'VIP (максимальная скидка)';
      case 'standard': return 'Стандарт (средняя скидка)';
      case 'economy': return 'Эконом (базовая скидка)';
      default: return packageType;
    }
  }

  private formatAmount(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ru-RU').format(num);
  }
}

export const pdfGenerator = new PDFGenerator();