/**
 * Componente selector de idioma.
 * 
 * Permite cambiar entre español e inglés.
 * 
 * @file LanguageSelector.tsx
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { availableLanguages, changeLanguage } from '../../i18n';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'es';

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code as 'es' | 'en')}
            className={`
              px-3 py-1.5 text-sm rounded-lg transition-all
              ${currentLang === lang.code
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }
            `}
            title={lang.name}
          >
            {lang.flag} {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={currentLang}
        onChange={(e) => changeLanguage(e.target.value as 'es' | 'en')}
        className="
          appearance-none bg-dark-700 border border-dark-600 
          text-dark-200 rounded-lg px-4 py-2 pr-10
          focus:ring-2 focus:ring-primary-500 focus:border-transparent
          cursor-pointer
        "
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
    </div>
  );
};

export default LanguageSelector;
