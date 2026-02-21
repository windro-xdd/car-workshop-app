module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './src/index.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0eaff',
          200: '#c5d7ff',
          300: '#9ebaff',
          400: '#7594ff',
          500: '#4d69ff',
          600: '#263cfc',
          700: '#1a27e6',
          800: '#1722b8',
          900: '#172191',
          950: '#101657',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
