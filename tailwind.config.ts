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
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
