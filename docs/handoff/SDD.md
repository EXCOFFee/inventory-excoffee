# SDD.md — Software Design Document & Auditoría Remediada

**Proyecto:** InventoryPro (repo `inventory-excoffee`)
**Propósito de este documento:** Servir como fuente única de verdad para el agente de IA
que va a remediar los hallazgos de la auditoría. Documenta el estado actual, el problema,
la causa raíz, el estado objetivo y el criterio de verificación de cada hallazgo.
**Audiencia:** Agente Claude Code (implementador) + revisor humano.
**Alcance:** Backend (NestJS/Prisma), Frontend (React), Mobile (React Native), Docker, tests,
README, alineación SRS↔código. **Auditoría exhaustiva: backend + frontend + mobile + infra.**

> **Nota de versión:** Este SDD fue ampliado tras una segunda pasada que cubrió frontend,
> mobile, tests e infraestructura (hallazgos H-08 a H-13). La primera pasada cubría solo el
> núcleo crítico del backend (H-01 a H-07). H-14 se añadió durante la ejecución de las
> tareas P0, al descubrirse deuda preexistente en la configuración de lint. **H-15, H-16 y H-17
> se añadieron durante una auditoría de contrato frontend↔backend posterior al deploy cloud, al
> encontrar el mismo patrón de H-08 replicado en otros módulos (updates, reportes y el dashboard
> completo).**

---

## 1. Arquitectura (estado actual, validado)

InventoryPro es un **monolito modular** NestJS organizado en módulos de dominio
(`auth`, `users`, `products`, `categories`, `suppliers`, `movements`, `reports`, `alerts`)
sobre PostgreSQL vía Prisma. El flujo sigue tres capas: `Controller → Service → Repository`
(el "repository" aquí es `PrismaService`).

```
Cliente (Web React / Mobile RN)
        │  JSON/HTTPS
        ▼
[ Controller ]  ── valida DTO (class-validator) ── @UseGuards(JwtAuthGuard, RolesGuard)
        │
        ▼
[ Service ]     ── lógica de negocio + reglas + transacciones
        │
        ▼
[ PrismaService ] ── PostgreSQL (ACID)
```

**Puntos fuertes confirmados (NO tocar):**
- Separación de capas limpia y consistente en todos los módulos.
- `ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true`.
- Helmet + Throttler (rate limiting multi-ventana) configurados en `main.ts`/`app.module.ts`.
- `JwtStrategy.validate` revalida el usuario contra la DB en cada request (rechaza usuarios
  desactivados aunque el token siga vigente). Esto está muy bien.
- Schema con índices correctos, incluido `@@index([currentStock])`.
- Entidad `Movement` guarda `stockBefore` y `stockAfter` → auditoría Kardex sólida.
- Tests existentes cubren casos de borde reales (stock insuficiente, producto inactivo, 404).
- CI con jobs separados (lint, test, build, security audit, docker build).

---

## 2. Hallazgos de auditoría (lo que está mal)

Cada hallazgo tiene: **QUÉ** (síntoma), **POR QUÉ importa**, **CÓMO** (causa raíz y fix),
y **VERIFICACIÓN**. La decisión de diseño de cada fix vive en el ADR referenciado.

---

### H-01 🔴 CRÍTICO — Race condition en el registro de movimientos
**Archivo:** `backend/src/modules/movements/movements.service.ts`, método `create()`.
**Ref:** ADR-0001 · contrato `contracts/movements.openapi.yaml` · TASKS P0-1.

**QUÉ.** El método lee `product.currentStock`, calcula `stockAfter` en JavaScript, y luego
escribe ese valor con un `update`. La transacción de Prisma garantiza que el `create` del
movimiento y el `update` del stock pasen juntos (atomicidad), pero **no** protege contra dos
operaciones concurrentes que lean el mismo stock inicial.

**POR QUÉ importa.** Es el objetivo #1 declarado por el propio SRS ("Integridad del Dato").
Escenario de fallo: dos salidas simultáneas del producto X (stock=10, quantity=5 c/u). Ambas
leen 10, ambas calculan 5, el resultado final es 5 cuando debería ser 0 → se vendió stock
inexistente. Este es exactamente el tipo de bug que un revisor técnico senior busca.

