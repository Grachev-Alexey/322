import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Leaf, AlertCircle } from "lucide-react";
import * as Icons from "lucide-react";
import { formatPrice, getPackageIcon, getPackageColor } from "@/lib/utils";
import { usePackagePerks } from "@/hooks/use-package-perks";
import { useQuery } from "@tanstack/react-query";

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

interface PackageCardsProps {
  calculation: Calculation;
  selectedPackage: string | null;
  onPackageSelect: (packageType: string) => void;
  procedureCount: number;
  packages: any[];
}

const packageInfo = {
  vip: {
    title: "VIP",
    subtitle: "Максимум привилегий",
    icon: Crown,
    color: "from-purple-500 to-purple-600",
    benefits: [
      "Скидка 30%",
      "3 подарочных сеанса",
      "Гарантия возврата денег",
      "Клубная карта 'Золотая 35%'",
      "Бессрочная заморозка",
      "Персональный менеджер"
    ]
  },
  standard: {
    title: "Стандарт",
    subtitle: "Лучшее соотношение",
    icon: Star,
    color: "from-blue-500 to-blue-600",
    benefits: [
      "Скидка 25%",
      "1 подарочный сеанс",
      "Гарантия качества",
      "Клубная карта 'Серебряная 30%'",
      "Заморозка до 6 месяцев",
      "Курс массажа"
    ]
  },
  economy: {
    title: "Эконом",
    subtitle: "Оптимальный старт",
    icon: Leaf,
    color: "from-green-500 to-green-600",
    benefits: [
      "Скидка 20%",
      "Заморозка до 3 месяцев",
      "Курс массажа"
    ]
  }
};

