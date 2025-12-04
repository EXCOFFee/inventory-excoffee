/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal - Azul eléctrico con negro
        primary: {
          50: '#e6f4ff',
          100: '#b3ddff',
          200: '#80c6ff',
          300: '#4dafff',
          400: '#1a98ff',
          500: '#0080ff', // Azul principal vibrante
          600: '#0066cc',
          700: '#004d99',
          800: '#003366',
          900: '#001a33',
          950: '#000d1a',
        },
        // Fondo oscuro elegante - Escala completa
        dark: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d5d5db',
          300: '#b0b0bc',
          400: '#85859a',
          500: '#66667f',
          600: '#4a4a60',
          700: '#3a3a50',
          800: '#1e1e2e', // Fondo principal
          900: '#14141f', // Fondo más oscuro
          950: '#0a0a12', // Negro profundo
        },
        // Acentos
        accent: {
          cyan: '#00d4ff',     // Cyan brillante
          purple: '#a855f7',   // Púrpura
          green: '#00ff88',    // Verde neón
          orange: '#ff6b35',   // Naranja vibrante
          pink: '#ff0080',     // Rosa eléctrico
        },
        // Estados semánticos
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Superficie para cards
        surface: {
          light: '#ffffff',
          dark: '#1a1a2e',
          elevated: '#252540',
          overlay: 'rgba(0, 0, 0, 0.7)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #0a0a12 0%, #1e1e2e 50%, #14141f 100%)',
        'glow-blue': 'radial-gradient(ellipse at center, rgba(0, 128, 255, 0.15) 0%, transparent 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(30, 30, 46, 0.9) 0%, rgba(37, 37, 64, 0.9) 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 128, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 128, 255, 0.4)',
        'glow-accent': '0 0 20px rgba(0, 212, 255, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(0, 128, 255, 0.1)',
        'card': '0 4px 30px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 40px rgba(0, 128, 255, 0.2)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 128, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 128, 255, 0.6)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
