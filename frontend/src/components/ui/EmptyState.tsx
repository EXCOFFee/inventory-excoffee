/**
 * Empty State - Componente para estados vacíos con ilustraciones
 */

import React from 'react';
import { Button } from './Button';

type EmptyStateType = 
  | 'no-data'
  | 'no-results'
  | 'no-products'
  | 'no-movements'
  | 'no-categories'
  | 'no-suppliers'
  | 'no-alerts'
  | 'no-users'
  | 'error';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

// Ilustraciones SVG para cada tipo
const illustrations: Record<EmptyStateType, React.ReactNode> = {
  'no-data': (
    <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="50" fill="url(#gradient1)" fillOpacity="0.1"/>
      <rect x="35" y="40" width="50" height="40" rx="4" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2"/>
      <circle cx="60" cy="60" r="8" fill="#0080ff" fillOpacity="0.3"/>
      <path d="M56 60h8M60 56v8" stroke="#0080ff" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="gradient1" x1="10" y1="10" x2="110" y2="110">
          <stop stopColor="#0080ff"/>
          <stop offset="1" stopColor="#00d4ff"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  'no-results': (
    <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="50" fill="url(#gradient2)" fillOpacity="0.1"/>
      <circle cx="52" cy="52" r="20" stroke="#4a5568" strokeWidth="2"/>
      <path d="M66 66l16 16" stroke="#4a5568" strokeWidth="2" strokeLinecap="round"/>
      <path d="M45 52h14M52 45v14" stroke="#0080ff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5"/>
      <defs>
        <linearGradient id="gradient2" x1="10" y1="10" x2="110" y2="110">
          <stop stopColor="#0080ff"/>
          <stop offset="1" stopColor="#00d4ff"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  'no-products': (
    <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="50" fill="url(#gradient3)" fillOpacity="0.1"/>
      <path d="M60 30L90 45V75L60 90L30 75V45L60 30Z" stroke="#4a5568" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M60 30V90" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2"/>
      <path d="M30 45L60 60L90 45" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2"/>
      <circle cx="60" cy="60" r="10" fill="#0080ff" fillOpacity="0.2"/>
      <path d="M56 60h8M60 56v8" stroke="#0080ff" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="gradient3" x1="10" y1="10" x2="110" y2="110">
          <stop stopColor="#0080ff"/>
          <stop offset="1" stopColor="#00d4ff"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  'no-movements': (
    <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="50" fill="url(#gradient4)" fillOpacity="0.1"/>
      <path d="M30 60h25" stroke="#4a5568" strokeWidth="2" strokeLinecap="round"/>
      <path d="M65 60h25" stroke="#4a5568" strokeWidth="2" strokeLinecap="round"/>
      <path d="M50 50l-10 10 10 10" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M70 50l10 10-10 10" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="60" cy="60" r="8" fill="#0080ff" fillOpacity="0.3"/>
      <defs>
        <linearGradient id="gradient4" x1="10" y1="10" x2="110" y2="110">
          <stop stopColor="#0080ff"/>
          <stop offset="1" stopColor="#00d4ff"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  'no-categories': (
    <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="50" fill="url(#gradient5)" fillOpacity="0.1"/>
      <rect x="35" y="35" width="20" height="20" rx="3" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2"/>
      <rect x="65" y="35" width="20" height="20" rx="3" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2"/>
      <rect x="35" y="65" width="20" height="20" rx="3" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2"/>
      <rect x="65" y="65" width="20" height="20" rx="3" stroke="#0080ff" strokeWidth="2"/>
      <path d="M71 75h8M75 71v8" stroke="#0080ff" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="gradient5" x1="10" y1="10" x2="110" y2="110">
          <stop stopColor="#a855f7"/>
          <stop offset="1" stopColor="#ec4899"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  'no-suppliers': (
    <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="50" fill="url(#gradient6)" fillOpacity="0.1"/>
      <rect x="35" y="45" width="50" height="35" rx="3" stroke="#4a5568" strokeWidth="2"/>
      <path d="M35 55h50" stroke="#4a5568" strokeWidth="2"/>
      <rect x="40" y="62" width="15" height="3" rx="1" fill="#4a5568" fillOpacity="0.5"/>
      <rect x="40" y="68" width="25" height="3" rx="1" fill="#4a5568" fillOpacity="0.3"/>
      <circle cx="75" cy="68" r="8" fill="#10b981" fillOpacity="0.2"/>
      <path d="M71 68h8M75 64v8" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="gradient6" x1="10" y1="10" x2="110" y2="110">
          <stop stopColor="#10b981"/>
          <stop offset="1" stopColor="#06b6d4"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  'no-alerts': (
    <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="50" fill="url(#gradient7)" fillOpacity="0.1"/>
      <path d="M60 35L85 75H35L60 35Z" stroke="#4a5568" strokeWidth="2" strokeLinejoin="round" strokeDasharray="4 2"/>
      <circle cx="60" cy="62" r="3" fill="#4a5568"/>
      <path d="M60 48v8" stroke="#4a5568" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="60" cy="60" r="25" stroke="#10b981" strokeWidth="2" strokeOpacity="0.3"/>
      <path d="M50 60l7 7 13-14" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="gradient7" x1="10" y1="10" x2="110" y2="110">
          <stop stopColor="#10b981"/>
          <stop offset="1" stopColor="#0080ff"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  'no-users': (
    <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="50" fill="url(#gradient8)" fillOpacity="0.1"/>
      <circle cx="60" cy="45" r="12" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2"/>
      <path d="M40 85c0-11 9-20 20-20s20 9 20 20" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2"/>
      <circle cx="85" cy="75" r="12" fill="#0080ff" fillOpacity="0.1" stroke="#0080ff" strokeWidth="2"/>
      <path d="M81 75h8M85 71v8" stroke="#0080ff" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="gradient8" x1="10" y1="10" x2="110" y2="110">
          <stop stopColor="#a855f7"/>
          <stop offset="1" stopColor="#0080ff"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  'error': (
    <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="50" fill="url(#gradient9)" fillOpacity="0.1"/>
      <circle cx="60" cy="60" r="25" stroke="#ef4444" strokeWidth="2"/>
      <path d="M50 50l20 20M70 50l-20 20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="gradient9" x1="10" y1="10" x2="110" y2="110">
          <stop stopColor="#ef4444"/>
          <stop offset="1" stopColor="#f97316"/>
        </linearGradient>
      </defs>
    </svg>
  ),
};

const defaultContent: Record<EmptyStateType, { title: string; description: string }> = {
  'no-data': {
    title: 'No hay datos',
    description: 'Aún no hay información para mostrar.',
  },
  'no-results': {
    title: 'Sin resultados',
    description: 'No encontramos nada que coincida con tu búsqueda.',
  },
  'no-products': {
    title: 'No hay productos',
    description: 'Comienza agregando tu primer producto al inventario.',
  },
  'no-movements': {
    title: 'Sin movimientos',
    description: 'No hay movimientos de stock registrados.',
  },
  'no-categories': {
    title: 'No hay categorías',
    description: 'Crea categorías para organizar tus productos.',
  },
  'no-suppliers': {
    title: 'No hay proveedores',
    description: 'Agrega proveedores para gestionar tus compras.',
  },
  'no-alerts': {
    title: '¡Todo en orden!',
    description: 'No hay alertas pendientes en este momento.',
  },
  'no-users': {
    title: 'No hay usuarios',
    description: 'Invita a usuarios para colaborar en el sistema.',
  },
  'error': {
    title: 'Algo salió mal',
    description: 'Hubo un error al cargar los datos. Intenta de nuevo.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  const content = defaultContent[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-6 opacity-80">
        {icon || illustrations[type]}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {title || content.title}
      </h3>
      <p className="text-dark-400 max-w-sm mb-6">
        {description || content.description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
