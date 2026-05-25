/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F7F2EF',
        blush: '#EADDD7',
        rose: '#C9A7A0',
        espresso: '#4A3734',
        taupe: '#8E7B75',
        mauve: '#6D5350',
        softborder: '#DCCFCB',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        script: ['Parisienne', 'Allura', 'cursive'],
        sans: ['Montserrat', 'Lato', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading': ['2.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'subheading': ['1.75rem', { lineHeight: '1.3' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        'section': '6rem',
      },
      borderRadius: {
        'soft': '0.75rem',
        'softer': '1rem',
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(74, 55, 52, 0.06)',
        'medium': '0 8px 32px rgba(74, 55, 52, 0.08)',
        'glow': '0 0 40px rgba(201, 167, 160, 0.15)',
      },
    },
  },
  plugins: [],
};