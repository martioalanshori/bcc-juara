/* Seed data prototype SMICC-TS - Summarecon Mall.
 * Angka KPI/zonasi/utilitas diambil dari Super_Mall_Command_Center_Blueprint.xlsx.
 * Struktur domain mengikuti Mindmap_Super_Mall_Ticketing_system.drawio. */
(function () {
  const ZONES = [
    { id: 'LG', name: 'Lower Ground (LG)', short: 'LG & Atrium', mix: 'Hypermarket, F&B Casual, Services & Pharmacy', nla: 14500, leased: 14200, traffic: 420000, rate: 380000, sales: 52000, rec: 'Stabil; pertahankan anchor grocery & tambah grab-and-go F&B' },
    { id: 'GF', name: 'Ground Floor (GF)', short: 'GF Luxury', mix: 'Luxury Fashion, International Beauty, Flagship Cafe', nla: 16000, leased: 15850, traffic: 510000, rate: 750000, sales: 95000, rec: 'Performa tertinggi; naikkan tarif dasar 8% saat pembaruan kontrak' },
    { id: '1F', name: 'First Floor (1F)', short: '1F Fashion', mix: 'Fast Fashion, Lifestyle, Sports & Activewear', nla: 15500, leased: 14900, traffic: 390000, rate: 520000, sales: 68000, rec: 'Optimal; konversi 2 unit kosong menjadi pop-up store brand viral' },
    { id: '2F', name: 'Second Floor (2F)', short: '2F Family', mix: 'Electronics, Gadget Center, Home Living & Kids', nla: 15000, leased: 13650, traffic: 280000, rate: 410000, sales: 51000, rec: 'Okupansi 91%; perlu aktivasi pameran gadget & lomba anak di atrium' },
    { id: '3F', name: 'Third Floor (3F)', short: '3F Entertainment', mix: 'Cinema, Family Edutainment, Food Court & Dining', nla: 14000, leased: 13400, traffic: 460000, rate: 360000, sales: 58000, rec: 'Penarik traffic akhir pekan; optimasi revenue share dari Food Court' },
    { id: 'ROOF', name: 'Rooftop / Sky Garden', short: 'Rooftop', mix: 'Fine Dining, Lounge, Bar & Event Space', nla: 5000, leased: 4400, traffic: 140000, rate: 450000, sales: 29000, rec: 'Tingkatkan monetisasi sewa venue komunitas & live music malam hari' },
    { id: 'BASEMENT', name: 'Basement Parkir (B1-B2)', short: 'Basement Parkir', mix: 'Parkir, Loading Dock, Plant Room', nla: 0, leased: 0, traffic: 0, rate: 0, sales: 0, rec: '-' },
  ];

  const TENANTS = [
    { id: 'GF-104', name: 'Zara Flagship Store', group: 'Inditex Group', zone: 'GF', cat: 'Luxury & Fashion', anchor: true, score: 98.2, mgr: 'Ibu Maya Kartika', phone: '+62 811-9876-4321', lease: 'Nov 2026', pay: 'Lunas (Tepat Waktu)', ar: 0, kw: 165, temp: 24.8, water: 3.1, safety: 'Valid (98/100)' },
    { id: 'L3-01', name: 'Cinema XXI & IMAX', group: 'Nusantara Sejahtera Raya', zone: '3F', cat: 'Entertainment', anchor: true, score: 94.0, mgr: 'Dimas Ramadhan', phone: '+62 812-4455-1020', lease: 'Mar 2029', pay: 'Lunas', ar: 0, kw: 485, temp: 22.1, water: 3.0, safety: 'Valid (95/100)' },
    { id: 'LG-01', name: 'Sogo Department Store', group: 'Mitra Adiperkasa', zone: 'LG', cat: 'Luxury & Fashion', anchor: true, score: 99.1, mgr: 'Hendra Wijaya', phone: '+62 813-2200-7788', lease: 'Jun 2030', pay: 'Lunas', ar: 0, kw: 380, temp: 23.0, water: 3.2, safety: 'Valid (99/100)' },
    { id: '1F-E01', name: 'Uniqlo', group: 'Fast Retailing', zone: '1F', cat: 'Luxury & Fashion', anchor: true, score: 97.9, mgr: 'Sari Lestiani', phone: '+62 811-1300-2211', lease: 'Jan 2028', pay: 'Lunas', ar: 0, kw: 140, temp: 23.4, water: 3.1, safety: 'Valid (97/100)' },
    { id: 'L3-22', name: 'Food Avenue - Haidilao Hotpot', group: 'Haidilao Indonesia', zone: '3F', cat: 'F&B & Dining', anchor: false, score: 91.4, mgr: 'Rian Wicaksono', phone: '+62 815-7766-3301', lease: 'Agu 2027', pay: 'Lunas', ar: 0, kw: 395, temp: 24.0, water: 2.8, safety: 'Perlu re-audit hood' },
    { id: 'LG-02', name: 'Hypermart', group: 'Matahari Putra Prima', zone: 'LG', cat: 'Hypermarket', anchor: true, score: 95.6, mgr: 'Agus Salim', phone: '+62 812-9090-1122', lease: 'Des 2028', pay: 'Lunas', ar: 0, kw: 420, temp: 23.2, water: 3.0, safety: 'Valid (96/100)' },
    { id: 'GF-42', name: 'Sephora', group: 'LVMH', zone: 'GF', cat: 'Luxury & Fashion', anchor: false, score: 98.8, mgr: 'Nadia Putri', phone: '+62 811-8800-4242', lease: 'Feb 2027', pay: 'Lunas', ar: 0, kw: 60, temp: 23.0, water: 3.1, safety: 'Valid (99/100)' },
    { id: 'LG-18', name: 'Chatime', group: 'Kawan Lama F&B', zone: 'LG', cat: 'F&B & Dining', anchor: false, score: 96.2, mgr: 'Tika Ananda', phone: '+62 812-5050-1818', lease: 'Mei 2027', pay: 'Lunas', ar: 0, kw: 28, temp: 23.6, water: 3.0, safety: 'Valid (95/100)' },
    { id: '2F-18', name: 'Batik Keris', group: 'Keris Group', zone: '2F', cat: 'Luxury & Fashion', anchor: false, score: 93.1, mgr: 'Yuni Astuti', phone: '+62 813-1818-2200', lease: 'Apr 2027', pay: 'Lunas', ar: 0, kw: 42, temp: 23.8, water: 3.0, safety: 'Teguran SOP-V-291' },
    { id: '2F-05', name: 'Gramedia', group: 'Kompas Gramedia', zone: '2F', cat: 'Lifestyle', anchor: false, score: 97.0, mgr: 'Bambang Susilo', phone: '+62 812-6600-0505', lease: 'Okt 2028', pay: 'Lunas', ar: 0, kw: 75, temp: 23.4, water: 3.0, safety: 'Valid (97/100)' },
    { id: '2F-31', name: 'Gadget Hub', group: 'Independen', zone: '2F', cat: 'Electronics', anchor: false, score: 86.5, mgr: 'Ferry Gunawan', phone: '+62 819-3131-3131', lease: 'Jan 2027', pay: 'Menunggak 61 hari', ar: 384, kw: 55, temp: 24.2, water: 3.0, safety: 'Valid (90/100)' },
    { id: '3F-10', name: 'Timezone', group: 'Matahari Group', zone: '3F', cat: 'Entertainment', anchor: false, score: 95.0, mgr: 'Andre Kusuma', phone: '+62 812-1010-3030', lease: 'Sep 2027', pay: 'Lunas', ar: 0, kw: 130, temp: 23.0, water: 3.0, safety: 'Valid (96/100)' },
    { id: 'GF-12', name: 'Starbucks Reserve', group: 'MAP Boga', zone: 'GF', cat: 'F&B & Dining', anchor: false, score: 97.5, mgr: 'Lia Hartono', phone: '+62 811-1212-4545', lease: 'Jul 2027', pay: 'Lunas', ar: 0, kw: 48, temp: 23.1, water: 3.1, safety: 'Valid (98/100)' },
    { id: 'ROOF-01', name: 'Sky Garden Lounge', group: 'Independen', zone: 'ROOF', cat: 'F&B & Dining', anchor: false, score: 92.7, mgr: 'Kevin Tan', phone: '+62 817-0101-8888', lease: 'Mar 2027', pay: 'Telat 35 hari', ar: 96, kw: 70, temp: 24.5, water: 2.9, safety: 'Valid (93/100)' },
  ];

  const TEAMS = [
    { id: 'MEP-A', name: 'MEP Alpha', skill: 'MEP', members: 'Budi & Hendra', radio: 'CH-02', on: 4, total: 4, status: 'On-Duty' },
    { id: 'MEP-B', name: 'MEP Bravo', skill: 'MEP', members: 'Agus, Wawan & Joko', radio: 'CH-02', on: 4, total: 6, status: 'On-Duty' },
    { id: 'SEC-A', name: 'Regu Alpha', skill: 'Security', members: '4 personel - Drop-off & Gerbang', radio: 'CH-01', on: 4, total: 4, status: 'Nominal' },
    { id: 'SEC-B', name: 'Regu Bravo', skill: 'Security', members: '6 personel - Atrium & Retail', radio: 'CH-01', on: 6, total: 6, status: 'Nominal' },
    { id: 'SEC-C', name: 'Regu Charlie', skill: 'Security', members: '4 personel - Basement & Dock', radio: 'CH-01', on: 4, total: 4, status: 'Patroli B1' },
    { id: 'ERT-A', name: 'ERT Alpha', skill: 'ERT', members: '5 personel P3K & Damkar internal', radio: 'CH-01', on: 5, total: 5, status: 'Siaga' },
    { id: 'HK-A', name: 'Janitorial Crew', skill: 'Housekeeping', members: 'Rapid Wet Vac & Sanitasi', radio: 'CH-03', on: 20, total: 22, status: 'Aktif' },
    { id: 'PRK-A', name: 'Tim Parkir', skill: 'Parkir', members: 'Koordinator + 8 petugas gate', radio: 'CH-04', on: 9, total: 10, status: 'Aktif' },
  ];

  const CAMERAS = [
    { id: 'CAM-01', name: 'Atrium Utama North Lobby', zone: 'GF', kind: 'atrium', res: '4K HDR', fps: 60, ptz: true },
    { id: 'CAM-14', name: 'GF Luxury Wing', zone: 'GF', kind: 'corridor', res: '1080p', fps: 30, ptz: false, fr: true },
    { id: 'CAM-17', name: 'LG Main Atrium', zone: 'LG', kind: 'atrium', res: '4K', fps: 30, ptz: true },
    { id: 'CAM-29', name: 'Eskalator E-04 West', zone: '2F', kind: 'escalator', res: '1080p', fps: 30, ptz: false },
    { id: 'CAM-33', name: 'Koridor 2F Kids Zone', zone: '2F', kind: 'corridor', res: '1080p', fps: 30, ptz: false },
    { id: 'CAM-42', name: 'Basement B1 Zona C', zone: 'BASEMENT', kind: 'parking', res: '1080p', fps: 25, ptz: false, anpr: true },
    { id: 'CAM-08', name: 'Food Court 3F (Thermal)', zone: '3F', kind: 'foodcourt', res: '1080p', fps: 25, ptz: false, thermal: true },
    { id: 'CAM-88', name: 'Dock Logistik B2', zone: 'BASEMENT', kind: 'dock', res: '1080p', fps: 25, ptz: false },
    { id: 'CAM-61', name: 'Gate Parkir P1 Utara (ANPR)', zone: 'BASEMENT', kind: 'gate', res: '1080p', fps: 30, ptz: false, anpr: true },
    { id: 'CAM-05', name: 'Lobby Drop-off Utama', zone: 'GF', kind: 'lobby', res: '4K', fps: 30, ptz: true },
    { id: 'CAM-71', name: 'Cinema XXI Lobby 3F', zone: '3F', kind: 'corridor', res: '1080p', fps: 30, ptz: false },
    { id: 'CAM-90', name: 'Ruang Server & Kas', zone: 'LG', kind: 'server', res: '1080p', fps: 15, ptz: false },
  ];

  const DEVICES = {
    // chiller
    'CH-01': { type: 'chiller', name: 'Chiller 01', brand: 'York Centrifugal', cap: '1200 TR', status: 'RUNNING', sup: 6.8, ret: 12.4, flow: 2280, vfd: '48.5 Hz (97%)', kwtr: 0.57, load: 82, kw: 531, cop: 6.5, note: 'Vibrasi 0.8 mm/s' },
    'CH-02': { type: 'chiller', name: 'Chiller 02', brand: 'Trane CenTraVac', cap: '1200 TR', status: 'RUNNING', sup: 7.1, ret: 12.8, flow: 1940, vfd: '47.2 Hz (94%)', kwtr: 0.59, load: 78, kw: 533, cop: 6.2, note: 'Vibrasi 0.9 mm/s' },
    'CH-03': { type: 'chiller', name: 'Chiller 03', brand: 'Daikin Magnetic', cap: '1200 TR', status: 'RUNNING', sup: 6.9, ret: 12.6, flow: 2310, vfd: '49.0 Hz (98%)', kwtr: 0.54, load: 85, kw: 520, cop: 6.9, note: 'Bearing Mag 0.3' },
    'CH-04': { type: 'chiller', name: 'Chiller 04', brand: 'York Centrifugal', cap: '1200 TR', status: 'WARN', sup: 7.4, ret: 12.1, flow: 1560, vfd: '30.0 Hz (60%)', kwtr: 0.68, load: 40, kw: 326, cop: 5.1, note: 'Fouling kondensor' },
    'CH-05': { type: 'chiller', name: 'Chiller 05', brand: 'Carrier Evergreen', cap: '1000 TR', status: 'STANDBY', sup: 0, ret: 0, flow: 0, vfd: '0 Hz', kwtr: 0, load: 0, kw: 0, cop: 0, note: 'Cold Standby' },
    // AHU
    'AHU-ATR': { type: 'ahu', name: 'Atrium Summarecon', code: 'AHU-ATR-01 s/d 04', zone: 'GF', temp: 22.4, co2: 560, rh: 54, status: 'RUNNING' },
    'AHU-LUX': { type: 'ahu', name: 'Luxury Wing', code: 'AHU-LX-01 s/d 06', zone: 'GF', temp: 21.8, co2: 520, rh: 51, status: 'RUNNING' },
    'AHU-CIN': { type: 'ahu', name: 'Cinema & Entertainment', code: 'AHU-CN-01 s/d 08', zone: '3F', temp: 20.5, co2: 610, rh: 48, status: 'RUNNING' },
    'AHU-FC': { type: 'ahu', name: 'Food Court & Dining', code: 'AHU-FC-01 s/d 05', zone: '3F', temp: 23.1, co2: 690, rh: 58, status: 'RUNNING' },
    // vertical transport
    'L-01': { type: 'lift', name: 'L-01 Kapsul', floor: '6', dir: 'NAIK', load: 58, speed: 2.5, status: 'RUNNING' },
    'L-02': { type: 'lift', name: 'L-02 Kapsul', floor: '2', dir: 'TURUN', load: 44, speed: 2.5, status: 'RUNNING' },
    'L-03': { type: 'lift', name: 'L-03 East', floor: '4', dir: 'PADAT', load: 89, speed: 2.2, status: 'RUNNING' },
    'L-04': { type: 'lift', name: 'L-04 East', floor: 'G', dir: 'DIAM', load: 12, speed: 0, status: 'RUNNING' },
    'L-05': { type: 'lift', name: 'L-05 West', floor: '1', dir: 'NAIK', load: 62, speed: 2.5, status: 'RUNNING' },
    'L-06': { type: 'lift', name: 'L-06 West', floor: '3', dir: 'TURUN', load: 50, speed: 2.5, status: 'RUNNING' },
    'S-01': { type: 'lift', name: 'S-01 Barang', floor: 'B1', dir: 'LOGISTIK', load: 70, speed: 1.6, status: 'RUNNING' },
    'S-02': { type: 'lift', name: 'S-02 Servis', floor: '5', dir: 'DIAM', load: 0, speed: 0, status: 'RUNNING' },
    'ESC-E01': { type: 'esc', name: 'E-01', route: 'LG-GF', status: 'RUNNING', vib: 0.8 },
    'ESC-E02': { type: 'esc', name: 'E-02', route: 'GF-1F', status: 'RUNNING', vib: 0.9 },
    'ESC-E03': { type: 'esc', name: 'E-03', route: '1F-2F', status: 'RUNNING', vib: 1.1 },
    'ESC-E04': { type: 'esc', name: 'E-04', route: '2F-3F West', status: 'TRIP', vib: 0.0 },
    'ESC-E05': { type: 'esc', name: 'E-05', route: 'LG-GF East', status: 'RUNNING', vib: 0.7 },
    'ESC-E06': { type: 'esc', name: 'E-06', route: 'GF-1F East', status: 'RUNNING', vib: 1.0 },
    'ESC-E07': { type: 'esc', name: 'E-07', route: '1F-2F East', status: 'RUNNING', vib: 1.4 },
    'ESC-E08': { type: 'esc', name: 'E-08', route: '2F-3F East', status: 'RUNNING', vib: 0.9 },
    // power
    'TRF-1A': { type: 'trafo', name: 'Trafo 1A (West Mall)', mva: 3.5, load: 81, mw: 2.84, temp: 64.2, thd: 1.62, status: 'RUNNING' },
    'TRF-1B': { type: 'trafo', name: 'Trafo 1B (West Chiller)', mva: 3.5, load: 84, mw: 2.94, temp: 68.0, thd: 1.84, status: 'RUNNING' },
    'TRF-2A': { type: 'trafo', name: 'Trafo 2A (East Mall)', mva: 3.5, load: 76, mw: 2.66, temp: 61.5, thd: 1.45, status: 'RUNNING' },
    'TRF-2B': { type: 'trafo', name: 'Trafo 2B (East Tenant & FEC)', mva: 3.5, load: 79, mw: 2.77, temp: 63.1, thd: 1.51, status: 'RUNNING' },
    'GEN-01': { type: 'genset', name: 'Genset 01', fuel: 94, liters: 4700, batt: 26.4, temp: 48, status: 'STANDBY' },
    'GEN-02': { type: 'genset', name: 'Genset 02', fuel: 92, liters: 4600, batt: 26.2, temp: 47, status: 'STANDBY' },
    'GEN-03': { type: 'genset', name: 'Genset 03', fuel: 96, liters: 4800, batt: 26.5, temp: 49, status: 'STANDBY' },
    'GEN-04': { type: 'genset', name: 'Genset 04', fuel: 95, liters: 4750, batt: 26.4, temp: 48, status: 'STANDBY' },
    // parking
    'GATE-G1': { type: 'gate', name: 'Gate Masuk P1 Utara', dir: 'Masuk', queue: 4, wait: 14, status: 'NORMAL' },
    'GATE-G2': { type: 'gate', name: 'Gate Reversible P1', dir: 'Masuk/Keluar', queue: 0, wait: 0, status: 'STANDBY' },
    'GATE-G3': { type: 'gate', name: 'Gate Masuk P2 Selatan', dir: 'Masuk', queue: 2, wait: 11, status: 'NORMAL' },
    'GATE-G4': { type: 'gate', name: 'Gate Keluar Utama', dir: 'Keluar', queue: 5, wait: 12, status: 'NORMAL' },
    'EV-01': { type: 'ev', name: 'EV-01 DC 60kW', status: 'CHARGING', kwh: 38.2 },
    'EV-02': { type: 'ev', name: 'EV-02 DC 60kW', status: 'CHARGING', kwh: 21.5 },
    'EV-03': { type: 'ev', name: 'EV-03 AC 22kW', status: 'AVAILABLE', kwh: 0 },
    'EV-04': { type: 'ev', name: 'EV-04 AC 22kW', status: 'FAULT', kwh: 0 },
    'EV-05': { type: 'ev', name: 'EV-05 AC 22kW', status: 'CHARGING', kwh: 9.8 },
    'EV-06': { type: 'ev', name: 'EV-06 AC 22kW', status: 'AVAILABLE', kwh: 0 },
  };

  // ticket seed: ago = menit lalu dibuat
  const TICKETS = [
    { id: 'TCK-8921', title: 'Kebocoran Pipa Chiller & Genangan Air', desc: 'Pipa AC sentral menetes deras dekat eskalator utama LG, genangan +/- 4 m2. Sensor tekanan loop CHW turun 12%.', priority: 'P2', category: 'Fasilitas MEP, AC & Plumbing', zone: 'LG', location: 'LG Main Atrium - persis depan Entrance Hall', source: 'Sensor IoT #BMS-CH-04', sop: 'SOP-BMS-02', cam: 'CAM-17', team: 'MEP Alpha', status: 'ON-SITE', ago: 9 },
    { id: 'TCK-8919', title: 'Eskalator E-04 Mati Mendadak (Emergency Trip)', desc: 'Sensor beban comb-plate memicu stop darurat, ramai pengunjung di landing 2F.', priority: 'P3', category: 'Fasilitas MEP, AC & Plumbing', zone: '2F', location: '2F West Atrium E-04', source: 'Pelapor: Security Pos 3', sop: 'SOP-BMS-05', cam: 'CAM-29', team: 'MEP Bravo', status: 'DISPATCHED', ago: 14 },
    { id: 'TCK-8915', title: 'Tenant Zara (GF-104) AC Suhu 28°C', desc: 'Komplain pelanggan ramai di fitting room, VAV damper diduga macet.', priority: 'P2', category: 'Fasilitas MEP, AC & Plumbing', zone: 'GF', location: 'GF Luxury Wing Unit GF-104', source: 'Tenant: Zara Store Mgr (WhatsApp)', sop: 'SOP-COM-05', cam: 'CAM-14', tenant: 'GF-104', team: 'MEP Bravo', status: 'DISPATCHED', ago: 18 },
    { id: 'TCK-8908', title: 'Tumpahan Minuman & Lantai Licin', desc: 'Area depan gerai Chatime LG, yellow cone sudah dipasang.', priority: 'P4', category: 'Kebersihan & Sanitasi', zone: 'LG', location: 'LG Food Avenue - depan Chatime', source: 'CS Roaming 02', sop: 'SOP-SEC-07', cam: 'CAM-17', team: 'Janitorial Crew', status: 'ON-SITE', ago: 6 },
    { id: 'TCK-8902', title: 'Kendaraan Parkir Menghalangi Jalur Difabel & Damkar', desc: 'Mobil Alphard B 1204 KOS parkir paralel tanpa pengemudi di jalur damkar.', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', location: 'B1 Carpark Zona C', source: 'Smart Cam ANPR-11', sop: 'SOP-PRK-02', cam: 'CAM-42', team: 'Regu Charlie', status: 'DISPATCHED', ago: 11 },
    { id: 'TCK-8899', title: 'Objek Tak Bertuan (Tas Ransel Hitam) > 12 Menit', desc: 'AI mendeteksi tas ransel hitam di koridor 2F tanpa pemilik.', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: '2F', location: 'Koridor 2F Kids Zone', source: 'AI Video CAM-33', sop: 'SOP-SEC-03', cam: 'CAM-33', team: 'Regu Bravo', status: 'ACKNOWLEDGED', ago: 13 },
    { id: 'TCK-8897', title: 'Izin Overtime AC & Loading Dock B2 Cinema XXI', desc: 'Overtime AC 00:00-03:00 WIB untuk pemutaran midnight & drop logistik display film.', priority: 'P3', category: 'Tenant Fit-Out & Kasir IT', zone: '3F', location: 'Unit L3-01 / Dock B2', source: 'Tenant App FORM-OT-2026-884', sop: 'SOP-COM-06', cam: 'CAM-88', tenant: 'L3-01', team: 'Tenant Relation', status: 'OPEN', ago: 45 },
    { id: 'TCK-8894', title: 'Grease Trap Komunal Tersumbat (H2S 12 ppm)', desc: 'Aroma ringan di koridor servis belakang unit L3; aliran buang dapur kendala.', priority: 'P3', category: 'Kebersihan & Sanitasi', zone: '3F', location: 'Koridor Servis L3 belakang L3-22', source: 'Sensor H2S + Tenant', sop: 'SOP-SEC-07', cam: 'CAM-08', tenant: 'L3-22', team: 'Janitorial Crew', status: 'DISPATCHED', ago: 32 },
    { id: 'TCK-8890', title: 'Chiller-04 Fouling Kondensor (COP 5.1)', desc: 'Efisiensi chiller anjlok ke 0.68 kW/TR akibat laju sirkulasi kondensor turun.', priority: 'P3', category: 'Energi & Utilitas', zone: 'BASEMENT', location: 'Central Chiller Plant B2', source: 'AI Energy Anomaly', sop: 'SOP-BMS-01', cam: '', team: 'MEP Bravo', status: 'ACKNOWLEDGED', ago: 95 },
    { id: 'TCK-8886', title: 'Pintu Evakuasi E-12 Terbuka > 3 Menit', desc: 'Pintu darurat sayap barat terbuka melebihi durasi batas.', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: '1F', location: '1F Sayap Barat Pintu E-12', source: 'Info Sensor Pintu', sop: 'SOP-SEC-04', cam: 'CAM-14', team: 'Regu Bravo', status: 'ON-SITE', ago: 25 },
    { id: 'TCK-8881', title: 'Antrean Gate Masuk P1 Utara 9 Mobil', desc: 'Reader e-money gate 1 lambat (22 detik/mobil).', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', location: 'Gate Masuk P1 Utara', source: 'ANPR Queue Alert', sop: 'SOP-PRK-01', cam: 'CAM-61', team: 'Tim Parkir', status: 'OPEN', ago: 4 },
    { id: 'TCK-8877', title: 'Toilet Wanita 1F Tisu & Sabun Habis', desc: '3 feedback QR dalam 10 menit.', priority: 'P4', category: 'Kebersihan & Sanitasi', zone: '1F', location: 'Toilet Wanita 1F Timur', source: 'QR Feedback', sop: 'SOP-VIS-03', cam: '', team: 'Janitorial Crew', status: 'DISPATCHED', ago: 41 },
    { id: 'TCK-8870', title: 'Permintaan ID Badge Vendor Visual Merchandising', desc: 'Sephora meminta 4 ID badge tambahan untuk vendor VM promo.', priority: 'P4', category: 'Tenant Fit-Out & Kasir IT', zone: 'GF', location: 'Unit GF-42', source: 'Tenant App', sop: 'SOP-COM-02', cam: '', tenant: 'GF-42', team: 'Tenant Relation', status: 'CLOSED', ago: 134, resolvedAgo: 120 },
    { id: 'TCK-8866', title: 'AC Food Court Agak Panas (25.6°C)', desc: 'Keluhan pengunjung via app.', priority: 'P4', category: 'Fasilitas MEP, AC & Plumbing', zone: '3F', location: '3F Food Court', source: 'App Rating', sop: 'SOP-BMS-01', cam: 'CAM-08', team: 'MEP Bravo', status: 'CLOSED', ago: 180, resolvedAgo: 150 },
    { id: 'TCK-8861', title: 'Lift L-03 Berhenti Antar Lantai (Tanpa Penumpang)', desc: 'Fault code door lock.', priority: 'P3', category: 'Fasilitas MEP, AC & Plumbing', zone: 'GF', location: 'Lift L-03 East', source: 'PLC Fault Code', sop: 'SOP-BMS-05', cam: '', team: 'MEP Alpha', status: 'CLOSED', ago: 260, resolvedAgo: 205 },
    { id: 'TCK-8858', title: 'Anak Terpisah dari Orang Tua di 3F', desc: 'Code Adam, ditemukan dalam 7 menit.', priority: 'P1', category: 'Keamanan, Parkir & Crowd', zone: '3F', location: '3F Timezone', source: 'Info Desk', sop: 'SOP-SEC-09', cam: 'CAM-71', team: 'Regu Bravo', status: 'CLOSED', ago: 300, resolvedAgo: 293 },
    { id: 'TCK-8852', title: 'Sensor NH3 Toilet Pria 2F 31 ppm', desc: 'Auto-close setelah sensor normal.', priority: 'P4', category: 'Kebersihan & Sanitasi', zone: '2F', location: 'Toilet Pria 2F', source: 'Smart Toilet Sensor', sop: 'SOP-SEC-07', cam: '', team: 'Janitorial Crew', status: 'CLOSED', ago: 330, resolvedAgo: 318 },
    { id: 'TCK-8849', title: 'Genangan Air Hujan Ramp B1', desc: 'Pompa sump B1 dinyalakan manual.', priority: 'P3', category: 'Fasilitas MEP, AC & Plumbing', zone: 'BASEMENT', location: 'Ramp Masuk B1', source: 'Patroli', sop: 'SOP-BMS-02', cam: 'CAM-42', team: 'MEP Alpha', status: 'CLOSED', ago: 420, resolvedAgo: 370 },
  ];

  const CATEGORIES = ['Fasilitas MEP, AC & Plumbing', 'Keamanan, Parkir & Crowd', 'Kebersihan & Sanitasi', 'Tenant Fit-Out & Kasir IT', 'Energi & Utilitas'];

  // Blueprint sheet 1
  const KPIS = [
    ['1. Commercial & Leasing', 'Tingkat Okupansi (NLA Occupancy Rate)', 0.95, 0.942, 'pct', 'up', 'Property Management System (PMS)', 'Real-time / Harian'],
    ['1. Commercial & Leasing', 'Pendapatan Sewa & Service Charge (IDR Miliar)', 45, 44.1, 'num', 'up', 'ERP Finance & Billing', 'Harian'],
    ['1. Commercial & Leasing', 'Collection Ratio (Ketepatan Bayar Tenant)', 0.98, 0.915, 'pct', 'up', 'Virtual Account Auto-Recon', 'Real-time'],
    ['2. Traffic & Experience', 'Rata-rata Footfall Harian (Pengunjung/Hari)', 65000, 68400, 'int', 'up', '3D People Counter & Wi-Fi Probe', 'Real-time (Per 15 Menit)'],
    ['2. Traffic & Experience', 'Rata-rata Dwell Time Pengunjung (Menit)', 150, 165, 'int', 'up', 'Wi-Fi Analytics & App Beacon', 'Real-time'],
    ['2. Traffic & Experience', 'Customer Satisfaction / CSAT Score (Skala 5)', 4.6, 4.72, 'num', 'up', 'Interactive Kiosk & App Rating', 'Real-time'],
    ['3. Facility & MEP (BMS)', 'Intensitas Konsumsi Energi / IKE (kWh/m2/bln)', 22, 21.1, 'num', 'down', 'Smart Power Meter & BMS Chiller', 'Real-time (Per 5 Menit)'],
    ['3. Facility & MEP (BMS)', 'Uptime Lift, Eskalator & HVAC (%)', 0.995, 0.998, 'pct', 'up', 'IoT Predictive Maintenance PLC', 'Real-time'],
    ['3. Facility & MEP (BMS)', 'Downtime Tidak Terencana (Jam/Bulan)', 2, 0.5, 'num', 'down', 'BMS SCADA Alert Log', 'Real-time'],
    ['4. Parking & Mobility', 'Turnover Ratio Parkir Mobil (Putaran/Slot/Hari)', 3.8, 4.1, 'num', 'up', 'Smart LPR & Ultrasonic Bay Sensor', 'Real-time'],
    ['4. Parking & Mobility', 'Waktu Antrean Masuk Gate Utama (Detik)', 15, 22, 'int', 'down', 'ANPR Camera & Gate Telemetry', 'Real-time'],
    ['5. Security, Safety & HSE', 'Rata-rata Waktu Respons Insiden (Menit)', 3, 2.4, 'num', 'down', 'AI Video Analytics & HT GPS Tracker', 'Real-time'],
    ['5. Security, Safety & HSE', 'Kesiapan Proteksi Kebakaran (Hydrant/Sprinkler)', 1, 1, 'pct', 'up', 'Fire Alarm Control Panel (FACP)', 'Real-time'],
  ];
  const TREND = [
    ['Jan', 1950, 42.5, 14.2], ['Feb', 1820, 40.8, 13.5], ['Mar', 2100, 45.2, 14.8], ['Apr', 2450, 52, 16.1], ['Mei', 2050, 44, 14.4],
    ['Jun', 2300, 48.5, 15.3], ['Jul', 2250, 47.2, 15], ['Agu', 2080, 44.5, 14.5], ['Sep', 2020, 43.8, 14.2], ['Okt', 2120, 45.1, 14.6],
  ];
  // Blueprint sheet 4 (utilitas)
  const UTILITY = [
    ['HVAC Central (Chiller, AHU, Cooling Tower)', 0.48, 820000, 1230, 950, 'VSD Chiller + Reset suhu otomatis berdasarkan sensor kepadatan orang'],
    ['Pencahayaan Area Publik, Fasad & Parkir', 0.18, 310000, 465, 380, 'Smart DALI Dimming (redup 40% di area parkir saat slot sepi)'],
    ['Transportasi Vertikal (Lift & Eskalator)', 0.12, 205000, 307.5, 250, 'Mode Slow-Speed otomatis saat tidak ada penumpang (Motion Sensor)'],
    ['Konsumsi Listrik Tenant (Sub-metering)', 0.22, 375000, 562.5, 618, 'AMR (Automatic Meter Reading) prabayar/pascabayar tanpa catat manual'],
  ];
  const PARKING = [
    { id: 'B1-A', name: 'B1 Zona A (Reguler)', cap: 420, used: 371 },
    { id: 'B1-C', name: 'B1 Zona C (Reguler)', cap: 500, used: 412 },
    { id: 'B2-R', name: 'B2 Reguler', cap: 640, used: 488 },
    { id: 'VIP', name: 'VIP & Valet Lobby', cap: 80, used: 74 },
    { id: 'EV', name: 'EV Charging Bay', cap: 24, used: 17 },
    { id: 'LADY', name: 'Ladies Parking', cap: 60, used: 52 },
    { id: 'MTR', name: 'Motor B1 Timur', cap: 900, used: 612 },
  ];
  const AR = [
    { b: 'Lancar (0-30)', v: 41.2 }, { b: '31-60 hari', v: 2.6 }, { b: '61-90 hari', v: 0.9 }, { b: '> 90 hari', v: 0.3 },
  ];
  const CONTRACTS = [
    { t: 'Gadget Hub (2F-31)', m: 2, act: 'Evaluasi: tunggakan 61 hari' },
    { t: 'Sky Garden Lounge (ROOF-01)', m: 4, act: 'Renewal + monetisasi live music' },
    { t: 'Sephora (GF-42)', m: 3, act: 'Renewal + kenaikan tarif 8% (zona GF)' },
    { t: 'Batik Keris (2F-18)', m: 5, act: 'Renewal, perhatikan teguran SOP' },
    { t: 'Chatime (LG-18)', m: 6, act: 'Trigger Leasing 6 bulan (SOP-COM-01)' },
    { t: 'Food Avenue - Haidilao (L3-22)', m: 9, act: 'Review OCR & revenue share' },
  ];

  window.SEED = { ZONES, TENANTS, TEAMS, CAMERAS, DEVICES, TICKETS, CATEGORIES, KPIS, TREND, UTILITY, PARKING, AR, CONTRACTS };
})();
