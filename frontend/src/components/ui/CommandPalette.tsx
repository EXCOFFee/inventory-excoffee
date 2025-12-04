/**
 * Command Palette - Búsqueda global con Ctrl+K
 * Permite buscar productos, categorías, proveedores y navegar rápidamente
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsService, categoriesService, suppliersService } from '../../api';

interface SearchResult {
  id: string;
  type: 'product' | 'category' | 'supplier' | 'page';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

// Iconos
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ProductIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const CategoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const SupplierIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Páginas de navegación rápida
const quickPages = [
  { id: 'dashboard', name: 'Dashboard', path: '/' },
  { id: 'products', name: 'Productos', path: '/products' },
  { id: 'new-product', name: 'Nuevo Producto', path: '/products/new' },
  { id: 'movements', name: 'Movimientos', path: '/movements' },
  { id: 'categories', name: 'Categorías', path: '/categories' },
  { id: 'suppliers', name: 'Proveedores', path: '/suppliers' },
  { id: 'reports', name: 'Reportes', path: '/reports' },
  { id: 'alerts', name: 'Alertas', path: '/alerts' },
  { id: 'users', name: 'Usuarios', path: '/users' },
];

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Queries para búsqueda
  const { data: products = [] } = useQuery({
    queryKey: ['products-search'],
    queryFn: () => productsService.getAll({ limit: 100 }),
    enabled: isOpen,
    select: (data) => data.data || [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-search'],
    queryFn: () => categoriesService.getAll(),
    enabled: isOpen,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-search'],
    queryFn: () => suppliersService.getAll(),
    enabled: isOpen,
  });

  // Filtrar resultados
  const getResults = useCallback((): SearchResult[] => {
    const searchQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    if (!searchQuery) {
      // Mostrar páginas de navegación rápida
      quickPages.forEach((page) => {
        results.push({
          id: `page-${page.id}`,
          type: 'page',
          title: page.name,
          subtitle: 'Ir a página',
          icon: <PageIcon />,
          action: () => {
            navigate(page.path);
            setIsOpen(false);
          },
        });
      });
      return results;
    }

    // Buscar productos
    products
      .filter((p: any) => 
        p.name.toLowerCase().includes(searchQuery) ||
        p.sku.toLowerCase().includes(searchQuery)
      )
      .slice(0, 5)
      .forEach((p: any) => {
        results.push({
          id: `product-${p.id}`,
          type: 'product',
          title: p.name,
          subtitle: `SKU: ${p.sku} • Stock: ${p.currentStock}`,
          icon: <ProductIcon />,
          action: () => {
            navigate(`/products/${p.id}/edit`);
            setIsOpen(false);
          },
        });
      });

    // Buscar categorías
    categories
      .filter((c: any) => c.name.toLowerCase().includes(searchQuery))
      .slice(0, 3)
      .forEach((c: any) => {
        results.push({
          id: `category-${c.id}`,
          type: 'category',
          title: c.name,
          subtitle: `${c._count?.products || 0} productos`,
          icon: <CategoryIcon />,
          action: () => {
            navigate(`/categories`);
            setIsOpen(false);
          },
        });
      });

    // Buscar proveedores
    suppliers
      .filter((s: any) => 
        s.name.toLowerCase().includes(searchQuery) ||
        s.email?.toLowerCase().includes(searchQuery)
      )
      .slice(0, 3)
      .forEach((s: any) => {
        results.push({
          id: `supplier-${s.id}`,
          type: 'supplier',
          title: s.name,
          subtitle: s.email || s.phone || 'Sin contacto',
          icon: <SupplierIcon />,
          action: () => {
            navigate(`/suppliers`);
            setIsOpen(false);
          },
        });
      });

    // Buscar páginas
    quickPages
      .filter((p) => p.name.toLowerCase().includes(searchQuery))
      .forEach((page) => {
        results.push({
          id: `page-${page.id}`,
          type: 'page',
          title: page.name,
          subtitle: 'Ir a página',
          icon: <PageIcon />,
          action: () => {
            navigate(page.path);
            setIsOpen(false);
          },
        });
      });

    return results;
  }, [query, products, categories, suppliers, navigate]);

  const results = getResults();

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      results[selectedIndex].action();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center pt-[15vh] px-4">
        <div className="w-full max-w-2xl bg-dark-900/95 backdrop-blur-xl rounded-2xl border border-dark-700/50 shadow-2xl shadow-primary-500/10 overflow-hidden animate-scale-in">
          {/* Search Input */}
          <div className="flex items-center px-4 border-b border-dark-700/50">
            <span className="text-dark-400">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar productos, categorías, páginas..."
              className="flex-1 px-4 py-4 bg-transparent text-white placeholder-dark-500 focus:outline-none text-lg"
            />
            <div className="flex items-center gap-2">
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-dark-400 bg-dark-800 rounded border border-dark-700">
                ESC
              </kbd>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-dark-400 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto py-2">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
                  <SearchIcon />
                </div>
                <p className="text-dark-400">No se encontraron resultados para "{query}"</p>
              </div>
            ) : (
              <div className="px-2">
                {!query && (
                  <p className="px-3 py-2 text-xs font-medium text-dark-500 uppercase tracking-wider">
                    Navegación rápida
                  </p>
                )}
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={result.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                      index === selectedIndex
                        ? 'bg-primary-500/20 text-white'
                        : 'text-dark-300 hover:bg-dark-800/50'
                    }`}
                  >
                    <span className={`flex-shrink-0 p-2 rounded-lg ${
                      result.type === 'product' ? 'bg-blue-500/20 text-blue-400' :
                      result.type === 'category' ? 'bg-purple-500/20 text-purple-400' :
                      result.type === 'supplier' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-dark-700 text-dark-400'
                    }`}>
                      {result.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-dark-500 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    {index === selectedIndex && (
                      <kbd className="flex-shrink-0 px-2 py-1 text-xs font-medium text-dark-400 bg-dark-800 rounded border border-dark-700">
                        ↵
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-dark-700/50 bg-dark-800/50">
            <div className="flex items-center justify-between text-xs text-dark-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-dark-700 rounded text-dark-400">↑↓</kbd>
                  <span>Navegar</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-dark-700 rounded text-dark-400">↵</kbd>
                  <span>Seleccionar</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-dark-700 rounded text-dark-400">ESC</kbd>
                  <span>Cerrar</span>
                </span>
              </div>
              <span className="text-primary-400">⌘K para abrir</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook para abrir el Command Palette desde cualquier lugar
export const useCommandPalette = () => {
  const openPalette = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return { openPalette };
};
