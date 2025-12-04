/**
 * Decorador para marcar rutas como públicas (sin autenticación JWT).
 * 
 * Uso: Aplicar @Public() a controladores o métodos específicos
 * para excluirlos de la validación JWT.
 * 
 * Ejemplo:
 * ```typescript
 * @Public()
 * @Post('login')
 * async login() { ... }
 * ```
 * 
 * Por qué: Algunas rutas como login y registro deben ser accesibles
 * sin token JWT. Este decorador permite excepciones al guard global.
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca una ruta como pública, excluyéndola de la autenticación JWT.
 * @returns Decorador de metadatos
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
