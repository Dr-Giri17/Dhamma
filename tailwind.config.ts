import type { Config } from "tailwindcss";

// Dhamma palette (ТЗ §8.2): warm ivory, dark brown text, muted gold, forest/saffron.
// Typography-first, quiet, minimal.
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
          DEFAULT: "#f6f1e7",
          soft: "#fbf7ee",
          deep: "#efe7d4",
        },
        ink: {
          DEFAULT: "#3a2e22",
          soft: "#5a4a3a",
          faint: "#8a7a68",
        },
        gold: {
          DEFAULT: "#a98641",
          soft: "#c4a45a",
        },
        forest: {
          DEFAULT: "#3a5a47",
          soft: "#5a7a64",
        },
        saffron: {
          DEFAULT: "#c0792a",
          soft: "#d99a4d",
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
