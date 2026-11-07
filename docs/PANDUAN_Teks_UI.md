# Panduan teks antarmuka SMICC-TS

Aturan ini berlaku untuk semua teks yang dibaca pengguna: label, tombol, toast, pesan error, judul,
data contoh, teks SOP, use case, README, dan dokumen di `docs/`.

## Bahasa

Antarmuka berbahasa Indonesia. Istilah berikut tetap dipakai apa adanya karena sudah dipakai staf
mal sehari-hari: tiket, insiden, SOP, runbook, SLA, BMS, CCTV, HVAC, tenant, shift, check-in, gate,
e-ticket, QR, QRIS, event, dashboard, use case, sandbox. Nama produk, merek tenant, dan nama
perangkat (ANPR, VAV, AHU, chiller) juga tetap.

Kata bahasa Inggris lain diterjemahkan: "Active Tickets" jadi "Tiket aktif", "System Health" jadi
"Kesehatan sistem", "All Nominal" jadi "Semua normal", "Live" jadi "Langsung" atau dihapus bila
tidak menambah arti.

## Nama menu dan halaman

| Lama | Baru |
|---|---|
| Ticketing & Incident Ops | Tiket & Insiden |
| Facility & BMS Control | Fasilitas & BMS |
| Tenant Support & SLA | Layanan Tenant & SLA |
| CCTV & Security Feeds | CCTV & Keamanan |
| Energy & Utility Audit | Energi & Utilitas |
| Parking & Mobility | Parkir & Mobilitas |
| Event 360 (Monitoring) | Pemantauan Event |
| Analytics & Reports | Analitik & Laporan |
| Owner 360 · Commercial & Finance | Komersial & Keuangan |
| Pusat SOP & Runbook | Pusat SOP & Runbook |
| Simulator Use Case | Simulator Use Case |
| Grup "Pengetahuan & Relasi" | SOP & Simulasi |
| COMMAND HUB / SUMMARECON MALL OPS | Command Center / Summarecon Mall Bandung |

Nama yang sama dipakai di menu, judul halaman, panel relasi, data SOP, Excel, dan runbook.

## Kalimat

- Huruf kapital hanya di awal kalimat dan nama diri. Judul dan tombol tidak memakai Title Case.
  Teks tidak ditulis dalam huruf kapital semua; kalau perlu penekanan, itu urusan gaya, bukan teks.
- Tombol memakai kata kerja yang menyebut hasilnya: "Buat tiket", "Bayar", "Lepas kursi",
  "Kirim siaran". Toast setelahnya memakai kata yang sama: "Tiket dibuat", "Kursi dilepas".
- Pesan error menyebut apa yang terjadi lalu apa yang bisa dilakukan. Tanpa "maaf", tanpa tanda
  seru. Contoh: "PIN salah. Sisa 3 percobaan sebelum dikunci 60 detik."
- Tanpa em dash (—) dan en dash (–) sebagai penyambung. Pakai titik, koma, titik dua, atau
  kurung. Rentang angka atau jam pakai tanda hubung biasa: "07-15".
- Tanpa string meta yang disambung titik tengah (" · ") kecuali pemisah data yang memang berbeda
  jenis dan berdiri berdampingan (mis. tanggal dan lokasi pada kartu event). Di kalimat, pakai
  koma.
- Hindari kata yang diulang tanpa menambah arti: "real-time", "terintegrasi", "optimal",
  "canggih", "holistik", "komprehensif", "seamless". "Pastikan" boleh di langkah SOP yang memang
  berupa perintah cek.
- Tanpa tanda seru, kecuali kutipan.
- Tanpa panah (→) di teks tombol atau tautan. Panah boleh di urutan langkah atau alur.
- Angka, jam SLA, batas PIN, harga, dan nama tidak berubah saat teks ditulis ulang.

## Yang tidak disentuh

Identifier kode, kunci state dan localStorage, kode status (`TRIP`, `FAULT`, `LEAK`, `P1`-`P4`,
`VALID`, `USED`, `INVALID`), ID tiket/SOP/use case, payload QR `SMB1|...`, nama file, path URL,
nama kelas CSS, isi `app/js/sop-data.js` (hasil generate).
