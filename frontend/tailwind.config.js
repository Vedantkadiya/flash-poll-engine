/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#060610',
          900: '#0c0c1e',
          850: '#111128',
          800: '#16162f',
          750: '#1c1c38',
          700: '#222244',
          600: '#2d2d5e',
          500: '#3d3d80',
        },
        brand: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        neon: {
          purple: '#c4b5fd',
          blue: '#93c5fd',
          pink: '#f9a8d4',
          cyan: '#67e8f9',
          green: '#6ee7b7',
        }
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(139,92,246,0.25)',
        'glow':    '0 0 24px rgba(139,92,246,0.3)',
        'glow-lg': '0 0 40px rgba(139,92,246,0.4)',
        'card':    '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.2)',
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M40 0v40M0 0h40' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E\")",
      },
      animation: {
        'slide-up':   'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':    'fadeIn 0.25s ease both',
        'pop':        'pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':    'shimmer 1.8s linear infinite',
        'float':      'float 6s ease-in-out infinite',
        'bar-fill':   'barFill 0.8s cubic-bezier(0.34,1.2,0.64,1) both',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp:   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        pop:       { '0%': { opacity: 0, transform: 'scale(0.8)' }, '60%': { transform: 'scale(1.1)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        shimmer:   { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        barFill:   { from: { width: '0%' }, to: {} },
        glowPulse: { '0%,100%': { boxShadow: '0 0 12px rgba(139,92,246,0.2)' }, '50%': { boxShadow: '0 0 28px rgba(139,92,246,0.5)' } },
      },
    },
  },
  plugins: [],
}