**CÓMO (causa raíz).** Patrón *read-modify-write* sin aislamiento contra concurrencia. No se
usa decremento atómico, ni `isolationLevel`, ni lock de fila.

**Fix decidido (ADR-0001, opción A — decremento condicional atómico):**
- Para salidas (`OUT`): dentro de la transacción, reemplazar el `update` por un `updateMany`
  con `where: { id: productId, currentStock: { gte: quantity } }` y `data` que decrementa.
  Si el resultado afectó `count === 0`, lanzar `BadRequestException` de stock insuficiente
  (la condición de carrera ya no es posible: la DB decide atómicamente).
- Para entradas (`IN`): usar `update` con `currentStock: { increment: quantity }`.
- Recalcular `stockAfter` a partir del valor realmente persistido, no del leído antes.
- Mantener el registro de `stockBefore`/`stockAfter` para el Kardex.
- Dejar JSDoc explicando **por qué** decremento condicional atómico en vez de
  `Serializable` (menor complejidad, sin reintentos, suficiente para esta invariante).

**VERIFICACIÓN.**
- Test unitario existente de "insufficient stock" sigue pasando.
- Nuevo test: simular dos llamadas concurrentes a `create` (OUT) sobre el mismo producto y
  verificar que la suma de stock nunca queda negativa y que una de las dos falla.
- `pnpm test` y `pnpm build` verdes.

---

### H-02 🔴 CRÍTICO — El 2FA es decorativo (no se exige en el login)
**Archivos:** `backend/src/modules/auth/auth.service.ts` (`login`),
`backend/src/modules/auth/auth.controller.ts`, `two-factor.service.ts`.
**Ref:** ADR-0002 · contrato `contracts/auth-2fa.openapi.yaml` · TASKS P0-2.

**QUÉ.** Existen schema (`twoFactorSecret`, `twoFactorEnabled`), endpoints
(`/2fa/generate|enable|disable|status`) y un `TwoFactorService` completo con
`validateTwoFactorToken`. Pero `auth.service.login()` **nunca** llama a esa validación. Un
usuario con 2FA activo se loguea solo con email + password.

**POR QUÉ importa.** El README lista 2FA como feature ✅. Un reclutador que abra
`auth.service.ts` ve una feature de seguridad presentada como completa pero a medias →
bandera roja de credibilidad.

**CÓMO (causa raíz).** Falta el segundo paso del flujo de login. El método de verificación
TOTP existe pero está huérfano.

**Fix decidido (ADR-0002, login en dos pasos):**
1. `login(email, password)`:
   - Si el usuario **no** tiene 2FA: comportamiento actual (devuelve `access_token`).
   - Si el usuario **tiene** 2FA: NO emitir JWT. Devolver `{ requires2FA: true, twoFactorToken }`
     donde `twoFactorToken` es un token de corta vida (p. ej. 5 min) que identifica al usuario
     en el paso 2 (no es el JWT de sesión).
2. Nuevo endpoint `POST /auth/2fa/login` que recibe `{ twoFactorToken, code }`, valida el
   TOTP con `validateTwoFactorToken`, y recién entonces emite el `access_token` definitivo.
3. Mensajes de error genéricos (no revelar si el código o el token es el inválido).

> **Alternativa documentada y descartada:** quitar 2FA del README y marcarlo "en progreso".
> Se descarta porque completarlo es de mayor valor para el portafolio y el grueso ya existe.

**VERIFICACIÓN.**
- Test: usuario sin 2FA → login devuelve `access_token` (sin cambios).
- Test: usuario con 2FA → login devuelve `requires2FA: true` y NO un `access_token`.
- Test: `/2fa/login` con código válido → devuelve `access_token`; con código inválido → 401.
- Swagger refleja el nuevo endpoint y la respuesta condicional de `login`.

---

### H-03 🟡 IMPORTANTE — El README promete features inexistentes
**Archivo:** `README.md`.
**Ref:** ADR-0003 · TASKS P1-README.

**QUÉ (lista verificada contra el código):**
- ❌ "Refresh tokens ✅" → no existen; solo hay un JWT de 24h.
- ❌ Deployment manda a `docker-compose -f docker-compose.prod.yml up -d` → **ese archivo no
  existe** (solo hay `docker-compose.yml` y `docker-compose.dev.yml`).
