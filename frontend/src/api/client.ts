/**
 * Cliente HTTP base con Axios.
 *
 * ⚠️ Almacenamiento del token (decisión consciente — ADR-0007 / H-10):
 * El JWT se lee/escribe en `localStorage` (ver `auth.service.ts`). Es simple pero queda
 * **expuesto a XSS**: cualquier script inyectado podría leerlo. Se mitiga con Helmet + CSP en
 * el backend. La alternativa ideal —cookie `httpOnly` + `SameSite=Strict` emitida por el
 * backend, ilegible desde JS— es un cambio mayor de la arquitectura de auth (afecta login,
 * estos interceptores y CORS con credenciales) y se deja documentada como evolución futura, no
 * como pendiente oculto. (El mobile sí usa almacenamiento seguro: expo-secure-store.)
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Crear instancia de Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de request para agregar token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response para manejo de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
