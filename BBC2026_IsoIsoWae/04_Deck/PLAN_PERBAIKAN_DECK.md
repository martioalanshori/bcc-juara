# Rencana Perbaikan Deck (presentation/index.html)

Dasar: masukan tim pada deck versi 12 Nov 2026 malam. Ekspor PDF dikerjakan tim sendiri. Rencana ini hanya mengubah `index.html`, `styles.css`, `script.js`, dan `assets/`.

## Masalah yang ditemukan di versi sekarang

| Masukan | Yang terjadi di deck sekarang |
|---|---|
| Poin tiap slide belum jelas | Banyak slide berisi beberapa hal sekaligus (angka + daftar + sumber panjang). Tidak ada kalimat yang menjelaskan "jadi apa artinya". Istilah teknis (anomali gate, insiden P2, slot-hari, manifest) |
| Birokrasi belum terangkat | Keluhan Pak Ade soal pengajuan lewat 2 divisi hanya muncul di satu baris slide Dampak dan satu ikon kecil di slide Kerugian |
| Bahasa membingungkan | Kalimat panjang, kata serapan dan singkatan, gaya laporan. Belum ditulis seperti orang menjelaskan |
| Foto orang di slide utama | Slide 3 dan 5 memakai foto wawancara. Foto itu juga memuat anggota tim dan papan nama toko |
| Menyebut brand lain | loket.com di slide Masalah dan Pembeda; Google Maps, X, TikTok, Instagram; logo toko di foto dan tangkapan layar |
| Nama aplikasi | Masih SMICC-TS |
| Command Center belum terangkat | Hanya muncul sebagai langkah 4 di slide Solusi |
| Visual monoton | Foto asli dan ilustrasi tidak dibagi dengan sengaja |
| Cerita tidak nyambung | Tiap slide berdiri sendiri, tidak ada kalimat atau penanda yang membawa ke slide berikutnya |

## Arah baru

**Satu masalah, dua saat.** Mentor meminta satu masalah yang fokus. Masalahnya: *event di mall belum tercatat dari awal sampai akhir.* Masalah ini terlihat di dua saat:

1. **Sebelum event:** pengajuan lewat 2 divisi dengan setumpuk dokumen, lama, dan tidak ada yang tahu sudah sampai mana (birokrasi, dari manajemen mall).
2. **Saat event:** tidak ada yang tahu berapa orang dan kendaraan yang sudah masuk (parkir penuh, atrium penuh).

Summa Apps menjawab keduanya, dan semuanya bermuara di **Command Center**: satu layar untuk manajemen mall.

**Alur cerita (4 babak):**

```
Masalah            Akibat             Solusi                         Buktikan
2 saat yang        kerugian dan       Summa Apps: pengajuan →        demo 1 menit
belum tercatat     siapa yang kena    tiket → check-in → CC          → terima kasih
slide 2-4          slide 5-6          slide 7-11                     slide 12-13
```

Setiap slide punya **penanda babak** kecil di kiri atas (Masalah / Akibat / Solusi / Buktikan) dan **kalimat jembatan** di naskah yang membuka slide berikutnya.

## Aturan bahasa (humanizer)

Diterapkan ke semua teks di slide dan naskah:

- Satu kalimat, satu gagasan. Judul slide adalah kalimat yang bisa berdiri sendiri, maksimal 12 kata.
- Kata kerja aktif dan subjek jelas ("Pak Ade menunggu", bukan "proses approval memakan waktu").
- Tanpa tanda pisah panjang, tanpa "bukan X, tapi Y", tanpa penutup yang mengulang isi.
- Tanpa kata promosi (inovatif, optimal, terintegrasi, revolusioner, real-time).
- Tanpa singkatan yang tidak dijelaskan.

Kamus pengganti:

