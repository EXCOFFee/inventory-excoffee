/**
 * Página de alertas de stock - Dark Theme
 *
 * Consume el modelo real del backend (campos planos + `acknowledged`). "Marcar
 * como leída" reconoce la alerta (`acknowledge`); no hay borrado físico.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsService } from '../../api';
import { StockAlert } from '../../types';
import { Button, Select, EmptyState } from '../ui';
import { useNotificationStore } from '../../stores';
import { formatDate, formatNumber } from '../../utils';

type FilterType = 'all' | 'unread' | 'read';
type Severity = 'critical' | 'warning';

// Iconos SVG
const BellIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/** Severidad derivada del stock (el backend no guarda un `type`). */
const getAlertSeverity = (alert: StockAlert): Severity => {
  if (alert.currentStock === 0) return 'critical';
  if (alert.currentStock <= alert.minStock / 2) return 'critical';
  return 'warning';
};

/** Mensaje derivado a partir de los datos de la alerta. */
const getAlertMessage = (alert: StockAlert): string =>
  alert.currentStock === 0
    ? 'Producto agotado (sin stock).'
    : `Stock bajo: ${formatNumber(alert.currentStock)} unidades (mínimo ${formatNumber(alert.minStock)}).`;

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();
  const [filter, setFilter] = useState<FilterType>('all');

  // Query
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsService.getAll(),
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => alertsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-alerts'] });
      success('Alerta actualizada', 'La alerta ha sido reconocida');
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo actualizar la alerta');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => alertsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-alerts'] });
      success('Alertas actualizadas', 'Todas las alertas han sido reconocidas');
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudieron actualizar las alertas');
    },
  });

  // Filtered alerts (activa = no reconocida)
  const filteredAlerts = alerts.filter((alert: StockAlert) => {
    if (filter === 'unread') return !alert.acknowledged;
    if (filter === 'read') return alert.acknowledged;
    return true;
  });

  const unreadCount = alerts.filter((a: StockAlert) => !a.acknowledged).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center">
              <BellIcon />
            </span>
            Alertas de Stock
          </h1>
          <p className="text-gray-400 mt-1">
            {unreadCount > 0
              ? `Tienes ${unreadCount} alerta${unreadCount > 1 ? 's' : ''} sin reconocer`
              : 'No tienes alertas pendientes'}
          </p>
        </div>
        <div className="flex gap-3">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            options={[
              { value: 'all', label: 'Todas las alertas' },
              { value: 'unread', label: 'Sin reconocer' },
              { value: 'read', label: 'Reconocidas' },
            ]}
          />
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              isLoading={markAllAsReadMutation.isPending}
              className="flex items-center gap-2"
            >
              <CheckCircleIcon />
              Reconocer todas
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-red-500">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
            <span className="text-2xl">🚨</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">
              {alerts.filter((a: StockAlert) => getAlertSeverity(a) === 'critical' && !a.acknowledged).length}
            </p>
            <p className="text-sm text-gray-500">Críticas</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-amber-500">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">
              {alerts.filter((a: StockAlert) => getAlertSeverity(a) === 'warning' && !a.acknowledged).length}
            </p>
            <p className="text-sm text-gray-500">Advertencias</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-emerald-500">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">
              {alerts.filter((a: StockAlert) => a.acknowledged).length}
            </p>
            <p className="text-sm text-gray-500">Reconocidas</p>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800/50">
          <h3 className="text-lg font-bold text-white">
            {filter === 'all' && 'Todas las Alertas'}
            {filter === 'unread' && 'Alertas Sin Reconocer'}
            {filter === 'read' && 'Alertas Reconocidas'}
          </h3>
          <p className="text-sm text-gray-500">{filteredAlerts.length} alertas</p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner w-8 h-8" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <EmptyState
              type="no-alerts"
              title={filter === 'unread' ? 'Sin alertas pendientes' : filter === 'read' ? 'Sin alertas reconocidas' : 'Sin alertas'}
              description={filter === 'unread'
                ? '¡Excelente! No tienes alertas de stock sin reconocer'
                : filter === 'read'
                  ? 'Las alertas que reconozcas aparecerán aquí'
                  : 'Tu inventario está en buen estado, sin alertas de stock'}
            />
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert: StockAlert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  severity={getAlertSeverity(alert)}
                  onMarkAsRead={() => markAsReadMutation.mutate(alert.id)}
                  isMarkingAsRead={markAsReadMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Alert Item Component
interface AlertItemProps {
  alert: StockAlert;
  severity: Severity;
  onMarkAsRead: () => void;
  isMarkingAsRead: boolean;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, severity, onMarkAsRead, isMarkingAsRead }) => {
  const { currentStock, minStock } = alert;

  const severityColors: Record<Severity, string> = {
    critical: 'border-red-500/30 bg-red-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
  };

  const severityIcons: Record<Severity, string> = {
    critical: '🚨',
    warning: '⚠️',
  };

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      alert.acknowledged
        ? 'bg-gray-900/30 border-gray-800 opacity-60'
        : severityColors[severity]
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <span className="text-2xl">{severityIcons[severity]}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold ${alert.acknowledged ? 'text-gray-500' : 'text-white'}`}>
                {alert.productName || 'Producto desconocido'}
              </h3>
              {!alert.acknowledged && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  severity === 'critical'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  Nueva
                </span>
              )}
            </div>
            <p className="text-sm text-cyan-400 font-mono">SKU: {alert.productSku || 'N/A'}</p>
            <p className="text-sm text-gray-400 mt-2">{getAlertMessage(alert)}</p>

            <div className="flex items-center gap-6 mt-3 text-sm">
              <span className="text-gray-500">
                Stock actual: <strong className={severity === 'critical' ? 'text-red-400' : 'text-amber-400'}>
                  {formatNumber(currentStock)}
                </strong>
              </span>
              <span className="text-gray-500">
                Stock mínimo: <strong className="text-white">{formatNumber(minStock)}</strong>
              </span>
              <span className="text-gray-500">
                Déficit: <strong className="text-red-400">
                  {formatNumber(Math.max(0, minStock - currentStock))}
                </strong>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Nivel de stock</span>
                <span>{minStock > 0 ? Math.round((currentStock / minStock) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${minStock > 0 ? Math.min((currentStock / minStock) * 100, 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Recommendation */}
            {!alert.acknowledged && (
              <div className="mt-3 p-3 bg-gray-800/50 rounded-lg text-sm text-gray-300">
                <strong className="text-white">Recomendación:</strong>{' '}
                {severity === 'critical'
                  ? 'Reabastecer urgentemente. El stock está agotado o muy bajo.'
                  : 'Considerar reabastecer pronto para evitar quiebres de stock.'}
              </div>
            )}

            <p className="text-xs text-gray-600 mt-3">{formatDate(alert.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!alert.acknowledged && (
            <button
              onClick={onMarkAsRead}
              disabled={isMarkingAsRead}
              className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-all disabled:opacity-50"
              title="Reconocer alerta"
            >
              <CheckCircleIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
