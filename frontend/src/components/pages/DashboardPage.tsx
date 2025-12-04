/**
 * Página de Dashboard
 * Diseño dark theme con glassmorphism
 * Con gráficos interactivos Recharts
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService, alertsService } from '../../api';
import { Card, CardHeader, CardTitle, CardContent, Badge, Spinner } from '../ui';
import { MovementTrendChart, CategoryPieChart, CategoryBarChart } from '../charts';

export const DashboardPage: React.FC = () => {
  const { data: kpis, isLoading: loadingKPIs } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => reportsService.getDashboardKPIs(),
  });

  const { data: alerts } = useQuery({
    queryKey: ['unread-alerts'],
    queryFn: () => alertsService.getUnread(),
  });

  // Datos de tendencia de movimientos para el gráfico
  // Usamos datos demo ya que el endpoint no existe aún
  const movementTrend: any[] = [];

  // Datos de distribución por categoría
  const categoryDistribution = useMemo(() => {
    if (!kpis?.categoryDistribution) return [];
    return kpis.categoryDistribution.map((cat: any) => ({
      name: cat.name || cat.category || 'Sin categoría',
      value: cat.count || cat.value || cat.total || 0,
    }));
  }, [kpis?.categoryDistribution]);

  // Datos de productos top para el gráfico de barras
  const topProductsChart = useMemo(() => {
    if (!kpis?.topProducts) return [];
    return kpis.topProducts.slice(0, 5).map((p: any) => ({
      name: p.name?.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
      Entradas: p.totalIn || 0,
      Salidas: p.totalOut || 0,
    }));
  }, [kpis?.topProducts]);

  // Datos de tendencia (mock si no hay API)
  const trendData = useMemo(() => {
    if (movementTrend && Array.isArray(movementTrend) && movementTrend.length > 0) {
      return movementTrend;
    }
    // Datos demo para visualización
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('es', { weekday: 'short', day: 'numeric' }),
        entradas: Math.floor(Math.random() * 50) + 10,
        salidas: Math.floor(Math.random() * 40) + 5,
      };
    });
  }, [movementTrend]);

  if (loadingKPIs) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <Spinner size="lg" />
          <div className="absolute inset-0 bg-primary-500/20 blur-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">Resumen general del inventario</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1.5 rounded-lg bg-success-500/10 text-success-400 text-sm font-medium border border-success-500/30">
            <span className="inline-block w-2 h-2 rounded-full bg-success-400 mr-2 animate-pulse"></span>
            Sistema activo
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stock Total */}
        <Card hover className="group">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-400 mb-1">Productos Totales</p>
                <p className="text-3xl font-bold text-white">
                  {kpis?.stockValuation?.totalProducts || 0}
                </p>
                <p className="text-xs text-dark-500 mt-2">En inventario</p>
              </div>
              <div className="p-4 bg-primary-500/10 rounded-2xl text-primary-400 group-hover:bg-primary-500/20 transition-all duration-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valor de Inventario */}
        <Card hover className="group">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-400 mb-1">Valor Total</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-success-400 to-accent-cyan bg-clip-text text-transparent">
                  ${kpis?.stockValuation?.totalValue?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-dark-500 mt-2">Valorización actual</p>
              </div>
              <div className="p-4 bg-success-500/10 rounded-2xl text-success-400 group-hover:bg-success-500/20 transition-all duration-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productos con bajo stock */}
        <Card hover className="group">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-400 mb-1">Bajo Stock</p>
                <p className="text-3xl font-bold text-warning-400">
                  {kpis?.lowStockCount || 0}
                </p>
                <p className="text-xs text-dark-500 mt-2">Requieren atención</p>
              </div>
              <div className="p-4 bg-warning-500/10 rounded-2xl text-warning-400 group-hover:bg-warning-500/20 transition-all duration-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sin stock */}
        <Card hover className="group">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-400 mb-1">Sin Stock</p>
                <p className="text-3xl font-bold text-danger-400">
                  {kpis?.outOfStockCount || 0}
                </p>
                <p className="text-xs text-dark-500 mt-2">Agotados</p>
              </div>
              <div className="p-4 bg-danger-500/10 rounded-2xl text-danger-400 group-hover:bg-danger-500/20 transition-all duration-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle gradient>Alertas Recientes</CardTitle>
              <Badge variant="danger" dot pulse>{alerts?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 bg-dark-700/30 rounded-xl border border-dark-600/30 hover:border-dark-500/50 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2.5 rounded-xl ${
                        alert.type === 'OUT_OF_STOCK' ? 'bg-danger-500/10 text-danger-400' :
                        alert.type === 'LOW_STOCK' ? 'bg-warning-500/10 text-warning-400' : 'bg-primary-500/10 text-primary-400'
                      } group-hover:scale-110 transition-transform duration-200`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-primary-300 transition-colors">
                          {alert.product?.name}
                        </p>
                        <p className="text-xs text-dark-400">{alert.message}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        alert.type === 'OUT_OF_STOCK' ? 'danger' :
                        alert.type === 'LOW_STOCK' ? 'warning' : 'cyan'
                      }
                      size="sm"
                    >
                      {alert.type === 'OUT_OF_STOCK' ? 'Sin Stock' :
                       alert.type === 'LOW_STOCK' ? 'Bajo Stock' : 'Exceso'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-success-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-dark-400">¡Todo está en orden!</p>
                <p className="text-xs text-dark-500 mt-1">No hay alertas pendientes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle gradient>Productos Más Movidos</CardTitle>
              <Badge variant="primary">Top 5</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {kpis?.topProducts && kpis.topProducts.length > 0 ? (
              <div className="space-y-3">
                {kpis.topProducts.slice(0, 5).map((product, index) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between p-4 bg-dark-700/30 rounded-xl border border-dark-600/30 hover:border-primary-500/30 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <span className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30' :
                        index === 1 ? 'bg-gradient-to-br from-gray-400/20 to-gray-500/20 text-gray-300 border border-gray-500/30' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600/20 to-amber-700/20 text-amber-400 border border-amber-600/30' :
                        'bg-dark-700/50 text-dark-300 border border-dark-600/50'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-primary-300 transition-colors">{product.name}</p>
                        <p className="text-xs text-dark-500 font-mono">SKU: {product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-4">
                      <div className="flex items-center text-success-400">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span className="text-sm font-medium">{product.totalIn}</span>
                      </div>
                      <div className="flex items-center text-danger-400">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <span className="text-sm font-medium">{product.totalOut}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-700/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-dark-400">Sin datos de movimientos</p>
                <p className="text-xs text-dark-500 mt-1">Los productos más movidos aparecerán aquí</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Movement Trend Chart */}
      <MovementTrendChart data={trendData} height={280} />

      {/* Category Distribution & Top Products Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categoryDistribution.length > 0 ? (
          <CategoryPieChart 
            data={categoryDistribution} 
            title="Distribución por Categoría"
            height={280}
          />
        ) : (
          <Card>
            <CardContent>
              <div className="h-64 flex flex-col items-center justify-center">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-dark-700/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <p className="text-dark-300 font-medium">Sin categorías</p>
                <p className="text-dark-500 text-sm mt-1">Agrega categorías para ver la distribución</p>
              </div>
            </CardContent>
          </Card>
        )}

        {topProductsChart.length > 0 ? (
          <CategoryBarChart 
            data={topProductsChart.map(p => ({
              name: p.name,
              value: (p.Entradas || 0) + (p.Salidas || 0),
            }))} 
            title="Movimientos por Producto (Top 5)"
            height={280}
          />
        ) : (
          <Card>
            <CardContent>
              <div className="h-64 flex flex-col items-center justify-center">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-dark-700/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-dark-300 font-medium">Sin movimientos</p>
                <p className="text-dark-500 text-sm mt-1">Los productos más movidos aparecerán aquí</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
