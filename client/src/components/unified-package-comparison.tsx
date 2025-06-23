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
  procedureCount: number;
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
  const actualThreshold = (typeof bulkThreshold === 'number' ? bulkThreshold : 15);
  const hasAdditionalDiscount = safeProcedureCount >= actualThreshold;
  
  // Package visual configurations - unified styling
  const packageInfo: Record<string, {
    title: string;
    icon: any;
    gradient: string;
    borderColor: string;
    bgColor: string;
  }> = {
    vip: {
      title: 'VIP',
      icon: Crown,
      gradient: 'from-gray-500 to-gray-600',
      borderColor: 'border-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20'
    },
    standard: {
      title: 'Standard',
      icon: Diamond,
      gradient: 'from-gray-500 to-gray-600',
      borderColor: 'border-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20'
    },
    economy: {
      title: 'Economy',
      icon: Shield,
      gradient: 'from-gray-500 to-gray-600',
      borderColor: 'border-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20'
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

  // Check if we have valid calculation data
  const hasValidCalculation = calculation && calculation.packages && Object.keys(calculation.packages).length > 0;

  return (
    <TooltipProvider>
      <div className="flex flex-col space-y-2 lg:space-y-3 h-full shadow-safe">
        {/* Unified Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex-1 min-h-0">
          <div className="overflow-y-auto table-scroll" style={{ height: '100%' }}>
            
            {/* Table Header with Package Names */}
            <div className="grid grid-cols-4 gap-1 lg:gap-2 p-2 lg:p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <div className="font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                Характеристика
              </div>
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
                        ? 'border-gray-400 bg-gray-200 dark:bg-gray-600 shadow-md' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => onPackageSelect(packageType)}
                  >
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Icon className="text-gray-600 dark:text-gray-400" size={14} />
                      <span className="text-xs lg:text-sm font-bold text-gray-900 dark:text-white">
                        {packageData?.name || info.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Discount Row */}
            <div className="grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                Скидка
              </div>
              {packageTypes.map((packageType) => {
                const packageData = packages.find((p: Package) => p.type === packageType);
                const isSelected = selectedPackage === packageType;
                const discountPercent = packageData ? Math.round(parseFloat(packageData.discount)) : 0;
                
                return (
                  <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-gray-100 dark:bg-gray-600 rounded-lg' : ''}`}>
                    <span className="text-xs lg:text-sm font-semibold text-green-600 dark:text-green-400">
                      {discountPercent}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Minimum Cost Row */}
            <div className="grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                Минимальная стоимость
              </div>
              {packageTypes.map((packageType) => {
                const packageData = packages.find((p: Package) => p.type === packageType);
                const isSelected = selectedPackage === packageType;
                const minCost = packageData ? parseFloat(packageData.minCost) : 0;
                
                return (
                  <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-gray-100 dark:bg-gray-600 rounded-lg' : ''}`}>
                    <span className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatPrice(minCost)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Down Payment Requirement Row */}
            <div className="grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                Мин. первоначальный взнос
              </div>
              {packageTypes.map((packageType) => {
                const packageData = packages.find((p: Package) => p.type === packageType);
                const isSelected = selectedPackage === packageType;
                const downPaymentPercent = packageData ? parseFloat(packageData.minDownPaymentPercent) : 0;
                
                return (
                  <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-gray-100 dark:bg-gray-600 rounded-lg' : ''}`}>
                    <span className="text-xs lg:text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {downPaymentPercent}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Payment Requirement Row */}
            <div className="grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                Требует полную оплату
              </div>
              {packageTypes.map((packageType) => {
                const packageData = packages.find((p: Package) => p.type === packageType);
                const isSelected = selectedPackage === packageType;
                const requiresFullPayment = packageData?.requiresFullPayment;
                
                return (
                  <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-gray-100 dark:bg-gray-600 rounded-lg' : ''}`}>
                    <div className="flex items-center justify-center">
                      {requiresFullPayment ? (
                        <div className="p-1 rounded-lg bg-green-500 mx-auto w-fit shadow">
                          <Check className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-white" />
                        </div>
                      ) : (
                        <X className="h-3 w-3 lg:h-4 lg:w-4 text-red-400 mx-auto" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gift Sessions Row */}
            <div className="grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                Подарочные процедуры
              </div>
              {packageTypes.map((packageType) => {
                const packageData = packages.find((p: Package) => p.type === packageType);
                const isSelected = selectedPackage === packageType;
                const giftSessions = packageData?.giftSessions || 0;
                
                return (
                  <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-gray-100 dark:bg-gray-600 rounded-lg' : ''}`}>
                    <span className="text-xs lg:text-sm font-semibold text-pink-600 dark:text-pink-400">
                      {giftSessions > 0 ? `+${giftSessions}` : '0'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Perks Rows */}
            {uniquePerks.map((perk, index) => {
              const IconComponent = (Icons as any)[perk.icon] || Check;
              
              return (
                <div key={perk.id} className={`grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}`}>
                  {/* Perk Name */}
                  <div className="flex items-center space-x-1 lg:space-x-2">
                    {perk.icon && perk.icon !== 'none' && (
                      <div className="p-1 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex-shrink-0">
                        <IconComponent 
                          className="h-3 w-3 lg:h-4 lg:w-4" 
                          style={{ color: perk.iconColor || '#2563eb' }}
                        />
                      </div>
                    )}
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
                            <X className="h-3 w-3 lg:h-4 lg:w-4 text-red-400 mx-auto" />
                          </div>
                        ) : (
                          <div className="text-center">
                            {perkValue.valueType === 'boolean' ? (
                              perkValue.booleanValue ? (
                                <>
                                  {perkValue.customIcon && perkValue.customIcon !== 'none' ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="p-1 rounded-lg bg-green-500 mx-auto w-fit shadow cursor-help">
                                          {React.createElement((Icons as any)[perkValue.customIcon] || Check, { 
                                            className: "h-2.5 w-2.5 lg:h-3 lg:w-3 text-white"
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
                                    <div className="p-1 rounded-lg bg-green-500 mx-auto w-fit shadow">
                                      <Check className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-white" />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-center">
                                  <X className="h-3 w-3 lg:h-4 lg:w-4 text-red-400 mx-auto" />
                                </div>
                              )
                            ) : (
                              <div className="text-center">
                                {perkValue.tooltip ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={`text-xs lg:text-sm font-semibold cursor-help ${perkValue.isHighlighted ? `font-bold text-white bg-green-500 px-2 py-1 rounded shadow` : 'text-gray-700 dark:text-gray-300'}`}>
                                        {perkValue.customIcon && perkValue.customIcon !== 'none' && (
                                          <span className="inline-block mr-1 text-green-600">
                                            {React.createElement((Icons as any)[perkValue.customIcon] || Check, { className: "h-3 w-3 inline" })}
                                          </span>
                                        )}
                                        {perkValue.displayValue}
                                        {perkValue.isBest && (
                                          <Badge className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
                                            Лучшее
                                          </Badge>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{perkValue.tooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <div className={`text-xs lg:text-sm font-semibold ${perkValue.isHighlighted ? `font-bold text-white bg-green-500 px-2 py-1 rounded shadow` : 'text-gray-700 dark:text-gray-300'}`}>
                                    {perkValue.customIcon && perkValue.customIcon !== 'none' && (
                                      <span className="inline-block mr-1 text-green-600">
                                        {React.createElement((Icons as any)[perkValue.customIcon] || Check, { className: "h-3 w-3 inline" })}
                                      </span>
                                    )}
                                    {perkValue.displayValue}
                                    {perkValue.isBest && (
                                      <Badge className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
                                        Лучшее
                                      </Badge>
                                    )}
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

            {/* Total Savings Row */}
            <div className="grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                Общая экономия
              </div>
              {packageTypes.map((packageType) => {
                const data = getPackageData(packageType);
                const isSelected = selectedPackage === packageType;
                
                return (
                  <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-green-100 dark:bg-green-800 rounded-lg' : ''}`}>
                    <span className="text-xs lg:text-sm font-bold text-green-700 dark:text-green-300">
                      {data && data.totalSavings > 0 ? formatPrice(data.totalSavings) : '-'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Cost Calculation Rows */}
            <div className="grid grid-cols-4 gap-1 lg:gap-2 py-2 lg:py-3 px-2 lg:px-3 border-b border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
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
                       (hasValidCalculation && installmentMonths > 1 ? 'Рассчитывается' : '-')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selection Buttons Row */}
            <div className="grid grid-cols-4 gap-1 lg:gap-2 py-3 lg:py-4 px-2 lg:px-3 bg-gray-100 dark:bg-gray-700">
              <div className="flex items-center font-medium text-gray-900 dark:text-white text-xs lg:text-sm">
                Выбор пакета
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
                      {isSelected ? (
                        <div className="flex items-center space-x-1">
                          <Check className="h-3 w-3" />
                          <span>Выбрано</span>
                        </div>
                      ) : (
                        <span>Выбрать</span>
                      )}
                    </Button>
                    
                    {data && !data.isAvailable && (
                      <p className="text-xs text-red-600 text-center mt-1">
                        {data.unavailableReason}
                      </p>
                    )}
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