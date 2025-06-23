import { useState, useEffect, useMemo } from "react";
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
  const [installmentMonths, setInstallmentMonths] = useState(4);
  const [usedCertificate, setUsedCertificate] = useState(false);
  const [freeZones, setFreeZones] = useState<FreeZone[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [calculation, setCalculation] = useState<Calculation | null>(null);

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
      
      console.log('=== CALCULATION DEBUG ===');
      console.log('Selected services:', servicesData);
      console.log('Base cost:', baseCost);
      console.log('Procedures count (slider):', procedures);
      console.log('Total service instances:', servicesData.reduce((sum, s) => sum + s.quantity, 0));

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
      
      console.log('Package config:', packageConfig);

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
        packageConfig
      };

      // Calculate pricing for all packages
      const result = {
        baseCost,
        packages: {} as any,
        totalProcedures: servicesData.reduce((sum, s) => sum + s.quantity, 0) * procedures, // For display only
        freeZonesValue: zones.reduce((sum: number, zone: any) => sum + (zone.quantity * zone.pricePerProcedure), 0)
      };

      ['vip', 'standard', 'economy'].forEach(packageType => {
        const packageData = packages.find((p: Package) => p.type === packageType);
        if (!packageData) {
          result.packages[packageType] = {
            isAvailable: false,
            unavailableReason: "Пакет не найден",
            finalCost: 0,
            totalSavings: 0,
            monthlyPayment: 0,
            appliedDiscounts: []
          };
          return;
        }

        const minCost = parseFloat(packageData.minCost.toString());
        const discount = parseFloat(packageData.discount.toString());
        
        // Check availability
        const isAvailable = baseCost >= minCost;
        if (!isAvailable) {
          result.packages[packageType] = {
            isAvailable: false,
            unavailableReason: `Минимальная стоимость ${minCost}₽`,
            finalCost: 0,
            totalSavings: 0,
            monthlyPayment: 0,
            appliedDiscounts: []
          };
          return;
        }

        // Calculate discounts
        const packageDiscount = baseCost * discount;
        // 15+ procedures discount applies only based on procedure COUNT slider, not services count
        const procedureCountForDiscount = procedures; // This is the slider value
        const fifteenPlusProceduresDiscount = procedureCountForDiscount >= 15 ? baseCost * 0.025 : 0;
        const totalDiscount = packageDiscount + fifteenPlusProceduresDiscount;
        
        // Final cost
        const finalCost = Math.max(baseCost - totalDiscount, minCost);
        const monthlyPayment = (finalCost - payment) / months;
        
        const appliedDiscounts = [
          { type: "Скидка пакета", amount: packageDiscount }
        ];
        
        if (fifteenPlusProceduresDiscount > 0) {
          appliedDiscounts.push({ type: "15+ посещений", amount: fifteenPlusProceduresDiscount });
        }

        result.packages[packageType] = {
          isAvailable: true,
          unavailableReason: "",
          finalCost,
          totalSavings: totalDiscount,
          monthlyPayment: Math.max(monthlyPayment, 0),
          appliedDiscounts
        };
      });

      console.log('Final calculation result:', result);
      setCalculation(result);
    },
    [services, packages]
  );

  // Trigger calculation when dependencies change
  useEffect(() => {
    calculateInstantly(
      selectedServices,
      procedureCount,
      downPayment,
      installmentMonths,
      usedCertificate,
      freeZones
    );
  }, [selectedServices, procedureCount, downPayment, installmentMonths, usedCertificate, freeZones, calculateInstantly]);

  // Auto-select package based on down payment amount and set default VIP down payment
  useEffect(() => {
    if (calculation && calculation.packages) {
      const { vip, standard, economy } = calculation.packages;
      
      // Set default down payment to VIP cost on first calculation
      if (downPayment === 0 && vip?.finalCost) {
        setDownPayment(vip.finalCost);
        return;
      }
      
      // Auto-select package based on down payment amount
      let newSelectedPackage = null;
      
      if (downPayment >= (vip?.finalCost || Infinity) * 0.9) {
        // If down payment is 90%+ of VIP cost, select VIP
        newSelectedPackage = vip?.isAvailable ? 'vip' : null;
      } else if (downPayment >= (standard?.finalCost || Infinity) * 0.5) {
        // If down payment is 50%+ of Standard cost, select Standard
        newSelectedPackage = standard?.isAvailable ? 'standard' : null;
      } else {
        // Otherwise select Economy if available
        newSelectedPackage = economy?.isAvailable ? 'economy' : null;
      }
      
      // Fallback to first available package
      if (!newSelectedPackage) {
        const availablePackages = Object.entries(calculation.packages)
          .filter(([_, data]) => data.isAvailable)
          .sort((a, b) => {
            const order = { vip: 0, standard: 1, economy: 2 };
            return order[a[0] as keyof typeof order] - order[b[0] as keyof typeof order];
          });

        if (availablePackages.length > 0) {
          newSelectedPackage = availablePackages[0][0];
        }
      }
      
      if (newSelectedPackage !== selectedPackage) {
        setSelectedPackage(newSelectedPackage);
      }
    }
  }, [calculation, downPayment]);

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
    setSelectedServices,
    setProcedureCount,
    setDownPayment,
    setInstallmentMonths,
    setUsedCertificate,
    setFreeZones,
    setSelectedPackage,
    isLoading: !calculation && selectedServices.length > 0,
    getMaxDownPayment: () => calculation?.packages.vip?.finalCost || 50000
  };
}