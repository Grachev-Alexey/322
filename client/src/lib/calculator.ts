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
  params: CalculationParams,
  calculatorSettings?: any
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
    
    // Calculate all discounts even for unavailable packages for display purposes
    let discount = packageData.discount;
    
    // Apply dynamic discount for economy package
    if (packageType === 'economy' && baseCost >= packageData.dynamicThreshold) {
      discount = Math.max(discount, packageData.dynamicDiscount);
    }

    // Calculate certificate discount using configurable fixed amount
    const certificateDiscountAmount = calculatorSettings?.certificateDiscountAmount || 3000;
    const certificateMinAmount = calculatorSettings?.certificateMinCourseAmount || 25000;
    const certificateDiscount = params.usedCertificate && baseCost >= certificateMinAmount ? certificateDiscountAmount : 0;
    

    
    // Calculate bulk discount using configurable threshold and percentage
    const bulkThreshold = calculatorSettings?.bulkDiscountThreshold || 15;
    const bulkDiscountPercent = calculatorSettings?.bulkDiscountPercentage || 0.025;
    // ONLY use procedureCount from slider, not services or zones count
    const sliderProcedureCount = params.procedureCount || 1;
    const qualifiesForBulkDiscount = sliderProcedureCount >= bulkThreshold;
    const additionalDiscount = qualifiesForBulkDiscount ? baseCost * bulkDiscountPercent : 0;
    
    console.log(`=== BULK DISCOUNT DEBUG ===`);
    console.log(`Slider procedure count: ${sliderProcedureCount}`);
    console.log(`Bulk threshold: ${bulkThreshold}`);
    console.log(`Bulk discount percent: ${bulkDiscountPercent}`);
    console.log(`Qualifies for bulk discount: ${qualifiesForBulkDiscount}`);
    console.log(`Additional discount amount: ${additionalDiscount}`);
    


    // Calculate gift session value based on package type
    // Gift sessions are full procedure sessions, not individual visits
    let giftSessionValue = 0;
    if (packageType === 'vip') {
      giftSessionValue = baseCost / totalProcedures * 3; // 3 full sessions for VIP
    } else if (packageType === 'standard') {
      giftSessionValue = baseCost / totalProcedures * 1; // 1 full session for Standard
    }

    // Total savings - gift sessions only for display, not actual cost reduction
    const packageDiscount = baseCost * discount;
    const actualDiscounts = packageDiscount + certificateDiscount + additionalDiscount;
    const totalSavings = actualDiscounts + giftSessionValue; // Total for display
    const finalCost = baseCost - actualDiscounts; // Actual cost without gift sessions

    // All packages are available for selection - payment constraints will be applied when selected
    const minDownPayment = Math.max(
      packageData.minDownPayment || 0,
      finalCost * packageData.minDownPaymentPercent
    );

    // Calculate monthly payment
    const remainingAmount = finalCost - params.downPayment;
    const monthlyPayment = params.installmentMonths > 0 && !packageData.requiresFullPayment ? remainingAmount / params.installmentMonths : 0;

    // Check if package meets minimum cost requirement
    const isAvailable = baseCost >= packageData.minCost;
    const unavailableReason = !isAvailable ? `Минимальная стоимость курса: ${packageData.minCost.toLocaleString()} ₽` : '';

    results[packageType] = {
      isAvailable,
      unavailableReason,
      finalCost,
      totalSavings,
      monthlyPayment: isAvailable ? monthlyPayment : 0,
      appliedDiscounts: [
        { type: 'package', amount: packageDiscount },
        ...(qualifiesForBulkDiscount && additionalDiscount > 0 ? [{ type: 'bulk', amount: additionalDiscount }] : []),
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