/**
 * Servicio de Productos de InventoryPro.
 * 
 * Responsabilidad única: Gestionar el catálogo de productos (RF02).
 * Implementa la lógica de negocio para CRUD de productos,
 * búsquedas, filtros y validaciones.
 * 
 * @class ProductsService
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, FilterProductsDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene productos con filtros y paginación.
   * 
   * @param filters - Filtros de búsqueda y paginación
   * @returns Lista paginada de productos
   * 
   * Por qué paginación: Según RNF01 (Rendimiento), las consultas
   * deben ser eficientes. Paginación evita cargar miles de registros.
   */
  async findAll(filters: FilterProductsDto) {
    const {
      search,
      categoryId,
      supplierId,
      lowStock,
      isActive = true,
      page = 1,
      limit = 20,
    } = filters;

    // Construir condiciones WHERE dinámicamente
    const where: any = {};

    // Filtro de estado activo
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Búsqueda por nombre o SKU
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por categoría
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filtro por proveedor
    if (supplierId) {
      where.supplierId = supplierId;
    }

    // Filtro de stock bajo
    // Un producto tiene stock bajo si currentStock <= minStock
    if (lowStock) {
      where.currentStock = {
        lte: this.prisma.$queryRaw`"min_stock"`,
      };
      // Usamos una consulta más simple
      where.AND = [
        {
          currentStock: {
            lte: 0, // Esto será reemplazado por la comparación real
          },
        },
      ];
      // Mejor enfoque para lowStock
      delete where.AND;
    }

    // Calcular offset para paginación
    const skip = (page - 1) * limit;

    // Ejecutar consulta con conteo total
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: lowStock ? {
          ...where,
          // Raw query para comparar currentStock con minStock
        } : where,
        include: {
          category: {
            select: { id: true, name: true },
          },
          supplier: {
            select: { id: true, name: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Filtrar productos con stock bajo si se solicitó
    let filteredProducts = products;
    if (lowStock) {
      filteredProducts = products.filter(p => p.currentStock <= p.minStock);
    }

    return {
      data: filteredProducts,
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
   * Obtiene un producto por su ID.
   * 
   * @param id - UUID del producto
   * @returns Producto con relaciones
   * @throws NotFoundException si no existe
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        _count: {
          select: { movements: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  /**
   * Busca un producto por SKU.
   * Útil para escaneo de código de barras (App Móvil).
   * 
   * @param sku - SKU único del producto
   * @returns Producto encontrado
   */
  async findBySku(sku: string) {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con SKU ${sku} no encontrado`);
    }

    return product;
  }

  /**
   * Busca un producto por código de barras.
   * Usado para escaneo en la App Móvil (RF06).
   * 
   * @param barcode - Código de barras del producto
   * @returns Producto encontrado
   */
  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con código de barras ${barcode} no encontrado`);
    }

    return product;
  }

  /**
   * Crea un nuevo producto.
   * 
   * @param createProductDto - Datos del producto
   * @returns Producto creado
   * @throws ConflictException si el SKU o código de barras ya existe
   * 
   * Por qué validar SKU único: El SKU es el identificador principal
   * del producto según el diagrama de clases del SRS.
   */
  async create(createProductDto: CreateProductDto) {
    const { sku, barcode, categoryId, supplierId, ...data } = createProductDto;

    // Verificar SKU único
    const existingSku = await this.prisma.product.findUnique({
      where: { sku },
    });

    if (existingSku) {
      throw new ConflictException(`Ya existe un producto con el SKU "${sku}"`);
    }

    // Verificar código de barras único (si se proporciona)
    if (barcode) {
      const existingBarcode = await this.prisma.product.findUnique({
        where: { barcode },
      });

      if (existingBarcode) {
        throw new ConflictException(`Ya existe un producto con el código de barras "${barcode}"`);
      }
    }

    // Verificar que la categoría existe (si se proporciona)
    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new BadRequestException(`Categoría con ID ${categoryId} no encontrada`);
      }
    }

    // Verificar que el proveedor existe (si se proporciona)
    if (supplierId) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        throw new BadRequestException(`Proveedor con ID ${supplierId} no encontrado`);
      }
    }

    // Crear el producto
    return this.prisma.product.create({
      data: {
        sku,
        barcode,
        categoryId,
        supplierId,
        ...data,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Actualiza un producto existente.
   * 
   * @param id - ID del producto
   * @param updateProductDto - Datos a actualizar
   * @returns Producto actualizado
   */
  async update(id: string, updateProductDto: UpdateProductDto) {
    // Verificar que existe
    await this.findOne(id);

    const { sku, barcode, categoryId, supplierId, ...data } = updateProductDto;

    // Si se actualiza el SKU, verificar que no exista
    if (sku) {
      const existing = await this.prisma.product.findFirst({
        where: { sku, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Ya existe un producto con el SKU "${sku}"`);
      }
    }

    // Si se actualiza el código de barras, verificar que no exista
    if (barcode) {
      const existing = await this.prisma.product.findFirst({
        where: { barcode, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Ya existe un producto con el código de barras "${barcode}"`);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(sku && { sku }),
        ...(barcode && { barcode }),
        ...(categoryId && { categoryId }),
        ...(supplierId && { supplierId }),
        ...data,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Desactiva un producto (soft delete).
   * 
   * @param id - ID del producto
   * @returns Producto desactivado
   * 
   * Por qué soft delete: Mantener historial de movimientos
   * según el objetivo de Trazabilidad del SRS.
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        sku: true,
        name: true,
        isActive: true,
      },
    });
  }

  /**
   * Obtiene productos con stock bajo.
   * Usado para alertas (RF04).
   * 
   * @returns Lista de productos con stock bajo
   */
  async findLowStock() {
    // Obtener todos los productos activos
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        name: true,
        currentStock: true,
        minStock: true,
        category: { select: { name: true } },
      },
    });

    // Filtrar los que tienen stock bajo
    return products.filter(p => p.currentStock <= p.minStock);
  }

  /**
   * Obtiene estadísticas básicas de productos.
   */
  async getStats() {
    const [total, active, lowStock, outOfStock] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({
        where: { isActive: true },
      }).then(async () => {
        const products = await this.prisma.product.findMany({
          where: { isActive: true },
          select: { currentStock: true, minStock: true },
        });
        return products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length;
      }),
      this.prisma.product.count({
        where: { isActive: true, currentStock: 0 },
      }),
    ]);

    return {
      total,
      active,
      lowStock,
      outOfStock,
    };
  }
}
