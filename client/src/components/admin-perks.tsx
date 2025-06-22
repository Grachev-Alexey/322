import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Check, X } from "lucide-react";
import * as Icons from "lucide-react";
import { type Perk, type PackagePerkValue } from "@/hooks/use-package-perks";

interface AdminPerksProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function AdminPerks({ loading, setLoading }: AdminPerksProps) {
  const [perks, setPerks] = useState<Perk[]>([]);
  const [perkValues, setPerkValues] = useState<PackagePerkValue[]>([]);
  const [editingPerk, setEditingPerk] = useState<number | null>(null);
  const [newPerk, setNewPerk] = useState({
    name: '',
    description: '',
    icon: 'Check',
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
        setNewPerk({ name: '', description: '', icon: 'Check', displayOrder: 0 });
        
        // Create default values for all packages
        for (const packageType of packageTypes) {
          await createPerkValue(createdPerk.id, packageType, {
            valueType: 'boolean',
            booleanValue: false,
            displayValue: 'Не включено'
          });
        }
        
        toast({ title: "Перк создан", description: "Новый перк добавлен успешно" });
        await loadData(); // Reload to get fresh data
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

  const getPerkValuesForPerk = (perkId: number) => {
    return packageTypes.map(packageType => {
      const value = perkValues.find(pv => pv.perkId === perkId && pv.packageType === packageType);
      return { packageType, value };
    });
  };

  const renderPerkValueEditor = (perkId: number, packageType: string, currentValue?: PackagePerkValue) => {
    const [editing, setEditing] = useState(false);
    const [valueType, setValueType] = useState(currentValue?.valueType || 'boolean');
    const [displayValue, setDisplayValue] = useState(currentValue?.displayValue || 'Не включено');
    const [booleanValue, setBooleanValue] = useState(currentValue?.booleanValue || false);
    const [textValue, setTextValue] = useState(currentValue?.textValue || '');
    const [isHighlighted, setIsHighlighted] = useState(currentValue?.isHighlighted || false);

    const saveValue = async () => {
      const updates = {
        valueType,
        displayValue,
        booleanValue: valueType === 'boolean' ? booleanValue : null,
        textValue: valueType === 'text' ? textValue : null,
        isHighlighted
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
            {currentValue?.booleanValue !== null && (
              currentValue?.booleanValue ? 
                <Check className="h-4 w-4 text-green-500" /> : 
                <X className="h-4 w-4 text-gray-400" />
            )}
            <span className={currentValue?.isHighlighted ? 'font-bold text-blue-600' : ''}>
              {currentValue?.displayValue || 'Не задано'}
            </span>
            {currentValue?.isHighlighted && (
              <Badge variant="secondary" className="text-xs">Выделено</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-2 p-2 border rounded bg-gray-50">
        <Select value={valueType} onValueChange={setValueType}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="boolean">Да/Нет</SelectItem>
            <SelectItem value="text">Текст</SelectItem>
          </SelectContent>
        </Select>

        {valueType === 'boolean' ? (
          <div className="flex items-center space-x-2">
            <Switch checked={booleanValue} onCheckedChange={setBooleanValue} />
            <Label className="text-sm">Включено</Label>
          </div>
        ) : (
          <Input
            placeholder="Значение (например: 90 дней, 15%)"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            className="h-8"
          />
        )}

        <Input
          placeholder="Текст для отображения"
          value={displayValue}
          onChange={(e) => setDisplayValue(e.target.value)}
          className="h-8"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch checked={isHighlighted} onCheckedChange={setIsHighlighted} />
            <Label className="text-sm">Выделить</Label>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={saveValue}>
              <Check className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Create New Perk */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Создать новый перк</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Название перка"
              value={newPerk.name}
              onChange={(e) => setNewPerk({ ...newPerk, name: e.target.value })}
            />
            <Input
              placeholder="Описание"
              value={newPerk.description}
              onChange={(e) => setNewPerk({ ...newPerk, description: e.target.value })}
            />
            <Select value={newPerk.icon} onValueChange={(value) => setNewPerk({ ...newPerk, icon: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pause">⏸️ Pause (Заморозка)</SelectItem>
                <SelectItem value="Shield">🛡️ Shield (Гарантия)</SelectItem>
                <SelectItem value="User">👤 User (Менеджер)</SelectItem>
                <SelectItem value="Gift">🎁 Gift (Подарки)</SelectItem>
                <SelectItem value="Clock">⏰ Clock (Время)</SelectItem>
                <SelectItem value="Percent">💰 Percent (Скидка)</SelectItem>
                <SelectItem value="Check">✅ Check (Галочка)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={createPerk} disabled={loading || !newPerk.name.trim()}>
              Создать
            </Button>
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
              const IconComponent = (Icons as any)[perk.icon] || Icons.Check;
              const perkValuesData = getPerkValuesForPerk(perk.id);
              
              return (
                <div key={perk.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium">{perk.name}</h3>
                        {perk.description && (
                          <p className="text-sm text-gray-500">{perk.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">Порядок: {perk.displayOrder}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {perkValuesData.map(({ packageType, value }) => (
                      <div key={packageType} className="space-y-2">
                        <Label className="font-medium text-center block">
                          {packageNames[packageType]}
                        </Label>
                        {renderPerkValueEditor(perk.id, packageType, value)}
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
  );
}