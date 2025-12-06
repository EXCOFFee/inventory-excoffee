import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService, User, LoginResponse } from '../api/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  requires2FA: boolean;
  tempToken: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  verify2FA: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  requires2FA: false,
  tempToken: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.requires2FA) {
        set({
          requires2FA: true,
          tempToken: response.tempToken || null,
          isLoading: false,
        });
        return false;
      }
      
      const accessToken = response.accessToken || response.access_token;
      const user = response.user;
      
      if (accessToken && user) {
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
        
        set({
          user,
          token: accessToken,
          isAuthenticated: true,
          isLoading: false,
          requires2FA: false,
          tempToken: null,
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      set({
        error: message,
        isLoading: false,
      });
      return false;
    }
  },

  verify2FA: async (code: string) => {
    const { tempToken } = get();
    if (!tempToken) {
      set({ error: 'Token temporal no disponible' });
      return false;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await authService.verify2FA(tempToken, code);
      const accessToken = response.accessToken || response.access_token;
      const user = response.user;
      
      if (accessToken && user) {
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
        
        set({
          user,
          token: accessToken,
          isAuthenticated: true,
          isLoading: false,
          requires2FA: false,
          tempToken: null,
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Código 2FA inválido';
      set({
        error: message,
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignorar errores del servidor al cerrar sesión
    }
    
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      requires2FA: false,
      tempToken: null,
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      
      if (token && userStr) {
        try {
          const profile = await authService.getProfile();
          set({
            user: profile,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(USER_KEY);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      set({
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
