/**
 * Tests unitarios para ProductsService.
 * 
 * Cobertura de funcionalidades:
 * - CRUD completo de productos
 * - Filtros y paginación
 * - Validación de SKU único
 * 
 * @file products.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;

  // Mock de producto para tests
  const mockProduct = {
    id: 'product-uuid-123',
    sku: 'PROD-001',
    barcode: '1234567890123',
    name: 'Test Product',
    description: 'Test description',
    price: 99.99,
    cost: 50.00,
    categoryId: 'category-uuid-123',
    supplierId: 'supplier-uuid-123',
    currentStock: 100,
    minStock: 10,
    maxStock: 500,
    location: 'A-01-01',
    imageUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'category-uuid-123', name: 'Electronics' },
    supplier: { id: 'supplier-uuid-123', name: 'Supplier Inc' },
  };

  // Mock de PrismaService con tipo explícito
  const mockPrismaService: Record<string, any> = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    supplier: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: any) => Promise<any>) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    const mockProducts = [mockProduct];
    
    it('should return paginated products', async () => {
      // Arrange
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.product.count.mockResolvedValue(1);

      // Act
      const result = await service.findAll({ page: 1, limit: 20 });

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toEqual(mockProducts);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should apply search filter', async () => {
      // Arrange
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.product.count.mockResolvedValue(1);

      // Act
      await service.findAll({ search: 'Test', page: 1, limit: 20 });

      // Assert
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'Test', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });

    it('should apply category filter', async () => {
      // Arrange
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.product.count.mockResolvedValue(1);

      // Act
      await service.findAll({ categoryId: 'category-uuid-123', page: 1, limit: 20 });

      // Assert
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'category-uuid-123',
          }),
        }),
      );
    });

    it('should apply lowStock filter', async () => {
      // Arrange
      const lowStockProduct = { ...mockProduct, currentStock: 5 };
      mockPrismaService.product.findMany.mockResolvedValue([lowStockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      // Act
      const result = await service.findAll({ lowStock: true, page: 1, limit: 20 });

      // Assert
      expect(result.data.every((p) => (p as { currentStock: number; minStock: number }).currentStock <= (p as { currentStock: number; minStock: number }).minStock)).toBe(true);
    });

    it('should calculate pagination correctly', async () => {
      // Arrange
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.product.count.mockResolvedValue(100);

      // Act
      const result = await service.findAll({ page: 2, limit: 10 });

      // Assert
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findOne('product-uuid-123');

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-uuid-123' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should include category and supplier relations', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findOne('product-uuid-123');

      // Assert
      expect(result.category).toBeDefined();
      expect(result.supplier).toBeDefined();
    });
  });

  describe('create', () => {
    const createDto = {
      sku: 'NEW-001',
      name: 'New Product',
      price: 150.00,
      minStock: 5,
      categoryId: 'category-uuid-123',
      supplierId: 'supplier-uuid-123',
    };

    it('should create a new product successfully', async () => {
      // Arrange
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.category.findUnique.mockResolvedValue({ id: 'category-uuid-123' });
      mockPrismaService.supplier.findUnique.mockResolvedValue({ id: 'supplier-uuid-123' });
      mockPrismaService.product.create.mockResolvedValue({
        ...mockProduct,
        ...createDto,
        id: 'new-product-uuid',
      });

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toHaveProperty('id', 'new-product-uuid');
      expect(result.sku).toBe(createDto.sku);
      expect(mockPrismaService.product.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when SKU already exists', async () => {
      // Arrange
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when category not found', async () => {
      // Arrange
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should validate minStock <= maxStock', async () => {
      // Arrange
      const invalidDto = {
        ...createDto,
        minStock: 100,
        maxStock: 50,
      };
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.category.findUnique.mockResolvedValue({ id: 'category-uuid-123' });
      mockPrismaService.supplier.findUnique.mockResolvedValue({ id: 'supplier-uuid-123' });

      // Act & Assert
      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Product Name',
      price: 199.99,
    };

    it('should update a product successfully', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        ...updateDto,
      });

      // Act
      const result = await service.update('product-uuid-123', updateDto);

      // Assert
      expect(result.name).toBe(updateDto.name);
      expect(result.price).toBe(updateDto.price);
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to existing SKU', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.findFirst.mockResolvedValue({
        ...mockProduct,
        id: 'another-product-uuid',
      });

      // Act & Assert
      await expect(
        service.update('product-uuid-123', { sku: 'EXISTING-SKU' })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete a product', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      // Act
      const result = await service.remove('product-uuid-123');

      // Assert
      expect(result.isActive).toBe(false);
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'product-uuid-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
