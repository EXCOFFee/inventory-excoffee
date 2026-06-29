# Handoff Kit — Remediación de InventoryPro

Kit de entrega para que el **agente de Claude Code** corrija el repositorio
`inventory-excoffee` y deje el proyecto listo para impresionar a reclutadores.

## Cómo usar este kit

1. Copiá `CLAUDE.md` a la **raíz del repositorio** (el agente lo lee automáticamente).
2. Pegá `SDD.md`, la carpeta `adrs/`, la carpeta `contracts/` y `TASKS.md` en una carpeta
   `docs/handoff/` del repo (o donde prefieras), y referencialos desde el prompt inicial.
3. Indicá al agente: *"Leé `CLAUDE.md` y `docs/handoff/SDD.md`, luego ejecutá `TASKS.md`
   empezando por las P0."*

## Contenido

```
handoff/
├── README.md                 ← este archivo
├── CLAUDE.md                 ← reglas de trabajo, comandos, Definition of Done
├── SDD.md                    ← diseño + 7 hallazgos de auditoría (qué/por qué/cómo/verificación)
├── TASKS.md                  ← backlog priorizado P0/P1/P2, verificable
├── adrs/
│   ├── ADR-0001-concurrencia-movimientos.md     (🔴 race condition Kardex)
│   ├── ADR-0002-2fa-login-enforcement.md        (🔴 2FA decorativo)
│   ├── ADR-0003-readme-veracidad.md             (🟡 README honesto)
│   ├── ADR-0004-hardening-cors-jwt.md           (🟢 CORS + secreto JWT)
│   ├── ADR-0005-consultas-stock-bajo.md         (🟢 filtrar en DB)
│   ├── ADR-0006-orm-prisma-vs-typeorm.md        (🟡 alinear SRS↔código)
│   ├── ADR-0007-contrato-token-frontend.md      (🔴 login web roto + 🟢 storage XSS)
│   └── ADR-0008-estrategia-testing.md           (🟡 cobertura real)
└── contracts/
    ├── movements.openapi.yaml   ← endpoint crítico de movimientos (estado objetivo)
    └── auth-2fa.openapi.yaml    ← flujo de login con 2FA (estado objetivo)
```

## Resumen de prioridades

| Prio | Tarea | Impacto |
|---|---|---|
| 🔴 P0-1 | Race condition en movimientos | Bug de integridad real en el corazón del sistema |
| 🔴 P0-2 | 2FA exigido en login | Feature de seguridad a medias presentada como completa |
| 🔴 P0-3 | Login web roto (contrato access_token) | La web no deja loguearse: peor primera impresión |
| 🟡 P1-README/SRS | README + SRS veraces | Lo primero que ve un reclutador |
| 🟡 P1-TESTS | Cobertura real de tests | El 80% prometido hoy es falso |
| 🟢 P2 | CORS, JWT, storage token, DTOs, seed Docker, queries | Pulido de seguridad, datos y demo |

**14 hallazgos en total** (H-01 a H-14). El backend, frontend, mobile e infraestructura
fueron auditados. Detalle completo en `SDD.md`.

El detalle técnico de cada punto está en `SDD.md`; la decisión de diseño en el ADR
correspondiente; los pasos ejecutables y criterios de aceptación en `TASKS.md`.
