/**
 * Configuración de i18next para internacionalización.
 * 
 * Soporta español (es) e inglés (en).
 * Detecta automáticamente el idioma del navegador.
 * 
 * @file i18n.ts
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traducciones
import es from './locales/es.json';
import en from './locales/en.json';

// Recursos de traducción
const resources = {
  es: { translation: es },
  en: { translation: en },
};

i18n
  // Detector de idioma del navegador
  .use(LanguageDetector)
  // Integración con React
  .use(initReactI18next)
  // Inicialización
  .init({
    resources,
    fallbackLng: 'es', // Idioma por defecto
    supportedLngs: ['es', 'en'],
    
    // Opciones de detección
    detection: {
      // Orden de detección: localStorage > navegador > html
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Guardar preferencia en localStorage
      lookupLocalStorage: 'inventorypro-language',
      caches: ['localStorage'],
    },
    
    // Interpolación
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },
    
    // Espacios de nombres
    ns: ['translation'],
    defaultNS: 'translation',
    
    // Debug en desarrollo
    debug: import.meta.env.DEV,
    
    // Recargar en cambios (desarrollo)
    react: {
      useSuspense: true,
    },
  });

export default i18n;

// Helper para cambiar idioma
export const changeLanguage = (lng: 'es' | 'en') => {
  i18n.changeLanguage(lng);
  localStorage.setItem('inventorypro-language', lng);
};

// Helper para obtener idioma actual
export const getCurrentLanguage = () => i18n.language;

// Lista de idiomas disponibles
export const availableLanguages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];
