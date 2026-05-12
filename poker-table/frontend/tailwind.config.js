/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        felt: {
          900: "#0a2218",
          800: "#0d2d20",
          700: "#11392a",
          600: "#164a36",
        },
        gold: {
          400: "#d4a843",
          300: "#e8c46a",
          200: "#f0d68e",
        },
        chip: {
          red: "#c0392b",
          blue: "#2980b9",
          black: "#1a1a1a",
        },
      },
      boxShadow: {
        felt: "inset 0 0 80px rgba(0,0,0,0.5), 0 0 0 12px #2c1a0e, 0 0 0 16px #1a0f07",
        card: "2px 4px 12px rgba(0,0,0,0.6)",
        glow: "0 0 20px rgba(212,168,67,0.4)",
      },
    },
  },
  plugins: [],
};
