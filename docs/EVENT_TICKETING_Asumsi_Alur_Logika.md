# Sistem event ticketing Summarecon Mall Bandung
Bahan deck Bandung Build Challenge 2026: asumsi, alur, logika pemilihan kursi, dan validasi tiket pada prototype.

## 0. Tiga path (pemisahan peran)
| Path | Peran | Hak |
|---|---|---|
| `/pengunjung` (`app/pages/pengunjung.html`) | Pengunjung | Membeli tiket, melihat e-ticket & kotak masuk |
| `/pengelola` (`app/pages/pengelola.html`) + `/checkin` | Pengelola acara (panitia/EO) & petugas gate | Kendali penuh atas acaranya: tambah, publikasikan, batalkan, hapus, kelola tiket/denah/peserta/refund, check-in, lapor anomali |
| `/command-center` (`app/pages/command-center.html` → Pemantauan Event) | Manajemen mall | Hanya memantau semua acara, dampak operasional mall, dan keamanan gate; membuat tiket insiden. Tidak dapat mengubah data acara |

Akses: `/pengelola` dan `/checkin` memakai PIN pengelola, `/command-center` memakai PIN command-center, `/pengunjung` terbuka. PIN diverifikasi server (`server/auth.js`) (hash PBKDF2, sesi cookie HttpOnly 12 jam, kunci 60 detik setelah 5 kali salah). Detail di README.

## 1. Asumsi
| Topik | Asumsi pada prototype |
|---|---|
| Venue | **Main Atrium GF** (11 baris, 178 kursi bernomor + area Festival berdiri 200) dan **Summarecon Hall Lt. 3** (8 baris × 14 kursi). |
| Acara contoh | EVT-01 Konser Akustik (hari ini, untuk demo check-in), EVT-02 Demo Day & Awarding 15 Nov 2026 (gratis, registrasi, baris A-B undangan), EVT-03 Stand-Up Comedy 28 Nov 2026 (penjualan belum dibuka). |
| Kategori & harga | VIP Rp750.000 (A-B), Gold Rp450.000 (C-F), Silver Rp250.000 (G-L), Festival Rp150.000 (kuota). Biaya layanan Rp5.000/tiket berbayar. |
| Aturan pesanan | Maks 4 tiket per pesanan (2 untuk Demo Day); kursi ditahan **8 menit** saat dipilih; batas bayar **15 menit** setelah pesanan dibuat. |
| Pembayaran | Simulasi sandbox (QRIS, VA, e-wallet, kartu). Tidak ada data kartu/rekening yang diminta; tombol "berhasil/gagal" mensimulasikan callback gateway. |
| Notifikasi | Email & WhatsApp disimulasikan sebagai outbox (kotak masuk pengunjung & tab Notifikasi panitia). |
| Data | Data contoh (`@example.com`, nomor `0812-0000-xxxx`), bukan data pribadi nyata. |
| Infrastruktur | Berjalan di jaringan lokal tanpa internet: `server.js` (Node standar, tanpa npm) sebagai sumber kebenaran bersama. Produksi: database transaksional + payment gateway + layanan pesan. |

## 2. Alur pengunjung (mobile-first, `/pengunjung`)
1. **Lihat acara**: jadwal, lokasi, kategori, harga, sisa tiket, status penjualan.
2. **Pilih kategori & kursi** di denah. Filter kategori menyorot kursi; legenda membedakan *tersedia* (warna kategori + nomor), *pilihanmu* (✓), *sedang dipesan* (arsir oranye), *terjual* (abu-abu ×), *tidak dijual* (garis titik).
3. **Isi data peserta**: nama, email, WhatsApp; nama pemegang per tiket bersifat opsional.
4. **Ringkasan**: item, harga, biaya layanan, total, dan hitung mundur hold.
5. **Pembayaran sandbox**: pilih metode, lalu simulasikan berhasil/gagal; pesanan juga bisa dibatalkan.
6. **E-ticket QR** per kursi: status check-in, simpan ke kalender (.ics), kirim ulang.
7. **Tiket Saya / Kotak Masuk**: riwayat pesanan & pengingat. Pencarian pesanan memakai kode booking + email.
8. **Daftar tunggu** saat kategori habis.

