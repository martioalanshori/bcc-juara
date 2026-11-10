/* Satu-satunya tabel rute & peran aplikasi. Dipakai server/app.js (LAN maupun Vercel).
 * Menambah halaman baru: tambahkan ke PAGES; halaman berperan otomatis dilindungi PIN. */

// Peran PIN. home = tujuan default setelah login. env = variabel PIN (opsional, menimpa data/access.json).
const ROLES = {
  pengelola: { label: 'Konsol Pengelola Acara', home: '/pengelola', env: 'PIN_PENGELOLA' },
  'command-center': { label: 'Command Center · Mall 360', home: '/command-center', env: 'PIN_COMMAND_CENTER' },
};

// URL bersih -> file halaman. spa: sub-path (mis. /pengunjung/e/EVT-01) tetap menyajikan halaman yang sama,
// router di browser (app/js/router.js) yang memilih layar.
const PAGES = {
  '/': { file: 'index.html' },
  '/pengunjung': { file: 'app/pengunjung.html', spa: true },
  '/pengelola': { file: 'app/pengelola.html', role: 'pengelola' },
  '/checkin': { file: 'app/checkin.html', role: 'pengelola' },
  '/command-center': { file: 'app/index.html', role: 'command-center', spa: true },
  '/masuk': { file: 'app/masuk.html' },
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
const STATIC_DIRS = ['/app/', '/docs/'];

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

module.exports = { ROLES, PAGES, LEGACY, STATIC_DIRS, SESSION_TTL, MAX_FAIL, LOCK_SEC, pageFor };
