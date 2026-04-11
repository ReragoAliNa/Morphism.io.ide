/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deepspace: {
          900: '#0b0c10', // Deepest background
          800: '#15161a', // Sidebar background
          700: '#1f2026', // Panel borders / slight highlights
        },
        syntax: {
          green: '#4ade80', // Matrix green for success/highlight
          purple: '#c084fc', // Math models accent
        }
      }
    },
  },
  plugins: [],
}
