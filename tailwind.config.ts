import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: { 400: "#D4A843", 500: "#C4982B", 600: "#A87E1F" },
        dark: { 800: "#1a1a1a", 900: "#0d0d0d", 950: "#080808" },
      },
    },
  },
  plugins: [],
};
export default config;
