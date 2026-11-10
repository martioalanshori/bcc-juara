# Design guidelines: Papan Petunjuk

Panduan visual SMICC-TS versi baru. Fokus pertama: landing page pengunjung. Token warna, tipografi,
spacing, dan komponen berlaku juga untuk pengelola, check-in, dan Command Center. Kebutuhan produk ada di
[PRD.md](PRD.md).

## 1. Konsep

**Subjek:** satu mal, bukan marketplace nasional. Semua acara terjadi di gedung yang sama, di lantai dan
area yang bisa ditunjuk.

**Pengguna:** warga Bandung yang membuka ponsel untuk tahu "ada apa di Summarecon Mall minggu ini",
banyak di antaranya keluarga dengan anak dan anak muda (konser, esports, komedi).

**Tugas utama halaman:** dari "ada acara apa?" sampai "beli tiket" dalam sekali gulir.

**Bahasa visual:** papan petunjuk mal (wayfinding). Plat lantai `GF` `L1` `L2` `L3`, kode warna per
area, huruf condensed seperti papan arah, dan papan direktori lift lobby. Ini yang membedakan portal ini
dari Artatix, LOKET, dan GOERS: mereka menjual acara di banyak kota, kita menunjukkan jalan ke satu
gedung.

**Satu elemen yang diingat:** papan direktori area (bagian 6, blok G), panel gelap berisi daftar lantai
seperti di depan lift, dengan jumlah acara per area. Elemen lain tenang dan disiplin.

### Yang diambil dari tiga referensi

| Referensi | Diambil | Diubah untuk mal |
|---|---|---|
| Artatix | Hero carousel dengan slide tetangga mengintip, kartu acara dengan penyelenggara, mosaik "Laris Manis", ikon kategori, footer gelap | "Temukan event di kotamu" (kartu kota) diganti papan direktori area mal |
| LOKET | Daftar agenda bertanggal (Event2Go), banner ajakan untuk penyelenggara, artikel editorial | Agenda menjadi "Minggu ini di mal" dengan plat tanggal. Editorial menjadi promo tenant untuk pemegang tiket |
| GOERS | Header mobile (bahasa, Jelajah + badge Baru, profil), chip filter di atas daftar, deretan penyelenggara | Chip filter memakai konteks mal: Hari ini, Akhir pekan, Gratis, Untuk anak, Kursi bernomor |

Tidak diambil: ulasan pengguna GOERS (tidak ada data asli, ulasan karangan tidak boleh), bilah utilitas
atas Artatix, LOKET Screen.

## 2. Warna & latar

Setiap warna punya satu peran. Semua pasangan teks di bawah sudah diukur dan lolos minimal **4,5:1**
(WCAG AA). Garis komponen interaktif minimal 3:1 terhadap latarnya.

### Warna inti

| Token | Hex | Peran |
|---|---|---|
| `ink` | `#14213D` | Teks utama, latar papan direktori, footer, plat lantai |
| `primary` | `#1E55D0` | Tombol utama, tautan, status terpilih. Biru papan arah |
| `primary-hover` | `#1844AA` | Hover/pressed tombol utama |
| `primary-soft` | `#E8EFFC` | Latar chip terpilih, sorotan baris |
| `signal` | `#FFC72C` | Kuning papan petunjuk. Hanya sebagai **latar** dengan teks `ink`: badge Baru, sorotan baris direktori, penanda "Laku keras". Tidak pernah sebagai warna teks di latar putih |
| `surface` | `#FFFFFF` | Latar halaman dan kartu |
| `surface-2` | `#F2F4F8` | Latar bagian berselang, kolom cari, tombol header bulat |
| `line` | `#D8DDE6` | Garis kartu dan pemisah (dekoratif) |
| `line-strong` | `#7A8496` | Garis input dan checkbox (komponen interaktif, 3,77:1) |
| `text-muted` | `#586174` | Teks sekunder: tanggal, lokasi, keterangan |
| `on-ink-muted` | `#B7C0D1` | Teks sekunder di atas `ink` |

### Warna status

| Token | Teks | Latar | Dipakai untuk |
|---|---|---|---|
| `success` | `#137A48` | `#E6F4EC` | Tersedia, lunas, check-in VALID |
| `warning` | `#8F5A00` | `#FFF4D6` | Sisa sedikit, sedang dipesan, menunggu bayar |
| `danger` | `#C0293A` | `#FDECEE` | Habis, gagal, error input, TIDAK VALID |

### Kode warna area

