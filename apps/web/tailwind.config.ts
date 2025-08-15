import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./**/*.{ts,tsx}"
  ],
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
    },
  },
  plugins: [],
}
export default config
