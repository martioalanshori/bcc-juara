# 03 · Prototype

**SMICC-TS** (Summarecon Mall Integrated Command Center Ticketing System)

| | |
|---|---|
| **Kode** | https://github.com/martioalanshori/bcc-juara |
| **Website** | https://smiccts.vercel.app |
| **Video demo** | _[isi link]_ |
| **Daftar fitur** | [fitur.md](https://github.com/martioalanshori/bcc-juara/blob/main/docs/fitur.md) |
| **Yang perlu diubah** | [NEXT_ACTION.md](NEXT_ACTION.md) |

## Empat portal

| Portal | Pengguna | Menjawab temuan riset |
|---|---|---|
| `/pengunjung` | Pengunjung | Data tiket milik Summarecon, tidak terputus di loket.com |
| `/pengelola` | Penyelenggara event / tenant | Event tenant dan eksternal dalam satu sistem |
| `/checkin` | Petugas gate | Setiap peserta tercatat saat masuk (bukan sekadar gelang) |
| `/command-center` | Manajemen mall | Jumlah orang, perkiraan kendaraan, dan insiden terpantau langsung |

## Alur demo (±2 menit)

Sesuai arahan mentor: **lewati login dan pemilihan peran**, langsung ke fitur yang menjawab masalah.

| Waktu | Tampilkan | Kalimat |
|---|---|---|
| 0:00–0:30 | Command Center → Pemantauan Event | "Ini yang belum dimiliki Summarecon: jumlah peserta dan perkiraan kendaraan, langsung" |
| 0:30–1:00 | Beli tiket di ponsel → e-ticket QR | "Data peserta langsung masuk ke sistem Summarecon" |
| 1:00–1:30 | Check-in: VALID, lalu QR yang sama → SUDAH DIGUNAKAN | "Setiap orang tercatat, tidak bisa dobel" |
| 1:30–2:00 | 3 pindaian gagal → insiden otomatis di Command Center | "Masalah ditangani sebelum menumpuk, bukan setelah viral" |

## Riwayat pengembangan

Riwayat lengkap: [commit di GitHub](https://github.com/martioalanshori/bcc-juara/commits/main).

| Tanggal | Pekerjaan |
|---|---|
| 7 Nov 2026 | Backend serverless dan deploy Vercel |
| 8 Nov 2026 | Tema UI, uji 25 pembeli serentak, check-in 2 gate, daftar tunggu, keuangan & ROI, insiden otomatis, keamanan per peran |
| 9 Nov 2026 | Ekspor CSV, dokumentasi fitur |
| 10 Nov 2026 | Satu server untuk LAN dan Vercel, portal pengunjung bergaya landing page |
| 11 Nov 2026 | Perombakan tampilan, logo tenant |
