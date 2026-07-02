/**
 * Servicio de reportes y KPIs
 */

import apiClient from './client';
import {
  DashboardKPIs,
  StockValuation,
  ProductVelocity,
  StockoutReport,
  CategorySummary,
  ReportFilters,
} from '../types';

// Shapes CRUDOS del backend (ver H-16). Se mapean al tipo que consume la UI para
// no filtrar la forma interna del backend a los componentes.
interface RawLowStockProduct {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
}
interface RawLowStockReport {
  outOfStock: RawLowStockProduct[];
  lowStock: RawLowStockProduct[];
}
interface RawCategoryReport {
  id: string;
  name: string;
  totalProducts: number;
  totalStock: number;
  totalValue: number;
}

export const reportsService = {
  /**
   * Obtener KPIs del dashboard
   */
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const { data } = await apiClient.get<DashboardKPIs>('/reports/dashboard');
    return data;
  },

  /**
   * Obtener valorización de inventario
   */
  async getStockValuation(filters?: ReportFilters): Promise<StockValuation> {
    const { data } = await apiClient.get<StockValuation>('/reports/stock-valuation', {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener velocidad de productos (rotación)
   */
  async getProductVelocity(filters?: ReportFilters): Promise<ProductVelocity[]> {
    const { data } = await apiClient.get<ProductVelocity[]>('/reports/product-velocity', {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener reporte de stock bajo / sin stock.
   * El backend expone `/reports/low-stock` y devuelve `{ summary, outOfStock, lowStock }`
   * (ver H-16). Aplanamos ambas listas y las mapeamos al shape que consume la UI.
   */
  async getStockoutReport(): Promise<StockoutReport[]> {
    const { data } = await apiClient.get<RawLowStockReport>('/reports/low-stock');
    const rows = [...(data.outOfStock ?? []), ...(data.lowStock ?? [])];
    return rows.map((p) => ({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      currentStock: p.currentStock,
      minStock: p.minStock,
      deficit: Math.max(0, p.minStock - p.currentStock),
    }));
  },

  /**
   * Obtener distribución por categorías.
   * El backend expone `/reports/by-category` con campos `{ id, name, totalProducts, ... }`
   * (ver H-16); mapeamos a `CategorySummary` que consume la UI.
   */
  async getCategoryDistribution(): Promise<CategorySummary[]> {
    const { data } = await apiClient.get<RawCategoryReport[]>('/reports/by-category');
    return data.map((c) => ({
      categoryId: c.id,
      categoryName: c.name,
      productCount: c.totalProducts,
      totalStock: c.totalStock,
      totalValue: c.totalValue,
    }));
  },
};
