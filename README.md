# Summarecon Mall · Integrated Command Center Ticketing System (Prototype)

## Tiga path
| Path (alias `server.py`) | Halaman | Untuk | Isi |
|---|---|---|---|
| `/pengunjung` | `app/pengunjung.html` | **1. Pengunjung** yang membeli tiket (mobile-first) | Acara → denah kursi → data peserta → bayar (sandbox) → e-ticket QR, Tiket Saya, Kotak Masuk, daftar tunggu |
| `/pengelola` | `app/pengelola.html` | **2. Pengelola acara** (panitia/EO) | Daftar Acara: **tambah, publikasikan, batalkan (refund otomatis), hapus**; Kelola Acara (jadwal, venue, periode jual, jenis tiket, harga, kuota); Denah kursi (blokir, uji rebutan kursi); Peserta & transaksi (ubah data, refund, CSV); Check-in QR; Notifikasi & waitlist; lapor anomali ke Command Center |
| `/command-center` | `app/index.html` | **3. Manajemen mall 360** | 9 dashboard Command Center. Menu **Event 360 (Monitoring)** hanya baca: portofolio semua acara, dampak ke parkir/CCTV/BMS/tenant, Gate & Keamanan → tiket insiden SOP-EVT-03, transaksi |
| `/checkin` | `app/checkin.html` | Petugas gate (tim pengelola) | Pemindai QR di ponsel + tombol lapor ke Command Center |
| `/` | `index.html` | Semua | Halaman pilih path |

`app/event.html` (alamat lama) otomatis diarahkan ke `pengunjung.html`.

## Isi lain
| Path | Keterangan |
|---|---|
| `server.py` | Server LAN (Python standar): file statis + API state event bersama dengan transaksi berversi (anti double-booking) |
| `docs/SOP_Drilldown_Summarecon_Mall_Command_Center.xlsx` | 48 SOP · 255 langkah (termasuk SOP-EVT-01..04), SLA, eskalasi, RACI, traceability mindmap |
| `docs/UseCase_Relasi_Dashboard_Summarecon_Mall.xlsx` | 18 use case (termasuk UC-17/18 event), 43 relasi dashboard, matriks, event dictionary |
| `docs/RUNBOOK_Relasi_Dashboard_Summarecon_Mall.md` | Runbook relasi antar dashboard (diagram mermaid) |
| `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md` | Asumsi, alur, logika pemilihan kursi & validasi QR (bahan deck Bandung Build Challenge 2026) |
| `tools/sop_data.py`, `tools/usecase_data.py` | Sumber data tunggal SOP & use case |
| `tools/build_docs.py` | Generator Excel, runbook, dan `app/js/sop-data.js` |

## Menjalankan (tanpa internet, jaringan lokal)
Semua aset lokal di `app/vendor/` (font, ikon, CSS Tailwind hasil build, library QR `qrcode.js` MIT & `jsQR.js` Apache-2.0).

```bash
python3 server.py
```
Server berjalan di `0.0.0.0:8765` dan mencetak alamat LAN-nya, misalnya:
- Pilih path: `http://<IP>:8765/`
- Pengunjung (buka di ponsel): `http://<IP>:8765/pengunjung`
- Pengelola acara: `http://<IP>:8765/pengelola`
- Command Center mall 360: `http://<IP>:8765/command-center` → menu **Event 360 (Monitoring)**
- Check-in gate (ponsel petugas): `http://<IP>:8765/checkin`

Semua perangkat di LAN berbagi data event yang sama (disimpan di `data/event_state.json`). Pastikan firewall mengizinkan port 8765. Hanya untuk komputer ini: `python3 server.py 8765 127.0.0.1`.

Tanpa `server.py` (mis. `python3 -m http.server` atau membuka file HTML langsung) aplikasi tetap jalan dalam **mode lokal**: data event hanya di browser itu (tetap sinkron antar-tab), dan banner kuning "Mode lokal" tampil di atas halaman. **Untuk pembeli dan pemindai di perangkat berbeda, wajib lewat `server.py`.**

Pemindai check-in menerima QR e-ticket, kode tiket `T-…`, atau kode booking `BK-…` (ketik atau pemindai HID/USB).

Catatan kamera: browser hanya mengizinkan kamera live di HTTPS/localhost. Dari ponsel lewat HTTP LAN gunakan tombol **Foto QR** (memotret QR dengan kamera ponsel) atau ketik kode.

Reset data: tombol **RESET DEMO** di sidebar Command Center (tiket insiden) dan tombol **Reset** di Konsol Pengelola (data event semua perangkat).

## Akses PIN per peran
| Path | PIN | Keterangan |
|---|---|---|
| `/pengunjung` | – | Terbuka untuk pengunjung |
| `/pengelola`, `/checkin` | PIN **pengelola** | Panitia/EO & petugas gate. Reset data event juga butuh sesi ini |
| `/command-center` | PIN **command-center** | Manajemen mall & operator Command Center |

- Membuka path 2/3 tanpa sesi → diarahkan ke `app/masuk.html` (PIN 4–8 angka). Setelah benar kembali ke halaman tujuan.
- PIN diverifikasi di `server.py` (hash PBKDF2 di `data/access.json`). Sesi berupa cookie HttpOnly per peran, berlaku 12 jam. Tombol **Keluar** ada di header.
- Salah PIN 5 kali → peran itu dikunci 60 detik untuk perangkat tersebut.
- **PIN awal**: dibuat acak saat server pertama kali jalan, dicetak di terminal dan ditulis ke `data/PIN_AWAL.txt`. Bagikan hanya ke yang berhak, lalu ganti:
  ```bash
  python3 server.py --set-pin pengelola 123456
  python3 server.py --set-pin command-center 654321
  ```
  Setelah semua PIN diganti, `data/PIN_AWAL.txt` terhapus otomatis. Restart server agar sesi lama berakhir.
- Jangan membagikan folder `data/` (berisi hash PIN dan data event).
- Batasan prototype: PIN mengunci **halaman**. API state event tetap bersama (dibutuhkan pengunjung untuk membeli), jadi perangkat yang paham API masih bisa mengirim perubahan. Produksi perlu API per aksi dengan otorisasi per peran di server. Tanpa `server.py` (mode lokal satu perangkat) PIN tidak berlaku.

## Memperbarui aset lokal (opsional, perlu internet sekali)
Bila menambah kelas Tailwind baru di `index.html`, `app/*.html` atau `app/js`:
```bash
npx tailwindcss@3 -c tools/tailwind/tailwind.config.js -i tools/tailwind/input.css -o app/vendor/tailwind.css --minify
```
Unduh ulang font: `python3 tools/vendor_fonts.py`

## Mengubah SOP / use case
1. Edit `tools/sop_data.py` atau `tools/usecase_data.py`.
2. `python3 tools/build_docs.py` (validasi relasi + generate ulang Excel, runbook, dan data aplikasi).
3. Buka file Excel di Microsoft Excel dan simpan sekali agar nilai formula terhitung ulang.

## Deploy Vercel

Produksi: https://smiccts.vercel.app — otomatis dideploy setiap push ke `main` (repo GitHub `martioalanshori/bcc-juara`).
Backend serverless ada di `api/index.js` (padanan `server.py`), state event disimpan di Upstash Redis.
Environment variable di Vercel: `PIN_PENGELOLA`, `PIN_COMMAND_CENTER`, `SESSION_SECRET`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`.
Ganti PIN: ubah env di dashboard Vercel lalu Redeploy. Versi LAN (`python server.py`) tetap berjalan seperti biasa.
