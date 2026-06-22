/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          dark: '#111b21',
          panel: '#202c33',
          green: '#00a884',
          lightgreen: '#25d366',
          bubble: '#005c4b',
        },
      },
    },
  },
  plugins: [],
}