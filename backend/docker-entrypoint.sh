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
# Se ejecuta el seed precompilado a JS (la imagen de producción no tiene ts-node).
# El seed usa upsert (idempotente), así que reiniciar el contenedor es seguro.
# Sin el "|| echo" anterior: si el seed falla de verdad, el arranque falla de forma visible
# en vez de dejar la demo sin usuarios silenciosamente (H-13).
node prisma/seed.js

echo "🚀 Iniciando aplicación..."
exec "$@"
