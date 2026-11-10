# Rencana perbaikan UI/UX konsol pengelola (`/pengelola`)

| | |
|---|---|
| Status | Tahap P0 (1 sampai 4) dikerjakan 2026-11-11. P1 (tahap 5 sampai 8) belum |
| Tanggal | 2026-11-11 |
| Menggantikan | Draf v2 (rujukan file lama `app/js/views/event.js`, `server.py`, router `#/`) |
| Acuan | [rewrite/PRD.md](rewrite/PRD.md) bagian 6, [rewrite/DESIGN.md](rewrite/DESIGN.md), `docs/PANDUAN_Teks_UI.md` |

Tujuan: panitia acara (EO) langsung tahu sedang mengelola acara apa, apa yang harus dikerjakan
sekarang, dan bisa menyelesaikannya tanpa mencari tombol. Perubahan terbesar: baris 8 tab diganti
**sidebar kiri**.

Yang tidak berubah: logika CAS, hold kursi, validasi QR, guard server, dan mode read-only yang
dipakai Command Center (`EvtAdmin.mount(el, 'mall')`).

---

## 1. Kondisi sekarang

Hasil membaca `app/js/event/admin.js`, `app/pages/pengelola.html`, dan mencoba konsol di 1280 px
setelah login `pengelola@example.com`.

### Navigasi dan konteks

- Delapan tab sejajar dalam satu baris (`TABS` di `admin.js`): Daftar acara (lintas acara) bercampur
  dengan tujuh tab milik satu acara. Acara yang sedang dibuka hanya terlihat dari chip pemilih kecil.
- Tab dan acara aktif hanya disimpan di variabel `ui`. Refresh kembali ke Daftar acara, tombol Back
  browser tidak bekerja, dan tidak ada tautan langsung ke satu transaksi.
- Baris atas berisi info teknis ("Server LAN", "Versi data 4", chip "Event Organizer, kendali penuh")
  dan tombol Reset sejajar dengan tombol kerja.
- Header menulis "Panitia Acara · Petugas acara (EO)" tetap, padahal sekarang login memakai akun.

### Daftar acara

- 27 baris, masing-masing 4 tombol (Kelola, Portal, Batalkan, Hapus). Tidak ada cari atau saring.
- Hapus selalu tampil, termasuk untuk acara yang sudah terjual; pengguna baru tahu ditolak setelah klik.
- Kolom Pendapatan menulis "Gratis" untuk acara berbayar yang belum laku (EVT-03, EVT-17, EVT-25),
  karena `rp(0)` di engine selalu menghasilkan "Gratis".
- Pengelola melihat semua acara, termasuk milik 16 penyelenggara lain. PRD bagian 6 meminta hanya acara
  milik penyelenggaranya.

### Alur kerja

- Buat acara: modal 6 field, lalu acara jadi draft tanpa panduan apa yang wajib dilengkapi.
- Publikasikan langsung mengubah status tanpa pemeriksaan (periode jual, harga, gate).
- Tab Kelola: satu form panjang plus satu form per jenis tiket, 4 sampai 5 tombol Simpan di satu
  layar. Perubahan yang belum disimpan hilang tanpa peringatan saat pindah tab.
- Status bisa diubah lewat dropdown di form dan lewat tombol di Daftar acara (dua jalan, dan acara
  yang sudah terjual bisa dikembalikan ke Draft).
- Batalkan acara, refund, hapus, reset, dan kirim pengingat memakai `prompt()`/`confirm()` bawaan
  browser.
- Alat demo (uji rebutan kursi, uji tekan 25 pembeli, uji 2 gate, Reset) bercampur dengan fitur
  operasional.

### Tampilan

- Hal yang perlu ditindaklanjuti (anomali gate, pesanan menunggu bayar, selisih rekonsiliasi) tersebar
  di tab berbeda, tidak dikumpulkan di satu tempat.
- Warna hex ditulis langsung di `admin.js` (`EV_ST`, `O_ST`, gradien header acara).
- Tabel lebar tanpa versi ponsel; modal transaksi `grid-cols-2` tanpa breakpoint.
- Setiap perubahan state menggambar ulang seluruh view: fokus keyboard dan posisi scroll tabel hilang.

## 2. Prinsip

