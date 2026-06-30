/**
 * Smoke test del authStore móvil.
 *
 * Verifica el estado inicial, la presencia de las acciones y que el flujo 2FA del store
 * queda correctamente cableado (login que requiere 2FA no autentica; logout limpia estado).
 * Se mockean expo-secure-store y el authService para no tocar almacenamiento real ni la red.
 *
 * @file authStore.test.ts
 */

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../api/auth.service', () => ({
  authService: {
    login: jest.fn(),
    verify2FA: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
  },
}));

import { useAuthStore } from './authStore';
import { authService } from '../api/auth.service';

describe('mobile authStore (smoke)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      requires2FA: false,
      tempToken: null,
    });
    jest.clearAllMocks();
  });

  it('tiene el estado inicial esperado', () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.token).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.requires2FA).toBe(false);
  });

  it('expone las acciones principales', () => {
    const s = useAuthStore.getState();
    expect(typeof s.login).toBe('function');
    expect(typeof s.verify2FA).toBe('function');
    expect(typeof s.logout).toBe('function');
    expect(typeof s.checkAuth).toBe('function');
  });

  it('login con 2FA NO autentica y guarda el twoFactorToken', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      requires2FA: true,
      twoFactorToken: 'ephemeral',
    });

    const ok = await useAuthStore.getState().login('a@b.com', 'pass');

    expect(ok).toBe(false);
    const s = useAuthStore.getState();
    expect(s.requires2FA).toBe(true);
    expect(s.tempToken).toBe('ephemeral');
    expect(s.isAuthenticated).toBe(false);
  });

  it('login exitoso (sin 2FA) autentica y guarda el access_token', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      access_token: 'real-token',
      user: { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'ADMIN' },
    });

    const ok = await useAuthStore.getState().login('a@b.com', 'pass');

    expect(ok).toBe(true);
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.token).toBe('real-token');
  });

  it('logout limpia el estado', async () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'ADMIN' },
      token: 'real-token',
      isAuthenticated: true,
    });

    await useAuthStore.getState().logout();

    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.token).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });
});
