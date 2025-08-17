import type { Config } from "tailwindcss";

// Minimal Tailwind v4 config. Content scanning is automatic in v4 when using the
// official PostCSS plugin, so we only extend the theme as needed.
const config: Config = {
  theme: {
    extend: {
      colors: {
        f1: {
          red: "#E10600",
          carbon: "#0a0a0a",
          gray: "#1a1a1a",
        },
      },
      boxShadow: {
        card: "0 6px 24px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        xl: "14px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
