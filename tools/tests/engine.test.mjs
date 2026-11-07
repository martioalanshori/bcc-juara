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
