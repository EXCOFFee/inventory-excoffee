/**
 * Smoke test de contrato (H-16): los reportes de stock bajo y por categoría deben
 * pegar a las rutas REALES del backend (`/reports/low-stock`, `/reports/by-category`)
 * y mapear el shape crudo al tipo que consume la UI.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  default: { get: vi.fn() },
}));

import apiClient from './client';
import { reportsService } from './reports.service';

const client = apiClient as unknown as { get: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('H-16 · rutas de reportes alineadas al backend', () => {
  it('getStockoutReport → GET /reports/low-stock y aplana {outOfStock, lowStock}', async () => {
    client.get.mockResolvedValueOnce({
      data: {
        summary: { outOfStock: 1, lowStock: 1, healthy: 0 },
        outOfStock: [{ id: 'a', sku: 'A', name: 'Prod A', currentStock: 0, minStock: 5 }],
        lowStock: [{ id: 'b', sku: 'B', name: 'Prod B', currentStock: 2, minStock: 5 }],
      },
    });

    const res = await reportsService.getStockoutReport();

    expect(client.get).toHaveBeenCalledWith('/reports/low-stock');
    expect(res).toHaveLength(2);
    expect(res[0]).toMatchObject({ productId: 'a', sku: 'A', deficit: 5 });
    expect(res[1]).toMatchObject({ productId: 'b', sku: 'B', deficit: 3 });
  });

  it('getCategoryDistribution → GET /reports/by-category y mapea los campos', async () => {
    client.get.mockResolvedValueOnce({
      data: [
        { id: 'c1', name: 'Electrónica', totalProducts: 3, totalStock: 10, totalValue: 100, totalCost: 60, margin: 40 },
      ],
    });

    const res = await reportsService.getCategoryDistribution();

    expect(client.get).toHaveBeenCalledWith('/reports/by-category');
    expect(res[0]).toMatchObject({
      categoryId: 'c1',
      categoryName: 'Electrónica',
      productCount: 3,
      totalStock: 10,
      totalValue: 100,
    });
  });
});
