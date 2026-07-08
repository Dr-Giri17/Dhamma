import type { Config } from "tailwindcss";

const withAlpha = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: withAlpha("--color-canvas"),
        surface: withAlpha("--color-surface"),
        muted: withAlpha("--color-muted"),
        line: withAlpha("--color-line"),
        ink: {
          DEFAULT: withAlpha("--color-ink"),
          soft: withAlpha("--color-ink-soft"),
          faint: withAlpha("--color-ink-faint"),
        },
        accent: {
          DEFAULT: withAlpha("--color-accent"),
          soft: withAlpha("--color-accent-soft"),
          strong: withAlpha("--color-accent-strong"),
        },
        action: {
          DEFAULT: withAlpha("--color-action"),
          soft: withAlpha("--color-action-soft"),
        },
        warn: withAlpha("--color-warn"),
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