## 3. Alur pengelola acara (`/pengelola`, `/checkin`)
- **Daftar acara**:
  - **Acara baru**: nama, kategori, tagline, jadwal, templat venue (Main Atrium 178 kursi + festival 200, atau Summarecon Hall 112 kursi). Acara dibuat sebagai Draft dan belum tampil di portal.
  - **Publikasikan** untuk menampilkan acara di portal pengunjung.
  - **Batalkan acara**: semua pesanan lunas di-refund otomatis (e-ticket VOID), pesanan menunggu bayar dibatalkan, kursi dilepas, dan peserta dikabari.
  - **Hapus**: hanya untuk acara tanpa transaksi lunas atau menunggu bayar (draft atau salah input). Acara yang sudah terjual harus dibatalkan dulu.
- **Ringkasan**: tiket terjual/kapasitas, pendapatan, pendaftar unik, kehadiran, kursi sedang dipesan, menunggu bayar, komposisi per kategori, tren penjualan & arus check-in.
- **Denah kursi live**: detail pemesan per kursi, mode blokir kursi (kamera/FOH/kursi roda), uji rebutan kursi.
- **Kelola acara**: nama, jadwal, gate, venue, status (Draft/Dipublikasikan/Ditutup), periode jual, durasi hold, maks per pesanan; jenis tiket, harga, kuota, dijual/undangan.
- **Peserta & transaksi**: pencarian, filter status, ubah data peserta, kirim ulang e-ticket, batal, refund; ekspor CSV peserta (per tiket) & transaksi.
- **Keuangan & ROI** (`Evt.finance(evId)`, untuk Finance & Marketing):
  - Rekonsiliasi per metode pembayaran: bruto = total pesanan lunas + refund, refund, neto = bruto - refund, biaya layanan. Ekspor CSV rekonsiliasi.
  - Selisih rekonsiliasi: pesanan lunas yang total-nya tidak sama dengan subtotal + biaya layanan, jumlah e-ticket tidak sama dengan jumlah tiket, atau punya e-ticket tidak aktif; pesanan refund yang masih punya e-ticket aktif.
  - Penjualan per kategori memakai harga per item yang disimpan saat pesanan dibuat (`items[i].price`), bukan harga jenis tiket terbaru. Pesanan lama tanpa harga per item: subtotal dibagi sebanding harga jenis saat ini.
  - ROI untuk mall: manfaat = sewa venue + bagi hasil tiket (persen dari pendapatan tiket lunas, yaitu subtotal tanpa biaya layanan; biaya layanan milik platform); ROI = (manfaat - biaya operasional mall) / biaya, tampil "-" bila biaya 0. Estimasi belanja pengunjung di tenant = pengunjung (check-in bila acara sudah mulai, selain itu tiket aktif) × rata-rata belanja; tidak masuk ROI.
  - Angka kontrak venue (`e.fin`: sewa, bagi hasil, biaya, belanja) diisi pengelola di Kelola acara. Bila kosong dipakai asumsi demo `FIN_DEFAULT` (sewa Rp 35 jt, bagi hasil 10%, biaya Rp 12 jt, belanja Rp 150 rb); seed Summarecon Hall memakai sewa Rp 20 jt. Command Center melihat tab ini read-only.
