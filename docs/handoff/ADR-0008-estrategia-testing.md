# ADR-0008 — Estrategia de testing y honestidad de cobertura

- **Estado:** Aceptada
- **Fecha:** 2026-06-27
- **Decisores:** Auditoría de arquitectura
- **Hallazgo asociado:** SDD H-09

## Contexto

El SRS (DoD) y el README prometen **cobertura mínima 80% con Jest, enfocada en la lógica de
negocio (services)**. La realidad: 3 de 11 servicios del backend tienen test; frontend 3;
mobile 0. El CI usa `--passWithNoTests`, de modo que la barra no se aplica y el pipeline da
verde sin pruebas.

El problema no es solo "faltan tests": es que hay una **afirmación falsa** sobre calidad, que
es peor que no afirmar nada.

## Opciones consideradas

- **A (ELEGIDA):** priorizar tests donde hay **lógica de negocio real** (no getters triviales),
  quitar `--passWithNoTests` del CI una vez existan suites, y **alinear la afirmación de
  cobertura al número real**. Si se llega a 80% honestamente, mantener la promesa; si no, el
  README declara el porcentaje verdadero. La honestidad epistémica vale más que un número.
- B: generar tests masivos triviales para inflar el porcentaje al 80%. Descartada: cobertura
  inflada con asserts vacíos es deshonesta y un revisor la detecta.
- C: bajar la promesa a 0 y no testear. Descartada: desperdicia los buenos tests existentes y
  deja sin cubrir lógica crítica.

## Prioridad de cobertura (orden sugerido)

1. `two-factor.service` — seguridad; además queda tocado por ADR-0002.
2. `alerts.service` y `reports.service` — KPIs y stock bajo; tocados por ADR-0005.
3. `categories.service`, `suppliers.service`, `users.service` — CRUD con casos de borde
   (404, duplicados, soft delete).
4. Smoke test del `authStore` mobile y del flujo de login web (cubre la regresión de H-08).

## Decisión

**Opción A.** Cubrir lo crítico primero, hacer que el CI exija tests de verdad, y decir la
verdad sobre la cobertura.

## Consecuencias

- Se eliminan los `--passWithNoTests` del job de tests del CI (backend y frontend) **después**
  de crear las suites, para no romper el pipeline antes de tiempo.
- El README/SRS declaran cobertura real (medida con `pnpm test --coverage`).
- Cada nueva tarea de feature/fix incluye su test (ya exigido por CLAUDE.md §4).
