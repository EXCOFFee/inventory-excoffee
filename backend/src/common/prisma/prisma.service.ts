/**
 * Servicio Prisma para la conexión a la base de datos PostgreSQL.
 * 
 * Este servicio implementa el patrón Singleton para garantizar
 * una única conexión a la base de datos en toda la aplicación.
 * 
 * Implementa OnModuleInit para conectar al iniciar el módulo
 * y OnModuleDestroy para desconectar limpiamente al cerrar.
 * 
 * @class PrismaService
 * @extends PrismaClient
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * Método ejecutado al inicializar el módulo.
   * Establece la conexión con la base de datos PostgreSQL.
   * 
   * Por qué: NestJS necesita que la conexión esté lista antes de
   * procesar requests, garantizando disponibilidad del servicio.
   */
  async onModuleInit() {
    await this.$connect();
    console.log('📦 Prisma conectado a PostgreSQL');
  }

  /**
   * Método ejecutado al destruir el módulo.
   * Cierra la conexión de forma limpia para evitar conexiones huérfanas.
   * 
   * Por qué: Liberar recursos de la base de datos y prevenir
   * conexiones colgantes que afecten el pool de conexiones.
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('📦 Prisma desconectado de PostgreSQL');
  }
}
