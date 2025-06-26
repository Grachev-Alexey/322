import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Package, DollarSign, Calendar, Phone, User } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface SaleData {
  id: number;
  clientName: string | null;
  clientPhone: string;
  masterName: string;
  subscriptionTitle: string;
  selectedPackage: string;
  baseCost: string;
  finalCost: string;
  totalSavings: string;
  downPayment: string;
  installmentMonths: number;
  monthlyPayment: string;
  usedCertificate: boolean;
  createdAt: string;
  selectedServices: any[];
  appliedDiscounts: any[];
  freeZones: any[];
}

interface SalesStats {
  sales: SaleData[];
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalSavingsGiven: number;
    packageStats: Record<string, { count: number; revenue: number }>;
    masterStats: Record<string, { count: number; revenue: number }>;
  };
}

export default function AdminSales() {
  const { data: salesData, isLoading } = useQuery<SalesStats>({
    queryKey: ['/api/admin/sales'],
    enabled: true
  });

  if (isLoading) {
    return <div className="p-6">Загрузка статистики продаж...</div>;
  }

  if (!salesData) {
    return <div className="p-6">Нет данных о продажах</div>;
  }

  const { sales, summary } = salesData;

  const getPackageName = (packageType: string) => {
    switch (packageType) {
      case 'vip': return 'VIP';
      case 'standard': return 'Стандарт';
      case 'economy': return 'Эконом';
      default: return packageType;
    }
  };

  const getPackageBadgeColor = (packageType: string) => {
    switch (packageType) {
      case 'vip': return 'bg-purple-500';
      case 'standard': return 'bg-blue-500';
      case 'economy': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего продаж</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRevenue.toLocaleString()} ₽</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая экономия</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSavingsGiven.toLocaleString()} ₽</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalSales > 0 ? Math.round(summary.totalRevenue / summary.totalSales).toLocaleString() : 0} ₽
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Продажи</TabsTrigger>
          <TabsTrigger value="packages">По пакетам</TabsTrigger>
          <TabsTrigger value="masters">По мастерам</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Последние продажи</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sales.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Продаж пока нет</p>
                ) : (
                  sales.map((sale) => (
                    <div key={sale.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getPackageBadgeColor(sale.selectedPackage)} text-white`}>
                            {getPackageName(sale.selectedPackage)}
                          </Badge>
                          <span className="font-medium">{sale.subscriptionTitle}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{parseFloat(sale.finalCost).toLocaleString()} ₽</div>
                          <div className="text-sm text-muted-foreground">
                            Экономия: {parseFloat(sale.totalSavings).toLocaleString()} ₽
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{sale.clientName || 'Клиент'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{sale.clientPhone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Мастер: {sale.masterName}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>Базовая стоимость: {parseFloat(sale.baseCost).toLocaleString()} ₽</div>
                        <div>Первый взнос: {parseFloat(sale.downPayment).toLocaleString()} ₽</div>
                        {sale.installmentMonths && (
                          <div>Рассрочка: {sale.installmentMonths} мес.</div>
                        )}
                        {sale.monthlyPayment && (
                          <div>Ежемесячно: {parseFloat(sale.monthlyPayment).toLocaleString()} ₽</div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          {sale.usedCertificate && (
                            <Badge variant="outline">Сертификат</Badge>
                          )}
                          {sale.freeZones && sale.freeZones.length > 0 && (
                            <Badge variant="outline">Бесплатные зоны</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(sale.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Статистика по пакетам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(summary.packageStats).map(([packageType, stats]) => (
                  <div key={packageType} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${getPackageBadgeColor(packageType)} text-white`}>
                        {getPackageName(packageType)}
                      </Badge>
                      <span className="text-2xl font-bold">{stats.count}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Выручка: {stats.revenue.toLocaleString()} ₽
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Средний чек: {stats.count > 0 ? Math.round(stats.revenue / stats.count).toLocaleString() : 0} ₽
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="masters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Статистика по мастерам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.masterStats).map(([masterName, stats]) => (
                  <div key={masterName} className="flex items-center justify-between border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{masterName}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{stats.count} продаж</div>
                      <div className="text-sm text-muted-foreground">
                        {stats.revenue.toLocaleString()} ₽
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}