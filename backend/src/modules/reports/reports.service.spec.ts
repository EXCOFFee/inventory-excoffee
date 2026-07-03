/**
 * Tests unitarios para ReportsService.
 *
 * Cubre los KPIs del dashboard y los reportes con lógica de cálculo:
 * - getDashboard (conteos, stock bajo, valorización)
 * - getStockValuation (valor/costo/margen)
 * - getLowStockReport (clasificación out/low/healthy)
 *
 * @file reports.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrismaService = {
    product: { count: jest.fn(), findMany: jest.fn() },
    category: { count: jest.fn(), findMany: jest.fn() },
    supplier: { count: jest.fn() },
    movement: { count: jest.fn(), groupBy: jest.fn(), findMany: jest.fn() },
    stockAlert: { count: jest.fn() },
    // getDashboard cuenta el stock bajo con $queryRaw (filtro SQL).
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    it('devuelve el contrato completo que consume el frontend (H-17)', async () => {
      // El orden importa: el servicio dispara las consultas con Promise.all en este orden.
      mockPrismaService.product.count
        .mockResolvedValueOnce(10) // totalProducts
        .mockResolvedValueOnce(2); // outOfStock
      mockPrismaService.$queryRaw.mockResolvedValue([{ count: 3 }]); // stock bajo (SQL)
      mockPrismaService.movement.count
        .mockResolvedValueOnce(7)   // movimientos hoy
        .mockResolvedValueOnce(20); // movimientos mes
      mockPrismaService.stockAlert.count.mockResolvedValue(4); // alertas activas
      mockPrismaService.product.findMany
        // 1ª llamada: valorización → totalUnits=8, totalValue=5*10+3*20=110
        .mockResolvedValueOnce([
          { currentStock: 5, price: 10 },
          { currentStock: 3, price: 20 },
        ])
        // 2ª llamada: detalles del top de productos
        .mockResolvedValueOnce([
          { id: 'p1', sku: 'SKU1', name: 'Prod 1', currentStock: 5 },
        ]);
      mockPrismaService.category.findMany.mockResolvedValue([
        {
          id: 'c1',
          name: 'Cat 1',
          products: [
            { currentStock: 5, price: 10 },
            { currentStock: 3, price: 20 },
          ],
        },
      ]);
      mockPrismaService.movement.groupBy.mockResolvedValue([
        { productId: 'p1', type: 'IN', _sum: { quantity: 30 } },
        { productId: 'p1', type: 'OUT', _sum: { quantity: 10 } },
      ]);
      mockPrismaService.movement.findMany.mockResolvedValue([
        { type: 'IN', quantity: 15, createdAt: new Date() },
        { type: 'OUT', quantity: 5, createdAt: new Date() },
      ]);

      const result = await service.getDashboard();

      expect(result.stockValuation).toEqual({
        totalProducts: 10,
        totalUnits: 8,
        totalValue: 110,
        averageValue: 11,
      });
      expect(result.lowStockCount).toBe(3);
      expect(result.outOfStockCount).toBe(2);
      expect(result.totalMovementsToday).toBe(7);
      expect(result.totalMovementsThisMonth).toBe(20);
      expect(result.recentAlerts).toBe(4);
      expect(result.categoryDistribution).toEqual([
        { categoryId: 'c1', categoryName: 'Cat 1', productCount: 2, totalStock: 8, totalValue: 110 },
      ]);
      expect(result.topProducts).toEqual([
        { productId: 'p1', sku: 'SKU1', name: 'Prod 1', totalIn: 30, totalOut: 10, turnoverRate: 2 },
      ]);
      // Tendencia: 7 días; el último (hoy) agrega los movimientos mockeados.
      expect(result.movementTrend).toHaveLength(7);
      expect(result.movementTrend[6]).toMatchObject({ totalIn: 15, totalOut: 5, netChange: 10 });
    });
  });

  describe('getStockValuation', () => {
    it('calcula valor, costo y margen por producto y el resumen', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: '1', sku: 'A', name: 'A', currentStock: 2, price: 100, cost: 60, category: { name: 'Cat' } },
      ]);

      const result = await service.getStockValuation();

      expect(result.items[0]).toMatchObject({
        totalValue: 200,      // 2*100
        totalCost: 120,       // 2*60
        margin: 40,           // 100-60
        marginPercent: (40 / 60) * 100,
      });
      expect(result.summary).toEqual({
        totalValue: 200,
        totalCost: 120,
        totalItems: 2,
        potentialProfit: 80,
      });
    });
  });

  describe('getLowStockReport', () => {
    it('clasifica productos en sin stock / bajo / saludable', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: '1', sku: 'OUT', name: 'Out', currentStock: 0, minStock: 5, maxStock: 100, category: null, supplier: null },
        { id: '2', sku: 'LOW', name: 'Low', currentStock: 3, minStock: 5, maxStock: 100, category: null, supplier: null },
        { id: '3', sku: 'OK', name: 'Ok', currentStock: 50, minStock: 5, maxStock: 100, category: null, supplier: null },
      ]);

      const result = await service.getLowStockReport();

      expect(result.summary).toEqual({ outOfStock: 1, lowStock: 1, healthy: 1 });
      expect(result.outOfStock).toHaveLength(1);
      expect(result.lowStock).toHaveLength(1);
      expect(result.outOfStock[0].sku).toBe('OUT');
      expect(result.lowStock[0].sku).toBe('LOW');
    });
  });
});
