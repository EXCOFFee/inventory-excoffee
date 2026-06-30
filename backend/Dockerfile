# ============================================
# Dockerfile para Backend de InventoryPro
# ============================================
# Multi-stage build para optimizar el tamaño de la imagen

# Stage 1: Construcción
FROM node:20-alpine AS builder

# Instalar pnpm (pinneado a la v10 del proyecto: pnpm@latest ya resuelve a v11, que NO corre
# sobre Node 20 de node:20-alpine y rompía el build con ERR_UNKNOWN_BUILTIN_MODULE)
RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Instalar todas las dependencias (incluyendo devDependencies)
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Generar cliente de Prisma (necesita DATABASE_URL aunque no se conecte)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm prisma generate

# Compilar TypeScript
RUN pnpm run build

# Precompilar el seed a JS (la imagen de producción se instala con --prod y NO tiene ts-node,
# que es devDependency). Sin esto el seed falla en producción y la demo arranca sin usuarios
# (H-13). Se compila como archivo suelto para no arrastrar la config del proyecto.
RUN npx tsc prisma/seed.ts --module commonjs --target ES2021 --moduleResolution node --esModuleInterop --skipLibCheck --resolveJsonModule

# Stage 2: Producción
FROM node:20-alpine AS production

# Instalar pnpm (pinneado a la v10 del proyecto: pnpm@latest ya resuelve a v11, que NO corre
# sobre Node 20 de node:20-alpine y rompía el build con ERR_UNKNOWN_BUILTIN_MODULE)
RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Instalar solo dependencias de producción + prisma CLI para migraciones
RUN pnpm install --frozen-lockfile --prod && pnpm add prisma

# Copiar el cliente Prisma generado desde el builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copiar archivos compilados desde el builder
COPY --from=builder /app/dist ./dist

# Copiar el seed precompilado (la imagen de producción no tiene ts-node)
COPY --from=builder /app/prisma/seed.js ./prisma/seed.js

# Copiar script de inicio
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Exponer el puerto de la API
EXPOSE 3000

# Usar el script de entrada que ejecuta migraciones
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
