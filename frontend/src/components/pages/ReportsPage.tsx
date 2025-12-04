/**
 * Página de reportes y KPIs - Dark Theme
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../api';
import { StockoutReport, CategorySummary, ProductVelocity } from '../../types';
import { Select, PDFButton } from '../ui';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils';

type ReportType = 'dashboard' | 'inventory' | 'movements' | 'lowStock';

// Iconos SVG
const ChartBarIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('dashboard');
  const [dateRange, setDateRange] = useState<string>('30');

  // KPIs Query
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['reports', 'kpis'],
    queryFn: () => reportsService.getDashboardKPIs(),
  });

  // Stock Valuation Query
  const { data: valuation, isLoading: valuationLoading } = useQuery({
    queryKey: ['reports', 'valuation'],
    queryFn: () => reportsService.getStockValuation(),
    enabled: reportType === 'inventory' || reportType === 'dashboard',
  });

  // Low Stock Query
  const { data: lowStockProducts = [], isLoading: lowStockLoading } = useQuery({
    queryKey: ['reports', 'lowStock'],
    queryFn: () => reportsService.getStockoutReport(),
    enabled: reportType === 'lowStock' || reportType === 'dashboard',
  });

  // Category Distribution
  const { data: categoryDistribution = [] } = useQuery({
    queryKey: ['reports', 'categories'],
    queryFn: () => reportsService.getCategoryDistribution(),
    enabled: reportType === 'inventory',
  });

  // Product Velocity
  const { data: productVelocity = [] } = useQuery({
    queryKey: ['reports', 'velocity'],
    queryFn: () => reportsService.getProductVelocity(),
    enabled: reportType === 'movements',
  });

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'inventory', label: 'Inventario', icon: '📦' },
    { key: 'movements', label: 'Movimientos', icon: '📈' },
    { key: 'lowStock', label: 'Stock Bajo', icon: '⚠️' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <ChartBarIcon />
            </span>
            Reportes
          </h1>
          <p className="text-gray-400 mt-1">Análisis y métricas del inventario</p>
        </div>
        <div className="flex gap-3">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: '7', label: 'Últimos 7 días' },
              { value: '30', label: 'Últimos 30 días' },
              { value: '90', label: 'Últimos 90 días' },
              { value: '365', label: 'Último año' },
            ]}
          />
          <PDFButton 
            elementId="report-content" 
            filename="reporte-inventario" 
            title={`Reporte de ${tabs.find(t => t.key === reportType)?.label || 'Inventario'}`} 
          />
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="glass-card p-2 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setReportType(tab.key as ReportType)}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              reportType === tab.key
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content - PDF exportable */}
      <div id="report-content" className="space-y-6">
      {/* Dashboard View */}
      {reportType === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Productos"
              value={formatNumber(kpis?.stockValuation?.totalProducts || 0)}
              subtitle="Productos activos"
              icon="📦"
              gradient="from-blue-600 to-cyan-500"
              isLoading={kpisLoading}
            />
            <KPICard
              title="Valor Inventario"
              value={formatCurrency(valuation?.totalValue || kpis?.stockValuation?.totalValue || 0)}
              subtitle={`${formatNumber(valuation?.totalUnits || 0)} unidades`}
              icon="💰"
              gradient="from-emerald-600 to-teal-500"
              isLoading={valuationLoading}
            />
            <KPICard
              title="Stock Bajo"
              value={formatNumber(kpis?.lowStockCount || 0)}
              subtitle="Por reabastecer"
              icon="⚠️"
              gradient="from-amber-600 to-orange-500"
              isLoading={kpisLoading}
            />
            <KPICard
              title="Sin Stock"
              value={formatNumber(kpis?.outOfStockCount || 0)}
              subtitle="Productos agotados"
              icon="🚫"
              gradient="from-red-600 to-rose-500"
              isLoading={kpisLoading}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800/50">
                <h3 className="text-lg font-bold text-white">Distribución por Categoría</h3>
              </div>
              <div className="p-6 space-y-3">
                {kpis?.categoryDistribution?.slice(0, 5).map((cat: CategorySummary, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-gray-300">{cat.categoryName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{cat.productCount} productos</span>
                      <span className="text-cyan-400 text-sm">
                        {formatCurrency(cat.totalValue)}
                      </span>
                    </div>
                  </div>
                ))}
                {(!kpis?.categoryDistribution || kpis.categoryDistribution.length === 0) && (
                  <div className="text-center text-gray-500 py-8">
                    <span className="text-4xl">📊</span>
                    <p className="mt-2">No hay datos de categorías</p>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800/50">
                <h3 className="text-lg font-bold text-white">Tendencia de Movimientos</h3>
              </div>
              <div className="p-6 space-y-3">
                {kpis?.movementTrend?.slice(0, 5).map((mov, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-gray-400">{mov.date}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-emerald-400">+{mov.totalIn}</span>
                      <span className="text-red-400">-{mov.totalOut}</span>
                      <span className={`font-medium ${mov.netChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {mov.netChange >= 0 ? '+' : ''}{mov.netChange}
                      </span>
                    </div>
                  </div>
                ))}
                {(!kpis?.movementTrend || kpis.movementTrend.length === 0) && (
                  <div className="text-center text-gray-500 py-8">
                    <span className="text-4xl">📈</span>
                    <p className="mt-2">No hay datos de movimientos</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Resumen del Inventario</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryItem label="Total Unidades" value={formatNumber(kpis?.stockValuation?.totalUnits || 0)} />
              <SummaryItem label="Mov. Hoy" value={formatNumber(kpis?.totalMovementsToday || 0)} />
              <SummaryItem label="Mov. Este Mes" value={formatNumber(kpis?.totalMovementsThisMonth || 0)} />
              <SummaryItem label="Alertas Recientes" value={formatNumber(kpis?.recentAlerts || 0)} />
            </div>
          </div>
        </div>
      )}

      {/* Inventory Report */}
      {reportType === 'inventory' && (
        <div className="space-y-6">
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800/50">
              <h3 className="text-lg font-bold text-white">Valorización del Inventario</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-400 font-medium">Valor Total</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(valuation?.totalValue || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm text-emerald-400 font-medium">Total Unidades</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatNumber(valuation?.totalUnits || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-sm text-purple-400 font-medium">Valor Promedio</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(valuation?.averageValue || 0)}
                  </p>
                </div>
              </div>

              <h4 className="font-medium text-white mb-4">Por Categoría</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidades</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">% del Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {categoryDistribution.map((cat: CategorySummary, index: number) => (
                      <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-white">{cat.categoryName}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{formatNumber(cat.productCount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{formatNumber(cat.totalStock)}</td>
                        <td className="px-4 py-3 text-sm text-cyan-400">{formatCurrency(cat.totalValue)}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {formatPercentage((cat.totalValue / (valuation?.totalValue || 1)) * 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Movements Report */}
      {reportType === 'movements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-6 text-center">
              <span className="text-4xl">📊</span>
              <p className="text-3xl font-bold text-cyan-400 mt-3">
                {formatNumber(kpis?.totalMovementsToday || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Movimientos hoy</p>
            </div>
            <div className="glass-card p-6 text-center">
              <span className="text-4xl">📈</span>
              <p className="text-3xl font-bold text-emerald-400 mt-3">
                {formatNumber(kpis?.totalMovementsThisMonth || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Movimientos este mes</p>
            </div>
            <div className="glass-card p-6 text-center">
              <span className="text-4xl">🔔</span>
              <p className="text-3xl font-bold text-amber-400 mt-3">
                {formatNumber(kpis?.recentAlerts || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Alertas recientes</p>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800/50">
              <h3 className="text-lg font-bold text-white">Productos con Mayor Rotación</h3>
            </div>
            <div className="p-6 space-y-3">
              {productVelocity.slice(0, 10).map((product: ProductVelocity, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-cyan-400 font-mono">{product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-4 text-sm mb-1">
                      <span className="text-emerald-400">+{formatNumber(product.totalIn)}</span>
                      <span className="text-red-400">-{formatNumber(product.totalOut)}</span>
                    </div>
                    <p className="text-xs text-gray-500">Rotación: {product.turnoverRate.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {productVelocity.length === 0 && (
                <p className="text-center text-gray-500 py-8">No hay datos de movimientos</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Report */}
      {reportType === 'lowStock' && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800/50">
            <h3 className="text-lg font-bold text-white">
              Productos con Stock Bajo ({lowStockProducts.length})
            </h3>
          </div>
          <div className="p-6">
            {lowStockLoading ? (
              <div className="flex justify-center py-8">
                <div className="spinner w-8 h-8" />
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl">✅</span>
                <p className="text-gray-400 mt-4">No hay productos con stock bajo</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Mínimo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Déficit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {lowStockProducts.map((product: StockoutReport) => (
                      <tr key={product.productId} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-white">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-cyan-400 font-mono">{product.sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{formatNumber(product.currentStock)}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{formatNumber(product.minStock)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-red-400">-{formatNumber(product.deficit)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                            product.currentStock === 0
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {product.currentStock === 0 ? 'Sin Stock' : 'Stock Bajo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      </div> {/* End of report-content */}
    </div>
  );
};

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  gradient: string;
  isLoading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, gradient, isLoading }) => {
  return (
    <div className="glass-card overflow-hidden">
      {isLoading ? (
        <div className="p-6 animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-3/4" />
          <div className="h-8 bg-gray-700 rounded w-1/2" />
          <div className="h-3 bg-gray-700 rounded w-2/3" />
        </div>
      ) : (
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-400">{title}</span>
            <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl`}>
              {icon}
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
};

// Summary Item Component
interface SummaryItemProps {
  label: string;
  value: string;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value }) => (
  <div className="text-center p-4 bg-gray-800/30 rounded-xl">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-xl font-bold text-white mt-1">{value}</p>
  </div>
);
