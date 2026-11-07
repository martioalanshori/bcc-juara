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
