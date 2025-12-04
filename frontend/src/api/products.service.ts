/**
 * Servicio de productos
 */

import apiClient from './client';
import {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductFilters,
  PaginatedResponse,
} from '../types';

export const productsService = {
  /**
   * Obtener todos los productos con filtros opcionales
   */
  async getAll(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener un producto por ID
   */
  async getById(id: string): Promise<Product> {
    const { data } = await apiClient.get<Product>(`/products/${id}`);
    return data;
  },

  /**
   * Crear nuevo producto
   */
  async create(product: CreateProductDto): Promise<Product> {
    const { data } = await apiClient.post<Product>('/products', product);
    return data;
  },

  /**
   * Actualizar producto
   */
  async update(id: string, product: UpdateProductDto): Promise<Product> {
    const { data } = await apiClient.patch<Product>(`/products/${id}`, product);
    return data;
  },

  /**
   * Eliminar producto
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  /**
   * Obtener productos con bajo stock
   */
  async getLowStock(): Promise<Product[]> {
    const { data } = await apiClient.get<Product[]>('/products/low-stock');
    return data;
  },

  /**
   * Buscar productos por término
   */
  async search(term: string): Promise<Product[]> {
    const { data } = await apiClient.get<Product[]>('/products/search', {
      params: { q: term },
    });
    return data;
  },
};
