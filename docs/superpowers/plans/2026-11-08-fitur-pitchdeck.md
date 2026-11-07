# Fitur Pitch Deck yang Belum Ada: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menutup 5 celah antara pitch deck "SMICC-TS Event Ticketing, Bandung Build Challenge 2026" dan aplikasi, supaya setiap klaim di deck bisa didemokan.

**Architecture:** Semua aturan bisnis baru masuk ke `app/js/evt/engine.js` sebagai aksi `window.Evt` yang lewat `tx()` (CAS) atau sebagai query murni. UI hanya memanggil aksi tersebut dari `app/js/views/event.js`. Jembatan otomatis Event → Command Center ditaruh di file baru `app/js/evt/cc-bridge.js` yang hanya dimuat di `app/index.html`. Logika engine diuji dengan harness Node tanpa dependensi (`node:test` + `node:vm`) yang memuat `engine.js` apa adanya dalam mode lokal.

**Tech Stack:** HTML + vanilla JS IIFE, Tailwind prebuilt, Python stdlib server, Node ≥ 20 (hanya untuk test, tanpa npm install).

**Spec:** `docs/SMICC-TS Event Ticketing - Bandung Build Challenge 2026.md`

## Hasil audit: klaim deck vs kode

| Klaim deck | Status | Bukti |
|---|---|---|
| Hold kursi 8 menit, bayar ≤ 15 menit, hold kedaluwarsa otomatis | Ada | `engine.js` `holdMin: 8`, `PAY_MIN = 15`, `sweep()` |
| Transaksi berversi (CAS), callback bayar idempoten, check-in atomik | Ada | `tx()`, `pay()` → `'ALREADY'`, `checkIn()` di dalam `tx`, `server.py` 409 |
| QR bertanda tangan VALID / SUDAH DIGUNAKAN / TIDAK VALID | Ada | `sign()`, `verify()` |
| Denah kursi live, check-in via kamera ponsel, statistik per gate | Ada | `seatMap()`, `checkin-ui.js` (jsQR + getUserMedia), `ckStats()` |
| EO: buat/publikasi acara, harga, kuota, denah, peserta, refund, batal + refund otomatis | Ada | `views/event.js` tab pengelola, `cancelEvent()` |
| Event 360: dampak parkir/CCTV/BMS/personel keamanan | Ada | `portofolio()` "Dampak operasional mall" |
| PIN per peran, kunci setelah 5x salah | Ada | `server.py` `MAX_FAIL, LOCK_SEC = 5, 60` |
| Offline LAN | Ada | `app/vendor/`, `server.py` |
| **Uji tekan: 25 pembeli serentak pada 1 kursi → 1 berhasil, 24 ditolak** | **Belum** | Hanya `raceDemo()` dengan 2 pembeli |
| **Check-in atomik: 2 gate memindai bersamaan → 1 VALID + 1 SUDAH DIGUNAKAN** (bisa didemokan) | **Belum ada demo** | Logikanya ada, tapi tidak ada tombol uji |
| **Refund/kursi kembali dijual → daftar tunggu dikabari** | **Sebagian** | Hanya tombol manual `notifyWaitlist()`. `refund()`, kedaluwarsa, dan `cancelEvent()` tidak mengabari daftar tunggu |
| **Finance & Marketing: rekonsiliasi pembayaran, laporan penjualan, ROI acara atrium** | **Belum** | Hanya ekspor CSV peserta/transaksi |
| **≥ 3 pindaian gagal per gate dalam 10 menit → tiket insiden P2 di Command Center** | **Sebagian** | Anomali terdeteksi, tetapi operator CC harus klik "Buat tiket insiden" dan mengisi modal |

## Global Constraints

- Tanpa CDN dan tanpa dependensi npm. Test hanya memakai modul bawaan Node (`node:test`, `node:vm`, `node:assert`, `node:fs`).
- Setiap mutasi state event lewat `tx()` di `engine.js`. Tidak ada penulisan state langsung.
- Teks UI mengikuti `docs/PANDUAN_Teks_UI.md`: sentence case, tanpa em dash, Bahasa Indonesia (istilah Inggris seperti waiting list atau read-only boleh).
- Jangan hard-code hex di view baru. Pakai kelas token/Tailwind yang sudah ada (`text-emerald-300`, `text-rose-300`, `text-amber-300`, dst.).
- Setiap commit yang mengubah JS/CSS menaikkan cache-buster `?v=N` di semua halaman `app/*.html` (sekarang `?v=12`, commit berikutnya `?v=13`, dan seterusnya).
- Bila memakai kelas Tailwind yang belum ada di `app/vendor/tailwind.css`, jalankan `npx tailwindcss@3 -c tools/tailwind/tailwind.config.js -i tools/tailwind/input.css -o app/vendor/tailwind.css --minify`.
- Perubahan aturan engine dicatat di `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md` pada commit yang sama.
- Jangan ubah tata letak halaman depan (3 kartu) dan ticker Command Center.
- Jangan commit isi `data/`.
- Command Center (`Store`) tetap localStorage per browser. Hanya catatan klaim/laporan yang dibagi lewat state Evt.

