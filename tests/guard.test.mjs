// Pemeriksaan tulis state di server (server/guard.js), kasus di guard_cases.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { loadEvt } from './harness.mjs';

const require = createRequire(import.meta.url);
const { guard } = require('../server/guard.js');
const C = JSON.parse(readFileSync(new URL('./guard_cases.json', import.meta.url), 'utf8'));
const build = (over, isNull) => (isNull ? null : Object.assign(structuredClone(C.base), structuredClone(over || {})));

for (const c of C.cases) {
  test('guard: ' + c.name, () => {
    const err = guard(build(c.old, c.oldNull), build(c.next, c.nextNull), c.roles, undefined, c.ctx);
    if (c.ok) assert.equal(err, null);
    else assert.ok(typeof err === 'string' && err.length > 0, 'harus ditolak');
  });
}

// Alur nyata dari engine: semua langkah pengunjung lolos tanpa login, aksi pengelola ditolak.
const snap = (Evt) => JSON.parse(JSON.stringify(Evt.s));
async function step(Evt, fn) { const a = snap(Evt); await fn(); return [a, snap(Evt)]; }

test('guard + engine: pengunjung pilih kursi, pesan, bayar, gabung antrean tanpa login', async () => {
  const { Evt } = await loadEvt();
  const seat = Evt.allSeats(Evt.ev('EVT-01')).find((s) => Evt.seatStatus('EVT-01', s, null) === 'available');
  const steps = [];
  steps.push(await step(Evt, () => Evt.holdSeat('EVT-01', seat, 'CART-U')));
  let o;
  steps.push(await step(Evt, async () => { o = await Evt.createOrder('EVT-01', 'CART-U', { name: 'Uji', email: 'u@example.com', phone: '0812' }); }));
  steps.push(await step(Evt, () => Evt.pay(o, 'QRIS', true)));
  steps.push(await step(Evt, () => Evt.joinWaitlist('EVT-01', 'VIP', { name: 'W', contact: 'w@example.com', qty: 1 })));
  for (const [a, b] of steps) assert.equal(guard(a, b, []), null);
});

test('guard + engine: pesanan gratis (EVT-02) tanpa login', async () => {
  const { Evt } = await loadEvt();
  const seat = Evt.allSeats(Evt.ev('EVT-02')).find((s) => Evt.seatStatus('EVT-02', s, null) === 'available' && Evt.typeById(Evt.ev('EVT-02'), Evt.seatType(Evt.ev('EVT-02'), s)).onSale);
  const [a0, b0] = await step(Evt, () => Evt.holdSeat('EVT-02', seat, 'CART-G'));
  assert.equal(guard(a0, b0, []), null);
  let o;
  const [a, b] = await step(Evt, async () => { o = await Evt.createOrder('EVT-02', 'CART-G', { name: 'Uji', email: 'u@example.com', phone: '0812' }); });
  assert.equal(guard(a, b, []), null);
  assert.equal(Evt.s.orders[o].status, 'PAID'); // registrasi gratis langsung terbit dalam transaksi yang sama
});

test('guard + engine: refund, check-in dan batal acara butuh login pengelola', async () => {
  const { Evt } = await loadEvt();
  const paid = Object.values(Evt.s.orders).find((x) => x.ev === 'EVT-01' && x.status === 'PAID' && !x.tickets.some((t) => Evt.s.tickets[t].checkedInAt));
  const [a, b] = await step(Evt, () => Evt.refund(paid.id, 'uji'));
  assert.notEqual(guard(a, b, []), null);
  assert.equal(guard(a, b, ['pengelola']), null);
  const tk = Object.values(Evt.s.tickets).find((x) => x.ev === 'EVT-01' && x.status === 'ACTIVE' && !x.checkedInAt);
  const [c, d] = await step(Evt, () => Evt.checkIn(Evt.qrText(tk), 'EVT-01', 'Gate A (Lobby Utama)'));
  assert.notEqual(guard(c, d, ['command-center']), null);
  const [e, f] = await step(Evt, () => Evt.cancelEvent('EVT-03', 'uji'));
  assert.notEqual(guard(e, f, []), null);
});

test('guard + engine: Command Center mengklaim anomali dan menautkan tiket', async () => {
  const { Evt } = await loadEvt();
  for (let i = 0; i < 3; i++) await Evt.checkIn('QR-PALSU', 'EVT-01', 'Gate B (Sisi Food Court)');
  let id;
  const [a, b] = await step(Evt, async () => { id = await Evt.claimAnomaly('EVT-01', 'Gate B (Sisi Food Court)', 'CC-1'); });
  assert.equal(guard(a, b, ['command-center']), null);
  assert.notEqual(guard(a, b, []), null);
  const [c, d] = await step(Evt, () => Evt.linkReport(id, 'TCK-1'));
  assert.equal(guard(c, d, ['command-center']), null);
});

