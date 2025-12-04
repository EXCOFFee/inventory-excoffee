/**
 * Servicio de alertas de stock
 */

import apiClient from './client';
import { StockAlert, AlertFilters, AlertStats } from '../types';

export const alertsService = {
  /**
   * Obtener todas las alertas con filtros opcionales
   */
  async getAll(filters?: AlertFilters): Promise<StockAlert[]> {
    const { data } = await apiClient.get<StockAlert[]>('/alerts', {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener alertas no leídas
   */
  async getUnread(): Promise<StockAlert[]> {
    const { data } = await apiClient.get<StockAlert[]>('/alerts/unread');
    return data;
  },

  /**
   * Obtener estadísticas de alertas
   */
  async getStats(): Promise<AlertStats> {
    const { data } = await apiClient.get<AlertStats>('/alerts/stats');
    return data;
  },

  /**
   * Marcar alerta como leída
   */
  async markAsRead(id: string): Promise<StockAlert> {
    const { data } = await apiClient.patch<StockAlert>(`/alerts/${id}/read`);
    return data;
  },

  /**
   * Marcar todas las alertas como leídas
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/alerts/read-all');
  },

  /**
   * Eliminar alerta
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/alerts/${id}`);
  },

  /**
   * Forzar verificación de alertas
   */
  async checkAlerts(): Promise<void> {
    await apiClient.post('/alerts/check');
  },
};
