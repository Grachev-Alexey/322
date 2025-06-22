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

  // Calculate total procedures
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
      
      // Calculate base cost
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
          discount: parseFloat(pkg.discount),
          minCost: parseFloat(pkg.minCost),
          minDownPaymentPercent: parseFloat(pkg.minDownPaymentPercent),
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
        packageConfig
      };

      // Calculate using frontend logic
      const result = calculatePackagePricing(baseCost, calculationParams);
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

  // Auto-select VIP package by default, set down payment to VIP cost
  useEffect(() => {
    if (calculation) {
      const vipCost = calculation.packages.vip?.finalCost;
      if (vipCost && downPayment === 15000) {
        setDownPayment(Math.min(vipCost, 25000)); // Set to VIP cost but cap at 25k
      }
      
      if (!selectedPackage) {
        // Auto-select the first available package
        const availablePackages = Object.entries(calculation.packages)
          .filter(([_, data]) => data.isAvailable)
          .sort((a, b) => {
            // Prefer standard > vip > economy
            const order = { standard: 0, vip: 1, economy: 2 };
            return order[a[0] as keyof typeof order] - order[b[0] as keyof typeof order];
          });

        if (availablePackages.length > 0) {
          setSelectedPackage(availablePackages[0][0]);
        }
      }
    }
  }, [calculation, selectedPackage]);

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
    isLoading: !calculation && selectedServices.length > 0
  };
}