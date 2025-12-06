/**
 * Tests unitarios para AuthService.
 * 
 * Cobertura de funcionalidades:
 * - Registro de usuarios
 * - Login con validación de credenciales
 * - Autenticación de dos factores (2FA)
 * - Gestión de tokens JWT
 * - Cambio de contraseña
 * 
 * @file auth.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';

// Mock de bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  // Mock de usuario para tests
  const mockUser = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    firstName: 'Test',
    lastName: 'User',
    role: 'STAFF',
    isActive: true,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock de PrismaService
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  // Mock de JwtService
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  // Mock de ConfigService
  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'validPassword123!',
    };

    it('should return access token for valid credentials', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should require 2FA when enabled', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'encrypted-secret',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('requires2FA', true);
      expect(result).toHaveProperty('tempToken');
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'StrongPass123!',
      firstName: 'New',
      lastName: 'User',
    };

    it('should create a new user successfully', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        ...registerDto,
        id: 'new-user-uuid',
      });

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', registerDto.email.toLowerCase());
      expect(result).not.toHaveProperty('passwordHash');
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const dtoWithUppercase = {
        ...registerDto,
        email: 'TEST@EXAMPLE.COM',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        email: 'test@example.com',
      });

      // Act
      await service.register(dtoWithUppercase);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('validateToken', () => {
    it('should return user data for valid token', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue({ sub: mockUser.id });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateToken('valid-token');

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id', mockUser.id);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(service.validateToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('should update password successfully', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
      });

      // Act
      const result = await service.changePassword(mockUser.id, 'oldPassword', 'newPassword123!');

      // Assert
      expect(result).toHaveProperty('message', 'Contraseña actualizada correctamente');
      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword', mockUser.passwordHash);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123!', 12);
    });

    it('should throw BadRequestException when old password is incorrect', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.changePassword(mockUser.id, 'wrongPassword', 'newPassword123!')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
