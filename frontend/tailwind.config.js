/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    // Enhanced responsive breakpoints for better mobile-first design
    screens: {
      'xs': '320px',   // Extra small phones
      'sm': '640px',   // Small tablets and large phones
      'md': '768px',   // Tablets
      'lg': '1024px',  // Small laptops
      'xl': '1280px',  // Laptops and desktops
      '2xl': '1536px', // Large desktops
      '3xl': '1920px', // Ultra-wide displays
      // Touch-specific breakpoints
      'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
      'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
      // Orientation breakpoints
      'portrait': { 'raw': '(orientation: portrait)' },
      'landscape': { 'raw': '(orientation: landscape)' },
    },
    extend: {
      colors: {
        // Kawaii primary colors - Soft pink/coral
        bubbleQuest: {
          50: '#fff5f7',
          100: '#ffe3e8',
          200: '#ffc7d1',
          300: '#ffaaba',
          400: '#ff8ea3',
          500: '#FFB3BA',  // Main kawaii pink
          600: '#ff6b7f',
          700: '#ff4d63',
          800: '#ff2f47',
          900: '#e6002b',
          950: '#b30021',
          cream: {
            50: '#f7f3eb',  // Custom background color
            DEFAULT: '#FFF8F0',
          },
          border: '#d5d0c2',  // Custom border color
        },
        // BubbleQuest theme presets
        'bubblequest-orange': {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#F4A460',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        'bubblequest-blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#6B9BD1',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        'bubblequest-teal': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#7ECEC4',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        'bubblequest-purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#C5B3E6',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        'bubblequest-yellow': {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#FFD97D',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        // Modern design system colors - Travel-inspired palette
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',  // Main brand color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',  // Warm yellow
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',  // Mid-tone gray
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Success green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // Warning amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',  // Error red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',  // Info blue (same as primary)
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Travel-specific theme colors
        adventure: {
          50: '#fef3c7',
          100: '#fde68a',
          200: '#fcd34d',
          300: '#fbbf24',
          400: '#f59e0b',
          500: '#d97706',  // Adventure orange
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        romantic: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',  // Romantic pink
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        foodie: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',  // Foodie red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        chill: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Chill green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      fontSize: {
        // Responsive font sizes with better mobile scaling
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        // Mobile-optimized sizes
        'mobile-xs': ['0.8125rem', { lineHeight: '1.125rem' }],
        'mobile-sm': ['0.9375rem', { lineHeight: '1.375rem' }],
        'mobile-base': ['1.0625rem', { lineHeight: '1.625rem' }],
        'mobile-lg': ['1.1875rem', { lineHeight: '1.875rem' }],
      },
      spacing: {
        // Touch-friendly spacing
        'touch-sm': '0.75rem',   // 12px
        'touch-md': '1rem',      // 16px
        'touch-lg': '1.25rem',   // 20px
        'touch-xl': '1.5rem',    // 24px
        'touch-2xl': '2rem',     // 32px
        // Safe area insets for devices with notches
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'touch': '2.75rem',      // 44px minimum touch target
        'touch-sm': '2.5rem',    // 40px for smaller touch targets
        'touch-lg': '3rem',      // 48px for primary actions
        'touch-xl': '3.5rem',    // 56px for prominent buttons
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      minWidth: {
        'touch': '2.75rem',      // 44px minimum touch target
        'touch-sm': '2.5rem',    // 40px for smaller touch targets
        'touch-lg': '3rem',      // 48px for primary actions
        'touch-xl': '3.5rem',    // 56px for prominent buttons
      },
      maxWidth: {
        // Container sizes for different breakpoints
        'mobile': '100%',
        'tablet': '48rem',       // 768px
        'desktop': '64rem',      // 1024px
        'wide': '80rem',         // 1280px
        'ultra': '96rem',        // 1536px
      },
      gap: {
        // Touch-friendly gaps
        'touch-sm': '0.5rem',    // 8px
        'touch-md': '0.75rem',   // 12px
        'touch-lg': '1rem',      // 16px
        'touch-xl': '1.5rem',    // 24px
      },
      borderRadius: {
        // Touch-friendly border radius
        'touch': '0.5rem',       // 8px
        'touch-lg': '0.75rem',   // 12px
        'touch-xl': '1rem',      // 16px
      },
      zIndex: {
        // Z-index scale for layering
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },
      animation: {
        // Modern animation system
        'fade-in': 'fadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-out': 'fadeOut 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'scale-in': 'scaleIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'scale-out': 'scaleOut 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-up': 'slideInUp 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-down': 'slideInDown 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-left': 'slideInLeft 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-right': 'slideInRight 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'bounce-gentle': 'bounceGentle 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-gentle': 'pulseGentle 1000ms cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'shimmer': 'shimmer 1500ms ease-in-out infinite',
        'float': 'float 3000ms ease-in-out infinite',
        'glow': 'glow 2000ms ease-in-out infinite',
        
        // Touch-friendly animations
        'touch-feedback': 'touchFeedback 150ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'slide-left': 'slideLeft 300ms ease-out',
        'slide-right': 'slideRight 300ms ease-out',
      },
      keyframes: {
        // Modern keyframes
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.9)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInDown: {
          '0%': { opacity: '0', transform: 'translateY(-100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceGentle: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
        
        // Touch-friendly keyframes
        touchFeedback: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      transitionDuration: {
        '50': '50ms',
        '75': '75ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '900': '900ms',
      },
    },
  },
  plugins: [
    // Custom plugin for responsive utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Touch-optimized utilities
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.touch-pan-x': {
          'touch-action': 'pan-x',
        },
        '.touch-pan-y': {
          'touch-action': 'pan-y',
        },
        '.touch-none': {
          'touch-action': 'none',
        },
        // Tap highlight removal
        '.tap-highlight-transparent': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        // Smooth scrolling
        '.scroll-smooth': {
          'scroll-behavior': 'smooth',
        },
        // iOS momentum scrolling
        '.scroll-momentum': {
          '-webkit-overflow-scrolling': 'touch',
        },
        // Safe area utilities
        '.pt-safe': {
          'padding-top': 'max(1rem, env(safe-area-inset-top))',
        },
        '.pb-safe': {
          'padding-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        },
        '.pl-safe': {
          'padding-left': 'max(1rem, env(safe-area-inset-left))',
        },
        '.pr-safe': {
          'padding-right': 'max(1rem, env(safe-area-inset-right))',
        },
        '.p-safe': {
          'padding-top': 'max(1rem, env(safe-area-inset-top))',
          'padding-bottom': 'max(1rem, env(safe-area-inset-bottom))',
          'padding-left': 'max(1rem, env(safe-area-inset-left))',
          'padding-right': 'max(1rem, env(safe-area-inset-right))',
        },
        // Container queries for responsive components
        '.container-xs': {
          'container-type': 'inline-size',
          'width': '100%',
        },
        // Aspect ratio utilities for responsive media
        '.aspect-video-mobile': {
          'aspect-ratio': '16 / 9',
          '@media (max-width: 640px)': {
            'aspect-ratio': '4 / 3',
          },
        },
        '.aspect-square-mobile': {
          'aspect-ratio': '1 / 1',
          '@media (max-width: 640px)': {
            'aspect-ratio': '4 / 5',
          },
        },
      };

      addUtilities(newUtilities);
    },
  ],
}
