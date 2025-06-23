import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { calculatePackagePricing } from "@/lib/calculator";

interface Service {
  id: number;
  yclientsId: number;
  title: string;
  priceMin: string;
}

interface SelectedService extends Service {
  quantity: number;
}

interface FreeZone {
  serviceId: number;
  title: string;
  pricePerProcedure: number;
  quantity: number;
}

interface Calculation {
  baseCost: number;
  packages: {
    vip: PackageData;
    standard: PackageData;
    economy: PackageData;
  };
  totalProcedures: number;
  freeZonesValue: number;
}

interface PackageData {
  isAvailable: boolean;
  unavailableReason: string;
  finalCost: number;
  totalSavings: number;
  monthlyPayment: number;
  appliedDiscounts: Array<{ type: string; amount: number }>;
}

interface Package {
  id: number;
  type: string;
  name: string;
  discount: string;
  minCost: string;
  minDownPaymentPercent: string;
  requiresFullPayment: boolean;
  giftSessions: number;
}

export function useCalculator() {
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [procedureCount, setProcedureCount] = useState(10);
  const [downPayment, setDownPayment] = useState(0);
  const [installmentMonths, setInstallmentMonths] = useState(2);
  const [usedCertificate, setUsedCertificate] = useState(false);
  const [freeZones, setFreeZones] = useState<FreeZone[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [calculation, setCalculation] = useState<Calculation | null>(null);
  
  // Debounce refs
  const downPaymentTimeoutRef = useRef<NodeJS.Timeout>();
  const packageSelectionTimeoutRef = useRef<NodeJS.Timeout>();
  const isUserDragging = useRef(false);

  // Get services and packages from backend
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['/api/services'],
    enabled: true
  });

  const { data: packages = [] } = useQuery<Package[]>({
    queryKey: ['/api/packages'],
    enabled: true,
    staleTime: 0,
    gcTime: 0  // Updated from cacheTime to gcTime
  });

  // Get calculator settings from config
  const { data: calculatorSettings } = useQuery({
    queryKey: ['/api/config/calculator-settings'],
    queryFn: async () => {
      const configs = await Promise.all([
        fetch('/api/config/minimum_down_payment', { credentials: 'include' }),
        fetch('/api/config/bulk_discount_threshold', { credentials: 'include' }),
        fetch('/api/config/bulk_discount_percentage', { credentials: 'include' }),
        fetch('/api/config/installment_months_options', { credentials: 'include' }),
        fetch('/api/config/certificate_discount_percentage', { credentials: 'include' }),
        fetch('/api/config/certificate_min_course_amount', { credentials: 'include' })
      ]);

      const [minPayment, bulkThreshold, bulkPercentage, monthsOptions, certificateAmount, certificateMinAmount] = await Promise.all(
        configs.map(response => response.ok ? response.json() : null)
      );

      return {
        minimumDownPayment: minPayment || 5000,
        bulkDiscountThreshold: bulkThreshold || 15,
        bulkDiscountPercentage: bulkPercentage || 0.05,
        installmentMonthsOptions: monthsOptions || [2, 3, 4, 5, 6],
        certificateDiscountAmount: certificateAmount || 3000,
        certificateMinCourseAmount: certificateMinAmount || 25000
      };
    },
    enabled: true,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  // Calculate total procedures (for display only, not for discount calculation)
  const totalProcedures = useMemo(() => {
    return selectedServices.reduce((sum, service) => sum + service.quantity, 0) * procedureCount;
  }, [selectedServices, procedureCount]);

  // Frontend calculation function for instant response
  const calculateInstantly = useMemo(
    () => (
      servicesData: SelectedService[],
      procedures: number,
      payment: number,
      months: number,
      certificate: boolean,
      zones: FreeZone[]
    ) => {
      if (servicesData.length === 0) {
        setCalculation(null);
        return;
      }

      // Create service map for quick lookup
      const serviceMap = new Map<number, Service>(services.map((s: Service) => [s.yclientsId, s]));
      
      // Calculate base cost from selected services only
      let baseCost = 0;
      for (const selectedService of servicesData) {
        const service = serviceMap.get(selectedService.yclientsId);
        if (service) {
          baseCost += parseFloat(service.priceMin) * selectedService.quantity * procedures;
        }
      }


      // Convert packages array to config object  
      const packageConfig = packages.reduce((acc: any, pkg: Package) => {
        acc[pkg.type] = {
          discount: parseFloat(pkg.discount.toString()),
          minCost: parseFloat(pkg.minCost.toString()),
          minDownPaymentPercent: parseFloat(pkg.minDownPaymentPercent.toString()),
          requiresFullPayment: pkg.requiresFullPayment
        };
        return acc;
      }, {});
      


      // Prepare calculation parameters
      const calculationParams = {
        services: servicesData.map(service => ({
          id: service.yclientsId,
          quantity: service.quantity * procedures
        })),
        packageType: 'economy',
        downPayment: payment,
        installmentMonths: months,
        usedCertificate: certificate,
        freeZones: zones,
        serviceMap,
        packageConfig,
        procedureCount: procedures // ADD this parameter!
      };

      // Use the centralized calculation function with calculator settings

      
      const result = calculatePackagePricing(baseCost, calculationParams, calculatorSettings);
      

      setCalculation(result);
    },
    [services, packages, calculatorSettings]
  );

  // Debounced calculation trigger
  const debouncedCalculation = useCallback(() => {
    if (downPaymentTimeoutRef.current) {
      clearTimeout(downPaymentTimeoutRef.current);
    }
    
    downPaymentTimeoutRef.current = setTimeout(() => {
      calculateInstantly(
        selectedServices,
        procedureCount,
        downPayment,
        installmentMonths,
        usedCertificate,
        freeZones
      );
    }, isUserDragging.current ? 100 : 0); // Shorter debounce when dragging
  }, [selectedServices, procedureCount, downPayment, installmentMonths, usedCertificate, freeZones, calculateInstantly]);

  // Initialize default installment months based on settings - set to minimum available
  useEffect(() => {
    if (calculatorSettings?.installmentMonthsOptions?.length > 0) {
      const minMonths = Math.min(...calculatorSettings.installmentMonthsOptions);

      setInstallmentMonths(minMonths);
    }
  }, [calculatorSettings]);

  // Trigger calculation when dependencies change
  useEffect(() => {
    debouncedCalculation();
  }, [debouncedCalculation]);



  return {
    selectedServices,
    procedureCount,
    downPayment,
    installmentMonths,
    usedCertificate,
    freeZones,
    selectedPackage,
    calculation,
    packages,
    totalProcedures,
    calculatorSettings,
    setSelectedServices,
    setProcedureCount,
    setDownPayment: useCallback((value: number) => {
      isUserDragging.current = true;
      setDownPayment(value);
      // Reset dragging flag after a delay
      setTimeout(() => {
        isUserDragging.current = false;
      }, 500);
    }, []),
    setInstallmentMonths,
    setUsedCertificate,
    setFreeZones,
    setSelectedPackage: useCallback((packageType: string | null) => {
      setSelectedPackage(packageType);
      
      // Adjust down payment based on selected package requirements from DB
      if (packageType && calculation?.packages && packages.length > 0) {
        const packageData = calculation.packages[packageType as keyof typeof calculation.packages];
        const packageConfig = packages.find(p => p.type === packageType);
        
        if (packageData?.isAvailable && packageConfig) {
          let newDownPayment = downPayment;
          
          if (packageConfig.requiresFullPayment) {
            // Package requires full payment (like VIP)
            newDownPayment = packageData.finalCost;
          } else {
            // Calculate minimum down payment as percentage of package cost
            const minPaymentPercent = parseFloat(packageConfig.minDownPaymentPercent.toString());
            const minPayment = packageData.finalCost * minPaymentPercent;
            const maxPayment = packageData.finalCost; // Can't exceed package cost
            
            // Constrain to valid range
            if (downPayment < minPayment) {
              newDownPayment = Math.round(minPayment);
            } else if (downPayment > maxPayment) {
              newDownPayment = Math.round(maxPayment);
            }
          }
          
          if (newDownPayment !== downPayment) {
            setDownPayment(newDownPayment);
          }
        }
      }
    }, [calculation, downPayment, packages, calculatorSettings]),
    isLoading: !calculation && selectedServices.length > 0,
    getMaxDownPayment: () => {
      if (!selectedPackage || !calculation?.packages || packages.length === 0) return 50000;
      
      const packageData = calculation.packages[selectedPackage as keyof typeof calculation.packages];
      const packageConfig = packages.find(p => p.type === selectedPackage);
      
      if (!packageData?.isAvailable || !packageConfig) return 50000;
      
      // If package requires full payment, max = full cost
      if (packageConfig.requiresFullPayment) {
        return packageData.finalCost;
      }
      
      // Otherwise, max is full cost (user can pay up to 100%)
      return packageData.finalCost;
    },
    getMinDownPayment: () => {
      if (!selectedPackage || !calculation?.packages || packages.length === 0) return 5000;
      
      const packageData = calculation.packages[selectedPackage as keyof typeof calculation.packages];
      const packageConfig = packages.find(p => p.type === selectedPackage);
      
      if (!packageData?.isAvailable || !packageConfig) return 5000;
      
      // If package requires full payment, min = max = full cost
      if (packageConfig.requiresFullPayment) {
        return packageData.finalCost;
      }
      
      // Calculate minimum down payment as percentage of package cost
      const minPaymentPercent = parseFloat(packageConfig.minDownPaymentPercent.toString());
      const percentageBasedMin = Math.round(packageData.finalCost * minPaymentPercent);
      
      // Use the higher of percentage-based minimum or global minimum
      const globalMin = calculatorSettings?.minimumDownPayment || 5000;
      return Math.max(percentageBasedMin, globalMin);
    }
  };
}