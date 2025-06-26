import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Loader2, Copy, CheckCircle, FileText } from "lucide-react";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/utils";
import PhoneInput from "./ui/phone-input";
import OfferModal from "./offer-modal-simple";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: any;
  selectedPackage: string | null;
  selectedServices: any[];
  procedureCount: number;
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
  procedureCount,
  downPayment,
  installmentMonths,
  usedCertificate,
  freeZones
}: ClientModalProps) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscriptionTitle, setSubscriptionTitle] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerSent, setOfferSent] = useState(false);
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
            quantity: (service.quantity || 1) * procedureCount
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
        setSubscriptionTitle(result.subscriptionType);
        setIsCompleted(true);
        
        // Автоматически создаем и отправляем договор-оферту
        await createAndSendOffer();
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

  const createAndSendOffer = async () => {
    if (!selectedPackage || !calculation) {
      return;
    }

    try {
      // Создаем оферту
      const packageData = calculation.packages[selectedPackage];
      const offerData = {
        clientName,
        clientPhone: phone.replace(/\D/g, ''),
        clientEmail: email,
        selectedPackage,
        selectedServices: selectedServices.map(service => ({
          id: service.yclientsId,
          name: service.title,
          price: service.priceMin,
          quantity: (service.quantity || 1) * procedureCount
        })),
        calculation: {
          baseCost: calculation.baseCost,
          finalCost: packageData.finalCost,
          totalSavings: packageData.totalSavings,
          downPayment,
          installmentMonths: selectedPackage === 'vip' ? undefined : installmentMonths,
          monthlyPayment: selectedPackage === 'vip' ? undefined : packageData.monthlyPayment,
          usedCertificate,
          freeZones,
          appliedDiscounts: packageData.appliedDiscounts
        }
      };

      const createResponse = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(offerData)
      });

      if (createResponse.ok) {
        const offer = await createResponse.json();
        
        // Отправляем оферту
        const sendResponse = await fetch(`/api/offers/${offer.id}/send`, {
          method: "POST",
          credentials: "include"
        });

        if (sendResponse.ok) {
          setOfferSent(true);
          toast({
            title: "Договор отправлен!",
            description: `Договор-оферта успешно отправлен на ${email}`,
          });
        } else {
          throw new Error("Не удалось отправить договор");
        }
      } else {
        throw new Error("Не удалось создать договор");
      }
    } catch (error) {
      console.error("Error creating/sending offer:", error);
      // Не показываем ошибку пользователю, чтобы не портить успешное создание абонемента
      // Просто логируем ошибку
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Скопировано!",
        description: "Название абонемента скопировано в буфер обмена",
      });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать в буфер обмена",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setPhone("");
    setEmail("");
    setClientName("");
    setSubscriptionTitle("");
    setIsCompleted(false);
    setOfferSent(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isCompleted 
                ? "bg-gradient-to-r from-green-500 to-green-600" 
                : "bg-gradient-to-r from-purple-500 to-purple-600"
            }`}>
              {isCompleted ? (
                <CheckCircle className="text-white text-2xl" size={24} />
              ) : (
                <User className="text-white text-2xl" size={24} />
              )}
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            {isCompleted ? "Абонемент создан!" : "Данные клиента"}
          </DialogTitle>
        </DialogHeader>
        
        {isCompleted ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Название абонемента:
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={subscriptionTitle}
                  readOnly
                  className="flex-1 bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(subscriptionTitle)}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {offerSent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Договор-оферта отправлен на {email}</span>
                </div>
              </div>
            )}
            
            <Button
              type="button"
              onClick={handleClose}
              className="w-full btn-primary"
            >
              Закрыть
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                ФИО клиента *
              </Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="input-premium"
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>
            
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
                Email клиента *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-premium"
                placeholder="client@example.com"
                required
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={loading}
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOfferModal(true)}
                className="flex-1"
                disabled={loading || !selectedPackage}
              >
                <FileText className="w-4 h-4 mr-2" />
                Договор-оферта
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
        )}
      </DialogContent>
      
      <OfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        calculation={calculation}
        selectedPackage={selectedPackage}
        selectedServices={selectedServices}
        downPayment={downPayment}
        installmentMonths={installmentMonths}
        usedCertificate={usedCertificate}
        freeZones={freeZones}
        clientName={clientName}
        clientPhone={phone}
        clientEmail={email}
      />
    </Dialog>
  );
}
