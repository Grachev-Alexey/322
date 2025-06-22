import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Moon, Sun, Crown, Star, Leaf, Gift, Sparkles, Check } from "lucide-react";
import * as Icons from "lucide-react";
import { useCalculator } from "@/hooks/use-calculator";
import { formatPrice } from "@/lib/utils";
import ServiceSelector from "@/components/service-selector";
import ClientModal from "@/components/client-modal";
import { usePackagePerks, type PackagePerkValue } from "@/hooks/use-package-perks";

interface User {
  id: number;
  name: string;
  role: 'master' | 'admin';
}

interface PromoCalculatorPageProps {
  user: User;
  onLogout: () => void;
}

interface PackageData {
  isAvailable: boolean;
  unavailableReason: string;
  finalCost: number;
  totalSavings: number;
  monthlyPayment: number;
  appliedDiscounts: Array<{ type: string; amount: number }>;
}



interface Package {
  id: number;
  type: string;
  name: string;
  discount: string;
  giftSessions: number;
}

// Package info definition
const packageInfo = {
  vip: {
    title: "VIP",
    subtitle: "Максимум привилегий",
    icon: Crown,
    gradient: "from-purple-500 via-pink-500 to-orange-400",
    benefits: [
      { text: "Скидка 30%", value: "30%" },
      { text: "3 подарочных сеанса", value: "9 000₽" },
      { text: "Гарантия возврата денег", value: "∞" },
      { text: "Клубная карта 'Золотая 35%'", value: "35%" },
      { text: "Бессрочная заморозка", value: "∞" },
      { text: "Персональный менеджер", value: "VIP" }
    ]
  },
  standard: {
    title: "Стандарт",
    subtitle: "Лучшее соотношение",
    icon: Star,
    gradient: "from-blue-500 via-purple-500 to-pink-500",
    benefits: [
      { text: "Скидка 25%", value: "25%" },
      { text: "1 подарочный сеанс", value: "3 000₽" },
      { text: "Гарантия качества", value: "100%" },
      { text: "Клубная карта 'Серебряная 30%'", value: "30%" },
      { text: "Заморозка до 6 месяцев", value: "6 мес" },
      { text: "Курс массажа", value: "5 000₽" }
    ]
  },
  economy: {
    title: "Эконом",
    subtitle: "Оптимальный старт",
    icon: Leaf,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    benefits: [
      { text: "Скидка 20%", value: "20%" },
      { text: "Заморозка до 3 месяцев", value: "3 мес" },
      { text: "Курс массажа", value: "3 000₽" }
    ]
  }
};

