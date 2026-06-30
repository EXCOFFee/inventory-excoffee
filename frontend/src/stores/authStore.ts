/**
 * Store de autenticación con Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials, RegisterData, isTwoFactorRequired } from '../types';
import { authService } from '../api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Estado del flujo 2FA (paso 2 del login)
  requires2FA: boolean;
  twoFactorToken: string | null;

  // Acciones
  login: (credentials: LoginCredentials) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requires2FA: false,
      twoFactorToken: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null, requires2FA: false, twoFactorToken: null });
        try {
          const response = await authService.login(credentials);

          // Si el usuario tiene 2FA, no hay sesión todavía: guardamos el token efímero y
          // dejamos que la UI pida el código (paso 2).
          if (isTwoFactorRequired(response)) {
            set({
              requires2FA: true,
              twoFactorToken: response.twoFactorToken,
              isLoading: false,
            });
            return;
          }

          authService.saveSession(response);
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      verify2FA: async (code: string) => {
        const { twoFactorToken } = get();
        if (!twoFactorToken) {
          const message = 'La sesión de verificación expiró. Iniciá sesión de nuevo.';
          set({ error: message });
          throw new Error(message);
        }

        set({ isLoading: true, error: null });
        try {
          const response = await authService.verify2FA(twoFactorToken, code);
          authService.saveSession(response);
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            requires2FA: false,
            twoFactorToken: null,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Código de verificación inválido';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          // El registro es una acción de ADMIN que crea un usuario; el backend no devuelve
          // token, así que NO inicia sesión como el usuario creado.
          await authService.register(data);
          set({ isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Error al registrarse';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          requires2FA: false,
          twoFactorToken: null,
        });
      },

      checkAuth: async () => {
        const token = authService.getToken();
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return;
        }

        try {
          const user = await authService.getProfile();
          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch {
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
