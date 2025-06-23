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
  bonusAccountPercent: string;
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
  packagePerkValues?: PackagePerkValue[];
  usedCertificate: boolean;
  freeZones?: Array<{
    serviceId: number;
    title: string;
    pricePerProcedure: number;
    quantity: number;
  }>;
}

export default function UnifiedPackageComparison({ 
  calculation, 
  selectedPackage, 
  onPackageSelect, 
  packages,
  downPayment,
  installmentMonths,
  procedureCount,
  packagePerkValues = [],
  usedCertificate = false,
  freeZones = []
}: UnifiedPackageComparisonProps) {
  const packageTypes = ['vip', 'standard', 'economy'];
  const hasValidCalculation = calculation && calculation.baseCost > 0;

  const getPackageData = (packageType: string): PackageData | null => {
    if (!hasValidCalculation) return null;
    return (calculation.packages as any)[packageType] || null;
  };

  const formatPrice = (price: number): string => {
    return `${Math.round(price).toLocaleString()} ₽`;
  };

  // Get unique perks for display
  const uniquePerks = Array.from(
    new Map(packagePerkValues.map(pv => [pv.perk.id, pv.perk])).values()
  ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Helper function to get perk value for a specific package
  const getPerkValue = (perkId: number, packageType: string) => {
    return packagePerkValues.find(pv => pv.perkId === perkId && pv.packageType === packageType);
  };

  const getPackageIcon = (packageType: string) => {
    switch (packageType) {
      case 'vip': return Crown;
      case 'standard': return Star;
      case 'economy': return Zap;
      default: return Star;
    }
  };

  const getPackageColor = (packageType: string) => {
    switch (packageType) {
      case 'vip': return 'from-yellow-400 to-orange-500';
      case 'standard': return 'from-blue-400 to-purple-500';
      case 'economy': return 'from-green-400 to-teal-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getPackageName = (packageType: string) => {
    switch (packageType) {
      case 'vip': return 'VIP';
      case 'standard': return 'Стандарт';
      case 'economy': return 'Эконом';
      default: return packageType;
    }
  };


  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full">
        {/* Package Headers */}
        <div className="bg-gray-50 dark:bg-gray-800 px-2 py-2">
          <div className="grid grid-cols-4 gap-0">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300"></div>
            {packageTypes.map((packageType) => {
              const Icon = getPackageIcon(packageType);
              const isSelected = selectedPackage === packageType;
              
              return (
                <div 
                  key={packageType}
                  className={`text-center cursor-pointer transition-all duration-200 rounded-lg p-2 ${
                    isSelected 
                      ? 'bg-white dark:bg-gray-800 shadow-md transform scale-105' 
                      : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => onPackageSelect(packageType)}
                >
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${getPackageColor(packageType)} mb-1`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">
                    {getPackageName(packageType)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          
          {/* Database Perks Rows */}
          {uniquePerks.map((perk, index) => {
            const IconComponent = (Icons as any)[perk.icon] || Check;
            
            return (
              <div key={perk.id} className="grid grid-cols-4 gap-0 py-1 px-2 border-b border-gray-50 dark:border-gray-800">
                {/* Perk Name */}
                <div className="flex items-center space-x-2">
                  {perk.icon && perk.icon !== 'none' && (
                    <div className="p-1 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex-shrink-0">
                      <IconComponent 
                        className="h-3 w-3"
                        style={{ color: perk.iconColor || '#3B82F6' }} 
                      />
                    </div>
                  )}
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {perk.name}
                  </span>
                  {perk.description && (
                    <div className="text-xs text-gray-500 mt-1">{perk.description}</div>
                  )}
                </div>

                {/* Perk Values for each package */}
                {packageTypes.map((packageType) => {
                  const perkValue = getPerkValue(perk.id, packageType);
                  const isSelected = selectedPackage === packageType;
                  
                  if (!perkValue) {
                    return (
                      <div key={packageType} className="text-center py-1">
                        <span className="text-red-500 font-semibold">-</span>
                      </div>
                    );
                  }

                  const content = (
                    <div className="text-center py-1">
                      {perkValue.valueType === 'boolean' ? (
                        perkValue.booleanValue ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <span className="text-red-500 font-semibold">-</span>
                        )
                      ) : (
                        <span className={`text-sm font-semibold ${
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

          {/* Free Sessions Row */}
          <div className="grid grid-cols-4 gap-0 py-1 px-2 border-b border-gray-50 dark:border-gray-800">
            <div className="text-base font-medium text-gray-900 dark:text-white">
              Сеансы в подарок
            </div>
            {packageTypes.map((packageType) => {
              const packageData = packages.find((p: Package) => p.type === packageType);
              const giftSessions = packageData?.giftSessions || 0;
              
              return (
                <div key={packageType} className="text-center py-1">
                  <span className="text-base font-bold text-gray-900 dark:text-white">
                    {giftSessions > 0 ? giftSessions : '-'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Discount Row */}
          <div className="grid grid-cols-4 gap-0 py-1 px-2 border-b border-gray-50 dark:border-gray-800">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Скидка
            </div>
            {packageTypes.map((packageType) => {
              const packageData = packages.find((p: Package) => p.type === packageType);
              const discountPercent = packageData ? Math.round(parseFloat(packageData.discount) * 100) : 0;
              
              return (
                <div key={packageType} className="text-center py-1">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {discountPercent}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bonus Account Row */}
          <div className="grid grid-cols-4 gap-0 py-1 px-2 border-b border-gray-50 dark:border-gray-800">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Бонусный счет
            </div>
            {packageTypes.map((packageType) => {
              const packageData = packages.find((p: Package) => p.type === packageType);
              const bonusPercent = packageData ? Math.round(parseFloat(packageData.bonusAccountPercent) * 100) : 0;
              
              return (
                <div key={packageType} className="text-center py-1">
                  <div className="text-xs font-bold text-gray-900 dark:text-white">
                    <div>{bonusPercent}%</div>
                    <div>от стоимости</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subscription Cost Section */}
          <div className="py-2 px-2">
            <div className="font-bold text-gray-900 dark:text-white text-lg mb-2">Итого стоимость абонемента</div>
            
            {/* Original Cost Row */}
            <div className="grid grid-cols-4 gap-0 py-1 border-b border-gray-50 dark:border-gray-800">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Первоначальная
              </div>
              {packageTypes.map((packageType) => {
                const isSelected = selectedPackage === packageType;
                
                return (
                  <div key={packageType} className="text-center">
                    <span className="text-sm text-red-500 line-through">
                      {calculation.baseCost.toLocaleString()} ₽
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Discount Amount Row */}
            <div className="grid grid-cols-4 gap-0 py-1">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Скидка
              </div>
              {packageTypes.map((packageType) => {
                const data = getPackageData(packageType);
                const isSelected = selectedPackage === packageType;
                
                return (
                  <div key={packageType} className="text-center">
                    <span className="text-sm text-green-600 dark:text-green-400">
                      {data && data.totalSavings > 0 ? `-${data.totalSavings.toLocaleString()} ₽` : '0 ₽'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate Section - Only show if certificate is used */}
          {usedCertificate && (
            <div className="py-2 px-2">
              <div className="grid grid-cols-4 gap-0 py-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Сертификат
                </div>
                {packageTypes.map((packageType) => {
                  const isSelected = selectedPackage === packageType;
                  
                  return (
                    <div key={packageType} className="text-center">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        -3 000 ₽
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Final Cost Row */}
          <div className="grid grid-cols-4 gap-0 py-1 px-2 border-b border-gray-50 dark:border-gray-800">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              Итого стоимость курса:
            </div>
            {packageTypes.map((packageType) => {
              const data = getPackageData(packageType);
              
              return (
                <div key={packageType} className="text-center py-1">
                  <div className="font-bold text-blue-700 dark:text-blue-300 text-base">
                    {data && data.finalCost ? `${data.finalCost.toLocaleString()} ₽` : 'Выберите услуги'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Details */}
          <div className="py-2 px-2">
            {/* Down Payment Row */}
            <div className="grid grid-cols-4 gap-0 py-1 border-b border-gray-50 dark:border-gray-800">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Первый взнос:
              </div>
              {packageTypes.map((packageType) => {
                const isSelected = selectedPackage === packageType;
                
                return (
                  <div key={packageType} className="text-center py-1">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {downPayment.toLocaleString()} ₽
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Monthly Payment Row */}
            <div className="grid grid-cols-4 gap-0 py-1">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Платеж в месяц
              </div>
              {packageTypes.map((packageType) => {
                const data = getPackageData(packageType);
                const isSelected = selectedPackage === packageType;
                
                return (
                  <div key={packageType} className="text-center py-1">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {data && data.monthlyPayment ? `${data.monthlyPayment.toLocaleString()} ₽` : '0 ₽'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gifts Section */}
          <div className="bg-blue-100 dark:bg-blue-900/30 py-4 px-4">
            <div className="flex items-center font-bold text-gray-900 dark:text-white text-sm mb-3">
              🎁 Подарки
            </div>
            
            {/* Gift Procedures Cost Row */}
            <div className="grid grid-cols-4 gap-0 py-1 border-b border-gray-50 dark:border-gray-800">
              <div className="text-sm text-gray-900 dark:text-white">
                Стоимость подарочных процедур
              </div>
              {packageTypes.map((packageType) => {
                const data = getPackageData(packageType);
                const packageData = packages.find((p: Package) => p.type === packageType);
                
                // Calculate gift procedures value
                const giftValue = data && packageData && (packageData.giftSessions || 0) > 0 && calculation.totalProcedures > 0
                  ? (data.finalCost / calculation.totalProcedures) * (packageData.giftSessions || 0)
                  : 0;
                
                return (
                  <div key={packageType} className="text-center py-1">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {giftValue > 0 ? `${Math.round(giftValue).toLocaleString()} ₽` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Free Zones Cost Row - Only show if there are free zones */}
            {freeZones && freeZones.length > 0 && (
              <div className="grid grid-cols-4 gap-0 py-1 border-b border-gray-50 dark:border-gray-800">
                <div className="text-sm text-gray-900 dark:text-white">
                  Стоимость бесплатных зон
                </div>
                {packageTypes.map((packageType) => {
                  // Calculate free zones value properly: price per procedure * quantity
                  const freeZoneValue = freeZones.reduce((total, zone) => {
                    return total + (zone.pricePerProcedure * zone.quantity);
                  }, 0);
                  
                  return (
                    <div key={packageType} className="text-center py-1">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {freeZoneValue > 0 ? `${Math.round(freeZoneValue).toLocaleString()} ₽` : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bonus Account Row */}
            <div className="grid grid-cols-4 gap-0 py-1 border-b border-gray-50 dark:border-gray-800">
              <div className="text-sm text-gray-900 dark:text-white">
                Бонусный счет
              </div>
              {packageTypes.map((packageType) => {
                const data = getPackageData(packageType);
                const packageData = packages.find((p: Package) => p.type === packageType);
                
                const bonusPercent = packageData ? parseFloat(packageData.bonusAccountPercent) : 0;
                const bonusAmount = data && bonusPercent > 0 ? (data.finalCost * bonusPercent) : 0;
                
                return (
                  <div key={packageType} className="text-center py-1">
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {bonusAmount > 0 ? `${Math.round(bonusAmount).toLocaleString()} ₽` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Total Gifts Value Row */}
            <div className="grid grid-cols-4 gap-0 py-1">
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                Итого стоимость подарков:
              </div>
              {packageTypes.map((packageType) => {
                const data = getPackageData(packageType);
                const packageData = packages.find((p: Package) => p.type === packageType);
                const isSelected = selectedPackage === packageType;
                
                // Calculate total gifts value
                const giftValue = data && packageData && (packageData.giftSessions || 0) > 0 && calculation.totalProcedures > 0
                  ? (data.finalCost / calculation.totalProcedures) * (packageData.giftSessions || 0)
                  : 0;
                
                const bonusPercent = packageData ? parseFloat(packageData.bonusAccountPercent) : 0;
                const bonusAmount = data && bonusPercent > 0 ? (data.finalCost * bonusPercent) : 0;
                
                const freeZoneValue = freeZones && freeZones.length > 0 
                  ? freeZones.reduce((total, zone) => total + (zone.pricePerProcedure * zone.quantity), 0)
                  : 0;
                
                const totalGifts = giftValue + bonusAmount + freeZoneValue;
                
                return (
                  <div key={packageType} className="text-center py-1">
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      {totalGifts > 0 ? `${Math.round(totalGifts).toLocaleString()} ₽` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}