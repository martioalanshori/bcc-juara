// Build Tailwind statis (offline). Tema "Papan Petunjuk": warna diambil dari CSS variable di
// app/css/tokens.css sehingga mode gelap/terang cukup mengganti atribut data-theme di <html>.
// Jalankan dari root proyek:
//   npx tailwindcss@3 -c tools/tailwind/tailwind.config.js -i tools/tailwind/input.css -o app/vendor/tailwind.css --minify
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (fam) => Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [s, v(`${fam}-${s}`)]));
const tokens = ['surface-container-highest', 'surface-bright', 'on-background', 'tertiary-container', 'secondary', 'on-primary',
  'primary-container', 'outline', 'surface-variant', 'on-primary-container', 'surface-container-low', 'on-surface-variant',
  'surface-dim', 'primary', 'surface', 'on-surface', 'tertiary', 'secondary-container', 'surface-container-high',
  'surface-container-lowest', 'error', 'outline-variant', 'error-container', 'surface-container', 'background'];
const SANS = ['Barlow', 'system-ui', 'sans-serif'];
const COND = ['"Barlow Condensed"', 'Barlow', 'system-ui', 'sans-serif'];

module.exports = {
  content: ['./index.html', './app/*.html', './app/js/**/*.js'],
  theme: { extend: {
    colors: {
      ...Object.fromEntries(tokens.map((t) => [t, v(t)])),
      white: v('white'), black: v('black'),
      slate: scale('slate'), rose: scale('rose'), orange: scale('orange'), amber: scale('amber'),
      emerald: scale('emerald'), sky: scale('sky'), indigo: scale('indigo'), violet: scale('violet'),
    },
    fontFamily: {
      sans: SANS, mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      'body-sm': SANS, 'body-md': SANS, 'body-lg': SANS,
      'label-sm': SANS, 'label-md': SANS, 'label-lg': SANS,
      'headline-sm': COND, 'headline-md': COND, 'headline-lg': COND, 'display-lg': COND,
    },
    fontSize: {
      'label-sm': ['12px', { lineHeight: '16px', fontWeight: '600' }],
      'label-md': ['13px', { lineHeight: '18px', fontWeight: '500' }],
      'label-lg': ['14px', { lineHeight: '20px', fontWeight: '500' }],
      'body-sm': ['13px', { lineHeight: '19px' }],
      'body-md': ['15px', { lineHeight: '22px' }],
      'body-lg': ['17px', { lineHeight: '26px' }],
      'headline-sm': ['19px', { lineHeight: '24px', fontWeight: '600' }],
      'headline-md': ['23px', { lineHeight: '28px', fontWeight: '600' }],
      'headline-lg': ['31px', { lineHeight: '36px', fontWeight: '600' }],
      'display-lg': ['42px', { lineHeight: '44px', fontWeight: '700' }],
    },
  } },
};
