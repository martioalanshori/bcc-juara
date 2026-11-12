# Next Action: Menyesuaikan Aplikasi dengan Hasil Riset

Prototype SMICC-TS dibuat **sebelum** riset lapangan (7–11 Nov), jadi datanya masih contoh. Setelah wawancara 12 Nov, aplikasi perlu disesuaikan supaya **yang tampil saat demo sama dengan yang diceritakan di deck**.

**Target:** Demo Day, Minggu 15 November 2026.

| Prioritas | Arti | Kapan |
|---|---|---|
| 🔴 **P0** | Wajib sebelum demo. Perubahan data dan teks, kecil, risiko rendah | 13 Nov |
| 🟡 **P1** | Memperkuat cerita demo. Fitur kecil di atas yang sudah ada | 13–14 Nov |
| ⚪ **P2** | Rencana pengembangan. Cukup ditampilkan di slide, tidak perlu dibuat | Setelah lomba |

---

## 🔴 P0: Samakan data aplikasi dengan lapangan

### 1. Nama area event sesuai denah mall

Aplikasi masih memakai "Main Atrium". Di denah Summarecon Mall Bandung namanya **Atrium Cibadag**, **Atrium Ciunik**, dan **Sawarga Courtyard**.

| Ganti | Menjadi | File |
|---|---|---|
| `Main Atrium, GF` | `Atrium Cibadag, GF` | `app/js/event/engine.js` (template `ATRIUM`, data contoh EVT-01, EVT-02, dll.) |
| `PANGGUNG UTAMA · MAIN ATRIUM` | `PANGGUNG · ATRIUM CIBADAG` | `app/js/event/engine.js` |
| Area "Main Atrium" di beranda pengunjung | Atrium Cibadag, Atrium Ciunik, Sawarga Courtyard | `app/js/event/visitor.js` |
| Kamera/lokasi "Main Atrium" | Atrium Cibadag | `app/js/command-center/data.js`, `views/cctv.js`, `sop-data.js` |

**Hasil:** saat demo, juri melihat nama tempat yang mereka kenal di Summarecon Mall Bandung.

### 2. Zona parkir sesuai data Bu Mei

Data contoh sekarang (`app/js/command-center/data.js`, `PARKING`) masih fiktif: basement B1–B2, kapasitas mobil 1.724, motor 900.

| Sekarang (contoh) | Seharusnya (riset) |
|---|---|
| B1 Zona A, B1 Zona C, B2 Reguler | Parkiran Timur, Parkiran Lobby Selatan, Area Parkir Barat, parkiran belakang |
| Total mobil 1.724 | **±2.000** |
| Motor B1 Timur, 900 | **Motor 1.200** |
| VIP & Valet, Ladies, EV | **Gold member**, **4 lot moge** (sisanya bisa dipertahankan bila ada) |

Kapasitas per area belum pasti (±800 per area). Bagi 2.000 mobil ke beberapa area secara wajar dan beri catatan "perkiraan" di halaman.

**Hasil:** dashboard Parkir & Mobilitas bisa menampilkan **"Motor 1.200 / 1.200 — PENUH"**, persis kejadian saat wawancara.

### 3. Perkiraan kendaraan memisahkan motor dan mobil

Sekarang: `tiket terjual × 0,42` = tambahan mobil saja (`app/js/event/admin.js`, baris ±887 dan ±1289). Padahal yang penuh justru **motor**.

| Ubah | Menjadi |
|---|---|
| Satu angka "tambahan kendaraan" | **Tambahan mobil** dan **tambahan motor** (rasio bisa disetel, beri label "asumsi") |
| Angka saja | Dibandingkan dengan **sisa kapasitas** parkir. Contoh: "Perkiraan +380 motor, sisa slot motor 150 → **parkir motor diperkirakan penuh**" |

**Hasil:** satu kalimat di demo yang langsung nyambung ke cerita Bu Mei.

### 4. Teks panduan parkir untuk pengunjung

`app/js/event/visitor.js` (bagian "Parkir & akses") masih menulis "parkir mobil di basement". Sesuaikan dengan area nyata, dan tambahkan saran naik **shuttle bus gratis** (sumber: detikJabar) saat event besar.

### 5. Data contoh event lebih mirip kondisi nyata

Tambahkan satu event contoh yang **memakai area parkir** (seperti Festival Kuliner Bandung di Area Parkir Barat) dan satu event **UMKM/expo pihak eksternal** (seperti Roeang Kita). Event gratis tetap pakai registrasi supaya peserta tercatat.

---

## 🟡 P1: Fitur kecil yang memperkuat cerita

### 6. Peringatan kapasitas area event

Check-in sudah menghitung peserta yang masuk. Tambahkan **kapasitas area** (misalnya Atrium Cibadag) dan peringatan bertahap:

| Terisi | Tampilan | Aksi |
|---|---|---|
| 80% | Kuning: "Atrium Cibadag hampir penuh" | Notifikasi ke security |
| 100% | Merah: "Penuh, tahan antrean" | Otomatis jadi tiket insiden di Command Center |

