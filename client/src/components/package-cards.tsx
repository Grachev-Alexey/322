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

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          {realPerks.length > 0 ? (
            realPerks.map((perk: any, index: number) => {
              const IconComponent = Icons[perk.icon as keyof typeof Icons] || Check;
              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <IconComponent className={`text-${packageType === 'vip' ? 'purple' : packageType === 'standard' ? 'blue' : 'green'}-600 mr-3`} size={16} />
                    <span>{perk.name}</span>
                  </div>
                  {perk.name.includes('подарочный сеанс') && (
                    <span className="font-semibold text-green-600">
                      {perk.name.includes('3') ? formatPrice(calculation.baseCost / (calculation.totalProcedures || procedureCount) * 3) :
                       perk.name.includes('1') ? formatPrice(calculation.baseCost / (calculation.totalProcedures || procedureCount)) :
                       formatPrice(calculation.baseCost / (calculation.totalProcedures || procedureCount))}
                    </span>
                  )}
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

        {/* Action Button */}
        {data.isAvailable ? (
          <Button
            className={`w-full ${
              packageType === 'vip' ? 'btn-primary' :
              packageType === 'standard' ? 'btn-secondary' :
              'btn-accent'
            }`}
            onClick={() => onPackageSelect(packageType)}
          >
            {isSelected ? 'Выбрано' : 'Выбрать пакет'}
          </Button>
        ) : (
          <div className="text-center">
            <div className="text-sm text-red-600 mb-2 font-medium">
              <AlertCircle className="inline mr-1" size={14} />
              Недоступен
            </div>
            <div className="text-xs text-red-500">
              {data.unavailableReason}
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
