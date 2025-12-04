/**
 * Servicio de autenticación
 */

import apiClient from './client';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types';

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
   * Iniciar sesión
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  /**
   * Registrar nuevo usuario
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', userData);
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
   * Guardar datos de sesión
   */
  saveSession(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
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
