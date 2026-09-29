/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",   // toggled by adding/removing "dark" class on <html>
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#e6f4f9",
          100: "#cce9f3",
          200: "#99d3e7",
          300: "#66bddb",
          400: "#33a7cf",
          500: "#1a8fb5",
          600: "#157aa0",
          700: "#0f6485",
          800: "#0a4f6a",
          900: "#053a50",
        },
        accent:  "#2bbfdd",
        surface: "#f4f7f9",
        card:    "#ffffff",

        // Dark-mode palette aliases (used in CSS variables)
        dark: {
          bg:      "#0f1117",
          surface: "#1a1d27",
          card:    "#1e2233",
          border:  "#2a2f45",
          text:    "#e2e8f0",
          muted:   "#8892a4",
        },
      },
      fontFamily: {
        sans:    ["'DM Sans'",          "sans-serif"],
        display: ["'Plus Jakarta Sans'","sans-serif"],
      },
      boxShadow: {
        card:        "0 2px 12px rgba(0,0,0,0.07)",
        "card-hover":"0 6px 20px rgba(0,0,0,0.12)",
        "dark-card": "0 2px 12px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        xl:  "1rem",
        "2xl":"1.25rem",
      },
    },
  },
  plugins: [],
};