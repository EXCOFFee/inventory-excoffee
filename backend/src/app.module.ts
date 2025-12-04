/**
 * Módulo raíz de la aplicación InventoryPro.
 * 
 * Este módulo configura e importa todos los módulos funcionales del sistema:
 * - ConfigModule: Gestión de variables de entorno
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
})
export class AppModule {}
