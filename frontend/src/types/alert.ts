/**
 * Tipos para alertas de stock.
 *
 * Reflejan el modelo REAL del backend (Prisma `StockAlert`): campos planos
 * (`productSku`, `productName`, `currentStock`, `minStock`) y `acknowledged`
 * en lugar de un objeto `product` anidado / `isRead`. El backend solo genera
 * alertas de stock bajo/agotado; la severidad se deriva del stock, no de un
 * campo `type`.
 */

export interface StockAlert {
  id: string;
  productSku: string;
  productName: string;
  currentStock: number;
  minStock: number;
  emailSent: boolean;
  acknowledged: boolean;
  createdAt: string;
  acknowledgedAt?: string | null;
}

/** Filtros soportados por el backend en `GET /alerts` (solo paginación). */
export interface AlertFilters {
  page?: number;
  limit?: number;
}
