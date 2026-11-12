# Analisis Deck vs Aplikasi

> Pembaruan: rencana perbaikan yang sudah disepakati tim (tanpa model bisnis, ejaan Cibadag, sorotan pendapatan yang hilang, SOP-EVT-05) ada di [FIX.md](FIX.md).

Deck yang dianalisis ada di [PNG/](PNG/) (15 slide, versi 12 Nov 2026). Pembandingnya adalah aplikasi di branch `fitur/akun-tenant-approval-cc`, [PANDUAN_PITCH_DECK.md](PANDUAN_PITCH_DECK.md), dan [RISET_LAPANGAN.md](../01_Riset/RISET_LAPANGAN.md).

## Ringkasan

1. **Ceritanya bukan dari riset kita.** Tiga masalah di deck (rebutan kursi, calo/QR palsu, event musiman) adalah masalah ticketing umum. Tidak ada satu pun angka, foto wawancara, atau nama narasumber dari kunjungan 12 Nov. Padahal mentor bilang masalah harus terjadi di Summarecon dan harus ada angka.
2. **"Event musiman" bertentangan dengan riset.** Pak Ade bilang event diadakan **hampir setiap hari**. Kalau juri bertanya, slide 3 dan 7 justru melemahkan kita.
3. **Ada klaim yang tidak ada di aplikasi.** Contohnya QR yang berubah tiap 10 menit, HVAC yang menyesuaikan jumlah pengunjung, CRM/loyalty, dan P&L harian. Kalau juri meminta demo fitur itu, kita tidak bisa menunjukkannya.
4. **Fitur terkuat yang menjawab keluhan Pak Ade tidak muncul.** Persetujuan acara 2 divisi + log aktivitas, akun tenant/EO, area acara + cek bentrok, Analisis Sentimen dari 2.300 ulasan, dan Command Center yang berjalan.
5. **Bagian wajib menurut panduan belum ada.** Slide demo, pembeda dengan loket.com, rencana uji coba dan rencana saat sistem mati, serta penutup dengan QR dan link.
6. **Terlalu panjang.** Ada 15 slide untuk 5 menit (termasuk demo ±2 menit). Panduan membatasi 10 slide.
7. **Foto slide 1 bukan Summarecon Mall Bandung.** Di foto terlihat toko TK Maxx, B&M, Boots, dan Tortilla, yang tidak ada di Indonesia. Juri dari Summarecon pasti langsung sadar.

---

## Per slide

Keterangan: ✅ sesuai aplikasi/riset · ⚠️ perlu diubah · ❌ salah atau tidak ada di aplikasi

