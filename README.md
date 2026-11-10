# Summarecon Mall Integrated Command Center Ticketing System (prototype)

## Struktur folder
| Folder | Isi |
|---|---|
| `server.js`, `server/` | Backend: rute & akun staf (`server/config.js`), login, penyimpanan, guard. `api/index.js` = entry Vercel |
| `app/pages/` | Satu file HTML per halaman (beranda, pengunjung, pengelola, checkin, command-center, masuk) |
| `app/js/core/` | Dipakai semua halaman: tema, router, sesi login staf, komponen UI |
| `app/js/command-center/` | Command Center: shell, store, data contoh, simulasi, `views/` per dashboard |
| `app/js/event/` | Event Ticketing: engine, portal pengunjung, check-in, konsol pengelola (`admin.js`), jembatan ke Command Center |
| `app/css/`, `app/vendor/` | Gaya, Tailwind hasil build, font, library QR |
| `tests/` | Semua tes (`npm test`) |
| `tools/` | Generator dokumen (`tools/docs/`), config Tailwind, unduh font |
| `docs/` | Dokumen referensi. `unduhan/` = Excel & runbook yang ditautkan aplikasi, `sumber/` = mindmap & blueprint, `rencana/` = rencana kerja lama |
| `data/` | State & rahasia saat berjalan (tidak di-commit) |

## Tiga path
| Path | Halaman | Untuk | Isi |
|---|---|---|---|
| `/pengunjung` | `app/pages/pengunjung.html` | **1. Pengunjung** yang membeli tiket (beranda responsif sampai desktop, langkah beli mobile-first) | Acara → pilih kategori → pilih kursi (kategori bernomor kursi) → data peserta → bayar (sandbox) → e-ticket QR, Tiket Saya, Kotak Masuk, daftar tunggu |
| `/pengelola` | `app/pages/pengelola.html` | **2. Pengelola acara** (panitia/EO) | Pemilih acara di sidebar, bawaannya **Semua acara** dengan menu Dasbor, Daftar acara, Transaksi, Check-in & gate, Keuangan, dan Laporan PDF semua acara. Menu per acara: (cari, saring status, tambah, publikasikan, batalkan dengan refund otomatis, hapus) dan menu per acara: Ringkasan + Perlu tindakan, Pengaturan, Denah kursi, Peserta & transaksi, Check-in & gate, Komunikasi, Keuangan & ROI. Alamat bisa ditautkan (`/pengelola/e/EVT-01/peserta`). **Ctrl+K** (atau `/`) membuka pencarian cepat: menu, acara, kode booking/nama pemesan, perintah. Kartu angka bisa diklik untuk rincian. **Laporan PDF** per acara (ringkasan, penjualan per kategori, tren 14 hari, rekonsiliasi, kehadiran per gate, ROI) dari header acara, menu ⋯, atau halaman Keuangan. Alat demo (uji rebutan kursi, uji tekan, uji 2 gate, reset) lewat Ctrl+K, ketik "uji". Profil dan Keluar ada di kanan atas |
| `/command-center` | `app/pages/command-center.html` | **3. Manajemen mall 360** | 9 dashboard Command Center. Menu **Pemantauan Event** hanya baca: portofolio semua acara, dampak ke parkir/CCTV/BMS/tenant, Gate & Keamanan → tiket insiden SOP-EVT-03, transaksi |
| `/checkin` | `app/pages/checkin.html` | Petugas gate (tim pengelola) | Pemindai QR di ponsel + tombol lapor ke Command Center |
| `/` | `app/pages/beranda.html` | Semua | Halaman pilih path |

Semua halaman memakai URL bersih tanpa `#` (mis. `/pengunjung/e/EVT-01`, `/command-center/sop?id=SOP-EVT-01`). Alamat lama (`app/pengunjung.html#/e/EVT-01`, `app/event.html`, `index.html`, dst.) otomatis dialihkan ke bentuk baru.

