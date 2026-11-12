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
- **Ringkasan pesanan**: subtotal, biaya layanan per tiket berbayar, total.
- **Pembayaran sandbox** (QRIS, VA BCA, GoPay, OVO, DANA, kartu kredit/debit). Pesanan yang tidak dibayar akan kedaluwarsa
  dan kursinya dilepas.
- **E-ticket QR** bertanda tangan (format `SMB1|tiket|acara|kursi|tanda tangan`).
- **Tiket saya**, **Cari pesanan** dan **Kotak masuk** (notifikasi e-ticket, perubahan, refund).
- **Tambah ke kalender** (unduh file `.ics`).
- **Daftar tunggu** bila tiket habis atau penjualan tutup.

## 2. Konsol pengelola acara (`/pengelola`)

Pemilih acara di sidebar. **Semua acara** berisi Dasbor, Daftar acara, Transaksi, Check-in & gate, Keuangan, dan Laporan PDF semua acara. Setelah satu acara dipilih:

| Menu | Fitur |
|---|---|
| Daftar acara | Tambah acara baru, publikasikan, batalkan (refund otomatis ke semua pembeli), hapus |
| Ringkasan | KPI penjualan, okupansi, kehadiran, blok **Perlu tindakan** (anomali gate, pesanan menunggu bayar, persetujuan tertunda), ticker aktivitas |
| Denah kursi | Lihat status kursi langsung, blokir/buka kursi, uji rebutan kursi (2 pembeli memilih kursi yang sama) |
| Pengaturan | Poster, jadwal, venue, periode jual, jenis tiket, harga, kuota, benefit, status dijual/undangan, asumsi keuangan. Satu tombol simpan |
| Persetujuan | Unggah 7 dokumen (6 wajib, tiap dokumen menyebut divisi pemeriksanya), cek otomatis area & jadwal, ajukan, status "Giliran: …", waktu tunggu per divisi. Keputusan **Divisi Event** lalu **Operasional Mall** dilakukan di Command Center. Acara baru baru bisa dipublikasikan setelah disetujui. **Log aktivitas** acara (siapa, kapan, apa, nilai lama → baru) dengan rantai hash dan unduh CSV |
| Peserta & transaksi | Cari & saring per status (lunas, menunggu bayar, kedaluwarsa, batal, refund). Detail pesanan: ubah data peserta, kirim ulang e-ticket, batalkan, refund. **Unduh Peserta (CSV)** dan **Transaksi (CSV)** |
| Keuangan & ROI | Bruto, refund, neto, biaya layanan, rekonsiliasi per metode pembayaran, deteksi selisih, penjualan per kategori, bagi hasil & ROI. **Unduh Rekonsiliasi (CSV)** |
| Check-in & gate | Pemindai QR di dalam konsol, statistik masuk per gate, lapor anomali ke Command Center |
| Kirim broadcast | Kirim pengingat ke semua pemesan, riwayat pesan email & WhatsApp, kabari daftar tunggu |

Header: **pemilih acara** (dropdown cari) dan **+ Acara baru** (panel: nama, area dengan ketersediaan, mulai, selesai, format tiket). Akun **Tenant/EO** hanya melihat acara organisasinya, tanpa refund, reset, dan alat demo; chip identitas di header.

Lainnya: **Ctrl+K** untuk mencari menu, acara, kode booking, dan perintah (termasuk alat demo dan reset data event), kartu KPI yang bisa diklik untuk rincian, **Laporan PDF** per acara, profil di kanan atas, peringatan bila data contoh sudah kedaluwarsa.

### Format file CSV

- Pemisah **titik koma** (`;`), sehingga langsung terbuka per kolom di Excel regional Indonesia.
- UTF-8 dengan BOM (huruf non-ASCII tampil benar), baris CRLF.
- Aman dari formula injection: teks yang diawali `=`, `+`, `-`, `@`, tab atau CR diberi awalan
  kutip tunggal agar tidak dijalankan Excel sebagai rumus.

| File | Isi |
|---|---|
| `peserta_<acara>.csv` | Satu baris per tiket: acara, ID tiket, booking, kategori, kursi, pemegang, pemesan, email, WhatsApp, status tiket, waktu check-in, gate |
| `transaksi_<acara>.csv` | Satu baris per pesanan: booking, pemesan, kontak, jumlah tiket, kursi, subtotal, biaya layanan, total, metode, status, waktu dibuat/dibayar, catatan refund |
| `log_aktivitas_<acara>.csv` | Satu baris per entri log: waktu, pelaku, peran, aksi, keterangan, catatan, kode rantai |
| `rekonsiliasi_<acara>.csv` | Pesanan lunas & refund: metode, status, subtotal, biaya layanan, total, jumlah tiket, waktu dibayar, waktu refund |

## 3. Check-in gate (`/checkin`)

- Pindai QR lewat kamera (HTTPS/localhost), foto QR dari kamera ponsel (bisa di HTTP LAN),
  atau ketik/tempel kode.
- Hasil langsung: **VALID** (boleh masuk), **USED** (sudah dipakai), **INVALID** (palsu,
  dibatalkan, atau acara lain). Satu tiket hanya bisa masuk sekali walau dipindai di dua gate
  bersamaan.
- Pilih gate, tombol **lapor ke Command Center** untuk kejadian di lapangan.
- **Cadangan kalau sistem mati** (SOP-EVT-05): manifest peserta per acara dicadangkan otomatis di perangkat
  (batas harian pukul 23.00, localStorage `smicc-manifest-v1`), bisa diunduh sebagai CSV tanpa server. Juga di menu
  Check-in & gate konsol pengelola dan Pemantauan Event Command Center.

## 4. Command Center (`/command-center`)

Sembilan dashboard dan dua alat SOP/simulasi.

**Operasional**
- **Tiket & Insiden**: distribusi masalah per domain, SLA tenant, kesiapan tim reaksi cepat,
  ekspor log tiket (CSV).
  **Demo berjalan** (`live.js`): tiap 7 sampai 15 detik ada tiket baru (masuk di urutan teratas), tiket lama
  bergerak sampai ditutup atau tertahan dengan catatan lapangan, dan pesan tenant. Feed **Aktivitas terbaru**,
  urutan Terbaru/Prioritas, tombol **Langsung/Dijeda**. Berhenti sendiri saat operator mengetik, ada modal, atau
  simulasi use case berjalan.
- **Fasilitas & BMS**: chiller plant, gardu trafo, lift & eskalator, log diagnostik, aksi cepat,
  unduh laporan BMS (CSV).
- **Layanan Tenant & SLA**: permintaan tenant, izin kerja/fit-out, kepatuhan regulasi, siaran.
- **CCTV & Keamanan**: alert keamanan, kendali PTZ, regu patroli, bookmark & ekspor bukti.
- **Energi & Utilitas**: profil beban 24 jam & tarif PLN, sub-metering tenant, PLTS & ESG,
  neraca air, anomali & mitigasi AI, simulasi tarif WBP/LWBP, ekspor audit ESG (CSV).
- **Parkir & Mobilitas**: okupansi per zona, gate & ANPR, drop-off/valet, pengisian EV,
  pendapatan per jam.
- **Pemantauan Event** (hanya baca): portofolio semua acara, detail acara, denah langsung,
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
- **Analisis Sentimen**: ulasan publik (sekarang Google Maps; X, TikTok, Instagram "Segera"), komposisi
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
