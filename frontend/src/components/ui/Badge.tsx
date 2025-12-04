/**
 * Componente Badge reutilizable
 * Diseño dark theme con efectos neon
 */

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

const variantStyles = {
  default: 'bg-dark-700/50 text-dark-300 border-dark-600/50',
  primary: 'bg-primary-500/10 text-primary-400 border-primary-500/30',
  secondary: 'bg-dark-600/50 text-dark-200 border-dark-500/30',
  success: 'bg-success-500/10 text-success-400 border-success-500/30',
  warning: 'bg-warning-500/10 text-warning-400 border-warning-500/30',
  danger: 'bg-danger-500/10 text-danger-400 border-danger-500/30',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  purple: 'bg-accent-purple/10 text-accent-purple border-accent-purple/30',
  cyan: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
};

const dotColors = {
  default: 'bg-dark-400',
  primary: 'bg-primary-400',
  secondary: 'bg-dark-300',
  success: 'bg-success-400',
  warning: 'bg-warning-400',
  danger: 'bg-danger-400',
  info: 'bg-blue-400',
  purple: 'bg-accent-purple',
  cyan: 'bg-accent-cyan',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </span>
  );
};

// Status badge for specific use cases
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error';
  className?: string;
}

const statusConfig = {
  active: { label: 'Activo', variant: 'success' as const },
  inactive: { label: 'Inactivo', variant: 'default' as const },
  pending: { label: 'Pendiente', variant: 'warning' as const },
  error: { label: 'Error', variant: 'danger' as const },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} dot pulse={status === 'active' || status === 'pending'} className={className}>
      {config.label}
    </Badge>
  );
};
