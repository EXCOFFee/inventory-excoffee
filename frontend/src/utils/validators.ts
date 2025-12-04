/**
 * Utilidades de validación
 */

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar contraseña fuerte
 * Mínimo 8 caracteres, una mayúscula, una minúscula, un número
 */
export function isStrongPassword(password: string): boolean {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}

/**
 * Validar SKU
 */
export function isValidSKU(sku: string): boolean {
  // SKU: alfanumérico, 3-20 caracteres
  const skuRegex = /^[A-Za-z0-9-_]{3,20}$/;
  return skuRegex.test(sku);
}

/**
 * Validar código de barras
 */
export function isValidBarcode(barcode: string): boolean {
  // EAN-13, UPC-A, o códigos personalizados
  const barcodeRegex = /^[0-9]{8,14}$/;
  return barcodeRegex.test(barcode);
}

/**
 * Validar número positivo
 */
export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Validar número no negativo
 */
export function isNonNegativeNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Validar teléfono (formato mexicano)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+?52)?[ -]?[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validar URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validar que el string no esté vacío
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validar longitud mínima
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength;
}

/**
 * Validar longitud máxima
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

/**
 * Validar rango de números
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Obtener mensajes de error de validación de contraseña
 */
export function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe incluir al menos una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe incluir al menos una minúscula');
  }
  if (!/\d/.test(password)) {
    errors.push('Debe incluir al menos un número');
  }
  
  return errors;
}
