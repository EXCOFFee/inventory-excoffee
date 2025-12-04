/**
 * Componente Table reutilizable
 * Diseño dark theme con efectos hover
 */

import React from 'react';

interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends object>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No hay datos disponibles',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500/20 border-t-primary-500" />
          <div className="absolute inset-0 rounded-full bg-primary-500/10 blur-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-dark-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-dark-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-dark-700/50 bg-dark-800/30 backdrop-blur-sm">
      <table className="min-w-full divide-y divide-dark-700/50">
        <thead className="bg-dark-800/50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider
                  ${column.sortable ? 'cursor-pointer hover:text-primary-400 transition-colors' : ''}
                  ${column.className || ''}
                `}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-700/30">
          {data.map((row, index) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={`
                ${onRowClick ? 'cursor-pointer' : ''}
                ${index % 2 === 0 ? 'bg-transparent' : 'bg-dark-800/20'}
                hover:bg-primary-500/5 transition-colors duration-200
                group
              `}
            >
              {columns.map((column) => {
                const value = (row as Record<string, unknown>)[column.key];
                return (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-dark-200 group-hover:text-white transition-colors ${column.className || ''}`}
                  >
                    {column.render
                      ? column.render(value, row)
                      : String(value ?? '')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700/50">
      <div className="text-sm text-dark-400">
        Página <span className="font-medium text-white">{currentPage}</span> de <span className="font-medium text-white">{totalPages}</span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-dark-300 bg-dark-800/50 border border-dark-700/50 hover:bg-dark-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-dark-300 bg-dark-800/50 border border-dark-700/50 hover:bg-dark-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};
