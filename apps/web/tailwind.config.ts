import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#070908', // Deep Black
        surface: '#111513',    // Dark Surface
        'surface-elevated': '#18201C', // Elevated Surface / Modals
        border: '#26332B',     // Subtle Dark Green Border
        'border-focus': '#57EF40',
        card: '#111513',
        'card-hover': '#18201C',
        primary: {
          DEFAULT: '#57EF40',  // Neon Green
          hover: '#4ada34',
          light: '#72f35f',
          dark: '#3db82b'
        },
        secondary: {
          DEFAULT: '#65C556',  // Secondary Green for Badges/Tags
          hover: '#57b348'
        },
        muted: {
          DEFAULT: '#689E5F',  // Soft Muted Green
          foreground: '#8E9B93' // Secondary Text
        },
        foreground: '#F2F5F3', // Primary Text
        destructive: {
          DEFAULT: '#EF4444',
          hover: '#dc2626'
        }
      },
      boxShadow: {
        'glow-green': '0 0 25px -3px rgba(87, 239, 64, 0.35)',
        'glow-green-sm': '0 0 12px -2px rgba(87, 239, 64, 0.25)',
        'glow-green-lg': '0 0 45px -5px rgba(87, 239, 64, 0.45)',
        'glass-crdisk': '0 8px 32px 0 rgba(0, 0, 0, 0.65)'
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)', filter: 'drop-shadow(0 0 8px #57EF40)' },
          '50%': { opacity: '0.6', transform: 'scale(1.08)', filter: 'drop-shadow(0 0 2px #57EF40)' }
        },
        rippleGreen: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' }
        }
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'ripple-green': 'rippleGreen 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite'
      }
    },
  },
  plugins: [],
};

export default config;
