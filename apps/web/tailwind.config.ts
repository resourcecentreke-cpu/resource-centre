import type { Config } from 'tailwindcss';

/**
 * Resource Centre — refined design system.
 *
 * Taste notes (inspired by Emil Kowalski's design principles, not copied):
 *  • One restrained accent. Let content be the colour; UI stays quiet.
 *  • Near-monochrome neutral scale with subtle, low-contrast borders.
 *  • Layered surfaces (page → surface → raised) instead of heavy shadows.
 *  • Motion is fast, eased-out, and transform-only. Never janky.
 *
 * Existing colour keys (coral/ink/mut/amber/mint/bg/bg2) are intentionally
 * kept so the whole site inherits the refined palette without a mass refactor.
 * New semantic tokens (surface/line/accent/...) are the preferred way forward.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Semantic tokens (preferred) ─────────────────────────────
        // Driven by CSS variables so light/dark "just works".
        page: 'rgb(var(--page) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          fg: 'rgb(var(--accent-fg) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },

        // ── Legacy keys, refined values (kept for backward-compat) ──
        // A calmer indigo replaces the old saturated royal blue.
        bg: '#FCFCFD',
        bg2: '#F4F5F7',
        ink: '#1A1A20',
        mut: '#6B6B76',
        coral: { DEFAULT: '#4F46E5', dark: '#4338CA' },
        // Desaturated, refined badge tints.
        amber: '#B7791F',
        mint: '#0E9F6E',
        berry: '#BE185D',
        sky: '#3B82F6',
      },

      fontFamily: {
        // Inter everywhere for a quiet, cohesive voice; display = tighter Inter.
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      // A deliberate type scale with optical line-heights + tracking.
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        xs: ['0.75rem', { lineHeight: '1.1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.35rem' }],
        base: ['0.9375rem', { lineHeight: '1.6rem' }],
        lg: ['1.0625rem', { lineHeight: '1.6rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.9rem', letterSpacing: '-0.018em' }],
        '3xl': ['1.875rem', { lineHeight: '2.2rem', letterSpacing: '-0.022em' }],
        '4xl': ['2.5rem', { lineHeight: '2.7rem', letterSpacing: '-0.028em' }],
        '5xl': ['3.25rem', { lineHeight: '3.4rem', letterSpacing: '-0.032em' }],
      },

      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },

      // Soft, layered shadows — barely-there by default.
      boxShadow: {
        xs: '0 1px 2px rgba(17,17,26,0.04)',
        soft: '0 1px 2px rgba(17,17,26,0.04), 0 4px 12px rgba(17,17,26,0.05)',
        raised: '0 2px 4px rgba(17,17,26,0.04), 0 12px 28px rgba(17,17,26,0.08)',
      },

      // Emil-style easing: brisk, decisive ease-out + a gentle spring.
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        DEFAULT: '180ms',
        fast: '120ms',
        slow: '320ms',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s cubic-bezier(0.16,1,0.3,1)',
        'fade-up': 'fade-up 0.4s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.16,1,0.3,1)',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
export default config;
