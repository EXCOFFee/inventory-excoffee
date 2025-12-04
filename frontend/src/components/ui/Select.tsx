/**
 * Componente Select reutilizable
 * Diseño dark cyber theme
 */

import React, { forwardRef } from 'react';
import { SelectOption } from '../../types';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-dark-300 mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          <select
            ref={ref}
            id={selectId}
            className={`
              block w-full rounded-xl border appearance-none
              bg-dark-800/50 border-dark-700/50 text-white
              transition-all duration-300
              hover:border-dark-600
              focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
              disabled:bg-dark-900/50 disabled:text-dark-500 disabled:cursor-not-allowed
              px-4 py-3 pr-10
              ${error
                ? 'border-danger-500/50 focus:ring-danger-500/50 focus:border-danger-500/50'
                : ''
              }
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-dark-800 text-dark-400">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-dark-800 text-white">
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <svg className="w-5 h-5 text-dark-500 group-hover:text-dark-400 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
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

Select.displayName = 'Select';
