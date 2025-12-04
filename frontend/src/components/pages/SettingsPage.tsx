/**
 * Página de Configuración - Dark Theme
 * Incluye configuración de 2FA y cambio de contraseña
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../api';
import { Button, Input, Modal } from '../ui';
import { useNotificationStore } from '../../stores';

// Iconos SVG
const SettingsIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const notification = useNotificationStore();
  
  // Estados para modales
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Estados para formularios
  const [verifyToken, setVerifyToken] = useState('');
  const [qrData, setQrData] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Query: Estado de 2FA
  const { data: twoFactorStatus, isLoading } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: () => authService.get2FAStatus(),
  });

  // Mutation: Generar 2FA
  const generate2FAMutation = useMutation({
    mutationFn: () => authService.generate2FA(),
    onSuccess: (data) => {
      setQrData({
        qrCodeDataUrl: data.qrCodeDataUrl,
        secret: data.secret,
      });
      setShowSetup2FA(true);
    },
    onError: () => {
      notification.error('Error al generar código 2FA');
    },
  });

  // Mutation: Habilitar 2FA
  const enable2FAMutation = useMutation({
    mutationFn: (token: string) => authService.enable2FA(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      setShowSetup2FA(false);
      setVerifyToken('');
      setQrData(null);
      notification.success('2FA habilitado correctamente');
    },
    onError: () => {
      notification.error('Código inválido. Intenta de nuevo.');
    },
  });

  // Mutation: Deshabilitar 2FA
  const disable2FAMutation = useMutation({
    mutationFn: (token: string) => authService.disable2FA(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      setShowDisable2FA(false);
      setVerifyToken('');
      notification.success('2FA deshabilitado');
    },
    onError: () => {
      notification.error('Código inválido. Intenta de nuevo.');
    },
  });

  // Mutation: Cambiar contraseña
  const changePasswordMutation = useMutation({
    mutationFn: () => authService.changePassword(passwords.oldPassword, passwords.newPassword),
    onSuccess: () => {
      setShowChangePassword(false);
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      notification.success('Contraseña actualizada correctamente');
    },
    onError: () => {
      notification.error('Error al cambiar contraseña. Verifica la contraseña actual.');
    },
  });

  const handleEnable2FA = () => {
    if (verifyToken.length === 6) {
      enable2FAMutation.mutate(verifyToken);
    }
  };

  const handleDisable2FA = () => {
    if (verifyToken.length === 6) {
      disable2FAMutation.mutate(verifyToken);
    }
  };

  const handleChangePassword = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      notification.error('Las contraseñas no coinciden');
      return;
    }
    if (passwords.newPassword.length < 8) {
      notification.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    changePasswordMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-500 flex items-center justify-center">
            <SettingsIcon />
          </span>
          Configuración
        </h1>
        <p className="text-gray-400 mt-1">Gestiona tu seguridad y preferencias</p>
      </div>

      {/* Sección: Autenticación de Dos Factores */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center">
              <ShieldIcon />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Autenticación de Dos Factores (2FA)</h2>
              <p className="text-gray-400 text-sm mt-1">
                Añade una capa extra de seguridad a tu cuenta usando una app autenticadora.
              </p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="h-10 w-24 bg-gray-700 rounded-xl animate-pulse"></div>
          ) : twoFactorStatus?.twoFactorEnabled ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                Activo
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDisable2FA(true)}
                className="text-danger-400 border-danger-500/30 hover:bg-danger-500/10"
              >
                Deshabilitar
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => generate2FAMutation.mutate()}
              isLoading={generate2FAMutation.isPending}
              className="bg-gradient-to-r from-emerald-600 to-teal-500"
            >
              Configurar 2FA
            </Button>
          )}
        </div>

        {/* Info adicional si está activo */}
        {twoFactorStatus?.twoFactorEnabled && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-sm text-emerald-300">
              ✓ Tu cuenta está protegida con autenticación de dos factores.
              Necesitarás tu código de 6 dígitos además de tu contraseña para iniciar sesión.
            </p>
          </div>
        )}
      </div>

      {/* Sección: Cambiar Contraseña */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center">
              <LockIcon />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Contraseña</h2>
              <p className="text-gray-400 text-sm mt-1">
                Actualiza tu contraseña regularmente para mantener tu cuenta segura.
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowChangePassword(true)}
          >
            Cambiar Contraseña
          </Button>
        </div>
      </div>

      {/* Modal: Configurar 2FA */}
      <Modal
        isOpen={showSetup2FA}
        onClose={() => {
          setShowSetup2FA(false);
          setVerifyToken('');
          setQrData(null);
        }}
        title="Configurar 2FA"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              Escanea este código QR con tu app autenticadora
              (Google Authenticator, Authy, etc.)
            </p>
            
            {qrData && (
              <div className="inline-block p-4 bg-white rounded-xl">
                <img
                  src={qrData.qrCodeDataUrl}
                  alt="QR Code para 2FA"
                  className="w-48 h-48"
                />
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-4">
              Si no puedes escanear el código, ingresa esta clave manualmente:
            </p>
            <code className="block mt-2 px-4 py-2 bg-dark-800 rounded-lg text-primary-400 text-sm font-mono break-all">
              {qrData?.secret}
            </code>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ingresa el código de 6 dígitos de tu app:
            </label>
            <Input
              type="text"
              placeholder="000000"
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={6}
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSetup2FA(false);
                setVerifyToken('');
                setQrData(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEnable2FA}
              isLoading={enable2FAMutation.isPending}
              disabled={verifyToken.length !== 6}
              className="flex-1"
            >
              Verificar y Activar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Deshabilitar 2FA */}
      <Modal
        isOpen={showDisable2FA}
        onClose={() => {
          setShowDisable2FA(false);
          setVerifyToken('');
        }}
        title="Deshabilitar 2FA"
        size="sm"
      >
        <div className="space-y-6">
          <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl">
            <p className="text-danger-300 text-sm">
              ⚠️ Esto reducirá la seguridad de tu cuenta. Solo hazlo si es necesario.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ingresa tu código 2FA actual para confirmar:
            </label>
            <Input
              type="text"
              placeholder="000000"
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={6}
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDisable2FA(false);
                setVerifyToken('');
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDisable2FA}
              isLoading={disable2FAMutation.isPending}
              disabled={verifyToken.length !== 6}
              className="flex-1"
            >
              Deshabilitar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Cambiar Contraseña */}
      <Modal
        isOpen={showChangePassword}
        onClose={() => {
          setShowChangePassword(false);
          setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        }}
        title="Cambiar Contraseña"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Contraseña Actual"
            type="password"
            value={passwords.oldPassword}
            onChange={(e) => setPasswords(p => ({ ...p, oldPassword: e.target.value }))}
            placeholder="••••••••"
          />
          
          <Input
            label="Nueva Contraseña"
            type="password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
            placeholder="••••••••"
          />
          
          <Input
            label="Confirmar Nueva Contraseña"
            type="password"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
            placeholder="••••••••"
          />
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowChangePassword(false);
                setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              isLoading={changePasswordMutation.isPending}
              disabled={!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword}
              className="flex-1"
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
