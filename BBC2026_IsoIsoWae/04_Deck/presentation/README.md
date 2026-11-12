# Pitch deck SMICC-TS (HTML → PDF)

Deck Bandung Build Challenge 2026 tim Iso Iso Wae, dibangun dengan HTML, CSS, dan SVG lalu dicetak ke PDF lewat Chrome headless. Isi mengikuti [../FIX.md](../FIX.md).

| File | Isi |
|---|---|
| `index.html` | 18 slide: 11 slide utama + Appendix A1–A7. Satu `<section class="slide">` per halaman |
| `styles.css` | Design system (warna, tipografi, jarak) dan gaya tiap slide, termasuk CSS cetak |
| `script.js` | Hanya untuk pratinjau di browser: skala agar muat layar, panah kiri/kanan untuk pindah slide |
| `assets/fonts/` | Inter (lokal, sama dengan aplikasi) |
| `assets/images/` | Foto wawancara 12 Nov 2026 dan tangkapan layar prototype (mode terang, data contoh) |
| `assets/icons/qr-smiccts.svg` | QR ke https://smiccts.vercel.app |
| `assets/illustrations/denah-gf.svg` | Denah Ground Floor yang disederhanakan (juga disisipkan langsung di slide 1 agar memakai Inter) |
| `presentation.pdf` | Hasil ekspor, 18 halaman 1920 × 1080 |

## Melihat di browser

Buka `index.html` langsung (klik dua kali). Slide diskalakan agar muat lebar jendela. Panah kanan/bawah atau PageDown untuk slide berikutnya.

## Ekspor ulang ke PDF

Windows (Git Bash):

```sh
cd BBC2026_IsoIsoWae/04_Deck/presentation
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
  --no-pdf-header-footer --virtual-time-budget=5000 --run-all-compositor-stages-before-draw \
  --print-to-pdf="$(cygpath -w "$PWD/presentation.pdf")" "file:///$(cygpath -m "$PWD/index.html")"
```

Atau jalankan `sh export.sh` (perintah yang sama). macOS/Linux: ganti path Chrome dengan `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` atau `google-chrome`, dan pakai path biasa tanpa `cygpath`.

Ukuran halaman diatur oleh CSS (`@page { size: 1920px 1080px; margin: 0 }`), jadi tidak perlu opsi kertas. `--no-pdf-header-footer` menghilangkan header/footer browser. Warna latar ikut tercetak karena `print-color-adjust: exact`.

## Cek hasil

Setelah mengubah slide:

1. Buka `index.html`, periksa tiap slide: tidak ada teks terpotong, bertumpuk, atau menabrak footer.
2. Ekspor PDF, lalu buka dan periksa halaman demi halaman: 18 halaman, tidak ada halaman kosong.
3. Font: semua teks harus Inter. Karakter di luar subset Inter lokal (misalnya panah `→`) jatuh ke font sistem, jadi pakai ikon SVG (`#i-arrow`) sebagai gantinya.

## Design system singkat

| Token | Nilai | Dipakai untuk |
|---|---|---|
| Ink | `#13233F` | Teks utama, slide gelap |
| Tenant | `#EE8A2A` | Hanya angka kunci dan sorotan (warna blok tenant di denah) |
| Courtyard | `#1FA64A` | Status positif, "dengan SMICC-TS", "siap sekarang" (warna Sawarga Courtyard) |
| Floor | `#EEF1F4` | Latar slide terang |
| Slate | `#5A6678` | Teks sekunder, sumber |
| Tipografi | Inter 400–700 | Judul 64 px, isi 28 px, catatan 22 px, sumber 18 px; angka tabular |
| Grid | 1920 × 1080, margin 120 px | Jarak kelipatan 8 px |
| Radius | 6 px chip, 16 px foto/layar | |

Setiap angka di slide punya sumber di kaki slide. Jangan menambah angka tanpa sumber (lihat tabel "Angka siap pakai" di FIX.md).

## Tangkapan layar

Diambil dari prototype di mode terang setelah Reset data contoh. Kalau aplikasi berubah, ambil ulang dengan ukuran yang sama dan simpan dengan nama file yang sama di `assets/images/`.
