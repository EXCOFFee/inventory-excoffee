/**
 * Tests unitarios para AlertsService.
 *
 * Cubre la lógica de alertas de stock bajo (RF04), tocada por H-06/P2-QUERY:
 * - Generación de alertas por el chequeo periódico
 * - Idempotencia (no duplicar alertas activas)
 * - Reconocimiento de alertas
 *
 * @file alerts.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AlertsService', () => {
  let service: AlertsService;

  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
    },
    stockAlert: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkLowStock', () => {
    it('crea una alerta solo para los productos con stock bajo y sin alerta activa', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: '1', sku: 'A', name: 'Bajo', currentStock: 5, minStock: 10 },   // bajo
        { id: '2', sku: 'B', name: 'OK', currentStock: 50, minStock: 10 },     // no bajo
      ]);
      mockPrismaService.stockAlert.findFirst.mockResolvedValue(null); // no hay alerta previa
      mockPrismaService.stockAlert.create.mockResolvedValue({});

      await service.checkLowStock();

      expect(mockPrismaService.stockAlert.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.stockAlert.create).toHaveBeenCalledWith({
        data: { productSku: 'A', productName: 'Bajo', currentStock: 5, minStock: 10 },
      });
    });

    it('no duplica una alerta si ya existe una sin reconocer (idempotencia)', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: '1', sku: 'A', name: 'Bajo', currentStock: 5, minStock: 10 },
      ]);
      mockPrismaService.stockAlert.findFirst.mockResolvedValue({ id: 'alert-1' }); // ya existe

      await service.checkLowStock();

      expect(mockPrismaService.stockAlert.create).not.toHaveBeenCalled();
    });

    it('no crea alertas si no hay productos con stock bajo', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: '2', sku: 'B', name: 'OK', currentStock: 50, minStock: 10 },
      ]);

      await service.checkLowStock();

      expect(mockPrismaService.stockAlert.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.stockAlert.create).not.toHaveBeenCalled();
    });
  });

  describe('acknowledgeAlert', () => {
    it('marca la alerta como reconocida con timestamp', async () => {
      mockPrismaService.stockAlert.update.mockResolvedValue({ id: 'a1', acknowledged: true });

      await service.acknowledgeAlert('a1');

      expect(mockPrismaService.stockAlert.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { acknowledged: true, acknowledgedAt: expect.any(Date) },
      });
    });
  });

  describe('acknowledgeAll', () => {
    it('reconoce todas las activas y devuelve el conteo', async () => {
      mockPrismaService.stockAlert.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.acknowledgeAll();

      expect(result).toEqual({ message: '3 alertas marcadas como reconocidas', count: 3 });
      expect(mockPrismaService.stockAlert.updateMany).toHaveBeenCalledWith({
        where: { acknowledged: false },
        data: { acknowledged: true, acknowledgedAt: expect.any(Date) },
      });
    });
  });

  describe('getActiveCount', () => {
    it('devuelve el número de alertas activas', async () => {
      mockPrismaService.stockAlert.count.mockResolvedValue(5);

      const result = await service.getActiveCount();

      expect(result).toEqual({ activeAlerts: 5 });
      expect(mockPrismaService.stockAlert.count).toHaveBeenCalledWith({
        where: { acknowledged: false },
      });
    });
  });
});
