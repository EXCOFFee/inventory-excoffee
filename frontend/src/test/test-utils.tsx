/**
 * Utilidades de testing para componentes React.
 * 
 * Proporciona wrappers con providers necesarios
 * para renderizar componentes en tests.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Cliente de React Query para tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper con todos los providers necesarios para testing.
 */
const AllTheProviders = ({ children }: WrapperProps) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

/**
 * Render personalizado que incluye providers.
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-exportar todo de testing-library
export * from '@testing-library/react';
export { customRender as render };

// Helpers adicionales
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock de datos para tests
 */
export const mockProducts = [
  {
    id: 'product-1',
    sku: 'PROD-001',
    name: 'Test Product 1',
    description: 'Description 1',
    unitPrice: 99.99,
    costPrice: 50.00,
    currentStock: 100,
    minStock: 10,
    maxStock: 500,
    isActive: true,
    category: { id: 'cat-1', name: 'Electronics' },
    supplier: { id: 'sup-1', name: 'Supplier Inc' },
  },
  {
    id: 'product-2',
    sku: 'PROD-002',
    name: 'Test Product 2',
    description: 'Description 2',
    unitPrice: 149.99,
    costPrice: 75.00,
    currentStock: 5, // Low stock
    minStock: 10,
    maxStock: 200,
    isActive: true,
    category: { id: 'cat-2', name: 'Accessories' },
    supplier: { id: 'sup-1', name: 'Supplier Inc' },
  },
];

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'ADMIN',
};

export const mockCategories = [
  { id: 'cat-1', name: 'Electronics', description: 'Electronic devices', productCount: 10 },
  { id: 'cat-2', name: 'Accessories', description: 'Various accessories', productCount: 25 },
];

export const mockSuppliers = [
  { id: 'sup-1', name: 'Supplier Inc', email: 'contact@supplier.com', phone: '+1234567890' },
  { id: 'sup-2', name: 'Distributor Co', email: 'info@distributor.com', phone: '+0987654321' },
];
