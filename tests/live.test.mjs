// Demo berjalan Command Center (app/js/command-center/live.js): tiket baru muncul, tiket lama bergerak sampai selesai.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const FILES = ['app/js/command-center/sop-data.js', 'app/js/command-center/data.js', 'app/js/command-center/store.js', 'app/js/command-center/live.js'];

function load(seed = 1) {
  const m = new Map();
  let r = seed; // acak yang bisa diulang
  const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  const ctx = {
    localStorage: { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) },
    document: { hidden: false, activeElement: null, querySelector: () => null, addEventListener() {} },
    setTimeout: () => 0, clearTimeout() {}, console,
    Math: Object.assign(Object.create(Math), { random: rnd }),
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of FILES) vm.runInContext(read(f), ctx, { filename: f });
  return ctx;
}

const active = (S) => S.s.tickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED');

test('live: satu langkah membuat tiket baru di urutan teratas atau memajukan tiket aktif', () => {
  const w = load();
  const before = JSON.stringify(w.Store.s.tickets.map((t) => [t.id, t.status, t.log.length]));
  const r = w.Live.step();
  assert.ok(['baru', 'maju', 'catat', 'chat'].includes(r.kind), 'jenis langkah: ' + r.kind);
  assert.notEqual(JSON.stringify(w.Store.s.tickets.map((t) => [t.id, t.status, t.log.length])) + w.Store.s.chats.length, before + 3);
});

test('live: setelah banyak langkah ada tiket baru, ada yang selesai, dan masih ada yang aktif', () => {
  const w = load(7);
  const ids0 = new Set(w.Store.s.tickets.map((t) => t.id));
  const closed0 = w.Store.s.tickets.filter((t) => t.status === 'CLOSED').length;
  const kinds = new Set();
  for (let i = 0; i < 120; i++) kinds.add(w.Live.step().kind);
  const T = w.Store.s.tickets;
  assert.ok(kinds.has('baru') && kinds.has('maju'), [...kinds].join(','));
  assert.ok(T.some((t) => !ids0.has(t.id)), 'ada tiket baru');
  assert.equal(T[0].id, T.map((t) => t.id).sort().reverse()[0], 'tiket terbaru di urutan pertama');
  assert.ok(T.filter((t) => t.status === 'CLOSED').length > closed0, 'ada yang selesai');
  const a = active(w.Store).length;
  assert.ok(a >= 6 && a <= 18, 'tiket aktif tetap wajar: ' + a);
  assert.ok(T.length <= 60, 'jumlah tiket dibatasi: ' + T.length);
  assert.ok(!T.some((t) => !ids0.has(t.id) && t.priority === 'P1'), 'demo tidak membuat P1 (memicu eskalasi otomatis)');
});

test('live: teks tiket dan log tanpa tanda pisah panjang', () => {
  const w = load(3);
  for (let i = 0; i < 150; i++) w.Live.step();
  const txt = w.Store.s.tickets.flatMap((t) => [t.title, t.desc].concat(t.log.map((l) => l.text))).join('\n') + w.Store.s.chats.map((c) => c.text).join('\n');
  assert.ok(!/[—–]/.test(txt), 'ada em/en dash');
});

test('live: berhenti saat dijeda, saat simulasi use case berjalan, dan saat operator mengetik', () => {
  const w = load();
  w.Store.setting('live', false);
  assert.equal(w.Live.step().kind, 'jeda');
  w.Store.setting('live', true);
  w.Store.setSim({ uc: 'UC-01' });
  assert.equal(w.Live.step().kind, 'jeda');
  w.Store.setSim(null);
  w.document.activeElement = { tagName: 'INPUT' };
  assert.equal(w.Live.step().kind, 'jeda');
});
