/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4CAF50',
          hover: '#45a049',
          disabled: '#cccccc'
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
