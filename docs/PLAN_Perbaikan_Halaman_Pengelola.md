# Rencana perbaikan halaman pengelola (`/pengelola`)

Cakupan: UI/UX, user flow, dan mekanisme konsol pengelola acara (Event Organizer). File utama
`app/js/views/event.js` (dipakai bersama Command Center dalam mode read-only), `app/pengelola.html`,
`app/js/ui.js`, dan sedikit `app/js/evt/engine.js`.

Tema "Papan Petunjuk", panduan teks (`docs/PANDUAN_Teks_UI.md`), dan aturan offline tetap berlaku.
Logika CAS, hold kursi, dan validasi QR tidak diubah.

## 1. Kondisi sekarang (hasil baca kode)

### Struktur dan navigasi

- Delapan tab sejajar dalam satu baris: satu tab lintas acara (Daftar acara) bercampur dengan
  tujuh tab per acara. Pemilih acara (chip `EVT-01 · Nama…`) baru muncul di bawah tab saat tab per
  acara dibuka, jadi konteks "saya sedang mengelola acara apa" tidak jelas.
- State tab dan acara hanya ada di variabel `ui`. Refresh halaman kembali ke Daftar acara, tombol
  Back browser tidak bekerja, dan tidak ada tautan langsung ke transaksi atau tab tertentu.