- **Check-in QR**: kamera / foto QR / ketik kode, dengan hasil **VALID**, **SUDAH DIGUNAKAN**, atau **TIDAK VALID**; statistik per gate; log pindaian langsung.
- **Anomali gate**: tombol **Laporkan ke Command Center** (konsol & ponsel gate). Statusnya tampil "menunggu CC" lalu "Ditangani TCK-…".
  - Tiket insiden P2 dibuat **otomatis** oleh Command Center (`app/js/event/cc-bridge.js`, hanya dimuat di `/command-center`): setiap anomali (`Evt.anomalies`, ambang >= 3 pindaian gagal/duplikat per gate dalam 10 menit) diklaim lewat `Evt.claimAnomaly(evId, gate, idCC)`, dan setiap laporan petugas gate yang belum punya tiket (30 menit terakhir) lewat `Evt.claimReport(id, idCC)`. Klaim adalah transaksi CAS, jadi bila beberapa browser CC terbuka hanya satu yang membuat tiket (SOP-EVT-03, P2, Regu Bravo, CAM-01) lalu menautkannya dengan `linkReport`. Klaim yang belum tertaut setelah 60 detik (browser ditutup) boleh diambil alih CC lain. Pemeriksaan berjalan setiap ada perubahan state dan setiap 5 detik. Sebuah gate dianggap sudah ditangani selama ada laporannya dalam 30 menit terakhir, jadi anomali yang berlangsung lama tetap satu insiden; anomali setelah itu menjadi insiden baru. Tombol manual "Buat tiket insiden" di Command Center menjalankan pemeriksaan yang sama saat itu juga (klaim atomik), bukan membuat tiket terpisah. Klaim yang tidak mengubah apa pun tidak melakukan commit (`tx` mengenali penanda NOOP), jadi anomali yang sudah ditangani tidak menaikkan versi data. Bila penautan tiket gagal (konflik/jaringan), nomor tiket disimpan di localStorage (`smicc-cc-pending-link`) dan penautan dicoba lagi, sehingga tidak muncul tiket kedua.
  - Keterbatasan: tiket insiden disimpan di localStorage browser CC yang mengklaim, dan nomor TCK dihitung per browser. Browser CC lain menampilkan nomornya sebagai "(perangkat CC lain)" tanpa tautan.
- **Data contoh kedaluwarsa**: jadwal EVT-01 dibuat relatif terhadap waktu seed (`seededAt`). Bila data contoh berumur lebih dari 12 jam (`Evt.demoStale()`), konsol pengelola menampilkan banner kuning dengan tombol Reset. Tidak ada reset otomatis agar data demo yang sedang dipakai tidak terhapus.
- **Notifikasi & waitlist**: outbox, kirim pengingat massal, kabari daftar tunggu.
  - Daftar tunggu dikabari **otomatis** saat kursi/kuota kembali tersedia: pesanan di-refund (`refund`), pesanan menunggu bayar kedaluwarsa (`sweep`), atau pesanan dibatalkan (`cancel`). Untuk tiap jenis tiket yang dilepas, entri antrean jenis itu dikabari urut waktu daftar (FIFO) sampai jumlah tiket yang diminta menutup jumlah yang dilepas; entri pertama selalu dikabari. Entri yang sudah dikabari tidak dikabari lagi. Bila acara tidak berstatus PUBLISHED atau penjualan sudah ditutup (`saleEnd` lewat), daftar tunggu tidak dikabari otomatis karena kursi tidak bisa dibeli; tombol manual pengelola tetap bisa mengirim.
  - Acara dibatalkan (`cancelEvent`): semua antrean acara itu yang belum dikabari menerima pesan pembatalan sekali.
  - Setiap entri mencatat `notified` dan `reason` (`refund`, `kedaluwarsa`, `batal`, `acara-batal`, `manual`); alasan tampil di tab Notifikasi & daftar tunggu. Tombol manual tetap ada.

## 3b. Pemantauan Event di Command Center (`/command-center`, manajemen mall, hanya baca)
- **Portofolio Event 360**:
  - acara aktif, tiket terjual, pendapatan event, check-in hari ini, anomali gate, laporan lapangan;
  - tabel semua acara (okupansi, kehadiran, status gate);
  - proyeksi dampak 30 hari: kendaraan → Parkir, kepadatan → CCTV, pre-cooling → BMS, kebutuhan personel keamanan.
- **Detail acara & denah langsung**: KPI, komposisi kategori, dan denah tanpa tombol ubah.
- **Gate & Keamanan**:
  - anomali dan laporan dari pengelola;
  - **Buat tiket insiden** P2 (SOP-EVT-03) ke Tiket & Insiden di Command Center;
  - log pindaian per gate.
- **Transaksi**: lihat dan ekspor; refund dan perubahan data hanya oleh pengelola.

