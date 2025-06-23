import React from 'react';
import { Check, X, Crown, Star, Zap } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface PackagePerkValue {
  id: number;
  packageType: string;
  perkId: number;
  valueType: 'boolean' | 'text' | 'number';
  booleanValue?: boolean;
  textValue?: string;
  numberValue?: number;
  displayValue: string;
  tooltip?: string;
  customIcon?: string;
  customIconColor?: string;
  isHighlighted: boolean;
  isBest?: boolean;
  isActive: boolean;
  perk: {
    id: number;
    name: string;
    description?: string;
    icon: string;
    iconColor?: string;
    displayOrder: number;
    isActive: boolean;
  };
}

interface UnifiedPackageComparisonProps {
  calculation: Calculation;
  selectedPackage: string | null;
  onPackageSelect: (packageType: string) => void;
  packages: Package[];
  downPayment: number;
  installmentMonths: number;
  procedureCount: number;
}

const packageTypes = ['vip', 'standard', 'economy'];

const packageInfo = {
  vip: {
    icon: Crown,
    bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-700/50',
    textColor: 'text-yellow-800 dark:text-yellow-300'
  },
  standard: {
    icon: Star,
    bgColor: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20',
    borderColor: 'border-blue-200 dark:border-blue-700/50',
    textColor: 'text-blue-800 dark:text-blue-300'
  },
  economy: {
    icon: Zap,
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    borderColor: 'border-green-200 dark:border-green-700/50',
    textColor: 'text-green-800 dark:text-green-300'
  }
};

