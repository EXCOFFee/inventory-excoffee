/**
 * Script de Seed para la Base de Datos de InventoryPro
 * 
 * Este script puebla la base de datos con datos iniciales para desarrollo y pruebas.
 * Incluye:
 * - Usuario administrador por defecto
 * - Categorías de ejemplo
 * - Proveedores de ejemplo
 * - Productos de muestra
 * 
 * Ejecutar con: npm run prisma:seed
 */

import { PrismaClient, Role, MovementType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Función principal de seed
 * Crea datos iniciales en orden para respetar las relaciones FK
 */
async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  // Idempotencia: si la base ya tiene productos sembrados, no re-sembrar. Permite que el
  // contenedor reinicie (restart: unless-stopped) sin chocar contra el SKU único de los
  // productos (P2-SEED). Un fallo real sembrando una base vacía sigue propagándose: no se
  // oculta nada (a diferencia del viejo `|| echo` del entrypoint).
  const alreadySeeded = await prisma.product.count();
  if (alreadySeeded > 0) {
    console.log('⏭️  La base ya tiene datos sembrados; se omite el seed (idempotente).\n');
    return;
  }

  // ============================================
  // 1. CREAR USUARIOS
  // ============================================
  console.log('👤 Creando usuarios...');
  
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const staffPassword = await bcrypt.hash('Staff123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@inventorypro.com' },
    update: {},
    create: {
      email: 'admin@inventorypro.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'Principal',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'almacen@inventorypro.com' },
    update: {},
    create: {
      email: 'almacen@inventorypro.com',
      passwordHash: staffPassword,
      firstName: 'Juan',
      lastName: 'Almacenista',
      role: Role.STAFF,
      isActive: true,
    },
  });

  console.log(`  ✅ Admin creado: ${adminUser.email}`);
  console.log(`  ✅ Staff creado: ${staffUser.email}\n`);

  // ============================================
  // 2. CREAR CATEGORÍAS
  // ============================================
  console.log('📁 Creando categorías...');

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electrónica' },
      update: {},
      create: {
        name: 'Electrónica',
        description: 'Dispositivos electrónicos y accesorios',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Ropa' },
      update: {},
      create: {
        name: 'Ropa',
        description: 'Prendas de vestir y accesorios de moda',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Alimentos' },
      update: {},
      create: {
        name: 'Alimentos',
        description: 'Productos alimenticios y bebidas',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Hogar' },
      update: {},
      create: {
        name: 'Hogar',
        description: 'Artículos para el hogar y decoración',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Oficina' },
      update: {},
      create: {
        name: 'Oficina',
        description: 'Material y equipo de oficina',
      },
    }),
  ]);

  console.log(`  ✅ ${categories.length} categorías creadas\n`);

  // ============================================
  // 3. CREAR PROVEEDORES
  // ============================================
  console.log('🏢 Creando proveedores...');

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Tech Distribuciones S.A.',
        email: 'ventas@techdist.com',
        phone: '+1234567890',
        address: 'Av. Tecnología 123, Ciudad Tech',
        contactName: 'María García',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Textiles del Norte',
        email: 'pedidos@textilesnorte.com',
        phone: '+0987654321',
        address: 'Calle Industria 456, Zona Industrial',
        contactName: 'Carlos López',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Distribuidora Alimentos SA',
        email: 'compras@distalimentos.com',
        phone: '+1122334455',
        address: 'Boulevard Comercial 789',
        contactName: 'Ana Martínez',
      },
    }),
  ]);

  console.log(`  ✅ ${suppliers.length} proveedores creados\n`);

  // ============================================
  // 4. CREAR PRODUCTOS
  // ============================================
  console.log('📦 Creando productos...');

  const products = await Promise.all([
    // Productos de Electrónica
    prisma.product.create({
      data: {
        sku: 'ELEC-001',
        name: 'Laptop HP 15.6"',
        description: 'Laptop HP con procesador Intel Core i5, 8GB RAM, 256GB SSD',
        price: 799.99,
        cost: 600.00,
        currentStock: 25,
        minStock: 5,
        maxStock: 50,
        barcode: '7501234567890',
        categoryId: categories[0].id,
        supplierId: suppliers[0].id,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'ELEC-002',
        name: 'Mouse Inalámbrico Logitech',
        description: 'Mouse inalámbrico ergonómico con receptor USB',
        price: 29.99,
        cost: 15.00,
        currentStock: 100,
        minStock: 20,
        maxStock: 200,
        barcode: '7501234567891',
        categoryId: categories[0].id,
        supplierId: suppliers[0].id,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'ELEC-003',
        name: 'Teclado Mecánico RGB',
        description: 'Teclado mecánico gaming con iluminación RGB',
        price: 89.99,
        cost: 45.00,
        currentStock: 3, // Stock bajo para probar alertas
        minStock: 10,
        maxStock: 80,
        barcode: '7501234567892',
        categoryId: categories[0].id,
        supplierId: suppliers[0].id,
      },
    }),
    // Productos de Ropa
    prisma.product.create({
      data: {
        sku: 'ROPA-001',
        name: 'Camiseta Básica Algodón',
        description: 'Camiseta de algodón 100%, varios colores',
        price: 19.99,
        cost: 8.00,
        currentStock: 200,
        minStock: 30,
        maxStock: 500,
        barcode: '7501234567893',
        categoryId: categories[1].id,
        supplierId: suppliers[1].id,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'ROPA-002',
        name: 'Jeans Slim Fit',
        description: 'Pantalón de mezclilla corte slim',
        price: 49.99,
        cost: 22.00,
        currentStock: 75,
        minStock: 15,
        maxStock: 150,
        barcode: '7501234567894',
        categoryId: categories[1].id,
        supplierId: suppliers[1].id,
      },
    }),
    // Productos de Oficina
    prisma.product.create({
      data: {
        sku: 'OFIC-001',
        name: 'Resma Papel A4 500 hojas',
        description: 'Papel bond tamaño carta, 75g/m²',
        price: 5.99,
        cost: 3.50,
        currentStock: 500,
        minStock: 50,
        maxStock: 1000,
        barcode: '7501234567895',
        categoryId: categories[4].id,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'OFIC-002',
        name: 'Bolígrafos Caja x12',
        description: 'Caja de bolígrafos azules punto medio',
        price: 8.99,
        cost: 4.00,
        currentStock: 2, // Stock bajo
        minStock: 20,
        maxStock: 200,
        barcode: '7501234567896',
        categoryId: categories[4].id,
      },
    }),
  ]);

  console.log(`  ✅ ${products.length} productos creados\n`);

  // ============================================
  // 5. CREAR MOVIMIENTOS DE EJEMPLO
  // ============================================
  console.log('📊 Creando movimientos de ejemplo...');

  const movements = await Promise.all([
    // Entrada inicial de laptop
    prisma.movement.create({
      data: {
        type: MovementType.IN,
        quantity: 30,
        reason: 'Compra inicial de inventario',
        reference: 'OC-2024-001',
        unitCost: 600.00,
        totalCost: 18000.00,
        stockBefore: 0,
        stockAfter: 30,
        productId: products[0].id,
        userId: adminUser.id,
      },
    }),
    // Salida de laptop por venta
    prisma.movement.create({
      data: {
        type: MovementType.OUT,
        quantity: 5,
        reason: 'Venta a cliente corporativo',
        reference: 'VTA-2024-001',
        stockBefore: 30,
        stockAfter: 25,
        productId: products[0].id,
        userId: staffUser.id,
      },
    }),
    // Entrada de mouse
    prisma.movement.create({
      data: {
        type: MovementType.IN,
        quantity: 100,
        reason: 'Reposición de stock',
        reference: 'OC-2024-002',
        unitCost: 15.00,
        totalCost: 1500.00,
        stockBefore: 0,
        stockAfter: 100,
        productId: products[1].id,
        userId: adminUser.id,
      },
    }),
  ]);

  console.log(`  ✅ ${movements.length} movimientos creados\n`);

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('========================================');
  console.log('✅ Seed completado exitosamente!');
  console.log('========================================');
  console.log('\n📋 Credenciales de acceso:');
  console.log('  Admin: admin@inventorypro.com / Admin123!');
  console.log('  Staff: almacen@inventorypro.com / Staff123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
