/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Möbius Muse Color Palette
        'night': '#0E1B2E',
        'muse-blue': '#1B3A5C',
        'accent-teal': '#2FA6A0',
        'accent-gold': '#C9A96E',
        'glass': {
          'light': 'rgba(255, 255, 255, 0.05)',
          'dark': 'rgba(0, 0, 0, 0.1)',
          'border': 'rgba(255, 255, 255, 0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'rotate-slow': 'rotateSlow 20s linear infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(47, 166, 160, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(47, 166, 160, 0.6)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        rotateSlow: {
          '0%': { transform: 'rotateY(0deg) rotateX(0deg)' },
          '100%': { transform: 'rotateY(360deg) rotateX(360deg)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.15' },
          '50%': { opacity: '0.25' },
        },
      },
    },
  },
  plugins: [],
}
