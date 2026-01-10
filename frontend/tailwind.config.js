/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#09090b', // Zinc 950 - Deepest background
          900: '#18181b', // Zinc 900 - Main background
          800: '#27272a', // Zinc 800 - Card background
          700: '#3f3f46', // Zinc 700 - Lighter card/border
          600: '#52525b', // Zinc 600 - Borders
          400: '#a1a1aa', // Zinc 400 - Muted text
          200: '#e4e4e7', // Zinc 200 - Primary text
        },
        brand: {
          500: '#3b82f6', // Blue 500 - Primary Blue
          600: '#2563eb', // Blue 600
          400: '#60a5fa', // Blue 400
        },
        accent: {
          green: '#10B981',
          orange: '#F59E0B',
          red: '#EF4444',
          purple: '#8B5CF6',
        }
      }
    },
  },
  plugins: [],
}