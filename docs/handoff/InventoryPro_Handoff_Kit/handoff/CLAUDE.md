# CLAUDE.md — Guía operativa para el agente (Claude Code)

> Este archivo es el contrato de trabajo entre el humano y el agente de IA que va a
> ejecutar las correcciones sobre el repositorio **inventory-excoffee** (proyecto
> "InventoryPro"). Leelo completo antes de tocar una sola línea. Las decisiones de
> arquitectura ya están tomadas y documentadas en `SDD.md` y en los `adrs/`. Tu trabajo
> es **implementar**, no re-discutir el diseño.

---

## 0. Objetivo del trabajo

El proyecto es un portafolio Full-Stack (NestJS + React + React Native + PostgreSQL/Prisma)
que será revisado por **reclutadores técnicos**. Una auditoría detectó un bug real de
integridad de datos, una feature de seguridad a medias, e inconsistencias entre lo que el
README/SRS prometen y lo que el código entrega. Tu misión es cerrar todas esas brechas para
que el proyecto pase de "buen junior" a "este sabe lo que hace", **sin romper lo que ya
funciona bien**.

El backlog priorizado y verificable está en `TASKS.md`. Empezá siempre por ahí.

---

## 1. Modo de operación

- Operás en modo **IMPLEMENTADOR**: tenés acceso real al repo. Escribís y editás código.
- **No regeneres documentación en lugar de escribir código.** Si una tarea pide arreglar el
  Kardex, arreglá el Kardex; no escribas un documento sobre cómo se arreglaría.
- Si una tarea necesita una decisión que **no** está documentada en `SDD.md` ni en los
  `adrs/`, **frená y preguntá**. No inventes la decisión.
- Cada cambio de comportamiento debe ir acompañado de su test. "Hecho" = el código funciona,
  los tests pasan, y el lint pasa. Ver §4 (Definition of Done).

---

## 2. Stack y comandos reales del repo (verificado)

| Capa | Tecnología | Carpeta |
|---|---|---|
| Backend | NestJS + TypeScript + Prisma + PostgreSQL | `backend/` |
| Frontend | React 18 + Vite + Tailwind + Zustand + React Query | `frontend/` |
| Mobile | React Native (Expo) + NativeWind | `mobile/` |
| Infra | Docker + Docker Compose + Nginx | raíz |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | — |

**Gestor de paquetes: `pnpm` (versión 10, según el CI). Usá pnpm, no npm.**

Comandos backend (desde `backend/`):
```bash
pnpm install                 # instalar deps
pnpm prisma generate         # generar cliente Prisma
pnpm prisma migrate dev      # aplicar migraciones (necesita DB levantada)
pnpm prisma db seed          # cargar datos demo
pnpm run start:dev           # levantar API en watch
pnpm test                    # tests unitarios (Jest)
pnpm test:e2e                # tests e2e
pnpm lint                    # eslint --fix
pnpm build                   # nest build
```

Levantar la base de datos para desarrollo:
```bash
docker-compose -f docker-compose.dev.yml up -d   # Postgres + Adminer (8080)
```

> ⚠️ Nota de entorno: `bcrypt` es un módulo nativo. Si la instalación falla por no poder
> bajar el binario precompilado, es un problema de red del entorno, no del código. En CI
> funciona. Si necesitás trabajar offline, considerá `bcryptjs` (JS puro) — pero **eso es
> una decisión de ADR**, no la tomes sola (ver ADR-0005 si se decide migrar).

---

## 3. Reglas de oro (no las rompas)

1. **No degrades lo que ya está bien.** La separación Controller→Service→Repository, los
   DTOs con `class-validator`, el `ValidationPipe` global con `whitelist`, Helmet, Throttler,
   la revalidación del usuario en `JwtStrategy`, los índices del schema y la estructura del
   Kardex (`stockBefore`/`stockAfter`) **se quedan como están**. Si una tarea te empuja a
   tocarlos, tocá lo mínimo.
