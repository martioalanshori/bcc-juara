/* Demo berjalan Command Center: tiap beberapa detik ada kejadian baru seperti di ruang kontrol sungguhan.
 * Tiket baru masuk di urutan teratas, tiket lama bergerak (diakui, tim dikirim, tiba, selesai, ditutup), sebagian
 * tertahan dengan catatan lapangan, dan tenant sesekali mengirim pesan. Semua lewat Store, jadi tercatat di log
 * dan dashboard lain ikut berubah. Jeda: Store.setting('live', false), saat simulasi use case, atau saat operator mengetik.
 * Kalimat ditulis seperti catatan petugas: pendek, konkret, tanpa istilah promosi. */
(function () {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const MIN_ACTIVE = 8, MAX_ACTIVE = 14, MAX_TICKETS = 60;

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
    if (document.hidden) return true;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName || '')) return true; // operator sedang mengetik: jangan rerender
    if (document.querySelector && document.querySelector('#modal-root .modal, #modal-root [role="dialog"]')) return true;
    return false;
  }

  function create() {
    const open = new Set(Store.s.tickets.filter(isOpen).map((t) => t.title));
    const opts = NEW.filter((n) => !open.has(n.title));
    const n = Object.assign({ cam: '', tenant: '', by: 'SYSTEM' }, pick(opts.length ? opts : NEW));
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

  function chat() {
    const c = pick(CHATS);
    Store.chat(Object.assign({}, c));
    return { kind: 'chat' };
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

  function step() {
    if (paused()) return { kind: 'jeda' };
    const act = Store.s.tickets.filter(isOpen).length, r = Math.random();
    let out;
    if (act < MIN_ACTIVE) out = create();
    else if (act > MAX_ACTIVE) out = advance();
    else if (r < 0.32) out = create();
    else if (r < 0.82) out = advance();
    else if (r < 0.93) out = hold();
    else out = chat();
    prune();
    return out;
  }

  let timer = null;
  function loop() {
    clearTimeout(timer);
    let r = { kind: 'jeda' };
    try { r = step(); } catch (e) { console.error(e); }
    if (r.kind === 'baru' && r.t.priority === 'P2' && window.UI && UI.toast) UI.toast('Tiket baru <b>' + r.id + '</b>: ' + UI.esc(r.t.title), 'P2', r.t.location);
    timer = setTimeout(loop, 7000 + Math.random() * 8000); // 7 sampai 15 detik, supaya tidak terasa seperti jam
  }
  function start() { clearTimeout(timer); timer = setTimeout(loop, 4000); }
  function stop() { clearTimeout(timer); timer = null; }
  const on = () => !(Store.s.settings && Store.s.settings.live === false);
  function toggle() { Store.setting('live', !on()); }

  window.Live = { step, start, stop, toggle, on };
  start();
})();
