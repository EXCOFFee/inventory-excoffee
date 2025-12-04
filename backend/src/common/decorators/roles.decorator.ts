/**
 * Decorador para especificar roles requeridos en una ruta.
 * 
 * Uso: Aplicar @Roles(Role.ADMIN) para restringir acceso solo a admins.
 * 
 * Ejemplo:
 * ```typescript
 * @Roles(Role.ADMIN)
 * @Get('users')
 * async getUsers() { ... }
 * ```
 * 
 * Por qué: Según el SRS, Admin tiene acceso completo mientras Staff
 * solo puede realizar movimientos y escaneo. Este decorador implementa
 * el control de acceso basado en roles (RBAC).
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Define los roles permitidos para acceder a una ruta.
 * @param roles - Lista de roles permitidos (Role.ADMIN, Role.STAFF)
 * @returns Decorador de metadatos
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
