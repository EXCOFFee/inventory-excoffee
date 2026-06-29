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
import { TwoFactorService } from './two-factor.service';

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

  // Mock de TwoFactorService (validación del código TOTP en el paso 2)
  const mockTwoFactorService = {
    validate2FALogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TwoFactorService, useValue: mockTwoFactorService },
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

      // Assert (contrato: snake_case access_token, ADR-0007)
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect((result as any).user.email).toBe(mockUser.email);
      expect((result as any).user).not.toHaveProperty('passwordHash');
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
      mockJwtService.sign.mockReturnValue('ephemeral-2fa-token');

      // Act
      const result = await service.login(loginDto);

      // Assert (contrato: requires2FA + twoFactorToken, sin access_token; ADR-0002)
      expect(result).toHaveProperty('requires2FA', true);
      expect(result).toHaveProperty('twoFactorToken');
      expect(result).not.toHaveProperty('access_token');
    });
  });

  describe('loginTwoFactor', () => {
    const loginDto = {
      twoFactorToken: 'ephemeral-2fa-token',
      code: '123456',
    };

    it('should return access_token when the TOTP code is valid', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue({ sub: mockUser.id, type: '2fa' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'encrypted-secret',
      });
      mockTwoFactorService.validate2FALogin.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('session-jwt-token');

      // Act
      const result = await service.loginTwoFactor(loginDto);

      // Assert
      expect(result).toHaveProperty('access_token', 'session-jwt-token');
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should throw BadRequestException when the TOTP code is invalid', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue({ sub: mockUser.id, type: '2fa' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'encrypted-secret',
      });
      mockTwoFactorService.validate2FALogin.mockResolvedValue(false);

      // Act & Assert
      await expect(service.loginTwoFactor(loginDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException when the twoFactorToken is invalid/expired', async () => {
      // Arrange
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      // Act & Assert
      await expect(service.loginTwoFactor(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when the token is not a 2fa token', async () => {
      // Arrange: un token de sesión normal (sin type: '2fa') no debe servir para el paso 2.
      mockJwtService.verify.mockReturnValue({ sub: mockUser.id, role: 'ADMIN' });

      // Act & Assert
      await expect(service.loginTwoFactor(loginDto)).rejects.toThrow(UnauthorizedException);
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
      // El servicio usa `select` para NO devolver passwordHash: el mock refleja esa proyección.
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user-uuid',
        email: registerDto.email.toLowerCase(),
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: 'STAFF',
        isActive: true,
        createdAt: new Date(),
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
