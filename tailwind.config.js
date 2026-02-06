/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 奢华深色主题
        'void': '#050508',
        'void-light': '#0a0a10',
        'void-panel': '#12121a',
        'void-elevated': '#1a1a25',
        'void-border': '#2a2a3a',
        
        // 奢华强调色
        'luxury': {
          gold: '#ffd700',
          'gold-light': '#ffec8b',
          'gold-dark': '#b8860b',
          purple: '#8b5cf6',
          'purple-light': '#a78bfa',
          'purple-dark': '#6d28d9',
          cyan: '#06b6d4',
          'cyan-light': '#67e8f9',
          rose: '#f43f5e',
          'rose-light': '#fb7185',
          amber: '#f59e0b',
          green: '#22c55e',
          'green-light': '#4ade80',
        },
        
        // 霓虹光效
        'neon': {
          gold: '#ffd700',
          purple: '#a855f7',
          cyan: '#22d3ee',
          pink: '#ec4899',
          green: '#22c55e',
        },
        
        // 渐变色彩
        'gradient': {
          start: '#8b5cf6',
          mid: '#a855f7',
          end: '#06b6d4',
        }
      },
      fontFamily: {
        'display': ['"Orbitron"', 'sans-serif'],
        'pixel': ['"Press Start 2P"', 'cursive'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'luxury-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #06b6d4 100%)',
        'gold-gradient': 'linear-gradient(135deg, #ffd700 0%, #ffec8b 50%, #b8860b 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0a0a10 0%, #050508 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-in': 'slide-in 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'border-flow': 'border-flow 3s linear infinite',
        'marquee': 'marquee 15s linear infinite',
        'coin-float': 'coin-float 1s ease-out forwards',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.8), 0 0 60px rgba(139, 92, 246, 0.5)',
            transform: 'scale(1.02)'
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { 
            filter: 'brightness(1) drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))',
          },
          '50%': { 
            filter: 'brightness(1.2) drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))',
          },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'border-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'coin-float': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-50px) scale(1.5)', opacity: '0' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
      },
      boxShadow: {
        'luxury': '0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)',
        'gold': '0 0 30px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.1)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.5)',
        'neon-cyan': '0 0 20px rgba(34, 211, 238, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}
