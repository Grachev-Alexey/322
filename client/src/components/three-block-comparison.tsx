import { Crown, Star, Leaf, Gift, Check, Minus } from "lucide-react";
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
  calculatorSettings?: any;
  freeZones?: Array<{
    serviceId: number;
    title: string;
    pricePerProcedure: number;
    quantity: number;
  }>;
  selectedServices?: SelectedService[];
  bulkDiscountThreshold?: number;
  bulkDiscountPercentage?: number;
  correctionPercent?: number;
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
  calculatorSettings,
  freeZones = [],
  selectedServices = [],
  bulkDiscountThreshold = 15,
  bulkDiscountPercentage = 0.025,
  correctionPercent = 0,
}: ThreeBlockComparisonProps) {
  const packageTypes = ["vip", "standard", "economy"];
  const hasValidCalculation = calculation && calculation.baseCost > 0;

  const getPackageData = (packageType: string) => {
    if (!hasValidCalculation) return null;
    return (calculation.packages as any)[packageType] || null;
  };

  const getPackageIcon = (packageType: string) => {
    switch (packageType) {
      case "vip":
        return Crown;
      case "standard":
        return Star;
      case "economy":
        return Leaf;
      default:
        return Star;
    }
  };

  // Calculate final discount percentage with additional discounts
  const getFinalDiscountPercent = (packageType: string) => {
    const packageData = packages.find((p) => p.type === packageType);
    if (!packageData) return 0;

    let baseDiscountPercent = parseFloat(packageData.discount) * 100;
    
    // Add bulk discount using admin settings
    if (procedureCount >= bulkDiscountThreshold) {
      baseDiscountPercent += bulkDiscountPercentage * 100;
    }
    
    // Add correction percentage (master adjustment)
    baseDiscountPercent += correctionPercent;
    
    return Math.round(baseDiscountPercent);
  };

  const getPackageName = (packageType: string) => {
    switch (packageType) {
      case "vip":
        return "VIP";
      case "standard":
        return "Стандарт";
      case "economy":
        return "Эконом";
      default:
        return "Стандарт";
    }
  };

  const getPackageColor = (packageType: string) => {
    switch (packageType) {
      case "vip":
        return "from-yellow-400 to-yellow-600";
      case "standard":
        return "from-blue-400 to-blue-600";
      case "economy":
        return "from-green-400 to-green-600";
      default:
        return "from-blue-400 to-blue-600";
    }
  };

  // Get unique perks for display
  const uniquePerks = Array.from(
    new Map(packagePerkValues.map((pv) => [pv.perk.id, pv.perk])).values(),
  ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const calculateGiftCost = (packageType: string) => {
    if (!selectedServices.length || !hasValidCalculation) return 0;

    const packageData = packages.find((p) => p.type === packageType);
    const giftSessions = packageData?.giftSessions || 0;

    if (giftSessions === 0) return 0;

    const totalBaseCost = selectedServices.reduce((sum, service) => {
      return sum + service.pricePerProcedure * service.quantity;
    }, 0);

    return totalBaseCost * giftSessions;
  };

  const calculateFreeCost = (packageType: string) => {
    if (!freeZones.length) return 0;

    return freeZones.reduce((sum, zone) => {
      return sum + zone.pricePerProcedure * zone.quantity;
    }, 0);
  };

  const calculateBonusAmount = (packageType: string) => {
    const packageData = packages.find((p) => p.type === packageType);
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
    <div className="space-y-3 w-full max-w-4xl p-1">
      {/* Преимущества with curved border */}
      <div
        className="relative overflow-hidden border border-pink-300/50"
        style={{ borderRadius: "6px" }}
      >


        {/* Title and Package Headers grid layout */}
        <div className="pt-2.5 px-3 mb-2">
          {/* Title with star icon and package headers in grid */}
          <div className="grid grid-cols-4 gap-2.5 items-center p-1">
            {/* Title with star icon */}
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-yellow-500" />
              <span className="font-bold text-gray-800 text-xs">
                Преимущества
              </span>
            </div>

            {/* Package Headers - contained within grid cells */}
            {packageTypes.map((packageType) => {
              const Icon = getPackageIcon(packageType);
              const isSelected =
                selectedPackage === packageType && selectedPackage !== null;

              return (
                <div key={packageType} className="text-center">
                  <div
                    className="cursor-pointer transition-all duration-200 p-1"
                    onClick={() => onPackageSelect(packageType)}
                  >
                    <div
                      className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded bg-gradient-to-r ${getPackageColor(packageType)} mb-0.5`}
                    >
                      <Icon className="h-2 w-2 text-white" />
                    </div>
                    <div className="font-bold text-gray-800 text-xs">
                      {getPackageName(packageType)}
                    </div>
                    {/* Dot indicator under selected package */}
                    {isSelected && (
                      <div className="flex justify-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-3 pb-2.5 relative z-0">
          <div className="space-y-0.5">
            {uniquePerks.map((perk) => {
              const IconComponent = (Icons as any)[perk.icon] || Star;

              return (
                <div
                  key={perk.id}
                  className="grid grid-cols-4 gap-2.5 py-1 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center text-xs font-medium text-gray-700">
                    <span>{perk.name}</span>
                  </div>
                  {packageTypes.map((packageType) => {
                    const perkValue = packagePerkValues.find(
                      (pv) =>
                        pv.packageType === packageType && pv.perkId === perk.id,
                    );

                    let displayContent;
                    
                    if (!perkValue) {
                      displayContent = (
                        <Minus className="w-3 h-3 text-red-500" strokeWidth={1} />
                      );
                    } else if (perkValue.valueType === "boolean") {
                      displayContent = perkValue.booleanValue ? (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <Minus className="w-3 h-3 text-red-500" strokeWidth={1} />
                      );
                    } else if (perkValue.displayValue === "Включено") {
                      displayContent = (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      );
                    } else if (perkValue.displayValue === "✓") {
                      displayContent = (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      );
                    } else if (perkValue.displayValue === "-" || !perkValue.displayValue) {
                      displayContent = (
                        <Minus className="w-3 h-3 text-red-500" strokeWidth={1} />
                      );
                    } else {
                      displayContent = (
                        <span className="text-xs font-semibold text-gray-700">
                          {perkValue.displayValue}
                        </span>
                      );
                    }

                    return (
                      <div
                        key={packageType}
                        className="flex items-center justify-center"
                      >
                        {displayContent}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Free Sessions Row */}
            <div className="grid grid-cols-4 gap-2.5 py-1 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-700">
                Сеансы в подарок
              </div>
              {packageTypes.map((packageType) => {
                const packageData = packages.find(
                  (p) => p.type === packageType,
                );
                const giftSessions = packageData?.giftSessions || 0;

                return (
                  <div key={packageType} className="flex items-center justify-center">
                    {giftSessions > 0 ? (
                      <span className="text-xs font-bold text-gray-800">
                        {giftSessions}
                      </span>
                    ) : (
                      <Minus className="w-3 h-3 text-red-500" strokeWidth={1} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Discount Row */}
            <div className="grid grid-cols-4 gap-2.5 py-1 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-700">Скидка</div>
              {packageTypes.map((packageType) => {
                const finalDiscountPercent = getFinalDiscountPercent(packageType);

                return (
                  <div key={packageType} className="flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">
                      {finalDiscountPercent}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bonus Account Row */}
            <div className="grid grid-cols-4 gap-2.5 py-1 border-b border-gray-100 last:border-b-0">
              <div className="text-xs font-medium text-gray-700">
                Бонусный счет
              </div>
              {packageTypes.map((packageType) => {
                const packageData = packages.find(
                  (p) => p.type === packageType,
                );
                const bonusPercent = packageData
                  ? Math.round(
                      parseFloat(packageData.bonusAccountPercent) * 100,
                    )
                  : 0;

                return (
                  <div key={packageType} className="flex items-center justify-center">
                    {bonusPercent > 0 ? (
                      <div className="text-xs font-semibold text-gray-700 text-center">
                        <div>{bonusPercent}%</div>
                        <div className="text-xs text-gray-500">от стоимости</div>
                      </div>
                    ) : (
                      <Minus className="w-3 h-3 text-red-500" strokeWidth={1} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Стоимость with curved border */}
      <div
        className="relative overflow-hidden border border-pink-300/50"
        style={{ borderRadius: "6px" }}
      >


        <div className="pt-2.5 px-3 space-y-0.5">
          {/* Title with money icon */}
          <div className="grid grid-cols-4 gap-2.5 items-center p-1 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💰</span>
              <span className="font-bold text-gray-800 text-xs">Стоимость</span>
            </div>
            <div></div>
            <div></div>
            <div></div>
          </div>

          {/* Первоначальная стоимость */}
          <div className="grid grid-cols-4 gap-2.5 py-1 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-700">
              Первоначальная
            </div>
            {packageTypes.map((packageType) => (
              <div key={packageType} className="text-center">
                <span className="text-xs font-semibold text-red-500 line-through">
                  {formatPrice(calculation.baseCost)}
                </span>
              </div>
            ))}
          </div>

          {/* Скидка */}
          <div className="grid grid-cols-4 gap-2.5 py-1 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-700">Скидка</div>
            {packageTypes.map((packageType) => {
              const packageData = getPackageData(packageType);
              const discount = packageData
                ? calculation.baseCost - packageData.finalCost
                : 0;

              return (
                <div key={packageType} className="text-center">
                  <span className="text-xs font-semibold text-green-600">
                    -{formatPrice(discount)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Сертификат */}
          {usedCertificate && (
            <div className="grid grid-cols-4 gap-2.5 py-1 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-700">
                Сертификат
              </div>
              {packageTypes.map((packageType) => (
                <div key={packageType} className="text-center">
                  <span className="text-xs font-semibold text-green-600">
                    -3 000 ₽
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Итого стоимость курса */}
          <div className="grid grid-cols-4 gap-2.5 py-1.5 mt-0.5">
            <div className="text-xs font-bold text-gray-800">
              Итого:
            </div>
            {packageTypes.map((packageType) => {
              const packageData = getPackageData(packageType);
              const finalCost = packageData?.finalCost || 0;

              return (
                <div key={packageType} className="text-center">
                  <span className="text-xs font-bold text-pink-400">
                    {formatPrice(finalCost)}
                  </span>
                </div>
              );
            })}
          </div>



        </div>
      </div>

      {/* Первый взнос и Платеж в месяц - вынесены за пределы блока */}
      <div className="space-y-0.5 -mt-3">
        {/* Первый взнос */}
        <div className="grid grid-cols-4 gap-2.5 py-1">
          <div className="text-xs text-gray-600">Первый взнос:</div>
          {packageTypes.map((packageType) => {
            const packageData = getPackageData(packageType);
            const pkg = packages.find(p => p.type === packageType);
            let displayAmount = downPayment;
            
            // Логика для VIP пакета
            if (packageType === 'vip') {
              // Если VIP выбран, показываем значение слайдера (полную стоимость)
              if (selectedPackage === 'vip') {
                displayAmount = downPayment; // Для VIP это всегда полная стоимость
              } 
              // Если выбран другой пакет (стандарт/эконом) или не выбран - показываем полную стоимость VIP
              else {
                displayAmount = packageData?.finalCost || 0;
              }
            }
            // Логика для остальных пакетов (стандарт и эконом)
            else {
              // Если пакет не выбран, показываем минимальный взнос для этого пакета
              if (!selectedPackage && packageData && pkg) {
                // Используем minDownPaymentPercent из настроек пакета
                const minDownPaymentPercent = parseFloat(pkg.minDownPaymentPercent);
                const calculatedMinPayment = Math.round(packageData.finalCost * minDownPaymentPercent);
                // Применяем абсолютный минимум из настроек
                const absoluteMinimum = calculatorSettings?.minimumDownPayment || 25000;
                displayAmount = Math.max(calculatedMinPayment, absoluteMinimum);
              }
              // Если выбран любой пакет (стандарт или эконом), показываем значение слайдера во всех невип пакетах
              else if (selectedPackage && (selectedPackage === 'standard' || selectedPackage === 'economy')) {
                displayAmount = downPayment;
              }
              // Если выбран VIP, показываем минимальный взнос для этого пакета
              else if (selectedPackage === 'vip' && packageData && pkg) {
                const minDownPaymentPercent = parseFloat(pkg.minDownPaymentPercent);
                const calculatedMinPayment = Math.round(packageData.finalCost * minDownPaymentPercent);
                const absoluteMinimum = calculatorSettings?.minimumDownPayment || 25000;
                displayAmount = Math.max(calculatedMinPayment, absoluteMinimum);
              }
            }
            
            return (
              <div key={packageType} className="text-center">
                <span className="text-xs text-gray-600">
                  {formatPrice(displayAmount)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Платеж в месяц */}
        {installmentMonths > 0 && (
          <div className="grid grid-cols-4 gap-2.5 py-1">
            <div className="text-xs text-gray-600">Платеж в месяц</div>
            {packageTypes.map((packageType) => {
              const packageData = getPackageData(packageType);
              const pkg = packages.find(p => p.type === packageType);
              let monthlyPayment = packageData?.monthlyPayment || 0;
              
              // Если пакет не выбран, рассчитываем ежемесячный платеж для показа
              if (!selectedPackage && packageData && pkg && packageType !== 'vip') {
                const minDownPaymentPercent = parseFloat(pkg.minDownPaymentPercent);
                const calculatedMinPayment = Math.round(packageData.finalCost * minDownPaymentPercent);
                const absoluteMinimum = calculatorSettings?.minimumDownPayment || 25000;
                const minDownPayment = Math.max(calculatedMinPayment, absoluteMinimum);
                const remainingCost = packageData.finalCost - minDownPayment;
                const minInstallmentMonths = Math.min(...(calculatorSettings?.installmentMonthsOptions || [2]));
                monthlyPayment = Math.round(remainingCost / minInstallmentMonths);
              }

              return (
                <div key={packageType} className="flex items-center justify-center">
                  {packageType === 'vip' ? (
                    <Minus className="w-3 h-3 text-red-500" strokeWidth={1} />
                  ) : (
                    <span className="text-xs text-gray-600">
                      {formatPrice(monthlyPayment)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Подарки with curved border */}
      <div
        className="relative overflow-hidden border border-pink-300/50"
        style={{ borderRadius: "6px" }}
      >


        <div className="pt-2.5 px-3 space-y-0.5 relative z-0">
          {/* Title with gift box icon */}
          <div className="grid grid-cols-4 gap-2.5 items-center p-1 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🎁</span>
              <span className="font-bold text-gray-800 text-xs">Подарки</span>
            </div>
            <div></div>
            <div></div>
            <div></div>
          </div>

          {/* Gift Procedures Cost Row - using original table logic */}
          <div className="grid grid-cols-4 gap-2.5 py-1 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-700">
              Подарочные процедуры
            </div>
            {packageTypes.map((packageType) => {
              const packageData = packages.find((p) => p.type === packageType);
              const giftSessions = packageData?.giftSessions || 0;

              // Calculate cost of one visit using original table logic
              let costOfOneVisit = 0;
              if (selectedServices && selectedServices.length > 0) {
                // Sum of all selected services base prices
                costOfOneVisit = selectedServices.reduce((sum, service) => {
                  return (
                    sum +
                    parseFloat(service.priceMin || service.pricePerProcedure)
                  );
                }, 0);

                // Subtract free zones from cost of one visit
                if (freeZones && freeZones.length > 0) {
                  const freeZonesCost = freeZones.reduce((sum, zone) => {
                    return sum + zone.pricePerProcedure;
                  }, 0);
                  costOfOneVisit = Math.max(0, costOfOneVisit - freeZonesCost);
                }
              } else {
                // If no specific services selected, use total cost divided by total procedures
                costOfOneVisit =
                  calculation.totalProcedures > 0
                    ? calculation.baseCost / calculation.totalProcedures
                    : 0;
              }

              // Gift value = cost of one visit * gift sessions
              const giftValue =
                packageData && giftSessions > 0
                  ? costOfOneVisit * giftSessions
                  : 0;

              return (
                <div key={packageType} className="flex items-center justify-center">
                  {giftValue > 0 ? (
                    <span className="text-xs font-semibold text-gray-700">
                      {formatPrice(giftValue)}
                    </span>
                  ) : (
                    <Minus className="w-3 h-3 text-red-500" strokeWidth={1} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Free Zones Cost Rows - Show each free zone separately like in original */}
          {freeZones &&
            freeZones.length > 0 &&
            freeZones.map((zone, index) => (
              <div
                key={`free-zone-${zone.serviceId}-${index}`}
                className="grid grid-cols-4 gap-2.5 py-1 border-b border-gray-100"
              >
                <div className="text-xs font-medium text-gray-700">
                  {zone.title}{" "}
                  {zone.quantity > 1 ? `(${zone.quantity} шт.)` : ""}
                </div>
                {packageTypes.map((packageType) => {
                  // Calculate individual zone value: price per procedure * procedure count from slider
                  const zoneValue = zone.pricePerProcedure * procedureCount;

                  return (
                    <div key={packageType} className="text-center">
                      <span className="text-xs font-semibold text-gray-700">
                        {zoneValue > 0 ? formatPrice(zoneValue) : "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}

          {/* Bonus Account Row */}
          <div className="grid grid-cols-4 gap-2.5 py-1 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-700">
              Бонусный счет
            </div>
            {packageTypes.map((packageType) => {
              const packageData = packages.find((p) => p.type === packageType);
              const packageCalcData = getPackageData(packageType);

              const bonusPercent = packageData
                ? parseFloat(packageData.bonusAccountPercent)
                : 0;
              const bonusAmount =
                packageCalcData && bonusPercent > 0
                  ? packageCalcData.finalCost * bonusPercent
                  : 0;

              return (
                <div key={packageType} className="flex items-center justify-center">
                  {bonusAmount > 0 ? (
                    <span className="text-xs font-semibold text-gray-700">
                      {formatPrice(bonusAmount)}
                    </span>
                  ) : (
                    <Minus className="w-3 h-3 text-red-500" strokeWidth={1} />
                  )}
                </div>
              );
            })}
          </div>


          
          {/* Total Gifts Value Row */}
          <div className="grid grid-cols-4 gap-2.5 py-1.5 mt-0.5">
            <div className="text-xs font-bold text-gray-800">
              Итого:
            </div>
            {packageTypes.map((packageType) => {
              const packageData = packages.find((p) => p.type === packageType);
              const packageCalcData = getPackageData(packageType);
              const giftSessions = packageData?.giftSessions || 0;

              // Calculate gift value using original logic
              let costOfOneVisit = 0;
              if (selectedServices && selectedServices.length > 0) {
                costOfOneVisit = selectedServices.reduce((sum, service) => {
                  return (
                    sum +
                    parseFloat(service.priceMin || service.pricePerProcedure)
                  );
                }, 0);

                if (freeZones && freeZones.length > 0) {
                  const freeZonesCost = freeZones.reduce((sum, zone) => {
                    return sum + zone.pricePerProcedure;
                  }, 0);
                  costOfOneVisit = Math.max(0, costOfOneVisit - freeZonesCost);
                }
              } else {
                costOfOneVisit =
                  calculation.totalProcedures > 0
                    ? calculation.baseCost / calculation.totalProcedures
                    : 0;
              }

              const giftValue =
                packageData && giftSessions > 0
                  ? costOfOneVisit * giftSessions
                  : 0;

              // Calculate bonus amount
              const bonusPercent = packageData
                ? parseFloat(packageData.bonusAccountPercent)
                : 0;
              const bonusAmount =
                packageCalcData && bonusPercent > 0
                  ? packageCalcData.finalCost * bonusPercent
                  : 0;

              // Calculate free zones value
              const freeZoneValue =
                freeZones && freeZones.length > 0
                  ? freeZones.reduce(
                      (total, zone) =>
                        total + zone.pricePerProcedure * procedureCount,
                      0,
                    )
                  : 0;

              const totalGifts = giftValue + bonusAmount + freeZoneValue;

              return (
                <div key={packageType} className="text-center">
                  <span className="text-xs font-bold text-pink-400">
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
