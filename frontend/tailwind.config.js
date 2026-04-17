/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#E85D04', light: '#FB8500' },
        shield: {
          dark: '#0f172a',
          obsidian: '#020617',
          teal: '#0d9488',
        },
        ironman: {
          red: '#b91c1c',
          gold: '#f59e0b',
        },
        cap: {
          blue: '#1d4ed8',
          vibranium: '#94a3b8',
        },
        hulk: {
          green: '#15803d',
        },
        stark: {
          neon: '#06b6d4',
        }
      },
      backgroundImage: {
        'cosmic-glow': 'radial-gradient(circle at top, #1e293b 0%, #020617 100%)',
      }
    },
  },
  plugins: [],
};
