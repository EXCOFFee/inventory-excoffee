/**
 * Módulo de Alertas de InventoryPro.
 * 
 * Gestiona las alertas de stock bajo (RF04).
 * Incluye tareas programadas para verificación periódica.
 * 
 * @module AlertsModule
 */

import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

@Module({
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
