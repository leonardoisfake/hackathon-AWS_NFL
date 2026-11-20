/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
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
