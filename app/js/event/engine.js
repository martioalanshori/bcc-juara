/* Event Ticketing engine (Bandung Build Challenge 2026) — dipakai portal pengunjung, dashboard panitia, check-in gate.
 *
 * Konsistensi & anti double-booking:
 *  1. Kursi dikunci (HELD) begitu dipilih, berlaku `holdMin` menit, maks `maxPerOrder` tiket per pesanan.
 *  2. Setiap perubahan = transaksi optimistik: baca state versi N -> ubah -> commit(base=N).
 *     Server (server.js) menerima commit hanya bila versinya masih N (compare-and-swap di bawah lock).
 *     Bila kalah balapan (409), klien membaca state terbaru lalu menjalankan ulang aturan:
 *     kursi yang sudah dipegang orang lain ditolak -> mustahil dua pesanan berhasil untuk kursi yang sama.
 *  3. Pembayaran memverifikasi ulang bahwa hold masih milik pesanan & belum kedaluwarsa; callback idempoten.
 *  4. Check-in juga transaksi: dua gate memindai tiket yang sama bersamaan -> satu VALID, lainnya SUDAH DIGUNAKAN.
 * Mode: "server" (server.js, dibagi semua perangkat di LAN) atau "lokal" (localStorage, 1 perangkat, sinkron antar-tab).
 */
