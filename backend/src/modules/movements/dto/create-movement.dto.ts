/**
 * DTO para crear un movimiento de inventario.
 * 
 * Implementa las validaciones requeridas según el SRS:
 * - Cantidad debe ser positiva (> 0)
 * - Tipo debe ser IN (entrada) o OUT (salida)
 * - ProductId debe ser un UUID válido
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovementDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 'uuid-del-producto',
  })
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  productId: string;

  @ApiProperty({
    description: 'Tipo de movimiento (IN=Entrada, OUT=Salida)',
    enum: MovementType,
    example: 'IN',
  })
  @IsEnum(MovementType, { message: 'El tipo debe ser IN (entrada) o OUT (salida)' })
  type: MovementType;

  @ApiProperty({
    description: 'Cantidad del movimiento (debe ser > 0)',
    example: 10,
    minimum: 1,
  })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Razón o motivo del movimiento',
    example: 'Compra a proveedor',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales',
    example: 'Factura #12345',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Referencia externa (factura, orden, etc.)',
    example: 'FAC-2024-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Costo unitario (para movimientos de entrada)',
    example: 50.00,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitCost?: number;
}
