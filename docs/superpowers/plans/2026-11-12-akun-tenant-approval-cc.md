# Akun tenant/EO dan approval di Command Center: rencana implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Konsol `/pengelola` punya dua jenis akun (tenant/EO yang hanya melihat acaranya sendiri, dan Tim Event Mall yang melihat semua acara), sedangkan keputusan persetujuan acara pindah ke Command Center dengan akun Divisi Event dan akun Operasional Mall, dan alur demonya bisa dijalankan tanpa logout/login manual.

**Architecture:** Satu akun demo per peran (sesi cookie tetap per peran, tanpa ubah format token). Peran baru `tenant`, `divisi-event`, `divisi-ops`. Server menjaga hak tulis lewat `guard()` (tenant hanya acara miliknya, divisi hanya `approval` dan `audit`). Komponen tampilan persetujuan dipindah ke satu file bersama dan dipakai konsol pengelola (ajukan, dokumen, status) dan view baru Command Center (kotak masuk + keputusan). Mode demo menambah tombol "Lanjut sebagai …" yang mengganti akun dalam satu klik.

**Tech Stack:** HTML + vanilla JS IIFE, Node 20 tanpa npm (`server/`), tes `node --test`.

**Spec:** permintaan pengguna 12 Nov 2026 (bagian "Keputusan desain" di bawah) + fitur persetujuan yang sudah ada (`docs/EVENT_TICKETING_Asumsi_Alur_Logika.md`, bagian Persetujuan dan Log aktivitas).

## Keputusan desain

### Akun dan peran

| Peran (cookie) | Akun demo | Portal | Hak |
|---|---|---|---|
| `tenant` | `tenant@example.com`, Sari Wulandari, org **Komunitas UMKM Gedebage** | `/pengelola` | Hanya acara dengan `e.org` = org-nya. Buat, ubah, unggah dokumen, ajukan, publikasikan setelah disetujui. Tidak bisa refund, reset, atau memutuskan persetujuan |
| `pengelola` | `pengelola@example.com`, Tim Event Summarecon Mall Bandung | `/pengelola`, `/checkin` | Semua acara, semua aksi (seperti sekarang) kecuali memutuskan persetujuan di UI |
| `divisi-event` | `divisi.event@example.com`, Andi Firmansyah | `/command-center` | Memutuskan tahap Divisi Event |
| `divisi-ops` | `divisi.ops@example.com`, Rudi Hartono | `/command-center` | Memutuskan tahap Operasional Mall |
| `command-center` | `cc@example.com`, Operator | `/command-center` | Seperti sekarang, persetujuan hanya baca |
| `gate` | `gate@example.com` | `/checkin` | Seperti sekarang |

- **Satu identitas per portal.** Login atau ganti akun menghapus cookie peran lain di portal yang sama (`pengelola`/`tenant`; `command-center`/`divisi-event`/`divisi-ops`). Portal berbeda tetap bisa terbuka bersamaan (mis. gate di ponsel + Command Center di laptop).
- **Semua acara wajib persetujuan**, termasuk acara Tim Event Mall. Keputusan hanya di Command Center. Kotak "Simulasi: Anda bertindak sebagai …" di konsol pengelola dihapus.

### Supaya demo tidak membingungkan

1. **Selalu jelas "saya siapa".** Chip identitas di header kedua portal: ikon + peran + nama/org (mis. "Tenant/EO · Komunitas UMKM Gedebage", "Divisi Event · Andi Firmansyah"). Warna chip sama di semua layar.
2. **Selalu jelas "giliran siapa".** Komponen alur persetujuan yang sama persis di konsol dan Command Center, dengan baris "Giliran: Operasional Mall" di atasnya. Tombol keputusan hanya muncul untuk divisi yang gilirannya; yang lain melihat alasan ("Menunggu Divisi Event").
3. **Pindah peran satu klik (mode demo).** Setelah setiap langkah muncul kartu **Langkah demo berikutnya** dengan tombol "Lanjut sebagai Divisi Event" dan seterusnya, yang login otomatis lalu membuka layar yang tepat (`/command-center/persetujuan?ev=EVT-28`, `/pengelola/e/EVT-28/persetujuan`). Hanya ada saat server memakai password demo (env `STAFF_PASSWORD` kosong).
4. **Lebih sedikit gangguan untuk tenant.** Tenant hanya melihat acaranya (1 acara di demo), tanpa alat demo dan reset.
5. **Kotak masuk di Command Center.** Menu baru **Persetujuan Acara** dengan badge jumlah yang menunggu keputusan akun ini, daftar dikelompokkan "Menunggu keputusan Anda", "Di divisi lain", "Selesai".
6. **Halaman masuk dikelompokkan** sesuai urutan cerita: Penyelenggara acara (1 Tenant/EO, Tim Event Mall), Command Center (2 Divisi Event, 3 Operasional Mall, Operator), Lapangan (Petugas gate). Daftar kartu diambil dari server (satu sumber dengan `ACCOUNTS`).
7. **Pemilih acara dan tombol buat acara di header konsol** (keputusan tim 12 Nov 2026), supaya kursor tidak bolak-balik ke sidebar dan modal di tengah layar:
   - Topbar kiri ke kanan: tombol menu (ponsel), **pemilih acara**, judul halaman, pencarian Ctrl+K, **+ Acara baru**, tema, profil.
   - **Pemilih acara** = tombol berisi plat lantai + nama acara + status (atau "Semua acara"), membuka **dropdown** yang menempel di bawah tombol (bukan modal): kolom cari di atas, baris "Semua acara", lalu daftar acara (`evs()`, jadi tenant hanya melihat acaranya) dengan tanggal dan status. Keyboard: panah atas/bawah, Enter, Esc; klik di luar menutup. Tombol pemilih di sidebar dihapus; sidebar hanya menu.
   - **+ Acara baru** membuka **dropdown panel** menempel di bawah tombol (bukan modal), lebar ±400 px: Nama acara, Area (dropdown ketersediaan), Mulai, Selesai, Format tiket, tombol **Buat draft**. Setelah dibuat langsung ke `/pengelola/e/<id>/pengaturan`. Kategori, tagline, deskripsi, dan poster diisi di Pengaturan. Tombol "Acara baru" lain (header Semua acara, daftar acara) membuka panel yang sama di header.
   - Ponsel (< 768 px): pemilih acara menyusut jadi plat + nama terpotong, dropdown selebar layar di bawah topbar; "+ Acara baru" jadi ikon saja.

