/**
 * Schemas de validación Zod para formularios.
 * 
 * Implementación compatible con Zod v4.
 */

import { z } from 'zod';

// ============================================
// Mensajes de error comunes
// ============================================
const messages = {
  required: 'Este campo es requerido',
  email: 'Ingresa un email válido',
  passwordMin: 'Mínimo 8 caracteres',
  passwordPattern: 'Debe incluir mayúscula, minúscula y número',
  positiveNumber: 'Debe ser mayor a 0',
  uuid: 'ID inválido',
  passwordsMustMatch: 'Las contraseñas no coinciden',
};

// ============================================
// Campos reutilizables
// ============================================
const emailField = z
  .string()
  .min(1, messages.required)
  .email(messages.email);

const passwordField = z
  .string()
  .min(8, messages.passwordMin)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, messages.passwordPattern);

const requiredString = z
  .string()
  .min(1, messages.required);

const positiveNumber = z
  .number()
  .positive(messages.positiveNumber);

const nonNegativeNumber = z
  .number()
  .min(0, 'No puede ser negativo');

// ============================================
// Schemas de autenticación
// ============================================

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, messages.required),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema para registro
 */
export const registerSchema = z.object({
  firstName: requiredString,
  lastName: requiredString,
  email: emailField,
  password: passwordField,
  confirmPassword: z.string().min(1, messages.required),
}).refine((data) => data.password === data.confirmPassword, {
  message: messages.passwordsMustMatch,
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schema para cambio de contraseña
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, messages.required),
  newPassword: passwordField,
  confirmPassword: z.string().min(1, messages.required),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: messages.passwordsMustMatch,
  path: ['confirmPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ============================================
// Schemas de productos
// ============================================

/**
 * Schema para crear/editar producto
 */
export const productSchema = z.object({
  sku: requiredString
    .max(50, 'Máximo 50 caracteres'),
  name: requiredString
    .max(200, 'Máximo 200 caracteres'),
  description: z.string().optional(),
  categoryId: z.string().uuid(messages.uuid),
  supplierId: z.string().uuid(messages.uuid).optional(),
  price: positiveNumber,
  cost: nonNegativeNumber.optional(),
  currentStock: nonNegativeNumber.optional().default(0),
  minStock: nonNegativeNumber,
  maxStock: nonNegativeNumber.optional(),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  barcode: z.string().max(50).optional(),
}).refine((data) => {
  if (data.maxStock !== undefined) {
    return data.minStock <= data.maxStock;
  }
  return true;
}, {
  message: 'Stock mínimo no puede ser mayor al máximo',
  path: ['minStock'],
});

export type ProductFormData = z.infer<typeof productSchema>;

// ============================================
// Schemas de categorías y proveedores
// ============================================

export const categorySchema = z.object({
  name: requiredString.max(100, 'Máximo 100 caracteres'),
  description: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const supplierSchema = z.object({
  name: requiredString.max(200, 'Máximo 200 caracteres'),
  email: emailField.optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// ============================================
// Schemas de movimientos
// ============================================

export const movementSchema = z.object({
  productId: z.string().uuid('Seleccione un producto'),
  type: z.enum(['IN', 'OUT']),
  quantity: positiveNumber.int('Debe ser un número entero'),
  reason: z.enum([
    'PURCHASE',
    'SALE',
    'RETURN',
    'ADJUSTMENT',
    'DAMAGE',
    'TRANSFER',
    'OTHER',
  ]),
  notes: z.string().optional(),
  reference: z.string().optional(),
  unitCost: nonNegativeNumber.optional(),
});

export type MovementFormData = z.infer<typeof movementSchema>;

// ============================================
// Schemas de usuarios
// ============================================

export const userSchema = z.object({
  firstName: requiredString,
  lastName: requiredString,
  email: emailField,
  role: z.enum(['ADMIN', 'STAFF']),
  isActive: z.boolean().default(true),
});

export type UserFormData = z.infer<typeof userSchema>;

export const createUserSchema = userSchema.extend({
  password: passwordField,
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
