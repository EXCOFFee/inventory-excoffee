/**
 * Guard de autorización basado en roles.
 * 
 * Este guard verifica que el usuario autenticado tenga uno de los
 * roles requeridos para acceder al recurso.
 * 
 * Por qué: Implementa el control de acceso descrito en el SRS donde:
 * - ADMIN: Acceso completo a todas las funcionalidades
 * - STAFF: Acceso limitado a movimientos, escaneo y consulta de productos
 * 
 * @class RolesGuard
 * @implements CanActivate
 */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Verifica si el usuario tiene los roles necesarios para acceder.
   * 
   * @param context - Contexto de ejecución con información del request
   * @returns true si el usuario tiene permiso, false en caso contrario
   * 
   * Lógica de verificación:
   * 1. Si no hay roles definidos en la ruta, permitir acceso (ruta pública)
   * 2. Extraer el usuario del request (ya validado por JwtAuthGuard)
   * 3. Verificar si el rol del usuario está en la lista de roles permitidos
   */
  canActivate(context: ExecutionContext): boolean {
    // Obtener roles requeridos del decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles especificados, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtener usuario del request (inyectado por JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Verificar si el rol del usuario está en los roles permitidos
    return requiredRoles.includes(user.role);
  }
}
