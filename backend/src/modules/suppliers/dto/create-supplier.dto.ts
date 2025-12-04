/**
 * DTO para crear un proveedor.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({
    description: 'Nombre del proveedor',
    example: 'Tech Distribuciones S.A.',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Email de contacto',
    example: 'ventas@techdist.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Dirección del proveedor',
    example: 'Av. Tecnología 123, Ciudad Tech',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'Nombre del contacto principal',
    example: 'María García',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactName?: string;
}
