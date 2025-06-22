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
import { Settings, Users, Database, Package, LogOut } from "lucide-react";
import AdminDashboard from "@/components/admin-dashboard";

interface User {
  id: number;
  name: string;
  role: 'master' | 'admin';
  pin: string;
  isActive: boolean;
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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const savePackages = async () => {
    setLoading(true);
    try {
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
            giftSessions: pkg.giftSessions,
            isActive: true
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to save package ${pkg.name}`);
        }
      }

      for (const perk of packagePerks) {
        if (perk.name && perk.name.trim()) {
          const response = await fetch("/api/admin/package-perks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(perk)
          });

          if (!response.ok) {
            throw new Error(`Failed to save perk ${perk.name}`);
          }
        }
      }

      toast({
        title: "Успешно",
        description: "Настройки пакетов сохранены"
      });
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

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      const packagesResponse = await fetch("/api/packages", {
        credentials: "include"
      });
      
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setPackages(packagesData);
        
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

  const syncServices = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/services/sync", {
        method: "POST",
        credentials: "include"
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Успешно",
          description: `Синхронизировано ${result.count} услуг`
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Settings className="text-blue-600" size={24} />
              <h1 className="text-xl font-semibold text-gray-900">
                Панель администратора
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.name} ({user.role === 'admin' ? 'Администратор' : 'Мастер'})
              </span>
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

            <div className="flex-1 overflow-y-auto mt-6 max-h-[calc(100vh-200px)]">
              <TabsContent value="dashboard">
                <AdminDashboard />
              </TabsContent>

              <TabsContent value="users">
                <UsersManagement />
              </TabsContent>

              <TabsContent value="services">
                <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
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

              <TabsContent value="packages">
                <PackagesManagement packages={packages} packagePerks={packagePerks} setPackages={setPackages} setPackagePerks={setPackagePerks} loading={loading} setLoading={setLoading} />
              </TabsContent>

              <TabsContent value="yclients">
                <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings size={20} />
                        Настройки Yclients API
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="token">API Token</Label>
                        <Input
                          id="token"
                          type="password"
                          value={yclientsConfig.token}
                          onChange={(e) => setYclientsConfig({...yclientsConfig, token: e.target.value})}
                          placeholder="Введите API токен"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="authCookie">Auth Cookie</Label>
                        <Textarea
                          id="authCookie"
                          value={yclientsConfig.authCookie}
                          onChange={(e) => setYclientsConfig({...yclientsConfig, authCookie: e.target.value})}
                          placeholder="Введите auth cookie"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                        <div>
                          <Label htmlFor="branchIds">Branch IDs (через запятую)</Label>
                          <Input
                            id="branchIds"
                            value={yclientsConfig.branchIds?.join(', ') || ''}
                            onChange={(e) => setYclientsConfig({
                              ...yclientsConfig, 
                              branchIds: e.target.value.split(',').map((id: string) => id.trim()).filter(Boolean)
                            })}
                            placeholder="ID филиалов: 1, 2, 3"
                          />
                        </div>
                      </div>
                      
                      <Button onClick={saveYclientsConfig} disabled={loading} className="btn-primary">
                        {loading ? "Сохранение..." : "Сохранить настройки"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </div>
              </TabsContent>
            </div>
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
    <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
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

// Packages Management Component
function PackagesManagement({ packages, packagePerks, setPackages, setPackagePerks, loading, setLoading }: any) {
  const { toast } = useToast();

  const savePackages = async () => {
    setLoading(true);
    try {
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
            giftSessions: pkg.giftSessions,
            isActive: true
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to save package ${pkg.name}`);
        }
      }

      for (const perk of packagePerks) {
        if (perk.name && perk.name.trim()) {
          const response = await fetch("/api/admin/package-perks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(perk)
          });

          if (!response.ok) {
            throw new Error(`Failed to save perk ${perk.name}`);
          }
        }
      }

      toast({
        title: "Успешно",
        description: "Настройки пакетов сохранены"
      });
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

  return (
    <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
      <p className="text-gray-600">
        Настройка пакетов услуг и их преимуществ.
      </p>
      
      {packages.map((pkg) => (
        <Card key={pkg.type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package size={20} />
              Пакет {pkg.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Basic Package Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`${pkg.type}-name`}>Название пакета</Label>
                  <Input
                    id={`${pkg.type}-name`}
                    value={pkg.name}
                    onChange={(e) => {
                      const updatedPackages = packages.map(p => 
                        p.type === pkg.type ? { ...p, name: e.target.value } : p
                      );
                      setPackages(updatedPackages);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`${pkg.type}-discount`}>Скидка (%)</Label>
                  <Input
                    id={`${pkg.type}-discount`}
                    type="number"
                    value={parseFloat(pkg.discount) * 100}
                    onChange={(e) => {
                      const updatedPackages = packages.map(p => 
                        p.type === pkg.type ? { ...p, discount: (parseFloat(e.target.value) / 100).toString() } : p
                      );
                      setPackages(updatedPackages);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`${pkg.type}-minCost`}>Минимальная стоимость</Label>
                  <Input
                    id={`${pkg.type}-minCost`}
                    type="number"
                    value={pkg.minCost}
                    onChange={(e) => {
                      const updatedPackages = packages.map(p => 
                        p.type === pkg.type ? { ...p, minCost: e.target.value } : p
                      );
                      setPackages(updatedPackages);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`${pkg.type}-giftSessions`}>Подарочные сеансы</Label>
                  <Input
                    id={`${pkg.type}-giftSessions`}
                    type="number"
                    min="0"
                    value={pkg.giftSessions || 0}
                    onChange={(e) => {
                      const updatedPackages = packages.map(p => 
                        p.type === pkg.type ? { ...p, giftSessions: parseInt(e.target.value) || 0 } : p
                      );
                      setPackages(updatedPackages);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${pkg.type}-minDownPayment`}>Минимальный первый взнос (%)</Label>
                  <Input
                    id={`${pkg.type}-minDownPayment`}
                    type="number"
                    step="1"
                    value={(parseFloat(pkg.minDownPaymentPercent) * 100).toFixed(0)}
                    onChange={(e) => {
                      const updatedPackages = packages.map(p => 
                        p.type === pkg.type ? { ...p, minDownPaymentPercent: (parseFloat(e.target.value) / 100).toString() } : p
                      );
                      setPackages(updatedPackages);
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    checked={pkg.requiresFullPayment}
                    onCheckedChange={(checked) => {
                      const updatedPackages = packages.map(p => 
                        p.type === pkg.type ? { ...p, requiresFullPayment: checked } : p
                      );
                      setPackages(updatedPackages);
                    }}
                  />
                  <Label>Требуется полная оплата</Label>
                </div>
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
                              <SelectValue placeholder="Иконка" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UserCheck">✅ UserCheck (Консультация)</SelectItem>
                              <SelectItem value="Gift">🎁 Gift (Подарок)</SelectItem>
                              <SelectItem value="Percent">% Percent (Скидка)</SelectItem>
                              <SelectItem value="Clock">⏰ Clock (Время)</SelectItem>
                              <SelectItem value="Shield">🛡️ Shield (Защита)</SelectItem>
                              <SelectItem value="Star">⭐ Star (Качество)</SelectItem>
                              <SelectItem value="Heart">❤️ Heart (Забота)</SelectItem>
                              <SelectItem value="Gem">💎 Gem (Эксклюзив)</SelectItem>
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
                                try {
                                  await fetch(`/api/admin/package-perks/${perk.id}`, {
                                    method: "DELETE",
                                    credentials: "include"
                                  });
                                } catch (error) {
                                  console.error('Failed to delete perk:', error);
                                }
                              }
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
                        id: Date.now(),
                        packageType: pkg.type,
                        name: '',
                        icon: 'UserCheck',
                        displayType: 'simple',
                        textColor: '#374151',
                        iconColor: '#6B7280',
                        isActive: true
                      };
                      setPackagePerks([...packagePerks, newPerk]);
                    }}
                  >
                    Добавить преимущество
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Button onClick={savePackages} disabled={loading} className="btn-primary">
        {loading ? "Сохранение..." : "Сохранить настройки пакетов"}
      </Button>
    </div>
  );
}