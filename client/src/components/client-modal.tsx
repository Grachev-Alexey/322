import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Loader2 } from "lucide-react";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/utils";
import PhoneInput from "./ui/phone-input";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: any;
  selectedPackage: string | null;
  selectedServices: any[];
  downPayment: number;
  installmentMonths: number;
  usedCertificate: boolean;
  freeZones: any[];
}

export default function ClientModal({
  isOpen,
  onClose,
  calculation,
  selectedPackage,
  selectedServices,
  downPayment,
  installmentMonths,
  usedCertificate,
  freeZones
}: ClientModalProps) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phone)) {
      toast({
        title: "Ошибка",
        description: "Введите корректный номер телефона",
        variant: "destructive"
      });
      return;
    }

    if (!selectedPackage || !calculation) {
      toast({
        title: "Ошибка",
        description: "Выберите пакет для продолжения",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const subscriptionData = {
        client: {
          phone: phone.replace(/\D/g, ''),
          email: email || undefined
        },
        calculation: {
          services: selectedServices.map(service => ({
            id: service.yclientsId,
            name: service.title,
            quantity: 1 // This would be dynamic in a real implementation
          })),
          packageType: selectedPackage,
          baseCost: calculation.baseCost,
          finalCost: calculation.packages[selectedPackage].finalCost,
          totalSavings: calculation.packages[selectedPackage].totalSavings,
          downPayment,
          installmentMonths: selectedPackage === 'vip' ? undefined : installmentMonths,
          monthlyPayment: selectedPackage === 'vip' ? undefined : calculation.packages[selectedPackage].monthlyPayment,
          usedCertificate,
          freeZones,
          appliedDiscounts: calculation.packages[selectedPackage].appliedDiscounts
        }
      };

      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(subscriptionData)
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Успешно!",
          description: `Абонемент "${result.subscriptionType}" создан`,
        });
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать абонемент",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="text-white text-2xl" size={24} />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            Данные клиента
          </DialogTitle>
          <p className="text-center text-gray-600">
            Заполните контактную информацию для оформления
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Номер телефона *
            </Label>
            <PhoneInput
              id="phone"
              value={phone}
              onChange={setPhone}
              placeholder="+7 (___) ___-__-__"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email (опционально)
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-premium"
              placeholder="client@example.com"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                "Создать абонемент"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