Hanya untuk plat area dan garis kiri di papan direktori. Teks putih di atasnya.

| Area | Lantai | Hex |
|---|---|---|
| Main Atrium | GF | `#0B6A86` |
| Outdoor Plaza | GF | `#157A4F` |
| Exhibition Hall | L1 | `#B4520F` |
| Kids Zone | L2 | `#C02670` |
| Summarecon Hall | L3 | `#6D3FC0` |

### Kontras yang sudah diukur

| Pasangan | Rasio |
|---|---|
| `ink` di `surface` / `surface-2` | 15,97 / 14,51 |
| `text-muted` di `surface` / `surface-2` | 6,22 / 5,65 |
| putih di `primary` / `primary-hover` | 6,43 / 8,58 |
| `primary` di `primary-soft` | 5,57 |
| `ink` di `signal` | 10,24 |
| putih / `signal` / `on-ink-muted` di `ink` | 15,97 / 10,24 / 8,73 |
| teks status di latar status (success / warning / danger) | 4,74 / 5,28 / 5,09 |
| putih di warna area (atrium, plaza, expo, kids, hall) | 6,14 / 5,35 / 5,05 / 5,60 / 6,73 |

Aturan latar: halaman putih. `surface-2` dipakai untuk memisahkan bagian, bukan gradien. Satu-satunya
blok gelap di tengah halaman adalah papan direktori, ditambah footer. Foto acara selalu diberi lapisan
gelap di bawah teks yang menimpanya.

Mode gelap tidak dipakai di portal pengunjung (selalu terang, seperti sekarang). Konsol pengelola dan
Command Center memakai turunan gelap dari token yang sama.

## 3. Tipografi

Satu keluarga huruf: **Inter** untuk semua teks, judul, dan angka (diganti dari Barlow pada 11 Nov 2026 atas
permintaan pemilik produk). File font disimpan lokal di `app/vendor/fonts/` (`tools/vendor_fonts.py`).

### Skala tetap

Ukuran mengikuti skala klasik (12, 14, 16, 18, 24, 36, 48). Line-height selalu kelipatan 4 px.

| Token | Font | Ukuran / line-height | Berat | Dipakai untuk |
|---|---|---|---|---|
| `display` | Inter | 48/52 (mobile 36/40) | 700 | Judul acara di hero |
| `title-lg` | Inter | 36/40 (mobile 28/32) | 700 | Judul halaman, judul detail acara |
| `title` | Inter | 24/28 | 700 | Judul bagian landing |
| `heading` | Inter | 18/24 | 600 | Judul kartu besar, judul modal |
| `body` | Inter | 16/24 | 400 | Paragraf, deskripsi acara |
| `body-sm` | Inter | 14/20 | 400 | Meta kartu, keterangan |
| `label` | Inter | 14/20 | 600 | Tombol, chip, label input |
| `caption` | Inter | 12/16 | 500 | Badge, plat kecil, teks bantuan |
| `numeral` | Inter | ikut konteks | 600-700 | Harga, tanggal, nomor lantai, hitung mundur. Pakai `tabular-nums` |

Aturan:
- Teks rata kiri. Rata tengah hanya untuk keadaan kosong dan hasil check-in.
- Panjang baris paragraf maksimal 68 karakter (`max-width: 68ch`).
- Sentence case di semua judul dan tombol. Tidak ada huruf kapital semua, tidak ada label kecil
  berhuruf kapital di atas judul.
- Judul tidak menyorot satu kata dengan warna atau gaya berbeda.
- Kekuatan tipografi ada di Inter tebal yang besar: tanggal di plat agenda, harga, dan
  angka lantai.

## 4. Spacing, radius, elevasi

### Spacing (kelipatan 4)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

| Konteks | Nilai |
|---|---|
| Gutter halaman | 16 (mobile), 24 (desktop) |
| Lebar konten maksimal | 1200 landing, 576 alur beli |
| Jarak antarbagian landing | 48 (mobile), 64 (desktop) |
| Judul bagian ke isinya | 16 |
| Padding kartu | 12 (mobile), 16 (desktop) |
| Jarak antar kartu di grid | 12 (mobile), 16 (desktop) |
| Target sentuh minimal | 44 × 44 |

### Radius (berjenjang menurut ukuran, bukan satu nilai untuk semua)

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `r-plate` | 4 | Plat lantai, badge, plat tanggal. Tegas seperti rambu |
| `r-control` | 8 | Tombol, input, menu |
| `r-card` | 12 | Kartu acara, kartu tiket, modal |
| `r-feature` | 20 | Hero, papan direktori, banner penyelenggara |
| `r-pill` | 999 | Chip filter, tombol header bulat |

