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
  procedureCount?: number;
  freeZonesValue?: number;
  totalProcedures?: number;
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
  
  // Use package configuration from database - no defaults
  const packages = packageConfig;
  const totalProcedures = params.totalProcedures || params.services.reduce((sum, s) => sum + s.quantity, 0);
  
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
    

    


    // Calculate gift session value based on package type
    // Gift sessions are calculated using the original cost per procedure (before discount)
    const packageDiscount = baseCost * discount;
    const originalCostPerProcedure = totalProcedures > 0 ? baseCost / totalProcedures : 0;
    
    // Get gift sessions from package configuration
    const giftSessions = packageData.giftSessions || 0;
    const giftSessionValue = originalCostPerProcedure * giftSessions;

    // DEBUG LOGGING
    if (packageType === 'vip') {
      console.log('💰 Calculator DEBUG:', {
        packageType,
        baseCost,
        totalProcedures,
        originalCostPerProcedure,
        giftSessions,
        giftSessionValue,
        packageData: packageData
      });
    }

    // Calculate free zones value from params
    const freeZonesValue = params.freeZonesValue || 0;
    
    // Total savings - gift sessions only for display, not actual cost reduction
    const actualDiscounts = packageDiscount + certificateDiscount + additionalDiscount;
    const totalSavings = actualDiscounts + giftSessionValue + freeZonesValue; // Include free zones in display
    const finalCost = baseCost - actualDiscounts; // Actual cost without gift sessions (free zones already subtracted from baseCost)

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
        ...(freeZonesValue > 0 ? [{ type: 'free_zones', amount: freeZonesValue }] : []),
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