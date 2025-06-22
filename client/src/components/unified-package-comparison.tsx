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
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Выберите свой пакет
        </CardTitle>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Сравните преимущества и выберите лучший вариант
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packageTypes.map((packageType) => {
            const info = packageInfo[packageType];
            const packageData = packages.find((p: Package) => p.type === packageType);
            const data = getPackageData(packageType);
            const Icon = info.icon;
            const isSelected = selectedPackage === packageType;
            const isPopular = packageType === 'standard';
            const discountPercent = packageData ? Math.round(parseFloat(packageData.discount) * 100) : 0;

            if (!data || !packageData) return null;

            return (
              <div 
                key={packageType}
                className={`relative transform transition-all duration-300 ${
                  isSelected ? 'scale-105 z-10' : 'hover:scale-102'
                }`}
              >
                <Card className={`h-full border-2 transition-all duration-300 ${
                  isSelected 
                    ? `${info.borderColor} shadow-xl ${info.bgColor}` 
                    : 'border-gray-200 dark:border-gray-700 hover:shadow-lg'
                }`}>
                  
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1">
                        Популярный
                      </Badge>
                    </div>
                  )}
                  
                  {/* VIP Crown */}
                  {packageType === 'vip' && (
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center z-10 shadow-lg">
                      <Crown className="text-white" size={16} />
                    </div>
                  )}
                  
                  <CardContent className="p-6 text-center space-y-4">
                    {/* Package Icon and Title */}
                    <div>
                      <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-r ${info.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <Icon className="text-white" size={32} />
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {packageData.name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {info.subtitle}
                      </p>
                    </div>
                    
                    {/* Discount Badge */}
                    <div className={`inline-block px-4 py-2 rounded-xl text-lg font-bold text-white bg-gradient-to-r ${info.gradient} shadow-lg`}>
                      {discountPercent}% скидка
                    </div>
                    
                    {/* Pricing */}
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(calculation.baseCost)}
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(data.finalCost)}
                      </div>
                      <div className="text-sm text-green-600 font-semibold">
                        Экономия: {formatPrice(data.totalSavings)}
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="space-y-2">
                      {packageData.giftSessions > 0 && (
                        <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 px-3 py-1 rounded-lg text-sm font-medium">
                          +{packageData.giftSessions} подарочных сеанса
                        </div>
                      )}
                      
                      {data.monthlyPayment > 0 && (
                        <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg text-sm font-medium">
                          {formatPrice(data.monthlyPayment)}/мес
                        </div>
                      )}
                    </div>
                    
                    {/* Select Button */}
                    <Button
                      onClick={() => onPackageSelect(packageType)}
                      disabled={!data.isAvailable}
                      className={`w-full transition-all duration-300 ${
                        isSelected 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                          : `bg-gradient-to-r ${info.gradient} hover:opacity-90`
                      }`}
                      size="lg"
                    >
                      {isSelected ? (
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4" />
                          <span>Выбрано</span>
                        </div>
                      ) : (
                        'Выбрать пакет'
                      )}
                    </Button>
                    
                    {!data.isAvailable && (
                      <p className="text-xs text-red-600 mt-2">
                        {data.unavailableReason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
        
        {/* Perks Comparison Table */}
        {uniquePerks.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Сравнение преимуществ
            </h4>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Преимущества
                      </th>
                      {packageTypes.map((packageType) => {
                        const info = packageInfo[packageType];
                        const Icon = info.icon;
                        const packageData = packages.find((p: Package) => p.type === packageType);
                        
                        return (
                          <th key={packageType} className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center space-y-2">
                              <div className={`w-8 h-8 bg-gradient-to-r ${info.gradient} rounded-lg flex items-center justify-center`}>
                                <Icon className="text-white" size={16} />
                              </div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {packageData?.name || info.title}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {uniquePerks.map((perk, index) => {
                      const IconComponent = (Icons as any)[perk.icon] || Check;
                      
                      return (
                        <tr key={perk.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                                <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {perk.name}
                                </div>
                                {perk.description && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {perk.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          {packageTypes.map((packageType) => {
                            const perkValue = getPerkValue(perk.id, packageType);
                            const info = packageInfo[packageType];
                            const isSelected = selectedPackage === packageType;
                            
                            return (
                              <td key={packageType} className={`px-6 py-4 text-center transition-all duration-300 ${
                                isSelected ? `${info.bgColor}` : ''
                              }`}>
                                {!perkValue || !perkValue.isActive ? (
                                  <div className="flex flex-col items-center">
                                    <X className="h-5 w-5 text-red-400 mb-1" />
                                    <span className="text-xs text-gray-400">Не включено</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center space-y-1">
                                    {perkValue.valueType === 'boolean' ? (
                                      perkValue.booleanValue ? (
                                        <>
                                          <div className={`p-2 rounded-lg bg-gradient-to-r ${info.gradient}`}>
                                            <Check className="h-4 w-4 text-white" />
                                          </div>
                                          <span className="text-xs font-medium text-green-600 dark:text-green-400">Включено</span>
                                        </>
                                      ) : (
                                        <>
                                          <X className="h-5 w-5 text-red-400 mb-1" />
                                          <span className="text-xs text-gray-400">Не включено</span>
                                        </>
                                      )
                                    ) : (
                                      <>
                                        <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                                          perkValue.isHighlighted 
                                            ? `bg-gradient-to-r ${info.gradient} text-white shadow-lg`
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                        }`}>
                                          {perkValue.displayValue}
                                        </div>
                                        {perkValue.isHighlighted && (
                                          <div className="flex items-center space-x-1">
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
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
      </CardContent>
    </Card>
  );
}