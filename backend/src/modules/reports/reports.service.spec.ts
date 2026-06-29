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
    it('calcula los KPIs (conteos, stock bajo y valorización) correctamente', async () => {
      // El orden importa: el servicio dispara las consultas con Promise.all en este orden.
      mockPrismaService.product.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(2); // outOfStock
      mockPrismaService.product.findMany
        // lowStock select: solo {5,10} es bajo (>0 && <=min); {50,10} no
        .mockResolvedValueOnce([
          { currentStock: 5, minStock: 10 },
          { currentStock: 50, minStock: 10 },
        ])
        // valuation select
        .mockResolvedValueOnce([
          { currentStock: 5, price: 100, cost: 60 },
          { currentStock: 50, price: 10, cost: 5 },
        ]);
      mockPrismaService.category.count.mockResolvedValue(3);
      mockPrismaService.supplier.count.mockResolvedValue(4);
      mockPrismaService.movement.count
        .mockResolvedValueOnce(7)  // hoy
        .mockResolvedValueOnce(20); // mes

      const result = await service.getDashboard();

      expect(result.products).toEqual({ total: 10, active: 8, lowStock: 1, outOfStock: 2 });
      // value = 5*100 + 50*10 = 1000 ; cost = 5*60 + 50*5 = 550 ; profit = 450
      expect(result.inventory).toEqual({ totalValue: 1000, totalCost: 550, potentialProfit: 450 });
      expect(result.entities).toEqual({ categories: 3, suppliers: 4 });
      expect(result.movements).toEqual({ today: 7, thisMonth: 20 });
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
