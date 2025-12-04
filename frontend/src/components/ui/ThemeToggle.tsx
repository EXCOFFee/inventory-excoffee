/**
 * Componente Toggle para cambiar entre Dark/Light mode
 */

import React from 'react';
import { useThemeStore } from '../../stores/themeStore';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-dark-900"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)' 
          : 'linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%)',
        border: isDark ? '1px solid rgba(58, 58, 80, 0.5)' : '1px solid rgba(56, 189, 248, 0.5)',
      }}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      {/* Track decoration */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {/* Stars (visible in dark mode) */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
          <span className="absolute top-1.5 left-2 w-1 h-1 bg-white/60 rounded-full"></span>
          <span className="absolute top-3 left-4 w-0.5 h-0.5 bg-white/40 rounded-full"></span>
          <span className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-white/50 rounded-full"></span>
        </div>
        
        {/* Clouds (visible in light mode) */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
          <span className="absolute top-1 right-2 w-3 h-1.5 bg-white/70 rounded-full"></span>
          <span className="absolute bottom-1.5 right-4 w-2 h-1 bg-white/50 rounded-full"></span>
        </div>
      </div>

      {/* Toggle circle with sun/moon */}
      <div
        className={`absolute top-0.5 w-6 h-6 rounded-full shadow-lg transform transition-all duration-300 flex items-center justify-center ${
          isDark ? 'left-0.5' : 'left-7'
        }`}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
            : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          boxShadow: isDark
            ? '0 0 10px rgba(251, 191, 36, 0.5), inset 0 -2px 4px rgba(0,0,0,0.1)'
            : '0 0 10px rgba(251, 191, 36, 0.3), inset 0 -2px 4px rgba(0,0,0,0.05)',
        }}
      >
        {isDark ? (
          // Moon icon
          <svg className="w-4 h-4 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          // Sun icon
          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  );
};
