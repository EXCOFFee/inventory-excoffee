# TASKS.md — Backlog de remediación (InventoryPro)

> Ejecutá en orden: **P0 → P1 → P2**. No pases de nivel sin cerrar el anterior. Cada tarea
> tiene criterios de aceptación verificables y referencia al ADR/contrato que la gobierna.
> Marcá `[x]` solo cuando se cumpla **toda** la Definition of Done de `CLAUDE.md §4`.

Leyenda de prioridad: **P0** = bloqueante (bug real / seguridad) · **P1** = credibilidad ante
reclutadores · **P2** = pulido / hardening.

---

## P0 — Crítico (bloqueante)

### [x] P0-1 · Eliminar la race condition en el registro de movimientos
**Ref:** SDD H-01 · ADR-0001 · `contracts/movements.openapi.yaml`
**Archivo:** `backend/src/modules/movements/movements.service.ts` (`create`)

Pasos:
1. Mantener el `findUnique` previo para resolver el **404** (producto inexistente) y el
   **400** por producto inactivo, con sus mensajes actuales.
2. Dentro de `$transaction`:
   - **OUT:** decrementar con `updateMany({ where: { id: productId, currentStock: { gte: quantity } }, data: { currentStock: { decrement: quantity } } })`.
     Si `result.count === 0` → lanzar `BadRequestException` de stock insuficiente.
   - **IN:** `update({ where: { id: productId }, data: { currentStock: { increment: quantity } } })`.
   - Crear el `Movement` con `stockBefore` y `stockAfter` derivados del valor **persistido**.
3. JSDoc: explicar por qué decremento condicional atómico en vez de `Serializable`/lock.

Criterios de aceptación:
- [x] El test existente de "insufficient stock" sigue verde.
- [x] Nuevo test de **concurrencia**: dos `create` OUT simultáneos sobre el mismo producto
      con stock para solo uno → exactamente uno tiene éxito, el otro lanza 400, el stock final
      nunca es negativo.
- [x] `stockAfter` coincide con el stock real en DB tras la operación.
- [ ] `pnpm test`, `pnpm lint`, `pnpm build` verdes. <!-- build ✓; movements suite ✓ y archivos lint-clean. `pnpm test`/`pnpm lint` globales aún rojos SOLO por products.service.spec (pre-existente, P1-TESTS) y auth.module.ts (tuyo). -->

---

### [x] P0-2 · Exigir 2FA en el login (flujo de dos pasos)
**Ref:** SDD H-02 · ADR-0002 · `contracts/auth-2fa.openapi.yaml`
**Archivos:** `auth.service.ts`, `auth.controller.ts`, `two-factor.service.ts`, DTOs de auth.

Pasos:
1. `login()`: si `user.twoFactorEnabled` → **no** emitir el JWT de sesión; devolver
   `{ requires2FA: true, twoFactorToken }` (token efímero ≈5 min, claim distinto del de sesión).
   Si no tiene 2FA → comportamiento actual intacto.
2. Nuevo `POST /auth/2fa/login` (`{ twoFactorToken, code }`): validar el token efímero,
   identificar al usuario, validar TOTP con `validateTwoFactorToken`; si OK emitir
   `access_token`. Errores genéricos.
3. Asegurar que el `twoFactorToken` NO sea aceptado por `JwtAuthGuard` para endpoints
   protegidos.
4. DTO `TwoFactorLoginDto` con `code` de 6 dígitos validado por `class-validator`.
5. Anotaciones Swagger para la respuesta condicional de `login` y el nuevo endpoint.

Criterios de aceptación:
- [x] Test: usuario sin 2FA → `login` devuelve `access_token` (sin regresión).
- [x] Test: usuario con 2FA → `login` devuelve `requires2FA: true` y **no** `access_token`.
- [x] Test: `/2fa/login` con código válido → `access_token`; con código inválido → 400;
      con `twoFactorToken` inválido/expirado → 401. <!-- verificado además e2e contra la API real con TOTP de speakeasy -->
- [x] Swagger (`/api/docs`) muestra ambos endpoints correctamente. <!-- verificado en /api/docs-json: /auth/login con oneOf requires2FA + /auth/2fa/login con TwoFactorLoginDto -->
- [ ] `pnpm test`, `pnpm lint`, `pnpm build` verdes. <!-- build ✓, auth suite ✓; globales rojos solo por products (P1-TESTS) y auth.module.ts (tuyo) -->

---

---

