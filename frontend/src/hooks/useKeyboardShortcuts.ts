/**
 * Hook para atajos de teclado globales
 * Proporciona navegación rápida y acciones comunes
 */

import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCommandPalette } from '../components/ui';

interface ShortcutAction {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  category: 'navigation' | 'action' | 'general';
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openPalette } = useCommandPalette();

  // Definir todos los atajos
  const shortcuts: ShortcutAction[] = [
    // General
    {
      key: 'k',
      ctrlKey: true,
      action: () => openPalette(),
      description: 'Abrir búsqueda global',
      category: 'general',
    },
    {
      key: '/',
      action: () => openPalette(),
      description: 'Búsqueda rápida',
      category: 'general',
    },
    {
      key: '?',
      shiftKey: true,
      action: () => showShortcutsHelp(),
      description: 'Mostrar ayuda de atajos',
      category: 'general',
    },
    
    // Navegación
    {
      key: 'h',
      altKey: true,
      action: () => navigate('/'),
      description: 'Ir al Dashboard',
      category: 'navigation',
    },
    {
      key: 'p',
      altKey: true,
      action: () => navigate('/products'),
      description: 'Ir a Productos',
      category: 'navigation',
    },
    {
      key: 'm',
      altKey: true,
      action: () => navigate('/movements'),
      description: 'Ir a Movimientos',
      category: 'navigation',
    },
    {
      key: 'c',
      altKey: true,
      action: () => navigate('/categories'),
      description: 'Ir a Categorías',
      category: 'navigation',
    },
    {
      key: 's',
      altKey: true,
      action: () => navigate('/suppliers'),
      description: 'Ir a Proveedores',
      category: 'navigation',
    },
    {
      key: 'a',
      altKey: true,
      action: () => navigate('/alerts'),
      description: 'Ir a Alertas',
      category: 'navigation',
    },
    {
      key: 'r',
      altKey: true,
      action: () => navigate('/reports'),
      description: 'Ir a Reportes',
      category: 'navigation',
    },
    {
      key: 'u',
      altKey: true,
      action: () => navigate('/users'),
      description: 'Ir a Usuarios',
      category: 'navigation',
    },
    
    // Acciones contextuales
    {
      key: 'n',
      ctrlKey: true,
      action: () => {
        // Crear nuevo según la página actual
        if (location.pathname.includes('/products')) {
          navigate('/products/new');
        } else if (location.pathname.includes('/categories')) {
          // Trigger modal de nueva categoría (dispatch custom event)
          window.dispatchEvent(new CustomEvent('keyboard:new-item'));
        } else if (location.pathname.includes('/suppliers')) {
          window.dispatchEvent(new CustomEvent('keyboard:new-item'));
        }
      },
      description: 'Crear nuevo item',
      category: 'action',
    },
    {
      key: 'Escape',
      action: () => {
        // Cerrar modales, limpiar selección, etc.
        window.dispatchEvent(new CustomEvent('keyboard:escape'));
      },
      description: 'Cerrar/Cancelar',
      category: 'general',
    },
    {
      key: 'Backspace',
      altKey: true,
      action: () => navigate(-1),
      description: 'Volver atrás',
      category: 'navigation',
    },
  ];

  // Función para mostrar ayuda de atajos
  const showShortcutsHelp = useCallback(() => {
    window.dispatchEvent(new CustomEvent('keyboard:show-help', { 
      detail: { shortcuts } 
    }));
  }, []);

  // Manejador de eventos de teclado
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignorar si estamos en un input/textarea/contenteditable
    const target = event.target as HTMLElement;
    const isInputElement = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable ||
      target.closest('[role="dialog"]') !== null;

    // Para algunos atajos, permitir incluso en inputs
    const allowInInputs = ['k', 'Escape'].includes(event.key) && event.ctrlKey;

    if (isInputElement && !allowInInputs) {
      // Solo permitir Escape en inputs
      if (event.key !== 'Escape') {
        return;
      }
    }

    // Buscar el atajo que coincida
    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const altMatches = shortcut.altKey ? event.altKey : !event.altKey;
      const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;

      if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  // Registrar el event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts,
    showShortcutsHelp,
  };
};

// Hook para escuchar eventos de atajos en componentes específicos
export const useShortcutEvent = (
  eventName: string,
  callback: (detail?: any) => void
) => {
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };

    window.addEventListener(eventName as any, handler);
    return () => {
      window.removeEventListener(eventName as any, handler);
    };
  }, [eventName, callback]);
};

// Componente de overlay para mostrar atajos
export const getShortcutsList = () => [
  { category: 'General', shortcuts: [
    { keys: ['Ctrl', 'K'], description: 'Búsqueda global' },
    { keys: ['/'], description: 'Búsqueda rápida' },
    { keys: ['?'], description: 'Mostrar esta ayuda' },
    { keys: ['Esc'], description: 'Cerrar/Cancelar' },
  ]},
  { category: 'Navegación', shortcuts: [
    { keys: ['Alt', 'H'], description: 'Dashboard' },
    { keys: ['Alt', 'P'], description: 'Productos' },
    { keys: ['Alt', 'M'], description: 'Movimientos' },
    { keys: ['Alt', 'C'], description: 'Categorías' },
    { keys: ['Alt', 'S'], description: 'Proveedores' },
    { keys: ['Alt', 'A'], description: 'Alertas' },
    { keys: ['Alt', 'R'], description: 'Reportes' },
    { keys: ['Alt', 'U'], description: 'Usuarios' },
    { keys: ['Alt', '←'], description: 'Volver atrás' },
  ]},
  { category: 'Acciones', shortcuts: [
    { keys: ['Ctrl', 'N'], description: 'Crear nuevo item' },
  ]},
];
