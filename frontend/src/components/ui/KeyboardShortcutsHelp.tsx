/**
 * Modal de ayuda de atajos de teclado
 * Muestra todos los atajos disponibles en una interfaz atractiva
 */

import React, { useState, useEffect } from 'react';
import { getShortcutsList } from '../../hooks/useKeyboardShortcuts';

export const KeyboardShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const shortcutsList = getShortcutsList();

  useEffect(() => {
    const handleShowHelp = () => {
      setIsOpen(true);
    };

    const handleEscape = () => {
      setIsOpen(false);
    };

    window.addEventListener('keyboard:show-help', handleShowHelp);
    window.addEventListener('keyboard:escape', handleEscape);

    return () => {
      window.removeEventListener('keyboard:show-help', handleShowHelp);
      window.removeEventListener('keyboard:escape', handleEscape);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="w-full max-w-2xl bg-dark-800/95 backdrop-blur-xl rounded-2xl border border-dark-700/50 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/50 bg-dark-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-cyan/20 flex items-center justify-center border border-primary-500/30">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Atajos de Teclado</h2>
                <p className="text-sm text-dark-400">Navega más rápido con estos atajos</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid gap-6">
              {shortcutsList.map((category, idx) => (
                <div key={idx}>
                  <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
                    {category.category}
                  </h3>
                  <div className="bg-dark-700/30 rounded-xl overflow-hidden border border-dark-600/30">
                    {category.shortcuts.map((shortcut, sidx) => (
                      <div 
                        key={sidx}
                        className={`flex items-center justify-between px-4 py-3 ${
                          sidx !== category.shortcuts.length - 1 ? 'border-b border-dark-600/30' : ''
                        } hover:bg-dark-700/30 transition-colors`}
                      >
                        <span className="text-sm text-dark-300">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, kidx) => (
                            <React.Fragment key={kidx}>
                              <kbd className="min-w-[28px] h-7 px-2 flex items-center justify-center bg-dark-700/80 border border-dark-600/50 rounded-lg text-xs font-medium text-dark-200 shadow-sm">
                                {key === '←' ? '←' : key}
                              </kbd>
                              {kidx < shortcut.keys.length - 1 && (
                                <span className="text-dark-500 text-xs">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-dark-700/50 bg-dark-800/50">
            <div className="flex items-center justify-between text-sm text-dark-400">
              <span>Presiona <kbd className="px-2 py-0.5 bg-dark-700 rounded text-dark-300">Esc</kbd> para cerrar</span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-success-400 animate-pulse"></span>
                Atajos activos
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
