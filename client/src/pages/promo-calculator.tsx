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

interface PackagePerk {
  id: number;
  packageType: string;
  name: string;
  icon: string;
  displayType?: string;
  textColor?: string;
  iconColor?: string;
  isActive: boolean;
}

interface Package {
  id: number;
  type: string;
  name: string;
  discount: string;
  giftSessions: number;
}

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
    const { data: realPerks = [] } = useQuery<PackagePerk[]>({
      queryKey: [`/api/packages/${packageType}/perks`],
      enabled: true,
      staleTime: 0,
      gcTime: 0
    });

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
        
        {realPerks.slice(0, 4).map((perk: PackagePerk, index: number) => {
          const IconComponent = (Icons as any)[perk.icon] || Check;
          const iconColor = perk.iconColor || '#6B7280';
          const textColor = perk.textColor || '#6B7280';
          
          return (
            <div key={index} className={`flex items-center text-xs ${
              perk.displayType === 'highlighted' ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-1 rounded-lg border border-blue-200 dark:border-blue-700' : ''
            }`}>
              <IconComponent 
                style={{ color: iconColor }}
                className="mr-2 flex-shrink-0" 
                size={12} 
              />
              <span style={{ color: textColor }} className={`${perk.displayType === 'highlighted' ? 'font-medium' : ''} truncate`}>{perk.name}</span>
            </div>
          );
        })}
      </div>
    );
  };

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

          {/* Package cards - responsive grid with proper spacing */}
          {calculation && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3 xl:gap-4 px-1">
                  {(['economy', 'standard', 'vip'] as const).map((packageType) => {
                    const info = packageInfo[packageType];
                    const data = getPackageData(packageType);
                    const packageData = (packages as Package[]).find((p: Package) => p.type === packageType);
                    const discountPercent = packageData ? Math.round(parseFloat(packageData.discount) * 100) : 0;
                    const Icon = info.icon;
                    const isSelected = selectedPackage === packageType;
                    const isPopular = packageType === 'standard';

                    if (!data) return null;

                    return (
                      <div
                        key={packageType}
                        className={`floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl lg:rounded-2xl p-3 lg:p-4 cursor-pointer relative border border-white/20 dark:border-gray-700/20 transition-all duration-300 hover:scale-105 ${
                          isSelected ? 'ring-2 ring-purple-500 shadow-2xl' : ''
                        } ${
                          !data.isAvailable ? 'cursor-not-allowed' : ''
                        }`}
                        onClick={() => data.isAvailable && setSelectedPackage(packageType)}
                        style={{ marginTop: isPopular ? '1rem' : '0' }}
                      >
                        {/* Popular badge */}
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 lg:px-3 xl:px-4 py-1 shadow-lg text-xs">
                              Популярный
                            </Badge>
                          </div>
                        )}

                        {/* VIP crown */}
                        {packageType === 'vip' && (
                          <div className="absolute top-0 right-0 w-10 h-10 lg:w-12 lg:h-12 xl:w-16 xl:h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-bl-2xl lg:rounded-bl-3xl rounded-tr-xl lg:rounded-tr-2xl flex items-end justify-start pl-1 lg:pl-2 pb-1 lg:pb-2">
                            <Crown className="text-white" size={12} />
                          </div>
                        )}

                        {/* Header */}
                        <div className="text-center mb-3 lg:mb-4 xl:mb-6">
                          <div className={`w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 mx-auto mb-2 lg:mb-3 bg-gradient-to-r ${info.gradient} rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg`}>
                            <Icon className="text-white" size={14} />
                          </div>
                          <h4 className="text-sm lg:text-lg xl:text-xl font-bold text-gray-900 dark:text-white">{packageData?.name || info.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{info.subtitle}</p>
                          
                          {/* Prominent discount display */}
                          <div className={`mt-2 inline-block px-2 lg:px-3 py-1 rounded-full text-white font-bold text-xs bg-gradient-to-r ${info.gradient} shadow-md`}>
                            Скидка {discountPercent}%
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="text-center mb-3 lg:mb-4 xl:mb-6">
                          <div className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {formatPrice(data.finalCost)}
                          </div>
                          <div className="text-xs text-gray-400 line-through mb-1 lg:mb-2">
                            {formatPrice(calculation.baseCost)}
                          </div>
                          <div className="text-sm lg:text-lg font-bold text-premium">
                            Экономия: {formatPrice(data.totalSavings)}
                          </div>
                          {procedureCount >= 15 && data.appliedDiscounts.some((d: any) => d.type === 'bulk') && (
                            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                              +2,5% доп. скидка применена!
                            </div>
                          )}
                        </div>

                        {/* Benefits */}
                        <div className="mb-3 lg:mb-4">
                          <BenefitsSection packageType={packageType} packages={packages as Package[]} calculation={calculation} procedureCount={procedureCount} />
                        </div>

                        {/* Action */}
                        {data.isAvailable ? (
                          <Button
                            className={`w-full shadow-lg hover:shadow-xl transition-all duration-300 text-xs ${
                              isSelected ? 'btn-premium' : 'btn-outline-premium'
                            }`}
                            onClick={() => setSelectedPackage(packageType)}
                          >
                            {isSelected ? 'Выбрано' : 'Выбрать'}
                          </Button>
                        ) : (
                          <div className="text-center p-2 lg:p-3 xl:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                            <div className="text-xs text-red-600 dark:text-red-400 font-medium">{data.unavailableReason}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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