### Elevasi

Kartu **tidak** memakai bayangan. Batasnya garis `line` 1 px. Bayangan hanya untuk benda yang
mengambang di atas konten: header saat digulir, menu bahasa, bilah keranjang bawah, modal, toast.

| Token | Nilai |
|---|---|
| `shadow-float` | `0 8px 24px -8px rgb(20 33 61 / .25)` |

## 5. Komponen dan state-nya

Setiap komponen interaktif punya fokus keyboard yang terlihat: cincin 2 px `primary` dengan jarak
2 px dari tepi (`outline: 2px solid; outline-offset: 2px`). Durasi transisi 150 ms, dan dimatikan saat
`prefers-reduced-motion`.

### Tombol

Tinggi 44 (default) atau 36 (kecil, hanya di desktop). Label `label`, ikon 18 px di kiri.

| Varian | Default | Hover | Pressed | Disabled | Loading |
|---|---|---|---|---|---|
| Utama | latar `primary`, teks putih | latar `primary-hover` | latar `primary-hover`, turun 1 px | latar `#ECEFF4`, teks `#8A93A3`, kursor default | label tetap, spinner menggantikan ikon, tidak bisa diklik |
| Sekunder | garis `line-strong`, teks `ink` | latar `surface-2` | latar `line` | garis `line`, teks `#8A93A3` | seperti utama |
| Bahaya | latar `danger`, teks putih | gelap 10% | gelap 15% | seperti utama | seperti utama |
| Teks | teks `primary`, tanpa latar | garis bawah | teks `primary-hover` | teks `#8A93A3` | - |

Teks tombol menyebut hasilnya ("Beli tiket", "Tahan kursi", "Bayar Rp455.000"), tanpa panah.

### Input

Tinggi 44, latar putih, garis 1 px `line-strong`, radius 8, label di atas (`label`), teks bantuan di
bawah (`caption`, `text-muted`).

| State | Tampilan |
|---|---|
| Default | garis `line-strong` |
| Hover | garis `ink` |
| Fokus | garis 2 px `primary` + cincin fokus |
| Error | garis 2 px `danger`, ikon `error` di kanan, pesan `danger` menggantikan teks bantuan: apa yang salah dan cara memperbaikinya ("Nomor WhatsApp minimal 9 angka.") |
| Disabled | latar `surface-2`, teks `#8A93A3`, garis `line` |
| Read-only | latar `surface-2`, teks `ink`, tanpa garis |

Kolom cari header: latar `surface-2` tanpa garis, menjadi putih + garis `primary` saat fokus.

### Kartu acara

```
┌──────────────────────────────┐
│  [foto 16:9]                 │
│  ┌────────┐                  │  badge kategori kiri atas (caption, latar ink 70%)
│  │ Konser │                  │
├──────────────────────────────┤
│ Judul acara dua baris paling │  heading 16/24 600, maks 2 baris
│ banyak lalu terpotong        │
│ 📅 Sab, 15 Nov · 19.00 WIB   │  body-sm text-muted
│ [GF] Main Atrium             │  plat lantai + nama area
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  garis putus-putus (sobekan tiket)
│ Mulai dari       [Sisa 12]   │
│ Rp150.000                    │  numeral 20/24 primary
└──────────────────────────────┘
```

| State | Tampilan |
|---|---|
| Default | garis `line` |
| Hover (pointer) | garis `primary`. Tidak naik, tidak berbayang |
| Fokus | cincin fokus di seluruh kartu |
| Sisa sedikit (< 30%) | badge `warning` "Sisa 12 tiket" |
| Habis | foto grayscale 60%, badge `danger` "Habis terjual", harga diganti "Daftar tunggu" |
| Belum dibuka | badge netral "Dibuka 20 Nov" |
| Sudah lewat | tidak ditampilkan di landing |

### Plat lantai (komponen khas)

Kotak 24 × 24 (kecil) atau 32 × 32 (direktori), radius 4, latar `ink`, teks putih Inter
700. Diikuti nama area. Di papan direktori, plat diberi garis kiri 4 px warna area.

```
[GF] Main Atrium      [L3] Summarecon Hall
```

### Plat tanggal (agenda)

Kotak 56 × 64, radius 4, garis `line`. Bulan `caption` `text-muted` di atas, tanggal Inter
700 28/32 `ink`. Hari ini: latar `signal`, teks `ink`.