| # | Slide | Status | Catatan |
|---|---|---|---|
| 1 | Judul "Event Ticketing System" | ❌ | **Foto bukan Summarecon** (lihat Ringkasan no. 7). Ganti dengan foto Atrium Cibadag/Summarecon dari kunjungan, atau tangkapan layar Command Center. Judul masih label. Panduan menyarankan kalimat: *"Event di Summarecon Mall Bandung, terpantau sebelum penuh"* |
| 2 | Tim Iso Iso Wae | ✅ | Boleh digabung ke slide 1 atau slide penutup untuk menghemat waktu |
| 3 | 3 masalah event ticketing di mall | ❌ | Bernomor "04" padahal slide ke-3 (nomor 03 tidak ada). Masalahnya generik dan tidak ada sumber. "Event musiman" bertentangan dengan riset. Kutipan "Satu kursi, dua pembeli…" diakhiri "·" tanpa sumber, dan tampak seperti kutipan narasumber padahal bukan |
| 4 | Siapa yang dirugikan | ⚠️ | "Tiket habis terjual, tapi kursinya kosong" tidak punya sumber. Foto kursi bioskop tidak menggambarkan atrium. Yang nyata dari riset: parkir motor penuh 1.200/1.200 hari Kamis, FKB memakai lahan parkir 34 hari, toilet bau di medsos |
| 5 | Target pengguna, 5 peran | ⚠️ | Foto stok, bukan narasumber. Perannya juga belum sama dengan aplikasi sekarang: EO kini **Tenant/EO** (hanya acara miliknya), ada **Tim Event Mall**, dan persetujuan oleh **Divisi Event** dan **Operasional Mall** di Command Center. Panduan meminta 3 kartu narasumber nyata (Pak Ade, Pak Asep, Bu Mei) dengan kutipannya |
| 6 | Solusi | ⚠️ | Isinya benar: satu sistem, ponsel/komputer, jalan di LAN tanpa internet. Judulnya masih label. Ilustrasi bisa diganti 4 tangkapan layar asli |
| 7 | Validasi solusi (3 masalah) | ❌ | Hold 8 menit dan batas bayar 15 menit ✅ (`holdMin: 8`, `PAY_MIN = 15`). **"QR berubah otomatis setiap 10 menit" ❌**: QR di aplikasi bertanda tangan dan statis, keamanannya datang dari sekali pakai (check-in atomik). 3 scan gagal dalam 10 menit → alert ✅ (SOP-EVT-03). Auto-refund dan waitlist ✅ |
| 8 | Cara kerja 5 langkah | ✅ | Sesuai aplikasi. Langkah 5 "parkir, CCTV, BMS & keamanan": proyeksi kendaraan ada (`terjual × 0,42`). Dampak ke CCTV dan BMS berupa tautan ke dashboard, belum otomatis |
| 9 | Anti double booking | ✅ | Optimistic locking (CAS), pembayaran idempoten (`ALREADY`), check-in atomik, dan uji 25 → 1 semuanya ada (Ctrl+K → "Uji tekan 25 pembeli"). Ini slide teknis. Juri lebih banyak bertanya bisnis, jadi cukup satu kalimat di slide solusi |
| 10 | Mindmap 6 pilar | ❌ | Banyak yang tidak ada: naming rights/LED, loyalty/CRM, HVAC & energi menyesuaikan jumlah pengunjung, pendapatan acara masuk P&L harian. Yang ada: footfall & ROI acara, proyeksi parkir, insiden gate, Komersial & Keuangan. AI CCTV kerumunan masih data contoh |
| 11 | Command Center, satu layar | ⚠️ | Foto ruang kontrol adalah foto stok, bukan aplikasi kita. Ganti dengan tangkapan layar Command Center (Tiket & Insiden yang berjalan, Persetujuan Acara, Analisis Sentimen). "Check-in real-time membantu atur HVAC" tidak ada di aplikasi |
| 12 | Mengapa SMICC-TS | ⚠️ | Isinya benar, tapi mengulang slide 6, 8, dan 9. Kandidat dipotong |
| 13 | 8 keunggulan | ⚠️ | Semua poin ada di aplikasi. Satu koreksi: login dikunci **60 detik** setelah 5 kali salah, bukan terkunci permanen. Mengulang slide 7 dan 9, kandidat dipotong |
| 14 | Sebelum vs sesudah | ⚠️ | Baris "Sistem tiket hanya bernilai saat musim acara" ikut narasi musiman yang salah. Ganti dengan sebelum/sesudah dari riset: tahu area penuh setelah penuh → peringatan dari tiket terjual, approval lama lewat kertas → approval digital tercatat, komplain dari medsos → Analisis Sentimen & insiden otomatis |
| 15 | Terima kasih | ❌ | Kosong. Panduan meminta QR ke smiccts.vercel.app, link GitHub, dan nama anggota. Tanpa nomor slide |

---

## Klaim yang harus dihapus atau dikoreksi

| Klaim di deck | Kenyataan di aplikasi | Saran |
|---|---|---|
| QR berubah otomatis tiap 10 menit (slide 7) | QR statis bertanda tangan (`SMB1\|tiket\|acara\|kursi\|ttd`), sekali pakai | "QR bertanda tangan, hanya bisa dipakai sekali. QR palsu atau dipakai ulang langsung ditolak" |
| HVAC & energi menyesuaikan jumlah pengunjung (slide 10, 11) | Tidak ada otomasi BMS dari check-in | Hapus, atau sebut sebagai rencana pengembangan |
| Loyalty/CRM, naming rights, LED (slide 10) | Tidak ada | Hapus |
| Pendapatan acara masuk P&L harian (slide 10) | Ada Keuangan & ROI per acara dan laporan PDF Komersial & Keuangan, tidak ada P&L harian | "Laporan pendapatan & ROI per acara, unduh PDF" |
| Akun terkunci setelah 5x salah (slide 13) | Dikunci 60 detik per IP | "Login dikunci sementara setelah 5x salah" |
| "Tiket habis, kursi kosong" (slide 4) | Tidak ada di riset | Hapus, atau beri sumber |
| Event musiman (slide 3, 7, 14) | Riset: event **hampir setiap hari** | Ganti seluruh narasi |