### Area acara (dropdown saat membuat dan mengajukan acara)

Sumber: daftar area dari tim (12 Nov 2026) dan foto denah di `BBC2026_IsoIsoWae/01_Riset/dokumentasi/` (ejaan **Cibadak** diputuskan tim, 12 Nov 2026; denah menulis "Cibadag").

| id | Nama | Lantai | Jenis | Cocok untuk | Catatan |
|---|---|---|---|---|---|
| `sawarga` | Sawarga Courtyard | GF | Outdoor | Konser, festival, perayaan besar | Luas ±3.600 m² |
| `downtown` | Downtown Walk | GF | Semi-outdoor | Live music, acara komunitas, hiburan | |
| `parkir-barat` | Parkir Barat | Luar gedung | Outdoor (lahan parkir) | Festival kuliner, karnaval, pameran outdoor | `parking: true`: tampil peringatan kapasitas parkir berkurang |
| `exhibition` | Exhibition Hall A | 2F | Indoor | Pameran produk, bazar, trade expo | |
| `ciunik` | Atrium Ciunik | GF | Indoor | Promosi, aktivasi brand, acara kecil-menengah | |
| `cileutik` | Atrium Cileutik | GF | Indoor | Pameran, bazar, aktivasi produk, komunitas | |
| `cibadak` | Atrium Cibadak | GF | Indoor | Pameran, bazar, aktivasi brand, promosi | |

- Form **Acara baru** dan **Pengaturan** (selama Draft atau Perlu revisi) punya: **Area** (dropdown, dikelompokkan Indoor / Outdoor), **Mulai**, **Selesai** (boleh beberapa hari). Setiap opsi menampilkan ketersediaan untuk tanggal yang dipilih: "Atrium Ciunik, tersedia" atau, nonaktif, "Exhibition Hall A, dipakai Expo UMKM Gedebage Berdaya 24-26 Nov". Daftar diperbarui saat tanggal berubah.
- Di bawah dropdown: kartu info area (lantai, jenis, cocok untuk, luas bila ada). Untuk Parkir Barat: "Memakai lahan parkir. Kapasitas parkir berkurang selama acara, diperiksa Operasional Mall."
- Bentrok = acara lain (bukan Dibatalkan) di area yang sama dengan rentang waktu tumpang tindih. Engine menolak simpan dan ajukan bila bentrok, jadi data tetap konsisten walau form dilewati.
- Area dikunci setelah diajukan. Di Command Center, detail pengajuan menampilkan baris otomatis "Area & jadwal: Exhibition Hall A, 24-26 Nov, tidak bentrok" untuk Divisi Event, dan "Memakai lahan parkir" untuk Operasional Mall bila relevan.
- Format tiket dipisah dari area: pilihan **Format tiket** = "Kursi bernomor, 178 kursi + festival 200", "Kursi bernomor, 112 kursi", atau "Tanpa nomor kursi (kuota)" (templat `TEMPLATES` yang sudah ada + satu templat kuota).
- Data contoh dipetakan ke area baru (sekaligus menyelesaikan NEXT_ACTION P0 no. 1): Main Atrium → Atrium Cibadak, Summarecon Hall → Atrium Ciunik, Outdoor Plaza → Sawarga Courtyard, Exhibition Hall Lt. 1 → Exhibition Hall A, Kids Zone → Atrium Cileutik; EVT-12 Festival Kopi → Downtown Walk; EVT-04 Bazar Kuliner → Parkir Barat (3 hari). Tidak boleh ada bentrok di data contoh.

### Dokumen persyaratan

Daftar umum, untuk demo (bukan formulir resmi mall). Dokumen dibagi menurut divisi yang memeriksanya, sekaligus menjelaskan kenapa ada dua tahap.

| id | Dokumen | Wajib | Diperiksa |
|---|---|---|---|
| `proposal` | Proposal & rundown acara | Ya | Divisi Event |
| `layout` | Denah area & dekorasi | Ya | Divisi Event |
| `legal` | Identitas & legalitas penyelenggara (KTP PIC, NIB/akta) | Ya | Divisi Event |
| `teknis` | Kebutuhan teknis (listrik, sound, bongkar muat) | Ya | Operasional Mall |
| `k3` | Rencana keamanan & K3 | Ya | Operasional Mall |
| `izin` | Surat izin keramaian | Ya | Operasional Mall |
| `khusus` | Izin khusus (pajak hiburan, PIRT, royalti musik) | Tidak | Operasional Mall |

