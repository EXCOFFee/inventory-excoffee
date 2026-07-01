/**
 * Página de Login
 * Diseño dark theme con glassmorphism
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, verify2FA, isLoading, error, clearError, requires2FA } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  // "Despertando": el backend en Render (free tier) puede tardar ~30s en el primer acceso.
  // Si la respuesta tarda más de 3s, mostramos un aviso; se limpia al llegar la respuesta.
  const [wakingUp, setWakingUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wakeTimer = setTimeout(() => setWakingUp(true), 3000);
    try {
      await login({ email, password });
      // Si el usuario tiene 2FA, el store deja `requires2FA` en true: no navegamos, la UI
      // mostrará el campo para el código del segundo factor.
      if (!useAuthStore.getState().requires2FA) {
        navigate('/');
      }
    } catch {
      // Error handled in store
    } finally {
      clearTimeout(wakeTimer);
      setWakingUp(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const wakeTimer = setTimeout(() => setWakingUp(true), 3000);
    try {
      await verify2FA(code);
      navigate('/');
    } catch {
      // Error handled in store
    } finally {
      clearTimeout(wakeTimer);
      setWakingUp(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-accent-cyan/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-cyan mb-4 shadow-glow">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 via-accent-cyan to-primary-400 bg-clip-text text-transparent">
            InventoryPro
          </h1>
          <p className="mt-2 text-dark-400">Sistema de Gestión de Inventarios</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {requires2FA ? 'Verificación en dos pasos' : 'Bienvenido de nuevo'}
          </h2>
          <p className="text-dark-400 mb-6">
            {requires2FA
              ? 'Ingresa el código de 6 dígitos de tu app autenticadora'
              : 'Ingresa tus credenciales para continuar'}
          </p>

          {wakingUp && (
            <div className="mb-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl text-primary-300 text-sm flex items-center gap-3 backdrop-blur-sm">
              <svg className="animate-spin h-5 w-5 text-primary-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>⚡ El servidor está despertando, esto puede tomar ~30 segundos en el primer acceso...</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl text-danger-400 text-sm flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
              <button onClick={clearError} className="text-danger-400 hover:text-danger-300 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {requires2FA ? (
            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Código de verificación
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="cyber-input tracking-[0.5em] text-center text-lg"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="btn-primary w-full py-3 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <span>Verificando...</span> : <span>Verificar y entrar</span>}
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  required
                  className="cyber-input pl-11"
                />
                <svg className="absolute left-4 top-3.5 h-5 w-5 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="cyber-input pl-11"
                />
                <svg className="absolute left-4 top-3.5 h-5 w-5 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>
          )}
        </div>

        {/* Demo credentials */}
        <div className="mt-6 glass-card p-4 text-center">
          <p className="text-xs text-dark-500 mb-1">Credenciales de demostración</p>
          <p className="text-sm text-dark-300 font-mono">
            admin@inventorypro.com / Admin123!
          </p>
        </div>

        {/* Aviso de plan free: el primer acceso puede tardar mientras el backend (Render free tier)
            despierta desde reposo. Se muestra siempre, para que el reclutador lo sepa antes de entrar. */}
        <p className="mt-4 text-center text-xs text-dark-500">
          ⚡ El primer acceso puede tardar ~30 segundos: el servidor gratuito se activa desde reposo.
        </p>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-dark-600">
          © 2026 InventoryPro. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};
