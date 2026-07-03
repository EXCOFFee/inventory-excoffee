/**
 * Servicio de proveedores
 */

import apiClient from './client';
import { Supplier } from '../types';

export interface CreateSupplierDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}

export const suppliersService = {
  /**
   * Obtener todos los proveedores
   */
  async getAll(): Promise<Supplier[]> {
    const { data } = await apiClient.get<Supplier[]>('/suppliers');
    return data;
  },

  /**
   * Obtener un proveedor por ID
   */
  async getById(id: string): Promise<Supplier> {
    const { data } = await apiClient.get<Supplier>(`/suppliers/${id}`);
    return data;
  },

  /**
   * Crear nuevo proveedor
   */
  async create(supplier: CreateSupplierDto): Promise<Supplier> {
    const { data } = await apiClient.post<Supplier>('/suppliers', supplier);
    return data;
  },

  /**
   * Actualizar proveedor
   */
  async update(id: string, supplier: UpdateSupplierDto): Promise<Supplier> {
    // El backend expone @Put(':id') para el update (ver H-15); debe ser PUT, no PATCH.
    const { data } = await apiClient.put<Supplier>(`/suppliers/${id}`, supplier);
    return data;
  },

  /**
   * Eliminar proveedor
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/suppliers/${id}`);
  },
};
