/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Rajdhani", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          dark: "#050A12",
          card: "#0B1220",
          "card-light": "#111B2E",
          blue: "#009DFF",
          "neon-blue": "#00C8FF",
          green: "#A7FF00",
          "neon-green": "#7CFF00",
        },
      },
      boxShadow: {
        "neon-blue": "0 0 24px rgba(0, 200, 255, 0.35)",
        "neon-green": "0 0 24px rgba(124, 255, 0, 0.45)",
      },
    },
  },
  plugins: [],
};