(function () {
  const LS_KEY = 'smicc-evt-v1';
  const CART_KEY = 'smicc-evt-cart';
  const MY_KEY = 'smicc-evt-my';
  const SECRET = 'SMB-EVT-2026|sandbox-key'; // produksi: HMAC-SHA256 dengan kunci rahasia di server
  const API = '/api/evt/state';
  const PAY_MIN = 15; // batas waktu pembayaran (menit)
  const FEE = 5000; // biaya layanan per tiket berbayar
  // Asumsi keuangan demo per acara (bisa diubah pengelola di Kelola acara): sewa venue, bagi hasil tiket ke mall,
  // biaya operasional mall, rata-rata belanja pengunjung di tenant. Angka contoh, bukan data kontrak nyata.
  const FIN_DEFAULT = { rent: 35000000, revShare: 0.1, cost: 12000000, spend: 150000 };

  let mode = 'lokal', version = 0, state = null, offset = 0, ready = null;
  const subs = new Set();
  const now = () => Date.now() + offset;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  class EvtError extends Error {}
  const fail = (m) => { throw new EvtError(m); };

  // ------------------------------------------------------------------ util
  const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = (n) => Array.from({ length: n }, () => ALPH[Math.floor(Math.random() * ALPH.length)]).join('');
  function hash(str) { // cyrb53 — cukup untuk prototype (produksi: HMAC-SHA256)
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0').slice(-10).toUpperCase();
  }
  const sign = (id, ev, seat) => hash(SECRET + '|' + id + '|' + ev + '|' + (seat || '-'));
  const qrText = (t) => `SMB1|${t.id}|${t.ev}|${t.seat || '-'}|${sign(t.id, t.ev, t.seat)}`;
  const rp = (n) => (n === 0 ? 'Gratis' : 'Rp ' + Math.round(n).toLocaleString('id-ID'));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (ms) => new Date(ms).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtShort = (ms) => new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = (ms) => new Date(ms).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  const fmtDT = (ms) => fmtShort(ms) + ' ' + fmtTime(ms);
  const mmss = (ms) => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  function cartId() { let c = sessionStorage.getItem(CART_KEY); if (!c) { c = 'C-' + rand(6); sessionStorage.setItem(CART_KEY, c); } return c; }
  const myOrders = () => { try { return JSON.parse(localStorage.getItem(MY_KEY) || '[]'); } catch (e) { return []; } };
  const rememberOrder = (id) => { const m = myOrders().filter((x) => x !== id); m.unshift(id); localStorage.setItem(MY_KEY, JSON.stringify(m.slice(0, 30))); };

  // ------------------------------------------------------------------ seed (data contoh, bukan data pribadi nyata)
  function rowsSpec(spec) { return spec.map(([r, t, n]) => ({ r, t, n })); }
  const ATRIUM = { stage: 'PANGGUNG UTAMA · MAIN ATRIUM', rows: rowsSpec([['A', 'VIP', 12], ['B', 'VIP', 12], ['C', 'GLD', 16], ['D', 'GLD', 16], ['E', 'GLD', 16], ['F', 'GLD', 16], ['G', 'SLV', 18], ['H', 'SLV', 18], ['J', 'SLV', 18], ['K', 'SLV', 18], ['L', 'SLV', 18]]) };
  const HALL = { stage: 'PANGGUNG · SUMMARECON HALL', rows: rowsSpec([['A', 'PRM', 14], ['B', 'PRM', 14], ['C', 'PRM', 14], ['D', 'REG', 14], ['E', 'REG', 14], ['F', 'REG', 14], ['G', 'REG', 14], ['H', 'REG', 14]]) };
  // Templat venue untuk acara baru (denah + jenis tiket default)
  const TEMPLATES = {
    ATRIUM: { name: 'Main Atrium (178 kursi + festival 200)', venue: 'Main Atrium, GF · Summarecon Mall Bandung', layout: ATRIUM, gates: ['Gate A (Lobby Utama)', 'Gate B (Sisi Food Court)'],
      types: [
        { id: 'VIP', name: 'VIP', price: 750000, color: '#c084fc', seated: true, onSale: true, perks: 'Baris A-B' },
        { id: 'GLD', name: 'Gold', price: 450000, color: '#facc15', seated: true, onSale: true, perks: 'Baris C-F' },
        { id: 'SLV', name: 'Silver', price: 250000, color: '#2dd4bf', seated: true, onSale: true, perks: 'Baris G-L' },
        { id: 'FES', name: 'Festival (Berdiri)', price: 150000, color: '#fb7185', seated: false, onSale: true, quota: 200, perks: 'Area berdiri, tanpa nomor kursi' }] },
    HALL: { name: 'Summarecon Hall Lt. 3 (112 kursi)', venue: 'Summarecon Hall, Lt. 3 · Summarecon Mall Bandung', layout: HALL, gates: ['Gate Hall Lt. 3'],
      types: [
        { id: 'PRM', name: 'Premium', price: 300000, color: '#f472b6', seated: true, onSale: true, perks: 'Baris A-C' },
        { id: 'REG', name: 'Reguler', price: 175000, color: '#60a5fa', seated: true, onSale: true, perks: 'Baris D-H' }] },
  };
  const NAMES = ['Rizky Pratama', 'Nadia Putri', 'Gilang Ramadhan', 'Salsabila Azzahra', 'Dimas Saputra', 'Ayu Lestari', 'Fajar Nugraha', 'Intan Permata', 'Raka Mahendra', 'Citra Maharani', 'Yoga Prasetyo', 'Tiara Anjani', 'Bagas Wicaksono', 'Rani Safitri', 'Arif Hidayat', 'Dewi Kurniasih', 'Hendra Gunawan', 'Putri Amelia', 'Reza Firmansyah', 'Lina Marlina', 'Aldi Setiawan', 'Mega Puspita', 'Ilham Akbar', 'Sinta Wulandari', 'Teguh Santoso', 'Wulan Sari', 'Kevin Halim', 'Siti Rahmawati', 'Bayu Aji', 'Nurul Fadilah'];
  const METHODS = ['QRIS', 'VA BCA', 'VA Mandiri', 'GoPay', 'OVO', 'DANA', 'Kartu Kredit'];
  function prng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function seed() {
    const t = Date.now();
    const H = 3600000, D = 24 * H;
    const start1 = Math.ceil((t + H) / H) * H; // acara hari ini, 1-2 jam lagi; gate dibuka 2,5 jam sebelumnya -> sudah buka
    const ev1 = { id: 'EVT-01', name: 'Konser Akustik "Senja di Bandung"', tagline: 'Kalandra Trio & Teman · live acoustic session', cat: 'Konser', start: start1, doors: start1 - 2.5 * H, venue: 'Main Atrium, GF · Summarecon Mall Bandung', layout: ATRIUM, desc: 'Malam akustik di bawah kubah Main Atrium. Kursi bernomor untuk VIP, Gold, Silver; area Festival berdiri di belakang. Gate check-in dibuka 2,5 jam sebelum acara.', saleStart: t - 20 * D, saleEnd: start1 - 30 * 60000, status: 'PUBLISHED', holdMin: 8, maxPerOrder: 4, color: '#38bdf8', gates: ['Gate A (Lobby Utama)', 'Gate B (Sisi Food Court)'], blocked: ['L1', 'L18'],
      types: [
        { id: 'VIP', name: 'VIP', price: 750000, color: '#c084fc', seated: true, onSale: true, perks: 'Baris A-B, merchandise, meet & greet' },
        { id: 'GLD', name: 'Gold', price: 450000, color: '#facc15', seated: true, onSale: true, perks: 'Baris C-F, view tengah' },
        { id: 'SLV', name: 'Silver', price: 250000, color: '#2dd4bf', seated: true, onSale: true, perks: 'Baris G-L' },
        { id: 'FES', name: 'Festival (Berdiri)', price: 150000, color: '#fb7185', seated: false, onSale: true, quota: 200, perks: 'Area berdiri belakang, tanpa nomor kursi' },
      ] };
    const ev2 = { id: 'EVT-02', name: 'Bandung Build Challenge 2026 · Demo Day & Awarding', tagline: 'Bandung Innovation Week 2026', cat: 'Teknologi', start: new Date(2026, 10, 15, 13, 0).getTime(), doors: new Date(2026, 10, 15, 11, 30).getTime(), venue: 'Main Atrium, GF · Summarecon Mall Bandung', layout: ATRIUM, desc: 'Demo Day finalis Event Ticketing System dan penganugerahan pemenang. Registrasi gratis dengan kursi bernomor; baris A-B khusus juri & sponsor (undangan).', saleStart: new Date(2026, 9, 26, 9, 0).getTime(), saleEnd: new Date(2026, 10, 15, 12, 0).getTime(), status: 'PUBLISHED', holdMin: 8, maxPerOrder: 2, color: '#4edea3', gates: ['Gate A (Lobby Utama)'], blocked: [],
      types: [
        { id: 'UND', name: 'Undangan Juri & Sponsor', price: 0, color: '#c084fc', seated: true, onSale: false, perks: 'Tidak dijual · undangan panitia' },
        { id: 'UMM', name: 'Umum (Registrasi)', price: 0, color: '#4edea3', seated: true, onSale: true, perks: 'Gratis, wajib registrasi' },
      ] };
    ev2.layout = { stage: ATRIUM.stage, rows: ATRIUM.rows.map((r) => ({ r: r.r, n: r.n, t: r.r <= 'B' ? 'UND' : 'UMM' })) };
    const ev3 = { id: 'EVT-03', name: 'Stand-Up Comedy Night: "Macet Itu Rejeki"', tagline: 'Line-up komika Bandung', cat: 'Komedi', start: new Date(2026, 10, 28, 20, 0).getTime(), doors: new Date(2026, 10, 28, 19, 0).getTime(), venue: 'Summarecon Hall, Lt. 3 · Summarecon Mall Bandung', layout: HALL, fin: { rent: 20000000 }, desc: 'Malam stand-up dengan kursi bernomor. Penjualan dibuka 10 November 2026 pukul 10:00.', saleStart: new Date(2026, 10, 10, 10, 0).getTime(), saleEnd: new Date(2026, 10, 28, 19, 0).getTime(), status: 'PUBLISHED', holdMin: 8, maxPerOrder: 4, color: '#fb923c', gates: ['Gate Hall Lt. 3'], blocked: [],
      types: [
        { id: 'PRM', name: 'Premium', price: 300000, color: '#f472b6', seated: true, onSale: true, perks: 'Baris A-C' },
        { id: 'REG', name: 'Reguler', price: 175000, color: '#60a5fa', seated: true, onSale: true, perks: 'Baris D-H' },
      ] };
    const s = { v: 1, events: { 'EVT-01': ev1, 'EVT-02': ev2, 'EVT-03': ev3 }, order: ['EVT-01', 'EVT-02', 'EVT-03'], seats: { 'EVT-01': {}, 'EVT-02': {}, 'EVT-03': {} }, qholds: { 'EVT-01': [], 'EVT-02': [], 'EVT-03': [] }, orders: {}, tickets: {}, scans: [], outbox: [], waitlist: [], reports: [], seededAt: t };
    const R = prng(20261115);
    let ni = 0;
    const person = () => { const n = NAMES[ni++ % NAMES.length]; const u = n.toLowerCase().replace(/[^a-z]+/g, '.') + (ni > NAMES.length ? Math.ceil(ni / NAMES.length) : ''); return { name: n, email: u + '@example.com', phone: '0812-0000-' + String(1000 + ni).slice(-4) }; };
    const mkOrder = (ev, items, opts) => {
      const p = person();
      const id = 'BK-' + rand(6);
      items.forEach((it) => (it.price = typeById(ev, it.type).price));
      const sub = items.reduce((a, it) => a + it.price, 0);
      const fee = sub > 0 ? FEE * items.length : 0;
      const paidAt = opts.paidAt || t - Math.floor(R() * 18 * D) - H;
      const o = { id, ev: ev.id, cart: 'SEED', ...p, items, sub, fee, total: sub + fee, status: opts.status || 'PAID', method: sub ? METHODS[Math.floor(R() * METHODS.length)] : 'Gratis', createdAt: paidAt - 4 * 60000, paidAt: opts.status === 'PENDING' ? null : paidAt, until: opts.until || null, tickets: [], log: [] };
      s.orders[id] = o;
      if (o.status === 'PAID' || o.status === 'REFUNDED') {
        items.forEach((it) => {
          const tid = 'T-' + rand(7);
          const tk = { id: tid, order: id, ev: ev.id, type: it.type, seat: it.seat || null, holder: p.name, status: o.status === 'PAID' ? 'ACTIVE' : 'VOID', checkedInAt: null, gate: null };
          s.tickets[tid] = tk; o.tickets.push(tid);
          if (it.seat && o.status === 'PAID') s.seats[ev.id][it.seat] = { st: 'SOLD', order: id };
        });
      } else if (o.status === 'PENDING') {
        items.forEach((it) => { if (it.seat) s.seats[ev.id][it.seat] = { st: 'HELD', order: id, cart: 'SEED-' + id, until: o.until }; });
      }
      return o;
    };
    // EVT-01: penjualan berjalan
    const prob = { VIP: 0.78, GLD: 0.66, SLV: 0.48 };
    ev1.layout.rows.forEach((row) => {
      let c = 1;
      while (c <= row.n) {
        const k = 1 + Math.floor(R() * 4);
        const seats = [];
        for (let j = 0; j < k && c <= row.n; j++, c++) { const id = row.r + c; if (!ev1.blocked.includes(id)) seats.push(id); }
        if (seats.length && R() < prob[row.t]) mkOrder(ev1, seats.map((x) => ({ type: row.t, seat: x })), {});
      }
    });
    for (let i = 0; i < 34; i++) { const q = 1 + Math.floor(R() * 4); mkOrder(ev1, Array.from({ length: q }, () => ({ type: 'FES' })), {}); }
    // Pesanan pengunjung lain yang sedang menunggu pembayaran (kursi "sedang dipesan")
    const freeSeats = (rowIds, n) => { const out = []; ev1.layout.rows.filter((r) => rowIds.includes(r.r)).forEach((r) => { for (let c = 1; c <= r.n && out.length < n; c++) { const id = r.r + c; if (!s.seats['EVT-01'][id] && !ev1.blocked.includes(id)) out.push(id); } }); return out; };
    mkOrder(ev1, freeSeats(['D'], 2).map((x) => ({ type: 'GLD', seat: x })), { status: 'PENDING', until: t + 6 * 60000 });
    mkOrder(ev1, freeSeats(['B'], 2).map((x) => ({ type: 'VIP', seat: x })), { status: 'PENDING', until: t + 11 * 60000 });
    const ex = mkOrder(ev1, [{ type: 'SLV', seat: null }], { status: 'EXPIRED' }); ex.items = [{ type: 'SLV', seat: 'K7' }];
    mkOrder(ev1, freeSeats(['E'], 1).map((x) => ({ type: 'GLD', seat: x })), { status: 'REFUNDED' }).refundReason = 'Berhalangan hadir (diajukan H-3)';
    // Sebagian tiket sudah check-in
    const g = ev1.gates;
    Object.values(s.tickets).filter((tk) => tk.ev === 'EVT-01' && tk.status === 'ACTIVE').forEach((tk) => {
      if (R() < 0.28) { tk.checkedInAt = t - Math.floor(R() * 25 * 60000); tk.gate = g[R() < 0.6 ? 0 : 1]; s.scans.push({ ts: tk.checkedInAt, ev: 'EVT-01', gate: tk.gate, result: 'VALID', ticket: tk.id, reason: 'Check-in berhasil' }); }
    });
    s.scans.push({ ts: t - 9 * 60000, ev: 'EVT-01', gate: g[0], result: 'INVALID', ticket: null, reason: 'Tanda tangan QR tidak cocok (indikasi QR palsu/diubah)' });
    const used = Object.values(s.tickets).find((tk) => tk.checkedInAt);
    if (used) s.scans.push({ ts: t - 4 * 60000, ev: 'EVT-01', gate: g[1], result: 'USED', ticket: used.id, reason: 'Tiket sudah digunakan ' + fmtTime(used.checkedInAt) + ' di ' + used.gate });
    s.scans.sort((a, b) => b.ts - a.ts);
    // EVT-02: registrasi gratis
    ev2.layout.rows.filter((r) => r.t === 'UMM').forEach((row) => {
      for (let c = 1; c <= row.n; c += 2) if (R() < 0.42) mkOrder(ev2, [row.r + c, row.r + (c + 1)].filter((x, i) => c + i <= row.n).map((x) => ({ type: 'UMM', seat: x })), {});
    });
    seedMore(s, t, mkOrder, R);
    // Notifikasi contoh
    Object.values(s.orders).filter((o) => o.status === 'PAID').slice(0, 4).forEach((o) => {
      s.outbox.push({ ts: o.paidAt, ch: 'Email', to: o.email, order: o.id, subject: 'E-ticket ' + s.events[o.ev].name, body: 'Pembayaran diterima. ' + o.tickets.length + ' e-ticket terlampir.' });
      s.outbox.push({ ts: o.paidAt + 2000, ch: 'WhatsApp', to: o.phone, order: o.id, subject: 'E-ticket', body: 'Halo ' + o.name + ', e-ticket Anda (' + o.id + ') sudah terbit.' });
    });
    s.outbox.sort((a, b) => b.ts - a.ts);
    return s;
  }

  // Acara contoh tambahan untuk beranda portal (EVT-04..12): tersebar di area mal & kategori, jadwal relatif terhadap
  // waktu seed (hari ini, akhir pekan, minggu ini) agar beranda selalu terisi. Foto demo di app/img/demo (lihat CREDITS.md).
  const IMG = (f) => '/app/img/demo/' + f + '.jpg';
  const AREA = {
    atrium: 'Main Atrium, GF · Summarecon Mall Bandung',
    hall: 'Summarecon Hall, Lt. 3 · Summarecon Mall Bandung',
    plaza: 'Outdoor Plaza, GF · Summarecon Mall Bandung',
    expo: 'Exhibition Hall, Lt. 1 · Summarecon Mall Bandung',
    kids: 'Kids Zone, Lt. 2 · Summarecon Mall Bandung',
  };
  const GATES = { atrium: ['Gate A (Lobby Utama)', 'Gate B (Sisi Food Court)'], hall: ['Gate Hall Lt. 3'], plaza: ['Gate Plaza Timur'], expo: ['Gate Exhibition Lt. 1'], kids: ['Gate Kids Zone'] };
  function seedMore(s, t, mkOrder, R) {
    const H = 3600000, D = 24 * H;
    const day = (d, h, m) => { const x = new Date(t); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() + d); x.setHours(h, m || 0); return x.getTime(); };
    const toSat = (6 - new Date(t).getDay() + 7) % 7 || 7; // Sabtu berikutnya (bukan hari ini)
    const soon = (h) => Math.ceil((t + h * H) / H) * H;
    const open = (o) => ({ id: o.id, name: o.name, tagline: o.tagline, cat: o.cat, start: o.start, doors: o.start - (o.doorsH || 1) * H, venue: AREA[o.area], img: IMG(o.img),
      layout: o.layout || { stage: o.stage || 'AREA ACARA', rows: [] }, desc: o.desc, saleStart: t - 10 * D, saleEnd: o.start - H / 2, status: 'PUBLISHED',
      holdMin: 8, maxPerOrder: o.max || 6, color: o.color, gates: GATES[o.area], blocked: [], types: o.types });
    const fes = (id, name, price, quota, perks, color) => ({ id, name, price, color, seated: false, onSale: true, quota, perks });
    const evs = [
      open({ id: 'EVT-04', name: 'Bazar Kuliner Nusantara', tagline: '60+ tenant jajanan dari Sabang sampai Merauke', cat: 'Kuliner', area: 'plaza', img: 'ev-kuliner', color: '#f59e0b', start: soon(2), doorsH: 0.5,
        desc: 'Bazar kuliner malam di Outdoor Plaza. Tiket masuk sudah termasuk satu minuman; Paket Kuliner berisi voucher jajan Rp50.000 yang berlaku di semua tenant bazar.',
        types: [fes('MSK', 'Tiket Masuk', 25000, 200, 'Termasuk 1 minuman', '#f59e0b'), fes('PKT', 'Paket Kuliner', 60000, 40, 'Tiket masuk + voucher jajan Rp50.000', '#fb7185')] }),
      open({ id: 'EVT-05', name: 'Pameran Kendaraan Listrik Bandung 2026', tagline: 'Mobil & motor listrik terbaru, test ride di area parkir', cat: 'Pameran', area: 'expo', img: 'ev-mobil-listrik', color: '#22c55e', start: day(toSat, 10),
        desc: 'Pameran kendaraan listrik dengan 20 peserta pameran. Tiket Test Ride berlaku untuk satu sesi uji kendara 15 menit; bawa SIM yang masih berlaku.',
        types: [fes('HRN', 'Tiket Harian', 35000, 300, 'Akses pameran sepanjang hari', '#22c55e'), fes('TRD', 'Test Ride + Tiket', 75000, 20, 'Satu sesi uji kendara 15 menit, wajib SIM', '#38bdf8')] }),
      open({ id: 'EVT-06', name: 'Workshop Lukis Cat Air untuk Anak', tagline: 'Usia 5-12 tahun, semua alat disediakan', cat: 'Anak', area: 'kids', img: 'ev-lukis-anak', color: '#ec4899', start: day(toSat, 10), max: 3,
        desc: 'Kelas melukis cat air 90 menit bersama ilustrator lokal. Kuas, cat, kertas, dan celemek disediakan; hasil karya dibawa pulang. Satu pendamping boleh menunggu di area Kids Zone.',
        types: [fes('ANK', 'Peserta Anak', 120000, 16, 'Usia 5-12 tahun, termasuk alat lukis', '#ec4899')] }),
      open({ id: 'EVT-07', name: 'Bandung Jazz Night', tagline: 'Malam jazz bersama kuartet & big band Bandung', cat: 'Konser', area: 'atrium', img: 'ev-jazz', color: '#6366f1', start: day(toSat + 1, 19, 30), doorsH: 1.5, layout: ATRIUM, max: 4,
        desc: 'Konser jazz dua sesi di Main Atrium. Kursi bernomor untuk VIP, Gold, dan Silver; area Festival berdiri di belakang.',
        types: [{ id: 'VIP', name: 'VIP', price: 550000, color: '#c084fc', seated: true, onSale: true, perks: 'Baris A-B, welcome drink' }, { id: 'GLD', name: 'Gold', price: 350000, color: '#facc15', seated: true, onSale: true, perks: 'Baris C-F' }, { id: 'SLV', name: 'Silver', price: 200000, color: '#2dd4bf', seated: true, onSale: true, perks: 'Baris G-L' }, fes('FES', 'Festival (Berdiri)', 120000, 200, 'Area berdiri belakang, tanpa nomor kursi', '#fb7185')] }),
      open({ id: 'EVT-08', name: 'Zumba Party Sabtu Pagi', tagline: 'Olahraga bareng 60 menit, cocok untuk semua umur', cat: 'Olahraga', area: 'plaza', img: 'ev-zumba', color: '#14b8a6', start: day(toSat, 7),
        desc: 'Zumba bersama instruktur bersertifikat di Outdoor Plaza. Tiket termasuk air mineral dan handuk kecil.',
        types: [fes('PST', 'Peserta', 50000, 60, 'Termasuk air mineral & handuk', '#14b8a6')] }),
      open({ id: 'EVT-09', name: 'Pameran Seni Rupa "Garis Kota"', tagline: '40 karya perupa muda Bandung', cat: 'Pameran', area: 'expo', img: 'ev-pameran-seni', color: '#a855f7', start: day(2, 10),
        desc: 'Pameran lukisan, fotografi, dan instalasi tentang wajah kota Bandung. Tur Kurator berlangsung pukul 15:00 untuk kelompok kecil.',
        types: [fes('MSK', 'Tiket Masuk', 20000, 150, 'Akses pameran', '#a855f7'), fes('TUR', 'Tur Kurator', 50000, 20, 'Tur 45 menit pukul 15:00', '#f472b6')] }),
      open({ id: 'EVT-10', name: 'Turnamen Esports Antar-SMA Bandung', tagline: 'Final 8 tim, nonton langsung di layar besar', cat: 'Esports', area: 'hall', img: 'ev-esports', color: '#0ea5e9', start: day(5, 13), layout: HALL,
        desc: 'Babak final turnamen esports pelajar se-Bandung. Kursi bernomor; Tribun Depan termasuk merchandise turnamen.',
        types: [{ id: 'PRM', name: 'Tribun Depan', price: 75000, color: '#f472b6', seated: true, onSale: true, perks: 'Baris A-C, merchandise' }, { id: 'REG', name: 'Tribun', price: 35000, color: '#60a5fa', seated: true, onSale: true, perks: 'Baris D-H' }] }),
      open({ id: 'EVT-11', name: 'Teater Boneka "Si Kancil"', tagline: 'Pertunjukan keluarga 60 menit', cat: 'Anak', area: 'hall', img: 'ev-teater-anak', color: '#f97316', start: day(toSat + 1, 10), layout: HALL, max: 5,
        desc: 'Teater boneka dengan cerita rakyat Si Kancil untuk anak dan keluarga. Anak di bawah 2 tahun tidak perlu tiket bila dipangku.',
        types: [{ id: 'PRM', name: 'Keluarga Depan', price: 120000, color: '#f472b6', seated: true, onSale: true, perks: 'Baris A-C' }, { id: 'REG', name: 'Reguler', price: 80000, color: '#60a5fa', seated: true, onSale: true, perks: 'Baris D-H' }] }),
      open({ id: 'EVT-12', name: 'Festival Kopi Priangan', tagline: 'Kopi dari 30 roastery Jawa Barat', cat: 'Kuliner', area: 'plaza', img: 'ev-kopi', color: '#a16207', start: day(9, 10),
        desc: 'Festival kopi dengan sesi cupping gratis tiap jam. Kelas Seduh Manual berlangsung 90 menit bersama barista juara regional.',
        types: [fes('MSK', 'Tiket Masuk', 30000, 250, 'Termasuk 2 cupping', '#a16207'), fes('KLS', 'Kelas Seduh Manual', 150000, 25, 'Kelas 90 menit, alat disediakan', '#f59e0b')] }),
    ];
    evs.forEach((e) => { s.events[e.id] = e; s.order.push(e.id); s.seats[e.id] = {}; s.qholds[e.id] = []; });
    Object.assign(s.events['EVT-01'], { img: IMG('ev-akustik') });
    Object.assign(s.events['EVT-02'], { img: IMG('ev-demoday') });
    Object.assign(s.events['EVT-03'], { img: IMG('ev-komedi') });
    // Penjualan contoh: beberapa acara hampir habis (muncul di "Laku keras")
    const sell = (ev, type, n) => { let left = n; while (left > 0) { const q = Math.min(left, 1 + Math.floor(R() * 3)); mkOrder(ev, Array.from({ length: q }, () => ({ type })), {}); left -= q; } };
    const sellSeats = (ev, prob) => ev.layout.rows.forEach((row) => { let c = 1; while (c <= row.n) { const k = 1 + Math.floor(R() * 4); const seats = []; for (let j = 0; j < k && c <= row.n; j++, c++) seats.push(row.r + c); if (R() < prob[row.t]) mkOrder(ev, seats.map((x) => ({ type: row.t, seat: x })), {}); } });
    const E = (id) => s.events[id];
    // Jumlah dijaga kecil: setiap pesanan menambah ukuran state yang dikirim ke semua perangkat (kuota gratis Vercel/Upstash).
    sell(E('EVT-04'), 'MSK', 40); sell(E('EVT-04'), 'PKT', 33);
    sell(E('EVT-05'), 'HRN', 45); sell(E('EVT-05'), 'TRD', 13);
    sell(E('EVT-06'), 'ANK', 14);
    sellSeats(E('EVT-07'), { VIP: 0.35, GLD: 0.2, SLV: 0.1 });
    sell(E('EVT-08'), 'PST', 49);
    sell(E('EVT-09'), 'MSK', 18); sell(E('EVT-09'), 'TUR', 6);
    sellSeats(E('EVT-10'), { PRM: 0.3, REG: 0.12 });
    sellSeats(E('EVT-11'), { PRM: 0.9, REG: 0.75 });
    sell(E('EVT-12'), 'MSK', 12); sell(E('EVT-12'), 'KLS', 4);
  }

  // ------------------------------------------------------------------ query helpers (read-only)
  const ev = (id) => state.events[id];
  function typeById(e, id) { return e.types.find((x) => x.id === id) || { id, name: id, price: 0, color: '#888' }; }
  function seatType(e, seatId) { const r = e.layout.rows.find((x) => seatId.startsWith(x.r) && /^\d+$/.test(seatId.slice(x.r.length))); return r ? r.t : null; }
  function allSeats(e) { const out = []; e.layout.rows.forEach((r) => { for (let c = 1; c <= r.n; c++) out.push(r.r + c); }); return out; }
  function saleState(e, t) {
    t = t || now();
    if (e.status === 'DRAFT') return { open: false, label: 'Draft', cls: 'muted' };
    if (e.status === 'CLOSED') return { open: false, label: 'Penjualan ditutup', cls: 'muted' };
    if (e.status === 'CANCELLED') return { open: false, label: 'Acara dibatalkan', cls: 'muted' };
    if (t < e.saleStart) return { open: false, label: 'Dibuka ' + fmtDT(e.saleStart), cls: 'soon' };
    if (t > e.saleEnd) return { open: false, label: 'Penjualan berakhir', cls: 'muted' };
    return { open: true, label: 'Penjualan dibuka', cls: 'open' };
  }
  function seatStatus(evId, seatId, cart, t) {
    t = t || now();
    const e = ev(evId);
    const ty = typeById(e, seatType(e, seatId));
    const x = state.seats[evId][seatId];
    if (x && x.st === 'SOLD') return 'sold';
    if (x && x.st === 'HELD' && x.until > t) return x.cart === cart && !x.order ? 'mine' : 'held';
    if (e.blocked.includes(seatId) || !ty.onSale) return 'blocked';
    return 'available';
  }
  function soldQty(evId, typeId) { return Object.values(state.orders).filter((o) => o.ev === evId && o.status === 'PAID').reduce((a, o) => a + o.items.filter((i) => i.type === typeId).length, 0); }
  function heldQty(evId, typeId, t, exceptCart) { return (state.qholds[evId] || []).filter((h) => h.type === typeId && h.until > t && h.cart !== exceptCart).reduce((a, h) => a + h.qty, 0); }
  function stats(evId) {
    const e = ev(evId), t = now();
    const per = {};
    e.types.forEach((ty) => (per[ty.id] = { type: ty, total: 0, sold: 0, held: 0, blocked: 0, available: 0, checkedIn: 0 }));
    if (e.layout) allSeats(e).forEach((sid) => {
      const tyId = seatType(e, sid); const p = per[tyId]; if (!p) return;
      p.total++;
      const st = seatStatus(evId, sid, null, t);
      if (st === 'sold') p.sold++; else if (st === 'held') p.held++; else if (st === 'blocked') p.blocked++; else p.available++;
    });
    e.types.filter((ty) => !ty.seated).forEach((ty) => { const p = per[ty.id]; p.total = ty.quota; p.sold = soldQty(evId, ty.id); p.held = heldQty(evId, ty.id, t); p.available = Math.max(0, ty.quota - p.sold - p.held); });
    const tks = Object.values(state.tickets).filter((x) => x.ev === evId && x.status === 'ACTIVE');
    tks.forEach((x) => { if (x.checkedInAt && per[x.type]) per[x.type].checkedIn++; });
    const orders = Object.values(state.orders).filter((o) => o.ev === evId);
    const paid = orders.filter((o) => o.status === 'PAID');
    const sum = (k) => Object.values(per).reduce((a, p) => a + p[k], 0);
    return { per, total: sum('total'), sold: sum('sold'), held: sum('held'), blocked: sum('blocked'), available: sum('available'), checkedIn: tks.filter((x) => x.checkedInAt).length, tickets: tks.length, orders, paid, revenue: paid.reduce((a, o) => a + o.total, 0), registrants: new Set(paid.map((o) => o.email.toLowerCase())).size, pending: orders.filter((o) => o.status === 'PENDING' && o.until > t).length };
  }
  function cartHolds(evId, cart, t) {
    t = t || now();
    const seats = Object.entries(state.seats[evId] || {}).filter(([, x]) => x.st === 'HELD' && x.cart === cart && !x.order && x.until > t).map(([sid, x]) => ({ seat: sid, type: seatType(ev(evId), sid), until: x.until }));
    const q = (state.qholds[evId] || []).filter((h) => h.cart === cart && !h.order && h.until > t);
    const items = seats.map((x) => ({ type: x.type, seat: x.seat })).concat(...q.map((h) => Array.from({ length: h.qty }, () => ({ type: h.type, seat: null }))));
    const until = Math.min(...seats.map((x) => x.until).concat(q.map((h) => h.until)), Infinity);
    return { items, until: isFinite(until) ? until : null };
  }
  // Rekonsiliasi & ROI (Finance & Marketing). Murni baca: memakai angka yang tercatat di pesanan, bukan harga terbaru.
  function finance(evId) {
    const e = ev(evId), t = now();
    const orders = Object.values(state.orders).filter((o) => o.ev === evId && (o.status === 'PAID' || o.status === 'REFUNDED'));
    const totals = { orders: orders.length, gross: 0, refunded: 0, net: 0, fee: 0, ticket: 0 }; // ticket = subtotal lunas (tanpa biaya layanan)
    const byM = {}, byT = {}, mismatches = [];
    orders.forEach((o) => {
      const m = byM[o.method || '-'] = byM[o.method || '-'] || { method: o.method || '-', orders: 0, gross: 0, refunded: 0, net: 0 };
      m.orders++; m.gross += o.total; totals.gross += o.total;
      const tks = o.tickets.map((id) => state.tickets[id]);
      if (o.status === 'REFUNDED') {
        m.refunded += o.total; totals.refunded += o.total;
        if (tks.some((x) => !x || x.status !== 'VOID')) mismatches.push({ order: o.id, reason: 'Pesanan refund masih punya e-ticket aktif.' });
        return;
      }
      totals.fee += o.fee || 0; totals.ticket += o.sub || 0;
      // Harga per item saat beli (it.price). Pesanan lama tanpa it.price: subtotal dibagi sebanding harga jenis saat ini.
      const cur = o.items.reduce((a, it) => a + typeById(e, it.type).price, 0);
      o.items.forEach((it) => {
        const unit = it.price != null ? it.price : cur > 0 ? (o.sub || 0) * typeById(e, it.type).price / cur : (o.sub || 0) / o.items.length;
        const b = byT[it.type] = byT[it.type] || { type: it.type, name: typeById(e, it.type).name, qty: 0, gross: 0 }; b.qty++; b.gross += unit;
      });
      if (o.total !== (o.sub || 0) + (o.fee || 0)) mismatches.push({ order: o.id, reason: 'Total ' + rp(o.total) + ' tidak sama dengan subtotal + biaya layanan.' });
      else if (tks.length !== o.items.length) mismatches.push({ order: o.id, reason: 'Jumlah e-ticket (' + tks.length + ') tidak sama dengan jumlah tiket dipesan (' + o.items.length + ').' });
      else if (tks.some((x) => !x || x.status !== 'ACTIVE')) mismatches.push({ order: o.id, reason: 'Pesanan lunas punya e-ticket yang tidak aktif.' });
    });
    Object.values(byM).forEach((m) => (m.net = m.gross - m.refunded));
    totals.net = totals.gross - totals.refunded;
    const fin = Object.assign({}, FIN_DEFAULT, e.fin);
    const tks = Object.values(state.tickets).filter((x) => x.ev === evId && x.status === 'ACTIVE');
    const started = e.start <= t;
    const attendees = started ? tks.filter((x) => x.checkedInAt).length : tks.length;
    const share = Math.round(totals.ticket * fin.revShare); // bagi hasil dari pendapatan tiket; biaya layanan milik platform
    const benefit = fin.rent + share;
    const roi = { rent: fin.rent, revShare: fin.revShare, share, cost: fin.cost, benefit, roi: fin.cost > 0 ? (benefit - fin.cost) / fin.cost : null, attendees, basis: started ? 'check-in' : 'tiket terjual', spend: fin.spend, tenantSpend: attendees * fin.spend };
    return { totals, byMethod: Object.values(byM).sort((a, b) => b.net - a.net), byType: Object.values(byT).map((b) => Object.assign(b, { gross: Math.round(b.gross) })), mismatches, roi };
  }
  // Anomali gate (SOP-EVT-03): >= 3 pindaian gagal/duplikat per gate dalam `mins` menit terakhir
  const ANOM_MIN = 3, CLAIM_MS = 60000, REPORT_MS = 30 * 60000;
  function anomaliesIn(d, evId, mins, t) {
    const from = t - (mins || 10) * 60000, by = {};
    d.scans.filter((s) => s.ev === evId && s.ts > from && s.result !== 'VALID' && !s.test).forEach((s) => { by[s.gate] = (by[s.gate] || 0) + 1; });
    return Object.entries(by).filter(([, n]) => n >= ANOM_MIN).map(([gate, n]) => ({ gate, n }));
  }
  // Laporan boleh diklaim CC bila belum punya tiket insiden dan belum diklaim, atau klaimnya menggantung > 60 detik
  const claimable = (r, t) => !r.ticketId && (!r.claimedBy || t - (r.claimedAt || 0) > CLAIM_MS);
  function price(e, items) { const sub = items.reduce((a, i) => a + typeById(e, i.type).price, 0); const fee = sub > 0 ? FEE * items.length : 0; return { sub, fee, total: sub + fee }; }

  // ------------------------------------------------------------------ mutasi internal (dipanggil di dalam tx)
  function release(d, o) {
    o.items.forEach((it) => { if (it.seat) { const x = d.seats[o.ev][it.seat]; if (x && x.order === o.id) delete d.seats[o.ev][it.seat]; } });
    d.qholds[o.ev] = (d.qholds[o.ev] || []).filter((h) => h.order !== o.id);
  }
  function sweep(d, t) {
    Object.values(d.orders).forEach((o) => { if (o.status === 'PENDING' && o.until < t) { o.status = 'EXPIRED'; o.log.push({ ts: t, text: 'Batas waktu pembayaran habis, kursi dilepas' }); release(d, o); wakeWaitlist(d, o, 'kedaluwarsa', t); } });
    Object.keys(d.seats).forEach((eid) => Object.entries(d.seats[eid]).forEach(([sid, x]) => { if (x.st === 'HELD' && x.until < t) delete d.seats[eid][sid]; }));
    Object.keys(d.qholds).forEach((eid) => (d.qholds[eid] = d.qholds[eid].filter((h) => h.until >= t)));
  }
  function notify(d, o, subject, body, t) {
    d.outbox.unshift({ ts: t, ch: 'Email', to: o.email, order: o.id, subject, body });
    d.outbox.unshift({ ts: t + 1, ch: 'WhatsApp', to: o.phone, order: o.id, subject, body });
    d.outbox = d.outbox.slice(0, 400);
  }
  // Daftar tunggu: pesan ke kontak (email bila ada '@', selain itu WhatsApp)
  function waitMsg(d, w, subject, body, t) {
    d.outbox.unshift({ ts: t, ch: /@/.test(w.contact) ? 'Email' : 'WhatsApp', to: w.contact, order: w.id, subject, body });
    d.outbox = d.outbox.slice(0, 400);
  }
  // Kursi/kuota pesanan o kembali tersedia: kabari antrean jenis yang sama (FIFO) sebanyak tiket yang dilepas
  function wakeWaitlist(d, o, reason, t) {
    const e = d.events[o.ev]; if (!e || e.status !== 'PUBLISHED' || t > e.saleEnd) return 0; // penjualan tutup/batal: kursi tak bisa dibeli, jangan kabari
    const freed = {}; o.items.forEach((it) => (freed[it.type] = (freed[it.type] || 0) + 1));
    let n = 0;
    Object.entries(freed).forEach(([type, qty]) => {
      let covered = 0;
      (d.waitlist || []).filter((w) => w.ev === o.ev && w.type === type && !w.notified).sort((a, b) => a.ts - b.ts).forEach((w) => {
        if (covered >= qty) return;
        w.notified = t; w.reason = reason; covered += w.qty || 1; n++;
        waitMsg(d, w, 'Kursi tersedia · ' + e.name, `Halo ${w.name}, ada ${qty} tiket ${typeById(e, type).name} yang kembali tersedia. Segera pesan sebelum habis.`, t);
      });
    });
    return n;
  }
  function issue(d, o, method, t) {
    o.status = 'PAID'; o.paidAt = t; o.method = method; o.until = null;
    const e = d.events[o.ev];
    o.items.forEach((it) => {
      if (it.seat) d.seats[o.ev][it.seat] = { st: 'SOLD', order: o.id };
      const tid = 'T-' + rand(7);
      d.tickets[tid] = { id: tid, order: o.id, ev: o.ev, type: it.type, seat: it.seat || null, holder: it.holder || o.name, status: 'ACTIVE', checkedInAt: null, gate: null };
      o.tickets.push(tid);
    });
    d.qholds[o.ev] = d.qholds[o.ev].filter((h) => h.order !== o.id);
    o.log.push({ ts: t, text: (o.total ? 'Pembayaran ' + method + ' berhasil (sandbox)' : 'Registrasi gratis dikonfirmasi') + ', ' + o.tickets.length + ' e-ticket terbit' });
    notify(d, o, 'E-ticket ' + e.name, `Halo ${o.name}, ${o.total ? 'pembayaran ' + rp(o.total) + ' diterima' : 'registrasi Anda dikonfirmasi'}. ${o.tickets.length} e-ticket (QR) untuk ${e.name}, ${fmtDT(e.start)}, ${e.venue}. Kode booking ${o.id}.`, t);
  }

  // ------------------------------------------------------------------ backend: server LAN atau localStorage
  const local = {
    read() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || { version: 0, state: null }; } catch (e) { return { version: 0, state: null }; } },
    async get() { return this.read(); },
    // versi disimpan juga di kunci kecil terpisah agar tab lain cukup membaca angka saat polling
    ver() { return +(localStorage.getItem(LS_KEY + ':ver') || 0); },
    async commit(base, st) { const cur = this.read(); if (cur.version !== base) return { ok: false, version: cur.version, state: cur.state }; localStorage.setItem(LS_KEY, JSON.stringify({ version: base + 1, state: st })); localStorage.setItem(LS_KEY + ':ver', String(base + 1)); return { ok: true, version: base + 1 }; },
    async reset() { localStorage.removeItem(LS_KEY); localStorage.setItem(LS_KEY + ':ver', String(Date.now())); return { ok: true }; },
  };
  const server = {
    async get(known) { const r = await fetch(API + (known != null ? '?v=' + known : ''), { cache: 'no-store' }); return r.json(); },
    async commit(base, st) { const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base, state: st }) }); const j = await r.json().catch(() => ({})); return Object.assign({ ok: r.ok, status: r.status }, j); },
    async reset() { const r = await fetch('/api/evt/reset', { method: 'POST', body: '{}' }); const j = await r.json().catch(() => ({})); if (!r.ok || j.ok === false) throw new Error(j.error || 'Reset ditolak server (' + r.status + ')'); return j; },
  };
  const backend = () => (mode === 'server' ? server : local);
  function adopt(j) { if (j.now) offset = j.now - Date.now(); if ('state' in j) { version = j.version; state = j.state; return true; } return false; }

  function emit() { subs.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); }

  const NOOP = { noop: true }; // penanda mutasi tanpa perubahan
  async function tx(mut, opts) {
    for (let i = 0; i < 8; i++) {
      const base = version;
      const d = clone(state);
      const t = now();
      sweep(d, t);
      const res = mut(d, t); // EvtError = aturan bisnis menolak; tidak ada commit
      if (res === NOOP) return null; // tidak ada perubahan: jangan commit (mencegah versi naik tanpa guna)
      const r = await backend().commit(base, d);
      if (r.ok) { version = r.version; state = d; if (r.now) offset = r.now - Date.now(); pollFast(); emit(); return res; }
      if (r.status === 403 || r.status === 401) fail(r.error || 'Perubahan ini butuh login peran yang sesuai.'); // ditolak server: jangan diulang
      // kalah balapan: ambil state terbaru, jalankan ulang aturan di atasnya
      adopt(r); if (opts && opts.onConflict) opts.onConflict(i + 1);
    }
    fail('Server sedang sibuk. Coba lagi sebentar lagi.');
  }

  // State kosong (pertama kali / di-reset dari perangkat lain) -> buat data contoh; bila perangkat lain lebih dulu, pakai miliknya
  async function ensureSeed() {
    for (let i = 0; i < 5 && (!state || state.v !== 1); i++) {
      const s = seed();
      const r = await backend().commit(version, s);
      if (r.ok) { version = r.version; state = s; } else adopt(r);
    }
  }

  // Server LAN tersedia? Dicoba beberapa kali agar jaringan lambat (Wi-Fi ponsel) tidak jatuh ke mode lokal.
  async function probe(tries, ms) {
    if (!location.protocol.startsWith('http')) return false;
    for (let i = 0; i < tries; i++) {
      try {
        const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), ms);
        const r = await fetch('/api/health', { cache: 'no-store', signal: ctl.signal }); clearTimeout(to);
        if (r.ok) { const j = await r.json(); if (j.ok) { if (j.poll) poll = Object.assign({}, poll, j.poll); return true; } }
        if (r.status === 404 || r.status === 501) return false; // server statis biasa (bukan server.js)
      } catch (e) { /* timeout/jaringan: coba lagi */ }
    }
    return false;
  }
  let busy = false, serverHint = false;
  // Jadwal tarik dari server, ditentukan server lewat /api/health {poll:{min,max,hidden}} (ms).
  // LAN: tiap 1 detik, juga saat tab tersembunyi. Vercel: min saat ada perubahan, melambat x1,5 sampai max
  // saat sepi, dan berhenti saat tab tersembunyi (hemat kuota gratis). Kebenaran tetap dijamin CAS, bukan polling.
  let poll = { min: 1000, max: 1000, hidden: true }, delay = 0, nextAt = 0;
  // Server tidak terjangkau (server dimatikan, Wi-Fi putus): coba lagi dengan jeda makin panjang (2, 4, 8 ... maks 30 dtk)
  // alih-alih tiap detik, dan tampilkan banner "Koneksi ke server terputus" setelah 2 kali gagal berturut-turut.
  const OFFLINE_AFTER = 2, OFFLINE_MAX_MS = 30000;
  let fails = 0;
  function pollFast() { delay = poll.min; nextAt = Date.now() + poll.min; }
  function setFails(n) { const was = fails >= OFFLINE_AFTER; fails = n; if (was !== (fails >= OFFLINE_AFTER)) emit(); }
  // Tarik perubahan dari perangkat/tab lain. Dipanggil berkala, saat tab kembali aktif, dan saat event storage.
  // Mengembalikan true bila ada perubahan, 'error' bila server tidak terjangkau.
  async function pull() {
    if (busy) return false; busy = true;
    try {
      if (mode === 'server') { const j = await server.get(version); setFails(0); if (adopt(j)) { await ensureSeed(); emit(); return true; } }
      else if (local.ver() !== version || !state) { const j = local.read(); if (j.version !== version || !state) { adopt(j); await ensureSeed(); emit(); return true; } }
    } catch (e) {
      if (mode === 'server') { setFails(fails + 1); return 'error'; }
    } finally { busy = false; }
    return false;
  }
  async function pollTick() {
    if (mode !== 'server') return pull();
    if ((document.hidden && !poll.hidden) || Date.now() < nextAt || busy) return;
    const r = await pull();
    if (r === 'error') delay = Math.min(OFFLINE_MAX_MS, poll.min * 2 ** fails);
    else delay = r ? poll.min : Math.min(poll.max, Math.round((delay || poll.min) * 1.5));
    nextAt = Date.now() + delay;
  }
  const pullNow = () => { pollFast(); pull(); };
  async function init() {
    if (ready) return ready;
    ready = (async () => {
      mode = (await probe(3, 2500)) ? 'server' : 'lokal';
      adopt(Object.assign({ state: null }, await backend().get()));
      await ensureSeed();
      if (mode === 'lokal' && !localStorage.getItem(LS_KEY + ':ver')) localStorage.setItem(LS_KEY + ':ver', String(version));
      setInterval(pollTick, mode === 'server' ? 250 : 700);
      if (mode === 'lokal') {
        window.addEventListener('storage', (e) => { if (!e.key || e.key.startsWith(LS_KEY)) pull(); });
        // Halaman dibuka lewat http tetapi tanpa server.js: cek berkala apakah server.js sudah berjalan
        if (location.protocol.startsWith('http')) setInterval(async () => { if (!serverHint && (await probe(1, 2000))) { serverHint = true; emit(); } }, 10000);
      }
      document.addEventListener('visibilitychange', () => { if (!document.hidden) pullNow(); });
      window.addEventListener('focus', pullNow);
      emit();
    })();
    return ready;
  }
  // Banner peringatan mode lokal (dipakai portal, konsol pengelola, check-in)
  // Data contoh dibuat > 12 jam lalu: jadwal acara contoh (relatif terhadap waktu seed) sudah lewat, perlu Reset sebelum demo
  const STALE_MS = 12 * 3600000;
  const demoStale = () => !!(state && state.seededAt && now() - state.seededAt > STALE_MS);
  function modeBanner() {
    if (mode === 'server' && fails >= OFFLINE_AFTER) return `<div class="card p-3 mb-4 border border-rose-500/30 bg-rose-500/10 font-body-sm text-body-sm flex flex-wrap items-center gap-2" data-mode-banner role="status">
      <span class="material-symbols-outlined text-rose-300 text-[20px]">cloud_off</span>
      <span class="flex-1 min-w-[220px]"><b class="text-rose-300">Koneksi ke server terputus.</b> Data di layar mungkin sudah tidak terbaru dan perubahan belum bisa disimpan. Mencoba menyambung lagi otomatis; pastikan server masih berjalan.</span>
      <button class="btn-ghost !py-1" onclick="location.reload()">Muat ulang</button></div>`;
    if (mode === 'server') return '';
    const file = location.protocol === 'file:';
    return `<div class="card p-3 mb-4 border border-amber-500/30 bg-amber-500/10 font-body-sm text-body-sm flex flex-wrap items-center gap-2" data-mode-banner>
      <span class="material-symbols-outlined text-amber-300 text-[20px]">wifi_off</span>
      <span class="flex-1 min-w-[220px]"><b class="text-amber-300">${serverHint ? 'Server LAN sudah tersedia.' : 'Mode lokal: data hanya di browser ini.'}</b> ${serverHint ? 'Muat ulang agar tersinkron dengan semua perangkat.' : file ? 'Halaman dibuka langsung dari file. Jalankan <code>node server.js</code> lalu buka <code>http://localhost:8765/</code> agar pengunjung, pengelola & Command Center tersinkron di semua perangkat.' : 'server.js tidak terdeteksi. Jalankan <code>node server.js</code> agar data tersinkron ke semua perangkat.'}</span>
      ${serverHint ? '<button class="btn-ghost !py-1" onclick="location.reload()">Muat ulang</button>' : ''}</div>`;
  }

  // ------------------------------------------------------------------ aksi publik
  const A = {
    holdSeat(evId, seat, cart, opts) {
      return tx((d, t) => {
        const e = d.events[evId];
        if (!saleState(e, t).open) fail('Penjualan tiket belum dibuka atau sudah ditutup.');
        const ty = typeById(e, seatType(e, seat));
        if (!ty.onSale || e.blocked.includes(seat)) fail('Kursi ' + seat + ' tidak dijual.');
        const x = d.seats[evId][seat];
        if (x && x.st === 'SOLD') fail('Kursi ' + seat + ' sudah terjual.');
        if (x && x.st === 'HELD' && !(x.cart === cart && !x.order)) fail('Kursi ' + seat + ' sedang dipesan pengunjung lain. Pilih kursi lain.');
        const mine = Object.values(d.seats[evId]).filter((y) => y.st === 'HELD' && y.cart === cart && !y.order).length + d.qholds[evId].filter((h) => h.cart === cart && !h.order).reduce((a, h) => a + h.qty, 0);
        if (!x && mine >= e.maxPerOrder) fail('Maksimal ' + e.maxPerOrder + ' tiket per pesanan.');
        const until = t + e.holdMin * 60000;
        d.seats[evId][seat] = { st: 'HELD', cart, until };
        Object.values(d.seats[evId]).forEach((y) => { if (y.st === 'HELD' && y.cart === cart && !y.order) y.until = until; });
        d.qholds[evId].forEach((h) => { if (h.cart === cart && !h.order) h.until = until; });
        return until;
      }, opts);
    },
    releaseSeat(evId, seat, cart) { return tx((d) => { const x = d.seats[evId][seat]; if (x && x.st === 'HELD' && x.cart === cart && !x.order) delete d.seats[evId][seat]; }); },
    setQty(evId, typeId, qty, cart) {
      return tx((d, t) => {
        const e = d.events[evId];
        if (!saleState(e, t).open) fail('Penjualan tiket belum dibuka atau sudah ditutup.');
        const ty = typeById(e, typeId);
        const others = d.qholds[evId].filter((h) => h.type === typeId && h.cart !== cart && h.until > t).reduce((a, h) => a + h.qty, 0)
          + d.qholds[evId].filter((h) => h.type === typeId && h.cart === cart && h.order).reduce((a, h) => a + h.qty, 0);
        const sold = Object.values(d.orders).filter((o) => o.ev === evId && o.status === 'PAID').reduce((a, o) => a + o.items.filter((i) => i.type === typeId).length, 0);
        const left = ty.quota - sold - others;
        if (qty > left) fail(left <= 0 ? ty.name + ' sudah habis.' : 'Sisa kuota ' + ty.name + ' hanya ' + left + '.');
        const mineSeats = Object.values(d.seats[evId]).filter((y) => y.st === 'HELD' && y.cart === cart && !y.order).length;
        const mineOther = d.qholds[evId].filter((h) => h.cart === cart && !h.order && h.type !== typeId).reduce((a, h) => a + h.qty, 0);
        if (qty + mineSeats + mineOther > e.maxPerOrder) fail('Maksimal ' + e.maxPerOrder + ' tiket per pesanan.');
        d.qholds[evId] = d.qholds[evId].filter((h) => !(h.cart === cart && !h.order && h.type === typeId));
        const until = t + e.holdMin * 60000;
        if (qty > 0) d.qholds[evId].push({ cart, type: typeId, qty, until });
        Object.values(d.seats[evId]).forEach((y) => { if (y.st === 'HELD' && y.cart === cart && !y.order) y.until = until; });
        d.qholds[evId].forEach((h) => { if (h.cart === cart && !h.order) h.until = until; });
      });
    },
    releaseCart(evId, cart) { return tx((d) => { Object.entries(d.seats[evId]).forEach(([sid, x]) => { if (x.st === 'HELD' && x.cart === cart && !x.order) delete d.seats[evId][sid]; }); d.qholds[evId] = d.qholds[evId].filter((h) => !(h.cart === cart && !h.order)); }); },
    createOrder(evId, cart, info) {
      return tx((d, t) => {
        const e = d.events[evId];
        const seats = Object.entries(d.seats[evId]).filter(([, x]) => x.st === 'HELD' && x.cart === cart && !x.order);
        const q = d.qholds[evId].filter((h) => h.cart === cart && !h.order);
        if (!seats.length && !q.length) fail('Waktu hold kursi habis. Pilih kursi lagi.');
        const items = seats.map(([sid]) => ({ type: seatType(e, sid), seat: sid })).concat(...q.map((h) => Array.from({ length: h.qty }, () => ({ type: h.type, seat: null }))));
        items.forEach((it) => (it.price = typeById(e, it.type).price)); // harga saat beli (rekonsiliasi & laporan)
        (info.holders || []).forEach((h, i) => { if (items[i] && h) items[i].holder = h; });
        const p = price(e, items);
        const id = 'BK-' + rand(6);
        const o = { id, ev: evId, cart, name: info.name, email: info.email, phone: info.phone, items, ...p, status: 'PENDING', method: null, createdAt: t, paidAt: null, until: t + PAY_MIN * 60000, tickets: [], log: [{ ts: t, text: 'Pesanan dibuat, ' + items.length + ' tiket di-hold untuk pembayaran' }] };
        d.orders[id] = o;
        seats.forEach(([, x]) => { x.order = id; x.until = o.until; });
        q.forEach((h) => { h.order = id; h.until = o.until; });
        if (p.total === 0) issue(d, o, 'Gratis', t);
        else notify(d, o, 'Menunggu pembayaran · ' + id, `Halo ${o.name}, selesaikan pembayaran ${rp(o.total)} sebelum ${fmtTime(o.until)} WIB agar kursi tidak dilepas.`, t);
        return id;
      });
    },
    pay(orderId, method, success) {
      return tx((d, t) => {
        const o = d.orders[orderId];
        if (!o) fail('Pesanan tidak ditemukan.');
        if (o.status === 'PAID') return 'ALREADY'; // callback idempoten: tidak menerbitkan tiket dua kali
        if (o.status !== 'PENDING') fail(o.status === 'EXPIRED' ? 'Batas waktu pembayaran habis dan kursi sudah dilepas. Buat pesanan baru.' : 'Pesanan berstatus ' + o.status + '.');
        const bad = o.items.filter((it) => it.seat && !(d.seats[o.ev][it.seat] && d.seats[o.ev][it.seat].order === o.id));
        if (bad.length) fail('Hold kursi ' + bad.map((b) => b.seat).join(', ') + ' tidak valid lagi.');
        if (!success) { o.log.push({ ts: t, text: 'Pembayaran ' + method + ' ditolak (simulasi sandbox)' }); return 'FAILED'; }
        issue(d, o, method, t);
        return 'PAID';
      });
    },
    cancel(orderId, by) { return tx((d, t) => { const o = d.orders[orderId]; if (!o || o.status !== 'PENDING') fail('Hanya pesanan menunggu pembayaran yang dapat dibatalkan.'); o.status = 'CANCELLED'; o.log.push({ ts: t, text: 'Dibatalkan oleh ' + (by || 'pengunjung') }); release(d, o); wakeWaitlist(d, o, 'batal', t); }); },
    refund(orderId, reason) {
      return tx((d, t) => {
        const o = d.orders[orderId];
        if (!o || o.status !== 'PAID') fail('Hanya pesanan lunas yang dapat di-refund.');
        if (o.tickets.some((id) => d.tickets[id].checkedInAt)) fail('Tiket sudah dipakai check-in, tidak dapat di-refund.');
        o.status = 'REFUNDED'; o.refundReason = reason || 'Permintaan peserta'; o.refundedAt = t;
        o.tickets.forEach((id) => (d.tickets[id].status = 'VOID'));
        o.items.forEach((it) => { if (it.seat && d.seats[o.ev][it.seat] && d.seats[o.ev][it.seat].order === o.id) delete d.seats[o.ev][it.seat]; });
        o.log.push({ ts: t, text: 'Refund ' + rp(o.total) + ' diproses (sandbox): ' + o.refundReason + '. E-ticket dinonaktifkan, kursi kembali tersedia.' });
        notify(d, o, 'Refund ' + o.id, `Refund ${rp(o.total)} untuk ${o.id} diproses ke metode ${o.method}. E-ticket tidak berlaku lagi.`, t);
        wakeWaitlist(d, o, 'refund', t);
      });
    },
    updateContact(orderId, patch) { return tx((d, t) => { const o = d.orders[orderId]; if (!o) fail('Pesanan tidak ditemukan.'); ['name', 'email', 'phone'].forEach((k) => { if (patch[k]) o[k] = patch[k]; }); (patch.holders || []).forEach((h, i) => { const tk = d.tickets[o.tickets[i]]; if (tk && h) tk.holder = h; }); o.log.push({ ts: t, text: 'Data peserta diperbarui panitia' }); }); },
    resend(orderId) { return tx((d, t) => { const o = d.orders[orderId]; const e = d.events[o.ev]; notify(d, o, 'Kirim ulang e-ticket · ' + o.id, `Halo ${o.name}, berikut e-ticket ${e.name} (${o.tickets.length} tiket). Tunjukkan QR di gate.`, t); }); },
    checkIn(text, evId, gate, opts) {
      const test = !!(opts && opts.test); // pindaian uji: tidak dihitung sebagai anomali gate
      return tx((d, t) => {
        const res = verify(d, String(text || '').trim(), evId);
        if (res.result === 'VALID') { const tk = d.tickets[res.ticket.id]; tk.checkedInAt = t; tk.gate = gate; res.ticket = tk; }
        d.scans.unshift(Object.assign({ ts: t, ev: evId, gate, result: res.result, ticket: res.ticket ? res.ticket.id : null, reason: (test ? 'Uji 2 gate: ' : '') + res.reason }, test ? { test: true } : {}));
        d.scans = d.scans.slice(0, 500);
        return res;
      });
    },
    updateEvent(evId, patch) { return tx((d) => { Object.assign(d.events[evId], patch); }); },
    updateType(evId, typeId, patch) { return tx((d) => { const ty = d.events[evId].types.find((x) => x.id === typeId); Object.assign(ty, patch); }); },
    toggleBlock(evId, seat) {
      return tx((d) => {
        const e = d.events[evId]; const x = d.seats[evId][seat];
        if (x && (x.st === 'SOLD' || x.order)) fail('Kursi ' + seat + ' sudah terjual/dipesan, tidak dapat diblokir.');
        e.blocked = e.blocked.includes(seat) ? e.blocked.filter((s) => s !== seat) : e.blocked.concat(seat);
        if (x) delete d.seats[evId][seat];
      });
    },
    addEvent(info) {
      return tx((d, t) => {
        const n = Math.max(d.evSeq || 0, ...d.order.map((x) => +x.split('-')[1] || 0)) + 1; // nomor tidak dipakai ulang setelah dihapus
        d.evSeq = n;
        const id = 'EVT-' + String(n).padStart(2, '0');
        const T = TEMPLATES[info.template] || TEMPLATES.ATRIUM;
        const start = info.start;
        d.events[id] = { id, name: info.name, tagline: info.tagline || '', cat: info.cat || 'Umum', start, doors: start - 3600000, venue: T.venue, layout: clone(T.layout), desc: info.desc || '', saleStart: t, saleEnd: start - 1800000, status: 'DRAFT', holdMin: 8, maxPerOrder: 4, color: info.color || '#a78bfa', gates: T.gates.slice(), blocked: [], types: clone(T.types), createdAt: t };
        d.order.push(id); d.seats[id] = {}; d.qholds[id] = [];
        return id;
      });
    },
    // Hapus permanen: hanya bila tidak ada transaksi lunas/menunggu bayar (data peserta tidak boleh hilang diam-diam)
    deleteEvent(evId) {
      return tx((d, t) => {
        const e = d.events[evId]; if (!e) fail('Acara tidak ditemukan.');
        const os = Object.values(d.orders).filter((o) => o.ev === evId);
        const paid = os.filter((o) => o.status === 'PAID').length, pend = os.filter((o) => o.status === 'PENDING' && o.until > t).length;
        if (paid || pend) fail(`Acara masih memiliki ${paid} transaksi lunas${pend ? ' dan ' + pend + ' menunggu bayar' : ''}. Batalkan acara (refund otomatis) terlebih dahulu.`);
        const oids = new Set(os.map((o) => o.id));
        os.forEach((o) => delete d.orders[o.id]);
        Object.keys(d.tickets).forEach((k) => { if (d.tickets[k].ev === evId) delete d.tickets[k]; });
        delete d.events[evId]; delete d.seats[evId]; delete d.qholds[evId];
        d.order = d.order.filter((x) => x !== evId);
        d.scans = d.scans.filter((x) => x.ev !== evId);
        d.waitlist = d.waitlist.filter((x) => x.ev !== evId);
        d.reports = d.reports.filter((x) => x.ev !== evId);
        d.outbox = d.outbox.filter((m) => !oids.has(m.order));
        return e.name;
      });
    },
    // Batalkan acara: tutup penjualan, refund semua pesanan lunas, batalkan pesanan menunggu bayar, kabari peserta
    cancelEvent(evId, reason) {
      return tx((d, t) => {
        const e = d.events[evId]; if (!e) fail('Acara tidak ditemukan.');
        let refunded = 0, cancelled = 0, total = 0;
        Object.values(d.orders).filter((o) => o.ev === evId).forEach((o) => {
          if (o.status === 'PAID') {
            o.status = 'REFUNDED'; o.refundReason = 'Acara dibatalkan: ' + (reason || 'keputusan panitia'); o.refundedAt = t; refunded++; total += o.total;
            o.tickets.forEach((id) => (d.tickets[id].status = 'VOID'));
            o.log.push({ ts: t, text: 'Refund otomatis ' + rp(o.total) + ' karena acara dibatalkan' });
            notify(d, o, 'Acara dibatalkan · ' + e.name, `Mohon maaf, ${e.name} dibatalkan (${reason || 'keputusan panitia'}). Refund ${rp(o.total)} diproses ke ${o.method}.`, t);
          } else if (o.status === 'PENDING') { o.status = 'CANCELLED'; o.log.push({ ts: t, text: 'Dibatalkan karena acara dibatalkan' }); release(d, o); cancelled++; }
        });
        d.seats[evId] = {}; d.qholds[evId] = [];
        e.status = 'CANCELLED'; e.cancelReason = reason || ''; e.cancelledAt = t;
        d.waitlist.filter((w) => w.ev === evId && !w.notified).forEach((w) => { w.notified = t; w.reason = 'acara-batal'; waitMsg(d, w, 'Acara dibatalkan · ' + e.name, `Mohon maaf, ${e.name} dibatalkan. Pendaftaran daftar tunggu Anda kami tutup.`, t); });
        return { refunded, cancelled, total };
      });
    },
    sendReminders(evId) {
      return tx((d, t) => {
        const e = d.events[evId]; let n = 0;
        Object.values(d.orders).filter((o) => o.ev === evId && o.status === 'PAID').forEach((o) => { n++; notify(d, o, 'Pengingat: ' + e.name, `Halo ${o.name}, ${e.name} dimulai ${fmtDT(e.start)} di ${e.venue}. Gate dibuka ${fmtTime(e.doors)}. Siapkan QR e-ticket (${o.tickets.length} tiket).`, t); });
        return n;
      });
    },
    joinWaitlist(evId, typeId, info) { return tx((d, t) => { d.waitlist.push({ id: 'WL-' + rand(5), ev: evId, type: typeId, name: info.name, contact: info.contact, qty: info.qty || 1, ts: t, notified: null }); }); },
    notifyWaitlist(evId) {
      return tx((d, t) => {
        const e = d.events[evId]; let n = 0;
        d.waitlist.filter((w) => w.ev === evId && !w.notified).forEach((w) => { w.notified = t; w.reason = 'manual'; n++; waitMsg(d, w, 'Kursi tersedia · ' + e.name, `Halo ${w.name}, ada kursi ${typeById(e, w.type).name} yang kembali tersedia. Segera pesan sebelum habis.`, t); });
        return n;
      });
    },
    // Command Center mengklaim anomali secara atomik (CAS): hanya satu browser CC yang membuat tiket insiden
    claimAnomaly(evId, gate, by) {
      return tx((d, t) => {
        const a = anomaliesIn(d, evId, 10, t).find((x) => x.gate === gate);
        if (!a) return NOOP;
        // gate dianggap sudah ditangani selama ada laporannya dalam 30 menit terakhir (anomali panjang = 1 insiden)
        const r = d.reports.find((x) => x.ev === evId && x.gate === gate && x.ts > t - REPORT_MS);
        if (r) { if (!claimable(r, t)) return NOOP; r.claimedBy = by; r.claimedAt = t; return r.id; }
        const id = 'GR-' + rand(4);
        d.reports.unshift({ id, ts: t, ev: evId, gate, text: 'Otomatis: ' + a.n + ' pindaian gagal/duplikat dalam 10 menit di ' + gate + '.', auto: true, claimedBy: by, claimedAt: t, ticketId: null });
        return id;
      });
    },
    claimReport(id, by) {
      return tx((d, t) => {
        const r = d.reports.find((x) => x.id === id);
        if (!r || !claimable(r, t)) return NOOP;
        r.claimedBy = by; r.claimedAt = t; return r.id;
      });
    },
    report(evId, gate, text) { return tx((d, t) => { d.reports.unshift({ id: 'GR-' + rand(4), ts: t, ev: evId, gate, text, ticketId: null }); }); },
    linkReport(id, ticketId) { return tx((d) => { const r = d.reports.find((x) => x.id === id); if (r) r.ticketId = ticketId; }); },
    async reset() { await backend().reset(); sessionStorage.removeItem(CART_KEY); adopt(Object.assign({ state: null }, await backend().get())); await ensureSeed(); emit(); },
    // Demo: dua pembeli menekan kursi yang sama pada saat bersamaan (berangkat dari snapshot versi yang sama)
    async raceDemo(evId, seat) {
      const log = [];
      const base = version, t = now();
      const e = ev(evId);
      const mk = (cart) => { const d = clone(state); sweep(d, t); const x = d.seats[evId][seat]; if (x && !(x.st === 'HELD' && x.until < t)) return null; d.seats[evId][seat] = { st: 'HELD', cart, until: t + e.holdMin * 60000 }; return d; };
      const dA = mk('DEMO-A'), dB = mk('DEMO-B');
      if (!dA) fail('Pilih kursi yang masih tersedia untuk demo.');
      log.push(`Pembeli A & B membaca state versi ${base}: kursi ${seat} tersedia untuk keduanya.`);
      const [rA, rB] = await Promise.all([backend().commit(base, dA), backend().commit(base, dB)]);
      const win = rA.ok ? 'A' : 'B', lose = rA.ok ? 'B' : 'A';
      const rW = rA.ok ? rA : rB, rL = rA.ok ? rB : rA;
      log.push(`Commit pembeli ${win} (base v${base}) diterima -> versi ${rW.version}. Kursi ${seat} di-hold untuk ${win}.`);
      log.push(`Commit pembeli ${lose} (base v${base}) ditolak: versi sudah berubah (409 / konflik).`);
      adopt(rL.ok ? Object.assign({}, rL, { state: rA.ok ? dA : dB }) : rL);
      if (!rL.ok) { const x = state.seats[evId][seat]; log.push(`Pembeli ${lose} membaca ulang state v${version}: kursi ${seat} berstatus ${x ? 'HELD oleh ' + x.cart : '?'} -> sistem menolak: "Kursi sedang dipesan pengunjung lain".`); }
      log.push('Hasil: hanya 1 hold yang sah, tidak ada double-booking. Hold demo dilepas otomatis setelah ' + e.holdMin + ' menit.');
      emit();
      return log;
    },
    // Uji tekan: n pembeli menekan kursi yang sama dalam satu tick (semua berangkat dari versi state yang sama).
    // Tiap pembeli memakai jalur transaksi asli (holdSeat), jadi yang kalah balapan menerima 409 lalu ditolak aturan.
    async stressTest(evId, seat, n) {
      n = n || 25;
      if (!ev(evId) || seatStatus(evId, seat, null) !== 'available') fail('Pilih kursi yang masih tersedia untuk uji tekan.');
      if (!saleState(ev(evId)).open) fail('Penjualan acara ini sedang tidak dibuka. Uji tekan butuh penjualan aktif, pilih acara lain atau buka penjualannya.');
      const base = version, t0 = Date.now();
      let conflicts = 0;
      const carts = Array.from({ length: n }, (_, i) => 'UJI-' + String(i + 1).padStart(2, '0'));
      const res = await Promise.allSettled(carts.map((c) => A.holdSeat(evId, seat, c, { onConflict: () => conflicts++ })));
      const ok = res.map((r, i) => (r.status === 'fulfilled' ? carts[i] : null)).filter(Boolean);
      const winner = ok[0] || null;
      const ms = Date.now() - t0;
      if (winner) await A.releaseCart(evId, winner);
      const log = [
        `${n} pembeli membaca state versi ${base} dan menekan kursi ${seat} bersamaan.`,
        winner ? `Pembeli ${winner} berhasil memegang kursi ${seat}.` : `Tidak ada pembeli yang berhasil (kursi ${seat} diambil pihak lain).`,
        `${n - ok.length} pembeli ditolak setelah ${conflicts} konflik versi (409) dan pemeriksaan ulang aturan. Selesai dalam ${ms} ms.`,
        `Kursi ${seat} dilepas kembali setelah uji.`,
      ];
      return { seat, n, winner, rejected: n - ok.length, conflicts, ms, log };
    },
    // Uji check-in serentak: dua gate memindai QR yang sama pada tick yang sama -> satu VALID, satu USED.
    // Pindaian ditandai uji (tidak memicu anomali) dan tiket dikembalikan ke belum check-in setelahnya.
    async dualGateTest(evId) {
      const e = ev(evId); if (!e) fail('Acara tidak ditemukan.');
      const tk = Object.values(state.tickets).find((x) => x.ev === evId && x.status === 'ACTIVE' && !x.checkedInAt);
      if (!tk) fail('Tidak ada tiket aktif yang belum check-in untuk uji ini.');
      const g1 = e.gates[0] || 'Gate 1', g2 = e.gates[1] || g1 + ' (perangkat 2)';
      const code = qrText(tk);
      const res = await Promise.all([A.checkIn(code, evId, g1, { test: true }), A.checkIn(code, evId, g2, { test: true })]);
      // Kembalikan tiket peserta ke belum check-in agar pemiliknya tetap bisa masuk di gate
      await tx((d) => { const x = d.tickets[tk.id]; if (x && (x.gate === g1 || x.gate === g2)) { x.checkedInAt = null; x.gate = null; } });
      return { ticket: tk.id, results: [{ gate: g1, result: res[0].result, reason: res[0].reason }, { gate: g2, result: res[1].result, reason: res[1].reason }] };
    },
  };

  // Normalisasi hasil pindaian: pemindai HID/keyboard bisa mengubah huruf besar-kecil atau pemisah '|'
  // (tata letak keyboard berbeda), aplikasi kamera bisa menambah spasi/karakter tak terlihat.
  function parseCode(raw) {
    const s = String(raw || '').normalize('NFKC').replace(/[​-‍﻿]/g, '').trim().toUpperCase();
    const m = s.match(/^SMB1[^A-Z0-9](T-[A-Z0-9]+)[^A-Z0-9](EVT-\d+)[^A-Z0-9]([A-Z]{1,2}\d{1,3}|-)[^A-Z0-9]([0-9A-F]{10})$/);
    if (m) return { kind: 'qr', id: m[1], ev: m[2], seat: m[3], sig: m[4] };
    if (/^T-[A-Z0-9]{5,}$/.test(s)) return { kind: 'ticket', id: s };
    if (/^BK-[A-Z0-9]{4,}$/.test(s)) return { kind: 'booking', id: s };
    return { kind: null, text: s };
  }
  function verify(d, text, evId) {
    const c = parseCode(text);
    const notFound = (what) => what + ' tidak terdaftar di data ' + (mode === 'server' ? 'server' : 'browser ini') + '.' + (mode === 'server' ? '' : ' Mode lokal: jalankan node server.js agar portal pengunjung & pemindai memakai data yang sama.');
    if (!c.kind) {
      const shown = c.text.length > 40 ? c.text.slice(0, 40) + '…' : c.text;
      return { result: 'INVALID', reason: 'Kode tidak dikenali' + (shown ? ' ("' + shown + '")' : '') + '. Gunakan QR e-ticket, kode tiket (T-…) atau kode booking (BK-…).' };
    }
    let tk, via = '';
    if (c.kind === 'qr') {
      if (sign(c.id, c.ev, c.seat === '-' ? null : c.seat) !== c.sig) return { result: 'INVALID', reason: 'Tanda tangan QR tidak cocok (indikasi QR palsu/diubah).' };
      tk = d.tickets[c.id];
      if (!tk) return { result: 'INVALID', reason: notFound('Tiket ' + c.id) };
    } else if (c.kind === 'ticket') {
      tk = d.tickets[c.id];
      if (!tk) return { result: 'INVALID', reason: notFound('Tiket ' + c.id) };
      via = ' Kode tiket diketik manual: cocokkan nama pemegang.';
    } else {
      const ob = d.orders[c.id];
      if (!ob) return { result: 'INVALID', reason: notFound('Booking ' + c.id) };
      const list = ob.tickets.map((id) => d.tickets[id]);
      const inEv = list.filter((x) => !evId || x.ev === evId);
      tk = inEv.find((x) => x.status === 'ACTIVE' && !x.checkedInAt) || inEv.find((x) => x.checkedInAt) || list[0];
      if (!tk) return { result: 'INVALID', reason: 'Booking ' + c.id + ' belum memiliki e-ticket (status ' + ob.status + ').' };
      via = ' Kode booking ' + c.id + ': tiket ' + (ob.tickets.indexOf(tk.id) + 1) + '/' + ob.tickets.length + ' (' + (tk.seat || 'berdiri') + '). Cocokkan nama pemegang.';
    }
    const o = d.orders[tk.order];
    if (evId && tk.ev !== evId) return { result: 'INVALID', ticket: tk, order: o, reason: 'Tiket untuk acara lain: ' + d.events[tk.ev].name + '.' };
    if (tk.status === 'VOID') return { result: 'INVALID', ticket: tk, order: o, reason: 'Tiket sudah dibatalkan/refund (' + (o.refundReason || o.status) + ').' };
    if (o.status !== 'PAID') return { result: 'INVALID', ticket: tk, order: o, reason: 'Pesanan belum lunas.' };
    if (tk.checkedInAt) return { result: 'USED', ticket: tk, order: o, reason: 'Tiket sudah digunakan pukul ' + fmtTime(tk.checkedInAt) + ' di ' + tk.gate + '.' + (c.kind === 'booking' ? ' Semua tiket booking ini sudah check-in.' : '') };
    return { result: 'VALID', ticket: tk, order: o, reason: 'Check-in berhasil.' + via };
  }

  // ------------------------------------------------------------------ render bersama
  function qrSvg(text, px) {
    const q = window.qrcode(0, 'M'); q.addData(text); q.make();
    const n = q.getModuleCount(), m = 2, size = n + m * 2;
    let p = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) p += `M${c + m},${r + m}h1v1h-1z`;
    return `<svg viewBox="0 0 ${size} ${size}" width="${px || 180}" height="${px || 180}" shape-rendering="crispEdges" role="img" aria-label="QR e-ticket"><rect width="${size}" height="${size}" fill="#fff"/><path d="${p}" fill="#0b132b"/></svg>`;
  }
  const STATUS_TXT = { available: 'Tersedia', mine: 'Pilihanmu', held: 'Sedang dipesan', sold: 'Terjual', blocked: 'Tidak dijual' };
  function legend(e, opts) {
    opts = opts || {};
    const sw = (cls, style, label, inner) => `<span class="inline-flex items-center gap-1.5"><span class="seat ${cls} !w-5 !h-5 !text-[9px] pointer-events-none" style="${style || ''}">${inner || ''}</span><span>${label}</span></span>`;
    const cats = e.types.filter((t) => t.seated).map((t) => sw('available', `--c:${t.color}`, `${esc(t.name)} · ${rp(t.price)}`, '')).join('');
    return `<div class="flex flex-wrap gap-x-4 gap-y-2 font-label-md text-label-md text-on-surface-variant">${cats}</div>
      <div class="flex flex-wrap gap-x-4 gap-y-2 mt-2 font-label-md text-label-md text-on-surface-variant">${sw('available', '--c:#94a3b8', 'Tersedia (warna = kategori)')}${opts.admin ? '' : sw('mine', '', 'Pilihanmu', '✓')}${sw('held', '', 'Sedang dipesan')}${sw('sold', '', 'Terjual', '×')}${sw('blocked', '', 'Tidak dijual', '')}</div>`;
  }
  function seatMap(evId, opts) {
    opts = opts || {};
    const e = ev(evId), t = now();
    const rows = e.layout.rows.map((row) => {
      const ty = typeById(e, row.t);
      const half = Math.ceil(row.n / 2);
      let cells = '';
      for (let c = 1; c <= row.n; c++) {
        const sid = row.r + c;
        const st = seatStatus(evId, sid, opts.cart, t);
        const other = !!opts.only && opts.only !== row.t;
        const dim = other ? ' dim' : '';
        // lock: kursi kategori lain tidak bisa dipilih (alur pengunjung: kategori dipilih dulu). Kursi milik sendiri tetap bisa dilepas.
        const off = other && opts.lock && st !== 'mine' ? ' disabled' : '';
        const x = state.seats[evId][sid];
        const tip = `${sid} · ${ty.name} · ${rp(ty.price)} · ${STATUS_TXT[st]}${opts.admin && x && x.order ? ' · ' + x.order : ''}`;
        const inner = st === 'mine' ? '✓' : st === 'sold' ? (opts.admin ? c : '×') : st === 'held' || st === 'blocked' ? '' : c;
        cells += `<button type="button" class="seat ${st}${dim}" style="--c:${ty.color}" data-seat="${sid}" data-st="${st}" title="${esc(tip)}" aria-label="${esc(tip)}"${off}>${inner}</button>`;
        if (c === half) cells += '<span class="aisle"></span>';
      }
      return `<div class="seat-row"><span class="row-lbl">${row.r}</span>${cells}<span class="row-lbl">${row.r}</span></div>`;
    }).join('');
    return `<div class="seatmap-wrap"><div class="seatmap"><div class="stage">${esc(e.layout.stage)}</div>${rows}</div></div>`;
  }
  // CSV untuk Excel regional Indonesia: pemisah titik koma, BOM UTF-8, baris CRLF.
  // Teks berawalan = + - @ tab CR diberi kutip tunggal agar tidak dijalankan sebagai rumus (CSV injection).
  function csvText(rows) {
    const cell = (v) => {
      if (v == null) return '';
      if (typeof v !== 'string') return String(v);
      if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
      return /[";,\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    return '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n');
  }
  function csv(name, rows) {
    const url = URL.createObjectURL(new Blob([csvText(rows)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.Evt = Object.assign(A, {
    init, subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    now, cartId, myOrders, rememberOrder, ev, typeById, seatType, allSeats, saleState, seatStatus, stats, cartHolds, price, finance, anomalies: (evId, mins) => anomaliesIn(state, evId, mins, now()), FIN_DEFAULT, demoStale, modeBanner, parseCode, verify: (text, evId) => verify(state, text, evId), qrText, TEMPLATES, qrSvg, seatMap, legend, csv, csvText,
    rp, esc, fmtDate, fmtShort, fmtTime, fmtDT, mmss, EvtError, PAY_MIN, FEE, METHODS, STATUS_TXT,
  });
  Object.defineProperties(window.Evt, { s: { get: () => state }, mode: { get: () => mode }, version: { get: () => version } });
})();
