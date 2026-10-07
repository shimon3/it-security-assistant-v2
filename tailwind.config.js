/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Semantic colours, defined once in src/index.css. Pages use these names,
      // never raw greys, so the palette can change in one place.
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        sunken: token('sunken'),
        line: { DEFAULT: token('line'), strong: token('line-strong') },
        ink: { DEFAULT: token('ink'), 2: token('ink-2') },
        muted: token('muted'),
        faint: token('faint'),
        brand: { DEFAULT: token('brand'), strong: token('brand-strong'), soft: token('brand-soft') },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"IBM Plex Sans Hebrew"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
