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
  assert.equal(Evt.s.scans.filter((x) => x.test && x.ticket === r.ticket).length, 2);
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
  const tiket = Object.values(Evt.s.orders).filter((o) => o.ev === 'EVT-01' && o.status === 'PAID').reduce((a, o) => a + o.sub, 0);
  assert.equal(f.roi.share, Math.round(tiket * D.revShare)); // bagi hasil dari pendapatan tiket, tanpa biaya layanan
  assert.equal(f.roi.benefit, D.rent + f.roi.share);
  assert.equal(f.roi.roi, (f.roi.benefit - D.cost) / D.cost);
  assert.equal(Evt.finance('EVT-03').roi.rent, 20000000);
});

// ------------------------------------------------------------------ Task 5: anomali gate -> tiket insiden otomatis
const GB = 'Gate B (Sisi Food Court)';
const fail3 = async (Evt) => { for (let i = 0; i < 3; i++) await Evt.checkIn('QR-PALSU', 'EVT-01', GB); };

test('3 pindaian gagal: hanya satu CC yang berhasil mengklaim', async () => {
  const { Evt } = await loadEvt();
  await fail3(Evt);
  assert.deepEqual([...Evt.anomalies('EVT-01')].map((a) => a.gate), [GB]);
  const [a, b] = await Promise.all([Evt.claimAnomaly('EVT-01', GB, 'CC-1'), Evt.claimAnomaly('EVT-01', GB, 'CC-2')]);
  assert.equal([a, b].filter(Boolean).length, 1);
  assert.equal(Evt.s.reports.filter((r) => r.auto).length, 1);
});

test('klaim menggantung > 60 detik bisa diambil alih, yang sudah tertaut tidak', async () => {
  const { Evt, clock } = await loadEvt();
  await fail3(Evt);
  const id = await Evt.claimAnomaly('EVT-01', GB, 'CC-1');
  assert.ok(id);
  assert.equal(await Evt.claimAnomaly('EVT-01', GB, 'CC-2'), null); // masih < 60 detik
  clock.now += 61000;
  assert.equal(await Evt.claimAnomaly('EVT-01', GB, 'CC-2'), id);
  await Evt.linkReport(id, 'TCK-999');
  assert.equal(await Evt.claimReport(id, 'CC-3'), null);
  assert.equal(await Evt.claimAnomaly('EVT-01', GB, 'CC-3'), null);
});

test('laporan manual dari gate bisa diklaim sekali', async () => {
  const { Evt } = await loadEvt();
  await Evt.report('EVT-01', GB, 'Petugas gate melapor');
  const id = Evt.s.reports[0].id;
  assert.equal(await Evt.claimReport(id, 'CC-1'), id);
  assert.equal(await Evt.claimReport(id, 'CC-2'), null);
});

test('2 pindaian gagal belum anomali', async () => {
  const { Evt, clock } = await loadEvt();
  clock.now += 11 * 60000; // pindaian gagal dari seed keluar dari jendela 10 menit
  await Evt.checkIn('QR-PALSU', 'EVT-01', GB);
  await Evt.checkIn('QR-PALSU', 'EVT-01', GB);
  assert.equal(await Evt.claimAnomaly('EVT-01', GB, 'CC-1'), null);
});

// ------------------------------------------------------------------ perbaikan review akhir
test('klaim yang gagal tidak melakukan commit (tidak ada badai versi)', async () => {
  const { Evt } = await loadEvt();
  await fail3(Evt);
  assert.ok(await Evt.claimAnomaly('EVT-01', GB, 'CC-1'));
  const v = Evt.version;
  assert.equal(await Evt.claimAnomaly('EVT-01', GB, 'CC-2'), null);
  assert.equal(await Evt.claimReport(Evt.s.reports[0].id, 'CC-2'), null);
  assert.equal(await Evt.claimAnomaly('EVT-01', 'Gate A (Lobby Utama)', 'CC-2'), null); // bukan anomali
  assert.equal(Evt.version, v);
});