- ❌ "Licencia MIT. Ver `LICENSE`" → **no existe** archivo `LICENSE`.
- ⚠️ App móvil aparece en "Próximas funcionalidades [ ]" (sin marcar) pero el **código mobile
  sí existe** (`mobile/app/` con scanner y formularios) → el proyecto se vende de menos.
- ⚠️ "Costos promedio" en Kardex → no se calcula un costo promedio móvil; se guarda
  `unitCost`/`totalCost` por movimiento. Ajustar la afirmación o implementarlo (ver H-06).
- ⚠️ "pnpm (gestor de paquetes seguro)" → pnpm es eficiente/rápido, no "más seguro".

**POR QUÉ importa.** El README es lo primero que lee un reclutador. Una instrucción que
falla (compose inexistente) o una promesa vacía (refresh tokens) destruye credibilidad más
rápido que cualquier bug interno.

**Fix decidido (ADR-0003).** Para cada afirmación: o se vuelve verdadera (crear `LICENSE`,
crear `docker-compose.prod.yml` o corregir la ruta a `docker-compose.yml`, marcar mobile como
hecho) o se elimina/ajusta (quitar "refresh tokens", precisar "costo promedio", reescribir la
línea de pnpm). Regla: **cada ✅ del README debe mapear a código real.**

**VERIFICACIÓN.** Releer el README de arriba a abajo y confirmar que cada comando se puede
ejecutar tal cual y cada feature listada existe. Crear el `LICENSE` MIT con el año y autor.

---

### H-04 🟡 IMPORTANTE — Desalineación SRS ↔ código
**Archivos:** SRS (`SRS_Sistema_Inventario.md`, fuera del repo) + código.
**Ref:** ADR-0006 · TASKS P1-SRS.

**QUÉ.**
- El SRS dice "TypeORM/Prisma" y su ejemplo de código (sección 22.3) está escrito en
  **TypeORM** (`@InjectRepository`, `Repository<Product>`), con la transacción dejada como
  comentario `// (AQUÍ IRÍA LA TRANSACCIÓN)`. El repo real usa **Prisma** y sí implementa la
  transacción.
- El SRS no documenta el **2FA** ni la entidad **StockAlert**, que sí existen en el código.

**POR QUÉ importa.** Si mostrás el SRS junto al repo, las contradicciones se notan. El
ejemplo del SRS además exhibe la transacción *sin implementar*, justo el punto que el código
real hace bien — te perjudica mostrar la versión peor.

**Fix decidido (ADR-0006).** El SRS se actualiza para reflejar Prisma como ORM elegido
(TypeORM queda como alternativa evaluada y descartada), el ejemplo de código de la sección
22.3 se reescribe en Prisma **con la transacción y el decremento atómico ya resueltos** (debe
coincidir con el `movements.service.ts` final de H-01), y se añaden secciones breves para 2FA
y StockAlert. *Nota: el SRS vive fuera del repo; si el agente no tiene acceso de escritura a
él, debe entregar el bloque reescrito en su resumen para que el humano lo pegue.*

**VERIFICACIÓN.** El ejemplo de la sección 22.3 del SRS compila mentalmente contra el código
real y no menciona TypeORM como implementación.

---

### H-05 🟢 MENOR — CORS inseguro por defecto
**Archivo:** `backend/src/main.ts`.
**Ref:** ADR-0004 · TASKS P2-CORS.

**QUÉ.** `origin: process.env.CORS_ORIGIN || '*'` junto con `credentials: true`. Esa
combinación es inválida en navegadores (no se permite `*` con credenciales) y es insegura.

**POR QUÉ importa.** Demuestra descuido de seguridad; además no funcionaría con cookies.

**Fix decidido (ADR-0004).** Default concreto para desarrollo
(`http://localhost:5173`), aceptar lista separada por comas desde `CORS_ORIGIN`, y exigir la
variable en `NODE_ENV=production` (fallar el arranque si falta). Documentar la variable en
`.env.example`.

**VERIFICACIÓN.** Arranque local sigue funcionando con el front en 5173; en producción sin
`CORS_ORIGIN` el arranque falla con mensaje claro.

