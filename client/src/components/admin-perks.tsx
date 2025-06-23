import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Check, X, Save, Crown, Diamond, Shield, Heart, Star, Zap, Gift, Award, Calendar, Clock, Percent, User, Users, UserCheck, Sparkles, Target, Gem, Coins } from "lucide-react";
import * as Icons from "lucide-react";
import { type Perk, type PackagePerkValue } from "@/hooks/use-package-perks";

interface AdminPerksProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

// Available icons for perks
const availableIcons = [
  { name: 'Check', component: Check, label: 'Галочка' },
  { name: 'Crown', component: Crown, label: 'Корона' },
  { name: 'Diamond', component: Diamond, label: 'Алмаз' },
  { name: 'Shield', component: Shield, label: 'Щит' },
  { name: 'Heart', component: Heart, label: 'Сердце' },
  { name: 'Star', component: Star, label: 'Звезда' },
  { name: 'Zap', component: Zap, label: 'Молния' },
  { name: 'Gift', component: Gift, label: 'Подарок' },
  { name: 'Award', component: Award, label: 'Награда' },
  { name: 'Calendar', component: Calendar, label: 'Календарь' },
  { name: 'Clock', component: Clock, label: 'Часы' },
  { name: 'Percent', component: Percent, label: 'Процент' },
  { name: 'User', component: User, label: 'Пользователь' },
  { name: 'Users', component: Users, label: 'Пользователи' },
  { name: 'UserCheck', component: UserCheck, label: 'Проверенный пользователь' },
  { name: 'Sparkles', component: Sparkles, label: 'Блеск' },
  { name: 'Target', component: Target, label: 'Цель' },
  { name: 'Gem', component: Gem, label: 'Драгоценный камень' },
  { name: 'Coins', component: Coins, label: 'Монеты' }
];

// Predefined colors
const colorOptions = [
  { value: '#000000', label: 'Черный' },
  { value: '#8B5CF6', label: 'Фиолетовый' },
  { value: '#3B82F6', label: 'Синий' },
  { value: '#10B981', label: 'Зеленый' },
  { value: '#F59E0B', label: 'Оранжевый' },
  { value: '#EF4444', label: 'Красный' },
  { value: '#EC4899', label: 'Розовый' },
  { value: '#6B7280', label: 'Серый' },
  { value: '#D97706', label: 'Янтарный' },
  { value: '#059669', label: 'Изумрудный' }
];