// Engine dalam mode server dengan fetch palsu yang memakai guard asli (seperti server/app.js tanpa login).
function fakeServer(roles) {
  const db = { version: 0, state: null }; let posts = 0;
  const res = (code, obj) => ({ ok: code === 200, status: code, json: async () => obj });
  const fetch = async (url, init) => {
    const u = String(url);
    if (u.startsWith('/api/health')) return res(200, { ok: true, now: Date.now() });
    if (u.startsWith('/api/evt/state') && (!init || init.method !== 'POST')) return res(200, { version: db.version, state: db.state, now: Date.now() });
    if (u.startsWith('/api/evt/state')) {
      posts++;
      const b = JSON.parse(init.body);
      if (b.base !== db.version) return res(409, { ok: false, version: db.version, state: db.state, now: Date.now() });
      const err = guard(db.state, b.state, roles);
      if (err) return res(403, { ok: false, error: err });
      db.version++; db.state = b.state; return res(200, { ok: true, version: db.version, now: Date.now() });
    }
    return res(404, { ok: false });
  };
  return { fetch, db, posts: () => posts };
}

test('mode server tanpa login: refund ditolak 403 dengan pesan jelas, tidak diulang', async () => {
  const srv = fakeServer([]);
  const { Evt } = await loadEvt({ globals: { location: { protocol: 'http:' }, fetch: srv.fetch, AbortController } });
  assert.equal(Evt.mode, 'server');
  const paid = Object.values(Evt.s.orders).find((x) => x.status === 'PAID');
  const n = srv.posts();
  await assert.rejects(Evt.refund(paid.id, 'uji'), /pengelola/);
  assert.equal(srv.posts() - n, 1);
  assert.equal(srv.db.state.orders[paid.id].status, 'PAID');
});

// Alur persetujuan nyata dari engine: tiap langkah lolos guard dengan peran yang benar dan ditolak peran yang salah.
test('guard + engine: tenant ajukan, divisi-event dan divisi-ops memutuskan, tenant publikasi', async () => {
  const { Evt, clock } = await loadEvt();
  const ORG = 'Komunitas UMKM Gedebage', T = { org: ORG };
  const id = await Evt.addEvent({ name: 'Expo Alur', template: 'HALL', start: clock.now + 30 * 86400000 });
  await Evt.updateEvent(id, { org: ORG }); // persiapan (pengelola), bukan langkah yang diuji
  const as = (who) => Evt.setActor(who);
  const check = ([a, b], okRoles, okCtx, badRoles) => {
    assert.equal(guard(a, b, okRoles, undefined, okCtx), null, 'harus lolos untuk ' + okRoles);
    assert.ok(typeof guard(a, b, badRoles, undefined, T) === 'string', 'harus ditolak untuk ' + badRoles);
  };
  as({ name: 'Sari', role: 'Tenant/EO', org: ORG });
  for (const d of Evt.DOCS.filter((x) => x.req)) check(await step(Evt, () => Evt.uploadDoc(id, d.id, { name: d.id + '.pdf', size: 10 })), ['tenant'], T, ['divisi-event']);
  check(await step(Evt, () => Evt.submitApproval(id)), ['tenant'], T, ['command-center']);
  as({ name: 'Andi', role: 'Divisi Event', div: 'event' });
  check(await step(Evt, () => Evt.decide(id, 'event', true)), ['divisi-event'], null, ['divisi-ops']);
  as({ name: 'Rudi', role: 'Operasional Mall', div: 'ops' });
  check(await step(Evt, () => Evt.decide(id, 'ops', true, 'Parkir aman')), ['divisi-ops'], null, ['tenant']);
  as({ name: 'Sari', role: 'Tenant/EO', org: ORG });
  check(await step(Evt, () => Evt.updateEvent(id, { status: 'PUBLISHED' })), ['tenant'], T, ['divisi-ops']);
});

// Review akhir: tenant tidak boleh lolos persetujuan lewat status lain, menyisipkan markup, atau mengubah jadwal yang ditinjau.
async function tenantDraft() {
  const { Evt, clock } = await loadEvt();
  const ORG = 'Komunitas UMKM Gedebage', T = { org: ORG };
  const id = await Evt.addEvent({ name: 'Expo Uji', template: 'HALL', start: clock.now + 30 * 86400000 });
  await Evt.updateEvent(id, { org: ORG });
  Evt.setActor({ name: 'Sari', role: 'Tenant/EO', org: ORG });
  return { Evt, clock, ORG, T, id };
}
const mut = (s, id, fn) => { const n = structuredClone(s); fn(n.events[id], n); return n; };

