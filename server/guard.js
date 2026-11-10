/* Pemeriksaan tulis state Event Ticketing di server (dipakai server/app.js, baik LAN maupun Vercel).
 * Aturan bisnis tetap dijalankan engine di browser; server hanya memastikan perubahan yang butuh
 * peran tertentu datang dari sesi peran itu, dan bentuk data tidak dirusak. Kasus uji:
 * tools/tests/guard_cases.json.
 *   - pengelola: boleh semua (acara, refund, check-in, reset).
 *   - command-center: seperti tanpa login, ditambah laporan gate (klaim & tautan tiket insiden).
 *   - tanpa login (pengunjung): hold kursi, pesanan baru, bayar/batal/kedaluwarsa pesanan PENDING,
 *     daftar tunggu, outbox. Tidak boleh mengubah acara, versi skema, e-ticket yang sudah ada,
 *     pindaian, pesanan non-PENDING, atau kursi terjual. Kursi SOLD dan e-ticket baru hanya boleh
 *     untuk pesanan yang baru lunas di penulisan ini. Hold berlaku paling lama HOLD_MAX ke depan.
 * Mengembalikan null bila boleh, atau pesan penolakan. */
const HOLD_MAX = 60 * 60000;
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
function same(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => own(b, k) && same(a[k], b[k]));
}
const OPEN = ['PENDING', 'PAID', 'CANCELLED', 'EXPIRED'];
const ARRS = ['order', 'scans', 'outbox', 'waitlist', 'reports'], OBJS = ['events', 'seats', 'qholds', 'orders', 'tickets'];
const okUntil = (u, lim) => typeof u === 'number' && u <= lim;

function guard(old, next, roles, now) {
  roles = roles || [];
  if (roles.includes('pengelola')) return null;
  if (next == null) return 'Reset data hanya untuk pengelola.';
  if (!isObj(next) || next.v !== 1) return 'Format data tidak valid.';
  if (old == null) return null; // seed awal setelah reset
  const lim = (now || Date.now()) + HOLD_MAX;
  if (old.v !== next.v || old.seededAt !== next.seededAt) return 'Versi data contoh hanya diubah pengelola (reset).';
  if (ARRS.some((k) => !Array.isArray(next[k])) || OBJS.some((k) => !isObj(next[k]))) return 'Format data tidak valid.';
  if (!same(old.events, next.events) || !same(old.order, next.order)) return 'Perubahan data acara hanya untuk pengelola.';
  if (!same(old.scans, next.scans)) return 'Check-in hanya dari halaman Check-in (login pengelola).';
  if (!roles.includes('command-center') && !same(old.reports, next.reports)) return 'Laporan gate hanya dari Command Center atau petugas gate.';
  const oo = isObj(old.orders) ? old.orders : {}, no = next.orders;
  const ot = isObj(old.tickets) ? old.tickets : {}, nt = next.tickets;
  // pesanan yang lunas di penulisan ini (sebelumnya PENDING atau belum ada)
  const fresh = (id) => typeof id === 'string' && own(no, id) && isObj(no[id]) && no[id].status === 'PAID' && (!own(oo, id) || oo[id].status === 'PENDING');
  for (const id of Object.keys(oo)) {
    const a = oo[id], b = no[id];
    if (!own(no, id) || !isObj(b)) return 'Pesanan tidak boleh dihapus.';
    if (a.status !== 'PENDING' ? !same(a, b) : !OPEN.includes(b.status)) return 'Refund dan perubahan pesanan lunas hanya untuk pengelola.';
  }
  for (const id of Object.keys(no)) {
    const b = no[id];
    if (!isObj(b)) return 'Format pesanan tidak valid.';
    if (own(oo, id) && same(oo[id], b)) continue;
    if (!own(oo, id) && !['PENDING', 'PAID'].includes(b.status)) return 'Pesanan baru harus menunggu pembayaran atau lunas.';
    if (!Array.isArray(b.items) || !Array.isArray(b.tickets) || !Array.isArray(b.log)) return 'Format pesanan tidak valid.';
    if (b.status === 'PENDING' && !okUntil(b.until, lim)) return 'Batas waktu pembayaran tidak valid.';
  }
  for (const id of Object.keys(ot)) if (!same(ot[id], nt[id]) || !own(nt, id)) return 'Perubahan e-ticket hanya untuk pengelola.';
  for (const id of Object.keys(nt)) {
    if (own(ot, id)) continue;
    const x = nt[id];
    if (!isObj(x) || x.status !== 'ACTIVE' || x.checkedInAt) return 'E-ticket baru harus aktif dan belum check-in.';
    if (!fresh(x.order) || !no[x.order].tickets.includes(id)) return 'E-ticket hanya terbit untuk pesanan yang baru lunas.';
  }
  const os = isObj(old.seats) ? old.seats : {}, ns = next.seats;
  for (const ev of new Set(Object.keys(os).concat(Object.keys(ns)))) {
    const a = isObj(os[ev]) ? os[ev] : {}, b = ns[ev];
    if (own(ns, ev) && !isObj(b)) return 'Format kursi tidak valid.';
    const bb = isObj(b) ? b : {};
    for (const sid of new Set(Object.keys(a).concat(Object.keys(bb)))) {
      const x = own(a, sid) ? a[sid] : undefined, y = own(bb, sid) ? bb[sid] : undefined;
      if (same(x, y)) continue;
      if (x && x.st === 'SOLD') return 'Kursi terjual hanya bisa dilepas pengelola (refund).';
      if (y === undefined) continue;
      if (!isObj(y)) return 'Format kursi tidak valid.';
      if (y.st === 'SOLD') { if (!fresh(y.order) || !no[y.order].items.some((it) => it && it.seat === sid)) return 'Kursi hanya terjual lewat pesanan yang lunas.'; }
      else if (y.st === 'HELD') { if (!okUntil(y.until, lim)) return 'Batas waktu hold kursi tidak valid.'; }
      else return 'Status kursi tidak valid.';
    }
  }
  for (const ev of Object.keys(next.qholds)) {
    const q = next.qholds[ev];
    if (!Array.isArray(q) || q.some((h) => !isObj(h) || !okUntil(h.until, lim))) return 'Format hold kuota tidak valid.';
  }
  return null;
}

module.exports = { guard, same, HOLD_MAX };
