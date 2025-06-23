// Frontend calculation logic moved from backend for better performance

export interface CalculationService {
  id: number;
  quantity: number;
}

export interface CalculationParams {
  services: CalculationService[];
  packageType: string;
  downPayment: number;
  installmentMonths: number;
  usedCertificate: boolean;
  freeZones: any[];
  serviceMap: Map<number, any>;
  packageConfig: any;
}

export interface PackageData {
  isAvailable: boolean;
  unavailableReason: string;
  finalCost: number;
  totalSavings: number;
  monthlyPayment: number;
  appliedDiscounts: Array<{ type: string; amount: number }>;
}

export interface CalculationResult {
  baseCost: number;
  packages: {
    vip: PackageData;
    standard: PackageData;
    economy: PackageData;
  };
  totalProcedures: number;
  freeZonesValue: number;
}

export function calculatePackagePricing(
  baseCost: number,
  params: CalculationParams
): CalculationResult {
  const { packageConfig, freeZones } = params;
  
  // Default package configuration if not provided
  const defaultPackages = {
    vip: { 
      discount: 0.30, 
      minCost: 25000, 
      requiresFullPayment: true,
      minDownPaymentPercent: 1.0
    },
    standard: { 
      discount: 0.25, 
      minDownPayment: 15000, 
      minDownPaymentPercent: 0.50,
      minCost: 15000
    },
    economy: { 
      discount: 0.20, 
      minDownPayment: 5000, 
      dynamicDiscount: 0.30, 
      dynamicThreshold: 10000,
      minDownPaymentPercent: 0.30,
      minCost: 5000
    }
  };

  const packages = packageConfig || defaultPackages;
  const totalProcedures = params.services.reduce((sum, s) => sum + s.quantity, 0);
  
  const results: any = {};
  
  // Calculate for each package type
  for (const [packageType, config] of Object.entries(packages)) {
    const packageData = config as any;
    
    // Calculate all values first, then check availability
    // Calculate discount
    let discount = packageData.discount;
    
    // Apply dynamic discount for economy package
    if (packageType === 'economy' && baseCost >= packageData.dynamicThreshold) {
      discount = Math.max(discount, packageData.dynamicDiscount);
    }

    // Calculate certificate discount (max 3000 RUB)
    const certificateDiscount = params.usedCertificate ? Math.min(baseCost * 0.05, 3000) : 0;
    
    // Calculate bulk discount (2.5% for 15+ procedures) - use service count for this
    const serviceCount = params.services.reduce((sum, s) => sum + s.quantity, 0);
    const additionalDiscount = serviceCount >= 15 ? baseCost * 0.025 : 0;

    // Calculate gift session value based on package type
    let giftSessionValue = 0;
    if (packageType === 'vip') {
      giftSessionValue = baseCost / totalProcedures * 3; // 3 full sessions for VIP
    } else if (packageType === 'standard') {
      giftSessionValue = baseCost / totalProcedures * 1; // 1 full session for Standard
    }

    // Total savings
    const packageDiscount = baseCost * discount;
    const totalSavings = packageDiscount + certificateDiscount + additionalDiscount + giftSessionValue;
    const finalCost = baseCost - totalSavings;

    // Check if package meets minimum cost requirement
    if (baseCost < packageData.minCost) {
      results[packageType] = {
        isAvailable: false,
        unavailableReason: `Минимальная стоимость курса: ${packageData.minCost.toLocaleString()} ₽`,
        finalCost,
        totalSavings,
        monthlyPayment: 0,
        appliedDiscounts: [
          { type: 'package', amount: packageDiscount },
          ...(additionalDiscount > 0 ? [{ type: 'bulk', amount: additionalDiscount }] : []),
          ...(certificateDiscount > 0 ? [{ type: 'certificate', amount: certificateDiscount }] : []),
          ...(giftSessionValue > 0 ? [{ type: 'gift_sessions', amount: giftSessionValue }] : [])
        ]
      };
      continue;
    }



    // Check down payment requirements
    const minDownPayment = Math.max(
      packageData.minDownPayment || 0,
      finalCost * packageData.minDownPaymentPercent
    );

    // For VIP package, full payment is required
    const requiredDownPayment = packageData.requiresFullPayment ? finalCost : minDownPayment;

    // Calculate monthly payment
    const remainingAmount = finalCost - params.downPayment;
    const monthlyPayment = params.installmentMonths > 0 ? remainingAmount / params.installmentMonths : 0;

    // Check if down payment is sufficient
    if (params.downPayment < requiredDownPayment) {
      results[packageType] = {
        isAvailable: false,
        unavailableReason: packageData.requiresFullPayment 
          ? 'Требуется полная оплата'
          : `Минимальный первоначальный взнос: ${requiredDownPayment.toLocaleString()} ₽`,
        finalCost,
        totalSavings,
        monthlyPayment: 0,
        appliedDiscounts: []
      };
      continue;
    }

    results[packageType] = {
      isAvailable: true,
      unavailableReason: '',
      finalCost,
      totalSavings,
      monthlyPayment,
      appliedDiscounts: [
        { type: 'package', amount: packageDiscount },
        ...(additionalDiscount > 0 ? [{ type: 'bulk', amount: additionalDiscount }] : []),
        ...(certificateDiscount > 0 ? [{ type: 'certificate', amount: certificateDiscount }] : []),
        ...(giftSessionValue > 0 ? [{ type: 'gift_sessions', amount: giftSessionValue }] : [])
      ]
    };
  }

  return {
    baseCost,
    packages: results,
    totalProcedures,
    freeZonesValue: freeZones.reduce((sum: number, zone: any) => sum + (zone.pricePerProcedure * zone.quantity), 0)
  };
}