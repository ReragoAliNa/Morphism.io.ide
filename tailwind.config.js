/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // OLED-optimized neutral palette
        bg:      '#0A0A0B',
        surface: '#141416',
        border:  '#1F1F22',
        hover:   '#27272A',
        // Text
        'text-primary':  '#E4E4E7',
        'text-secondary': '#A1A1AA',
        'text-muted':    '#71717A',
        'text-faint':    '#3F3F46',
        // Accent
        primary: '#22C55E',
      },
      borderRadius: {
        DEFAULT: '0px',
      },
      spacing: {
        'unit': '8px',
      }
    },
  },
  plugins: [],
}
