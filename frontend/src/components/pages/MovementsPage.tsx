/**
 * Página de movimientos de inventario (Kardex) - Dark Theme
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movementsService, productsService } from '../../api';
import { Movement, MovementFilters, CreateMovementDto } from '../../types';
import { Button, Input, Select, Table, Modal, ExportButton, EmptyState } from '../ui';
import { useNotificationStore } from '../../stores';

// Iconos SVG
const ArrowDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
);

const SwitchHorizontalIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const MovementsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  const [filters, setFilters] = useState<MovementFilters>({
    page: 1,
    limit: 20,
  });
  const [showNewMovementModal, setShowNewMovementModal] = useState(false);
  const [newMovement, setNewMovement] = useState<Partial<CreateMovementDto>>({
    type: 'IN',
    quantity: 1,
  });

  // Queries
  const { data: movementsData, isLoading } = useQuery({
    queryKey: ['movements', filters],
    queryFn: () => movementsService.getAll(filters),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-select'],
    queryFn: () => productsService.getAll({ limit: 1000 }).then((res) => res.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateMovementDto) => movementsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      success('Movimiento registrado', 'El movimiento ha sido registrado correctamente');
      setShowNewMovementModal(false);
      setNewMovement({ type: 'IN', quantity: 1 });
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo registrar el movimiento');
    },
  });

  const handleCreateMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovement.productId || !newMovement.quantity) {
      error('Error', 'Complete todos los campos requeridos');
      return;
    }
    createMutation.mutate(newMovement as CreateMovementDto);
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'Fecha',
      render: (_: unknown, row: Movement) => (
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <CalendarIcon />
          </span>
          <div>
            <p className="text-white text-sm">
              {new Date(row.createdAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
            <p className="text-gray-500 text-xs">
              {new Date(row.createdAt).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (_: unknown, row: Movement) => (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          row.type === 'IN' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {row.type === 'IN' ? <ArrowDownIcon /> : <ArrowUpIcon />}
          <span className="font-medium">{row.type === 'IN' ? 'Entrada' : 'Salida'}</span>
        </div>
      ),
    },
    {
      key: 'product',
      label: 'Producto',
      render: (_: unknown, row: Movement) => (
        <div>
          <p className="font-medium text-white">{row.product?.name}</p>
          <p className="text-xs text-cyan-400 font-mono">{row.product?.sku}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      render: (_: unknown, row: Movement) => (
        <span className={`text-lg font-bold ${row.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
          {row.type === 'IN' ? '+' : '-'}{row.quantity}
        </span>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (_: unknown, row: Movement) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">{row.previousStock}</span>
          <span className="text-cyan-400">→</span>
          <span className="font-bold text-white">{row.newStock}</span>
        </div>
      ),
    },
    {
      key: 'unitCost',
      label: 'Costo Unit.',
      render: (_: unknown, row: Movement) => (
        <span className="text-gray-300">${row.unitCost.toFixed(2)}</span>
      ),
    },
    {
      key: 'totalCost',
      label: 'Total',
      render: (_: unknown, row: Movement) => (
        <span className="font-semibold text-white">${row.totalCost.toFixed(2)}</span>
      ),
    },
    {
      key: 'reference',
      label: 'Referencia',
      render: (_: unknown, row: Movement) => (
        <span className="text-gray-400 text-sm">{row.reference || '-'}</span>
      ),
    },
    {
      key: 'user',
      label: 'Usuario',
      render: (_: unknown, row: Movement) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-400">
              {row.user?.firstName?.charAt(0)}{row.user?.lastName?.charAt(0)}
            </span>
          </div>
          <span className="text-gray-300 text-sm">
            {row.user ? `${row.user.firstName}` : '-'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-primary-500 flex items-center justify-center">
              <SwitchHorizontalIcon />
            </span>
            Movimientos
          </h1>
          <p className="text-gray-400 mt-1">Historial de entradas y salidas del inventario</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setNewMovement({ type: 'IN', quantity: 1 });
              setShowNewMovementModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <ArrowDownIcon />
            Nueva Entrada
          </button>
          <button
            onClick={() => {
              setNewMovement({ type: 'OUT', quantity: 1 });
              setShowNewMovementModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 transition-all hover:shadow-lg hover:shadow-red-500/20"
          >
            <ArrowUpIcon />
            Nueva Salida
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ArrowDownIcon />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {movementsData?.data?.filter(m => m.type === 'IN').length || 0}
            </p>
            <p className="text-sm text-gray-500">Entradas hoy</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
            <ArrowUpIcon />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {movementsData?.data?.filter(m => m.type === 'OUT').length || 0}
            </p>
            <p className="text-sm text-gray-500">Salidas hoy</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <SwitchHorizontalIcon />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{movementsData?.meta?.total || 0}</p>
            <p className="text-sm text-gray-500">Total movimientos</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon />
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            placeholder="Producto"
            options={[
              { value: '', label: 'Todos los productos' },
              ...products.map((p) => ({ value: p.id, label: `${p.sku} - ${p.name}` })),
            ]}
            value={filters.productId || ''}
            onChange={(e) => setFilters({ ...filters, productId: e.target.value || undefined, page: 1 })}
          />
          <Select
            placeholder="Tipo de movimiento"
            options={[
              { value: '', label: 'Todos los tipos' },
              { value: 'IN', label: '↓ Entradas' },
              { value: 'OUT', label: '↑ Salidas' },
            ]}
            value={filters.type || ''}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as 'IN' | 'OUT' | undefined, page: 1 })}
          />
          <Input
            type="date"
            placeholder="Fecha desde"
            value={filters.startDate || ''}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined, page: 1 })}
          />
          <Input
            type="date"
            placeholder="Fecha hasta"
            value={filters.endDate || ''}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined, page: 1 })}
          />
        </div>
      </div>

      {/* Movements Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Historial de Movimientos</h3>
            <p className="text-sm text-gray-500">
              {movementsData?.meta?.total || 0} registros en total
            </p>
          </div>
          {movementsData?.data && movementsData.data.length > 0 && (
            <ExportButton
              data={movementsData.data.map((m) => ({
                Fecha: new Date(m.createdAt).toLocaleDateString('es-ES'),
                Hora: new Date(m.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                Tipo: m.type === 'IN' ? 'Entrada' : 'Salida',
                Producto: m.product?.name || '',
                SKU: m.product?.sku || '',
                Cantidad: m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`,
                'Stock Anterior': m.previousStock,
                'Stock Nuevo': m.newStock,
                'Costo Unitario': `$${m.unitCost.toFixed(2)}`,
                'Costo Total': `$${m.totalCost.toFixed(2)}`,
                Referencia: m.reference || '',
                Usuario: m.user ? `${m.user.firstName} ${m.user.lastName}` : '',
              }))}
              columns={['Fecha', 'Hora', 'Tipo', 'Producto', 'SKU', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Costo Unitario', 'Costo Total', 'Referencia', 'Usuario']}
              filename="movimientos"
            />
          )}
        </div>

        {movementsData?.data && movementsData.data.length > 0 ? (
          <Table
            columns={columns}
            data={movementsData.data}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyMessage="No se encontraron movimientos"
          />
        ) : !isLoading ? (
          <EmptyState
            type="no-movements"
            title="Sin movimientos"
            description="Registra tu primera entrada o salida de inventario"
            actionLabel="Nueva Entrada"
            onAction={() => {
              setNewMovement({ type: 'IN', quantity: 1 });
              setShowNewMovementModal(true);
            }}
          />
        ) : (
          <Table
            columns={columns}
            data={[]}
            keyExtractor={(item) => item.id}
            isLoading={true}
            emptyMessage="No se encontraron movimientos"
          />
        )}

        {/* Pagination */}
        {movementsData?.meta && movementsData.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/50 bg-gray-900/30">
            <p className="text-sm text-gray-500">
              Mostrando <span className="text-white font-medium">{((filters.page || 1) - 1) * (filters.limit || 20) + 1}</span> a{' '}
              <span className="text-white font-medium">{Math.min((filters.page || 1) * (filters.limit || 20), movementsData.meta.total)}</span> de{' '}
              <span className="text-cyan-400 font-medium">{movementsData.meta.total}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:border-primary-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                disabled={!movementsData.meta.hasPrevPage}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              >
                ← Anterior
              </button>
              <button
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:border-primary-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                disabled={!movementsData.meta.hasNextPage}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Movement Modal */}
      <Modal
        isOpen={showNewMovementModal}
        onClose={() => {
          setShowNewMovementModal(false);
          setNewMovement({ type: 'IN', quantity: 1 });
        }}
        title={newMovement.type === 'IN' ? '📥 Nueva Entrada' : '📤 Nueva Salida'}
        size="lg"
      >
        <form onSubmit={handleCreateMovement} className="space-y-4">
          <div className={`p-4 rounded-xl mb-4 ${
            newMovement.type === 'IN' 
              ? 'bg-emerald-500/10 border border-emerald-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <p className={`text-sm ${newMovement.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
              {newMovement.type === 'IN' 
                ? 'Registra una entrada de productos al inventario' 
                : 'Registra una salida de productos del inventario'}
            </p>
          </div>

          <Select
            label="Producto"
            options={products.map((p) => ({ 
              value: p.id, 
              label: `${p.sku} - ${p.name} (Stock: ${p.currentStock})` 
            }))}
            value={newMovement.productId || ''}
            onChange={(e) => setNewMovement({ ...newMovement, productId: e.target.value })}
            placeholder="Seleccionar producto..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cantidad"
              type="number"
              min={1}
              value={newMovement.quantity || ''}
              onChange={(e) => setNewMovement({ ...newMovement, quantity: parseInt(e.target.value) || 0 })}
              required
            />
            <Input
              label="Costo Unitario"
              type="number"
              step="0.01"
              min={0}
              value={newMovement.unitCost || ''}
              onChange={(e) => setNewMovement({ ...newMovement, unitCost: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <Input
            label="Referencia"
            placeholder="Ej: Factura #123, Orden de compra #456"
            value={newMovement.reference || ''}
            onChange={(e) => setNewMovement({ ...newMovement, reference: e.target.value })}
          />

          <Input
            label="Notas adicionales"
            placeholder="Cualquier información adicional..."
            value={newMovement.notes || ''}
            onChange={(e) => setNewMovement({ ...newMovement, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewMovementModal(false);
                setNewMovement({ type: 'IN', quantity: 1 });
              }}
            >
              Cancelar
            </Button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all ${
                newMovement.type === 'IN'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'
                  : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'
              } disabled:opacity-50`}
            >
              {createMutation.isPending ? 'Registrando...' : `Registrar ${newMovement.type === 'IN' ? 'Entrada' : 'Salida'}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
