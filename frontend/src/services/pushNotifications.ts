/**
 * Servicio de Notificaciones Push del navegador
 * Maneja permisos y envío de notificaciones
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

class PushNotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Verifica si las notificaciones push están soportadas
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Obtiene el estado actual del permiso
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * Solicita permiso para enviar notificaciones
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Las notificaciones push no están soportadas en este navegador');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result;
    } catch (error) {
      console.error('Error al solicitar permiso de notificaciones:', error);
      return 'denied';
    }
  }

  /**
   * Envía una notificación push
   */
  async send(options: NotificationOptions): Promise<Notification | null> {
    if (!this.isSupported()) {
      console.warn('Las notificaciones push no están soportadas');
      return null;
    }

    // Solicitar permiso si es necesario
    if (this.permission === 'default') {
      await this.requestPermission();
    }

    if (this.permission !== 'granted') {
      console.warn('No hay permiso para enviar notificaciones');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/logo192.png',
        tag: options.tag,
        badge: '/logo192.png',
        silent: false,
      });

      if (options.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
      }

      // Auto-cerrar después de 5 segundos
      setTimeout(() => notification.close(), 5000);

      return notification;
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      return null;
    }
  }

  /**
   * Notificación de stock bajo
   */
  async notifyLowStock(productName: string, currentStock: number, minStock: number): Promise<void> {
    await this.send({
      title: '⚠️ Stock Bajo',
      body: `${productName}: ${currentStock} unidades (mínimo: ${minStock})`,
      tag: `low-stock-${productName}`,
      onClick: () => {
        window.location.href = '/alerts';
      },
    });
  }

  /**
   * Notificación de producto sin stock
   */
  async notifyOutOfStock(productName: string): Promise<void> {
    await this.send({
      title: '🚨 Sin Stock',
      body: `El producto "${productName}" está agotado`,
      tag: `out-of-stock-${productName}`,
      onClick: () => {
        window.location.href = '/alerts';
      },
    });
  }

  /**
   * Notificación de movimiento registrado
   */
  async notifyMovement(type: 'IN' | 'OUT', productName: string, quantity: number): Promise<void> {
    const emoji = type === 'IN' ? '📥' : '📤';
    const action = type === 'IN' ? 'Entrada' : 'Salida';
    
    await this.send({
      title: `${emoji} ${action} Registrada`,
      body: `${productName}: ${type === 'IN' ? '+' : '-'}${quantity} unidades`,
      tag: `movement-${Date.now()}`,
      onClick: () => {
        window.location.href = '/movements';
      },
    });
  }

  /**
   * Notificación genérica de éxito
   */
  async notifySuccess(title: string, body: string): Promise<void> {
    await this.send({
      title: `✅ ${title}`,
      body,
      tag: `success-${Date.now()}`,
    });
  }

  /**
   * Notificación genérica de error
   */
  async notifyError(title: string, body: string): Promise<void> {
    await this.send({
      title: `❌ ${title}`,
      body,
      tag: `error-${Date.now()}`,
    });
  }
}

// Singleton
export const pushNotifications = new PushNotificationService();
