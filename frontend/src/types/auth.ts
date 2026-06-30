/**
 * Tipos para el usuario y autenticación
 */

export type Role = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
}

/**
 * Respuesta de login exitoso. El contrato del backend usa snake_case `access_token`
 * (fuente única de verdad, ADR-0007). No existe `accessToken` en camelCase.
 */
export interface LoginSuccessResponse {
  access_token: string;
  user: User;
}

/**
 * Respuesta del paso 1 cuando el usuario tiene 2FA habilitado: NO trae el JWT de sesión,
 * sino un token efímero para completar el paso 2 en /auth/2fa/login (ADR-0002).
 */
export interface TwoFactorRequiredResponse {
  requires2FA: true;
  twoFactorToken: string;
}

/** El login puede resolver en éxito directo o en requerimiento de 2FA. */
export type LoginResponse = LoginSuccessResponse | TwoFactorRequiredResponse;

/** Type guard: distingue la respuesta que exige 2FA de la de éxito directo. */
export function isTwoFactorRequired(
  response: LoginResponse,
): response is TwoFactorRequiredResponse {
  return (response as TwoFactorRequiredResponse).requires2FA === true;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requires2FA: boolean;
  twoFactorToken: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}