| Sekarang | Jadi |
|---|---|
| SMICC-TS | Summa Apps |
| anomali gate, insiden P2 | pindaian gagal berulang, laporan kejadian |
| tiket insiden | laporan kejadian |
| slot-hari | hari parkir |
| manifest | daftar peserta |
| Tenant/EO | penyewa dan penyelenggara acara |
| dasbor, real-time | layar, langsung |
| terintegrasi | terhubung |
| approval | persetujuan |
| loket.com | platform tiket yang dipakai sekarang |
| Google Maps, X, TikTok, Instagram | ulasan online, media sosial |
| Command Center | ruang kontrol mall (Command Center), dijelaskan sekali di slide 9, lalu cukup "Command Center" |

## Aturan visual

| Aturan | Penerapan |
|---|---|
| Foto orang tidak masuk slide utama | Foto wawancara hanya di Appendix "Bagaimana riset dilakukan". Persona di slide utama digambar sebagai ilustrasi SVG tanpa wajah: siluet dengan atribut peran (seragam security, rompi parkir, map dokumen) |
| Tidak ada brand lain | Teks: pakai kamus di atas. Gambar: tidak memakai foto yang memperlihatkan papan nama toko. Tangkapan layar dipilih atau dipotong supaya tidak menampilkan nama tenant |
| Selang-seling foto asli dan SVG | Lihat kolom "Visual" di bawah. Foto asli = foto lokasi tanpa orang dan tanpa logo, atau tangkapan layar Summa Apps. Sisanya ilustrasi SVG |
| Satu motif yang menyambung | Garis rute denah (busur Sawarga Courtyard dan atrium bulat) muncul di setiap slide sebagai garis tipis di dasar slide, dengan titik yang bergerak maju sesuai babak. Penonton merasa "berjalan" dari pintu masuk sampai Command Center |

**Foto asli yang perlu diambil tim** (tanpa wajah dan tanpa logo toko yang terbaca). Selama belum ada, slide memakai cadangan SVG yang sudah disiapkan:

| Foto | Untuk slide | Cadangan sementara |
|---|---|---|
| Parkir motor penuh atau palang gate parkir | 4 | SVG meteran parkir penuh |
| Atrium Cibadag dari atas, saat ramai | 1 dan 3 | SVG denah GF |
| Meja kerja dengan map dokumen pengajuan (boleh diatur) | 2 | SVG tumpukan dokumen |

## Susunan slide baru

Kolom **Visual**: F = foto asli lokasi, L = tangkapan layar Summa Apps (asli), S = ilustrasi SVG.

