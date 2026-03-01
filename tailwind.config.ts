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
        // SureLeads green — primary brand
        "sl-green": {
          50:  "#edf7f1",
          100: "#d1ece0",
          200: "#a3d9c0",
          300: "#6fc4a0",
          400: "#3eaa7b",
          500: "#1A6B3C", // primary
          600: "#155633",
          700: "#10412a",
          800: "#0b2c1d",
          900: "#06160f",
        },
        // SureLeads gold — accent, badges only
        "sl-gold": {
          50:  "#fdf8ec",
          100: "#faeece",
          200: "#f4da9a",
          300: "#edc265",
          400: "#e3a63a",
          500: "#C9942A", // primary gold
          600: "#a27522",
          700: "#7b581a",
          800: "#523a12",
          900: "#291d09",
        },
        // Neutral slate — all UI chrome
        "sl-slate": {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        "xl":  "10px",
        "2xl": "14px",
        "3xl": "18px",
      },
      boxShadow: {
        card:     "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        dropdown: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