### Skenario demo (data contoh EVT-28)

EVT-28 Expo UMKM Gedebage Berdaya milik tenant, Exhibition Hall A, 3 hari. Riwayat seed: dibuat 6 hari lalu, 6 dokumen wajib diunggah, diajukan 5 hari lalu, **Divisi Event minta revisi** 3 hari lalu ("Denah belum menunjukkan jalur evakuasi dan posisi 80 stan"), tenant mengganti denah kemarin (`Denah_ExhibitionHallA_80stan_v2.pdf`). Status sekarang: Perlu revisi, dokumen lengkap.

| # | Akun | Aksi | Yang terlihat |
|---|---|---|---|
| 1 | Tenant | Buka EVT-28 → Persetujuan → **Ajukan ulang** | Kartu "Lanjut sebagai Divisi Event" |
| 2 | Divisi Event | Kotak masuk (badge 1) → **Setujui** | Kartu "Lanjut sebagai Operasional Mall" |
| 3 | Operasional Mall | **Setujui** | "Selesai dalam 5 hari … sejak pengajuan pertama (2 putaran)", kartu "Kembali ke Tenant" |
| 4 | Tenant | **Publikasikan** | Acara tampil di `/pengunjung`, log 11+ entri, "Log utuh" |

## Sudah selesai di luar rencana (12 Nov 2026)

- Menu **Komunikasi** diganti **Kirim broadcast** (URL tetap `/komunikasi`).
- Palet **Ctrl+K** dirapikan (baris cari tidak menyusut, judul grup, sorotan kata, kaki petunjuk keyboard). Task 5 cukup mengganti sumber daftar acaranya dengan `evs()`.
- **Lihat laporan** / **Lihat gate** menggulir ke panel "Anomali gate & laporan lapangan" di atas halaman Check-in (`#ck-anom`, `ui.focus`).

## Global Constraints

- Tanpa dependensi npm, tanpa CDN, tanpa script `build`/`postinstall`, tanpa `"type": "module"` (`tests/deploy.test.mjs`).
- Teks UI, komentar, dan dokumen dalam Bahasa Indonesia, mengikuti `docs/PANDUAN_Teks_UI.md` (sentence case, tanpa em dash, tanpa tanda seru).
- Setiap perubahan JS/CSS: naikkan `?v=63` → `?v=64` di semua `app/pages/*.html` (sekali per commit yang mengubah JS/CSS, angka berikutnya bila sudah naik).
- Kelas Tailwind baru hanya bila sudah ada di `app/vendor/tailwind.css`; selain itu tulis CSS di `app/css/app.css` memakai token `rgb(var(--…))`.
- Semua perubahan state lewat `tx()` engine. Aksi berisiko memakai `UI.confirm()`.
- State contoh tetap < 350 KB (`tests/engine.test.mjs`). Naikkan `SAMPLE_VER` ke 6.
- Nama orang dan organisasi di data contoh fiktif.

## Review Focus

1. **Browser yang masih punya cookie `pengelola` dan `tenant` sekaligus** (login sebelum fitur ini): server memberi hak gabungan, jadi UI harus memakai identitas yang sama. Aturan: `/api/auth/me` mengembalikan `active['/pengelola']` = peran pertama yang aktif dari `['pengelola', 'tenant']`. Tes di Task 1.
2. **Data lama (SAMPLE_VER 5)** di server/Vercel: EVT-28 masih "menunggu Operasional Mall" dan acara lama tanpa `approval`. Konsol harus tetap jalan dan menyarankan Reset. Tes di Task 3 (acara tanpa `approval` tidak diblok publikasi; tenant tetap melihat EVT-28 karena `org` cocok).
3. **Dua divisi memutuskan bersamaan atau divisi melompati giliran:** server menolak Operasional Mall memutuskan saat tahap Divisi Event belum setuju. Tes guard di Task 2.
4. **Produksi dengan `STAFF_PASSWORD` diisi:** `/api/auth/demo` menolak (403) dan kartu "Lanjut sebagai …" tidak muncul. Tes di Task 1 dan Task 7.
5. **Tenant membuka tautan acara milik org lain** (`/pengelola/e/EVT-01/ringkasan`): tampil seperti acara tidak ada ("Acara tidak ditemukan"), lalu kembali ke Semua acara; tidak ada data org lain di palet Ctrl+K. Dicek di Task 5 dan langkah browser Task 8.

---

### Task 1: Server: peran baru, satu identitas per portal, ganti akun demo

**Files:**
- Modify: `server/config.js` (ROLES, ACCOUNTS, PAGES)
- Modify: `server/auth.js` (ekspor `demo`)
- Modify: `server/app.js` (`/api/auth/me`, `/api/auth/login`, `POST /api/auth/demo`)
- Test: `tests/server.test.mjs`