## Review Focus

1. Uji tekan dijalankan pada kursi yang tidak tersedia (terjual, diblokir, sedang dipesan): harus ditolak dengan pesan jelas dan tidak meninggalkan hold. Test ada di Task 1.
2. Dua browser Command Center terbuka bersamaan saat anomali muncul: hanya satu yang mengklaim dan membuat tiket. Klaim yang menggantung (browser tertutup sebelum tiket dibuat) bisa diambil alih setelah 60 detik. Test ada di Task 5.
3. Pengabaran daftar tunggu berjalan di dalam `sweep()` yang dipanggil setiap transaksi: entri yang sudah dikabari tidak boleh dikabari lagi, dan entri acara lain tidak boleh tersentuh. Test ada di Task 3.
4. Acara gratis (EVT-02, total 0) dan biaya operasional 0 di laporan keuangan: tidak boleh muncul `NaN`/`Infinity`. ROI tampil `-`. Test ada di Task 4.
5. Uji 2 gate pada acara yang tidak punya tiket belum check-in, atau hanya punya 1 gate (EVT-03): pesan jelas, atau gate kedua diberi label "(perangkat 2)". Test ada di Task 2.

---

### Task 1: Harness test engine + uji tekan 25 pembeli

**Files:**
- Create: `tools/tests/harness.mjs`
- Create: `tools/tests/engine.test.mjs`
- Modify: `app/js/evt/engine.js` (aksi `holdSeat`, aksi baru `stressTest`, ekspor)
- Modify: `app/js/views/event.js` (fungsi `kursi()` kartu "Uji anti double-booking", `bind()`)
- Modify: `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md`, `CLAUDE.md` (bagian Commands: tambah `node --test tools/tests/`)

**Interfaces:**
- Produces: `loadEvt(): Promise<{ Evt, clock }>` dari `harness.mjs`. `clock.now` (ms) bisa dimajukan oleh test. `Evt` sudah `await Evt.init()`, mode `lokal`, storage baru per panggilan.
- Produces: `Evt.holdSeat(evId, seat, cart, opts?)`: `opts` diteruskan ke `tx(mut, opts)` (untuk `onConflict`).
- Produces: `Evt.stressTest(evId, seat, n = 25): Promise<{ seat, n, winner: string, rejected: number, conflicts: number, ms: number, log: string[] }>`

- [ ] **Step 1: Tulis harness**

`loadEvt()` membuat `vm.createContext` berisi: `window` (konteks itu sendiri), `localStorage` dan `sessionStorage` berbasis `Map` (getItem/setItem/removeItem), `location = { protocol: 'file:' }` (supaya `probe()` langsung `false` → mode lokal), `document = { addEventListener() {} }`, `addEventListener() {}`, `setInterval = () => 0`, `console`, serta `Date` subclass yang `static now()`-nya mengembalikan `clock.now`. Lalu jalankan isi `app/js/evt/engine.js` dengan `vm.runInContext`, panggil `await ctx.Evt.init()`, kembalikan `{ Evt: ctx.Evt, clock }`.

- [ ] **Step 2: Tulis test yang gagal**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEvt } from './harness.mjs';

