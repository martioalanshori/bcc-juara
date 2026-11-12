# Scraping Ulasan Pengunjung Summarecon Mall Bandung

Tujuan: mendapatkan angka keluhan pengunjung (parkir, antre, penuh, toilet, event) untuk memvalidasi masalah di riset. Hasilnya bisa ditulis seperti contoh mentor:

> "Dari X ulasan pengunjung, Y berisi keluhan, Z di antaranya soal parkir."

## Isi folder

| File | Fungsi |
|---|---|
| `scrape_gmaps.py` | Mengambil ulasan Google Maps Summarecon Mall Bandung ke `data/ulasan_gmaps.csv` |
| `analisis.py` | Mengelompokkan ulasan per topik keluhan, membuat ringkasan angka dan contoh kutipan |
| `data/manual_template.csv` | Template untuk komentar Instagram/TikTok/X yang dikumpulkan manual |

## Cara pakai

Jalankan dari folder `scraping/` (Windows, Git Bash / PowerShell):

```bash
# 1. Sekali saja: siapkan environment
python -m venv .venv
.venv/Scripts/python -m pip install playwright

# 2. Ambil SEMUA ulasan (Chrome asli akan terbuka)
.venv/Scripts/python scrape_gmaps.py
#    --max 500 kalau mau dibatasi.
#    Pertama kali: Google Maps menyembunyikan ulasan kalau belum login.
#    Login Google di jendela Chrome yang terbuka, lalu tekan Enter di terminal.
#    Chrome ini dibuka sebagai Chrome biasa (bukan otomatisasi), jadi login tidak
#    ditolak "Browser atau aplikasi ini mungkin tidak aman".
#    Sesi login disimpan di .chrome-profile/ (sudah di .gitignore, JANGAN di-commit).
#    Berikutnya boleh pakai --headless.

# 3. Analisis
.venv/Scripts/python analisis.py data/ulasan_gmaps.csv

# 4. Perbarui menu Analisis Sentimen di Command Center
.venv/Scripts/python analisis.py data/ulasan_gmaps.csv --export-js
#    Menulis app/js/command-center/sentimen-data.js (angka ringkasan + kutipan tanpa nama).
#    Lalu naikkan ?v= di semua app/pages/*.html agar browser memuat data baru.
#    Sumber lain (X, TikTok, Instagram): tambahkan CSV-nya ke perintah yang sama, kolom `sumber` diisi nama platform.
```

Hasil:
- `data/ulasan_gmaps.csv`: data mentah (nama, rating, tanggal, teks, balasan pengelola). Disimpan bertahap tiap 25 halaman, jadi kalau terputus data yang sudah terambil tidak hilang.
- `data/hasil_analisis.md`: ringkasan angka per topik, keluhan saat periode event, contoh kutipan, dan kalimat siap pakai untuk deck
- `data/hasil_berlabel.csv`: semua data dengan label topik, bisa dicek manual di Excel

## Menambah data dari Instagram / TikTok / X

Platform ini butuh login, jadi kumpulkan manual:

1. Buka postingan event Sumaba (misalnya FKB Vol. 3 atau Roeang Kita) dan cari komentar keluhan.
2. Salin ke CSV dengan format `data/manual_template.csv` (kolom `sumber, tanggal, rating, nama, teks, link`). Hapus 2 baris contoh.
3. Screenshot komentarnya sebagai bukti.
4. Analisis bersama data Google Maps:

```bash
.venv/Scripts/python analisis.py data/ulasan_gmaps.csv data/manual_medsos.csv
```

## Catatan

- **Cara kerja.** Script membuka Chrome asli dengan port debug 9222 dan profil `.chrome-profile`, lalu memanggil API internal Maps (`listugcposts`) dari tab yang sudah login, 20 ulasan per permintaan sampai habis (7.000 ulasan sekitar 5-10 menit). Kalau formatnya berubah, script otomatis kembali ke cara scroll (lebih lambat). Paksa cara scroll dengan `--scroll`.
- **Chrome utama tidak bisa dipakai langsung.** Sejak Chrome 136, port debug diabaikan untuk profil Chrome bawaan, jadi dipakai profil terpisah yang cukup login sekali. Kalau Anda sudah membuka Chrome sendiri dengan `--remote-debugging-port=9222 --user-data-dir=...`, sambungkan dengan `--cdp http://127.0.0.1:9222`.
- **Tanggal.** Lewat API, kolom `tanggal` adalah tanggal pasti dari Google. Lewat cara scroll hanya perkiraan dari teks "2 bulan lalu".
- **Jumlah bisa kurang dari angka di Google.** Angka ulasan di Maps ikut menghitung ulasan yang disembunyikan Google. Ulasan hanya-rating tetap masuk CSV dengan teks kosong (analisis hanya memakai yang ada teksnya).
- **Label otomatis berbasis kata kunci.** Cek ulang `hasil_berlabel.csv` sebelum angkanya dipakai di deck. Kata kunci bisa ditambah di `TOPIK` dan `NEGATIF` di `analisis.py`.
- **Kalau script berhenti** (Google mengubah tampilan, muncul captcha), jalankan tanpa `--headless` dan selesaikan di jendela browser.
- Jangan publikasikan nama pengulas di deck.
- Catat tanggal scraping di `05_Log` sebagai bukti proses riset.
