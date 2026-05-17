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
          // Backgrounds
          dark: "#050A12",
          darker: "#03060A",
          card: "#0B1220",
          "card-light": "#111B2E",
          "card-hover": "#162236",
          // Neon Blue (C)
          blue: "#009DFF",
          "blue-light": "#33B1FF",
          "neon-blue": "#00C8FF",
          "neon-blue-dim": "rgba(0, 200, 255, 0.6)",
          // Neon Green (P)
          green: "#A7FF00",
          "green-light": "#B8FF33",
          "neon-green": "#7CFF00",
          "neon-green-dim": "rgba(124, 255, 0, 0.6)",
          // Neon Red (Lightning)
          red: "#FF3366",
          "red-light": "#FF5588",
          "neon-red": "#FF0044",
          "neon-red-dim": "rgba(255, 0, 68, 0.6)",
          // Accent
          accent: "#00F0FF",
        },
        surface: {
          DEFAULT: "#0B1220",
          elevated: "#111B2E",
          hover: "#162236",
          pressed: "#1a2942",
        },
      },
      boxShadow: {
        "neon-blue": "0 0 24px rgba(0, 200, 255, 0.35)",
        "neon-blue-lg": "0 0 40px rgba(0, 200, 255, 0.45)",
        "neon-green": "0 0 24px rgba(124, 255, 0, 0.45)",
        "neon-green-lg": "0 0 40px rgba(124, 255, 0, 0.55)",
        "neon-red": "0 0 24px rgba(255, 0, 68, 0.35)",
        "neon-red-lg": "0 0 40px rgba(255, 0, 68, 0.45)",
        "glow-green": "0 0 60px rgba(124, 255, 0, 0.2)",
        "glow-blue": "0 0 60px rgba(0, 200, 255, 0.2)",
        "glow-red": "0 0 60px rgba(255, 0, 68, 0.2)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 200, 255, 0.1)",
        "premium": "0 0 30px rgba(124, 255, 0, 0.15)",
        "premium-hover": "0 0 50px rgba(124, 255, 0, 0.25)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-premium": "linear-gradient(135deg, #A7FF00 0%, #5CFF00 100%)",
        "gradient-blue": "linear-gradient(135deg, #00C8FF 0%, #009DFF 100%)",
        "gradient-red": "linear-gradient(135deg, #FF3366 0%, #FF0044 100%)",
        "gradient-dark": "linear-gradient(180deg, #0B1220 0%, #050A12 100%)",
        "gradient-card": "linear-gradient(145deg, #111B2E 0%, #0B1220 100%)",
        "shimmer": "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
        "lightning": "linear-gradient(135deg, #00C8FF 0%, #FF0044 50%, #7CFF00 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "countdown-pulse": "countdownPulse 1s ease-in-out infinite",
        "lightning-flicker": "lightningFlicker 3s ease-in-out infinite",
        "neon-pulse": "neonPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124, 255, 0, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(124, 255, 0, 0.5)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
        countdownPulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        lightningFlicker: {
          "0%, 100%": { opacity: "0.8", filter: "brightness(1)" },
          "50%": { opacity: "1", filter: "brightness(1.3)" },
          "52%": { opacity: "0.6", filter: "brightness(0.8)" },
          "54%": { opacity: "1", filter: "brightness(1.2)" },
        },
        neonPulse: {
          "0%, 100%": { textShadow: "0 0 10px rgba(0, 200, 255, 0.5), 0 0 20px rgba(0, 200, 255, 0.3)" },
          "50%": { textShadow: "0 0 20px rgba(0, 200, 255, 0.8), 0 0 40px rgba(0, 200, 255, 0.5), 0 0 60px rgba(0, 200, 255, 0.3)" },
        },
      },
      transitionTimingFunction: {
        "premium": "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce-soft": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      backdropBlur: {
        xs: "2px",
      },
      // Skewed edges utility
      skew: {
        "1": "1deg",
        "2": "2deg",
        "3": "3deg",
      },
    },
  },
  plugins: [],
};