**Interfaces:**
- Produces:
  - `ROLES[r] = { label, home, portal }`, `portal` ∈ `'/pengelola' | '/command-center' | '/checkin'`. Peran baru: `tenant` (home `/pengelola`), `divisi-event`, `divisi-ops` (home `/command-center/persetujuan`).
  - `ACCOUNTS[i] = { email, role, name, org?, div?, label, icon, text, group, step? }`. `org` hanya tenant (`'Komunitas UMKM Gedebage'`) dan pengelola (`'Tim Event Summarecon Mall Bandung'`); `div` = `'event'` / `'ops'` untuk divisi. `group` ∈ `'Penyelenggara acara' | 'Command Center' | 'Lapangan'`; `step` = nomor urut demo (tenant 1, divisi-event 2, divisi-ops 3).
  - `PAGES['/pengelola'].role = ['pengelola', 'tenant']`, `PAGES['/command-center'].role = ['command-center', 'divisi-event', 'divisi-ops']`.
  - `auth.demo: boolean` = `!env.STAFF_PASSWORD`.
  - `GET /api/auth/me` → `{ ok, server, roles, labels, accounts: { [role]: { name, email, org, div } }, active: { [portal]: role }, demo, demoAccounts?: ACCOUNTS tanpa field rahasia (hanya bila demo) }`.
  - `POST /api/auth/demo { email, next }` → sama dengan respons login sukses; 403 `'Ganti akun demo hanya tersedia saat memakai password demo.'` bila `!auth.demo`; 404 bila email tidak dikenal.
  - Login dan demo mengirim `Set-Cookie` untuk peran itu **ditambah** cookie kosong (`Max-Age=0`) untuk peran lain dengan `portal` yang sama.

- [ ] **Step 1: Tulis tes yang gagal** di `tests/server.test.mjs`:
  - `'login tenant menghapus sesi pengelola (satu identitas per portal)'`: login pengelola lalu tenant dengan cookie jar yang sama → `Set-Cookie` berisi `smicc_pengelola=;` dengan `Max-Age=0`; `GET /api/auth/me` → `active['/pengelola'] === 'tenant'`, `accounts.tenant.org === 'Komunitas UMKM Gedebage'`.
  - `'cookie lama pengelola + tenant: active memakai pengelola'`: kirim kedua cookie valid → `active['/pengelola'] === 'pengelola'`.
  - `'tenant boleh membuka /pengelola, divisi-event boleh /command-center, tenant tidak boleh /command-center'` (200, 200, 302 ke `/masuk`).
  - `'ganti akun demo: tanpa password, hanya mode demo'`: app tanpa `STAFF_PASSWORD` → `POST /api/auth/demo {email:'divisi.ops@example.com', next:'/command-center/persetujuan?ev=EVT-28'}` → 200, `next` sama; app dengan `env.STAFF_PASSWORD='x'` → 403; `me.demo === false` dan tanpa `demoAccounts`.
- [ ] **Step 2: Jalankan** `node --test tests/server.test.mjs` → gagal di 4 tes baru.
- [ ] **Step 3: Implementasi** sesuai Interfaces. Helper di `app.js`: `siblingClears(role) -> string[]` (cookie kosong untuk peran se-portal), dipakai login dan demo; header `Set-Cookie` berupa array.
- [ ] **Step 4: Jalankan** `npm test` → semua lulus.
- [ ] **Step 5: Commit** `feat(auth): akun tenant dan divisi persetujuan, satu identitas per portal, ganti akun demo`.

### Task 2: Guard: hak tulis tenant dan divisi

**Files:**
- Modify: `server/guard.js`, `server/app.js` (teruskan konteks)
- Test: `tests/guard_cases.json`, `tests/guard.test.mjs`

**Interfaces:**
- Consumes: `ACCOUNTS` (Task 1).
- Produces: `guard(old, next, roles, now, ctx)` dengan `ctx = { org: string|null }` (org akun tenant). `app.js` memanggil dengan `{ org: roles.includes('tenant') ? ACCOUNTS.find(a => a.role === 'tenant').org : null }`. `guard.test.mjs` meneruskan `c.ctx` dari kasus.

Aturan baru, diperiksa saat `events`/`order` berubah dan peran bukan `pengelola`:
- **tenant**: setiap acara yang ditambah, diubah, atau dihapus harus ber-`org` = `ctx.org` (sebelum dan sesudah). Tidak boleh mengubah `approval.st` ke `DISETUJUI`/`REVISI`, mengubah `approval.steps[*].st` ke `SETUJU`/`REVISI`, atau mengubah `status` `DRAFT` → `PUBLISHED` bila `old.approval.st !== 'DISETUJUI'`.
- **divisi-event / divisi-ops**: acara hanya boleh berbeda di `approval` dan `audit`. `audit` harus diawali isi lama (hanya ditambah). `approval.docs` tidak berubah. Langkah divisi sendiri: `MENUNGGU` → `SETUJU`/`REVISI`, dan hanya bila semua langkah sebelumnya `SETUJU`. Langkah divisi lain tidak berubah, kecuali `ops` `ANTRE` → `MENUNGGU` saat `event` menjadi `SETUJU`.
- **audit** untuk tenant juga hanya ditambah.
- Pesan penolakan dalam Bahasa Indonesia, mis. `'Acara ini milik penyelenggara lain.'`, `'Keputusan ini giliran Divisi Event.'`.