| # | Babak | Judul (kalimat inti) | Isi di layar | Visual | Jembatan ke slide berikutnya (naskah) |
|---|---|---|---|---|---|
| 1 | – | Summa Apps: event di Summarecon Mall Bandung, tercatat dari pengajuan sampai pintu masuk | Nama tim, 3 anggota | F (atrium) atau S (denah) | "Hampir setiap hari ada event di sini. Kami ikuti satu event dari awal." |
| 2 | Masalah | Sebelum event jalan, pengajuannya harus lewat dua divisi | Alur: Penyelenggara → Divisi Event → Operasional Mall, tumpukan dokumen (proposal, denah, surat izin keramaian), jam pasir "berhari-hari". Kutipan Pak Ade: "Pengajuan event harus lewat dua pihak ... Approval-nya lama." Angka: ±30 event per bulan | S | "Setelah disetujui pun, masalahnya belum selesai." |
| 3 | Masalah | Saat event berjalan, tidak ada yang tahu berapa orang sudah masuk | 4 kotak terputus: tiket di platform luar, gelang tidak tercatat, gate parkir manual, CCTV + 2 petugas | S | "Buktinya kami lihat sendiri hari Kamis." |
| 4 | Masalah | Kamis pagi, parkir motor sudah penuh | 1.200 dari 1.200, sebelum 11.30. Pendukung: lahan parkir dipakai event 34 hari; 72 dari 125 keluhan di ulasan online soal parkir | F (parkir) atau S (meteran) | "Kalau parkir penuh, pengunjung pulang. Itu ada harganya." |
| 5 | Akibat | Setiap 1% pengunjung yang batal datang, mall kehilangan Rp25 juta sehari | Angka besar, rumus 1 baris (25.000 × Rp100.000 × 1%), Rp9 miliar setahun. Ditambah 1 baris birokrasi: "Area yang menunggu persetujuan juga tidak bisa disewakan" | S (latar gelap) | "Tiga orang ini yang merasakannya setiap hari." |
| 6 | Akibat | Tiga orang yang paling merasakannya | Ilustrasi persona tanpa wajah: Pak Ade (manajemen, pengguna utama: pengajuan lama + tidak punya data peserta), Pak Asep (security), Bu Mei (parkir), masing-masing 1 kutipan pendek | S (persona) | "Untuk mereka, kami membuat Summa Apps." |
| 7 | Solusi | Summa Apps menghubungkan semuanya, dari pengajuan sampai ruang kontrol | Alur 4 langkah dengan ikon: Ajukan dan setujui → Jual tiket → Check-in QR → Command Center. Satu kalimat per langkah | S (alur) | "Kita mulai dari masalah pertama, pengajuan." |
| 8 | Solusi | Pengajuan acara selesai di satu layar, bukan berpindah meja | Kiri: cara sekarang (berkas, 2 meja, tidak tahu sampai mana). Kanan: tangkapan layar persetujuan (giliran divisi, waktu tunggu, catatan revisi, log siapa melakukan apa). 3 poin: dokumen diunggah sekali, giliran divisi jelas, area dan jadwal dicek otomatis | L | "Setelah acara jalan, semua yang terjadi masuk ke satu tempat." |
| 9 | Solusi | Command Center: satu layar untuk seluruh operasional mall | Tangkapan layar Command Center + ilustrasi hub dengan 5 cabang: pengajuan acara, peserta & check-in, perkiraan kendaraan, laporan kejadian (berjalan terus, ada yang selesai), suara pengunjung. Kalimat: "Manajemen melihat masalah sebelum jadi keluhan." | L + S | "Bedanya dengan cara sekarang jadi jelas." |
| 10 | Solusi | Cara sekarang dan dengan Summa Apps | Tabel 5 baris tanpa nama brand: pengajuan acara, data peserta, orang yang masuk, parkir, masalah di lapangan | S | "Ini yang kami siapkan berikutnya." |
| 11 | Solusi | Mulai dari satu event, lalu terhubung ke gate parkir dan CCTV | Timeline 3 tahap (sekarang / rencana / rencana) | S | "Daripada dijelaskan, kami tunjukkan langsung." |
| 12 | Buktikan | Bagaimana kalau Pak Ade tahu parkir akan penuh, tiga hari sebelum event? | Pertanyaan besar, QR, "Demo 1 menit" | L (latar Command Center samar) | Demo |
| 13 | Buktikan | Terima kasih | QR, tautan, nama tim, "Lampiran untuk pertanyaan" | S | – |

**Lampiran (setelah Terima kasih):** A1 Hitungan kerugian · A2 Kalau sistem mati (SOP + daftar peserta cadangan pukul 23.00) · A3 Ribuan pembeli bersamaan · A4 Siapa mengoperasikan · A5 Apa kata pengunjung · A6 Data dan akses · A7 Bagaimana riset dilakukan (satu-satunya tempat foto wawancara).

**Durasi:** 11 slide cerita × ±20 detik ≈ 3 menit 40 detik + demo 1 menit + terima kasih ≈ 5 menit. Kalau lewat, slide 10 digabung ke slide 9.

## Transisi antarslide

1. **Penanda babak** di kiri atas setiap slide, dengan babak aktif disorot. Penonton tahu sedang di bagian mana.
2. **Garis rute** di dasar slide (motif denah). Titiknya maju dari kiri (pintu masuk) ke kanan (Command Center) seiring slide.
3. **Judul berantai.** Judul tiap slide menjawab kalimat jembatan slide sebelumnya (lihat kolom jembatan). Naskah ini ditulis juga di `FIX.md`.
4. **Mode presentasi di browser** (`script.js`): satu slide penuh layar, tombol panah untuk pindah, transisi geser halus 300 ms, garis rute ikut bergerak. Transisi otomatis mati di mode cetak, sehingga ekspor PDF tetap satu slide per halaman tanpa efek. Menghormati `prefers-reduced-motion`.

