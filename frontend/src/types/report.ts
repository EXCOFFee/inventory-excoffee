/**
 * Tipos para reportes y KPIs
 */

export interface StockValuation {
  totalProducts: number;
  totalUnits: number;
  totalValue: number;
  averageValue: number;
}

export interface ProductVelocity {
  productId: string;
  sku: string;
  name: string;
  totalIn: number;
  totalOut: number;
  turnoverRate: number;
}

export interface StockoutReport {
  productId: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  deficit: number;
  daysInStockout?: number;
}

export interface MovementSummary {
  date: string;
  totalIn: number;
  totalOut: number;
  netChange: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  productCount: number;
  totalStock: number;
  totalValue: number;
}

export interface DashboardKPIs {
  stockValuation: StockValuation;
  lowStockCount: number;
  outOfStockCount: number;
  totalMovementsToday: number;
  totalMovementsThisMonth: number;
  recentAlerts: number;
  topProducts: ProductVelocity[];
  categoryDistribution: CategorySummary[];
  movementTrend: MovementSummary[];
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  supplierId?: string;
}
