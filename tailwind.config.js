/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        zhihu: '#1772f6',
        ink: '#121212',
        muted: '#8590a6',
        page: '#f6f6f6',
      },
      boxShadow: {
        card: '0 1px 3px rgba(18, 18, 18, 0.10)',
      },
    },
  },
  plugins: [],
}
