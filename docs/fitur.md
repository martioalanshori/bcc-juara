# Daftar fitur SMICC-TS

Summarecon Mall Integrated Command Center Ticketing System (prototype). Aplikasi berjalan tanpa
internet di jaringan lokal (`node server.js`) dan juga tersedia di Vercel:
https://smiccts.vercel.app

Aplikasi terdiri dari empat halaman untuk empat pengguna. Data event (acara, kursi, pesanan,
tiket, check-in) dipakai bersama oleh semua halaman. Data Command Center lainnya tersimpan per
browser.

| Path | Untuk | Akses |
|---|---|---|
| `/pengunjung` | Pembeli tiket | Terbuka |
| `/pengelola` | Tenant/EO (acara milik sendiri) dan Tim Event Mall (semua acara) | Akun staf tenant atau pengelola |
| `/checkin` | Petugas gate | Akun staf gate atau pengelola |
| `/command-center` | Operator, Divisi Event, Operasional Mall | Akun staf command-center, divisi-event, divisi-ops |
| `/` | Semua | Halaman pilih peran |
| `/masuk` | Staf | Login email + password (kartu akun demo) |

---

## 1. Portal pengunjung (`/pengunjung`)

Tampilan mobile-first untuk membeli tiket.

- **Beranda (landing) responsif** ponsel sampai desktop: hero acara unggulan bergeser otomatis, info kunjungan hari ini,
  acara terdekat, "Minggu ini di mal" (hari ini / akhir pekan / 7 hari), Laku keras, kategori, deretan per kategori,
  area mal (Main Atrium, Summarecon Hall, Outdoor Plaza, Exhibition Hall, Kids Zone), promo tenant untuk pemegang
  tiket, ajakan untuk penyelenggara, panduan pengunjung, dan footer. Foto masih foto demo (lihat `app/img/demo/CREDITS.md`).
- **Daftar acara** di Summarecon Mall Bandung, lengkap dengan jadwal, venue dan status penjualan.
- **Pilih kategori dulu, baru kursi**: halaman kategori (harga, sisa kuota, jumlah tiket festival),
  lalu denah khusus kategori itu (kursi kategori lain terkunci). Kursi yang dipilih langsung dikunci (ditahan)
  beberapa menit, dengan batas jumlah tiket per pesanan. Ada hitung mundur dan pemberitahuan
  bila waktu penahanan habis.
- **Kategori berdiri** (tanpa nomor kursi) dengan kuota.
- **Data pemesan & data peserta** per tiket (nama pemegang tiket bisa berbeda dari pemesan).
- **Bawa kendaraan ke acara?** (di kartu Data diri pemesan) Ya / Tidak, awalnya belum dipilih dan wajib dijawab sebelum
  lanjut bayar; klik lagi pilihan yang aktif untuk membatalkannya. Ya: muncul
  pilihan Mobil / Motor dan plat nomor (keduanya wajib, plat dirapikan otomatis ke format `D 1234 ABC`). Tidak: pilihan
  itu disembunyikan. Satu kendaraan per pesanan, dipakai untuk prediksi parkir dan tampil di halaman e-ticket.
- **Ringkasan pesanan**: subtotal, biaya layanan per tiket berbayar, total. Di langkah data pemesan (judul *Konfirmasi
  pesanan*) kartu **Tiket yang dipesan** selalu tampil dengan info penting disorot: tanggal & jam, lokasi, jam gate dibuka,
  kategori & kursi, dan total. Bilah atas: "Kursi ditahan untukmu 07:53 · 2 tiket" ("Tiket ditahan…" bila tanpa nomor kursi).
- **Form data pemesan** satu kartu *Data diri pemesan*: nama, nama berbeda per tiket, email, WhatsApp (dikelompokkan
  otomatis `812 3456 7890`), kendaraan & plat. Satu kotak centang mencakup Syarat & Ketentuan, Kebijakan Privasi, dan izin
  pemrosesan data pribadi (UU PDP), lalu tombol **Lanjut bayar Rp …**.
