/**
 * Servicio de Reportes de InventoryPro.
 * 
 * Genera KPIs y reportes según los objetivos del SRS:
 * - Stock Valuation: Valor total del inventario
 * - Product Velocity: Productos con más movimientos
 * - Stockouts: Productos sin stock
 * - Low Stock: Productos con stock bajo
 * 
 * @class ReportsService
 */

import { Injectable } from '@nestjs/common';
import { MovementType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el dashboard principal con KPIs.
   * 
   * @returns KPIs del inventario
   */
  async getDashboard() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Ejecutar consultas en paralelo para mejor rendimiento
    const [
      totalProducts,
      activeProducts,
      lowStockRows,
      outOfStockProducts,
      totalCategories,
      totalSuppliers,
      todayMovements,
      monthMovements,
      stockValuation,
    ] = await Promise.all([
      // Total de productos
      this.prisma.product.count(),
      // Productos activos
      this.prisma.product.count({ where: { isActive: true } }),
      // Productos con stock bajo, contados a nivel SQL (usa @@index([currentStock])).
      // Prisma no compara dos columnas con su API fluida → $queryRaw (tagged template, sin
      // interpolación de strings). Se mantiene la distinción del dashboard: low = stock <= min
      // y stock > 0 (los de stock 0 cuentan aparte como "sin stock"). Ver ADR-0005 / H-06.
      this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM products
        WHERE is_active = true AND current_stock <= min_stock AND current_stock > 0
      `,
      // Productos sin stock
      this.prisma.product.count({
        where: { isActive: true, currentStock: 0 },
      }),
      // Total categorías activas
      this.prisma.category.count({ where: { isActive: true } }),
      // Total proveedores activos
      this.prisma.supplier.count({ where: { isActive: true } }),
      // Movimientos de hoy
      this.prisma.movement.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      // Movimientos del mes
      this.prisma.movement.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      // Valor total del inventario (suma de currentStock * price)
      this.prisma.product.findMany({
        where: { isActive: true },
        select: { currentStock: true, price: true, cost: true },
      }),
    ]);

    // El conteo de stock bajo ya viene calculado por la consulta SQL (mismo criterio que antes:
    // currentStock <= minStock && currentStock > 0).
    const lowStockCount = Number(lowStockRows[0]?.count ?? 0);

    // Calcular valor del inventario
    const inventoryValue = stockValuation.reduce((sum, p) => {
      return sum + p.currentStock * Number(p.price);
    }, 0);

    const inventoryCost = stockValuation.reduce((sum, p) => {
      return sum + p.currentStock * Number(p.cost);
    }, 0);

    return {
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockCount,
        outOfStock: outOfStockProducts,
      },
      inventory: {
        totalValue: inventoryValue,
        totalCost: inventoryCost,
        potentialProfit: inventoryValue - inventoryCost,
      },
      entities: {
        categories: totalCategories,
        suppliers: totalSuppliers,
      },
      movements: {
        today: todayMovements,
        thisMonth: monthMovements,
      },
    };
  }

  /**
   * Obtiene el reporte de valoración de inventario.
   * 
   * @returns Lista de productos con su valor
   */
  async getStockValuation() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        name: true,
        currentStock: true,
        price: true,
        cost: true,
        category: { select: { name: true } },
      },
      orderBy: { currentStock: 'desc' },
    });

    const items = products.map((p) => ({
      ...p,
      totalValue: p.currentStock * Number(p.price),
      totalCost: p.currentStock * Number(p.cost),
      margin: Number(p.price) - Number(p.cost),
      marginPercent: Number(p.cost) > 0 
        ? ((Number(p.price) - Number(p.cost)) / Number(p.cost)) * 100 
        : 0,
    }));

    const summary = items.reduce(
      (acc, item) => ({
        totalValue: acc.totalValue + item.totalValue,
        totalCost: acc.totalCost + item.totalCost,
        totalItems: acc.totalItems + item.currentStock,
      }),
      { totalValue: 0, totalCost: 0, totalItems: 0 }
    );

    return {
      summary: {
        ...summary,
        potentialProfit: summary.totalValue - summary.totalCost,
      },
      items,
    };
  }

  /**
   * Obtiene los productos más movidos (velocidad de producto).
   * 
   * @param limit - Número de productos a retornar
   * @param days - Días a considerar
   * @returns Lista de productos ordenados por cantidad de movimientos
   */
  async getProductVelocity(limit = 10, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Obtener movimientos agrupados por producto
    const movements = await this.prisma.movement.groupBy({
      by: ['productId'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: { id: true },
      _sum: { quantity: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    // Obtener detalles de los productos
    const productIds = movements.map((m) => m.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        sku: true,
        name: true,
        currentStock: true,
        category: { select: { name: true } },
      },
    });

    // Combinar datos
    return movements.map((m) => {
      const product = products.find((p) => p.id === m.productId);
      return {
        product,
        movementCount: m._count.id,
        totalQuantity: m._sum.quantity,
        period: `Últimos ${days} días`,
      };
    });
  }

  /**
   * Obtiene los productos con stock bajo o sin stock.
   */
  async getLowStockReport() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        name: true,
        currentStock: true,
        minStock: true,
        maxStock: true,
        category: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { currentStock: 'asc' },
    });

    // Filtrar y clasificar
    const outOfStock = products.filter((p) => p.currentStock === 0);
    const lowStock = products.filter(
      (p) => p.currentStock > 0 && p.currentStock <= p.minStock
    );
    const healthy = products.filter((p) => p.currentStock > p.minStock);

    return {
      summary: {
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        healthy: healthy.length,
      },
      outOfStock,
      lowStock,
    };
  }

  /**
   * Obtiene el reporte de movimientos por período.
   */
  async getMovementsReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');

    const movements = await this.prisma.movement.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      include: {
        product: { select: { sku: true, name: true } },
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular resumen
    const summary = movements.reduce(
      (acc, m) => {
        if (m.type === MovementType.IN) {
          acc.totalEntries++;
          acc.totalQuantityIn += m.quantity;
          if (m.totalCost) acc.totalCostIn += Number(m.totalCost);
        } else {
          acc.totalExits++;
          acc.totalQuantityOut += m.quantity;
        }
        return acc;
      },
      {
        totalEntries: 0,
        totalExits: 0,
        totalQuantityIn: 0,
        totalQuantityOut: 0,
        totalCostIn: 0,
      }
    );

    return {
      period: { startDate, endDate },
      summary,
      movements,
    };
  }

  /**
   * Obtiene el reporte por categoría.
   */
  async getCategoryReport() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          select: {
            currentStock: true,
            price: true,
            cost: true,
          },
        },
      },
    });

    return categories.map((cat) => {
      const totalProducts = cat.products.length;
      const totalStock = cat.products.reduce((sum, p) => sum + p.currentStock, 0);
      const totalValue = cat.products.reduce(
        (sum, p) => sum + p.currentStock * Number(p.price),
        0
      );
      const totalCost = cat.products.reduce(
        (sum, p) => sum + p.currentStock * Number(p.cost),
        0
      );

      return {
        id: cat.id,
        name: cat.name,
        totalProducts,
        totalStock,
        totalValue,
        totalCost,
        margin: totalValue - totalCost,
      };
    });
  }
}
