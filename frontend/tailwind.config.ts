import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0a0b10",
        panel: "#13141d",
        panel2: "#181a25",
        edge: "#262838",
        brand: "#6d8bff",
        good: "#37d399",
        warn: "#f5a524",
        bad: "#f25c6e",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 10px 30px -12px rgba(0,0,0,0.6)",
        panel: "0 20px 60px -20px rgba(0,0,0,0.75)",
      },
      zIndex: {
        scene: "10",
        sticky: "20",
        overlay: "30",
        backdrop: "40",
        drawer: "50",
      },
    },
  },
  plugins: [],
};

export default config;
