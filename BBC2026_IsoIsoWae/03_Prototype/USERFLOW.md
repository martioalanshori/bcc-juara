# User flow SMICC-TS

Alur pengguna pada prototype yang sudah berjalan di https://smiccts.vercel.app. Semua portal membaca data yang sama, jadi perubahan di satu portal langsung terlihat di portal lain.

## 1. Peran dan pintu masuk

| Peran | Portal | Login | Tujuan utama |
|---|---|---|---|
| Pengunjung | `/pengunjung` | Tidak wajib (akun demo untuk "Tiket saya") | Cari acara, beli tiket, simpan e-ticket QR |
| Penyelenggara acara (EO, tenant, tim event mall) | `/pengelola` | Akun staf `pengelola` | Buat acara, ajukan persetujuan, jual tiket, kelola peserta |
| Divisi Event & Operasional Mall | `/pengelola` → menu Persetujuan | Akun staf `pengelola` (simulasi peran) | Menyetujui atau meminta revisi pengajuan acara |
| Petugas gate | `/checkin` (ponsel) | Akun staf `gate` atau `pengelola` | Pindai QR peserta di pintu masuk |
| Manajemen mall / operator | `/command-center` | Akun staf `command-center` | Memantau semua acara, parkir, keramaian, dan insiden |

Halaman `/` menampilkan pilihan peran. Portal staf tanpa sesi diarahkan ke `/masuk`, lalu kembali ke halaman yang dituju setelah login.

```mermaid
flowchart LR
  B["/ (pilih peran)"] --> P["/pengunjung"]
  B --> M{"Sudah login?"}
  M -- belum --> L["/masuk"] --> M
  M -- ya --> G["/pengelola"]
  M -- ya --> C["/checkin"]
  M -- ya --> CC["/command-center"]
```

## 2. Gambaran lintas peran

Satu acara melewati empat peran, dari pengajuan sampai hari H.

```mermaid
sequenceDiagram
  autonumber
  participant EO as Penyelenggara
  participant DV as Divisi Event
  participant OP as Operasional Mall
  participant V as Pengunjung
  participant GT as Petugas gate
  participant CC as Command Center
  EO->>EO: Buat acara (draft), atur tiket & denah
  EO->>DV: Unggah dokumen, ajukan persetujuan
  DV->>OP: Setuju, diteruskan
  OP->>EO: Setuju
  EO->>V: Publikasikan, acara tampil di portal
  V->>V: Pilih kategori & kursi, bayar
  V-->>EO: Pesanan lunas, e-ticket QR terbit
  CC-->>CC: Pantau penjualan, perkiraan kendaraan & parkir
  V->>GT: Tunjukkan QR di gate
  GT->>GT: VALID, peserta tercatat masuk
  GT-->>CC: 3 pindaian gagal dalam 10 menit
  CC->>CC: Tiket insiden P2 otomatis + SOP
```

## 3. Pengunjung (`/pengunjung`, mobile-first)

```mermaid
flowchart TD
  H["Beranda: acara hari ini, akhir pekan, laku keras, info mal"] --> E["Detail acara /e/ID"]
  E --> S{"Penjualan dibuka?"}
  S -- "belum / ditutup" --> X["Lihat jadwal saja"]
  S -- "habis" --> W["Daftar tunggu"]
  S -- ya --> K["1. Pilih kategori /kategori"]
  K --> KR{"Kursi bernomor?"}
  KR -- ya --> D["2. Pilih kursi di denah /kursi"]
  KR -- "tidak (festival)" --> J["Atur jumlah tiket"]
  D --> DT["3. Isi data peserta /data"]
  J --> DT
  DT --> O["4. Pesanan dibuat /o/BOOKING, batas bayar 15 menit"]
  O --> PY{"5. Bayar (sandbox)"}
  PY -- berhasil --> T["6. E-ticket QR per kursi"]
  PY -- "gagal / batal / lewat 15 menit" --> R["Kursi dilepas, daftar tunggu dikabari"]
  T --> TS["Tiket saya & kotak masuk (email, WhatsApp simulasi)"]
```