---

### H-06 🟢 MENOR — Filtrado de stock bajo en memoria (no usa el índice)
**Archivos:** `backend/src/modules/alerts/alerts.service.ts` (`checkLowStock`) y
`backend/src/modules/reports/reports.service.ts` (`getDashboard`).
**Ref:** ADR-0005 · TASKS P2-QUERY.

**QUÉ.** Ambos traen **todos** los productos activos con `findMany` y filtran
`currentStock <= minStock` con `.filter()` en JavaScript. Existe `@@index([currentStock])`
creado justamente para esto, pero no se aprovecha.

**POR QUÉ importa.** Contradice RNF01 (optimización de consultas) y no escala: con miles de
productos se traen todos a memoria cada hora (cron) y en cada carga de dashboard.

**CÓMO.** Prisma no permite comparar dos columnas en `where` directamente. La forma idiomática
es `prisma.$queryRaw` comparando `current_stock <= min_stock` a nivel SQL, devolviendo solo
las filas relevantes. Dejar comentario explicando por qué `queryRaw` aquí (limitación
conocida de Prisma, no un anti-patrón).

**VERIFICACIÓN.** Las alertas y el dashboard siguen reportando los mismos productos que antes
(test de equivalencia) pero la consulta filtra en la DB. `pnpm test` verde.

---

### H-07 🟢 MENOR — Secreto JWT débil como fallback
**Archivos:** `backend/.env.example`, `docker-compose.yml`.
**Ref:** ADR-0004 · TASKS P2-CORS (mismo lote de hardening).

**QUÉ.** El secreto de ejemplo `inventory-pro-super-secret-key-change-in-production` se usa
como **default real** en `docker-compose.yml` (`${JWT_SECRET:-...}`).

**POR QUÉ importa.** Aceptable para un demo, pero conviene que el README sea explícito y que
en producción no haya fallback silencioso.

**Fix decidido.** Mantener el ejemplo, pero documentar en README y `.env.example` que es
obligatorio cambiarlo, y (opcional, ADR-0004) que el backend valide en `production` que
`JWT_SECRET` no sea el valor de ejemplo.

**VERIFICACIÓN.** README deja la advertencia visible; arranque en prod con el secreto de
ejemplo falla o advierte.

---

### H-08 🔴 CRÍTICO — El login web está roto (mismatch de contrato access_token)
**Archivos:** `frontend/src/api/auth.service.ts`, `frontend/src/types/auth.ts`.
**Backend:** `auth.service.ts` devuelve `access_token` (snake_case).
**Ref:** ADR-0007 · TASKS P0-3.

**QUÉ.** El backend responde el login con `{ access_token, user }`. El frontend lee
`response.accessToken` (camelCase) al guardar el token:
`localStorage.setItem('accessToken', response.accessToken)`. Como ese campo no existe en la
respuesta, **guarda `undefined`**. El tipo TS `frontend/src/types/auth.ts` declara *ambos*
campos (`accessToken` y `access_token`), lo que enmascara el error en compilación.

**POR QUÉ importa.** Es el bug más visible posible para un reclutador: clona el repo, intenta
loguearse en la web y **no funciona** (o queda en un estado roto). El mobile sí funciona
porque usa fallback `response.accessToken || response.access_token`.

**CÓMO (causa raíz).** Inconsistencia de nomenclatura entre el contrato del backend y el
cliente web. El tipo dual oculta el defecto.

**Fix decidido (ADR-0007).** Unificar el contrato en **snake_case `access_token`** (es lo que
el backend ya emite y lo que el contrato OpenAPI documenta). En el frontend: leer
`response.access_token`, eliminar el campo `accessToken` del tipo, y ajustar el mobile para
usar solo `access_token` (quitar el fallback). Alternativa: cambiar el backend a camelCase;
se descarta porque rompería el contrato ya documentado y el mobile.

**VERIFICACIÓN.**
- Test del `authStore`/`auth.service` del frontend: tras login mock con `access_token`, el
  token guardado NO es `undefined`.
- Login manual en la web funciona de extremo a extremo.

---

### H-09 🟡 IMPORTANTE — Cobertura de tests muy por debajo del 80% prometido
**Ref:** ADR-0008 · TASKS P1-TESTS.

