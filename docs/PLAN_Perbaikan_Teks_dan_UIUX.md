# Rencana perbaikan teks dan UI/UX SMICC-TS

Dua pekerjaan yang saling terkait: merapikan kata-kata di seluruh antarmuka (pakai skill `/humanizer`)
dan memperbarui tampilan (pakai skill `/frontend-design:frontend-design`). Teks dikerjakan lebih dulu
karena desain baru perlu ukur panjang label dan judul yang sudah final.

## Kondisi sekarang (hasil pemeriksaan awal)

Teks:

- Bahasa campur tanpa aturan. Menu memakai "Ticketing & Incident Ops", "Facility & BMS Control",
  "Analytics & Reports", sementara grup menu memakai "Operasional", "Pengetahuan & Relasi". Status
  header menulis "All Nominal" di samping "Alarm Aset".
- Kata yang diulang sampai hilang maknanya: "Real-time" 35 kali, "Terintegrasi" 6 kali,
  "Pastikan/memastikan" 11 kali.
- Em dash (—) dipakai sebagai penyambung di 15 file JS/HTML/Python dan 8 kali di runbook.
- String meta disambung titik tengah ("Masuk dengan PIN · Summarecon Mall Bandung",
  "Belum check-in · tunjukkan QR ini di gate").
- Pesan error dan toast belum seragam. Sebagian sudah jelas ("Kode booking atau email tidak
  cocok."), sebagian bercampur nada ("E-ticket terbit!").

Tampilan:

- Palet "Aegis Command" adalah token Material 3 bawaan Google Stitch: navy hampir hitam (#0a122a)
  dengan aksen biru langit (#8ed5ff). Ini pola default "latar gelap + satu aksen terang", belum
  punya identitas Summarecon Mall.
- Tipografi: Plus Jakarta Sans (judul), Inter (isi), JetBrains Mono untuk semua label kecil. Label
  monospace dan 17 pemakaian `uppercase` + `tracking-widest` membuat semua halaman terasa template.
- Ticker insiden memakai animasi berjalan dan `pulse-ring` terus-menerus, tanpa
  `prefers-reduced-motion`.
- Empat halaman punya pengguna berbeda (operator command center, pengelola event, pengunjung di
  ponsel, petugas gate), tapi semuanya berbagi gaya yang sama.

## Batasan yang wajib dijaga

- Offline: font dan aset baru masuk `app/vendor/` lewat `tools/vendor_fonts.py`. Tidak ada CDN.
- `app/js/sop-data.js` tidak diedit langsung. Teks SOP dan use case diubah di `tools/sop_data.py`
  dan `tools/usecase_data.py`, lalu jalankan `python tools/build_docs.py`, buka kedua Excel dan
  simpan sekali.
- Yang tidak boleh diubah oleh pass teks: identifier kode, kunci state, kode status (`TRIP`,
  `FAULT`, `LEAK`, `P1`), ID SOP, format payload QR `SMB1|...`, nama file, path URL.
- Setiap perubahan JS: naikkan cache-buster `?v=` di semua halaman.
- Setiap kelas Tailwind baru: rebuild `app/vendor/tailwind.css`.
- Logika engine (CAS, hold kursi, check-in) tidak disentuh.

## Fase 0: inventaris dan baseline

1. Jalankan `python server.py 8765 127.0.0.1`, ambil screenshot setiap rute Command Center
   (`#/ticketing`, `#/bms`, `#/tenant`, `#/cctv`, `#/energy`, `#/parking`, `#/event`,
   `#/analytics`, `#/owner360`, `#/sop`, `#/usecase`), plus `/pengelola`, `/pengunjung` (lebar
   390 px dan 1280 px), `/checkin`, dan `app/masuk.html`. Simpan di scratchpad sebagai pembanding.
2. Buat skrip kecil (di scratchpad, bukan di repo) yang mengekstrak semua string tampilan dari
   `app/*.html`, `app/js/**/*.js`, `tools/sop_data.py`, `tools/usecase_data.py` ke satu tabel
   (file, baris, teks). Tabel ini jadi daftar kerja dan cek bahwa tidak ada string yang terlewat.

## Fase 1: glosarium dan aturan nada

Satu halaman aturan di `docs/PANDUAN_Teks_UI.md`, ditulis sebelum mengedit apa pun:

- Daftar istilah tetap: tiket, insiden, SOP, runbook, check-in, gate, e-ticket, tenant, shift, SLA.
  Istilah teknis yang sudah dipakai staf mal tetap dalam bahasa Inggris; sisanya bahasa Indonesia.
- Satu nama per aksi di seluruh alur: tombol "Bayar" menghasilkan toast "Pembayaran berhasil",
  tombol "Lepas kursi" menghasilkan "Kursi dilepas".
- Pesan error menyebut apa yang terjadi dan apa yang bisa dilakukan, tanpa minta maaf dan tanpa
  tanda seru.
- Huruf kapital di awal kalimat saja (bukan Title Case) untuk judul dan tombol.
- Tanpa em dash. Pakai titik, koma, titik dua, atau kurung.

Keputusan yang sudah disepakati ada di bagian akhir dokumen ini.

## Fase 2: pass teks dengan /humanizer

Urutan berdasarkan siapa yang membaca. Satu commit per kelompok.

| Urutan | Kelompok | File |
|---|---|---|
| 1 | Portal pengunjung (publik, paling sensitif) | `app/pengunjung.html`, `app/js/evt/visitor.js` |
| 2 | Login dan gate | `app/masuk.html`, `app/checkin.html`, `app/js/evt/checkin-ui.js` |
| 3 | Shell Command Center | `app/index.html`, `app/js/app.js` (NAV, header, ticker, modal) |
| 4 | Halaman operasional | `app/js/views/ticketing.js`, `bms.js`, `tenant.js`, `cctv.js`, `energy.js`, `parking.js` |
| 5 | Event admin | `app/js/views/event.js`, pesan dari `app/js/evt/engine.js` |
| 6 | Eksekutif dan simulator | `analytics.js`, `owner360.js`, `sop.js`, `usecase.js`, `app/js/sim.js`, `app/js/data.js` (seed) |
| 7 | Data SOP dan use case | `tools/sop_data.py`, `tools/usecase_data.py`, lalu `build_docs.py` |
| 8 | Dokumentasi | `README.md`, `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md` |

Cara kerja per file (mode file dari skill humanizer): tandai pola, tulis ulang hanya prosa, jangan
ubah kode di sekitarnya, jangan menambah fakta baru (angka SLA, jam shift, batas PIN tetap sama).
Setelah tiap kelompok, cek ulang lima pola yang paling sering lolos: kontras "bukan X tapi Y",
kalimat penutup yang mengulang, tiga serangkai, em dash, dan label tebal.

Target terukur: "Real-time" tinggal di tempat yang memang menjelaskan data langsung (perkiraan di
bawah 5), em dash 0 di luar kode, semua label menu dalam satu bahasa sesuai keputusan.

## Fase 3: arah desain dengan /frontend-design

Rancangan token dibuat dan disetujui dulu, baru dikodekan. Usulan awal yang akan dibahas:

Subjek dan pengguna. Ruang kontrol mal yang dipantau operator berjam-jam per shift, ditambah portal
tiket yang dibuka pengunjung di ponsel. Kosakata visual yang paling dekat dengan dunia ini adalah
papan petunjuk (wayfinding) mal: huruf sans condensed yang tegas, kode lantai dan zona, warna
yang hanya dipakai untuk arti.

Usulan arah per permukaan:

- Command Center punya mode gelap (default untuk operator shift malam) dan mode terang (untuk
  presentasi). Mode gelap memakai latar grafit netral, bukan navy bercahaya. Warna terang hanya untuk arti operasional: P1 merah, P2 jingga, normal
  hijau, info biru. Satu hal yang menonjol adalah strip insiden prioritas di header. Elemen lain
  dibuat diam.
- Konsol pengelola memakai sistem yang sama dengan kepadatan tabel yang lebih tinggi.
- Portal pengunjung ramah ponsel, identitas netral (wordmark teks, slot logo kosong), denah
  kursi sebagai elemen utama.
- Layar check-in: kontras maksimal, hasil scan (valid, sudah dipakai, palsu) terbaca dari jarak
  satu meter.

Tipografi (kandidat, harus tersedia untuk di-vendor offline): satu keluarga sans dengan varian
condensed untuk judul, angka KPI, dan kode zona, varian reguler untuk isi, dengan angka tabular
untuk tabel dan timer. Label monospace dihapus kecuali untuk ID tiket dan kode booking.

Pola yang dihapus: label kecil huruf kapital dengan tracking lebar di atas setiap judul, string
meta bertitik tengah, kartu seragam dengan radius dan bayangan yang sama di semua tempat, glow dan
gradien dekoratif.

Hasil fase ini: token warna (4 sampai 6 hex bernama untuk mode gelap dan terang), skala huruf, wireframe ASCII untuk
shell Command Center, portal pengunjung, dan layar check-in. Rancangan ini dicek ulang terhadap
pola default AI sebelum disetujui.

## Fase 4: implementasi token

1. Ganti font di `tools/vendor_fonts.py`, unduh sekali, pastikan file ada di `app/vendor/fonts/`.
2. Ganti `colors`, `fontFamily`, `fontSize` di `tools/tailwind/tailwind.config.js`. Nama token
   lama (`surface`, `primary`, `on-surface`, dll.) dipertahankan agar view tidak perlu diedit
   massal; hanya nilainya yang berubah.
3. Rapikan `app/css/app.css`: kelas `.lbl`, `.nav-item`, ticker, `pulse-ring`. Tambah
   `@media (prefers-reduced-motion: reduce)` untuk ticker dan pulse, serta gaya fokus keyboard
   yang terlihat.
4. Rebuild `app/vendor/tailwind.css`, naikkan `?v=`.

## Fase 5: perbaikan per halaman

Urutan sama dengan fase 2. Per halaman: hierarki (apa yang harus dilihat operator dalam 3 detik),
hapus `uppercase`/`tracking-widest` yang dekoratif, keadaan kosong yang memberi langkah berikutnya,
keadaan error, target sentuh minimal 44 px di portal pengunjung dan check-in, tidak ada scroll
horizontal di 390 px. Banner "Mode lokal" tetap ada dan tetap mencolok.

## Fase 6: verifikasi

- Screenshot ulang semua rute dari fase 0 dan bandingkan berdampingan.
- Uji alur utama di mode `server` dan `lokal`: login PIN, buat tiket, simulasi use case, pesan
  kursi, bayar, check-in QR, check-in QR yang sama dua kali.
- Cek tidak ada URL eksternal: `grep -rE "https?://" app/*.html app/css app/js`.
- Cek em dash di luar kode dan kata yang dibatasi dari fase 2.
- Konsol browser bersih dari error.

## Keputusan (disepakati 2026-11-07)

1. Menu dan judul halaman memakai bahasa Indonesia ("Tiket & Insiden", "Fasilitas & BMS", dst.).
   Singkatan yang sudah baku (SOP, SLA, BMS, CCTV) tetap.
2. Logo belum ada. Portal pengunjung memakai identitas netral dengan wordmark teks
   "Summarecon Mall Bandung" dan satu slot logo di header yang mudah diganti nanti. Warna aksen
   portal dipilih sendiri, tidak meniru warna resmi.
3. Mode gelap dan terang, dengan tombol toggle. Akibatnya di fase 4: token warna di
   `tailwind.config.js` diubah dari hex statis menjadi CSS variable (`rgb(var(--surface) / <alpha-value>)`),
   nilainya didefinisikan di `app/css/app.css` untuk `:root` (terang) dan `[data-theme="dark"]`.
   Pilihan disimpan di localStorage per perangkat, default mengikuti `prefers-color-scheme`.
   Toggle ada di header Command Center, konsol pengelola, dan portal pengunjung. Layar check-in
   ikut toggle, tapi kontras kedua mode harus tetap terbaca dari jarak satu meter. Fase 6 menguji
   setiap rute di kedua mode.
4. Teks SOP dan use case termasuk cakupan (kelompok 7 di fase 2, termasuk regenerate Excel dan
   runbook).

## Rancangan desain yang dipakai

Nama tema: "Papan Petunjuk". Acuannya papan arah dan direktori di mal: huruf sans yang tegas,
pelat warna polos, dan warna terang hanya untuk arti.

Warna (token lengkap di `app/css/tokens.css`):

| Peran | Gelap | Terang |
|---|---|---|
| Permukaan (aspal / kertas) | `#181b1f` | `#f2f3f5` |
| Panel | `#22262b` | `#ffffff` |
| Teks | `#e8eaed` | `#15181c` |
| Biru papan parkir (aksi utama) | `#2f6fdb` | `#2f6fdb` |
| Hijau normal | `#5fd39a` | `#17784a` |
| Merah P1 / bahaya | `#c62828` (tombol), shade rose untuk teks | sama, shade dicerminkan |

Palet status bawaan Tailwind (rose, amber, emerald, sky, ...) dipetakan ke CSS variable dan
dicerminkan di mode terang (shade 300 menjadi 700, dst.), jadi kelas lama di view tetap terbaca
tanpa diedit satu per satu.

Huruf: Barlow untuk isi dan label, Barlow Condensed untuk judul, angka KPI, dan penghitung menu.
Barlow dibuat dari huruf rambu jalan, cocok dengan acuan papan petunjuk. JetBrains Mono hanya
untuk ID dan overlay kamera. Label tidak lagi ditulis kapital dengan tracking lebar.

Prinsip:
- Satu elemen yang mencolok per layar: strip insiden prioritas di Command Center, denah kursi di
  portal, hasil scan di gate, daftar direktori di halaman depan.
- Chip filter aktif dibalik warnanya (teks jadi latar) seperti pelat petunjuk.
- Radius menandai tingkat: panel 10 px, panel dalam 8 px, tombol dan chip 6 px.
- Tanpa glassmorphism, glow, dan gradien dekoratif. Video kamera dan QR tetap berlatar tetap
  (gelap untuk video, putih untuk QR) di kedua mode.
- Animasi berhenti bila perangkat meminta `prefers-reduced-motion`; ticker berhenti saat disorot.

Yang diubah dari usulan awal: halaman depan tidak lagi tiga kartu seragam bernomor (nomor itu bukan
urutan), diganti daftar direktori satu kolom. Primary tidak memakai biru langit Stitch, diganti biru
papan parkir yang lebih gelap agar teks putih di atasnya lolos kontras.

## Status (2026-11-08): selesai

- Teks: sekitar 860 string ditulis ulang di antarmuka, data SOP/use case, README, dan dokumen
  event. `build_docs.py` lolos (0 error, 48 SOP, 18 use case).
- Desain: tema "Papan Petunjuk" dengan mode gelap/terang, font Barlow, halaman depan berbentuk
  direktori, label kapital dan monospace dihapus, Esc menutup dialog, tabel log check-in bisa
  digeser di ponsel, `prefers-reduced-motion` dihormati.
- Verifikasi: screenshot semua rute di kedua mode, alur pesan kursi, check-in (valid, sudah
  dipakai, palsu), buat tiket, simulasi use case, dan toggle mode berjalan tanpa error JS.

Belum dikerjakan:
- Kedua Excel di `docs/` perlu dibuka di Excel lalu disimpan sekali agar rumusnya dihitung ulang.
- Browser yang sudah menyimpan state lama di localStorage masih menampilkan teks seed lama
  sampai tombol "Reset demo" ditekan.
- String yang juga dipakai sebagai kunci di kode sengaja tidak diubah: kategori tiket, nama tim,
  "Perlu Optimasi", "SOP Acuan", dan kode status.