- [ ] **Step 1: Tulis kasus yang gagal** di `guard_cases.json` (tambahkan field `org` dan `approval`/`audit` pada acara di kasus terkait): tenant ubah acara org sendiri (ok); tenant ubah acara org lain (tolak); tenant tambah acara org sendiri + `order` (ok); tenant publikasi tanpa disetujui (tolak); tenant publikasi setelah `DISETUJUI` (ok); tenant set `approval.st` `DISETUJUI` (tolak); divisi-event setuju saat gilirannya + ops jadi MENUNGGU (ok); divisi-event ubah `name` (tolak); divisi-event hapus entri audit (tolak); divisi-ops setuju saat tahap event masih MENUNGGU (tolak); divisi-ops setuju saat gilirannya (ok); command-center ubah `approval` (tolak).
- [ ] **Step 2: Tulis tes alur nyata** di `guard.test.mjs`: `'guard + engine: tenant ajukan, divisi-event dan divisi-ops memutuskan, tenant publikasi'` memakai `loadEvt()` dan `Evt.setActor` (Task 3) untuk tiap langkah, setiap snapshot lolos `guard` dengan peran yang benar dan ditolak dengan peran yang salah.
- [ ] **Step 3: Jalankan** `node --test tests/guard.test.mjs` → kasus baru gagal.
- [ ] **Step 4: Implementasi** `eventsGuard(old, next, roles, ctx) -> string|null` di `guard.js`, dipanggil menggantikan pemeriksaan `same(old.events, next.events)` untuk peran non-pengelola. `fresh` dan pemeriksaan lain tidak berubah.
- [ ] **Step 5: Jalankan** `npm test` → lulus.
- [ ] **Step 6: Commit** `feat(guard): tenant hanya acara miliknya, divisi hanya keputusan persetujuan gilirannya`.

### Task 3: Engine: pelaku ber-divisi dan ber-org, data contoh revisi

**Files:**
- Modify: `app/js/event/engine.js` (`setActor`, `decide`, `addEvent`, `seedApproval`, `SAMPLE_VER`, ekspor)
- Test: `tests/engine.test.mjs`

**Interfaces:**
- Produces:
  - `Evt.setActor({ name, role, div?, org? })`.
  - `Evt.decide(evId, stepId, approve, note)` menolak `'Akun ini bukan ' + step.name + '.'` bila `actor.div` terisi dan ≠ `stepId`.
  - `Evt.addEvent(info)` mengisi `org = info.org || actor.org || ORG_MALL`.
  - `Evt.ORG_MALL` diekspor.
  - `Evt.turn(e) -> { who: 'penyelenggara'|'event'|'ops'|'publikasi'|null, label: string }` (Giliran: …). `null` untuk acara tanpa `approval` atau sudah terbit.
  - `Evt.DOCS` diganti 7 dokumen di bagian "Dokumen persyaratan" (field baru `by: 'event'|'ops'` = divisi pemeriksa).
  - Seed EVT-28: `org: 'Komunitas UMKM Gedebage'`, `approval.st = 'REVISI'`, `round 1`, `firstAt` 5 hari lalu, 6 dokumen wajib, log: BUAT, DOKUMEN (satu entri "Mengunggah 6 dokumen wajib" agar state tetap kecil), AJUKAN, REVISI (Divisi Event, Andi Firmansyah, catatan denah), DOKUMEN (ganti denah v2).

- [ ] **Step 1: Tulis tes yang gagal**: `'decide: divisi lain ditolak'` (actor `div:'ops'` memutuskan `event` → reject `/bukan Divisi Event/`); `'addEvent memakai org pelaku'` (actor `org:'Komunitas UMKM Gedebage'` → `e.org`); `'turn: giliran berurutan'` (REVISI → penyelenggara, setelah ajukan → event, setelah event setuju → ops, setelah disetujui → publikasi); ubah tes seed: EVT-28 `approval.st === 'REVISI'`, `Evt.missingDocs` kosong, `verifyAudit` utuh; acara tanpa `approval` (EVT-01 setelah `updateEvent` status) tetap bisa dipublikasikan.
- [ ] **Step 2: Jalankan** `node --test tests/engine.test.mjs` → gagal.
- [ ] **Step 3: Implementasi** sesuai Interfaces; `SAMPLE_VER = 6`.
- [ ] **Step 4: Jalankan** `npm test` → lulus, termasuk batas 350 KB.
- [ ] **Step 5: Commit** `feat(engine): pelaku ber-divisi, org acara, giliran persetujuan, contoh EVT-28 perlu revisi`.

### Task 3b: Area acara, ketersediaan, dan data contoh di area nyata

**Files:**
- Modify: `app/js/event/engine.js` (`AREAS`, `areaClash`, `addEvent`, `saveEvent`, `submitApproval`, `seedMore`, `TEMPLATES`)
- Modify: `app/js/event/visitor.js` (konstanta `AREAS` beranda: nama dan lantai baru)
- Modify: `app/js/command-center/data.js`, `app/js/command-center/views/cctv.js`, `tools/docs/sop_data.py` (sebutan "Main Atrium" → "Atrium Cibadak"; regenerate `sop-data.js` dengan `python tools/docs/build_docs.py`)
- Test: `tests/engine.test.mjs`

