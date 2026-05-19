import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        ink: {
          950: '#05070d',
          900: '#0a0d18',
          800: '#0f1424',
          700: '#161c33',
          600: '#1f2742',
        },
        accent: {
          cyan: '#22d3ee',
          violet: '#a78bfa',
          rose: '#fb7185',
          amber: '#fbbf24',
          emerald: '#34d399',
        },
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'slow-pulse': 'pulse 3s ease-in-out infinite',
        shimmer: 'shimmer 8s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
