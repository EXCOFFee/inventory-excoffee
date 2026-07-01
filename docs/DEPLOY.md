# 🚀 Guía de deploy — InventoryPro (Vercel + Render + Supabase)

Guía paso a paso para publicar la app **gratis** y que cualquiera pueda probarla sin instalar nada.

- **Supabase** → base de datos PostgreSQL.
- **Render** → backend (NestJS API).
- **Vercel** → frontend (React/Vite).

> ⏱️ Toma ~20–30 min la primera vez. No necesitás tarjeta de crédito en ningún plan free.

---

## 📋 Orden recomendado (importante)

Hay una dependencia circular de URLs: el backend necesita la URL del frontend (para CORS) y el
frontend necesita la URL del backend (para las llamadas). Se resuelve así:

1. **Supabase** primero (para tener las URLs de la base).
2. **Render** (backend): en `CORS_ORIGIN` poné ya la URL que **vas a usar** en Vercel
   (es predecible: `https://<nombre-proyecto>.vercel.app`).
3. **Vercel** (frontend): con `VITE_API_URL` = URL de Render.
4. **Post-deploy:** si la URL real de Vercel quedó distinta, corregí `CORS_ORIGIN` en Render.

---

## 1) 🗄️ Supabase (base de datos)

1. Entrá a https://supabase.com → **New project**. Elegí nombre, una **Database Password** fuerte
   (guardala) y una región cercana.
2. Esperá ~2 min a que se cree.
3. **Project Settings** (engranaje) → **Database** → sección **Connection string** → pestaña **URI**.
   Vas a copiar **dos** cadenas:
   - **Pooling / Transaction** (host `...pooler.supabase.com`, puerto **`6543`**) → será tu `DATABASE_URL`.
     Agregá al final `?pgbouncer=true` si no lo trae.
   - **Direct connection** (puerto **`5432`**) → será tu `DIRECT_URL`.
4. En ambas, reemplazá `[YOUR-PASSWORD]` por la Database Password del paso 1.

   Ejemplos (los tuyos van con tu host/usuario reales):
   ```
   DATABASE_URL=postgresql://postgres.abcdxyz:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres.abcdxyz:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
   > 💡 Por qué dos: Prisma Migrate **no** puede correr a través del pooler (pgBouncer). Usa
   > `DIRECT_URL` (5432) para migrar y `DATABASE_URL` (6543) para el runtime de la app.

No hace falta crear tablas a mano: Render corre las migraciones y el seed en el primer deploy.

---

## 2) 🖥️ Render (backend / API)

1. Entrá a https://render.com → **New +** → **Blueprint** (detecta el `render.yaml` del repo)
   y conectá tu repo de GitHub. *(Si preferís, New + → **Web Service** y elegí el repo; Render igual
   lee `render.yaml`.)*
2. Render detecta el servicio `inventorypro-api` (root `backend/`, plan **free**, health check `/health`).
3. En **Environment** cargá estas variables (las marcadas `sync:false` NO están en el repo, se cargan acá):

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | La de **pooling** (`:6543`) de Supabase |
   | `DIRECT_URL` | La **directa** (`:5432`) de Supabase |
   | `JWT_SECRET` | Un secreto fuerte y único: `openssl rand -base64 48` |
   | `CORS_ORIGIN` | La URL que vas a usar en Vercel, p. ej. `https://inventorypro.vercel.app` (sin `/` final) |
   | `NODE_ENV` | `production` (ya viene en render.yaml) |
   | `PORT` | `3000` (ya viene en render.yaml) |

4. **Create / Deploy.** El primer deploy:
   - `buildCommand`: instala deps (pnpm 10) + `prisma generate` + compila.
   - `startCommand`: `prisma migrate deploy` (crea las tablas en Supabase) + **seed** (usuarios demo) + arranca la API.
5. Cuando termine, copiá la URL del servicio: `https://inventorypro-api.onrender.com` (la tuya).
   - Verificá el health: abrí `https://<tu-api>.onrender.com/health` → debe responder `{"status":"ok"}`.
   - Swagger: `https://<tu-api>.onrender.com/api/docs`.

> ⚠️ El backend hace **fail-fast**: si `CORS_ORIGIN` o `JWT_SECRET` faltan (o `JWT_SECRET` es el de
> ejemplo), **no arranca**. Si el deploy falla al iniciar, revisá esas dos variables en los logs.

---

## 3) ▲ Vercel (frontend)

1. Entrá a https://vercel.com → **Add New… → Project** → importá tu repo de GitHub.
2. En **Root Directory** elegí **`frontend`** (importante: no la raíz). Vercel detecta Vite y lee
   `frontend/vercel.json`.
3. En **Environment Variables** agregá:

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | `https://<tu-api>.onrender.com/api` (la URL de Render del paso 2, **con `/api` al final**) |

4. **Deploy.** Al terminar, tu frontend queda en `https://<nombre-proyecto>.vercel.app`.

---

## 4) 🔗 Post-deploy (conectar las puntas)

1. **CORS:** si la URL real de Vercel quedó distinta a la que pusiste en `CORS_ORIGIN` (paso 2),
   corregíla en Render → Environment → `CORS_ORIGIN` = URL real de Vercel → **Save** (redeploya solo).
   - Podés poner varias separadas por coma: `https://inventorypro.vercel.app,https://inventorypro-git-main-tu-user.vercel.app`.
2. **Probar:** abrí la URL de Vercel y logueate con `admin@inventorypro.com` / `Admin123!`.
   - El primer login puede tardar ~30s (Render despierta); la pantalla lo avisa.
3. **Actualizar el README:** reemplazá los placeholders de la sección "🌐 Demo en vivo" con las URLs
   reales de Vercel y Render.

---

## 🩺 Troubleshooting

- **El login tarda ~30s la primera vez:** normal, es el free tier de Render "despertando". Las
  siguientes peticiones son instantáneas.
- **Error de CORS en el navegador** (bloqueado por política): `CORS_ORIGIN` en Render no coincide
  **exactamente** con la URL de Vercel (revisá `https`, sin `/` final, subdominio correcto). Corregí y redeploy.
- **El backend no arranca / crashea al iniciar:** casi siempre `JWT_SECRET` o `CORS_ORIGIN` sin
  setear (fail-fast). Revisá los logs de Render.
- **Falla `migrate deploy`:** verificá que `DIRECT_URL` sea la conexión **directa** (`:5432`), no la
  de pooling. Migrate no funciona por pgBouncer.
- **La demo no tiene usuarios:** el seed corre en el `startCommand`; revisá en los logs de Render que
  aparezca "Seed completado" (o "se omite el seed" si ya había datos).
- **Falla el build en Vercel por versión de pnpm/Node:** en Vercel → Settings → General, fijá Node 20
  (o agregá `"packageManager": "pnpm@10.x"` en `frontend/package.json`).

---

## 🔁 Actualizaciones futuras

Cada `git push` a `main` re-despliega automáticamente en Render y Vercel (si dejaste el auto-deploy
activado). Las migraciones nuevas se aplican solas en el `startCommand` de Render.