test('pesanan campuran VIP + Gold: penjualan per kategori sesuai harga masing-masing', async () => {
  const { Evt } = await loadEvt();
  const ev = Evt.ev('EVT-01');
  const seatOf = (t) => Evt.allSeats(ev).find((s) => Evt.seatType(ev, s) === t && Evt.seatStatus('EVT-01', s, null) === 'available');
  const by = () => Object.fromEntries([...Evt.finance('EVT-01').byType].map((b) => [b.type, b.gross]));
  const g0 = by();
  await Evt.holdSeat('EVT-01', seatOf('VIP'), 'MIX');
  await Evt.holdSeat('EVT-01', seatOf('GLD'), 'MIX');
  const id = await Evt.createOrder('EVT-01', 'MIX', { name: 'Campur', email: 'c@example.com', phone: '0812' });
  assert.equal(await Evt.pay(id, 'QRIS', true), 'PAID');
  await Evt.updateType('EVT-01', 'VIP', { price: 1 });
  const g1 = by();
  assert.equal(g1.VIP - g0.VIP, 750000);
  assert.equal(g1.GLD - g0.GLD, 450000);
});

test('uji 2 gate mengembalikan tiket ke belum check-in dan tidak memicu anomali', async () => {
  const { Evt, clock } = await loadEvt();
  clock.now += 11 * 60000; // pindaian gagal seed keluar dari jendela
  let r;
  for (let i = 0; i < 3; i++) r = await Evt.dualGateTest('EVT-01');
  assert.equal(Evt.s.tickets[r.ticket].checkedInAt, null);
  assert.equal(Evt.anomalies('EVT-01').length, 0);
  assert.equal(await Evt.claimAnomaly('EVT-01', 'Gate B (Sisi Food Court)', 'CC-1'), null);
});

test('cc-bridge: penautan gagal tidak membuat tiket insiden kedua', async () => {
  const tickets = [];
  const Store = { createTicket: (f) => { const t = Object.assign({ id: 'TCK-' + (tickets.length + 1) }, f); tickets.unshift(t); return t; } };
  const { Evt, clock, ctx } = await loadEvt({
    globals: { Store, UI: { toast() {}, esc: (x) => x }, EvtAdmin: { incidentFields: (e, gate, text) => ({ title: gate, desc: text }) } },
    scripts: ['app/js/event/cc-bridge.js'],
  });
  const orig = Evt.linkReport;
  let fails = 1;
  Evt.linkReport = (...a) => (fails-- > 0 ? Promise.reject(new Error('Server sedang sibuk')) : orig(...a));
  await fail3(Evt);
  await ctx.CCBridge.check(); await ctx.CCBridge.check();
  assert.equal(tickets.length, 1);
  clock.now += 61000; // klaim menggantung, boleh diambil alih
  await ctx.CCBridge.check(); await ctx.CCBridge.check();
  assert.equal(tickets.length, 1);
  assert.equal(Evt.s.reports.find((r) => r.auto).ticketId, 'TCK-1');
});

// ------------------------------------------------------------------ perbaikan catatan minor
test('penjualan sudah ditutup: refund tidak mengabari daftar tunggu', async () => {
  const { Evt, clock } = await loadEvt();
  const o = paidWith(Evt, 'EVT-01', 'VIP');
  await Evt.joinWaitlist('EVT-01', 'VIP', { name: 'Z', contact: 'z@example.com', qty: 1 });
  await Evt.updateEvent('EVT-01', { saleEnd: clock.now - 1000 });
  await Evt.refund(o.id, 'uji');
  assert.equal(Evt.s.waitlist.find((w) => w.name === 'Z').notified, null);
});

test('anomali panjang (> 10 menit) di gate yang sama tidak membuat laporan kedua', async () => {
  const { Evt, clock } = await loadEvt();
  await fail3(Evt);
  const id = await Evt.claimAnomaly('EVT-01', GB, 'CC-1');
  await Evt.linkReport(id, 'TCK-1');
  clock.now += 11 * 60000;
  await fail3(Evt);
  assert.equal(await Evt.claimAnomaly('EVT-01', GB, 'CC-1'), null);
  assert.equal(Evt.s.reports.filter((r) => r.auto).length, 1);
  clock.now += 31 * 60000; // laporan lama lewat 30 menit: anomali baru = insiden baru
  await fail3(Evt);
  assert.ok(await Evt.claimAnomaly('EVT-01', GB, 'CC-1'));
  assert.equal(Evt.s.reports.filter((r) => r.auto).length, 2);
});

// ------------------------------------------------------------------ mode demo: peringatan data contoh kedaluwarsa
test('data contoh lebih dari 12 jam dianggap kedaluwarsa', async () => {
  const { Evt, clock } = await loadEvt();
  assert.equal(Evt.demoStale(), false);
  clock.now += 13 * 3600000;
  assert.equal(Evt.demoStale(), true);
});

