/**
 * Servicio de categorías
 */

import apiClient from './client';
import { Category } from '../types';

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export const categoriesService = {
  /**
   * Obtener todas las categorías
   */
  async getAll(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>('/categories');
    return data;
  },

  /**
   * Obtener una categoría por ID
   */
  async getById(id: string): Promise<Category> {
    const { data } = await apiClient.get<Category>(`/categories/${id}`);
    return data;
  },

  /**
   * Crear nueva categoría
   */
  async create(category: CreateCategoryDto): Promise<Category> {
    const { data } = await apiClient.post<Category>('/categories', category);
    return data;
  },

  /**
   * Actualizar categoría
   */
  async update(id: string, category: UpdateCategoryDto): Promise<Category> {
    // El backend expone @Put(':id') para el update (ver H-15); debe ser PUT, no PATCH.
    const { data } = await apiClient.put<Category>(`/categories/${id}`, category);
    return data;
  },

  /**
   * Eliminar categoría
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};
