# FIX Pitch Deck: Outline per Slide

Pegangan untuk merevisi deck di Canva. Disusun dari:
- arahan mentor Teguh Iqbal Prayoga ([notulen 11 Nov](../05_Log/mentoring/2026-11-11_notulen-mentoring.md));
- riset lapangan 12 Nov ([RISET_LAPANGAN.md](../01_Riset/RISET_LAPANGAN.md));
- hasil scraping ([hasil_analisis.md](../01_Riset/scraping/data/hasil_analisis.md));
- aplikasi yang sekarang berjalan;
- daftar masalah deck lama ([ANALISIS_DECK.md](ANALISIS_DECK.md)).

## Keputusan tim

| Topik | Keputusan |
|---|---|
| Fokus | **Menyelesaikan masalah yang ada.** Model bisnis tidak dibahas di deck |
| Kalau sistem mati | **SOP-EVT-05** + **manifest cadangan harian** (otomatis pukul 23.00, tersimpan di perangkat gate, bisa diunduh tanpa server). Sudah ada di aplikasi |
| Ejaan | **Atrium Cibadag** di deck, aplikasi, dan dokumen |
| Sorotan utama | **Pendapatan yang hilang kalau sistem ini tidak dipakai** (slide 3 dan 8) |

## Aturan dari mentor

| Arahan mentor | Diterapkan di deck |
|---|---|
| 5 menit, demo ±2 menit | 10 slide utama. Slide 1–5 dan 7–10 masing-masing ±20 detik |
| Wajib: masalah, target pengguna, solusi | Slide 2, 4, dan 5 |
| Wajib ada angka bersumber nyata | Setiap angka diberi sumber kecil di pojok kiri bawah. Asumsi ditulis terbuka |
| Masalah harus terjadi di Summarecon | Hanya data dari Summarecon Mall Bandung: wawancara, foto, ulasan Google Maps, berita event di sana |
| Satu masalah kecil yang fokus | Satu masalah: **tidak tahu berapa orang dan kendaraan yang masuk saat event** |
| Bisa dipahami tanpa presenter, sedikit teks | Judul berupa kalimat, maksimal ±20 kata per slide, lebih banyak angka dan visual |
| Demo langsung ke inti | Lewati login dan pilih peran. Pakai tombol "Lanjut sebagai …" |

**Cara cek:** baca judul slide 1–10 berurutan. Kalau ceritanya sudah tersampaikan dari judul saja, deck sudah benar.

## Rumusan masalah (satu kalimat)

Format mentor: siapa, kesulitan apa, kapan.

> **Tim operasional Summarecon Mall Bandung** tidak tahu berapa orang dan kendaraan yang sudah masuk saat event, karena tiket, gelang, dan gate parkir tidak terhubung. **Kamis 12 Nov 2026, sebelum pukul 11.30**, parkir motor sudah penuh 1.200 dari 1.200.

Approval event yang lama (keluhan Pak Ade) **tidak dijadikan masalah kedua**. Approval ditampilkan sebagai langkah pertama alur solusi, karena di situ area dan lahan parkir yang dipakai acara sudah diperiksa sejak awal.

## Angka siap pakai

Pakai hanya angka di tabel ini. Semuanya punya sumber.

