import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEvt } from './harness.mjs';

const freeSeat = (Evt, ev) => Evt.allSeats(Evt.ev(ev)).find((s) => Evt.seatStatus(ev, s, null) === 'available');

// ------------------------------------------------------------------ Task 1: uji tekan
test('uji tekan: 25 pembeli serentak pada 1 kursi, 1 berhasil, 24 ditolak', async () => {
  const { Evt } = await loadEvt();
  const seat = freeSeat(Evt, 'EVT-01');
  const r = await Evt.stressTest('EVT-01', seat, 25);
  assert.equal(r.rejected, 24);
  assert.match(r.winner, /^UJI-\d+$/);
  assert.ok(r.conflicts >= 24);
  assert.equal(Evt.seatStatus('EVT-01', seat, null), 'available'); // hold pemenang dilepas setelah uji
});

test('uji tekan ditolak untuk kursi yang tidak tersedia dan tidak membuat hold', async () => {
  const { Evt } = await loadEvt();
  const sold = Evt.allSeats(Evt.ev('EVT-01')).find((s) => Evt.seatStatus('EVT-01', s, null) === 'sold');
  const v = Evt.version;
  await assert.rejects(Evt.stressTest('EVT-01', sold, 25), /Pilih kursi yang masih tersedia/);
  assert.equal(Evt.version, v);
});

test('uji tekan saat penjualan ditutup: pesan jelas, bukan 25 penolakan diam-diam', async () => {
  const { Evt } = await loadEvt();
  const seat = freeSeat(Evt, 'EVT-01');
  await Evt.updateEvent('EVT-01', { status: 'CLOSED' });
  await assert.rejects(Evt.stressTest('EVT-01', seat, 25), /penjualan/i);
});

// ------------------------------------------------------------------ Task 2: uji 2 gate serentak
test('2 gate memindai tiket yang sama bersamaan: 1 VALID + 1 USED', async () => {
  const { Evt } = await loadEvt();
  const r = await Evt.dualGateTest('EVT-01');
  assert.deepEqual([...r.results].map((x) => x.result).sort(), ['USED', 'VALID']); // salin: array dari realm vm
  assert.notEqual(r.results[0].gate, r.results[1].gate);
  assert.ok(Evt.s.tickets[r.ticket].checkedInAt);
});

test('acara dengan 1 gate memakai label perangkat 2', async () => {
  const { Evt } = await loadEvt();
  await Evt.updateEvent('EVT-01', { gates: ['Gate A (Lobby Utama)'] });
  const r = await Evt.dualGateTest('EVT-01');
  assert.ok(r.results.some((x) => x.gate === 'Gate A (Lobby Utama) (perangkat 2)'));
});

test('tanpa tiket belum check-in: ditolak dengan pesan jelas', async () => {
  const { Evt } = await loadEvt();
  await assert.rejects(Evt.dualGateTest('EVT-03'), /Tidak ada tiket aktif yang belum check-in/);
});

// ------------------------------------------------------------------ Task 3: daftar tunggu otomatis
const paidWith = (Evt, ev, type) => Object.values(Evt.s.orders).find((o) => o.ev === ev && o.status === 'PAID' && o.items.every((i) => i.type === type) && !o.tickets.some((t) => Evt.s.tickets[t].checkedInAt));

test('refund mengabari daftar tunggu jenis yang sama, FIFO, sekali saja', async () => {
  const { Evt, clock } = await loadEvt();
  const o = paidWith(Evt, 'EVT-01', 'VIP');
  await Evt.joinWaitlist('EVT-01', 'VIP', { name: 'A', contact: 'a@example.com', qty: 1 });
  clock.now += 1000;
  await Evt.joinWaitlist('EVT-01', 'GLD', { name: 'B', contact: 'b@example.com', qty: 1 });
  await Evt.refund(o.id, 'uji');
  const wl = Evt.s.waitlist;
  assert.equal(wl.find((w) => w.name === 'A').reason, 'refund');
  assert.equal(wl.find((w) => w.name === 'B').notified, null);
  const sent = Evt.s.outbox.filter((m) => m.to === 'a@example.com').length;
  assert.ok(sent >= 1);
  await Evt.sendReminders('EVT-01'); // transaksi lain, sweep berjalan lagi
  assert.equal(Evt.s.outbox.filter((m) => m.to === 'a@example.com').length, sent);
});

test('refund 1 tiket hanya mengabari antrean sebanyak kursi yang dilepas', async () => {
  const { Evt, clock } = await loadEvt();
  const o = Object.values(Evt.s.orders).find((x) => x.ev === 'EVT-01' && x.status === 'PAID' && x.items.length === 1 && x.items[0].type === 'SLV' && !Evt.s.tickets[x.tickets[0]].checkedInAt);
  await Evt.joinWaitlist('EVT-01', 'SLV', { name: 'P1', contact: 'p1@example.com', qty: 1 });
  clock.now += 1000;
  await Evt.joinWaitlist('EVT-01', 'SLV', { name: 'P2', contact: 'p2@example.com', qty: 1 });
  await Evt.refund(o.id, 'uji');
  assert.equal(Evt.s.waitlist.find((w) => w.name === 'P1').reason, 'refund');
  assert.equal(Evt.s.waitlist.find((w) => w.name === 'P2').notified, null);
});

