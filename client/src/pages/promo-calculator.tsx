import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Moon, Sun, Crown, Star, Leaf, Gift, Sparkles } from "lucide-react";
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

  return (
    <div className={`fixed inset-0 overflow-hidden promo-background glass-pattern ${darkMode ? 'dark' : ''}`}>
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

      {/* Main content grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4">
        {/* Left panel - All controls */}
        <div className="col-span-3 flex flex-col space-y-2 max-h-full overflow-y-auto">
          {/* Hero badge */}
          <div className="text-center">
            <Badge className="bg-gradient-to-r from-pink-400 to-orange-400 text-white px-6 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Спецпредложение гостевого дня
            </Badge>
          </div>

          {/* Service selection card */}
          <div className="card-glass p-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Выбор услуг</h3>
            <ServiceSelector
              selectedServices={selectedServices}
              onServicesChange={setSelectedServices}
              onAddFreeZone={setFreeZones}
              freeZones={freeZones}
            />
          </div>

          {/* Procedure count */}
          <div className="card-glass p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Количество процедур</h4>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-premium">{procedureCount}</div>
              <div className="text-sm text-gray-500">процедур</div>
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
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-2xl">
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                  <Star className="w-4 h-4 mr-2" />
                  Дополнительная скидка +2,5%
                </div>
              </div>
            )}
          </div>

          {/* Payment settings */}
          <div className="card-glass p-2">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Первый взнос</h4>
            
            <div className="text-center mb-2">
              <div className="text-xl font-bold text-premium">{formatPrice(downPayment)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">из {calculation ? formatPrice(Math.max(...Object.values(calculation.packages).map((p: any) => p.finalCost))) : '0'}</div>
            </div>
            
            <input
              type="range"
              min="5000"
              max={calculation && selectedPackage ? calculation.packages[selectedPackage].finalCost : (calculation ? calculation.packages.vip.finalCost : 25000)}
              step="1"
              value={downPayment}
              onChange={(e) => setDownPayment(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider mb-3"
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>5 000₽</span>
              <span>{calculation && selectedPackage ? formatPrice(calculation.packages[selectedPackage].finalCost) : (calculation ? formatPrice(calculation.packages.vip.finalCost) : '25 000₽')}</span>
            </div>
          </div>

          {/* Installment configuration */}
          {downPayment < (calculation && selectedPackage ? calculation.packages[selectedPackage].finalCost : (calculation ? calculation.packages.vip.finalCost : 25000)) && (
            <div className="card-glass p-2">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Рассрочка</h4>
              
              <div className="text-center mb-2">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{installmentMonths}</div>
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
                <div className="mt-2 text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Ежемесячный платеж</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatPrice((calculation.packages[selectedPackage].finalCost - downPayment) / installmentMonths)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Certificate option */}
          <div className="card-glass p-2">
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
            {!calculation || calculation.baseCost < 25000 ? (
              <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                Доступно при курсе от 25 000₽
              </p>
            ) : null}
          </div>

          {/* Free zones info */}
          {freeZones.length > 0 && (
            <div className="card-glass p-3">
              <div className="flex items-center mb-3">
                <Gift className="w-5 h-5 text-pink-500 mr-2" />
                <span className="font-semibold text-gray-900 dark:text-white">Подарки</span>
              </div>
              {freeZones.map((zone) => (
                <div key={zone.serviceId} className="text-sm text-gray-600 dark:text-gray-300">
                  {zone.title}: +{formatPrice(zone.pricePerProcedure * zone.quantity)}
                </div>
              ))}
            </div>
          )}

          {/* Order button */}
          {selectedPackage && (
            <Button
              onClick={handleProceedToOrder}
              className="btn-premium w-full text-sm py-2"
              disabled={!selectedServices.length}
            >
              <Star className="w-4 h-4 mr-2" />
              Оформить абонемент
            </Button>
          )}
        </div>

        {/* Right panel - Package comparison */}
        <div className="col-span-9 flex flex-col">
          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              Создайте идеальный курс
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Выберите пакет с максимальными выгодами
            </p>
          </div>

          {/* Base cost display */}
          {calculation && (
            <div className="card-glass p-6 mb-6">
              <div className="text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Базовая стоимость курса</div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(calculation.baseCost)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedServices.map(s => s.title).join(' + ')} × {procedureCount}
                </div>
              </div>
            </div>
          )}

          {/* Package cards */}
          {calculation && (
            <div className="grid grid-cols-3 gap-3 flex-1">
              {(['economy', 'standard', 'vip'] as const).map((packageType) => {
                const info = packageInfo[packageType];
                const data = calculation.packages[packageType];
                const packageData = packages.find(p => p.type === packageType);
                const discountPercent = packageData ? Math.round(parseFloat(packageData.discount) * 100) : 0;
                const Icon = info.icon;
                const isSelected = selectedPackage === packageType;
                const isPopular = packageType === 'standard';

                return (
                  <div
                    key={packageType}
                    className={`card-package p-3 cursor-pointer relative ${isSelected ? 'selected' : ''} ${!data.isAvailable ? 'opacity-50' : ''}`}
                    onClick={() => data.isAvailable && setSelectedPackage(packageType)}
                  >
                    {/* Popular badge */}
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1">
                          Популярный
                        </Badge>
                      </div>
                    )}

                    {/* VIP crown */}
                    {packageType === 'vip' && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-bl-3xl rounded-tr-3xl flex items-end justify-start pl-2 pb-2">
                        <Crown className="text-white" size={16} />
                      </div>
                    )}

                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-r ${info.gradient} rounded-2xl flex items-center justify-center`}>
                        <Icon className="text-white" size={20} />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">{packageData?.name || info.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{info.subtitle}</p>
                      
                      {/* Prominent discount display */}
                      <div className={`mt-2 inline-block px-3 py-1 rounded-full text-white font-bold text-sm bg-gradient-to-r ${info.gradient}`}>
                        Скидка {discountPercent}%
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="text-center mb-6">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {formatPrice(data.finalCost)}
                      </div>
                      <div className="text-sm text-gray-400 line-through mb-2">
                        {formatPrice(calculation.baseCost)}
                      </div>
                      <div className="text-lg font-bold text-premium">
                        Экономия: {formatPrice(data.totalSavings)}
                      </div>
                      {procedureCount >= 15 && data.appliedDiscounts.some((d: any) => d.type === 'bulk') && (
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                          +2,5% доп. скидка применена!
                        </div>
                      )}
                    </div>

                    {/* Benefits */}
                    <div className="space-y-2 mb-6">
                      {info.benefits.slice(0, 3).map((benefit, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">{benefit.text}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{benefit.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action */}
                    {data.isAvailable ? (
                      <Button
                        className={`w-full ${isSelected ? 'btn-premium' : 'btn-outline-premium'}`}
                        onClick={() => setSelectedPackage(packageType)}
                      >
                        {isSelected ? 'Выбрано' : 'Выбрать'}
                      </Button>
                    ) : (
                      <div className="text-center">
                        <div className="text-sm text-red-500 font-medium">{data.unavailableReason}</div>
                      </div>
                    )}
                  </div>
                );
              })}
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