| Angka | Kalimat untuk slide | Sumber |
|---|---|---|
| **1.200 / 1.200** | Parkir motor penuh, Kamis 12 Nov 2026, sebelum 11.30 | Wawancara Bu Mei, 12 Nov 2026 |
| **±800 slot** | Kapasitas satu area parkir | Wawancara Bu Mei, 12 Nov 2026 |
| **34 hari** | Festival Kuliner Bandung Vol. 3 memakai Area Parkir Barat (25 Agu–27 Sep 2026) | Bu Mei; [Fimela](https://www.fimela.com/food/read/8282187/nostalgia-kuliner-legendaris-bandung-bisa-dicicipi-di-satu-tempat) |
| **Rp12 miliar / 3 hari** | Target omzet Roeang Kita 2026 (6–8 Nov, ±300 stan) | [Journal Arta](https://journalarta.com/news/2026/11/10/bpdp-bawa-produk-umkm-sawit-kelapa-kakao-ke-roeang-kita/) |
| **±30 event / bulan** | Event hampir setiap hari, untuk Summarecon dan tenant | Wawancara Pak Ade, 12 Nov 2026 |
| **2 petugas** | Petugas mobile keamanan lantai 1 per shift, pemantauan lewat CCTV | Wawancara Pak Asep, 12 Nov 2026 |
| **2.300 → 125 → 72** | Dari 2.300 ulasan Google Maps, 125 berisi keluhan, **72 di antaranya soal parkir** | Scraping Google Maps, 12 Nov 2026 (1.026 ulasan bertulisan) |
| **"1 jam sudah ngantri"** | Kutipan ulasan Google Maps (rating 1, Okt 2026) tentang antrean parkir | Scraping Google Maps |

Jangan pakai:
- angka keluhan per topik di menu Analisis Sentimen (masih tercampur data contoh X/TikTok/Instagram);
- klaim "±40% kapasitas parkir hilang", sampai kapasitas Area Parkir Barat dikonfirmasi.

## Pendapatan yang hilang tanpa SMICC-TS

Tarif parkir resmi Summarecon Mall Bandung tidak ditemukan di sumber online. Karena itu angka rupiah disusun sebagai **rumus terbuka**: inputnya bersumber, asumsinya ditulis jelas, dan juri bisa menghitung ulang.

| # | Kebocoran | Hitungan | Angka | Dasar |
|---|---|---|---|---|
| A | **Omzet event hilang** karena pengunjung batal datang saat parkir penuh atau antre | Rp12 miliar ÷ 3 hari = Rp4 miliar per hari. **Setiap 1% pengunjung yang batal = Rp40 juta per hari**, Rp120 juta per event | **Rp40 juta / hari / 1%** | Target omzet Roeang Kita (Journal Arta). Bukti pengunjung batal: kendaraan "dilempar ke bahu jalan" (Pak Asep), parkir motor penuh di hari kerja (Bu Mei), 72 keluhan parkir di Google Maps |
| B | **Lahan parkir dipakai event tanpa terlihat dampaknya** | 34 hari × ±800 slot = **27.200 slot-hari** hilang selama FKB. Contoh pada tarif Rp5.000 per kendaraan per hari (asumsi, cek papan tarif): ±Rp136 juta | **27.200 slot-hari** | Bu Mei (±800 per area), berita FKB (34 hari). Asumsi: Area Parkir Barat = satu area |
| C | **Data peserta tidak dimiliki** | ±30 event per bulan berjalan tanpa data jumlah peserta di sistem Summarecon | **±360 event / tahun** | Pak Ade |

**Kalimat untuk slide (pakai A sebagai angka utama):**

> **"Saat Roeang Kita, setiap 1% pengunjung yang batal karena parkir penuh berarti Rp40 juta omzet hilang per hari."**

Cara menjawab kalau juri bertanya "1% dari mana?": "1% adalah satuan supaya bisa dihitung ulang, bukan klaim. Kalau 5% pengunjung batal, berarti Rp200 juta per hari. Datanya belum ada, karena justru itu yang belum tercatat. SMICC-TS yang akan mencatatnya."

Sebelum Demo Day, lengkapi supaya B bisa dipakai sebagai angka rupiah: foto papan tarif parkir dan konfirmasi kapasitas Area Parkir Barat ke Bu Mei.

---

## Outline 10 slide

Tiap slide: judul, isi di layar, visual, naskah, dan asal slide lama. Durasi total di luar demo ±3 menit.

### Slide 1 · Pembuka (10 detik)

| | |
|---|---|
| **Judul** | Event di Summarecon Mall Bandung, terpantau sebelum penuh |
| **Sub** | SMICC-TS · Tim Iso Iso Wae · Bandung Build Challenge 2026 |
| **Isi** | Nama 3 anggota + peran (Dima: Hustler, Martio: Hipster, Adnan: Hacker) |
| **Visual** | Foto **asli** Summarecon Mall Bandung dari kunjungan 12 Nov (atrium/parkir), atau tangkapan layar Command Center. **Jangan pakai foto slide 1 lama**: itu mall di luar negeri (TK Maxx, B&M, Boots) |
| **Naskah** | "Kami tim Iso Iso Wae. Kemarin kami ke Summarecon Mall Bandung dan menemukan satu masalah yang terjadi hampir setiap hari." |
| **Dari slide lama** | 1 (ganti foto) + 2 (gabung nama tim) |

### Slide 2 · Masalah (25 detik)

| | |
|---|---|
| **Judul** | Event hampir setiap hari, tapi tidak ada yang tahu berapa orang yang sudah masuk |
| **Isi** | 4 kotak tidak terhubung: **Tiket** (loket.com) · **Peserta** (gelang, tidak tercatat) · **Kendaraan** (gate parkir manual) · **Pemantauan** (CCTV + 2 petugas). Di bawahnya garis putus bertulisan "tidak terhubung" |
| **Angka** | ±30 event / bulan |
| **Visual** | Diagram [RISET_LAPANGAN §2.1](../01_Riset/RISET_LAPANGAN.md#21-kondisi-sekarang), digambar ulang dengan ikon |
| **Sumber kecil** | Wawancara Pak Ade & Pak Asep, 12 Nov 2026 |
| **Naskah** | "Tiket dijual lewat loket.com, peserta ditandai gelang, kendaraan masuk lewat gate manual, keramaian dipantau dari CCTV. Keempatnya tidak terhubung. Summarecon baru tahu area penuh setelah penuh." |
| **Dari slide lama** | Baru. Hapus slide 3 lama (rebutan kursi, QR palsu, event musiman) |

### Slide 3 · Bukti dan kerugian (25 detik), slide terpenting

| | |
|---|---|
| **Judul** | Kamis pagi, parkir motor sudah penuh. Saat event besar, itu berarti omzet hilang. |
| **Kiri** | Angka sangat besar **1.200 / 1.200**, di bawahnya "Parkir motor penuh, Kamis 12 Nov 2026, sebelum 11.30" |
| **Kanan (sorotan oranye)** | **Rp40 juta / hari**, dengan keterangan "omzet hilang untuk setiap 1% pengunjung yang batal (Roeang Kita, target Rp12 M / 3 hari)" |
| **Bawah, kecil** | 34 hari lahan parkir dipakai FKB · 72 dari 125 keluhan Google Maps soal parkir |
| **Visual** | Foto Bu Mei di area parkir ([foto-03](../01_Riset/dokumentasi/foto-03_bu-mei_petugas-parkir_2026-11-12.jpeg)) |
| **Sumber kecil** | Wawancara Bu Mei 12 Nov 2026 · Journal Arta · Fimela · scraping Google Maps 12 Nov 2026 |
| **Naskah** | "Hari Kamis, sebelum jam setengah dua belas, parkir motor sudah penuh. Itu hari kerja. Sekarang bayangkan saat Roeang Kita, yang menargetkan omzet 12 miliar dalam 3 hari. Setiap 1% pengunjung yang batal karena parkir penuh berarti 40 juta rupiah hilang per hari." |
| **Dari slide lama** | Baru. Hapus slide 4 lama (kursi bioskop, "tiket habis kursi kosong" tanpa sumber) |

### Slide 4 · Target pengguna (20 detik)

| | |
|---|---|
| **Judul** | Kami bicara langsung dengan tiga orang yang merasakannya |
| **Isi** | 3 kartu: foto asli + nama + peran + satu kutipan. **Pak Ade** ditandai "pengguna utama" |
| | **Pak Ade**, Manajemen, PIC Event: "Inginnya yang masuk itu tercatat di sistem, jadi bisa kepantau." |
| | **Pak Asep**, Security: "Kalau sudah penuh baru gate di-cut, sisanya dilempar ke bahu jalan." |
| | **Bu Mei**, Petugas Parkir: "Kalau lagi rame banget, tidak ke-handle." |
| **Visual** | [foto-01 Pak Asep](../01_Riset/dokumentasi/foto-01_pak-asep_security_2026-11-12.jpeg), [foto-02 Pak Ade](../01_Riset/dokumentasi/foto-02_pak-ade_manajemen-pic-event_2026-11-12.jpeg), [foto-03 Bu Mei](../01_Riset/dokumentasi/foto-03_bu-mei_petugas-parkir_2026-11-12.jpeg) |
| **Sumber kecil** | Wawancara tatap muka, Summarecon Mall Bandung, Kamis 12 Nov 2026 |
| **Naskah** | "Pengguna utama kami Pak Ade, PIC event. Beliau sendiri yang bilang ingin semua yang masuk tercatat dan bisa dipantau." |
| **Dari slide lama** | Ganti slide 5 lama (5 peran dengan foto stok). Peran lain (pengunjung, EO, gate) cukup muncul di alur slide 5 |
| **Catatan** | Kutipan Pak Asep dipilih karena langsung menjelaskan kenapa omzet hilang (kendaraan diusir). Kutipan masih parafrase dari catatan tim. Kalau sempat, minta narasumber menyetujuinya |

### Slide 5 · Solusi (20 detik)

| | |
|---|---|
| **Judul** | Satu alur: dari pengajuan acara sampai orang dan kendaraan di lokasi |
| **Isi** | 4 langkah dengan panah, tiap langkah ada tangkapan layar kecil dan siapa pelakunya: **1. Ajukan & setujui** (Tenant/EO, Divisi Event, Operasional Mall; area & lahan parkir dicek) → **2. Jual tiket** (pengunjung, e-ticket QR) → **3. Check-in QR** (petugas gate, setiap peserta tercatat) → **4. Command Center** (jumlah orang, perkiraan kendaraan, insiden otomatis) |
| **Visual** | 4 tangkapan layar asli (lihat [Aset](#aset-yang-perlu-disiapkan)) |
| **Naskah** | "SMICC-TS menghubungkan semuanya. Acara diajukan dan disetujui di sistem, tiket dijual, peserta check-in dengan QR, dan Command Center langsung melihat berapa orang dan kendaraan yang datang." |
| **Dari slide lama** | Gabungan slide 6 + 8 lama (judul diganti kalimat, ilustrasi diganti tangkapan layar) |

### Slide 6 · Demo (±2 menit)

| | |
|---|---|
| **Judul** | Demo |
| **Isi** | smiccts.vercel.app · QR ke aplikasi · tulisan kecil "Video cadangan tersedia" |
| **Alur** | Lihat [Naskah demo](#naskah-demo-2-menit) |
| **Cadangan** | Video demo disimpan di laptop (bukan hanya link). Kalau internet bermasalah, jalankan `node server.js` di laptop (bisa tanpa internet) atau putar video |
| **Dari slide lama** | Baru |

### Slide 7 · Pembeda (20 detik)

| | |
|---|---|
| **Judul** | loket.com menjual tiket. SMICC-TS memantau mall. |
| **Isi** | Tabel 2 kolom (loket.com · SMICC-TS), ✅/❌, 5 baris: data peserta milik Summarecon · event tenant & event gratis tercatat · pengajuan & persetujuan acara di sistem · perkiraan kendaraan dari tiket terjual · masalah di gate otomatis jadi insiden |
| **Sumber** | [RISET_LAPANGAN §4](../01_Riset/RISET_LAPANGAN.md#pembeda-dengan-loketcom) |
| **Naskah** | "Summarecon sudah memakai loket.com, tapi datanya berhenti di penjualan. Kami bukan sekadar mengganti cara jual tiket. Kami menghubungkan tiket ke operasional mall." |
| **Dari slide lama** | Baru. Jawaban pertanyaan juri nomor 1 dari mentor |

### Slide 8 · Dampak: yang tidak lagi hilang (20 detik)

| | |
|---|---|
| **Judul** | Tanpa SMICC-TS, kerugiannya tidak terlihat. Dengan SMICC-TS, bisa dicegah sebelum penuh. |
| **Isi** | 3 baris "Tanpa → Dengan", tiap baris diawali angka besar: |
| | **Rp40 juta / hari / 1%**: pengunjung batal karena parkir penuh → perkiraan kendaraan sejak tiket terjual, kantong parkir tambahan disiapkan sebelum event |
| | **27.200 slot-hari**: lahan parkir dipakai FKB tanpa terlihat dampaknya → area & lahan parkir dicek saat acara diajukan (Parkir Barat ditandai) |
| | **±360 event / tahun**: berjalan tanpa data peserta → setiap peserta tercatat saat check-in, datanya milik Summarecon |
| **Visual** | Kolom kiri abu-abu (Tanpa), kanan oranye (Dengan). Angka paling besar |
| **Sumber kecil** | Lihat [Pendapatan yang hilang](#pendapatan-yang-hilang-tanpa-smicc-ts) |
| **Naskah** | "Selama ini kerugian itu tidak terlihat karena tidak tercatat. Dengan SMICC-TS, tim operasional bisa bertindak sebelum parkir dan atrium penuh, bukan setelah pengunjung pergi." |
| **Dari slide lama** | Ganti slide 14 lama (hapus baris "musim acara") |

### Slide 9 · Siap dipakai, termasuk saat sistem mati (25 detik)

| | |
|---|---|
| **Judul** | Siap diuji di satu event berikutnya di Atrium Cibadag |
| **Kiri: tahapan** | 1. **Uji coba 1 event** Summarecon (check-in QR + Command Center) · 2. **Semua event** Summarecon · 3. **Event tenant & EO** (pengajuan + tiket lewat sistem) |
| **Kanan: kalau sistem mati** | **SOP-EVT-05**: gate pindah ke mode cadangan ≤ 5 menit · **Manifest harian** otomatis pukul 23.00, tersimpan di perangkat gate, bisa diunduh tanpa server · Gate cocokkan kode booking + nama, centang manual, pasang gelang · Data manual dimasukkan ulang H+1 |
| **Bawah: yang mengoperasikan** | Tim operasional mall di Command Center · Divisi Event & Operasional Mall menyetujui · Tenant/EO mengelola acaranya |
| **Visual** | Tangkapan layar kartu "Cadangan kalau sistem mati" di halaman Check-in |
| **Naskah** | "Kami siap mulai dari satu event di Atrium Cibadag. Kalau server atau internet mati saat event, setiap gate sudah punya manifest peserta dari cadangan jam 11 malam, jadi pengunjung tidak menumpuk di atrium." |
| **Dari slide lama** | Baru. Jawaban pertanyaan juri "kalau sistem gagal" dan "siapa yang mengoperasikan" |

### Slide 10 · Penutup (10 detik)

| | |
|---|---|
| **Judul** | Event Summarecon, terpantau sebelum penuh |
| **Isi** | QR besar ke smiccts.vercel.app · link GitHub · nama 3 anggota |
| **Naskah** | "Terima kasih. Silakan coba langsung lewat QR ini." |
| **Dari slide lama** | Ganti slide 15 lama (sekarang kosong) |

---

## Slide cadangan (setelah penutup, hanya untuk tanya-jawab)

| # | Judul | Isi | Dari slide lama |
|---|---|---|---|
| C1 | Ribuan pembeli bersamaan: satu kursi tetap satu pembeli | Uji 25 pembeli serentak → 1 berhasil, 24 ditolak. QR yang sama di 2 gate → 1 diterima. Kursi ditahan 8 menit, batas bayar 15 menit | 9 (pakai apa adanya, judul diganti kalimat) |
| C2 | Hitungan pendapatan yang hilang | Tabel A–C dari [Pendapatan yang hilang](#pendapatan-yang-hilang-tanpa-smicc-ts), lengkap dengan rumus dan asumsi | Baru |
| C3 | Analisis ulasan pengunjung | Menu Analisis Sentimen: 2.300 ulasan Google Maps, keluhan per topik, keluhan saat FKB, rekomendasi | Baru |
| C4 | Keamanan akses per peran | Akun terpisah per peran, login dikunci sementara setelah 5 kali salah, server menolak perubahan dari peran yang tidak berhak, log aktivitas berantai | 13 (dikoreksi) |

## Dibuang dari deck lama

| Slide lama | Alasan |
|---|---|
| 3 · 3 masalah (rebutan kursi, calo, musiman) | Generik dan tanpa sumber. "Musiman" bertentangan dengan riset (event hampir setiap hari) |
| 4 · Siapa dirugikan | Kutipan dan foto tidak dari Summarecon |
| 7 · Validasi 3 masalah | Menjawab masalah yang dibuang. Klaim "QR berubah tiap 10 menit" tidak ada di aplikasi |
| 10 · Mindmap 6 pilar | Berisi fitur yang tidak ada (HVAC otomatis, CRM, naming rights, P&L harian) |
| 11 · Command Center (foto stok) | Diganti tangkapan layar asli di slide 5 |
| 12 · Mengapa SMICC-TS | Mengulang slide lain |
| 13 · 8 keunggulan | Terlalu teknis untuk slide utama, pindah ke cadangan C4 |

---

## Naskah demo (2 menit)

Siapkan sebelum naik panggung:
- Buka aplikasi, login **Tim Event Mall**, tekan **Ctrl+K → Reset data contoh**.
- Siapkan tab-tab yang dibutuhkan supaya tidak ada login di depan juri.

| Detik | Layar | Yang dilakukan | Ucapan |
|---|---|---|---|
| 0–15 | Command Center → **Tiket & Insiden** | Biarkan berjalan. Tiket baru masuk di atas, status bergerak | "Ini ruang kontrol mall. Setiap kejadian tercatat dan diikuti sampai selesai." |
| 15–45 | Konsol pengelola, akun **Tenant/EO**, EVT-28 → Persetujuan | Tunjukkan area Exhibition Hall A dan dokumen → **Ajukan ulang** → **Lanjut sebagai Divisi Event** → Setujui → **Lanjut sebagai Operasional Mall** → Setujui | "Pengajuan acara yang dulu lewat berkas dan dua divisi, sekarang di sistem. Area dan lahan parkir dicek sejak awal." |
| 45–60 | Kembali ke Tenant/EO | **Publikasikan** → buka `/pengunjung`, acara langsung tampil | "Begitu disetujui, acara langsung bisa dijual." |
| 60–85 | Portal pengunjung (ponsel) | Pilih kategori → pilih kursi → bayar sandbox → e-ticket QR | "Pengunjung beli tiket dan langsung dapat QR." |
| 85–105 | Halaman **Check-in** | Pindai QR → VALID. Pindai lagi → SUDAH DIGUNAKAN. Tunjuk kartu **Cadangan kalau sistem mati** | "Setiap orang yang masuk tercatat. Kalau sistem mati, gate tetap punya manifest dari cadangan jam 11 malam." |
| 105–120 | Command Center → **Pemantauan Event** | Tunjukkan peserta yang sudah masuk dan perkiraan tambahan kendaraan | "Command Center langsung tahu berapa orang dan kendaraan yang datang, sebelum parkir penuh." |

Kalau waktu mepet, lewati detik 60–85 dan pakai QR yang sudah dibeli sebelumnya.

---

## Persiapan tanya-jawab

| Pertanyaan juri (dari mentor) | Jawaban singkat | Slide |
|---|---|---|
| Apa bedanya dengan aplikasi tiket lain? | loket.com berhenti di penjualan. SMICC-TS menghubungkan pengajuan acara, tiket, check-in, parkir, dan Command Center, dan datanya milik Summarecon | 7 |
| Kenapa Summarecon perlu ini? | Parkir motor penuh di hari kerja. Saat event besar, setiap 1% pengunjung yang batal berarti Rp40 juta omzet hilang per hari. Pak Ade sendiri ingin yang masuk tercatat | 3, 8 |
| Angka apa dari Summarecon yang mendukung? | 1.200/1.200 parkir motor, FKB 34 hari di lahan parkir, target omzet Roeang Kita Rp12 miliar, 72 dari 125 keluhan Google Maps soal parkir | 3 |
| Rp40 juta itu dari mana? | Rp12 miliar ÷ 3 hari = Rp4 miliar per hari. 1% = Rp40 juta. 1% adalah satuan hitung, bukan klaim. Jumlah yang batal belum tercatat, dan itu yang akan dicatat SMICC-TS | C2 |
| Siapa yang mengoperasikan? | Tim operasional mall di Command Center. Divisi Event & Operasional Mall menyetujui pengajuan. Tenant/EO mengelola acaranya. ⚠️ Konfirmasi ke Pak Ade | 9 |
| Kalau ribuan orang datang bersamaan? | Diuji 25 pembeli serentak pada 1 kursi: hanya 1 berhasil. QR yang sama di 2 gate: hanya 1 diterima | C1 |
| Kalau sistem gagal saat event? | SOP-EVT-05: dalam 5 menit gate pindah ke mode cadangan. Manifest peserta dicadangkan otomatis tiap pukul 23.00 di perangkat gate dan bisa diunduh tanpa server. Gate cocokkan kode booking dan nama, centang manual, pasang gelang. Data dimasukkan ulang H+1. Sistem juga bisa jalan di laptop tanpa internet | 9 |
| Siapa yang bayar? | Tidak dibahas di deck. Kalau ditanya: "Fokus kami sekarang membuktikan masalahnya selesai di satu event. Skema biaya kami diskusikan bersama Summarecon setelah uji coba." | – |
| Angkanya dari mana? | Wawancara langsung 12 Nov 2026 + scraping Google Maps + berita. Tunjukkan folder `01_Riset` | 3 |

## Pembagian bicara

| Bagian | Slide | Durasi | Presenter |
|---|---|---|---|
| Pembuka, masalah, bukti, pengguna | 1–4 | ±1 menit 20 detik | Dima (Hustler) |
| Solusi dan demo | 5–6 | ±2 menit 20 detik | Martio (Hipster) menjelaskan, Adnan (Hacker) mengoperasikan demo |
| Pembeda, dampak, kesiapan, penutup | 7–10 | ±1 menit 20 detik | Dima (Hustler) |

Usulan pembagian ini mengikuti peran di slide tim. Ubah kalau tim punya rencana lain. Kalau latihan lewat 5 menit, gabungkan slide 7 ke slide 8.

## Aset yang perlu disiapkan

| Aset | Cara mengambil | Untuk |
|---|---|---|
| Foto Summarecon asli (atrium/parkir) | Dari kunjungan 12 Nov, atau kunjungan ulang | Slide 1 |
| Foto Pak Ade, Pak Asep, Bu Mei | [01_Riset/dokumentasi](../01_Riset/dokumentasi/README.md) | Slide 3, 4 |
| Foto papan tarif parkir | Kunjungan ulang | Hitungan B (rupiah) |
| Tangkapan layar Persetujuan (tenant) | `/pengelola/e/EVT-28/persetujuan` | Slide 5 langkah 1 |
| Tangkapan layar portal pengunjung (ponsel) | `/pengunjung`, halaman pilih kursi | Slide 5 langkah 2 |
| Tangkapan layar Check-in VALID | `/checkin` | Slide 5 langkah 3 |
| Tangkapan layar Command Center | `/command-center/ticketing` atau `/command-center/event` | Slide 5 langkah 4 |
| Tangkapan layar kartu "Cadangan kalau sistem mati" | `/checkin` (gulir ke bawah pemindai) | Slide 9 |
| QR ke smiccts.vercel.app | Generator QR | Slide 6, 10 |
| Video demo cadangan | Rekam layar alur demo di atas | Slide 6 |

Ambil tangkapan layar **setelah** Reset data contoh, dengan mode terang supaya warnanya cocok dengan deck.

## Checklist

- [ ] Rumusan masalah satu kalimat dipakai di naskah slide 2–3
- [ ] Slide 1 memakai foto Summarecon asli
- [ ] Angka **Rp40 juta / hari / 1%** tampil besar di slide 3 dan 8, lengkap dengan sumber
- [ ] Semua angka berasal dari tabel [Angka siap pakai](#angka-siap-pakai)
- [ ] Slide 4 memakai foto dan kutipan narasumber asli
- [ ] Tidak ada klaim yang tidak ada di aplikasi (QR berubah, HVAC otomatis, CRM, P&L harian)
- [ ] Tidak ada model bisnis di deck
- [ ] Slide 9 menampilkan SOP-EVT-05 dan manifest cadangan harian
- [ ] Ejaan **Cibadag** di semua slide
- [ ] 10 slide utama + slide cadangan di belakang penutup
- [ ] Judul tiap slide berupa kalimat. Dibaca berurutan, sudah bercerita
- [ ] Nomor slide urut
- [ ] Foto papan tarif parkir & kapasitas Area Parkir Barat dikonfirmasi (untuk hitungan B)
- [ ] Video demo cadangan tersimpan di laptop
- [ ] Latihan dengan stopwatch 3 kali, total ≤ 5 menit
- [ ] Ekspor PDF ke folder ini sebagai `BBC2026_IsoIsoWae_Deck.pdf` dan isi link deck di [README](README.md)