const freeSeat = (Evt, ev) => Evt.allSeats(Evt.ev(ev)).find((s) => Evt.seatStatus(ev, s, null) === 'available');

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
```

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `node --test tools/tests/`
Expected: FAIL, `Evt.stressTest is not a function`

- [ ] **Step 4: Implementasi `stressTest` di `engine.js`**

Tolak dengan `EvtError('Pilih kursi yang masih tersedia untuk uji tekan.')` bila `seatStatus(evId, seat, null) !== 'available'`. Lalu `Promise.allSettled` atas `n` panggilan `A.holdSeat(evId, seat, 'UJI-' + i, { onConflict: () => conflicts++ })` yang dimulai dalam satu tick yang sama (jangan `await` di antaranya; semuanya berangkat dari versi yang sama). `winner` = cart dari satu-satunya hasil `fulfilled`. Setelah selesai, `await A.releaseCart(evId, winner)`. `log` berisi 4 baris ringkas: jumlah pembeli & versi awal, pemenang, jumlah ditolak + konflik 409, kursi dilepas kembali. Tambahkan `stressTest` ke `A`.

- [ ] **Step 5: Jalankan test, pastikan lulus**

Run: `node --test tools/tests/`
Expected: PASS 2/2

- [ ] **Step 6: UI di tab Denah kursi (pengelola)**

Di kartu "Uji anti double-booking" pada `kursi()`, tambahkan tombol kedua `id="stress"` berlabel "Uji tekan 25 pembeli". Kursi uji = `ui.seatSel` bila tersedia, kalau tidak kursi tersedia pertama. Hasil disimpan di `ui.race` (array log yang sudah dirender sebagai `<ol>`), dan baris pertama menyebut kursinya. Ikat di `bind()` mengikuti pola tombol `#race` yang sudah ada, dengan `act()` untuk menampilkan error.

- [ ] **Step 7: Verifikasi manual mode server**

Run: `python server.py 8765 127.0.0.1`, buka `/pengelola`, tab Denah kursi, klik "Uji tekan 25 pembeli".
Expected: log menyatakan 1 berhasil dan 24 ditolak. Kursi kembali "Tersedia" di denah.

- [ ] **Step 8: Dokumen + cache-buster + commit**

Tambah subbagian "Uji tekan 25 pembeli" di `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md`. Naikkan `?v=` di semua `app/*.html`. Tambah `node --test tools/tests/` ke bagian Commands di `CLAUDE.md` dan ubah kalimat "There are no tests" menjadi keterangan bahwa engine punya test Node.

```bash
git add tools/tests app/js/evt/engine.js app/js/views/event.js app/*.html docs/EVENT_TICKETING_Asumsi_Alur_Logika.md CLAUDE.md
git commit -m "Fitur: uji tekan 25 pembeli serentak dan harness test engine"
```

---

### Task 2: Uji check-in 2 gate serentak

**Files:**
- Modify: `app/js/evt/engine.js` (aksi baru `dualGateTest`)
- Modify: `app/js/views/event.js` (fungsi `checkin()`, `bind()`)
- Modify: `tools/tests/engine.test.mjs`, `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md`

**Interfaces:**
- Consumes: `loadEvt()` (Task 1)
- Produces: `Evt.dualGateTest(evId): Promise<{ ticket: string, results: [{ gate: string, result: 'VALID'|'USED'|'INVALID', reason: string }] }>`

- [ ] **Step 1: Tulis test yang gagal**

