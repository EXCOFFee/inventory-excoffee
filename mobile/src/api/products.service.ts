/**
 * Servicio de Productos - Móvil.
 */

import apiClient from './client';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  categoryId?: string;
  supplierId?: string;
  imageUrl?: string;
  barcode?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  currentStock?: number;
  minStock: number;
  maxStock?: number;
  categoryId?: string;
  supplierId?: string;
  imageUrl?: string;
  barcode?: string;
}

export const productsService = {
  async getAll(filters?: ProductFilters): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.supplierId) params.append('supplierId', filters.supplierId);
    if (filters?.lowStock) params.append('lowStock', 'true');
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get<ProductsResponse>(`/products?${params}`);
    return response.data;
  },

  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  async getBySku(sku: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/sku/${sku}`);
    return response.data;
  },

  async getByBarcode(barcode: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/barcode/${barcode}`);
    return response.data;
  },

  async create(data: CreateProductDto): Promise<Product> {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateProductDto>): Promise<Product> {
    const response = await apiClient.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};