| Langkah | Yang dilihat pengunjung | Aturan sistem |
|---|---|---|
| Pilih kategori | Harga dan sisa kuota per kategori | Kategori habis menawarkan daftar tunggu |
| Pilih kursi | Denah kategori terpilih, kursi lain samar | Kursi langsung dikunci **8 menit** untuk orang lain. Dua orang memilih kursi yang sama: hanya satu berhasil |
| Isi data | Nama, email, WhatsApp, nama pemegang per tiket (opsional) | Maks 4 tiket per pesanan (bisa diatur per acara) |
| Ringkasan & bayar | Total + biaya layanan Rp5.000/tiket, hitung mundur | Batas bayar **15 menit**. Callback pembayaran idempoten, e-ticket tidak terbit dua kali |
| E-ticket | QR per kursi, status check-in, simpan ke kalender | QR bertanda tangan, tidak bisa dipalsukan dengan mengetik ulang |

## 4. Penyelenggara acara (`/pengelola`)

### 4.1 Dari draft sampai dijual

```mermaid
flowchart TD
  A["Daftar acara → Acara baru"] --> B["Draft: isi nama, jadwal, templat venue"]
  B --> C["Pengaturan: poster, tiket, harga, kuota, periode jual, gate"]
  C --> D["Persetujuan: unggah dokumen wajib"]
  D --> E["Ajukan persetujuan"]
  E --> F{"Divisi Event"}
  F -- "minta revisi" --> G["Perbaiki sesuai catatan"] --> E
  F -- setuju --> H{"Operasional Mall"}
  H -- "minta revisi" --> G
  H -- setuju --> I["Disetujui"]
  I --> J["Publikasikan"]
  J --> K["Tampil di portal pengunjung & Command Center"]
```

Dokumen persyaratan: proposal & rundown, denah area & perkiraan jumlah pengunjung, surat izin keramaian (wajib), rencana keamanan & K3 (opsional).

### 4.2 Selama penjualan dan hari H

| Menu | Kegiatan |
|---|---|
| Ringkasan | Tiket terjual, pendapatan, kehadiran, blok **Perlu tindakan** (pesanan menunggu bayar, anomali gate, persetujuan tertunda) |
| Denah kursi | Lihat pemesan per kursi, blokir kursi (kamera, FOH, kursi roda) |
| Peserta & transaksi | Cari pesanan, ubah data peserta, kirim ulang e-ticket, refund, ekspor CSV |
| Check-in & gate | Pindai QR dari konsol, statistik per gate, lapor anomali ke Command Center |
| Kirim broadcast | Kirim pengingat massal, kabari daftar tunggu |
| Keuangan & ROI | Rekonsiliasi per metode bayar, selisih, ROI untuk mall |
| Persetujuan | Status approval, dokumen, dan **log aktivitas** acara |

Aksi berisiko (tutup penjualan, batalkan acara, hapus, refund) selalu lewat dialog konfirmasi. **Batalkan acara** me-refund semua pesanan lunas dan mengabari peserta.

### 4.3 Status acara

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Dipublikasikan: setelah disetujui kedua divisi
  Dipublikasikan --> Ditutup: tutup penjualan
  Ditutup --> Dipublikasikan: buka lagi
  Dipublikasikan --> Dibatalkan: batalkan (refund otomatis)
  Ditutup --> Dibatalkan
  Draft --> [*]: hapus (tanpa transaksi)
```

## 5. Divisi Event dan Operasional Mall (menu Persetujuan)

```mermaid
stateDiagram-v2
  [*] --> BelumDiajukan
  BelumDiajukan --> DalamPeninjauan: penyelenggara mengajukan (dokumen wajib lengkap)
  state DalamPeninjauan {
    [*] --> DivisiEvent
    DivisiEvent --> OperasionalMall: setuju
  }
  DalamPeninjauan --> PerluRevisi: salah satu divisi minta revisi (wajib alasan)
  PerluRevisi --> DalamPeninjauan: ajukan ulang (putaran berikutnya)
  DalamPeninjauan --> Disetujui: Operasional Mall setuju
  Disetujui --> [*]: siap dipublikasikan
