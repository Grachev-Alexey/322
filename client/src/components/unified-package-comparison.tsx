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
  const hasValidCalculation = calculation && calculation.baseCost > 0;

  const getPackageData = (packageType: string): PackageData | null => {
    if (!hasValidCalculation) return null;
    return (calculation.packages as any)[packageType] || null;
  };

  const formatPrice = (price: number): string => {
    return `${Math.round(price).toLocaleString()} ₽`;
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

  const getPackageSubtitle = (packageType: string) => {
    switch (packageType) {
      case 'vip': return '(от 25 000 руб)';
      case 'standard': return 'Первый взнос: 50%, от 15 000 руб';
      case 'economy': return 'Первый взнос: менее 50%. Мин. 5 000 руб';
      default: return '';
    }
  };

  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Package Headers */}
        <div className="bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200"></div>
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
                  <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                    {getPackageSubtitle(packageType)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table Content */}
        <div className="max-h-96 overflow-y-auto">
          
          {/* Guarantee Money Back Row */}
          <div className="grid grid-cols-4 gap-2 py-3 px-4 border-b border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-900 dark:text-white">
              <div className="font-medium">Гарантия возврата денег, если нет результата</div>
              <div className="text-xs text-gray-500 mt-1">(только для абонемента)</div>
            </div>
            {packageTypes.map((packageType) => {
              const isSelected = selectedPackage === packageType;
              const hasGuarantee = packageType === 'vip' || packageType === 'standard';
              
              return (
                <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg' : ''}`}>
                  {hasGuarantee ? (
                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <span className="text-red-500 font-semibold">-</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Club Card Row */}
          <div className="grid grid-cols-4 gap-2 py-3 px-4 border-b border-gray-100 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Клубная карта навсегда
            </div>
            {packageTypes.map((packageType) => {
              const isSelected = selectedPackage === packageType;
              
              return (
                <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg' : ''}`}>
                  {packageType === 'vip' && (
                    <div className="text-xs">
                      <div className="font-semibold text-yellow-600">Золотая</div>
                      <div className="font-semibold text-gray-900 dark:text-white">35%</div>
                    </div>
                  )}
                  {packageType === 'standard' && (
                    <div className="text-xs">
                      <div className="font-semibold text-gray-500">Серебряная</div>
                      <div className="font-semibold text-gray-900 dark:text-white">30%</div>
                    </div>
                  )}
                  {packageType === 'economy' && (
                    <span className="text-red-500 font-semibold">-</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Freeze Row */}
          <div className="grid grid-cols-4 gap-2 py-3 px-4 border-b border-gray-100 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Заморозка
            </div>
            {packageTypes.map((packageType) => {
              const isSelected = selectedPackage === packageType;
              const freezeText = packageType === 'vip' ? 'бессрочно' : packageType === 'standard' ? '6 мес' : '3 мес';
              
              return (
                <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg' : ''}`}>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {freezeText}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Priority Service Row */}
          <div className="grid grid-cols-4 gap-2 py-3 px-4 border-b border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-900 dark:text-white">
              <div className="font-medium">Приоритетное обслуживание (запись/отмена в любое время, вне резерва)</div>
            </div>
            {packageTypes.map((packageType) => {
              const isSelected = selectedPackage === packageType;
              const hasPriority = packageType !== 'economy';
              
              return (
                <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg' : ''}`}>
                  {hasPriority ? (
                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <span className="text-red-500 font-semibold">-</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Premium Massage Course Row */}
          <div className="grid grid-cols-4 gap-2 py-3 px-4 border-b border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-900 dark:text-white">
              <div className="font-medium">Курс массажа вокруг глаз премиум-класса</div>
              <div className="text-xs text-gray-500 mt-1">(только для абонемента) 10 000 руб</div>
            </div>
            {packageTypes.map((packageType) => {
              const isSelected = selectedPackage === packageType;
              
              return (
                <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg' : ''}`}>
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Free Sessions Row */}
          <div className="grid grid-cols-4 gap-2 py-3 px-4 border-b border-gray-100 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Сеансы в подарок
            </div>
            {packageTypes.map((packageType) => {
              const packageData = packages.find((p: Package) => p.type === packageType);
              const isSelected = selectedPackage === packageType;
              const giftSessions = packageData?.giftSessions || 0;
              
              return (
                <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg' : ''}`}>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {giftSessions > 0 ? giftSessions : '-'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Discount Row */}
          <div className="grid grid-cols-4 gap-2 py-3 px-4 border-b border-gray-100 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Скидка
            </div>
            {packageTypes.map((packageType) => {
              const packageData = packages.find((p: Package) => p.type === packageType);
              const isSelected = selectedPackage === packageType;
              const discountPercent = packageData ? Math.round(parseFloat(packageData.discount) * 100) : 0;
              
              return (
                <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg' : ''}`}>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {discountPercent}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bonus Account Row */}
          <div className="grid grid-cols-4 gap-2 py-3 px-4 border-b border-gray-100 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Бонусный счет
            </div>
            {packageTypes.map((packageType) => {
              const packageData = packages.find((p: Package) => p.type === packageType);
              const isSelected = selectedPackage === packageType;
              const bonusPercent = packageData ? Math.round(parseFloat(packageData.bonusAccountPercent) * 100) : 0;
              
              return (
                <div key={packageType} className={`text-center py-1 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg' : ''}`}>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">
                    <div>{bonusPercent}%</div>
                    <div>+{bonusPercent}%</div>
                    <div>от стоимости</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subscription Cost Section */}
          <div className="bg-gray-50 dark:bg-gray-800 py-3 px-4">
            <div className="font-bold text-gray-900 dark:text-white text-sm mb-3">Итого стоимость абонемента</div>
            
            {/* Original Cost Row */}
            <div className="grid grid-cols-4 gap-2 py-2 border-b border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Первоначальная
              </div>
              {packageTypes.map((packageType) => {
                const isSelected = selectedPackage === packageType;
                
                return (
                  <div key={packageType} className={`text-center ${isSelected ? 'bg-white dark:bg-gray-700 rounded-lg py-1' : ''}`}>
                    <span className="text-sm text-red-500 line-through">
                      р.{calculation.baseCost.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Discount Amount Row */}
            <div className="grid grid-cols-4 gap-2 py-2">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Скидка
              </div>
              {packageTypes.map((packageType) => {
                const data = getPackageData(packageType);
                const isSelected = selectedPackage === packageType;
                
                return (
                  <div key={packageType} className={`text-center ${isSelected ? 'bg-white dark:bg-gray-700 rounded-lg py-1' : ''}`}>
                    <span className="text-sm text-green-600 dark:text-green-400">
                      {data && data.totalSavings > 0 ? `-р.${data.totalSavings.toLocaleString()}` : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate Section */}
          <div className="bg-green-50 dark:bg-green-900/20 py-3 px-4 border-t border-green-200 dark:border-green-700">
            <div className="grid grid-cols-4 gap-2 py-2">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Сертификат
              </div>
              {packageTypes.map((packageType) => {
                const isSelected = selectedPackage === packageType;
                
                return (
                  <div key={packageType} className={`text-center ${isSelected ? 'bg-green-100 dark:bg-green-800 rounded-lg py-1' : ''}`}>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      -р.3 000
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Cost Row */}
          <div className="grid grid-cols-4 gap-2 py-3 px-4 border-b border-gray-100 dark:border-gray-700">
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              Итого стоимость курса:
            </div>
            {packageTypes.map((packageType) => {
              const data = getPackageData(packageType);
              const isSelected = selectedPackage === packageType;
              
              return (
                <div key={packageType} className={`text-center ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg py-1' : ''}`}>
                  <div className="text-sm">
                    <div className="font-bold text-blue-700 dark:text-blue-300">
                      {data && data.finalCost ? `р.${data.finalCost.toLocaleString()}` : 'Выберите услуги'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {data && data.monthlyPayment ? `р.${data.monthlyPayment.toLocaleString()}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 dark:bg-gray-800 py-3 px-4">
            {/* Down Payment Row */}
            <div className="grid grid-cols-4 gap-2 py-2 border-b border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Первый взнос:
              </div>
              {packageTypes.map((packageType) => {
                const isSelected = selectedPackage === packageType;
                
                return (
                  <div key={packageType} className={`text-center ${isSelected ? 'bg-white dark:bg-gray-700 rounded-lg py-1' : ''}`}>
                    <span className="text-sm text-gray-900 dark:text-white">
                      р.{downPayment.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Monthly Payment Row */}
            <div className="grid grid-cols-4 gap-2 py-2">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Платеж в месяц
              </div>
              {packageTypes.map((packageType) => {
                const data = getPackageData(packageType);
                const isSelected = selectedPackage === packageType;
                
                return (
                  <div key={packageType} className={`text-center ${isSelected ? 'bg-white dark:bg-gray-700 rounded-lg py-1' : ''}`}>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {data && data.monthlyPayment ? `р.${data.monthlyPayment.toLocaleString()}` : '0'}
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
            <div className="grid grid-cols-4 gap-2 py-2 border-b border-blue-200 dark:border-blue-700">
              <div className="text-sm text-gray-900 dark:text-white">
                Стоимость подарочных процедур
              </div>
              {packageTypes.map((packageType) => {
                const data = getPackageData(packageType);
                const packageData = packages.find((p: Package) => p.type === packageType);
                const isSelected = selectedPackage === packageType;
                
                // Calculate gift procedures value
                const giftValue = data && packageData && (packageData.giftSessions || 0) > 0 && calculation.totalProcedures > 0
                  ? (data.finalCost / calculation.totalProcedures) * (packageData.giftSessions || 0)
                  : 0;
                
                return (
                  <div key={packageType} className={`text-center ${isSelected ? 'bg-blue-200 dark:bg-blue-800 rounded-lg py-1' : ''}`}>
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {giftValue > 0 ? `р.${Math.round(giftValue).toLocaleString()}` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bonus Account Row */}
            <div className="grid grid-cols-4 gap-2 py-2 border-b border-blue-200 dark:border-blue-700">
              <div className="text-sm text-gray-900 dark:text-white">
                Бонусный счет
              </div>
              {packageTypes.map((packageType) => {
                const data = getPackageData(packageType);
                const packageData = packages.find((p: Package) => p.type === packageType);
                const isSelected = selectedPackage === packageType;
                
                const bonusPercent = packageData ? parseFloat(packageData.bonusAccountPercent) : 0;
                const bonusAmount = data && bonusPercent > 0 ? (data.finalCost * bonusPercent) : 0;
                
                return (
                  <div key={packageType} className={`text-center ${isSelected ? 'bg-blue-200 dark:bg-blue-800 rounded-lg py-1' : ''}`}>
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {bonusAmount > 0 ? `${Math.round(bonusAmount).toLocaleString()}` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Total Gifts Value Row */}
            <div className="grid grid-cols-4 gap-2 py-2">
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
                
                const totalGifts = giftValue + bonusAmount;
                
                return (
                  <div key={packageType} className={`text-center ${isSelected ? 'bg-blue-200 dark:bg-blue-800 rounded-lg py-1' : ''}`}>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      {totalGifts > 0 ? `р.${Math.round(totalGifts).toLocaleString()}` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selection Buttons */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-3">
            {packageTypes.map((packageType) => {
              const data = getPackageData(packageType);
              const isSelected = selectedPackage === packageType;
              const isAvailable = data?.isAvailable !== false;
              
              return (
                <Button
                  key={packageType}
                  onClick={() => onPackageSelect(packageType)}
                  disabled={!isAvailable}
                  className={`h-auto py-3 px-4 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform scale-105'
                      : isAvailable
                      ? 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold">{getPackageName(packageType)}</div>
                    {data && isAvailable && (
                      <div className="text-xs mt-1 opacity-75">
                        {formatPrice(data.finalCost)}
                      </div>
                    )}
                    {!isAvailable && data?.unavailableReason && (
                      <div className="text-xs mt-1 text-red-500">
                        {data.unavailableReason}
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}