- **Pembayaran sandbox** (QRIS, VA BCA, GoPay, OVO, DANA, kartu kredit/debit). Pesanan yang tidak dibayar akan kedaluwarsa
  dan kursinya dilepas.
- **E-ticket QR** bertanda tangan (format `SMB1|tiket|acara|kursi|tanda tangan`).
- **Tiket saya**, **Cari pesanan** dan **Kotak masuk** (notifikasi e-ticket, perubahan, refund).
- **Menu akun** (klik avatar): Edit profil (nama & WhatsApp), Tiket saya, **Ubah peran** ke Pengunjung, Pengelola,
  Tenant atau Command Center (juga di menu avatar konsol pengelola dan Command Center), Keluar.
- **Tambah ke kalender** (unduh file `.ics`).
- **Daftar tunggu** bila tiket habis atau penjualan tutup.
- **Acara yang sudah lewat** di beranda (edisi sebelumnya 12 bulan terakhir: pengunjung hadir, persen terjual, jadwal edisi
  berikutnya) dan baris **Edisi sebelumnya** di halaman acara.

## 2. Konsol pengelola acara (`/pengelola`)

Pemilih acara di sidebar, di atas menu Dasbor (di layar sempit ada di laci menu). **Semua acara** berisi Dasbor, Daftar acara, Transaksi, Check-in & gate, Keuangan, dan Laporan PDF semua acara. Setelah satu acara dipilih:

- **Bilah Informasi terbaru** menempel di bawah header di semua menu: status (Semua normal / N perlu perhatian /
  N peringatan) bergaya bilah alarm parkir: semua kejadian dalam teks berjalan (peringatan dulu, sekitar 40 px/detik, berhenti saat disorot, bisa diklik), dan tombol
  **Lihat semua**; oranye = peringatan, kuning = perlu perhatian, hijau = semua normal. **Lihat semua** untuk daftar lengkap yang bisa diklik (transaksi, gate, unduh manifest). Isinya mengikuti pemilih acara.
- **Riwayat 12 bulan** (seolah sudah berjalan setahun): setiap acara punya satu edisi sebelumnya dalam 12 bulan terakhir
  lengkap dengan pesanan, e-ticket, check-in, refund, kendaraan, laporan gate, dan riwayat persetujuan. Tampil di Dasbor
  (angka utama, tiket per bulan, acara terlaris), Daftar acara (saringan **Arsip 12 bulan** + rincian & unduh peserta),
  Transaksi (rentang Acara aktif / 30 hari / 3 bulan / 12 bulan), Check-in & gate (kehadiran per bulan), Keuangan
  (pendapatan per bulan, arsip per edisi, CSV) dan Laporan PDF semua acara. Arsip hanya baca.
- **Hari ini & besok** di Dasbor: acara 48 jam ke depan dengan terjual/kapasitas dan status cadangan manifest
  (Siap / Belum diunduh / Data lama / Tersimpan), tombol Offline/Excel/CSV. Di kartu acara, Laporan PDF dan manifest ada
  di satu menu **Unduh**; untuk semua acara, menu **Unduh** di atas halaman lintas acara (Laporan PDF, Manifest ZIP).


