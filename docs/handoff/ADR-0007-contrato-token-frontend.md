# ADR-0007 — Contrato del token unificado y storage en el cliente

- **Estado:** Aceptada
- **Fecha:** 2026-06-27
- **Decisores:** Auditoría de arquitectura
- **Hallazgos asociados:** SDD H-08 (login web roto) y H-10 (JWT en localStorage)

## Contexto

Dos problemas relacionados con el manejo del token en los clientes:

1. **Mismatch de contrato (H-08):** el backend devuelve `{ access_token }` (snake_case). El
   frontend web lee `response.accessToken` (camelCase) → guarda `undefined` → login roto. El
   tipo TS declara ambos campos, lo que oculta el bug. El mobile usa fallback
   `accessToken || access_token` y funciona por casualidad.
2. **Storage inseguro (H-10):** el frontend web guarda el JWT en `localStorage`, expuesto a
   robo vía XSS. El mobile usa `expo-secure-store` (correcto).

## Decisión

### Contrato del token: snake_case `access_token` (fuente única)
- El backend ya emite `access_token` y el contrato OpenAPI lo documenta así → **se mantiene**.
- Frontend: leer `response.access_token`; **eliminar** `accessToken` del tipo `auth.ts`.
- Mobile: usar solo `access_token`; quitar el fallback `|| response.accessToken`.
- Alternativa descartada: cambiar el backend a camelCase. Rompería el contrato documentado y
  obligaría a tocar mobile sin beneficio.

### Storage del token: dos niveles
- **Nivel mínimo (obligatorio):** documentar el trade-off de `localStorage` en el README y en
  el código; mantener Helmet + CSP en el backend como mitigación de XSS. Aceptable para un
  portafolio si se demuestra consciencia del riesgo.
- **Nivel ideal (opcional, si hay tiempo):** migrar a cookie `httpOnly` + `SameSite=Strict`
  emitida por el backend; el frontend deja de manipular el token. Es un cambio mayor de la
  arquitectura de auth (afecta login, interceptores y CORS con credenciales) → se trata como
  mejora separada, NO bloqueante para cerrar el portafolio.

## Consecuencias

- Se corrige el login web (H-08) con un cambio mínimo y un test que evita la regresión.
- El tipo `LoginResponse` queda con un solo campo de token, sin ambigüedad.
- La decisión de storage queda explícita y defendible ante un revisor, con un camino de
  mejora documentado.
