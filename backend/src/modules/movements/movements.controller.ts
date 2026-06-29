/**
 * Controlador de Movimientos de Inventario de InventoryPro.
 * 
 * Expone los endpoints para gestión de movimientos (RF03).
 * 
 * @class MovementsController
 */

import {
  Controller,
  Get,
  Post,
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
import { MovementsService } from './movements.service';
import { CreateMovementDto, FilterMovementsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Movements')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  /**
   * Registra un nuevo movimiento de inventario.
   * Tanto Admin como Staff pueden registrar movimientos.
   */
  @Post()
  @ApiOperation({
    summary: 'Registrar movimiento de inventario',
    description:
      'Crea un registro Kardex y ajusta el stock del producto de forma atómica dentro de una ' +
      'transacción. Para SALIDAS el decremento es condicional a nivel de base de datos ' +
      '(updateMany con currentStock >= quantity), de modo que dos salidas concurrentes del ' +
      'mismo producto nunca dejan el stock negativo ni pierden actualizaciones; si no hay stock ' +
      'suficiente responde 400.',
  })
  @ApiResponse({ status: 201, description: 'Movimiento registrado y stock actualizado atómicamente' })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente para la salida (garantizado bajo concurrencia), producto inactivo o datos inválidos',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async create(
    @Body() createMovementDto: CreateMovementDto,
    @CurrentUser() user: any,
  ) {
    return this.movementsService.create(createMovementDto, user);
  }

  /**
   * Lista movimientos con filtros y paginación.
   */
  @Get()
  @ApiOperation({ summary: 'Listar movimientos con filtros' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['IN', 'OUT'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Lista paginada de movimientos' })
  async findAll(@Query() filters: FilterMovementsDto) {
    return this.movementsService.findAll(filters);
  }

  /**
   * Obtiene resumen diario de movimientos.
   */
  @Get('daily-summary')
  @ApiOperation({ summary: 'Obtener resumen diario de movimientos' })
  @ApiQuery({ name: 'date', required: false, description: 'Fecha (YYYY-MM-DD), por defecto hoy' })
  @ApiResponse({ status: 200, description: 'Resumen del día' })
  async getDailySummary(@Query('date') date?: string) {
    return this.movementsService.getDailySummary(date);
  }

  /**
   * Obtiene el historial de movimientos de un producto (Kardex).
   */
  @Get('product/:productId')
  @ApiOperation({ summary: 'Obtener historial de movimientos de un producto' })
  @ApiParam({ name: 'productId', description: 'ID del producto (UUID)' })
  @ApiResponse({ status: 200, description: 'Historial del producto' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async getProductHistory(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.movementsService.getProductHistory(productId);
  }

  /**
   * Obtiene un movimiento por ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener movimiento por ID' })
  @ApiParam({ name: 'id', description: 'ID del movimiento (UUID)' })
  @ApiResponse({ status: 200, description: 'Movimiento encontrado' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.movementsService.findOne(id);
  }
}