| Menu | Fitur |
|---|---|
| Daftar acara | Tambah acara baru, publikasikan, batalkan (refund otomatis ke semua pembeli), hapus |
| Ringkasan | KPI penjualan, okupansi, kehadiran, **kendaraan terdaftar** (klik: prediksi mobil/motor, jam puncak, daftar plat), blok **Perlu tindakan** (anomali gate, pesanan menunggu bayar, persetujuan tertunda), ticker aktivitas |
| Denah kursi | Lihat status kursi langsung, blokir/buka kursi, uji rebutan kursi (2 pembeli memilih kursi yang sama) |
| Pengaturan | Poster, jadwal, venue, periode jual, jenis tiket, harga, kuota, benefit, status dijual/undangan, asumsi keuangan. Satu tombol simpan |
| Persetujuan | Unggah 7 dokumen (6 wajib, tiap dokumen menyebut divisi pemeriksanya; tombol **Isi dummy** mengisi semua dokumen yang belum ada dengan file contoh untuk demo), cek otomatis area & jadwal, ajukan, status "Giliran: …", waktu tunggu per divisi. Keputusan **Divisi Event** lalu **Operasional Mall** dilakukan di Command Center. Acara baru baru bisa dipublikasikan setelah disetujui. **Log aktivitas** acara (siapa, kapan, apa, nilai lama → baru) dengan rantai hash dan unduh CSV |
| Peserta & transaksi | **Unduh Peserta (Excel)**. Cari (termasuk plat nomor) & saring per status (lunas, menunggu bayar, kedaluwarsa, batal, refund) dan per kendaraan (mobil, motor, tanpa kendaraan). Kolom kendaraan & plat. Detail pesanan: ubah data peserta dan kendaraan, kirim ulang e-ticket, batalkan, refund. **Unduh Peserta (CSV)** dan **Transaksi (CSV)** |
| Keuangan & ROI | Bruto, refund, neto, biaya layanan, rekonsiliasi per metode pembayaran, deteksi selisih, penjualan per kategori, bagi hasil & ROI. **Unduh Rekonsiliasi (CSV)** |
| Check-in & gate | Pemindai QR di dalam konsol, statistik masuk per gate, lapor anomali ke Command Center |
| Kirim broadcast | Kirim pengingat ke semua pemesan, riwayat pesan email & WhatsApp, kabari daftar tunggu |

Pemilih acara (sidebar): dropdown cari, baris **+ Acara baru** di bawahnya. Header: judul halaman, cari (Ctrl+K), tombol **Acara baru**
(selalu ada; panel: nama, area dengan ketersediaan, mulai, selesai, format tiket), dan menu profil. Aksi status acara (Ajukan
persetujuan / Menunggu persetujuan / Publikasikan / Tutup penjualan / Buka lagi penjualan) ada di kartu acara, di sebelah tombol
**Unduh**. Di ponsel tombol Acara baru pindah ke baris pertama konten. Menu profil berisi peran aktif
(Tim Event Mall atau Tenant/EO + organisasi), mode terang/gelap, Edit profil, Ubah peran, Keluar. Akun **Tenant/EO** hanya melihat
acara organisasinya, tanpa refund, reset, dan alat demo.

Lainnya: **Ctrl+K** untuk mencari menu, acara, kode booking, dan perintah (termasuk alat demo dan reset data event), kartu KPI yang bisa diklik untuk rincian, **Laporan PDF** per acara, profil di kanan atas, peringatan bila data contoh sudah kedaluwarsa.

### Format file CSV

- Pemisah **titik koma** (`;`), sehingga langsung terbuka per kolom di Excel regional Indonesia.
- UTF-8 dengan BOM (huruf non-ASCII tampil benar), baris CRLF.
- Aman dari formula injection: teks yang diawali `=`, `+`, `-`, `@`, tab atau CR diberi awalan
  kutip tunggal agar tidak dijalankan Excel sebagai rumus.

| File | Isi |
|---|---|
| `peserta_<acara>.csv` | Satu baris per tiket: acara, ID tiket, booking, kategori, kursi, pemegang, pemesan, email, WhatsApp, kendaraan, plat nomor, status tiket, waktu check-in, gate |
| `transaksi_<acara>.csv` | Satu baris per pesanan: booking, pemesan, kontak, kendaraan, plat nomor, jumlah tiket, kursi, subtotal, biaya layanan, total, metode, status, waktu dibuat/dibayar, catatan refund |
| `log_aktivitas_<acara>.csv` | Satu baris per entri log: waktu, pelaku, peran, aksi, keterangan, catatan, kode rantai |
| `rekonsiliasi_<acara>.csv` | Pesanan lunas & refund: metode, status, subtotal, biaya layanan, total, jumlah tiket, waktu dibayar, waktu refund |

