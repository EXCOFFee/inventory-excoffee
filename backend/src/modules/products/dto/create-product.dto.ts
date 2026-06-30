/**
 * DTO para crear un producto.
 * 
 * Implementa validación estricta según DoD del SRS.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  IsUUID,
  Min,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    description: 'SKU único del producto',
    example: 'ELEC-001',
  })
  @IsString()
  @IsNotEmpty({ message: 'El SKU es requerido' })
  @MaxLength(50)
  sku: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Laptop HP 15.6"',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del producto',
    example: 'Laptop HP con procesador Intel Core i5',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Precio de venta',
    example: 799.99,
  })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    description: 'Costo de adquisición',
    example: 600.00,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cost?: number;

  @ApiPropertyOptional({
    description: 'Stock inicial',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'El stock inicial debe ser un número entero' })
  @Min(0)
  @Type(() => Number)
  currentStock?: number;

  @ApiProperty({
    description: 'Stock mínimo para alertas',
    example: 10,
  })
  @IsInt({ message: 'El stock mínimo debe ser un número entero' })
  @Min(0)
  @Type(() => Number)
  minStock: number;

  @ApiPropertyOptional({
    description: 'Stock máximo',
    example: 100,
  })
  @IsOptional()
  @IsInt({ message: 'El stock máximo debe ser un número entero' })
  @Min(0)
  @Type(() => Number)
  maxStock?: number;

  @ApiPropertyOptional({
    description: 'URL de la imagen del producto',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'La URL de la imagen no es válida' })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Código de barras único',
    example: '7501234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @ApiPropertyOptional({
    description: 'ID de la categoría',
    example: 'uuid-de-categoria',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido' })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'ID del proveedor',
    example: 'uuid-de-proveedor',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de proveedor debe ser un UUID válido' })
  supplierId?: string;
}
