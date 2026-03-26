/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f5f7ff',
        surface: '#ffffff',
        'surface-2': '#edf3ff',
        accent: '#00c2ff',
        danger: '#ff5a8a',
        warning: '#ffb347',
        border: 'rgba(15,23,42,0.12)',
        muted: '#1f2937',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}