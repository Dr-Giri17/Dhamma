import type { Config } from "tailwindcss";

// Dhamma palette: warm white, golden-gray, soft amber accents.
// Light, clean, contemplative, luminous.
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "#faf8f5",
          soft: "#ffffff",
          deep: "#f0ede8",
        },
        ink: {
          DEFAULT: "#3d3d3d",
          soft: "#5a5a5a",
          faint: "#8a8a8a",
        },
        gold: {
          DEFAULT: "#b8860b",
          soft: "#d4a843",
        },
        forest: {
          DEFAULT: "#7a7050",
          soft: "#8a8060",
        },
        saffron: {
          DEFAULT: "#c8963e",
          soft: "#dab060",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "'Times New Roman'", "Times", "serif"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
