/* Satu-satunya tabel rute, peran & akun staf. Dipakai server/app.js (LAN maupun Vercel).
 * Menambah halaman baru: tambahkan ke PAGES; halaman berperan otomatis dilindungi login. */

// Peran staf. home = tujuan default setelah login. portal = halaman utama peran itu: satu browser hanya punya
// satu identitas per portal (login peran lain di portal yang sama menghapus sesi sebelumnya). Urutan kunci
// menentukan identitas aktif bila cookie lama dua peran se-portal masih ada (peran pertama menang).
const ROLES = {
  pengelola: { label: 'Konsol Pengelola Acara', home: '/pengelola', portal: '/pengelola' },
  tenant: { label: 'Konsol Penyelenggara (Tenant/EO)', home: '/pengelola', portal: '/pengelola' },
  gate: { label: 'Check-in Gate', home: '/checkin', portal: '/checkin' },
  'command-center': { label: 'Command Center · Mall 360', home: '/command-center', portal: '/command-center' },
  'divisi-event': { label: 'Command Center · Divisi Event', home: '/command-center/persetujuan', portal: '/command-center' },
  'divisi-ops': { label: 'Command Center · Operasional Mall', home: '/command-center/persetujuan', portal: '/command-center' },
};

// Akun staf (data contoh, domain example.com). Password sama untuk semua akun: STAFF_PASSWORD bila diisi,
// selain itu DEMO_PASSWORD yang memang ditampilkan di halaman /masuk (prototipe untuk demo juri).
const DEMO_PASSWORD = 'smicc-demo-2026';
// Satu akun demo per peran. org = penyelenggara (acara milik tenant), div = divisi persetujuan.
// label/icon/text/group/step = kartu akun demo di /masuk dan menu "Ganti akun demo" (step = urutan cerita demo).
const ACCOUNTS = [
  { email: 'tenant@example.com', role: 'tenant', name: 'Sari Wulandari', org: 'Komunitas UMKM Gedebage', group: 'Penyelenggara acara', step: 1, label: 'Tenant/EO', icon: 'storefront', text: 'Ajukan dan kelola acara milik sendiri' },
  { email: 'pengelola@example.com', role: 'pengelola', name: 'Tim Event Summarecon Mall Bandung', org: 'Tim Event Summarecon Mall Bandung', group: 'Penyelenggara acara', label: 'Tim Event Mall', icon: 'admin_panel_settings', text: 'Semua acara: jual tiket, peserta, keuangan' },
  { email: 'divisi.event@example.com', role: 'divisi-event', name: 'Andi Firmansyah', div: 'event', group: 'Command Center', step: 2, label: 'Divisi Event', icon: 'approval', text: 'Persetujuan tahap 1: konsep, jadwal, area' },
  { email: 'divisi.ops@example.com', role: 'divisi-ops', name: 'Rudi Hartono', div: 'ops', group: 'Command Center', step: 3, label: 'Operasional Mall', icon: 'engineering', text: 'Persetujuan tahap 2: teknis, keamanan, parkir' },
  { email: 'cc@example.com', role: 'command-center', name: 'Operator Command Center', group: 'Command Center', label: 'Operator', icon: 'hub', text: 'Pantau acara, insiden & operasional mal' },
  { email: 'gate@example.com', role: 'gate', name: 'Petugas Gate A', group: 'Lapangan', label: 'Petugas gate', icon: 'qr_code_scanner', text: 'Pindai e-ticket & lapor kejadian di gate' },
];

// URL bersih -> file halaman (app/pages/). spa: sub-path (mis. /pengunjung/e/EVT-01) tetap menyajikan
// halaman yang sama, router di browser (app/js/core/router.js) yang memilih layar.
const PAGES = {
  '/': { file: 'app/pages/beranda.html' },
  '/pengunjung': { file: 'app/pages/pengunjung.html', spa: true },
  '/pengelola': { file: 'app/pages/pengelola.html', role: ['pengelola', 'tenant'], spa: true }, // /pengelola/acara, /pengelola/e/EVT-01/ringkasan
  '/checkin': { file: 'app/pages/checkin.html', role: ['gate', 'pengelola'] }, // petugas gate & pengelola
  '/command-center': { file: 'app/pages/command-center.html', role: ['command-center', 'divisi-event', 'divisi-ops'], spa: true },
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
