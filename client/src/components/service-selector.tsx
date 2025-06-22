import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Gift, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Service {
  id: number;
  yclientsId: number;
  title: string;
  priceMin: string;
}

interface SelectedService extends Service {
  quantity: number;
}

interface FreeZone {
  serviceId: number;
  title: string;
  pricePerProcedure: number;
  quantity: number;
}

interface ServiceSelectorProps {
  selectedServices: SelectedService[];
  onServicesChange: (services: SelectedService[]) => void;
  onAddFreeZone: (freeZones: FreeZone[]) => void;
  freeZones: FreeZone[];
}

export default function ServiceSelector({ 
  selectedServices, 
  onServicesChange, 
  onAddFreeZone, 
  freeZones 
}: ServiceSelectorProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const addService = (serviceId: string) => {
    if (!serviceId) return;
    
    const service = services.find(s => s.yclientsId.toString() === serviceId);
    if (!service) return;
    
    const existingService = selectedServices.find(s => s.yclientsId === service.yclientsId);
    if (existingService) return;
    
    const newService: SelectedService = {
      ...service,
      quantity: 1
    };
    
    onServicesChange([...selectedServices, newService]);
    setSelectedServiceId("");
  };

  const handleServiceSelect = (serviceId: string) => {
    if (serviceId) {
      addService(serviceId);
    }
  };

  const removeService = (yclientsId: number) => {
    onServicesChange(selectedServices.filter(s => s.yclientsId !== yclientsId));
  };

  const handleDoubleClick = (service: SelectedService) => {
    // Only allow one free zone
    if (freeZones.length > 0) return;
    
    // Add as free zone
    const freeZone: FreeZone = {
      serviceId: service.yclientsId,
      title: service.title,
      pricePerProcedure: parseFloat(service.priceMin),
      quantity: 1
    };
    
    onAddFreeZone([...freeZones, freeZone]);
  };

  const removeFreeZone = (serviceId: number) => {
    onAddFreeZone(freeZones.filter(z => z.serviceId !== serviceId));
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-xl"></div>;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Зоны для процедур</label>
      
      {/* Service Selection */}
      <div className="relative mb-4">
        <Select value={selectedServiceId} onValueChange={handleServiceSelect}>
          <SelectTrigger className="input-premium">
            <SelectValue placeholder="Поиск и выбор услуг..." />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2">
              <input
                type="text"
                placeholder="Поиск услуг..."
                className="w-full px-3 py-2 border rounded-md"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  // This is a simple search implementation
                }}
              />
            </div>
            {services
              .filter(service => !selectedServices.find(s => s.yclientsId === service.yclientsId))
              .map((service) => (
                <SelectItem key={service.yclientsId} value={service.yclientsId.toString()}>
                  {service.title} ({formatPrice(parseFloat(service.priceMin))})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Selected Services */}
      <div className="space-y-2">
        {selectedServices.map((service) => (
          <div
            key={service.yclientsId}
            className={`flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${freeZones.length > 0 ? 'opacity-50' : ''}`}
            onDoubleClick={() => handleDoubleClick(service)}
            title={freeZones.length > 0 ? "Можно добавить только одну бесплатную зону" : "Двойной клик для добавления бесплатной зоны"}
          >
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{service.title}</span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {formatPrice(parseFloat(service.priceMin))} за процедуру
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeService(service.yclientsId)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <X size={16} />
            </Button>
          </div>
        ))}
      </div>

      {/* Free Zones */}
      {freeZones.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Бесплатные зоны</span>
          </div>
          
          <div className="space-y-2">
            {freeZones.map((zone) => (
              <div
                key={zone.serviceId}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
              >
                <div className="flex items-center">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 mr-2">
                    ПОДАРОК
                  </Badge>
                  <span className="text-sm font-medium">{zone.title}</span>
                  <span className="ml-2 text-xs text-green-600">
                    Экономия: {formatPrice(zone.pricePerProcedure * zone.quantity)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFreeZone(zone.serviceId)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}