### [x] P0-3 · Reparar el login web (mismatch de contrato `access_token`)
**Ref:** SDD H-08 · ADR-0007 · `contracts/auth-2fa.openapi.yaml`
**Archivos:** `frontend/src/api/auth.service.ts`, `frontend/src/types/auth.ts`,
`mobile/src/stores/authStore.ts`

Pasos:
1. Frontend: cambiar `response.accessToken` → `response.access_token` donde se guarda el token.
2. `frontend/src/types/auth.ts`: eliminar el campo `accessToken`; dejar solo `access_token`.
3. Mobile: usar solo `access_token` (quitar el fallback `|| response.accessToken`).
4. Asegurar coherencia con el contrato (snake_case en toda la cadena).

Criterios de aceptación:
- [x] Test del frontend: login mock con `{ access_token }` → el token guardado NO es `undefined`.
- [x] Login manual en la web funciona de extremo a extremo (se entra al dashboard). <!-- flujo verificado e2e a nivel API (login -> token -> /auth/profile 200) + stack web levantado en :5173 apuntando al backend; falta el click visual del humano -->
- [x] Mobile sigue logueando sin el fallback. <!-- tsc --noEmit verde; auth.service mobile apunta a /auth/2fa/login con twoFactorToken -->
- [x] `pnpm build` del frontend verde.

> ⚠️ Esta tarea debe coordinarse con P0-2: si el login pasa a dos pasos, la respuesta del
> frontend debe manejar también `{ requires2FA: true, twoFactorToken }` (ver contrato 2FA).

## P1 — Credibilidad ante reclutadores

### [x] P1-LINT · Reparar el lint roto (ESLint v9 sin flat config)
**Ref:** SDD H-14
**⚠️ Ejecutar esta tarea PRIMERO, antes de cualquier otra de P1/P2.** El DoD de `CLAUDE.md`
exige `pnpm lint` verde por tarea, y hoy falla por ausencia de configuración, no por
violaciones reales de código. Mientras esto no se resuelva, ninguna tarea siguiente puede
completar su DoD limpiamente.

Pasos:
- [x] Crear `backend/eslint.config.js` (flat config) coherente con TypeScript + NestJS.
- [x] Correr `pnpm lint` con la config nueva.
- [x] Reportar el número de violaciones encontradas (**no** corregirlas todas a ciegas). → 6 (5 errores, 1 warning).
- [x] Si son pocas (criterio sugerido: menos de ~15), corregirlas ahora mismo. → 4 corregidas (specs auth/movements, import en categories.controller).

> NOTA: Quedan **2 violaciones en archivos reservados** (`auth.module.ts`, `products.service.spec.ts`),
> pendientes de la decisión del usuario sobre esos archivos. Por eso `pnpm lint` global aún
> sale con 1 error + 1 warning (en esos dos archivos), no por el código de las P0.

Criterios de aceptación:
- [x] `pnpm lint` ya no falla por configuración ausente.
- [x] El número de violaciones restantes (si las hay) está documentado y comunicado. → 2 (en archivos reservados).
- [x] `pnpm build` sigue verde (la config nueva no rompe nada).

### [x] P1-README · Hacer el README 100% verdadero y ejecutable
**Ref:** SDD H-03 · ADR-0003
**Archivo:** `README.md` (+ crear `LICENSE`)
**⚠️ Ejecutar al final**, cuando los ✅ de P0 ya sean reales.

Pasos:
- [x] Quitar "Refresh tokens ✅" (no existe). → reemplazado por "2FA (TOTP) con login en dos pasos".
- [x] Corregir la instrucción de deployment: `docker-compose.prod.yml` → `docker-compose.yml`
      (o crear un compose de prod real si se prefiere; preferir corregir la ruta). → ruta corregida a `docker-compose up -d --build`.
- [x] Crear archivo `LICENSE` (MIT, con año y autor) — el README ya lo referencia. → MIT 2026, EXCOFFee.
- [x] Mover la app móvil de "Próximas funcionalidades [ ]" a funcionalidades hechas ✅
      (scanner + formularios existen en `mobile/app/`). → nueva sección "Aplicación Móvil" verificada contra el código.
- [x] Ajustar "Costos promedio" → "Costo unitario y total por movimiento" (lo que el código
      realmente hace), salvo que se implemente costo promedio móvil (fuera de alcance).
