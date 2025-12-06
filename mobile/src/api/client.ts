/**
 * Cliente HTTP para la API de InventoryPro - Móvil.
 * 
 * Usa axios con interceptores para autenticación.
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// URL base de la API (cambiar en producción)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      await SecureStore.deleteItemAsync('auth_token');
      // El store de auth manejará la redirección
    }
    return Promise.reject(error);
  }
);

export default apiClient;
