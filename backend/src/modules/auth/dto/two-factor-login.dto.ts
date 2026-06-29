/**
 * DTO para el paso 2 del login con 2FA.
 *
 * Recibe el token efímero emitido por /auth/login (paso 1) y el código TOTP de 6 dígitos
 * generado por la app autenticadora. Implementa el flujo de login en dos pasos (ADR-0002).
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class TwoFactorLoginDto {
  @ApiProperty({
    description: 'Token efímero devuelto por /auth/login cuando el usuario tiene 2FA habilitado',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'El token de dos factores debe ser texto' })
  @IsNotEmpty({ message: 'El token de dos factores es requerido' })
  twoFactorToken: string;

  @ApiProperty({
    description: 'Código TOTP de 6 dígitos de la app autenticadora',
    example: '123456',
  })
  @IsString({ message: 'El código debe ser texto' })
  @Matches(/^[0-9]{6}$/, { message: 'El código debe ser de 6 dígitos numéricos' })
  code: string;
}
