/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'krifty-blue': '#003366',
        'krifty-light': '#f0f4f8',
      }
    },
  },
  plugins: [],
}
