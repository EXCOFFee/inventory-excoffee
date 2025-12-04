/**
 * Página de lista de productos - Dark Theme
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { productsService, categoriesService, suppliersService } from '../../api';
import { Product, ProductFilters } from '../../types';
import { Button, Input, Select, Badge, Table, Modal, ExportButton, EmptyState } from '../ui';
import { useNotificationStore } from '../../stores';

// Iconos SVG inline
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

const PackageIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 10,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Queries
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsService.getAll(filters),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersService.getAll(),
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      success('Producto eliminado', 'El producto ha sido eliminado correctamente');
      setShowDeleteModal(false);
      setSelectedProduct(null);
    },
    onError: () => {
      error('Error', 'No se pudo eliminar el producto');
    },
  });

  const handleDelete = () => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id);
    }
  };

  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      render: (_: unknown, row: Product) => (
        <span className="font-mono text-cyan-400 text-sm">{row.sku}</span>
      ),
    },
    {
      key: 'name',
      label: 'Producto',
      render: (_: unknown, row: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-cyan-500/10 flex items-center justify-center border border-primary-500/20">
            <PackageIcon />
          </div>
          <div>
            <p className="font-medium text-white">{row.name}</p>
            <p className="text-sm text-gray-500 line-clamp-1">{row.description?.substring(0, 40)}...</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Categoría',
      render: (_: unknown, row: Product) => (
        <span className="badge-info">{row.category?.name || 'Sin categoría'}</span>
      ),
    },
    {
      key: 'currentStock',
      label: 'Stock',
      render: (_: unknown, row: Product) => (
        <div className="flex items-center gap-2">
          <span className={`font-bold text-lg ${
            row.currentStock <= 0 ? 'text-red-400' :
            row.currentStock <= row.minStock ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {row.currentStock}
          </span>
          {row.currentStock <= 0 && (
            <Badge variant="danger" size="sm">Sin Stock</Badge>
          )}
          {row.currentStock > 0 && row.currentStock <= row.minStock && (
            <Badge variant="warning" size="sm">Bajo</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Precio',
      render: (_: unknown, row: Product) => (
        <span className="font-semibold text-white">${row.price.toFixed(2)}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (_: unknown, row: Product) => (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${row.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
          <span className={row.isActive ? 'text-emerald-400' : 'text-gray-500'}>
            {row.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_: unknown, row: Product) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/products/${row.id}`)}
            className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all"
            title="Ver detalles"
          >
            <EyeIcon />
          </button>
          <button
            onClick={() => navigate(`/products/${row.id}/edit`)}
            className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-all"
            title="Editar"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(row);
              setShowDeleteModal(true);
            }}
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
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
              <PackageIcon />
            </span>
            Productos
          </h1>
          <p className="text-gray-400 mt-1">Gestiona el catálogo de productos del inventario</p>
        </div>
        <Button onClick={() => navigate('/products/new')} className="flex items-center gap-2">
          <PlusIcon />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <SearchIcon />
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Filtros de Búsqueda</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
          <Select
            placeholder="Categoría"
            options={[
              { value: '', label: 'Todas las categorías' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={filters.categoryId || ''}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value || undefined, page: 1 })}
          />
          <Select
            placeholder="Proveedor"
            options={[
              { value: '', label: 'Todos los proveedores' },
              ...suppliers.map((s) => ({ value: s.id, label: s.name })),
            ]}
            value={filters.supplierId || ''}
            onChange={(e) => setFilters({ ...filters, supplierId: e.target.value || undefined, page: 1 })}
          />
          <Select
            placeholder="Estado de Stock"
            options={[
              { value: '', label: 'Todos' },
              { value: 'true', label: 'Solo bajo stock' },
            ]}
            value={filters.lowStock ? 'true' : ''}
            onChange={(e) => setFilters({ ...filters, lowStock: e.target.value === 'true', page: 1 })}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Lista de Productos</h3>
            <p className="text-sm text-gray-500">
              {productsData?.meta?.total || 0} productos en total
            </p>
          </div>
          <div className="flex items-center gap-4">
            {productsData?.data && productsData.data.length > 0 && (
              <ExportButton
                data={productsData.data.map((p) => ({
                  SKU: p.sku,
                  Nombre: p.name,
                  Descripcion: p.description || '',
                  Categoria: p.category?.name || 'Sin categoría',
                  Stock: p.currentStock,
                  'Stock Mínimo': p.minStock,
                  Precio: `$${p.price.toFixed(2)}`,
                  Costo: `$${(p.cost || 0).toFixed(2)}`,
                  Estado: p.isActive ? 'Activo' : 'Inactivo',
                }))}
                columns={['SKU', 'Nombre', 'Descripcion', 'Categoria', 'Stock', 'Stock Mínimo', 'Precio', 'Costo', 'Estado']}
                filename="productos"
              />
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Ordenar por:</span>
              <select className="bg-transparent text-gray-300 text-sm focus:outline-none cursor-pointer">
                <option value="name">Nombre</option>
                <option value="stock">Stock</option>
                <option value="price">Precio</option>
              </select>
            </div>
          </div>
        </div>
        
        {productsData?.data && productsData.data.length > 0 ? (
          <Table
            columns={columns}
            data={productsData.data}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            emptyMessage="No se encontraron productos"
          />
        ) : !isLoading ? (
          <EmptyState
            type={filters.search ? 'no-results' : 'no-products'}
            title={filters.search ? 'Sin resultados' : 'Sin productos'}
            description={filters.search ? `No se encontraron productos que coincidan con "${filters.search}"` : 'Comienza agregando tu primer producto al inventario'}
            actionLabel="Agregar Producto"
            onAction={() => navigate('/products/new')}
          />
        ) : (
          <Table
            columns={columns}
            data={[]}
            keyExtractor={(item) => item.id}
            isLoading={true}
            emptyMessage="No se encontraron productos"
          />
        )}

        {/* Pagination */}
        {productsData?.meta && productsData.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/50 bg-gray-900/30">
            <p className="text-sm text-gray-500">
              Mostrando <span className="text-white font-medium">{((filters.page || 1) - 1) * (filters.limit || 10) + 1}</span> a{' '}
              <span className="text-white font-medium">{Math.min((filters.page || 1) * (filters.limit || 10), productsData.meta.total)}</span> de{' '}
              <span className="text-cyan-400 font-medium">{productsData.meta.total}</span> productos
            </p>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:border-primary-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                disabled={!productsData.meta.hasPrevPage}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              >
                ← Anterior
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, productsData.meta.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setFilters({ ...filters, page })}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        filters.page === page
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:border-primary-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                disabled={!productsData.meta.hasNextPage}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProduct(null);
        }}
        title="⚠️ Confirmar Eliminación"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-gray-300">
              ¿Estás seguro de que deseas eliminar el producto{' '}
              <strong className="text-white">{selectedProduct?.name}</strong>?
            </p>
            <p className="text-red-400 text-sm mt-2">
              Esta acción no se puede deshacer y eliminará todos los registros asociados.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedProduct(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Eliminar Producto
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
