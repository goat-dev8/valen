import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        valen: {
          bg: '#FFFFFF',
          'bg-subtle': '#FAFBFC',
          'bg-muted': '#F4F6F8',
          border: '#E8ECF0',
          'border-strong': '#D1D9E0',
          text: '#1A2332',
          'text-secondary': '#5E6C7B',
          muted: '#8B98A5',
          primary: '#0066FF',
          'primary-subtle': '#EBF2FF',
          accent: '#84CC16',
          success: '#0D9488',
          warning: '#D97706',
          danger: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'Segoe UI', 'system-ui', 'sans-serif'],
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
        display: ['var(--font-space-grotesk)', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        'card-lg': '16px',
      },
      boxShadow: {
        valen1: '0 1px 2px rgba(16, 24, 40, 0.05)',
        valen2: '0 4px 12px rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