export default function PackageCards({ 
  calculation, 
  selectedPackage, 
  onPackageSelect,
  procedureCount,
  packages 
}: PackageCardsProps) {
  const getPackageCard = (packageType: keyof typeof packageInfo) => {
    const info = packageInfo[packageType];
    const data = calculation.packages[packageType];
    const packageData = packages.find(p => p.type === packageType);
    const Icon = info.icon;
    const isSelected = selectedPackage === packageType;
    const isPopular = packageType === 'standard';
    
    // Get actual discount percentage from database
    const discountPercent = packageData ? Math.round(parseFloat(packageData.discount) * 100) : 0;
    
    // Fetch real perks from database
    const { data: realPerks = [] } = useQuery({
      queryKey: [`/api/packages/${packageType}/perks`],
      enabled: true,
      staleTime: 0,
      cacheTime: 0
    });

    return (
      <div
        key={packageType}
        className={`
          relative card-premium p-8 transition-all duration-200 cursor-pointer
          ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
          ${isPopular ? 'transform scale-105 shadow-xl border-2 border-blue-200' : ''}
          ${!data.isAvailable ? 'opacity-75' : ''}
        `}
        onClick={() => data.isAvailable && onPackageSelect(packageType)}
      >
        {/* Popular Badge */}
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              Популярный
            </Badge>
          </div>
        )}

        {/* VIP Crown */}
        {packageType === 'vip' && (
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-bl-full flex items-end justify-start pl-2 pb-2">
            <Crown className="text-white" size={16} />
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${info.color} rounded-full flex items-center justify-center`}>
            <Icon className="text-white text-2xl" size={24} />
          </div>
          <h4 className="text-2xl font-bold text-gray-900">{packageData?.name || info.title}</h4>
          <p className="text-gray-600">{info.subtitle}</p>
          
          {/* Prominent discount display */}
          <div className={`mt-3 inline-block px-4 py-2 rounded-full text-white font-bold text-lg bg-gradient-to-r ${info.color}`}>
            Скидка {discountPercent}%
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-gray-900">
              {formatPrice(data.finalCost)}
            </div>
            <div className="text-sm text-gray-500 line-through">
              {formatPrice(calculation.baseCost)}
            </div>
          </div>

          <div className={`bg-${packageType === 'vip' ? 'purple' : packageType === 'standard' ? 'blue' : 'green'}-50 rounded-lg p-4 mb-4`}>
            <div className="text-center">
              <div className={`text-xl font-bold text-${packageType === 'vip' ? 'purple' : packageType === 'standard' ? 'blue' : 'green'}-600`}>
                Экономия: {formatPrice(data.totalSavings)}
              </div>
              {data.totalSavings > calculation.baseCost * 0.3 && (
                <div className={`text-sm text-${packageType === 'vip' ? 'purple' : packageType === 'standard' ? 'blue' : 'green'}-600`}>
                  + подарки на {formatPrice(calculation.freeZonesValue)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gift Sessions */}
        {packageData && packageData.giftSessions > 0 && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center">
              <Gift className="text-pink-600 mr-2" size={16} />
              <span className="text-sm font-medium text-pink-800">
                {packageData.giftSessions} подарочн{packageData.giftSessions === 1 ? 'ый сеанс' : packageData.giftSessions < 5 ? 'ых сеанса' : 'ых сеансов'}
              </span>
            </div>
            <div className="text-xs text-pink-600 text-center mt-1">
              Стоимость: {formatPrice(calculation.baseCost / (calculation.totalProcedures || procedureCount) * packageData.giftSessions)}
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          {realPerks.length > 0 ? (
            realPerks.map((perk: any, index: number) => {
              const IconComponent = Icons[perk.icon as keyof typeof Icons] || Check;
              const iconColor = perk.iconColor || (packageType === 'vip' ? '#8B5CF6' : packageType === 'standard' ? '#3B82F6' : '#10B981');
              const textColor = perk.textColor || '#374151';
              
              return (
                <div key={index} className={`flex items-center justify-between text-sm ${
                  perk.displayType === 'highlighted' ? 'bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-lg border border-blue-200' : ''
                }`}>
                  <div className="flex items-center">
                    <IconComponent 
                      style={{ color: iconColor }}
                      className="mr-3" 
                      size={16} 
                    />
                    <span style={{ color: textColor }} className={perk.displayType === 'highlighted' ? 'font-medium' : ''}>{perk.name}</span>
                  </div>
                </div>
              );
            })
          ) : (
            info.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center text-sm">
                <Check className={`text-${packageType === 'vip' ? 'purple' : packageType === 'standard' ? 'blue' : 'green'}-600 mr-3`} size={16} />
                <span>{benefit}</span>
              </div>
            ))
          )}
        </div>

        {/* Special Requirements */}
        {packageType === 'vip' && (
          <div className="bg-yellow-50 rounded-lg p-3 mb-4">
            <div className="text-center text-sm text-yellow-700 font-medium">
              <AlertCircle className="inline mr-1" size={14} />
              Требуется 100% предоплата
            </div>
          </div>
        )}

        {/* Monthly Payment */}
        {data.monthlyPayment > 0 && packageType !== 'vip' && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Ежемесячный платеж</div>
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(data.monthlyPayment)}
              </div>
            </div>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-grow"></div>

        {/* Action Button */}
        {data.isAvailable ? (
          <Button
            className={`w-full mt-4 ${
              packageType === 'vip' ? 'btn-primary' :
              packageType === 'standard' ? 'btn-secondary' :
              'btn-accent'
            }`}
            onClick={() => onPackageSelect(packageType)}
          >
            {isSelected ? 'Выбрано' : 'Выбрать пакет'}
          </Button>
        ) : (
          <div className="mt-4 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-gray-300 rounded-full p-3 mb-3">
                <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-gray-700 mb-1">
                Пакет недоступен
              </div>
              <div className="text-xs text-gray-600">
                {data.unavailableReason}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 mb-4">Выберите ваш пакет</h3>
        <p className="text-lg text-gray-600">Каждый пакет включает уникальные преимущества и выгоды</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {getPackageCard('economy')}
        {getPackageCard('standard')}
        {getPackageCard('vip')}
      </div>
    </div>
  );
}