**Interfaces:**
- Produces:
  - `Evt.AREAS: Array<{ id, name, floor: 'GF'|'2F'|null, kind: 'Indoor'|'Semi-outdoor'|'Outdoor', fit: string, size?: string, parking?: true }>` (isi = tabel "Area acara").
  - `e.area: string` (id), `e.end: number` (ms; default seed `start + 3 jam`), `e.venue` = `'{name}, {floor} · Summarecon Mall Bandung'` (Parkir Barat tanpa lantai) agar `plateOf()` tetap bekerja.
  - `Evt.areaClash(areaId, start, end, exceptId) -> Array<{ id, name, start, end }>` (acara non-CANCELLED, area sama, `a.start < end && start < a.end`).
  - `addEvent({ name, area, start, end, template, ... })`, `saveEvent` (patch `area`/`start`/`end`), dan `submitApproval` gagal dengan `'Area {name} sudah dipakai {acara} pada {tanggal}. Pilih area atau tanggal lain.'` bila bentrok. `saveEvent` menolak ubah `area` saat `approval.st` `DIAJUKAN`/`DISETUJUI`: `'Area dikunci setelah diajukan.'`.
  - `TEMPLATES.KUOTA` baru: tanpa denah kursi, satu jenis tiket kuota.

- [ ] **Step 1: Tulis tes yang gagal**: `'areaClash: tumpang tindih di area sama, acara batal diabaikan'`; `'addEvent ditolak bila area bentrok'` (buat acara di `exhibition` pada rentang EVT-28 → reject `/sudah dipakai Expo UMKM/`); `'area dikunci setelah diajukan'`; `'data contoh: semua acara punya area dari Evt.AREAS dan tidak ada yang bentrok'` (mengganti tes "5 area"); EVT-04 di `parkir-barat` dengan `end - start >= 2 hari`.
- [ ] **Step 2: Jalankan** `node --test tests/engine.test.mjs` → gagal.
- [ ] **Step 3: Implementasi** sesuai Interfaces dan pemetaan data contoh di "Area acara". Geser jam acara contoh bila tes bentrok gagal (jangan ganti area yang sudah dipetakan).
- [ ] **Step 4: Jalankan** `python tools/docs/build_docs.py` lalu `npm test` → lulus, state < 350 KB.
- [ ] **Step 5: Commit** `feat(event): area acara sesuai denah, cek bentrok jadwal per area`.

### Task 4: Komponen persetujuan bersama

**Files:**
- Create: `app/js/event/approval-ui.js`
- Modify: `app/js/event/admin.js` (hapus `apSteps`, `apDocs`, `auditTable`, `ACT`, `fsize`, kotak keputusan; pakai `EvtApproval`)
- Modify: `app/pages/pengelola.html`, `app/pages/command-center.html` (tag script setelah `engine.js`)
- Modify: `app/css/app.css` (gaya `.pg-ap*`, `.pg-docs`, `.pg-log`, `.pg-q`, `.pg-hash` dipindah ke awalan netral `.ap-*` agar jalan di Command Center)

**Interfaces:**
- Consumes: `Evt.turn`, `Evt.verifyAudit`, `Evt.DOCS`, `Evt.APPROVERS`, `Evt.AP_ST`, `Evt.missingDocs`, `Evt.durTxt`.
- Produces `window.EvtApproval`:
  - `turnBar(e) -> html` (chip "Giliran: …" + status).
  - `steps(e) -> html` (alur + total waktu).
  - `docs(e, { editable }) -> html`; `bindDocs(root, evId, act)`.
  - `log(e) -> html` (tabel, kartu bertumpuk < 640 px); `integrity(e) -> html`; `csv(evId)`.
  - `decideBox(e, div) -> html` (kosong bila bukan giliran `div`); `bindDecide(root, evId, div, act)`.
  - `areaLine(e) -> html`: "Area & jadwal: {area}, {tanggal}, tidak bentrok" atau daftar bentrok (pakai `Evt.areaClash`), ditambah "Memakai lahan parkir" bila `parking`.
  - `docs` menampilkan label divisi pemeriksa tiap dokumen (`DOCS[i].by`).
  - `ACT` (label + kelas chip aksi log).

- [ ] **Step 1: Pindahkan** fungsi dari `admin.js` ke `approval-ui.js` tanpa mengubah perilaku, lalu `admin.js` memanggil `EvtApproval.*`. Konsol pengelola tidak lagi merender `decideBox`; saat `DIAJUKAN` tampil "Menunggu Divisi Event di Command Center".
- [ ] **Step 2: Jalankan** `npm test` → lulus (`deploy.test` memeriksa `?v=` pada tag baru).
- [ ] **Step 3: Cek browser** `npm run dev` → `/pengelola/e/EVT-28/persetujuan` tampil sama seperti sebelumnya, tanpa error konsol.
- [ ] **Step 4: Commit** `refactor(event): komponen persetujuan bersama untuk konsol dan Command Center`.

### Task 5: Konsol pengelola: tenant vs Tim Event Mall

**Files:**
- Modify: `app/js/event/admin.js`
- Modify: `app/pages/pengelola.html` (`data-logout="pengelola tenant"`, wadah chip identitas)
- Modify: `app/css/app.css` (`.id-chip`)

**Interfaces:**
- Consumes: `/api/auth/me` (`active['/pengelola']`, `accounts`), `Evt.setActor`, `Evt.ORG_MALL`.
- Produces di `admin.js`: `who()` → `'tenant' | 'pengelola' | 'mall'`; `evs()` → daftar acara yang terlihat (tenant: `e.org === acct.org`; lainnya semua); `can(action)` untuk `'refund' | 'reset' | 'demo' | 'delete' | 'cancel' | 'publish'`.

