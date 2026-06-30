/**
 * Tests del hardening de configuración (P2-CORS / ADR-0004).
 *
 * @file env.validation.spec.ts
 */

import {
  resolveCorsOrigins,
  validateProductionEnv,
  DEV_CORS_ORIGIN,
  INSECURE_JWT_SECRETS,
} from './env.validation';

describe('env.validation', () => {
  describe('resolveCorsOrigins', () => {
    it('devuelve el default de dev cuando CORS_ORIGIN no está definido', () => {
      expect(resolveCorsOrigins({})).toEqual([DEV_CORS_ORIGIN]);
    });

    it('parsea una lista separada por comas (trim, sin vacíos)', () => {
      expect(
        resolveCorsOrigins({ CORS_ORIGIN: 'http://a.com, http://b.com ,, http://c.com' }),
      ).toEqual(['http://a.com', 'http://b.com', 'http://c.com']);
    });

    it('nunca devuelve "*"', () => {
      expect(resolveCorsOrigins({ CORS_ORIGIN: 'https://app.example.com' })).not.toContain('*');
    });
  });

  describe('validateProductionEnv', () => {
    it('no hace nada fuera de producción', () => {
      expect(() => validateProductionEnv({ NODE_ENV: 'development' })).not.toThrow();
      expect(() => validateProductionEnv({})).not.toThrow();
    });

    it('falla en producción si falta CORS_ORIGIN', () => {
      expect(() =>
        validateProductionEnv({ NODE_ENV: 'production', JWT_SECRET: 'un-secreto-fuerte-y-unico' }),
      ).toThrow(/CORS_ORIGIN/);
    });

    it('falla en producción si falta JWT_SECRET', () => {
      expect(() =>
        validateProductionEnv({ NODE_ENV: 'production', CORS_ORIGIN: 'https://app.example.com' }),
      ).toThrow(/JWT_SECRET/);
    });

    it('falla en producción si JWT_SECRET es el valor de ejemplo/fallback', () => {
      for (const insecure of INSECURE_JWT_SECRETS) {
        expect(() =>
          validateProductionEnv({
            NODE_ENV: 'production',
            CORS_ORIGIN: 'https://app.example.com',
            JWT_SECRET: insecure,
          }),
        ).toThrow(/JWT_SECRET/);
      }
    });

    it('no falla en producción con configuración segura', () => {
      expect(() =>
        validateProductionEnv({
          NODE_ENV: 'production',
          CORS_ORIGIN: 'https://app.example.com,https://admin.example.com',
          JWT_SECRET: 'un-secreto-fuerte-y-unico-de-verdad',
        }),
      ).not.toThrow();
    });
  });
});
