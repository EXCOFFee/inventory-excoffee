/**
 * Servicio de Movimientos de Inventario de InventoryPro.
 * 
 * Responsabilidad única: Gestionar la lógica transaccional de movimientos (RF03).
 * 
 * Este servicio implementa el sistema Kardex para trazabilidad completa:
 * - Cada movimiento registra el stock antes y después
 * - Operaciones atómicas usando transacciones de Prisma
 * - Validaciones de negocio (stock suficiente para salidas)
 * 
 * Cumple con los objetivos del SRS:
 * - Integridad del Dato: Transacciones atómicas
 * - Trazabilidad: Registro completo de quién, cuándo y por qué
 * 
 * @class MovementsService
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MovementType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMovementDto, FilterMovementsDto } from './dto';

/**
 * Interface para el usuario autenticado
 */
interface AuthUser {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un movimiento de inventario (entrada o salida).
   * 
   * Esta es la operación más crítica del sistema. Debe garantizar:
   * 1. Atomicidad: Stock y movimiento se actualizan juntos o ninguno
   * 2. Consistencia: No permitir stock negativo
   * 3. Trazabilidad: Registrar stock antes/después y usuario
   * 
   * @param createMovementDto - Datos del movimiento
   * @param user - Usuario autenticado que registra el movimiento
   * @returns Movimiento creado con detalles del producto
   * @throws NotFoundException si el producto no existe
   * @throws BadRequestException si stock insuficiente para salida
   *
   * FLUJO DE VALIDACIÓN (según diagrama de actividades del SRS):
   * 1. Verificar existencia del producto (404) y que esté activo (400)
   * 2. Validar cantidad > 0 (ya validado por DTO)
   * 3. Ejecutar transacción: ajustar stock de forma atómica + crear movimiento
   *
   * CONTROL DE CONCURRENCIA (ADR-0001, opción A — decremento condicional atómico):
   * El patrón anterior leía `currentStock`, calculaba el nuevo valor en JavaScript y lo
   * escribía (read-modify-write). La transacción daba atomicidad (movimiento + stock juntos)
   * pero NO aislamiento: dos salidas simultáneas del mismo producto podían leer el mismo stock
   * inicial y producir una escritura perdida (stock final incorrecto, hasta negativo en
   * términos físicos).
   *
   * La solución: para SALIDAS usamos un `updateMany` condicional
   * (`where: { currentStock: { gte: quantity } }` + `decrement`). La comparación y el
   * decremento ocurren en una sola operación atómica a nivel de base de datos: si dos salidas
   * concurren, la DB serializa el acceso a la fila y solo una puede dejar el stock en un valor
   * válido; la otra afecta `count === 0` y se rechaza con 400. Así la invariante "el stock
   * nunca queda negativo ni se pierden escrituras" la garantiza la DB, no JavaScript.
   *
   * Por qué esta opción y no `Serializable` (opción B) ni `SELECT ... FOR UPDATE` (opción C):
   * para una invariante simple de stock, el decremento condicional es suficiente y evita la
   * complejidad de reintentos por error de serialización o el acoplamiento a SQL crudo y el
   * riesgo de deadlocks. Mantiene el principio KISS (SRS §19).
   *
   * `stockAfter`/`stockBefore` se derivan del valor REALMENTE persistido tras el ajuste, no de
   * la lectura previa, para que el Kardex sea fiel incluso bajo concurrencia.
   */
  async create(createMovementDto: CreateMovementDto, user: AuthUser) {
    const { productId, type, quantity, reason, notes, reference, unitCost } = createMovementDto;

    // ============================================
    // VALIDACIÓN DE EXISTENCIA (404) Y ESTADO (400)
    // ============================================
    // Se mantiene el findUnique previo para distinguir "producto inexistente" (404) de
    // "stock insuficiente" (400): el updateMany condicional por sí solo no puede diferenciar
    // ambos casos (en los dos afectaría count === 0).
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    // Si el producto no existe, retornar 404
    if (!product) {
      throw new NotFoundException(`El producto con ID ${productId} no fue encontrado`);
    }

    // Verificar que el producto está activo
    if (!product.isActive) {
      throw new BadRequestException(`El producto "${product.name}" está desactivado`);
    }

    // Stock disponible leído antes del ajuste (solo para el mensaje de error de stock).
    const availableBefore = product.currentStock;

    // Calcular costo total si se proporciona costo unitario
    const totalCost = unitCost ? unitCost * quantity : null;

    // ============================================
    // OPERACIÓN TRANSACCIONAL ATÓMICA
    // ============================================
    // Atomicidad (ACID): el ajuste de stock y el registro del movimiento ocurren juntos o
    // ninguno. El ajuste de stock usa operaciones atómicas a nivel DB (ver JSDoc).
    const { movement, persistedStock } = await this.prisma.$transaction(async (tx) => {
      let stockAfter: number;
      let stockBefore: number;

      if (type === MovementType.OUT) {
        // Decremento condicional atómico: la DB evalúa el stock suficiente y decrementa en una
        // sola operación. Si no hay stock para esta salida, count === 0 → 400.
        const result = await tx.product.updateMany({
          where: { id: productId, currentStock: { gte: quantity } },
          data: { currentStock: { decrement: quantity } },
        });

        if (result.count === 0) {
          throw new BadRequestException(
            `Stock insuficiente para la salida. ` +
            `Disponible: ${availableBefore}, Solicitado: ${quantity}`
          );
        }

        // Releer el valor realmente persistido (mantenemos el lock de fila hasta el commit, así
        // que esta lectura refleja nuestro propio decremento, no escrituras ajenas).
        const updated = await tx.product.findUnique({
          where: { id: productId },
          select: { currentStock: true },
        });
        stockAfter = updated!.currentStock;
        stockBefore = stockAfter + quantity;
      } else {
        // Entrada (IN): incremento atómico. `update` devuelve el valor persistido.
        const updated = await tx.product.update({
          where: { id: productId },
          data: { currentStock: { increment: quantity } },
          select: { currentStock: true },
        });
        stockAfter = updated.currentStock;
        stockBefore = stockAfter - quantity;
      }

      // Registrar el movimiento (histórico Kardex) con stock antes/después persistidos.
      const newMovement = await tx.movement.create({
        data: {
          productId,
          userId: user.id,
          type,
          quantity,
          reason,
          notes,
          reference,
          unitCost,
          totalCost,
          stockBefore,
          stockAfter,
        },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              currentStock: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return { movement: newMovement, persistedStock: stockAfter };
    });

    // Retornar el movimiento con el stock realmente persistido tras el ajuste atómico.
    return {
      ...movement,
      product: {
        ...movement.product,
        currentStock: persistedStock,
      },
    };
  }

  /**
   * Obtiene movimientos con filtros y paginación.
   * 
   * @param filters - Filtros de búsqueda y paginación
   * @returns Lista paginada de movimientos
   */
  async findAll(filters: FilterMovementsDto) {
    const {
      productId,
      userId,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    // Construir condiciones WHERE
    const where: any = {};

    if (productId) where.productId = productId;
    if (userId) where.userId = userId;
    if (type) where.type = type;

    // Filtro de rango de fechas
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      this.prisma.movement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.movement.count({ where }),
    ]);

    return {
      data: movements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Obtiene un movimiento por ID.
   */
  async findOne(id: string) {
    const movement = await this.prisma.movement.findUnique({
      where: { id },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!movement) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    }

    return movement;
  }

  /**
   * Obtiene el historial de movimientos de un producto (Kardex).
   * 
   * @param productId - ID del producto
   * @returns Lista de movimientos ordenados por fecha
   */
  async getProductHistory(productId: string) {
    // Verificar que el producto existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    const movements = await this.prisma.movement.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        currentStock: product.currentStock,
      },
      movements,
    };
  }

  /**
   * Obtiene resumen de movimientos del día.
   */
  async getDailySummary(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const movements = await this.prisma.movement.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        product: { select: { sku: true, name: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });

    // Calcular totales
    const summary = movements.reduce(
      (acc, mov) => {
        if (mov.type === MovementType.IN) {
          acc.totalEntries++;
          acc.totalQuantityIn += mov.quantity;
          if (mov.totalCost) acc.totalCostIn += Number(mov.totalCost);
        } else {
          acc.totalExits++;
          acc.totalQuantityOut += mov.quantity;
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
      date: startOfDay.toISOString().split('T')[0],
      summary,
      movements,
    };
  }
}
