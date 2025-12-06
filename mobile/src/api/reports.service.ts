/**
 * Servicio de Reportes - Móvil.
 */

import apiClient from './client';

export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  inventoryValue?: number;
  lowStockCount: number;
  todayMovements: number;
  todayEntries: number;
  todayExits: number;
  categoriesCount: number;
  suppliersCount: number;
  lowStockProducts?: LowStockProduct[];
}

export interface RecentMovement {
  id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  product: {
    name: string;
    sku: string;
  };
  user: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  percentage: number;
}

export const reportsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/reports/dashboard');
    return response.data;
  },

  async getRecentMovements(limit = 10): Promise<RecentMovement[]> {
    const response = await apiClient.get<RecentMovement[]>(`/reports/recent-movements?limit=${limit}`);
    return response.data;
  },

  async getLowStockProducts(): Promise<LowStockProduct[]> {
    const response = await apiClient.get<LowStockProduct[]>('/reports/low-stock');
    return response.data;
  },

  async getStockByCategory(): Promise<{ category: string; stock: number; value: number }[]> {
    const response = await apiClient.get('/reports/stock-by-category');
    return response.data;
  },

  async getMovementsSummary(startDate: string, endDate: string) {
    const response = await apiClient.get(`/reports/movements-summary?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },
};