test('denah terkunci kategori: kursi kategori lain disabled, kursi milik sendiri tetap bisa dilepas', async () => {
  const { Evt } = await loadEvt();
  const e = Evt.ev('EVT-01');
  const seated = e.types.filter((t) => t.seated && t.onSale);
  assert.ok(seated.length >= 2, 'contoh data punya >= 2 kategori bernomor kursi');
  const [a, b] = seated;
  const seatOf = (tid) => Evt.allSeats(e).find((x) => Evt.seatType(e, x) === tid && Evt.seatStatus('EVT-01', x, null) === 'available');
  const mineB = seatOf(b.id);
  await Evt.holdSeat('EVT-01', mineB, 'CART-K');
  const html = Evt.seatMap('EVT-01', { cart: 'CART-K', only: a.id, lock: true });
  const btn = (sid) => html.match(new RegExp('<button[^>]*data-seat="' + sid + '"[^>]*>'))[0];
  assert.ok(!/ disabled/.test(btn(seatOf(a.id))), 'kursi kategori terpilih bisa diketuk');
  assert.match(btn(seatOf(b.id)), / disabled/, 'kursi kategori lain terkunci');
  assert.ok(!/ disabled/.test(btn(mineB)), 'kursi kategori lain milik sendiri tetap bisa dilepas');
  assert.ok(!/ disabled/.test(Evt.seatMap('EVT-01', { only: a.id })), 'tanpa lock (konsol pengelola): hanya disorot, tidak dikunci');
});

test('data contoh: 27 acara di 5 area mal, foto demo ada di disk, beberapa hampir habis', async () => {
  const { existsSync } = await import('node:fs');
  const { Evt } = await loadEvt();
  const evs = Evt.s.order.map(Evt.ev);
  assert.equal(evs.length, 27);
  assert.equal(new Set(evs.map((e) => e.venue.split(',')[0])).size, 5, 'tersebar di 5 area');
  for (const e of evs) {
    assert.ok(e.img, e.id + ' punya foto');
    assert.ok(existsSync(new URL('..' + e.img, import.meta.url)), 'file foto ' + e.img + ' ada (ganti foto dengan nama yang sama)');
  }
  const hot = evs.filter((e) => { const s = Evt.stats(e.id); const t = e.types.filter((x) => x.onSale); const tot = t.reduce((a, x) => a + s.per[x.id].total, 0); return tot && t.reduce((a, x) => a + s.per[x.id].available, 0) / tot < 0.3; });
  assert.ok(hot.length >= 2, 'beranda "Laku keras" terisi');
  assert.ok(JSON.stringify(Evt.s).length < 350 * 1024, 'state contoh tetap kecil (kuota gratis)');
});

// ------------------------------------------------------------------ Pengaturan: simpan semua dalam satu transaksi
test('saveEvent: data acara, harga, dan jenis tiket baru tersimpan sekaligus', async () => {
  const { Evt } = await loadEvt();
  const before = Evt.ev('EVT-01').types.length;
  await Evt.saveEvent('EVT-01', { patch: { tagline: 'Baru', img: 'data:image/jpeg;base64,AAAA' }, types: { VIP: { price: 800000 } }, add: [{ name: 'Early bird', price: 99000, quota: 50 }] });
  const e = Evt.ev('EVT-01');
  assert.equal(e.tagline, 'Baru');
  assert.equal(e.img, 'data:image/jpeg;base64,AAAA');
  assert.equal(e.types.find((t) => t.id === 'VIP').price, 800000);
  assert.equal(e.types.length, before + 1);
  const nt = e.types[e.types.length - 1];
  assert.equal(nt.seated, false); assert.equal(nt.quota, 50); assert.equal(Evt.stats('EVT-01').per[nt.id].available, 50);
  assert.ok(!e.types.slice(0, -1).some((t) => t.id === nt.id), 'ID jenis tiket baru unik');
});

test('saveEvent: kuota di bawah tiket terjual ditolak dan tidak ada yang tersimpan', async () => {
  const { Evt } = await loadEvt();
  const sold = Evt.stats('EVT-01').per.FES.sold;
  assert.ok(sold > 0);
  await assert.rejects(Evt.saveEvent('EVT-01', { patch: { tagline: 'Tidak boleh tersimpan' }, types: { FES: { quota: sold - 1 } } }), /Kuota/);
  assert.notEqual(Evt.ev('EVT-01').tagline, 'Tidak boleh tersimpan');
  await assert.rejects(Evt.saveEvent('EVT-01', { add: [{ name: '', quota: 10 }] }), /nama dan kuota/);
});
