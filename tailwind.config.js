/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        alma: {
          dark: '#322339',   // Fundal principal (Mov închis)
          rose: '#a17487',   // Butoane / Accente (Roz prăfuit)
          purple: '#745f82', // Secundar (Mov mediu)
          gray: '#7c768a',   // Text secundar / Contururi
          light: '#88769c',  // Hover / Accente deschise
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}