1. Dua tingkat: **Semua acara**, lalu **ruang kerja satu acara**. Nama dan status acara selalu terlihat.
2. Satu tindakan utama per layar, mengikuti status acara (draft: lengkapi lalu publikasikan; dijual:
   pantau; hari H: check-in; selesai: rekonsiliasi).
3. Yang perlu ditindaklanjuti tampil paling atas dan sebagai badge di sidebar.
4. Status acara hanya berubah lewat tombol aksi yang memeriksa kesiapan, bukan dropdown.
5. Aksi berisiko memakai dialog bertema yang menyebut dampaknya dalam angka.
6. Alat demo dipisah dari pekerjaan sehari-hari.
7. Konsol memakai token gelap turunan DESIGN.md (`ink`, `primary`, warna status, plat lantai), sama
   dengan portal pengunjung, sehingga ketiga portal terasa satu sistem.

## 3. Arsitektur informasi

URL bersih memakai `app/js/core/router.js` yang sudah dipakai Command Center dan portal pengunjung:

```
/pengelola                               → /pengelola/acara
/pengelola/acara                         Semua acara (lintas acara)
/pengelola/e/EVT-01/ringkasan            Ruang kerja acara
/pengelola/e/EVT-01/pengaturan/info      ├ Pengaturan: info, jadwal, tiket, denah, gate, kontrak
/pengelola/e/EVT-01/peserta?o=BK-XXXX    ├ Peserta & transaksi (detail pesanan bisa ditautkan)
/pengelola/e/EVT-01/checkin              ├ Check-in & gate
/pengelola/e/EVT-01/komunikasi           ├ Notifikasi, pengingat, daftar tunggu
/pengelola/e/EVT-01/keuangan             └ Keuangan & ROI
```

| Sekarang | Baru | Alasan |
|---|---|---|
| Baris 8 tab + chip pemilih acara | Sidebar: Semua acara, pemilih acara, menu per acara | Konteks acara selalu terlihat |
| Kelola acara + Denah kursi (blokir) | Pengaturan dengan 6 sub-bagian | Semua yang mengubah konfigurasi di satu tempat |
| Ringkasan | Ringkasan + blok "Perlu tindakan" | Hal mendesak di atas |
| Check-in QR | Check-in & gate | Anomali, kehadiran per gate, log; pemindai tetap ada |
| Notifikasi & daftar tunggu | Komunikasi | Nama lebih pendek, isi sama |
| Uji rebutan, uji tekan, uji 2 gate, Reset | Panel "Alat demo" di kaki sidebar | Dipisah dari pekerjaan sehari-hari |

### Sidebar

```
┌──────────────────────────────┐
│ [▣] Konsol Pengelola      «  │  identitas + tombol ciutkan
│ ──────────────────────────── │
│ ▤ Semua acara           12   │  tingkat 1 (jumlah acara)
│ ＋ Acara baru                │
│ ──────────────────────────── │
│ ┌──────────────────────────┐ │
│ │▌[GF] Konser Akustik    ▾ │ │  pemilih acara: plat lantai, nama,
│ │  Rab, 11 Nov · Dijual    │ │  tanggal & status; ▾ membuka daftar + cari
│ └──────────────────────────┘ │
│ ◔ Ringkasan              3   │  badge = jumlah "Perlu tindakan"
│ ⚙ Pengaturan                 │  sub-menu terbuka saat aktif
│   · Info acara               │
│   · Jadwal & penjualan       │
│   · Tiket & harga            │
│   · Denah kursi              │
│   · Gate                     │
│   · Kontrak venue            │
│ 👥 Peserta & transaksi    2   │  badge = pesanan menunggu bayar
│ ▣ Check-in & gate        1   │  badge merah = anomali/laporan terbuka
│ ✉ Komunikasi             5   │  badge = daftar tunggu belum dikabari
│ ₨ Keuangan & ROI             │  badge merah bila ada selisih rekonsiliasi
│ ──────────────────────────── │
│ ↗ Lihat di portal pengunjung │  tab baru, langsung ke detail acara
│ ▢ Pemindai di ponsel         │  QR menuju /checkin
│ ⚗ Alat demo              ▸   │  lipat: uji rebutan, uji tekan, uji 2 gate, reset
│ ──────────────────────────── │
│ (TE) Tim Event Summarecon    │  akun yang login + Keluar
│ ● Tersambung · data v4       │  status koneksi, kecil
└──────────────────────────────┘
```

