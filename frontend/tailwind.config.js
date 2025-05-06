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
        'primary': '#ffd100',
        'secondary': '#313131',
        'dark-primary': '#ffc000',
        'bg-dark': '#111111',
        'text-light': '#f5f5f5',
        'mono-yellow': '#FFD100',
        'mono-yellow-dark': '#E6BC00',
        'mono-black': '#000000',
        'white': {
          DEFAULT: '#ffffff',
          10: 'rgba(255, 255, 255, 0.1)',
          5: 'rgba(255, 255, 255, 0.05)',
          3: 'rgba(255, 255, 255, 0.03)',
          6: 'rgba(255, 255, 255, 0.06)',
          50: 'rgba(255, 255, 255, 0.5)',
          60: 'rgba(255, 255, 255, 0.6)',
          70: 'rgba(255, 255, 255, 0.7)',
          80: 'rgba(255, 255, 255, 0.8)',
          90: 'rgba(255, 255, 255, 0.9)',
        },
        'black': {
          DEFAULT: '#000000',
          10: 'rgba(0, 0, 0, 0.1)',
        },
        'gray': {
          100: '#f1f1f1',
          600: '#666666',
        },
        'error': '#e53e3e',
        'dark-bg': 'rgba(28, 28, 30, 0.95)',
        'dark-section': 'rgba(28, 28, 30, 0.5)',
      },
      fontFamily: {
        'ui': ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji'],
        'heading': ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      fontSize: {
        'xs': '0.75rem',     // 12px
        'sm': '0.875rem',    // 14px
        'base': '1rem',      // 16px
        'lg': '1.125rem',    // 18px
        'xl': '1.25rem',     // 20px
        '2xl': '1.5rem',     // 24px
        '3xl': '1.875rem',   // 30px
        '4xl': '2.25rem',    // 36px
        'card-title': '1.375rem',  // 22px -> переведено в rem для кращої чіткості
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
      },
      lineHeight: {
        'tight': '1.2',
        'normal': '1.5',
        'relaxed': '1.75',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #ffd100, #ffaa00)',
        'gradient-dark': 'linear-gradient(to right, #ffc000, #ff9500)',
      },
      borderRadius: {
        'card': '0.75rem',
        'lg': '0.5rem',
      },
      boxShadow: {
        'card': '0 8px 20px rgba(0, 0, 0, 0.08)',
        'card-light': '0 10px 25px rgba(0, 0, 0, 0.1), 0 0 8px rgba(0, 0, 0, 0.03)',
        'lg': '0 12px 40px rgba(0, 0, 0, 0.15)',
        'lg-light': '0 16px 45px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
        'qr': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'qr-light': '0 6px 16px rgba(0, 0, 0, 0.1)',
        'hover-light': '0 20px 50px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.06)',
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
      transitionDuration: {
        'theme': '100ms',
      },
      transitionTimingFunction: {
        'theme': 'ease-out',
      },
      maxWidth: {
        'container': '1200px',
        'about-card': '800px',
      },
      minHeight: {
        'status': '7.5rem',
        'main': '60vh',
      },
      letterSpacing: {
        'tight': '-0.01em',
        'card': '0.03em',
      },
      gap: {
        'status': '0.75rem',
      },
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(300px, 1fr))',
      },
      keyframes: {
        spin: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' }
        },
        progressAnimation: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        }
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'progress': 'progressAnimation 3s ease infinite'
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.animated-gradient': {
          'animation': 'progressAnimation 3s ease infinite',
          'background-size': '200% auto',
        },
        '.spinner': {
          'animation': 'spin 1s linear infinite',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} 