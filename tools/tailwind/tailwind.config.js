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
const SANS = ['Inter', 'system-ui', 'sans-serif'];
const COND = SANS; // judul & angka memakai Inter juga (satu keluarga huruf)

module.exports = {
  content: ['./app/pages/*.html', './app/js/**/*.js'],
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
      // Skala untuk Inter (lebih lebar dari Barlow Condensed sebelumnya): ukuran dasbor operasional yang wajar.
      'label-sm': ['12px', { lineHeight: '16px', fontWeight: '600' }],
      'label-md': ['12px', { lineHeight: '16px', fontWeight: '500' }],
      'label-lg': ['13px', { lineHeight: '18px', fontWeight: '500' }],
      'body-sm': ['13px', { lineHeight: '18px' }],
      'body-md': ['14px', { lineHeight: '20px' }],
      'body-lg': ['16px', { lineHeight: '24px' }],
      'headline-sm': ['15px', { lineHeight: '22px', fontWeight: '600', letterSpacing: '-0.005em' }],
      'headline-md': ['17px', { lineHeight: '24px', fontWeight: '600', letterSpacing: '-0.01em' }],
      'headline-lg': ['22px', { lineHeight: '28px', fontWeight: '600', letterSpacing: '-0.015em' }],
      'display-lg': ['28px', { lineHeight: '34px', fontWeight: '600', letterSpacing: '-0.02em' }],
    },
  } },
};
