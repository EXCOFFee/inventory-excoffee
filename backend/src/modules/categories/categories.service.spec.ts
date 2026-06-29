/**
 * Tests unitarios para CategoriesService (CRUD + bordes: 404, duplicados, soft delete).
 *
 * @file categories.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockCategory = { id: 'cat-1', name: 'Electrónica', description: null, isActive: true };

  const mockPrismaService = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('devuelve la categoría', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      expect(await service.findOne('cat-1')).toEqual(mockCategory);
    });

    it('lanza NotFoundException si no existe', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('crea la categoría cuando el nombre es único', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      const result = await service.create({ name: 'Electrónica' });

      expect(result).toEqual(mockCategory);
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: { name: 'Electrónica', description: undefined },
      });
    });

    it('lanza ConflictException si el nombre ya existe', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      await expect(service.create({ name: 'Electrónica' })).rejects.toThrow(ConflictException);
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('lanza ConflictException si el nuevo nombre lo usa otra categoría', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory); // findOne ok
      mockPrismaService.category.findFirst.mockResolvedValue({ id: 'otra', name: 'Ropa' });

      await expect(service.update('cat-1', { name: 'Ropa' })).rejects.toThrow(ConflictException);
    });

    it('lanza NotFoundException si la categoría no existe', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      await expect(service.update('nope', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('hace soft delete (isActive: false)', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.update.mockResolvedValue({ ...mockCategory, isActive: false });

      const result = await service.remove('cat-1');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { isActive: false },
      });
    });
  });
});
