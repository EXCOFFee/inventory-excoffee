/**
 * Página de gestión de categorías - Dark Theme
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesService, CreateCategoryDto, UpdateCategoryDto } from '../../api';
import { Category } from '../../types';
import { Button, Input, Table, Modal, EmptyState, ExportButton } from '../ui';
import { useNotificationStore } from '../../stores';
import { useModal } from '../../hooks';

// Iconos SVG
const TagIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
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

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();
  const createModal = useModal<Category>();
  const deleteModal = useModal<Category>();
  
  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: '',
    description: '',
  });

  // Query
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) => categoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      success('Categoría creada', 'La categoría ha sido creada correctamente');
      createModal.close();
      setFormData({ name: '', description: '' });
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo crear la categoría');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) => 
      categoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      success('Categoría actualizada', 'La categoría ha sido actualizada correctamente');
      createModal.close();
      setFormData({ name: '', description: '' });
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo actualizar la categoría');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      success('Categoría eliminada', 'La categoría ha sido eliminada correctamente');
      deleteModal.close();
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo eliminar la categoría');
    },
  });

  const handleOpenCreate = () => {
    setFormData({ name: '', description: '' });
    createModal.open();
  };

  const handleOpenEdit = (category: Category) => {
    setFormData({ name: category.name, description: category.description || '' });
    createModal.open(category);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Error', 'El nombre es requerido');
      return;
    }

    if (createModal.data) {
      updateMutation.mutate({ id: createModal.data.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Categoría',
      render: (_: unknown, row: Category) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center border border-purple-500/20">
            <TagIcon />
          </div>
          <span className="font-medium text-white">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (_: unknown, row: Category) => (
        <span className="text-gray-400">{row.description || 'Sin descripción'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_: unknown, row: Category) => (
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
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <TagIcon />
            </span>
            Categorías
          </h1>
          <p className="text-gray-400 mt-1">Gestiona las categorías de productos</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <PlusIcon />
          Nueva Categoría
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <TagIcon />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{categories.length}</p>
            <p className="text-sm text-gray-500">Total categorías</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Lista de Categorías</h3>
            <p className="text-sm text-gray-500">{categories.length} categorías registradas</p>
          </div>
          {categories.length > 0 && (
            <ExportButton
              data={categories.map((c) => ({
                Nombre: c.name,
                Descripcion: c.description || '',
              }))}
              columns={['Nombre', 'Descripcion']}
              filename="categorias"
            />
          )}
        </div>
        {categories.length > 0 ? (
          <Table
            columns={columns}
            data={categories}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyMessage="No hay categorías registradas"
          />
        ) : !isLoading ? (
          <EmptyState
            type="no-categories"
            title="Sin categorías"
            description="Crea tu primera categoría para organizar los productos"
            actionLabel="Nueva Categoría"
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
        isOpen={createModal.isOpen}
        onClose={createModal.close}
        title={createModal.data ? '✏️ Editar Categoría' : '🏷️ Nueva Categoría'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre de la categoría"
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-xl text-gray-100 placeholder-gray-500 bg-gray-800/80 border border-gray-700/50 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button type="button" variant="outline" onClick={createModal.close}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {createModal.data ? 'Guardar Cambios' : 'Crear Categoría'}
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
              ¿Estás seguro de que deseas eliminar la categoría{' '}
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
