/**
 * Tipos para movimientos de inventario (Kardex)
 */

export type MovementType = 'IN' | 'OUT';

export interface Movement {
  id: string;
  type: MovementType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  notes?: string;
  productId: string;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface CreateMovementDto {
  type: MovementType;
  quantity: number;
  unitCost?: number;
  reference?: string;
  notes?: string;
  productId: string;
}

export interface MovementFilters {
  productId?: string;
  type?: MovementType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface KardexEntry extends Movement {
  balance: number;
}
