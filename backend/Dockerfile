# ============================================
# Dockerfile para Backend de InventoryPro
# ============================================
# Multi-stage build para optimizar el tamaño de la imagen

# Stage 1: Construcción
FROM node:20-alpine AS builder

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Instalar todas las dependencias (incluyendo devDependencies)
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Generar cliente de Prisma
RUN pnpm prisma generate

# Compilar TypeScript
RUN pnpm run build

# Stage 2: Producción
FROM node:20-alpine AS production

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Instalar solo dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Generar cliente de Prisma
RUN pnpm prisma generate

# Copiar archivos compilados desde el builder
COPY --from=builder /app/dist ./dist

# Copiar script de inicio
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Exponer el puerto de la API
EXPOSE 3000

# Usar el script de entrada que ejecuta migraciones
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
