/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: { fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } }, fadeUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } } },
      animation: { fadeIn: 'fadeIn 450ms ease-out both', fadeUp: 'fadeUp 350ms ease-out both' },
      colors: {
        navy: '#0a1020',      // fondo de página
        panel: '#111a2e',     // tarjetas
        line: '#22314f',      // bordes finos
        ink: '#f1f5f9',       // texto principal
        accent: '#22d3ee',    // cian eléctrico (interfaz)
      },
      fontFamily: {
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        display: ['"Barlow Condensed"', '"Arial Narrow"', 'Impact', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
