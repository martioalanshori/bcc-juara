/* Pemeriksaan tulis state Event Ticketing di server (dipakai server/app.js, baik LAN maupun Vercel).
 * Aturan bisnis tetap dijalankan engine di browser; server hanya memastikan perubahan yang butuh
 * peran tertentu datang dari sesi peran itu, dan bentuk data tidak dirusak. Kasus uji:
 * tests/guard_cases.json.
 *   - pengelola: boleh semua (acara, refund, check-in, reset).
 *   - gate (petugas gate): seperti tanpa login, ditambah pindaian, check-in e-ticket (hanya checkedInAt & gate)
 *     dan laporan gate.
 *   - command-center: seperti tanpa login, ditambah laporan gate (klaim & tautan tiket insiden).
 *   - tenant: seperti tanpa login, ditambah acara milik org-nya sendiri (ctx.org): buat (draft), ubah, ajukan,
 *     publikasi setelah disetujui. Tidak boleh memutuskan persetujuan, menghapus data persetujuan, atau log.
 *   - divisi-event / divisi-ops: seperti tanpa login, ditambah keputusan persetujuan pada gilirannya saja
 *     (hanya approval & audit acara yang berubah; log hanya ditambah).
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
const STEPS = ['event', 'ops']; // urutan persetujuan: Divisi Event lalu Operasional Mall
const DIV = { 'divisi-event': 'event', 'divisi-ops': 'ops' };
// Tulisan tenant tampil di konsol Tim Event Mall dan portal pengunjung: tolak markup di semua teks (kecuali log,
// yang selalu di-escape), warna harus hex, id acara baru harus EVT-angka.
const HEX = /^#[0-9a-f]{3,8}$/i, EVID = /^EVT-\d{1,6}$/;
function markup(x, k) {
  if (k === 'audit') return false;
  if (typeof x === 'string') return /[<>"]/.test(x);
  if (x && typeof x === 'object') return Object.keys(x).some((j) => markup(x[j], j));
  return false;
}
const LOCK = ['area', 'start', 'end', 'doors']; // jadwal & area yang diperiksa divisi
// Log aktivitas acara hanya boleh ditambah: entri lama harus tetap sama dan berurutan.
function appendOnly(a, b) {
  const o = (a && Array.isArray(a.audit) && a.audit) || [], n = (b && b.audit) || [];
  if (!Array.isArray(n) || n.length < o.length || !o.every((x, i) => same(x, n[i]))) return 'Log aktivitas acara hanya boleh ditambah.';
  return null;
}
// Perubahan events/order untuk peran selain pengelola. null = boleh.
function eventsGuard(old, next, roles, ctx) {
  const oe = isObj(old.events) ? old.events : {}, ne = next.events;
  const changed = Array.from(new Set(Object.keys(oe).concat(Object.keys(ne)))).filter((id) => !same(oe[id], ne[id]));
  const orderSame = same(old.order, next.order);
  if (!changed.length && orderSame) return null;
  // Satu browser bisa punya sesi beberapa portal sekaligus (mis. tenant di /pengelola + divisi di /command-center).
  // Perubahan boleh bila salah satu peran yang aktif mengizinkannya; bila semua menolak, pesan pertama dipakai.
  const rules = [];
  if (roles.includes('tenant') && ctx && ctx.org) rules.push(() => tenantRule(old, next, oe, ne, changed, orderSame, ctx));
  roles.map((r) => DIV[r]).filter(Boolean).forEach((div) => rules.push(() => divRule(oe, ne, changed, orderSame, div)));
  if (!rules.length) return 'Perubahan data acara hanya untuk pengelola.';
  let first = null;
  for (const rule of rules) { const err = rule(); if (!err) return null; if (!first) first = err; }
  return first;
}
function tenantRule(old, next, oe, ne, changed, orderSame, ctx) {
  {
    const mine = (e) => isObj(e) && e.org === ctx.org;
    if (!orderSame) {
      const o = new Set(old.order || []), n = new Set(next.order || []);
      const moved = Array.from(new Set([...o, ...n])).filter((id) => o.has(id) !== n.has(id));
      if (moved.some((id) => !mine(oe[id]) && !mine(ne[id]))) return 'Acara ini milik penyelenggara lain.';
      if ((old.order || []).filter((id) => n.has(id)).join() !== (next.order || []).filter((id) => o.has(id)).join()) return 'Urutan acara hanya diubah pengelola.';
    }
    for (const id of changed) {
      const a = oe[id], b = ne[id];
      if ((a && !mine(a)) || (b !== undefined && !mine(b))) return 'Acara ini milik penyelenggara lain.';
      if (!b) continue; // hapus acara sendiri (pesanan dijaga aturan pesanan di bawah)
      const e = appendOnly(a, b); if (e) return e;
      const p0 = a && a.approval, p1 = b.approval;
      if (!isObj(p1)) return 'Data persetujuan acara tidak boleh dihapus.';
      if (!a && b.status !== 'DRAFT') return 'Acara baru dibuat sebagai draft.';
      if (!a && (!EVID.test(id) || b.id !== id)) return 'ID acara tidak valid.';
      if (b.color !== undefined && !HEX.test(String(b.color))) return 'Warna acara tidak valid.';
      if (markup(b)) return 'Teks acara tidak boleh memuat tanda < > atau ".';
      if (a && a.status === 'CANCELLED' && b.status !== 'CANCELLED') return 'Acara yang dibatalkan tidak bisa diaktifkan lagi.';
      if (p0 && ['DIAJUKAN', 'DISETUJUI'].includes(p0.st)) {
        if (LOCK.some((k) => !same(a[k], b[k]))) return 'Jadwal dan area dikunci selama ditinjau dan setelah disetujui. Hubungi Tim Event Mall.';
        if (!same(p0, p1)) return 'Data pengajuan terkunci selama ditinjau.';
      }
      if (['DISETUJUI', 'REVISI'].includes(p1.st) && !(p0 && p0.st === p1.st)) return 'Keputusan persetujuan hanya dari Command Center.';
      for (const k of Object.keys(p1.steps || {})) {
        const s1 = p1.steps[k], s0 = p0 && p0.steps && p0.steps[k];
        if (isObj(s1) && ['SETUJU', 'REVISI'].includes(s1.st) && !same(s0, s1)) return 'Keputusan persetujuan hanya dari Command Center.';
      }
      if (['PUBLISHED', 'CLOSED'].includes(b.status) && !(a && a.status === b.status) && !(p0 && p0.st === 'DISETUJUI')) return 'Acara belum disetujui Divisi Event dan Operasional Mall.';
    }
    return null;
  }
}
function divRule(oe, ne, changed, orderSame, div) {
  {
    if (!orderSame) return 'Perubahan data acara hanya untuk penyelenggara.';
    const strip = (e) => { const c = Object.assign({}, e); delete c.approval; delete c.audit; return c; };
    const rest = (p) => { const c = Object.assign({}, p); delete c.steps; delete c.st; delete c.approvedAt; return c; };
    for (const id of changed) {
      const a = oe[id], b = ne[id];
      if (!isObj(a) || !isObj(b)) return 'Acara tidak boleh ditambah atau dihapus dari Command Center.';
      if (!same(strip(a), strip(b))) return 'Divisi hanya boleh mengubah keputusan persetujuan.';
      const e = appendOnly(a, b); if (e) return e;
      const p0 = isObj(a.approval) ? a.approval : {}, p1 = isObj(b.approval) ? b.approval : {};
      if (same(p0, p1)) continue; // hanya log yang bertambah
      if (p0.st !== 'DIAJUKAN') return 'Tidak ada pengajuan yang menunggu keputusan.';
      if (!same(rest(p0), rest(p1))) return 'Data pengajuan dan dokumen hanya diubah penyelenggara.';
      const s0 = (p0.steps || {})[div] || {}, s1 = (p1.steps || {})[div] || {};
      if (STEPS.slice(0, STEPS.indexOf(div)).some((k) => !((p0.steps || {})[k] && p0.steps[k].st === 'SETUJU'))) return 'Keputusan ini giliran Divisi Event.';
      if (s0.st !== 'MENUNGGU' || !['SETUJU', 'REVISI'].includes(s1.st)) return 'Keputusan ini bukan giliran divisi Anda.';
      for (const k of STEPS.filter((x) => x !== div)) {
        const o = (p0.steps || {})[k], n = (p1.steps || {})[k];
        const activate = div === 'event' && k === 'ops' && s1.st === 'SETUJU' && isObj(o) && o.st === 'ANTRE' && isObj(n) && n.st === 'MENUNGGU';
        if (!same(o, n) && !activate) return 'Langkah divisi lain tidak boleh diubah.';
      }
      const last = div === STEPS[STEPS.length - 1];
      const want = s1.st === 'REVISI' ? 'REVISI' : last ? 'DISETUJUI' : 'DIAJUKAN';
      if (p1.st !== want) return 'Status persetujuan tidak sesuai keputusan.';
    }
    return null;
  }
}

function guard(old, next, roles, now, ctx) {
  roles = roles || [];
  if (roles.includes('pengelola')) return null;
  if (next == null) return 'Reset data hanya untuk pengelola.';
  if (!isObj(next) || next.v !== 1) return 'Format data tidak valid.';
  if (old == null) return null; // seed awal setelah reset
  const lim = (now || Date.now()) + HOLD_MAX;
  if (old.v !== next.v || old.seededAt !== next.seededAt) return 'Versi data contoh hanya diubah pengelola (reset).';
  if (ARRS.some((k) => !Array.isArray(next[k])) || OBJS.some((k) => !isObj(next[k]))) return 'Format data tidak valid.';
  if (!isObj(next.events) || !Array.isArray(next.order)) return 'Format data tidak valid.';
  const evErr = eventsGuard(old, next, roles, ctx); if (evErr) return evErr;
  const gate = roles.includes('gate');
  if (!gate && !same(old.scans, next.scans)) return 'Check-in hanya dari halaman Check-in (login petugas gate atau pengelola).';
  if (!roles.includes('command-center') && !gate && !same(old.reports, next.reports)) return 'Laporan gate hanya dari Command Center atau petugas gate.';
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
  // Petugas gate hanya boleh mengubah status check-in e-ticket (checkedInAt & gate), termasuk mengembalikan uji 2 gate.
  const checkinOnly = (a, b) => isObj(a) && isObj(b) && same({ ...a, checkedInAt: 0, gate: 0 }, { ...b, checkedInAt: 0, gate: 0 });
  for (const id of Object.keys(ot)) {
    if (own(nt, id) && same(ot[id], nt[id])) continue;
    if (gate && own(nt, id) && checkinOnly(ot[id], nt[id])) continue;
    return 'Perubahan e-ticket hanya untuk pengelola.';
  }
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
