/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],      // 14px (tăng từ 12px)
        'sm': ['1rem', { lineHeight: '1.5rem' }],            // 16px (tăng từ 14px)
        'base': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px (tăng từ 16px)
        'lg': ['1.25rem', { lineHeight: '1.875rem' }],      // 20px (tăng từ 18px)
        'xl': ['1.5rem', { lineHeight: '2rem' }],           // 24px (tăng từ 20px)
        '2xl': ['1.875rem', { lineHeight: '2.25rem' }],    // 30px (tăng từ 24px)
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],       // 36px (tăng từ 30px)
        '4xl': ['3rem', { lineHeight: '1' }],               // 48px (tăng từ 36px)
        '5xl': ['3.75rem', { lineHeight: '1' }],            // 60px (tăng từ 48px)
        '6xl': ['4.5rem', { lineHeight: '1' }],             // 72px (tăng từ 60px)
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
