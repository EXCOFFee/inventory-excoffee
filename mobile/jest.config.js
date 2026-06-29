/**
 * Configuración de Jest para la app móvil (Expo + React Native).
 *
 * El repo declaraba jest/jest-expo pero no tenía configuración, así que `pnpm test` no corría.
 *
 * Para tests de lógica/stores usamos ts-jest en entorno node, SIN el preset `jest-expo`.
 * Motivo: con pnpm, tanto jest-expo (setup de RN con archivos Flow en .pnpm/) como
 * babel-preset-expo (exige react-native-worklets/plugin, ausente) rompen. El store no usa
 * componentes RN y sus dependencias nativas (expo-secure-store, api/auth.service) se mockean.
 * Se fuerza module=CommonJS porque el tsconfig usa ESNext (jest corre en CJS).
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    // isolatedModules ya está activado en tsconfig.json (transpile-only, sin type-check).
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: { module: 'CommonJS', esModuleInterop: true, jsx: 'react' },
      },
    ],
  },
};
