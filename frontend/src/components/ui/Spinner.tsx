/**
 * Componente Spinner de carga
 * Diseño dark theme con efectos glow
 */

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white' | 'secondary';
  className?: string;
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const variantStyles = {
  primary: 'text-primary-500',
  white: 'text-white',
  secondary: 'text-dark-400',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', variant = 'primary', className = '' }) => {
  return (
    <div className="relative">
      <svg
        className={`animate-spin ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-100"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {/* Glow effect */}
      {variant === 'primary' && (
        <div className={`absolute inset-0 ${sizeStyles[size]} bg-primary-500/30 blur-xl rounded-full animate-pulse`}></div>
      )}
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  blur?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, children, blur = true }) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className={`absolute inset-0 bg-dark-900/80 ${blur ? 'backdrop-blur-sm' : ''} flex items-center justify-center z-10 rounded-xl`}>
          <Spinner size="lg" />
        </div>
      )}
    </div>
  );
};

// Skeleton loader for content placeholders
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'text' }) => {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={`
        bg-dark-700/50 animate-pulse
        ${variantClasses[variant]}
        ${className}
      `}
    />
  );
};

// Full page loading screen
export const PageLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-4">
          <Spinner size="lg" />
        </div>
        <p className="text-dark-400 text-sm animate-pulse">Cargando...</p>
      </div>
    </div>
  );
};
