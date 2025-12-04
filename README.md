# InventoryPro - Sistema de Gestión de Inventarios

Sistema de gestión de inventarios avanzado desarrollado con tecnologías modernas para PyMEs.

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
- pnpm (gestor de paquetes seguro)
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
- ✅ Refresh tokens

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
- ✅ Costos promedio

### Alertas
- ✅ Alertas de bajo stock
- ✅ Alertas de sin stock
- ✅ Notificaciones automáticas
- ✅ Verificación programada (cron)

### Reportes
- ✅ Dashboard con KPIs
- ✅ Valorización de inventario
- ✅ Productos más movidos
- ✅ Análisis de rotación
- 🔄 Exportación (PDF, Excel)

## 📱 Próximas Funcionalidades

- [ ] Aplicación móvil (React Native)
- [ ] Lector de código de barras
- [ ] Integración con e-commerce
- [ ] Multi-almacén
- [ ] Auditoría completa

## 🧪 Testing

```bash
# Backend
cd backend
npm run test
npm run test:e2e

# Frontend
cd frontend
npm run test
```

## 🚀 Deployment

### Producción con Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Variables de Entorno de Producción
Asegúrate de configurar:
- `DATABASE_URL` - URL de PostgreSQL
- `JWT_SECRET` - Secreto para tokens JWT
- `NODE_ENV=production`

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Autores

- **Equipo de Desarrollo** - Trabajo inicial

## 🙏 Agradecimientos

- NestJS Team
- React Team
- Prisma Team
- Tailwind CSS Team
