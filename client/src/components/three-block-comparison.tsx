import { Crown, Star, Leaf, Gift } from "lucide-react";
import * as Icons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface Package {
  id: number;
  type: string;
  name: string;
  discount: number;
  giftSessions: number;
  bonusAccountPercent: number;
}

interface PackagePerkValue {
  packageType: string;
  perkId: number;
  valueType: string;
  booleanValue?: boolean;
  textValue?: string;
  numberValue?: number;
  displayValue: string;
  tooltip?: string;
  perk: {
    id: number;
    name: string;
    icon: string;
    iconColor?: string;
    displayOrder?: number;
  };
}

interface SelectedService {
  serviceId: number;
  title: string;
  pricePerProcedure: number;
  quantity: number;
}

interface ThreeBlockComparisonProps {
  calculation: any;
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
  selectedServices?: SelectedService[];
}

export default function ThreeBlockComparison({
  calculation,
  selectedPackage,
  onPackageSelect,
  packages,
  downPayment,
  installmentMonths,
  procedureCount,
  packagePerkValues = [],
  usedCertificate = false,
  freeZones = [],
  selectedServices = [],
}: ThreeBlockComparisonProps) {
  const packageTypes = ["vip", "standard", "economy"];
  const hasValidCalculation = calculation && calculation.baseCost > 0;

  const getPackageData = (packageType: string) => {
    if (!hasValidCalculation) return null;
    return (calculation.packages as any)[packageType] || null;
  };

  const getPackageIcon = (packageType: string) => {
    switch (packageType) {
      case "vip": return Crown;
      case "standard": return Star;
      case "economy": return Leaf;
      default: return Star;
    }
  };

  const getPackageName = (packageType: string) => {
    switch (packageType) {
      case "vip": return "VIP";
      case "standard": return "Стандарт";
      case "economy": return "Эконом";
      default: return "Стандарт";
    }
  };

  const getPackageColor = (packageType: string) => {
    switch (packageType) {
      case "vip": return "from-yellow-400 to-yellow-600";
      case "standard": return "from-blue-400 to-blue-600";
      case "economy": return "from-green-400 to-green-600";
      default: return "from-blue-400 to-blue-600";
    }
  };

  // Get unique perks for display
  const uniquePerks = Array.from(
    new Map(packagePerkValues.map((pv) => [pv.perk.id, pv.perk])).values(),
  ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const calculateGiftCost = (packageType: string) => {
    if (!selectedServices.length || !hasValidCalculation) return 0;
    
    const packageData = packages.find(p => p.type === packageType);
    const giftSessions = packageData?.giftSessions || 0;
    
    if (giftSessions === 0) return 0;
    
    const totalBaseCost = selectedServices.reduce((sum, service) => {
      return sum + (service.pricePerProcedure * service.quantity);
    }, 0);
    
    return totalBaseCost * giftSessions;
  };

  const calculateFreeCost = (packageType: string) => {
    if (!freeZones.length) return 0;
    
    return freeZones.reduce((sum, zone) => {
      return sum + (zone.pricePerProcedure * zone.quantity);
    }, 0);
  };

  const calculateBonusAmount = (packageType: string) => {
    const packageData = packages.find(p => p.type === packageType);
    const packageCalcData = getPackageData(packageType);
    
    if (!packageData || !packageCalcData) return 0;
    
    const bonusPercent = packageData.bonusAccountPercent || 0;
    return packageCalcData.finalCost * (bonusPercent / 100);
  };

  if (!hasValidCalculation) {
    return (
      <div className="text-center p-8 text-gray-500">
        Выберите услуги для просмотра сравнения пакетов
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-5xl mx-auto p-4">
      {/* Package Headers */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div></div>
        {packageTypes.map((packageType) => {
          const Icon = getPackageIcon(packageType);
          const isSelected = selectedPackage === packageType;
          
          return (
            <div
              key={packageType}
              className={`text-center cursor-pointer transition-all duration-200 rounded-lg p-3 ${
                isSelected
                  ? "bg-white shadow-lg transform scale-105 border-2 border-blue-300"
                  : "bg-white/70 hover:bg-white hover:shadow-md"
              }`}
              onClick={() => onPackageSelect(packageType)}
            >
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${getPackageColor(packageType)} mb-2`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="font-bold text-gray-800 text-sm">
                {getPackageName(packageType)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Преимущества with curved border */}
      <div className="relative bg-white overflow-hidden" style={{ borderRadius: '24px' }}>
        {/* Custom curved border using SVG */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <path 
              id="curved-border-blue" 
              d="M 8,0 L 88,0 Q 96,0 96,8 L 96,92 Q 96,100 88,100 L 8,100 Q 0,100 0,92 L 0,8 Q 0,0 8,0 Z"
              fill="none"
              stroke="#93c5fd"
              strokeWidth="0.4"
              vectorEffect="non-scaling-stroke"
            />
            <mask id="title-mask-blue">
              <rect width="100%" height="100%" fill="white"/>
              <rect x="12%" y="-2%" width="28%" height="8%" fill="black"/>
            </mask>
          </defs>
          <use href="#curved-border-blue" mask="url(#title-mask-blue)"/>
        </svg>
        
        {/* Title with star icon */}
        <div className="absolute -top-0.5 left-6 bg-white px-4 py-1 z-10">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-gray-800">Преимущества</span>
          </div>
        </div>
        
        <div className="pt-8 p-6 relative z-0">
          <div className="space-y-3">
            {uniquePerks.map((perk) => {
              const IconComponent = (Icons as any)[perk.icon] || Star;
              
              return (
                <div key={perk.id} className="grid grid-cols-4 gap-4 py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <IconComponent className="w-4 h-4" style={{ color: perk.iconColor || '#666' }} />
                    <span>{perk.name}</span>
                  </div>
                  {packageTypes.map((packageType) => {
                    const perkValue = packagePerkValues.find(
                      (pv) => pv.packageType === packageType && pv.perkId === perk.id
                    );
                    
                    let displayContent = perkValue?.displayValue || "-";
                    if (displayContent === "✓") {
                      displayContent = <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>;
                    }
                    
                    return (
                      <div key={packageType} className="text-center flex justify-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {displayContent}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Стоимость with curved border */}
      <div className="relative bg-white overflow-hidden" style={{ borderRadius: '24px' }}>
        {/* Custom curved border using SVG */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <path 
              id="curved-border-green" 
              d="M 8,0 L 88,0 Q 96,0 96,8 L 96,92 Q 96,100 88,100 L 8,100 Q 0,100 0,92 L 0,8 Q 0,0 8,0 Z"
              fill="none"
              stroke="#86efac"
              strokeWidth="0.4"
              vectorEffect="non-scaling-stroke"
            />
            <mask id="title-mask-green">
              <rect width="100%" height="100%" fill="white"/>
              <rect x="12%" y="-2%" width="22%" height="8%" fill="black"/>
            </mask>
          </defs>
          <use href="#curved-border-green" mask="url(#title-mask-green)"/>
        </svg>
        
        {/* Title with money icon */}
        <div className="absolute -top-0.5 left-6 bg-white px-4 py-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <span className="font-bold text-gray-800">Стоимость</span>
          </div>
        </div>
        
        <div className="pt-8 p-6 space-y-3">

          {/* Первоначальная стоимость */}
          <div className="grid grid-cols-4 gap-4 py-2 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-700">Первоначальная</div>
            {packageTypes.map((packageType) => (
              <div key={packageType} className="text-center">
                <span className="text-sm font-semibold text-red-500 line-through">
                  {formatPrice(calculation.baseCost)}
                </span>
              </div>
            ))}
          </div>

          {/* Скидка */}
          <div className="grid grid-cols-4 gap-4 py-2 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-700">Скидка</div>
            {packageTypes.map((packageType) => {
              const packageData = getPackageData(packageType);
              const discount = packageData ? calculation.baseCost - packageData.finalCost : 0;
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-sm font-semibold text-green-600">
                    -{formatPrice(discount)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Сертификат */}
          {usedCertificate && (
            <div className="grid grid-cols-4 gap-4 py-2 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-700">Сертификат</div>
              {packageTypes.map((packageType) => (
                <div key={packageType} className="text-center">
                  <span className="text-sm font-semibold text-green-600">-3 000 ₽</span>
                </div>
              ))}
            </div>
          )}

          {/* Итого стоимость курса */}
          <div className="grid grid-cols-4 gap-4 py-3 border-t-2 border-green-200 mt-2">
            <div className="text-base font-bold text-gray-800">Итого стоимость курса:</div>
            {packageTypes.map((packageType) => {
              const packageData = getPackageData(packageType);
              const finalCost = packageData?.finalCost || 0;
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-base font-bold text-pink-600">
                    {formatPrice(finalCost)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Первый взнос */}
          <div className="grid grid-cols-4 gap-4 py-2">
            <div className="text-sm text-gray-600">Первый взнос:</div>
            {packageTypes.map((packageType) => {
              return (
                <div key={packageType} className="text-center">
                  <span className="text-sm text-gray-600">
                    {formatPrice(downPayment)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Платеж в месяц */}
          {installmentMonths > 0 && (
            <div className="grid grid-cols-4 gap-4 py-2">
              <div className="text-sm text-gray-600">Платеж в месяц</div>
              {packageTypes.map((packageType) => {
                const packageData = getPackageData(packageType);
                const monthlyPayment = packageData?.monthlyPayment || 0;
                
                return (
                  <div key={packageType} className="text-center">
                    <span className="text-sm text-gray-600">
                      {formatPrice(monthlyPayment)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Подарки with curved border */}
      <div className="relative bg-white overflow-hidden" style={{ borderRadius: '24px' }}>
        {/* Custom curved border using SVG */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <path 
              id="curved-border" 
              d="M 8,0 L 88,0 Q 96,0 96,8 L 96,92 Q 96,100 88,100 L 8,100 Q 0,100 0,92 L 0,8 Q 0,0 8,0 Z"
              fill="none"
              stroke="#f9a8d4"
              strokeWidth="0.4"
              vectorEffect="non-scaling-stroke"
            />
            <mask id="title-mask">
              <rect width="100%" height="100%" fill="white"/>
              <rect x="12%" y="-2%" width="25%" height="8%" fill="black"/>
            </mask>
          </defs>
          <use href="#curved-border" mask="url(#title-mask)"/>
        </svg>
        
        {/* Title with gift icon */}
        <div className="absolute -top-0.5 left-6 bg-white px-4 py-1 z-10">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-pink-500" />
            <span className="font-bold text-gray-800">Подарки</span>
          </div>
        </div>
        
        <div className="pt-8 p-6 space-y-3 relative z-0">
          {/* Стоимость подарочных процедур */}
          <div className="grid grid-cols-4 gap-4 py-2 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-700">Стоимость подарочных процедур</div>
            {packageTypes.map((packageType) => {
              const giftCost = calculateGiftCost(packageType);
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-sm font-semibold text-gray-700">
                    {giftCost > 0 ? formatPrice(giftCost) : "-"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Стоимость бесплатных зон */}
          <div className="grid grid-cols-4 gap-4 py-2 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-700">Стоимость бесплатных зон</div>
            {packageTypes.map((packageType) => {
              const freeCost = calculation?.freeZonesValue || 800;
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-sm font-semibold text-gray-700">
                    {formatPrice(freeCost)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Бонусный счет */}
          <div className="grid grid-cols-4 gap-4 py-2 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-700">Бонусный счет</div>
            {packageTypes.map((packageType) => {
              const bonusAmount = calculateBonusAmount(packageType);
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-sm font-semibold text-gray-700">
                    {bonusAmount > 0 ? formatPrice(bonusAmount) : "-"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Итого стоимость подарков */}
          <div className="grid grid-cols-4 gap-4 py-3 border-t-2 border-pink-200 mt-2">
            <div className="text-base font-bold text-gray-800">Итого стоимость подарков:</div>
            {packageTypes.map((packageType) => {
              const giftCost = calculateGiftCost(packageType);
              const freeCost = calculation?.freeZonesValue || 800;
              const bonusAmount = calculateBonusAmount(packageType);
              const totalGifts = giftCost + freeCost + bonusAmount;
              
              return (
                <div key={packageType} className="text-center">
                  <span className="text-base font-bold text-pink-600">
                    {formatPrice(totalGifts)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}