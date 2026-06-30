# ADR-0002 — Flujo de login con 2FA exigido (login en dos pasos)

- **Estado:** Aceptada
- **Fecha:** 2026-06-27
- **Decisores:** Auditoría de arquitectura
- **Hallazgo asociado:** SDD H-02 · Tarea P0-2 · Contrato `contracts/auth-2fa.openapi.yaml`

## Contexto

El sistema tiene 2FA TOTP completo a nivel de schema, endpoints y servicio
(`TwoFactorService.validateTwoFactorToken`), pero `auth.service.login()` nunca verifica el
segundo factor. Un usuario con `twoFactorEnabled = true` se autentica solo con
email + password. La feature está anunciada como completa en el README → es seguridad
decorativa.

## Opciones consideradas

### Opción A — Completar el flujo: login en dos pasos (ELEGIDA)
1. `POST /auth/login` con email+password:
   - Usuario **sin** 2FA → emite `access_token` (comportamiento actual, sin cambios).
   - Usuario **con** 2FA → **no** emite el JWT de sesión; devuelve
     `{ requires2FA: true, twoFactorToken }`, donde `twoFactorToken` es un token efímero
     (≈5 min, claim que marca "pre-2FA", distinto del JWT de sesión).
2. `POST /auth/2fa/login` con `{ twoFactorToken, code }`:
   - Valida el `twoFactorToken`, identifica al usuario, valida el TOTP con
     `validateTwoFactorToken`. Si OK → emite el `access_token` de sesión.
   - Mensajes de error genéricos.

**Ventajas:** convierte una feature decorativa en real; reutiliza casi todo lo existente;
patrón estándar y reconocible por un revisor.
**Desventajas:** un endpoint nuevo y un tipo de token efímero adicional.

### Opción B — Quitar 2FA del README (marcarlo "en progreso")
**Ventajas:** cero código. **Desventajas:** desperdicia trabajo ya hecho y resta valor al
portafolio; deja capacidades muertas en el código.

### Opción C — 2FA obligatorio para todos en el primer login
**Desventajas:** fricción innecesaria para un demo; rompe el seed de usuarios demo.

## Decisión

**Opción A.** Maximiza el valor de portafolio y cierra el agujero de seguridad reutilizando
el `TwoFactorService` ya presente.

## Consecuencias

- `login()` cambia su tipo de retorno a una unión: `{ access_token, user }` |
  `{ requires2FA: true, twoFactorToken }`. Documentar en Swagger ambas formas.
- Nuevo endpoint `POST /auth/2fa/login`.
- El `twoFactorToken` NO debe ser usable como JWT de sesión (claim/segmento distinto, vida
  corta). No debe dar acceso a endpoints protegidos.
- Tests: sin-2FA inalterado; con-2FA exige el segundo paso; código inválido → 401.
- README: la entrada "2FA ✅" pasa a ser verdadera; documentar el flujo de dos pasos.
