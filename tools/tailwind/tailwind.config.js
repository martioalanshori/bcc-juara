// Build Tailwind statis (offline) — tema "Aegis Command" dari desain Stitch.
// Jalankan dari root proyek:
//   npx tailwindcss@3 -c tools/tailwind/tailwind.config.js -i tools/tailwind/input.css -o app/vendor/tailwind.css --minify
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './app/*.html', './app/js/**/*.js'],
  theme: { extend: {
    colors: { 'surface-container-highest': '#2c344d', 'surface-bright': '#313852', 'on-background': '#dbe1ff', 'tertiary-container': '#ff929a', secondary: '#4edea3', 'on-primary': '#00354a', 'primary-container': '#38bdf8', outline: '#87929a', 'surface-variant': '#2c344d', 'on-primary-container': '#004965', 'surface-container-low': '#131a33', 'on-surface-variant': '#bdc8d1', 'surface-dim': '#0a122a', primary: '#8ed5ff', surface: '#0a122a', 'on-surface': '#dbe1ff', tertiary: '#ffbcbf', 'secondary-container': '#00a572', 'surface-container-high': '#212942', 'surface-container-lowest': '#050d25', error: '#ffb4ab', 'outline-variant': '#3e484f', 'error-container': '#93000a', 'surface-container': '#171e37', background: '#0a122a' },
    fontFamily: { 'label-md': ['JetBrains Mono'], 'body-md': ['Inter'], 'body-sm': ['Inter'], 'display-lg': ['Plus Jakarta Sans'], 'label-lg': ['JetBrains Mono'], 'body-lg': ['Inter'], 'headline-sm': ['Plus Jakarta Sans'], 'headline-md': ['Plus Jakarta Sans'], 'headline-lg': ['Plus Jakarta Sans'], 'label-sm': ['JetBrains Mono'] },
    fontSize: { 'label-md': ['11px', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: '500' }], 'body-md': ['14px', { lineHeight: '20px' }], 'body-sm': ['12px', { lineHeight: '18px' }], 'display-lg': ['34px', { lineHeight: '42px', letterSpacing: '-0.02em', fontWeight: '700' }], 'label-lg': ['13px', { lineHeight: '18px', letterSpacing: '0.02em', fontWeight: '500' }], 'body-lg': ['16px', { lineHeight: '24px' }], 'headline-sm': ['16px', { lineHeight: '24px', fontWeight: '600' }], 'headline-md': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }], 'headline-lg': ['28px', { lineHeight: '36px', letterSpacing: '-0.015em', fontWeight: '600' }], 'label-sm': ['10px', { lineHeight: '14px', letterSpacing: '0.06em', fontWeight: '600' }] },
  } },
};
