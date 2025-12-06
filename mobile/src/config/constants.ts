/**
 * Constantes de configuración de la aplicación móvil.
 */

import { Platform } from 'react-native';

// API URL base según plataforma
export const API_URL = Platform.select({
  ios: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  android: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api', // Android emulator
  default: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
});

// Configuración de la app
export const APP_CONFIG = {
  name: 'InventoryPro',
  version: '1.0.0',
  
  // Cache
  cacheTime: 1000 * 60 * 5, // 5 minutos
  staleTime: 1000 * 60 * 2, // 2 minutos
  
  // Paginación
  defaultPageSize: 20,
  
  // Timeouts
  apiTimeout: 15000,
  
  // Storage keys
  storageKeys: {
    token: 'auth_token',
    refreshToken: 'refresh_token',
    user: 'auth_user',
    theme: 'app_theme',
    language: 'app_language',
  },
};

// Colores del tema (coinciden con Tailwind config)
export const COLORS = {
  primary: {
    50: '#e6f3ff',
    100: '#b3dbff',
    200: '#80c3ff',
    300: '#4dabff',
    400: '#1a93ff',
    500: '#0080ff',
    600: '#0066cc',
    700: '#004d99',
    800: '#003366',
    900: '#001a33',
  },
  dark: {
    50: '#e8e8ed',
    100: '#d1d1db',
    200: '#a0a0b2',
    300: '#808094',
    400: '#65657f',
    500: '#4a4a60',
    600: '#3a3a50',
    700: '#2a2a3e',
    800: '#1e1e2e',
    900: '#141420',
    950: '#0a0a10',
  },
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#0080ff',
  accent: {
    cyan: '#00d4ff',
    purple: '#a855f7',
    pink: '#ec4899',
  },
};
