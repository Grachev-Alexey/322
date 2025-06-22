import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Users, Database, Package, LogOut, Trash2, Edit, Plus, Eye, EyeOff } from "lucide-react";
import AdminDashboard from "@/components/admin-dashboard";

interface User {
  id: number;
  pin: string;
  name: string;
  role: 'master' | 'admin';
  isActive: boolean;
  createdAt: string;
}

interface Service {
  id: number;
  yclientsId: number;
  title: string;
  priceMin: string;
  categoryId: number | null;
  isActive: boolean;
  updatedAt: string;
}

interface AdminPageProps {
  user: User;
  onLogout: () => void;
}

export default function AdminPage({ user, onLogout }: AdminPageProps) {
  const [yclientsConfig, setYclientsConfig] = useState({
    token: '',
    authCookie: '',
    chainId: '',
    categoryId: '',
    branchIds: [] as string[]
  });
  
  const [packages, setPackages] = useState<any[]>([]);
  const [packagePerks, setPackagePerks] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ pin: '', name: '', role: 'master' as 'master' | 'admin' });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      // Load users data
      const usersResponse = await fetch("/api/admin/users", {
        credentials: "include"
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      // Load services data
      const servicesResponse = await fetch("/api/admin/services", {
        credentials: "include"
      });
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData);
      }

      // Load packages data
      const packagesResponse = await fetch("/api/packages", {
        credentials: "include"
      });
      
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setPackages(packagesData);
        
        // Load package perks for each package
        const allPerks = [];
        for (const pkg of packagesData) {
          const perksResponse = await fetch(`/api/admin/package-perks/${pkg.type}`, {
            credentials: "include"
          });
          if (perksResponse.ok) {
            const perks = await perksResponse.json();
            allPerks.push(...perks);
          }
        }
        setPackagePerks(allPerks);
      }
      
      // Load Yclients config
      const yclientsResponse = await fetch("/api/config/yclients", {
        credentials: "include"
      });
      if (yclientsResponse.ok) {
        const yclientsData = await yclientsResponse.json();
        if (yclientsData) {
          setYclientsConfig(yclientsData);
        }
      }


    } catch (error) {
      console.error("Error loading configurations:", error);
    }
  };

  const saveYclientsConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          key: "yclients",
          value: yclientsConfig
        })
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Настройки Yclients сохранены"
        });
      } else {
        throw new Error("Failed to save config");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePackages = async () => {
    setLoading(true);
    try {
      // Save each package
      for (const pkg of packages) {
        const response = await fetch("/api/admin/packages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            type: pkg.type,
            name: pkg.name,
            discount: pkg.discount,
            minCost: pkg.minCost,
            minDownPaymentPercent: pkg.minDownPaymentPercent,
            requiresFullPayment: pkg.requiresFullPayment,
            isActive: true
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to save package ${pkg.name}`);
        }
      }

      // Save package perks
      for (const perk of packagePerks) {
        if (perk.name && perk.name.trim()) { // Only save perks with names
          const response = await fetch("/api/admin/package-perks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
              id: perk.id && typeof perk.id === 'number' ? perk.id : undefined,
              packageType: perk.packageType,
              name: perk.name,
              icon: perk.icon,
              displayType: perk.displayType || 'simple',
              textColor: perk.textColor || '#6B7280',
              iconColor: perk.iconColor || '#6B7280',
              isActive: perk.isActive
            })
          });

          if (!response.ok) {
            throw new Error(`Failed to save perk ${perk.name}`);
          }
        }
      }

      toast({
        title: "Успех",
        description: "Настройки пакетов и преимущества сохранены"
      });
      
      // Reload packages to get updated data
      loadConfigurations();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки пакетов",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUser.pin || !newUser.name || !newUser.role) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const user = await response.json();
        setUsers([...users, user]);
        setNewUser({ pin: '', name: '', role: 'master' });
        setShowUserModal(false);
        toast({
          title: "Успешно",
          description: "Пользователь создан"
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать пользователя",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editingUser)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        setEditingUser(null);
        toast({
          title: "Успешно",
          description: "Пользователь обновлен"
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить пользователя",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        toast({
          title: "Успешно",
          description: "Пользователь удален"
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить пользователя",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceStatus = async (yclientsId: number, isActive: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/services/${yclientsId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        setServices(services.map(s => 
          s.yclientsId === yclientsId ? { ...s, isActive } : s
        ));
        toast({
          title: "Успешно",
          description: `Услуга ${isActive ? 'включена' : 'отключена'}`
        });
      } else {
        throw new Error("Failed to update service");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус услуги",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncServices = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/services/sync", {
        method: "POST",
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Успешно",
          description: `Синхронизировано ${data.count} услуг`
        });
      } else {
        throw new Error("Failed to sync services");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось синхронизировать услуги",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                <Settings className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Панель администратора</h1>
                <p className="text-sm text-gray-600">Управление настройками калькулятора</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Администратор: {user.name}</span>
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
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
          <Tabs defaultValue="dashboard" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
              <TabsTrigger value="dashboard">Обзор</TabsTrigger>
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="services">Услуги</TabsTrigger>
              <TabsTrigger value="packages">Пакеты</TabsTrigger>
              <TabsTrigger value="yclients">Yclients API</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-6">
              <div className="space-y-6">
                <TabsContent value="dashboard">
                  <AdminDashboard />
                </TabsContent>

                {/* Yclients Configuration */}
                <TabsContent value="yclients">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database size={20} />
                        Настройки Yclients API
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="token">API Token</Label>
                    <Input
                      id="token"
                      type="password"
                      value={yclientsConfig.token}
                      onChange={(e) => setYclientsConfig({...yclientsConfig, token: e.target.value})}
                      placeholder="Bearer token"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="authCookie">Auth Cookie</Label>
                    <Input
                      id="authCookie"
                      type="password"
                      value={yclientsConfig.authCookie}
                      onChange={(e) => setYclientsConfig({...yclientsConfig, authCookie: e.target.value})}
                      placeholder="Cookie value"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="chainId">Chain ID</Label>
                    <Input
                      id="chainId"
                      value={yclientsConfig.chainId}
                      onChange={(e) => setYclientsConfig({...yclientsConfig, chainId: e.target.value})}
                      placeholder="ID сети"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="categoryId">Category ID</Label>
                    <Input
                      id="categoryId"
                      value={yclientsConfig.categoryId}
                      onChange={(e) => setYclientsConfig({...yclientsConfig, categoryId: e.target.value})}
                      placeholder="ID категории"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="branchIds">Branch IDs (через запятую)</Label>
                  <Input
                    id="branchIds"
                    value={yclientsConfig.branchIds.join(', ')}
                    onChange={(e) => setYclientsConfig({
                      ...yclientsConfig, 
                      branchIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                    })}
                    placeholder="ID филиалов"
                  />
                </div>
                
                <Button onClick={saveYclientsConfig} disabled={loading} className="btn-primary">
                  {loading ? "Сохранение..." : "Сохранить настройки"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Package Configuration */}
          <TabsContent value="packages">
            <div className="space-y-6">
              {packages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package size={20} />
                      {pkg.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <Label>Название пакета</Label>
                        <Input
                          value={pkg.name}
                          onChange={(e) => {
                            const updatedPackages = packages.map(p => 
                              p.id === pkg.id ? { ...p, name: e.target.value } : p
                            );
                            setPackages(updatedPackages);
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label>Скидка (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={(parseFloat(pkg.discount) * 100).toFixed(0)}
                          onChange={(e) => {
                            const updatedPackages = packages.map(p => 
                              p.id === pkg.id ? { ...p, discount: (parseFloat(e.target.value) / 100).toString() } : p
                            );
                            setPackages(updatedPackages);
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label>Минимальная стоимость курса (₽)</Label>
                        <Input
                          type="number"
                          value={parseFloat(pkg.minCost).toFixed(0)}
                          onChange={(e) => {
                            const updatedPackages = packages.map(p => 
                              p.id === pkg.id ? { ...p, minCost: e.target.value } : p
                            );
                            setPackages(updatedPackages);
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label>Минимальный первый взнос (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={(parseFloat(pkg.minDownPaymentPercent) * 100).toFixed(0)}
                          onChange={(e) => {
                            const updatedPackages = packages.map(p => 
                              p.id === pkg.id ? { ...p, minDownPaymentPercent: (parseFloat(e.target.value) / 100).toString() } : p
                            );
                            setPackages(updatedPackages);
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label>Подарочные сеансы</Label>
                        <Input
                          type="number"
                          min="0"
                          value={pkg.giftSessions || 0}
                          onChange={(e) => {
                            const updatedPackages = packages.map(p => 
                              p.id === pkg.id ? { ...p, giftSessions: parseInt(e.target.value) || 0 } : p
                            );
                            setPackages(updatedPackages);
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={pkg.requiresFullPayment}
                        onCheckedChange={(checked) => {
                          const updatedPackages = packages.map(p => 
                            p.id === pkg.id ? { ...p, requiresFullPayment: checked } : p
                          );
                          setPackages(updatedPackages);
                        }}
                      />
                      <Label>Требуется полная оплата</Label>
                    </div>
                    
                    {/* Package Perks Section */}
                    <div className="mt-6">
                      <Label className="text-lg font-semibold">Преимущества пакета</Label>
                      <div className="mt-3 space-y-3">
                        {packagePerks
                          .filter(perk => perk.packageType === pkg.type)
                          .map((perk, index) => (
                            <div key={perk.id || index} className="flex items-center gap-3 p-3 border rounded-lg">
                              <Switch
                                checked={perk.isActive}
                                onCheckedChange={(checked) => {
                                  const updatedPerks = packagePerks.map(p => 
                                    p.id === perk.id ? { ...p, isActive: checked } : p
                                  );
                                  setPackagePerks(updatedPerks);
                                }}
                              />
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-3">
                                <Input
                                  placeholder="Название преимущества"
                                  value={perk.name}
                                  onChange={(e) => {
                                    const updatedPerks = packagePerks.map(p => 
                                      p.id === perk.id ? { ...p, name: e.target.value } : p
                                    );
                                    setPackagePerks(updatedPerks);
                                  }}
                                />
                                <Select
                                  value={perk.icon}
                                  onValueChange={(value) => {
                                    const updatedPerks = packagePerks.map(p => 
                                      p.id === perk.id ? { ...p, icon: value } : p
                                    );
                                    setPackagePerks(updatedPerks);
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите иконку" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Calendar">📅 Calendar (Рассрочка)</SelectItem>
                                    <SelectItem value="Clock">⏰ Clock (Гибкий график)</SelectItem>
                                    <SelectItem value="User">👤 User (Консультант)</SelectItem>
                                    <SelectItem value="MessageCircle">💬 MessageCircle (Консультации)</SelectItem>
                                    <SelectItem value="Shield">🛡️ Shield (Гарантия)</SelectItem>
                                    <SelectItem value="Heart">❤️ Heart (Забота)</SelectItem>
                                    <SelectItem value="Star">⭐ Star (Приоритет)</SelectItem>
                                    <SelectItem value="Crown">👑 Crown (VIP)</SelectItem>
                                    <SelectItem value="Award">🏆 Award (Премиум)</SelectItem>
                                    <SelectItem value="CheckCircle">✅ CheckCircle (Гарантия)</SelectItem>
                                    <SelectItem value="Sparkles">✨ Sparkles (Премиум)</SelectItem>
                                    <SelectItem value="Zap">⚡ Zap (Быстро)</SelectItem>
                                    <SelectItem value="Headphones">🎧 Headphones (Поддержка)</SelectItem>
                                    <SelectItem value="Phone">📞 Phone (Связь)</SelectItem>
                                    <SelectItem value="Mail">✉️ Mail (Уведомления)</SelectItem>
                                    <SelectItem value="CreditCard">💳 CreditCard (Оплата)</SelectItem>
                                    <SelectItem value="Wallet">💰 Wallet (Скидки)</SelectItem>
                                    <SelectItem value="DollarSign">💵 DollarSign (Экономия)</SelectItem>
                                    <SelectItem value="TrendingUp">📈 TrendingUp (Рост)</SelectItem>
                                    <SelectItem value="Smile">😊 Smile (Комфорт)</SelectItem>
                                    <SelectItem value="ThumbsUp">👍 ThumbsUp (Качество)</SelectItem>
                                    <SelectItem value="HandHeart">💝 HandHeart (Забота)</SelectItem>
                                    <SelectItem value="Gem">💎 Gem (Эксклюзив)</SelectItem>
                                    <SelectItem value="Scissors">✂️ Scissors (Услуги)</SelectItem>
                                    <SelectItem value="Palette">🎨 Palette (Красота)</SelectItem>
                                    <SelectItem value="Flower">🌸 Flower (Красота)</SelectItem>
                                    <SelectItem value="Butterfly">🦋 Butterfly (Преображение)</SelectItem>
                                    <SelectItem value="Sun">☀️ Sun (Сияние)</SelectItem>
                                    <SelectItem value="Moon">🌙 Moon (Нежность)</SelectItem>
                                    <SelectItem value="Leaf">🍃 Leaf (Натуральность)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={perk.displayType || "simple"}
                                  onValueChange={(value) => {
                                    const updatedPerks = packagePerks.map(p => 
                                      p.id === perk.id ? { ...p, displayType: value } : p
                                    );
                                    setPackagePerks(updatedPerks);
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Стиль отображения" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="simple">🔹 Простой</SelectItem>
                                    <SelectItem value="highlighted">⭐ Выделенный</SelectItem>
                                    <SelectItem value="with_value">💰 С ценностью</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  placeholder="#3B82F6"
                                  value={perk.iconColor || ""}
                                  onChange={(e) => {
                                    const updatedPerks = packagePerks.map(p => 
                                      p.id === perk.id ? { ...p, iconColor: e.target.value } : p
                                    );
                                    setPackagePerks(updatedPerks);
                                  }}
                                />
                                <Input
                                  placeholder="#374151"
                                  value={perk.textColor || ""}
                                  onChange={(e) => {
                                    const updatedPerks = packagePerks.map(p => 
                                      p.id === perk.id ? { ...p, textColor: e.target.value } : p
                                    );
                                    setPackagePerks(updatedPerks);
                                  }}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    if (perk.id && typeof perk.id === 'number') {
                                      // Delete from database if it has a real ID
                                      try {
                                        await fetch(`/api/admin/package-perks/${perk.id}`, {
                                          method: "DELETE",
                                          credentials: "include"
                                        });
                                      } catch (error) {
                                        console.error('Failed to delete perk:', error);
                                      }
                                    }
                                    // Remove from local state
                                    const updatedPerks = packagePerks.filter(p => p.id !== perk.id);
                                    setPackagePerks(updatedPerks);
                                  }}
                                >
                                  Удалить
                                </Button>
                              </div>
                            </div>
                          ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newPerk = {
                              id: Date.now(), // Temporary ID
                              packageType: pkg.type,
                              name: '',
                              icon: '✨',
                              isActive: true
                            };
                            setPackagePerks([...packagePerks, newPerk]);
                          }}
                        >
                          Добавить преимущество
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button onClick={savePackages} disabled={loading} className="btn-primary">
                {loading ? "Сохранение..." : "Сохранить настройки пакетов"}
              </Button>
            </div>
          </TabsContent>

          {/* Services Management */}
          <TabsContent value="services">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database size={20} />
                    Управление услугами
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Синхронизация услуг с Yclients и управление их отображением в калькуляторе.
                    </p>
                    
                    <Button onClick={syncServices} disabled={loading} className="btn-primary">
                      {loading ? "Синхронизация..." : "Синхронизировать услуги"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <ServicesManagement />
            </div>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  </div>
  );
}

// Users Management Component
function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({ pin: '', role: 'master', name: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const createUser = async () => {
    if (!newUser.pin || !newUser.name) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Пользователь создан"
        });
        setNewUser({ pin: '', role: 'master', name: '' });
        loadUsers();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать пользователя",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (user: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(user)
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Пользователь обновлен"
        });
        setEditingUser(null);
        loadUsers();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить пользователя",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Пользователь удален"
        });
        loadUsers();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить пользователя",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Управление пользователями
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <Input
                placeholder="PIN код (4-6 цифр)"
                value={newUser.pin}
                onChange={(e) => setNewUser({ ...newUser, pin: e.target.value })}
              />
              <Input
                placeholder="Имя пользователя"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master">Мастер</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={createUser} disabled={loading}>
                Создать
              </Button>
            </div>

            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  {editingUser?.id === user.id ? (
                    <div className="flex items-center gap-4 flex-1">
                      <Input
                        value={editingUser.pin}
                        onChange={(e) => setEditingUser({ ...editingUser, pin: e.target.value })}
                        className="w-24"
                      />
                      <Input
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="flex-1"
                      />
                      <Select
                        value={editingUser.role}
                        onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="master">Мастер</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                      <Switch
                        checked={editingUser.isActive}
                        onCheckedChange={(checked) => setEditingUser({ ...editingUser, isActive: checked })}
                      />
                      <Button onClick={() => updateUser(editingUser)} size="sm">
                        Сохранить
                      </Button>
                      <Button onClick={() => setEditingUser(null)} variant="outline" size="sm">
                        Отмена
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {user.pin}
                        </div>
                        <div className="font-medium">{user.name}</div>
                        <div className={`text-sm px-2 py-1 rounded ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Администратор' : 'Мастер'}
                        </div>
                        <div className={`text-sm px-2 py-1 rounded ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Активен' : 'Неактивен'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setEditingUser(user)}
                          variant="outline"
                          size="sm"
                        >
                          Редактировать
                        </Button>
                        <Button
                          onClick={() => deleteUser(user.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Удалить
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Services Management Component
function ServicesManagement() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await fetch("/api/admin/services", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const toggleService = async (yclientsId: number, isActive: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/services/${yclientsId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: `Услуга ${isActive ? 'включена' : 'отключена'}`
        });
        loadServices();
      } else {
        throw new Error("Failed to update service");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус услуги",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Список услуг</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{service.title}</div>
                <div className="text-sm text-gray-500">
                  ID: {service.yclientsId} • Цена от: {service.priceMin} ₽
                </div>
              </div>
              <Switch
                checked={service.isActive}
                onCheckedChange={(checked) => toggleService(service.yclientsId, checked)}
                disabled={loading}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  Управление пользователями
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Управление PIN-кодами мастеров и администраторов.
                  </p>
                  
                  <div className="text-sm text-gray-500">
                    Функция в разработке...
                  </div>
                </div>
              </CardContent>
            </Card>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </main>

      {/* User Creation Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Добавить пользователя</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pin">PIN код (4 цифры)</Label>
                <Input
                  id="pin"
                  type="text"
                  maxLength={4}
                  value={newUser.pin}
                  onChange={(e) => setNewUser({...newUser, pin: e.target.value})}
                  placeholder="0000"
                />
              </div>
              <div>
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Имя пользователя"
                />
              </div>
              <div>
                <Label htmlFor="role">Роль</Label>
                <Select value={newUser.role} onValueChange={(value: 'master' | 'admin') => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="master">Мастер</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={createUser} disabled={loading} className="flex-1">
                  {loading ? "Создание..." : "Создать"}
                </Button>
                <Button variant="outline" onClick={() => setShowUserModal(false)} className="flex-1">
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Редактировать пользователя</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edit-pin">PIN код</Label>
                <Input
                  id="edit-pin"
                  type="text"
                  maxLength={4}
                  value={editingUser.pin}
                  onChange={(e) => setEditingUser({...editingUser, pin: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-name">Имя</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Роль</Label>
                <Select value={editingUser.role} onValueChange={(value: 'master' | 'admin') => setEditingUser({...editingUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="master">Мастер</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingUser.isActive}
                  onCheckedChange={(checked) => setEditingUser({...editingUser, isActive: checked})}
                />
                <Label>Активен</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={updateUser} disabled={loading} className="flex-1">
                  {loading ? "Сохранение..." : "Сохранить"}
                </Button>
                <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
