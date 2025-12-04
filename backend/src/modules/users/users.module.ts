/**
 * Módulo de Usuarios de InventoryPro.
 * 
 * Gestiona las operaciones CRUD de usuarios del sistema.
 * Solo accesible por administradores.
 * 
 * @module UsersModule
 */

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
