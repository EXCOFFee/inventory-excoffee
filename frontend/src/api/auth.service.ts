/**
 * Servicio de autenticación
 */

import apiClient from './client';
import {
  User,
  LoginCredentials,
  RegisterData,
  LoginResponse,
  LoginSuccessResponse,
} from '../types';

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface TwoFactorStatus {
  twoFactorEnabled: boolean;
}

export const authService = {
  /**
   * Iniciar sesión (paso 1). Puede devolver el access_token o, si el usuario tiene 2FA,
   * `{ requires2FA, twoFactorToken }` para completar el paso 2.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  /**
   * Paso 2 del login con 2FA: envía el token efímero + el código TOTP y obtiene el access_token.
   */
  async verify2FA(twoFactorToken: string, code: string): Promise<LoginSuccessResponse> {
    const { data } = await apiClient.post<LoginSuccessResponse>('/auth/2fa/login', {
      twoFactorToken,
      code,
    });
    return data;
  },

  /**
   * Registrar nuevo usuario (solo ADMIN). El backend devuelve el usuario creado, sin token.
   */
  async register(userData: RegisterData): Promise<User> {
    const { data } = await apiClient.post<User>('/auth/register', userData);
    return data;
  },

  /**
   * Obtener perfil del usuario actual
   */
  async getProfile(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/profile');
    return data;
  },

  /**
   * Cerrar sesión (limpia almacenamiento local)
   */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  /**
   * Verificar si hay sesión activa
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  /**
   * Obtener token almacenado
   */
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  /**
   * Guardar datos de sesión.
   * Lee `access_token` (snake_case), que es el campo que realmente emite el backend.
   * Antes se leía `response.accessToken` (camelCase), inexistente → se guardaba `undefined`
   * y el login web quedaba roto (H-08 / ADR-0007).
   */
  saveSession(response: LoginSuccessResponse): void {
    localStorage.setItem('accessToken', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
  },

  /**
   * Obtener usuario almacenado
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // ============================================
  // MÉTODOS 2FA
  // ============================================

  /**
   * Generar secreto 2FA
   */
  async generate2FA(): Promise<TwoFactorSetup> {
    const { data } = await apiClient.post<TwoFactorSetup>('/auth/2fa/generate');
    return data;
  },

  /**
   * Habilitar 2FA
   */
  async enable2FA(token: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/2fa/enable', { token });
    return data;
  },

  /**
   * Deshabilitar 2FA
   */
  async disable2FA(token: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/2fa/disable', { token });
    return data;
  },

  /**
   * Obtener estado de 2FA
   */
  async get2FAStatus(): Promise<TwoFactorStatus> {
    const { data } = await apiClient.get<TwoFactorStatus>('/auth/2fa/status');
    return data;
  },

  /**
   * Cambiar contraseña
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return data;
  },
};
