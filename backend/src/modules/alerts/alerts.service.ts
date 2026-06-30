/**
 * Servicio de Alertas de Stock de InventoryPro.
 * 
 * Responsabilidad: Gestionar alertas de stock bajo (RF04).
 * 
 * Funcionalidades:
 * - Verificación periódica de stock bajo (Cron Job)
 * - Registro de alertas en la base de datos
 * - Listado y gestión de alertas
 * 
 * Por qué: Prevenir la interrupción de ventas por falta de producto
 * (stockout) según los objetivos del SRS.
 * 
 * @class AlertsService
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tarea programada que verifica productos con stock bajo.
   * Se ejecuta cada hora.
   * 
   * Por qué cada hora: Balance entre detección oportuna y
   * carga del servidor. Puede ajustarse según necesidades.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkLowStock() {
    this.logger.log('🔍 Verificando productos con stock bajo...');

    try {
      // Filtrado de stock bajo a nivel de BASE DE DATOS, aprovechando @@index([currentStock]).
      // Prisma no permite comparar dos columnas (currentStock <= minStock) con su API fluida, así
      // que se usa $queryRaw con tagged template (sin interpolación de strings, sin riesgo de
      // inyección). No es un anti-patrón: es la forma idiomática ante esa limitación (ADR-0005).
      // Devuelve SOLO los productos con stock bajo, en vez de traer todos y filtrar en memoria.
      const lowStockProducts = await this.prisma.$queryRaw<
        Array<{ id: string; sku: string; name: string; currentStock: number; minStock: number }>
      >`
        SELECT id, sku, name, current_stock AS "currentStock", min_stock AS "minStock"
        FROM products
        WHERE is_active = true AND current_stock <= min_stock
      `;

      if (lowStockProducts.length === 0) {
        this.logger.log('✅ No hay productos con stock bajo');
        return;
      }

      this.logger.warn(
        `⚠️ ${lowStockProducts.length} productos con stock bajo detectados`
      );

      // Crear alertas para productos que no tienen alerta activa
      for (const product of lowStockProducts) {
        // Verificar si ya existe una alerta no reconocida para este producto
        const existingAlert = await this.prisma.stockAlert.findFirst({
          where: {
            productSku: product.sku,
            acknowledged: false,
          },
        });

        if (!existingAlert) {
          // Crear nueva alerta
          await this.prisma.stockAlert.create({
            data: {
              productSku: product.sku,
              productName: product.name,
              currentStock: product.currentStock,
              minStock: product.minStock,
            },
          });

          this.logger.log(
            `📢 Alerta creada para ${product.sku}: Stock ${product.currentStock}/${product.minStock}`
          );

          // Aquí se podría integrar el servicio de email
          // await this.mailService.sendStockAlert(product);
        }
      }
    } catch (error) {
      this.logger.error('Error al verificar stock bajo:', error);
    }
  }

  /**
   * Fuerza una verificación manual de stock bajo.
   * Útil para no esperar al Cron Job.
   */
  async forceCheck() {
    await this.checkLowStock();
    return { message: 'Verificación de stock bajo ejecutada' };
  }

  /**
   * Obtiene todas las alertas activas (no reconocidas).
   */
  async getActiveAlerts() {
    return this.prisma.stockAlert.findMany({
      where: { acknowledged: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene el historial de alertas.
   */
  async getAllAlerts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      this.prisma.stockAlert.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.stockAlert.count(),
    ]);

    return {
      data: alerts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Marca una alerta como reconocida.
   * 
   * @param id - ID de la alerta
   */
  async acknowledgeAlert(id: string) {
    return this.prisma.stockAlert.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
    });
  }

  /**
   * Marca todas las alertas activas como reconocidas.
   */
  async acknowledgeAll() {
    const result = await this.prisma.stockAlert.updateMany({
      where: { acknowledged: false },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
    });

    return {
      message: `${result.count} alertas marcadas como reconocidas`,
      count: result.count,
    };
  }

  /**
   * Obtiene el conteo de alertas activas.
   */
  async getActiveCount() {
    const count = await this.prisma.stockAlert.count({
      where: { acknowledged: false },
    });

    return { activeAlerts: count };
  }
}
