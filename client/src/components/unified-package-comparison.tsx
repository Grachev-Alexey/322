import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Star, Leaf, Sparkles } from "lucide-react";
import * as Icons from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { usePackagePerks } from "@/hooks/use-package-perks";

interface PackageData {
  isAvailable: boolean;
  unavailableReason: string;
  finalCost: number;
  totalSavings: number;
  monthlyPayment: number;
  appliedDiscounts: Array<{ type: string; amount: number }>;
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

interface Package {
  id: number;
  type: string;
  name: string;
  discount: string;
  giftSessions: number;
  minDownPaymentPercent: string;
}

interface UnifiedPackageComparisonProps {
  calculation: Calculation;
  selectedPackage: string | null;
  onPackageSelect: (packageType: string) => void;
  packages: Package[];
  downPayment: number;
  installmentMonths: number;
}

const packageInfo = {
  vip: {
    title: "VIP",
    subtitle: "Максимум возможностей",
    icon: Crown,
    gradient: "from-purple-500 via-pink-500 to-orange-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-200 dark:border-purple-700"
  },
  standard: {
    title: "Стандарт",
    subtitle: "Золотая середина",
    icon: Star,
    gradient: "from-blue-500 via-purple-500 to-pink-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-700"
  },
  economy: {
    title: "Эконом",
    subtitle: "Оптимальный старт",
    icon: Leaf,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-700"
  }
};

export default function UnifiedPackageComparison({ 
  calculation, 
  selectedPackage, 
  onPackageSelect,
  packages,
  downPayment,
  installmentMonths
}: UnifiedPackageComparisonProps) {
  const { data: perkValues = [] } = usePackagePerks();
  
  // Get unique perks ordered by displayOrder
  const uniquePerks = perkValues
    .filter(pv => pv.perk.isActive)
    .reduce((acc, pv) => {
      if (!acc.find(p => p.id === pv.perk.id)) {
        acc.push(pv.perk);
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => a.displayOrder - b.displayOrder);
  
  // Package types in correct order: VIP first, then Standard, then Economy
  const packageTypes = ['vip', 'standard', 'economy'] as const;
  
  // Get perk value for specific package
  const getPerkValue = (perkId: number, packageType: string) => {
    return perkValues.find(pv => pv.perk.id === perkId && pv.packageType === packageType);
  };

  // Get package data
  const getPackageData = (packageType: string) => {
    if (!calculation || !calculation.packages) return null;
    return calculation.packages[packageType as keyof typeof calculation.packages];
  };

  return (
    <div className="space-y-3">
      {/* Package Headers - красивые заголовки */}
      <div className="grid grid-cols-4 gap-3">
        <div></div>
        {packageTypes.map((packageType) => {
          const info = packageInfo[packageType];
          const packageData = packages.find((p: Package) => p.type === packageType);
          const Icon = info.icon;
          const isSelected = selectedPackage === packageType;
          const isPopular = packageType === 'standard';

          return (
            <div 
              key={packageType}
              className={`relative p-3 rounded-lg border-2 transition-all duration-300 ${
                isSelected 
                  ? `${info.borderColor} shadow-lg ${info.bgColor}` 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 text-xs">
                    Популярный
                  </Badge>
                </div>
              )}
              
              {packageType === 'vip' && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center z-10">
                  <Crown className="text-white" size={12} />
                </div>
              )}
              
              <div className="text-center">
                <div className={`w-10 h-10 mx-auto mb-2 bg-gradient-to-r ${info.gradient} rounded-lg flex items-center justify-center shadow-lg`}>
                  <Icon className="text-white" size={18} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  {packageData?.name || info.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {info.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Perks Comparison Table - красивая таблица */}
      {uniquePerks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {uniquePerks.map((perk, index) => {
              const IconComponent = (Icons as any)[perk.icon] || Check;
              
              return (
                <div key={perk.id} className={`grid grid-cols-4 gap-3 py-3 px-4 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-750' : 'bg-white dark:bg-gray-800'}`}>
                  {/* Perk Name */}
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex-shrink-0">
                      <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {perk.name}
                      </div>
                    </div>
                  </div>
                  
                  {/* Package Values */}
                  {packageTypes.map((packageType) => {
                    const perkValue = getPerkValue(perk.id, packageType);
                    const info = packageInfo[packageType];
                    const isSelected = selectedPackage === packageType;
                    
                    return (
                      <div key={packageType} className={`flex items-center justify-center py-2 transition-all duration-300 ${
                        isSelected ? `${info.bgColor} rounded-lg` : ''
                      }`}>
                        {!perkValue || !perkValue.isActive ? (
                          <div className="text-center">
                            <X className="h-4 w-4 text-red-400 mx-auto mb-1" />
                            <span className="text-xs text-gray-400">Нет</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            {perkValue.valueType === 'boolean' ? (
                              perkValue.booleanValue ? (
                                <>
                                  <div className={`p-1.5 rounded-lg bg-gradient-to-r ${info.gradient} mx-auto w-fit shadow`}>
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                  <span className="text-xs font-medium text-green-600 dark:text-green-400 block mt-1">Да</span>
                                </>
                              ) : (
                                <>
                                  <X className="h-4 w-4 text-red-400 mx-auto mb-1" />
                                  <span className="text-xs text-gray-400">Нет</span>
                                </>
                              )
                            ) : (
                              <>
                                <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                                  perkValue.isHighlighted 
                                    ? `bg-gradient-to-r ${info.gradient} text-white shadow-lg`
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                }`}>
                                  {perkValue.displayValue}
                                </div>
                                {perkValue.isHighlighted && (
                                  <div className="flex items-center justify-center space-x-1 mt-1">
                                    <Sparkles className="h-3 w-3 text-yellow-500" />
                                    <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                      Лучшее
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Package Pricing and Selection - красивые карточки */}
      <div className="grid grid-cols-4 gap-3">
        <div></div>
        {packageTypes.map((packageType) => {
          const info = packageInfo[packageType];
          const packageData = packages.find((p: Package) => p.type === packageType);
          const data = getPackageData(packageType);
          const isSelected = selectedPackage === packageType;
          const discountPercent = packageData ? Math.round(parseFloat(packageData.discount) * 100) : 0;

          if (!data || !packageData) return null;

          return (
            <div 
              key={packageType}
              className={`border-2 transition-all duration-300 rounded-lg overflow-hidden shadow ${
                isSelected 
                  ? `${info.borderColor} shadow-lg ${info.bgColor}` 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Discount Badge */}
              <div className={`p-2 text-center bg-gradient-to-r ${info.gradient}`}>
                <div className="text-sm font-bold text-white">
                  {discountPercent}% скидка
                </div>
              </div>
              
              {/* Pricing */}
              <div className="p-3 space-y-2">
                <div className="text-center">
                  <div className="text-xs text-gray-500 line-through">
                    {formatPrice(calculation.baseCost)}
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(data.finalCost)}
                  </div>
                  <div className="text-sm text-green-600 font-semibold">
                    Экономия: {formatPrice(data.totalSavings)}
                  </div>
                </div>
                
                {/* Additional Info */}
                {(packageData.giftSessions > 0 || data.monthlyPayment > 0) && (
                  <div className="space-y-1">
                    {packageData.giftSessions > 0 && (
                      <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 px-2 py-1 rounded text-xs text-center font-medium">
                        +{packageData.giftSessions} подарочных сеанса
                      </div>
                    )}
                    
                    {data.monthlyPayment > 0 && (
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs text-center font-medium">
                        {formatPrice(data.monthlyPayment)}/мес
                      </div>
                    )}
                  </div>
                )}
                
                {/* Select Button */}
                <Button
                  onClick={() => onPackageSelect(packageType)}
                  disabled={!data.isAvailable}
                  className={`w-full transition-all duration-300 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                      : `bg-gradient-to-r ${info.gradient} hover:opacity-90`
                  }`}
                  size="sm"
                >
                  {isSelected ? (
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Выбрано</span>
                    </div>
                  ) : (
                    <span className="text-sm">Выбрать пакет</span>
                  )}
                </Button>
                
                {!data.isAvailable && (
                  <p className="text-xs text-red-600 text-center">
                    {data.unavailableReason}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}