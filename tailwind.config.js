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
        // Modern Slate Palette
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Emerald 500
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          DEFAULT: '#10b981',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Sky 500
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          DEFAULT: '#0ea5e9',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a', // Slate 900
          950: '#020617',
        },
        // Semantic colors
        success: {
          light: '#d1fae5',
          DEFAULT: '#10b981',
          dark: '#047857',
        },
        warning: {
          light: '#fed7aa',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        error: {
          light: '#fecaca',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        info: {
          light: '#e0f2fe',
          DEFAULT: '#0ea5e9',
          dark: '#0369a1',
        },
        // Legacy colors for backward compatibility (mapped to new palette where possible)
        white: '#ffffff',
        black: '#0f172a', // Mapped to Slate 900
        grey: '#1e293b',   // Mapped to Slate 800 (Card bg)
        'dark-grey': '#94a3b8', // Mapped to Slate 400
        red: '#ef4444',
        transparent: 'transparent',
        twitter: '#1DA1F2',
        purple: '#8B46FF',
        'c-green': '#10b981',
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.25' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.375' }],    // 14px
        base: ['1rem', { lineHeight: '1.5' }],        // 16px
        lg: ['1.125rem', { lineHeight: '1.5' }],      // 18px
        xl: ['1.25rem', { lineHeight: '1.5' }],       // 20px
        '2xl': ['1.5rem', { lineHeight: '1.5' }],     // 24px
        '3xl': ['1.875rem', { lineHeight: '1.25' }],  // 30px
        '4xl': ['2.25rem', { lineHeight: '1.25' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1.25' }],      // 48px
        '6xl': ['3.75rem', { lineHeight: '1.25' }],   // 60px
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      spacing: {
        0: '0',
        1: '0.25rem',   // 4px
        2: '0.5rem',    // 8px
        3: '0.75rem',   // 12px
        4: '1rem',      // 16px
        5: '1.25rem',   // 20px
        6: '1.5rem',    // 24px
        8: '2rem',      // 32px
        10: '2.5rem',   // 40px
        12: '3rem',     // 48px
        16: '4rem',     // 64px
        20: '5rem',     // 80px
        24: '6rem',     // 96px
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',    // 4px
        DEFAULT: '0.5rem', // 8px
        md: '0.75rem',    // 12px
        lg: '1rem',       // 16px
        xl: '1.5rem',     // 24px
        '2xl': '2rem',    // 32px
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'glow-primary': '0 0 20px rgba(97, 114, 243, 0.3)',
        'glow-accent': '0 0 20px rgba(168, 85, 247, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      transitionDuration: {
        fast: '150ms',
        DEFAULT: '250ms',
        slow: '350ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        // Modern animations
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'skeleton-loading': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        // Legacy animations for compatibility
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
          '0%, 100%': { 
            transform: 'translateY(-25%)', 
            animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' 
          },
          '50%': { 
            transform: 'translateY(0)', 
            animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' 
          },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        }
      },
      animation: {
        'fade-in': 'fade-in 250ms ease-out',
        'slide-up': 'slide-up 250ms ease-out',
        'slide-down': 'slide-down 250ms ease-out',
        'scale-in': 'scale-in 250ms ease-out',
        'skeleton': 'skeleton-loading 1.5s ease-in-out infinite',
        // Legacy animations
        slideUp: 'slideUp 0.4s ease-out',
        scaleHeart: 'scaleHeart 0.3s ease-out',
      },
      fontFamily: {
        inter: ["'Inter'", "sans-serif"],
        gelasio: ["'Gelasio'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        serif: ["'Gelasio'", "Georgia", "serif"],
      },
      zIndex: {
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        dropdown: '1000',
        sticky: '1100',
        fixed: '1200',
        'modal-backdrop': '1300',
        modal: '1400',
        popover: '1500',
        tooltip: '1600',
        toast: '1700',
      },
    },
  },
  plugins: [],
};
