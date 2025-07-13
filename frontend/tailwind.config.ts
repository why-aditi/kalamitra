import type { Config } from "tailwindcss";

// all in fixtures is set to tailwind v3 as interims solutions

const config: Config = {
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#000000',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#000000'
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#000000'
        },
        primary: {
          DEFAULT: '#f97316', // Orange-500
          foreground: '#ffffff'
        },
        secondary: {
          DEFAULT: '#f59e0b', // Amber-500
          foreground: '#ffffff'
        },
        muted: {
          DEFAULT: '#f3f4f6', // Gray-100
          foreground: '#6b7280' // Gray-500
        },
        accent: {
          DEFAULT: '#f43f5e', // Rose-500
          foreground: '#ffffff'
        },
        destructive: {
          DEFAULT: '#ef4444', // Red-500
          foreground: '#ffffff'
        },
        border: '#e5e7eb', // Gray-200
        input: '#f3f4f6', // Gray-100
        ring: '#f97316', // Orange-500
      },
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
