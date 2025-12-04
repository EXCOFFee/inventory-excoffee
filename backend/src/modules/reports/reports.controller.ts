/**
 * Controlador de Reportes de InventoryPro.
 * 
 * @class ReportsController
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Dashboard principal con KPIs.
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener dashboard con KPIs' })
  @ApiResponse({ status: 200, description: 'KPIs del inventario' })
  async getDashboard() {
    return this.reportsService.getDashboard();
  }

  /**
   * Valoración del inventario.
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('stock-valuation')
  @ApiOperation({ summary: 'Reporte de valoración de inventario (Admin)' })
  @ApiResponse({ status: 200, description: 'Valoración del inventario' })
  async getStockValuation() {
    return this.reportsService.getStockValuation();
  }

  /**
   * Velocidad de productos.
   */
  @Get('product-velocity')
  @ApiOperation({ summary: 'Productos más movidos' })
  @ApiQuery({ name: 'limit', required: false, description: 'Cantidad de productos' })
  @ApiQuery({ name: 'days', required: false, description: 'Días a considerar' })
  @ApiResponse({ status: 200, description: 'Productos con más movimientos' })
  async getProductVelocity(
    @Query('limit') limit?: number,
    @Query('days') days?: number,
  ) {
    return this.reportsService.getProductVelocity(limit || 10, days || 30);
  }

  /**
   * Reporte de stock bajo.
   */
  @Get('low-stock')
  @ApiOperation({ summary: 'Reporte de stock bajo y sin stock' })
  @ApiResponse({ status: 200, description: 'Productos con stock bajo' })
  async getLowStockReport() {
    return this.reportsService.getLowStockReport();
  }

  /**
   * Reporte de movimientos por período.
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('movements')
  @ApiOperation({ summary: 'Reporte de movimientos (Admin)' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Fecha fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Reporte de movimientos' })
  async getMovementsReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getMovementsReport(startDate, endDate);
  }

  /**
   * Reporte por categoría.
   */
  @Get('by-category')
  @ApiOperation({ summary: 'Reporte por categoría' })
  @ApiResponse({ status: 200, description: 'Inventario agrupado por categoría' })
  async getCategoryReport() {
    return this.reportsService.getCategoryReport();
  }
}
