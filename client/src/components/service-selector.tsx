import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Gift, Plus, Search, ChevronDown, Edit3 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Service {
  id: number;
  yclientsId: number;
  title: string;
  priceMin: string;
}

interface SelectedService extends Service {
  quantity: number;
  customPrice?: string; // Добавляем возможность кастомной цены
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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number, width: number} | null>(null);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Filter services based on search term
  const filteredServices = services
    .filter(service => !selectedServices.find(s => s.yclientsId === service.yclientsId))
    .filter(service => 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.priceMin.includes(searchTerm)
    );

  // Update dropdown position when opening
  const updateDropdownPosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const addService = (service: Service) => {
    const existingService = selectedServices.find(s => s.yclientsId === service.yclientsId);
    if (existingService) return;
    
    const newService: SelectedService = {
      ...service,
      quantity: 1
    };
    
    onServicesChange([...selectedServices, newService]);
    setSearchTerm("");
    
    // Keep dropdown open and refocus input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        updateDropdownPosition();
      }
    }, 50);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside the input AND outside the dropdown portal
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        // Also check if the click is not within any dropdown portal element
        const isInDropdown = (target as Element)?.closest('[data-dropdown-portal]');
        if (!isInDropdown) {
          setIsOpen(false);
          setDropdownPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const startEditingPrice = (serviceId: number, currentPrice: string) => {
    setEditingPrice(serviceId);
    setTempPrice(currentPrice);
  };

  const savePrice = (serviceId: number) => {
    const updatedServices = selectedServices.map(service => 
      service.yclientsId === serviceId 
        ? { ...service, customPrice: tempPrice }
        : service
    );
    onServicesChange(updatedServices);
    setEditingPrice(null);
    setTempPrice("");
  };

  const cancelEditingPrice = () => {
    setEditingPrice(null);
    setTempPrice("");
  };

  const getCurrentPrice = (service: SelectedService) => {
    return service.customPrice || service.priceMin;
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-16 lg:h-20 rounded-xl"></div>;
  }

  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Зоны для процедур</label>
      
      {/* Service Selection */}
      <div className="relative mb-2 z-50" ref={dropdownRef}>
        <div className="relative group">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Поиск услуг..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isOpen) {
                  setIsOpen(true);
                  updateDropdownPosition();
                }
              }}
              onFocus={() => {
                setIsOpen(true);
                updateDropdownPosition();
              }}
              className="input-premium text-xs h-7 pr-8 pl-8 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
            />
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Search className="h-3 w-3 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
            </div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
        
        {isOpen && dropdownPosition && createPortal(
          <div 
            data-dropdown-portal
            className="fixed z-[99999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl backdrop-blur-sm max-h-[280px] overflow-hidden animate-in slide-in-from-top-2 duration-200"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`
            }}
          >
            <div className="overflow-y-auto max-h-[280px] beautiful-scroll">
              {filteredServices.length === 0 ? (
                <div className="p-6 text-center">
                  <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="text-sm text-gray-500">
                    {searchTerm ? "Услуги не найдены" : selectedServices.length > 0 ? "Добавить еще услуги" : "Начните вводить название услуги"}
                  </div>
                  {searchTerm && (
                    <div className="text-xs text-gray-400 mt-1">
                      Попробуйте изменить поисковый запрос
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2">
                  {filteredServices.slice(0, 20).map((service, index) => (
                    <div
                      key={service.yclientsId}
                      className="group/item flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20 transition-all duration-200 hover:shadow-sm"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addService(service);
                      }}
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 mr-2 opacity-60 group-hover/item:opacity-100 transition-opacity" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-gray-900 dark:text-white truncate group-hover/item:text-purple-700 dark:group-hover/item:text-purple-300 transition-colors">
                            {service.title}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center ml-1">
                        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 px-1.5 py-0.5 rounded-full">
                          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                            {formatPrice(parseFloat(service.priceMin))}
                          </span>
                        </div>
                        <Plus className="h-3 w-3 text-gray-400 ml-1 group-hover/item:text-purple-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                  {filteredServices.length > 20 && (
                    <div className="p-3 text-xs text-gray-500 text-center border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                        <span>Показано 20 из {filteredServices.length} услуг</span>
                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Уточните поиск для лучших результатов</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
      
      {/* Selected Services */}
      <div className="space-y-1">
        {selectedServices.map((service) => (
          <div
            key={service.yclientsId}
            className={`flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 ${freeZones.length > 0 ? 'opacity-50' : ''}`}
            onDoubleClick={() => handleDoubleClick(service)}
            title={freeZones.length > 0 ? "Можно добавить только одну бесплатную зону" : "Двойной клик для добавления бесплатной зоны"}
          >
            <div className="flex items-center min-w-0 flex-1">
              <span className="text-xs font-medium text-gray-900 dark:text-white truncate">{service.title}</span>
              <div className="ml-2 flex items-center gap-1 flex-shrink-0">
                {editingPrice === service.yclientsId ? (
                  <>
                    <Input
                      type="number"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          savePrice(service.yclientsId);
                        } else if (e.key === 'Escape') {
                          cancelEditingPrice();
                        }
                      }}
                      className="w-16 h-5 text-xs p-1 text-center"
                      autoFocus
                      onBlur={() => savePrice(service.yclientsId)}
                    />
                    <span className="text-xs text-gray-500">₽</span>
                  </>
                ) : (
                  <>
                    <span 
                      className={`text-xs cursor-pointer hover:bg-gray-200 px-1 py-0.5 rounded transition-colors ${
                        service.customPrice ? 'text-purple-600 font-semibold' : 'text-gray-500 dark:text-gray-400'
                      }`}
                      onClick={() => startEditingPrice(service.yclientsId, getCurrentPrice(service))}
                      title="Нажмите для изменения цены"
                    >
                      {formatPrice(parseFloat(getCurrentPrice(service)))}
                    </span>
                    <Edit3 
                      className="w-3 h-3 text-gray-400 hover:text-purple-500 cursor-pointer transition-colors" 
                      onClick={() => startEditingPrice(service.yclientsId, getCurrentPrice(service))}
                    />
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeService(service.yclientsId)}
              className="text-red-500 hover:text-red-700 p-1 flex-shrink-0 h-6 w-6"
            >
              <X size={12} />
            </Button>
          </div>
        ))}
      </div>

      {/* Free Zones - only show if there are any */}
      {freeZones.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Gift className="w-3 h-3 text-pink-500" />
            <span className="text-sm font-bold text-pink-600">Бесплатные зоны</span>
          </div>
          
          <div className="space-y-1">
            {freeZones.map((zone) => (
              <div
                key={zone.serviceId}
                className="flex items-center justify-between bg-pink-50 rounded-lg p-2 border border-pink-200"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <span className="text-xs font-medium truncate">{zone.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFreeZone(zone.serviceId)}
                  className="text-red-500 hover:text-red-700 p-0.5 flex-shrink-0 h-5 w-5"
                >
                  <X size={10} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}