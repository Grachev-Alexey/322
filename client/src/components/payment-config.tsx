import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RangeSlider } from "@/components/ui/range-slider";
import { Gift, CreditCard, Calendar } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

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
  getMinDownPayment: () => number;
  getMaxDownPayment: () => number;
}

interface Package {
  id: number;
  type: string;
  name: string;
  discount: string;
  minCost: string;
  minDownPaymentPercent: string;
  requiresFullPayment: boolean;
  giftSessions: number;
  bonusAccountPercent: string;
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
  calculation,
  getMinDownPayment,
  getMaxDownPayment
}: PaymentConfigProps) {
  // Get packages data from API
  const { data: packages = [] } = useQuery<Package[]>({
    queryKey: ['/api/packages'],
    enabled: true
  });

  // Get calculator settings for installment options and certificate config
  const { data: calculatorSettings } = useQuery({
    queryKey: ['/api/config/calculator-settings'],
    queryFn: async () => {
      const configs = await Promise.all([
        fetch('/api/config/installment_months_options', { credentials: 'include' }),
        fetch('/api/config/certificate_discount_percentage', { credentials: 'include' }),
        fetch('/api/config/certificate_min_course_amount', { credentials: 'include' })
      ]);
      
      const [monthsOptions, certificateAmount, certificateMinAmount] = await Promise.all(
        configs.map(response => response.ok ? response.json() : null)
      );
      
      return { 
        installmentMonthsOptions: monthsOptions || [2, 3, 4, 5, 6],
        certificateDiscountAmount: certificateAmount || 3000,
        certificateMinCourseAmount: certificateMinAmount || 25000
      };
    },
    enabled: true
  });

  // Find current package config
  const currentPackageConfig = selectedPackage ? packages.find(p => p.type === selectedPackage) : null;
  const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    onDownPaymentChange(value);
  };



  const monthlyPayment = selectedPackage && calculation?.packages[selectedPackage] 
    ? (calculation.packages[selectedPackage].finalCost - downPayment) / installmentMonths
    : 0;

  return (
    <Card className="payment-card rounded-xl p-8 mb-8">
      <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--graphite)' }}>Условия оплаты</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Down Payment */}
        <div>
          <Label htmlFor="downPayment" className="block text-sm font-medium text-gray-700 mb-3">
            Первый взнос
          </Label>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/30 rounded-xl p-6 border border-gray-200/40">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-purple-600">
                {formatPrice(downPayment)}
              </div>
              <div className="text-sm text-gray-600">
                {selectedPackage ? `Пакет: ${selectedPackage.toUpperCase()}` : 'Выберите пакет'}
              </div>
            </div>
            
            {selectedPackage && (
              <RangeSlider
                min={getMinDownPayment()}
                max={getMaxDownPayment()}
                step={100}
                value={downPayment}
                onChange={onDownPaymentChange}
                formatLabel={formatPrice}
                disabled={currentPackageConfig?.requiresFullPayment || false}
              />
            )}
            
            {selectedPackage && (
              <div className="text-xs text-center text-gray-500 mt-2">
                Диапазон: {formatPrice(getMinDownPayment())} - {formatPrice(getMaxDownPayment())}
              </div>
            )}
          </div>
        </div>
        
        {/* Installment Period */}
        <div>
          <Label htmlFor="installmentMonths" className="block text-sm font-medium text-gray-700 mb-3">
            Срок рассрочки
          </Label>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-xl p-6 border border-blue-200/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-purple-600">{installmentMonths}</span>
              <span className="text-sm text-gray-600">
                {installmentMonths === 1 ? 'месяц' : 
                 installmentMonths <= 4 ? 'месяца' : 'месяцев'}
              </span>
            </div>
            
            <RangeSlider
              min={Math.min(...(calculatorSettings?.installmentMonthsOptions || [2]))}
              max={Math.max(...(calculatorSettings?.installmentMonthsOptions || [6]))}
              step={1}
              value={installmentMonths}
              onChange={onInstallmentMonthsChange}
              formatLabel={(val) => `${val} мес`}
            />
            
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
      <div className="mt-8">
        {/* Certificate */}
        <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-300 transition-colors max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Gift className="text-purple-600" size={20} />
              <div>
                <h4 className="font-semibold text-gray-900">Сертификат на скидку</h4>
                <p className="text-sm text-gray-600">
                  Скидка {calculatorSettings?.certificateDiscountAmount?.toLocaleString() || '3 000'} ₽ при курсе ≥{calculatorSettings?.certificateMinCourseAmount?.toLocaleString() || '25 000'} ₽
                </p>
                {baseCost < (calculatorSettings?.certificateMinCourseAmount || 25000) && (
                  <p className="text-xs text-red-500 mt-1">
                    Недоступно для текущего курса
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={usedCertificate}
              onCheckedChange={onCertificateChange}
              disabled={baseCost < (calculatorSettings?.certificateMinCourseAmount || 25000)}
            />
          </div>
          
          {usedCertificate && (
            <div className="mt-3 p-2 bg-green-50 rounded-lg">
              <div className="flex items-center text-sm text-green-700">
                <Gift className="w-4 h-4 mr-2" />
                Применена скидка {calculatorSettings?.certificateDiscountAmount?.toLocaleString() || '3 000'} ₽
              </div>
            </div>
          )}
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