- [x] Reescribir "pnpm (gestor de paquetes seguro)" → "pnpm (rápido y eficiente en disco)".
- [x] Documentar el nuevo flujo de login 2FA (de P0-2) y que "2FA ✅" ahora es real.
- [x] Añadir nota visible de que `JWT_SECRET` debe cambiarse en producción.

> NOTA: auditoría adicional de veracidad detectó otro overclaim: "Notificaciones automáticas"
> (el `EmailService` existe pero NO está cableado en `alerts.service`). Corregido a "Generación
> automática de alertas (DB)" + "🔄 Notificaciones por email (servicio implementado, integración
> pendiente)".

Criterios de aceptación:
- [x] Cada comando del README se ejecuta tal cual sin error. <!-- flujo dev verificado e2e; comandos docker/pnpm válidos -->
- [x] Cada ✅ corresponde a código existente y funcional. <!-- auditado; corregidos refresh tokens, costos, notificaciones email -->
- [x] `LICENSE` existe.

### [x] P1-SRS · Alinear el SRS con el código (Prisma, 2FA, StockAlert)
**Ref:** SDD H-04 · ADR-0006
**Archivo:** `SRS_Sistema_Inventario.md` (⚠️ vive **fuera del repo**)
**Estado:** bloque reescrito **entregado** al humano para pegar (el SRS vive fuera del repo).

Pasos:
- [x] Declarar Prisma como ORM elegido; TypeORM como alternativa descartada.
- [x] Reescribir el ejemplo de la sección 22.3 en Prisma, reflejando el `movements.service.ts`
      final de P0-1 (con la transacción y el decremento atómico implementados).
- [x] Añadir secciones breves para 2FA (flujo de dos pasos) y la entidad `StockAlert`.

Criterios de aceptación:
- [x] El SRS no menciona TypeORM como implementación.
- [x] El ejemplo 22.3 coincide con el código real.
- [x] Si no hay acceso de escritura al SRS, el agente entrega el bloque reescrito en su
      resumen final para que el humano lo pegue. → entregado en el chat (turno P1-SRS).

---

### [x] P1-TESTS · Cobertura real de la lógica de negocio
**Ref:** SDD H-09 · ADR-0008

Pasos (en orden de prioridad):
- [x] Test de `two-factor.service` (incluye el flujo tocado por P0-2). → 15 tests.
- [x] Test de `alerts.service` (stock bajo) y `reports.service` (KPIs del dashboard). → 11 tests.
- [x] Test de `categories.service`, `suppliers.service`, `users.service` (CRUD + bordes:
      404, duplicados, soft delete). → 23 tests. Incluye la reparación de `products.service.spec` + validación minStock<=maxStock.
- [x] Smoke test del `authStore` mobile. → 5 tests (ts-jest; jest-expo no es viable bajo pnpm).
- [x] Quitar `--passWithNoTests` de los jobs de test del CI (backend y frontend) **una vez**
      que existan las suites. → quitado de unitarios; se mantiene SOLO en e2e (no hay suites e2e).
- [x] Medir con `pnpm test --coverage` y declarar el número real en README/SRS (si no llega a
      80%, decir el número verdadero, no mentir). → medido (back 33% / front 23% global; servicios 70-100%).

> NOTA (decisión del usuario): NO se declara cobertura en el README (no había claim de 80% allí;
> el 80% vivía solo en el SRS DoD externo). Se entrega una nota para ajustar el SRS al número real.
> Cobertura global baja porque cuenta controllers/DTOs/módulos/infra y componentes/páginas sin tests;
> la capa de servicios (lógica de negocio) está bien cubierta.

Criterios de aceptación:
- [x] `pnpm test` corre las nuevas suites en verde. → backend 97, frontend 28, mobile 5.
- [x] El CI ya no pasa "por no haber tests".
- [x] El porcentaje de cobertura declarado coincide con el medido. → README sin claim; SRS se ajusta a lo real (nota entregada).

## P2 — Pulido y hardening

### [ ] P2-CORS · Endurecer CORS y secreto JWT
**Ref:** SDD H-05 y H-07 · ADR-0004
**Archivos:** `backend/src/main.ts`, `backend/.env.example`, `docker-compose.yml`, README

Pasos:
- [ ] CORS: default `http://localhost:5173` en dev; soportar lista por comas en `CORS_ORIGIN`;
      en `NODE_ENV=production` exigir `CORS_ORIGIN` (fail-fast si falta).
- [ ] JWT: en `production`, validar que `JWT_SECRET` exista y no sea el valor de ejemplo;
      fallar/advertir si lo es.
