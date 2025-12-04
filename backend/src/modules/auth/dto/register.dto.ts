/**
 * DTO para el registro de nuevos usuarios.
 * 
 * Valida todos los campos necesarios para crear un usuario nuevo.
 * Solo administradores pueden registrar nuevos usuarios (según SRS).
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Correo electrónico único del usuario',
    example: 'nuevo@inventorypro.com',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña segura (mínimo 8 caracteres, mayúscula, minúscula, número)',
    example: 'Password123!',
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe incluir mayúsculas, minúsculas y números',
  })
  password: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @IsString({ message: 'El apellido debe ser texto' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario (ADMIN o STAFF)',
    enum: Role,
    default: Role.STAFF,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'El rol debe ser ADMIN o STAFF' })
  role?: Role;
}
