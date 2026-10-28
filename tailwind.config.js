/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette
        lime: {
          DEFAULT: "#A8F25C",
          50: "#F4FDE8",
          100: "#E6FAC8",
          200: "#CFF596",
          300: "#A8F25C",  // Primary brand accent
          400: "#87E32B",
          500: "#66C41A",
          600: "#4D9614",
          700: "#39700F",
          800: "#264B0A",
          900: "#132505",
        },
        // Background scale (dynamic via theme variables)
        bg: {
          base: "var(--color-bg-base)",
          surface: "var(--color-bg-surface)",
          elevated: "var(--color-bg-elevated)",
          overlay: "var(--color-bg-elevated)",
          border: "var(--color-bg-border)",
          "border-subtle": "var(--color-bg-border)",
        },
        // Text scale (dynamic via theme variables)
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          inverse: "var(--color-text-inverse)",
        },
        // Status colors
        status: {
          "not-assessed": "#4A4A4A",
          "needs-work": "#EF4444",
          developing: "#F59E0B",
          demonstrated: "#A8F25C",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.5)",
        "card-hover": "0 4px 12px rgba(0, 0, 0, 0.7)",
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "slide-up": "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
