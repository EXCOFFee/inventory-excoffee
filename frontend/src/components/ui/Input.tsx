/**
 * Componente Input reutilizable
 * Diseño dark cyber theme
 */

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, variant = 'default', className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const variantStyles = {
      default: 'bg-dark-800/50 border-dark-700/50 hover:border-dark-600',
      filled: 'bg-dark-900/80 border-dark-800 hover:border-dark-700',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-dark-300 mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-dark-500 group-hover:text-dark-400 transition-colors duration-200">{leftIcon}</span>
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              block w-full rounded-xl border
              text-white placeholder-dark-500
              transition-all duration-300
              focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
              disabled:bg-dark-900/50 disabled:text-dark-500 disabled:cursor-not-allowed
              ${variantStyles[variant]}
              ${leftIcon ? 'pl-11' : 'pl-4'}
              ${rightIcon ? 'pr-11' : 'pr-4'}
              ${error
                ? 'border-danger-500/50 focus:ring-danger-500/50 focus:border-danger-500/50 bg-danger-500/5'
                : ''
              }
              py-3
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <span className="text-dark-500 group-hover:text-dark-400 transition-colors duration-200">{rightIcon}</span>
            </div>
          )}
          {/* Focus glow effect */}
          <div className="absolute inset-0 rounded-xl bg-primary-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
        {error && (
          <p className="mt-2 text-sm text-danger-400 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-dark-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-dark-300 mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          <textarea
            ref={ref}
            id={textareaId}
            className={`
              block w-full rounded-xl border
              bg-dark-800/50 border-dark-700/50
              text-white placeholder-dark-500
              transition-all duration-300
              hover:border-dark-600
              focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
              disabled:bg-dark-900/50 disabled:text-dark-500 disabled:cursor-not-allowed
              ${error ? 'border-danger-500/50 focus:ring-danger-500/50 focus:border-danger-500/50' : ''}
              px-4 py-3
              resize-none
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-danger-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-dark-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
