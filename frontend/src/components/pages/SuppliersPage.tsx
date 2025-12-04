/**
 * Página de gestión de proveedores - Dark Theme
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersService, CreateSupplierDto, UpdateSupplierDto } from '../../api';
import { Supplier } from '../../types';
import { Button, Input, Table, Modal, EmptyState, ExportButton } from '../ui';
import { useNotificationStore } from '../../stores';
import { useModal } from '../../hooks';

// Iconos SVG
const TruckIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h.01M16 17h.01M5 11h14l-4-7H9l-4 7zm3 10a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

interface SupplierFormData extends CreateSupplierDto {}

export const SuppliersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();
  const formModal = useModal<Supplier>();
  const deleteModal = useModal<Supplier>();
  
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
  });

  // Query
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersService.getAll(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateSupplierDto) => suppliersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      success('Proveedor creado', 'El proveedor ha sido creado correctamente');
      formModal.close();
      resetForm();
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo crear el proveedor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierDto }) => 
      suppliersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      success('Proveedor actualizado', 'El proveedor ha sido actualizado correctamente');
      formModal.close();
      resetForm();
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo actualizar el proveedor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      success('Proveedor eliminado', 'El proveedor ha sido eliminado correctamente');
      deleteModal.close();
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo eliminar el proveedor');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    formModal.open();
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
    });
    formModal.open(supplier);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Error', 'El nombre es requerido');
      return;
    }

    if (formModal.data) {
      updateMutation.mutate({ id: formModal.data.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Proveedor',
      render: (_: unknown, row: Supplier) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
            <TruckIcon />
          </div>
          <div>
            <p className="font-medium text-white">{row.name}</p>
            {row.contactPerson && (
              <p className="text-xs text-gray-500">Contacto: {row.contactPerson}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (_: unknown, row: Supplier) => (
        <div className="flex items-center gap-2 text-gray-400">
          {row.email ? (
            <>
              <MailIcon />
              <span className="text-sm">{row.email}</span>
            </>
          ) : (
            <span className="text-gray-600">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
      render: (_: unknown, row: Supplier) => (
        <div className="flex items-center gap-2 text-gray-400">
          {row.phone ? (
            <>
              <PhoneIcon />
              <span className="text-sm">{row.phone}</span>
            </>
          ) : (
            <span className="text-gray-600">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Dirección',
      render: (_: unknown, row: Supplier) => (
        <span className="text-sm text-gray-400 truncate max-w-[200px] block">
          {row.address || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_: unknown, row: Supplier) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-all"
            title="Editar"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => deleteModal.open(row)}
            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
            title="Eliminar"
          >
            <TrashIcon />
          </button>
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
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <TruckIcon />
            </span>
            Proveedores
          </h1>
          <p className="text-gray-400 mt-1">Gestiona los proveedores de productos</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <PlusIcon />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <TruckIcon />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{suppliers.length}</p>
            <p className="text-sm text-gray-500">Total proveedores</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Lista de Proveedores</h3>
            <p className="text-sm text-gray-500">{suppliers.length} proveedores registrados</p>
          </div>
          {suppliers.length > 0 && (
            <ExportButton
              data={suppliers.map((s) => ({
                Nombre: s.name,
                Email: s.email || '',
                Telefono: s.phone || '',
                Contacto: s.contactPerson || '',
                Direccion: s.address || '',
              }))}
              columns={['Nombre', 'Email', 'Telefono', 'Contacto', 'Direccion']}
              filename="proveedores"
            />
          )}
        </div>
        {suppliers.length > 0 ? (
          <Table
            columns={columns}
            data={suppliers}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyMessage="No hay proveedores registrados"
          />
        ) : !isLoading ? (
          <EmptyState
            type="no-suppliers"
            title="Sin proveedores"
            description="Registra tu primer proveedor para gestionar las compras"
            actionLabel="Nuevo Proveedor"
            onAction={handleOpenCreate}
          />
        ) : (
          <Table
            columns={columns}
            data={[]}
            keyExtractor={(item) => item.id}
            isLoading={true}
            emptyMessage=""
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        title={formModal.data ? '✏️ Editar Proveedor' : '🚚 Nuevo Proveedor'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre del proveedor"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@proveedor.com"
            />
            <Input
              label="Teléfono"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+52 55 1234 5678"
            />
          </div>

          <Input
            label="Persona de Contacto"
            value={formData.contactPerson || ''}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="Nombre del contacto"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dirección
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-xl text-gray-100 placeholder-gray-500 bg-gray-800/80 border border-gray-700/50 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
              rows={2}
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Dirección completa..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button type="button" variant="outline" onClick={formModal.close}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {formModal.data ? 'Guardar Cambios' : 'Crear Proveedor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        title="⚠️ Confirmar Eliminación"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-gray-300">
              ¿Estás seguro de que deseas eliminar al proveedor{' '}
              <strong className="text-white">{deleteModal.data?.name}</strong>?
            </p>
            <p className="text-red-400 text-sm mt-2">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={deleteModal.close}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteModal.data && deleteMutation.mutate(deleteModal.data.id)}
              isLoading={deleteMutation.isPending}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
