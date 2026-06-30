# ADR-0003 — Veracidad del README (cada ✅ mapea a código real)

- **Estado:** Aceptada
- **Fecha:** 2026-06-27
- **Decisores:** Auditoría de arquitectura
- **Hallazgo asociado:** SDD H-03 · Tarea P1-README

## Contexto

El README es el primer artefacto que lee un reclutador. Hoy contiene afirmaciones falsas o
no ejecutables: "refresh tokens ✅" (no existen), `docker-compose.prod.yml` (no existe),
"Licencia MIT, ver LICENSE" (no existe el archivo), app móvil marcada como "próxima" cuando
el código ya existe, "costos promedio" no calculado como tal, y "pnpm = gestor seguro"
(impreciso).

## Opciones consideradas

### Opción A — Hacer verdadera cada afirmación o eliminarla (ELEGIDA)
Regla única: **cada ✅ debe corresponder a código que existe y funciona; cada comando debe
ejecutarse tal cual; cada archivo referenciado debe existir.** Por ítem:
- Refresh tokens → eliminar de la lista (no implementarlo ahora; queda fuera de alcance).
- `docker-compose.prod.yml` → corregir la instrucción a `docker-compose.yml`, o crear el
  archivo de producción real. Preferir corregir la ruta (menos superficie) salvo que se quiera
  un compose de prod diferenciado.
- `LICENSE` → crear archivo MIT con año y autor.
- App móvil → mover de "próximas [ ]" a la lista de funcionalidades hechas ✅, describiendo
  scanner y formularios.
- "Costos promedio" → ajustar a lo real ("costo unitario y total por movimiento") o
  implementar costo promedio móvil si se decide (fuera de alcance por defecto).
- "pnpm seguro" → reescribir a "pnpm (rápido y eficiente en disco)".

### Opción B — Reescribir el README desde cero
**Desventajas:** se pierde estructura y contenido válido; mayor riesgo de introducir nuevos
errores. Innecesario.

## Decisión

**Opción A.** Edición quirúrgica afirmación por afirmación.

## Consecuencias

- Se crea `LICENSE` (MIT).
- El README queda 100% ejecutable y honesto. Mejora la credibilidad sin inflar.
- Esta tarea se ejecuta **al final**, tras cerrar P0/P1 de código, para que los ✅ ya sean
  verdaderos cuando se redacten.
