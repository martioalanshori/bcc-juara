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

# 2. Ambil ulasan (browser Chrome akan terbuka)
.venv/Scripts/python scrape_gmaps.py --max 500
#    Pertama kali: Google Maps menyembunyikan ulasan kalau belum login.
#    Login Google di jendela Chrome yang terbuka, lalu tekan Enter di terminal.
#    Sesi login disimpan di .chrome-profile/ (sudah di .gitignore, JANGAN di-commit).

# 3. Analisis
.venv/Scripts/python analisis.py data/ulasan_gmaps.csv
```

Hasil:
- `data/ulasan_gmaps.csv`: data mentah (nama, rating, tanggal, teks)
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

- **Tanggal Google Maps hanya perkiraan.** Google menampilkan "2 bulan lalu", bukan tanggal pasti, jadi kolom `tanggal` dihitung mundur dari hari scraping.
- **Label otomatis berbasis kata kunci.** Cek ulang `hasil_berlabel.csv` sebelum angkanya dipakai di deck. Kata kunci bisa ditambah di `TOPIK` dan `NEGATIF` di `analisis.py`.
- **Kalau script berhenti** (Google mengubah tampilan, muncul captcha), jalankan tanpa `--headless` dan selesaikan di jendela browser.
- Ambil secukupnya untuk riset (ratusan, bukan puluhan ribu) dan jangan publikasikan nama pengulas di deck.
- Catat tanggal scraping di `05_Log` sebagai bukti proses riset.
