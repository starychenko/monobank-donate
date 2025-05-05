/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        monobank: {
          purple: 'rgb(var(--color-primary) / <alpha-value>)',
          pink: 'rgb(var(--color-secondary) / <alpha-value>)',
          'purple-dark': 'rgb(var(--color-dark-primary) / <alpha-value>)',
          'bg-light': 'rgb(var(--color-bg-light) / <alpha-value>)',
          'bg-dark': 'rgb(var(--color-bg-dark) / <alpha-value>)',
        }
      },
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
      },
      fontSize: {
        '4k-base': '1.2rem',
        '4k-lg': '1.5rem',
        '4k-xl': '2rem',
        '4k-2xl': '2.5rem',
      },
      backgroundImage: {
        'gradient-monobank': 'linear-gradient(to right, rgb(var(--color-primary)), rgb(var(--color-secondary)))',
        'gradient-monobank-dark': 'linear-gradient(to right, rgb(var(--color-dark-primary)), rgb(var(--color-primary)))',
      }
    },
  },
  plugins: [],
} 