Aturan:

- Lebar 272 px, bisa diciutkan ke 72 px (ikon + tooltip). Pilihan disimpan di
  `localStorage['smicc-pengelola-nav']` (dibungkus try/catch). Default terbuka di ≥ 1280 px, ciut di
  1024 sampai 1279 px.
- Di bawah 1024 px sidebar menjadi drawer dari kiri: tombol menu di header, latar `.scrim`, tertutup
  saat memilih menu, Esc, atau klik latar. Fokus masuk ke drawer saat terbuka dan kembali ke tombol
  menu saat tertutup.
- Di bawah 768 px ada bar bawah menempel: Ringkasan, Peserta, Check-in, Lainnya (membuka drawer). Pola
  sama dengan navigasi bawah portal pengunjung.
- Menu memakai `<a href>` agar bisa dibuka di tab baru dan ikut tombol Back. `<nav aria-label="Navigasi
  konsol">`, item aktif `aria-current="page"`, sub-menu `aria-expanded`.
- Badge hanya tampil bila > 0: merah untuk masalah, abu-abu untuk hitungan biasa. Angkanya dari satu
  fungsi `attention(e)` yang juga mengisi blok "Perlu tindakan".
- Pemilih acara hanya berisi acara milik penyelenggara akun yang login (lihat keputusan 1). Saat berada
  di Semua acara, menu per acara tetap menampilkan acara terakhir yang dibuka.
- Command Center tidak memakai sidebar ini (sudah punya sidebar sendiri); di sana `admin.js` tetap
  memakai baris tab read-only seperti sekarang.

### Ruang kerja acara (desktop)

```
┌ header: ☰ (≤1023) · judul halaman · tema ───────────────────────────────────────────────┐
├─────────────────┬───────────────────────────────────────────────────────────────────────┤
│ SIDEBAR         │ ▌Konser Akustik "Senja di Bandung"   [Dipublikasikan] [Penjualan dibuka]│
│                 │  Rab, 11 Nov · 03.00 WIB · [GF] Main Atrium                            │
│                 │                     [Lihat di portal]  [Tutup penjualan ▾]  ← menempel │
│                 ├───────────────────────────────────────────────────────────────────────┤
│                 │ Perlu tindakan (3)                                                    │
│                 │  ! 2 pindaian gagal di Gate A (ambang 3)           [Lihat gate]       │
│                 │  ! 4 pesanan menunggu bayar, 1 habis 3 menit       [Lihat]            │
│                 │  ! Selisih rekonsiliasi 1 pesanan                  [Periksa]          │
│                 ├──────────────┬──────────────┬──────────────┬──────────────┐           │
│                 │ Terjual 55%  │ Pendapatan   │ Kehadiran    │ Sedang dipesan│ 4 KPI     │
│                 ├──────────────┴──────────────┴──────────────┴──────────────┘           │
│                 │ Ketersediaan per kategori      │ Denah mini (pantau)                  │
│                 │ Penjualan 14 hari │ Check-in per 15 menit │ Transaksi terbaru          │
└─────────────────┴───────────────────────────────────────────────────────────────────────┘
```

Tombol aksi utama mengikuti status: Draft "Publikasikan", Dipublikasikan "Tutup penjualan",
Ditutup "Buka lagi penjualan". Batalkan acara dan Hapus ada di menu `▾`.

### Semua acara

```
Acara saya (12)                                                          [+ Acara baru]
[Cari nama atau ID ]  (Semua) (Draft) (Dijual) (Ditutup) (Selesai) (Dibatalkan)
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ▌Konser Akustik "Senja…"  [GF] Main Atrium  Rab 11 Nov  Dijual  208/376 ▓▓▓░  Rp62 jt │
│   Langkah berikutnya: pantau check-in (hari H)                       [Buka]  [⋯]   │
│ ▌Talkshow Hall Lt. 3      [L3] Summarecon Hall  5 Des   Draft   3 dari 5 siap        │
│   Langkah berikutnya: atur harga tiket                           [Lanjutkan]  [⋯]   │
└────────────────────────────────────────────────────────────────────────────────────┘
```

