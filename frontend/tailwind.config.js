/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nebula: {
          bg: '#0F0B1E',        // deepest background
          panel: '#161229',     // sidebar / header panels
          elevated: '#1E1838',  // input fields, hover surfaces, received bubbles
          border: '#2A2347',    // hairline borders
          primary: '#7C5CFC',   // primary accent - buttons, links, focus
          primaryDark: '#6347E0',
          glow: '#A78BFA',      // lighter violet - online dot, typing dots
          muted: '#8B85A8',     // secondary text
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 10px 1px rgba(167, 139, 250, 0.5)',
      },
    },
  },
  plugins: [],
}