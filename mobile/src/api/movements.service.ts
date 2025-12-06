/**
 * Servicio de Movimientos - Móvil.
 */

import apiClient from './client';

export type MovementType = 'IN' | 'OUT';

export interface Movement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  notes?: string;
  reference?: string;
  unitCost?: number;
  stockBefore: number;
  stockAfter: number;
  userId: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface MovementsResponse {
  data: Movement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MovementFilters {
  productId?: string;
  userId?: string;
  type?: MovementType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateMovementDto {
  productId?: string;
  productSku?: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  notes?: string;
  reference?: string;
  unitCost?: number;
}

export const movementsService = {
  async getAll(filters?: MovementFilters): Promise<MovementsResponse> {
    const params = new URLSearchParams();
    
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get<MovementsResponse>(`/movements?${params}`);
    return response.data;
  },

  async getById(id: string): Promise<Movement> {
    const response = await apiClient.get<Movement>(`/movements/${id}`);
    return response.data;
  },

  async create(data: CreateMovementDto): Promise<Movement> {
    const response = await apiClient.post<Movement>('/movements', data);
    return response.data;
  },
};
