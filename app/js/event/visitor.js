/* Portal pengunjung (mobile-first): acara -> pilih kategori -> pilih kursi (kategori bernomor kursi) -> data peserta -> pembayaran sandbox -> e-ticket QR */
(function () {
  const E = window.Evt;
  const { esc, rp } = E;
  const ic = (n, c) => `<span class="material-symbols-outlined ${c || ''}">${n}</span>`;
  const app = document.getElementById('app');
  const cart = E.cartId();
  let cur = { name: 'home', args: [] };
  let payMethod = 'QRIS';
  let busy = false;
  let query = ''; // kata kunci pencarian di header
  let catF = null; // filter kategori di beranda

  // ---------------------------------------------------------------- bahasa (id / en)
  // Teks portal ditulis berpasangan di tempat: L('Indonesia', 'English'). Pilihan disimpan per browser.
  // Yang tidak diterjemahkan: isi acara dari pengelola (nama, deskripsi, jenis tiket, fasilitas tiket),
  // pesan simulasi di Kotak masuk (dibuat engine), dan banner mode lokal/terputus.
  const LANG_KEY = 'smicc-lang';
  let lang = 'id';
  try { if (localStorage.getItem(LANG_KEY) === 'en') lang = 'en'; } catch (_) { /* penyimpanan diblokir: tetap id */ }
  const en = () => lang === 'en';
  const L = (id, eng) => (en() ? eng : id);
  const CAT_EN = { Konser: 'Concert', Teknologi: 'Technology', Komedi: 'Comedy', Pameran: 'Exhibition', Olahraga: 'Sports', Anak: 'Kids', Kuliner: 'Culinary', Esports: 'Esports', Fashion: 'Fashion', Workshop: 'Workshop', Film: 'Film' };
  const catName = (c) => (en() && CAT_EN[c]) || c;
  // Tanggal: engine selalu id-ID (dipakai juga konsol pengelola), portal memformat sendiri saat bahasa Inggris.
  const fDate = (ms) => (en() ? new Date(ms).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : E.fmtDate(ms));
  const fShort = (ms) => (en() ? new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : E.fmtShort(ms));
  const fTime = E.fmtTime;
  const fDT = (ms) => fShort(ms) + ' ' + fTime(ms);
  const locale = () => (en() ? 'en-GB' : 'id-ID');
  // Status penjualan (engine: saleState().label berbahasa Indonesia)
  const saleLabel = (e) => {
    const s = E.saleState(e); if (!en()) return s.label;
    if (e.status === 'DRAFT') return 'Draft';
    if (e.status === 'CLOSED') return 'Sales closed';
    if (e.status === 'CANCELLED') return 'Event cancelled';
    if (E.now() < e.saleStart) return 'Opens ' + fDT(e.saleStart);
    if (E.now() > e.saleEnd) return 'Sales ended';
    return 'On sale';
  };
  // Pesan galat aturan bisnis dari engine yang bisa muncul di alur beli.
  const ERR_EN = [
    [/^Server sedang sibuk\. Coba lagi sebentar lagi\.$/, 'The server is busy. Please try again in a moment.'],
    [/^Penjualan tiket belum dibuka atau sudah ditutup\.$/, 'Ticket sales are not open yet or have closed.'],
    [/^Kursi (\S+) tidak dijual\.$/, 'Seat $1 is not for sale.'],
    [/^Kursi (\S+) sudah terjual\.$/, 'Seat $1 is already sold.'],
    [/^Kursi (\S+) sedang dipesan pengunjung lain\. Pilih kursi lain\.$/, 'Seat $1 is being booked by another visitor. Choose another seat.'],
    [/^Maksimal (\d+) tiket per pesanan\.$/, 'Maximum $1 tickets per order.'],
    [/^Waktu hold kursi habis\. Pilih kursi lagi\.$/, 'Your seat hold has expired. Please choose your seats again.'],
    [/^Pesanan tidak ditemukan\.$/, 'Order not found.'],
    [/^Hold kursi (.+) tidak valid lagi\.$/, 'The hold on seat(s) $1 is no longer valid.'],
    [/^Hanya pesanan menunggu pembayaran yang dapat dibatalkan\.$/, 'Only orders awaiting payment can be cancelled.'],
    [/^Acara tidak ditemukan\.$/, 'Event not found.'],
  ];
  const errText = (m) => { if (!en()) return m; for (const [re, s] of ERR_EN) if (re.test(m)) return m.replace(re, s); return m; };
  // Denah & legenda kursi dibuat engine (id): ganti label statusnya.
  const SEAT_EN = [['Tersedia (warna = kategori)', 'Available (colour = category)'], ['Pilihanmu', 'Your pick'], ['Sedang dipesan', 'Being booked'], ['Tidak dijual', 'Not for sale'], ['Terjual', 'Sold'], ['Tersedia', 'Available']];
  const STAGE_EN = (s) => s.replace('PANGGUNG UTAMA', 'MAIN STAGE').replace('PANGGUNG', 'STAGE').replace('AREA ACARA', 'EVENT AREA');
  const seatTxt = (html) => (en() ? SEAT_EN.reduce((h, [a, b]) => h.split('>' + a + '<').join('>' + b + '<').split(' · ' + a + '"').join(' · ' + b + '"'), html)
    .replace(/(<div class="stage">)([^<]*)(<\/div>)/, (_, a, s, b) => a + STAGE_EN(s) + b) : html);

  // ---------------------------------------------------------------- util UI
  // Toast (DESIGN.md): putih, garis kiri warna status, muncul di bawah header, hilang setelah 4 detik, bisa ditutup.
  function toast(text, kind) {
    const k = kind || 'info';
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'lp-toast lp-toast-' + k;
    el.setAttribute('role', k === 'err' ? 'alert' : 'status');
    el.innerHTML = `${ic({ ok: 'check_circle', err: 'error', info: 'info' }[k], 'lp-toast-ic text-[20px]')}<div class="lp-toast-msg">${text.replace(/<span class="material-symbols-outlined[^>]*>[^<]*<\/span>\s*/g, '')}</div><button type="button" class="lp-toast-x" aria-label="${L('Tutup', 'Close')}">${ic('close', 'text-[18px]')}</button>`;
    const bye = () => { if (!el.isConnected) return; el.classList.add('out'); setTimeout(() => el.remove(), 200); };
    el.querySelector('button').addEventListener('click', bye);
    while (root.children.length >= 3) root.firstElementChild.remove();
    root.appendChild(el);
    setTimeout(bye, 4000);
  }
  function modal(title, body) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center scrim" data-close>
      <div class="card-elev w-full max-w-xl rounded-b-none sm:rounded-2xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10"><h3 class="font-headline-sm text-headline-sm">${title}</h3><button class="btn-ghost !px-2" data-close aria-label="${L('Tutup', 'Close')}">${ic('close')}</button></div>
        <div class="p-5">${body}</div></div></div>`;
    root.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', (e) => { if (e.target === el || el.tagName === 'BUTTON') root.innerHTML = ''; }));
    return root;
  }
  const closeModal = () => (document.getElementById('modal-root').innerHTML = '');
  async function act(p, okMsg) {
    if (busy) return null; busy = true;
    try { const r = await p(); if (okMsg) toast(okMsg, 'ok'); return r; } catch (e) { toast(ic('error', 'text-[18px] align-middle text-rose-300') + ' ' + esc(errText(e.message)), 'err'); return null; } finally { busy = false; }
  }
  const back = (href, label) => `<a href="${href}" class="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary mb-3">${ic('arrow_back', 'text-[16px]')} ${label}</a>`;
  const statusChip = (st) => {
    const m = {
      PENDING: [L('Menunggu pembayaran', 'Awaiting payment'), 'warning'],
      PAID: [L('Lunas', 'Paid'), 'success'],
      EXPIRED: [L('Kedaluwarsa', 'Expired'), 'neutral'],
      CANCELLED: [L('Dibatalkan', 'Cancelled'), 'neutral'],
      REFUNDED: ['Refund', 'danger'],
    }[st];
    return `<span class="lp-badge lp-b-${m[1]}">${m[0]}</span>`;
  };
  const avail = (e) => { const s = E.stats(e.id); const sale = e.types.filter((t) => t.onSale).map((t) => s.per[t.id]); const total = sale.reduce((a, p) => a + p.total - p.blocked, 0); const left = sale.reduce((a, p) => a + p.available, 0); return { left, total, pct: total ? (left / total) * 100 : 0 }; };

  // ---------------------------------------------------------------- komponen katalog
  const ICON = { Konser: 'music_note', Teknologi: 'memory', Komedi: 'theater_comedy', Pameran: 'storefront', Olahraga: 'sports_soccer', Anak: 'child_care', Kuliner: 'restaurant', Esports: 'sports_esports', Fashion: 'checkroom', Workshop: 'palette', Film: 'movie' };
  const evIcon = (cat) => ICON[cat] || 'celebration';
  const shortVenue = (v) => String(v || '').split(' · ')[0];
  const priceFrom = (e) => { const p = e.types.filter((t) => t.onSale).map((t) => t.price); return p.length ? Math.min(...p) : null; };
  const perks = (t) => (/kursi/i.test(t.perks || '') ? t.perks : [t.perks, t.seated ? L('Kursi bernomor', 'Numbered seat') : L('Tanpa nomor kursi', 'Unnumbered')].filter(Boolean).join('. '));
  const free = () => L('Gratis', 'Free');
  const priceTxt = (e) => { const m = priceFrom(e); return m == null ? '-' : m === 0 ? free() : rp(m); };
  const left = (n) => L('Sisa ' + n, n + ' left');
  // Banner acara: foto bila ada (e.img), selain itu gradien warna acara + ikon kategori.
  const banner = (e, big) => `<div class="pv-banner ${big ? 'pv-banner-lg' : ''} ${e.img ? 'has-img' : ''}" style="--c:${esc(e.color)}">${e.img ? `<img class="pv-banner-img" src="${esc(e.img)}" alt="" loading="lazy" decoding="async">` : ic(evIcon(e.cat), 'pv-banner-ic')}
    <div class="pv-banner-txt"><span class="pv-tag">${esc(catName(e.cat))}</span>${big ? `<div><div class="pv-banner-title">${esc(e.name)}</div>${e.tagline ? `<div class="pv-banner-sub">${esc(e.tagline)}</div>` : ''}</div>` : ''}</div></div>`;
  // ---------------------------------------------------------------- komponen landing (DESIGN.md "Papan Petunjuk")
  // Area mal: lantai (plat) + kode warna area (CSS: [data-a=...]). Urutan seperti papan direktori lift: lantai atas dulu.
  // Nama area = Evt.AREAS di engine.js (sesuai denah). a = kode warna CSS yang sudah ada; foto demo dipakai bersama.
  const AREAS = [
    { key: 'Exhibition Hall A', a: 'expo', floor: 'L2', img: 'area-expo', note: ['Pameran, bazar & trade expo', 'Exhibitions, bazaars & trade expos'] },
    { key: 'Atrium Cibadag', a: 'atrium', floor: 'GF', img: 'area-atrium', note: ['Panggung utama, konser & pameran', 'Main stage, concerts & exhibitions'] },
    { key: 'Atrium Ciunik', a: 'hall', floor: 'GF', img: 'area-hall', note: ['Pertunjukan kursi bernomor & aktivasi brand', 'Seated shows & brand activations'] },
    { key: 'Atrium Cileutik', a: 'kids', floor: 'GF', img: 'area-kids', note: ['Kelas, komunitas & acara keluarga', 'Classes, communities & family events'] },
    { key: 'Sawarga Courtyard', a: 'plaza', floor: 'GF', img: 'area-plaza', note: ['Courtyard outdoor ±3.600 m², konser & festival', 'Outdoor courtyard ±3,600 m², concerts & festivals'] },
    { key: 'Downtown Walk', a: 'plaza', floor: 'GF', img: 'area-plaza', note: ['Kuliner & live music semi-outdoor', 'Semi-outdoor food & live music'] },
    { key: 'Parkir Barat', a: 'plaza', floor: 'P', img: 'area-plaza', note: ['Festival besar di lahan parkir', 'Large festivals on the parking lot'] },
  ];
  const area = (e) => shortVenue(e.venue).split(',')[0];
  const areaOf = (e) => AREAS.find((x) => x.key === area(e)) || { key: area(e), a: '', floor: '-' };
  const plate = (f, big) => `<span class="lp-plate${big ? ' lp-plate-lg' : ''}" aria-hidden="true">${esc(f)}</span>`;
  const where = (e) => { const x = areaOf(e); return `${plate(x.floor)}<span class="truncate"><span class="sr-only">${L('Lantai', 'Floor')} ${esc(x.floor)}, </span>${esc(x.key)}</span>`; };
  const when = (e) => `${new Date(e.start).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' })} · ${fTime(e.start)} WIB`;
  const photo = (e) => (e.img ? `<img src="${esc(e.img)}" alt="" loading="lazy" decoding="async">` : `<span class="lp-noimg" style="--c:${esc(e.color)}">${ic(evIcon(e.cat))}</span>`);
  const badge = (text, kind) => `<span class="lp-badge lp-b-${kind}">${esc(text)}</span>`;
  // Keadaan kartu: [badge, habis?]. Hanya keadaan yang perlu diperhatikan yang diberi badge.
  function cardState(e) {
    const a = avail(e), sale = E.saleState(e);
    if (!sale.open && E.now() < e.saleStart) return [badge(L('Dibuka ', 'Opens ') + new Date(e.saleStart).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }), 'neutral'), false];
    if (!sale.open) return [badge(saleLabel(e), 'neutral'), false];
    if (a.left === 0) return [badge(L('Habis terjual', 'Sold out'), 'danger'), true];
    if (a.pct < 30) return [badge(L('Sisa ' + a.left + ' tiket', a.left + ' left'), 'warning'), false];
    return ['', false];
  }
  const card = (e) => {
    const [b, sold] = cardState(e);
    return `<a href="/pengunjung/e/${e.id}" class="lp-card${sold ? ' is-sold' : ''}"><div class="lp-card-img">${photo(e)}<span class="lp-cat">${esc(catName(e.cat))}</span></div>
      <div class="lp-card-body"><h3 class="lp-card-title">${esc(e.name)}</h3>
        <p class="lp-meta">${ic('calendar_month', 'text-[16px]')}<span>${when(e)}</span></p>
        <p class="lp-meta">${where(e)}</p>
        ${e.org ? `<p class="lp-org">${ic('storefront', 'text-[16px]')}<span class="truncate">${esc(e.org)}</span></p>` : ''}
        <div class="lp-card-foot"><div><span class="lp-from">${sold ? L('Tiket habis', 'Sold out') : L('Mulai dari', 'From')}</span><b class="lp-price">${sold ? L('Daftar tunggu', 'Waiting list') : priceTxt(e)}</b></div>${b}</div></div></a>`;
  };
  // Alur beli: kategori -> kursi (hanya bila acara punya kategori bernomor kursi) -> data pemesan -> pembayaran
  const hasSeats = (e) => e.types.some((t) => t.seated && t.onSale);
  const steps = (key, e) => {
    const STEP = { kategori: L('Pilih kategori', 'Choose category'), kursi: L('Pilih kursi', 'Choose seats'), data: L('Data pemesan', 'Your details'), bayar: L('Pembayaran', 'Payment') };
    const keys = hasSeats(e) ? ['kategori', 'kursi', 'data', 'bayar'] : ['kategori', 'data', 'bayar'];
    const n = keys.indexOf(key) + 1;
    return `<div class="mb-4"><div class="font-label-md text-label-md"><span class="text-on-surface-variant">${L(`Langkah ${n} dari ${keys.length}`, `Step ${n} of ${keys.length}`)}</span><span class="pv-sep text-on-surface-variant"></span><b>${STEP[key]}</b></div><div class="pv-steps mt-2" style="grid-template-columns:repeat(${keys.length},1fr)">${keys.map((_, i) => `<span class="${i < n ? 'on' : ''}"></span>`).join('')}</div></div>`;
  };

  // ---------------------------------------------------------------- views
  const V = {};
  // ---------------------------------------------------------------- beranda (landing)
  // Urutan blok mengikuti docs/rewrite/DESIGN.md bagian 6: hero, filter cepat + acara di mal, minggu ini di mal +
  // laku keras, kategori, papan direktori area, tenant & promo, untuk penyelenggara, panduan, footer.
  // Blok tanpa data tidak ditampilkan.
  const MALL = { hours: '10:00 - 22:00', address: 'Kawasan Summarecon Bandung, Gedebage, Kota Bandung' };
  const tx2 = (v) => (Array.isArray(v) ? L(v[0], v[1]) : v);
  // Contoh promo tenant untuk pemegang e-ticket (statis, ganti dengan data tenant sebenarnya). [id, en]
  const PROMOS = [
    { img: 'promo-fnb', floor: 'L3', place: ['Food Court', 'Food Court'], title: ['Diskon 15% makan malam', '15% off dinner'], text: ['Tunjukkan e-ticket acara hari yang sama di kasir tenant food court yang ikut serta.', 'Show a same-day event e-ticket at the till of participating food court tenants.'] },
    { img: 'promo-kopi', floor: 'GF', place: ['Kedai kopi', 'Coffee shop'], title: ['Gratis upsize minuman', 'Free drink upsize'], text: ['Berlaku 2 jam sebelum acara dimulai. Satu kali per e-ticket.', 'Valid 2 hours before the event starts. Once per e-ticket.'] },
    { img: 'promo-fashion', floor: 'L1', place: ['Area fashion', 'Fashion area'], title: ['Potongan Rp50.000', 'Rp50,000 off'], text: ['Minimal belanja Rp300.000 di tenant fashion yang ikut serta, sampai 7 hari setelah acara.', 'Minimum spend Rp300,000 at participating fashion tenants, up to 7 days after the event.'] },
    { img: 'promo-bioskop', floor: 'L3', place: ['Bioskop', 'Cinema'], title: ['Beli 1 gratis 1 popcorn', 'Buy 1 get 1 free popcorn'], text: ['Untuk pembelian tiket film di hari yang sama dengan acaramu.', 'With a movie ticket bought on the same day as your event.'] },
  ];
  const GUIDE = [
    { icon: 'local_parking', title: ['Parkir & akses', 'Parking & access'], items: [['Parkir mobil di basement dan gedung parkir, motor di sisi timur.', 'Car parking in the basement and parking building, motorcycles on the east side.'], ['Turun di lobi utama untuk ojek daring dan taksi.', 'Ride-hailing and taxi drop-off at the main lobby.'], ['Datang 30-60 menit lebih awal saat akhir pekan.', 'Arrive 30-60 minutes early on weekends.']] },
    { icon: 'qr_code_2', title: ['Masuk ke acara', 'Entering the event'], items: [['Buka e-ticket di menu Tiket saya, tunjukkan QR ke petugas gate.', 'Open your e-ticket under My tickets and show the QR to the gate staff.'], ['Satu QR berlaku untuk satu orang dan satu kali masuk.', 'One QR is valid for one person and one entry.'], ['Tangkapan layar QR tetap bisa dipindai.', 'A screenshot of the QR can still be scanned.']] },
    { icon: 'currency_exchange', title: ['Refund & pembatalan', 'Refunds & cancellation'], items: [['Bila acara dibatalkan pengelola, dana kembali otomatis.', 'If the organiser cancels the event, you are refunded automatically.'], ['Pesanan yang belum dibayar batal sendiri setelah batas waktu.', 'Unpaid orders cancel themselves after the time limit.'], ['Pertanyaan pesanan: siapkan kode booking BK-....', 'Questions about an order: have your BK-... booking code ready.']] },
    { icon: 'accessible', title: ['Fasilitas', 'Facilities'], items: [['Kursi roda dapat dipinjam di Customer Service GF.', 'Wheelchairs can be borrowed at Customer Service, GF.'], ['Musala, ruang laktasi, dan toilet ramah difabel di tiap lantai.', 'Prayer rooms, nursing rooms and accessible toilets on every floor.'], ['Area acara bebas rokok.', 'Event areas are smoke-free.']] },
  ];
  const img = (f) => '/app/img/demo/' + f + '.jpg';
  const inArea = (e, key) => area(e) === key;
  const dayStart = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const D_MS = 86400000;
  const sec = (id, title, body, more) => `<section class="lp-sec" id="sec-${id}" aria-labelledby="h-${id}"><div class="lp-sec-head"><h2 class="lp-title" id="h-${id}">${title}</h2>${more || ''}</div>${body}</section>`;
  const seeAll = (cat, label) => `<button type="button" class="lp-more" data-cat="${esc(cat)}">${label || L('Lihat semua', 'See all')}${ic('chevron_right', 'text-[18px]')}</button>`;
  const nEvents = (n) => L(n + ' acara', n + (n === 1 ? ' event' : ' events'));
  let quickF = 'all'; // chip filter cepat di blok "Acara di Summarecon Mall"
  let areaF = null; // filter area mal (dari papan direktori)
  let heroIdx = 0;
  let dirIdx = 0; // baris papan direktori yang sedang disorot (foto kanan, desktop)

  // Rentang akhir pekan: Sabtu-Minggu minggu ini (hari Minggu: hanya hari ini).
  function weekend() {
    const t0 = dayStart(E.now()), dow = new Date(E.now()).getDay();
    if (dow === 0) return [t0, t0 + D_MS];
    const sat = t0 + ((6 - dow + 7) % 7) * D_MS;
    return [sat, sat + 2 * D_MS];
  }
  const QUICK = [
    ['all', () => L('Semua', 'All'), () => true],
    ['today', () => L('Hari ini', 'Today'), (e) => dayStart(e.start) === dayStart(E.now())],
    ['weekend', () => L('Akhir pekan', 'Weekend'), (e) => { const [a, b] = weekend(); return e.start >= a && e.start < b; }],
    ['free', () => L('Gratis', 'Free'), (e) => priceFrom(e) === 0],
    ['kids', () => L('Untuk anak', 'For kids'), (e) => e.cat === 'Anak'],
    ['seated', () => L('Kursi bernomor', 'Numbered seats'), (e) => hasSeats(e)],
  ];

  function homeSections(all) {
    const live = (e) => e.start > E.now() - 3 * 3600000;
    const upcoming = all.filter((e) => live(e) && e.status !== 'CANCELLED').sort((a, b) => a.start - b.start);
    const open = upcoming.filter((e) => E.saleState(e).open);

    // B. Hero: acara unggulan yang sedang dijual, foto dulu. Slide tetangga mengintip.
    const hero = open.filter((e) => e.img && avail(e).left > 0).slice(0, 5);
    heroIdx = Math.min(heroIdx, Math.max(0, hero.length - 1));
    const heroHtml = hero.length ? `<section class="lp-hero" aria-roledescription="carousel" aria-label="${L('Acara unggulan', 'Featured events')}">
      <div class="lp-hero-track" data-rail="hero">${hero.map((e, i) => `<a href="/pengunjung/e/${e.id}" class="lp-slide${i === heroIdx ? ' on' : ''}" data-hero="${i}" aria-roledescription="slide" aria-label="${L(`${i + 1} dari ${hero.length}`, `${i + 1} of ${hero.length}`)}: ${esc(e.name)}">
        ${photo(e)}<div class="lp-slide-txt"><span class="lp-cat">${esc(catName(e.cat))}</span>
          <h2 class="lp-slide-title">${esc(e.name)}</h2>${e.tagline ? `<p class="lp-slide-sub">${esc(e.tagline)}</p>` : ''}
          <div class="lp-slide-foot"><p class="lp-slide-meta">${where(e)}<span class="lp-dot"></span><span>${when(e)}</span></p><span class="btn lp-slide-cta">${ic('confirmation_number', 'text-[18px]')}${L('Beli tiket', 'Buy tickets')}</span></div></div></a>`).join('')}</div>
      ${hero.length > 1 ? `<div class="lp-hero-ctl"><div class="lp-dots">${hero.map((e, i) => `<button type="button" data-hero-dot="${i}" class="${i === heroIdx ? 'on' : ''}" aria-label="${L('Slide', 'Slide')} ${i + 1}: ${esc(e.name)}" aria-current="${i === heroIdx}"></button>`).join('')}</div></div>` : ''}</section>` : '';

    // C. Filter cepat + Acara di mal (8 kartu)
    const q = QUICK.find((x) => x[0] === quickF) || QUICK[0];
    const list = upcoming.filter(q[2]);
    const chips = `<div class="lp-chips" role="group" aria-label="${L('Saring acara', 'Filter events')}">${QUICK.map(([k, label, fn]) => { const n = upcoming.filter(fn).length; const on = k === quickF; return `<button type="button" class="lp-chip${on ? ' on' : ''}" data-quick="${k}" aria-pressed="${on}" ${n || on ? '' : 'disabled'}>${on ? ic('check', 'text-[18px]') : ''}${label()}</button>`; }).join('')}</div>`;
    const empty = `<div class="lp-empty"><p>${L('Belum ada acara untuk pilihan ini.', 'No events for this filter yet.')}</p><button type="button" class="btn-ghost" data-quick="all">${L('Lihat semua acara', 'See all events')}</button></div>`;
    const gridHtml = `<section class="lp-sec" id="sec-terdekat" aria-labelledby="h-terdekat"><div class="lp-sec-head lp-sec-head-chips"><h2 class="lp-title" id="h-terdekat">${L('Acara di Summarecon Mall', 'Events at Summarecon Mall')}</h2>${chips}</div>
      ${list.length ? `<div class="lp-grid">${list.slice(0, 8).map(card).join('')}</div>` : empty}
      ${list.length > 8 || quickF === 'all' ? `<div class="lp-center"><button type="button" class="btn-ghost lp-btn-lg" data-cat="__all">${L('Lihat semua acara', 'See all events')} (${upcoming.length})</button></div>` : ''}</section>`;

    // D. Minggu ini di mal (7 hari ke depan, plat tanggal)
    const t0 = dayStart(E.now());
    const week = upcoming.filter((e) => e.start < t0 + 7 * D_MS);
    const agenda = week.length ? sec('week', L('Minggu ini di mal', 'This week at the mall'), `<ol class="lp-agenda">${week.slice(0, 7).map((e) => { const d = new Date(e.start); const today = dayStart(e.start) === t0; return `<li><a href="/pengunjung/e/${e.id}" class="lp-ag-row">
        <span class="lp-dplate${today ? ' is-today' : ''}"><small>${today ? L('Hari ini', 'Today') : d.toLocaleDateString(locale(), { month: 'short' })}</small><b>${d.getDate()}</b></span>
        <span class="lp-ag-main"><b class="lp-ag-title">${esc(e.name)}</b><span class="lp-meta">${d.toLocaleDateString(locale(), { weekday: 'long' })}, ${fTime(e.start)}<span class="lp-dot"></span>${where(e)}</span></span>
        <span class="lp-ag-price">${priceTxt(e)}</span></a></li>`; }).join('')}</ol>`, week.length > 7 ? seeAll('__all') : '') : '';

    // E. Laku keras: mosaik 1 besar + 2 tinggi (sisa tiket < 30%, belum habis)
    const hot = open.filter((e) => { const a = avail(e); return a.left > 0 && a.pct < 30; }).sort((x, y) => avail(x).pct - avail(y).pct).slice(0, 3);
    const hotHtml = hot.length ? sec('hot', L('Laku keras', 'Selling fast'), `<div class="lp-mosaic n${hot.length}">${hot.map((e, i) => `<a href="/pengunjung/e/${e.id}" class="lp-tile">${photo(e)}
        <span class="lp-tile-txt"><b class="lp-tile-title">${esc(e.name)}</b><span class="lp-tile-meta">${when(e)}</span>${badge(L('Sisa ' + avail(e).left + ' tiket', avail(e).left + ' left'), 'warning')}</span></a>`).join('')}</div>`) : '';

    // F. Kategori: ikon + jumlah acara
    const cats = [...new Set(upcoming.map((e) => e.cat))].sort((a, b) => upcoming.filter((e) => e.cat === b).length - upcoming.filter((e) => e.cat === a).length);
    const catHtml = sec('cat', L('Jelajahi kategori', 'Browse categories'), `<div class="lp-cats">${cats.map((c) => `<button type="button" class="lp-catbtn" data-cat="${esc(c)}"><span class="lp-cat-ic">${ic(evIcon(c), 'text-[24px]')}</span><span class="lp-cat-name">${esc(catName(c))}</span><span class="lp-cat-n">${nEvents(upcoming.filter((e) => e.cat === c).length)}</span></button>`).join('')}</div>`);

    // G. Papan direktori area: panel ink, lantai atas ke bawah. Desktop: foto area terpilih di kanan.
    const areas = AREAS.map((x) => ({ ...x, n: upcoming.filter((e) => inArea(e, x.key)).length }));
    dirIdx = Math.min(dirIdx, areas.length - 1);
    const dirHtml = `<section class="lp-dir" id="sec-area" aria-labelledby="h-area"><div class="lp-dir-list">
        <h2 class="lp-title lp-dir-title" id="h-area">${L('Direktori area', 'Area directory')}</h2>
        <p class="lp-dir-sub">${L('Semua acara ada di satu gedung. Pilih area untuk melihat acaranya.', 'Every event is in one building. Pick an area to see its events.')}</p>
        <ul>${areas.map((x, i) => `<li><button type="button" class="lp-dir-row${i === dirIdx ? ' on' : ''}" data-a="${x.a}" data-area="${esc(x.key)}" data-dir="${i}" ${x.n ? '' : 'disabled'}>
          ${plate(x.floor, true)}<span class="lp-dir-name"><b>${esc(x.key)}</b><small>${esc(tx2(x.note))}</small></span><span class="lp-dir-n"><b>${x.n}</b> ${L('acara', x.n === 1 ? 'event' : 'events')}</span></button></li>`).join('')}</ul></div>
      <figure class="lp-dir-photo" aria-hidden="true"><img src="${img(areas[dirIdx].img)}" alt="" loading="lazy" data-dir-img><figcaption data-dir-cap>${plate(areas[dirIdx].floor)}${esc(areas[dirIdx].key)}</figcaption></figure></section>`;

    // H. Tenant (logo berjalan) dan promo untuk pemegang tiket
    const T = (window.SMB_TENANTS || []).filter((x) => x && x.name);
    const logo = (x, hidden) => `<li class="pv-logo" ${hidden ? 'aria-hidden="true"' : ''} title="${esc(x.name)}${x.cat ? ' · ' + esc(x.cat) : ''}">${x.logo ? `<img src="${esc(x.logo)}" alt="${hidden ? '' : esc(x.name)}" loading="lazy" decoding="async">` : `<span>${esc(x.name)}</span>`}</li>`;
    // Dua baris berjalan berlawanan arah: baris atas ke kiri, baris bawah ke kanan. Tenant dibagi selang-seling.
    const rows = T.length > 4 ? [T.filter((_, i) => i % 2 === 0), T.filter((_, i) => i % 2 === 1)] : [T];
    const lane = (list, k) => { let run = list.slice(); while (run.length < 8) run = run.concat(list);
      return `<div class="pv-marquee${k ? ' rev' : ''}" style="--dur:${Math.max(28, run.length * 3.5)}s"><ul class="pv-marquee-track" aria-label="${L('Daftar tenant', 'Tenant list')}${rows.length > 1 ? ' ' + (k + 1) + '/' + rows.length : ''}">${run.map((x, i) => logo(x, i >= list.length)).join('')}${run.map((x) => logo(x, true)).join('')}</ul></div>`; };
    const marquee = T.length ? sec('tenant', L('Tenant di Summarecon Mall Bandung', 'Tenants at Summarecon Mall Bandung'), `<div class="pv-marquees">${rows.map(lane).join('')}</div>`) : '';
    const promoHtml = sec('promo', L('Promo tenant untuk pemegang tiket', 'Tenant deals for ticket holders'), `<p class="lp-lead">${L('Contoh promo. Tunjukkan e-ticket di kasir tenant yang ikut serta.', 'Sample deals. Show your e-ticket at participating tenants.')}</p>
      <div class="lp-row4">${PROMOS.map((p) => `<article class="lp-promo"><img src="${img(p.img)}" alt="" loading="lazy"><div class="lp-promo-body"><p class="lp-meta">${plate(p.floor)}<span>${esc(tx2(p.place))}</span></p><h3 class="lp-promo-title">${esc(tx2(p.title))}</h3><p class="lp-promo-text">${esc(tx2(p.text))}</p></div></article>`).join('')}</div>`);

    // I. Untuk penyelenggara: banner + deretan penyelenggara yang sudah berjualan di mal
    const orgs = [...new Set(all.map((e) => e.org).filter(Boolean))];
    const initials = (n) => n.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    const creator = `<section class="lp-creator" id="sec-mitra" aria-labelledby="h-mitra"><div class="lp-creator-main">
        <h2 class="lp-title" id="h-mitra">${L('Gelar acaramu di Summarecon Mall Bandung', 'Host your event at Summarecon Mall Bandung')}</h2>
        <p class="lp-creator-text">${L('Lima area acara dari 30 sampai 400 pengunjung, penjualan tiket dengan kursi bernomor, check-in QR, dan laporan langsung ke tim mal.', 'Five event areas for 30 to 400 visitors, ticket sales with numbered seats, QR check-in, and live reports to the mall team.')}</p>
        <div class="lp-creator-btns"><button type="button" class="btn" data-creator>${ic('add_circle', 'text-[18px]')}${L('Ajukan acara', 'Propose an event')}</button><a class="btn-ghost" href="/pengelola">${ic('admin_panel_settings', 'text-[18px]')}${L('Konsol pengelola', 'Organiser console')}</a></div></div>
      ${orgs.length ? `<div class="lp-orgs"><p class="lp-orgs-h">${L(`${orgs.length} penyelenggara sudah berjualan di sini`, `${orgs.length} organisers already sell here`)}</p><ul>${orgs.map((o) => `<li><span class="lp-org-mark" aria-hidden="true">${esc(initials(o))}</span><span class="lp-org-name">${esc(o)}</span></li>`).join('')}</ul></div>` : ''}</section>`;

    const guide = sec('panduan', L('Panduan pengunjung', 'Visitor guide'), `<div class="lp-row4">${GUIDE.map((g) => `<details class="lp-guide"><summary>${ic(g.icon, 'text-[22px] lp-guide-ic')}<span>${esc(tx2(g.title))}</span>${ic('expand_more', 'lp-guide-chev')}</summary>
      <ul>${g.items.map((x) => `<li>${esc(tx2(x))}</li>`).join('')}</ul></details>`).join('')}</div>`);

    return heroHtml + gridHtml
      + (agenda || hotHtml ? `<div class="lp-split${agenda && hotHtml ? '' : ' single'}">${agenda}${hotHtml}</div>` : '')
      + catHtml + dirHtml + marquee + promoHtml + creator + guide + footer();
  }

  function footer() {
    const col = (title, links) => `<div><h2 class="lp-foot-h">${title}</h2><ul>${links.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div>`;
    return `<footer class="lp-foot"><div class="lp-foot-grid">
      <div class="lp-foot-about"><p class="lp-foot-brand">${ic('local_activity', 'text-[22px]')}Summarecon Mall Bandung</p>
        <p>${L('Tiket acara di Summarecon Mall Bandung: konser, pameran, kuliner, acara anak, dan lainnya.', 'Event tickets at Summarecon Mall Bandung: concerts, exhibitions, food, kids\' events and more.')}</p>
        <p class="lp-foot-line">${ic('location_on', 'text-[18px]')}<span>${esc(MALL.address)}</span></p><p class="lp-foot-line">${ic('schedule', 'text-[18px]')}<span>${L('Buka setiap hari', 'Open daily')} ${MALL.hours}</span></p></div>
      ${col(L('Pengunjung', 'Visitors'), [['/pengunjung/tiket', L('Tiket saya', 'My tickets')], ['/pengunjung/inbox', L('Kotak masuk', 'Inbox')], ['#sec-panduan', L('Panduan pengunjung', 'Visitor guide')]])}
      ${col(L('Penyelenggara', 'Organisers'), [['/pengelola', L('Konsol pengelola', 'Organiser console')], ['/checkin', L('Check-in gate', 'Gate check-in')], ['#sec-mitra', L('Ajukan acara', 'Propose an event')]])}
      ${col(L('Untuk staf', 'For staff'), [['/command-center', 'Command Center'], ['/', L('Pilih peran', 'Choose role')]])}
      <div><h2 class="lp-foot-h">${L('Pembayaran (simulasi)', 'Payment (simulated)')}</h2><div class="lp-pays">${['QRIS', 'Virtual account', 'E-wallet', L('Kartu kredit', 'Credit card')].map((m) => `<span class="lp-pay">${m}</span>`).join('')}</div></div>
    </div><div class="lp-foot-bot"><span>${L('Prototipe Bandung Build Challenge 2026. Data contoh, pembayaran simulasi.', 'Bandung Build Challenge 2026 prototype. Sample data, simulated payments.')}</span><a href="/app/img/demo/CREDITS.md" target="_blank" rel="noopener">${L('Kredit foto demo', 'Demo photo credits')}</a></div></footer>`;
  }

  V.home = () => {
    const all = E.s.order.map(E.ev).filter((e) => e && e.status !== 'DRAFT');
    if (!all.length) return `<div class="lp-empty"><p>${L('Belum ada acara yang dipublikasikan.', 'No events have been published yet.')}</p></div>`;
    const q = query.trim().toLowerCase();
    if (q || catF || areaF) {
      const live = all.filter((e) => e.start > E.now() - 3 * 3600000);
      const cats = [...new Set(live.map((e) => e.cat))];
      const chips = `<div class="lp-chips lp-chips-scroll mb-4" data-rail="cat">${[['__all', L('Semua', 'All')]].concat(cats.map((c) => [c, catName(c)])).map(([c, l]) => { const on = c === '__all' ? !catF || catF === '__all' : catF === c; return `<button type="button" class="lp-chip${on ? ' on' : ''}" data-cat="${esc(c)}" aria-pressed="${on}">${on ? ic('check', 'text-[18px]') : c === '__all' ? '' : ic(evIcon(c), 'text-[18px]')}${esc(l)}</button>`; }).join('')}</div>`;
      const hit = live.filter((e) => (!catF || catF === '__all' || e.cat === catF) && (!areaF || inArea(e, areaF)) && (!q || [e.name, e.tagline, e.venue, e.cat, CAT_EN[e.cat] || '', e.org || ''].join(' ').toLowerCase().includes(q))).sort((a, b) => a.start - b.start);
      const qs = esc(query.trim());
      const label = en()
        ? `${nEvents(hit.length)}${q ? ` for "${qs}"` : ''}${catF && catF !== '__all' ? ` in ${esc(catName(catF))}` : ''}${areaF ? ` at ${esc(areaF)}` : ''}`
        : `${hit.length} acara${q ? ` untuk "${qs}"` : ''}${catF && catF !== '__all' ? ` di kategori ${esc(catF)}` : ''}${areaF ? ` di ${esc(areaF)}` : ''}`;
      const ax = areaF ? AREAS.find((x) => x.key === areaF) : null;
      return `<button type="button" class="lp-back" data-reset>${ic('arrow_back', 'text-[18px]')}${L('Beranda', 'Home')}</button>
        <h1 class="lp-title-lg">${ax ? `${plate(ax.floor, true)} ${esc(ax.key)}` : q ? L('Hasil pencarian', 'Search results') : L('Semua acara', 'All events')}</h1>
        ${chips}
        <div class="lp-result-bar"><p class="lp-lead" aria-live="polite">${label}</p>${areaF ? `<button type="button" class="lp-chip on" data-area="">${esc(areaF)}${ic('close', 'text-[16px]')}<span class="sr-only">${L('Hapus saringan area', 'Remove area filter')}</span></button>` : ''}</div>
        ${hit.length ? `<div class="lp-grid">${hit.map(card).join('')}</div>` : `<div class="lp-empty"><p>${L('Tidak ada acara yang cocok. Coba kata lain atau pilih Semua.', 'No matching events. Try another word or choose All.')}</p><button type="button" class="btn-ghost" data-reset>${L('Kembali ke beranda', 'Back to home')}</button></div>`}`;
    }
    return homeSections(all);
  };

  // Detail acara. Ponsel: satu kolom + bilah harga di bawah. Desktop: konten kiri, kotak beli menempel di kanan.
  V.event = (id) => {
    const e = E.ev(id); if (!e) return notFound();
    const s = E.stats(id); const sale = E.saleState(e);
    const onSale = e.types.filter((t) => t.onSale);
    const x = areaOf(e);
    const row = (icon, html) => `<div class="lp-fact">${ic(icon, 'text-[20px]')}<div>${html}</div></div>`;
    const tix = (t) => {
      const p = s.per[t.id]; const sold = t.onSale && p.available === 0;
      const st = !t.onSale ? badge(L('Tidak dijual', 'Not for sale'), 'neutral') : sold ? badge(L('Habis terjual', 'Sold out'), 'danger') : p.available < 10 ? badge(L('Sisa ' + p.available, p.available + ' left'), 'warning') : badge(L('Tersedia', 'Available'), 'success');
      return `<div class="pv-tix" style="--c:${esc(t.color)}"><div class="px-4 pt-3 pb-3"><div class="flex items-start justify-between gap-2"><div class="font-label-lg text-label-lg">${esc(t.name)}</div>${st}</div>
          <div class="lp-help mt-1">${esc(perks(t))}</div></div>
        <div class="pv-dash mx-4"></div>
        <div class="px-4 py-3 flex items-center justify-between gap-2"><span class="lp-price">${t.price ? rp(t.price) : free()}</span><span class="lp-help text-right">${L('Penjualan berakhir', 'Sales end')}<br>${fDT(e.saleEnd)} WIB</span></div></div>`;
    };
    const sk = en() ? [
      'One e-ticket is valid for one person and one entry.',
      `Maximum ${e.maxPerOrder} tickets per order.`,
      `Seats you choose are held for ${e.holdMin} minutes. Once the order is created, payment must be completed within ${E.PAY_MIN} minutes.`,
      'Enter the booker\'s name as on their ID. Gate staff may check the name on the e-ticket.',
      `Show the e-ticket QR at the gate. Gates open at ${fTime(e.doors)} WIB.`,
      'If the organiser cancels the event, you are refunded automatically and the e-ticket is no longer valid.',
      'Prototype: payments use a sandbox simulation, no money is charged.',
    ] : [
      'Satu e-ticket berlaku untuk satu orang dan satu kali masuk.',
      `Maksimal ${e.maxPerOrder} tiket per pesanan.`,
      `Kursi yang kamu pilih ditahan ${e.holdMin} menit. Setelah pesanan dibuat, pembayaran harus selesai dalam ${E.PAY_MIN} menit.`,
      'Isi nama pemesan sesuai identitas. Petugas gate dapat mencocokkan nama pada e-ticket.',
      `Tunjukkan QR e-ticket di gate. Gate dibuka pukul ${fTime(e.doors)} WIB.`,
      'Bila acara dibatalkan pengelola, dana dikembalikan otomatis dan e-ticket tidak berlaku lagi.',
      'Prototipe: pembayaran memakai simulasi sandbox, tidak ada uang yang ditarik.',
    ];
    const terms = L('Syarat & ketentuan', 'Terms & conditions');
    const a = avail(e);
    const cta = sale.open && a.left > 0 ? `<a href="/pengunjung/e/${id}/kategori" class="btn lp-cta">${ic('confirmation_number', 'text-[18px]')}${L('Beli tiket', 'Buy tickets')}</a>`
      : sale.open ? `<a href="/pengunjung/e/${id}/kategori" class="btn-ghost lp-cta">${ic('hourglass_top', 'text-[18px]')}${L('Daftar tunggu', 'Waiting list')}</a>`
      : `<span class="lp-cta-note">${ic('info', 'text-[18px]')}${esc(saleLabel(e))}</span>`;
    return `${back('/pengunjung', L('Semua acara', 'All events'))}
      <div class="lp-detail"><div class="lp-detail-main">
        <div class="lp-detail-img">${photo(e)}<span class="lp-cat">${esc(catName(e.cat))}</span></div>
        <h1 class="lp-title-lg lp-detail-title">${esc(e.name)}</h1>
        ${e.tagline ? `<p class="lp-lead">${esc(e.tagline)}</p>` : ''}
        <div class="lp-facts">
          ${row('calendar_month', `<b>${fDate(e.start)}</b><span>${L(`Mulai ${fTime(e.start)} WIB, gate dibuka ${fTime(e.doors)} WIB`, `Starts ${fTime(e.start)} WIB, gates open ${fTime(e.doors)} WIB`)}</span>`)}
          ${row('location_on', `<b class="flex items-center gap-2">${plate(x.floor)}${esc(x.key)}</b><span>Summarecon Mall Bandung${x.note ? ' · ' + esc(tx2(x.note)) : ''}</span>`)}
          ${row('storefront', `<b>${esc(e.org || 'Summarecon Mall Bandung')}</b><span>${L('Penyelenggara', 'Organiser')}</span>`)}
        </div>
        <button type="button" id="share" class="lp-more">${ic('share', 'text-[18px]')}<span class="ml-1">${L('Bagikan acara', 'Share event')}</span></button>
        <nav class="pv-tabs" aria-label="${L('Bagian acara', 'Event sections')}"><button type="button" data-jump="desk" class="on">${L('Deskripsi', 'Description')}</button><button type="button" data-jump="tiket">${L('Tiket', 'Tickets')}</button><button type="button" data-jump="sk">${terms}</button></nav>
        <section id="sec-desk" class="pv-sec"><h2 class="lp-title mb-2">${L('Deskripsi', 'Description')}</h2><p class="lp-body whitespace-pre-line">${esc(e.desc || L('Belum ada deskripsi.', 'No description yet.'))}</p></section>
        <section id="sec-tiket" class="pv-sec"><h2 class="lp-title">${L('Tiket', 'Tickets')}</h2>
          <p class="lp-lead mb-3">${L(`${onSale.length} kategori tiket, harga mulai dari ${priceTxt(e)}`, `${onSale.length} ticket ${onSale.length === 1 ? 'category' : 'categories'}, from ${priceTxt(e)}`)}</p>
          <div class="lp-tix-grid">${e.types.map(tix).join('')}</div></section>
        <section id="sec-sk" class="pv-sec"><h2 class="lp-title mb-2">${terms}</h2>
          <ol class="list-decimal pl-5 flex flex-col gap-1.5 lp-body-sm">${sk.map((y) => `<li>${esc(y)}</li>`).join('')}</ol></section>
      </div>
      <aside class="lp-side"><div class="lp-cartbar lp-buybox">
        <div class="lp-buybox-info"><p class="lp-from">${L('Harga mulai dari', 'Prices from')}</p><p class="lp-price lp-price-lg">${priceTxt(e)}</p>
          <ul class="lp-buybox-facts"><li>${ic('calendar_month', 'text-[18px]')}${when(e)}</li><li>${ic('door_open', 'text-[18px]')}${L('Gate dibuka', 'Gates open')} ${fTime(e.doors)} WIB</li><li>${ic('confirmation_number', 'text-[18px]')}${a.left ? L(`Sisa ${a.left} dari ${a.total} tiket`, `${a.left} of ${a.total} tickets left`) : L('Habis terjual', 'Sold out')}</li></ul></div>
        ${cta}</div></aside></div>`;
  };

  // Keranjang (langkah kategori & kursi): tiket yang ditahan, total, tombol Lanjut.
  // Ponsel: bilah tetap di bawah. Desktop: panel menempel di kolom kanan.
  function cartBar(e, id, h) {
    const pr = E.price(e, h.items);
    const sumByType = {}; h.items.forEach((i) => (sumByType[i.type] = (sumByType[i.type] || 0) + 1));
    const n = h.items.length;
    return `<aside class="lp-side"><div class="lp-cartbar">
        <h2 class="lp-cart-h">${L('Pesananmu', 'Your order')}</h2>
        <div class="lp-cart-event">${photo(e)}<div class="min-w-0"><b>${esc(e.name)}</b><span>${when(e)}</span></div></div>
        ${n ? `<div class="lp-cart-items">${h.items.filter((i) => i.seat).map((i) => `<span class="lp-seatchip" style="--c:${esc(E.typeById(e, i.type).color)}">${i.seat}</span>`).join('')}${Object.entries(sumByType).filter(([tid]) => !E.typeById(e, tid).seated).map(([tid, k]) => `<span class="lp-seatchip" style="--c:${esc(E.typeById(e, tid).color)}">${k}× ${esc(E.typeById(e, tid).name)}</span>`).join('')}</div>` : `<p class="lp-help lp-cart-empty">${L('Belum ada tiket dipilih.', 'No tickets selected yet.')}</p>`}
        <div class="lp-cart-foot"><div><p class="lp-from">${L(n + ' tiket', n + (n === 1 ? ' ticket' : ' tickets'))}${pr.fee ? L(' + biaya layanan', ' + service fee') : ''}</p><p class="lp-price lp-price-lg">${n ? rp(pr.total) : '–'}</p></div>
          <a href="/pengunjung/e/${id}/data" class="btn ${n ? '' : 'is-disabled'}" ${n ? '' : 'aria-disabled="true" tabindex="-1"'}>${L('Lanjut', 'Continue')}${ic('arrow_forward', 'text-[18px]')}</a></div></div></aside>`;
  }
  // Bilah "Ditahan untukmu": tepat di bawah header (ikut menempel saat digulir), berisi sisa waktu tahan.
  const holdBar = (h, canClear) => (h.items.length ? `<div class="lp-holdbar" role="status"><div class="lp-holdbar-in">${ic('lock_clock', 'text-[20px]')}
      <span class="flex-1 min-w-0">${L('Ditahan untukmu', 'Held for you')} <b class="lp-holdbar-t" data-until="${h.until}">--:--</b><span class="lp-holdbar-n"> · ${L(h.items.length + ' tiket', h.items.length + (h.items.length === 1 ? ' ticket' : ' tickets'))}</span></span>
      ${canClear ? `<button type="button" class="lp-holdbar-x" id="clear">${L('Lepas semua', 'Release all')}</button>` : ''}</div></div>` : '');
  const saleNotice = (e) => `<div class="inner p-3 mb-3 font-body-sm text-body-sm text-amber-300">${esc(saleLabel(e))}. ${L('Tiket belum bisa dipilih.', 'Tickets cannot be selected right now.')}</div>`;
  const waitBtn = (tid) => `<button class="btn-ghost" data-wl="${tid}">${ic('hourglass_top', 'text-[16px]')} ${L('Daftar tunggu', 'Waiting list')}</button>`;

  // Langkah 1: pilih kategori. Kategori bernomor kursi -> lanjut ke denah kategori itu; tanpa nomor kursi -> atur jumlah di sini.
  V.cats = (id) => {
    const e = E.ev(id); if (!e) return notFound();
    const s = E.stats(id); const sale = E.saleState(e); const h = E.cartHolds(id, cart);
    const held = (tid) => h.items.filter((i) => i.type === tid).length;
    const card = (t) => {
      const p = s.per[t.id]; const n = held(t.id); const soldOut = p.available === 0 && !n;
      const st = soldOut ? [L('Habis terjual', 'Sold out'), 'text-rose-300'] : p.available < 10 ? [left(p.available), 'text-amber-300'] : [L('Tersedia', 'Available'), 'text-emerald-300'];
      const action = !sale.open ? ''
        : soldOut ? waitBtn(t.id)
        : t.seated ? `<a href="/pengunjung/e/${id}/kursi?kat=${encodeURIComponent(t.id)}" class="btn">${n ? L(n + ' kursi dipilih, ubah', n + (n === 1 ? ' seat' : ' seats') + ' chosen, change') : L('Pilih kursi', 'Choose seats')} ${ic('arrow_forward', 'text-[18px]')}</a>`
        : `<div class="flex items-center gap-2"><button class="btn-ghost !px-2" data-qty="${t.id}" data-d="-1" ${n === 0 ? 'disabled' : ''} aria-label="${L('Kurangi', 'Remove')} ${esc(t.name)}">${ic('remove')}</button><span class="w-6 text-center font-headline-sm text-headline-sm" aria-live="polite">${n}</span><button class="btn-ghost !px-2" data-qty="${t.id}" data-d="1" ${p.available === 0 ? 'disabled' : ''} aria-label="${L('Tambah', 'Add')} ${esc(t.name)}">${ic('add')}</button></div>`;
      return `<div class="pv-tix ${n ? 'pv-tix-on' : ''}" style="--c:${esc(t.color)}"><div class="px-4 pt-3 pb-3"><div class="flex items-start justify-between gap-2"><div class="font-label-lg text-label-lg">${esc(t.name)}</div><span class="font-label-md text-label-md whitespace-nowrap ${st[1]}">${st[0]}</span></div>
          <div class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">${esc(perks(t))}</div></div>
        <div class="pv-dash mx-4"></div>
        <div class="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"><span class="font-headline-sm text-headline-sm">${t.price ? rp(t.price) : free()}</span>${action}</div></div>`;
    };
    const intro = hasSeats(e)
      ? L('Pilih kategori dulu. Untuk kategori bernomor kursi, kursinya kamu pilih di langkah berikutnya.', 'Choose a category first. For numbered-seat categories you pick your seats in the next step.')
      : L('Tentukan jumlah tiket untuk tiap kategori.', 'Set the number of tickets for each category.');
    return `${holdBar(h, true)}<div class="lp-flow"><div class="lp-flow-main">${back('/pengunjung/e/' + id, esc(e.name))}${steps('kategori', e)}
      <h1 class="font-headline-md text-headline-md">${L('Pilih kategori tiket', 'Choose a ticket category')}</h1>
      <p class="font-body-sm text-body-sm text-on-surface-variant mb-3">${intro} ${L(`Maksimal ${e.maxPerOrder} tiket per pesanan.`, `Maximum ${e.maxPerOrder} tickets per order.`)}</p>
      ${!sale.open ? saleNotice(e) : ''}
      <div class="flex flex-col gap-3 mb-3">${e.types.filter((t) => t.onSale).map(card).join('')}</div>
      </div>${cartBar(e, id, h)}</div>`;
  };

  // Langkah 2: pilih kursi, hanya untuk kategori yang dipilih (kursi kategori lain samar dan tidak bisa diketuk).
  V.seats = (id, kat) => {
    const e = E.ev(id); if (!e) return notFound();
    const t = E.typeById(e, kat);
    const s = E.stats(id); const sale = E.saleState(e); const h = E.cartHolds(id, cart); const p = s.per[t.id];
    const n = h.items.filter((i) => i.type === t.id).length;
    const more = e.types.some((x) => x.onSale && x.id !== t.id);
    const price = t.price ? rp(t.price) : free();
    const intro = en()
      ? `${price} per seat, ${p.available} seats left${n ? ', ' + n + ' chosen by you' : ''}. Tap a coloured seat to choose it; seats are held for you for ${e.holdMin} minutes. Seats in other categories are dimmed.`
      : `${price} per kursi, sisa ${p.available} kursi${n ? ', ' + n + ' sudah kamu pilih' : ''}. Ketuk kursi berwarna untuk memilih; kursi ditahan untukmu selama ${e.holdMin} menit. Kursi kategori lain tampil samar.`;
    return `${holdBar(h, true)}<div class="lp-flow"><div class="lp-flow-main">${back('/pengunjung/e/' + id + '/kategori', L('Ganti kategori', 'Change category'))}${steps('kursi', e)}
      <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full shrink-0" style="background:${esc(t.color)}"></span><h1 class="font-headline-md text-headline-md">${L('Pilih kursi', 'Choose seats:')} ${esc(t.name)}</h1></div>
      <p class="font-body-sm text-body-sm text-on-surface-variant mb-3">${intro}</p>
      ${!sale.open ? saleNotice(e) : ''}
      ${p.available === 0 && !n ? `<div class="inner p-3 mb-3 flex items-center justify-between gap-3 font-body-sm text-body-sm"><span>${esc(t.name)} ${L('habis terjual.', 'is sold out.')}</span>${waitBtn(t.id)}</div>` : ''}
      <section class="card p-3 mb-3">${seatTxt(E.seatMap(id, { cart, only: t.id, lock: true }))}
        <p class="font-label-sm text-label-sm text-on-surface-variant text-center mt-1 sm:hidden">${ic('swipe', 'text-[14px] align-middle')} ${L('Geser denah ke kiri/kanan untuk melihat semua kursi', 'Swipe the map left/right to see all seats')}</p></section>
      <section class="card p-4 mb-3">${seatTxt(E.legend(e))}</section>
      ${more ? `<p class="font-body-sm text-body-sm text-on-surface-variant mb-3">${L('Mau tambah kategori lain?', 'Want another category too?')} <a class="text-primary" href="/pengunjung/e/${id}/kategori">${L('Kembali ke pilihan kategori', 'Back to categories')}</a>. ${L('Kursi yang sudah kamu pilih tetap tersimpan.', 'Seats you have chosen stay saved.')}</p>` : ''}
      <details class="card p-4 mb-3"><summary class="flex items-center justify-between font-label-lg text-label-lg">${ic('verified_user', 'text-secondary text-[18px]')} <span class="flex-1 ml-2">${L('Bagaimana kursi dijamin tidak dobel?', 'How are seats never double-booked?')}</span>${ic('expand_more')}</summary>
        <ol class="list-decimal pl-5 mt-3 flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">${en() ? `
          <li>As soon as you tap a seat, it shows as <b class="text-amber-300">being booked</b> to every other visitor for ${e.holdMin} minutes.</li>
          <li>Every booking is recorded as a transaction with a version number. If two people tap the same seat in the same second, the server accepts only the first; the second is rejected automatically.</li>
          <li>At payment, the system checks again that the seat is still held for your order and has not expired, then the seat becomes <b>sold</b>.</li>
          <li>If the seat hold or payment deadline runs out, the seat becomes available to others again.</li>` : `
          <li>Begitu kamu mengetuk kursi, kursi berstatus <b class="text-amber-300">sedang dipesan</b> untuk semua pengunjung lain selama ${e.holdMin} menit.</li>
          <li>Setiap pemesanan dicatat sebagai transaksi dengan nomor versi. Bila dua orang menekan kursi yang sama pada detik yang sama, server hanya menerima yang pertama; yang kedua otomatis ditolak.</li>
          <li>Saat pembayaran, sistem memeriksa ulang bahwa kursi masih ditahan untuk pesananmu dan belum kedaluwarsa, lalu kursi menjadi <b>terjual</b>.</li>
          <li>Jika waktu penahanan kursi atau batas pembayaran habis, kursi kembali tersedia untuk orang lain.</li>`}</ol></details>
      </div>${cartBar(e, id, h)}</div>`;
  };

  const seatOf = (seat) => L(', kursi ', ', seat ') + '<b>' + seat + '</b>';
  V.data = (id) => {
    const e = E.ev(id); if (!e) return notFound();
    const h = E.cartHolds(id, cart);
    const again = L('Pilih tiket lagi', 'Choose tickets again');
    if (!h.items.length) return `${back('/pengunjung/e/' + id + '/kategori', again)}<div class="card p-6 text-center">${ic('timer_off', 'text-[40px] text-amber-300')}<h2 class="font-headline-sm text-headline-sm mt-2">${L('Waktu penahanan kursi habis', 'Your seat hold has expired')}</h2><p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${L('Kursi sudah dilepas dan kini bisa dipesan orang lain.', 'The seats were released and can now be booked by others.')}</p><a href="/pengunjung/e/${id}/kategori" class="btn mt-4">${again}</a></div>`;
    const pr = E.price(e, h.items);
    const saved = JSON.parse(sessionStorage.getItem('smicc-evt-form') || '{}');
    if (me && !saved.email) Object.assign(saved, { name: me.name, email: me.email, phone: me.phone, cc: me.cc }); // isi dari akun yang masuk
    const cc = CC.find((x) => x.k === saved.cc) || CC[0];
    const go = pr.total ? L('Buat pesanan & bayar', 'Place order & pay') : L('Konfirmasi pendaftaran', 'Confirm registration');
    const field = (name, label, input, help) => `<div class="lp-field" data-field="${name}"><label for="f-${name}" class="lp-label">${label}</label>${input}<p class="lp-help" id="h-${name}" data-help="${esc(help)}">${help}</p></div>`;
    return `${holdBar(h, false)}${back('/pengunjung/e/' + id + '/kategori', L('Ubah tiket', 'Change tickets'))}${steps('data', e)}
      <h1 class="font-headline-md text-headline-md mb-3">${L('Ringkasan & data diri', 'Summary & your details')}</h1>
      ${orderSummary(e, h.items, pr, L(`Kursi ditahan, belum dibayar. Setelah pesanan dibuat, kamu punya ${E.PAY_MIN} menit untuk membayar.`, `Seats held, not yet paid. Once the order is created you have ${E.PAY_MIN} minutes to pay.`))}
      <form id="f-order" class="flex flex-col gap-4" novalidate>
        <section class="card p-4 flex flex-col gap-4"><h2 class="font-headline-sm text-headline-sm">${L('Data diri pemesan', 'Booker details')}</h2>
          ${field('name', L('Nama lengkap', 'Full name'), `<input id="f-name" class="inp" name="name" autocomplete="name" value="${esc(saved.name || '')}" placeholder="${L('Nama sesuai identitas', 'Name as on your ID')}" aria-describedby="h-name">`, L('Sesuai KTP atau kartu pelajar.', 'As on your ID card.'))}
          ${field('email', 'Email', `<input id="f-email" class="inp" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" value="${esc(saved.email || '')}" placeholder="nama@gmail.com" aria-describedby="h-email">`, L('E-ticket dikirim ke email ini.', 'Your e-ticket is sent to this email.'))}
          ${field('phone', L('Nomor WhatsApp', 'WhatsApp number'), `<div class="lp-phone"><div class="lp-cc"><span class="pv-flag" data-cc-flag aria-hidden="true">${cc.flag()}</span><span class="lp-cc-code" data-cc-code>+${cc.code}</span>${ic('expand_more', 'text-[18px]')}
              <select name="cc" aria-label="${L('Kode negara', 'Country code')}">${CC.map((x) => `<option value="${x.k}" ${x === cc ? 'selected' : ''}>${esc(tx2(x.name))} (+${x.code})</option>`).join('')}</select></div>
            <input id="f-phone" class="inp" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" value="${esc(saved.phone || '')}" placeholder="812 3456 7890" aria-describedby="h-phone"></div>`, L('Pengingat acara dikirim lewat WhatsApp. Tanpa angka 0 di depan.', 'Event reminders are sent via WhatsApp. No leading 0.'))}
          ${h.items.length > 1 ? `<details><summary class="font-label-md text-label-md text-primary">${ic('group', 'text-[16px] align-middle')} ${L('Nama berbeda untuk tiap tiket (opsional)', 'A different name for each ticket (optional)')}</summary><div class="flex flex-col gap-2 mt-2">${h.items.map((it, i) => `<label class="f">${L('Tiket', 'Ticket')} ${i + 1}: ${esc(E.typeById(e, it.type).name)}${it.seat ? L(', kursi ', ', seat ') + it.seat : ''}<input class="inp" name="holder${i}" placeholder="${L('Sama dengan pemesan', 'Same as booker')}"></label>`).join('')}</div></details>` : ''}
          <p class="font-label-sm text-label-sm text-on-surface-variant">${L('Prototipe: gunakan data contoh, bukan data pribadi asli.', 'Prototype: use sample data, not real personal details.')}</p></section>
        <div class="lp-consents">
          <label class="lp-check" for="accept_toc"><input type="checkbox" id="accept_toc" name="accept_toc"><span>${L(`Dengan mengklik "${go}", kamu menyetujui <a href="#" data-policy="tnc">Syarat &amp; Ketentuan</a> dan <a href="#" data-policy="privacy">Kebijakan Privasi</a> Summarecon Mall Bandung.`, `By clicking "${go}", you agree to the Summarecon Mall Bandung <a href="#" data-policy="tnc">Terms &amp; Conditions</a> and <a href="#" data-policy="privacy">Privacy Policy</a>.`)}</span></label>
          <label class="lp-check" for="accept_consent"><input type="checkbox" id="accept_consent" name="accept_consent"><span>${L(`Dengan mengklik "${go}", kamu menyetujui <a href="#" data-policy="pii">Kebijakan Pemrosesan Data Pribadi</a> Summarecon Mall Bandung.`, `By clicking "${go}", you agree to the Summarecon Mall Bandung <a href="#" data-policy="pii">Personal Data Processing Policy</a>.`)}</span></label>
          <p class="lp-err" id="h-consent" hidden></p></div>
        <button class="btn justify-center !py-3">${ic(pr.total ? 'payments' : 'how_to_reg')} ${go}</button>
      </form>`;
  };

  // Ringkasan pesanan: selalu di bagian paling atas (langkah data diri dan halaman pesanan).
  function orderSummary(e, items, pr, note, extra) {
    return `<section class="card p-4 mb-4"><h2 class="font-headline-sm text-headline-sm mb-2">${L('Ringkasan pesanan', 'Order summary')}</h2>
      <div class="flex gap-3 items-start">${e.img ? `<img src="${esc(e.img)}" alt="" class="lp-sum-img">` : ''}<div class="font-body-sm text-body-sm min-w-0"><b>${esc(e.name)}</b><br><span class="text-on-surface-variant">${fDate(e.start)} · ${fTime(e.start)} WIB<br>${esc(e.venue)}</span></div></div>
      <div class="mt-3 flex flex-col divide-y divide-white/5">${items.map((it) => { const t = E.typeById(e, it.type); return `<div class="flex justify-between gap-3 py-2 font-body-sm text-body-sm"><span><span class="inline-block w-2 h-2 rounded-full mr-1" style="background:${t.color}"></span>${esc(t.name)}${it.seat ? seatOf(it.seat) : L(', tanpa nomor kursi', ', unnumbered')}</span><span class="whitespace-nowrap">${rp(it.price != null ? it.price : t.price)}</span></div>`; }).join('')}
        <div class="flex justify-between py-2 font-body-sm text-body-sm text-on-surface-variant"><span>${L('Biaya layanan', 'Service fee')}</span><span>${pr.fee ? rp(pr.fee) : '–'}</span></div>
        <div class="flex justify-between py-2 font-headline-sm text-headline-sm"><span>Total</span><span>${rp(pr.total)}</span></div></div>
      ${note ? `<p class="font-label-sm text-label-sm text-on-surface-variant mt-1">${note}</p>` : ''}${extra || ''}</section>`;
  }

  // ---------------------------------------------------------------- data diri: kode negara, validasi email & nomor WhatsApp
  const CC = [
    { k: 'ID', code: '62', name: 'Indonesia', min: 9, max: 12, lead: '8', flag: () => FLAG.id },
    { k: 'MY', code: '60', name: 'Malaysia', min: 9, max: 10, lead: '1', flag: () => FLAG.my },
    { k: 'SG', code: '65', name: ['Singapura', 'Singapore'], min: 8, max: 8, lead: '', flag: () => FLAG.sg },
  ];
  const phoneDigits = (v, cc) => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith(cc.code) && d.length > cc.max) d = d.slice(cc.code.length); return d.replace(/^0+/, ''); };
  function checkField(name, f) {
    const v = String(f[name] || '').trim();
    if (name === 'name') {
      if (!v) return L('Nama lengkap wajib diisi.', 'Full name is required.');
      if (v.length < 3) return L('Nama minimal 3 huruf.', 'Name must be at least 3 letters.');
      if (!/^[\p{L} .,'-]+$/u.test(v)) return L('Nama hanya boleh berisi huruf, spasi, titik, dan tanda hubung.', 'Name may only contain letters, spaces, full stops and hyphens.');
      return '';
    }
    if (name === 'email') {
      if (!v) return L('Email wajib diisi agar e-ticket bisa dikirim.', 'Email is required so we can send your e-ticket.');
      if (!v.includes('@')) return L('Email harus mengandung tanda @.', 'The email must contain an @ sign.');
      return '';
    }
    if (name === 'phone') {
      const cc = CC.find((x) => x.k === f.cc) || CC[0];
      const d = phoneDigits(v, cc);
      if (!d) return L('Nomor WhatsApp wajib diisi.', 'WhatsApp number is required.');
      if (/[^\d\s+()-]/.test(v)) return L('Nomor hanya boleh berisi angka.', 'The number may only contain digits.');
      if (cc.lead && !d.startsWith(cc.lead)) return cc.k === 'ID' ? L('Nomor ponsel Indonesia diawali angka 8, contoh 812 3456 7890.', 'Indonesian mobile numbers start with 8, e.g. 812 3456 7890.') : L(`Nomor ponsel ${tx2(cc.name)} diawali angka ${cc.lead}.`, `${tx2(cc.name)} mobile numbers start with ${cc.lead}.`);
      if (d.length < cc.min || d.length > cc.max) return cc.min === cc.max ? L(`Nomor harus ${cc.min} angka (tanpa +${cc.code}).`, `The number must be ${cc.min} digits (without +${cc.code}).`) : L(`Nomor harus ${cc.min}-${cc.max} angka (tanpa 0 atau +${cc.code} di depan).`, `The number must be ${cc.min}-${cc.max} digits (without a leading 0 or +${cc.code}).`);
      return '';
    }
    return '';
  }
  function showErr(form, name, msg) {
    const box = form.querySelector(`[data-field="${name}"]`); if (!box) return;
    const inp = box.querySelector('.inp'); const help = box.querySelector('.lp-help');
    inp.classList.toggle('is-err', !!msg); inp.setAttribute('aria-invalid', String(!!msg));
    help.classList.toggle('lp-err', !!msg);
    help.innerHTML = msg ? ic('error', 'text-[16px]') + '<span>' + msg + '</span>' : help.dataset.help;
  }
  function validateOrder(form) {
    const f = Object.fromEntries(new FormData(form));
    let first = null;
    ['name', 'email', 'phone'].forEach((k) => { const m = checkField(k, f); showErr(form, k, m); if (m && !first) first = form.querySelector('#f-' + k); });
    const okC = form.accept_toc.checked && form.accept_consent.checked;
    const ce = form.querySelector('#h-consent');
    ce.hidden = okC; ce.innerHTML = okC ? '' : ic('error', 'text-[16px]') + '<span>' + L('Centang kedua persetujuan di atas untuk melanjutkan.', 'Tick both agreements above to continue.') + '</span>';
    if (!first && !okC) first = !form.accept_toc.checked ? form.accept_toc : form.accept_consent;
    if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); return null; }
    const cc = CC.find((x) => x.k === f.cc) || CC[0];
    return { name: f.name.trim().replace(/\s+/g, ' '), email: f.email.trim().toLowerCase(), phone: '+' + cc.code + ' ' + phoneDigits(f.phone, cc).replace(/^(\d{3})(\d{3,4})(\d+)$/, '$1-$2-$3'), holders: Object.keys(f).filter((k) => k.startsWith('holder')).map((k) => f[k].trim()) };
  }
  // Isi singkat kebijakan untuk prototipe (contoh, bukan dokumen hukum resmi).
  const POLICY = () => ({
    tnc: [L('Syarat & Ketentuan', 'Terms & Conditions'), [L('Satu e-ticket berlaku untuk satu orang dan satu kali masuk.', 'One e-ticket is valid for one person and one entry.'), L('Pesanan yang belum dibayar sampai batas waktu dibatalkan otomatis dan kursinya dilepas.', 'Orders not paid by the deadline are cancelled automatically and the seats released.'), L('Bila acara dibatalkan penyelenggara, dana dikembalikan penuh secara otomatis.', 'If the organiser cancels the event, you are refunded in full automatically.'), L('Tiket tidak dapat dipindahtangankan setelah check-in.', 'Tickets cannot be transferred after check-in.')]],
    privacy: [L('Kebijakan Privasi', 'Privacy Policy'), [L('Kami menyimpan nama, email, dan nomor WhatsApp untuk menerbitkan dan mengirim e-ticket.', 'We store your name, email and WhatsApp number to issue and send your e-ticket.'), L('Data tidak dijual ke pihak lain.', 'Your data is never sold to third parties.'), L('Kamu dapat meminta data dihapus lewat Customer Service GF.', 'You can ask for your data to be deleted at Customer Service, GF.')]],
    pii: [L('Kebijakan Pemrosesan Data Pribadi', 'Personal Data Processing Policy'), [L('Data diproses sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.', 'Data is processed under Indonesian Law No. 27 of 2022 on Personal Data Protection.'), L('Data dibagikan ke penyelenggara acara hanya untuk check-in dan informasi acara.', 'Data is shared with the event organiser only for check-in and event information.'), L('Data pesanan disimpan paling lama 2 tahun setelah acara selesai.', 'Order data is kept for at most 2 years after the event.')]],
  });
  V.order = (oid) => {
    const o = E.s.orders[oid]; if (!o) return notFound(L('Pesanan tidak ditemukan.', 'Order not found.'));
    const e = E.ev(o.ev);
    const head = `${back('/pengunjung/tiket', L('Tiket saya', 'My tickets'))}<div class="flex items-center justify-between mb-3"><div><div class="font-label-md text-label-md text-on-surface-variant">${L('Kode booking', 'Booking code')}</div><div class="font-headline-md text-headline-md">${o.id}</div></div>${statusChip(o.status)}</div>`;
    const summary = orderSummary(e, o.items, { fee: o.fee, total: o.total }, '', `<div class="pv-dash mt-2 pt-3 font-label-sm text-label-sm text-on-surface-variant">${ic('person', 'text-[16px] align-middle')} ${esc(o.name)} · ${esc(o.email)} · ${esc(o.phone)}</div>`);
    if (o.status === 'PENDING' && o.until > E.now()) return head.replace('</a>', '</a>' + steps('bayar', e)) + summary + payView(o);
    if (o.status === 'PAID') return head + summary + ticketsView(o, e);
    const payOver = L('Batas waktu pembayaran habis', 'Payment time limit reached');
    const msg = {
      EXPIRED: ['timer_off', payOver, L('Kursi sudah dilepas. Pesan ulang bila kursi masih tersedia.', 'The seats were released. Book again if seats are still available.')],
      CANCELLED: ['cancel', L('Pesanan dibatalkan', 'Order cancelled'), L('Kursi sudah dilepas.', 'The seats were released.')],
      REFUNDED: ['currency_exchange', L('Pesanan di-refund', 'Order refunded'), (o.refundReason ? o.refundReason.replace(/\.?\s*$/, '. ') : '') + L('E-ticket tidak berlaku lagi.', 'The e-ticket is no longer valid.')],
      PENDING: ['timer_off', payOver, L('Kursi dilepas.', 'The seats were released.')],
    }[o.status];
    return head + summary + `<div class="card p-6 text-center mb-4">${ic(msg[0], 'text-[40px] text-on-surface-variant')}<h2 class="font-headline-sm text-headline-sm mt-2">${msg[1]}</h2><p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${esc(msg[2])}</p><a href="/pengunjung/e/${e.id}" class="btn mt-4">${L('Lihat acara', 'View event')}</a></div>`;
  };
  function payView(o) {
    const M = [['QRIS', 'qr_code_2', L('QRIS (semua bank & e-wallet)', 'QRIS (all banks & e-wallets)')], ['VA BCA', 'account_balance', 'Virtual Account BCA'], ['VA Mandiri', 'account_balance', 'Virtual Account Mandiri'], ['GoPay', 'account_balance_wallet', 'GoPay'], ['OVO', 'account_balance_wallet', 'OVO'], ['DANA', 'account_balance_wallet', 'DANA'], ['Kartu Kredit', 'credit_card', L('Kartu kredit/debit', 'Credit/debit card')]];
    const va = '8808' + String(Math.abs(o.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 1e10).padStart(10, '0');
    const instr = payMethod === 'QRIS' ? `<div class="flex flex-col items-center gap-2"><div class="paper p-2 rounded-lg">${E.qrSvg('SANDBOX-QRIS|' + o.id + '|' + o.total, 170)}</div><span class="font-label-sm text-label-sm text-amber-300">${L('QR sandbox, tidak bisa dibayar sungguhan', 'Sandbox QR, cannot be paid for real')}</span></div>`
      : payMethod.startsWith('VA') ? `<div class="inner p-3"><div class="lbl">${L('Nomor virtual account (sandbox)', 'Virtual account number (sandbox)')}</div><div class="font-headline-md text-headline-md">${va}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${L(`Transfer tepat ${rp(o.total)} melalui m-banking/ATM.`, `Transfer exactly ${rp(o.total)} via mobile banking/ATM.`)}</div></div>`
      : payMethod === 'Kartu Kredit' ? `<div class="inner p-3 font-body-sm text-body-sm text-on-surface-variant">${L('Di versi produksi, pengunjung diarahkan ke halaman 3-D Secure milik gerbang pembayaran. Prototipe ini <b class="text-on-surface">tidak meminta data kartu apa pun</b>.', 'In production, visitors are sent to the payment gateway\'s 3-D Secure page. This prototype <b class="text-on-surface">never asks for any card details</b>.')}</div>`
      : `<div class="inner p-3 font-body-sm text-body-sm text-on-surface-variant">${L(`Notifikasi pembayaran dikirim ke aplikasi ${payMethod} pada nomor ${esc(o.phone)} (simulasi).`, `A payment notification is sent to the ${payMethod} app on ${esc(o.phone)} (simulated).`)}</div>`;
    return `<section class="card p-4 mb-4"><div class="flex items-center justify-between"><h2 class="font-headline-sm text-headline-sm">${L('Pembayaran', 'Payment')}</h2><span class="font-label-md text-label-md text-amber-300">${ic('timer', 'text-[16px] align-middle')} <span data-until="${o.until}">--:--</span></span></div>
      <p class="font-label-sm text-label-sm text-on-surface-variant mb-3">${L(`Selesaikan sebelum ${fTime(o.until)} WIB. Kursi tetap ditahan untuk pesanan ini sampai batas waktu.`, `Complete before ${fTime(o.until)} WIB. Seats stay held for this order until then.`)}</p>
      <div class="grid grid-cols-1 gap-2 mb-3">${M.map(([k, i, l]) => `<label class="inner px-3 py-2.5 flex items-center gap-3 cursor-pointer ${payMethod === k ? 'ring-1 ring-primary-container' : ''}"><input type="radio" name="pm" value="${k}" ${payMethod === k ? 'checked' : ''}>${ic(i, 'text-primary text-[20px]')}<span class="font-body-sm text-body-sm">${l}</span></label>`).join('')}</div>
      ${instr}
      <div class="mt-4 inner p-3 font-label-sm text-label-sm text-on-surface-variant">${ic('science', 'text-[14px] align-middle')} ${L('Mode sandbox: tombol di bawah meniru balasan dari gerbang pembayaran.', 'Sandbox mode: the buttons below mimic a reply from the payment gateway.')}</div>
      <div class="flex flex-col gap-2 mt-3"><button class="btn-ok justify-center !py-3" id="pay-ok">${ic('check_circle')} ${L('Simulasikan pembayaran berhasil', 'Simulate successful payment')}</button>
        <div class="grid grid-cols-2 gap-2"><button class="btn-ghost justify-center" id="pay-fail">${ic('block', 'text-[16px]')} ${L('Simulasikan gagal', 'Simulate failure')}</button><button class="btn-ghost justify-center" id="cancel">${ic('close', 'text-[16px]')} ${L('Batalkan pesanan', 'Cancel order')}</button></div></div></section>`;
  }
  function ticketsView(o, e) {
    return `<div class="inner p-3 mb-4 flex items-center gap-2 font-body-sm text-body-sm text-emerald-300">${ic('mark_email_read', 'text-[18px]')} ${L(`E-ticket juga dikirim ke ${esc(o.email)} & WhatsApp ${esc(o.phone)} (simulasi).`, `E-tickets were also sent to ${esc(o.email)} & WhatsApp ${esc(o.phone)} (simulated).`)}</div>
      <div class="flex flex-col gap-4 mb-4">${o.tickets.map((tid, i) => { const t = E.s.tickets[tid]; const ty = E.typeById(e, t.type); return `<section class="card p-0 overflow-hidden">
        <div class="px-4 py-3 flex items-center justify-between" style="background:linear-gradient(90deg, ${ty.color}44, transparent)"><span class="font-label-lg text-label-lg">E-ticket ${i + 1}/${o.tickets.length}</span><span class="font-label-sm text-label-sm">${esc(ty.name)}</span></div>
        <div class="p-4 flex flex-col items-center gap-3"><div class="paper p-2 rounded-lg">${E.qrSvg(E.qrText(t), 200)}</div>
          <div class="font-label-md text-label-md text-on-surface-variant">${t.id}</div>
          <div class="grid grid-cols-2 gap-3 w-full font-body-sm text-body-sm"><div><div class="lbl">${L('Pemegang', 'Holder')}</div>${esc(t.holder)}</div><div><div class="lbl">${L('Kursi', 'Seat')}</div><b class="font-headline-sm text-headline-sm">${t.seat || L('Bebas (berdiri)', 'Free (standing)')}</b></div><div><div class="lbl">${L('Tanggal', 'Date')}</div>${fShort(e.start)} · ${fTime(e.start)}</div><div><div class="lbl">${L('Gate dibuka', 'Gates open')}</div>${fTime(e.doors)} WIB</div></div>
          <div class="w-full text-center px-3 py-2 rounded-lg font-label-md text-label-md ${t.checkedInAt ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-on-surface-variant'}">${t.checkedInAt ? L('Sudah check-in ' + fTime(t.checkedInAt) + ' di ' + esc(t.gate), 'Checked in at ' + fTime(t.checkedInAt) + ', ' + esc(t.gate)) : L('Belum check-in. Tunjukkan QR ini di gate.', 'Not checked in yet. Show this QR at the gate.')}</div></div></section>`; }).join('')}</div>
      <div class="grid grid-cols-2 gap-2 mb-4"><button class="btn-ghost justify-center" id="ics">${ic('event', 'text-[16px]')} ${L('Simpan ke kalender', 'Add to calendar')}</button><button class="btn-ghost justify-center" id="resend">${ic('forward_to_inbox', 'text-[16px]')} ${L('Kirim ulang', 'Resend')}</button></div>`;
  }

  // ---------------------------------------------------------------- akun pengunjung (demo, tanpa server)
  // Prototipe: login dicek di browser terhadap daftar akun demo dan sesi disimpan di localStorage. Versi baru
  // (docs/rewrite/PRD.md bagian 2.2) memakai Supabase Auth. Password demo memang ditampilkan di halaman masuk.
  const ACC_KEY = 'smicc-visitor';
  const DEMO_PASS = 'smicc-demo-2026';
  const DEMO = [
    { email: 'pengunjung@example.com', name: 'Rizky Pratama', cc: 'ID', phone: '812 0000 1001', label: ['Pengunjung', 'Visitor'], note: ['Punya 2 pesanan lunas', 'Has 2 paid orders'] },
    { email: 'nadia@example.com', name: 'Nadia Putri', cc: 'ID', phone: '813 0000 2002', label: ['Pengunjung baru', 'New visitor'], note: ['Belum ada pesanan', 'No orders yet'] },
  ];
  let me = null;
  try { me = JSON.parse(localStorage.getItem(ACC_KEY) || 'null'); } catch (_) { me = null; }
  const signIn = (d) => { me = { email: d.email, name: d.name, cc: d.cc, phone: d.phone }; try { localStorage.setItem(ACC_KEY, JSON.stringify(me)); } catch (_) { /* sesi hanya untuk tab ini */ } };
  const signOut = () => { me = null; try { localStorage.removeItem(ACC_KEY); } catch (_) { /* abaikan */ } };
  const initialsOf = (n) => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  let loginFails = 0, loginLock = 0;
  // Pesanan milik pengunjung: yang dibuat di perangkat ini + yang emailnya sama dengan akun yang masuk.
  function myOrderList() {
    const ids = new Set(E.myOrders());
    if (me) Object.values(E.s.orders).forEach((o) => { if (String(o.email).toLowerCase() === me.email) ids.add(o.id); });
    return [...ids].map((id) => E.s.orders[id]).filter(Boolean).sort((a, b) => b.createdAt - a.createdAt);
  }
  // Tombol akun di header: "Masuk" atau inisial + nama depan bila sudah masuk.
  function syncHead() {
    const d = document.getElementById('h-login'), m = document.getElementById('h-login-m');
    // Navigasi bawah hanya untuk pengunjung yang sudah masuk; badge = pesanan yang menunggu pembayaran.
    const bn = document.querySelector('.pv-bnav');
    document.body.classList.toggle('has-bnav', !!me);
    if (bn) bn.hidden = !me;
    const badgeEl = document.querySelector('[data-nav-badge]');
    if (badgeEl) { const n = me && E.s ? myOrderList().filter((o) => o.status === 'PENDING' && o.until > E.now()).length : 0; badgeEl.hidden = !n; badgeEl.textContent = n; badgeEl.setAttribute('aria-label', L(n + ' menunggu pembayaran', n + ' awaiting payment')); }
    if (!d || !m) return;
    if (me) {
      const first = me.name.split(' ')[0];
      d.className = 'btn-ghost lp-acct'; d.href = '/pengunjung/tiket'; d.innerHTML = `<span class="lp-avatar" aria-hidden="true">${esc(initialsOf(me.name))}</span>${esc(first)}`;
      m.className = 'pv-hbtn pv-hround lp-acct-m'; m.href = '/pengunjung/tiket'; m.setAttribute('aria-label', L('Akun: ', 'Account: ') + me.name); m.innerHTML = `<span class="lp-avatar" aria-hidden="true">${esc(initialsOf(me.name))}</span>`;
    } else {
      const next = encodeURIComponent(Router.path() === '/masuk' ? '/tiket' : Router.path());
      d.className = 'btn'; d.href = '/pengunjung/masuk?next=' + next; d.innerHTML = `${ic('login', 'text-[18px]')}<span>${L('Masuk', 'Log in')}</span>`;
      m.className = 'pv-hbtn pv-hround'; m.href = '/pengunjung/masuk?next=' + next; m.setAttribute('aria-label', L('Masuk', 'Log in')); m.innerHTML = ic('person', 'text-[20px]');
    }
  }

  V.masuk = () => {
    const back2 = back('/pengunjung', L('Beranda', 'Home'));
    if (me) {
      return `${back2}<div class="lp-auth"><div class="lp-auth-card lp-auth-done"><span class="lp-avatar lp-avatar-lg" aria-hidden="true">${esc(initialsOf(me.name))}</span>
        <h1 class="lp-title-lg">${L('Kamu sudah masuk', 'You are logged in')}</h1><p class="lp-lead">${esc(me.name)} · ${esc(me.email)}</p>
        <div class="lp-auth-btns"><a class="btn lp-cta" href="/pengunjung/tiket">${ic('confirmation_number', 'text-[18px]')}${L('Lihat tiket saya', 'See my tickets')}</a><button type="button" class="btn-ghost lp-cta" data-logout>${ic('logout', 'text-[18px]')}${L('Keluar', 'Log out')}</button></div></div></div>`;
    }
    return `${back2}<div class="lp-auth"><div class="lp-auth-card">
      <h1 class="lp-title-lg">${L('Masuk', 'Log in')}</h1>
      <p class="lp-lead mb-4">${L('Masuk untuk melihat semua tiketmu dan mengisi data pemesan otomatis.', 'Log in to see all your tickets and fill in booker details automatically.')}</p>
      <form id="f-login" class="flex flex-col gap-4" novalidate>
        <div class="lp-field"><label for="l-email" class="lp-label">Email</label><input id="l-email" class="inp" name="email" type="email" inputmode="email" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="nama@gmail.com"></div>
        <div class="lp-field"><label for="l-pass" class="lp-label">Password</label><div class="lp-pass"><input id="l-pass" class="inp" name="password" type="password" autocomplete="current-password"><button type="button" class="lp-pass-eye" data-eye aria-label="${L('Tampilkan password', 'Show password')}" aria-pressed="false">${ic('visibility', 'text-[20px]')}</button></div></div>
        <p class="lp-err" id="login-err" role="alert" hidden></p>
        <button class="btn lp-cta" id="login-btn">${ic('login', 'text-[18px]')}<span>${L('Masuk', 'Log in')}</span></button>
      </form>
      <p class="lp-auth-alt">${L('Belum punya akun? Kamu tetap bisa membeli tiket tanpa akun.', 'No account? You can still buy tickets without one.')} <a href="/pengunjung">${L('Lihat acara', 'Browse events')}</a></p>
      <div class="lp-demo"><p class="lp-demo-h"><span>${L('Akun demo', 'Demo accounts')}</span></p>
        <p class="lp-help mb-3">${L('Klik untuk mengisi email & password, lalu tekan Masuk.', 'Click to fill in the email & password, then press Log in.')}</p>
        <div class="lp-demo-grid">${DEMO.map((d, i) => `<button type="button" class="lp-demo-card" data-demo="${i}"><span class="lp-avatar" aria-hidden="true">${esc(initialsOf(d.name))}</span><span class="lp-demo-txt"><b>${esc(tx2(d.label))}</b><span>${esc(d.email)}</span><small>${esc(d.name)} · ${esc(tx2(d.note))}</small></span></button>`).join('')}</div></div>
    </div></div>`;
  };
  function bindLogin() {
    app.querySelectorAll('[data-logout]').forEach((b) => b.addEventListener('click', () => { signOut(); syncHead(); toast(L('Kamu sudah keluar.', 'You have logged out.'), 'info'); Router.go('/'); }));
    const f = app.querySelector('#f-login'); if (!f) return;
    const em = f.querySelector('#l-email'), pw = f.querySelector('#l-pass'), btn = f.querySelector('#login-btn'), err = f.querySelector('#login-err');
    const say = (m) => { err.hidden = !m; err.innerHTML = m ? ic('error', 'text-[16px]') + '<span>' + m + '</span>' : ''; };
    app.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => {
      const d = DEMO[+b.dataset.demo]; em.value = d.email; pw.value = DEMO_PASS; say('');
      app.querySelectorAll('[data-demo]').forEach((x) => x.classList.toggle('on', x === b));
      btn.focus();
    }));
    f.querySelector('[data-eye]').addEventListener('click', (ev) => {
      const b = ev.currentTarget; const show = pw.type === 'password'; pw.type = show ? 'text' : 'password';
      b.setAttribute('aria-pressed', String(show)); b.setAttribute('aria-label', show ? L('Sembunyikan password', 'Hide password') : L('Tampilkan password', 'Show password'));
      b.innerHTML = ic(show ? 'visibility_off' : 'visibility', 'text-[20px]');
    });
    const lockTick = () => {
      const rem = Math.ceil((loginLock - Date.now()) / 1000);
      if (rem > 0) { btn.disabled = true; say(L(`Terlalu banyak percobaan. Coba lagi dalam ${rem} detik.`, `Too many attempts. Try again in ${rem} seconds.`)); setTimeout(lockTick, 1000); } else if (btn.disabled) { btn.disabled = false; say(''); loginFails = 0; }
    };
    lockTick();
    f.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (Date.now() < loginLock) return;
      const email = em.value.trim().toLowerCase();
      if (!email || !pw.value) return say(L('Isi email dan password.', 'Enter your email and password.'));
      if (!email.includes('@')) return say(L('Email harus mengandung tanda @.', 'The email must contain an @ sign.'));
      const d = DEMO.find((x) => x.email === email);
      if (!d || pw.value !== DEMO_PASS) {
        loginFails++;
        if (loginFails >= 5) { loginLock = Date.now() + 60000; return lockTick(); }
        return say(L('Email atau password salah.', 'Wrong email or password.'));
      }
      signIn(d); syncHead();
      toast(L(`Halo, ${esc(d.name.split(' ')[0])}. Kamu sudah masuk.`, `Hi ${esc(d.name.split(' ')[0])}, you are logged in.`), 'ok');
      const next = Router.query().next;
      Router.go(next && next.startsWith('/') && !next.startsWith('//') && next !== '/masuk' ? next : '/tiket');
    });
  }

  const guestCard = (next) => `<section class="lp-acct-card lp-acct-guest">${ic('account_circle', 'text-[32px]')}<div class="min-w-0 flex-1"><b>${L('Masuk untuk melihat semua tiket & pesanmu', 'Log in to see all your tickets & messages')}</b><span>${L('Tanpa masuk, hanya pesanan dari perangkat ini yang tampil.', 'Without logging in, only orders from this device are shown.')}</span></div><a class="btn" href="/pengunjung/masuk?next=${encodeURIComponent(next)}">${L('Masuk', 'Log in')}</a></section>`;
  // Tiket saya: dikelompokkan akan datang, menunggu bayar, selesai/batal.
  V.tiket = () => {
    const list = myOrderList();
    const now = E.now();
    const state = (o) => (o.status === 'PENDING' && o.until < now ? 'EXPIRED' : o.status);
    const groups = [
      ['pending', L('Menunggu pembayaran', 'Awaiting payment'), list.filter((o) => state(o) === 'PENDING')],
      ['soon', L('Akan datang', 'Upcoming'), list.filter((o) => state(o) === 'PAID' && E.ev(o.ev) && E.ev(o.ev).start > now - 3 * 3600000)],
      ['done', L('Selesai & batal', 'Past & cancelled'), list.filter((o) => !(state(o) === 'PENDING' || (state(o) === 'PAID' && E.ev(o.ev) && E.ev(o.ev).start > now - 3 * 3600000)))],
    ].filter((g) => g[2].length);
    const row = (o) => { const e = E.ev(o.ev); if (!e) return ''; const k = o.items.length; return `<a href="/pengunjung/o/${o.id}" class="lp-order">
        <div class="lp-order-img">${photo(e)}</div>
        <div class="lp-order-main"><div class="flex items-start justify-between gap-2"><b class="lp-order-title">${esc(e.name)}</b>${statusChip(state(o))}</div>
          <p class="lp-meta">${ic('calendar_month', 'text-[16px]')}<span>${when(e)}</span></p>
          <p class="lp-help">${L(k + ' tiket', k + (k === 1 ? ' ticket' : ' tickets'))} · ${esc(o.items.map((i) => i.seat || E.typeById(e, i.type).name).join(', '))}</p>
          <p class="lp-order-foot"><span>${o.id}</span><b>${rp(o.total)}</b></p></div></a>`; };
    const acct = me ? `<section class="lp-acct-card"><span class="lp-avatar lp-avatar-lg" aria-hidden="true">${esc(initialsOf(me.name))}</span><div class="min-w-0 flex-1"><b>${esc(me.name)}</b><span>${esc(me.email)}</span></div><button type="button" class="btn-ghost" data-logout>${ic('logout', 'text-[18px]')}${L('Keluar', 'Log out')}</button></section>`
      : guestCard('/tiket');
    return `<h1 class="lp-title-lg">${L('Tiket saya', 'My tickets')}</h1>${acct}
      ${groups.length ? groups.map(([k, title, l]) => `<section class="lp-order-group"><h2 class="lp-title">${title} <span class="lp-count">${l.length}</span></h2><div class="lp-orders">${l.map(row).join('')}</div></section>`).join('')
        : `<div class="lp-empty mt-4"><p>${L('Belum ada pesanan.', 'No orders yet.')}</p><a class="btn" href="/pengunjung">${L('Cari acara', 'Find events')}</a></div>`}
      <section class="card p-4 mt-8"><h2 class="font-headline-sm text-headline-sm mb-1">${L('Cari pesanan', 'Find an order')}</h2><p class="lp-help mb-3">${L('Pesan dari perangkat lain tanpa akun? Masukkan kode booking dan email pemesan.', 'Booked on another device without an account? Enter the booking code and the booker\'s email.')}</p>
        <form id="f-find" class="lp-find"><input class="inp" name="code" placeholder="BK-XXXXXX" aria-label="${L('Kode booking', 'Booking code')}" required><input class="inp" name="email" type="email" placeholder="${L('Email pemesan', 'Booker\'s email')}" aria-label="${L('Email pemesan', 'Booker\'s email')}" required><button class="btn">${ic('search', 'text-[18px]')}${L('Cari', 'Search')}</button></form></section>`;
  };

  V.inbox = () => {
    const mine = myOrderList();
    const to = new Set(mine.flatMap((o) => [o.email, o.phone]));
    if (me) { to.add(me.email); }
    const msgs = E.s.outbox.filter((m) => to.has(m.to)).slice(0, 60);
    const msg = (m) => { const mail = m.ch === 'Email'; return `<article class="lp-msg"><span class="lp-msg-ic ${mail ? '' : 'is-wa'}">${ic(mail ? 'mail' : 'chat', 'text-[20px]')}</span>
      <div class="min-w-0 flex-1"><p class="lp-msg-meta"><b>${mail ? 'Email' : 'WhatsApp'}</b><span class="lp-dot"></span><span>${fDT(m.ts)}</span></p><h2 class="lp-msg-title">${esc(m.subject)}</h2><p class="lp-body-sm">${esc(m.body)}</p>
        ${m.order && m.order.startsWith('BK-') ? `<a class="lp-more" href="/pengunjung/o/${m.order}">${L('Buka pesanan', 'Open order')} ${m.order}${ic('chevron_right', 'text-[18px]')}</a>` : ''}</div></article>`; };
    return `<h1 class="lp-title-lg">${L('Kotak masuk', 'Inbox')}</h1>
      <p class="lp-lead">${L('Simulasi email & WhatsApp untuk pesananmu. Tidak ada pesan yang benar-benar dikirim.', 'Simulated email & WhatsApp for your orders. No messages are actually sent. Messages are written in Indonesian.')}</p>
      ${me ? '' : guestCard('/inbox')}
      <div class="lp-msgs">${msgs.length ? msgs.map(msg).join('') : `<div class="lp-empty"><p>${L('Belum ada pesan.', 'No messages yet.')}</p><a class="btn" href="/pengunjung">${L('Cari acara', 'Find events')}</a></div>`}</div>`;
  };
  const notFound = (m) => `<div class="card p-6 text-center">${ic('search_off', 'text-[40px] text-on-surface-variant')}<p class="mt-2">${esc(m || L('Halaman tidak ditemukan.', 'Page not found.'))}</p><a class="btn mt-4" href="/pengunjung">${L('Ke daftar acara', 'Go to events')}</a></div>`;

  // ---------------------------------------------------------------- router & binding
  function parse() {
    const p = Router.path().split('/').filter(Boolean);
    if (p[0] === 'e' && p[2] === 'kategori') return { name: 'cats', args: [p[1]] };
    if (p[0] === 'e' && p[2] === 'kursi') {
      // Denah selalu untuk satu kategori bernomor kursi (?kat=). Tanpa kategori yang sah: kembali ke langkah kategori.
      const ev = E.ev(p[1]), kat = Router.query().kat;
      if (ev && ev.types.some((t) => t.id === kat && t.seated && t.onSale)) return { name: 'seats', args: [p[1], kat] };
      Router.replace('/e/' + p[1] + '/kategori');
      return { name: 'cats', args: [p[1]] };
    }
    if (p[0] === 'e' && p[2] === 'data') return { name: 'data', args: [p[1]] };
    if (p[0] === 'e') return { name: 'event', args: [p[1]] };
    if (p[0] === 'o') return { name: 'order', args: [p[1]] };
    if (p[0] === 'tiket') return { name: 'tiket', args: [] };
    if (p[0] === 'inbox') return { name: 'inbox', args: [] };
    if (p[0] === 'masuk') return { name: 'masuk', args: [] };
    return { name: 'home', args: [] };
  }
  // Hero carousel: titik mengikuti posisi geser, klik titik melompat, geser otomatis tiap 6 dtk
  // (berhenti saat disentuh/diarahkan kursor, tab tersembunyi, atau kurangi gerakan).
  // Slide aktif ditaruh di tengah track (tetangga mengintip di kiri-kanan). Geser otomatis tiap 2,5 detik; berhenti
  // sementara selama diarahkan kursor, disentuh, atau difokus keyboard. Kurangi gerakan: pindah tanpa animasi geser.
  const HERO_MS = 2500;
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  let heroHold = false;
  const heroMark = () => {
    app.querySelectorAll('[data-hero-dot]').forEach((d) => { const on = +d.dataset.heroDot === heroIdx; d.classList.toggle('on', on); d.setAttribute('aria-current', String(on)); });
    app.querySelectorAll('.lp-slide').forEach((s) => s.classList.toggle('on', +s.dataset.hero === heroIdx));
  };
  const slideLeft = (tr, s) => s.offsetLeft - (tr.clientWidth - s.offsetWidth) / 2;
  function heroGo(i, smooth) {
    const tr = app.querySelector('.lp-hero-track'); if (!tr) return;
    const n = tr.children.length; heroIdx = ((i % n) + n) % n;
    tr.scrollTo({ left: slideLeft(tr, tr.children[heroIdx]), behavior: smooth ? 'smooth' : 'auto' });
    heroMark();
  }
  function bindHero() {
    const tr = app.querySelector('.lp-hero-track'); if (!tr) return;
    let t = null;
    tr.addEventListener('scroll', () => {
      clearTimeout(t);
      t = setTimeout(() => { let best = 0, dist = Infinity; [...tr.children].forEach((s, k) => { const d = Math.abs(slideLeft(tr, s) - tr.scrollLeft); if (d < dist) { dist = d; best = k; } }); if (best !== heroIdx) { heroIdx = best; heroMark(); } }, 80);
    }, { passive: true });
    const hero = tr.closest('.lp-hero');
    ['pointerenter', 'focusin', 'touchstart'].forEach((ev) => hero.addEventListener(ev, () => (heroHold = true), { passive: true }));
    ['pointerleave', 'focusout'].forEach((ev) => hero.addEventListener(ev, () => (heroHold = false)));
    app.querySelectorAll('[data-hero-dot]').forEach((d) => d.addEventListener('click', () => heroGo(+d.dataset.heroDot, true)));
    heroGo(heroIdx, false);
  }
  setInterval(() => { if (cur.name === 'home' && !document.hidden && !heroHold && app.querySelector('.lp-hero-track')) heroGo(heroIdx + 1, !reduceMotion); }, HERO_MS);
  // Papan direktori: sorotan baris mengganti foto area di kanan (desktop).
  function bindDir() {
    const im = app.querySelector('[data-dir-img]'), cap = app.querySelector('[data-dir-cap]'); if (!im) return;
    app.querySelectorAll('[data-dir]').forEach((b) => {
      const show = () => {
        dirIdx = +b.dataset.dir; const x = AREAS[dirIdx];
        app.querySelectorAll('[data-dir]').forEach((r) => r.classList.toggle('on', r === b));
        im.src = img(x.img); cap.innerHTML = plate(x.floor) + esc(x.key);
      };
      b.addEventListener('pointerenter', show); b.addEventListener('focus', show);
    });
  }
  function render(keepScroll) {
    const y = window.scrollY;
    const rails = {}; app.querySelectorAll('[data-rail]').forEach((r) => (rails[r.dataset.rail] = r.scrollLeft));
    app.innerHTML = E.modeBanner() + V[cur.name](...cur.args);
    // Lebar konten desktop: beranda, detail, kategori & kursi selebar 1200 px (dua kolom); data, pesanan, tiket,
    // kotak masuk 720 px; halaman masuk sempit. Ponsel selalu satu kolom.
    document.body.classList.toggle('pv-wide', ['home', 'event', 'cats', 'seats'].includes(cur.name));
    document.body.classList.toggle('pv-mid', ['data', 'order', 'tiket', 'inbox', 'masuk'].includes(cur.name));
    document.body.dataset.view = cur.name;
    syncHead();
    bind();
    tick();
    const nav = { home: 'home', event: 'home', cats: 'home', seats: 'home', data: 'home', order: 'tiket', tiket: 'tiket', inbox: 'inbox', masuk: 'tiket' }[cur.name];
    document.querySelectorAll('[data-nav]').forEach((a) => { const on = a.dataset.nav === nav; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (keepScroll) { window.scrollTo(0, y); app.querySelectorAll('[data-rail]').forEach((r) => { if (rails[r.dataset.rail]) r.scrollLeft = rails[r.dataset.rail]; }); }
    syncTabs();
    const sm = app.querySelector('.seatmap-wrap'); if (sm) sm.scrollLeft = keepScroll && render.sx != null ? render.sx : (sm.scrollWidth - sm.clientWidth) / 2;
  }
  function bind() {
    const id = cur.args[0];
    bindLogin();
    const sm = app.querySelector('.seatmap-wrap'); if (sm) sm.addEventListener('scroll', () => (render.sx = sm.scrollLeft));
    app.querySelectorAll('[data-seat]').forEach((b) => b.addEventListener('click', async () => {
      const st = b.dataset.st, seat = b.dataset.seat;
      if (st === 'available') { const r = await act(() => E.holdSeat(id, seat, cart)); if (r) toast(L(`Kursi <b>${seat}</b> ditahan untukmu.`, `Seat <b>${seat}</b> is held for you.`), 'ok'); }
      else if (st === 'mine') await act(() => E.releaseSeat(id, seat, cart));
      else if (st === 'held') toast(L(`Kursi <b>${seat}</b> sedang dipesan pengunjung lain.`, `Seat <b>${seat}</b> is being booked by another visitor.`), 'err');
      else if (st === 'sold') toast(L(`Kursi <b>${seat}</b> sudah terjual.`, `Seat <b>${seat}</b> is already sold.`), 'err');
      else toast(L(`Kursi <b>${seat}</b> tidak dijual.`, `Seat <b>${seat}</b> is not for sale.`), 'err');
    }));
    app.querySelectorAll('[data-qty]').forEach((b) => b.addEventListener('click', () => { const h = E.cartHolds(id, cart); const q = h.items.filter((i) => i.type === b.dataset.qty && !i.seat).length; act(() => E.setQty(id, b.dataset.qty, Math.max(0, q + +b.dataset.d), cart)); }));
    const clr = app.querySelector('#clear'); if (clr) clr.addEventListener('click', () => act(() => E.releaseCart(id, cart), L('Semua kursi dilepas.', 'All seats released.')));
    app.querySelectorAll('[data-wl]').forEach((b) => b.addEventListener('click', () => {
      const r = modal(L('Daftar tunggu ', 'Waiting list: ') + esc(E.typeById(E.ev(id), b.dataset.wl).name), `<form id="f-wl" class="flex flex-col gap-3"><p class="font-body-sm text-body-sm text-on-surface-variant">${L('Kami kabari bila ada kursi yang tersedia lagi karena refund atau pesanan kedaluwarsa.', 'We will let you know if seats free up again through refunds or expired orders.')}</p><label class="f">${L('Nama', 'Name')}<input class="inp" name="name" required></label><label class="f">${L('Email atau WhatsApp', 'Email or WhatsApp')}<input class="inp" name="contact" required></label><label class="f">${L('Jumlah tiket', 'Number of tickets')}<input class="inp" name="qty" type="number" min="1" max="4" value="1"></label><button class="btn justify-center">${L('Gabung daftar tunggu', 'Join the waiting list')}</button></form>`);
      r.querySelector('#f-wl').addEventListener('submit', async (ev) => { ev.preventDefault(); const f = Object.fromEntries(new FormData(ev.target)); if (await act(() => E.joinWaitlist(id, b.dataset.wl, { name: f.name, contact: f.contact, qty: +f.qty }))) { closeModal(); toast(L('Kamu masuk daftar tunggu.', 'You are on the waiting list.'), 'ok'); } });
      return r;
    }));
    const fo = app.querySelector('#f-order');
    if (fo) {
      const save = () => { const f = Object.fromEntries(new FormData(fo)); sessionStorage.setItem('smicc-evt-form', JSON.stringify({ name: f.name, email: f.email, phone: f.phone, cc: f.cc })); };
      const phone = fo.querySelector('#f-phone');
      // Nomor: hanya angka & spasi; 0 di depan dibuang (kode negara sudah dipilih di kiri).
      phone.addEventListener('input', () => { const v = phone.value.replace(/[^\d ]/g, '').replace(/^0+/, ''); if (v !== phone.value) phone.value = v; });
      fo.querySelector('select[name=cc]').addEventListener('change', (ev) => {
        const cc = CC.find((x) => x.k === ev.target.value) || CC[0];
        fo.querySelector('[data-cc-flag]').innerHTML = cc.flag(); fo.querySelector('[data-cc-code]').textContent = '+' + cc.code;
        if (phone.value) showErr(fo, 'phone', checkField('phone', Object.fromEntries(new FormData(fo))));
      });
      // Galat muncul setelah kolom ditinggalkan; saat diketik ulang, hilang begitu isinya sudah benar.
      ['name', 'email', 'phone'].forEach((k) => {
        const el = fo.querySelector('#f-' + k);
        el.addEventListener('blur', () => { if (el.value.trim()) showErr(fo, k, checkField(k, Object.fromEntries(new FormData(fo)))); });
        el.addEventListener('input', () => { if (el.classList.contains('is-err') && !checkField(k, Object.fromEntries(new FormData(fo)))) showErr(fo, k, ''); });
      });
      fo.querySelectorAll('.lp-check input').forEach((c) => c.addEventListener('change', () => { if (fo.accept_toc.checked && fo.accept_consent.checked) fo.querySelector('#h-consent').hidden = true; }));
      fo.querySelectorAll('[data-policy]').forEach((a) => a.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const [title, items] = POLICY()[a.dataset.policy];
        modal(esc(title), `<ol class="list-decimal pl-5 flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ol><p class="font-label-sm text-label-sm text-on-surface-variant mt-4">${L('Contoh untuk prototipe, bukan dokumen hukum resmi.', 'Sample for the prototype, not an official legal document.')}</p>`);
      }));
      fo.addEventListener('input', save); fo.addEventListener('change', save);
      fo.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const info = validateOrder(fo); if (!info) return;
        const oid = await act(() => E.createOrder(id, cart, info));
        if (oid) { E.rememberOrder(oid); Router.go('/o/' + oid); }
      });
    }
    app.querySelectorAll('input[name=pm]').forEach((r) => r.addEventListener('change', () => { payMethod = r.value; render(true); }));
    const ok = app.querySelector('#pay-ok'); if (ok) ok.addEventListener('click', async () => { const r = await act(() => E.pay(id, payMethod, true)); if (r) { toast(L('Pembayaran berhasil. E-ticket terbit.', 'Payment successful. E-tickets issued.'), 'ok'); window.scrollTo(0, 0); } });
    const bad = app.querySelector('#pay-fail'); if (bad) bad.addEventListener('click', async () => { const r = await act(() => E.pay(id, payMethod, false)); if (r === 'FAILED') toast(L('Pembayaran ditolak (simulasi). Kursi tetap ditahan sampai batas waktu. Coba metode lain.', 'Payment declined (simulated). Seats stay held until the time limit. Try another method.'), 'err'); });
    const cc = app.querySelector('#cancel'); if (cc) cc.addEventListener('click', () => { if (confirm(L('Batalkan pesanan dan lepas kursi?', 'Cancel the order and release the seats?'))) act(() => E.cancel(id), L('Pesanan dibatalkan, kursi dilepas.', 'Order cancelled, seats released.')); });
    const rs = app.querySelector('#resend'); if (rs) rs.addEventListener('click', () => act(() => E.resend(id), L('E-ticket dikirim ulang ke email & WhatsApp (simulasi).', 'E-tickets resent to email & WhatsApp (simulated).')));
    const ics = app.querySelector('#ics'); if (ics) ics.addEventListener('click', () => downloadIcs(E.s.orders[id]));
    // Beranda: filter kategori/area membuka hasil; tombol Beranda mengosongkan semua filter.
    const showResults = () => { render(); window.scrollTo(0, 0); };
    app.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { catF = b.dataset.cat || null; showResults(); }));
    app.querySelectorAll('[data-area]').forEach((b) => b.addEventListener('click', () => { areaF = b.dataset.area || null; showResults(); }));
    app.querySelectorAll('[data-reset]').forEach((b) => b.addEventListener('click', () => { catF = null; areaF = null; query = ''; qIn.value = ''; roll.sync(); showResults(); }));
    app.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => { quickF = b.dataset.quick; render(true); const f = app.querySelector(`[data-quick="${quickF}"]`); if (f) f.focus({ preventScroll: true }); }));
    bindDir();
    const cr = app.querySelector('[data-creator]');
    if (cr) cr.addEventListener('click', () => modal(L('Hubungi tim event mal', 'Contact the mall events team'), `<p class="font-body-sm text-body-sm text-on-surface-variant">${L('Contoh kontak untuk prototipe. Ganti dengan kontak tim event Summarecon Mall Bandung.', 'Sample contact for the prototype. Replace with the Summarecon Mall Bandung events team contact.')}</p>
      <ul class="mt-3 flex flex-col gap-2 font-body-sm text-body-sm"><li>${ic('support_agent', 'text-primary text-[18px] align-middle')} ${L('Customer Service, GF dekat lobi utama', 'Customer Service, GF near the main lobby')}</li><li>${ic('schedule', 'text-primary text-[18px] align-middle')} ${L('Setiap hari', 'Daily')} ${MALL.hours}</li><li>${ic('description', 'text-primary text-[18px] align-middle')} ${L('Siapkan: jenis acara, perkiraan pengunjung, tanggal, dan area yang diinginkan', 'Have ready: event type, expected visitors, date, and preferred area')}</li></ul>`));
    bindHero();
    app.querySelectorAll('[data-jump]').forEach((b) => b.addEventListener('click', () => { const sec = document.getElementById('sec-' + b.dataset.jump); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    const sh = app.querySelector('#share');
    if (sh) sh.addEventListener('click', async () => {
      const url = location.href;
      try {
        if (navigator.share) { await navigator.share({ title: E.ev(id).name, url }); return; }
        await navigator.clipboard.writeText(url); toast(L('Tautan acara disalin.', 'Event link copied.'), 'ok');
      } catch (err) { if (err && err.name !== 'AbortError') toast(L('Salin tautan ini: ', 'Copy this link: ') + esc(url), 'info'); }
    });
    const ff = app.querySelector('#f-find');
    if (ff) ff.addEventListener('submit', (ev) => { ev.preventDefault(); const f = Object.fromEntries(new FormData(ff)); const o = E.s.orders[f.code.trim().toUpperCase()]; if (o && o.email.toLowerCase() === f.email.trim().toLowerCase()) { E.rememberOrder(o.id); Router.go('/o/' + o.id); } else toast(L('Kode booking atau email tidak cocok.', 'Booking code or email does not match.'), 'err'); });
  }
  function downloadIcs(o) {
    const e = E.ev(o.ev); const f = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const desc = L('Kode booking ' + o.id + ', gate dibuka ' + fTime(e.doors), 'Booking code ' + o.id + ', gates open ' + fTime(e.doors));
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Summarecon Mall//Event Tiket//ID', 'BEGIN:VEVENT', 'UID:' + o.id + '@summarecon-mall.local', 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(e.start), 'DTEND:' + f(e.start + 3 * 3600000), 'SUMMARY:' + e.name, 'LOCATION:' + e.venue, 'DESCRIPTION:' + desc, 'BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY', 'DESCRIPTION:' + L('Pengingat acara', 'Event reminder'), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = o.id + '.ics'; a.click();
  }
  function tick() {
    let expired = false;
    document.querySelectorAll('[data-until]').forEach((el) => { const rem = +el.dataset.until - E.now(); el.textContent = rem > 0 ? E.mmss(rem) : L('habis', 'expired'); if (rem <= 0 && el.dataset.until !== 'null') expired = true; });
    return expired;
  }

  let rt = null;
  const rerender = () => { clearTimeout(rt); rt = setTimeout(() => { if (cur.name === 'data') return; if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#modal-root')) return; render(true); }, 80); };
  Router.on(() => { cur = parse(); render(); window.scrollTo(0, 0); });
  // Tab detail acara ikut aktif sesuai bagian yang sedang terlihat
  function syncTabs() {
    const tabs = app.querySelectorAll('[data-jump]'); if (!tabs.length) return;
    const line = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hdr'), 10) || 56) + 60;
    let on = tabs[0].dataset.jump;
    tabs.forEach((b) => { const sec = document.getElementById('sec-' + b.dataset.jump); if (sec && sec.getBoundingClientRect().top <= line) on = b.dataset.jump; });
    tabs.forEach((b) => b.classList.toggle('on', b.dataset.jump === on));
  }
  window.addEventListener('scroll', syncTabs, { passive: true });
  const setHdr = () => document.documentElement.style.setProperty('--hdr', document.querySelector('header').offsetHeight + 'px');
  setHdr(); window.addEventListener('resize', setHdr);
  // Placeholder kolom cari yang bergulir: "Cari" + kata kunci (nama acara yang sedang dijual) yang naik sambil memudar.
  // Kata kunci aktif di posisi 0, berikutnya menunggu di bawah (100%), yang baru lewat keluar ke atas (-100%).
  // Disembunyikan saat kolom berisi teks. Bila pengguna memilih kurangi gerakan (mis. Windows: Animation effects mati),
  // kata kunci tetap berganti tetapi hanya memudar di tempat, tanpa gerakan naik.
  function rollSearch(input, ph, win) {
    const STEP_MS = 2200;
    const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    let words = [], i = 0, timer = null;
    const pos = (k) => { const n = words.length, d = (k - i + n) % n; return d === 0 ? [0, 1] : reduce ? [0, 0] : d === n - 1 ? [-100, 0] : [100, 0]; };
    const place = () => [...win.children].forEach((el, k) => { const [y, o] = pos(k); el.style.transform = `translateY(${y}%)`; el.style.opacity = o; });
    // Placeholder bawaan dibaca saat sync (bukan saat dibuat) agar ikut bahasa yang aktif.
    const sync = () => { const show = words.length > 0 && !input.value; ph.hidden = !show; input.placeholder = show ? '' : input.getAttribute('aria-label'); };
    const tick = () => { if (document.hidden || input.value || words.length < 2) return; i = (i + 1) % words.length; place(); };
    return {
      start(list) {
        words = list.slice(0, 6); if (words.length === 2) words = words.concat(words); // perlu >= 3 agar arah gulir selalu ke atas
        i = 0;
        win.innerHTML = words.map((w, k) => { const [y, o] = pos(k); return `<span style="transform:translateY(${y}%);opacity:${o}">${esc(w)}</span>`; }).join('');
        sync(); clearInterval(timer);
        if (words.length > 1) timer = setInterval(tick, reduce ? STEP_MS + 800 : STEP_MS);
      },
      sync,
      current: () => (words.length ? words[i] : ''),
    };
  }
  const qIn = document.getElementById('q');
  const roll = rollSearch(qIn, document.getElementById('q-ph'), document.getElementById('q-roll'));
  const runQuery = () => { query = qIn.value; if (cur.name !== 'home') Router.go('/'); else render(true); };
  qIn.addEventListener('input', () => { roll.sync(); runQuery(); });
  // Tombol cari: kolom kosong -> cari kata kunci yang sedang tampil. Tutup keyboard ponsel setelah mencari.
  document.getElementById('f-q').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!qIn.value.trim() && roll.current()) { qIn.value = roll.current(); roll.sync(); runQuery(); }
    qIn.blur();
  });
  // Tombol header. Jelajah: buka daftar semua acara. Kerjasama: ke bagian "Untuk penyelenggara acara" di beranda.
  const homeWith = (cat) => { catF = cat; areaF = null; query = ''; qIn.value = ''; roll.sync(); if (cur.name !== 'home') Router.go('/'); else render(); };
  document.getElementById('h-explore').addEventListener('click', (ev) => { ev.preventDefault(); homeWith('__all'); window.scrollTo(0, 0); });
  document.getElementById('h-mitra').addEventListener('click', () => {
    homeWith(null);
    requestAnimationFrame(() => { const s = document.getElementById('sec-mitra'); if (s) s.scrollIntoView({ behavior: 'smooth' }); });
  });
  const searchWords = () => {
    const evs = E.s.order.map(E.ev).filter((e) => e && e.status !== 'DRAFT' && E.saleState(e).open).sort((a, b) => a.start - b.start);
    const cats = [...new Set(evs.map((e) => catName(e.cat).toLowerCase()))];
    return evs.map((e) => e.name).slice(0, 4).concat(cats).slice(0, 6);
  };

  // ---------------------------------------------------------------- pilihan bahasa di header
  // Teks statis di pengunjung.html: elemen ber-data-en (teks), data-en-label (aria-label), data-en-ph (placeholder).
  // Versi Indonesia disimpan sekali di data-id* saat pertama kali diganti.
  function applyStatic() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-en]').forEach((el) => { if (el.dataset.id == null) el.dataset.id = el.textContent; el.textContent = en() ? el.dataset.en : el.dataset.id; });
    document.querySelectorAll('[data-en-label]').forEach((el) => { if (el.dataset.idLabel == null) el.dataset.idLabel = el.getAttribute('aria-label') || ''; el.setAttribute('aria-label', en() ? el.dataset.enLabel : el.dataset.idLabel); });
    document.querySelectorAll('[data-en-ph]').forEach((el) => { if (el.dataset.idPh == null) el.dataset.idPh = el.getAttribute('placeholder') || ''; el.setAttribute('placeholder', en() ? el.dataset.enPh : el.dataset.idPh); });
    document.querySelectorAll('[data-lang-btn]').forEach((b) => { b.querySelector('.pv-flag').innerHTML = FLAG[lang]; b.setAttribute('aria-label', L('Bahasa: Indonesia. Ganti bahasa', 'Language: English. Change language')); });
    document.querySelectorAll('[data-lang]').forEach((o) => o.setAttribute('aria-checked', String(o.dataset.lang === lang)));
    document.title = L('Event & Tiket · Summarecon Mall Bandung', 'Events & Tickets · Summarecon Mall Bandung');
  }
  // Bendera bulat (SVG, tanpa aset luar). Warna resmi bendera, bukan warna tema.
  const FLAG = {
    id: '<svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice"><rect width="30" height="10" fill="#e70011"/><rect y="10" width="30" height="10" fill="#fff"/></svg>',
    en: '<svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice"><rect width="60" height="30" fill="#012169"/><path d="M0,0 60,30M60,0 0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 60,30M60,0 0,30" stroke="#c8102e" stroke-width="2"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#c8102e" stroke-width="6"/></svg>',
    // Disederhanakan untuk ukuran 20 px (pilihan kode negara nomor WhatsApp).
    my: '<svg viewBox="0 0 28 14" preserveAspectRatio="xMidYMid slice"><rect width="28" height="14" fill="#fff"/><path d="M0,0.5h28M0,2.5h28M0,4.5h28M0,6.5h28M0,8.5h28M0,10.5h28M0,12.5h28" stroke="#cc0001" stroke-width="1"/><rect width="14" height="8" fill="#010066"/><circle cx="5.6" cy="4" r="2.6" fill="#fc0"/><circle cx="6.4" cy="4" r="2.1" fill="#010066"/><circle cx="10" cy="4" r="1.4" fill="#fc0"/></svg>',
    sg: '<svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice"><rect width="30" height="10" fill="#ef3340"/><rect y="10" width="30" height="10" fill="#fff"/><circle cx="8" cy="5" r="3.4" fill="#fff"/><circle cx="9.4" cy="5" r="3.2" fill="#ef3340"/><circle cx="12" cy="3.4" r=".7" fill="#fff"/><circle cx="14" cy="4.6" r=".7" fill="#fff"/><circle cx="12.6" cy="6.6" r=".7" fill="#fff"/></svg>',
  };
  const menu = document.getElementById('lang-menu');
  menu.querySelectorAll('[data-flag]').forEach((s) => (s.innerHTML = FLAG[s.dataset.flag]));
  let menuBtn = null;
  function closeMenu(focusBtn) {
    if (menu.hidden) return;
    menu.hidden = true;
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); if (focusBtn) menuBtn.focus(); }
  }
  function openMenu(btn) {
    menuBtn = btn; const r = btn.getBoundingClientRect();
    menu.style.top = r.bottom + 8 + 'px';
    menu.style.right = Math.max(8, document.documentElement.clientWidth - r.right) + 'px';
    menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    (menu.querySelector('[aria-checked="true"]') || menu.querySelector('[data-lang]')).focus();
  }
  function setLang(next) {
    if (next === lang) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) { /* tidak tersimpan, tetap berlaku sampai halaman dimuat ulang */ }
    applyStatic(); roll.sync(); setHdr();
    if (E.s) { roll.start(searchWords()); render(true); }
  }
  document.querySelectorAll('[data-lang-btn]').forEach((b) => b.addEventListener('click', (ev) => { ev.stopPropagation(); if (!menu.hidden && menuBtn === b) closeMenu(); else { closeMenu(); openMenu(b); } }));
  menu.querySelectorAll('[data-lang]').forEach((o) => o.addEventListener('click', () => { setLang(o.dataset.lang); closeMenu(true); }));
  menu.addEventListener('keydown', (ev) => {
    const opts = [...menu.querySelectorAll('[data-lang]')]; const k = opts.indexOf(document.activeElement);
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); opts[(k + (ev.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length].focus(); }
    else if (ev.key === 'Escape') { ev.stopPropagation(); closeMenu(true); }
    else if (ev.key === 'Tab') closeMenu();
  });
  document.addEventListener('click', (ev) => { if (!menu.hidden && !menu.contains(ev.target)) closeMenu(); });
  window.addEventListener('resize', () => closeMenu());
  applyStatic(); setHdr();

  E.init().then(() => {
    roll.start(searchWords());
    cur = parse(); render();
    E.subscribe(rerender);
    setInterval(() => { if (tick()) rerender(); }, 1000);
  });
})();

// Esc menutup modal portal pengunjung
document.addEventListener('keydown', (e) => { const r = document.getElementById('modal-root'); if (e.key === 'Escape' && r && r.innerHTML) r.innerHTML = ''; });