- Satu tombol utama per baris; Portal, Batalkan, Hapus pindah ke menu `⋯`. Hapus nonaktif dengan
  alasan bila acara punya pesanan lunas atau menunggu bayar.
- Pendapatan 0 ditulis "Rp0" (atau "Belum ada penjualan"); "Gratis" hanya untuk acara yang semua
  tiketnya gratis.
- Ponsel: tiap acara menjadi kartu (nama, plat lantai, tanggal, status, bar terjual, satu tombol).

## 4. Alur utama

### A. Buat dan publikasikan acara

```
Semua acara → [Acara baru]
  1 Dasar     nama, kategori, templat venue, tanggal mulai
  2 Jadwal    gate dibuka, periode jual (nilai awal dihitung otomatis)
  3 Tiket     harga & fasilitas per kategori dari templat, maks per pesanan
  4 Tinjau    daftar periksa kesiapan, pratinjau kartu acara seperti di portal
       ├ [Simpan sebagai draft] → Pengaturan
       └ [Publikasikan]          → Ringkasan + toast berisi tautan portal
```

Daftar periksa kesiapan, dipakai wizard, daftar acara ("3 dari 5 siap"), dan tombol Publikasikan:

| Cek | Aturan |
|---|---|
| Jadwal | `doors < start`, `start > sekarang` |
| Periode jual | `saleStart < saleEnd <= start` |
| Tiket | minimal satu kategori dijual dengan kuota atau kursi > 0, harga ≥ 0 |
| Gate | minimal satu gate |
| Foto & deskripsi | ada (peringatan, tidak memblokir) |

### B. Siklus status

```
DRAFT ──Publikasikan (cek kesiapan)──▶ PUBLISHED ──Tutup penjualan──▶ CLOSED
  │                                      ▲   │                          │
  └──Hapus                               └───┼──Buka lagi penjualan─────┘
                                             └──Batalkan acara──▶ CANCELLED (final, refund otomatis)
```

Kembali ke Draft hanya bila belum ada pesanan. Dropdown status di form dihapus. Aturan transisi
ditulis di engine (`Evt.setStatus`) agar konsol, Command Center, dan tes memakai aturan yang sama.

### C. Pengaturan

- Setiap sub-bagian satu form dengan satu tombol "Simpan perubahan" yang menempel di bawah, aktif hanya
  bila ada perubahan.
- Validasi di bawah field (pola yang sama dengan form data diri portal pengunjung), sebelum submit.
- Pindah menu atau menutup halaman dengan perubahan belum disimpan memunculkan dialog "Buang perubahan?".
- Bila acara diubah perangkat lain saat form terbuka: strip "Data acara ini diubah di perangkat lain.
  [Muat ulang]".
- Denah: pilih banyak kursi (klik atau seret), lalu "Blokir 6 kursi" dalam satu transaksi, dengan toast
  "Urungkan" 8 detik.

### D. Peserta dan transaksi

- Chip status dengan jumlah (`Lunas 182`, `Menunggu bayar 4`), cari nama/email/kode, 50 baris per
  halaman.
- Baris bisa difokus dan dibuka dengan Enter. Detail terbuka di panel samping (desktop) atau layar
  penuh (ponsel), URL `?o=BK-XXXX`.
- Refund membuka dialog dengan alasan wajib, nominal, dan kursi yang dilepas.

### E. Hari H

- Check-in & gate berurutan: anomali dan laporan (merah, paling atas), kehadiran per gate, log pindaian.
- Pemindai di konsol dilipat; "Pemindai di ponsel" menampilkan QR menuju `/checkin` untuk akun
  `gate@example.com`.
- Antara `doors - 2 jam` dan `start + 6 jam`, header acara diberi label "Hari H" dan Ringkasan
  menampilkan kartu kehadiran paling atas.

### F. Aksi berisiko

Komponen `UI.confirm({ title, impact: [[label, nilai]], confirmText, danger, typeToConfirm })`
mengembalikan Promise dan menggantikan semua `prompt()`/`confirm()` di konsol:

