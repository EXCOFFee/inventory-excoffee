/**
 * Módulo de Autenticación de InventoryPro.
 * 
 * Configura todos los componentes necesarios para la autenticación:
 * - JwtModule: Configuración de tokens JWT
 * - PassportModule: Integración con Passport.js
 * - JwtStrategy: Validación de tokens
 * - AuthService: Lógica de autenticación
 * - TwoFactorService: Autenticación de dos factores
 * - AuthController: Endpoints de la API
 * 
 * @module AuthModule
 */

import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    // PassportModule para integración con estrategias de autenticación
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JwtModule configurado con variables de entorno
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        return {
          // Clave secreta para firmar tokens
          secret: configService.get<string>('JWT_SECRET') ?? 'default-dev-secret',
          signOptions: {
            // Tiempo de expiración del token (configurable). El cast es por la firma estricta
            // de expiresIn en @types/jsonwebtoken (StringValue | number) para un string plano.
            expiresIn: (configService.get<string>('JWT_EXPIRATION') ?? '24h') as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TwoFactorService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, TwoFactorService, JwtAuthGuard, JwtModule],
})
export class AuthModule { }
