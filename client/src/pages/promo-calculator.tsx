import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RangeSlider } from "@/components/ui/range-slider";
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
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [tempPaymentValue, setTempPaymentValue] = useState('');

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

  // Helper function to get max final cost from available packages only
  const getMaxFinalCost = (): number => {
    if (!calculation || !calculation.packages) return 25000;
    const availablePackages = Object.entries(calculation.packages as Record<string, PackageData>)
      .filter(([_, data]) => data.isAvailable)
      .map(([_, data]) => data.finalCost);
    return availablePackages.length > 0 ? Math.max(...availablePackages) : 25000;
  };

  const getMinDownPayment = (): number => {
    if (!calculation || !calculation.packages) return 5000;
    const availablePackages = Object.entries(calculation.packages as Record<string, PackageData>)
      .filter(([_, data]) => data.isAvailable);
    if (availablePackages.length === 0) return 5000;
    
    // Get minimum required down payment from available packages
    const minPayments = availablePackages.map(([type, data]) => {
      const pkg = packages.find(p => p.type === type);
      if (!pkg) return 5000;
      return Math.max(5000, data.finalCost * parseFloat(pkg.minDownPaymentPercent.toString()));
    });
    return Math.min(...minPayments);
  };

  return (
    <div className={`min-h-screen overflow-hidden promo-background glass-pattern ${darkMode ? 'dark' : ''}`}>
      {/* Background decorative elements */}
      <div className="floating-pattern top-10 left-10"></div>
      <div className="floating-pattern bottom-10 right-10"></div>
      
      {/* Subtle exit button */}
      <div className="absolute top-2 right-2 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="opacity-30 hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
        >
          <X size={14} />
        </Button>
      </div>

      {/* Theme toggle */}
      <div className="absolute top-2 right-12 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          className="opacity-30 hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </Button>
      </div>

      {/* Main content - адаптивная сетка */}
      <div className="h-screen flex flex-col lg:flex-row gap-1 lg:gap-3 p-1 lg:p-3 overflow-hidden">
        {/* Left panel - Controls */}
        <div className="w-full lg:w-72 xl:w-80 flex flex-col h-auto lg:h-full order-2 lg:order-1">
          {/* Hero badge - fixed at top */}
          <div className="text-center mb-2 lg:mb-3 flex-shrink-0">
            <Badge className="bg-gradient-to-r from-pink-400 to-orange-400 text-white px-3 lg:px-4 py-1 text-xs font-medium shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" />
              Спецпредложение гостевого дня
            </Badge>
          </div>

          {/* Scrollable content area with custom scrollbar */}
          <div className="flex-1 overflow-y-auto space-y-2 lg:space-y-3 pr-1 custom-left-scrollbar max-h-[40vh] lg:max-h-none">
            {/* Service selection card */}
            <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg p-3 border border-white/20 dark:border-gray-700/20">
              <h3 className="text-sm lg:text-base font-bold text-gray-900 dark:text-white mb-2">Выбор услуг</h3>
              <ServiceSelector
                selectedServices={selectedServices}
                onServicesChange={setSelectedServices}
                onAddFreeZone={setFreeZones}
                freeZones={freeZones}
              />
            </div>

            {/* Procedure count - компактный */}
            <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg p-3 border border-white/20 dark:border-gray-700/20">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Количество процедур</h4>
              <div className="text-center mb-2">
                <div className="text-xl lg:text-2xl font-bold text-premium">{procedureCount}</div>
                <div className="text-xs text-gray-500">процедур</div>
              </div>
              
              <RangeSlider
                min={4}
                max={20}
                value={procedureCount}
                onChange={setProcedureCount}
                className="dark:bg-gray-700"
              />
              
              {procedureCount >= 15 && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg shadow-inner">
                  <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                    <Star className="w-3 h-3 mr-1" />
                    Дополнительная скидка +2,5%
                  </div>
                </div>
              )}
            </div>

            {/* Payment settings - компактный */}
            <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg p-3 border border-white/20 dark:border-gray-700/20">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Первый взнос</h4>
              
              <div className="text-center mb-2">
                {isEditingPayment ? (
                  <input
                    type="number"
                    value={tempPaymentValue}
                    onChange={(e) => setTempPaymentValue(e.target.value)}
                    onBlur={() => {
                      const numericValue = parseInt(tempPaymentValue) || 0;
                      const constrainedValue = Math.max(getMinDownPayment(), Math.min(getMaxFinalCost(), numericValue));
                      setDownPayment(constrainedValue);
                      setIsEditingPayment(false);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const numericValue = parseInt(tempPaymentValue) || 0;
                        const constrainedValue = Math.max(getMinDownPayment(), Math.min(getMaxFinalCost(), numericValue));
                        setDownPayment(constrainedValue);
                        setIsEditingPayment(false);
                      }
                    }}
                    autoFocus
                    className="text-lg font-bold text-premium bg-transparent border-none text-center w-full focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                  />
                ) : (
                  <div
                    onClick={() => {
                      setTempPaymentValue(downPayment.toString());
                      setIsEditingPayment(true);
                    }}
                    className="text-lg font-bold text-premium cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded px-2 py-1 transition-colors"
                  >
                    {formatPrice(downPayment)}
                  </div>
                )}
              </div>
              
              <RangeSlider
                min={getMinDownPayment()}
                max={getMaxFinalCost()}
                step={1}
                value={downPayment}
                onChange={setDownPayment}
                className="dark:bg-gray-700 mb-2"
                formatLabel={formatPrice}
              />
            </div>

            {/* Installment configuration - компактный */}
            {downPayment < (selectedPackage && calculation ? getPackageData(selectedPackage)?.finalCost || 25000 : 25000) && (
              <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg p-3 border border-white/20 dark:border-gray-700/20">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Рассрочка</h4>
                
                <div className="text-center mb-2">
                  <div className="text-lg font-bold text-premium">{installmentMonths}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">месяцев</div>
                </div>
                
                <RangeSlider
                  min={2}
                  max={6}
                  value={installmentMonths}
                  onChange={setInstallmentMonths}
                  className="dark:bg-gray-700"
                />
                
                {selectedPackage && calculation && (
                  <div className="mt-2 text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Ежемесячный платеж</div>
                    <div className="text-sm font-bold text-premium">
                      {formatPrice(((getPackageData(selectedPackage)?.finalCost || 0) - downPayment) / installmentMonths)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Certificate option - компактный */}
            <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg p-3 border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Сертификат</h4>
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
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 peer-disabled:opacity-50"></div>
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
            <div className="flex-shrink-0 mt-2 lg:mt-3">
              <Button
                onClick={handleProceedToOrder}
                className="btn-premium w-full text-xs lg:text-sm py-2 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                disabled={!selectedServices.length}
              >
                <Star className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                Оформить абонемент
              </Button>
            </div>
          )}
        </div>

        {/* Right panel - Package comparison с адаптивной высотой */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden order-1 lg:order-2">
          {/* Base cost display - компактный адаптивный */}
          {calculation && (
            <div className="floating-card-enhanced bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg p-2 lg:p-3 mb-2 lg:mb-3 border border-white/20 dark:border-gray-700/20 flex-shrink-0">
              <div className="text-center">
                <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Базовая стоимость</div>
                <div className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(calculation.baseCost)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 hidden lg:block">
                  {selectedServices.map(s => s.title).join(' + ')} × {procedureCount}
                </div>
              </div>
            </div>
          )}

          {/* Unified Package Comparison - теперь занимает оставшееся место */}
          {calculation && (
            <div className="flex-1 overflow-hidden">
              <UnifiedPackageComparison 
                calculation={calculation}
                packages={packages as Package[]}
                selectedPackage={selectedPackage}
                onPackageSelect={setSelectedPackage}
                downPayment={downPayment}
                installmentMonths={installmentMonths}
                procedureCount={procedureCount}
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