**QUÉ.** El SRS (DoD, sección 3) y el README prometen **cobertura mínima 80% con Jest**. La
realidad: solo **3 de 11 servicios** del backend tienen test (`auth`, `movements`,
`products`). Sin test: `users`, `two-factor`, `categories`, `reports`, `suppliers`, `alerts`,
`email`, `prisma`. Frontend: 3 tests. Mobile: **0 tests**. El CI usa `--passWithNoTests`, así
que la barra no se aplica.

**POR QUÉ importa.** Es una promesa explícita incumplida. Un reclutador que corra coverage ve
la brecha. Además, el `--passWithNoTests` hace que el CI dé verde aunque no haya pruebas.

**CÓMO.** Faltan suites. Prioridad por criticidad de la lógica de negocio:
1. `two-factor.service` (seguridad, y queda tocado por H-02).
2. `alerts.service` y `reports.service` (lógica de KPIs y stock bajo, tocados por H-06).
3. `categories.service`, `suppliers.service`, `users.service` (CRUD, tests de borde).
4. Al menos un test de smoke del `authStore` mobile.

**Fix decidido (ADR-0008).** No perseguir el 80% como número mágico de inmediato; **cubrir
primero la lógica de negocio crítica** (servicios con reglas, no getters triviales) y eliminar
`--passWithNoTests` del CI una vez que existan suites reales, para que la barra signifique
algo. Si no se alcanza 80% honestamente, **ajustar la afirmación del README/SRS** al número
real en vez de mentir.

**VERIFICACIÓN.** `pnpm test --coverage` reporta la cobertura real; el README declara un
número verdadero; el CI ya no pasa "por no haber tests".

---

### H-10 🟡 IMPORTANTE — JWT en localStorage (exposición a XSS)
**Archivos:** `frontend/src/api/client.ts`, `frontend/src/api/auth.service.ts`,
`frontend/src/stores/authStore.ts`.
**Ref:** ADR-0007 · TASKS P2-XSS.

**QUÉ.** El frontend web guarda el JWT en `localStorage`. Cualquier script inyectado (XSS)
puede leerlo y robar la sesión. El mobile lo hace bien (usa `expo-secure-store`).

**POR QUÉ importa.** Es una observación de seguridad estándar que un revisor con criterio hará.
No es trivial de resolver del todo (la solución ideal — cookies httpOnly — requiere cambios en
el backend), así que se trata como mejora con dos niveles.

**Fix decidido (ADR-0007).**
- *Mínimo (aceptable para portafolio):* documentar la decisión y el trade-off en el README/
  código (consciencia del riesgo), mantener Helmet y CSP en el backend para mitigar XSS.
- *Ideal (si hay tiempo):* mover el token a cookie `httpOnly` + `SameSite=Strict` emitida por
  el backend; el frontend deja de tocar el token. Esto es un cambio mayor de arquitectura de
  auth → su propio mini-diseño, no obligatorio para cerrar el portafolio.

**VERIFICACIÓN.** README documenta la decisión; si se implementa la cookie, el token ya no
aparece en `localStorage`.

---

### H-11 🟢 MENOR — `quantity` acepta decimales (debería ser entero)
**Archivo:** `backend/src/modules/movements/dto/create-movement.dto.ts`.
**Ref:** TASKS P2-DTO.

**QUÉ.** `quantity` se valida con `@IsNumber()` + `@Min(1)`. Acepta `2.5`. El stock es de
unidades enteras (`Int` en el schema).

**POR QUÉ importa.** Permitir `quantity: 2.5` corrompe la semántica del inventario y puede dar
stocks fraccionarios inesperados.

**Fix decidido.** Cambiar `@IsNumber()` por `@IsInt({ message: 'La cantidad debe ser un número
entero' })`. Aplicar el mismo criterio a cualquier otro campo de unidades.

**VERIFICACIÓN.** Test: `quantity: 2.5` → 400. `quantity: 3` → OK.

---

### H-12 🟢 MENOR — Política de contraseña inconsistente entre login y register
**Archivos:** `auth/dto/login.dto.ts` (min 6), `auth/dto/register.dto.ts` (min 8 + regex).
**Ref:** TASKS P2-DTO.

