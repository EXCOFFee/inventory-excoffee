/**
 * Componente Header de navegación
 * Diseño dark theme con glassmorphism - Responsive
 */

import React from 'react';
import { useAuthStore, useUIStore } from '../../stores';
import { useCommandPalette, ThemeToggle, NotificationToggle } from '../ui';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, sidebarOpen } = useUIStore();
  const { openPalette } = useCommandPalette();

  return (
    <header className="bg-dark-900/60 backdrop-blur-xl border-b border-dark-700/50 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 light:bg-white/80 light:border-gray-200">
      {/* Left: Toggle & Search */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-800/50 focus:outline-none transition-all duration-300 light:text-gray-500 light:hover:text-gray-900 light:hover:bg-gray-100"
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {sidebarOpen ? (
            <svg className="w-6 h-6 lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : null}
          <svg className={`w-6 h-6 ${sidebarOpen ? 'hidden lg:block' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Search - Opens Command Palette */}
        <button
          onClick={openPalette}
          className="relative group hidden sm:flex w-64 lg:w-80 items-center"
        >
          <div className="w-full pl-11 pr-4 py-2.5 bg-dark-800/50 border border-dark-700/50 rounded-xl text-sm text-dark-400 text-left focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 group-hover:border-dark-600 group-hover:text-dark-300 light:bg-gray-100 light:border-gray-200 light:text-gray-500">
            <span className="hidden md:inline">Buscar productos, páginas...</span>
            <span className="md:hidden">Buscar...</span>
          </div>
          <svg
            className="absolute left-4 h-5 w-5 text-dark-400 group-hover:text-primary-400 transition-colors duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <kbd className="absolute right-3 px-2 py-1 bg-dark-700/50 border border-dark-600/50 rounded text-xs text-dark-400 hidden lg:inline light:bg-gray-200 light:border-gray-300 light:text-gray-600">⌘K</kbd>
        </button>

        {/* Mobile search button */}
        <button
          onClick={openPalette}
          className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-800/50 sm:hidden"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Right: Theme Toggle, Notifications & User */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Push Notifications */}
        <NotificationToggle />

        {/* Divider - hidden on mobile */}
        <div className="w-px h-8 bg-dark-700/50 hidden sm:block"></div>

        {/* User dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-xl hover:bg-dark-800/50 focus:outline-none transition-all duration-300">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary-500 to-accent-cyan rounded-xl flex items-center justify-center text-white font-semibold shadow-glow text-sm sm:text-base">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-dark-400">{user?.role === 'ADMIN' ? 'Administrador' : 'Personal'}</p>
            </div>
            <svg className="w-4 h-4 text-dark-400 transition-transform duration-300 group-hover:rotate-180 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-56 bg-dark-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-dark-700/50 py-2 hidden group-hover:block z-50 transform transition-all duration-300">
            <div className="px-4 py-2 border-b border-dark-700/50">
              <p className="text-sm text-white font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-dark-400 truncate">{user?.email}</p>
            </div>
            <a
              href="/profile"
              className="flex items-center px-4 py-2.5 text-sm text-dark-300 hover:bg-dark-700/50 hover:text-white transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mi Perfil
            </a>
            <a
              href="/settings"
              className="flex items-center px-4 py-2.5 text-sm text-dark-300 hover:bg-dark-700/50 hover:text-white transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuración
            </a>
            <hr className="my-2 border-dark-700/50" />
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2.5 text-sm text-danger-400 hover:bg-danger-500/10 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
