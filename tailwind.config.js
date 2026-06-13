/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        sky: {
          light: '#B8DCF5',
          DEFAULT: '#4A90D9',
          dark: '#2C5F8F',
        },
        paper: {
          DEFAULT: '#F8F6F0',
          warm: '#F5EFE0',
        },
        accent: {
          DEFAULT: '#FFB347',
          dark: '#E69320',
        },
        grass: {
          DEFAULT: '#6BB35F',
          light: '#8CCB80',
        },
        cloud: {
          DEFAULT: '#E8E8E8',
          dark: '#C8C8C8',
        },
      },
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', 'cursive'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'capsule': '9999px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(74, 144, 217, 0.12)',
        'card': '0 8px 32px rgba(74, 144, 217, 0.15)',
        'glow': '0 0 24px rgba(74, 144, 217, 0.35)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pop-in': 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