## Isi lain
| Path | Keterangan |
|---|---|
| `server.js` + `server/` | Aplikasi tunggal (Node 20+, tanpa npm): URL bersih, aset, login staf, API state event bersama dengan transaksi berversi (anti double-booking). Dipakai LAN dan Vercel |
| `docs/unduhan/SOP_Drilldown_Summarecon_Mall_Command_Center.xlsx` | 48 SOP, 255 langkah (termasuk SOP-EVT-01..04), SLA, eskalasi, RACI, traceability mindmap |
| `docs/unduhan/UseCase_Relasi_Dashboard_Summarecon_Mall.xlsx` | 18 use case (termasuk UC-17/18 event), 43 relasi dashboard, matriks, event dictionary |
| `docs/unduhan/RUNBOOK_Relasi_Dashboard_Summarecon_Mall.md` | Runbook relasi antar dashboard (diagram mermaid) |
| `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md` | Asumsi, alur, logika pemilihan kursi & validasi QR (bahan deck Bandung Build Challenge 2026) |
| `tools/docs/sop_data.py`, `tools/docs/usecase_data.py` | Sumber data tunggal SOP & use case |
| `tools/docs/build_docs.py` | Generator Excel, runbook, dan `app/js/command-center/sop-data.js` |

## Menjalankan (tanpa internet, jaringan lokal)
Semua aset lokal di `app/vendor/` (font, ikon, CSS Tailwind hasil build, library QR `qrcode.js` MIT & `jsQR.js` Apache-2.0).

Butuh Node.js 20+ saja, **tanpa `npm install`** (proyek ini sengaja tanpa dependensi).

```bash
npm start          # sama dengan: node server.js (bisa diakses perangkat lain di LAN)
npm run dev        # hanya komputer ini, server restart otomatis saat file server/ berubah, aset tidak di-cache
npm test           # semua tes
```
Server berjalan di `0.0.0.0:8765` dan mencetak alamat LAN-nya, misalnya:
- Pilih peran: `http://<IP>:8765/`
- Pengunjung (buka di ponsel): `http://<IP>:8765/pengunjung`
- Pengelola acara: `http://<IP>:8765/pengelola`
- Command Center mall 360: `http://<IP>:8765/command-center` → menu **Pemantauan Event**
- Check-in gate (ponsel petugas): `http://<IP>:8765/checkin`

Semua perangkat di LAN berbagi data event yang sama (disimpan di `data/event_state.json`). Pastikan firewall mengizinkan port 8765. Hanya untuk komputer ini: `node server.js 8765 127.0.0.1`.

Tanpa `server.js` (mis. server statis lain, atau Vercel tanpa Redis) aplikasi tetap jalan dalam **mode lokal**: data event hanya di browser itu (tetap sinkron antar-tab), dan banner kuning "Mode lokal" tampil di atas halaman. Pembeli dan pemindai di perangkat berbeda wajib lewat `server.js`.

Pemindai check-in menerima QR e-ticket, kode tiket `T-…`, atau kode booking `BK-…` (ketik atau pemindai HID/USB).

Catatan kamera: browser hanya mengizinkan kamera live di HTTPS/localhost. Dari ponsel lewat HTTP LAN gunakan tombol **Foto QR** (memotret QR dengan kamera ponsel) atau ketik kode.

Reset data: tombol **Reset demo** di sidebar Command Center (tiket insiden) dan, di Konsol Pengelola, tekan **Ctrl+K** lalu ketik "reset" (data event semua perangkat).

## Login staf (email & password)
| Path | Akun demo | Keterangan |
|---|---|---|
| `/pengunjung` | - (opsional `pengunjung@example.com`) | Terbuka untuk pengunjung; akun hanya untuk Tiket saya & isi data otomatis |
| `/pengelola` | `pengelola@example.com` | Panitia/EO. Reset data event juga butuh sesi ini. Juga boleh membuka `/checkin` |
| `/checkin` | `gate@example.com` | Petugas gate: pindai e-ticket & lapor ke Command Center |
| `/command-center` | `cc@example.com` | Manajemen mall & operator Command Center |

- Password semua akun demo: `smicc-demo-2026` (ditampilkan di halaman `/masuk`, wajar untuk prototype). Ganti untuk
  semua akun staf lewat variabel lingkungan `STAFF_PASSWORD`; kartu akun demo lalu hanya mengisi email.
- Membuka portal staf tanpa sesi → diarahkan ke `/masuk`. Klik kartu akun demo mengisi email & password, tekan **Masuk**,
  lalu kembali ke halaman tujuan (bila peran akun itu boleh membukanya).
- Akun & peran ada di `server/config.js` (`ACCOUNTS`); dicek di server (`server/auth.js`). Sesi berupa cookie HttpOnly per peran,
  berlaku 12 jam. Tombol **Keluar** ada di header.
