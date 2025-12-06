/**
 * Tests unitarios para authStore.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

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
