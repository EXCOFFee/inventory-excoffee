# ADR-0001 — Control de concurrencia en el registro de movimientos de stock

- **Estado:** Aceptada
- **Fecha:** 2026-06-27
- **Decisores:** Auditoría de arquitectura (Principal Software Architect)
- **Hallazgo asociado:** SDD H-01 · Tarea P0-1 · Contrato `contracts/movements.openapi.yaml`

## Contexto

`movements.service.ts > create()` actualiza el stock con un patrón *read-modify-write*: lee
`currentStock`, calcula el nuevo valor en JavaScript, y lo escribe. La transacción de Prisma
da **atomicidad** (movimiento + update juntos) pero **no aislamiento** contra concurrencia.
Dos salidas simultáneas del mismo producto pueden leer el mismo stock inicial y producir una
escritura perdida (stock final incorrecto, potencialmente negativo en términos de realidad
física). La invariante a proteger es: **el stock nunca refleja más unidades de las que
existen, ni queda negativo, sin importar cuántas operaciones concurrentes haya.**

## Opciones consideradas

### Opción A — Decremento/incremento condicional atómico (ELEGIDA)
Dentro de la transacción:
- **OUT:** `updateMany({ where: { id, currentStock: { gte: quantity } }, data: { currentStock: { decrement: quantity } } })`.
  Si `count === 0` → no había stock suficiente (o el producto no está) → lanzar
  `BadRequestException`. La condición de stock la evalúa la base de datos atómicamente.
- **IN:** `update({ where: { id }, data: { currentStock: { increment: quantity } } })`.
- `stockAfter` se deriva del valor persistido, no de la lectura previa.

**Ventajas:** sin reintentos, complejidad mínima, garantía a nivel DB, fácil de testear.
**Desventajas:** la validación de "stock insuficiente" se infiere del `count`, hay que
distinguir el caso "producto inexistente" (resolver con el `findUnique` previo que ya existe
para el 404 y el chequeo de `isActive`).

### Opción B — Transacción Serializable
Pasar `{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }` y reintentar ante
error de serialización.
**Ventajas:** "de libro", protege invariantes complejas. **Desventajas:** requiere lógica de
reintento, más superficie de error, sobre-ingeniería para una sola invariante simple (viola
KISS del SRS sección 19).

### Opción C — Lock pesimista (`SELECT ... FOR UPDATE`)
Vía `$queryRaw`. **Ventajas:** explícito. **Desventajas:** acopla a SQL crudo, riesgo de
deadlocks si se escala a operaciones multi-producto, más difícil de mantener.

## Decisión

**Opción A.** Es la que mejor equilibra corrección, simplicidad (KISS) y testeabilidad para
la invariante puntual de stock. El JSDoc del método debe explicar por qué A sobre B/C.

## Consecuencias

- `create()` deja de calcular el stock final en memoria como fuente de verdad.
- Se mantiene el `findUnique` previo para el 404 y el chequeo de `isActive` (mensajes claros).
- Se agrega un test de concurrencia (dos OUT simultáneos) que verifica que el stock no se
  corrompe y que exactamente una de las dos operaciones falla cuando no hay stock para ambas.
- El contrato OpenAPI de `/movements` documenta el 400 de stock insuficiente como garantía
  bajo concurrencia.
