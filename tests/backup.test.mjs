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

const buy = async (Evt, cart, name, vehicle) => {
  const ev = Evt.ev('EVT-01');
  await Evt.holdSeat('EVT-01', Evt.allSeats(ev).find((x) => Evt.seatStatus('EVT-01', x, null) === 'available'), cart);
  const id = await Evt.createOrder('EVT-01', cart, { name, email: cart.toLowerCase() + '@example.com', phone: '0812', vehicle });
  await Evt.pay(id, 'QRIS', true);
  return id;
};

test('cadangan: manifest tersimpan di perangkat, satu baris per tiket, kolom untuk dicentang manual', async () => {
  const { Evt, ctx } = await load();
  const B = ctx.EvtCheckin.backup;
  const n = Object.values(Evt.s.tickets).filter((t) => t.ev === 'EVT-01').length;
  assert.ok(n > 0);
  const m = B.ensure('EVT-01');
  assert.equal(m.rows.length - 1, n, 'satu baris per tiket + judul kolom');
  assert.equal(JSON.stringify(m.rows[0].slice(0, 4)), JSON.stringify(['Hadir', 'Booking', 'ID Tiket', 'Pemegang']));
  assert.ok(m.rows[0].includes('Kendaraan') && m.rows[0].includes('Plat'));
  assert.ok(ctx.localStorage.getItem('smicc-manifest-v1'));
  const names = m.rows.slice(1).filter((r) => r[11] === 'Aktif').map((r) => r[3]);
  assert.deepEqual([...names], [...names].sort((a, b) => a.localeCompare(b, 'id')), 'urut nama pemegang');
});

test('cadangan: pembeli setelah salinan pertama ikut masuk (tidak menunggu pukul 23.00)', async () => {
  const { Evt, ctx, clock } = await load();
  const B = ctx.EvtCheckin.backup;
  B.ensure('EVT-01');
  await buy(Evt, 'SIANG', 'Pembeli Siang', { t: 'motor', p: 'd 77 x' });
  const has = (m) => m.rows.some((r) => r[4] === 'Pembeli Siang');
  assert.ok(has(B.latest('EVT-01')), 'unduhan selalu memakai data terbaru saat server terhubung');
  clock.now += 31000;
  const m = B.ensure('EVT-01');
  assert.ok(has(m), 'salinan di perangkat ikut diperbarui');
  const row = m.rows.find((r) => r[4] === 'Pembeli Siang');
  assert.equal(row[7], 'Motor'); assert.equal(row[8], 'D 77 X');
  assert.equal(B.ensure('EVT-01').savedAt, m.savedAt, 'tanpa perubahan data: tidak disimpan ulang');
});

test('cadangan: Excel (.xlsx) berisi zip valid dengan sheet manifest', async () => {
  const { Evt, ctx } = await load();
  const { crc32 } = await import('node:zlib');
  const m = ctx.EvtCheckin.backup.ensure('EVT-01');
  const b = Buffer.from(Evt.xlsxBytes(m.rows, { sheet: 'Manifest EVT-01' }));
  assert.equal(b.readUInt32LE(0), 0x04034b50, 'diawali header zip');
  const files = {};
  for (let p = 0; b.readUInt32LE(p) === 0x04034b50;) {
    const crc = b.readUInt32LE(p + 14), size = b.readUInt32LE(p + 18), nl = b.readUInt16LE(p + 26);
    const name = b.toString('utf8', p + 30, p + 30 + nl), data = b.subarray(p + 30 + nl, p + 30 + nl + size);
    assert.equal(crc32(data), crc, 'CRC ' + name);
    files[name] = data.toString('utf8'); p += 30 + nl + size;
  }
  assert.ok(files['xl/worksheets/sheet1.xml'].includes('<t xml:space="preserve">Pemegang</t>'));
  assert.ok(files['xl/workbook.xml'].includes('name="Manifest EVT-01"'));
  assert.ok(files['[Content_Types].xml'] && files['xl/styles.xml']);
  const x = Buffer.from(Evt.xlsxBytes([['a'], ['=1+1 & <b>']])).toString('utf8');
  assert.ok(x.includes('=1+1 &amp; &lt;b&gt;') && !x.includes('<f>'), 'teks tidak menjadi rumus, karakter XML di-escape');
});

