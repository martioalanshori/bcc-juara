/* Demo berjalan Command Center: tiap 2 detik ada perubahan, hanya di halaman yang sedang dibuka bila halaman itu salah satu
 * dari LIVE_ROUTES (Tiket & Insiden, Fasilitas & BMS, Layanan Tenant & SLA, CCTV & Keamanan, Energi & Utilitas).
 * Tiket baru masuk di urutan teratas, tiket lama bergerak (diakui, tim dikirim, tiba, selesai, ditutup), sebagian
 * tertahan dengan catatan lapangan, dan tenant sesekali mengirim pesan. Semua lewat Store, jadi tercatat di log
 * dan dashboard lain ikut berubah. Jeda: Store.setting('live', false), saat simulasi use case, atau saat operator mengetik.
 * Kalimat ditulis seperti catatan petugas: pendek, konkret, tanpa istilah promosi. */
(function () {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const MIN_ACTIVE = 8, MAX_ACTIVE = 14, MAX_TICKETS = 60;
  const TICK_MS = 2000, LIVE_ROUTES = ['ticketing', 'bms', 'tenant', 'cctv', 'energy'];
  // Tanpa shell (tes Node) perilakunya sama dengan halaman Tiket & Insiden.
  const route = () => (window.Shell && Shell.current ? Shell.current.route || '' : 'ticketing');

  // Kejadian yang bisa muncul. Prioritas P2 sampai P4 saja: P1 memicu eskalasi otomatis ke GM dan Owner.
  const NEW = [
    { title: 'Lampu koridor 2F berkedip', desc: 'Tiga titik downlight di depan Gramedia nyala mati sejak 10 menit lalu.', priority: 'P4', category: 'Fasilitas MEP, AC & Plumbing', zone: '2F', location: 'Koridor 2F depan Gramedia', source: 'Patroli Regu Bravo', sop: 'SOP-BMS-05', team: 'MEP Alpha' },
    { title: 'Wastafel toilet pria LG mampet', desc: 'Air menggenang di dua wastafel. Pengunjung lapor lewat QR di pintu toilet.', priority: 'P4', category: 'Kebersihan & Sanitasi', zone: 'LG', location: 'Toilet pria LG dekat Hypermart', source: 'QR Feedback', sop: 'SOP-VIS-03', team: 'Janitorial Crew' },
    { title: 'Suhu food court naik ke 26,8°C', desc: 'Jam makan siang, AHU-3F-02 jalan 100% tapi suhu ruang tetap naik.', priority: 'P3', category: 'Fasilitas MEP, AC & Plumbing', zone: '3F', location: '3F Food Court sisi timur', source: 'Sensor IoT #BMS-AHU-3F02', sop: 'SOP-BMS-01', cam: 'CAM-08', team: 'MEP Bravo' },
    { title: 'Mobil mogok di ramp keluar B2', desc: 'Sedan putih mati mesin di tengah ramp, antrean keluar mulai panjang.', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', location: 'Ramp keluar B2 ke Gate G4', source: 'Smart Cam ANPR-07', sop: 'SOP-PRK-02', cam: 'CAM-42', team: 'Tim Parkir' },
    { title: 'Pengunjung pingsan di depan Uniqlo', desc: 'Ibu sekitar 50 tahun, sadar tapi lemas. Keluarga ada di lokasi.', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: '1F', location: '1F depan Uniqlo (1F-E01)', source: 'Info Desk 1F', sop: 'SOP-SEC-09', cam: 'CAM-14', team: 'ERT Alpha' },
    { title: 'Mesin EDC kasir Sephora tidak bisa transaksi', desc: 'Dua mesin EDC gagal koneksi, antrean kasir 9 orang.', priority: 'P3', category: 'Tenant Fit-Out & Kasir IT', zone: 'GF', location: 'Unit GF-42 Sephora', source: 'Tenant App', sop: 'SOP-COM-05', tenant: 'GF-42', team: 'Tenant Relation' },
    { title: 'Kerumunan antre promo di Atrium Ciunik', desc: 'Antrean promo minuman melebar ke jalur evakuasi, sekitar 120 orang.', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: 'GF', location: 'Atrium Ciunik', source: 'AI Crowd CAM-01', sop: 'SOP-SEC-03', cam: 'CAM-01', team: 'Regu Bravo' },
    { title: 'Tumpahan saus di eskalator E-02', desc: 'Pijakan eskalator licin. Eskalator dihentikan sementara oleh petugas.', priority: 'P3', category: 'Kebersihan & Sanitasi', zone: '1F', location: 'Eskalator E-02 1F ke 2F', source: 'CS Roaming 04', sop: 'SOP-SEC-07', cam: 'CAM-29', team: 'Janitorial Crew' },
    { title: 'Charger EV-03 berhenti di tengah pengisian', desc: 'Pemilik mobil komplain, layar charger menampilkan kode E-17.', priority: 'P4', category: 'Energi & Utilitas', zone: 'BASEMENT', location: 'B1 EV Charging Bay', source: 'Aplikasi EV', sop: 'SOP-PRK-05', team: 'MEP Alpha' },
    { title: 'Bau gas di dapur Haidilao', desc: 'Kru dapur cium bau gas dekat kompor 4. Kompor sudah dimatikan.', priority: 'P2', category: 'Fasilitas MEP, AC & Plumbing', zone: '3F', location: 'Dapur unit L3-22', source: 'Tenant: Haidilao (telepon)', sop: 'SOP-SEC-04', tenant: 'L3-22', cam: 'CAM-08', team: 'ERT Alpha' },
    { title: 'Anak menangis mencari orang tua di Timezone', desc: 'Anak laki-laki sekitar 6 tahun, baju merah. Sudah diamankan staf Timezone.', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: '3F', location: '3F Timezone (3F-10)', source: 'Staf Timezone', sop: 'SOP-SEC-09', tenant: '3F-10', cam: 'CAM-71', team: 'Regu Bravo' },
    { title: 'Gate parkir P2 tidak baca kartu e-money', desc: 'Reader gate masuk P2 gagal baca, pengendara harus mundur.', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', location: 'Gate Masuk P2 Selatan', source: 'ANPR Queue Alert', sop: 'SOP-PRK-01', cam: 'CAM-61', team: 'Tim Parkir' },
    { title: 'Tempat sampah food court penuh', desc: 'Empat tempat sampah di sisi barat sudah meluap, banyak pengunjung makan.', priority: 'P4', category: 'Kebersihan & Sanitasi', zone: '3F', location: '3F Food Court sisi barat', source: 'CCTV CAM-08', sop: 'SOP-SEC-07', cam: 'CAM-08', team: 'Janitorial Crew' },
    { title: 'Pintu kaca otomatis lobi utara macet terbuka', desc: 'Sensor pintu tidak merespons, udara AC keluar terus.', priority: 'P4', category: 'Fasilitas MEP, AC & Plumbing', zone: 'GF', location: 'Lobi utara GF', source: 'Patroli Regu Alpha', sop: 'SOP-BMS-05', cam: 'CAM-01', team: 'MEP Alpha' },
    { title: 'Tenant minta izin bongkar muat di luar jam', desc: 'Batik Keris minta masuk loading dock pukul 21.30 untuk stok koleksi baru.', priority: 'P4', category: 'Tenant Fit-Out & Kasir IT', zone: '2F', location: 'Dock B2 / unit 2F-18', source: 'Tenant App', sop: 'SOP-COM-06', tenant: '2F-18', team: 'Tenant Relation' },
    { title: 'Konsumsi listrik Chiller-02 naik 18%', desc: 'kW/TR naik ke 0,71 dalam 30 menit terakhir tanpa kenaikan beban.', priority: 'P3', category: 'Energi & Utilitas', zone: 'BASEMENT', location: 'Central Chiller Plant B2', source: 'AI Energy Anomaly', sop: 'SOP-BMS-01', team: 'MEP Bravo' },
    { title: 'Pengamen masuk area Downtown Walk', desc: 'Dua orang mengamen dan meminta uang ke pengunjung kafe.', priority: 'P4', category: 'Keamanan, Parkir & Crowd', zone: 'GF', location: 'Downtown Walk', source: 'Tenant: Starbucks Reserve', sop: 'SOP-SEC-03', tenant: 'GF-12', team: 'Regu Alpha' },
    { title: 'Atap bocor saat hujan di Sawarga Courtyard', desc: 'Air menetes di dua titik dekat panggung, lantai licin.', priority: 'P3', category: 'Fasilitas MEP, AC & Plumbing', zone: 'ROOF', location: 'Sawarga Courtyard', source: 'Patroli Regu Alpha', sop: 'SOP-BMS-02', team: 'MEP Alpha' },
    // Skenario tambahan (total 50) agar antrean tidak itu-itu saja.
    { title: 'Lift L-03 berhenti di antara lantai', desc: 'Lift penumpang berhenti antara GF dan 1F, ada 4 penumpang di dalam. Interkom aktif.', priority: 'P2', category: 'Fasilitas MEP, AC & Plumbing', zone: 'GF', location: 'Lift penumpang L-03 East Mall', source: 'Alarm lift L-03', sop: 'SOP-BMS-05', team: 'MEP Bravo' },
    { title: 'Kebocoran pipa di plafon toilet 2F', desc: 'Air menetes dari plafon di dua bilik, ember darurat sudah dipasang.', priority: 'P3', category: 'Fasilitas MEP, AC & Plumbing', zone: '2F', location: 'Toilet wanita 2F dekat Gramedia', source: 'CS Roaming 02', sop: 'SOP-BMS-02', team: 'MEP Alpha' },
    { title: 'AC studio 4 bioskop tidak dingin', desc: 'Penonton studio 4 mengeluh panas, suhu ruang 27°C saat film berjalan.', priority: 'P3', category: 'Fasilitas MEP, AC & Plumbing', zone: '3F', location: 'Cinema XXI studio 4', source: 'Tenant: Cinema XXI (telepon)', sop: 'SOP-BMS-01', tenant: 'L3-01', team: 'MEP Bravo' },
    { title: 'Genset uji mingguan gagal start', desc: 'Uji beban genset GEN-02 gagal di percobaan kedua, baterai starter diduga lemah.', priority: 'P3', category: 'Energi & Utilitas', zone: 'BASEMENT', location: 'Ruang genset B2', source: 'BMS genset GEN-02', sop: 'SOP-BMS-03', team: 'MEP Alpha' },
    { title: 'Panel listrik kios Chatime trip', desc: 'MCB kios turun dua kali dalam 10 menit, mesin pendingin minuman mati.', priority: 'P3', category: 'Energi & Utilitas', zone: 'LG', location: 'Kios Chatime LG-18', source: 'Tenant: Chatime (WhatsApp)', sop: 'SOP-COM-05', tenant: 'LG-18', team: 'MEP Bravo' },
    { title: 'Antrean gate parkir masuk 12 mobil', desc: 'Antrean di Gate P1 mengular sampai bahu jalan, satu reader lambat.', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', location: 'Gate Masuk P1 Utara', source: 'ANPR Queue Alert', sop: 'SOP-PRK-01', team: 'Tim Parkir' },
    { title: 'Mobil parkir di jalur pemadam', desc: 'SUV hitam berhenti di fire lane lobi timur, pengemudi tidak di tempat.', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: 'GF', location: 'Fire lane lobi timur', source: 'Smart Cam ANPR-07', sop: 'SOP-PRK-02', team: 'Tim Parkir' },
    { title: 'Taksi online menumpuk di lobi drop-off', desc: 'Sebelas mobil menunggu penumpang di jalur drop-off, kendaraan lain tertahan.', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: 'GF', location: 'Lobi drop-off utama', source: 'CCTV CAM-05', sop: 'SOP-PRK-03', team: 'Tim Parkir' },
    { title: 'Shuttle parkir overflow terlambat', desc: 'Pengunjung menunggu shuttle Parkir Barat lebih dari 20 menit.', priority: 'P4', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', location: 'Halte shuttle Parkir Barat', source: 'Laporan pengunjung', sop: 'SOP-PRK-05', team: 'Tim Parkir' },
    { title: 'Pengunjung jatuh di tangga darurat 1F', desc: 'Bapak sekitar 60 tahun terpeleset, mengeluh nyeri pergelangan kaki.', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: '1F', location: 'Tangga darurat T-3 1F', source: 'Info Desk 1F', sop: 'SOP-SEC-10', team: 'ERT Alpha' },
    { title: 'Asap tipis dari exhaust dapur food court', desc: 'Detektor asap SD-3F-07 aktif, asap dari hood dapur unit 3F-07.', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: '3F', location: 'Food court 3F unit 3F-07', source: 'Detektor asap SD-3F-07', sop: 'SOP-SEC-01', team: 'ERT Alpha' },
    { title: 'Orang tak dikenal masuk ruang server', desc: 'Pintu ruang server dibuka dengan kartu kontraktor yang sudah kedaluwarsa.', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', location: 'Ruang server B1', source: 'Access control ACS-B1', sop: 'SOP-SEC-04', team: 'Regu Alpha' },
    { title: 'Tas ransel ditinggal di musala LG', desc: 'Ransel abu-abu di rak sepatu musala, tidak ada pemilik lebih dari 15 menit.', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: 'LG', location: 'Musala LG', source: 'AI Video CAM-14', sop: 'SOP-SEC-03', team: 'Regu Charlie' },
    { title: 'Dugaan pencopetan di depan Sogo', desc: 'Pengunjung lapor dompet hilang, pelaku diduga dua orang berjaket hitam.', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: 'LG', location: 'Pintu masuk Sogo LG-01', source: 'Pengunjung ke satpam', sop: 'SOP-SEC-05', tenant: 'LG-01', team: 'Regu Bravo' },
    { title: 'Remaja bermain skateboard di atrium', desc: 'Tiga remaja bermain skateboard di antara pengunjung.', priority: 'P4', category: 'Keamanan, Parkir & Crowd', zone: 'GF', location: 'Atrium Cibadag', source: 'Patroli Regu Alpha', sop: 'SOP-SEC-06', team: 'Regu Alpha' },
    { title: 'Pos patroli 2F terlewat dua putaran', desc: 'Checkpoint 2F-C4 tidak dipindai sejak pukul 13.00.', priority: 'P4', category: 'Keamanan, Parkir & Crowd', zone: '2F', location: 'Checkpoint patroli 2F-C4', source: 'Guard tour system', sop: 'SOP-SEC-06', team: 'Regu Bravo' },
    { title: 'Pintu darurat 1F terbuka, alarm berbunyi', desc: 'Pintu D-1F-04 terganjal kardus dari arah gudang tenant.', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: '1F', location: 'Pintu darurat D-1F-04', source: 'Sensor pintu BMS', sop: 'SOP-SEC-06', team: 'Regu Bravo' },
    { title: 'Toilet pria 3F bau menyengat', desc: 'Sensor NH3 menunjukkan 32 ppm, di atas ambang 25 ppm.', priority: 'P4', category: 'Kebersihan & Sanitasi', zone: '3F', location: 'Toilet pria 3F dekat Timezone', source: 'Sensor NH3 toilet 3F', sop: 'SOP-SEC-07', team: 'Janitorial Crew' },
    { title: 'Muntahan di lantai area anak 2F', desc: 'Anak muntah di dekat perosotan, area perlu disterilkan.', priority: 'P3', category: 'Kebersihan & Sanitasi', zone: '2F', location: 'Kids zone 2F', source: 'CS Roaming 03', sop: 'SOP-SEC-07', team: 'Janitorial Crew' },
    { title: 'Sabun cair habis di toilet LG', desc: 'Tiga dispenser sabun kosong, keluhan masuk lewat QR.', priority: 'P4', category: 'Kebersihan & Sanitasi', zone: 'LG', location: 'Toilet wanita LG', source: 'QR Feedback', sop: 'SOP-VIS-03', team: 'Janitorial Crew' },
    { title: 'Pecahan kaca di depan Gadget Hub', desc: 'Etalase kecil jatuh, serpihan kaca di koridor depan toko.', priority: 'P3', category: 'Kebersihan & Sanitasi', zone: '2F', location: 'Koridor depan unit 2F-31', source: 'Tenant App', sop: 'SOP-COM-05', tenant: '2F-31', team: 'Janitorial Crew' },
    { title: 'Genangan air hujan di ramp masuk B1', desc: 'Air hujan masuk dari ramp, lantai licin sepanjang 10 meter.', priority: 'P3', category: 'Kebersihan & Sanitasi', zone: 'BASEMENT', location: 'Ramp masuk B1', source: 'CCTV parkir B1', sop: 'SOP-BMS-02', team: 'Janitorial Crew' },
    { title: 'Kasir Hypermart offline', desc: 'Enam kasir tidak bisa terhubung ke server POS, antrean panjang.', priority: 'P2', category: 'Tenant Fit-Out & Kasir IT', zone: 'LG', location: 'Kasir 1-6 Hypermart LG-02', source: 'Tenant: Hypermart (telepon)', sop: 'SOP-COM-05', tenant: 'LG-02', team: 'Tenant Relation' },
    { title: 'Pekerjaan fit-out lewat jam izin', desc: 'Kontraktor masih mengebor di unit 1F-E12 pukul 10.30, sudah jam buka.', priority: 'P4', category: 'Tenant Fit-Out & Kasir IT', zone: '1F', location: 'Unit 1F-E12 (fit-out)', source: 'Patroli Regu Charlie', sop: 'SOP-COM-02', team: 'Tenant Relation' },
    { title: 'Musik toko terlalu keras', desc: 'Tenant sebelah mengeluh volume musik Zara di atas 85 dB.', priority: 'P4', category: 'Tenant Fit-Out & Kasir IT', zone: 'GF', location: 'Zara Flagship GF-104', source: 'Tenant sebelah (WhatsApp)', sop: 'SOP-COM-05', tenant: 'GF-104', team: 'Tenant Relation' },
    { title: 'Sky Garden minta tambahan daya acara', desc: 'Lounge meminta daya sementara 20 kVA untuk live music malam ini.', priority: 'P4', category: 'Energi & Utilitas', zone: 'ROOF', location: 'Sky Garden Lounge', source: 'Tenant App', sop: 'SOP-COM-06', tenant: 'ROOF-01', team: 'Tenant Relation' },
    { title: 'Beban puncak WBP mendekati batas kontrak', desc: 'Beban 15,9 MW, 3% di bawah batas kontrak PLN pada jam WBP.', priority: 'P3', category: 'Energi & Utilitas', zone: 'BASEMENT', location: 'Gardu induk B1', source: 'AI Energy Anomaly', sop: 'SOP-BMS-04', team: 'MEP Alpha' },
    { title: 'Lampu fasad sisi barat padam', desc: 'Satu segmen LED fasad mati, terlihat dari jalan raya.', priority: 'P4', category: 'Energi & Utilitas', zone: 'ROOF', location: 'Fasad barat', source: 'Patroli malam', sop: 'SOP-BMS-04', team: 'MEP Bravo' },
    { title: 'Kualitas efluen STP melewati ambang', desc: 'COD efluen 118 mg/L, di atas baku mutu 100 mg/L.', priority: 'P3', category: 'Fasilitas MEP, AC & Plumbing', zone: 'BASEMENT', location: 'STP/IPAL B2', source: 'Sensor kualitas air', sop: 'SOP-BMS-07', team: 'MEP Alpha' },
    { title: 'Eskalator E-07 berbunyi kasar', desc: 'Getaran naik ke 2,1 mm/s, bunyi gesekan di sisi kanan.', priority: 'P3', category: 'Fasilitas MEP, AC & Plumbing', zone: '2F', location: 'Eskalator E-07 2F ke 3F', source: 'Predictive maintenance', sop: 'SOP-BMS-06', team: 'MEP Bravo' },
    { title: 'Antrean Timezone meluber ke koridor', desc: 'Antrean turnamen sekitar 80 orang menutup separuh koridor 3F.', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: '3F', location: 'Koridor 3F depan Timezone', source: 'AI Crowd 3F', sop: 'SOP-VIS-01', tenant: '3F-10', team: 'Regu Charlie' },
    { title: 'Video keluhan parkir ramai di media sosial', desc: 'Video antrean keluar parkir ditonton 40 ribu kali dalam dua jam.', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', location: 'Media sosial', source: 'Social listening', sop: 'SOP-VIS-04', team: 'Tim Parkir' },
  ];

  // Catatan lapangan per keahlian tim. {t} = nama tim.
  const NOTE = {
    ACKNOWLEDGED: {
      MEP: ['Laporan dicek lewat CCTV, kejadian benar.', 'Diterima operator, cari tim terdekat.', 'Pelapor dihubungi balik, lokasi sudah jelas.'],
      Tenant: ['Permintaan diterima, diteruskan ke building manager.', 'Diterima. Tenant diminta lengkapi detail lewat Tenant App.'],
    },
    DISPATCHED: ['{t} jalan ke lokasi, perkiraan 4 menit.', '{t} dipanggil lewat radio, langsung berangkat.', '{t} dikirim, bawa peralatan cadangan.'],
    'ON-SITE': {
      MEP: ['Teknisi sampai. Sumber masalah ketemu, mulai perbaikan.', 'Teknisi sampai dan cek panel. Butuh ganti satu komponen.'],
      Security: ['Regu sampai, area sudah diamankan.', 'Regu di lokasi, jalur pengunjung diatur ulang.'],
      ERT: ['ERT sampai, pertolongan pertama diberikan.', 'ERT di lokasi, area disterilkan 5 meter.'],
      Housekeeping: ['Petugas sampai, rambu lantai basah dipasang.', 'Petugas mulai bersihkan area.'],
      Parkir: ['Petugas buka gate manual sementara.', 'Petugas atur lalu lintas, antrean mulai jalan.'],
      Tenant: ['Tenant Relation sudah bicara dengan manajer toko.', 'Tenant Relation cek dokumen yang diajukan.'],
    },
    RESOLVED: {
      MEP: ['Perbaikan selesai, sistem normal lagi. Foto sesudah diunggah.', 'Komponen diganti, sudah dites 10 menit tanpa gangguan.'],
      Security: ['Situasi kembali normal, regu kembali patroli.', 'Urusan selesai, kronologi dicatat di laporan shift.'],
      ERT: ['Kondisi stabil, diserahkan ke keluarga.', 'Area aman, ERT kembali siaga.'],
      Housekeeping: ['Area sudah bersih dan kering, rambu dilepas.', 'Selesai dibersihkan, stok perlengkapan diisi ulang.'],
      Parkir: ['Gate normal lagi, antrean sudah habis.', 'Kendaraan sudah dipindah, jalur kembali lancar.'],
      Tenant: ['Permintaan disetujui, tenant sudah dikabari.', 'Masalah tenant beres, manajer toko konfirmasi lewat WhatsApp.'],
    },
    CLOSED: ['Dicek ulang lewat CCTV, aman. Tiket ditutup.', 'Pelapor konfirmasi sudah beres. Tiket ditutup, survei kepuasan dikirim.', 'Supervisor verifikasi di lokasi, tiket ditutup.'],
  };
  // Catatan saat tiket tertahan (status tidak berubah).
  const HOLD = {
    MEP: ['Menunggu suku cadang dari gudang B2, perkiraan 20 menit.', 'Perlu matikan aliran sebentar, koordinasi dengan tenant sekitar.'],
    Security: ['Masih menunggu pemilik datang, area tetap dijaga.', 'Regu tambahan diminta untuk bantu atur kerumunan.'],
    ERT: ['Ambulans dihubungi untuk jaga-jaga.'],
    Housekeeping: ['Butuh mesin wet vac kedua, sedang diambil.'],
    Parkir: ['Derek internal sedang dipanggil.'],
    Tenant: ['Menunggu jawaban building manager.', 'Tenant belum kirim foto pendukung, sudah diminta ulang.'],
  };
  const CHATS = [
    { from: 'Tika Ananda (Chatime LG)', ch: 'WhatsApp API', tenant: 'LG-18', text: 'Siang Command Center, listrik di kios kami turun sebentar tadi. Sekarang sudah nyala, cuma mau lapor saja.' },
    { from: 'Nadia Putri (Sephora GF)', ch: 'Tenant App', tenant: 'GF-42', text: 'Terima kasih, mesin EDC sudah normal lagi.' },
    { from: 'Andre Kusuma (Timezone 3F)', ch: 'Tenant App', tenant: '3F-10', text: 'Sabtu ini ada turnamen, kemungkinan ramai mulai jam 14.00. Mohon bantuan security di depan toko.' },
    { from: 'Lia Hartono (Starbucks Reserve GF)', ch: 'WhatsApp API', tenant: 'GF-12', text: 'Pengamen di Downtown Walk sudah pergi, terima kasih cepat responsnya.' },
    { from: 'Rian Wicaksono (Haidilao 3F)', ch: 'Telepon', tenant: 'L3-22', text: 'Teknisi gas sudah cek, selang regulator kami ganti. Dapur jalan lagi.' },
  ];

  const T = () => window.SEED.TEAMS;
  const skillOf = (t) => (t.team === 'Tenant Relation' ? 'Tenant' : ((T().find((x) => x.name === t.team) || {}).skill || 'MEP'));
  const fill = (s, t) => s.replace('{t}', t.team || 'Tim');
  const isOpen = (t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED';

  function paused() {
    const S = Store.s, a = document.activeElement;
    if (S.settings && S.settings.live === false) return true;
    if (S.sim) return true;
    if (!LIVE_ROUTES.includes(route())) return true; // halaman lain tidak berubah sendiri
    if (document.hidden) return true;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName || '')) return true; // operator sedang mengetik: jangan rerender
    if (document.querySelector && document.querySelector('#modal-root .modal, #modal-root [role="dialog"]')) return true;
    return false;
  }

  // Skenario dibagikan seperti kartu: semua NEW keluar sekali dalam urutan acak sebelum dikocok ulang. Judul yang
  // masih terbuka atau muncul di 25 tiket terakhir dilewati, jadi antrean tidak itu-itu saja.
  let deck = [];
  function nextScenario() {
    const recent = new Set(Store.s.tickets.filter(isOpen).map((t) => t.title).concat(Store.s.tickets.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 25).map((t) => t.title)));
    for (let tries = 0; tries < 2; tries++) {
      if (!deck.length) deck = NEW.map((_, i) => i).sort(() => Math.random() - 0.5);
      const k = deck.findIndex((i) => !recent.has(NEW[i].title));
      if (k >= 0) return NEW[deck.splice(k, 1)[0]];
      deck = [];
    }
    return pick(NEW);
  }
  function create() {
    const n = Object.assign({ cam: '', tenant: '', by: 'SYSTEM' }, nextScenario());
    const t = Store.createTicket(n);
    return { kind: 'baru', id: t.id, t };
  }

  function advance() {
    // Tiket lama lebih mungkin bergerak. Tiket yang sudah RESOLVED ikut, untuk ditutup.
    const pool = Store.s.tickets.filter((t) => t.status !== 'CLOSED');
    if (!pool.length) return create();
    const now = Date.now();
    const w = pool.map((t) => 1 + Math.min(30, (now - t.createdAt) / 60000));
    let r = Math.random() * w.reduce((a, b) => a + b, 0), t = pool[0];
    for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) { t = pool[i]; break; } }
    const i = Store.STATUSES.indexOf(t.status), next = Store.STATUSES[i + 1];
    if (!next) return { kind: 'catat', id: t.id };
    const sk = skillOf(t), lib = NOTE[next];
    const text = fill(pick(Array.isArray(lib) ? lib : lib[sk] || lib.MEP), t);
    const who = next === 'ACKNOWLEDGED' || next === 'CLOSED' ? 'CCO' : next === 'DISPATCHED' ? 'CCO' : t.team;
    Store.updateTicket(t.id, { status: next }, text, who);
    return { kind: 'maju', id: t.id, status: next };
  }

  function hold() {
    const pool = Store.s.tickets.filter((t) => t.status === 'ON-SITE' || t.status === 'DISPATCHED');
    if (!pool.length) return advance();
    const t = pick(pool);
    Store.updateTicket(t.id, {}, pick(HOLD[skillOf(t)] || HOLD.MEP), t.team);
    return { kind: 'catat', id: t.id };
  }

  let lastChat = null;
  function chat() {
    const c = pick(CHATS.filter((x) => x !== lastChat)); lastChat = c; // jangan pesan yang sama dua kali berturut-turut
    Store.chat(Object.assign({}, c));
    return { kind: 'chat', c };
  }

  function prune() {
    const L = Store.s.tickets;
    while (L.length > MAX_TICKETS) {
      let k = -1;
      for (let i = L.length - 1; i >= 0; i--) if (L[i].status === 'CLOSED') { k = i; break; }
      if (k < 0) break;
      L.splice(k, 1);
    }
    if (Store.s.chats.length > 40) Store.s.chats.splice(0, Store.s.chats.length - 40);
  }

  // Pengejar waktu: data CC tersimpan per browser, jadi saat tab ditutup atau demo dijeda tiket terbuka terus menua
  // sampai "Terlambat berjam-jam". Tiket terbuka yang lewat SLA lebih dari LATE_MAX menit dianggap ditangani selama
  // operator tidak melihat, dibagi (angka dari ID tiket, sama di setiap muat ulang) supaya tetap terlihat campuran:
  // - sekitar separuh ditutup: 70% selesai dalam SLA, 30% selesai terlambat;
  // - paling banyak KEEP_LATE tetap terbuka dan lewat SLA 3 sampai 20 menit;
  // - sisanya tetap terbuka dan masih berjalan dalam SLA (20% sampai 75% waktu SLA terpakai).
  const LATE_MAX = 25, KEEP_LATE = 2, MIN = 60000;
  const h = (id, k) => { let x = 2166136261 ^ k; for (const c of String(id)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } x ^= x >>> 13; x = Math.imul(x, 0x5bd1e995); x ^= x >>> 15; return (x >>> 0) / 4294967296; };
  // Geser semua waktu tiket (dibuat, log) supaya umurnya sama dengan `age` ms; urutan log tetap.
  function retime(t, age) { const d = Date.now() - age - t.createdAt; t.createdAt += d; t.log.forEach((l) => { l.ts = Math.min(Date.now(), l.ts + d); }); }
  function tidy() {
    const now = Date.now(), stale = [];
    Store.s.tickets.filter(isOpen).forEach((t) => { const si = Store.slaInfo(t); if (si.breached && -si.remain > LATE_MAX * MIN) stale.push(t); });
    if (!stale.length) return 0;
    let lateOpen = Store.s.tickets.filter(isOpen).filter((t) => Store.slaInfo(t).breached && stale.indexOf(t) < 0).length;
    stale.forEach((t) => {
      const dur = (Store.SLA[t.priority] || Store.SLA.P4).resolve * MIN, r = h(t.id, 1);
      if (r < 0.5) { // ditutup
        const onTime = h(t.id, 2) < 0.7;
        const at = Math.min(now - MIN, t.createdAt + dur * (onTime ? 0.45 + h(t.id, 3) * 0.45 : 1.08 + h(t.id, 3) * 0.4));
        const lib = NOTE.RESOLVED;
        if (STATUS_IDX(t) < 4) t.log.push({ ts: at - MIN, who: t.team || 'Tim', text: fill(pick(lib[skillOf(t)] || lib.MEP), t) });
        t.log.push({ ts: at, who: 'CCO', text: pick(NOTE.CLOSED) });
        t.status = 'CLOSED'; t.resolvedAt = at;
      } else if (lateOpen < KEEP_LATE) { retime(t, dur + (3 + h(t.id, 4) * 17) * MIN); lateOpen++; } // terbuka, lewat SLA sedikit
      else retime(t, dur * (0.2 + h(t.id, 5) * 0.55)); // terbuka, masih dalam SLA
    });
    Store.commit('ticket');
    return stale.length;
  }
  const STATUS_IDX = (t) => Store.STATUSES.indexOf(t.status);

  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
  const drift = (v, step, lo, hi, d) => round(clamp(v + rnd(-step, step), lo, hi), d);

  // Tiket & Insiden: tiket bergerak lebih sering daripada tiket baru (tiap 2 detik tiket baru akan membanjiri antrean).
  function ticketStep() {
    const act = Store.s.tickets.filter(isOpen).length, r = Math.random();
    if (act < MIN_ACTIVE) return create();
    if (act > MAX_ACTIVE) return advance();
    return r < 0.14 ? create() : r < 0.8 ? advance() : r < 0.95 ? hold() : chat();
  }
  // Layanan Tenant & SLA: pesan tenant masuk dan tiket tenant bergerak.
  function tenantStep() {
    const pool = Store.s.tickets.filter((t) => t.tenant && t.status !== 'CLOSED');
    const r = Math.random();
    if (r < 0.45 || !pool.length) return chat();
    const t = pick(pool), i = Store.STATUSES.indexOf(t.status), next = Store.STATUSES[i + 1];
    if (!next || r > 0.85) { Store.updateTicket(t.id, {}, pick(HOLD.Tenant), 'Tenant Relation'); return { kind: 'catat', id: t.id }; }
    const lib = NOTE[next]; Store.updateTicket(t.id, { status: next }, fill(pick(Array.isArray(lib) ? lib : lib.Tenant || lib.MEP), t), next === 'ACKNOWLEDGED' || next === 'CLOSED' ? 'CCO' : 'Tenant Relation');
    return { kind: 'maju', id: t.id, status: next };
  }
  // Fasilitas & BMS: telemetri chiller/AHU bergeser sedikit, sesekali catatan otomasi BMS.
  const BMS_LOG = ['VAV food court menaikkan aliran udara 6% karena CO2 naik.', 'Reset suhu supply chilled water ke 6,8°C mengikuti beban.', 'Pompa sekunder P-2 berpindah ke VFD 46 Hz.', 'AHU-2F-01 masuk mode ekonomis, damper udara luar 30%.', 'Cooling tower CT-2 menambah putaran kipas 8%.'];
  function bmsStep() {
    Object.values(Store.s.devices).forEach((d) => {
      if (d.status !== 'RUNNING' || !d.sup) return;
      d.sup = drift(d.sup, 0.15, 5.8, 8.2, 1); d.ret = drift(d.ret, 0.2, d.sup + 4.5, d.sup + 6.5, 1);
      if (d.flow) d.flow = Math.round(drift(d.flow, 25, d.flow * 0.9, d.flow * 1.1, 0));
      if (d.load) d.load = Math.round(drift(d.load, 2, 40, 98, 0));
      if (d.kwtr) d.kwtr = drift(d.kwtr, 0.008, 0.52, 0.7, 3);
    });
    if (Math.random() < 0.18) Store.addEvent({ from: 'BMS', to: 'ANL', code: 'EVT-BMS-AUTO', title: 'Otomasi BMS', detail: pick(BMS_LOG), sev: 'P4', quiet: true });
    Store.commit('device'); return { kind: 'telemetri' };
  }
  // CCTV & Keamanan: latensi, kamera aktif, arus orang bergeser; peringatan kamera AI sesekali datang dan pergi.
  const CAM_AI = ['Kerumunan padat terdeteksi', 'Orang berhenti lama di area terlarang', 'Barang tertinggal terdeteksi', 'Pergerakan melawan arus di eskalator'];
  function cctvStep() {
    const T = Store.s.tele;
    T.lat = Math.round(drift(T.lat, 3, 12, 32, 0)); T.camOn = Math.round(drift(T.camOn, 2, 1412, 1428, 0)); T.flow = Math.round(drift(T.flow, 12, 80, 210, 0));
    const al = Object.keys(Store.s.camAlerts), r = Math.random();
    let out = { kind: 'telemetri' };
    if (r < 0.15 && al.length < 5) { const c = pick(window.SEED.CAMERAS.filter((x) => !Store.s.camAlerts[x.id])); if (c) { const lbl = pick(CAM_AI); Store.camAlert(c.id, lbl, 'P3'); out = { kind: 'kamera', cam: c, label: lbl }; } }
    else if (r < 0.27 && al.length > 2) { const id = pick(al); if (!Store.s.camAlerts[id].ticketId) Store.clearCam(id); }
    Store.commit('cam'); return out;
  }
  // Energi & Utilitas: beban grid, efisiensi chiller, air, CO2.
  function energyStep() {
    const T = Store.s.tele;
    T.mw = drift(T.mw, 0.08, 13.9, 16.2, 2); T.kwtr = drift(T.kwtr, 0.004, 0.54, 0.6, 3); T.cop = round(3.517 / T.kwtr, 2);
    T.water = Math.round(T.water + rnd(0, 3)); T.co2 = round(T.co2 + rnd(0.002, 0.01), 2);
    Store.commit('energy'); return { kind: 'telemetri' };
  }

  function step() {
    tidy();
    if (paused()) return { kind: 'jeda' };
    const out = ({ ticketing: ticketStep, tenant: tenantStep, bms: bmsStep, cctv: cctvStep, energy: energyStep })[route()]();
    prune();
    return out;
  }

  // Notifikasi (toast) untuk setiap kejadian demo: masalah baru, diakui, tim dikirim, tim tiba, selesai, ditutup,
  // pesan tenant, peringatan kamera. Telemetri (angka bergeser) tidak memunculkan notifikasi.
  const STEP_TXT = { ACKNOWLEDGED: 'Tiket diakui operator', DISPATCHED: 'Tim dikirim', 'ON-SITE': 'Tim tiba di lokasi', RESOLVED: 'Masalah selesai', CLOSED: 'Tiket ditutup' };
  function notify(r) {
    if (!window.UI || !UI.toast || !r) return;
    const E = UI.esc;
    if (r.kind === 'baru') return UI.toast(`Masalah baru <b>${r.id}</b>: ${E(r.t.title)}`, r.t.priority === 'P4' ? 'P3' : r.t.priority, `${E(r.t.location)} · ${r.t.priority} ${UI.PRIO[r.t.priority].label.toLowerCase()}`);
    if (r.kind === 'maju') {
      const t = Store.ticket(r.id); if (!t) return;
      const head = r.status === 'DISPATCHED' ? `Tim dikirim: <b>${E(t.team || 'Tim')}</b>` : `${STEP_TXT[r.status] || 'Status berubah'}`;
      const sla = r.status === 'RESOLVED' || r.status === 'CLOSED' ? (Store.slaInfo(t).breached ? ' · lewat SLA' : ' · dalam SLA') : '';
      return UI.toast(`${head} <b>${r.id}</b>`, r.status === 'RESOLVED' || r.status === 'CLOSED' ? 'P4' : 'P3', `${E(t.title)}, ${E(t.location)}${sla}`);
    }
    if (r.kind === 'chat') return UI.toast(`Pesan tenant dari <b>${E(r.c.from)}</b>`, 'P4', E(r.c.text.length > 90 ? r.c.text.slice(0, 88) + '…' : r.c.text));
    if (r.kind === 'kamera') return UI.toast(`Kamera AI <b>${r.cam.id}</b>: ${E(r.label)}`, 'P3', E(r.cam.name));
  }

  // Paling sering satu notifikasi tiap NOTE_MS. Di antaranya kejadian dikumpulkan, yang tampil yang terpenting:
  // masalah baru diutamakan, selain itu kejadian terbaru (diakui, tim dikirim, tiba, selesai, ditutup, pesan tenant, kamera).
  const NOTE_MS = 3000;
  const rank = (r) => (r.kind === 'baru' ? 2 : ['maju', 'chat', 'kamera'].includes(r.kind) ? 1 : 0);
  let pendingNote = null, lastNote = 0;
  function queueNote(r) {
    if (r && rank(r) && (!pendingNote || rank(r) >= rank(pendingNote))) pendingNote = r;
    flushNote();
  }
  function flushNote() {
    if (!pendingNote || Date.now() - lastNote < NOTE_MS || paused()) return;
    const x = pendingNote; pendingNote = null; lastNote = Date.now();
    try { notify(x); } catch (e) { console.error(e); }
  }
  if (typeof setInterval === 'function') setInterval(flushNote, 250); // jarak notifikasi tepat NOTE_MS, terpisah dari langkah demo (2 detik)

  let timer = null;
  function loop() {
    clearTimeout(timer);
    let r = { kind: 'jeda' };
    try { r = step(); } catch (e) { console.error(e); }
    try { queueNote(r); } catch (e) { console.error(e); }
    timer = setTimeout(loop, TICK_MS); // tiap 2 detik selama halaman demo dibuka
  }
  function start() { clearTimeout(timer); timer = setTimeout(loop, TICK_MS); }
  function stop() { clearTimeout(timer); timer = null; }
  const on = () => !(Store.s.settings && Store.s.settings.live === false);
  function toggle() { Store.setting('live', !on()); }

  window.Live = { step, start, stop, toggle, on, tidy, scenarios: () => NEW.map((n) => n.title) };
  tidy(); // kejar waktu saat halaman dibuka
  start();
})();
