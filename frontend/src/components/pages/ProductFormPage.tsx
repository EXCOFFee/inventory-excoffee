/**
 * Formulario de creación/edición de productos - Dark Theme
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, categoriesService, suppliersService } from '../../api';
import { CreateProductDto, UpdateProductDto } from '../../types';
import { Button, Input, Select, ImageUpload } from '../ui';
import { useNotificationStore } from '../../stores';

// Iconos SVG
const PackageIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export const ProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<CreateProductDto>({
    sku: '',
    name: '',
    description: '',
    price: 0,
    cost: 0,
    currentStock: 0,
    minStock: 0,
    maxStock: undefined,
    imageUrl: '',
    barcode: '',
    categoryId: undefined,
    supplierId: undefined,
  });

  // Cargar producto existente si es edición
  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsService.getById(id!),
    enabled: isEditing,
  });

  // Cargar categorías y proveedores
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersService.getAll(),
  });

  // Llenar formulario con datos del producto
  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        description: product.description || '',
        price: product.price,
        cost: product.cost,
        currentStock: product.currentStock,
        minStock: product.minStock,
        maxStock: product.maxStock,
        imageUrl: product.imageUrl || '',
        barcode: product.barcode || '',
        categoryId: product.category?.id,
        supplierId: product.supplier?.id,
      });
    }
  }, [product]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateProductDto) => productsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      success('Producto creado', 'El producto ha sido creado correctamente');
      navigate('/products');
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo crear el producto');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProductDto) => productsService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      success('Producto actualizado', 'El producto ha sido actualizado correctamente');
      navigate('/products');
    },
    onError: (err: Error) => {
      error('Error', err.message || 'No se pudo actualizar el producto');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.sku || !formData.name || formData.price <= 0 || formData.minStock < 0) {
      error('Error', 'Completa todos los campos requeridos correctamente');
      return;
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof CreateProductDto, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loadingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <ArrowLeftIcon />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <PackageIcon />
            </span>
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="text-gray-400 mt-1">
            {isEditing ? 'Modifica la información del producto' : 'Completa la información para crear un nuevo producto'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            Información Básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SKU *"
              value={formData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              placeholder="Ej: PROD-001"
              disabled={isEditing}
            />
            <Input
              label="Código de Barras"
              value={formData.barcode || ''}
              onChange={(e) => handleChange('barcode', e.target.value)}
              placeholder="Ej: 7501234567890"
            />
          </div>
          <div className="mt-4">
            <Input
              label="Nombre *"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nombre del producto"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              className="w-full rounded-xl bg-gray-800/50 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              rows={3}
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descripción del producto..."
            />
          </div>
        </div>

        {/* Categoría y Proveedor */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Clasificación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Categoría"
              placeholder="Seleccionar categoría"
              options={[
                { value: '', label: 'Sin categoría' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={formData.categoryId || ''}
              onChange={(e) => handleChange('categoryId', e.target.value || undefined)}
            />
            <Select
              label="Proveedor"
              placeholder="Seleccionar proveedor"
              options={[
                { value: '', label: 'Sin proveedor' },
                ...suppliers.map((s) => ({ value: s.id, label: s.name })),
              ]}
              value={formData.supplierId || ''}
              onChange={(e) => handleChange('supplierId', e.target.value || undefined)}
            />
          </div>
        </div>

        {/* Precios */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Precios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Precio de Venta *"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
              leftIcon={<span className="text-cyan-400">$</span>}
            />
            <Input
              label="Costo"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost || ''}
              onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)}
              leftIcon={<span className="text-cyan-400">$</span>}
            />
          </div>
          {formData.price > 0 && (formData.cost ?? 0) > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm text-emerald-400">
                Margen de ganancia: <span className="font-bold">{((formData.price - (formData.cost ?? 0)) / formData.price * 100).toFixed(1)}%</span>
                {' '}(${(formData.price - (formData.cost ?? 0)).toFixed(2)} por unidad)
              </p>
            </div>
          )}
        </div>

        {/* Stock */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Control de Stock
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Stock Actual"
              type="number"
              min="0"
              value={formData.currentStock || 0}
              onChange={(e) => handleChange('currentStock', parseInt(e.target.value) || 0)}
              disabled={isEditing}
              helperText={isEditing ? 'Use movimientos para modificar' : undefined}
            />
            <Input
              label="Stock Mínimo *"
              type="number"
              min="0"
              value={formData.minStock}
              onChange={(e) => handleChange('minStock', parseInt(e.target.value) || 0)}
              helperText="Alerta cuando llegue a este nivel"
            />
            <Input
              label="Stock Máximo"
              type="number"
              min="0"
              value={formData.maxStock || ''}
              onChange={(e) => handleChange('maxStock', parseInt(e.target.value) || undefined)}
              helperText="Límite de capacidad (opcional)"
            />
          </div>
        </div>

        {/* Imagen */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            Imagen del Producto
          </h3>
          <ImageUpload
            value={formData.imageUrl || undefined}
            onChange={(url) => handleChange('imageUrl', url || '')}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/products')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </div>
  );
};
