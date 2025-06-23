import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Package, DollarSign, Activity, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  pin: string;
  role: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

interface PackageData {
  id: number;
  type: string;
  name: string;
  discount: string;
  minCost: string;
  minDownPaymentPercent: string;
  requiresFullPayment: boolean;
  bonusAccountPercent: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPackage, setEditingPackage] = useState<number | null>(null);
  const [bonusValues, setBonusValues] = useState<Record<number, string>>({});

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: true
  });

  const { data: packages = [], isLoading: packagesLoading } = useQuery<PackageData[]>({
    queryKey: ['/api/packages'],
    enabled: true
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, bonusAccountPercent }: { id: number; bonusAccountPercent: number }) => {
      const response = await fetch(`/api/admin/packages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusAccountPercent: bonusAccountPercent / 100 })
      });
      if (!response.ok) throw new Error('Failed to update package');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      setEditingPackage(null);
      setBonusValues({});
      toast({
        title: "Успешно",
        description: "Настройки пакета обновлены"
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить настройки пакета",
        variant: "destructive"
      });
    }
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<any[]>({
    queryKey: ['/api/services'],
    enabled: true
  });

  if (usersLoading || packagesLoading || servicesLoading) {
    return <div className="p-6">Загрузка данных...</div>;
  }

  const activeUsers = users.filter(user => user.isActive);
  const masters = users.filter(user => user.role === 'master');
  const admins = users.filter(user => user.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeUsers.length} активных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Мастера</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{masters.length}</div>
            <p className="text-xs text-muted-foreground">
              {admins.length} администраторов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Пакеты</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
            <p className="text-xs text-muted-foreground">
              настроено пакетов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Услуги</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground">
              активных услуг
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Пользователи системы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">PIN: {user.pin}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Администратор' : 'Мастер'}
                  </Badge>
                  <Badge variant={user.isActive ? 'default' : 'destructive'}>
                    {user.isActive ? 'Активен' : 'Неактивен'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Настройки пакетов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{pkg.name}</p>
                      <p className="text-sm text-gray-500">Тип: {pkg.type}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (editingPackage === pkg.id) {
                        setEditingPackage(null);
                        setBonusValues({});
                      } else {
                        setEditingPackage(pkg.id);
                        setBonusValues({
                          [pkg.id]: (parseFloat(pkg.bonusAccountPercent) * 100).toFixed(0)
                        });
                      }
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    {editingPackage === pkg.id ? 'Отмена' : 'Изменить'}
                  </Button>
                </div>
                
                {editingPackage === pkg.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <Label htmlFor={`bonus-${pkg.id}`} className="min-w-[120px]">
                        Бонусный счет (%)
                      </Label>
                      <Input
                        id={`bonus-${pkg.id}`}
                        type="number"
                        min="0"
                        max="100"
                        value={bonusValues[pkg.id] || ''}
                        onChange={(e) => setBonusValues({
                          ...bonusValues,
                          [pkg.id]: e.target.value
                        })}
                        className="w-24"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const value = parseFloat(bonusValues[pkg.id] || '0');
                          if (value >= 0 && value <= 100) {
                            updatePackageMutation.mutate({
                              id: pkg.id,
                              bonusAccountPercent: value
                            });
                          }
                        }}
                        disabled={updatePackageMutation.isPending}
                      >
                        Сохранить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-sm">
                    <span>Скидка: {(parseFloat(pkg.discount) * 100).toFixed(0)}%</span>
                    <span>•</span>
                    <span>Бонусный счет: {(parseFloat(pkg.bonusAccountPercent) * 100).toFixed(0)}%</span>
                    <span>•</span>
                    <span>Мин. стоимость: {parseFloat(pkg.minCost).toLocaleString()} ₽</span>
                    {pkg.requiresFullPayment && (
                      <>
                        <span>•</span>
                        <Badge variant="outline">Полная оплата</Badge>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}