---

## Fitur aplikasi yang belum ada di deck

Ini yang paling menjawab masalah nyata Summarecon dan paling enak didemokan.

| Fitur | Menjawab | Sumber riset |
|---|---|---|
| **Persetujuan acara digital**: 7 dokumen, Divisi Event lalu Operasional Mall di Command Center, revisi beralasan, waktu tunggu tiap divisi, **log aktivitas berantai hash** + unduh CSV | Approval lewat 2 divisi, banyak dokumen, lama | Pak Ade (temuan no. 8) |
| **Akun Tenant/EO** terpisah dari Tim Event Mall, satu klik ganti akun saat demo | Event diadakan oleh Summarecon *dan* tenant | Pak Ade (temuan no. 1) |
| **Area acara** (7 area: Sawarga Courtyard, Downtown Walk, Parkir Barat, Exhibition Hall A, Atrium Ciunik/Cileutik/Cibadag) + tolak jadwal bentrok. Parkir Barat ditandai memakai lahan parkir | Event memakai lahan parkir saat paling ramai | Bu Mei, berita FKB 34 hari |
| **Proyeksi kendaraan** dari tiket terjual | Gate parkir baru ditutup setelah penuh | Bu Mei, Pak Asep |
| **Analisis Sentimen**: 2.300 ulasan Google Maps (1.026 bertulisan, 105 negatif), keluhan per topik (parkir terbanyak), keluhan saat FKB & Roeang Kita, rekomendasi untuk mall dan event | Komplain baru diketahui dari medsos | Pak Ade (temuan no. 7) |
| **Insiden otomatis** dari gate (SOP-EVT-03) dan **Command Center yang berjalan**: tiket baru masuk, tim bergerak, tiket selesai | Penumpukan baru ketahuan setelah terjadi | Pak Asep |
| **Data peserta milik Summarecon**: CSV peserta, transaksi, rekonsiliasi | Data tiket berhenti di loket.com | Pak Ade, Pak Asep |

> Catatan angka sentimen: per topik, angkanya masih bercampur dengan data **contoh** X/TikTok/Instagram. Untuk deck, pakai angka Google Maps saja (2.300 ulasan, 1.026 bertulisan, 105 negatif) dan hitung ulang keluhan parkir khusus Google Maps sebelum dipakai di slide.

---

## Bagian wajib yang belum ada

| Bagian | Kenapa wajib | Status di deck |
|---|---|---|
| Bukti angka dengan sumber | Arahan mentor | ❌ Tidak ada angka riset sama sekali |
| Narasumber nyata | Arahan mentor | ❌ Foto stok |
| Slide demo (live + video cadangan) | Demo ±2 menit | ❌ |
| Beda dengan loket.com | Pertanyaan juri yang pasti muncul | ❌ |
| Rencana saat sistem mati & siapa mengoperasikan | Pertanyaan juri dari mentor | ❌ Belum ada (keputusan tim: model bisnis tidak dibahas, fokus menyelesaikan masalah) |
| Rencana uji coba (1 event di Atrium Cibadag) | Menunjukkan bisa dijalankan | ❌ |
| Penutup dengan QR & link | Juri bisa mencoba sendiri | ❌ |

---

## Konsistensi istilah

- **Cibadag**: ejaan yang benar (sudah dipakai di aplikasi, riset, dan panduan). Pastikan deck juga memakai Cibadag.
- **Event 360**: menu di aplikasi sekarang bernama **Pemantauan Event**. Pakai nama yang sama dengan yang akan terlihat saat demo.
- **Peran**: pakai nama dari aplikasi: Pengunjung, Tenant/EO, Tim Event Mall, Petugas Gate, Divisi Event, Operasional Mall, Operator Command Center.
- **Penomoran slide**: slide ke-3 bernomor 04, nomor di slide 8 menempel di teks catatan kaki, dan slide terakhir tanpa nomor.

---

## Usulan susunan 10 slide

Sebagian besar slide yang ada bisa dipakai ulang.

