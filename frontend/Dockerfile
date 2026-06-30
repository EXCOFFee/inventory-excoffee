# ============================================
# Dockerfile para Frontend de InventoryPro
# ============================================
# Multi-stage build: construye con Node, sirve con Nginx

# Stage 1: Construcción
FROM node:20-alpine AS builder

# Instalar pnpm (pinneado a v10: pnpm@latest ya resuelve a v11, que no corre sobre Node 20 de
# node:20-alpine y rompía el build con ERR_UNKNOWN_BUILTIN_MODULE)
RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copiar archivos de dependencias (incluido .npmrc: node-linker=hoisted, igual que en local)
COPY package.json pnpm-lock.yaml .npmrc ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Argumento para la URL de la API (puede sobrescribirse en build)
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

# Construir la aplicación
RUN pnpm run build

# Stage 2: Producción con Nginx
FROM nginx:alpine AS production

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos construidos desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
