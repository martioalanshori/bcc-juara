# Rencana perbaikan: tombol terasa lambat

Analisis kenapa menekan tombol di SMICC-TS terasa ada jeda, apa yang sudah diperbaiki, dan rencana perbaikan berikutnya
berurutan dari dampak terbesar. Diukur 15 Nov 2026.

## 1. Hasil pengukuran

| Yang diukur | LAN / lokal | Produksi (smiccts.vercel.app) |
|---|---|---|
| Ukuran state yang dikirim tiap klik | 356 KB | **551 KB** |
| Isi terbesar state produksi | | `events` 216 KB (181 KB di antaranya poster acara berbentuk data URL), `orders` 159 KB, `tickets` 135 KB |
| Waktu satu kali baca state (GET) | 24 ms | **1,1–2,6 detik** |
| Waktu bolak-balik minimal ke server (`/api/health`) | <5 ms | ±0,6 detik (server di AS, `iad1`) |
| Satu klik tombol + sampai angka berubah | ±230 ms (POST ±55 ms, sisanya render) | Perkiraan **1,5–3 detik**: unggah 551 KB + server membaca 551 KB dari Redis + menulis 551 KB ke Redis. Tidak diukur langsung agar data produksi tidak berubah |

## 2. Penyebab, dari yang paling berpengaruh

| # | Penyebab | Di mana | Dampak |
|---|---|---|---|
| A | **Klik selama menunggu server dibuang.** `act()` di portal pengunjung punya kunci `busy`: klik kedua dan ketiga saat klik pertama belum selesai diabaikan tanpa pesan | `visitor.js` `act()` | Pengguna menekan + 3 kali, hanya tercatat 1. Terasa macet dan salah hitung |
| B | **Tampilan menunggu server.** Angka dan kursi baru berubah setelah transaksi selesai, tanpa tanda "sedang menyimpan" | Semua tombol yang memakai `tx()` | Di produksi 1,5–3 detik tanpa respons |
| C | **Setiap klik mengirim seluruh state** (`POST {base, state}`), padahal yang berubah hanya satu angka | `engine.js` `server.commit()` | 551 KB per klik, terasa di jaringan ponsel |
| D | **Server memproses seluruh state dua kali**: membaca 551 KB dari Redis (`MGET`), `guard()` membandingkan seluruh isi, lalu menulis 551 KB lagi (`EVAL`) | `server/store.js` `redisStore.write`, `server/guard.js` | Dua kali transfer besar per klik di Vercel |
| E | **Poster acara disimpan di dalam state** sebagai data URL | `admin.js` `posterFrom()`, `events[id].img` | 181 KB ikut terkirim di setiap klik dan setiap polling |
| F | **Server jauh**: Vercel `iad1` (AS Timur) + Upstash `us-east-1` | `vercel.json` | ±250–600 ms per bolak-balik dari Bandung, sebelum data apa pun dikirim |
| G | **Satu versi untuk seluruh data.** Aktivitas apa pun (pembeli lain, Command Center mengklaim anomali) membuat commit lain kalah (409), lalu harus mengunduh ulang state penuh dan mengirim ulang | `tx()` | Saat ramai, satu klik bisa berarti 2–3 kali transfer penuh |
| H | **Polling mengunduh state penuh** ke semua perangkat setiap ada perubahan (min. 2 detik di Vercel). Ada juga tarik data yang sudah berjalan saat commit sendiri selesai, sehingga state sendiri ikut diunduh ulang | `pull()` / `pollTick()` | Bandwidth ponsel tersita, bersaing dengan klik |
| I | **Render ulang seluruh halaman** di setiap perubahan (`app.innerHTML = ...` + jeda 80–120 ms + memasang ulang semua event) | `visitor.js` `render()`, `admin.js` `refresh()` | ±150 ms di laptop, lebih lama di ponsel murah |
| J | **Menyalin state** dengan `JSON.parse(JSON.stringify())` di setiap transaksi dan percobaan ulang, lalu `JSON.stringify` lagi untuk dikirim | `tx()` `clone()` | ±4 ms di laptop, 20–40 ms di ponsel, berlipat saat ada konflik |
| K | **Gate tidak memberi tanda saat memeriksa.** Hasil pindaian baru muncul setelah server menjawab | `checkin-ui.js` `scan()` | Petugas mengira pindaian gagal lalu memindai ulang, sehingga muncul "SUDAH DIGUNAKAN" |

## 3. Sudah diperbaiki (15 Nov 2026)

**Keranjang optimistis di portal pengunjung** (`visitor.js`, bagian "keranjang optimistis"). Ini menyelesaikan penyebab A dan B untuk langkah pilih tiket:
- Ketukan tombol + / − dan ketukan kursi **langsung tampil**: angka naik, kursi bertanda ✓ dan berdenyut selama disimpan.
- Penyimpanan berjalan **berurutan di belakang layar**, jadi tidak ada ketukan yang dibuang.
- Ketukan + beruntun **digabung**: tiga ketukan cepat menjadi satu kali simpan dengan angka terakhir.
- Kalau server menolak (kursi diambil orang lain, kuota habis, maksimal tiket per pesanan), tampilan kembali ke data server dan muncul pesannya. Batas maksimal per pesanan dicek langsung tanpa menunggu server.
- "Lanjut" menunggu semua simpanan selesai, dengan label "Menyimpan…", supaya halaman data pemesan membaca keranjang yang benar.
- "Lepas semua" ikut antrean yang sama.