| Aksi | Dampak yang ditampilkan | Pengaman |
|---|---|---|
| Batalkan acara | pesanan lunas, total refund, menunggu bayar, daftar tunggu | alasan wajib, ketik ID acara |
| Hapus acara | denah, log check-in, notifikasi ikut terhapus | hanya tanpa pesanan aktif |
| Refund | nominal, kursi dilepas, peserta yang dikabari | alasan wajib |
| Kirim pengingat | jumlah penerima per kanal | konfirmasi biasa |
| Reset data demo | semua perangkat terdampak | ketik `RESET` |

## 5. Mekanisme teknis

| Bagian | Rancangan | File |
|---|---|---|
| Rute | `'/pengelola'` di `PAGES` jadi `spa: true`. Router: `Router.on` → `parse()` menjadi `{ view, ev, sub, o }`. Uji `server.test.mjs` yang mengharapkan 404 untuk `/pengelola/apa-saja` diganti. | `server/config.js`, `app/js/event/admin.js`, `tests/server.test.mjs` |
| Kerangka | `pengelola.html` mendapat `<aside id="nav">` + `<main>`; `core/router.js` dimuat di `<head>` dengan `<html data-base="/pengelola">`. | `app/pages/pengelola.html` |
| Sidebar | Fungsi `sidebar()` di `admin.js`, hanya peran `pengelola`. Dirender ke region sendiri agar badge segar tanpa menggambar ulang area kerja. Akun dari `/api/auth/me` (tambah `name` & `email` di respons). | `admin.js`, `server/app.js`, `app/css/app.css` |
| Render per region | `#evt-head`, `#evt-attn`, `#evt-body`; `refresh()` hanya mengganti region yang berubah, simpan fokus dan scroll tabel. | `admin.js` |
| Perlu tindakan | `attention(e)` mengumpulkan anomali gate, laporan belum ditangani, PENDING yang hampir habis, selisih rekonsiliasi, kesiapan draft. | `admin.js` |
| Status & kesiapan | `Evt.setStatus(evId, next)` dengan tabel transisi, `Evt.readiness(e)`. `updateEvent` tidak lagi menerima `status`. | `app/js/event/engine.js` |
| Validasi | `validateEvent(patch)` di engine, dipakai form (inline) dan `updateEvent`. | `engine.js`, `admin.js` |
| Blokir massal | `Evt.setBlocked(evId, seats, blocked)` dalam satu `tx`, menolak kursi SOLD/HELD. | `engine.js` |
| Dialog & toast | `UI.confirm()`, toast dengan aksi (Urungkan), gaya toast sama dengan portal pengunjung. | `app/js/core/ui.js` |
| Kepemilikan acara | `events[id].org` sudah ada di data contoh. Saring daftar dan pemilih acara menurut organizer akun (keputusan 1). Guard server belum memeriksa kepemilikan (PRD menaruhnya di versi baru). | `admin.js`, `server/config.js` |
| Warna | Ganti hex di `EV_ST`, `O_ST`, gradien header dengan token status dan strip warna area 4 px. | `admin.js`, `app.css` |
| Pendapatan 0 | Fungsi format uang sendiri di konsol: `Rp0` untuk 0, "Gratis" hanya untuk harga tiket. | `admin.js` |

Guard server tidak berubah: semua aksi baru dijalankan peran `pengelola`, yang memang boleh mengubah
apa saja. Setiap tahap tetap dicek di Command Center (`/command-center/event`) agar mode read-only tidak
mendapat tombol baru.

## 6. Tahapan dan prioritas

Demo Day 15 Nov. Tahap P0 cukup untuk demo dan bisa selesai sebelum titik keputusan 13 Nov di PRD;
sisanya P1.

