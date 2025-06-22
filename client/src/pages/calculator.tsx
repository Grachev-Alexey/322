import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, LogOut, Star } from "lucide-react";
import ServiceSelector from "@/components/service-selector";
import PackageCards from "@/components/package-cards";
import PaymentConfig from "@/components/payment-config";
import ClientModal from "@/components/client-modal";
import { useCalculator } from "@/hooks/use-calculator";
import { formatPrice } from "@/lib/utils";

interface User {
  id: number;
  name: string;
  role: 'master' | 'admin';
}

interface CalculatorPageProps {
  user: User;
  onLogout: () => void;
}

export default function CalculatorPage({ user, onLogout }: CalculatorPageProps) {
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
    isLoading
  } = useCalculator();

  const handleProceedToOrder = () => {
    if (!selectedPackage) {
      return;
    }
    setShowClientModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                <Calculator className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Калькулятор Абонементов</h1>
                <p className="text-sm text-gray-600">Студия лазерной эпиляции</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Мастер: {user.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-yellow-500/10 to-green-500/10 text-yellow-700 border-yellow-200">
            <Star className="w-4 h-4 mr-2" />
            Специальное предложение гостевого дня
          </Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Создайте идеальный курс процедур</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Индивидуальный подбор услуг с максимальными выгодами и гибкими условиями оплаты
          </p>
        </div>

        {/* Service Selection */}
        <Card className="card-premium p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Выбор услуг</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ServiceSelector
              selectedServices={selectedServices}
              onServicesChange={setSelectedServices}
              onAddFreeZone={setFreeZones}
              freeZones={freeZones}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Количество процедур</label>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-purple-600">{procedureCount}</span>
                  <span className="text-sm text-gray-600">процедур</span>
                </div>
                
                <div className="relative">
                  <input
                    type="range"
                    min="4"
                    max="20"
                    value={procedureCount}
                    onChange={(e) => setProcedureCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>4</span>
                    <span>20</span>
                  </div>
                </div>
                
                {procedureCount >= 15 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center text-sm text-blue-700">
                      <Star className="w-4 h-4 mr-2" />
                      При выборе ≥15 процедур дополнительная скидка +2,5%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Course Cost */}
          {calculation && (
            <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Базовая стоимость курса</h4>
                  <p className="text-sm text-gray-600">
                    {selectedServices.map(s => s.title).join(' + ')} × {procedureCount} процедур
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(calculation.baseCost)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Package Comparison */}
        {calculation && (
          <PackageCards
            calculation={calculation}
            selectedPackage={selectedPackage}
            onPackageSelect={setSelectedPackage}
            procedureCount={procedureCount}
            packages={packages}
          />
        )}

        {/* Payment Configuration */}
        <PaymentConfig
          downPayment={downPayment}
          installmentMonths={installmentMonths}
          usedCertificate={usedCertificate}
          onDownPaymentChange={setDownPayment}
          onInstallmentMonthsChange={setInstallmentMonths}
          onCertificateChange={setUsedCertificate}
          baseCost={calculation?.baseCost || 0}
          selectedPackage={selectedPackage}
          calculation={calculation}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleProceedToOrder}
            disabled={!selectedPackage || selectedServices.length === 0}
            className="btn-primary text-lg py-4 px-8"
          >
            <Star className="w-5 h-5 mr-2" />
            Оформить абонемент
          </Button>
          
          <Button
            variant="outline"
            className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-4 px-8 rounded-xl"
          >
            Сохранить как черновик
          </Button>
        </div>
      </main>

      {/* Client Data Modal */}
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
