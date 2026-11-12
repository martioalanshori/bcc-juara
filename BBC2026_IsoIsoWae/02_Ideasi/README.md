# 02 · Ideasi

Bagaimana tim sampai ke solusi: ide awal, validasi di lapangan, lalu pemilihan fitur.

## 1. Alur ideasi

```
 7–11 Nov 2026            11 Nov 2026              12 Nov 2026                 12 Nov 2026
 ─────────────            ───────────              ───────────                 ───────────
 Ide awal (asumsi)   →    Mentoring           →    Wawancara di lapangan  →    Fokus masalah
 Tiket event yang         Masalah harus nyata      Pak Asep, Pak Ade,          Keramaian & parkir
 terhubung ke             di Summarecon, fokus     Bu Mei                      tidak terpantau
 operasional mall         satu masalah, ada angka  Asumsi terkonfirmasi
```

| Tanggal | Tahap | Hasil |
|---|---|---|
| 7–11 Nov 2026 | Ide awal | Sistem tiket event yang terhubung ke operasional mall. Asumsi ditulis di [EVENT_TICKETING_Asumsi_Alur_Logika.md](https://github.com/martioalanshori/bcc-juara/blob/main/docs/EVENT_TICKETING_Asumsi_Alur_Logika.md) |
| 11 Nov 2026 | Mentoring | Arahan mentor: lihat [notulen](../05_Log/mentoring/2026-11-11_notulen-mentoring.md) |
| 12 Nov 2026 | Validasi | 3 wawancara tatap muka: [hasil riset](../01_Riset/RISET_LAPANGAN.md) |
| 12 Nov 2026 | Keputusan | Masalah utama: keramaian dan parkir tidak terpantau. Approval event masuk rencana pengembangan |

## 2. Masalah yang dipilih

> Tim operasional Summarecon Mall Bandung, yang menggelar event hampir setiap hari, tidak bisa memantau berapa orang dan kendaraan yang sudah masuk karena tiket, gelang, dan gate parkir tidak terhubung ke satu sistem.

## 3. Ide yang dipertimbangkan

| Ide | Menjawab | Keputusan | Alasan |
|---|---|---|---|
| **Tiket + check-in milik Summarecon, terhubung ke Command Center** | Data loket.com terputus, gelang tidak tercatat, pemantauan lewat CCTV | ✅ **Dipilih** | Langsung menjawab keinginan Pak Ade: "yang masuk tercatat di sistem, bisa kepantau" |
| **Perkiraan kendaraan dari tiket terjual** | Parkir motor penuh, event memakai lahan parkir | ✅ **Dipilih** (bagian dari ide utama) | Memberi peringatan sebelum parkir penuh |
| Approval event digital | Approval 2 divisi lama | 🕓 Rencana pengembangan | Masalah nyata, tapi berbeda fokus |
| Kamera pembaca plat (ANPR) | Plat diketik manual | ❌ Tidak dipilih | Butuh perangkat keras, dan masalahnya motor **tanpa** plat |
| Penghitung orang berbasis AI/CCTV | Pemantauan lewat CCTV | ❌ Tidak dipilih | Mahal, perlu integrasi CCTV. Check-in tiket sudah memberi angka |

## 4. Temuan riset → fitur

| Temuan | Narasumber | Fitur SMICC-TS | Status |
|---|---|---|---|
| Ticketing lewat loket.com, data bukan milik Summarecon | Pak Ade | Portal pengunjung + e-ticket QR | Ada |
| Gelang tidak tercatat | Pak Asep | Check-in QR di gate, statistik per gate | Ada |
| Keramaian hanya lewat CCTV | Pak Asep | Pemantauan Event di Command Center | Ada |
| Parkir penuh, gate manual | Bu Mei | Perkiraan kendaraan + dashboard Parkir & Mobilitas | Ada, **perlu disesuaikan dengan data lapangan** |
| Komplain baru ketahuan dari medsos | Pak Ade | Anomali gate → tiket insiden otomatis + SOP | Ada |
| Event tenant dan eksternal | Pak Ade | Konsol pengelola untuk EO/tenant | Ada |
| Approval event lama | Pak Ade | — | Belum ada |

Apa yang perlu diubah di aplikasi: [03_Prototype/NEXT_ACTION.md](../03_Prototype/NEXT_ACTION.md).

## 5. Dokumen ideasi di repo prototype

| Dokumen | Isi |
|---|---|
| [EVENT_TICKETING_Asumsi_Alur_Logika.md](https://github.com/martioalanshori/bcc-juara/blob/main/docs/EVENT_TICKETING_Asumsi_Alur_Logika.md) | Asumsi dan alur logika tiket |
| [Mindmap_Super_Mall_Ticketing_system.drawio](https://github.com/martioalanshori/bcc-juara/blob/main/docs/sumber/Mindmap_Super_Mall_Ticketing_system.drawio) | Mindmap sistem |
| [Super_Mall_Command_Center_Blueprint.xlsx](https://github.com/martioalanshori/bcc-juara/blob/main/docs/sumber/Super_Mall_Command_Center_Blueprint.xlsx) | Blueprint Command Center |
| [PRD.md](https://github.com/martioalanshori/bcc-juara/blob/main/docs/rewrite/PRD.md) | Spesifikasi produk |
| [fitur.md](https://github.com/martioalanshori/bcc-juara/blob/main/docs/fitur.md) | Daftar fitur |
