/**
 * Utilidades de formateo para la app móvil.
 */

/**
 * Formatea una fecha en formato legible.
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formatea una hora en formato legible.
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea una fecha y hora en formato legible.
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Formatea un número como moneda.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Formatea un número con separador de miles.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value);
}

/**
 * Formatea un porcentaje.
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Calcula el tiempo relativo (ej: "hace 2 horas").
 */
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days} días`;
  
  return formatDate(date);
}
