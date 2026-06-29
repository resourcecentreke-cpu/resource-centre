import type { Config } from 'tailwindcss';

// Admin — aligned with the storefront design system (see apps/web/DESIGN.md).
// Light-mode only; legacy keys kept (refined) for backward compatibility.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens (preferred).
        page: '#FCFCFD',
        surface: '#FFFFFF',
        line: '#EAEBEE',
        'line-strong': '#DBDCE2',
        text: '#1A1A20',
        muted: '#6B6B76',
        faint: '#9C9CA6',
        accent: { DEFAULT: '#4F46E5', dark: '#4338CA' },

        // Legacy keys, refined values.
        bg: '#FCFCFD',
        ink: '#1A1A20',
        mut: '#6B6B76',
        coral: { DEFAULT: '#4F46E5', dark: '#4338CA' },
        mint: '#0E9F6E',
        amber: '#B7791F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
export default config;
