/**
 * Validación de configuración por entorno y resolución de CORS (P2-CORS / ADR-0004).
 *
 * Principio: **fail-fast en producción ante configuración insegura**, con defaults cómodos solo
 * en desarrollo. Se extrae a funciones puras para poder testearlas sin levantar la app.
 */

/**
 * Secretos JWT de ejemplo/fallback que NO deben usarse en `NODE_ENV=production`.
 * Incluye el valor de `.env.example`/`docker-compose.yml` y el fallback de desarrollo.
 */
export const INSECURE_JWT_SECRETS = [
  'inventory-pro-super-secret-key-change-in-production',
  'default-dev-secret',
];

/** Origen permitido por defecto en desarrollo (el front de Vite). */
export const DEV_CORS_ORIGIN = 'http://localhost:5173';

/**
 * Resuelve la lista de orígenes CORS permitidos.
 * - Si `CORS_ORIGIN` está definido: lista separada por comas (trim, sin vacíos).
 * - Si no: default de desarrollo (`http://localhost:5173`).
 *
 * Nunca devuelve `'*'`: esa combinación con `credentials: true` es inválida en navegadores e
 * insegura (H-05). En producción `CORS_ORIGIN` es obligatorio (ver `validateProductionEnv`).
 */
export function resolveCorsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = env.CORS_ORIGIN?.trim();
  if (raw) {
    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
  return [DEV_CORS_ORIGIN];
}

/**
 * Valida la configuración crítica cuando `NODE_ENV=production`. Lanza un `Error` (fail-fast) con
 * un mensaje claro si:
 * - falta `CORS_ORIGIN`, o
 * - falta `JWT_SECRET` o es uno de los valores de ejemplo/fallback (`INSECURE_JWT_SECRETS`).
 *
 * Fuera de producción no hace nada (defaults cómodos para desarrollo).
 */
export function validateProductionEnv(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  const errors: string[] = [];

  if (!env.CORS_ORIGIN?.trim()) {
    errors.push(
      'CORS_ORIGIN es obligatorio en producción (lista de orígenes permitidos separada por comas).',
    );
  }

  const secret = env.JWT_SECRET?.trim();
  if (!secret) {
    errors.push('JWT_SECRET es obligatorio en producción.');
  } else if (INSECURE_JWT_SECRETS.includes(secret)) {
    errors.push(
      'JWT_SECRET no puede ser el valor de ejemplo/fallback: definí un secreto fuerte y único ' +
        '(p. ej. `openssl rand -base64 48`).',
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuración insegura para NODE_ENV=production:\n  - ${errors.join('\n  - ')}`,
    );
  }
}
