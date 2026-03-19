/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        aleo: ["Aleo", "serif"],
      },
      fontSize: {
        sm: "1.1rem",
      },
    },
  },
  plugins: [],
};
