/**
 * Botón de notificaciones push
 * Permite al usuario habilitar/deshabilitar las notificaciones
 */

import React, { useState } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export const NotificationToggle: React.FC = () => {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [isRequesting, setIsRequesting] = useState(false);

  if (!isSupported) {
    return null;
  }

  const handleClick = async () => {
    if (permission === 'granted') {
      // Ya tiene permiso, mostrar indicador
      return;
    }

    setIsRequesting(true);
    await requestPermission();
    setIsRequesting(false);
  };

  const getBellIcon = () => {
    if (permission === 'granted') {
      return (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-success-500 rounded-full animate-pulse"></span>
        </>
      );
    }

    if (permission === 'denied') {
      return (
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
        </svg>
      );
    }

    // Default - sin permiso
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    );
  };

  const getTooltip = () => {
    if (isRequesting) return 'Solicitando permiso...';
    if (permission === 'granted') return 'Notificaciones activadas';
    if (permission === 'denied') return 'Notificaciones bloqueadas';
    return 'Activar notificaciones';
  };

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        disabled={isRequesting || permission === 'denied'}
        className={`p-2 sm:p-2.5 rounded-xl focus:outline-none relative transition-all duration-300 ${
          permission === 'granted'
            ? 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/10'
            : permission === 'denied'
            ? 'text-gray-500 cursor-not-allowed'
            : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
        }`}
        title={getTooltip()}
      >
        {isRequesting ? (
          <div className="w-5 h-5 border-2 border-dark-400 border-t-primary-400 rounded-full animate-spin"></div>
        ) : (
          getBellIcon()
        )}
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-dark-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {getTooltip()}
      </div>
    </div>
  );
};
