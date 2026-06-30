import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spice: {
          DEFAULT: '#C4622D',
          light: '#E07A47',
          dark: '#9E4A1E'
        },
        turmeric: {
          DEFAULT: '#E8A020',
          light: '#F5C055',
          dark: '#C4831A'
        },
        saffron: {
          DEFAULT: '#F4650A',
          glow: 'rgba(244,101,10,0.2)'
        },
        mahogany: {
          DEFAULT: '#FAF0DC',      // Main background is cream
          surface: '#F5E6C8',      // Sidebar/panels are warmer cream
          card: '#FFFFFF'          // Cards are white
        },
        cream: {
          DEFAULT: '#1A0800',      // Main text is dark mahogany
          warm: '#2B1206',
          muted: '#6B4F3E'         // Muted text is warm brown
        },
        forest: {
          DEFAULT: '#1E5C2E'
        },
        border: {
          DEFAULT: '#E3D1B4',      // Light border
          hover: '#C4622D'
        }
      },
      fontFamily: {
        display: ["var(--font-yeseva-one)", "serif"],
        body: ["var(--font-poppins)", "sans-serif"],
        devanagari: ["var(--font-noto-sans-devanagari)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"]
      }
    },
  },
  plugins: [],
};
export default config;
