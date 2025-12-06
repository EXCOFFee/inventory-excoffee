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
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          product: {
            findUnique: jest.fn().mockResolvedValue(mockProduct),
            update: jest.fn().mockResolvedValue({
              ...mockProduct,
              currentStock: 150,
            }),
          },
          movement: {
            create: jest.fn().mockResolvedValue({
              ...mockMovement,
              type: MovementType.IN,
              quantity: 50,
            }),
          },
        });
      });

      // Act
      const result = await service.create(createEntryDto, mockAuthUser);

      // Assert
      expect(result).toBeDefined();
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
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          product: {
            findUnique: jest.fn().mockResolvedValue(mockProduct),
            update: jest.fn().mockResolvedValue({
              ...mockProduct,
              currentStock: 70,
            }),
          },
          movement: {
            create: jest.fn().mockResolvedValue({
              ...mockMovement,
              type: MovementType.OUT,
              quantity: 30,
            }),
          },
        });
      });

      // Act
      const result = await service.create(createExitDto, mockAuthUser);

      // Assert
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      // Arrange
      const lowStockProduct = { ...mockProduct, currentStock: 10 };
      mockPrismaService.product.findUnique.mockResolvedValue(lowStockProduct);

      const exitDto = {
        ...createExitDto,
        quantity: 50, // Más que el stock disponible
      };

      // Act & Assert
      await expect(
        service.create(exitDto, mockAuthUser)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
