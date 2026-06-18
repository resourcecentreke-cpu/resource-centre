import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: { extend: { colors: {
    bg: '#FFFDF9', ink: '#2B2240', mut: '#7A7088',
    coral: { DEFAULT: '#FF6B5C', dark: '#F2543F' }, mint: '#2FD3A5', amber: '#FFC247',
  } } },
  plugins: [],
};
export default config;