| # | Judul (kalimat) | Isi | Dari slide lama |
|---|---|---|---|
| 1 | Event di Summarecon Mall Bandung, terpantau sebelum penuh | Foto asli Summarecon, nama tim & 3 anggota | 1 + 2 |
| 2 | Event hampir setiap hari, tapi tidak ada yang tahu berapa orang yang sudah masuk | loket.com, gelang, CCTV yang tidak terhubung | baru (riset §2.1) |
| 3 | Kamis pagi, parkir motor sudah penuh: 1.200 dari 1.200 | Angka besar + FKB 34 hari + 1 baris sentimen Google Maps, sumber kecil | baru |
| 4 | Kami bicara langsung dengan tiga orang yang merasakannya | Pak Ade, Pak Asep, Bu Mei: foto + kutipan | ganti 5 |
| 5 | Satu sistem: dari pengajuan acara sampai orang dan kendaraan di lokasi | Alur: ajukan & setujui → jual tiket → check-in QR → Command Center & peringatan. 4 tangkapan layar | 6 + 8 |
| 6 | Demo | Live smiccts.vercel.app + video cadangan | baru |
| 7 | loket.com menjual tiket. SMICC-TS memantau mall. | Tabel ✅/❌: data milik Summarecon, event tenant tercatat & disetujui, perkiraan parkir, insiden otomatis, sentimen | baru |
| 8 | Dari menangani setelah penuh, menjadi bertindak sebelum penuh | Sebelum → sesudah dari riset (approval, parkir, atrium, komplain) | ganti 14 |
| 9 | Siap diuji di satu event berikutnya di Atrium Cibadag | Tahapan uji coba + SOP cadangan (model bisnis tidak dibahas) | baru |
| 10 | Event Summarecon, terpantau sebelum penuh | QR ke aplikasi, link GitHub | ganti 15 |

Slide 9 lama (anti double booking) dan slide 13 lama (8 keunggulan) disimpan sebagai **slide cadangan** setelah penutup, untuk menjawab pertanyaan teknis ("kalau ribuan orang beli bersamaan?").

## Alur demo yang cocok dengan aplikasi sekarang (±2 menit)

1. **Command Center → Tiket & Insiden** sudah berjalan di layar (tiket baru masuk, status bergerak). Satu kalimat: "Ini ruang kontrol mall."
2. **Tenant/EO** mengajukan EVT-28 Expo UMKM (Exhibition Hall A) → **Lanjut sebagai Divisi Event** → Setujui → **Operasional Mall** → Setujui. Tunjukkan log aktivitas "Log utuh". Ini jawaban untuk "approval lama".
3. Tenant **Publikasikan** → acara langsung tampil di `/pengunjung` → beli tiket → QR.
4. **Check-in** QR di gate, lalu scan QR yang sama sekali lagi: SUDAH DIGUNAKAN.
5. **Command Center → Analisis Sentimen**: parkir adalah keluhan terbanyak, dan keluhan naik saat FKB.

Sebelum demo: tekan **Reset data contoh** (Ctrl+K, akun Tim Event Mall), dan rekam video cadangan.

## Checklist perbaikan

- [ ] Ganti foto slide 1 dengan foto Summarecon asli
- [ ] Hapus narasi "event musiman", ganti dengan masalah dari riset
- [ ] Masukkan angka + sumber: 1.200/1.200 parkir motor, FKB 34 hari, ulasan Google Maps
- [ ] Ganti foto stok di slide target pengguna dengan Pak Ade, Pak Asep, Bu Mei
- [ ] Hapus klaim yang tidak ada di aplikasi (QR berubah tiap 10 menit, HVAC otomatis, CRM, P&L harian)
- [ ] Tambah persetujuan acara 2 divisi + log aktivitas (keluhan Pak Ade)
- [ ] Tambah slide demo, pembeda loket.com, uji coba & rencana cadangan, penutup ber-QR
- [ ] Ringkas jadi 10 slide, pindahkan slide teknis ke cadangan
- [ ] Ganti foto ruang kontrol stok dengan tangkapan layar aplikasi
- [ ] Samakan istilah: Cibadag, Pemantauan Event, nama peran
- [ ] Perbaiki penomoran slide
- [ ] Tambahkan pendapatan yang hilang tanpa SMICC-TS dan SOP-EVT-05 (lihat [FIX.md](FIX.md))
