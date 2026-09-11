/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens for Lernreise — a personal learning journal, not a
        // SaaS dashboard. Sage/mist ground the "forest" side of the journey
        // metaphor; pine is the primary accent, amber marks progress.
        paper: '#F1F4F1',
        card: '#FCFBF8',
        ink: '#1F2E29',
        mist: '#D8DDD6',
        pine: {
          DEFAULT: '#0F6E56',
          soft: '#E1F5EE',
          deep: '#085041',
        },
        amber: {
          DEFAULT: '#B8813A',
          soft: '#F3E6D2',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
