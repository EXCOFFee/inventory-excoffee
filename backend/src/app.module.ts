/**
 * Módulo raíz de la aplicación InventoryPro.
 * 
 * Este módulo configura e importa todos los módulos funcionales del sistema:
 * - ConfigModule: Gestión de variables de entorno
 * - ThrottlerModule: Rate limiting para prevenir ataques DDoS
 * - ScheduleModule: Tareas programadas (alertas de stock)
 * - PrismaModule: Conexión a la base de datos
 * - AuthModule: Autenticación y autorización
 * - UsersModule: Gestión de usuarios
 * - CategoriesModule: Categorías de productos
 * - SuppliersModule: Gestión de proveedores
 * - ProductsModule: Catálogo de productos
 * - MovementsModule: Movimientos de inventario (Kardex)
 * - ReportsModule: Reportes y KPIs
 * - AlertsModule: Alertas de stock bajo
 * 
 * @module AppModule
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { EmailModule } from './common/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { ProductsModule } from './modules/products/products.module';
import { MovementsModule } from './modules/movements/movements.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AlertsModule } from './modules/alerts/alerts.module';

@Module({
  imports: [
    // ============================================
    // CONFIGURACIÓN GLOBAL
    // ============================================
    // ConfigModule carga variables de entorno desde .env
    // isGlobal: true hace que esté disponible en toda la aplicación
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // ============================================
    // RATE LIMITING (THROTTLER)
    // ============================================
    // Previene ataques de fuerza bruta y DDoS
    // Límite: 60 requests por minuto por IP
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 segundo
        limit: 10, // 10 requests por segundo
      },
      {
        name: 'medium',
        ttl: 10000, // 10 segundos
        limit: 50, // 50 requests cada 10 segundos
      },
      {
        name: 'long',
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      },
    ]),
    
    // ScheduleModule habilita tareas programadas (Cron Jobs)
    // Usado para verificar stock bajo periódicamente (RF04)
    ScheduleModule.forRoot(),
    
    // ============================================
    // MÓDULO DE BASE DE DATOS
    // ============================================
    // PrismaModule gestiona la conexión a PostgreSQL
    PrismaModule,
    
    // ============================================
    // MÓDULO DE EMAIL
    // ============================================
    // EmailModule para notificaciones por correo
    EmailModule,
    
    // ============================================
    // MÓDULOS DE NEGOCIO
    // ============================================
    // Importados en orden de dependencias
    AuthModule,
    UsersModule,
    CategoriesModule,
    SuppliersModule,
    ProductsModule,
    MovementsModule,
    ReportsModule,
    AlertsModule,
  ],
  providers: [
    // ============================================
    // THROTTLER GUARD GLOBAL
    // ============================================
    // Aplica rate limiting a todos los endpoints
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
