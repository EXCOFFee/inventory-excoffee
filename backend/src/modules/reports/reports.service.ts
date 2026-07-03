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
    const now = new Date();
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Ventana de 7 días INCLUYENDO hoy → inicio hace 6 días a las 00:00.
    const trendStart = new Date();
    trendStart.setDate(trendStart.getDate() - 6);
    trendStart.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      outOfStockCount,
      lowStockRows,
      totalMovementsToday,
      totalMovementsThisMonth,
      recentAlerts,
      valuationRows,
      categories,
      velocityGroups,
      trendMovements,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true, currentStock: 0 } }),
      // Stock bajo contado a nivel SQL (usa @@index([current_stock])). Prisma no compara dos
      // columnas con su API fluida → $queryRaw (tagged template, parametrizado). low = stock
      // <= min y stock > 0 (los de stock 0 cuentan como "sin stock"). Ver ADR-0005 / H-06.
      this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM products
        WHERE is_active = true AND current_stock <= min_stock AND current_stock > 0
      `,
      this.prisma.movement.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.movement.count({ where: { createdAt: { gte: startOfMonth } } }),
      // Alertas "recientes" = activas (no reconocidas).
      this.prisma.stockAlert.count({ where: { acknowledged: false } }),
      // Valorización del inventario.
      this.prisma.product.findMany({
        where: { isActive: true },
        select: { currentStock: true, price: true },
      }),
      // Distribución por categoría (categorías activas + sus productos activos).
      this.prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          products: {
            where: { isActive: true },
            select: { currentStock: true, price: true },
          },
        },
      }),
      // Cantidad movida por producto y tipo (últimos 30 días) para el top de productos.
      this.prisma.movement.groupBy({
        by: ['productId', 'type'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _sum: { quantity: true },
      }),
      // Movimientos de los últimos 7 días para la tendencia real (antes eran datos random, H-17).
      this.prisma.movement.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { type: true, quantity: true, createdAt: true },
      }),
    ]);

    const lowStockCount = Number(lowStockRows[0]?.count ?? 0);

    // --- Valorización ---
    const totalUnits = valuationRows.reduce((s, p) => s + p.currentStock, 0);
    const totalValue = valuationRows.reduce(
      (s, p) => s + p.currentStock * Number(p.price),
      0,
    );
    const stockValuation = {
      totalProducts,
      totalUnits,
      totalValue,
      averageValue: totalProducts > 0 ? totalValue / totalProducts : 0,
    };

    // --- Distribución por categoría ---
    const categoryDistribution = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      productCount: cat.products.length,
      totalStock: cat.products.reduce((s, p) => s + p.currentStock, 0),
      totalValue: cat.products.reduce(
        (s, p) => s + p.currentStock * Number(p.price),
        0,
      ),
    }));

    // --- Top de productos por cantidad movida (30 días) ---
    const perProduct = new Map<string, { totalIn: number; totalOut: number }>();
    for (const g of velocityGroups) {
      const entry = perProduct.get(g.productId) ?? { totalIn: 0, totalOut: 0 };
      const qty = g._sum.quantity ?? 0;
      if (g.type === MovementType.IN) entry.totalIn += qty;
      else entry.totalOut += qty;
      perProduct.set(g.productId, entry);
    }
    const topIds = [...perProduct.entries()]
      .sort(
        (a, b) =>
          b[1].totalIn + b[1].totalOut - (a[1].totalIn + a[1].totalOut),
      )
      .slice(0, 10)
      .map(([id]) => id);
    const topDetails = topIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: topIds } },
          select: { id: true, sku: true, name: true, currentStock: true },
        })
      : [];
    const topProducts = topIds.map((id) => {
      const p = topDetails.find((d) => d.id === id);
      const mv = perProduct.get(id) ?? { totalIn: 0, totalOut: 0 };
      return {
        productId: id,
        sku: p?.sku ?? '',
        name: p?.name ?? '',
        totalIn: mv.totalIn,
        totalOut: mv.totalOut,
        // Rotación aproximada: unidades que salieron sobre el stock actual.
        turnoverRate:
          p && p.currentStock > 0 ? mv.totalOut / p.currentStock : 0,
      };
    });

    // --- Tendencia de movimientos (7 días, rellenando días sin movimientos) ---
    const byDay = new Map<string, { totalIn: number; totalOut: number }>();
    for (const m of trendMovements) {
      const key = m.createdAt.toISOString().split('T')[0];
      const entry = byDay.get(key) ?? { totalIn: 0, totalOut: 0 };
      if (m.type === MovementType.IN) entry.totalIn += m.quantity;
      else entry.totalOut += m.quantity;
      byDay.set(key, entry);
    }
    const movementTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(trendStart);
      d.setDate(trendStart.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const entry = byDay.get(key) ?? { totalIn: 0, totalOut: 0 };
      return {
        date: key,
        totalIn: entry.totalIn,
        totalOut: entry.totalOut,
        netChange: entry.totalIn - entry.totalOut,
      };
    });

    return {
      stockValuation,
      lowStockCount,
      outOfStockCount,
      totalMovementsToday,
      totalMovementsThisMonth,
      recentAlerts,
      topProducts,
      categoryDistribution,
      movementTrend,
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