// Integrated Package Comparison Component
const IntegratedPackageComparison = ({ 
  calculation, 
  packages, 
  selectedPackage, 
  onPackageSelect, 
  procedureCount 
}: {
  calculation: any;
  packages: Package[];
  selectedPackage: string | null;
  onPackageSelect: (packageType: string) => void;
  procedureCount: number;
}) => {
  const { data: allPerkValues = [] } = usePackagePerks();
  
  // Get unique perks ordered by displayOrder
  const uniquePerks = allPerkValues
    .filter(pv => pv.perk.isActive)
    .reduce((acc, pv) => {
      if (!acc.find(p => p.id === pv.perk.id)) {
        acc.push(pv.perk);
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const packageTypes = ['vip', 'standard', 'economy'] as const;
  
  // Helper function to get package data
  const getPackageData = (packageType: string) => {
    if (!calculation || !calculation.packages) return null;
    return (calculation.packages as Record<string, PackageData>)[packageType] || null;
  };
  
  // Get perk value for specific package
  const getPerkValue = (perkId: number, packageType: string) => {
    return allPerkValues.find(pv => pv.perk.id === perkId && pv.packageType === packageType);
  };

  // Render perk value cell
  const renderPerkValue = (perkId: number, packageType: string) => {
    const perkValue = getPerkValue(perkId, packageType);
    if (!perkValue || !perkValue.isActive) {
      return (
        <div className="flex items-center justify-center p-2">
          <span className="text-red-500 font-bold text-lg">–</span>
        </div>
      );
    }
    
    const isHighlighted = perkValue.isHighlighted;
    
    if (perkValue.valueType === 'boolean') {
      return (
        <div className="flex items-center justify-center p-2">
          {perkValue.booleanValue ? (
            <div className={`p-1.5 rounded-full ${
              packageType === 'vip' ? 'bg-purple-100 text-purple-600' :
              packageType === 'standard' ? 'bg-blue-100 text-blue-600' :
              'bg-green-100 text-green-600'
            }`}>
              <Check className="h-4 w-4" />
            </div>
          ) : (
            <span className="text-red-500 font-bold text-lg">–</span>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center p-2">
        <span className={`text-sm font-semibold ${
          isHighlighted 
            ? packageType === 'vip' ? 'text-purple-700 bg-purple-50 px-2 py-1 rounded-lg' :
              packageType === 'standard' ? 'text-blue-700 bg-blue-50 px-2 py-1 rounded-lg' :
              'text-green-700 bg-green-50 px-2 py-1 rounded-lg'
            : 'text-gray-700'
        }`}>
          {perkValue.displayValue}
        </span>
      </div>
    );
  };

  return (
    <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
      {/* Header Row with Package Info */}
      <div className="grid grid-cols-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
        <div className="p-4 border-r border-gray-200 dark:border-gray-600">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Преимущества</h3>
        </div>
        
        {packageTypes.map((packageType) => {
          const info = packageInfo[packageType];
          const data = getPackageData(packageType);
          const packageData = packages.find((p: Package) => p.type === packageType);
          const discountPercent = packageData ? Math.round(parseFloat(packageData.discount) * 100) : 0;
          const Icon = info.icon;
          const isSelected = selectedPackage === packageType;
          const isPopular = packageType === 'standard';

          if (!data) return null;

          return (
            <div 
              key={packageType} 
              className={`p-4 border-r border-gray-200 dark:border-gray-600 last:border-r-0 text-center cursor-pointer transition-all duration-300 ${
                isSelected ? 'bg-gradient-to-b from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              onClick={() => data.isAvailable && onPackageSelect(packageType)}
            >
              {/* Popular badge */}
              {isPopular && (
                <div className="mb-2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    Популярный
                  </span>
                </div>
              )}
              
              {/* Package Icon and Title */}
              <div className={`w-10 h-10 mx-auto mb-2 bg-gradient-to-r ${info.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <Icon className="text-white" size={16} />
              </div>
              
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                {packageData?.name || info.title}
              </h4>
              
              {/* Discount Badge */}
              <div className={`inline-block px-2 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${info.gradient} shadow-md mb-2`}>
                Скидка {discountPercent}%
              </div>
              
              {/* Pricing */}
              <div className="mb-3">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPrice(data.finalCost)}
                </div>
                <div className="text-xs text-gray-400 line-through">
                  {formatPrice(calculation.baseCost)}
                </div>
                <div className="text-sm font-semibold text-green-600">
                  Экономия: {formatPrice(data.totalSavings)}
                </div>
              </div>
              
              {/* Action Button */}
              <Button
                className={`w-full text-xs ${
                  isSelected ? 'btn-premium' : 'btn-outline-premium'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onPackageSelect(packageType);
                }}
                disabled={!data.isAvailable}
              >
                {isSelected ? 'Выбрано' : 'Выбрать'}
              </Button>
            </div>
          );
        })}
      </div>
      
      {/* Perks Comparison Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {uniquePerks.map((perk, index) => {
          const IconComponent = (Icons as any)[perk.icon] || Check;
          const isEven = index % 2 === 0;
          
          return (
            <div key={perk.id} className={`grid grid-cols-4 ${isEven ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
              {/* Perk Name Column */}
              <div className="p-3 border-r border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex-shrink-0">
                    <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {perk.name}
                    </div>
                    {perk.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {perk.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Package Value Columns */}
              {packageTypes.map((packageType) => (
                <div key={packageType} className="border-r border-gray-200 dark:border-gray-600 last:border-r-0 min-h-[60px] flex items-center justify-center">
                  {renderPerkValue(perk.id, packageType)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Perks Comparison Table Component (keeping for backward compatibility)
const PerksComparisonTable = ({ packages }: { packages: Package[] }) => {
  const { data: allPerkValues = [] } = usePackagePerks();
  
  // Get unique perks ordered by displayOrder
  const uniquePerks = allPerkValues
    .filter(pv => pv.perk.isActive)
    .reduce((acc, pv) => {
      if (!acc.find(p => p.id === pv.perk.id)) {
        acc.push(pv.perk);
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Package types in correct order
  const packageTypes = ['vip', 'standard', 'economy'] as const;
  
  // Get perk value for specific package
  const getPerkValue = (perkId: number, packageType: string) => {
    return allPerkValues.find(pv => pv.perk.id === perkId && pv.packageType === packageType);
  };

  // Render perk value cell
  const renderPerkValue = (perkId: number, packageType: string) => {
    const perkValue = getPerkValue(perkId, packageType);
    if (!perkValue || !perkValue.isActive) {
      return (
        <div className="flex flex-col items-center justify-center p-3 space-y-1">
          <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900">
            <X className="h-3 w-3 text-red-500 dark:text-red-400" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Нет</span>
        </div>
      );
    }
    
    const isHighlighted = perkValue.isHighlighted;
    const packageColors = {
      vip: 'from-purple-500 to-purple-600',
      standard: 'from-blue-500 to-blue-600', 
      economy: 'from-green-500 to-green-600'
    };
    
    if (perkValue.valueType === 'boolean') {
      return (
        <div className="flex flex-col items-center justify-center p-3 space-y-1">
          {perkValue.booleanValue ? (
            <>
              <div className={`p-1.5 rounded-full bg-gradient-to-r ${packageColors[packageType as keyof typeof packageColors]} text-white`}>
                <Check className="h-3 w-3" />
              </div>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Да</span>
            </>
          ) : (
            <>
              <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900">
                <X className="h-3 w-3 text-red-500 dark:text-red-400" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Нет</span>
            </>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-3 space-y-1">
        <div className={`px-2 py-1 rounded-lg text-center min-w-[60px] ${
          isHighlighted 
            ? `bg-gradient-to-r ${packageColors[packageType as keyof typeof packageColors]} text-white shadow-md` 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        }`}>
          <span className={`text-xs font-bold ${isHighlighted ? 'text-white' : ''}`}>
            {perkValue.displayValue}
          </span>
        </div>
        {isHighlighted && (
          <div className="flex items-center space-x-1">
            <Sparkles className="h-2 w-2 text-yellow-500" />
            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Топ</span>
          </div>
        )}
      </div>
    );
  };

  if (uniquePerks.length === 0) {
    return null;
  }

  return (
    <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-white/20 dark:border-gray-700/20">
      <div className="text-center mb-6">
        <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-2">
          Сравнение преимуществ
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Выберите пакет с нужными возможностями
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-0 mb-4">
            <div className="p-3 font-semibold text-gray-900 dark:text-white">
              Преимущества
            </div>
            {packageTypes.map((packageType) => {
              const info = packageInfo[packageType];
              const Icon = info.icon;
              return (
                <div key={packageType} className="p-3 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`p-2 rounded-full bg-gradient-to-r ${info.gradient} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white">
                      {info.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Perks Rows */}
          <div className="space-y-2">
            {uniquePerks.map((perk, index) => {
              const IconComponent = (Icons as any)[perk.icon] || Check;
              const isEven = index % 2 === 0;
              return (
                <div key={perk.id} className={`grid grid-cols-4 gap-0 rounded-lg overflow-hidden ${isEven ? 'bg-gray-50/50 dark:bg-gray-800/50' : 'bg-white/50 dark:bg-gray-900/50'}`}>
                  {/* Perk Name Column */}
                  <div className="p-3 border-r border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                        <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {perk.name}
                        </div>
                        {perk.description && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {perk.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Package Value Columns */}
                  {packageTypes.map((packageType) => (
                    <div key={packageType} className="border-r border-gray-200 dark:border-gray-700 last:border-r-0 flex items-center justify-center min-h-[60px]">
                      {renderPerkValue(perk.id, packageType)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PromoCalculatorPage({ user, onLogout }: PromoCalculatorPageProps) {
  const [showClientModal, setShowClientModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const {
    selectedServices,
    procedureCount,
    downPayment,
    installmentMonths,
    usedCertificate,
    freeZones,
    calculation,
    selectedPackage,
    packages,
    setSelectedServices,
    setProcedureCount,
    setDownPayment,
    setInstallmentMonths,
    setUsedCertificate,
    setFreeZones,
    setSelectedPackage,
    isLoading
  } = useCalculator();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Benefits component for displaying database perks
  const BenefitsSection = ({ packageType, packages, calculation, procedureCount }: {
    packageType: string;
    packages: Package[];
    calculation: any;
    procedureCount: number;
  }) => {
    const { data: allPerkValues = [] } = usePackagePerks();
    const realPerks = allPerkValues.filter(pv => pv.packageType === packageType && pv.isActive);

    // Get package data for gift sessions
    const packageData = packages.find((p: Package) => p.type === packageType);
    
    if (!realPerks || realPerks.length === 0) {
      return (
        <div className="space-y-2 mb-4">
          <div className="text-xs text-red-500">Loading perks from database...</div>
          {packageInfo[packageType as keyof typeof packageInfo].benefits.slice(0, 3).map((benefit: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">{benefit.text}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{benefit.value}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2 mb-4">
        {/* Gift Sessions */}
        {packageData && packageData.giftSessions > 0 && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-700 rounded-lg p-2 mb-2">
            <div className="flex items-center justify-center">
              <Gift className="text-pink-600 dark:text-pink-400 mr-2" size={12} />
              <span className="text-xs font-medium text-pink-800 dark:text-pink-200">
                {packageData.giftSessions} подарочн{packageData.giftSessions === 1 ? 'ый сеанс' : packageData.giftSessions < 5 ? 'ых сеанса' : 'ых сеансов'}
              </span>
            </div>
            {calculation && (
              <div className="text-xs text-pink-600 dark:text-pink-400 text-center mt-1">
                Стоимость: {formatPrice(calculation.baseCost / (calculation.totalProcedures || procedureCount) * packageData.giftSessions)}
              </div>
            )}
          </div>
        )}
        
        {realPerks.slice(0, 4).map((perkValue: PackagePerkValue, index: number) => {
          const IconComponent = (Icons as any)[perkValue.perk.icon] || Check;
          const isHighlighted = perkValue.isHighlighted;
          
          return (
            <div key={index} className={`flex items-center text-xs ${
              isHighlighted ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-1 rounded-lg border border-blue-200 dark:border-blue-700' : ''
            }`}>
              <IconComponent 
                className="mr-2 flex-shrink-0 text-gray-500" 
                size={12} 
              />
              <span className={`${isHighlighted ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'} truncate`}>
                {perkValue.perk.name}: {perkValue.displayValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const handleProceedToOrder = () => {
    if (!selectedPackage) return;
    setShowClientModal(true);
  };

  // Helper function to safely access calculation packages
  const getPackageData = (packageType: string): PackageData | null => {
    if (!calculation || !calculation.packages) return null;
    return (calculation.packages as Record<string, PackageData>)[packageType] || null;
  };

  // Helper function to get max final cost
  const getMaxFinalCost = (): number => {
    if (!calculation || !calculation.packages) return 25000;
    const costs = Object.values(calculation.packages as Record<string, PackageData>).map(p => p.finalCost);
    return Math.max(...costs);
  };

  return (
    <div className={`min-h-screen overflow-hidden promo-background glass-pattern ${darkMode ? 'dark' : ''}`}>
      {/* Background decorative elements */}
      <div className="floating-pattern top-10 left-10"></div>
      <div className="floating-pattern bottom-10 right-10"></div>
      
      {/* Subtle exit button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="opacity-30 hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Theme toggle */}
      <div className="absolute top-4 right-16 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          className="opacity-30 hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
      </div>

      {/* Main content - responsive layout */}
      <div className="h-screen flex flex-col lg:flex-row gap-2 lg:gap-4 p-2 lg:p-4 overflow-hidden">
        {/* Left panel - Controls */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col h-auto lg:h-full">
          {/* Hero badge - fixed at top */}
          <div className="text-center mb-3 lg:mb-4 flex-shrink-0">
            <Badge className="bg-gradient-to-r from-pink-400 to-orange-400 text-white px-4 lg:px-6 py-1 lg:py-2 text-xs lg:text-sm font-medium shadow-lg">
              <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
              Спецпредложение гостевого дня
            </Badge>
          </div>

          {/* Scrollable content area with custom scrollbar */}
          <div className="flex-1 overflow-y-auto space-y-2 lg:space-y-3 pr-1 lg:pr-2 custom-left-scrollbar">
            {/* Service selection card */}
            <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-white/20 dark:border-gray-700/20">
              <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white mb-2 lg:mb-3">Выбор услуг</h3>
              <ServiceSelector
                selectedServices={selectedServices}
                onServicesChange={setSelectedServices}
                onAddFreeZone={setFreeZones}
                freeZones={freeZones}
              />
            </div>

            {/* Procedure count */}
            <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-white/20 dark:border-gray-700/20">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4 text-sm lg:text-base">Количество процедур</h4>
              <div className="text-center mb-3 lg:mb-4">
                <div className="text-2xl lg:text-4xl font-bold text-premium">{procedureCount}</div>
                <div className="text-xs lg:text-sm text-gray-500">процедур</div>
              </div>
              
              <input
                type="range"
                min="4"
                max="20"
                value={procedureCount}
                onChange={(e) => setProcedureCount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>4</span>
                <span>20</span>
              </div>
              
              {procedureCount >= 15 && (
                <div className="mt-3 lg:mt-4 p-2 lg:p-3 bg-blue-50 dark:bg-blue-950 rounded-xl lg:rounded-2xl shadow-inner">
                  <div className="flex items-center text-xs lg:text-sm text-blue-600 dark:text-blue-400">
                    <Star className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                    Дополнительная скидка +2,5%
                  </div>
                </div>
              )}
            </div>

            {/* Payment settings */}
            <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-white/20 dark:border-gray-700/20">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 lg:mb-3 text-sm lg:text-base">Первый взнос</h4>
              
              <div className="text-center mb-2 lg:mb-3">
                <div className="text-lg lg:text-xl font-bold text-premium">{formatPrice(downPayment)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">из {formatPrice(getMaxFinalCost())}</div>
              </div>
              
              <input
                type="range"
                min="5000"
                max={selectedPackage && calculation ? getPackageData(selectedPackage)?.finalCost || 25000 : 25000}
                step="1"
                value={downPayment}
                onChange={(e) => setDownPayment(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider mb-2 lg:mb-3"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>5 000₽</span>
                <span>{selectedPackage && calculation ? formatPrice(getPackageData(selectedPackage)?.finalCost || 25000) : '25 000₽'}</span>
              </div>
            </div>

            {/* Installment configuration */}
            {downPayment < (selectedPackage && calculation ? getPackageData(selectedPackage)?.finalCost || 25000 : 25000) && (
              <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-white/20 dark:border-gray-700/20">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 lg:mb-3 text-sm lg:text-base">Рассрочка</h4>
                
                <div className="text-center mb-2 lg:mb-3">
                  <div className="text-lg lg:text-xl font-bold text-purple-600 dark:text-purple-400">{installmentMonths}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">месяцев</div>
                </div>
                
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={installmentMonths}
                  onChange={(e) => setInstallmentMonths(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                  <span>2</span>
                  <span>6</span>
                </div>
                
                {selectedPackage && calculation && (
                  <div className="mt-2 lg:mt-3 text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Ежемесячный платеж</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatPrice(((getPackageData(selectedPackage)?.finalCost || 0) - downPayment) / installmentMonths)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Certificate option */}
            <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-xs lg:text-sm">Сертификат</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Скидка 3 000₽</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usedCertificate}
                    onChange={(e) => setUsedCertificate(e.target.checked)}
                    disabled={!calculation || calculation.baseCost < 25000}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 lg:w-11 lg:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 lg:after:h-5 lg:after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 peer-disabled:opacity-50"></div>
                </label>
              </div>
              {!calculation || calculation.baseCost < 25000 ? (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                  Доступно при курсе от 25 000₽
                </p>
              ) : null}
            </div>
          </div>

          {/* Order button - fixed at bottom */}
          {selectedPackage && (
            <div className="flex-shrink-0 mt-3 lg:mt-4">
              <Button
                onClick={handleProceedToOrder}
                className="btn-premium w-full text-xs lg:text-sm py-2 lg:py-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                disabled={!selectedServices.length}
              >
                <Star className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                Оформить абонемент
              </Button>
            </div>
          )}
        </div>

        {/* Right panel - Package comparison */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Title */}
          <div className="text-center mb-3 lg:mb-4 flex-shrink-0">
            <h1 className="text-xl lg:text-2xl xl:text-3xl font-black text-gray-900 dark:text-white mb-1 lg:mb-2">
              Создайте идеальный курс
            </h1>
            <p className="text-xs lg:text-sm xl:text-base text-gray-600 dark:text-gray-300">
              Выберите пакет с максимальными выгодами
            </p>
          </div>

          {/* Base cost display */}
          {calculation && (
            <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl lg:rounded-2xl p-3 lg:p-4 xl:p-6 mb-3 lg:mb-4 xl:mb-6 border border-white/20 dark:border-gray-700/20 flex-shrink-0">
              <div className="text-center">
                <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mb-1 lg:mb-2">Базовая стоимость курса</div>
                <div className="text-xl lg:text-2xl xl:text-4xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(calculation.baseCost)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedServices.map(s => s.title).join(' + ')} × {procedureCount}
                </div>
              </div>
            </div>
          )}

          {/* Integrated Package Comparison Table */}
          {calculation && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto pb-4">
                <IntegratedPackageComparison 
                  calculation={calculation}
                  packages={packages as Package[]}
                  selectedPackage={selectedPackage}
                  onPackageSelect={setSelectedPackage}
                  procedureCount={procedureCount}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Modal */}
      {showClientModal && (
        <ClientModal
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
          calculation={calculation}
          selectedPackage={selectedPackage}
          selectedServices={selectedServices}
          downPayment={downPayment}
          installmentMonths={installmentMonths}
          usedCertificate={usedCertificate}
          freeZones={freeZones}
        />
      )}
    </div>
  );
}