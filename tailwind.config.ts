import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border, 214 32% 91%))",
        input: "hsl(var(--input, 214 32% 91%))",
        ring: "hsl(var(--ring, 187 100% 28%))",
        background: "hsl(var(--background, 210 40% 98%))",
        foreground: "hsl(var(--foreground, 215 25% 15%))",
        // Official lead2b Brand Teal Palette (matched directly from official brand logo)
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#006d77", // Signature lead2b teal
          900: "#004d53",
          950: "#002b2f",
          DEFAULT: "#00838f",
        },
        // Charcoal / Slate Dark Neutral from the "lead" wordmark
        leadslate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#070b12",
        },
        primary: {
          DEFAULT: "hsl(var(--primary, 187 100% 28%))", // #00838f
          foreground: "hsl(var(--primary-foreground, 0 0% 100%))",
          50: "#ecfeff",
          100: "#cffafe",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#00838f",
          800: "#006d77",
          900: "#004d53",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary, 215 25% 27%))",
          foreground: "hsl(var(--secondary-foreground, 210 40% 98%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 210 40% 96.1%))",
          foreground: "hsl(var(--muted-foreground, 215.4 16.3% 46.9%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 187 100% 96%))",
          foreground: "hsl(var(--accent-foreground, 187 100% 28%))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive, 0 84.2% 60.2%))",
          foreground: "hsl(var(--destructive-foreground, 210 40% 98%))",
        },
        card: {
          DEFAULT: "hsl(var(--card, 0 0% 100%))",
          foreground: "hsl(var(--card-foreground, 222.2 84% 4.9%))",
        },
      },
      borderRadius: {
        xl: "0.85rem",
        "2xl": "1.15rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(0, 131, 143, 0.4)",
        "glow-lg": "0 0 35px -5px rgba(0, 131, 143, 0.5)",
        card: "0 1px 3px rgba(0,0,0,0.05), 0 10px 20px -5px rgba(15, 23, 42, 0.04)",
        "card-hover": "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 25px -5px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        sans: ["'Poppins'", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        poppins: ["'Poppins'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
