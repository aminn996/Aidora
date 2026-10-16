/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'aidora-blue': '#1a2332',
        'aidora-green': '#34d399',
        'aidora-dark': '#0f172a',
        'aidora-light': '#f8fafc',
      },
    },
  },
  plugins: [],
};
