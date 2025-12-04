/**
 * Controlador de Alertas de InventoryPro.
 * 
 * @class AlertsController
 */

import {
  Controller,
  Get,
  Post,
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
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Alerts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Obtiene el conteo de alertas activas.
   */
  @Get('count')
  @ApiOperation({ summary: 'Obtener conteo de alertas activas' })
  @ApiResponse({ status: 200, description: 'Conteo de alertas' })
  async getActiveCount() {
    return this.alertsService.getActiveCount();
  }

  /**
   * Obtiene alertas activas (no reconocidas).
   */
  @Get('active')
  @ApiOperation({ summary: 'Listar alertas activas' })
  @ApiResponse({ status: 200, description: 'Lista de alertas activas' })
  async getActiveAlerts() {
    return this.alertsService.getActiveAlerts();
  }

  /**
   * Obtiene historial de alertas.
   */
  @Get()
  @ApiOperation({ summary: 'Listar todas las alertas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Historial de alertas' })
  async getAllAlerts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.alertsService.getAllAlerts(page, limit);
  }

  /**
   * Fuerza verificación de stock bajo.
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('check')
  @ApiOperation({ summary: 'Forzar verificación de stock bajo (Admin)' })
  @ApiResponse({ status: 200, description: 'Verificación ejecutada' })
  async forceCheck() {
    return this.alertsService.forceCheck();
  }

  /**
   * Marca una alerta como reconocida.
   */
  @Post(':id/acknowledge')
  @ApiOperation({ summary: 'Reconocer una alerta' })
  @ApiParam({ name: 'id', description: 'ID de la alerta (UUID)' })
  @ApiResponse({ status: 200, description: 'Alerta reconocida' })
  async acknowledgeAlert(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertsService.acknowledgeAlert(id);
  }

  /**
   * Marca todas las alertas como reconocidas.
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('acknowledge-all')
  @ApiOperation({ summary: 'Reconocer todas las alertas (Admin)' })
  @ApiResponse({ status: 200, description: 'Todas las alertas reconocidas' })
  async acknowledgeAll() {
    return this.alertsService.acknowledgeAll();
  }
}
