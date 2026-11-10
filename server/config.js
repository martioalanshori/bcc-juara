/* Satu-satunya tabel rute, peran & akun staf. Dipakai server/app.js (LAN maupun Vercel).
 * Menambah halaman baru: tambahkan ke PAGES; halaman berperan otomatis dilindungi login. */

// Peran staf. home = tujuan default setelah login.
const ROLES = {
  pengelola: { label: 'Konsol Pengelola Acara', home: '/pengelola' },
  gate: { label: 'Check-in Gate', home: '/checkin' },
  'command-center': { label: 'Command Center · Mall 360', home: '/command-center' },
};

// Akun staf (data contoh, domain example.com). Password sama untuk semua akun: STAFF_PASSWORD bila diisi,
// selain itu DEMO_PASSWORD yang memang ditampilkan di halaman /masuk (prototipe untuk demo juri).
const DEMO_PASSWORD = 'smicc-demo-2026';
const ACCOUNTS = [
  { email: 'pengelola@example.com', role: 'pengelola', name: 'Tim Event Summarecon Mall Bandung' },
  { email: 'gate@example.com', role: 'gate', name: 'Petugas Gate A' },
  { email: 'cc@example.com', role: 'command-center', name: 'Operator Command Center' },
];

// URL bersih -> file halaman (app/pages/). spa: sub-path (mis. /pengunjung/e/EVT-01) tetap menyajikan
// halaman yang sama, router di browser (app/js/core/router.js) yang memilih layar.
const PAGES = {
  '/': { file: 'app/pages/beranda.html' },
  '/pengunjung': { file: 'app/pages/pengunjung.html', spa: true },
  '/pengelola': { file: 'app/pages/pengelola.html', role: 'pengelola', spa: true }, // /pengelola/acara, /pengelola/e/EVT-01/ringkasan
  '/checkin': { file: 'app/pages/checkin.html', role: ['gate', 'pengelola'] }, // petugas gate & pengelola
  '/command-center': { file: 'app/pages/command-center.html', role: 'command-center', spa: true },
  '/masuk': { file: 'app/pages/masuk.html' },
};

// Alamat lama (file .html) -> URL bersih, dialihkan permanen. Rute hash lama (#/...) diubah oleh router.js.
const LEGACY = {
  '/index.html': '/',
  '/app': '/command-center',
  '/app/index.html': '/command-center',
  '/app/pengunjung.html': '/pengunjung',
  '/app/event.html': '/pengunjung',
  '/app/pengelola.html': '/pengelola',
  '/app/checkin.html': '/checkin',
  '/app/masuk.html': '/masuk',
};

// Folder yang boleh disajikan apa adanya (aset). File .html di dalamnya tidak pernah disajikan langsung.
// docs/ hanya subfolder unduhan (Excel & runbook yang ditautkan aplikasi); rencana & sumber tidak.
const STATIC_DIRS = ['/app/', '/docs/unduhan/'];

const SESSION_TTL = 12 * 3600; // detik
const MAX_FAIL = 5;
const LOCK_SEC = 60;

// Halaman untuk sebuah path (mis. '/command-center/sop' -> PAGES['/command-center']).
function pageFor(pathname) {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (PAGES[p]) return { key: p, ...PAGES[p] };
  const top = '/' + p.split('/')[1];
  const pg = PAGES[top];
  return pg && pg.spa ? { key: top, ...pg } : null;
}

// Peran yang boleh membuka halaman (role bisa satu string atau daftar).
const pageRoles = (page) => (page && page.role ? [].concat(page.role) : []);

module.exports = { ROLES, ACCOUNTS, DEMO_PASSWORD, PAGES, LEGACY, STATIC_DIRS, SESSION_TTL, MAX_FAIL, LOCK_SEC, pageFor, pageRoles };
