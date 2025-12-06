# InventoryPro Mobile

Aplicación móvil de InventoryPro desarrollada con React Native y Expo.

## 📱 Características

- **Autenticación**: Login con soporte para 2FA
- **Dashboard**: Vista general del inventario
- **Productos**: Listado, búsqueda y gestión de productos
- **Escáner**: Escaneo de códigos de barras con cámara
- **Movimientos**: Registro de entradas y salidas
- **Perfil**: Configuración del usuario

## 🛠️ Tecnologías

- **React Native** con Expo SDK 52
- **Expo Router** para navegación
- **NativeWind** (Tailwind CSS) para estilos
- **Zustand** para estado global
- **React Query** para fetching de datos
- **Expo Camera** para escáner de códigos

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- pnpm
- Expo Go app (para pruebas en dispositivo)
- Backend corriendo en `localhost:3000`

### Instalación

```bash
# Instalar dependencias
pnpm install

# Copiar archivo de entorno
cp .env.example .env
```

### Configuración del Entorno

Edita `.env` con la URL de tu backend:

```env
# iOS Simulator
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# Dispositivo físico (usa tu IP local)
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
pnpm start

# iOS Simulator
pnpm ios

# Android Emulator
pnpm android
```

## 📂 Estructura del Proyecto

```
mobile/
├── app/                    # Pantallas (Expo Router)
│   ├── (auth)/            # Pantallas de autenticación
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── two-factor.tsx
│   ├── (tabs)/            # Tabs principales
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # Dashboard
│   │   ├── products.tsx
│   │   ├── scan.tsx
│   │   ├── movements.tsx
│   │   └── profile.tsx
│   ├── _layout.tsx        # Layout raíz
│   ├── index.tsx          # Entry point
│   ├── product-form.tsx   # Crear/editar producto
│   ├── product-detail.tsx # Detalle producto
│   └── movement-form.tsx  # Crear movimiento
├── src/
│   ├── api/               # Servicios API
│   │   ├── client.ts
│   │   ├── auth.service.ts
│   │   ├── products.service.ts
│   │   ├── movements.service.ts
│   │   └── reports.service.ts
│   ├── stores/            # Zustand stores
│   │   └── authStore.ts
│   ├── config/            # Configuración
│   │   └── constants.ts
│   └── utils/             # Utilidades
│       └── formatters.ts
├── global.css             # Estilos globales Tailwind
├── tailwind.config.js     # Configuración Tailwind
├── app.json               # Configuración Expo
└── package.json
```

## 🎨 Tema

La app usa un tema oscuro glassmorphism consistente con la versión web:

- **Primary**: #0080ff (azul)
- **Background**: #0a0a10 a #1e1e2e (gradiente oscuro)
- **Success**: #10b981 (verde)
- **Warning**: #f59e0b (amarillo)
- **Danger**: #ef4444 (rojo)

## 📱 Capturas de Pantalla

### Login
Dark theme con glassmorphism, soporte para 2FA.

### Dashboard
KPIs principales, gráficos de stock, actividad reciente.

### Productos
Lista con búsqueda, filtro de stock bajo, FAB para crear.

### Escáner
Escaneo de códigos de barras con overlay visual.

### Movimientos
Registro de entradas/salidas con tipos visuales.

## 🔐 Autenticación

La app usa JWT almacenados en `expo-secure-store`:

1. Login con email/password
2. Si 2FA está habilitado, redirige a pantalla de código
3. Token se almacena de forma segura
4. Refresh automático de tokens

## 📦 Build de Producción

```bash
# Build para iOS
eas build --platform ios

# Build para Android
eas build --platform android
```

## 🐛 Troubleshooting

### Error de conexión a API
- Verifica que el backend esté corriendo
- Verifica la URL en `.env`
- Para Android emulator, usa `10.0.2.2` en lugar de `localhost`
- Para dispositivo físico, usa la IP de tu computadora

### Expo Go no carga
- Verifica que estés en la misma red WiFi
- Reinicia el servidor con `pnpm start --clear`

### Cámara no funciona
- Acepta los permisos de cámara en el dispositivo
- La cámara solo funciona en dispositivo físico o emulador con cámara

## 📄 Licencia

MIT - Ver archivo LICENSE en el proyecto raíz.
