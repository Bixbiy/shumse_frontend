/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable dark mode via class strategy
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Existing custom colors
        white: '#FFFFFF',
        black: '#242424',
        "grey-b": '#F3F3F3',
        "grey": '#F3F3F3',
        "green":"#008000",
        'dark-grey': '#6B6B6B',
        "red": '#FF4E4E',
        transparent: 'transparent',
        twitter: '#1DA1F2',
        purple: '#8B46FF',
        "c-green": '#6fcb9f',
        // Additional important colors
        primary: '#8B46FF',       // Primary color (same as purple)
        secondary: '#242424',     // Secondary color (same as black)
        accent: '#FF4E4E',        // Accent color (using your red)
        muted: '#F3F3F3',         // Muted color (using your grey)
        info: '#1DA1F2',          // Info color (using twitter blue)
        success: '#34D399',       // Emerald-400 for success messages
        warning: '#FBBF24',       // Amber-400 for warnings
        error: '#EF4444',         // Red-500 for errors
      },
      fontSize: {
        sm: '12px',
        base: '14px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '38px',
        '5xl': '50px',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleHeart: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        }
      },
      animation: {
        slideUp: 'slideUp 0.4s ease-out',
        scaleHeart: 'scaleHeart 0.3s ease-out',
      },
      fontFamily: {
        inter: ["'Inter'", "sans-serif"],
        gelasio: ["'Gelasio'", "serif"],
      },
    },
  },
  plugins: [
      require('@tailwindcss/line-clamp')
  ],
};