- [ ] **Step 1: Ganti** semua `Evt.s.order.map(Evt.ev)` dan `Evt.s.order.filter(...)` di jalur pengelola (dasbor, daftar acara, palet Ctrl+K, laporan PDF semua acara, transaksi, check-in, keuangan, pemilih acara, `normalize`, `fromUrl`) dengan `evs()`. Acara di luar `evs()` diperlakukan seperti tidak ada.
- [ ] **Step 2: Sembunyikan** untuk tenant: alat demo dan reset di palet, tombol refund, "Batalkan acara" bila ada pesanan lunas (tampil keterangan "Hubungi Tim Event Mall untuk membatalkan acara yang sudah ada transaksinya").
- [ ] **Step 2b: Area di form.** Buat `areaOptions(start, end, sel, exceptId)` dan `areaInfo(id)` (dipakai ulang panel Acara baru di Task 5b), lalu pasang di **Pengaturan** (Draft/Perlu revisi): field `area` (`<select>` dengan `<optgroup>` Indoor / Outdoor dari `Evt.AREAS`), `start`, `end`, dan `template` (Format tiket). Saat tanggal atau area berubah, label opsi diperbarui dari `Evt.areaClash` ("tersedia" atau, `disabled`, "dipakai {acara} {tanggal}") dan kartu info area di bawahnya diganti (lantai, jenis, cocok untuk, luas, peringatan parkir). Setelah diajukan, field area tampil hanya baca dengan keterangan "Area dikunci setelah diajukan". Cek browser: pilih Exhibition Hall A pada 24 Nov → opsi nonaktif dengan nama Expo UMKM; pilih Parkir Barat → peringatan parkir tampil.
- [ ] **Step 3: Chip identitas** di topbar: tenant "Tenant/EO · {org}", pengelola "Tim Event Mall · {name}". `Evt.setActor` memakai `{ name, role: 'Tenant/EO' | 'Tim Event Mall', org }`.
- [ ] **Step 4: Cek browser** sebagai tenant: dasbor, daftar acara (1 acara), Ctrl+K, tautan langsung `/pengelola/e/EVT-01/ringkasan` (toast "tidak ditemukan", kembali ke dasbor); sebagai pengelola: semua 28 acara.
- [ ] **Step 5: `npm test`** → lulus. **Commit** `feat(pengelola): akun tenant hanya melihat acaranya, chip identitas`.

### Task 5b: Header konsol: pemilih acara dan + Acara baru sebagai dropdown

**Files:**
- Modify: `app/pages/pengelola.html` (wadah `#pg-evpick` dan `#pg-new` di `.pg-top`)
- Modify: `app/js/event/admin.js` (hapus `pickModal` dan tombol `[data-pick]` di `sideHtml()`; ganti `newEventModal()` dengan panel; semua `[data-new-ev]` membuka panel header)
- Modify: `app/css/app.css` (`.pg-dd`, `.pg-dd-panel`, posisi absolut di bawah tombol, lebar penuh < 768 px)

**Interfaces:**
- Consumes: `evs()`, `can()` (Task 5), `Evt.AREAS`, `Evt.areaClash`, field area dari Task 5 Step 2b (fungsi pembuat opsi dipakai ulang, mis. `areaOptions(start, end, sel, exceptId) -> html` dan `areaInfo(id) -> html`).
- Produces di `admin.js`: `dropdown(btn, html, onBind) -> { close }` (satu helper untuk kedua panel: posisi di bawah tombol, tutup dengan Esc / klik luar / pindah rute, fokus kembali ke tombol, hanya satu dropdown terbuka); `evPicker()` dan `newEventPanel()` memakai helper itu.

- [ ] **Step 1: Implementasi** helper `dropdown` dan `evPicker` (cari, "Semua acara", daftar; panah atas/bawah + Enter; tombol menampilkan acara aktif dan diperbarui oleh `shell()`).
- [ ] **Step 2: Implementasi** `newEventPanel`: field Nama, Area, Mulai, Selesai, Format tiket, tombol Buat draft (memanggil `Evt.addEvent` lewat `act`, error bentrok tampil di panel), lalu `Router.go('/e/<id>/pengaturan')`. Hapus `newEventModal`.
- [ ] **Step 3: Cek browser** desktop dan 390 px: pemilih terbuka di bawah tombol, cari "expo" menyaring, Esc menutup, tenant hanya melihat EVT-28; panel Acara baru: pilih Exhibition Hall A 24 Nov → opsi nonaktif, Buat draft membuka Pengaturan acara baru; tidak ada gulir horizontal; tidak ada error konsol.
- [ ] **Step 4: `npm test`** → lulus. **Commit** `feat(pengelola): pemilih acara dan buat acara sebagai dropdown di header`.

### Task 6: Command Center: menu Persetujuan Acara

**Files:**
- Create: `app/js/command-center/views/approval.js` (`window.Views.persetujuan`)
- Modify: `app/js/command-center/app.js` (`NAV` grup Operasional: `['persetujuan', 'Persetujuan Acara', 'approval', 'APR']`, hitung badge `APR`)
- Modify: `app/pages/command-center.html` (tag script view, chip identitas, `data-logout="command-center divisi-event divisi-ops"`)

**Interfaces:**
- Consumes: `EvtApproval` (Task 4), `Evt.turn` (Task 3), `/api/auth/me`.
- Produces: rute `/command-center/persetujuan?ev=<id>`. Badge `APR` = jumlah acara dengan `turn(e).who === div` akun ini (operator: semua yang `DIAJUKAN`).