### Chip filter

Tinggi 36, radius pill, `label`.

| State | Tampilan |
|---|---|
| Default | latar putih, garis `line-strong`, teks `ink` |
| Hover | latar `surface-2` |
| Terpilih | latar `primary-soft`, garis `primary`, teks `primary`, ikon centang |
| Disabled (0 hasil) | teks `#8A93A3`, garis `line` |

### Badge

Tinggi 20, radius 4, `caption` 600. Varian: `success`, `warning`, `danger`, netral (`surface-2` +
`ink`), sinyal (`signal` + `ink`, hanya "Baru" dan "Laku keras").

### Kursi (denah)

| Status | Tampilan |
|---|---|
| Tersedia | latar warna kategori, nomor putih |
| Pilihanmu | latar `ink`, centang putih, garis 2 px `signal` |
| Sedang dipesan | arsir diagonal `warning`, tanpa nomor |
| Terjual | latar `#ECEFF4`, tanda × `#8A93A3` |
| Tidak dijual | garis putus-putus `line-strong`, kosong |
| Kategori lain | opacity 35%, tidak bisa diketuk |

Status tidak hanya dibedakan dengan warna: ada nomor, centang, arsir, atau tanda ×.

### Lainnya

- **Toast**: latar putih, garis kiri 4 px warna status, `shadow-float`, muncul di bawah header, hilang
  setelah 4 detik, bisa ditutup.
- **Bilah keranjang bawah**: putih, `shadow-float`, berisi sisa waktu tahan (numeral, `warning`), total,
  dan tombol "Lanjut".
