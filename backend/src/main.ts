/**
 * Punto de entrada principal de la aplicación InventoryPro Backend.
 * 
 * Este archivo inicializa la aplicación NestJS con las siguientes configuraciones:
 * - Pipes de validación global para DTOs
 * - Documentación Swagger/OpenAPI
 * - Configuración CORS para permitir requests del frontend
 * - Seguridad con Helmet (headers HTTP)
 * - Rate limiting para prevenir ataques DDoS
 * 
 * @module main
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { resolveCorsOrigins, validateProductionEnv } from './common/config/env.validation';

/**
 * Función bootstrap que inicializa y configura la aplicación.
 * 
 * Configuraciones aplicadas:
 * 1. ValidationPipe global: Valida DTOs automáticamente usando class-validator
 * 2. CORS: Permite requests desde el frontend (configurable por entorno)
 * 3. Swagger: Documentación interactiva de la API en /api/docs
 * 4. Prefijo global: Todas las rutas comienzan con /api
 */
async function bootstrap() {
  // Fail-fast en producción ante configuración insegura (CORS_ORIGIN / JWT_SECRET) — ADR-0004.
  // Se valida ANTES de crear la app para no arrancar nunca con secretos de ejemplo o CORS abierto.
  validateProductionEnv();

  const app = await NestFactory.create(AppModule);

  // ============================================
  // CONFIGURACIÓN DE SEGURIDAD (HELMET)
  // ============================================
  // Helmet agrega headers HTTP de seguridad:
  // - X-Content-Type-Options: nosniff
  // - X-Frame-Options: DENY
  // - X-XSS-Protection: 1; mode=block
  // - Strict-Transport-Security (HSTS)
  // - Content-Security-Policy
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false, // Necesario para Swagger UI
    }),
  );

  // ============================================
  // CONFIGURACIÓN DE VALIDACIÓN GLOBAL
  // ============================================
  // Según DoD del SRS: Validación estricta de datos en el backend
  // whitelist: true - Elimina propiedades no definidas en el DTO
  // forbidNonWhitelisted: true - Lanza error si hay propiedades no permitidas
  // transform: true - Transforma payloads a instancias de DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ============================================
  // CONFIGURACIÓN CORS
  // ============================================
  // Lista explícita de orígenes permitidos (nunca '*', incompatible con credentials: true).
  // En dev usa el front de Vite (http://localhost:5173); en prod CORS_ORIGIN es obligatorio
  // (validado arriba). Soporta lista separada por comas. Ver ADR-0004 / H-05.
  app.enableCors({
    origin: resolveCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // ============================================
  // PREFIJO GLOBAL DE API
  // ============================================
  // Todas las rutas quedan bajo /api EXCEPTO el health check, que Render espera en /health.
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  // ============================================
  // CONFIGURACIÓN DE SWAGGER (OpenAPI)
  // ============================================
  // Según RF del SRS: Documentación de API con Swagger
  // Accesible en: http://localhost:3000/api/docs
  const config = new DocumentBuilder()
    .setTitle('InventoryPro API')
    .setDescription(
      `## Sistema de Gestión de Inventario Avanzado
      
API REST para la gestión integral y trazable de inventarios físicos.

### Características principales:
- **Autenticación JWT** con roles (Admin/Staff)
- **CRUD de Productos** con gestión de SKU y códigos de barras
- **Sistema Kardex** para trazabilidad de movimientos
- **Alertas de Stock Bajo** automáticas
- **Reportes y KPIs** de inventario

### Autenticación
Usar el endpoint \`/api/auth/login\` para obtener un token JWT.
Incluir el token en el header: \`Authorization: Bearer <token>\`
      `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Autenticación y autorización de usuarios')
    .addTag('Users', 'Gestión de usuarios del sistema')
    .addTag('Products', 'Catálogo de productos e inventario')
    .addTag('Categories', 'Categorías de productos')
    .addTag('Suppliers', 'Gestión de proveedores')
    .addTag('Movements', 'Movimientos de inventario (Kardex)')
    .addTag('Reports', 'Reportes y KPIs de inventario')
    .addTag('Alerts', 'Alertas de stock bajo')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // ============================================
  // INICIAR SERVIDOR
  // ============================================
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║   🚀 InventoryPro Backend iniciado correctamente          ║
  ║                                                            ║
  ║   📡 API:      http://localhost:${port}/api                   ║
  ║   📚 Swagger:  http://localhost:${port}/api/docs              ║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
  `);
}

bootstrap().catch((error) => {
  // Fail-fast con mensaje claro (p. ej. configuración insegura en producción) y exit ≠ 0.
  console.error('❌ No se pudo iniciar la aplicación:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