export default function UnifiedPackageComparison({ 
  calculation, 
  selectedPackage, 
  onPackageSelect, 
  packages, 
  downPayment, 
  installmentMonths,
  procedureCount 
}: UnifiedPackageComparisonProps) {
  
  const [packagePerks, setPackagePerks] = React.useState<PackagePerkValue[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPerks = async () => {
      try {
        const response = await fetch('/api/perks');
        if (response.ok) {
          const data = await response.json();
          setPackagePerks(data);
        }
      } catch (error) {
        console.error('Error fetching package perks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPerks();
  }, []);

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPackageData = (packageType: string): PackageData | null => {
    if (!calculation || !calculation.packages) return null;
    return calculation.packages[packageType as keyof typeof calculation.packages];
  };

  // Get unique perks ordered by displayOrder
  const uniquePerks = React.useMemo(() => {
    const perkMap = new Map();
    packagePerks.forEach(pv => {
      if (pv.isActive && pv.perk.isActive) {
        perkMap.set(pv.perk.id, pv.perk);
      }
    });
    return Array.from(perkMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  }, [packagePerks]);

  // Get perk value for specific package
  const getPerkValue = (perkId: number, packageType: string): PackagePerkValue | undefined => {
    return packagePerks.find(pv => pv.perkId === perkId && pv.packageType === packageType && pv.isActive);
  };

  // Check if we have valid calculation data
  const hasValidCalculation = calculation && calculation.packages && Object.keys(calculation.packages).length > 0;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Unified Table - Fully Responsive */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex-1 min-h-0">
          <div className="h-full flex flex-col">
            
            {/* Table Header with Package Names */}
            <div className="grid grid-cols-4 gap-1 lg:gap-2 p-2 lg:p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
              <div></div>
              {packageTypes.map((packageType) => {
                const info = packageInfo[packageType];
                const packageData = packages.find((p: Package) => p.type === packageType);
                const Icon = info.icon;
                const isSelected = selectedPackage === packageType;

                return (
                  <div 
                    key={packageType}
                    className={`text-center p-2 rounded-lg border transition-all duration-300 cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-100 dark:bg-blue-800 border-blue-300 dark:border-blue-600' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => onPackageSelect(packageType)}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <Icon className={`h-4 w-4 lg:h-5 lg:w-5 ${info.textColor}`} />
                      <span className="font-bold text-xs lg:text-sm text-gray-900 dark:text-white">
                        {packageData?.name || packageType.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Content Area - Flexible Height */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="h-full overflow-y-auto">
                
                {/* Discount Row */}
                <div className="grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                    Скидка
                  </div>
                  {packageTypes.map((packageType) => {
                    const packageData = packages.find((p: Package) => p.type === packageType);
                    const isSelected = selectedPackage === packageType;
                    const discountPercent = packageData ? parseFloat(packageData.discount) : 0;
                    
                    return (
                      <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-gray-100 dark:bg-gray-600 rounded-lg' : ''}`}>
                        <span className="text-xs lg:text-sm font-semibold text-green-600 dark:text-green-400">
                          {discountPercent}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Perks Rows */}
                {uniquePerks.map((perk, index) => {
                  const IconComponent = (Icons as any)[perk.icon] || Check;
                  
                  return (
                    <div key={perk.id} className="grid grid-cols-4 gap-1 lg:gap-2 py-1 lg:py-2 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700">
                      {/* Perk Name */}
                      <div className="flex items-center space-x-1 lg:space-x-2">
                        {perk.icon && perk.icon !== 'none' && (
                          <div className="p-1 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex-shrink-0">
                            <IconComponent 
                              className={`h-2.5 w-2.5 lg:h-3 lg:w-3`}
                              style={{ color: perk.iconColor || '#3B82F6' }} 
                            />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-white text-xs lg:text-sm truncate">
                          {perk.name}
                        </span>
                      </div>

                      {/* Perk Values for each package */}
                      {packageTypes.map((packageType) => {
                        const perkValue = getPerkValue(perk.id, packageType);
                        const isSelected = selectedPackage === packageType;
                        
                        if (!perkValue) {
                          return (
                            <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-gray-100 dark:bg-gray-600 rounded-lg' : ''}`}>
                              <X className="h-3 w-3 lg:h-4 lg:w-4 text-red-400 mx-auto" />
                            </div>
                          );
                        }

                        const content = (
                          <div className={`text-center py-1 ${isSelected ? 'bg-gray-100 dark:bg-gray-600 rounded-lg' : ''}`}>
                            {perkValue.valueType === 'boolean' ? (
                              perkValue.booleanValue ? (
                                <div className="p-1 rounded-lg bg-green-500 mx-auto w-fit shadow">
                                  <Check className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-white" />
                                </div>
                              ) : (
                                <X className="h-3 w-3 lg:h-4 lg:w-4 text-red-400 mx-auto" />
                              )
                            ) : (
                              <span className={`text-xs lg:text-sm font-semibold ${
                                perkValue.isHighlighted 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {perkValue.displayValue}
                              </span>
                            )}
                          </div>
                        );

                        return perkValue.tooltip ? (
                          <Tooltip key={packageType}>
                            <TooltipTrigger asChild>
                              {content}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{perkValue.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div key={packageType}>
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Total Savings Row */}
                <div className="grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                    Экономия
                  </div>
                  {packageTypes.map((packageType) => {
                    const data = getPackageData(packageType);
                    const isSelected = selectedPackage === packageType;
                    
                    return (
                      <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-green-100 dark:bg-green-800 rounded-lg' : ''}`}>
                        <span className="text-xs lg:text-sm font-bold text-green-600 dark:text-green-400">
                          {data && data.totalSavings > 0 ? `−${formatPrice(data.totalSavings)}` : '0₽'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Final Cost Row */}
                <div className="grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                    Итоговая стоимость
                  </div>
                  {packageTypes.map((packageType) => {
                    const data = getPackageData(packageType);
                    const isSelected = selectedPackage === packageType;
                    
                    return (
                      <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-blue-100 dark:bg-blue-800 rounded-lg' : ''}`}>
                        <span className="text-xs lg:text-sm font-bold text-blue-700 dark:text-blue-300">
                          {data && data.finalCost ? formatPrice(data.finalCost) : (hasValidCalculation ? formatPrice(0) : 'Выберите услуги')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Monthly Payment Row */}
                <div className="grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                    Ежемесячный платеж
                  </div>
                  {packageTypes.map((packageType) => {
                    const data = getPackageData(packageType);
                    const isSelected = selectedPackage === packageType;
                    
                    return (
                      <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-gray-100 dark:bg-gray-600 rounded-lg' : ''}`}>
                        <span className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {data && data.monthlyPayment > 0 ? formatPrice(data.monthlyPayment) : 
                           (hasValidCalculation && installmentMonths > 1 ? 'Рассчитывается' : '−')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Selection Buttons Row */}
                <div className="grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3">
                  <div className="flex items-center font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                    Выбрать пакет
                  </div>
                  {packageTypes.map((packageType) => {
                    const data = getPackageData(packageType);
                    const isSelected = selectedPackage === packageType;
                    
                    return (
                      <div key={packageType} className="text-center">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => onPackageSelect(packageType)}
                          disabled={data?.isAvailable === false}
                          className="w-full h-8"
                        >
                          {isSelected ? 'Выбран' : 'Выбрать'}
                        </Button>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}