## 3c. Sinkronisasi antarperangkat
- **Mode server** (`node server.js`): setiap halaman menarik perubahan tiap ~1 detik, serta saat tab kembali aktif atau mendapat fokus. Di Vercel jadwalnya hemat kuota: tiap 2 detik saat ramai, melambat sampai 15 detik saat sepi, berhenti saat tab tersembunyi (jadwal dikirim server lewat `/api/health`). Server dideteksi hingga 3 kali percobaan agar Wi-Fi lambat tidak membuat halaman jatuh ke mode lokal.
- **Mode lokal** (file dibuka langsung atau server statis biasa):
  - data hanya di satu browser;
  - antar-tab tetap sinkron lewat event `storage` ditambah polling versi;
  - banner kuning memberi tahu bahwa perangkat lain tidak akan melihat data ini;
  - bila server.js terdeteksi belakangan, banner menawarkan muat ulang.

## 4. Logika pemilihan kursi & pencegahan pemesanan ganda
Status kursi: `TERSEDIA → SEDANG DIPESAN (HELD, berbatas waktu) → TERJUAL (SOLD)`. Kursi kembali `TERSEDIA` bila hold/pembayaran kedaluwarsa, pesanan dibatalkan, atau refund.

1. **Hold saat dipilih.** Kursi langsung terkunci untuk keranjang pembeli (8 menit) dan tampil "sedang dipesan" di semua perangkat.
2. **Transaksi berversi (optimistic concurrency).** Setiap perubahan dikirim sebagai `commit(base = versi yang dibaca, state baru)`. Server menerimanya hanya bila versi masih sama (compare-and-swap di bawah satu lock).
   - Pembeli yang kalah balapan mendapat `409`, membaca ulang state terbaru, lalu aturan dijalankan ulang.
   - Karena kursinya sudah `HELD` milik orang lain, permintaan ditolak dengan pesan "Kursi sedang dipesan pengunjung lain".
3. **Verifikasi ulang saat bayar.** Pembayaran hanya diterima bila semua kursi masih ditahan untuk pesanan itu dan belum kedaluwarsa. Callback **idempoten**: bayar dua kali tidak menerbitkan tiket ganda.
4. **Kedaluwarsa otomatis.** Hold/pesanan yang lewat batas waktu dilepas pada transaksi berikutnya, dan tampilan menghitung status secara langsung.

**Bukti uji:**
- Uji tekan 25 pembeli serentak pada satu kursi lewat API server: **1 berhasil, 24 ditolak**, 6 konflik versi tertangani, dan pemegang akhir = pemenang.
- Tombol *"Jalankan simulasi rebutan kursi"* di tab Denah Kursi memperagakan hal yang sama.
- Tombol *"Uji tekan 25 pembeli"* di tab Denah Kursi (`Evt.stressTest(evId, kursi, 25)`) menjalankan uji tekan itu langsung dari konsol: 25 keranjang `UJI-01` sampai `UJI-25` memanggil `holdSeat` dalam satu tick sehingga semuanya berangkat dari versi state yang sama. Yang kalah menerima 409, membaca ulang, lalu ditolak aturan "kursi sedang dipesan". Hasil yang diharapkan: 1 berhasil, 24 ditolak. Hold pemenang langsung dilepas setelah uji. Uji ditolak bila kursi tidak tersedia atau penjualan acara sedang tidak dibuka.
- Test otomatis engine: `node --test "tests/*.test.mjs"` (Node 20 ke atas, tanpa npm).

## 5. Validasi QR saat check-in
- **Isi QR:** `SMB1|<ID tiket>|<ID acara>|<kursi>|<tanda tangan>`. Tanda tangan dihitung dari ID tiket, acara, dan kursi dengan kunci rahasia (prototype: hash; produksi: HMAC-SHA256 di server).
- **TIDAK VALID** bila:
  - format tidak dikenali;
  - tanda tangan tidak cocok (QR palsu/diubah);
  - tiket tidak terdaftar;
  - tiket untuk acara lain;
  - tiket refund/dibatalkan;
  - pesanan belum lunas.
- **Input yang diterima pemindai:**
  - QR e-ticket. Toleran terhadap huruf besar/kecil, pemisah selain `|` (pemindai HID dengan tata letak keyboard berbeda), spasi, dan karakter tak terlihat.
  - Kode tiket `T-…` yang diketik petugas.
  - Kode booking `BK-…`: men-check-in tiket berikutnya yang belum masuk (1/2, 2/2, …).
  - Input manual tidak membawa tanda tangan, jadi petugas wajib mencocokkan nama pemegang.