export default function AdminPerks({ loading, setLoading }: AdminPerksProps) {
  const [perks, setPerks] = useState<Perk[]>([]);
  const [perkValues, setPerkValues] = useState<PackagePerkValue[]>([]);
  const [editingPerk, setEditingPerk] = useState<number | null>(null);
  const [newPerk, setNewPerk] = useState({
    name: '',
    description: '',
    icon: 'Check',
    iconColor: '#000000',
    displayOrder: 0
  });
  const { toast } = useToast();

  const packageTypes = ['vip', 'standard', 'economy'] as const;
  const packageNames = { vip: 'VIP', standard: 'Стандарт', economy: 'Эконом' };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [perksRes, valuesRes] = await Promise.all([
        fetch('/api/admin/perks', { credentials: 'include' }),
        fetch('/api/admin/perk-values', { credentials: 'include' })
      ]);
      
      if (perksRes.ok && valuesRes.ok) {
        const perksData = await perksRes.json();
        const valuesData = await valuesRes.json();
        setPerks(perksData);
        setPerkValues(valuesData);
      }
    } catch (error) {
      console.error('Error loading perks data:', error);
    }
  };

  const createPerk = async () => {
    if (!newPerk.name.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/perks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newPerk)
      });

      if (response.ok) {
        const createdPerk = await response.json();
        setPerks([...perks, createdPerk]);
        setNewPerk({ name: '', description: '', icon: 'Check', iconColor: '#000000', displayOrder: 0 });
        
        // Create default values for all packages
        for (const packageType of packageTypes) {
          await createPerkValue(createdPerk.id, packageType, {
            valueType: 'boolean',
            booleanValue: false,
            displayValue: 'Не включено'
          });
        }
        
        toast({ title: "Перк создан", description: "Новый перк добавлен успешно" });
        await loadData();
      }
    } catch (error) {
      console.error('Error creating perk:', error);
      toast({ title: "Ошибка", description: "Не удалось создать перк", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createPerkValue = async (perkId: number, packageType: string, valueData: any) => {
    try {
      const response = await fetch('/api/admin/perk-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          perkId,
          packageType,
          isActive: true,
          isHighlighted: false,
          isBest: false,
          ...valueData
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Error creating perk value:', error);
      return false;
    }
  };

  const updatePerkValue = async (valueId: number, updates: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/perk-values/${valueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await loadData();
        toast({ title: "Обновлено", description: "Значение перка обновлено" });
      }
    } catch (error) {
      console.error('Error updating perk value:', error);
      toast({ title: "Ошибка", description: "Не удалось обновить значение", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updatePerk = async (perkId: number, updates: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/perks/${perkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await loadData();
        setEditingPerk(null);
        toast({ title: "Обновлено", description: "Перк обновлен" });
      }
    } catch (error) {
      console.error('Error updating perk:', error);
      toast({ title: "Ошибка", description: "Не удалось обновить перк", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deletePerk = async (perkId: number) => {
    if (!confirm('Удалить этот перк? Это действие нельзя отменить.')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/perks/${perkId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await loadData();
        toast({ title: "Успешно", description: "Перк удален" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось удалить перк", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getPerkValuesForPerk = (perkId: number) => {
    return packageTypes.map(packageType => {
      const value = perkValues.find(pv => pv.perkId === perkId && pv.packageType === packageType);
      return { packageType, value };
    });
  };

  const PerkValueEditor = ({ perkId, packageType, currentValue }: { 
    perkId: number; 
    packageType: string; 
    currentValue?: PackagePerkValue 
  }) => {
    const [editing, setEditing] = useState(false);
    const [valueType, setValueType] = useState(currentValue?.valueType || 'boolean');
    const [displayValue, setDisplayValue] = useState(currentValue?.displayValue || 'Не включено');
    const [booleanValue, setBooleanValue] = useState(currentValue?.booleanValue || false);
    const [textValue, setTextValue] = useState(currentValue?.textValue || '');
    const [numberValue, setNumberValue] = useState(currentValue?.numberValue?.toString() || '');
    const [tooltip, setTooltip] = useState(currentValue?.tooltip || '');
    const [customIcon, setCustomIcon] = useState(currentValue?.customIcon || 'none');
    const [customIconColor, setCustomIconColor] = useState(currentValue?.customIconColor || '#000000');
    const [isHighlighted, setIsHighlighted] = useState(currentValue?.isHighlighted || false);
    const [isBest, setIsBest] = useState(currentValue?.isBest || false);
    
    // Update state when currentValue changes
    useEffect(() => {
      if (currentValue) {
        setValueType(currentValue.valueType || 'boolean');
        setDisplayValue(currentValue.displayValue || 'Не включено');
        setBooleanValue(currentValue.booleanValue || false);
        setTextValue(currentValue.textValue || '');
        setNumberValue(currentValue.numberValue?.toString() || '');
        setTooltip(currentValue.tooltip || '');
        setCustomIcon(currentValue.customIcon || 'none');
        setCustomIconColor(currentValue.customIconColor || '#000000');
        setIsHighlighted(currentValue.isHighlighted || false);
        setIsBest(currentValue.isBest || false);
      }
    }, [currentValue]);

    const saveValue = async () => {
      const updates = {
        valueType,
        displayValue,
        booleanValue: valueType === 'boolean' ? booleanValue : null,
        textValue: valueType === 'text' ? textValue : null,
        numberValue: valueType === 'number' ? parseFloat(numberValue) || null : null,
        tooltip: tooltip || null,
        customIcon: customIcon && customIcon !== 'none' ? customIcon : null,
        customIconColor: customIconColor || null,
        isHighlighted,
        isBest
      };

      if (currentValue) {
        await updatePerkValue(currentValue.id, updates);
      } else {
        await createPerkValue(perkId, packageType, updates);
      }
      setEditing(false);
    };

    if (!editing) {
      return (
        <div className="flex items-center justify-between p-2 border rounded">
          <div className="flex items-center space-x-2">
            {currentValue?.customIcon && currentValue.customIcon !== 'none' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span style={{ color: currentValue.customIconColor || '#000000' }} className="cursor-help">
                    {React.createElement((Icons as any)[currentValue.customIcon] || Check, { className: "h-4 w-4" })}
                  </span>
                </TooltipTrigger>
                {currentValue.tooltip && (
                  <TooltipContent>
                    <p>{currentValue.tooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}
            <span className={`text-sm ${currentValue?.isHighlighted ? 'font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded' : ''}`}>
              {currentValue?.displayValue || 'Не задано'}
            </span>
            {currentValue?.isBest && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">Лучшее</Badge>
            )}
            {currentValue?.isHighlighted && (
              <Badge variant="outline" className="text-xs border-purple-500 text-purple-600">Выделено</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3 p-3 border rounded bg-gray-50">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Тип значения</Label>
            <Select value={valueType} onValueChange={setValueType}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boolean">Да/Нет</SelectItem>
                <SelectItem value="text">Текст</SelectItem>
                <SelectItem value="number">Число</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Отображаемое значение</Label>
            <Input 
              value={displayValue} 
              onChange={(e) => setDisplayValue(e.target.value)}
              placeholder="Как показать пользователю"
              className="h-8"
            />
          </div>
        </div>

        {valueType === 'boolean' && (
          <div className="flex items-center space-x-2">
            <Switch checked={booleanValue} onCheckedChange={setBooleanValue} />
            <Label className="text-xs">Включено</Label>
          </div>
        )}

        {valueType === 'text' && (
          <div>
            <Label className="text-xs">Текстовое значение</Label>
            <Input 
              value={textValue} 
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Например: 365 дней"
              className="h-8"
            />
          </div>
        )}

        {valueType === 'number' && (
          <div>
            <Label className="text-xs">Числовое значение</Label>
            <Input 
              type="number"
              value={numberValue} 
              onChange={(e) => setNumberValue(e.target.value)}
              placeholder="Например: 25"
              className="h-8"
            />
          </div>
        )}

        <div>
          <Label className="text-xs">Подсказка при наведении</Label>
          <Textarea 
            value={tooltip} 
            onChange={(e) => setTooltip(e.target.value)}
            placeholder="Скидка 50% на все процедуры"
            className="h-16 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Кастомная иконка</Label>
            <Select value={customIcon} onValueChange={setCustomIcon}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Выберите иконку" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без иконки</SelectItem>
                {availableIcons.map(icon => (
                  <SelectItem key={icon.name} value={icon.name}>
                    <div className="flex items-center space-x-2">
                      {React.createElement(icon.component, { className: "h-3 w-3" })}
                      <span>{icon.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Цвет иконки</Label>
            <Select value={customIconColor} onValueChange={setCustomIconColor}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(color => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded border" 
                        style={{ backgroundColor: color.value }}
                      />
                      <span>{color.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch checked={isHighlighted} onCheckedChange={setIsHighlighted} />
            <Label className="text-xs">Выделить</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={isBest} onCheckedChange={setIsBest} />
            <Label className="text-xs">"Лучшее"</Label>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button size="sm" onClick={saveValue} className="h-7">
            <Save className="h-3 w-3 mr-1" />
            Сохранить
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="h-7">
            <X className="h-3 w-3 mr-1" />
            Отмена
          </Button>
        </div>
      </div>
    );
  };

  const PerkEditor = ({ perk }: { perk: Perk }) => {
    const [name, setName] = useState(perk.name);
    const [description, setDescription] = useState(perk.description || '');
    const [icon, setIcon] = useState(perk.icon);
    const [iconColor, setIconColor] = useState(perk.iconColor || '#000000');
    const [displayOrder, setDisplayOrder] = useState(perk.displayOrder);

    const save = () => {
      updatePerk(perk.id, { name, description, icon, iconColor, displayOrder });
    };

    return (
      <div className="space-y-3 p-3 border rounded bg-blue-50">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Название</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Порядок отображения</Label>
            <Input 
              type="number"
              value={displayOrder} 
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              className="h-8"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Описание</Label>
          <Textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            className="h-16 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Иконка</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableIcons.map(iconOption => (
                  <SelectItem key={iconOption.name} value={iconOption.name}>
                    <div className="flex items-center space-x-2">
                      {React.createElement(iconOption.component, { className: "h-3 w-3" })}
                      <span>{iconOption.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Цвет иконки</Label>
            <Select value={iconColor} onValueChange={setIconColor}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(color => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded border" 
                        style={{ backgroundColor: color.value }}
                      />
                      <span>{color.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button size="sm" onClick={save} className="h-7">
            <Save className="h-3 w-3 mr-1" />
            Сохранить
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditingPerk(null)} className="h-7">
            <X className="h-3 w-3 mr-1" />
            Отмена
          </Button>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Add New Perk */}
        <Card>
          <CardHeader>
            <CardTitle>Создать новый перк</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label>Название</Label>
                <Input
                  value={newPerk.name}
                  onChange={(e) => setNewPerk({ ...newPerk, name: e.target.value })}
                  placeholder="Название перка"
                />
              </div>
              <div>
                <Label>Описание</Label>
                <Input
                  value={newPerk.description}
                  onChange={(e) => setNewPerk({ ...newPerk, description: e.target.value })}
                  placeholder="Описание перка"
                />
              </div>
              <div>
                <Label>Иконка</Label>
                <Select value={newPerk.icon} onValueChange={(value) => setNewPerk({ ...newPerk, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map(icon => (
                      <SelectItem key={icon.name} value={icon.name}>
                        <div className="flex items-center space-x-2">
                          {React.createElement(icon.component, { className: "h-4 w-4" })}
                          <span>{icon.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Цвет иконки</Label>
                <Select value={newPerk.iconColor} onValueChange={(value) => setNewPerk({ ...newPerk, iconColor: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded border" 
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={createPerk} disabled={loading || !newPerk.name.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Perks Management */}
        <Card>
          <CardHeader>
            <CardTitle>Управление перками и их значениями</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {perks.map((perk) => {
                const IconComponent = (Icons as any)[perk.icon] || Check;
                const perkValuesData = getPerkValuesForPerk(perk.id);
                
                return (
                  <div key={perk.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <IconComponent 
                          className="h-5 w-5" 
                          style={{ color: perk.iconColor || '#000000' }}
                        />
                        <div>
                          <h3 className="font-medium">{perk.name}</h3>
                          {perk.description && (
                            <p className="text-sm text-gray-500">{perk.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Порядок: {perk.displayOrder}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPerk(editingPerk === perk.id ? null : perk.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePerk(perk.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {editingPerk === perk.id && (
                      <PerkEditor perk={perk} />
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {perkValuesData.map(({ packageType, value }) => (
                        <div key={packageType} className="space-y-2">
                          <h4 className="font-medium text-sm">{packageNames[packageType]}</h4>
                          <PerkValueEditor
                            perkId={perk.id}
                            packageType={packageType}
                            currentValue={value}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}