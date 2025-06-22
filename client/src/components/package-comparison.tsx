import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Star, Leaf } from "lucide-react";
import * as Icons from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { usePackagePerks, type PackagePerkValue } from "@/hooks/use-package-perks";

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

interface PackageComparisonProps {
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
    color: "from-purple-500 to-purple-600",
    order: 1
  },
  standard: {
    title: "Стандарт",
    subtitle: "Золотая середина",
    icon: Star,
    color: "from-blue-500 to-blue-600",
    order: 2
  },
  economy: {
    title: "Эконом",
    subtitle: "Оптимальный старт",
    icon: Leaf,
    color: "from-green-500 to-green-600",
    order: 3
  }
};

export default function PackageComparison({ 
  calculation, 
  selectedPackage, 
  onPackageSelect,
  packages,
  downPayment,
  installmentMonths
}: PackageComparisonProps) {
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
  
  // Render perk value cell
  const renderPerkValue = (perkId: number, packageType: string) => {
    const perkValue = getPerkValue(perkId, packageType);
    if (!perkValue || !perkValue.isActive) {
      return (
        <div className="flex items-center justify-center p-3">
          <X className="h-4 w-4 text-gray-400" />
        </div>
      );
    }
    
    const isHighlighted = perkValue.isHighlighted;
    const baseClasses = "flex items-center justify-center p-3 text-sm font-medium";
    const highlightedClasses = isHighlighted ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-lg" : "";
    
    if (perkValue.valueType === 'boolean') {
      return (
        <div className={`${baseClasses} ${highlightedClasses}`}>
          {perkValue.booleanValue ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
        </div>
      );
    }
    
    return (
      <div className={`${baseClasses} ${highlightedClasses}`}>
        <span className={isHighlighted ? "font-bold" : ""}>{perkValue.displayValue}</span>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Package Headers */}
      <div className="grid grid-cols-4 gap-4">
        <div className="flex items-center justify-center py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Преимущества</h3>
        </div>
        {packageTypes.map((packageType) => {
          const info = packageInfo[packageType];
          const data = calculation.packages[packageType];
          const packageData = packages.find((p: Package) => p.type === packageType);
          const Icon = info.icon;
          const isSelected = selectedPackage === packageType;
          
          return (
            <Card key={packageType} className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-lg">{info.title}</CardTitle>
                  </div>
                  {packageType === 'standard' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Популярный
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{info.subtitle}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(data.finalCost)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Экономия: {formatPrice(data.totalSavings)}
                    </div>
                    {installmentMonths > 0 && (
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        {formatPrice(data.monthlyPayment)}/мес
                      </div>
                    )}
                  </div>
                  
                  {packageData && packageData.giftSessions > 0 && (
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-2 text-center">
                      <span className="text-xs font-medium text-pink-800">
                        +{packageData.giftSessions} подарочных сеанса
                      </span>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => onPackageSelect(packageType)}
                    disabled={!data.isAvailable}
                    className={`w-full ${isSelected ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={isSelected ? "default" : "outline"}
                  >
                    {isSelected ? 'Выбрано' : 'Выбрать'}
                  </Button>
                  
                  {!data.isAvailable && (
                    <p className="text-xs text-red-600 text-center mt-2">
                      {data.unavailableReason}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Perks Comparison Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Преимущества</th>
                  {packageTypes.map((packageType) => (
                    <th key={packageType} className="text-center p-4 font-medium text-gray-900 dark:text-white">
                      {packageInfo[packageType].title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {uniquePerks.map((perk) => {
                  const IconComponent = (Icons as any)[perk.icon] || Check;
                  return (
                    <tr key={perk.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {perk.name}
                            </div>
                            {perk.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {perk.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {packageTypes.map((packageType) => (
                        <td key={packageType} className="border-l border-gray-200 dark:border-gray-700">
                          {renderPerkValue(perk.id, packageType)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}