**Menjawab:** Pak Asep yang sekarang hanya bisa memantau lewat CCTV.

### 7. Event yang memakai lahan parkir mengurangi kapasitas parkir

Di form buat acara (konsol pengelola), tambahkan pilihan **"Memakai area parkir"** + area mana. Selama event berlangsung, kapasitas area itu dikurangi di dashboard Parkir & Mobilitas.

**Menjawab:** kasus Festival Kuliner Bandung di Area Parkir Barat selama 34 hari.

### 8. Peserta ramai → tugas kebersihan toilet

Saat kehadiran event melewati ambang tertentu, buat tugas otomatis untuk tim kebersihan di toilet terdekat dengan area event (kategori "Kebersihan & Sanitasi" sudah ada di Command Center).

**Menjawab:** keluhan "toiletnya bau" dari Pak Ade.

### 8b. Persetujuan acara + log aktivitas ✅ (sudah dibuat)

Menu **Persetujuan** di konsol pengelola (`/pengelola/e/<id>/persetujuan`):

| Bagian | Isi |
|---|---|
| Alur | Penyelenggara unggah dokumen dan mengajukan → **Divisi Event** → **Operasional Mall** → baru bisa dipublikasikan. Minta revisi wajib beralasan |
| Dokumen | Proposal & rundown, denah & perkiraan pengunjung, **surat izin keramaian** (wajib), rencana K3 (opsional) |
| Waktu | Lama tiap divisi meninjau, total sejak pengajuan pertama. Menunggu lebih dari 2 hari ditandai di "Perlu tindakan" |
| Log aktivitas | Siapa, kapan, apa, catatan. Hanya bisa ditambah; rantai hash mendeteksi entri yang diubah diam-diam ("Log utuh, N entri"). Ekspor CSV |

Contoh demo: **EVT-28 Expo UMKM Gedebage Berdaya**, sudah disetujui Divisi Event, menunggu Operasional Mall hampir 3 hari. Data lama perlu **Reset data contoh** di konsol supaya EVT-28 muncul.

**Menjawab:** "approval-nya lama" dari Pak Ade. Masih perlu angka asli dari beliau (berapa hari, berapa dokumen) untuk slide.

**Kalimat demo:** "Setiap pengajuan tercatat: siapa menyetujui, kapan, dan berapa lama menunggu di tiap divisi."

### 9. Foto asli

Ganti foto demo Wikimedia (`app/img/demo/`) dengan foto Summarecon Mall Bandung bila ada, terutama untuk area atrium. Perbarui `CREDITS.md`.

---

## ⚪ P2: Rencana pengembangan (cukup di slide)

| Fitur | Menjawab | Bentuk di deck |
|---|---|---|
| Approval event lanjutan: akun terpisah per divisi, unggah file sungguhan, notifikasi WhatsApp ke peninjau, tampil di Command Center | Approval lama (Pak Ade) | Versi dasar sudah ada (item 8b), sisanya satu baris di slide rencana |
| Konsol pengelola lanjutan: wizard buat acara 4 langkah, pagination peserta, panel transaksi bertaut URL, target sentuh 44 px | Kemudahan EO/tenant | Tidak perlu di slide |
| Integrasi ke gate parkir sungguhan | Gate manual (Bu Mei) | Satu baris di slide rencana |
| Registrasi kendaraan saat beli tiket (jenis + plat, opsional) | Perkiraan parkir lebih akurat, motor tanpa plat | Satu baris di slide rencana |
| Ganti loket.com untuk semua event Summarecon dan tenant | Data peserta milik Summarecon | Model bisnis |

---

## Catatan pengerjaan

- **Push ke `main` = deploy produksi** di smiccts.vercel.app. Uji di lokal dulu, lalu push satu kali yang sudah stabil sebelum Demo Day.
- Rencana rewrite di [PRD.md](https://github.com/martioalanshori/bcc-juara/blob/main/docs/rewrite/PRD.md) (status draf) **jangan dimulai sebelum Demo Day**. Fokus ke P0 dan P1 di atas.
- Setiap perubahan dicommit terpisah dengan pesan yang jelas, karena juri akan melihat histori commit.
- Setelah selesai, rekam ulang video demo dan perbarui screenshot di deck.

## Checklist

- [ ] 1. Nama area: Atrium Cibadag, Atrium Ciunik, Sawarga Courtyard
- [ ] 2. Zona parkir: mobil ±2.000, motor 1.200, area sesuai lapangan
- [ ] 3. Perkiraan kendaraan: motor + mobil, dibanding sisa kapasitas
- [ ] 4. Teks panduan parkir + shuttle bus
- [ ] 5. Event contoh: event di area parkir + expo UMKM
- [ ] 6. Peringatan kapasitas area event
- [ ] 7. Event memakai lahan parkir mengurangi kapasitas
- [ ] 8. Tugas kebersihan toilet otomatis
- [x] 8b. Persetujuan acara + log aktivitas
- [ ] 9. Foto asli
- [ ] Rekam ulang video demo