| Tahap | Isi | Prioritas | Perkiraan |
|---|---|---|---|
| 1. Rute & sidebar | URL bersih, sidebar (pemilih acara, menu, badge, ciutkan, drawer, bar bawah ponsel), header acara menempel dengan aksi utama per status, akun di sidebar | P0 | 1 hari |
| 2. Semua acara | Cari & saring, satu tombol utama + menu `⋯`, kartu di ponsel, perbaikan "Gratis", saring per penyelenggara | P0 | 0,5 hari |
| 3. Ringkasan | Blok "Perlu tindakan", 4 KPI, render per region | P0 | 0,5 hari |
| 4. Aksi berisiko & alat demo | `UI.confirm`, ganti semua `prompt`/`confirm`, pindahkan alat demo ke kaki sidebar | P0 | 0,5 hari |
| 5. Pengaturan | Pecah form Kelola ke 6 sub-bagian, satu tombol simpan, validasi inline, penjaga form kotor, blokir massal + Urungkan | P1 | 1,5 hari |
| 6. Buat & publikasi | Wizard 4 langkah, `readiness`, `setStatus` + tes engine | P1 | 1 hari |
| 7. Peserta & komunikasi | Chip berjumlah, pagination, panel transaksi bertaut URL, dialog refund | P1 | 1 hari |
| 8. Rapi | Token warna, 375 px tanpa gulir horizontal, keyboard di tabel, target sentuh 44 px | P1 | 0,5 hari |

P0 sekitar 2,5 hari, P1 sekitar 4 hari. Setiap tahap di-commit dan diuji sendiri; naikkan `?v=` di
semua halaman pada setiap perubahan JS/CSS.

## 7. Verifikasi

- `npm test` lolos, ditambah tes untuk transisi status, kesiapan, dan blokir massal (tahap 5 dan 6).
- Uji di browser, 1280 px dan 375 px, mode gelap dan terang:
  1. Login `pengelola@example.com` → `/pengelola/acara`, hanya acara milik penyelenggara itu.
  2. Buka acara lewat pemilih di sidebar; refresh tetap di acara dan menu yang sama; Back berpindah menu.
  3. Beli tiket di `/pengunjung` di tab lain: badge Peserta dan KPI Ringkasan berubah tanpa reload dan
     tanpa kehilangan scroll.
  4. Tiga pindaian gagal di `/checkin` (akun `gate@example.com`): badge merah di Check-in & gate dan
     baris di "Perlu tindakan".
  5. Batalkan acara dan refund lewat dialog baru; tidak ada lagi dialog bawaan browser.
  6. Sidebar ciut lalu refresh (tetap ciut); drawer di 900 px bisa dibuka/ditutup dengan keyboard dan
     Esc; bar bawah tampil di 375 px.
- `/command-center/event`: tidak ada sidebar kedua, wizard, menu `⋯`, atau alat demo.
- `grep -nE "#[0-9a-fA-F]{6}" app/js/event/admin.js` kosong, kecuali warna yang berasal dari data acara.

## 8. Keputusan

Disepakati 2026-11-11:

- Keputusan 1: pengelola melihat **semua** acara (tanpa saring per penyelenggara). Semua portal memakai satu
  data, jadi acara yang dibuat dan dipublikasikan di konsol langsung tampil di portal pengunjung dan Command Center.
- Keputusan 2: dikerjakan di versi sekarang.

Catatan implementasi P0: Pengaturan masih satu form (pecah 6 sub-bagian = tahap 5); kesiapan dan aturan status
ada di `admin.js` (`readiness`, `setStatus`), belum di engine (tahap 6); detail transaksi belum bertaut `?o=`.

Usulan awal:

1. **Kepemilikan acara.** Akun pengelola demo (Tim Event Summarecon Mall Bandung) hanya melihat
   EVT-01 sampai EVT-12 sesuai PRD, atau tetap melihat semua 27 acara agar demo lebih ramai? Usulan:
   saring per penyelenggara, dengan tambahan akun pengelola kedua untuk menunjukkan pemisahan.
2. **Versi lama atau versi baru.** PRD merencanakan repo baru (Next.js + Supabase) dengan keputusan
   pindah pada 13 Nov. Rencana ini menyasar versi yang sekarang; arsitektur informasi dan sidebar-nya
   bisa dipakai ulang di versi baru. Usulan: kerjakan P0 di versi sekarang karena versi ini yang pasti
   dipakai demo bila rewrite belum lolos.
3. **Kontrak venue** (sewa, bagi hasil, biaya mall) secara bisnis milik mall. Usulan: tetap di
   Pengaturan pengelola untuk sekarang; pindah ke Command Center di versi baru.
4. **Alat demo** tampil secara default selama masa pitching, disembunyikan setelahnya.
5. **Wizard buat acara** (P1) atau cukup modal ringkas + daftar periksa di Pengaturan. Usulan: wizard,
   karena membuat dan mempublikasikan acara adalah alur utama EO.