test('guard: tenant tidak bisa publikasi tanpa persetujuan lewat CLOSED atau CANCELLED', async () => {
  const { Evt, T, id } = await tenantDraft();
  const s0 = snap(Evt);
  for (const st of ['CLOSED', 'PUBLISHED', 'CANCELLED']) {
    const n = mut(s0, id, (e) => (e.status = st));
    if (st === 'CANCELLED') assert.equal(guard(s0, n, ['tenant'], undefined, T), null, 'membatalkan draft sendiri boleh');
    else assert.ok(typeof guard(s0, n, ['tenant'], undefined, T) === 'string', 'DRAFT → ' + st + ' harus ditolak');
  }
  const closed = mut(s0, id, (e) => (e.status = 'CLOSED')), cancelled = mut(s0, id, (e) => (e.status = 'CANCELLED'));
  assert.ok(typeof guard(closed, mut(closed, id, (e) => (e.status = 'PUBLISHED')), ['tenant'], undefined, T) === 'string', 'CLOSED → PUBLISHED tanpa persetujuan');
  assert.ok(typeof guard(cancelled, mut(cancelled, id, (e) => (e.status = 'PUBLISHED')), ['tenant'], undefined, T) === 'string', 'CANCELLED → PUBLISHED');
  assert.ok(typeof guard(cancelled, mut(cancelled, id, (e) => (e.status = 'DRAFT')), ['tenant'], undefined, T) === 'string', 'CANCELLED → DRAFT');
});

test('engine: acara belum disetujui tidak bisa dibuka lewat CLOSED, acara batal tidak bisa diaktifkan', async () => {
  const { Evt, id } = await tenantDraft();
  await assert.rejects(Evt.updateEvent(id, { status: 'CLOSED' }), /disetujui/);
  await Evt.cancelEvent(id, 'uji');
  await assert.rejects(Evt.updateEvent(id, { status: 'PUBLISHED' }), /dibatalkan/);
});

test('guard: tenant tidak bisa menyisipkan markup lewat warna, id, atau teks acara', async () => {
  const { Evt, T, id } = await tenantDraft();
  const s0 = snap(Evt);
  assert.ok(typeof guard(s0, mut(s0, id, (e) => (e.color = 'red"><img src=x onerror=alert(1)>')), ['tenant'], undefined, T) === 'string', 'warna');
  assert.ok(typeof guard(s0, mut(s0, id, (e) => (e.name = '<img src=x onerror=alert(1)>')), ['tenant'], undefined, T) === 'string', 'nama');
  assert.equal(guard(s0, mut(s0, id, (e) => (e.color = '#22c55e')), ['tenant'], undefined, T), null, 'warna hex boleh');
  const bad = 'EVT-9"><b>';
  const n = mut(s0, id, (e, all) => { all.events[bad] = Object.assign(structuredClone(e), { id: bad, audit: [] }); all.order.push(bad); });
  assert.ok(typeof guard(s0, n, ['tenant'], undefined, T) === 'string', 'id acara baru');
});

test('guard + engine: jadwal dan area dikunci selama ditinjau dan setelah disetujui untuk tenant', async () => {
  const { Evt, T, id } = await tenantDraft();
  for (const d of Evt.DOCS.filter((x) => x.req)) await Evt.uploadDoc(id, d.id, { name: d.id + '.pdf', size: 10 });
  await Evt.submitApproval(id);
  const s0 = snap(Evt), e0 = s0.events[id];
  assert.ok(typeof guard(s0, mut(s0, id, (e) => (e.start += 86400000)), ['tenant'], undefined, T) === 'string', 'jadwal saat DIAJUKAN');
  assert.ok(typeof guard(s0, mut(s0, id, (e) => (e.area = e.area === 'ciunik' ? 'cibadag' : 'ciunik')), ['tenant'], undefined, T) === 'string', 'area saat DIAJUKAN');
  assert.ok(typeof guard(s0, mut(s0, id, (e) => (e.approval.docs.proposal.name = 'lain.pdf')), ['tenant'], undefined, T) === 'string', 'dokumen saat DIAJUKAN');
  assert.equal(guard(s0, mut(s0, id, (e) => (e.tagline = 'Tagline baru')), ['tenant'], undefined, T), null, 'teks lain boleh');
  await assert.rejects(Evt.saveEvent(id, { patch: { start: e0.start + 86400000, end: (e0.end || e0.start) + 86400000 } }), /dikunci|ditinjau/);
  // Simpan Pengaturan tanpa mengubah jadwal (nilai dari input menit, tanpa detik) tetap boleh.
  await Evt.saveEvent(id, { patch: { tagline: 'Baru', start: Math.floor(e0.start / 60000) * 60000 } });
  assert.equal(Evt.ev(id).start, e0.start);
});
