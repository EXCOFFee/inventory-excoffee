/**
 * Guard de autenticación JWT.
 * 
 * Este guard verifica la presencia y validez del token JWT.
 * Permite excepciones para rutas marcadas con @Public().
 * 
 * @class JwtAuthGuard
 * @extends AuthGuard
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determina si la ruta actual requiere autenticación.
   * 
   * @param context - Contexto de ejecución
   * @returns true para rutas públicas, resultado del AuthGuard para protegidas
   * 
   * Lógica:
   * 1. Verificar si la ruta tiene el decorador @Public()
   * 2. Si es pública, permitir acceso sin token
   * 3. Si no es pública, delegar al AuthGuard('jwt') padre
   */
  canActivate(context: ExecutionContext) {
    // Verificar si la ruta está marcada como pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si es pública, permitir acceso
    if (isPublic) {
      return true;
    }

    // Si no es pública, validar el token JWT
    return super.canActivate(context);
  }
}