**QUÉ.** El registro exige 8 caracteres con mayúscula/minúscula/número; el login solo exige 6.
No es un agujero de seguridad (el login solo compara contra el hash), pero es incoherente y un
revisor lo nota.

**Fix decidido.** Alinear el `MinLength` del login al del registro (o relajar la validación de
formato en login a solo `IsNotEmpty`, ya que la fortaleza se exige al crear). Preferir: login
valida presencia y longitud mínima coherente (8), sin regex (no tiene sentido rechazar un login
por formato).

**VERIFICACIÓN.** Ambos DTOs son coherentes; los tests de auth siguen verdes.

---

### H-13 🟢 MENOR — El seed no corre en la imagen Docker de producción
**Archivos:** `backend/docker-entrypoint.sh`, `backend/package.json`, `backend/Dockerfile`.
**Ref:** TASKS P2-SEED.

**QUÉ.** El entrypoint ejecuta `pnpm prisma db seed`, que usa `ts-node prisma/seed.ts`. Pero
la imagen de producción se construye con `pnpm install --prod`, que **no** instala `ts-node`
(es devDependency). El seed falla; lo "salva" un `|| echo` → el seed nunca corre y la demo con
`docker-compose up` **levanta sin usuarios** (no se puede loguear con las credenciales del
README).

**POR QUÉ importa.** Rompe la ruta "Opción 2: Todo con Docker" del README justo para quien
quiere probar rápido (un reclutador). Es la peor primera impresión: el demo no tiene con qué
loguearse.

**Fix decidido.** Opciones (elegir una en P2-SEED):
1. Precompilar el seed a JS en el build (`tsc prisma/seed.ts` → `seed.js`) y que el entrypoint
   corra `node prisma/seed.js`.
2. Mover `ts-node` a dependencies (simple, pero engorda la imagen).
3. Reescribir `seed.ts` como `seed.js` plano (sin TS).
Preferir opción 1 (imagen limpia, seed funcional). Quitar el `|| echo` que oculta fallos
reales del seed.

**VERIFICACIÓN.** `docker-compose up --build` desde cero levanta la DB **con** los usuarios
demo; el login del README funciona contra el stack dockerizado.

---

### H-14 🟡 IMPORTANTE — ESLint v9 sin flat config: el lint está roto a nivel de configuración
**Archivo:** `backend/` (falta `eslint.config.js`).
**Descubierto durante:** la ejecución de las tareas P0 (deuda preexistente, **no** introducida
por el trabajo de P0-1/P0-2/P0-3).
**Ref:** TASKS P1-LINT.

**QUÉ.** `pnpm lint` falla en todo el backend porque no existe ningún `eslint.config.js`, y
ESLint v9 lo exige (reemplazó el formato `.eslintrc.*`). No es un problema de violaciones de
estilo: la herramienta no tiene configuración y no corre en absoluto.

**POR QUÉ importa.** El DoD de `CLAUDE.md §4` exige `pnpm lint` verde para **cada** tarea.
Mientras esto siga roto, ninguna tarea de P1/P2 puede cumplir su Definition of Done por una
causa ajena a lo que se está arreglando. Además, si el job de lint del CI se reactivara tal
cual, daría una falsa señal de "todo el repo está mal" en vez de señalar violaciones reales.

**CÓMO (causa raíz).** Migración pendiente a ESLint v9 (flat config obligatorio) nunca
completada.

**Fix decidido.** Crear un `eslint.config.js` mínimo (flat config) coherente con el stack
(TypeScript + NestJS). Luego correr `pnpm lint` con la config nueva y **reportar cuántas
violaciones aparecen antes de corregirlas** — no arreglar todo el repo a ciegas como efecto
colateral de un cambio de configuración. Si son pocas, resolverlas en el momento; si son
muchas, dejarlas como ítem aparte explícito.

**VERIFICACIÓN.** `pnpm lint` ya no falla por ausencia de configuración; el número de
violaciones restantes (idealmente 0) queda documentado; `pnpm build` sigue verde.

---

