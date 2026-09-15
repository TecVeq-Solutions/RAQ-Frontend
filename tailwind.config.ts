import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#16A34A",
          "dark-green": "#059669",
          navy: "#0F172A",
          gray: "#F3F4F6",
          white: "#FFFFFF",
        },
        theme: {
          bg: "var(--bg-primary)",
          surface: "var(--bg-surface)",
          card: "var(--bg-card)",
          text: "var(--text-primary)",
          muted: "var(--text-muted)",
          border: "var(--border-color)",
          primary: "var(--primary)",
          "primary-dark": "var(--primary-dark)",
          "primary-subtle": "var(--primary-subtle)",
          success: "var(--success)",
          warning: "var(--warning)",
          error: "var(--error)",
          info: "var(--info)",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        pulse: "pulse 1.25s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 1.25s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