- Salah 5 kali → login dari alamat itu dikunci 60 detik.
- Jangan membagikan folder `data/` (kunci sesi dan data event).
- Server memeriksa setiap perubahan data menurut peran: tanpa login hanya perubahan pembeli yang diterima (hold, pesanan,
  bayar, daftar tunggu); petugas gate juga boleh check-in & laporan gate; refund, ubah acara dan reset butuh pengelola.
  Batasan prototype: aturan bisnis dan kunci tanda tangan QR masih di browser. Tanpa `server.js` (mode lokal satu
  perangkat) login staf tidak berlaku.

## Memperbarui aset lokal (opsional, perlu internet sekali)
Bila menambah kelas Tailwind baru di `app/pages/*.html` atau `app/js`:
```bash
npx tailwindcss@3 -c tools/tailwind/tailwind.config.js -i tools/tailwind/input.css -o app/vendor/tailwind.css --minify
```
Unduh ulang font: `python3 tools/vendor_fonts.py`

## Mengubah SOP / use case
1. Edit `tools/docs/sop_data.py` atau `tools/docs/usecase_data.py`.
2. `python3 tools/docs/build_docs.py` (validasi relasi + generate ulang Excel, runbook, dan data aplikasi).
3. Buka file Excel di Microsoft Excel dan simpan sekali agar nilai formula terhitung ulang.

## Deploy Vercel

Produksi: https://smiccts.vercel.app, dideploy otomatis setiap push ke `main` (repo GitHub `martioalanshori/bcc-juara`).
`api/index.js` hanya pembungkus `server/app.js` yang sama dengan LAN; bedanya state event disimpan di Upstash Redis. `vercel.json` meneruskan semua path selain aset ke fungsi itu.
Environment variable di Vercel: `SESSION_SECRET`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, opsional `STAFF_PASSWORD`.
Ganti password staf: ubah env di dashboard Vercel lalu Redeploy. Versi LAN (`node server.js`) tetap berjalan seperti biasa.

### Tetap gratis (Vercel Hobby + Upstash Free)
Kuota gratis: Vercel Hobby ±1 juta (sebagian sumber menyebut 100 ribu) function invocation per bulan, Upstash Free 500 ribu command per bulan. Tidak ada tagihan otomatis, tetapi bila kuota habis backend berhenti sampai bulan berikutnya. Karena itu di Vercel browser **menarik data lebih jarang** (diatur `poll` di `api/index.js`):
- tiap 2 detik saat ada perubahan, melambat bertahap sampai 15 detik saat sepi;
- berhenti saat tab tersembunyi, langsung menarik lagi saat tab dibuka atau mendapat fokus;
- anti double-booking tetap dijamin CAS di server, bukan oleh kecepatan polling.

Perkiraan: satu tab yang terus terlihat dan sepi ±5.800 request/hari. Untuk demo beberapa jam dengan beberapa perangkat jauh di bawah kuota. Jangan biarkan banyak tab Command Center terbuka 24 jam di Vercel; untuk pemakaian harian pakai versi LAN. Pantau di dashboard Vercel (Usage) dan Upstash.

Aturan agar deploy tetap jalan (dijaga `tests/deploy.test.mjs`): `package.json` tanpa dependensi, tanpa script `build`/`postinstall`, dan tanpa `"type": "module"`.

**Region:** database Upstash ada di `us-east-1`, jadi function dikunci ke `iad1` (`"regions"` di `vercel.json`, region AWS yang sama) agar panggilan function ke Redis hanya ±1-2 ms. Pengguna di Indonesia tetap menempuh ±200-250 ms per request ke AS. Untuk respons lebih cepat, pindahkan **keduanya** ke Singapura: buat database Upstash baru di `ap-southeast-1`, ganti `KV_REST_API_URL` & `KV_REST_API_TOKEN` di Vercel, ubah region ke `sin1` (juga di `tests/deploy.test.mjs`), redeploy, lalu Reset data di Konsol Pengelola. Jangan pindahkan function saja: setiap request jadi lebih lambat.

**Cache browser:** JS, CSS, dan font di-cache 1 tahun, jadi kunjungan berikutnya hanya mengunduh HTML (±4 KB, sebelumnya ±450 KB untuk Command Center). Akibatnya, **setiap mengubah JS/CSS wajib menaikkan `?v=` di semua `app/pages/*.html`**, kalau tidak pengguna tetap memakai versi lama. `npm run dev` mematikan cache selama pengembangan.
