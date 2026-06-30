/**
 * Tests unitarios para UsersService (CRUD + bordes: 404, email duplicado, soft delete).
 *
 * @file users.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../../common/prisma/prisma.service';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: 'user-1',
    email: 'a@b.com',
    firstName: 'Ana',
    lastName: 'Test',
    role: 'STAFF',
    isActive: true,
    createdAt: new Date(),
  };

  const mockPrismaService = {
    user: {
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
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('devuelve el usuario', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      expect(await service.findOne('user-1')).toEqual(mockUser);
    });

    it('lanza NotFoundException si no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { email: 'NEW@B.com', password: 'StrongPass123!', firstName: 'N', lastName: 'U', role: 'STAFF' as const };

    it('crea el usuario, normaliza el email y hashea la contraseña', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPrismaService.user.create.mockResolvedValue({ ...mockUser, email: 'new@b.com' });

      const result = await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass123!', 12);
      expect(result).not.toHaveProperty('passwordHash');
      // findUnique de chequeo se hace con el email en minúsculas
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: 'new@b.com' } });
      // create persiste el email normalizado
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'new@b.com', passwordHash: 'hashed' }) }),
      );
    });

    it('lanza ConflictException si el email ya existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('lanza ConflictException si el email lo usa otro usuario', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser); // findOne ok
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'otro' });

      await expect(service.update('user-1', { email: 'taken@b.com' })).rejects.toThrow(ConflictException);
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.update('nope', { firstName: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('hace soft delete (isActive: false)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({ id: 'user-1', email: 'a@b.com', isActive: false });

      const result = await service.remove('user-1');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isActive: false },
        select: { id: true, email: true, isActive: true },
      });
    });
  });
});
