/**
 * Módulo de Productos de InventoryPro.
 * 
 * Gestiona el catálogo de productos (RF02).
 * 
 * @module ProductsModule
 */

import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
