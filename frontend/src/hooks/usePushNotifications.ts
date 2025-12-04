/**
 * Hook para manejar notificaciones push del navegador
 */

import { useState, useEffect, useCallback } from 'react';
import { pushNotifications, NotificationOptions } from '../services/pushNotifications';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  sendNotification: (options: NotificationOptions) => Promise<void>;
  notifyLowStock: (productName: string, currentStock: number, minStock: number) => Promise<void>;
  notifyOutOfStock: (productName: string) => Promise<void>;
  notifyMovement: (type: 'IN' | 'OUT', productName: string, quantity: number) => Promise<void>;
  notifySuccess: (title: string, body: string) => Promise<void>;
  notifyError: (title: string, body: string) => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [permission, setPermission] = useState<NotificationPermission>(() => 
    pushNotifications.getPermission()
  );
  const isSupported = pushNotifications.isSupported();

  // Actualizar permisos al cambiar
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    const result = await pushNotifications.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const sendNotification = useCallback(async (options: NotificationOptions) => {
    await pushNotifications.send(options);
  }, []);

  const notifyLowStock = useCallback(async (productName: string, currentStock: number, minStock: number) => {
    await pushNotifications.notifyLowStock(productName, currentStock, minStock);
  }, []);

  const notifyOutOfStock = useCallback(async (productName: string) => {
    await pushNotifications.notifyOutOfStock(productName);
  }, []);

  const notifyMovement = useCallback(async (type: 'IN' | 'OUT', productName: string, quantity: number) => {
    await pushNotifications.notifyMovement(type, productName, quantity);
  }, []);

  const notifySuccess = useCallback(async (title: string, body: string) => {
    await pushNotifications.notifySuccess(title, body);
  }, []);

  const notifyError = useCallback(async (title: string, body: string) => {
    await pushNotifications.notifyError(title, body);
  }, []);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    notifyLowStock,
    notifyOutOfStock,
    notifyMovement,
    notifySuccess,
    notifyError,
  };
};
