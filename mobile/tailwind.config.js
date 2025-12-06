/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f3ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#0080ff',
          600: '#0066cc',
          700: '#004d99',
          800: '#003366',
          900: '#001a33',
        },
        dark: {
          50: '#f5f5f7',
          100: '#e5e5ea',
          200: '#c5c5d0',
          300: '#a5a5b5',
          400: '#85859a',
          500: '#65657f',
          600: '#4a4a60',
          700: '#3a3a50',
          800: '#252540',
          900: '#1e1e2e',
          950: '#0a0a12',
        },
        accent: {
          cyan: '#00d4ff',
          purple: '#a855f7',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
