/**
 * Módulo de Movimientos de InventoryPro.
 * 
 * Gestiona los movimientos de inventario (RF03 - Sistema Kardex).
 * Implementa la lógica transaccional para entradas y salidas de stock.
 * 
 * @module MovementsModule
 */

import { Module } from '@nestjs/common';
import { MovementsController } from './movements.controller';
import { MovementsService } from './movements.service';

@Module({
  controllers: [MovementsController],
  providers: [MovementsService],
  exports: [MovementsService],
})
export class MovementsModule {}
