/**
 * Layout principal de la aplicación
 * Diseño dark theme con glassmorphism y soporte responsive
 */

import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette, KeyboardShortcutsHelp } from '../ui';
import { useKeyboardShortcuts } from '../../hooks';
import { useUIStore } from '../../stores';

export const MainLayout: React.FC = () => {
  // Activar atajos de teclado globales
  useKeyboardShortcuts();
  const { sidebarOpen, closeSidebar } = useUIStore();

  // Cerrar sidebar al hacer resize a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && !sidebarOpen) {
        // No hacer nada, mantener el estado
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-accent-cyan/10 rounded-full blur-3xl"></div>
      </div>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette />

      {/* Keyboard Shortcuts Help (Shift+?) */}
      <KeyboardShortcutsHelp />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - responsive */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col relative z-10 w-full lg:w-auto">
        {/* Header */}
        <Header />

        {/* Page content - responsive padding */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
