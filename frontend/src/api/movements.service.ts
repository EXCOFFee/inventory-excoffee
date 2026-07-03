/**
 * Servicio de movimientos de inventario (Kardex)
 */

import apiClient from './client';
import {
  Movement,
  CreateMovementDto,
  MovementFilters,
  PaginatedResponse,
} from '../types';

export const movementsService = {
  /**
   * Obtener todos los movimientos con filtros opcionales
   */
  async getAll(filters?: MovementFilters): Promise<PaginatedResponse<Movement>> {
    const { data } = await apiClient.get<PaginatedResponse<Movement>>('/movements', {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener movimientos por producto (Kardex)
   */
  async getByProduct(productId: string): Promise<Movement[]> {
    const { data } = await apiClient.get<Movement[]>(`/movements/product/${productId}`);
    return data;
  },

  /**
   * Obtener un movimiento por ID
   */
  async getById(id: string): Promise<Movement> {
    const { data } = await apiClient.get<Movement>(`/movements/${id}`);
    return data;
  },

  /**
   * Registrar entrada de inventario
   */
  async createEntry(movement: Omit<CreateMovementDto, 'type'>): Promise<Movement> {
    const { data } = await apiClient.post<Movement>('/movements', {
      ...movement,
      type: 'IN',
    });
    return data;
  },

  /**
   * Registrar salida de inventario
   */
  async createExit(movement: Omit<CreateMovementDto, 'type'>): Promise<Movement> {
    const { data } = await apiClient.post<Movement>('/movements', {
      ...movement,
      type: 'OUT',
    });
    return data;
  },

  /**
   * Crear movimiento genérico
   */
  async create(movement: CreateMovementDto): Promise<Movement> {
    const { data } = await apiClient.post<Movement>('/movements', movement);
    return data;
  },
};
