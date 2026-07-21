/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Preflight OFF: Tailwind coexists with the bespoke design-system CSS (no reset clash).
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        ink: '#09080F',
        card: 'rgba(255,255,255,0.035)',
        line: 'rgba(255,255,255,0.09)',
        'line-2': 'rgba(255,255,255,0.14)',
        mist: '#EDEAF6',
        'mist-2': '#B4AFC6',
        'mist-3': '#7C7791',
        radiance: '#FFD070', tide: '#8FB7FF', forge: '#FF6E58', signal: '#5FE0C0',
        bloom: '#7ED69B', velvet: '#F49CC9', slate: '#8E93C8', smoke: '#AE8FE6', ash: '#A6ABB8',
      },
      fontFamily: {
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        grotesk: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
