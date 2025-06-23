import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { formatPrice } from "../lib/utils";
import { Package, PackagePerkValue, Perk } from "@/../../shared/schema";
import { Crown, Diamond, Shield, Check, X, Sparkles } from "lucide-react";
import * as Icons from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import React from "react";

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

interface UnifiedPackageComparisonProps {
  calculation: Calculation;
  selectedPackage: string | null;
  onPackageSelect: (packageType: string) => void;
  packages: Package[];
  downPayment: number;
  installmentMonths: number;
  procedureCount: number; // Add procedure count to props
}

export default function UnifiedPackageComparison({ 
  calculation, 
  selectedPackage, 
  onPackageSelect, 
  packages,
  downPayment,
  installmentMonths,
  procedureCount
}: UnifiedPackageComparisonProps) {
  
  const packageTypes = ['vip', 'standard', 'economy'];
  
  // Get bulk discount threshold from calculator settings via API
  const { data: bulkThreshold } = useQuery({
    queryKey: ['/api/config/bulk_discount_threshold'],
    enabled: true
  });
  
  // Calculate bulk procedures discount display - based on procedure count slider
  const totalProcedures = calculation?.totalProcedures || 0;
  const safeProcedureCount = procedureCount || 1;
  const actualThreshold = bulkThreshold || 15;
  const hasAdditionalDiscount = safeProcedureCount >= actualThreshold;
  

  
  // Package visual configurations
  const packageInfo = {
    vip: {
      title: 'VIP',
      icon: Crown,
      gradient: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    standard: {
      title: 'Standard',
      icon: Diamond,
      gradient: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    economy: {
      title: 'Economy',
      icon: Shield,
      gradient: 'from-green-500 to-emerald-500',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    }
  };

  // Get real perks data from props or API
  const { data: perkValues } = useQuery({
    queryKey: ['/api/perks'],
    enabled: true
  });

  // Extract unique perks
  const uniquePerks = React.useMemo(() => {
    if (!perkValues || !Array.isArray(perkValues)) return [];
    
    const perksMap = new Map();
    perkValues.forEach((pv: any) => {
      if (pv.perk && !perksMap.has(pv.perk.id)) {
        perksMap.set(pv.perk.id, pv.perk);
      }
    });
    
    return Array.from(perksMap.values()).sort((a: any, b: any) => a.displayOrder - b.displayOrder);
  }, [perkValues]);

  // Get perk value for specific package
  const getPerkValue = (perkId: number, packageType: string) => {
    if (!perkValues || !Array.isArray(perkValues)) return null;
    return perkValues.find((pv: any) => pv.perk.id === perkId && pv.packageType === packageType);
  };

  // Get package data
  const getPackageData = (packageType: string) => {
    if (!calculation || !calculation.packages) return null;
    return calculation.packages[packageType as keyof typeof calculation.packages];
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col space-y-2 lg:space-y-3 h-full shadow-safe">
      {/* Package Headers - компактные */}
      <div className="grid grid-cols-4 gap-1 lg:gap-2 flex-shrink-0 shadow-container">
        <div></div>
        {packageTypes.map((packageType) => {
          const info = packageInfo[packageType];
          const packageData = packages.find((p: Package) => p.type === packageType);
          const Icon = info.icon;
          const isSelected = selectedPackage === packageType;
          const isPopular = packageType === 'vip';

          return (
            <div 
              key={packageType}
              className={`relative p-2 rounded-lg border-2 transition-all duration-300 ${
                isSelected 
                  ? `${info.borderColor} shadow-lg ${info.bgColor}` 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Check if this package is marked as "Best" */}
              {perkValues && perkValues.some((pv: any) => pv.packageType === packageType && pv.isBest) && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1">
                    Лучшее
                  </Badge>
                </div>
              )}
              
              <div className="text-center">
                <div className={`w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-1 lg:mb-2 bg-gradient-to-r ${info.gradient} rounded-lg flex items-center justify-center shadow-lg`}>
                  <Icon className="text-white" size={12} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-xs lg:text-sm">
                  {packageData?.name || info.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Perks Comparison Table - with smart scrolling */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex-1 min-h-0">         
          {/* Контент таблицы - скроллируемый */}
          <div className="overflow-y-auto table-scroll" style={{ maxHeight: 'min(400px, calc(100vh - 350px))', minHeight: uniquePerks.length > 6 ? '300px' : 'auto' }}>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {uniquePerks.map((perk, index) => {
              const IconComponent = (Icons as any)[perk.icon] || Check;
              
              return (
                <div key={perk.id} className={`grid grid-cols-4 gap-1 lg:gap-2 py-1.5 lg:py-2 px-2 lg:px-3 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-750' : 'bg-white dark:bg-gray-800'}`}>
                  {/* Perk Name */}
                  <div className="flex items-center space-x-1 lg:space-x-2">
                    <div className="p-1 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex-shrink-0">
                      <IconComponent 
                        className="h-3 w-3 lg:h-4 lg:w-4" 
                        style={{ color: perk.iconColor || '#2563eb' }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                        {perk.name}
                      </div>
                      {perk.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {perk.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Package Values */}
                  {packageTypes.map((packageType) => {
                    const perkValue = getPerkValue(perk.id, packageType);
                    const info = packageInfo[packageType];
                    const isSelected = selectedPackage === packageType;
                    
                    return (
                      <div key={packageType} className={`flex items-center justify-center py-1 transition-all duration-300 ${
                        isSelected ? `${info.bgColor} rounded-lg` : ''
                      }`}>
                        {!perkValue || !perkValue.isActive ? (
                          <div className="text-center">
                            <X className="h-3 w-3 lg:h-4 lg:w-4 text-red-400 mx-auto mb-1" />
                            <span className="text-xs text-gray-400 hidden lg:block">Нет</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            {perkValue.valueType === 'boolean' ? (
                              perkValue.booleanValue ? (
                                <>
                                  {perkValue.customIcon && perkValue.customIcon !== 'none' ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className={`p-1 rounded-lg bg-gradient-to-r ${info.gradient} mx-auto w-fit shadow cursor-help`}>
                                          {React.createElement((Icons as any)[perkValue.customIcon] || Check, { 
                                            className: "h-2.5 w-2.5 lg:h-3 lg:w-3",
                                            style: { color: perkValue.customIconColor || '#ffffff' }
                                          })}
                                        </div>
                                      </TooltipTrigger>
                                      {perkValue.tooltip && (
                                        <TooltipContent>
                                          <p>{perkValue.tooltip}</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  ) : (
                                    <div className={`p-1 rounded-lg bg-gradient-to-r ${info.gradient} mx-auto w-fit shadow`}>
                                      <Check className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-white" />
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-600 dark:text-gray-300 mt-1 block">
                                    {perkValue.displayValue}
                                  </span>
                                </>
                              ) : (
                                <div className="text-center">
                                  <X className="h-3 w-3 lg:h-4 lg:w-4 text-red-400 mx-auto mb-1" />
                                  <span className="text-xs text-gray-400 hidden lg:block">Нет</span>
                                </div>
                              )
                            ) : (
                              <div className="text-center">
                                {perkValue.tooltip ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={`text-xs lg:text-sm font-semibold cursor-help ${perkValue.isHighlighted ? `font-bold text-white bg-gradient-to-r ${info.gradient} px-2 py-1 rounded shadow` : 'text-gray-700 dark:text-gray-300'}`}>
                                        {perkValue.customIcon && perkValue.customIcon !== 'none' && (
                                          <span className="inline-block mr-1" style={{ color: perkValue.customIconColor || '#000000' }}>
                                            {React.createElement((Icons as any)[perkValue.customIcon] || Check, { className: "h-3 w-3 inline" })}
                                          </span>
                                        )}
                                        {perkValue.displayValue}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{perkValue.tooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <div className={`text-xs lg:text-sm font-semibold ${perkValue.isHighlighted ? `font-bold text-white bg-gradient-to-r ${info.gradient} px-2 py-1 rounded shadow` : 'text-gray-700 dark:text-gray-300'}`}>
                                    {perkValue.customIcon && perkValue.customIcon !== 'none' && (
                                      <span className="inline-block mr-1" style={{ color: perkValue.customIconColor || '#000000' }}>
                                        {React.createElement((Icons as any)[perkValue.customIcon] || Check, { className: "h-3 w-3 inline" })}
                                      </span>
                                    )}
                                    {perkValue.displayValue}
                                  </div>
                                )}
                              </div>
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
      </div>

      {/* Package Pricing and Selection - компактные */}
      <div className="grid grid-cols-4 gap-1 lg:gap-2 flex-shrink-0 shadow-container">
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
              <div className={`p-1.5 lg:p-2 text-center bg-gradient-to-r ${info.gradient}`}>
                <div className="text-xs lg:text-sm font-bold text-white">
                  {discountPercent}% скидка
                </div>
              </div>
              
              {/* Pricing */}
              <div className="p-2 lg:p-3 space-y-1 lg:space-y-2">
                <div className="text-center">
                  <div className="text-xs text-gray-500 line-through">
                    {formatPrice(calculation.baseCost)}
                  </div>
                  <div className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(data.finalCost)}
                  </div>
                  <div className="text-xs lg:text-sm text-green-600 font-semibold">
                    Экономия: {formatPrice(data.totalSavings)}
                    <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                      {data.appliedDiscounts.filter((discount: any) => discount.amount > 0).map((discount: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {discount.type === 'package' && `Скидка пакета ${discountPercent}%`}
                            {discount.type === 'bulk' && `За ${actualThreshold}+ процедур`}
                            {discount.type === 'certificate' && 'Сертификат'}
                            {discount.type === 'gift_sessions' && `Подарочные процедуры`}
                          </span>
                          <span>-{formatPrice(discount.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Additional Info */}
                {(packageData.giftSessions > 0 || data.monthlyPayment > 0) && (
                  <div className="space-y-1">
                    {packageData.giftSessions > 0 && (
                      <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 px-2 py-1 rounded text-xs text-center font-medium">
                        +{packageData.giftSessions} <span className="hidden sm:inline">подарочных процедуры</span>
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
                  className={`w-full transition-all duration-300 text-xs py-1.5 lg:py-2 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                      : `bg-gradient-to-r ${info.gradient} hover:opacity-90`
                  }`}
                  size="sm"
                >
                  {isSelected ? (
                    <div className="flex items-center space-x-1">
                      <Check className="h-3 w-3" />
                      <span>Выбрано</span>
                    </div>
                  ) : (
                    <span>Выбрать пакет</span>
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
    </TooltipProvider>
  );
}