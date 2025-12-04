/**
 * Estrategia JWT para Passport.js
 * 
 * Esta estrategia valida tokens JWT en cada request protegido.
 * Extrae el payload del token y busca el usuario en la base de datos.
 * 
 * Por qué JWT: Según el SRS (Módulo de Autenticación), JWT permite
 * autenticación stateless, ideal para APIs REST y escalabilidad horizontal.
 * 
 * @class JwtStrategy
 * @extends PassportStrategy
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../common/prisma/prisma.service';

/**
 * Interface para el payload del JWT.
 * Contiene solo la información necesaria para identificar al usuario.
 */
export interface JwtPayload {
  sub: string;      // User ID (subject)
  email: string;    // Email del usuario
  role: string;     // Rol del usuario (ADMIN/STAFF)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Extraer el token del header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // No ignorar expiración - tokens expirados son rechazados
      ignoreExpiration: false,
      // Clave secreta para verificar la firma del token
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Valida el payload del JWT y retorna el usuario.
   * 
   * Este método se ejecuta automáticamente después de que el token
   * es verificado. El objeto retornado se inyecta en request.user.
   * 
   * @param payload - Payload decodificado del JWT
   * @returns Usuario encontrado o lanza UnauthorizedException
   * 
   * Por qué buscar en DB: El token puede ser válido pero el usuario
   * pudo haber sido desactivado. Verificamos su estado actual.
   */
  async validate(payload: JwtPayload) {
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

    // Verificar que el usuario existe y está activo
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no autorizado o inactivo');
    }

    return user;
  }
}
