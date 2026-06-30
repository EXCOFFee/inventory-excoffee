/**
 * DTO para el login de usuario.
 * 
 * Valida los campos requeridos para autenticación según RF01 del SRS.
 * Implementa validación estricta con class-validator.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'admin@inventorypro.com',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Admin123!',
    minLength: 8,
  })
  // Coherente con register (mín. 8). No se valida el formato (regex) en el login: la fortaleza
  // se exige al crear el usuario; rechazar un login por formato no aporta seguridad (H-12).
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;
}
