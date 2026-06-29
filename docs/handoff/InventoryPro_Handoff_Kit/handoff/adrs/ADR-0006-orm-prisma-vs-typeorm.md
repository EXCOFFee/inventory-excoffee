# ADR-0006 — ORM: Prisma como decisión, TypeORM descartado

- **Estado:** Aceptada (formaliza el estado de hecho del repo)
- **Fecha:** 2026-06-27
- **Decisores:** Auditoría de arquitectura
- **Hallazgo asociado:** SDD H-04 · Tarea P1-SRS

## Contexto

El SRS dice "PostgreSQL con TypeORM/Prisma" y su ejemplo de código (sección 22.3) está escrito
en TypeORM con la transacción sin implementar. El repositorio real está construido
íntegramente sobre **Prisma**, con la transacción implementada. Esta contradicción entre el
documento y el código resta credibilidad.

## Opciones consideradas

- **A (ELEGIDA):** formalizar **Prisma** como el ORM del proyecto y actualizar el SRS para que
  TypeORM figure como alternativa evaluada y descartada. Reescribir el ejemplo de la sección
  22.3 en Prisma, reflejando el `movements.service.ts` final (con decremento atómico de
  ADR-0001).
- B: migrar el código a TypeORM para coincidir con el ejemplo del SRS. Descartada: reescritura
  masiva sin beneficio, alto riesgo, contradice "no degradar lo que funciona".

## Decisión

**Opción A.** El código manda; el documento se alinea al código.

## Consecuencias

- El SRS pasa a declarar Prisma como elección (tipado generado, migraciones declarativas,
  DX) y TypeORM como descartado (más boilerplate, decisión de equipo).
- El ejemplo 22.3 se reescribe en Prisma **con la transacción y el decremento condicional
  ya resueltos**, de modo que coincida exactamente con el código final.
- Se añaden al SRS secciones breves para 2FA (ADR-0002) y la entidad StockAlert.
- ⚠️ El SRS vive **fuera del repo**. Si el agente no puede escribirlo, debe entregar el bloque
  reescrito en su resumen final para que el humano lo pegue en el documento.
