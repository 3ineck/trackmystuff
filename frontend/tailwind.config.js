/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0f0f12",
        panel: "#17171c",
        border: "#24242c",
        ink: "#e8e8ee",
        muted: "#9a9aa8",
        accent: "#22c55e",
      },
    },
  },
  plugins: [],
};