## 3. Check-in gate (`/checkin`)

- Pindai QR lewat kamera (HTTPS/localhost), foto QR dari kamera ponsel (bisa di HTTP LAN),
  atau ketik/tempel kode.
- Hasil langsung: **VALID** (boleh masuk), **USED** (sudah dipakai), **INVALID** (palsu,
  dibatalkan, atau acara lain). Satu tiket hanya bisa masuk sekali walau dipindai di dua gate
  bersamaan.
- Pilih gate, tombol **lapor ke Command Center** untuk kejadian di lapangan.
- **Cadangan kalau sistem mati** (SOP-EVT-05): manifest peserta (acara 48 jam ke depan atau yang sedang berjalan)
  disimpan di perangkat (localStorage `smicc-manifest-v1`) dan diperbarui otomatis setiap data berubah, paling sering
  30 detik sekali, selama server terhubung. Saat server putus, salinan terakhir tetap bisa diunduh:
  - **Manifest offline**: satu file HTML mandiri yang dibuka tanpa server/internet: cari nama, booking, plat atau kursi,
    centang hadir (tersimpan di perangkat itu), tiket batal ditandai "tolak", unduh hasil centang (CSV).
  - **Excel (.xlsx)**: kolom Hadir (untuk dicentang), booking, ID tiket, pemegang, pemesan, kategori, kursi, kendaraan,
    plat, WhatsApp, email, status, check-in, gate. Urut nama pemegang, baris judul dibekukan dan ada filter.
  - **CSV** dengan kolom yang sama.
  - **Semua acara (ZIP)**: satu file berisi folder per acara (Excel, CSV, manifest offline) untuk semua acara yang
    dijual atau sudah lewat (tanpa draft & dibatalkan), plus `DAFTAR_ACARA.xlsx` dan `BACA_SAYA.txt`.
  Juga di menu Check-in & gate konsol pengelola dan Pemantauan Event Command Center.

## 4. Command Center (`/command-center`)

Sembilan dashboard dan dua alat SOP/simulasi; halaman pertama Tiket & Insiden. Di bawah 1024 px sidebar menjadi laci (tombol
menu di header); di ponsel ada bilah bawah Tiket, Fasilitas, CCTV, Parkir, Lainnya. Tombol merah **Kirim Broadcast** di header
mengirim siaran ke tenant & personel.

Insiden P1/P2 aktif tampil di **bilah insiden** di bawah header semua menu, bergaya sama dengan bilah alarm parkir: insiden P1/P2 dalam
teks berjalan (prioritas lalu sisa SLA, dengan hitung mundur), tombol Lihat semua yang membuka daftar semua insiden P1/P2 (klik baris untuk membuka tiket); merah penuh dengan pita bahaya
bila P1, oranye bila hanya P2.

