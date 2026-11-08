/* Pemeriksaan tulis state Event Ticketing di server (padanan Python: guard() di server.py).
 * Aturan bisnis tetap dijalankan engine di browser; server hanya memastikan perubahan yang butuh
 * peran tertentu datang dari sesi peran itu. Kasus uji bersama: tools/tests/guard_cases.json.
 *   - pengelola: boleh semua (acara, refund, check-in, reset).
 *   - command-center: seperti tanpa login, ditambah laporan gate (klaim & tautan tiket insiden).
 *   - tanpa login (pengunjung): hold kursi, pesanan baru, bayar/batal/kedaluwarsa pesanan PENDING,
 *     daftar tunggu, outbox. Tidak boleh mengubah acara, e-ticket yang sudah ada, pindaian, pesanan
 *     non-PENDING, atau kursi terjual.
 * Mengembalikan null bila boleh, atau pesan penolakan. File berawalan _ tidak menjadi route Vercel. */
function same(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && same(a[k], b[k]));
}
const obj = (x) => (x && typeof x === 'object' ? x : {});
const OPEN = ['PENDING', 'PAID', 'CANCELLED', 'EXPIRED'];

function guard(old, next, roles) {
  roles = roles || [];
  if (roles.includes('pengelola')) return null;
  if (next == null) return 'Reset data hanya untuk pengelola.';
  if (old == null) return next.v === 1 ? null : 'State awal tidak valid.';
  if (!same(old.events, next.events) || !same(old.order, next.order)) return 'Perubahan data acara hanya untuk pengelola.';
  if (!same(old.scans, next.scans)) return 'Check-in hanya dari halaman Check-in (login pengelola).';
  if (!roles.includes('command-center') && !same(old.reports, next.reports)) return 'Laporan gate hanya dari Command Center atau petugas gate.';
  const ot = obj(old.tickets), nt = obj(next.tickets);
  for (const id of Object.keys(ot)) if (!same(ot[id], nt[id])) return 'Perubahan e-ticket hanya untuk pengelola.';
  for (const id of Object.keys(nt)) if (!(id in ot) && (nt[id].status !== 'ACTIVE' || nt[id].checkedInAt)) return 'E-ticket baru harus aktif dan belum check-in.';
  const oo = obj(old.orders), no = obj(next.orders);
  for (const id of Object.keys(oo)) {
    const a = oo[id], b = no[id];
    if (!b) return 'Pesanan tidak boleh dihapus.';
    if (a.status !== 'PENDING' ? !same(a, b) : !OPEN.includes(b.status)) return 'Refund dan perubahan pesanan lunas hanya untuk pengelola.';
  }
  for (const id of Object.keys(no)) if (!(id in oo) && !['PENDING', 'PAID'].includes(no[id].status)) return 'Pesanan baru harus menunggu pembayaran atau lunas.';
  const os = obj(old.seats), ns = obj(next.seats);
  for (const ev of new Set(Object.keys(os).concat(Object.keys(ns)))) {
    const a = obj(os[ev]), b = obj(ns[ev]);
    for (const sid of new Set(Object.keys(a).concat(Object.keys(b)))) {
      const x = a[sid], y = b[sid];
      if (x && x.st === 'SOLD' && !same(x, y)) return 'Kursi terjual hanya bisa dilepas pengelola (refund).';
      if (y && y.st === 'SOLD' && !same(x, y) && !(no[y.order] && no[y.order].status === 'PAID')) return 'Kursi hanya terjual lewat pesanan yang lunas.';
    }
  }
  return null;
}

module.exports = { guard, same };
