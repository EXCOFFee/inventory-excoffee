# ADR-0004 — Hardening de CORS y secreto JWT

- **Estado:** Aceptada
- **Fecha:** 2026-06-27
- **Decisores:** Auditoría de arquitectura
- **Hallazgos asociados:** SDD H-05 y H-07 · Tarea P2-CORS

## Contexto

1. `main.ts` usa `origin: process.env.CORS_ORIGIN || '*'` con `credentials: true`. La
   combinación `*` + credenciales es inválida en navegadores e insegura.
2. El secreto JWT de ejemplo se usa como fallback real en `docker-compose.yml`
   (`${JWT_SECRET:-inventory-pro-super-secret-key-change-in-production}`).

## Opciones consideradas

### CORS
- **A (ELEGIDA):** default concreto de desarrollo (`http://localhost:5173`); soportar lista
  separada por comas vía `CORS_ORIGIN`; en `NODE_ENV=production` exigir `CORS_ORIGIN` y fallar
  el arranque si falta (fail-fast con mensaje claro).
- B: dejar `*` sin credenciales. Descartada: rompe el uso de cookies/credenciales y es menos
  seguro.

### Secreto JWT
- **A (ELEGIDA):** mantener el ejemplo en `.env.example`, pero en `production` validar que
  `JWT_SECRET` esté definido y no sea el valor de ejemplo; si lo es, fallar/advertir. Documentar
  en README y `.env.example`.
- B: generar un secreto aleatorio en runtime si falta. Descartada: invalida tokens entre
  reinicios y oculta un error de configuración.

## Decisión

Opción A en ambos. Principio común: **fail-fast en producción ante configuración insegura**;
defaults cómodos solo en desarrollo.

## Consecuencias

- `.env.example` documenta `CORS_ORIGIN` y la obligación de cambiar `JWT_SECRET`.
- Arranque local sigue funcionando sin configuración extra.
- Arranque en producción sin `CORS_ORIGIN` o con secreto de ejemplo → falla con mensaje claro.
- Test/arranque smoke que cubra el fail-fast (puede ser un test de la función de bootstrap o
  una verificación documentada en el README de deployment).
