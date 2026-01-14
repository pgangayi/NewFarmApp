/** @type {import('tailwindcss').Config} */
export default {
  // v4 uses CSS-based configuration, so this file is much simpler
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  // Dark mode configuration
  darkMode: ['class'],

  // Theme configuration is now handled in CSS using @theme
  // This file is kept minimal for backwards compatibility
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
  },

  // Plugins - v4 has built-in support for many features
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};
