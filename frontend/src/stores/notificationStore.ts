/**
 * Store de notificaciones/toasts con Zustand
 */

import { create } from 'zustand';
import { ToastNotification } from '../types';

interface NotificationState {
  notifications: ToastNotification[];
  
  // Acciones
  addNotification: (notification: Omit<ToastNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Helpers
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: ToastNotification = {
      ...notification,
      id,
      duration: notification.duration || 5000,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove después del duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => set({ notifications: [] }),

  success: (title, message) => {
    get().addNotification({ type: 'success', title, message });
  },

  error: (title, message) => {
    get().addNotification({ type: 'error', title, message, duration: 8000 });
  },

  warning: (title, message) => {
    get().addNotification({ type: 'warning', title, message });
  },

  info: (title, message) => {
    get().addNotification({ type: 'info', title, message });
  },
}));
