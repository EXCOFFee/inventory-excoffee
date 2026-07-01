# InventoryPro - Sistema de Gestión de Inventarios

Sistema de gestión de inventarios avanzado desarrollado con tecnologías modernas para PyMEs.

## 🌐 Demo en vivo

- 🖥️ **Frontend:** https://inventorypro.vercel.app  _(reemplazar con la URL real de Vercel)_
- 📡 **API / Swagger:** https://inventorypro-api.onrender.com/api/docs  _(reemplazar con la URL real de Render)_

**Credenciales demo:** `admin@inventorypro.com` / `Admin123!` — o `almacen@inventorypro.com` / `Staff123!`

> ⚡ **Primera carga:** el backend está en el free tier de Render y puede tardar **~30 segundos en despertar** en el primer acceso (la pantalla de login lo avisa). Las siguientes peticiones son instantáneas.

## 🚀 Tecnologías

### Backend
- **NestJS** - Framework de Node.js para aplicaciones escalables
- **TypeScript** - Tipado estático para JavaScript
- **PostgreSQL** - Base de datos relacional
- **Prisma** - ORM moderno para Node.js
- **JWT** - Autenticación basada en tokens
- **Swagger** - Documentación de API
- **2FA** - Autenticación de dos factores (TOTP)

### Frontend
- **React 18** - Biblioteca para interfaces de usuario
- **Vite** - Herramienta de desarrollo rápida
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de CSS utilitario (tema dark/light)
- **React Query** - Manejo de estado del servidor
- **Zustand** - Manejo de estado global
- **React Router** - Enrutamiento
- **Recharts** - Gráficos interactivos

### Infraestructura
- **Docker** - Contenedorización
- **Docker Compose** - Orquestación de contenedores
- **Nginx** - Servidor web para producción

## 📋 Requisitos Previos

- Node.js 18+
- pnpm (rápido y eficiente en disco)
- Docker y Docker Compose

## 🛠️ Inicio Rápido

### Opción 1: Desarrollo Local (Recomendado)

```bash
# 1. Levantar solo PostgreSQL con Docker
docker-compose -f docker-compose.dev.yml up -d

# 2. Instalar dependencias del backend
cd backend
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed

# 3. Iniciar el backend
pnpm run start:dev

# 4. En otra terminal, instalar y ejecutar frontend
cd frontend
pnpm install
pnpm run dev
```

**URLs:**
- 🖥️ Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:3000/api
- 📚 Swagger Docs: http://localhost:3000/api/docs
- 🗄️ Adminer (DB): http://localhost:8080

### Opción 2: Todo con Docker (Producción)

```bash
# Construir y levantar todo
docker-compose up -d --build

# Ver logs
docker-compose logs -f
```

**URLs:**
- 🖥️ Frontend: http://localhost
- 🔌 Backend API: http://localhost:3000/api

## 🔐 Credenciales por Defecto

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | admin@inventorypro.com | Admin123! | ADMIN |
| Staff | almacen@inventorypro.com | Staff123! | STAFF |

> Los usuarios demo del seed **no** tienen 2FA habilitado, así que el login directo funciona sin pasos extra.

## 🔒 Autenticación de dos factores (2FA)

El 2FA (TOTP) es opcional por usuario y, cuando está activo, se **exige** en el login mediante un flujo de dos pasos:

1. `POST /api/auth/login` con email + contraseña. Si el usuario tiene 2FA habilitado, la respuesta **no** incluye el `access_token`: devuelve `{ requires2FA: true, twoFactorToken }` (token efímero de ~5 min que solo sirve para el paso 2).
2. `POST /api/auth/2fa/login` con `{ twoFactorToken, code }` (código de 6 dígitos de la app autenticadora). Si es válido, devuelve el `access_token` de sesión.

Gestión del 2FA (requiere sesión iniciada): `POST /api/auth/2fa/generate` (devuelve QR), `POST /api/auth/2fa/enable`, `POST /api/auth/2fa/disable`, `GET /api/auth/2fa/status`.

## 🛡️ Almacenamiento del token y XSS (decisión consciente)

- **Web:** el JWT se guarda en `localStorage`. Es simple, pero **expuesto a XSS**: un script inyectado podría leerlo. Mitigaciones activas: **Helmet** + **Content-Security-Policy** en el backend (en producción) y validación estricta de entrada.
- **Mobile:** el token se guarda en **`expo-secure-store`** (almacenamiento cifrado del dispositivo), no en un store accesible por JS.
- **Mejora ideal (no implementada a propósito):** mover el token web a una cookie **`httpOnly` + `SameSite=Strict`** emitida por el backend, para que el JavaScript del front no pueda leerla. Es un cambio mayor de la arquitectura de auth (login, interceptores y CORS con credenciales) y se deja documentado como evolución, no como pendiente oculto (ADR-0007 / H-10).

## 📚 Documentación de API

Una vez iniciado el backend, accede a la documentación Swagger:
```
http://localhost:3000/api/docs
```

## 🏗️ Estructura del Proyecto

