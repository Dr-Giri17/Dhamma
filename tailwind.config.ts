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
          DEFAULT: "#f9f6f1",
          soft: "#ffffff",
          deep: "#f0ece4",
        },
        ink: {
          DEFAULT: "#3a3a3a",
          soft: "#5c5c5c",
          faint: "#909090",
        },
        gold: {
          DEFAULT: "#c49030",
          soft: "#d4aa50",
        },
        forest: {
          DEFAULT: "#a08030",
          soft: "#b09040",
        },
        saffron: {
          DEFAULT: "#c89040",
          soft: "#d8a850",
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
