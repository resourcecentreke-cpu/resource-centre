import type { Config } from 'tailwindcss';

// Sunrise palette — light & happy
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FFFDF9',
        bg2: '#FFF4EC',
        ink: '#2B2240',
        mut: '#7A7088',
        coral: { DEFAULT: '#FF6B5C', dark: '#F2543F' },
        amber: '#FFC247',
        mint: '#2FD3A5',
        berry: '#FF5DA2',
        sky: '#5B8DEF',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: { soft: '0 10px 30px rgba(43,34,64,.08)' },
    },
  },
  plugins: [],
};
export default config;
