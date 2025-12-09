/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],          // 12px (giảm từ 14px)
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],      // 14px (giảm từ 16px)
        'base': ['1rem', { lineHeight: '1.5rem' }],         // 16px (giảm từ 18px)
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],      // 18px (giảm từ 20px)
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],       // 20px (giảm từ 24px)
        '2xl': ['1.5rem', { lineHeight: '2rem' }],          // 24px (giảm từ 30px)
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],     // 30px (giảm từ 36px)
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],       // 36px (giảm từ 48px)
        '5xl': ['3rem', { lineHeight: '1' }],               // 48px (giảm từ 60px)
        '6xl': ['3.75rem', { lineHeight: '1' }],            // 60px (giảm từ 72px)
      },
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
