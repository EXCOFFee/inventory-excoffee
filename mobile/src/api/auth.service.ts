/**
 * Servicio de Autenticación - Móvil.
 */

import apiClient from './client';
import * as SecureStore from 'expo-secure-store';

export interface LoginDto {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'STAFF';
  twoFactorEnabled?: boolean;
}

export interface LoginResponse {
  // Contrato unificado en snake_case (ADR-0007). El token de sesión llega como access_token.
  access_token?: string;
  requires2FA?: boolean;
  twoFactorToken?: string;
  user?: User;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const authService = {
  async login(data: LoginDto): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);

    // Contrato unificado: el backend emite `access_token` (sin fallback camelCase).
    const token = response.data.access_token;
    if (token) {
      await SecureStore.setItemAsync('auth_token', token);
    }

    return response.data;
  },

  async verify2FA(twoFactorToken: string, code: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/2fa/login', {
      twoFactorToken,
      code,
    });

    const token = response.data.access_token;
    if (token) {
      await SecureStore.setItemAsync('auth_token', token);
    }

    return response.data;
  },

  async register(data: RegisterDto): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token');
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('auth_token');
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },
};
