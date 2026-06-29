/**
 * Tests unitarios para authStore.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuthStore } from './authStore';
import { authService } from '../api';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should have initial state', () => {
    const state = useAuthStore.getState();
    
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should clear error', () => {
    useAuthStore.setState({ error: 'Some error' });
    
    useAuthStore.getState().clearError();
    
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('should logout and clear state', () => {
    // Set up authenticated state
    useAuthStore.setState({
      user: { id: '1', email: 'test@test.com', name: 'Test User', firstName: 'Test', lastName: 'User', role: 'STAFF', isActive: true },
      token: 'some-token',
      isAuthenticated: true,
    });

    // Logout
    useAuthStore.getState().logout();

    // Verify state is cleared
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should have login method', () => {
    expect(useAuthStore.getState().login).toBeDefined();
    expect(typeof useAuthStore.getState().login).toBe('function');
  });

  it('should have register method', () => {
    expect(useAuthStore.getState().register).toBeDefined();
    expect(typeof useAuthStore.getState().register).toBe('function');
  });

  it('should have checkAuth method', () => {
    expect(useAuthStore.getState().checkAuth).toBeDefined();
    expect(typeof useAuthStore.getState().checkAuth).toBe('function');
  });
});

describe('authStore login (contrato access_token)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requires2FA: false,
      twoFactorToken: null,
    });
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('guarda el token desde access_token (no undefined) tras un login exitoso', async () => {
    // Regresión de H-08: antes se leía response.accessToken (inexistente) → token undefined.
    const successResponse = {
      access_token: 'real-jwt-token',
      user: { id: '1', email: 'a@b.com', name: 'Admin', role: 'ADMIN' as const },
    };
    vi.spyOn(authService, 'login').mockResolvedValue(successResponse);
    const saveSpy = vi.spyOn(authService, 'saveSession').mockImplementation(() => {});

    await useAuthStore.getState().login({ email: 'a@b.com', password: 'x' });

    const state = useAuthStore.getState();
    expect(state.token).toBe('real-jwt-token');
    expect(state.token).not.toBeUndefined();
    expect(state.isAuthenticated).toBe(true);
    // saveSession recibe la respuesta con access_token (no accessToken).
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ access_token: 'real-jwt-token' }));
  });

  it('entra en estado 2FA pendiente sin autenticar cuando requires2FA', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      requires2FA: true,
      twoFactorToken: 'ephemeral-token',
    } as never);

    await useAuthStore.getState().login({ email: 'a@b.com', password: 'x' });

    const state = useAuthStore.getState();
    expect(state.requires2FA).toBe(true);
    expect(state.twoFactorToken).toBe('ephemeral-token');
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
  });
});
