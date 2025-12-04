/**
 * Componente Button reutilizable
 * Diseño dark theme con gradients y efectos glow
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40',
  secondary: 'bg-dark-700/80 text-dark-200 hover:bg-dark-600 border border-dark-600 hover:border-dark-500',
  danger: 'bg-gradient-to-r from-danger-600 to-danger-500 text-white hover:from-danger-500 hover:to-danger-400 shadow-lg shadow-danger-500/25',
  success: 'bg-gradient-to-r from-success-600 to-success-500 text-white hover:from-success-500 hover:to-success-400 shadow-lg shadow-success-500/25',
  outline: 'border-2 border-primary-500/50 text-primary-400 hover:bg-primary-500/10 hover:border-primary-400',
  ghost: 'text-dark-300 hover:bg-dark-800/50 hover:text-white',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  glow = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-300 transform
        focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        active:scale-95
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${glow ? 'shadow-glow hover:shadow-glow-accent' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : leftIcon ? (
        <span className="mr-2 transition-transform duration-200 group-hover:scale-110">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

// Icon button variant
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'default' | 'primary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

const iconVariantStyles = {
  default: 'text-dark-400 hover:text-white hover:bg-dark-700/50',
  primary: 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/10',
  danger: 'text-danger-400 hover:text-danger-300 hover:bg-danger-500/10',
  success: 'text-success-400 hover:text-success-300 hover:bg-success-500/10',
};

const iconSizeStyles = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'default',
  size = 'md',
  tooltip,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`
        rounded-lg transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${iconVariantStyles[variant]}
        ${iconSizeStyles[size]}
        ${className}
      `}
      title={tooltip}
      {...props}
    >
      {icon}
    </button>
  );
};