```js
test('2 gate memindai tiket yang sama bersamaan: 1 VALID + 1 USED', async () => {
  const { Evt } = await loadEvt();
  const r = await Evt.dualGateTest('EVT-01');
  assert.deepEqual(r.results.map((x) => x.result).sort(), ['USED', 'VALID']);
  assert.notEqual(r.results[0].gate, r.results[1].gate);
});

test('acara dengan 1 gate memakai label perangkat 2', async () => {
  const { Evt } = await loadEvt();
  // EVT-03 belum punya tiket, maka buat lewat EVT-01 dengan gate tunggal
  await Evt.updateEvent('EVT-01', { gates: ['Gate A (Lobby Utama)'] });
  const r = await Evt.dualGateTest('EVT-01');
  assert.ok(r.results.some((x) => x.gate === 'Gate A (Lobby Utama) (perangkat 2)'));
});

test('tanpa tiket belum check-in: ditolak dengan pesan jelas', async () => {
  const { Evt } = await loadEvt();
  await assert.rejects(Evt.dualGateTest('EVT-03'), /Tidak ada tiket aktif yang belum check-in/);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `node --test tools/tests/`
Expected: FAIL, `Evt.dualGateTest is not a function`

- [ ] **Step 3: Implementasi `dualGateTest(evId)`**

Pilih tiket pertama `ACTIVE` tanpa `checkedInAt` untuk `evId`. Kalau tidak ada, `fail('Tidak ada tiket aktif yang belum check-in untuk uji ini.')`. Gate = `e.gates[0]` dan `e.gates[1] || e.gates[0] + ' (perangkat 2)'`. Panggil `Promise.all([A.checkIn(qrText(tk), evId, g1), A.checkIn(qrText(tk), evId, g2)])` dalam tick yang sama.

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `node --test tools/tests/`
Expected: PASS semua

- [ ] **Step 5: UI di tab Check-in QR (pengelola)**

Di kolom kanan `checkin()`, tambah kartu `UI.h('Uji check-in serentak', 'Dua gate memindai QR yang sama pada detik yang sama', '', 'sync_lock')`, tombol `id="dual"` berlabel "Jalankan uji 2 gate", dan catatan kecil "Satu tiket contoh akan tercatat sudah check-in. Gunakan Reset untuk mengembalikan data." Hasil ditampilkan sebagai dua baris (gate, hasil berwarna `text-emerald-300`/`text-amber-300`, alasan). Hasil disimpan di `ui.dual` supaya bertahan saat `refresh()`.

- [ ] **Step 6: Dokumen + cache-buster + commit**

```bash
git add app/js/evt/engine.js app/js/views/event.js app/*.html tools/tests docs/EVENT_TICKETING_Asumsi_Alur_Logika.md
git commit -m "Fitur: uji check-in dua gate serentak"
```

---

### Task 3: Daftar tunggu dikabari otomatis

**Files:**
- Modify: `app/js/evt/engine.js` (`sweep`, `refund`, `cancel`, `cancelEvent`, `notifyWaitlist`, helper baru `wakeWaitlist`)
- Modify: `app/js/views/event.js` (fungsi `notif()`: label alasan)
- Modify: `tools/tests/engine.test.mjs`, `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md`

**Interfaces:**
- Consumes: `loadEvt()`, `clock` (Task 1)
- Produces: field entri waitlist baru `reason: 'refund' | 'kedaluwarsa' | 'batal' | 'acara-batal' | 'manual'`, terisi bersamaan dengan `notified`.

Aturan: saat sebuah pesanan melepas kursi/kuota (refund, pesanan menunggu bayar kedaluwarsa di `sweep`, pesanan dibatalkan lewat `cancel`), untuk setiap jenis tiket yang dilepas, kabari entri waitlist acara itu dengan jenis yang sama yang belum dikabari, urut `ts` terlama dulu, selama jumlah `qty` yang sudah dikabari masih kurang dari jumlah tiket jenis itu yang dilepas (entri pertama selalu dikabari). Saat `cancelEvent`, semua entri waitlist acara itu yang belum dikabari dikabari sekali dengan pesan pembatalan.

- [ ] **Step 1: Tulis test yang gagal**

```js
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
  await Evt.sendReminders('EVT-01'); // transaksi lain → sweep berjalan lagi
  assert.equal(Evt.s.outbox.filter((m) => m.to === 'a@example.com').length, sent);
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
```

Catatan: test kedaluwarsa bergantung pada pesanan seed `PENDING` jenis GLD dengan `until: t + 6 menit`. Penjualan EVT-01 harus tetap terbuka setelah `clock` maju 16 menit; `saleEnd` = mulai acara − 30 menit dengan mulai ≥ 1 jam lagi, jadi aman.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `node --test tools/tests/`
Expected: FAIL pada `reason` (`undefined`)

- [ ] **Step 3: Implementasi**

- `wakeWaitlist(d, o, reason, t): number` (internal) menjalankan aturan di atas, menulis `notified = t` dan `reason`, lalu mendorong pesan ke outbox lewat helper yang sama dengan `notifyWaitlist`. Pindahkan pembuat pesan waitlist yang ada ke helper `waitMsg(d, w, subject, body, t)` supaya dipakai bersama.
- Panggil `wakeWaitlist` di `sweep` (setelah `release` untuk pesanan yang menjadi `EXPIRED`, `reason 'kedaluwarsa'`), di `cancel` (`'batal'`), dan di `refund` (`'refund'`).
- `cancelEvent`: semua entri waitlist `ev === evId && !notified` → `reason 'acara-batal'`, pesan `Mohon maaf, ${e.name} dibatalkan. Pendaftaran daftar tunggu Anda kami tutup.`
- `notifyWaitlist` (tombol manual) mengisi `reason 'manual'`.

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `node --test tools/tests/`
Expected: PASS semua

- [ ] **Step 5: UI**

Di `notif()`, ganti teks `Dikabari HH:MM` menjadi `Dikabari HH:MM · <alasan>` dengan peta label `{ refund: 'refund', kedaluwarsa: 'pesanan kedaluwarsa', batal: 'pesanan batal', 'acara-batal': 'acara dibatalkan', manual: 'manual' }`. Entri lama tanpa `reason` tetap tampil tanpa alasan.

- [ ] **Step 6: Dokumen + cache-buster + commit**

```bash
git add app/js/evt/engine.js app/js/views/event.js app/*.html tools/tests docs/EVENT_TICKETING_Asumsi_Alur_Logika.md
git commit -m "Fitur: daftar tunggu dikabari otomatis saat kursi kembali tersedia"
```

---

### Task 4: Tab Keuangan & ROI (Finance & Marketing)

**Files:**
- Modify: `app/js/evt/engine.js` (konstanta `FIN_DEFAULT`, query baru `finance`, `fin` di seed EVT-03, ekspor)
- Modify: `app/js/views/event.js` (`TABS` kedua peran, fungsi baru `keuangan(e)`, `body()`, form `#f-ev` di `kelola()` + handler submit-nya, `bind()` untuk CSV)
- Modify: `tools/tests/engine.test.mjs`, `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md`

**Interfaces:**
- Consumes: `loadEvt()` (Task 1)
- Produces: `Evt.FIN_DEFAULT = { rent: 35000000, revShare: 0.10, cost: 12000000, spend: 150000 }`
- Produces: `Evt.finance(evId)` →
  ```
  { totals: { orders, gross, refunded, net, fee },
    byMethod: [{ method, orders, gross, refunded, net }],
    byType:   [{ type, name, qty, gross }],
    mismatches: [{ order, reason }],
    roi: { rent, revShare, share, cost, benefit, roi: number|null, attendees, basis: 'check-in'|'tiket terjual', tenantSpend } }
  ```

Definisi (dipakai apa adanya):
- `gross` = jumlah `total` pesanan berstatus `PAID` dan `REFUNDED`. `refunded` = jumlah `total` pesanan `REFUNDED`. `net = gross - refunded`. `fee` = jumlah `fee` pesanan `PAID`.
- `byType.gross` = harga per item dari `sub` pesanan dibagi rata ke item-nya (jangan pakai harga jenis tiket saat ini, karena bisa diubah setelah pembelian). Hanya pesanan `PAID`.
- `mismatches`: pesanan `PAID` dengan `tickets.length !== items.length`, atau `total !== sub + fee`, atau ada tiket yang tidak `ACTIVE`. Pesanan `REFUNDED` dengan tiket yang tidak `VOID`. `reason` berupa kalimat pendek.
- `fin = Object.assign({}, FIN_DEFAULT, e.fin)`. `share = round(net × revShare)`. `benefit = rent + share`. `roi = cost > 0 ? (benefit - cost) / cost : null`.
- `attendees` = jumlah tiket check-in bila acara sudah mulai (`e.start <= now()`), selain itu jumlah tiket aktif. `basis` sesuai. `tenantSpend = attendees × spend` (estimasi belanja di tenant, tidak masuk ROI).
- Seed EVT-03 (Summarecon Hall) diberi `fin: { rent: 20000000 }`.

Angka `FIN_DEFAULT` adalah asumsi demo dan perlu dikonfirmasi tim (lihat bagian akhir plan).

- [ ] **Step 1: Tulis test yang gagal**

```js
test('rekonsiliasi: neto = pendapatan lunas, tanpa selisih', async () => {
  const { Evt } = await loadEvt();
  const f = Evt.finance('EVT-01');
  assert.equal(f.totals.net, Evt.stats('EVT-01').revenue);
  assert.deepEqual(f.mismatches, []);
  assert.equal(f.byMethod.reduce((a, m) => a + m.net, 0), f.totals.net);
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

test('acara gratis dan biaya 0: tidak ada NaN, ROI null', async () => {
  const { Evt } = await loadEvt();
  await Evt.updateEvent('EVT-02', { fin: { cost: 0 } });
  const f = Evt.finance('EVT-02');
  assert.equal(f.totals.net, 0);
  assert.equal(f.roi.roi, null);
  assert.ok(Object.values(f.roi).every((v) => v === null || typeof v === 'string' || Number.isFinite(v)));
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `node --test tools/tests/`
Expected: FAIL, `Evt.finance is not a function`

- [ ] **Step 3: Implementasi `finance(evId)` di `engine.js`** sesuai definisi di atas, lalu ekspor `finance` dan `FIN_DEFAULT` lewat `window.Evt`.

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `node --test tools/tests/`
Expected: PASS semua

- [ ] **Step 5: UI tab "Keuangan & ROI"**

- Tambah `['keuangan', 'Keuangan & ROI', 'account_balance']` ke `TABS.pengelola` (setelah `peserta`) dan `TABS.mall` (setelah `peserta`). Daftarkan `keuangan` di peta pada `body()`.
- `keuangan(e)`:
  - Baris KPI (`UI.kpi`): Bruto, Refund, Neto, Biaya layanan, Selisih rekonsiliasi (`mismatches.length`; `text-emerald-300` bila 0, `text-rose-300` bila > 0).
  - Tabel "Rekonsiliasi per metode pembayaran": Metode, Transaksi, Bruto, Refund, Neto. Baris total di bawah. Bila ada `mismatches`, tampilkan daftarnya di bawah tabel.
  - Tabel "Laporan penjualan per kategori": Kategori (titik warna jenis tiket), Tiket, Pendapatan.
  - Kartu "ROI acara untuk mall": baris Sewa venue, Bagi hasil tiket (`revShare` dalam %), Total manfaat, Biaya operasional mall, ROI (`(roi × 100).toFixed(0) + '%'` atau `-`), lalu terpisah "Estimasi belanja pengunjung di tenant: <attendees> × Rp <spend>" dengan keterangan basis (check-in atau tiket terjual). Tulis rumus di subjudul kartu: "Manfaat = sewa venue + bagi hasil tiket. ROI = (manfaat − biaya) / biaya."
  - Tombol `id="csv-fin"` "Rekonsiliasi (CSV)" yang memanggil `Evt.csv('rekonsiliasi_' + e.id + '.csv', rows)` dengan kolom booking, metode, status, subtotal, biaya, total, waktu bayar, waktu refund.
- Di `kelola()`, tambah empat input di form `#f-ev` dengan judul kecil "Kontrak venue (sesuai perjanjian dengan mall)": `finRent` "Sewa venue (Rp)", `finShare` "Bagi hasil tiket ke mall (%)", `finCost` "Biaya operasional mall (Rp)", `finSpend` "Rata-rata belanja pengunjung di tenant (Rp)". Nilai awal dari `Object.assign({}, Evt.FIN_DEFAULT, e.fin)`. Handler submit `#f-ev` menyusun `patch.fin = { rent, revShare: finShare / 100, cost, spend }`.
- Command Center tetap read-only: tab ini tidak punya input.

- [ ] **Step 6: Verifikasi manual**

Buka `/pengelola` dan `/command-center#/event`, tab Keuangan & ROI di EVT-01 dan EVT-02. Lakukan satu refund di pengelola.
Expected: Neto turun sebesar total pesanan di kedua portal (sinkron), Selisih 0, EVT-02 menampilkan Rp 0 dan ROI sesuai, tidak ada `NaN`.

- [ ] **Step 7: Dokumen + cache-buster (+ Tailwind bila perlu) + commit**

```bash
git add app/js/evt/engine.js app/js/views/event.js app/*.html tools/tests docs/EVENT_TICKETING_Asumsi_Alur_Logika.md
git commit -m "Fitur: tab Keuangan & ROI dengan rekonsiliasi pembayaran"
```

---

### Task 5: Anomali gate menjadi tiket insiden P2 otomatis

**Files:**
- Modify: `app/js/evt/engine.js` (query `anomalies` pindah ke engine, aksi baru `claimAnomaly`, `claimReport`)
- Modify: `app/js/evt/checkin-ui.js` (`anomalies` mendelegasikan ke `Evt.anomalies`)
- Create: `app/js/evt/cc-bridge.js`
- Modify: `app/index.html` (muat `js/evt/cc-bridge.js?v=N` setelah `views/event.js`, sebelum `app.js`)
- Modify: `app/js/views/event.js` (`anomList()` peran mall: tampilkan chip tiket bila anomali sudah tertaut)
- Modify: `tools/tests/engine.test.mjs`, `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md`, `CLAUDE.md` (tabel entry page: tambah `evt/cc-bridge` di baris `/command-center`)

**Interfaces:**
- Consumes: `loadEvt()`, `clock` (Task 1). `Store.createTicket(o, quiet) → ticket` (`app/js/store.js:95`). `Evt.linkReport(id, ticketId)` (sudah ada).
- Produces: `Evt.anomalies(evId, mins = 10): [{ gate, n }]` (ambang `n >= 3`, hasil selain `VALID`). `EvtCheckin.anomalies` memanggil ini.
- Produces: `Evt.claimAnomaly(evId, gate, by): Promise<string|null>`: id laporan yang diklaim, atau `null`.
- Produces: `Evt.claimReport(reportId, by): Promise<string|null>`
- Field laporan baru: `auto: boolean`, `claimedBy: string|null`, `claimedAt: number|null`.

Aturan klaim (di dalam `tx`):
- `claimAnomaly`: hitung ulang `anomalies` di dalam transaksi. Bila gate itu tidak lagi anomali, kembalikan `null`. Cari laporan `ev + gate` dengan `ts` dalam 10 menit terakhir. Bila ada dan sudah `ticketId`, atau `claimedBy` dengan `claimedAt` kurang dari 60 detik lalu, kembalikan `null`. Bila ada dan bisa diklaim, isi `claimedBy`/`claimedAt` dan kembalikan id-nya. Bila tidak ada, buat laporan `{ id: 'GR-' + rand(4), ts: t, ev, gate, text: 'Otomatis: ' + n + ' pindaian gagal/duplikat dalam 10 menit di ' + gate + '.', auto: true, claimedBy: by, claimedAt: t, ticketId: null }`.
- `claimReport`: laporan tanpa `ticketId` yang belum diklaim, atau klaimnya lebih dari 60 detik → klaim. Selain itu `null`.

- [ ] **Step 1: Tulis test yang gagal**

```js
const fail3 = async (Evt) => { for (let i = 0; i < 3; i++) await Evt.checkIn('QR-PALSU', 'EVT-01', 'Gate B (Sisi Food Court)'); };

test('3 pindaian gagal: hanya satu CC yang berhasil mengklaim', async () => {
  const { Evt } = await loadEvt();
  await fail3(Evt);
  assert.deepEqual(Evt.anomalies('EVT-01').map((a) => a.gate), ['Gate B (Sisi Food Court)']);
  const [a, b] = await Promise.all([Evt.claimAnomaly('EVT-01', 'Gate B (Sisi Food Court)', 'CC-1'), Evt.claimAnomaly('EVT-01', 'Gate B (Sisi Food Court)', 'CC-2')]);
  assert.equal([a, b].filter(Boolean).length, 1);
  assert.equal(Evt.s.reports.filter((r) => r.auto).length, 1);
});

test('klaim menggantung > 60 detik bisa diambil alih, yang sudah tertaut tidak', async () => {
  const { Evt, clock } = await loadEvt();
  await fail3(Evt);
  const id = await Evt.claimAnomaly('EVT-01', 'Gate B (Sisi Food Court)', 'CC-1');
  clock.now += 61000;
  assert.equal(await Evt.claimAnomaly('EVT-01', 'Gate B (Sisi Food Court)', 'CC-2'), id);
  await Evt.linkReport(id, 'TCK-999');
  assert.equal(await Evt.claimReport(id, 'CC-3'), null);
});

test('2 pindaian gagal belum anomali', async () => {
  const { Evt, clock } = await loadEvt();
  clock.now += 11 * 60000; // pindaian gagal dari seed keluar dari jendela 10 menit
  await Evt.checkIn('QR-PALSU', 'EVT-01', 'Gate B (Sisi Food Court)');
  await Evt.checkIn('QR-PALSU', 'EVT-01', 'Gate B (Sisi Food Court)');
  assert.equal(await Evt.claimAnomaly('EVT-01', 'Gate B (Sisi Food Court)', 'CC-1'), null);
});
```

Catatan: data seed berisi 1 pindaian `INVALID` di Gate A (9 menit lalu) dan 1 `USED` di Gate B (4 menit lalu). Karena itu test ketiga memajukan jam 11 menit dulu, supaya hanya 2 kegagalan yang dihitung.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `node --test tools/tests/`
Expected: FAIL, `Evt.anomalies is not a function`

- [ ] **Step 3: Implementasi engine**

Pindahkan isi `anomalies` dari `checkin-ui.js` ke engine sebagai fungsi yang menerima state (`anomaliesIn(d, evId, mins, t)`) supaya bisa dipakai di dalam `tx`. Ekspor `anomalies(evId, mins)` versi baca. Ubah `EvtCheckin.anomalies` menjadi `(evId, mins) => E.anomalies(evId, mins)`. Tambah `claimAnomaly` dan `claimReport` ke `A`.

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `node --test tools/tests/`
Expected: PASS semua

- [ ] **Step 5: `app/js/evt/cc-bridge.js`**

IIFE yang:
- Membuat id browser CC sekali: `localStorage['smicc-cc-id']` = `'CC-' + acak 5 karakter`.
- `Evt.init().then(() => { Evt.subscribe(check); check(); })` serta `setInterval(check, 5000)` supaya anomali tetap terdeteksi saat tidak ada perubahan state.
- `check()` dijaga flag `busy`. Untuk setiap acara yang tidak `DRAFT` dan tidak `CANCELLED`: (a) setiap `Evt.anomalies(e.id)` → `claimAnomaly`; (b) setiap laporan `ev === e.id`, tanpa `ticketId`, `ts` dalam 30 menit terakhir → `claimReport`. Untuk setiap id yang berhasil diklaim, panggil `Store.createTicket({ title: 'Indikasi tiket palsu/calo di ' + gate, desc: report.text + ' Acara ' + e.name + '.', sop: 'SOP-EVT-03', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: 'GF', location: gate + ' · ' + e.venue.split(',')[0], source: 'Otomatis: anomali check-in (DB-EVT)', cam: 'CAM-01', team: 'Regu Bravo', fromDb: 'EVT' })`, lalu `Evt.linkReport(id, t.id)` dan `UI.toast('Tiket insiden ' + t.id + ' dibuat otomatis untuk ' + gate, 'P2')`. Error ditangkap dan dicatat ke `console.warn` saja.
- Nilai tiket sama dengan `incident()` yang sudah ada di `views/event.js`. Ekstrak objek ini ke satu fungsi bersama (misalnya `EvtAdmin.incidentFields(e, gate, text)`, diekspor dari `views/event.js`) supaya tombol manual dan bridge tidak menyimpan dua salinan.

- [ ] **Step 6: UI peran mall**

Di `anomList()`, untuk peran mall: bila ada laporan gate itu dengan `ticketId`, tampilkan tautan chip `#/ticketing?id=<ticketId>` sebagai ganti tombol "Buat tiket insiden". Bila laporan sudah diklaim tetapi belum tertaut, tampilkan teks `text-amber-300` "Sedang dibuat otomatis". Tombol manual tetap ada untuk kasus lain sebagai cadangan.

- [ ] **Step 7: Verifikasi manual mode server**

Jalankan `python server.py 8765 127.0.0.1`. Buka `/command-center` (tab mana saja) dan `/checkin` di tab lain. Di checkin, pindai demo "QR palsu" 3 kali di gate yang sama.
Expected: dalam ≤ 5 detik muncul toast dan tiket P2 baru (SOP-EVT-03) di Tiket & Insiden. Di `/pengelola`, anomali menampilkan "Ditangani TCK-…". Buka CC di browser kedua: tidak ada tiket kedua untuk anomali yang sama.

- [ ] **Step 8: Dokumen + cache-buster + commit**

Catat di `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md`: aturan klaim, batas 60 detik, dan keterbatasannya (tiket insiden hanya ada di localStorage browser CC yang mengklaim; browser CC lain hanya melihat nomor tiketnya).

```bash
git add app/js/evt app/js/views/event.js app/index.html app/*.html tools/tests docs/EVENT_TICKETING_Asumsi_Alur_Logika.md CLAUDE.md
git commit -m "Fitur: anomali gate otomatis menjadi tiket insiden P2 di Command Center"
```

---

## Keputusan yang perlu dikonfirmasi

- Angka asumsi `FIN_DEFAULT` (sewa atrium Rp 35 jt, Hall Rp 20 jt, bagi hasil 10%, biaya operasional Rp 12 jt, belanja tenant Rp 150 rb per pengunjung). Angka ini tidak ada di deck.
- Harness test Node (`tools/tests/`) menambah keharusan Node ≥ 20 untuk menjalankan test. Aplikasinya sendiri tetap tanpa Node.
- Uji 2 gate memakai tiket seed yang benar-benar tercatat check-in (bisa dikembalikan dengan Reset).
- Demo "bayar dua kali" tidak dibuat. Idempotensi sudah ada di kode (`pay()` → `'ALREADY'`) dan deck tidak menjanjikan demonya.