```

- Operasional Mall baru bisa memutuskan setelah Divisi Event setuju.
- Dokumen terkunci selama ditinjau dan setelah disetujui.
- Layar menampilkan lama tiap divisi meninjau dan total waktu sejak pengajuan pertama. Pengajuan yang menunggu lebih dari 2 hari ditandai di **Perlu tindakan**.
- **Log aktivitas** mencatat siapa, peran, kapan, aksi, dan catatan untuk setiap langkah dan perubahan acara (dokumen, pengajuan, keputusan, publikasi, perubahan harga atau jadwal, refund, pembatalan). Log hanya bisa ditambah dan bisa diunduh CSV. Tanda "Log utuh" berubah merah bila ada entri yang diubah.
- Prototype: satu akun pengelola bertindak sebagai kedua divisi (ditandai "Simulasi"). Dokumen hanya dicatat nama dan ukurannya.

Contoh di data demo: **EVT-28 Expo UMKM Gedebage Berdaya**, sudah disetujui Divisi Event, menunggu Operasional Mall.

## 6. Petugas gate (`/checkin`)

```mermaid
flowchart TD
  A["Login gate → pilih acara & gate"] --> B["Pindai QR: kamera, foto, atau ketik kode"]
  B --> C{"Hasil"}
  C -- VALID --> D["Hijau + bunyi: silakan masuk, tercatat jam & gate"]
  C -- "SUDAH DIGUNAKAN" --> E["Kuning: tampil kapan & di gate mana dipakai"]
  C -- "TIDAK VALID" --> F["Merah: palsu, dibatalkan/refund, atau acara lain"]
  E --> G{"3 gagal dalam 10 menit di gate ini?"}
  F --> G
  G -- ya --> H["Anomali → tiket insiden otomatis di Command Center"]
  G -- tidak --> B
  D --> B
  B -.-> I["Lapor manual ke Command Center"]
```

Dua gate memindai QR yang sama bersamaan: hanya satu yang VALID, yang lain SUDAH DIGUNAKAN.

## 7. Command Center (`/command-center`)

| Kelompok | Menu | Dipakai untuk |
|---|---|---|
| Operasional | Tiket & Insiden | Antrean insiden, prioritas P1 sampai P4, SLA, penugasan regu |
| | Fasilitas & BMS | Status perangkat gedung (HVAC, listrik, kebocoran) |
| | Layanan Tenant & SLA | Permintaan tenant dan pemenuhan SLA |
| | CCTV & Keamanan | Peringatan kamera |
| | Energi & Utilitas | Pemakaian energi |
| | Parkir & Mobilitas | Okupansi parkir mobil dan motor |
| | Pemantauan Event | Portofolio semua acara (hanya baca), dampak ke parkir dan keramaian, keamanan gate |
| Eksekutif | Analitik & Laporan, Komersial & Keuangan, Analisis Sentimen | Ringkasan untuk manajemen; sentimen ulasan publik dan rekomendasi pengembangan mall & event |
| SOP & Simulasi | Pusat SOP & Runbook, Simulator Use Case | SOP per kejadian dan simulasi langkah demi langkah |

Alur insiden dari event:

```mermaid
flowchart LR
  A["Anomali gate atau laporan petugas"] --> B["Command Center mengklaim (hanya satu layar yang membuat tiket)"]
  B --> C["Tiket insiden P2, SOP-EVT-03, regu & kamera terdekat"]
  C --> D["Status 'Ditangani TCK-…' terlihat di konsol pengelola & ponsel gate"]
```

## 8. Status pesanan dan tiket

```mermaid
stateDiagram-v2
  [*] --> MenungguBayar: pesanan dibuat, kursi di-hold
  MenungguBayar --> Lunas: pembayaran berhasil, e-ticket terbit
  MenungguBayar --> Kedaluwarsa: lewat 15 menit
  MenungguBayar --> Batal: dibatalkan pengunjung
  Lunas --> Refund: refund atau acara dibatalkan
  Kedaluwarsa --> [*]
  Batal --> [*]
  Refund --> [*]
```

| E-ticket | Arti |
|---|---|
| Aktif, belum check-in | Bisa dipakai masuk |
| Aktif, sudah check-in | Pindai ulang = SUDAH DIGUNAKAN |
| Void | Pesanan di-refund atau acara dibatalkan, pindaian = TIDAK VALID |

## 9. Batasan prototype

- Pembayaran, email, dan WhatsApp adalah simulasi (sandbox dan kotak keluar).
- Login pengunjung adalah akun demo di browser, bukan akun sungguhan.
- Persetujuan memakai satu akun pengelola untuk semua divisi.
- Data tiket insiden Command Center tersimpan per browser.