2. **Atomicidad por encima de todo.** El sistema existe para que el stock nunca mienta.
   Cualquier cambio en `movements.service.ts` debe preservar o reforzar la consistencia del
   stock, nunca debilitarla. Ver ADR-0001.
3. **No prometas en el README lo que el código no hace.** Cada checkmark ✅ del README debe
   corresponder a código que existe y funciona. Si una feature está a medias, marcala como
   🔄 en progreso, no como ✅.
4. **Honestidad técnica.** Si descubrís que una tarea está mal especificada o que arreglarla
   rompe otra cosa, decilo en el PR/resumen en vez de forzar el cambio.
5. **Comentarios que explican el porqué.** El proyecto presume (en su propio SRS, sección
   22) de JSDoc que explica *por qué*. Cuando arregles el bug de concurrencia o el 2FA,
   dejá un comentario que explique la decisión. Eso es lo que impresiona a un reclutador.
6. **Idioma:** el código, comentarios y README están en español. Mantené la consistencia.

---

## 4. Definition of Done (DoD) — por cada tarea

Una tarea está terminada **solo si** se cumplen todos estos puntos:

- [ ] El cambio de comportamiento está implementado.
- [ ] Hay al menos un test que cubre el caso nuevo (incluido el caso de borde / fallo).
- [ ] `pnpm test` pasa en el paquete afectado.
- [ ] `pnpm lint` pasa sin errores nuevos.
- [ ] `pnpm build` compila sin errores de TypeScript (`strict: true`).
- [ ] Si la tarea cambia comportamiento visible al usuario o a un cliente de la API, el
      **README** y el **contrato OpenAPI/Swagger** reflejan el cambio.
- [ ] Si la tarea cambia una decisión de arquitectura, el ADR correspondiente queda
      consistente (no se crean ADRs nuevos sin avisar).
- [ ] El commit es atómico y su mensaje describe el *qué* y el *por qué*.

---

## 5. Mapa de la documentación del handoff

| Archivo | Qué contiene | Cuándo leerlo |
|---|---|---|
| `CLAUDE.md` (este) | Reglas de trabajo, comandos, DoD | Siempre, primero |
| `SDD.md` | Diseño de la solución, hallazgos de auditoría con detalle técnico, estado objetivo | Antes de empezar cualquier tarea |
| `TASKS.md` | Backlog priorizado, atómico y verificable (P0/P1/P2) | Para saber qué hacer y en qué orden |
| `adrs/ADR-0001..0008` | Decisiones de arquitectura ya tomadas (concurrencia, 2FA, contrato token, tests, etc.) | Antes de implementar la tarea que referencia ese ADR |
| `contracts/auth-2fa.openapi.yaml` | Contrato del flujo de login con 2FA (estado objetivo) | Para la tarea de 2FA |
| `contracts/movements.openapi.yaml` | Contrato del endpoint crítico de movimientos | Para la tarea del Kardex |

---

## 6. Orden de ejecución recomendado

1. Leé `SDD.md` entero (es corto y te da el porqué de cada cosa).
2. Abrí `TASKS.md` y trabajá las **P0** en orden. No pases a P1 hasta cerrar las P0.
3. Para cada tarea, abrí el ADR que referencia antes de codear.
4. Al terminar cada tarea, verificá su DoD (§4) y marcá el checkbox en `TASKS.md`.
5. Cuando todas las P0 y P1 estén hechas, hacé una pasada final al README para que cada
   afirmación sea verdadera (tarea P1-README).

---

## 7. Qué NO hacer

- ❌ No migres de Prisma a TypeORM (el SRS lo menciona pero el repo es Prisma; ver ADR-0006).
- ❌ No introduzcas microservicios, colas, ni Redis. El proyecto es un monolito modular a
  propósito (ver SRS sección 21). Mantenelo simple (KISS).
- ❌ No agregues dependencias pesadas sin justificarlo en un ADR.
- ❌ No borres tests existentes para "que pase el CI". Arreglá el código, no el test.
- ❌ No toques el flujo de `JwtStrategy.validate` que revalida el usuario contra la DB: está
  bien hecho y es un punto fuerte.