**Operasional**
- **Tiket & Insiden**: kartu KPI (tiket aktif, MTTR, kepatuhan SLA, eskalasi, pengunjung), toolbar satu baris (cari, zona,
  prioritas, status, urutan), urut **prioritas lalu sisa SLA** secara bawaan; distribusi masalah per domain, SLA tenant, kesiapan tim reaksi cepat,
  ekspor log tiket (CSV).
  **Demo berjalan** (`live.js`): tiap **2 detik** ada perubahan, hanya selama halaman Tiket & Insiden, Fasilitas & BMS,
  Layanan Tenant & SLA, CCTV & Keamanan, atau Energi & Utilitas dibuka (halaman lain diam). Tiket: tiket baru (50 skenario berbeda, dibagikan
  bergiliran seperti kartu sehingga tidak berulang sebelum semua keluar) masuk di urutan teratas, tiket lama bergerak sampai ditutup atau tertahan dengan catatan lapangan. Tenant: pesan tenant & tiket tenant bergerak.
  BMS: suhu supply/return, aliran, beban, kW/TR chiller & AHU bergeser, catatan otomasi. CCTV: latensi, kamera aktif, arus orang,
  peringatan kamera AI datang dan pergi. Energi: beban grid, efisiensi chiller, air, CO2 (`Store.s.tele`). Setiap kejadian
  memunculkan **notifikasi** (masalah baru, diakui, tim dikirim, tim tiba, masalah selesai, ditutup, pesan tenant, kamera AI),
  paling sering satu tiap 3 detik: masalah baru diutamakan, selain itu kejadian terbaru. Feed **Aktivitas terbaru**,
  urutan Prioritas & SLA/Terbaru, tombol **Langsung/Dijeda**. Berhenti sendiri saat operator mengetik, ada modal, atau
  simulasi use case berjalan. Saat halaman dibuka lagi setelah lama ditinggal, tiket yang lewat SLA lebih
  dari 25 menit dianggap sudah ditangani: sebagian ditutup (kebanyakan dalam SLA, sebagian terlambat), paling banyak dua tetap
  terbuka sedikit lewat SLA, sisanya masih berjalan dalam SLA.
- **Fasilitas & BMS**: chiller plant, gardu trafo, lift & eskalator, log diagnostik, aksi cepat,
  unduh laporan BMS (CSV).
- **Layanan Tenant & SLA**: permintaan tenant, izin kerja/fit-out, kepatuhan regulasi, siaran.
- **CCTV & Keamanan**: alert keamanan, kendali PTZ, regu patroli, bookmark & ekspor bukti.
- **Energi & Utilitas**: profil beban 24 jam & tarif PLN, sub-metering tenant, PLTS & ESG,
  neraca air, anomali & mitigasi AI, simulasi tarif WBP/LWBP, ekspor audit ESG (CSV).
- **Parkir & Mobilitas**: okupansi per zona (termasuk Parkir Barat, ditandai "Dipakai acara" saat jadi area acara), gate & ANPR
  (plat peserta acara hari ini ditandai), drop-off/valet, pengisian EV, pendapatan per jam.
  **Prediksi parkir**: grafik okupansi mobil per jam hari ini (pola mal + kendaraan acara) dan tabel acara 7 hari ke depan
  (mobil/motor terdaftar + proyeksi, okupansi puncak Aman/Waspada/Penuh, rekomendasi, tombol tiket persiapan).
  **Simulasi parkir penuh** (langsung semua zona mobil): okupansi naik bertahap; peringatan di 90%, di 100% muncul banner merah, tiket P2
  SOP-PRK-06 untuk Tim Parkir dan saran zona pengalihan. "Akhiri simulasi" mengembalikan data sensor.
  Alarm terasa nyata: tahap Waspada (85%) / Kritis (95%) / Penuh (100%) dengan **detak ganda lub-dub** yang makin cepat
  (40 → 56 → 72 per menit) dan perkiraan "penuh dalam mm:ss" (sekitar 3 detik sampai penuh); saat penuh muncul **layar alarm
  penuh** (menutup sendiri setelah 5 detik dengan hitung mundur, lalu tetap sebagai bilah alarm; latar gelap-merah berdetak, sirene dengan lampu berputar, pita garis bahaya bergerak, tombol Akui / Arahkan /
  Buka parkir / Kecilkan, Esc untuk mengecilkan), **latar seluruh halaman berdenyut merah**, **bilah alarm merah pekat di
  semua menu** menggantikan bilah protokol insiden, badge "!" berdenyut di menu Parkir, **suara alarm** (klakson naik 3 kali
  sekitar 1 detik, diulang terus sampai diakui/dibisukan/pulih; dua bunyi peringatan saat kritis; aktif bawaan, bisa dibisukan), dan **log ANPR
  langsung**. **Akui alarm** mematikan suara, latar jadi merah tipis diam, dan operator & waktu
  respons tercatat di tiket; **Arahkan** mengalihkan ke Parkir Barat (bila tidak dipakai acara) atau overflow, okupansi
  berangsur turun; di bawah 95% "Kembali normal".
