# ADR-0005 — Consultas de stock bajo a nivel de base de datos

- **Estado:** Aceptada
- **Fecha:** 2026-06-27
- **Decisores:** Auditoría de arquitectura
- **Hallazgo asociado:** SDD H-06 · Tarea P2-QUERY

## Contexto

`alerts.service.checkLowStock()` (cron horario) y `reports.service.getDashboard()` traen
TODOS los productos activos con `findMany` y filtran `currentStock <= minStock` en JavaScript
con `.filter()`. Existe `@@index([currentStock])` sin aprovechar. Contradice RNF01
(optimización de consultas) y no escala.

## Restricción técnica

Prisma **no** permite comparar dos columnas entre sí dentro de un `where` tipado
(`currentStock <= minStock` columna-vs-columna no es expresable con la API fluida).

## Opciones consideradas

- **A (ELEGIDA):** `prisma.$queryRaw` (parametrizado) que filtra `current_stock <= min_stock`
  a nivel SQL y devuelve solo las filas relevantes. Comentario JSDoc explicando que el SQL
  crudo aquí no es un anti-patrón sino la forma idiomática ante la limitación de Prisma.
- B: añadir una columna calculada/booleana `isLowStock` mantenida por la app. Descartada:
  duplica estado, hay que mantenerla sincronizada en cada movimiento (más superficie de bug).
- C: vista materializada en Postgres. Descartada: sobre-ingeniería para el tamaño del proyecto
  (viola KISS).

## Decisión

**Opción A.** Mínimo cambio, usa el índice, idiomático y testeable.

## Consecuencias

- Ambos métodos devuelven exactamente el mismo conjunto de productos que antes (test de
  equivalencia obligatorio) pero filtran en la DB.
- Cuidar la consistencia del criterio: el dashboard hoy usa `currentStock <= minStock &&
  currentStock > 0` (low) y separa `currentStock = 0` (out). Mantener esa distinción.
- `$queryRaw` debe ser parametrizado (sin interpolación de strings) para evitar inyección.
