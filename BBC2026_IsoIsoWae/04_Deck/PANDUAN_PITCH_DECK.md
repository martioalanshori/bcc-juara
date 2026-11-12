# Panduan Pitch Deck

Disusun dari arahan mentor ([notulen](../05_Log/mentoring/2026-11-11_notulen-mentoring.md)) dan hasil riset ([RISET_LAPANGAN.md](../01_Riset/RISET_LAPANGAN.md)).

## Prinsip

| Arahan mentor | Artinya untuk deck |
|---|---|
| Waktu **5 menit**, demo ±2 menit | Slide lain hanya ±3 menit. Maksimal 10 slide, ±20 detik per slide |
| Wajib: **masalah, target pengguna, solusi** | Tiga bagian ini paling kuat, letakkan di awal |
| **Harus ada angka** dengan sumber nyata | Setiap angka diberi sumber kecil di pojok slide |
| Masalah harus **terjadi di Summarecon** | Pakai foto wawancara, nama narasumber, nama tempat asli (Atrium Cibadag) |
| **Bisa dipahami tanpa presenter**, jangan banyak teks | Satu pesan per slide. Judul berupa kalimat, bukan label |
| Juri lebih banyak tanya **bisnis** daripada teknis | Jangan bahas stack/hosting. Siapkan jawaban model bisnis |

**Cara cek:** baca judul slide 1 sampai 10 berurutan. Kalau ceritanya sudah tersampaikan dari judul saja, deck-nya sudah benar.

---

## Susunan Slide

### Slide 1 · Pembuka (±10 detik)

| | |
|---|---|
| **Judul** | SMICC-TS: Event di Summarecon Mall Bandung, Terpantau Sebelum Penuh |
| **Isi** | Logo/nama tim IsoIsoWae, nama 3 anggota, logo Bandung Build Challenge 2026 |
| **Visual** | Foto Atrium Cibadag saat event (atau tangkapan layar Command Center) |
| **Ucapkan** | "Kami tim IsoIsoWae. Kemarin kami ke Summarecon Mall Bandung dan menemukan satu masalah yang terjadi hampir setiap hari." |

### Slide 2 · Masalah (±25 detik)

