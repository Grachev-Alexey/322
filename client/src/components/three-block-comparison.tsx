import { Crown, Star, Leaf, Gift } from "lucide-react";
import * as Icons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface Package {
  id: number;
  type: string;
  name: string;
  discount: number;
  giftSessions: number;
  bonusAccountPercent: number;
}

interface PackagePerkValue {
  packageType: string;
  perkId: number;
  valueType: string;
  booleanValue?: boolean;
  textValue?: string;
  numberValue?: number;
  displayValue: string;
  tooltip?: string;
  perk: {
    id: number;
    name: string;
    icon: string;
    iconColor?: string;
    displayOrder?: number;
  };
}

interface SelectedService {
  serviceId: number;
  title: string;
  pricePerProcedure: number;
  quantity: number;
}

interface ThreeBlockComparisonProps {
  calculation: any;
  selectedPackage: string | null;
  onPackageSelect: (packageType: string) => void;
  packages: Package[];
  downPayment: number;
  installmentMonths: number;
  procedureCount: number;
  packagePerkValues?: PackagePerkValue[];
  usedCertificate: boolean;
  freeZones?: Array<{
    serviceId: number;
    title: string;
    pricePerProcedure: number;
    quantity: number;
  }>;
  selectedServices?: SelectedService[];
}