### H-15 🔴 CRÍTICO — Editar entidades está roto (mismatch de verbo PATCH vs PUT)
**Archivos:** `frontend/src/api/categories.service.ts`, `products.service.ts`, `suppliers.service.ts`, y el `usersService` inline en `frontend/src/components/pages/UsersPage.tsx`.
**Backend:** los controllers exponen `@Put(':id')` para el update de categories, products, suppliers y users.
**Descubierto durante:** auditoría de contrato frontend↔backend posterior al deploy cloud.
**Ref:** mismo patrón que **H-08** · TASKS P0-CONTRACT-A.

**QUÉ.** El frontend actualiza con `apiClient.patch('/<entidad>/:id')`, pero el backend registra
esas rutas con `@Put(':id')`. NestJS mapea `@Put` solo al método HTTP PUT, así que la petición
PATCH **no matchea ninguna ruta → 404**. Resultado: **crear y borrar funcionan, pero editar
categorías, productos, proveedores y usuarios falla** desde la UI.

**POR QUÉ importa.** Es el mismo tipo de bug que H-08 (contrato front↔back que no coincide),
replicado en cuatro pantallas de CRUD. Un reclutador que edite cualquier registro ve un error.
Cuatro flujos de update caídos degradan fuerte la percepción de un CRUD "completo".

**CÓMO (causa raíz).** El frontend se construyó asumiendo semántica PATCH (update parcial)
mientras el backend implementó `@Put`. Nadie ejerció el flujo de edición contra el backend real.

**Fix decidido.** Alinear el frontend al backend (fuente de verdad, igual criterio que H-08):
cambiar `.patch` → `.put` en los cuatro servicios. Se descarta cambiar el backend a `@Patch`
porque alteraría el contrato/Swagger ya desplegado sin beneficio. Se extrae además el
`usersService` inline a `frontend/src/api/users.service.ts` para dejarlo consistente y testeable.

**VERIFICACIÓN.**
- Smoke test por servicio: `update(id, data)` invoca `apiClient.put` con `/<entidad>/${id}`.
- `pnpm build` (tsc) verde; edición manual de cada entidad funciona de extremo a extremo.

---

### H-16 🟡 IMPORTANTE — Dos reportes rotos por rutas inexistentes
**Archivo:** `frontend/src/api/reports.service.ts` (consumido por `ReportsPage.tsx`).
**Backend:** `reports.controller.ts` expone `/reports/low-stock` y `/reports/by-category`.
**Descubierto durante:** auditoría de contrato frontend↔backend posterior al deploy cloud.
**Ref:** mismo patrón que **H-08** · TASKS P0-CONTRACT-B.

**QUÉ.** `ReportsPage` llama a `getStockoutReport()` → `GET /reports/stockouts` y a
`getCategoryDistribution()` → `GET /reports/category-distribution`. Ninguna de esas rutas existe
en el backend (son `/reports/low-stock` y `/reports/by-category`) → **404**. Los otros tres
reportes de la página (`dashboard`, `stock-valuation`, `product-velocity`) sí coinciden.

**POR QUÉ importa.** La página de Reportes muestra secciones vacías/erróneas y ensucia la consola
con 404. Es la misma clase de desalineación de contrato que H-08/H-15.

**CÓMO (causa raíz).** Nombres de ruta divergentes entre el cliente y el controller reales.

**Fix decidido.** Alinear el frontend al backend: `stockouts` → `low-stock`,
`category-distribution` → `by-category`. (Verificar que el shape de la respuesta del backend
coincida con el tipo consumido; si no, ajustar el tipo del front.)

**VERIFICACIÓN.**
- Smoke test: `getStockoutReport()`/`getCategoryDistribution()` pegan a `/reports/low-stock` y
  `/reports/by-category`.
- La página de Reportes carga sin 404 en consola.

---

### H-17 🔴 CRÍTICO — El dashboard entero muestra datos falsos (contrato desalineado + gráfico random)
**Archivos:** `backend/src/modules/reports/reports.service.ts` (`getDashboard`), `frontend/src/components/pages/DashboardPage.tsx`.
**Frontend espera:** el tipo `DashboardKPIs` (`stockValuation`, conteos, `topProducts`, `categoryDistribution`, `movementTrend`, `recentAlerts`).
**Descubierto durante:** la implementación del gráfico de tendencia; al investigar, el problema no era solo el gráfico sino **todo** el contrato del dashboard.
**Ref:** mismo espíritu decorativo que **H-02** (2FA decorativo) + familia de contrato **H-08/H-15/H-16**.

