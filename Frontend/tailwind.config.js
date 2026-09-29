/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",   // toggled by adding/removing "dark" class on <html>
  theme: {
    extend: {
      colors: {
        // X-style blue (every primary-* class in the app now uses it)
        primary: {
          50:  "#e8f5fd",
          100: "#d2ebfc",
          200: "#a5d7f9",
          300: "#78c3f6",
          400: "#4baff3",
          500: "#1d9bf0",
          600: "#1d9bf0",
          700: "#1d9bf0",
          800: "#1a8cd8",
          900: "#177cc0",
        },
        accent:  "#1d9bf0",
        surface: "#f7f9f9",
        card:    "#ffffff",
        dark: {
          bg:      "#000000",
          surface: "#16181c",
          card:    "#000000",
          border:  "#2f3336",
          text:    "#e7e9ea",
          muted:   "#71767b",
        },
      },
      fontFamily: {
        sans:    ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "Helvetica", "Arial", "sans-serif"],
        display: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        card:        "none",
        "card-hover":"none",
        "dark-card": "none",
      },
      borderRadius: {
        xl:  "1rem",
        "2xl":"1rem",
      },
    },
  },
  plugins: [],
};