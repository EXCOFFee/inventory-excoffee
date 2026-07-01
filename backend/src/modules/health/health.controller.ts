/**
 * Health check para el proveedor de hosting (Render).
 *
 * Render (y otros PaaS) hacen ping a este endpoint para saber si el servicio está vivo.
 * Está EXCLUIDO del prefijo global `api` (ver main.ts), así que responde en `GET /health`.
 * `@SkipThrottle()` evita que los pings periódicos consuman el rate limit global.
 *
 * @class HealthController
 */

import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Liveness del servicio (usado por Render).' })
  @ApiResponse({ status: 200, description: 'El servicio está vivo', schema: { example: { status: 'ok' } } })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
