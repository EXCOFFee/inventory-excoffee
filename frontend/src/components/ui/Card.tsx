/**
 * Componente Card reutilizable
 * Diseño dark theme con glassmorphism
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glow' | 'gradient';
  hover?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

const variantStyles = {
  default: 'bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 shadow-xl',
  glow: 'bg-dark-800/60 backdrop-blur-xl border border-primary-500/30 shadow-glow',
  gradient: 'bg-gradient-to-br from-dark-800/80 to-dark-900/80 backdrop-blur-xl border border-dark-700/50 shadow-xl',
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  hover = false,
}) => {
  return (
    <div
      className={`
        rounded-xl transition-all duration-300
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hover ? 'hover:border-primary-500/50 hover:shadow-glow cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`border-b border-dark-700/50 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', gradient = false }) => {
  return (
    <h3 className={`text-lg font-semibold ${gradient ? 'bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent' : 'text-white'} ${className}`}>
      {children}
    </h3>
  );
};

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-sm text-dark-400 mt-1 ${className}`}>
      {children}
    </p>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={`text-dark-200 ${className}`}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`border-t border-dark-700/50 pt-4 mt-4 flex items-center justify-end space-x-3 ${className}`}>
      {children}
    </div>
  );
};

// New component for stat cards
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: { value: number; positive: boolean };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, className = '' }) => {
  return (
    <Card className={`group ${className}`} hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${change.positive ? 'text-success-400' : 'text-danger-400'}`}>
              <svg className={`w-4 h-4 mr-1 ${change.positive ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>{Math.abs(change.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400 group-hover:bg-primary-500/20 transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
