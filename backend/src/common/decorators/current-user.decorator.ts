/**
 * Decorador para obtener el usuario actual del request.
 * 
 * Uso: Inyecta el usuario autenticado directamente en el parámetro del método.
 * 
 * Ejemplo:
 * ```typescript
 * @Get('profile')
 * async getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 * 
 * // También puede obtener solo un campo específico:
 * @Get('my-id')
 * async getMyId(@CurrentUser('id') userId: string) {
 *   return userId;
 * }
 * ```
 * 
 * Por qué: Evita repetir la lógica de extraer el usuario del request
 * en cada controlador, siguiendo el principio DRY.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrae el usuario autenticado del request.
 * @param data - Campo específico del usuario a extraer (opcional)
 * @param ctx - Contexto de ejecución de NestJS
 * @returns Usuario completo o campo específico
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Si se especifica un campo, retornar solo ese campo
    // Ejemplo: @CurrentUser('id') retorna solo el ID
    return data ? user?.[data] : user;
  },
);
