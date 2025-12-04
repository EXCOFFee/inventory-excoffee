/**
 * Tipos para alertas de stock
 */

export type AlertType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';

export interface StockAlert {
  id: string;
  type: AlertType;
  message: string;
  isRead: boolean;
  productId: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    currentStock: number;
    minStock: number;
    maxStock?: number;
  };
  createdAt: string;
}

export interface AlertFilters {
  type?: AlertType;
  isRead?: boolean;
  productId?: string;
  page?: number;
  limit?: number;
}

export interface AlertStats {
  total: number;
  unread: number;
  byType: {
    LOW_STOCK: number;
    OUT_OF_STOCK: number;
    OVERSTOCK: number;
  };
}
