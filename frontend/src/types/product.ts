/**
 * Tipos para productos
 */

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  imageUrl?: string;
  barcode?: string;
  isActive: boolean;
  category?: Category;
  supplier?: Supplier;
  createdAt: string;
  updatedAt: string;
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
  imageUrl?: string;
  barcode?: string;
  categoryId?: string;
  supplierId?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  isActive?: boolean;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  lowStock?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