| | |
|---|---|
| **Judul** | Event hampir setiap hari, tapi tidak ada yang tahu berapa orang yang sudah masuk |
| **Isi** | 3 ikon berjajar: 🎫 Tiket di loket.com · 🟡 Gelang tidak tercatat · 📹 Dipantau lewat CCTV saja |
| **Visual** | Diagram "kondisi sekarang" (empat kotak yang tidak terhubung) dari [RISET_LAPANGAN §2.1](../01_Riset/RISET_LAPANGAN.md#21-kondisi-sekarang) |
| **Ucapkan** | "Tiket dijual lewat loket.com, peserta ditandai gelang, keramaian dipantau dari CCTV. Ketiganya tidak terhubung, jadi Summarecon baru tahu area penuh setelah penuh." |

### Slide 3 · Bukti (±25 detik) — slide terpenting

| | |
|---|---|
| **Judul** | Kamis pagi, parkir motor sudah penuh: 1.200 dari 1.200 |
| **Isi** | Angka besar **1.200 / 1.200** · di bawahnya: "Kamis, 12 Nov 2026, sebelum pukul 11.30" · baris kedua: "Festival Kuliner Bandung memakai lahan parkir **34 hari**" |
| **Visual** | Foto wawancara Bu Mei di area parkir |
| **Sumber kecil** | Wawancara Bu Mei, petugas parkir, 12 Nov 2026 · Fimela |
| **Ucapkan** | "Saat kami wawancara petugas parkir hari Kamis, sebelum jam setengah dua belas, parkir motor sudah penuh. Itu hari kerja, belum jam makan siang. Saat Festival Kuliner, lahan parkirnya sendiri dipakai event selama 34 hari." |

> Kalau hasil scraping ulasan sudah ada, tambahkan satu baris: "**X dari Y** ulasan Google Maps mengeluhkan parkir/antre."

### Slide 4 · Target pengguna (±20 detik)

| | |
|---|---|
| **Judul** | Kami bicara langsung dengan tiga orang yang merasakannya |
| **Isi** | 3 kartu: foto + nama + satu kutipan pendek |
| | **Pak Ade**, PIC Event: "Inginnya yang masuk tercatat di sistem, jadi bisa kepantau." |
| | **Pak Asep**, Security: "Penumpukan orang kami pantau dari CCTV saja." |
| | **Bu Mei**, Petugas Parkir: "Kalau lagi rame banget, tidak ke-handle." |
| **Ucapkan** | "Pengguna utama kami adalah Pak Ade, PIC event. Beliau sendiri yang bilang ingin semua yang masuk tercatat dan bisa dipantau." |

### Slide 5 · Solusi (±20 detik)

| | |
|---|---|
| **Judul** | Satu sistem: dari tiket terjual sampai orang dan kendaraan di lokasi |
| **Isi** | Alur 4 langkah: **Beli tiket** → **Check-in QR di gate** → **Command Center melihat jumlah orang & perkiraan kendaraan** → **Peringatan sebelum penuh** |
| **Visual** | Empat tangkapan layar kecil (pengunjung, check-in, pengelola, Command Center) |
| **Ucapkan** | "SMICC-TS menghubungkan tiket, check-in, dan Command Center. Begitu tiket terjual, manajemen sudah bisa memperkirakan berapa orang dan kendaraan yang akan datang." |

### Slide 6 · Demo (±2 menit)

| | |
|---|---|
| **Judul** | Demo |
| **Isi** | Live di smiccts.vercel.app, atau video cadangan |
| **Alur** | Lihat [03_Prototype/README.md](../03_Prototype/README.md#alur-demo-2-menit). **Langsung ke fitur inti**, lewati login dan pemilihan peran |
| **Cadangan** | Video demo diputar kalau internet bermasalah. Siapkan di laptop, bukan hanya link |

### Slide 7 · Beda dengan loket.com (±20 detik)

| | |
|---|---|
| **Judul** | loket.com menjual tiket. SMICC-TS memantau mall. |
| **Isi** | Tabel 2 kolom, 4 baris (pakai ✅/❌): data milik Summarecon · event gratis & tenant tercatat · perkiraan parkir · insiden otomatis |
| **Sumber** | [RISET_LAPANGAN §4](../01_Riset/RISET_LAPANGAN.md#pembeda-dengan-loketcom) |
| **Ucapkan** | "Summarecon sudah memakai loket.com, tapi datanya berhenti di penjualan. Kami tidak menggantikan cara jual tiketnya saja, kami menghubungkannya ke operasional mall." |

### Slide 8 · Dampak untuk Summarecon (±20 detik)

| | |
|---|---|
| **Judul** | Dari menangani setelah penuh, menjadi bertindak sebelum penuh |
| **Isi** | Sebelum → Sesudah, 3 baris: Atrium (CCTV → jumlah peserta langsung) · Parkir (gate ditutup setelah penuh → peringatan dari tiket terjual) · Komplain (tahu dari medsos → insiden otomatis) |
| **Ucapkan** | "Hasilnya, tim operasional bisa bertindak sebelum atrium, parkir, dan toilet penuh, bukan setelah ada keluhan di medsos." |

### Slide 9 · Rencana implementasi & model bisnis (±25 detik)

| | |
|---|---|
| **Judul** | Siap diuji di satu event berikutnya di Atrium Cibadag |
| **Isi** | Kiri: **Tahapan** (1. Uji coba 1 event · 2. Semua event Summarecon · 3. Event tenant) · Kanan: **Model bisnis** (siapa bayar, siapa operasikan) |
| **Pengembangan** | Approval event digital (keluhan Pak Ade), registrasi kendaraan saat beli tiket, integrasi gate parkir |
| **Ucapkan** | Jelaskan tahapan dan siapa yang membayar. **Model bisnis harus diputuskan tim dulu** (lihat bagian Tanya-Jawab) |

### Slide 10 · Penutup (±10 detik)

| | |
|---|---|
| **Judul** | Event Summarecon, terpantau sebelum penuh |
| **Isi** | QR ke smiccts.vercel.app · link GitHub · nama 3 anggota |
| **Ucapkan** | "Terima kasih. Silakan coba langsung lewat QR ini." |

---

## Pembagian Bicara

| Bagian | Slide | Durasi | Presenter |
|---|---|---|---|
| Pembuka, masalah, bukti, pengguna | 1–4 | ±1 menit 20 detik | _[isi]_ |
| Solusi dan demo | 5–6 | ±2 menit 20 detik | _[isi]_ |
| Pembeda, dampak, rencana, penutup | 7–10 | ±1 menit 20 detik | _[isi]_ |

Latihan dengan stopwatch minimal 3 kali. Kalau lewat 5 menit, potong slide 8 lebih dulu (isinya bisa digabung ke slide 7).

---

## Persiapan Tanya-Jawab

| Pertanyaan juri (dari mentor) | Jawaban | Status |
|---|---|---|
| Apa bedanya dengan aplikasi tiket lain? | loket.com berhenti di penjualan. SMICC-TS menghubungkan tiket ke check-in, parkir, dan Command Center | ✅ Siap |
| Kenapa Summarecon perlu ini? | Pak Ade sendiri ingin yang masuk tercatat. Parkir motor sudah penuh di hari kerja. Event hampir setiap hari | ✅ Siap |
| Siapa yang bayar? | _Pilihan:_ (a) Summarecon berlangganan per bulan, atau (b) biaya layanan per tiket dari penyelenggara/tenant, gratis untuk event Summarecon sendiri | ⚠️ **Putuskan tim** |
| Siapa yang mengoperasikan? | Tim operasional mall memantau di Command Center. EO/tenant mengelola acaranya lewat konsol pengelola | ⚠️ Konfirmasi ke Pak Ade |
| Kalau ribuan orang datang bersamaan? | Sudah diuji 25 pembeli serentak pada satu kursi: hanya 1 yang berhasil. QR yang sama di 2 gate: hanya 1 yang diterima | ✅ Siap |
| Kalau sistem mati saat event? | _Usulan:_ daftar peserta diunduh (CSV) sebelum event sebagai cadangan di gate, petugas kembali ke cara manual + gelang | ⚠️ **Putuskan tim** |
| Angkanya dari mana? | Wawancara langsung 12 Nov 2026 + berita (tunjukkan [01_Riset](../01_Riset/README.md)) | ✅ Siap |

---

## Gaya Visual

- **Satu pesan per slide**, judul berupa kalimat lengkap.
- **Angka besar** untuk bukti (1.200 / 1.200, 34 hari), sumber ditulis kecil di pojok bawah.
- **Foto asli** dari [dokumentasi](../01_Riset/dokumentasi/README.md) lebih kuat dari ilustrasi stok.
- Warna dan font mengikuti tampilan aplikasi supaya deck dan demo terasa satu produk.
- Teks maksimal ±20 kata per slide (kecuali tabel pembeda).

## Checklist Sebelum Demo Day

- [ ] Slide 1–10 selesai, judul dibaca berurutan sudah bercerita
- [ ] Semua angka punya sumber
- [ ] Foto wawancara dan denah sudah masuk
- [ ] Model bisnis dan rencana cadangan sudah diputuskan
- [ ] Screenshot diambil **setelah** [NEXT_ACTION](../03_Prototype/NEXT_ACTION.md) P0 selesai
- [ ] Video demo cadangan tersimpan di laptop
- [ ] Latihan 3 kali, total ≤ 5 menit
- [ ] Ekspor PDF ke folder ini, link deck diisi di [README](README.md)