```
inventory-pro/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Esquema de base de datos
│   │   └── seed.ts            # Datos de prueba
│   ├── src/
│   │   ├── common/            # Módulos compartidos
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   └── prisma/
│   │   ├── modules/
│   │   │   ├── auth/          # Autenticación
│   │   │   ├── users/         # Gestión de usuarios
│   │   │   ├── products/      # Gestión de productos
│   │   │   ├── categories/    # Categorías
│   │   │   ├── suppliers/     # Proveedores
│   │   │   ├── movements/     # Movimientos (Kardex)
│   │   │   ├── reports/       # Reportes y KPIs
│   │   │   └── alerts/        # Alertas de stock
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/               # Servicios de API
│   │   ├── components/
│   │   │   ├── layout/        # Componentes de layout
│   │   │   ├── pages/         # Páginas
│   │   │   └── ui/            # Componentes UI reutilizables
│   │   ├── stores/            # Zustand stores
│   │   ├── types/             # Tipos TypeScript
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🎯 Funcionalidades

### Autenticación y Autorización
- ✅ Login/Logout con JWT
- ✅ Roles (ADMIN, STAFF)
- ✅ Protección de rutas
- ✅ 2FA (TOTP) con login en dos pasos

### Gestión de Productos
- ✅ CRUD completo
- ✅ Categorías y proveedores
- ✅ Búsqueda y filtros
- ✅ Control de stock mínimo/máximo
- ✅ Código de barras/SKU

### Sistema Kardex
- ✅ Registro de entradas
- ✅ Registro de salidas
- ✅ Historial de movimientos
- ✅ Trazabilidad por producto
- ✅ Costo unitario y total por movimiento

### Alertas
- ✅ Alertas de bajo stock
- ✅ Alertas de sin stock
- ✅ Generación automática de alertas (registro en base de datos)
- ✅ Verificación programada (cron)
- 🔄 Notificaciones por email (servicio implementado, integración pendiente)

### Reportes
- ✅ Dashboard con KPIs
- ✅ Valorización de inventario
- ✅ Productos más movidos
- ✅ Análisis de rotación
- 🔄 Exportación (PDF, Excel)

### Aplicación Móvil (React Native + Expo)
- ✅ Login (incluye el flujo 2FA)
- ✅ Escaneo de código de barras (expo-camera)
- ✅ Registro de movimientos (entrada/salida)
- ✅ Consulta de productos y reportes
- ✅ Almacenamiento seguro del token (expo-secure-store)

## 📱 Próximas Funcionalidades

- [ ] Integración con e-commerce
- [ ] Multi-almacén
- [ ] Auditoría completa

## 🧪 Testing

```bash
# Backend
cd backend
pnpm test
pnpm test:e2e

# Frontend
cd frontend
pnpm test:run

# Mobile (smoke test del store)
cd mobile
pnpm test
```

> **Cobertura de CI:** el pipeline de GitHub Actions (`.github/workflows/ci.yml`) corre lint + tests + build de **backend** y **frontend**. La app **mobile** tiene tests (smoke del `authStore`) que se corren localmente, pero **todavía no está cubierta por el CI** — agregar un job `mobile` al pipeline queda como **mejora futura**.

## 🚀 Deployment

Hay dos caminos: **Docker** (self-hosting / local) y **Cloud gratis** (Vercel + Render + Supabase).

### Opción A — Cloud gratis (Vercel + Render + Supabase)

Ideal para una demo pública sin instalar nada. Resumen (guía detallada paso a paso en **[docs/DEPLOY.md](docs/DEPLOY.md)**):

1. **Supabase** (base de datos): crear proyecto y copiar las dos connection strings — *Pooling* (`:6543`, para `DATABASE_URL`) y *Direct* (`:5432`, para `DIRECT_URL`).
2. **Render** (backend): New → Blueprint (detecta `render.yaml`) o Web Service apuntando a `backend/`. Cargar env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`. El deploy corre `migrate deploy` + seed y expone el health check en `/health`.
3. **Vercel** (frontend): Import Project → root `frontend/` (detecta `vercel.json`). Cargar `VITE_API_URL=https://<tu-backend>.onrender.com/api`.
4. **Post-deploy:** actualizar `CORS_ORIGIN` en Render con la URL real de Vercel, y reemplazar los placeholders de "Demo en vivo" de este README.

### Opción B — Producción con Docker (self-hosting)
```bash
docker-compose up -d --build
```

### Variables de Entorno de Producción
Asegúrate de configurar:
- `DATABASE_URL` - URL de PostgreSQL (en Supabase: **pooling**, `:6543`).
- `DIRECT_URL` - Conexión **directa** a PostgreSQL para migraciones (en Supabase: `:5432`). En local, igual a `DATABASE_URL`.
- `JWT_SECRET` - Secreto para tokens JWT. **⚠️ Obligatorio cambiarlo en producción**: no uses el valor de ejemplo de `.env.example` / `docker-compose.yml`. Generá uno fuerte, por ejemplo con `openssl rand -base64 48`.
- `CORS_ORIGIN` - **Obligatorio en producción**: orígenes permitidos separados por comas (no `*`), p. ej. `https://app.midominio.com`. En desarrollo el default es `http://localhost:5173`.
- `NODE_ENV=production`

> Con `NODE_ENV=production`, el backend hace **fail-fast**: no arranca si `JWT_SECRET` falta/es el de ejemplo o si `CORS_ORIGIN` no está definido (ADR-0004).

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Autores

- **EXCOFFee** - Desarrollo y mantenimiento

## 🙏 Agradecimientos

- NestJS Team
- React Team
- Prisma Team
- Tailwind CSS Team