test('pesanan kedaluwarsa mengabari daftar tunggu', async () => {
  const { Evt, clock } = await loadEvt();
  await Evt.joinWaitlist('EVT-01', 'GLD', { name: 'C', contact: '0812', qty: 1 });
  clock.now += 16 * 60000; // pesanan seed GLD menunggu bayar (batas 6 menit) kedaluwarsa
  await Evt.sendReminders('EVT-01');
  assert.equal(Evt.s.waitlist.find((w) => w.name === 'C').reason, 'kedaluwarsa');
});

test('acara dibatalkan: daftar tunggu acara itu saja yang dikabari', async () => {
  const { Evt } = await loadEvt();
  await Evt.joinWaitlist('EVT-01', 'VIP', { name: 'D', contact: 'd@example.com', qty: 1 });
  await Evt.joinWaitlist('EVT-03', 'PRM', { name: 'E', contact: 'e@example.com', qty: 1 });
  await Evt.cancelEvent('EVT-01', 'uji');
  assert.equal(Evt.s.waitlist.find((w) => w.name === 'D').reason, 'acara-batal');
  assert.equal(Evt.s.waitlist.find((w) => w.name === 'E').notified, null);
});

test('tombol manual mengisi alasan manual', async () => {
  const { Evt } = await loadEvt();
  await Evt.joinWaitlist('EVT-01', 'VIP', { name: 'F', contact: 'f@example.com', qty: 1 });
  assert.equal(await Evt.notifyWaitlist('EVT-01'), 1);
  assert.equal(Evt.s.waitlist.find((w) => w.name === 'F').reason, 'manual');
});

// ------------------------------------------------------------------ Task 4: keuangan & ROI
test('rekonsiliasi: neto = pendapatan lunas, tanpa selisih', async () => {
  const { Evt } = await loadEvt();
  const f = Evt.finance('EVT-01');
  assert.equal(f.totals.net, Evt.stats('EVT-01').revenue);
  assert.equal(f.mismatches.length, 0);
  assert.equal(f.byMethod.reduce((a, m) => a + m.net, 0), f.totals.net);
  assert.ok(f.totals.refunded > 0); // seed punya 1 pesanan refund
});

test('refund menaikkan refunded dan menurunkan neto sebesar total pesanan', async () => {
  const { Evt } = await loadEvt();
  const before = Evt.finance('EVT-01').totals;
  const o = Object.values(Evt.s.orders).find((x) => x.ev === 'EVT-01' && x.status === 'PAID' && !x.tickets.some((t) => Evt.s.tickets[t].checkedInAt));
  await Evt.refund(o.id, 'uji');
  const after = Evt.finance('EVT-01').totals;
  assert.equal(after.refunded - before.refunded, o.total);
  assert.equal(before.net - after.net, o.total);
});

test('penjualan per kategori memakai harga saat beli, bukan harga terbaru', async () => {
  const { Evt } = await loadEvt();
  const vip = () => Evt.finance('EVT-01').byType.find((x) => x.type === 'VIP').gross;
  const g0 = vip();
  await Evt.updateType('EVT-01', 'VIP', { price: 1 });
  assert.equal(vip(), g0);
});

test('selisih rekonsiliasi terdeteksi bila total tidak sama dengan subtotal + biaya', async () => {
  const { Evt } = await loadEvt();
  const o = Object.values(Evt.s.orders).find((x) => x.ev === 'EVT-01' && x.status === 'PAID');
  Evt.s.orders[o.id].total += 1000; // korupsi data langsung di memori (hanya untuk test)
  const m = Evt.finance('EVT-01').mismatches;
  assert.equal(m.length, 1);
  assert.equal(m[0].order, o.id);
});

test('acara gratis dan biaya 0: tidak ada NaN, ROI null', async () => {
  const { Evt } = await loadEvt();
  await Evt.updateEvent('EVT-02', { fin: { cost: 0 } });
  const f = Evt.finance('EVT-02');
  assert.equal(f.totals.net, 0);
  assert.equal(f.roi.roi, null);
  assert.ok(Object.values(f.roi).every((v) => v === null || typeof v === 'string' || Number.isFinite(v)));
});

test('ROI = (sewa + bagi hasil - biaya) / biaya, memakai default bila e.fin kosong', async () => {
  const { Evt } = await loadEvt();
  const f = Evt.finance('EVT-01');
  const D = Evt.FIN_DEFAULT;
  assert.equal(f.roi.share, Math.round(f.totals.net * D.revShare));
  assert.equal(f.roi.benefit, D.rent + f.roi.share);
  assert.equal(f.roi.roi, (f.roi.benefit - D.cost) / D.cost);
  assert.equal(Evt.finance('EVT-03').roi.rent, 20000000);
});
