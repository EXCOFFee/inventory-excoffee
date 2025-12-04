/**
 * Módulo de Categorías de InventoryPro.
 * 
 * Gestiona las categorías de productos.
 * 
 * @module CategoriesModule
 */

import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