export default function ThreeBlockComparison({
  calculation,
  selectedPackage,
  onPackageSelect,
  packages,
  downPayment,
  installmentMonths,
  procedureCount,
  packagePerkValues = [],
  usedCertificate = false,
  freeZones = [],
  selectedServices = [],
}: ThreeBlockComparisonProps) {
  const packageTypes = ["vip", "standard", "economy"];
  const hasValidCalculation = calculation && calculation.baseCost > 0;

  const getPackageData = (packageType: string) => {
    if (!hasValidCalculation) return null;
    return (calculation.packages as any)[packageType] || null;
  };

  const getPackageIcon = (packageType: string) => {
    switch (packageType) {
      case "vip": return Crown;
      case "standard": return Star;
      case "economy": return Leaf;
      default: return Star;
    }
  };

  const getPackageName = (packageType: string) => {
    switch (packageType) {
      case "vip": return "VIP";
      case "standard": return "Стандарт";
      case "economy": return "Эконом";
      default: return "Стандарт";
    }
  };

  const getPackageColor = (packageType: string) => {
    switch (packageType) {
      case "vip": return "from-yellow-400 to-yellow-600";
      case "standard": return "from-blue-400 to-blue-600";
      case "economy": return "from-green-400 to-green-600";
      default: return "from-blue-400 to-blue-600";
    }
  };

  // Get unique perks for display
  const uniquePerks = Array.from(
    new Map(packagePerkValues.map((pv) => [pv.perk.id, pv.perk])).values(),
  ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const calculateGiftCost = (packageType: string) => {
    if (!selectedServices.length || !hasValidCalculation) return 0;
    
    const packageData = packages.find(p => p.type === packageType);
    const giftSessions = packageData?.giftSessions || 0;
    
    if (giftSessions === 0) return 0;
    
    const totalBaseCost = selectedServices.reduce((sum, service) => {
      return sum + (service.pricePerProcedure * service.quantity);
    }, 0);
    
    return totalBaseCost * giftSessions;
  };

  const calculateFreeCost = (packageType: string) => {
    if (!freeZones.length) return 0;
    
    return freeZones.reduce((sum, zone) => {
      return sum + (zone.pricePerProcedure * zone.quantity);
    }, 0);
  };

  const calculateBonusAmount = (packageType: string) => {
    const packageData = packages.find(p => p.type === packageType);
    const packageCalcData = getPackageData(packageType);
    
    if (!packageData || !packageCalcData) return 0;
    
    const bonusPercent = packageData.bonusAccountPercent || 0;
    return packageCalcData.finalCost * (bonusPercent / 100);
  };

  if (!hasValidCalculation) {
    return (
      <div className="text-center p-8 text-gray-500">
        Выберите услуги для просмотра сравнения пакетов
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-4">
      {/* Преимущества */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-blue-200 dark:border-gray-700 overflow-hidden">
        <div className="absolute -top-0.5 left-6 bg-white dark:bg-gray-800 px-4 py-1 rounded-b-lg border-l-2 border-r-2 border-b-2 border-blue-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-gray-700 dark:text-gray-300">Преимущества</span>
          </div>
        </div>
        
        <div className="pt-8 p-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="font-medium text-gray-600 dark:text-gray-400"></div>
            {packageTypes.map((packageType) => {
              const Icon = getPackageIcon(packageType);
              const isSelected = selectedPackage === packageType;
              
              return (
                <div
                  key={packageType}
                  className={`text-center cursor-pointer transition-all duration-200 rounded-lg p-3 ${
                    isSelected
                      ? "bg-white dark:bg-gray-800 shadow-lg transform scale-105 border-2 border-blue-300"
                      : "hover:bg-white/50 dark:hover:bg-gray-800/50"
                  }`}
                  onClick={() => onPackageSelect(packageType)}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r ${getPackageColor(packageType)} mb-2`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="font-bold text-gray-700 dark:text-gray-300">
                    {getPackageName(packageType)}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 space-y-3">
            {uniquePerks.map((perk) => {
              const IconComponent = (Icons as any)[perk.icon] || Star;
              
              return (
                <div key={perk.id} className="grid grid-cols-4 gap-4 py-2 border-b border-blue-100 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <IconComponent className="w-4 h-4" style={{ color: perk.iconColor }} />
                    {perk.name}
                  </div>
                  {packageTypes.map((packageType) => {
                    const perkValue = packagePerkValues.find(
                      (pv) => pv.packageType === packageType && pv.perkId === perk.id
                    );
                    
                    return (
                      <div key={packageType} className="text-center">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {perkValue?.displayValue || "-"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Стоимость */}
      <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-green-200 dark:border-gray-700 overflow-hidden">
        <div className="absolute -top-0.5 left-6 bg-white dark:bg-gray-800 px-4 py-1 rounded-b-lg border-l-2 border-r-2 border-b-2 border-green-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-gray-700 dark:text-gray-300">Стоимость</span>
          </div>
        </div>
        
        <div className="pt-8 p-6 space-y-4">
          {/* Первоначальная стоимость */}
          <div className="grid grid-cols-4 gap-4 py-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Первоначальная</div>
            {packageTypes.map((packageType) => (
              <div key={packageType} className="text-center">
                <span className="text-sm font-semibold text-red-500 line-through">
                  {formatPrice(calculation.baseCost)}
                </span>
              </div>
            ))}
          </div>

          {/* Скидка */}
          <div className="grid grid-cols-4 gap-4 py-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Скидка</div>
            {packageTypes.map((packageType) => {
              const packageData = getPackageData(packageType);
              const discount = packageData ? calculation.baseCost - packageData.finalCost : 0;
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-sm font-semibold text-green-600">
                    -{formatPrice(discount)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Сертификат */}
          {usedCertificate && (
            <div className="grid grid-cols-4 gap-4 py-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Сертификат</div>
              {packageTypes.map((packageType) => (
                <div key={packageType} className="text-center">
                  <span className="text-sm font-semibold text-green-600">-3 000 ₽</span>
                </div>
              ))}
            </div>
          )}

          {/* Итого стоимость курса */}
          <div className="grid grid-cols-4 gap-4 py-3 border-t-2 border-green-200 dark:border-gray-600">
            <div className="text-base font-bold text-gray-700 dark:text-gray-300">Итого стоимость курса:</div>
            {packageTypes.map((packageType) => {
              const packageData = getPackageData(packageType);
              const finalCost = packageData?.finalCost || 0;
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-lg font-bold text-pink-600">
                    {formatPrice(finalCost)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Первый взнос */}
          <div className="grid grid-cols-4 gap-4 py-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">Первый взнос:</div>
            {packageTypes.map((packageType) => {
              const packageData = getPackageData(packageType);
              const monthlyPayment = packageData?.monthlyPayment || 0;
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatPrice(downPayment)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Платеж в месяц */}
          {installmentMonths > 0 && (
            <div className="grid grid-cols-4 gap-4 py-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">Платеж в месяц</div>
              {packageTypes.map((packageType) => {
                const packageData = getPackageData(packageType);
                const monthlyPayment = packageData?.monthlyPayment || 0;
                
                return (
                  <div key={packageType} className="text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatPrice(monthlyPayment)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Подарки */}
      <div className="relative bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-pink-200 dark:border-gray-700 overflow-hidden">
        <div className="absolute -top-0.5 left-6 bg-white dark:bg-gray-800 px-4 py-1 rounded-b-lg border-l-2 border-r-2 border-b-2 border-pink-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-pink-500" />
            <span className="font-bold text-gray-700 dark:text-gray-300">Подарки</span>
          </div>
        </div>
        
        <div className="pt-8 p-6 space-y-4">
          {/* Стоимость подарочных процедур */}
          <div className="grid grid-cols-4 gap-4 py-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Стоимость подарочных процедур</div>
            {packageTypes.map((packageType) => {
              const giftCost = calculateGiftCost(packageType);
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {giftCost > 0 ? formatPrice(giftCost) : "-"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Стоимость бесплатных зон */}
          <div className="grid grid-cols-4 gap-4 py-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Стоимость бесплатных зон</div>
            {packageTypes.map((packageType) => {
              const freeCost = calculateFreeCost(packageType);
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {freeCost > 0 ? formatPrice(freeCost) : "800 ₽"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Бонусный счет */}
          <div className="grid grid-cols-4 gap-4 py-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Бонусный счет</div>
            {packageTypes.map((packageType) => {
              const bonusAmount = calculateBonusAmount(packageType);
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {bonusAmount > 0 ? formatPrice(bonusAmount) : "-"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Итого стоимость подарков */}
          <div className="grid grid-cols-4 gap-4 py-3 border-t-2 border-pink-200 dark:border-gray-600">
            <div className="text-base font-bold text-gray-700 dark:text-gray-300">Итого стоимость подарков:</div>
            {packageTypes.map((packageType) => {
              const giftCost = calculateGiftCost(packageType);
              const freeCost = calculateFreeCost(packageType) || 800; // Default 800 if no free zones
              const bonusAmount = calculateBonusAmount(packageType);
              const totalGifts = giftCost + freeCost + bonusAmount;
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-lg font-bold text-pink-600">
                    {formatPrice(totalGifts)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}