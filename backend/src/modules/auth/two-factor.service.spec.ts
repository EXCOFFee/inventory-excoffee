/**
 * Tests unitarios para TwoFactorService.
 *
 * Cubre la lógica de seguridad del segundo factor (TOTP), tocada por P0-2:
 * - Generación del secreto + QR
 * - Habilitar / deshabilitar con verificación de código
 * - Verificación de token y validación durante el login
 *
 * @file two-factor.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { PrismaService } from '../../common/prisma/prisma.service';

// Mock de las librerías TOTP/QR (no queremos criptografía real ni generar imágenes en tests).
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(),
  totp: { verify: jest.fn() },
}));
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

describe('TwoFactorService', () => {
  let service: TwoFactorService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSecret', () => {
    it('genera el secreto, lo guarda (sin habilitar) y devuelve el QR', async () => {
      (speakeasy.generateSecret as jest.Mock).mockReturnValue({
        base32: 'BASE32SECRET',
        otpauth_url: 'otpauth://totp/InventoryPro:test@test.com?secret=BASE32SECRET',
      });
      (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,QR');
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.generateSecret('user-1', 'test@test.com');

      expect(result).toEqual({
        secret: 'BASE32SECRET',
        otpauthUrl: 'otpauth://totp/InventoryPro:test@test.com?secret=BASE32SECRET',
        qrCodeDataUrl: 'data:image/png;base64,QR',
      });
      // El secreto se persiste pero el 2FA queda DESHABILITADO hasta confirmar un código.
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { twoFactorSecret: 'BASE32SECRET', twoFactorEnabled: false },
      });
    });
  });

  describe('enable2FA', () => {
    it('habilita 2FA cuando el código es válido', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ twoFactorSecret: 'BASE32SECRET' });
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.enable2FA('user-1', '123456');

      expect(result).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { twoFactorEnabled: true },
      });
    });

    it('lanza BadRequest si no hay secreto generado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ twoFactorSecret: null });

      await expect(service.enable2FA('user-1', '123456')).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('lanza BadRequest si el código es inválido', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ twoFactorSecret: 'BASE32SECRET' });
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      await expect(service.enable2FA('user-1', '000000')).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('disable2FA', () => {
    it('deshabilita 2FA y limpia el secreto con código válido', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        twoFactorSecret: 'BASE32SECRET',
        twoFactorEnabled: true,
      });
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.disable2FA('user-1', '123456');

      expect(result).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      });
    });

    it('lanza BadRequest si 2FA no está habilitado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        twoFactorSecret: null,
        twoFactorEnabled: false,
      });

      await expect(service.disable2FA('user-1', '123456')).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequest si el código es inválido', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        twoFactorSecret: 'BASE32SECRET',
        twoFactorEnabled: true,
      });
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      await expect(service.disable2FA('user-1', '000000')).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('devuelve true cuando speakeasy valida el token', () => {
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      expect(service.verifyToken('BASE32SECRET', '123456')).toBe(true);
    });

    it('devuelve false cuando speakeasy lo rechaza', () => {
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
      expect(service.verifyToken('BASE32SECRET', '000000')).toBe(false);
    });

    it('devuelve false (no propaga) si speakeasy lanza una excepción', () => {
      (speakeasy.totp.verify as jest.Mock).mockImplementation(() => {
        throw new Error('boom');
      });
      expect(service.verifyToken('BASE32SECRET', '123456')).toBe(false);
    });
  });

  describe('has2FAEnabled', () => {
    it('devuelve true si el usuario tiene 2FA habilitado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ twoFactorEnabled: true });
      expect(await service.has2FAEnabled('user-1')).toBe(true);
    });

    it('devuelve false si no lo tiene (o no existe)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      expect(await service.has2FAEnabled('user-1')).toBe(false);
    });
  });

  describe('validate2FALogin', () => {
    it('devuelve true si el usuario NO tiene 2FA (no se exige)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        twoFactorSecret: null,
        twoFactorEnabled: false,
      });
      expect(await service.validate2FALogin('user-1', '123456')).toBe(true);
    });

    it('valida el TOTP cuando el usuario tiene 2FA habilitado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        twoFactorSecret: 'BASE32SECRET',
        twoFactorEnabled: true,
      });
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      expect(await service.validate2FALogin('user-1', '123456')).toBe(true);

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
      expect(await service.validate2FALogin('user-1', '000000')).toBe(false);
    });
  });
});
