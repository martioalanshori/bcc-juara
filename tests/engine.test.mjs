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

test('data contoh: 28 acara di 5 area mal, foto demo ada di disk, beberapa hampir habis', async () => {
  const { existsSync } = await import('node:fs');
  const { Evt } = await loadEvt();
  const evs = Evt.s.order.map(Evt.ev);
  assert.equal(evs.length, 28);
  const ids = new Set(Array.from(Evt.AREAS, (x) => x.id));
  assert.ok(evs.every((e) => ids.has(e.area)), 'semua acara contoh punya area dari Evt.AREAS');
  assert.ok(new Set(evs.map((e) => e.area)).size >= 6, 'tersebar di area mal');
  for (const e of evs) assert.equal(Evt.areaClash(e.area, e.start, e.end, e.id).length, 0, e.id + ' bentrok jadwal area');
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

// ------------------------------------------------------------------ persetujuan acara & log jejak
test('persetujuan: acara baru tidak bisa dipublikasikan sebelum Divisi Event dan Operasional Mall setuju', async () => {
  const { Evt, clock } = await loadEvt();
  Evt.setActor({ name: 'Sari', role: 'Penyelenggara' });
  const id = await Evt.addEvent({ name: 'Expo Uji', template: 'HALL', start: clock.now + 20 * 86400000 });
  await assert.rejects(Evt.updateEvent(id, { status: 'PUBLISHED' }), /belum disetujui/);
  await assert.rejects(Evt.submitApproval(id), /Lengkapi dokumen/);
  for (const d of Evt.DOCS.filter((x) => x.req)) await Evt.uploadDoc(id, d.id, { name: d.id + '.pdf', size: 1000 });
  await Evt.submitApproval(id, 'Mohon ditinjau');
  await assert.rejects(Evt.uploadDoc(id, 'k3', { name: 'k3.pdf' }), /terkunci/);
  await assert.rejects(Evt.decide(id, 'ops', true), /Divisi Event lebih dulu/);
  await assert.rejects(Evt.decide(id, 'event', false, ''), /alasan revisi/);
  clock.now += 2 * 3600000;
  Evt.setActor({ name: 'Andi', role: 'Divisi Event' });
  assert.equal(await Evt.decide(id, 'event', false, 'Lampirkan rencana K3'), 'REVISI');
  assert.equal(Evt.ev(id).approval.st, 'REVISI');
  Evt.setActor({ name: 'Sari', role: 'Penyelenggara' });
  await Evt.uploadDoc(id, 'k3', { name: 'k3.pdf', size: 500 });
  await Evt.submitApproval(id);
  assert.equal(Evt.ev(id).approval.round, 2);
  Evt.setActor({ name: 'Andi', role: 'Divisi Event' });
  assert.equal(await Evt.decide(id, 'event', true), 'NEXT');
  clock.now += 26 * 3600000;
  Evt.setActor({ name: 'Budi', role: 'Operasional Mall' });
  assert.equal(await Evt.decide(id, 'ops', true, 'Parkir aman'), 'DONE');
  await Evt.updateEvent(id, { status: 'PUBLISHED' });
  const log = Evt.ev(id).audit, acts = log.map((x) => x.act);
  for (const a of ['BUAT', 'DOKUMEN', 'AJUKAN', 'REVISI', 'SETUJU', 'DISETUJUI', 'STATUS']) assert.ok(acts.includes(a), 'log memuat ' + a);
  const ops = log.find((x) => x.act === 'SETUJU' && x.role === 'Operasional Mall');
  assert.equal(ops.by, 'Budi'); assert.equal(ops.note, 'Parkir aman'); assert.match(ops.text, /1 hari 2 jam/);
  assert.equal(JSON.stringify(Evt.verifyAudit(Evt.ev(id))), JSON.stringify({ ok: true, n: log.length }));
});

test('log jejak: perubahan pengaturan tercatat dengan nilai lama dan baru, entri yang diubah diam-diam terdeteksi', async () => {
  const { Evt } = await loadEvt();
  const e = Evt.ev('EVT-02'), ty = e.types[0];
  await Evt.saveEvent('EVT-02', { patch: { name: 'Demo Day Baru' }, types: { [ty.id]: { price: ty.price + 10000 } } });
  const last = Evt.ev('EVT-02').audit.at(-1);
  assert.equal(last.act, 'UBAH');
  assert.match(last.text, /nama \(.+ → Demo Day Baru\)/);
  assert.match(last.text, new RegExp('harga ' + ty.name));
  await Evt.saveEvent('EVT-02', { patch: { name: 'Demo Day Baru' } });
  assert.equal(Evt.ev('EVT-02').audit.length, 1, 'simpan tanpa perubahan tidak menambah log');
  const seeded = Evt.ev('EVT-28');
  assert.equal(seeded.approval.st, 'REVISI', 'contoh demo: Divisi Event minta revisi denah, tenant tinggal ajukan ulang');
  assert.equal(seeded.org, 'Komunitas UMKM Gedebage');
  assert.equal(Evt.missingDocs(seeded).length, 0, 'denah v2 sudah diunggah');
  assert.equal(Evt.currentStep(seeded), null);
  assert.ok(seeded.audit.some((x) => x.act === 'REVISI' && x.role === 'Divisi Event' && /denah/i.test(x.note)));
  assert.ok(Evt.verifyAudit(seeded).ok);
  const forged = JSON.parse(JSON.stringify(seeded));
  forged.audit[1].text = 'diubah';
  assert.equal(JSON.stringify(Evt.verifyAudit(forged)), JSON.stringify({ ok: false, n: forged.audit.length, at: 1 }));
});

// ------------------------------------------------------------------ pelaku ber-divisi & ber-org, giliran persetujuan
test('dokumen persyaratan: 6 wajib + 1 opsional, masing-masing punya divisi pemeriksa', async () => {
  const { Evt } = await loadEvt();
  assert.deepEqual(Array.from(Evt.DOCS, (d) => d.id), ['proposal', 'layout', 'legal', 'teknis', 'k3', 'izin', 'khusus']);
  assert.equal(Evt.DOCS.filter((d) => d.req).length, 6);
  assert.ok(Evt.DOCS.every((d) => ['event', 'ops'].includes(d.by)));
});

test('decide: akun divisi lain ditolak', async () => {
  const { Evt } = await loadEvt();
  Evt.setActor({ name: 'Sari', role: 'Tenant/EO', org: 'Komunitas UMKM Gedebage' });
  await Evt.submitApproval('EVT-28');
  Evt.setActor({ name: 'Rudi', role: 'Operasional Mall', div: 'ops' });
  await assert.rejects(Evt.decide('EVT-28', 'event', true), /bukan Divisi Event/);
});

test('addEvent memakai org pelaku, Tim Event Mall bila tanpa org', async () => {
  const { Evt, clock } = await loadEvt();
  Evt.setActor({ name: 'Sari', role: 'Tenant/EO', org: 'Komunitas UMKM Gedebage' });
  const a = await Evt.addEvent({ name: 'Bazar Tenant', template: 'HALL', start: clock.now + 40 * 86400000 });
  assert.equal(Evt.ev(a).org, 'Komunitas UMKM Gedebage');
  Evt.setActor({ name: 'Tim', role: 'Tim Event Mall' });
  const b = await Evt.addEvent({ name: 'Acara Mall', template: 'HALL', start: clock.now + 41 * 86400000 });
  assert.equal(Evt.ev(b).org, Evt.ORG_MALL);
});

test('turn: giliran berurutan dari penyelenggara sampai publikasi', async () => {
  const { Evt } = await loadEvt();
  const who = () => Evt.turn(Evt.ev('EVT-28')).who;
  assert.equal(who(), 'penyelenggara');
  Evt.setActor({ name: 'Sari', role: 'Tenant/EO', org: 'Komunitas UMKM Gedebage' });
  await Evt.submitApproval('EVT-28');
  assert.equal(who(), 'event');
  assert.match(Evt.turn(Evt.ev('EVT-28')).label, /Divisi Event/);
  Evt.setActor({ name: 'Andi', role: 'Divisi Event', div: 'event' });
  await Evt.decide('EVT-28', 'event', true);
  assert.equal(who(), 'ops');
  Evt.setActor({ name: 'Rudi', role: 'Operasional Mall', div: 'ops' });
  await Evt.decide('EVT-28', 'ops', true);
  assert.equal(who(), 'publikasi');
  await Evt.updateEvent('EVT-28', { status: 'PUBLISHED' });
  assert.equal(Evt.turn(Evt.ev('EVT-28')), null);
  assert.equal(Evt.turn(Evt.ev('EVT-01')), null, 'acara lama tanpa approval');
});

test('acara lama tanpa data persetujuan tetap bisa dipublikasikan ulang', async () => {
  const { Evt } = await loadEvt();
  await Evt.updateEvent('EVT-01', { status: 'DRAFT' });
  await Evt.updateEvent('EVT-01', { status: 'PUBLISHED' });
  assert.equal(Evt.ev('EVT-01').status, 'PUBLISHED');
});

// ------------------------------------------------------------------ area acara & cek bentrok
test('area: 7 area sesuai denah, nama Atrium Cibadag, venue memuat lantai', async () => {
  const { Evt } = await loadEvt();
  assert.deepEqual(Array.from(Evt.AREAS, (a) => a.id), ['sawarga', 'downtown', 'parkir-barat', 'exhibition', 'ciunik', 'cileutik', 'cibadag']);
  assert.equal(Evt.AREAS.find((a) => a.id === 'cibadag').name, 'Atrium Cibadag');
  assert.ok(Evt.AREAS.find((a) => a.id === 'parkir-barat').parking);
  assert.match(Evt.ev('EVT-28').venue, /^Exhibition Hall A, 2F/);
  const e4 = Evt.ev('EVT-04');
  assert.equal(e4.area, 'parkir-barat');
  assert.ok(e4.end - e4.start >= 2 * 86400000, 'Bazar Kuliner di Parkir Barat beberapa hari');
  assert.equal(Evt.ev('EVT-12').area, 'downtown');
});

test('areaClash: tumpang tindih di area sama terdeteksi, acara batal diabaikan', async () => {
  const { Evt } = await loadEvt();
  const e = Evt.ev('EVT-28');
  assert.deepEqual(Array.from(Evt.areaClash('exhibition', e.start + 3600000, e.start + 7200000), (x) => x.id), ['EVT-28']);
  assert.equal(Evt.areaClash('exhibition', e.end, e.end + 3600000).length, 0, 'bersebelahan bukan bentrok');
  assert.equal(Evt.areaClash('ciunik', e.start, e.end).filter((x) => x.id === 'EVT-28').length, 0, 'area lain');
  await Evt.cancelEvent('EVT-28', 'uji');
  assert.equal(Evt.areaClash('exhibition', e.start, e.end).length, 0);
});

test('addEvent ditolak bila area bentrok, diterima di area lain', async () => {
  const { Evt } = await loadEvt();
  const e = Evt.ev('EVT-28');
  await assert.rejects(Evt.addEvent({ name: 'Pameran Lain', area: 'exhibition', template: 'KUOTA', start: e.start + 3600000, end: e.start + 5 * 3600000 }), /sudah dipakai Expo UMKM/);
  const id = await Evt.addEvent({ name: 'Pameran Lain', area: 'cileutik', template: 'KUOTA', start: e.start + 3600000, end: e.start + 5 * 3600000 });
  const x = Evt.ev(id);
  assert.equal(x.area, 'cileutik');
  assert.match(x.venue, /^Atrium Cileutik, GF/);
  assert.equal(x.layout.rows.length, 0, 'format tiket kuota tanpa denah kursi');
});

test('area dikunci setelah diajukan', async () => {
  const { Evt } = await loadEvt();
  Evt.setActor({ name: 'Sari', role: 'Tenant/EO', org: 'Komunitas UMKM Gedebage' });
  await Evt.submitApproval('EVT-28');
  await assert.rejects(Evt.saveEvent('EVT-28', { patch: { area: 'cileutik' } }), /dikunci setelah diajukan/);
});

// ------------------------------------------------------------------ Kendaraan pemesan & prediksi parkir
test('plat nomor dirapikan ke format baku', async () => {
  const { Evt } = await loadEvt();
  assert.equal(Evt.normPlate('d1234abc'), 'D 1234 ABC');
  assert.equal(Evt.normPlate(' b  12 '), 'B 12');
  assert.equal(Evt.normPlate('D-5678-XY'), 'D 5678 XY');
});

test('pesanan menyimpan kendaraan, plat salah ditolak, panitia bisa mengubah', async () => {
  const { Evt } = await loadEvt();
  const ev = Evt.ev('EVT-01');
  const seat = () => Evt.allSeats(ev).find((s) => Evt.seatStatus('EVT-01', s, null) === 'available');
  await Evt.holdSeat('EVT-01', seat(), 'VEH1');
  const id = await Evt.createOrder('EVT-01', 'VEH1', { name: 'A', email: 'a@example.com', phone: '0812', vehicle: { t: 'mobil', p: 'd 1234 abc' } });
  assert.deepEqual({ ...Evt.s.orders[id].veh }, { t: 'mobil', p: 'D 1234 ABC' });
  await Evt.holdSeat('EVT-01', seat(), 'VEH2');
  const id2 = await Evt.createOrder('EVT-01', 'VEH2', { name: 'B', email: 'b@example.com', phone: '0812', vehicle: null });
  assert.equal(Evt.s.orders[id2].veh, null);
  await Evt.holdSeat('EVT-01', seat(), 'VEH3');
  await assert.rejects(Evt.createOrder('EVT-01', 'VEH3', { name: 'C', email: 'c@example.com', phone: '0812', vehicle: { t: 'motor', p: '12345' } }), /Plat nomor tidak valid/);
  await Evt.updateContact(id, { veh: { t: 'motor', p: 'D 9 Z' } });
  assert.equal(Evt.s.orders[id].veh.t, 'motor');
  assert.equal(Evt.vehTxt(Evt.s.orders[id].veh), 'Motor D 9 Z');
});

test('prediksi parkir: asumsi rasio tanpa data, pesanan berkendaraan ikut dihitung', async () => {
  const { Evt } = await loadEvt();
  const p0 = Evt.parkDemand('EVT-01');
  assert.equal(p0.basis, 'asumsi');
  assert.ok(p0.mobil > 0 && p0.motor > 0);
  const ev = Evt.ev('EVT-01');
  await Evt.holdSeat('EVT-01', Evt.allSeats(ev).find((s) => Evt.seatStatus('EVT-01', s, null) === 'available'), 'PK');
  await Evt.createOrder('EVT-01', 'PK', { name: 'A', email: 'a@example.com', phone: '0812', vehicle: { t: 'mobil', p: 'D 1 A' } });
  const p1 = Evt.parkDemand('EVT-01');
  assert.equal(p1.declared.mobil, p0.declared.mobil + 1);
  assert.equal(p1.answered, p0.answered + 1);
  assert.equal(Evt.parkDemand('EVT-04').usesParking, true); // Bazar di Parkir Barat memakai lahan parkir
});
