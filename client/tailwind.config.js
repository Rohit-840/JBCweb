/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#020302",
          900: "#060706",
          850: "#0a0b09",
        },
        crown: {
          gold: "#f5c542",
          pearl: "#f7f2df",
          emerald: "#34d399",
          ruby: "#fb7185",
        },
      },
      boxShadow: {
        premium: "0 20px 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,226,142,0.07)",
        "gold-focus": "0 0 0 1px rgba(255,214,107,0.42), 0 0 26px rgba(245,197,66,0.18)",
      },
      borderRadius: {
        panel: "8px",
      },
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        bolin: ['"Bolin Gerii"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
