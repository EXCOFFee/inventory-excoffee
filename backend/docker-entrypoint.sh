#!/bin/sh
# ============================================
# Docker Entrypoint para InventoryPro Backend
# ============================================
# Ejecuta migraciones y seed antes de iniciar la app

set -e

echo "🔄 Esperando a que PostgreSQL esté listo..."
sleep 3

echo "📦 Ejecutando migraciones de Prisma..."
pnpm prisma migrate deploy

echo "🌱 Ejecutando seed de datos..."
pnpm prisma db seed || echo "⚠️ Seed ya ejecutado o no hay cambios"

echo "🚀 Iniciando aplicación..."
exec "$@"
