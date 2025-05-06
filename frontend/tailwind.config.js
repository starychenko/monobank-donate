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
        'primary': 'var(--primary-color)',
        'secondary': 'var(--secondary-color)',
        'dark-primary': 'var(--dark-primary)',
        'bg-dark': 'var(--bg-dark)',
        'text-light': 'var(--text-light)',
        'mono-yellow': 'var(--mono-yellow)',
        'mono-black': 'var(--mono-black)',
      },
      fontFamily: {
        'ui': 'var(--font-ui)',
        'heading': 'var(--font-heading)',
        'mono': 'var(--font-mono)',
      },
      fontSize: {
        'xs': 'var(--font-size-xs)',
        'sm': 'var(--font-size-sm)',
        'base': 'var(--font-size-base)',
        'lg': 'var(--font-size-lg)',
        'xl': 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient)',
        'gradient-dark': 'var(--gradient-dark)',
      },
      borderRadius: {
        'card': 'var(--border-radius)',
      },
      boxShadow: {
        'card': 'var(--card-shadow)',
      },
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
      },
    },
  },
  plugins: [],
} 