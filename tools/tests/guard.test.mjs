// Pemeriksaan tulis state di server (api/_guard.js). Kasus bersama dengan test_guard.py (server.py).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { loadEvt } from './harness.mjs';

const require = createRequire(import.meta.url);
const { guard } = require('../../api/_guard.js');
const C = JSON.parse(readFileSync(new URL('./guard_cases.json', import.meta.url), 'utf8'));
const build = (over, isNull) => (isNull ? null : Object.assign(structuredClone(C.base), structuredClone(over || {})));

for (const c of C.cases) {
  test('guard: ' + c.name, () => {
    const err = guard(build(c.old, c.oldNull), build(c.next, c.nextNull), c.roles);
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

// Engine dalam mode server dengan fetch palsu yang memakai guard asli (seperti server.py/api tanpa login).
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
