/**
 * Smoke test de contrato (H-15): el update de cada entidad debe pegar con **PUT**
 * a la ruta real del backend (`@Put(':id')`), no con PATCH.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock del cliente HTTP: cada verbo devuelve { data: {} }.
vi.mock('./client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import apiClient from './client';
import { categoriesService } from './categories.service';
import { productsService } from './products.service';
import { suppliersService } from './suppliers.service';
import { usersService } from './users.service';

const client = apiClient as unknown as {
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('H-15 · update usa PUT contra @Put(:id) del backend', () => {
  it('categoriesService.update → PUT /categories/:id', async () => {
    await categoriesService.update('c1', {});
    expect(client.put).toHaveBeenCalledWith('/categories/c1', {});
    expect(client.patch).not.toHaveBeenCalled();
  });

  it('productsService.update → PUT /products/:id', async () => {
    await productsService.update('p1', {});
    expect(client.put).toHaveBeenCalledWith('/products/p1', {});
    expect(client.patch).not.toHaveBeenCalled();
  });

  it('suppliersService.update → PUT /suppliers/:id', async () => {
    await suppliersService.update('s1', {});
    expect(client.put).toHaveBeenCalledWith('/suppliers/s1', {});
    expect(client.patch).not.toHaveBeenCalled();
  });

  it('usersService.update → PUT /users/:id', async () => {
    await usersService.update('u1', {});
    expect(client.put).toHaveBeenCalledWith('/users/u1', {});
    expect(client.patch).not.toHaveBeenCalled();
  });
});