- Pagebar menampilkan info teknis ("Server LAN", "Versi data 123", chip "Event Organizer, kendali
  penuh") yang tidak dibutuhkan EO.
- Alat demo (uji rebutan kursi, uji tekan 25 pembeli, uji check-in 2 gate, Reset) berada di tengah
  layar operasional, sejajar dengan fitur sungguhan.

### Alur kerja

- Buat acara: modal berisi 6 field, lalu acara jadi draft dan pengguna dilempar ke tab Kelola.
  Tidak ada panduan apa saja yang wajib dilengkapi sebelum publish.
- Publikasikan: tombol di Daftar acara langsung mengubah status tanpa pemeriksaan (periode jual,
  harga, gate, jadwal bisa saja belum masuk akal).
- Tab Kelola: satu form panjang (info, jadwal, periode jual, aturan pesanan, gate, deskripsi,
  kontrak venue) plus satu form per jenis tiket, masing-masing dengan tombol simpan sendiri. Ada
  4 sampai 5 tombol "Simpan" di satu layar, dan perubahan yang belum disimpan hilang tanpa
  peringatan saat pindah tab.
- Status acara diubah lewat dropdown di form (Draft, Dipublikasikan, Ditutup), terpisah dari
  tombol Publikasikan di Daftar acara. Dua jalan untuk hal yang sama, dan acara yang sudah terjual
  bisa dikembalikan ke Draft.
- Validasi hanya lewat toast setelah submit, dan hanya dua aturan (penjualan tutup > buka, gate
  dibuka < mulai). Penjualan ditutup setelah acara mulai, atau harga negatif lewat input, tidak
  dicegah dengan pesan di field.
- Jenis tiket tidak bisa ditambah atau dihapus (engine tidak punya API-nya), hanya diubah.

### Aksi berisiko

- Batalkan acara, refund, hapus acara, dan reset memakai `prompt()`/`confirm()` bawaan browser.
  Dampak (jumlah pesanan, nilai refund) hanya ditulis di teks dialog, tidak bisa dibatalkan
  setelah jalan, dan tampilannya keluar dari tema.
- Tombol Hapus selalu tampil walau acara punya transaksi; pengguna baru tahu ditolak setelah klik.
- "Kirim pengingat" langsung mengirim ke semua pemesan lunas tanpa konfirmasi.
- Mode blokir kursi: setiap klik langsung menjadi transaksi, satu kursi per klik, tanpa undo.

### Tampilan

- Ringkasan: enam KPI dengan bobot sama. Yang perlu ditindaklanjuti (anomali gate, pesanan
  menunggu bayar, selisih rekonsiliasi) ada di kolom samping atau tab lain.
- Warna hex ditulis langsung di `event.js` (`#64748b`, `#fb923c`, `#38bdf8`, `#4edea3`, gradien
  header acara), melanggar aturan token di `CLAUDE.md`.
- Modal transaksi memakai `grid-cols-2` tanpa breakpoint, input cari `!w-80`, tabel lebar: sempit
  di ponsel dan tablet.
- Setiap perubahan state menggambar ulang seluruh view (debounce 120 ms). Fokus keyboard, posisi
  scroll di dalam tabel, dan seleksi teks hilang. Tab Kelola dan modal sengaja dilewati, sehingga
  data di sana bisa basi tanpa tanda.
- Aksesibilitas: `role="tab"` tanpa navigasi panah, baris tabel bisa diklik tapi tidak bisa
  difokus dengan keyboard, label status hanya dibedakan warna di beberapa tempat.

## 2. Prinsip perbaikan

1. Dua tingkat yang jelas: daftar acara, lalu ruang kerja satu acara. Konteks acara selalu
   terlihat di ruang kerja.
2. Satu tindakan utama per layar, ditentukan oleh status acara (draft: lengkapi lalu publikasikan;
   dijual: pantau; hari H: check-in; selesai: rekonsiliasi).
3. Status acara hanya berubah lewat tombol aksi dengan pemeriksaan, bukan dropdown form.
4. Aksi berisiko memakai dialog konfirmasi bertema yang menampilkan dampak dalam angka.
5. Hal yang perlu ditindaklanjuti tampil di atas, bukan di tab lain.
6. Alat demo dipisah dari fitur operasional.

## 3. Arsitektur informasi baru

```
/pengelola#/acara                         Daftar acara (lintas acara)
/pengelola#/e/EVT-01/ringkasan            Ruang kerja acara
/pengelola#/e/EVT-01/pengaturan/info      ├ Pengaturan (sub-bagian)
                      /pengaturan/tiket   │   info, jadwal & penjualan, tiket & harga,
                      /pengaturan/denah   │   denah, gate, kontrak venue
/pengelola#/e/EVT-01/peserta[?o=BK-XXXX]  ├ Peserta & transaksi (modal bisa ditautkan)
/pengelola#/e/EVT-01/checkin              ├ Check-in & gate
/pengelola#/e/EVT-01/komunikasi           ├ Notifikasi, pengingat, daftar tunggu
/pengelola#/e/EVT-01/keuangan             └ Keuangan & ROI
```

Navigasi utama berupa sidebar kiri (rincian di bawah), bukan baris tab. Perubahan dari susunan
sekarang:

| Sekarang | Baru | Alasan |
|---|---|---|
| Baris 8 tab + chip pemilih acara | Sidebar: Semua acara, pemilih acara, menu per acara | Konteks acara selalu terlihat, menu tidak berdesakan |
| Daftar acara (tab) | Halaman tingkat 1 | Bukan bagian dari satu acara |
| Ringkasan | Ringkasan | Ditambah blok "Perlu tindakan" |
| Kelola acara + Denah kursi | Pengaturan (6 sub-bagian) | Semua yang mengubah konfigurasi di satu tempat |
| Denah kursi (pantau) | Ringkasan dan Pengaturan > Denah | Pantau di ringkasan, blokir di pengaturan |
| Check-in QR | Check-in & gate | Fokus statistik gate, anomali, log; pemindai tetap ada |
| Notifikasi & daftar tunggu | Komunikasi | Nama lebih pendek, isi sama |
| Uji rebutan, uji tekan, uji 2 gate, Reset | Panel "Alat demo" | Dipisah, bisa disembunyikan |

### Sidebar

Baris tab diganti sidebar kiri, memakai pola yang sudah ada di Command Center
(`<aside id="sidebar">` di `app/index.html`, kelas `.nav-item`, `.nav-item.active`, dan badge
`.cnt` di `app/css/app.css`). Dengan begitu kedua konsol terasa satu sistem, dan CSS-nya cukup
dipakai ulang tanpa gaya baru.

Isi sidebar dari atas ke bawah:

```
┌──────────────────────────────┐
│ [▣] Konsol Pengelola         │  identitas + tombol ciutkan («)
│                              │
│ ▤ Semua acara            4   │  tingkat 1 (jumlah acara)
│ ＋ Acara baru                │
│ ──────────────────────────── │
│ ┌──────────────────────────┐ │
│ │● Festival Musik Atrium ▾ │ │  pemilih acara (dropdown + cari),
│ │  21 Nov · Dijual         │ │  status & tanggal selalu terlihat
│ └──────────────────────────┘ │
│ ◔ Ringkasan              3   │  badge = jumlah "Perlu tindakan"
│ ⚙ Pengaturan             2   │  badge = cek kesiapan yang belum lolos (draft)
│   · Info acara               │  sub-menu terbuka saat Pengaturan aktif
│   · Jadwal & penjualan       │
│   · Tiket & harga            │
│   · Denah kursi              │
│   · Gate                     │
│   · Kontrak venue            │
│ 👥 Peserta & transaksi    4   │  badge = pesanan menunggu bayar
│ ▣ Check-in & gate        2   │  badge merah = anomali/laporan terbuka
│ ✉ Komunikasi             5   │  badge = daftar tunggu belum dikabari
│ ₨ Keuangan & ROI         1   │  badge merah = selisih rekonsiliasi
│ ──────────────────────────── │
│ ↗ Portal pengunjung          │  tautan luar (tab baru)
│ ▢ Pemindai ponsel            │
│ ⚗ Alat demo              ▸   │  lipat; berisi uji rebutan, uji tekan,
│                              │  uji 2 gate, reset data
│ ● Server LAN                 │  status koneksi, kecil di bawah
└──────────────────────────────┘
```

Aturan:

- Bagian acara (pemilih + menu per acara) hanya tampil bila ada acara. Di halaman Semua acara,
  menu per acara tetap terlihat untuk acara terakhir yang dibuka, supaya kembali ke sana satu klik.
- Badge hanya muncul bila angkanya > 0. Merah (`.cnt` bawaan) untuk masalah, abu-abu untuk
  hitungan biasa (kelas baru `.cnt.muted`).
- Menu memakai `<a href="#/e/EVT-01/peserta">`, bukan tombol, sehingga bisa dibuka di tab baru dan
  ikut router.
- Info teknis (Server LAN, versi data) pindah ke baris status kecil di kaki sidebar, keluar dari
  area kerja.
- Ciutkan: lebar 272 px ↔ 64 px (hanya ikon, label muncul sebagai tooltip). Pilihan disimpan di
  `localStorage['smicc-pengelola-nav']` (dibungkus try/catch). Default terbuka di ≥ 1280 px,
  ciut di 1024 sampai 1279 px.
- Di bawah 1024 px sidebar menjadi drawer: tombol menu di header membukanya, latar `.scrim`,
  tertutup saat memilih menu, Esc, atau klik latar. Fokus pindah ke menu pertama saat terbuka dan
  kembali ke tombol menu saat tertutup.
- Di bawah 768 px ditambah bar bawah menempel berisi 4 menu tersering (Ringkasan, Peserta,
  Check-in, Lainnya → membuka drawer) dan tombol aksi utama acara.
- Aksesibilitas: `<nav aria-label="Navigasi konsol">`, item aktif memakai `aria-current="page"`,
  sub-menu Pengaturan memakai `aria-expanded`.
- Mode `mall` (Command Center) tidak memakai sidebar ini, karena Command Center sudah punya
  sidebar sendiri. Di sana `event.js` tetap memakai baris tab seperti sekarang.

### Wireframe ruang kerja acara (desktop)

```
┌ header: logo · Pilih peran · tema · Keluar ─────────────────────────────────────────────┐
├─────────────────┬───────────────────────────────────────────────────────────────────────┤
│ SIDEBAR         │ Festival Musik Atrium           [Dipublikasikan] [Penjualan dibuka]   │
│ (lihat atas)    │ Sab, 21 Nov 2026 · 19.00 WIB · Main Atrium GF                         │
│                 │                       [Lihat di portal] [Tutup penjualan ▾]           │
│ ▤ Semua acara   ├───────────────────────────────────────────────────────────────────────┤
│ ＋ Acara baru   │ Perlu tindakan (3)                                                    │
│ ─────────────   │  ! 2 anomali di Gate A                         [Laporkan ke CC]       │
│ ● Festival… ▾   │  ! 4 pesanan menunggu bayar, 1 habis 3 menit   [Lihat]                │
│ ◔ Ringkasan  3  │  ! Selisih rekonsiliasi 1 pesanan              [Periksa]              │
│ ⚙ Pengaturan    ├──────────────┬──────────────┬──────────────┬──────────────┐          │
│ 👥 Peserta    4  │ Terjual 61%  │ Pendapatan   │ Kehadiran    │ Sedang dipesan│ 4 KPI    │
│ ▣ Check-in   2  ├──────────────┴──────────────┴──────────────┴──────────────┘          │
│ ✉ Komunikasi    │ Ketersediaan per kategori         │ Denah mini (hanya pantau)         │
│ ₨ Keuangan   1  │ Penjualan 14 hari | Arus check-in │ Transaksi terbaru                 │
│ ─────────────   │                                                                       │
│ ⚗ Alat demo  ▸  │                                                                       │
│ ● Server LAN    │                                                                       │
└─────────────────┴───────────────────────────────────────────────────────────────────────┘
```

Header acara (nama, status, aksi utama) menempel di atas area kerja saat di-scroll.

Di bawah 1024 px: sidebar menjadi drawer, area kerja penuh. Di bawah 768 px: bar bawah menempel
(Ringkasan, Peserta, Check-in, Lainnya, aksi utama), KPI 2 kolom.

### Wireframe daftar acara

```
Acara saya                                                     [+ Acara baru]
[Cari nama/ID]  Semua · Draft · Dijual · Ditutup · Selesai · Dibatalkan
┌────────────────────────────────────────────────────────────────────────────┐
│ ● Festival Musik Atrium   21 Nov 19.00   Dijual    61% ▓▓▓▓░░   Rp 48 Jt   │
│   Langkah berikutnya: pantau penjualan                         [Buka] [⋯] │
│ ● Talkshow Hall Lt. 3     5 Des 14.00    Draft     2 dari 5 siap           │
│   Langkah berikutnya: atur harga tiket                         [Lanjutkan] │
└────────────────────────────────────────────────────────────────────────────┘
```

Menu `⋯` berisi Batalkan acara dan Hapus. Hapus hanya aktif bila acara tidak punya pesanan lunas
atau menunggu bayar; bila tidak aktif, tooltip menjelaskan alasannya.

## 4. User flow

### A. Membuat dan mempublikasikan acara

```
Daftar acara → [Acara baru]
  Langkah 1 Dasar        nama, kategori, templat venue, tanggal mulai
  Langkah 2 Jadwal       gate dibuka, periode jual (nilai awal dihitung otomatis)
  Langkah 3 Tiket        harga & benefit per kategori dari templat, maks per pesanan
  Langkah 4 Tinjau       daftar periksa kesiapan, pratinjau kartu acara di portal
        ├─ [Simpan sebagai draft] → ruang kerja (Pengaturan)
        └─ [Publikasikan]          → ruang kerja (Ringkasan), toast + tautan portal
```

Langkah 2 sampai 4 boleh dilewati (tetap draft). Kesiapan dihitung oleh satu fungsi yang sama
untuk wizard, kartu daftar acara ("2 dari 5 siap"), dan tombol Publikasikan.

Daftar periksa kesiapan (`readiness(e)`):

| Cek | Aturan |
|---|---|
| Jadwal | `doors < start`, `start > sekarang` |
| Periode jual | `saleStart < saleEnd <= start` |
| Tiket | minimal satu kategori `onSale` dengan kuota atau kursi > 0 |
| Gate | minimal satu gate |
| Deskripsi | tidak kosong (peringatan, tidak memblokir) |

### B. Siklus status acara

```
DRAFT ──Publikasikan (cek kesiapan)──▶ PUBLISHED ──Tutup penjualan──▶ CLOSED
  │                                      ▲   │                          │
  │                                      └───┼──Buka lagi penjualan─────┘
  └──Hapus                                    └──Batalkan acara──▶ CANCELLED (final)
```

- Kembali ke DRAFT hanya bila belum ada pesanan sama sekali.
- Dropdown status di form dihapus. Tombol aksi utama di header ruang kerja mengikuti status:
  Draft: "Publikasikan"; Dipublikasikan: "Tutup penjualan"; Ditutup: "Buka lagi penjualan".
  Batalkan dan Hapus ada di menu `▾`.
- Aturan transisi ditulis di engine (`Evt.setStatus(evId, next)`), bukan di view, supaya Command
  Center dan tes memakai aturan yang sama.

### C. Mengubah pengaturan

- Setiap sub-bagian punya satu form dan satu tombol "Simpan perubahan" yang menempel di bawah,
  aktif hanya bila ada perubahan. Tiket & harga menyimpan semua kategori sekaligus.
- Validasi di field (pesan merah di bawah input) sebelum submit, memakai aturan yang sama dengan
  daftar periksa kesiapan.
- Pindah menu, pindah acara, atau menutup halaman dengan perubahan belum disimpan memunculkan
  dialog "Buang perubahan?" (`beforeunload` untuk tutup halaman).
- Bila data acara diubah perangkat lain saat form terbuka, tampil strip "Data acara ini diubah di
  perangkat lain. [Muat ulang]", bukan diam-diam dilewati seperti sekarang.
- Perubahan harga pada acara yang sudah terjual: tampilkan catatan "Pesanan lama tetap memakai
  harga saat beli".

### D. Denah dan blokir kursi

- Pengaturan > Denah: mode pilih. Klik atau seret untuk memilih beberapa kursi, lalu bar aksi
  "Blokir 6 kursi" / "Buka 2 kursi" dengan satu transaksi untuk semua.
- Kursi terjual atau sedang dipesan tidak bisa dipilih untuk diblokir (tampak redup, tooltip).
- Setelah simpan, toast punya tombol "Urungkan" selama 8 detik.
- Ringkasan menampilkan denah mini hanya untuk pantau; klik kursi membuka detail pemesan di panel
  samping seperti sekarang.

Butuh fungsi engine baru `Evt.setBlocked(evId, seats[], blocked)` (satu `tx`).

### E. Peserta dan transaksi

- Filter status menjadi chip dengan jumlah (`Lunas 182`, `Menunggu bayar 4`).
- Pagination 50 baris, bukan potong di 120.
- Baris bisa difokus dan dibuka dengan Enter. Transaksi terbuka di panel samping (desktop) atau
  layar penuh (ponsel), URL berubah ke `?o=BK-XXXX` sehingga bisa dibagikan ke rekan panitia.
- Detail transaksi dibagi dua bagian: "Data" (bisa diedit) dan "Tindakan" (kirim ulang e-ticket,
  refund, batalkan). Refund membuka dialog dengan alasan (pilihan + teks bebas) dan ringkasan
  nominal serta kursi yang dilepas.
- Ekspor CSV tetap di header tab, ditambah opsi "sesuai filter".

### F. Hari H: check-in dan gate

- Halaman Check-in & gate menampilkan, berurutan: anomali dan laporan (paling atas, merah bila ada),
  kehadiran per gate, log pindaian.
- Pemindai di konsol tetap ada tetapi dilipat; tautan "Buka pemindai di ponsel" menampilkan QR
  menuju `/checkin` agar petugas gate tinggal memindai.
- Saat `sekarang` berada di antara `doors - 2 jam` dan `start + 6 jam`, ruang kerja otomatis
  membuka halaman ini dan header memberi label "Hari H".

### G. Aksi berisiko

Komponen baru `UI.confirm({ title, impact: [[label, nilai]], confirmText, danger, typeToConfirm })`
mengembalikan Promise, menggantikan semua `prompt()`/`confirm()`:

| Aksi | Dampak yang ditampilkan | Pengaman |
|---|---|---|
| Batalkan acara | pesanan lunas, total refund, pesanan menunggu bayar, orang di daftar tunggu | ketik ID acara, alasan wajib |
| Hapus acara | denah, log check-in, notifikasi ikut terhapus | hanya bila tanpa pesanan aktif, ketik ID acara |
| Refund | nominal, kursi yang dilepas, peserta yang dikabari | alasan wajib |
| Kirim pengingat | jumlah penerima per kanal | konfirmasi biasa |
| Reset data demo | semua perangkat di LAN terdampak | ketik "RESET" |

## 5. Mekanisme teknis

| Mekanisme | Rancangan | File |
|---|---|---|
| Sidebar | Fungsi `sidebar()` di `event.js` (hanya peran pengelola) dirender ke `<aside>` baru di `pengelola.html`; isi `<main>` bergeser `lg:pl-72` (atau `lg:pl-16` saat ciut). Badge dari `attention(e)` dan `readiness(e)`. Region sidebar ikut render parsial supaya badge segar tanpa menggambar ulang area kerja. Drawer ponsel memakai `.scrim` dan penanganan Esc yang sudah ada. Kelas `.nav-item` dipakai ulang; tambah `.nav-item .cnt.muted` dan gaya sub-menu di `app.css`. | `pengelola.html`, `views/event.js`, `css/app.css` |
| Router | Hash router kecil di `event.js` khusus peran pengelola: parse `#/acara`, `#/e/:id/:tab/:sub?`, `?o=`. `hashchange` memicu `draw`. Mode `mall` (Command Center) tetap memakai `EvtAdmin.open(params)` dari router Shell. | `views/event.js` |
| Status acara | `Evt.setStatus(evId, next)` dengan tabel transisi; `Evt.readiness(e)` mengembalikan daftar cek. `updateEvent` tidak lagi menerima `status`. | `evt/engine.js` |
| Validasi | Fungsi `validateEvent(patch)` di engine dipakai form (inline) dan `updateEvent` (lempar error bila dilanggar). | `evt/engine.js`, `views/event.js` |
| Blokir massal | `Evt.setBlocked(evId, seats, blocked)` dalam satu `tx`, menolak kursi SOLD/HELD. | `evt/engine.js` |
| Form kotor | Simpan snapshot nilai form saat render, bandingkan saat input; flag `ui.dirty` dicek oleh router, pemilih acara, dan `beforeunload`. | `views/event.js` |
| Render parsial | Pecah view ke region (`#evt-head`, `#evt-attn`, `#evt-body`). `refresh()` hanya mengganti region yang berubah dan menyimpan fokus (id elemen aktif) serta scroll kontainer tabel. | `views/event.js` |
| Data basi di form | Simpan `Evt.version` saat form dibuka; bila `refresh()` melihat versi acara berubah, tampilkan strip muat ulang. | `views/event.js` |
| Konfirmasi | `UI.confirm()` dan `UI.toast(msg, lvl, { action: { label, fn } })` untuk Urungkan. | `ui.js` |
| Alat demo | Panel lipat "Alat demo" di footer ruang kerja, tampil bila `localStorage['smicc-demo-tools'] = '1'` (toggle di menu header). Default tampil selama masa prototype. | `views/event.js`, `pengelola.html` |
| Warna | Ganti hex di `event.js` dengan variabel status (`rgb(var(--slate-500))` dst.) dan warna kategori acara tetap dari data. Gradien header diganti strip warna kategori 4 px. | `views/event.js`, `css/app.css` |
| Perlu tindakan | Fungsi `attention(e)` mengumpulkan anomali gate, laporan belum ditangani, pesanan PENDING yang akan habis, selisih rekonsiliasi, kesiapan draft. Dipakai di Ringkasan dan badge angka di sidebar. | `views/event.js` |

Dampak ke server guard: semua aksi baru dijalankan oleh peran `pengelola`, yang boleh mengubah
apa saja, jadi `server.py` dan `api/_guard.js` tidak perlu diubah. Tetap jalankan tes guard untuk
memastikan.

Command Center ikut memakai `event.js`. Setiap perubahan dicek di `#/event` agar mode read-only
tidak menampilkan tombol baru (wizard, Pengaturan, Alat demo, menu `▾`).

## 6. Tahapan kerja

Setiap tahap bisa di-commit dan diuji sendiri. Naikkan cache-buster `?v=` dan rebuild Tailwind
bila ada kelas baru.

| Tahap | Isi | Perkiraan |
|---|---|---|
| 0. Baseline | Screenshot semua tab pengelola saat ini dan `#/event` di 1440 px dan 390 px, mode gelap dan terang. Catat alur saat ini sebagai pembanding. | 0,5 hari |
| 1. Engine | `setStatus`, `readiness`, `validateEvent`, `setBlocked` + tes di `tools/tests/engine.test.mjs`. Perbarui `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md`. | 1 hari |
| 2. Komponen UI | `UI.confirm`, toast dengan aksi, pesan error field, panel samping. | 0,5 hari |
| 3. Router, sidebar, dan kerangka | Hash router, sidebar (pemilih acara, menu per acara, badge, ciutkan, drawer ponsel, bar bawah), daftar acara sebagai halaman, header acara menempel dengan aksi utama per status, render per region. | 2 hari |
| 4. Buat dan publikasi | Wizard 4 langkah, daftar periksa kesiapan, kartu "Langkah berikutnya" di daftar acara. | 1 hari |
| 5. Pengaturan | Pecah form Kelola ke 6 sub-bagian, satu tombol simpan, validasi inline, penjaga form kotor, strip data basi. Denah dengan pilih banyak dan Urungkan. | 1,5 hari |
| 6. Ringkasan dan check-in | Blok "Perlu tindakan", 4 KPI, denah mini, urutan baru halaman Check-in & gate, mode Hari H. | 1 hari |
| 7. Peserta dan komunikasi | Chip berjumlah, pagination, panel transaksi bertaut URL, dialog refund, konfirmasi pengingat. | 1 hari |
| 8. Aksi berisiko dan demo | Ganti semua `prompt`/`confirm`, pindahkan alat demo ke panel lipat. | 0,5 hari |
| 9. Rapi dan aksesibilitas | Hapus hex, layout 390 px tanpa scroll horizontal, navigasi keyboard di sidebar, fokus baris tabel, target sentuh 44 px di ponsel, pass teks sesuai panduan. | 1 hari |
| 10. Verifikasi | Lihat bagian 7. | 0,5 hari |

Total sekitar 10,5 hari kerja untuk satu orang.

## 7. Verifikasi

- `node --test "tools/tests/*.test.mjs"` dan `python -m unittest discover -s tools/tests -p "test_*.py"`
  lolos, termasuk tes baru untuk transisi status, kesiapan, dan blokir massal.
- Uji manual di mode `server` dan `lokal`:
  1. Buat acara lewat wizard, simpan draft, refresh halaman (tetap di acara dan menu yang sama).
  2. Coba publikasikan dengan periode jual salah (ditolak, cek kesiapan menunjuk field).
  3. Publikasikan, beli tiket di `/pengunjung`, lihat ringkasan dan denah berubah tanpa kehilangan
     scroll.
  4. Ubah harga di satu tab, ubah acara yang sama di tab lain, kembali ke tab pertama (strip data
     basi muncul).
  5. Pindah tab dengan perubahan belum disimpan (dialog muncul).
  6. Blokir 6 kursi sekaligus lalu Urungkan.
  7. Refund, batalkan acara, hapus acara lewat dialog baru.
  8. Check-in di `/checkin`, anomali muncul di "Perlu tindakan", laporkan ke CC, tiket insiden
     terbuat di Command Center.
  9. Tombol Back browser berpindah antar menu dan acara.
  10. Sidebar: ganti acara lewat pemilih, badge berubah saat ada pesanan atau anomali baru,
      ciutkan lalu refresh (tetap ciut), drawer di 900 px bisa dibuka dan ditutup dengan
      keyboard dan Esc, bar bawah tampil di 390 px.
- `#/event` di Command Center: tidak ada tombol ubah, wizard, alat demo, atau sidebar kedua.
- 390 px dan 1440 px, mode gelap dan terang, konsol browser bersih.
- `grep -n "#[0-9a-fA-F]\{6\}" app/js/views/event.js` kosong (kecuali warna yang berasal dari data).

## 8. Keputusan yang perlu disepakati

1. Kontrak venue (sewa, bagi hasil, biaya mall, belanja tenant) saat ini diisi EO. Secara bisnis
   angka ini milik mall. Pilihan: (a) tetap di pengelola sebagai sub-bagian "Kontrak venue";
   (b) pindah ke Command Center. Opsi (b) mengubah guard server (peran `command-center` boleh
   mengubah `fin`), jadi `server.py`, `api/_guard.js`, dan `guard_cases.json` ikut berubah.
   Usulan: (a) untuk sekarang.
2. Tambah dan hapus jenis tiket (kategori di luar templat). Usulan: tambah kategori tanpa kursi
   (kuota) saja; kategori berkursi tetap mengikuti templat denah.
3. Alat demo: tampil default atau tersembunyi. Usulan: tampil selama masa pitching, disembunyikan
   setelahnya.
4. Wizard empat langkah atau cukup modal ringkas + daftar periksa di Pengaturan. Usulan: wizard,
   karena alur publish adalah alur utama EO.
