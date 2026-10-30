/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        guven: {
          blue: '#1598C8',
          'blue-deep': '#127AA4',
          'blue-light': '#E8F5FA',
          ivory: '#FAF8F5',
          blush: '#EAD9D8',
          sand: '#E8DDD0',
          charcoal: '#292B30',
          muted: '#77747A',
          border: '#EAE5E2',
          surface: '#FFFFFF',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 10px 30px -10px rgba(41, 43, 48, 0.06)',
        'luxury-hover': '0 20px 40px -15px rgba(21, 152, 200, 0.12)',
        'drawer': '-10px 0 40px rgba(41, 43, 48, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
