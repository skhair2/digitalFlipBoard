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
          50: '#e6f7f8',
          100: '#b3e6eb',
          200: '#80d5de',
          300: '#4dc4d1',
          400: '#32b8c6',
          500: '#21808d', // Main teal
          600: '#1d7480',
          700: '#196873',
          800: '#145c66',
          900: '#10505a',
        },
        slate: {
          850: '#1a202e',
          950: '#0f1419',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Berkeley Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      animation: {
        'flip': 'flip 0.6s cubic-bezier(0.45, 0.05, 0.55, 0.95)',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'watermark-pulse': 'watermarkPulse 3s ease-in-out infinite',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(-90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        watermarkPulse: {
          '0%, 100%': { opacity: '0.15' },
          '50%': { opacity: '0.25' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(33, 128, 141, 0.3)',
        'glow-lg': '0 0 40px rgba(33, 128, 141, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