- **Keadaan kosong**: satu kalimat apa yang terjadi + satu tombol tindakan ("Belum ada acara di akhir
  pekan ini. Lihat 7 hari ke depan").
- **Skeleton**: blok `surface-2` sesuai bentuk kartu, tanpa animasi kilau saat reduced motion.

## 6. Landing page pengunjung

Urutan bagian (blok tanpa data tidak ditampilkan):

| Blok | Isi | Asal |
|---|---|---|
| A. Header | Logo, cari, bahasa, Jelajah (mobile), Kerjasama dengan kami, Masuk | GOERS + yang sudah ada |
| B. Hero | Carousel acara unggulan, slide tetangga mengintip | Artatix |
| C. Filter cepat + Acara di mal | Chip: Semua, Hari ini, Akhir pekan, Gratis, Untuk anak, Kursi bernomor. Grid 8 kartu + "Lihat semua acara" | GOERS + Artatix |
| D. Minggu ini di mal | Daftar agenda dengan plat tanggal | LOKET Event2Go |
| E. Laku keras | Mosaik 1 besar + 2 tinggi | Artatix Laris Manis |
| F. Kategori | Ikon kategori + jumlah acara | Artatix |
| G. **Papan direktori area** | Panel `ink`, satu baris per area diurutkan dari lantai atas ke bawah | Pengganti "kotamu" |
| H. Promo tenant untuk pemegang tiket | 4 kartu promo | LOKET editorial |
| I. Untuk penyelenggara | Banner + deretan logo penyelenggara + tombol "Ajukan acara" | LOKET + GOERS |
| J. Panduan pengunjung | 4 akordeon: parkir, masuk acara, refund, fasilitas | yang sudah ada |
| K. Footer | `ink`, tautan, metode pembayaran (simulasi), alamat & jam buka | Artatix |

### Mobile (375)

```
┌─────────────────────────────┐
│ [▣] Summarecon  (🇮🇩▾)(Jelajah)(👤) │ A  baris 1
│ [ Cari acara, kategori...  🔍]│    baris 2
├─────────────────────────────┤
│ ┌───────────────────────┐┌─ │ B  slide 88% + tetangga mengintip
│ │  foto + judul display ││  │
│ │  [Beli tiket]         ││  │
│ └───────────────────────┘└─ │
│          ● ○ ○ ○            │
│ (Semua)(Hari ini)(Akhir pe→ │ C  chip bergulir horizontal
│ ┌──────────┐┌──────────┐    │    grid 2 kolom mulai 480px, 1 kolom di bawahnya
│ │ kartu    ││ kartu    │    │
│ └──────────┘└──────────┘    │
│ Minggu ini di mal           │ D
│ [15│Nov] Judul acara   Rp…  │
│ [16│Nov] Judul acara   Rp…  │
│ ...                         │
│ ┌─ Direktori area ────────┐ │ G  panel ink, radius 20
│ │▌[L3] Summarecon Hall  3 │ │
│ │▌[L2] Kids Zone        2 │ │
│ │▌[L1] Exhibition Hall  1 │ │
│ │▌[GF] Main Atrium      4 │ │
│ │▌[GF] Outdoor Plaza    2 │ │
│ └─────────────────────────┘ │
│ ...                         │
├─────────────────────────────┤
│ (Acara)(Tiket saya)(Kotak masuk) │ bilah bawah tetap
└─────────────────────────────┘
```

### Desktop (1280, konten 1200)

```
┌──────────────────────────────────────────────────────────────┐
│ [▣] Summarecon Mall Bandung  [ Cari ............ 🔍]  (🇮🇩▾) [Kerjasama dengan kami] [Masuk] │
├──────────────────────────────────────────────────────────────┤
│ ░┌──────────────────────────────────────────────────┐░        │ B  slide 1000px, tetangga
│ ░│ foto + judul display kiri bawah    [Beli tiket]  │░        │    di kiri-kanan dipudarkan
│ ░└──────────────────────────────────────────────────┘░        │
│ Acara di Summarecon Mall          (Semua)(Hari ini)(Gratis)… │ C  chip sejajar judul
│ [kartu][kartu][kartu][kartu]                                 │    grid 4 kolom
│ [kartu][kartu][kartu][kartu]                                 │
│ Minggu ini di mal                 ┃ Laku keras               │ D + E berdampingan
│ [15 Nov] ……                       ┃ ┌──────────┐┌───┐┌───┐   │ (7 : 5)
│ [16 Nov] ……                       ┃ │  besar   ││   ││   │   │
│ ┌─ Direktori area ─────────────────────────────────────────┐ │ G  dua kolom: daftar lantai
│ │ ▌[L3] Summarecon Hall  Auditorium kursi bernomor   3 acara│ │   kiri, foto area terpilih
│ │ ▌[L2] Kids Zone ...                      │  [foto area]  │ │   kanan
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

Papan direktori: baris diurutkan dari L3 ke GF seperti di lift. Hover/fokus pada baris memberi sorotan
`signal` di garis kiri dan mengganti foto area di kanan (desktop). Klik membuka hasil saring area itu.

## 7. Ikon, foto, gerak

- **Ikon**: Material Symbols Rounded, satu ketebalan (400), ukuran 16/18/20/24. Ikon kategori di dalam
  lingkaran `primary-soft` 48 px, warna `primary`.
- **Foto**: rasio 16:9 untuk kartu, 21:9 untuk hero desktop, 4:3 untuk hero mobile. Lapisan gelap
  `linear-gradient(to top, rgb(20 33 61 / .75), transparent 60%)` di bawah teks. `alt` kosong bila
  foto dekoratif, judul acara bila foto menjadi satu-satunya penanda.
- **Gerak**: hanya satu gerak otomatis, yaitu hero bergeser tiap 2,5 detik tanpa tombol jeda (berhenti
  sementara saat disentuh, diarahkan, difokus, atau tab tersembunyi; reduced motion: pindah tanpa animasi
  geser; ada titik navigasi). Logo tenant berjalan dengan tombol
  Jeda. Selain itu, gerak hanya sebagai jawaban aksi: kursi berubah status, menu terbuka, toast muncul.
  Tidak ada animasi muncul per bagian saat digulir.

## 8. Aksesibilitas (batas minimal)

- Kontras sesuai bagian 2. Target sentuh 44 × 44.
- Semua aksi bisa dijangkau keyboard dengan urutan logis, fokus terlihat.
- Carousel: titik navigasi bisa difokus, `aria-roledescription="carousel"`.
- Status (sisa waktu, hasil check-in) diumumkan dengan `aria-live="polite"`.
- `lang` di `<html>` ikut bahasa aktif.
- Layout utuh di 320 px tanpa gulir horizontal halaman.

## 9. Yang tidak dilakukan

- Bayangan abu-abu yang sama di bawah setiap kartu.
- Gradien sebagai hiasan latar bagian.
- Label huruf kapital kecil di atas judul (versi lama punya satu di blok penyelenggara, dihapus).
- Penomoran 01/02/03 untuk konten yang bukan urutan. Langkah beli boleh bernomor karena memang urutan.
- Kuning `signal` sebagai warna teks, atau lebih dari satu sorotan kuning di satu layar.
- Ulasan, rating, atau jumlah "orang akan datang" yang dikarang.
