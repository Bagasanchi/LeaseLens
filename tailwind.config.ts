import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cobalt: {
          500: "#2563EB",
        },
        risk: {
          high: "#DC2626",
          mid: "#D97706",
          low: "#16A34A",
        },
      },
      fontFamily: {
        sans: ["Golos Text", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;