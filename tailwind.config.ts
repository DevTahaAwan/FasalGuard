import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // CRITICAL: strictly light mode for outdoor/sunlight use
  theme: {
    extend: {
      // ─── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        serif: ['var(--font-noto-serif)', 'Noto Serif', 'serif'], // Urdu text ONLY
        mono: ['monospace'],
      },

      // ─── Brand Color Palette (from design.json) ───────────────────────────
      colors: {
        brand: {
          primary: '#012d1d',
          hover: '#1b4332',
          active: '#002c27',
          subtle: '#c1ecd4',
        },
        bg: {
          primary: '#f9faf6',
          secondary: '#f0f1ee',
          tertiary: '#ffffff',
          overlay: 'rgba(47, 49, 47, 0.4)',
        },
        text: {
          primary: '#1a1c1a',
          secondary: '#414844',
          tertiary: '#717973',
          placeholder: '#717973',
          disabled: '#c1c8c2',
          inverse: '#ffffff',
          link: '#012d1d',
          linkHover: '#3f6653',
        },
        border: {
          default: '#e2e3e0',
          subtle: '#eeeeeb',
          strong: '#717973',
          brand: '#012d1d',
        },
        // ─── Semantic Colors ───────────────────────────────────────────────
        success: {
          DEFAULT: '#22c55e',
          subtle: '#c1ecd4',
          text: '#002114',
          border: '#a5d0b9',
        },
        warning: {
          DEFAULT: '#a7373b',
          subtle: '#ffdad8',
          text: '#410007',
          border: '#ffb3b0',
        },
        error: {
          DEFAULT: '#ba1a1a',
          subtle: '#ffdad6',
          text: '#ffffff',
          hover: '#93000a',
          border: '#ba1a1a',
        },
        info: {
          DEFAULT: '#3f6653',
          subtle: '#e2e3e0',
          text: '#1a1c1a',
        },
        // ─── Whatsapp ─────────────────────────────────────────────────────
        whatsapp: {
          DEFAULT: '#25D366',
          hover: '#1da851',
        },
        // ─── Skeleton shimmer ─────────────────────────────────────────────
        skeleton: {
          base: '#e2e3e0',
          shimmer: '#f3f4f1',
        },
      },

      // ─── Spacing Scale (design.json) ──────────────────────────────────────
      spacing: {
        // Touch targets
        'touch-primary': '56px',
        'touch-secondary': '48px',
        // Nav
        'nav-height': '72px',
        'header-height': '64px',
        // Max content width
        'content-max': '600px',
      },

      // ─── Border Radius (design.json contextMap) ───────────────────────────
      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },

      // ─── Box Shadows ──────────────────────────────────────────────────────
      boxShadow: {
        'card-lift': '0px 2px 4px 0px rgba(0,0,0,0.05)',
        'modal-priority': '0px 8px 24px 0px rgba(0,0,0,0.12)',
      },

      // ─── Animation Durations (design.json) ────────────────────────────────
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '350ms',
      },

      // ─── Keyframes ────────────────────────────────────────────────────────
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1500ms linear infinite',
        'slide-up': 'slide-up 350ms cubic-bezier(0.0, 0, 0.2, 1) forwards',
        'fade-in': 'fade-in 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },

      // ─── Max-width shorthand ──────────────────────────────────────────────
      maxWidth: {
        content: '600px',
      },

      // ─── Min-height for touch targets ─────────────────────────────────────
      minHeight: {
        'touch-primary': '56px',
        'touch-secondary': '48px',
      },

      // ─── Min-width for touch targets ──────────────────────────────────────
      minWidth: {
        'touch-secondary': '48px',
      },
    },
  },
  plugins: [],
};

export default config;