- **Pemantauan Event** (hanya baca): pemilih acara (cari, dikelompokkan per status), portofolio semua acara dengan
  **Riwayat 12 bulan**, detail acara, denah langsung,
  gate & keamanan, transaksi, keuangan & ROI. Unduh CSV peserta/transaksi/rekonsiliasi juga
  tersedia di sini.

**Eksekutif**
- **Analitik & Laporan**: scorecard KPI, tren SLA, pareto akar masalah, rekomendasi AI,
  pembuat laporan BOD (PDF cetak atau CSV).
- **Komersial & Keuangan**: zonasi & okupansi tenant, heatmap footfall, kontrak jatuh tempo,
  tagihan & umur piutang.
- **Persetujuan Acara**: kotak masuk pengajuan acara untuk akun **Divisi Event** dan **Operasional Mall**
  (badge = menunggu keputusan akun ini), detail berisi cek area & jadwal, alur, dokumen, tombol Setujui atau
  Minta revisi hanya pada giliran divisi itu, dan log aktivitas. Operator hanya melihat.
- **Analisis Sentimen**: ulasan publik (Google Maps, X, TikTok, Instagram, semua berlabel Aktif; data X/TikTok/Instagram masih data contoh, lihat catatan metode), komposisi
  positif/netral/negatif, keluhan per topik, tren per bulan, keluhan saat event besar, rekomendasi
  pengembangan untuk mall dan event (masing-masing dengan dasar angkanya), dan kutipan tanpa nama.
  Data statis `app/js/command-center/sentimen-data.js` dari `analisis.py --export-js`.

**SOP & Simulasi**
- **Pusat SOP & Runbook**: 49 SOP, matriks SLA P1-P4, eskalasi berjenjang, keterlacakan
  mindmap → SOP → dashboard.
- **Simulator Use Case**: menjalankan 18 use case langkah demi langkah dan melihat efeknya di
  dashboard, matriks relasi dashboard.

**Integrasi event → Command Center (SOP-EVT-03)**: 3 pindaian gagal/duplikat di satu gate dalam
10 menit, atau laporan petugas gate, otomatis menjadi tiket insiden P2. Hanya satu browser
Command Center yang membuat tiket walau beberapa terbuka.

## 5. Keamanan & keandalan

- **Anti double-booking**: setiap perubahan (tahan kursi, bayar, check-in) adalah transaksi
  berversi (compare-and-swap). Bila dua pengguna bentrok, satu ditolak lalu aturan dijalankan
  ulang.
- **Login staf per peran** (email + password): sesi cookie HttpOnly bertanda tangan HMAC, 12 jam,
  kunci 60 detik setelah 5 kali salah.
- **Pemeriksaan peran di server**: tanpa login hanya perubahan pembeli yang diterima; Command
  Center hanya boleh mengubah laporan gate; pengelola boleh semuanya. Aturan yang sama di
  `server/guard.js` (satu kode untuk LAN dan Vercel), diuji dengan `tests/guard_cases.json`.
- **Mode lokal**: tanpa server, data tersimpan di browser dan tab di satu perangkat tetap
  sinkron (banner kuning "Mode lokal").
- **Tema gelap/terang** di semua halaman, semua aset (font, CSS) lokal tanpa CDN.

## 6. Batasan prototype

- Pembayaran masih sandbox, belum terhubung ke payment gateway.
- Aturan bisnis dan kunci tanda tangan QR masih berjalan di browser. Produksi perlu API per aksi
  dan tanda tangan QR di server.
- Data dashboard Command Center selain event adalah data contoh dan tersimpan per browser.
- Satu akun demo per peran (belum banyak tenant dengan login masing-masing). Dokumen persetujuan hanya
  dicatat nama dan ukurannya, dan rantai hash log dihitung di browser.
