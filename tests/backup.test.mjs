// Manifest cadangan harian untuk gate (app/js/event/checkin-ui.js, EvtCheckin.backup): dipakai saat sistem mati (SOP-EVT-05).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEvt } from './harness.mjs';

const load = () => loadEvt({ scripts: ['app/js/event/checkin-ui.js'] });

test('cadangan: batas harian pukul 23.00 (sebelum 23.00 = kemarin, sesudahnya = hari ini)', async () => {
  const { ctx } = await load();
  const B = ctx.EvtCheckin.backup;
  const at = (h, m) => new Date(2026, 10, 12, h, m).getTime();
  assert.equal(B.cutoff(at(10, 0)), new Date(2026, 10, 11, 23, 0).getTime());
  assert.equal(B.cutoff(at(23, 30)), new Date(2026, 10, 12, 23, 0).getTime());
});

test('cadangan: manifest tersimpan di perangkat dan tetap bisa dibaca walau data acara berubah', async () => {
  const { Evt, ctx } = await load();
  const B = ctx.EvtCheckin.backup;
  const n = Object.values(Evt.s.tickets).filter((t) => t.ev === 'EVT-01').length;
  assert.ok(n > 0);
  const m = B.ensure('EVT-01');
  assert.equal(m.rows.length - 1, n, 'satu baris per tiket + judul kolom');
  assert.equal(JSON.stringify(m.rows[0].slice(0, 3)), JSON.stringify(['ID Tiket', 'Booking', 'Kategori']));
  assert.equal(m.at, B.cutoff(Evt.now()));
  assert.ok(ctx.localStorage.getItem('smicc-manifest-v1'));
  // Data berubah setelah cadangan: manifest tetap yang tersimpan sampai cadangan berikutnya.
  const first = Object.values(Evt.s.tickets).find((t) => t.ev === 'EVT-01');
  first.holder = 'Diubah Setelah Cadangan';
  assert.ok(!B.load('EVT-01').rows.some((r) => r.includes('Diubah Setelah Cadangan')));
  assert.equal(B.ensure('EVT-01').savedAt, m.savedAt, 'tidak disimpan ulang sebelum batas 23.00 berikutnya');
});
