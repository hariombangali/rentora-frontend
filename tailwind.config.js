/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1F2420",
        paper: "#F6F3EC",
        card: "#FFFFFF",
        rule: "#E8E2D3",
        accent: {
          DEFAULT: "oklch(0.62 0.09 50)",
          hover: "oklch(0.55 0.10 50)",
          soft: "oklch(0.95 0.03 50)",
        },
        sage: {
          DEFAULT: "oklch(0.72 0.06 150)",
          hover: "oklch(0.65 0.07 150)",
          soft: "oklch(0.95 0.03 150)",
        },
        muted: "#8A8880",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(31,36,32,0.06), 0 4px 16px rgba(31,36,32,0.07)",
        "card-hover": "0 4px 12px rgba(31,36,32,0.10), 0 16px 40px rgba(31,36,32,0.10)",
        soft: "0 2px 8px rgba(31,36,32,0.08)",
      },
    },
  },
  plugins: [],
}
