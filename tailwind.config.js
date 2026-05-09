export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "ui-serif", "Georgia", "serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#FF4D00",
          dark: "#cc3d00",
          light: "#fff0eb",
        },
        bg: {
          base: "#F9F8F6",
          surface: "#FFFFFF",
          alt: "#F3F2EE",
        },
        text: {
          main: "#1A1A1A",
          muted: "rgba(26, 26, 26, 0.4)",
        },
      },
      borderRadius: {
        "xl": "1.5rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
