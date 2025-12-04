/**
 * Controlador de Autenticación de InventoryPro.
 * 
 * Expone los endpoints para autenticación de usuarios:
 * - POST /api/auth/login - Iniciar sesión
 * - POST /api/auth/register - Registrar nuevo usuario (Admin only)
 * - GET /api/auth/profile - Obtener perfil del usuario actual
 * - POST /api/auth/change-password - Cambiar contraseña
 * - POST /api/auth/2fa/generate - Generar secreto 2FA
 * - POST /api/auth/2fa/enable - Habilitar 2FA
 * - POST /api/auth/2fa/disable - Deshabilitar 2FA
 * - POST /api/auth/2fa/verify - Verificar código 2FA
 * 
 * Implementa RF01 (Login) del SRS.
 * 
 * @class AuthController
 */

import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  /**
   * Endpoint de login.
   * Autentica al usuario y retorna un token JWT.
   * 
   * @param loginDto - Credenciales (email, password)
   * @returns Token JWT y datos del usuario
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario y retorna un token JWT válido por 24 horas.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          email: 'admin@inventorypro.com',
          firstName: 'Admin',
          lastName: 'Principal',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Endpoint de registro de usuarios.
   * Solo accesible por administradores.
   * 
   * @param registerDto - Datos del nuevo usuario
   * @returns Usuario creado
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('register')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea un nuevo usuario en el sistema. Solo administradores.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (requiere rol ADMIN)' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Endpoint para obtener el perfil del usuario actual.
   * 
   * @param user - Usuario autenticado (inyectado por el decorador)
   * @returns Datos del perfil
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener perfil actual',
    description: 'Retorna los datos del usuario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  /**
   * Endpoint para cambiar la contraseña.
   * 
   * @param user - Usuario autenticado
   * @param body - Contraseña actual y nueva
   * @returns Mensaje de confirmación
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cambiar contraseña',
    description: 'Permite al usuario cambiar su contraseña actual.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPassword: { type: 'string', example: 'CurrentPass123!' },
        newPassword: { type: 'string', example: 'NewPass456!' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    await this.authService.changePassword(
      userId,
      body.oldPassword,
      body.newPassword,
    );
    return { message: 'Contraseña actualizada correctamente' };
  }

  // ============================================
  // ENDPOINTS 2FA
  // ============================================

  /**
   * Genera un secreto 2FA para el usuario actual.
   * Retorna el QR code para escanear con una app autenticador.
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generar secreto 2FA',
    description: 'Genera un nuevo secreto TOTP y retorna el QR code.',
  })
  @ApiResponse({ status: 200, description: 'Secreto generado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async generate2FA(@CurrentUser() user: any) {
    return this.twoFactorService.generateSecret(user.id, user.email);
  }

  /**
   * Habilita 2FA después de verificar el código.
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Habilitar 2FA',
    description: 'Habilita la autenticación de dos factores.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: '123456' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '2FA habilitado' })
  @ApiResponse({ status: 400, description: 'Código inválido' })
  async enable2FA(
    @CurrentUser('id') userId: string,
    @Body('token') token: string,
  ) {
    await this.twoFactorService.enable2FA(userId, token);
    return { message: '2FA habilitado correctamente' };
  }

  /**
   * Deshabilita 2FA después de verificar el código.
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Deshabilitar 2FA',
    description: 'Deshabilita la autenticación de dos factores.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: '123456' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '2FA deshabilitado' })
  @ApiResponse({ status: 400, description: 'Código inválido' })
  async disable2FA(
    @CurrentUser('id') userId: string,
    @Body('token') token: string,
  ) {
    await this.twoFactorService.disable2FA(userId, token);
    return { message: '2FA deshabilitado correctamente' };
  }

  /**
   * Verifica si el usuario tiene 2FA habilitado.
   */
  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Estado de 2FA',
    description: 'Verifica si el usuario tiene 2FA habilitado.',
  })
  @ApiResponse({ status: 200, description: 'Estado de 2FA' })
  async get2FAStatus(@CurrentUser('id') userId: string) {
    const enabled = await this.twoFactorService.has2FAEnabled(userId);
    return { twoFactorEnabled: enabled };
  }
}
