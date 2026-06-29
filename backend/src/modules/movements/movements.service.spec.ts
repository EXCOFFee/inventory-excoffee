/**
 * Tests unitarios para MovementsService.
 * 
 * Cobertura de funcionalidades:
 * - Creación de movimientos (entrada/salida)
 * - Actualización automática de stock
 * - Trazabilidad de movimientos
 * - Validaciones de stock
 * 
 * @file movements.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MovementType } from '@prisma/client';
import { MovementsService } from './movements.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('MovementsService', () => {
  let service: MovementsService;
  let prismaService: PrismaService;

  // Mock de producto
  const mockProduct = {
    id: 'product-uuid-123',
    sku: 'PROD-001',
    name: 'Test Product',
    currentStock: 100,
    minStock: 10,
    maxStock: 500,
    isActive: true,
  };

  // Mock de movimiento
  const mockMovement = {
    id: 'movement-uuid-123',
    productId: 'product-uuid-123',
    type: MovementType.IN,
    quantity: 50,
    reason: 'PURCHASE',
    notes: 'Test movement',
    userId: 'user-uuid-123',
    createdAt: new Date(),
    product: mockProduct,
    user: { id: 'user-uuid-123', firstName: 'Test', lastName: 'User' },
  };

  // Mock de PrismaService
  const mockPrismaService = {
    movement: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MovementsService>(MovementsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated movements', async () => {
      // Arrange
      mockPrismaService.movement.findMany.mockResolvedValue([mockMovement]);
      mockPrismaService.movement.count.mockResolvedValue(1);

      // Act
      const result = await service.findAll({ page: 1, limit: 20 });

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by movement type', async () => {
      // Arrange
      mockPrismaService.movement.findMany.mockResolvedValue([mockMovement]);
      mockPrismaService.movement.count.mockResolvedValue(1);

      // Act
      await service.findAll({ type: MovementType.IN, page: 1, limit: 20 });

      // Assert
      expect(mockPrismaService.movement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: MovementType.IN }),
        }),
      );
    });

    it('should filter by product ID', async () => {
      // Arrange
      mockPrismaService.movement.findMany.mockResolvedValue([mockMovement]);
      mockPrismaService.movement.count.mockResolvedValue(1);

      // Act
      await service.findAll({ productId: 'product-uuid-123', page: 1, limit: 20 });

      // Assert
      expect(mockPrismaService.movement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productId: 'product-uuid-123' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      // Arrange
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      mockPrismaService.movement.findMany.mockResolvedValue([mockMovement]);
      mockPrismaService.movement.count.mockResolvedValue(1);

      // Act
      await service.findAll({ startDate, endDate, page: 1, limit: 20 });

      // Assert
      expect(mockPrismaService.movement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a movement by ID', async () => {
      // Arrange
      mockPrismaService.movement.findUnique.mockResolvedValue(mockMovement);

      // Act
      const result = await service.findOne('movement-uuid-123');

      // Assert
      expect(result).toEqual(mockMovement);
    });

    it('should throw NotFoundException when movement not found', async () => {
      // Arrange
      mockPrismaService.movement.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create (IN)', () => {
    const mockAuthUser = { id: 'user-uuid-123', email: 'test@test.com', role: 'ADMIN' };
    
    const createEntryDto = {
      productId: 'product-uuid-123',
      type: MovementType.IN,
      quantity: 50,
      reason: 'PURCHASE',
      notes: 'New stock arrival',
    };

    it('should create entry movement and increase stock', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      const txUpdate = jest.fn().mockResolvedValue({ currentStock: 150 });
      const txCreate = jest.fn().mockResolvedValue({
        ...mockMovement,
        type: MovementType.IN,
        quantity: 50,
        stockBefore: 100,
        stockAfter: 150,
      });
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          product: { update: txUpdate, updateMany: jest.fn(), findUnique: jest.fn() },
          movement: { create: txCreate },
        });
      });

      // Act
      const result = await service.create(createEntryDto, mockAuthUser);

      // Assert
      expect(result).toBeDefined();
      // IN usa incremento atómico (no read-modify-write).
      expect(txUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-uuid-123' },
          data: { currentStock: { increment: 50 } },
        }),
      );
      // stockAfter se deriva del valor persistido (150).
      expect(result.product.currentStock).toBe(150);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.create(createEntryDto, mockAuthUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when product is inactive', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      // Act & Assert
      await expect(
        service.create(createEntryDto, mockAuthUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create (OUT)', () => {
    const mockAuthUser = { id: 'user-uuid-123', email: 'test@test.com', role: 'ADMIN' };
    
    const createExitDto = {
      productId: 'product-uuid-123',
      type: MovementType.OUT,
      quantity: 30,
      reason: 'SALE',
      notes: 'Sale order #12345',
    };

    it('should create exit movement and decrease stock', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      // Decremento condicional atómico: count === 1 (hubo stock suficiente).
      const txUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      // Relectura del valor persistido tras el decremento (100 - 30 = 70).
      const txFindUnique = jest.fn().mockResolvedValue({ currentStock: 70 });
      const txCreate = jest.fn().mockResolvedValue({
        ...mockMovement,
        type: MovementType.OUT,
        quantity: 30,
        stockBefore: 100,
        stockAfter: 70,
      });
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          product: { updateMany: txUpdateMany, findUnique: txFindUnique, update: jest.fn() },
          movement: { create: txCreate },
        });
      });

      // Act
      const result = await service.create(createExitDto, mockAuthUser);

      // Assert
      expect(result).toBeDefined();
      // OUT usa updateMany condicional (gte) en vez de un update directo.
      expect(txUpdateMany).toHaveBeenCalledWith({
        where: { id: 'product-uuid-123', currentStock: { gte: 30 } },
        data: { currentStock: { decrement: 30 } },
      });
      // stockAfter se deriva del valor realmente persistido (70).
      expect(result.product.currentStock).toBe(70);
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      // Arrange
      const lowStockProduct = { ...mockProduct, currentStock: 10 };
      mockPrismaService.product.findUnique.mockResolvedValue(lowStockProduct);
      // El decremento condicional no afecta filas (count === 0) → stock insuficiente.
      const txUpdateMany = jest.fn().mockResolvedValue({ count: 0 });
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          product: { updateMany: txUpdateMany, findUnique: jest.fn(), update: jest.fn() },
          movement: { create: jest.fn() },
        });
      });

      const exitDto = {
        ...createExitDto,
        quantity: 50, // Más que el stock disponible
      };

      // Act & Assert
      await expect(
        service.create(exitDto, mockAuthUser)
      ).rejects.toThrow(BadRequestException);
    });

    /**
     * Test de concurrencia (ADR-0001): dos salidas simultáneas sobre el mismo producto con
     * stock para solo una. El decremento condicional atómico garantiza que exactamente una
     * tenga éxito y la otra sea rechazada con 400, sin que el stock quede negativo.
     *
     * Se simula a nivel de mock: el `updateMany` afecta count=1 la primera vez (gana la carrera)
     * y count=0 la segunda (la DB ya dejó el stock por debajo de `quantity`).
     */
    it('should let only one of two concurrent OUT movements succeed', async () => {
      // Producto con stock 5; cada salida pide 5 → solo una puede tener éxito.
      const product = { ...mockProduct, currentStock: 5 };
      mockPrismaService.product.findUnique.mockResolvedValue(product);

      // Estado de stock compartido que la "DB" decrementa atómicamente.
      let dbStock = 5;
      const exitDto = { ...createExitDto, quantity: 5 };

      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          product: {
            updateMany: jest.fn().mockImplementation(async ({ where, data }: any) => {
              // Emula `WHERE currentStock >= quantity ... SET currentStock -= quantity`.
              const required = where.currentStock.gte;
              const dec = data.currentStock.decrement;
              if (dbStock >= required) {
                dbStock -= dec;
                return { count: 1 };
              }
              return { count: 0 };
            }),
            findUnique: jest.fn().mockImplementation(async () => ({ currentStock: dbStock })),
            update: jest.fn(),
          },
          movement: {
            create: jest.fn().mockImplementation(async ({ data }: any) => ({
              ...mockMovement,
              type: MovementType.OUT,
              quantity: data.quantity,
              stockBefore: data.stockBefore,
              stockAfter: data.stockAfter,
            })),
          },
        });
      });

      // Act: lanzar ambas en paralelo.
      const results = await Promise.allSettled([
        service.create(exitDto, mockAuthUser),
        service.create(exitDto, mockAuthUser),
      ]);

      // Assert: exactamente una OK, una rechazada con BadRequestException, stock final no negativo.
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(BadRequestException);
      expect(dbStock).toBe(0);
      expect(dbStock).toBeGreaterThanOrEqual(0);
    });
  });
});