**QUÉ.** `GET /reports/dashboard` devolvía `{ products, inventory, entities, movements }`, pero el
frontend lee `kpis.stockValuation`, `kpis.lowStockCount`, `kpis.outOfStockCount`, `kpis.topProducts`,
`kpis.categoryDistribution`, `kpis.movementTrend`, etc. **Ninguno** de esos campos existía en la
respuesta → todos los KPIs de la primera pantalla caían a `undefined → 0` y las secciones "Productos
Más Movidos" y "Distribución por Categoría" quedaban vacías. Peor: la "Tendencia de Movimientos" no
tenía fuente, así que el componente **generaba números aleatorios** (`Math.random()`) en cada carga:
un gráfico decorativo que mentía.

**POR QUÉ importa.** Es la **primera pantalla** que ve un reclutador, y estaba enteramente vacía/falsa
no por falta de datos sino por contrato roto. El gráfico con datos inventados es exactamente el tipo
de "feature decorativa" que H-02 (aparenta funcionar sin hacerlo).

**CÓMO (causa raíz).** El backend `getDashboard` se implementó con una forma distinta a la que la UI
(más rica) consume, y nunca proveyó `topProducts`/`categoryDistribution`/`movementTrend`; la UI los
suplía con vacío/aleatorio.

**Fix decidido (enriquecer el backend, back→front).** Excepción consciente al criterio habitual
front→back (H-08/H-15/H-16): acá el backend era *más pobre* que la UI, así que alinear al revés
implicaría borrar secciones. `getDashboard` ahora devuelve el contrato `DashboardKPIs` completo:
`stockValuation`, `lowStockCount`, `outOfStockCount`, movimientos hoy/mes, `recentAlerts` (alertas
activas), `topProducts` (por cantidad movida en 30 días, con `turnoverRate`), `categoryDistribution`
y un `movementTrend` **real** agrupado por día (últimos 7 días, rellenando días sin movimientos). El
frontend elimina el bloque `Math.random()` y consume `kpis.movementTrend`.

**VERIFICACIÓN.**
- Backend (`reports.service.spec`): `getDashboard` devuelve el contrato completo (valuación, conteos,
  alertas, `topProducts`, `categoryDistribution` y trend de 7 días).
- Frontend (`DashboardPage.test`): espía el gráfico y comprueba que recibe la data real de
  `movementTrend`, no valores aleatorios.
- `pnpm build`/`test` verdes en backend y frontend.

---

## 3. Estado objetivo (resumen)

Al terminar, el repo debe cumplir:
1. El stock **nunca** puede quedar negativo ni perder escrituras bajo concurrencia (H-01).
2. El 2FA, si está activo, **se exige** en el login mediante flujo de dos pasos (H-02).
3. **El login web funciona** de extremo a extremo (contrato unificado, H-08).
4. Cada afirmación del README es **verdadera y ejecutable** (H-03), con `LICENSE` presente.
5. El SRS y el código **no se contradicen** (H-04).
6. La cobertura de tests declarada es **real** y cubre la lógica crítica (H-09).
7. **`docker-compose up` levanta una demo usable** con usuarios para loguear (H-13).
8. CORS, secreto JWT, storage de token, validación de DTOs y consultas de stock bajo siguen
   buenas prácticas (H-05, H-06, H-07, H-10, H-11, H-12).
9. Todo lo anterior **con tests** y sin degradar los puntos fuertes del §1.

---

## 4. ¿Qué significa esto en la práctica?

El proyecto ya es bueno. Estos cambios cierran las tres grietas que un revisor técnico ve
primero: un bug de datos real en el corazón del sistema, una feature de seguridad a medias, y
un README que promete de más. Arreglados, el repo deja de tener "peros" obvios y la calidad
de base (arquitectura limpia, tests, CI, Docker) queda en primer plano. El orden importa:
H-01 y H-02 son los que cambian la percepción de "junior" a "senior junior"; el resto es
pulido que evita que esa buena impresión se ensucie.
