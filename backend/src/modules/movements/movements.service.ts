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
   * 1. Verificar existencia del producto
   * 2. Validar cantidad > 0 (ya validado por DTO)
   * 3. Si es salida, verificar stock suficiente
   * 4. Ejecutar transacción: crear movimiento + actualizar stock
   */
  async create(createMovementDto: CreateMovementDto, user: AuthUser) {
    const { productId, type, quantity, reason, notes, reference, unitCost } = createMovementDto;

    // ============================================
    // VALIDACIÓN DE EXISTENCIA
    // ============================================
    // Buscar el producto para obtener el stock actual
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

    // ============================================
    // LÓGICA DE NEGOCIO: CÁLCULO DE NUEVO STOCK
    // ============================================
    const stockBefore = product.currentStock;
    let stockAfter: number;

    if (type === MovementType.OUT) {
      // REGLA CRÍTICA: No permitir stock negativo
      // Por qué: Un inventario inexacto genera pérdidas según el SRS
      if (product.currentStock < quantity) {
        throw new BadRequestException(
          `Stock insuficiente para la salida. ` +
          `Disponible: ${product.currentStock}, Solicitado: ${quantity}`
        );
      }
      stockAfter = stockBefore - quantity;
    } else {
      // Movimiento de entrada (IN)
      stockAfter = stockBefore + quantity;
    }

    // Calcular costo total si se proporciona costo unitario
    const totalCost = unitCost ? unitCost * quantity : null;

    // ============================================
    // OPERACIÓN TRANSACCIONAL
    // ============================================
    // Usar transacción de Prisma para garantizar atomicidad (ACID)
    // Si falla cualquier operación, ambas se revierten
    const movement = await this.prisma.$transaction(async (tx) => {
      // 1. Crear el registro del movimiento (histórico Kardex)
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

      // 2. Actualizar el stock del producto
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: stockAfter },
      });

      return newMovement;
    });

    // Retornar el movimiento con stock actualizado
    return {
      ...movement,
      product: {
        ...movement.product,
        currentStock: stockAfter, // Stock actualizado
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
