/**
 * Componente Sidebar de navegación
 * Diseño dark theme con efectos de glassmorphism
 * Responsive con soporte móvil
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../stores';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Productos',
    href: '/products',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    name: 'Movimientos',
    href: '/movements',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    name: 'Categorías',
    href: '/categories',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    name: 'Proveedores',
    href: '/suppliers',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Alertas',
    href: '/alerts',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

const adminNavigation = [
  {
    name: 'Usuarios',
    href: '/users',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { closeSidebar } = useUIStore();

  // Cerrar sidebar al navegar en móvil
  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  return (
    <aside className="w-72 bg-dark-900/95 lg:bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50 min-h-screen relative overflow-hidden">
      {/* Close button for mobile */}
      <button
        onClick={closeSidebar}
        className="absolute top-4 right-4 p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 lg:hidden"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Decorative glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary-500/10 to-transparent pointer-events-none"></div>
      
      {/* Logo */}
      <div className="flex items-center justify-center h-20 border-b border-dark-700/50 relative">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">
              InventoryPro
            </h1>
            <p className="text-xs text-dark-400">Sistema de Inventarios</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-4 pb-24">
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600/30 to-primary-500/10 text-primary-300 shadow-lg shadow-primary-500/10 border border-primary-500/30'
                    : 'text-dark-300 hover:bg-dark-800/50 hover:text-white hover:border hover:border-dark-600/50'
                }`
              }
            >
              <span className={`mr-3 transition-transform duration-300 group-hover:scale-110`}>{item.icon}</span>
              {item.name}
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  isActive ? 'ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse' : 'hidden'
                }
              >
                {() => null}
              </NavLink>
            </NavLink>
          ))}
        </div>

        {/* Admin section */}
        {user?.role === 'ADMIN' && (
          <div className="mt-8">
            <h3 className="px-4 text-xs font-semibold text-dark-500 uppercase tracking-wider flex items-center">
              <span className="w-8 h-px bg-dark-700 mr-2"></span>
              Administración
              <span className="flex-1 h-px bg-dark-700 ml-2"></span>
            </h3>
            <div className="mt-3 space-y-1">
              {adminNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-accent-purple/30 to-accent-purple/10 text-accent-purple shadow-lg shadow-accent-purple/10 border border-accent-purple/30'
                        : 'text-dark-300 hover:bg-dark-800/50 hover:text-white hover:border hover:border-dark-600/50'
                    }`
                  }
                >
                  <span className="mr-3 transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-dark-950/80 to-transparent pointer-events-none"></div>
    </aside>
  );
};
