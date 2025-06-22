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
import UnifiedPackageComparison from "@/components/unified-package-comparison";

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

export default function PromoCalculatorPage({ user, onLogout }: PromoCalculatorPageProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

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
  } = useCalculator();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
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


          {/* Base cost display - максимально компактно */}
          {calculation && (
            <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded p-1.5 mb-1 border border-white/20 dark:border-gray-700/20 flex-shrink-0">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">Базовая стоимость</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPrice(calculation.baseCost)}
                </div>
              </div>
            </div>
          )}

          {/* Unified Package Comparison */}
          {calculation && (
            <div className="flex-1 overflow-hidden">
              <UnifiedPackageComparison 
                calculation={calculation}
                packages={packages as Package[]}
                selectedPackage={selectedPackage}
                onPackageSelect={setSelectedPackage}
                downPayment={downPayment}
                installmentMonths={installmentMonths}
              />
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