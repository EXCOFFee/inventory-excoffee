// @ts-check
/**
 * Configuración de ESLint (flat config) para el backend NestJS + TypeScript.
 *
 * Por qué este archivo: desde ESLint v9 el formato `.eslintrc.*` quedó obsoleto y se exige
 * `eslint.config.js` (flat config). El repo no lo tenía, así que `pnpm lint` fallaba por
 * ausencia de configuración (no por violaciones reales). Ver SDD H-14 / TASKS P1-LINT.
 *
 * Alcance deliberadamente mínimo y sin type-checking (no se usa `parserOptions.project`):
 * reglas de buenas prácticas de JS + TS, coherentes con NestJS, sin el ruido de las reglas
 * type-aware. Prettier desactiva las reglas de formato para no pelear con el formateador.
 */

const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  // Archivos/carpetas que ESLint no debe analizar.
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'eslint.config.js'],
  },

  // Reglas base recomendadas para JavaScript.
  js.configs.recommended,

  // Reglas para los archivos TypeScript del proyecto.
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // TypeScript ya cubre estas comprobaciones; el set base de JS daría falsos positivos
      // sobre tipos e imports en archivos .ts.
      'no-unused-vars': 'off',
      'no-undef': 'off',
      // NestJS usa `any` de forma puntual y deliberada (usuario inyectado por decorador,
      // `where` dinámico de Prisma). Es una relajación estándar del starter de NestJS.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Debe ir al final: apaga reglas de estilo que colisionan con Prettier.
  prettier,
];