test('cadangan: manifest offline HTML mandiri dan aman dari </script> di data', async () => {
  const { Evt, ctx } = await load();
  await buy(Evt, 'XSS', '</script><b>x</b>', null);
  const B = ctx.EvtCheckin.backup;
  const html = B.offlineHtml(B.latest('EVT-01'));
  assert.ok(html.startsWith('<!doctype html>'));
  assert.equal((html.match(/<\/script>/g) || []).length, 1, 'hanya satu penutup script');
  assert.ok(html.includes('\u003c/script>'));
  assert.ok(!/src=|href="http/.test(html), 'tanpa berkas atau internet dari luar');
});

test('cadangan: semua acara dalam satu ZIP (folder per acara + daftar acara + petunjuk)', async () => {
  const { Evt, ctx } = await load();
  const { crc32 } = await import('node:zlib');
  const B = ctx.EvtCheckin.backup;
  const b = Buffer.from(Evt.zipBytes(B.allFiles()));
  const names = [];
  for (let p = 0; b.readUInt32LE(p) === 0x04034b50;) {
    const crc = b.readUInt32LE(p + 14), size = b.readUInt32LE(p + 18), nl = b.readUInt16LE(p + 26);
    const name = b.toString('utf8', p + 30, p + 30 + nl);
    assert.equal(crc32(b.subarray(p + 30 + nl, p + 30 + nl + size)), crc, 'CRC ' + name);
    names.push(name); p += 30 + nl + size;
  }
  assert.ok(names.includes('BACA_SAYA.txt') && names.includes('DAFTAR_ACARA.xlsx'));
  const evs = Evt.s.order.map((id) => Evt.ev(id)).filter((e) => e.status !== 'DRAFT' && e.status !== 'CANCELLED');
  for (const e of evs) for (const ext of ['.xlsx', '.csv', '.html']) assert.ok(names.some((n) => n.startsWith(e.id + '/') && n.endsWith(ext)), e.id + ext);
  assert.ok(!names.some((n) => n.startsWith('EVT-28/')), 'draft tidak ikut');
});

test('cadangan: unggah hasil centang manifest offline mencatat check-in yang belum ada', async () => {
  const { Evt, ctx } = await load();
  const B = ctx.EvtCheckin.backup;
  const tks = Object.values(Evt.s.tickets).filter((t) => t.ev === 'EVT-01');
  const fresh = tks.filter((t) => t.status === 'ACTIVE' && !t.checkedInAt).slice(0, 2);
  const used = tks.find((t) => t.checkedInAt);
  const other = Object.values(Evt.s.tickets).find((t) => t.ev !== 'EVT-01');
  assert.ok(fresh.length === 2 && used && other);
  const at = Evt.now() - 30 * 60000, iso = new Date(at).toISOString();
  const csv = '﻿ID Tiket;Booking;Pemegang;Waktu centang;Waktu ISO\r\n' +
    [fresh[0], fresh[1], used, other, fresh[0]].map((t) => [t.id, t.order, '"' + t.holder + '"', '15/11/2026, 14.30.05', iso].join(';')).join('\r\n');
  const p = B.parseUpload(csv);
  assert.equal(p.ev, 'EVT-01');
  assert.equal(p.items.length, 5);
  const pv = Evt.importPreview('EVT-01', p.items);
  assert.deepEqual({ ...pv }, { ok: 2, used: 1, void: 0, other: 1 }, 'duplikat dihitung sekali');
  const r = await Evt.importCheckins('EVT-01', p.items);
  assert.equal(r.ok, 2);
  assert.equal(Evt.s.tickets[fresh[0].id].checkedInAt, at, 'waktu centang dipakai');
  assert.equal(Evt.s.tickets[fresh[0].id].gate, 'Manifest offline');
  assert.equal(Evt.s.tickets[used.id].checkedInAt, used.checkedInAt, 'check-in lama tidak ditimpa');
  assert.equal(Evt.importPreview('EVT-01', p.items).ok, 0, 'unggah ulang tidak mencatat dua kali');
});

test('cadangan: manifest CSV dengan kolom Hadir diisi manual juga bisa diunggah', async () => {
  const { Evt, ctx } = await load();
  const B = ctx.EvtCheckin.backup;
  const rows = B.latest('EVT-01').rows.map((r) => r.slice());
  const i = rows.findIndex((r, k) => k > 0 && r[0] === '' && r[11] === 'Aktif');
  rows[i][0] = 'v';
  const p = B.parseUpload(Evt.csvText(rows));
  assert.equal(p.items.length, rows.slice(1).filter((r) => r[0]).length, 'hanya baris yang dicentang');
  assert.ok(p.items.some((x) => x.id === rows[i][2]));
  assert.ok(B.parseUpload('a;b\r\n1;2').error, 'tanpa kolom ID Tiket ditolak');
});
