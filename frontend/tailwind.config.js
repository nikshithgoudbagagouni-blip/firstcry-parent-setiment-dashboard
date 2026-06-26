/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#FAF7F2',       // Soft Sand background
        panelBg: '#FFFFFF',      // Pure White panels
        panelBorder: '#E6DDD0',  // Warm Clay border lines
        accentPurple: '#FF8562', // Coral Peach primary accent
        accentTeal: '#88B097',   // Mint Sage secondary accent
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
