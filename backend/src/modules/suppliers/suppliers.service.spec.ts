/**
 * Tests unitarios para SuppliersService (CRUD + bordes: 404, soft delete).
 *
 * @file suppliers.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('SuppliersService', () => {
  let service: SuppliersService;

  const mockSupplier = { id: 'sup-1', name: 'Proveedor SA', email: null, isActive: true };

  const mockPrismaService = {
    supplier: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('devuelve el proveedor', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      expect(await service.findOne('sup-1')).toEqual(mockSupplier);
    });

    it('lanza NotFoundException si no existe', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('crea el proveedor', async () => {
      mockPrismaService.supplier.create.mockResolvedValue(mockSupplier);
      const result = await service.create({ name: 'Proveedor SA' });
      expect(result).toEqual(mockSupplier);
      expect(mockPrismaService.supplier.create).toHaveBeenCalledWith({
        data: { name: 'Proveedor SA' },
      });
    });
  });

  describe('update', () => {
    it('actualiza un proveedor existente', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrismaService.supplier.update.mockResolvedValue({ ...mockSupplier, name: 'Nuevo' });

      const result = await service.update('sup-1', { name: 'Nuevo' });

      expect(result.name).toBe('Nuevo');
    });

    it('lanza NotFoundException si el proveedor no existe', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(null);
      await expect(service.update('nope', { name: 'X' })).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.supplier.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('hace soft delete (isActive: false)', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrismaService.supplier.update.mockResolvedValue({ ...mockSupplier, isActive: false });

      const result = await service.remove('sup-1');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: 'sup-1' },
        data: { isActive: false },
      });
    });
  });
});
