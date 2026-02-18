import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      scale: {
        '102': '1.02',
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        // Brand colors - mapped to CSS variables that can be customized
        brand: {
          primary: "var(--brand-primary)",
          "primary-hover": "var(--brand-primary-hover)",
          secondary: "var(--brand-secondary)",
          "secondary-hover": "var(--brand-secondary-hover)",
        },
        // Override orange to use brand colors for consistency
        orange: {
          400: "var(--brand-primary-hover)", // #fb923c
          500: "var(--brand-primary)", // #f97316
          600: "var(--brand-secondary)", // #ea580c
          950: "#431407", // dark accent
        },
        // Light theme
        surface: {
          DEFAULT: "#fafafa",
          elevated: "#ffffff",
          muted: "#f5f5f5",
        },
        ink: {
          DEFAULT: "#171717",
          muted: "#737373",
          subtle: "#a3a3a3",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          muted: "#ffedd5",
        },
        // Sidebar (light)
        sidebar: {
          DEFAULT: "#ffffff",
          border: "#e5e5e5",
          ink: "#171717",
          "ink-muted": "#737373",
        },
        status: {
          draft: "#737373",
          pending: "#ca8a04",
          paid: "#16a34a",
          overdue: "#dc2626",
          outstanding: "#ea580c",
          scheduled: "#2563eb",
        },
      },
    },
  },
  plugins: [],
};

export default config;
