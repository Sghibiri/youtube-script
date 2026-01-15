/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[dark]'], // Support both .dark class and html[dark] attribute for YouTube
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'primary-light': 'var(--color-primary-light)',
        secondary: 'var(--color-secondary)',
        'secondary-dark': 'var(--color-secondary-dark)',
        'secondary-light': 'var(--color-secondary-light)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
      },
      boxShadow: {
        elevated: 'var(--shadow-elevated)',
        card: 'var(--shadow-card)',
        button: 'var(--shadow-button)',
        hover: 'var(--shadow-hover)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        base: 'var(--transition-base)',
        slow: 'var(--transition-slow)',
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease',
        'fade-in': 'fade-in 0.2s ease',
        'scale-in': 'scale-in 0.15s ease',
      },
      keyframes: {
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },
      zIndex: {
        toggle: '9998',
        sidebar: '9999',
        modal: '10000',
      },
    },
  },
  plugins: [],
};
