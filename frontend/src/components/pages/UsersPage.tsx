/**
 * Página de gestión de usuarios (Solo Admin) - Dark Theme
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../../types';
import { Button, Input, Select, Table, Modal, EmptyState, ExportButton } from '../ui';
import { useNotificationStore, useAuthStore } from '../../stores';
import { useModal } from '../../hooks';
import { formatDate } from '../../utils';
import apiClient from '../../api/client';

// Iconos SVG
const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
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

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

// Types
interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
}

interface UpdateUserDto {
  email?: string;
  name?: string;
  role?: 'ADMIN' | 'STAFF';
  password?: string;
}

// Inline API service for users
const usersService = {
  async getAll(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },

  async create(user: CreateUserDto): Promise<User> {
    const { data } = await apiClient.post<User>('/users', user);
    return data;
  },

  async update(id: string, user: UpdateUserDto): Promise<User> {
    const { data } = await apiClient.patch<User>(`/users/${id}`, user);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();
  const { user: currentUser } = useAuthStore();
  const formModal = useModal<User>();
  const deleteModal = useModal<User>();

  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    name: string;
    role: 'ADMIN' | 'STAFF';
  }>({
    email: '',
    password: '',
    name: '',
    role: 'STAFF',
  });

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'ADMIN';

  // Query
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
    enabled: isAdmin,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      success('Usuario creado', 'El usuario ha sido creado correctamente');
      formModal.close();
      resetForm();
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo crear el usuario');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      success('Usuario actualizado', 'El usuario ha sido actualizado correctamente');
      formModal.close();
      resetForm();
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo actualizar el usuario');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      success('Usuario eliminado', 'El usuario ha sido eliminado correctamente');
      deleteModal.close();
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo eliminar el usuario');
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'STAFF',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    formModal.open();
  };

  const handleOpenEdit = (user: User) => {
    setFormData({
      email: user.email,
      password: '', // Don't prefill password
      name: user.name,
      role: user.role,
    });
    formModal.open(user);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.name.trim()) {
      error('Error', 'El email y nombre son requeridos');
      return;
    }

    if (!formModal.data && !formData.password) {
      error('Error', 'La contraseña es requerida para nuevos usuarios');
      return;
    }

    if (formModal.data) {
      const updateData: UpdateUserDto = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
      };
      // Only include password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateMutation.mutate({ id: formModal.data.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Prevent non-admins from accessing
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-card max-w-md w-full p-12 text-center">
          <div className="w-24 h-24 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6 text-red-400">
            <LockIcon />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h2>
          <p className="text-gray-400">
            Solo los administradores pueden gestionar usuarios del sistema.
          </p>
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: 'name',
      label: 'Usuario',
      render: (_: unknown, row: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold">
              {row.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-white">{row.name}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rol',
      render: (_: unknown, row: User) => (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          row.role === 'ADMIN' 
            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
        }`}>
          {row.role === 'ADMIN' && <ShieldIcon />}
          <span className="font-medium text-sm">{row.role === 'ADMIN' ? 'Administrador' : 'Staff'}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Fecha de Registro',
      render: (_: unknown, row: User) => (
        <span className="text-sm text-gray-400">
          {formatDate(row.createdAt || '')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_: unknown, row: User) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-all"
            title="Editar"
          >
            <EditIcon />
          </button>
          {row.id !== currentUser?.id && (
            <button
              onClick={() => deleteModal.open(row)}
              className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
              title="Eliminar"
            >
              <TrashIcon />
            </button>
          )}
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
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <UsersIcon />
            </span>
            Usuarios
          </h1>
          <p className="text-gray-400 mt-1">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <PlusIcon />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
            <UsersIcon />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{users.length}</p>
            <p className="text-sm text-gray-500">Total usuarios</p>
          </div>
        </div>
        
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <ShieldIcon />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {users.filter((u) => u.role === 'ADMIN').length}
            </p>
            <p className="text-sm text-gray-500">Administradores</p>
          </div>
        </div>
        
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {users.filter((u) => u.role === 'STAFF').length}
            </p>
            <p className="text-sm text-gray-500">Staff</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Lista de Usuarios</h3>
            <p className="text-sm text-gray-500">{users.length} usuarios registrados</p>
          </div>
          {users.length > 0 && (
            <ExportButton
              data={users.map((u) => ({
                Nombre: u.name,
                Email: u.email,
                Rol: u.role === 'ADMIN' ? 'Administrador' : 'Staff',
                'Fecha Registro': formatDate(u.createdAt || ''),
              }))}
              columns={['Nombre', 'Email', 'Rol', 'Fecha Registro']}
              filename="usuarios"
            />
          )}
        </div>
        {users.length > 0 ? (
          <Table
            columns={columns}
            data={users}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyMessage="No hay usuarios registrados"
          />
        ) : !isLoading ? (
          <EmptyState
            type="no-users"
            title="Sin usuarios"
            description="Crea el primer usuario del sistema"
            actionLabel="Nuevo Usuario"
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
        title={formModal.data ? '✏️ Editar Usuario' : '👤 Nuevo Usuario'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre completo"
          />

          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@ejemplo.com"
          />

          <Input
            label={formModal.data ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={formModal.data ? '••••••••' : 'Mínimo 6 caracteres'}
          />

          <Select
            label="Rol *"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'STAFF' })}
            options={[
              { value: 'STAFF', label: 'Staff - Acceso limitado' },
              { value: 'ADMIN', label: 'Administrador - Acceso completo' },
            ]}
          />

          {formData.role === 'ADMIN' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
              ⚠️ Los administradores tienen acceso completo al sistema, incluyendo la gestión de usuarios.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button type="button" variant="outline" onClick={formModal.close}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {formModal.data ? 'Guardar Cambios' : 'Crear Usuario'}
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
              ¿Estás seguro de que deseas eliminar al usuario{' '}
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
