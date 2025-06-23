import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Gift, CreditCard, Calendar } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PaymentConfigProps {
  downPayment: number;
  installmentMonths: number;
  usedCertificate: boolean;
  onDownPaymentChange: (amount: number) => void;
  onInstallmentMonthsChange: (months: number) => void;
  onCertificateChange: (used: boolean) => void;
  baseCost: number;
  selectedPackage: string | null;
  calculation: any;
}

export default function PaymentConfig({
  downPayment,
  installmentMonths,
  usedCertificate,
  onDownPaymentChange,
  onInstallmentMonthsChange,
  onCertificateChange,
  baseCost,
  selectedPackage,
  calculation
}: PaymentConfigProps) {
  const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onDownPaymentChange(value);
  };

  const handleInstallmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 2;
    onInstallmentMonthsChange(value);
  };

  const monthlyPayment = selectedPackage && calculation?.packages[selectedPackage] 
    ? (calculation.packages[selectedPackage].finalCost - downPayment) / installmentMonths
    : 0;

  return (
    <Card className="floating-card bg-white/90 backdrop-blur-sm rounded-2xl border-0 p-8 mb-8">
      <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--graphite)' }}>Условия оплаты</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Down Payment */}
        <div>
          <Label htmlFor="downPayment" className="block text-sm font-medium text-gray-700 mb-3">
            Первый взнос
          </Label>
          <div className="relative">
            <Input
              id="downPayment"
              type="number"
              value={downPayment}
              onChange={handleDownPaymentChange}
              className="input-premium text-lg font-semibold pr-12"
              min="0"
              step="1"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">₽</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Влияет на доступность пакетов и размер скидки
          </p>
          
          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[5000, 10000, 15000, 25000].map((amount) => (
              <button
                key={amount}
                onClick={() => onDownPaymentChange(amount)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  downPayment === amount
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formatPrice(amount)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Installment Period */}
        <div>
          <Label htmlFor="installmentMonths" className="block text-sm font-medium text-gray-700 mb-3">
            Срок рассрочки
          </Label>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-purple-600">{installmentMonths}</span>
              <span className="text-sm text-gray-600">месяца</span>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="2"
                max="6"
                value={installmentMonths}
                onChange={handleInstallmentChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>2</span>
                <span>6</span>
              </div>
            </div>
            
            {monthlyPayment > 0 && selectedPackage !== 'vip' && (
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-600">Ежемесячный платеж</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatPrice(monthlyPayment)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Additional Options */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Certificate */}
        <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Gift className="text-purple-600" size={20} />
              <div>
                <h4 className="font-semibold text-gray-900">Сертификат на скидку</h4>
                <p className="text-sm text-gray-600">
                  Скидка 3 000 ₽ при курсе ≥25 000 ₽
                </p>
                {baseCost < 25000 && (
                  <p className="text-xs text-red-500 mt-1">
                    Недоступно для текущего курса
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={usedCertificate}
              onCheckedChange={onCertificateChange}
              disabled={baseCost < 25000}
            />
          </div>
          
          {usedCertificate && (
            <div className="mt-3 p-2 bg-green-50 rounded-lg">
              <div className="flex items-center text-sm text-green-700">
                <Gift className="w-4 h-4 mr-2" />
                Применена скидка 3 000 ₽
              </div>
            </div>
          )}
        </div>
        
        {/* Free Zone Info */}
        <div className="p-4 bg-blue-50 rounded-xl">
          <div className="flex items-center">
            <Gift className="text-blue-600 mr-3" />
            <div>
              <h4 className="font-semibold text-gray-900">Добавить бесплатную зону</h4>
              <p className="text-sm text-gray-600">
                Двойной клик на услугу для активации
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      {selectedPackage && calculation && (
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Сводка по оплате</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CreditCard className="text-purple-600 mr-2" size={16} />
                <span className="text-sm text-gray-600">Первый взнос</span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatPrice(downPayment)}
              </div>
            </div>
            
            {selectedPackage !== 'vip' && monthlyPayment > 0 && (
              <>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="text-purple-600 mr-2" size={16} />
                    <span className="text-sm text-gray-600">Ежемесячно</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatPrice(monthlyPayment)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-sm text-gray-600">Остаток</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatPrice(calculation.packages[selectedPackage].finalCost - downPayment)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
