/**
 * Módulo Prisma para inyección de dependencias.
 * 
 * Exporta el PrismaService como global para que esté disponible
 * en todos los módulos sin necesidad de importarlo explícitamente.
 * 
 * @module PrismaModule
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
