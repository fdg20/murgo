/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#E63946',
        secondary: '#1D3557',
        accent: '#F4A261',
        surface: '#F8F9FA',
      },
    },
  },
  plugins: [],
};
