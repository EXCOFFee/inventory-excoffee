/**
 * Servicio de Autenticación de InventoryPro.
 * 
 * Responsabilidad única: Gestionar la autenticación de usuarios.
 * Incluye login, registro, validación de credenciales y generación de JWT.
 * 
 * Implementa RNF03 (Seguridad):
 * - Cifrado de contraseñas con bcrypt (alto costo de CPU)
 * - Tokens JWT con expiración configurable
 * 
 * @class AuthService
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Autentica un usuario y genera un token JWT.
   * 
   * @param loginDto - Credenciales del usuario (email, password)
   * @returns Objeto con access_token y datos del usuario
   * @throws UnauthorizedException si las credenciales son inválidas
   * 
   * Flujo de autenticación:
   * 1. Buscar usuario por email
   * 2. Verificar que el usuario existe y está activo
   * 3. Comparar contraseña con hash almacenado (bcrypt)
   * 4. Generar y firmar token JWT
   * 5. Retornar token y datos básicos del usuario
   * 
   * Por qué bcrypt.compare: Es resistente a timing attacks y
   * realiza la comparación de forma segura contra el hash.
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario por email (case insensitive)
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Validación de existencia - mensaje genérico por seguridad
    // Por qué genérico: No revelar si el email existe o no
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Validación de estado activo
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado. Contacte al administrador.');
    }

    // Validación de contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar token JWT
    const token = this.generateToken(user);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Registra un nuevo usuario en el sistema.
   * 
   * @param registerDto - Datos del nuevo usuario
   * @returns Usuario creado (sin password hash)
   * @throws ConflictException si el email ya existe
   * 
   * Por qué bcrypt con salt rounds 12: Mayor resistencia a
   * ataques de fuerza bruta. 12 rounds = ~2-3 hashes/segundo.
   */
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, role } = registerDto;

    // Verificar que el email no exista
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // Hash de la contraseña con bcrypt
    // Salt rounds: 12 (balance entre seguridad y rendimiento)
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear el usuario
    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role: role || 'STAFF', // Por defecto es Staff
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Genera un token JWT para el usuario.
   * 
   * @param user - Usuario para el cual generar el token
   * @returns Token JWT firmado
   * 
   * Payload del token:
   * - sub: ID del usuario (subject claim estándar JWT)
   * - email: Email para referencia rápida
   * - role: Rol para autorización en el cliente
   * 
   * Por qué no incluir más datos: Mantener el token pequeño
   * y evitar exposición de información sensible.
   */
  private generateToken(user: { id: string; email: string; role: string }): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Valida un token JWT y retorna el payload.
   * Útil para verificación manual de tokens.
   * 
   * @param token - Token JWT a validar
   * @returns Payload decodificado o null si es inválido
   */
  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  /**
   * Cambia la contraseña de un usuario.
   * 
   * @param userId - ID del usuario
   * @param oldPassword - Contraseña actual
   * @param newPassword - Nueva contraseña
   * @throws BadRequestException si la contraseña actual es incorrecta
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Hash de la nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }
}