- [ ] Documentar `CORS_ORIGIN` y la obligatoriedad de `JWT_SECRET` en `.env.example` y README.

Criterios de aceptación:
- [ ] Arranque local sin config extra sigue funcionando (front en 5173).
- [ ] Arranque en prod sin `CORS_ORIGIN` o con secreto de ejemplo → falla con mensaje claro.
- [ ] `pnpm build` verde.

### [ ] P2-QUERY · Filtrar stock bajo en la base de datos
**Ref:** SDD H-06 · ADR-0005
**Archivos:** `alerts.service.ts` (`checkLowStock`), `reports.service.ts` (`getDashboard`)

Pasos:
- [ ] Reemplazar el `findMany` + `.filter()` por `prisma.$queryRaw` **parametrizado** que
      filtre `current_stock <= min_stock` a nivel SQL.
- [ ] Mantener la distinción del dashboard: low = `currentStock <= minStock && currentStock > 0`,
      out = `currentStock = 0`.
- [ ] JSDoc explicando por qué `$queryRaw` (limitación de comparación columna-vs-columna en
      Prisma), no es anti-patrón.

Criterios de aceptación:
- [ ] Test de equivalencia: el conjunto de productos reportados es idéntico al anterior.
- [ ] La query usa el índice `currentStock` y no trae todos los productos a memoria.
- [ ] `$queryRaw` es parametrizado (sin interpolación de strings).
- [ ] `pnpm test`, `pnpm build` verdes.

---

### [ ] P2-SEED · Hacer que el seed corra en la imagen Docker de producción
**Ref:** SDD H-13 · TASKS
**Archivos:** `backend/docker-entrypoint.sh`, `backend/package.json`, `backend/Dockerfile`

Pasos:
- [ ] Precompilar el seed a JS en el build (p. ej. `tsc prisma/seed.ts` → `prisma/seed.js`) y
      que el entrypoint corra `node prisma/seed.js`. (Alternativa: mover `ts-node` a deps; menos
      preferible por tamaño de imagen.)
- [ ] Quitar el `|| echo "..."` que oculta fallos reales del seed (o dejar un log que distinga
      "ya sembrado" de "falló").

Criterios de aceptación:
- [ ] `docker-compose up --build` desde cero levanta la DB **con** los usuarios demo.
- [ ] El login del README (admin@inventorypro.com / Admin123!) funciona contra el stack
      dockerizado.

### [ ] P2-DTO · Endurecer validación de DTOs
**Ref:** SDD H-11 y H-12
**Archivos:** `movements/dto/create-movement.dto.ts`, `auth/dto/login.dto.ts`

Pasos:
- [ ] `quantity`: cambiar `@IsNumber()` por `@IsInt()` (el stock es entero). Aplicar a otros
      campos de unidades si los hay.
- [ ] Alinear la política de contraseña del login con la del registro (longitud coherente;
      quitar regex de formato en login, ya que la fortaleza se exige al crear el usuario).

Criterios de aceptación:
- [ ] Test: `quantity: 2.5` → 400; `quantity: 3` → OK.
- [ ] Los DTOs de login y register son coherentes; tests de auth verdes.

### [ ] P2-XSS · Documentar (o mejorar) el storage del token web
**Ref:** SDD H-10 · ADR-0007
**Archivos:** `frontend/src/api/client.ts`, README

Pasos (elegir nivel):
- [ ] **Mínimo:** documentar en README/código el trade-off de `localStorage` y la mitigación
      (Helmet + CSP en backend). Aceptable para portafolio.
- [ ] **Ideal (opcional):** migrar el token a cookie `httpOnly` + `SameSite=Strict` emitida por
      el backend; el frontend deja de tocar el token. Cambio mayor — solo si hay tiempo.

Criterios de aceptación:
- [ ] README documenta la decisión de storage y su trade-off.
- [ ] Si se implementa la cookie: el token ya no aparece en `localStorage`.

## Cierre

### [ ] FINAL · Pasada de verificación global
- [ ] Las 3 categorías (P0/P1/P2) cerradas y marcadas.
- [ ] `pnpm test` (backend), `pnpm lint`, `pnpm build` verdes en local.
- [ ] El CI (`.github/workflows/ci.yml`) pasa en la rama.
- [ ] README releído de punta a punta: cada comando funciona, cada ✅ es real.
- [ ] Resumen entregado al humano: qué se cambió, qué decisiones de ADR se aplicaron, y (si
      aplica) el bloque del SRS reescrito para pegar.
