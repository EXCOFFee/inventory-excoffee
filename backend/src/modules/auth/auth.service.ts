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
import { LoginDto, RegisterDto, TwoFactorLoginDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { TwoFactorService } from './two-factor.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  /**
   * Paso 1 del login: autentica con email + contraseña.
   *
   * @param loginDto - Credenciales del usuario (email, password)
   * @returns
   *  - Usuario SIN 2FA: `{ access_token, user }` (igual que antes, sin cambios).
   *  - Usuario CON 2FA: `{ requires2FA: true, twoFactorToken }` — NO se emite el JWT de sesión;
   *    el `twoFactorToken` es efímero y solo sirve para el paso 2 (`/auth/2fa/login`).
   * @throws UnauthorizedException si las credenciales son inválidas o el usuario está inactivo
   *
   * Flujo de autenticación:
   * 1. Buscar usuario por email
   * 2. Verificar que el usuario existe y está activo
   * 3. Comparar contraseña con hash almacenado (bcrypt)
   * 4. Si el usuario tiene 2FA habilitado, exigir el segundo factor (ADR-0002)
   * 5. Si no, generar y firmar el token JWT de sesión
   *
   * Por qué bcrypt.compare: Es resistente a timing attacks y
   * realiza la comparación de forma segura contra el hash.
   *
   * Por qué exigir 2FA aquí: el TOTP solo aporta seguridad si el login lo verifica. Antes el
   * segundo factor era decorativo (existía el endpoint de verificación pero login no lo usaba),
   * de modo que un usuario con 2FA activo entraba solo con email + password.
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

    // Si el usuario tiene 2FA habilitado, NO emitir el JWT de sesión todavía: exigir el paso 2.
    if (user.twoFactorEnabled) {
      return {
        requires2FA: true as const,
        twoFactorToken: this.generateTwoFactorToken(user.id),
      };
    }

    // Generar token JWT de sesión
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
   * Paso 2 del login con 2FA: valida el código TOTP y emite el JWT de sesión.
   *
   * @param dto - `{ twoFactorToken, code }` provenientes del paso 1 y de la app autenticadora
   * @returns `{ access_token, user }` si el código es válido
   * @throws UnauthorizedException (401) si el `twoFactorToken` es inválido o expiró
   * @throws BadRequestException (400) si el código TOTP es incorrecto
   *
   * Por qué dos errores distintos: el 401 indica que hay que reiniciar el login (token efímero
   * vencido); el 400 indica que el código es incorrecto pero el flujo sigue vigente. Los
   * mensajes son genéricos para no filtrar cuál de los dos secretos falló.
   */
  async loginTwoFactor(dto: TwoFactorLoginDto) {
    const { twoFactorToken, code } = dto;

    // 1. Verificar el token efímero (firma + expiración) y que sea del tipo correcto.
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(twoFactorToken);
    } catch {
      throw new UnauthorizedException('Sesión de verificación inválida o expirada');
    }

    if (payload.type !== '2fa' || !payload.sub) {
      throw new UnauthorizedException('Sesión de verificación inválida o expirada');
    }

    // 2. Identificar al usuario y validar que siga activo.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Sesión de verificación inválida o expirada');
    }

    // 3. Validar el código TOTP contra el secreto del usuario.
    const isCodeValid = await this.twoFactorService.validate2FALogin(user.id, code);
    if (!isCodeValid) {
      throw new BadRequestException('Código de verificación inválido');
    }

    // 4. Recién ahora emitir el JWT de sesión definitivo.
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
   * Genera el token efímero del paso 1 del login con 2FA.
   *
   * @param userId - ID del usuario que debe completar el segundo factor
   * @returns Token JWT de vida corta con el claim `type: '2fa'`
   *
   * Por qué un token distinto y de vida corta: este token NO es una sesión. Solo identifica al
   * usuario entre el paso 1 y el paso 2 durante una ventana breve (5 min). El claim `type: '2fa'`
   * permite a `JwtStrategy` rechazarlo en endpoints protegidos, de modo que tener este token sin
   * superar el segundo factor no da acceso a nada (ADR-0002).
   */
  private generateTwoFactorToken(userId: string): string {
    const payload: JwtPayload = { sub: userId, type: '2fa' };
    return this.jwtService.sign(payload, { expiresIn: '5m' });
  }

  /**
   * Valida un token JWT de sesión y retorna el usuario actual.
   * Útil para verificación manual de tokens fuera del guard.
   *
   * @param token - Token JWT a validar
   * @returns El usuario correspondiente al token
   * @throws UnauthorizedException si el token es inválido/expiró o el usuario no existe/está inactivo
   *
   * Por qué revalidar contra la DB: el token puede ser válido pero el usuario pudo haber sido
   * desactivado o eliminado; devolvemos el estado actual, igual que `JwtStrategy`.
   */
  async validateToken(token: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no autorizado o inactivo');
    }

    return user;
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
  ): Promise<{ message: string }> {
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

    return { message: 'Contraseña actualizada correctamente' };
  }
}