## Tugas implementasi

| # | Tugas | File | Selesai kalau |
|---|---|---|---|
| 1 | Ganti nama ke Summa Apps di semua teks | index.html | Tidak ada "SMICC-TS" di slide |
| 2 | Tulis ulang semua teks slide dan lampiran memakai aturan bahasa dan kamus | index.html | Judul ≤ 12 kata, tidak ada istilah di kolom "Sekarang" |
| 3 | Hapus nama brand dari teks, ganti foto/tangkapan layar yang menampilkan logo toko atau nama tenant | index.html, assets/images | Pencarian "loket", "Google", "TikTok", "Instagram", nama toko: kosong di slide utama |
| 4 | Buat ilustrasi SVG: tumpukan dokumen + 2 meja (slide 2), 4 kotak terputus (3), meteran parkir (4), 3 persona tanpa wajah (6), alur 4 langkah (7), hub Command Center (9), timeline (11) | assets/illustrations/*.svg, disisipkan inline | Setiap slide S punya ilustrasi, gaya garis dan warna sama |
| 5 | Siapkan slot foto asli dengan cadangan SVG (slide 1, 2, 4) | index.html, styles.css | Ganti file di assets/images/ langsung terpakai tanpa ubah HTML |
| 6 | Slide baru: Pengajuan acara (8) dan Command Center (9) dengan tangkapan layar asli | index.html, assets/images | Masing-masing satu pesan, 3 poin maksimal |
| 7 | Pindahkan foto wawancara ke Lampiran A7 | index.html | Tidak ada foto orang di slide 1–13 |
| 8 | Penanda babak + garis rute di setiap slide | styles.css, index.html | Babak aktif dan posisi titik benar di 13 slide |
| 9 | Mode presentasi dengan transisi | script.js, styles.css | Panah kiri/kanan berpindah slide dengan transisi; cetak tetap 1 halaman per slide |
| 10 | Kaki slide utama dipendekkan ("Sumber: wawancara 12 Nov 2026, lihat Lampiran A1"), daftar sumber lengkap pindah ke lampiran | index.html | Kaki slide utama ≤ 1 baris |
| 11 | Perbarui FIX.md (urutan, naskah, kalimat jembatan) dan README presentation | FIX.md, presentation/README.md | Sama dengan index.html |
| 12 | Cek di browser 1920 × 1080: tidak ada teks terpotong atau bertumpuk, setiap slide terbaca tanpa presenter | – | Tim membaca judul 1–13 berurutan dan ceritanya tersampaikan |

Ekspor PDF tidak termasuk; tim menjalankan `export.sh` atau mencetak dari Chrome sendiri.

## Keputusan yang perlu dari tim

1. **Sumber di kaki slide.** Mentor meminta angka bersumber, sedangkan tim tidak ingin menyebut brand. Usulan: kaki slide utama hanya menulis "wawancara 12 Nov 2026" atau "berita dan ulasan online, lihat Lampiran". Nama media sumber hanya di Lampiran A1 dan A7.
2. **Nama di aplikasi.** Deck memakai "Summa Apps", sedangkan aplikasi saat demo masih menampilkan "Command Center Summarecon Mall Bandung" dan "SMICC-TS" di beberapa tempat. Perlu diganti juga di aplikasi supaya demo dan deck sama?
3. **Foto lokasi.** Tim bisa mengambil foto parkir dan atrium tanpa wajah dan tanpa logo sebelum Demo Day? Kalau tidak, slide 1, 2, dan 4 memakai cadangan SVG.
4. **Pak Asep.** Papan nama di seragam narasumber bertuliskan "M. Nur Hakim". Nama di deck perlu dicek.