Keamanan anti-dobel **tidak berubah**: setiap simpanan tetap lewat `tx()` dengan CAS. Yang optimistis hanya tampilannya.

**Bukti** (`tests/e2e/specs/03-respons.spec.mjs`, server sengaja diperlambat 1,5 detik per simpan):

| Uji | Kode lama | Kode baru |
|---|---|---|
| Ketuk + tiga kali cepat | Angka masih **0** saat dicek, ketukan ke-2 dan ke-3 hilang | Angka langsung **3**, tersimpan 3 |
| Ketuk tiga kursi cepat | Kursi masih **kosong** | Ketiganya langsung ✓, tersimpan 3 |
| Kursi ternyata sudah diambil orang lain | | Tampil ✓ sebentar, lalu dikembalikan dengan pesan "sedang dipesan pengunjung lain" |

## 4. Rencana berikutnya

Urutan disusun dari dampak terbesar per usaha. Setiap tahap harus lulus `npm test` dan `tests/e2e`, plus satu uji baru yang mengukur angkanya.

### Tahap 1: cepat, risiko rendah (±1 hari)

| Pekerjaan | Penyebab | Cara | Target |
|---|---|---|---|
| 1.1 Tanda "sedang memproses" di semua tombol transaksi | B, K | Tombol yang ditekan langsung `disabled` + ikon berputar sampai `tx()` selesai. Di gate, hasil langsung menampilkan "Memeriksa…" | Setiap klik ada respons < 100 ms |
| 1.2 Klik tidak dibuang di tempat lain | A | Ganti kunci `busy` di `act()` dengan antrean seperti keranjang (bayar, batal, daftar tunggu) | 0 klik hilang |
| 1.3 Poster acara keluar dari state | E | Simpan poster sebagai file (LAN: `data/img/`, Vercel: Blob storage atau Redis key terpisah). State hanya menyimpan URL-nya | State produksi turun ±181 KB (−33%) |
| 1.4 Lewati tarik data setelah commit sendiri | H | Di `pull()`, abaikan jawaban dengan versi ≤ versi lokal. Batalkan tarik yang sedang berjalan saat commit berhasil | Tidak ada unduhan state sendiri |
| 1.5 Kompres unggahan | C | `CompressionStream('gzip')` di `server.commit()`, server membuka dengan `zlib.gunzip` (`readBody`). JSON state termampatkan ±5–8× | Unggahan per klik ±550 KB → ±80 KB |

### Tahap 2: menengah (±2–3 hari)

| Pekerjaan | Penyebab | Cara | Target |
|---|---|---|---|
| 2.1 Pindah server ke dekat Bandung | F | Vercel region `sin1` (Singapura) + database Upstash baru di `ap-southeast-1`. Keduanya harus pindah bersama (lihat README). Butuh akses akun Vercel & Upstash | Bolak-balik ±600 ms → ±50 ms |
| 2.2 Kirim perubahan, bukan seluruh state | C, D | `tx()` menghitung selisih (JSON patch: hanya `seats.EVT-01.A5` yang berubah). Server menerapkan patch ke state terbaru, lalu menjalankan `guard()` | Unggahan per klik < 2 KB |
| 2.3 Server membaca Redis sekali | D | Satu skrip Lua yang mengecek versi + menyimpan, tanpa `MGET` terpisah. `guard()` cukup memeriksa bagian yang berubah (dari patch) | Satu transfer ke Redis per klik |
| 2.4 Render sebagian | I | Untuk perubahan yang sering (angka jumlah, status kursi, statistik gate), perbarui elemen terkait saja, bukan `innerHTML` seluruh halaman | Render < 16 ms di ponsel |

### Tahap 3: arsitektur untuk produksi (setelah uji coba)

| Pekerjaan | Penyebab | Cara |
|---|---|---|
| 3.1 Transaksi per kursi / per acara | G | Pindah ke database relasional (PostgreSQL), satu baris per kursi/pesanan, dengan `SELECT … FOR UPDATE` atau versi per baris. Pembelian di acara berbeda tidak lagi saling memicu konflik |
| 3.2 Aturan bisnis di server | C, D, J | Browser mengirim perintah ("tahan kursi A5 untuk keranjang X"). Server menjalankan aturan dan menjawab hasilnya. State tidak lagi dikirim bolak-balik, dan kunci tanda tangan QR pindah ke server |
| 3.3 Push realtime | H | Ganti polling dengan Server-Sent Events / WebSocket, kirim hanya perubahan |
| 3.4 Data per halaman | H | Portal pengunjung hanya mengunduh acara yang dibuka. Konsol hanya mengunduh acara yang dipilih |

## 5. Cara mengukur ulang

- **Uji respons** (selalu jalan bersama e2e): `cd tests/e2e && npx playwright test specs/03-respons.spec.mjs`.
- **Ukuran state produksi** (hanya baca):
  `curl -s -o /dev/null -w "%{time_total}s %{size_download}B\n" https://smiccts.vercel.app/api/evt/state`
- **Klik di produksi**: buka DevTools → Network, ketuk + di halaman kategori, lihat durasi dan ukuran `POST /api/evt/state`. Ulangi setelah setiap tahap dan catat angkanya di tabel bagian 1.
