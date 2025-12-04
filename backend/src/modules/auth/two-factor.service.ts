/**
 * Servicio de Autenticación de Dos Factores (2FA)
 * Usa TOTP (Time-based One-Time Password)
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Genera un nuevo secreto 2FA para un usuario
   */
  async generateSecret(userId: string, userEmail: string): Promise<TwoFactorSetup> {
    // Generar secreto
    const secret = speakeasy.generateSecret({
      name: `InventoryPro:${userEmail}`,
      issuer: 'InventoryPro',
      length: 32,
    });

    // Guardar secreto temporalmente (sin habilitar aún)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false,
      },
    });

    // Generar QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url || '',
      qrCodeDataUrl,
    };
  }

  /**
   * Habilita 2FA después de verificar el código
   */
  async enable2FA(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });

    if (!user?.twoFactorSecret) {
      throw new BadRequestException('Primero debes generar un secreto 2FA');
    }

    // Verificar token
    const isValid = this.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      throw new BadRequestException('Código inválido');
    }

    // Habilitar 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    this.logger.log(`2FA habilitado para usuario ${userId}`);
    return true;
  }

  /**
   * Deshabilita 2FA
   */
  async disable2FA(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA no está habilitado');
    }

    // Verificar token antes de deshabilitar
    const isValid = this.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      throw new BadRequestException('Código inválido');
    }

    // Deshabilitar 2FA y limpiar secreto
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    this.logger.log(`2FA deshabilitado para usuario ${userId}`);
    return true;
  }

  /**
   * Verifica un token 2FA
   */
  verifyToken(secret: string, token: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1, // Permite 1 intervalo de tolerancia (30 segundos antes/después)
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error verificando token 2FA: ${err.message}`);
      return false;
    }
  }

  /**
   * Verifica si el usuario tiene 2FA habilitado
   */
  async has2FAEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    return user?.twoFactorEnabled || false;
  }

  /**
   * Valida el token 2FA de un usuario durante el login
   */
  async validate2FALogin(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      // Si no tiene 2FA, considerarlo como válido (no requiere)
      return true;
    }

    return this.verifyToken(user.twoFactorSecret, token);
  }
}