- **SUDAH DIGUNAKAN** bila tiket pernah check-in. Sistem menampilkan jam dan gate check-in sebelumnya.
- **VALID**: tiket ditandai hadir. Check-in juga transaksi atomik, sehingga dua gate yang memindai bersamaan menghasilkan 1 VALID + 1 SUDAH DIGUNAKAN. Tombol *"Jalankan uji 2 gate"* di tab Check-in QR (`Evt.dualGateTest(evId)`) memperagakannya: tiket aktif pertama yang belum check-in dipindai di gate pertama dan kedua pada tick yang sama (acara dengan satu gate memakai "<gate> (perangkat 2)"). Kedua pindaian ditandai uji (`test: true`, tidak dihitung sebagai anomali gate) dan tiket dikembalikan ke belum check-in setelah uji, jadi pemiliknya tetap bisa masuk.
- **Anomali**: ≥3 pindaian gagal/duplikat per gate dalam 10 menit memunculkan peringatan. Dari situ:
  - Pengelola (konsol) atau petugas gate (ponsel) mengirim **laporan ke Command Center**.
  - Operator Command Center membuat **tiket insiden P2 (SOP-EVT-03)** dari Pemantauan Event → Gate & Keamanan. Nomor tiket tampil kembali di konsol pengelola.

## 6. Integrasi Command Center
- **SOP baru:**
  - SOP-EVT-01 Setup acara/tiket/denah
  - SOP-EVT-02 Penjualan & anti double-booking
  - SOP-EVT-03 Check-in & tiket palsu
  - SOP-EVT-04 Refund/perubahan data/waitlist
- **Use case:**
  - UC-17 Hari-H: indikasi tiket palsu & lonjakan check-in (EVT→TIC→CCTV→PARK→ANL)
  - UC-18 Rebutan kursi & gagal bayar (EVT→TIC→O360)
- **Relasi EVT:**
  - Keluar ke TIC, CCTV, PARK, BMS, ANL, O360, TEN
  - Masuk dari TIC dan CCTV

## 7. Batasan prototype
- Tidak terhubung ke payment gateway, sistem internal Summarecon, CRM, POS, atau layanan pesan sungguhan.
- Kamera live hanya di HTTPS/localhost. Di HTTP LAN gunakan *Foto QR*.
- PIN per peran mengunci halaman, dan server memeriksa setiap penulisan state menurut peran (`guard()` di `server/guard.js`, kasus uji `tests/guard_cases.json`, penolakan 403):
  - Tanpa login (pengunjung): hold kursi, pesanan baru, bayar/batal/kedaluwarsa pesanan yang masih menunggu bayar, daftar tunggu, outbox.
  - Command Center: seperti tanpa login, ditambah laporan gate (klaim dan tautan tiket insiden).
  - Pengelola: semua, termasuk ubah acara dan kontrak venue, refund, check-in (halaman Check-in), batal acara, reset.
  - Yang tidak boleh tanpa login: mengubah acara, versi skema (`v`, `seededAt`, karena perubahan itu memicu seed ulang), e-ticket yang sudah terbit, pindaian, pesanan non-PENDING, kursi terjual, dan reset.
  - Kursi SOLD dan e-ticket baru hanya diterima untuk pesanan yang lunas di penulisan itu (sebelumnya PENDING atau baru), dan kursinya harus ada di item pesanan. Hold kursi, hold kuota, dan batas bayar pesanan PENDING paling lama 60 menit ke depan. Bentuk data (array/objek di level atas, item/log/tiket pesanan) diperiksa supaya penulisan rusak tidak membuat semua halaman gagal.
- Batasan yang tersisa (prototipe): aturan bisnis tetap dijalankan di browser; server hanya menolak perubahan di luar peran. Kunci tanda tangan QR ada di `engine.js`, jadi orang yang membaca kode bisa membuat QR yang lolos verifikasi; pembayaran sandbox juga bisa ditandai lunas dari browser. Produksi perlu akun per orang, API per aksi, tanda tangan QR (HMAC) dan konfirmasi pembayaran dari gateway di server, serta otorisasi per acara (EO hanya acaranya sendiri).
- Kunci tanda tangan QR ada di sisi klien demi kesederhanaan prototype. Pada produksi, tanda tangan & validasi dilakukan di server.
