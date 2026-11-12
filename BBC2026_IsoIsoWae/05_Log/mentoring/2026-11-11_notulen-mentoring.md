# Notulen Mentoring BBC 2026 (Bandung Build Challenge)

- **Tanggal:** 11 November 2026
- **Mentor:** Teguh Iqbal Prayoga
- **Peserta tim:** Dima Fathur Rahman, Martio (Tim IsoIsoWae)
- **Media:** Google Meet (mentor ikut dari kereta, sesi berakhir ±6 menit lewat jadwal)

---

## 1. Fokus Masalah

- Masalah dan datanya harus **benar-benar terjadi di Summarecon**. Kalau masalahnya tidak terjadi di mal Summarecon, kemungkinan besar Summarecon tidak akan tertarik.
- Lebih baik mengangkat **satu masalah kecil yang fokus** daripada banyak masalah sekaligus, asalkan benar-benar berdampak dan **bisa langsung dipakai di Summarecon**. Yang dipilih nanti adalah solusi yang bisa dipakai dulu, karena masih ada tahap-tahap berikutnya.
- Rumuskan masalah dalam **satu kalimat**:
  > **Siapa** targetnya, **kesulitan apa** yang dialami, dan **kapan** target tersebut pernah mengalami kesulitan itu.

## 2. Tiga Hal Wajib di Pitch

1. **Masalah** dan bukti nyatanya
2. **Target pengguna** (persona)
3. **Solusi** dan alur solusinya

Detail persona yang perlu disiapkan:
- Siapa user/persona-nya dan apa *pain point*-nya
- Kenapa persona itu diuntungkan oleh solusi kita, dan alasannya
- Bukti riset: **log tanggal, nama narasumber, kutipan narasumber**, dan foto kalau bisa

## 3. Metrik dan Angka

- Deck **wajib ada angka**, karena metrik cukup berpengaruh ke penilaian.
- Jenis angka bebas (nilai investasi, kerugian, jumlah pengunjung, dll.), asalkan **punya sumber nyata** yang bisa menopang metrik.
- Contoh dari mentor:
  - "Summarecon rugi Rp20 juta saat event bermasalah, berdasarkan data hasil scraping Twitter pada event kemarin."
  - "Sekitar 200 orang mengeluh di Twitter karena antrean macet di event Summarecon."
  - "Dari 2.000 data mentah, 200 orang mengeluh soal event kemarin, 50 di antaranya masalahnya X."

## 4. Pertanyaan yang Harus Dijawab di Deck

Menurut mentor, juri lebih banyak bertanya soal **sisi bisnis** daripada teknis (kemungkinan tidak ditanya pakai stack apa atau hosting di mana).

- [ ] Apa bedanya solusi kita dengan aplikasi ticketing lain?
- [ ] Kenapa Summarecon perlu mengimplementasikan ini?
- [ ] Angka apa dari Summarecon yang mendukung?
- [ ] Siapa yang bayar: user atau Summarecon?
- [ ] Siapa yang mengoperasikan: pihak EO/event atau pihak internal Summarecon?
- [ ] Kalau ada ribuan user datang bersamaan, apakah sistem sanggup? Kalau sistem gagal, apa langkah cadangannya? (Misalnya: apakah pengunjung jadi bingung dan menumpuk di atrium karena tiket tidak jalan?)

## 5. Struktur Deck yang Disarankan

Yang wajib hanya tiga poin di bagian 2. Saran urutan lengkapnya:

1. Judul dan nama tim
2. Masalah
3. Target pengguna
4. Insight dari validasi/riset
5. Solusi
6. **Demo** (boleh berupa tangkapan layar saja)
7. Perbedaan dengan yang sudah ada di Summarecon saat ini
8. Dampak untuk Summarecon
9. Rencana implementasi (model bisnis dan/atau fitur lanjutan setelah dipakai)
10. Penutup (nama anggota tim, link)

Catatan gaya:
- **Jangan banyak teks.** Deck harus bisa dipahami juri **tanpa presenter**.
- Perbanyak ilustrasi/diagram, teks seperlunya, dan tetap tampilkan angka.

## 6. Presentasi dan Demo

- Total waktu **5 menit**, demo prototype sekitar **2 menit**.
- Latihan dulu dan bagi peran: siapa bicara apa, siapa membahas bagian mana.
- Demo **tidak perlu dari awal**. Lewati login, pilih role, dan hal umum lainnya, lalu langsung tunjukkan fitur yang menyelesaikan masalah Summarecon (misalnya fitur tiket).

## 7. Struktur Folder Wajib

```
BBC2026_IsoIsoWae/
├── 01_Riset/
├── 02_Ideasi/
├── 03_Prototype/
├── 04_Deck/
└── 05_Log/
```

| Folder | Isi |
|---|---|
| **01_Riset** | Catatan observasi, catatan wawancara langsung (dengan pihak Summarecon atau pengunjung), video YouTube, foto observasi, data hasil scraping beserta hasil olahannya (misalnya hasil Python: dari 2.000 data, berapa yang mengeluh dan masalahnya apa) |
| **02_Ideasi** | Proses ideasi: sketsa UI, file MD, ide-ide, alasan pemilihan fitur. Coretan di Paint pun boleh |
| **03_Prototype** | Link GitHub, link website yang sudah di-deploy, video demo |
| **04_Deck** | Link deck dan PDF deck |
| **05_Log** | Penggunaan AI, sumber aset, pembagian peran tiap anggota (siapa mengerjakan apa) |

Catatan:
- **Format file bebas** (MD, DOCX, PNG, PDF). Yang penting isinya, bukan ekstensinya. Gambar dan diagram boleh disertakan.
- **Mulai isi dari sekarang.** Juri akan melihat histori commit dan tanggal untuk menilai apakah proyek dibuat sendiri, pakai template, atau prosesnya seperti apa. Rapi atau tidak rapi, yang penting ada.
- Setiap anggota akan ditanya peran dan fungsinya, jadi pembagian peran di `05_Log` harus jelas.

---

## Action Items

- [ ] Buat struktur folder `BBC2026_IsoIsoWae` beserta 5 subfolder
- [ ] Kumpulkan bukti riset (wawancara, foto, scraping) yang spesifik ke Summarecon, lengkap dengan tanggal, narasumber, dan kutipan
- [ ] Olah data riset menjadi angka/metrik yang punya sumber jelas
- [ ] Rumuskan masalah dalam satu kalimat (siapa, kesulitan apa, kapan)
- [ ] Jawab pertanyaan bisnis di bagian 4 dan masukkan ke deck
- [ ] Susun deck sesuai struktur di bagian 5, minim teks
- [ ] Isi `05_Log`: penggunaan AI, sumber aset, peran tiap anggota

