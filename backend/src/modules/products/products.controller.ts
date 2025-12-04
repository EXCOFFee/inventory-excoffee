/**
 * Controlador de Productos de InventoryPro.
 * 
 * Expone los endpoints para gestión del catálogo de productos (RF02).
 * - GET /products - Listar con filtros y paginación
 * - GET /products/:id - Obtener por ID
 * - GET /products/sku/:sku - Obtener por SKU
 * - GET /products/barcode/:barcode - Obtener por código de barras
 * - POST /products - Crear producto (Admin)
 * - PUT /products/:id - Actualizar producto (Admin)
 * - DELETE /products/:id - Desactivar producto (Admin)
 * 
 * @class ProductsController
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, FilterProductsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Lista productos con filtros y paginación.
   */
  @Get()
  @ApiOperation({ summary: 'Listar productos con filtros' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, SKU o código' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por categoría' })
  @ApiQuery({ name: 'supplierId', required: false, description: 'Filtrar por proveedor' })
  @ApiQuery({ name: 'lowStock', required: false, description: 'Solo productos con stock bajo' })
  @ApiQuery({ name: 'page', required: false, description: 'Página actual' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  @ApiResponse({ status: 200, description: 'Lista paginada de productos' })
  async findAll(@Query() filters: FilterProductsDto) {
    return this.productsService.findAll(filters);
  }

  /**
   * Obtiene estadísticas de productos.
   */
  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de productos' })
  @ApiResponse({ status: 200, description: 'Estadísticas de productos' })
  async getStats() {
    return this.productsService.getStats();
  }

  /**
   * Obtiene productos con stock bajo.
   */
  @Get('low-stock')
  @ApiOperation({ summary: 'Listar productos con stock bajo' })
  @ApiResponse({ status: 200, description: 'Productos con stock bajo' })
  async findLowStock() {
    return this.productsService.findLowStock();
  }

  /**
   * Obtiene un producto por SKU.
   * Útil para escaneo de código.
   */
  @Get('sku/:sku')
  @ApiOperation({ summary: 'Buscar producto por SKU' })
  @ApiParam({ name: 'sku', description: 'SKU del producto' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findBySku(@Param('sku') sku: string) {
    return this.productsService.findBySku(sku);
  }

  /**
   * Obtiene un producto por código de barras.
   * Usado por la App Móvil para escaneo.
   */
  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Buscar producto por código de barras' })
  @ApiParam({ name: 'barcode', description: 'Código de barras del producto' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  /**
   * Obtiene un producto por ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto (UUID)' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  /**
   * Crea un nuevo producto.
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Crear producto (Admin)' })
  @ApiResponse({ status: 201, description: 'Producto creado' })
  @ApiResponse({ status: 409, description: 'SKU o código de barras ya existe' })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /**
   * Actualiza un producto existente.
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar producto (Admin)' })
  @ApiParam({ name: 'id', description: 'ID del producto (UUID)' })
  @ApiResponse({ status: 200, description: 'Producto actualizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * Desactiva un producto (soft delete).
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar producto (Admin)' })
  @ApiParam({ name: 'id', description: 'ID del producto (UUID)' })
  @ApiResponse({ status: 200, description: 'Producto desactivado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
