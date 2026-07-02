/**
 * Servicio de alertas de stock.
 *
 * Alineado al contrato REAL del backend (`AlertsController`):
 *  - activas (no reconocidas): `GET /alerts/active`
 *  - historial paginado:       `GET /alerts` -> `{ data, meta }`
 *  - reconocer:                `POST /alerts/:id/acknowledge` y `POST /alerts/acknowledge-all`
 *  - forzar verificación:      `POST /alerts/check`
 *
 * El backend usa "acknowledge" (no borrado físico) como acción de cierre de una
 * alerta, por eso no hay `delete`: reconocer es el equivalente a "marcar como leída".
 */

import apiClient from './client';
import { StockAlert, AlertFilters } from '../types';

interface Paginated<T> {
  data: T[];
  meta?: unknown;
}

export const alertsService = {
  /**
   * Historial de alertas. El backend responde paginado (`{ data, meta }`);
   * exponemos solo el array para el consumo de la UI.
   */
  async getAll(filters?: AlertFilters): Promise<StockAlert[]> {
    const { data } = await apiClient.get<Paginated<StockAlert>>('/alerts', {
      params: filters,
    });
    return data.data;
  },

  /**
   * Alertas activas (no reconocidas). Usado por el dashboard.
   */
  async getUnread(): Promise<StockAlert[]> {
    const { data } = await apiClient.get<StockAlert[]>('/alerts/active');
    return data;
  },

  /**
   * Reconocer una alerta (equivale a "marcar como leída").
   */
  async markAsRead(id: string): Promise<StockAlert> {
    const { data } = await apiClient.post<StockAlert>(`/alerts/${id}/acknowledge`);
    return data;
  },

  /**
   * Reconocer todas las alertas activas.
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.post('/alerts/acknowledge-all');
  },

  /**
   * Forzar verificación de stock bajo (solo Admin).
   */
  async checkAlerts(): Promise<void> {
    await apiClient.post('/alerts/check');
  },
};
