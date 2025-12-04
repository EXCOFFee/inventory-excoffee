/**
 * Servicio de reportes y KPIs
 */

import apiClient from './client';
import {
  DashboardKPIs,
  StockValuation,
  ProductVelocity,
  StockoutReport,
  MovementSummary,
  CategorySummary,
  ReportFilters,
} from '../types';

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
   * Obtener reporte de stockouts
   */
  async getStockoutReport(): Promise<StockoutReport[]> {
    const { data } = await apiClient.get<StockoutReport[]>('/reports/stockouts');
    return data;
  },

  /**
   * Obtener resumen de movimientos por período
   */
  async getMovementSummary(filters?: ReportFilters): Promise<MovementSummary[]> {
    const { data } = await apiClient.get<MovementSummary[]>('/reports/movement-summary', {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener distribución por categorías
   */
  async getCategoryDistribution(): Promise<CategorySummary[]> {
    const { data } = await apiClient.get<CategorySummary[]>('/reports/category-distribution');
    return data;
  },

  /**
   * Exportar reporte en formato específico
   */
  async exportReport(
    reportType: string,
    format: 'pdf' | 'excel' | 'csv',
    filters?: ReportFilters
  ): Promise<Blob> {
    const { data } = await apiClient.get(`/reports/export/${reportType}`, {
      params: { format, ...filters },
      responseType: 'blob',
    });
    return data;
  },
};