Tata letak: kiri daftar tiga kelompok ("Menunggu keputusan Anda", "Di divisi lain", "Selesai 7 hari terakhir"), tiap baris: nama acara, org, area, lama menunggu (tanda bila > 2 hari). Kanan detail: ringkasan acara (jadwal, area, kapasitas tiket, perkiraan pengunjung), `areaLine`, `turnBar`, `steps`, `docs` (hanya baca), `decideBox` untuk divisi yang gilirannya, `log`. Operator: semua hanya baca dengan keterangan "Keputusan oleh akun Divisi Event dan Operasional Mall".

- [ ] **Step 1: Implementasi** view dan NAV. Setelah keputusan: `UI.toast` dan render ulang; `Evt.setActor({ name, role: 'Divisi Event'|'Operasional Mall', div })`.
- [ ] **Step 2: Cek browser** sebagai divisi-event (badge 1 setelah tenant mengajukan), divisi-ops (badge 0 sebelum Divisi Event setuju, 1 sesudahnya), operator (hanya baca). Ponsel 390 px tanpa gulir horizontal.
- [ ] **Step 3: `npm test`** → lulus. **Commit** `feat(command-center): kotak masuk Persetujuan Acara untuk Divisi Event dan Operasional Mall`.

### Task 7: Alur demo: ganti akun satu klik dan halaman masuk berkelompok

**Files:**
- Modify: `app/js/core/auth.js` (`SMAuth.switchTo`, menu "Ganti akun demo")
- Modify: `app/js/event/approval-ui.js` (`nextStepCard(e, me)`)
- Modify: `app/pages/masuk.html` (kartu dari `me.demoAccounts`, dikelompokkan `group`, nomor `step`)
- Test: `tests/server.test.mjs` (masuk.html tidak lagi menyimpan daftar akun sendiri)

**Interfaces:**
- Consumes: `POST /api/auth/demo`, `me.demo`, `me.demoAccounts` (Task 1), `Evt.turn` (Task 3).
- Produces: `SMAuth.switchTo(email, next) -> Promise<void>` (POST lalu `location.assign(next)`, pesan error via `UI.toast` bila gagal); `EvtApproval.nextStepCard(e, me) -> html` (kosong bila `!me.demo`). Pemetaan giliran → akun dan tujuan:

| `turn(e).who` | Tombol | Tujuan |
|---|---|---|
| `event` | Lanjut sebagai Divisi Event | `/command-center/persetujuan?ev=ID` |
| `ops` | Lanjut sebagai Operasional Mall | `/command-center/persetujuan?ev=ID` |
| `penyelenggara`, `publikasi` | Kembali ke {Tenant/EO atau Tim Event Mall, sesuai `e.org`} | `/pengelola/e/ID/persetujuan` |

Kartu tidak muncul bila giliran = akun yang sedang aktif.

- [ ] **Step 1: Tulis tes yang gagal** `'halaman masuk memakai daftar akun dari server'`: `app/pages/masuk.html` tidak mengandung `@example.com`.
- [ ] **Step 2: Implementasi** `switchTo`, `nextStepCard` (dipasang di konsol tab Persetujuan dan detail Command Center), menu profil/topbar "Ganti akun demo" berisi `demoAccounts` dikelompokkan, dan `masuk.html` yang merender dari `me.demoAccounts` (bila tidak ada: hanya formulir).
- [ ] **Step 3: `npm test`** → lulus.
- [ ] **Step 4: Cek browser** dengan `STAFF_PASSWORD` kosong (kartu ada) dan `STAFF_PASSWORD=x` (kartu dan menu tidak ada, halaman masuk tanpa kartu demo).
- [ ] **Step 5: Commit** `feat(demo): ganti akun satu klik di setiap langkah persetujuan, halaman masuk berkelompok`.

### Task 8: Dokumen, cache, dan uji alur demo penuh

**Files:**
- Modify: `app/pages/*.html` (versi `?v=` terbaru), `CLAUDE.md` (peran baru, versi `?v=`, view persetujuan), `README.md` (tabel akun), `docs/fitur.md`, `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md`, `BBC2026_IsoIsoWae/03_Prototype/USERFLOW.md` (peran tenant, approval di Command Center, skenario demo), `BBC2026_IsoIsoWae/03_Prototype/README.md` (alur demo), `BBC2026_IsoIsoWae/03_Prototype/NEXT_ACTION.md` (8b diperbarui)

- [ ] **Step 1: Perbarui** dokumen di atas; hapus kalimat "satu akun pengelola bertindak sebagai kedua divisi" di semua dokumen. Di NEXT_ACTION centang P0 no. 1 (nama area) dan tulis bahwa no. 7 (acara di lahan parkir) baru sampai peringatan, belum mengurangi angka di dashboard Parkir.
- [ ] **Step 2: Jalankan** `npm test` → lulus.
- [ ] **Step 3: Uji browser penuh** (`node server.js 8799 127.0.0.1 --dev`, Reset data): skenario demo langkah 1 sampai 4 hanya dengan tombol "Lanjut sebagai …", lalu cek `/pengunjung/e/EVT-28` tampil, log "Log utuh", Review Focus 1 sampai 5, layar 390 px tanpa gulir horizontal, tanpa error konsol. Hapus `data/event_state.json` hasil uji.
- [ ] **Step 4: Commit** `docs: akun tenant, approval di Command Center, skenario demo`.
