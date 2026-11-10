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

  // ---------------------------------------------------------------- util UI
  function toast(text, kind) {
    const col = { ok: '#10b981', err: '#f43f5e', info: '#38bdf8' }[kind || 'info'];
    const el = document.createElement('div');
    el.className = 'toast card-elev px-4 py-3 font-body-sm text-body-sm max-w-md w-full pointer-events-auto';
    el.style.borderLeft = '4px solid ' + col;
    el.innerHTML = text;
    document.getElementById('toast-root').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; }, 3800);
    setTimeout(() => el.remove(), 4300);
  }
  function modal(title, body) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center scrim" data-close>
      <div class="card-elev w-full max-w-xl rounded-b-none sm:rounded-2xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10"><h3 class="font-headline-sm text-headline-sm">${title}</h3><button class="btn-ghost !px-2" data-close>${ic('close')}</button></div>
        <div class="p-5">${body}</div></div></div>`;
    root.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', (e) => { if (e.target === el || el.tagName === 'BUTTON') root.innerHTML = ''; }));
    return root;
  }
  const closeModal = () => (document.getElementById('modal-root').innerHTML = '');
  async function act(p, okMsg) {
    if (busy) return null; busy = true;
    try { const r = await p(); if (okMsg) toast(okMsg, 'ok'); return r; } catch (e) { toast(ic('error', 'text-[18px] align-middle text-rose-300') + ' ' + esc(e.message), 'err'); return null; } finally { busy = false; }
  }
  const back = (href, label) => `<a href="${href}" class="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary mb-3">${ic('arrow_back', 'text-[16px]')} ${label}</a>`;
  const statusChip = (st) => {
    const m = { PENDING: ['Menunggu pembayaran', 'bg-amber-500/15 text-amber-300'], PAID: ['Lunas, e-ticket terbit', 'bg-emerald-500/15 text-emerald-300'], EXPIRED: ['Kedaluwarsa', 'bg-slate-500/20 text-slate-300'], CANCELLED: ['Dibatalkan', 'bg-slate-500/20 text-slate-300'], REFUNDED: ['Refund', 'bg-rose-500/15 text-rose-300'] }[st];
    return `<span class="px-2 py-0.5 rounded-md font-label-sm text-label-sm ${m[1]}">${m[0]}</span>`;
  };
  const avail = (e) => { const s = E.stats(e.id); const sale = e.types.filter((t) => t.onSale).map((t) => s.per[t.id]); const total = sale.reduce((a, p) => a + p.total - p.blocked, 0); const left = sale.reduce((a, p) => a + p.available, 0); return { left, total, pct: total ? (left / total) * 100 : 0 }; };

  // ---------------------------------------------------------------- komponen katalog
  const ICON = { Konser: 'music_note', Teknologi: 'memory', Komedi: 'theater_comedy', Pameran: 'storefront', Olahraga: 'sports_soccer', Anak: 'child_care', Kuliner: 'restaurant', Esports: 'sports_esports' };
  const evIcon = (cat) => ICON[cat] || 'celebration';
  const shortVenue = (v) => String(v || '').split(' · ')[0];
  const priceFrom = (e) => { const p = e.types.filter((t) => t.onSale).map((t) => t.price); return p.length ? Math.min(...p) : null; };
  const perks = (t) => (/kursi/i.test(t.perks || '') ? t.perks : [t.perks, t.seated ? 'Kursi bernomor' : 'Tanpa nomor kursi'].filter(Boolean).join('. '));
  const priceTxt = (e) => { const m = priceFrom(e); return m == null ? '-' : m === 0 ? 'Gratis' : rp(m); };
  function availChip(e) {
    const a = avail(e), sale = E.saleState(e);
    if (!sale.open) return [sale.label, 'bg-slate-500/20 text-slate-300'];
    if (a.left === 0) return ['Habis terjual', 'bg-rose-500/15 text-rose-300'];
    if (a.pct < 30) return ['Sisa ' + a.left + ' tiket', 'bg-amber-500/15 text-amber-300'];
    return ['Tersedia', 'bg-emerald-500/15 text-emerald-300'];
  }
  // Banner acara: foto bila ada (e.img), selain itu gradien warna acara + ikon kategori.
  const banner = (e, big) => `<div class="pv-banner ${big ? 'pv-banner-lg' : ''} ${e.img ? 'has-img' : ''}" style="--c:${esc(e.color)}">${e.img ? `<img class="pv-banner-img" src="${esc(e.img)}" alt="" loading="lazy" decoding="async">` : ic(evIcon(e.cat), 'pv-banner-ic')}
    <div class="pv-banner-txt"><span class="pv-tag">${esc(e.cat)}</span>${big ? `<div><div class="pv-banner-title">${esc(e.name)}</div>${e.tagline ? `<div class="pv-banner-sub">${esc(e.tagline)}</div>` : ''}</div>` : ''}</div></div>`;
  const card = (e) => { const [l, c] = availChip(e); return `<a href="/pengunjung/e/${e.id}" class="pv-card">${banner(e)}<div class="p-3 flex flex-col gap-1 flex-1">
      <h3 class="font-label-lg text-label-lg pv-clamp2">${esc(e.name)}</h3>
      <div class="font-label-sm text-label-sm text-on-surface-variant">${ic('calendar_month', 'text-[14px] align-middle')} ${E.fmtShort(e.start)}, ${E.fmtTime(e.start)} WIB</div>
      <div class="font-label-sm text-label-sm text-on-surface-variant truncate">${ic('location_on', 'text-[14px] align-middle')} ${esc(shortVenue(e.venue))}</div>
      <div class="pv-dash mt-auto pt-2 flex items-end justify-between gap-2"><div><div class="font-label-sm text-label-sm text-on-surface-variant">Mulai dari</div><div class="font-label-lg text-label-lg text-primary">${priceTxt(e)}</div></div><span class="px-2 py-0.5 rounded-md font-label-sm text-label-sm text-right ${c}">${esc(l)}</span></div></div></a>`; };
  const rail = (key, title, icon, list) => list.length ? `<section class="mb-6"><h2 class="font-headline-sm text-headline-sm mb-2 flex items-center gap-1.5">${icon ? ic(icon, 'text-[20px] text-primary') : ''}${title}</h2>
      <div class="pv-rail" data-rail="${key}">${list.map((e) => `<div class="pv-rail-item">${card(e)}</div>`).join('')}</div></section>` : '';
  // Alur beli: kategori -> kursi (hanya bila acara punya kategori bernomor kursi) -> data pemesan -> pembayaran
  const hasSeats = (e) => e.types.some((t) => t.seated && t.onSale);
  const STEP = { kategori: 'Pilih kategori', kursi: 'Pilih kursi', data: 'Data pemesan', bayar: 'Pembayaran' };
  const steps = (key, e) => {
    const keys = hasSeats(e) ? ['kategori', 'kursi', 'data', 'bayar'] : ['kategori', 'data', 'bayar'];
    const n = keys.indexOf(key) + 1;
    return `<div class="mb-4"><div class="font-label-md text-label-md"><span class="text-on-surface-variant">Langkah ${n} dari ${keys.length}</span><span class="pv-sep text-on-surface-variant"></span><b>${STEP[key]}</b></div><div class="pv-steps mt-2" style="grid-template-columns:repeat(${keys.length},1fr)">${keys.map((_, i) => `<span class="${i < n ? 'on' : ''}"></span>`).join('')}</div></div>`;
  };

  // ---------------------------------------------------------------- views
  const V = {};
  // ---------------------------------------------------------------- beranda (landing)
  // Urutan section: hero, info kunjungan, acara terdekat, minggu ini, laku keras, kategori, deretan per kategori,
  // area mal, promo tenant, ajukan acara, panduan pengunjung, footer. Section tanpa data tidak ditampilkan.
  const MALL = { hours: '10:00 - 22:00', address: 'Kawasan Summarecon Bandung, Gedebage, Kota Bandung' };
  const AREAS = [
    { key: 'Main Atrium', floor: 'GF', img: 'area-atrium', note: 'Panggung utama di bawah kubah' },
    { key: 'Summarecon Hall', floor: 'Lt. 3', img: 'area-hall', note: 'Auditorium kursi bernomor' },
    { key: 'Outdoor Plaza', floor: 'GF', img: 'area-plaza', note: 'Bazar, festival & olahraga' },
    { key: 'Exhibition Hall', floor: 'Lt. 1', img: 'area-expo', note: 'Pameran & expo' },
    { key: 'Kids Zone', floor: 'Lt. 2', img: 'area-kids', note: 'Kelas & acara anak' },
  ];
  // Contoh promo tenant untuk pemegang e-ticket (statis, ganti dengan data tenant sebenarnya).
  const PROMOS = [
    { img: 'promo-fnb', place: 'Food Court, Lt. 3', title: 'Diskon 15% makan malam', text: 'Tunjukkan e-ticket acara hari yang sama di kasir tenant food court yang ikut serta.' },
    { img: 'promo-kopi', place: 'Kedai kopi, GF', title: 'Gratis upsize minuman', text: 'Berlaku 2 jam sebelum acara dimulai. Satu kali per e-ticket.' },
    { img: 'promo-fashion', place: 'Area fashion, Lt. 1-2', title: 'Potongan Rp50.000', text: 'Minimal belanja Rp300.000 di tenant fashion yang ikut serta, sampai 7 hari setelah acara.' },
    { img: 'promo-bioskop', place: 'Bioskop, Lt. 3', title: 'Beli 1 gratis 1 popcorn', text: 'Untuk pembelian tiket film di hari yang sama dengan acaramu.' },
  ];
  const GUIDE = [
    { icon: 'local_parking', title: 'Parkir & akses', items: ['Parkir mobil di basement dan gedung parkir, motor di sisi timur.', 'Turun di lobi utama untuk ojek daring dan taksi.', 'Datang 30-60 menit lebih awal saat akhir pekan.'] },
    { icon: 'qr_code_2', title: 'Masuk ke acara', items: ['Buka e-ticket di menu Tiket saya, tunjukkan QR ke petugas gate.', 'Satu QR berlaku untuk satu orang dan satu kali masuk.', 'Tangkapan layar QR tetap bisa dipindai.'] },
    { icon: 'currency_exchange', title: 'Refund & pembatalan', items: ['Bila acara dibatalkan pengelola, dana kembali otomatis.', 'Pesanan yang belum dibayar batal sendiri setelah batas waktu.', 'Pertanyaan pesanan: siapkan kode booking BK-....'] },
    { icon: 'accessible', title: 'Fasilitas', items: ['Kursi roda dapat dipinjam di Customer Service GF.', 'Musala, ruang laktasi, dan toilet ramah difabel di tiap lantai.', 'Area acara bebas rokok.'] },
  ];
  const img = (f) => '/app/img/demo/' + f + '.jpg';
  const area = (e) => shortVenue(e.venue).split(',')[0];
  const inArea = (e, key) => area(e) === key;
  const dayStart = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const sec = (id, title, icon, body, more) => `<section class="pv-sec-home" id="sec-${id}"><div class="pv-sec-head"><h2 class="font-headline-sm text-headline-sm flex items-center gap-1.5">${icon ? ic(icon, 'text-[20px] text-primary') : ''}${title}</h2>${more || ''}</div>${body}</section>`;
  let weekTab = 'today';
  let areaF = null; // filter area mal di beranda
  let heroIdx = 0;

  function weekList(all) {
    const t0 = dayStart(E.now()), D = 86400000;
    const dow = new Date(E.now()).getDay(); const toSat = (6 - dow + 7) % 7;
    const range = { today: [t0, t0 + D], weekend: dow === 0 ? [t0, t0 + D] : [t0 + toSat * D, t0 + (toSat + 2) * D], week: [t0, t0 + 7 * D] }[weekTab];
    return all.filter((e) => e.start >= Math.max(range[0], E.now() - 3 * 3600000) && e.start < range[1]).sort((a, b) => a.start - b.start);
  }
  function homeSections(all) {
    const open = all.filter((e) => E.saleState(e).open);
    const upcoming = all.filter((e) => e.start > E.now() - 3 * 3600000).sort((a, b) => a.start - b.start);
    const hero = (open.length ? open : all).slice().sort((a, b) => a.start - b.start).slice(0, 5);
    const hot = open.filter((e) => { const a = avail(e); return a.left > 0 && a.pct < 30; }).sort((x, y) => avail(x).pct - avail(y).pct);
    const today = all.filter((e) => dayStart(e.start) === dayStart(E.now()));
    const cats = [...new Set(all.map((e) => e.cat))];
    const byCat = cats.map((c) => [c, upcoming.filter((e) => e.cat === c)]).filter(([, l]) => l.length >= 2);
    heroIdx = Math.min(heroIdx, Math.max(0, hero.length - 1));

    const heroHtml = hero.length ? `<section class="pv-hero" aria-roledescription="carousel" aria-label="Acara unggulan">
      <div class="pv-hero-track" data-rail="hero">${hero.map((e, i) => `<a href="/pengunjung/e/${e.id}" class="pv-hero-slide" aria-label="${esc(e.name)}" data-hero="${i}">${banner(e, true)}
        <div class="pv-hero-cta"><span>${E.fmtShort(e.start)}, ${E.fmtTime(e.start)} WIB · ${esc(area(e))}</span><span class="btn !py-2">${ic('confirmation_number', 'text-[18px]')} Beli tiket</span></div></a>`).join('')}</div>
      ${hero.length > 1 ? `<div class="pv-hero-dots" role="tablist">${hero.map((e, i) => `<button type="button" data-hero-dot="${i}" class="${i === heroIdx ? 'on' : ''}" aria-label="Slide ${i + 1}: ${esc(e.name)}"></button>`).join('')}</div>` : ''}</section>` : '';

    const info = `<section class="pv-info">${[
      ['schedule', 'Buka hari ini', MALL.hours],
      ['local_activity', 'Acara hari ini', today.length ? today.length + ' acara' : 'Belum ada'],
      ['door_front', 'Gate acara', 'Dibuka 30-60 menit sebelum mulai'],
      ['local_parking', 'Parkir', 'Basement & gedung parkir'],
    ].map(([i, k, v]) => `<div class="pv-info-item">${ic(i, 'text-primary text-[22px]')}<div><div class="font-label-sm text-label-sm text-on-surface-variant">${k}</div><div class="font-label-lg text-label-lg">${v}</div></div></div>`).join('')}</section>`;

    const week = weekList(all);
    const weekHtml = sec('week', 'Minggu ini di mal', 'event_upcoming', `<div class="pv-seg" role="tablist">${[['today', 'Hari ini'], ['weekend', 'Akhir pekan'], ['week', '7 hari ke depan']].map(([k, l]) => `<button type="button" role="tab" aria-selected="${weekTab === k}" class="${weekTab === k ? 'on' : ''}" data-week="${k}">${l}</button>`).join('')}</div>
      <div class="pv-list">${week.map((e) => { const d = new Date(e.start); return `<a href="/pengunjung/e/${e.id}" class="pv-list-row"><div class="pv-date"><b>${d.getDate()}</b><span>${d.toLocaleDateString('id-ID', { month: 'short' })}</span></div>
        <div class="min-w-0 flex-1"><div class="font-label-lg text-label-lg truncate">${esc(e.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant truncate">${d.toLocaleDateString('id-ID', { weekday: 'long' })}, ${E.fmtTime(e.start)} WIB · ${esc(area(e))}</div></div>
        <div class="text-right shrink-0"><div class="font-label-sm text-label-sm text-on-surface-variant">Mulai dari</div><div class="font-label-lg text-label-lg text-primary">${priceTxt(e)}</div></div></a>`; }).join('') || `<div class="inner p-4 font-body-sm text-body-sm text-on-surface-variant">Belum ada acara di rentang ini. Coba tab lain.</div>`}</div>`);

    const catTiles = sec('cat', 'Jelajahi kategori', 'category', `<div class="pv-cats">${cats.map((c) => `<button type="button" class="pv-cat" data-cat="${esc(c)}">${ic(evIcon(c), 'text-[26px]')}<span>${esc(c)}</span><small>${all.filter((e) => e.cat === c).length} acara</small></button>`).join('')}</div>`);

    const areas = AREAS.map((a) => ({ ...a, n: upcoming.filter((e) => inArea(e, a.key)).length })).filter((a) => a.n);
    const areaHtml = areas.length ? sec('area', 'Jelajahi area mal', 'map', `<div class="pv-areas">${areas.map((a) => `<button type="button" class="pv-area" data-area="${esc(a.key)}"><img src="${img(a.img)}" alt="" loading="lazy"><span class="pv-area-txt"><b>${esc(a.key)}</b><small>${esc(a.floor)} · ${a.n} acara</small><small class="pv-area-note">${esc(a.note)}</small></span></button>`).join('')}</div>`) : '';

    // Logo tenant berjalan kanan -> kiri (daftar digandakan agar loop mulus). Berhenti saat diarahkan/disentuh, ada tombol Jeda
    // (WCAG 2.2.2). Seperti ticker Command Center, tetap berjalan walau sistem meminta kurangi gerakan.
    const T = (window.SMB_TENANTS || []).filter((x) => x && x.name);
    const logo = (x, hidden) => `<li class="pv-logo" ${hidden ? 'aria-hidden="true"' : ''} title="${esc(x.name)}${x.cat ? ' · ' + esc(x.cat) : ''}">${x.logo ? `<img src="${esc(x.logo)}" alt="${hidden ? '' : esc(x.name)}" loading="lazy" decoding="async">` : `<span>${esc(x.name)}</span>`}</li>`;
    // Logo sedikit: ulangi sampai satu putaran lebih lebar dari layar desktop (+-1600px / 180px per logo), baru digandakan untuk loop.
    let run = T.slice(); while (T.length && run.length < 10) run = run.concat(T);
    const marquee = T.length ? sec('tenant', 'Tenant di Summarecon Mall Bandung', 'storefront', `<div class="pv-marquee" style="--dur:${Math.max(30, run.length * 3)}s">
        <ul class="pv-marquee-track" aria-label="Daftar tenant">${run.map((x, i) => logo(x, i >= T.length)).join('')}${run.map((x) => logo(x, true)).join('')}</ul></div>`,
      `<button type="button" class="pv-more" data-marquee aria-pressed="false">${ic('pause', 'text-[18px]')} Jeda</button>`) : '';
    const promoHtml = sec('promo', 'Promo tenant untuk pemegang tiket', 'sell', `<p class="font-body-sm text-body-sm text-on-surface-variant -mt-1 mb-3">Contoh promo. Tunjukkan e-ticket di kasir tenant yang ikut serta.</p>
      <div class="pv-row4">${PROMOS.map((p) => `<article class="pv-promo"><img src="${img(p.img)}" alt="" loading="lazy"><div class="p-3"><div class="font-label-sm text-label-sm text-on-surface-variant">${esc(p.place)}</div><div class="font-label-lg text-label-lg mt-0.5">${esc(p.title)}</div><p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${esc(p.text)}</p></div></article>`).join('')}</div>`);

    const creator = `<section class="pv-creator"><div><div class="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Untuk penyelenggara acara</div>
      <h2 class="pv-creator-title">Gelar acaramu di Summarecon Mall Bandung</h2>
      <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Lima area acara dari 50 sampai 400 pengunjung, penjualan tiket dengan kursi bernomor, check-in QR, dan laporan langsung ke tim mal.</p></div>
      <div class="flex flex-wrap gap-2"><a class="btn" href="/pengelola">${ic('admin_panel_settings', 'text-[18px]')} Konsol pengelola</a><button type="button" class="btn-ghost" data-creator>${ic('call', 'text-[18px]')} Hubungi tim event</button></div></section>`;

    const guide = sec('panduan', 'Panduan pengunjung', 'info', `<div class="pv-row4">${GUIDE.map((g) => `<details class="pv-guide"><summary>${ic(g.icon, 'text-primary text-[22px]')}<span class="flex-1">${esc(g.title)}</span>${ic('expand_more', 'pv-guide-chev')}</summary>
      <ul>${g.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}</div>`);

    return heroHtml + info
      + sec('terdekat', 'Acara di Summarecon Mall', 'local_activity', `<div class="pv-grid">${upcoming.slice(0, 8).map(card).join('')}</div>`, upcoming.length > 8 ? `<button type="button" class="pv-more" data-cat="__all">Lihat semua ${ic('chevron_right', 'text-[18px]')}</button>` : '')
      + weekHtml
      + (hot.length ? sec('hot', 'Laku keras', 'local_fire_department', `<div class="pv-grid">${hot.slice(0, 4).map(card).join('')}</div>`) : '')
      + catTiles
      + byCat.map(([c, l]) => sec('k-' + c.toLowerCase(), esc(c) + ' di mal', evIcon(c), `<div class="pv-rail" data-rail="k-${esc(c)}">${l.map((e) => `<div class="pv-rail-item">${card(e)}</div>`).join('')}</div>`, `<button type="button" class="pv-more" data-cat="${esc(c)}">Lihat semua ${ic('chevron_right', 'text-[18px]')}</button>`)).join('')
      + areaHtml + marquee + promoHtml + creator + guide + footer();
  }

  function footer() {
    const col = (title, links) => `<div><div class="pv-foot-h">${title}</div>${links.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</div>`;
    return `<footer class="pv-foot"><div class="pv-foot-grid">
      <div class="pv-foot-about"><div class="flex items-center gap-2 mb-2">${ic('local_activity', 'text-primary')}<b class="font-headline-sm text-headline-sm">Summarecon Mall Bandung</b></div>
        <p>Tiket acara di Summarecon Mall Bandung: konser, pameran, kuliner, acara anak, dan lainnya.</p>
        <p class="mt-2">${ic('location_on', 'text-[16px] align-middle')} ${esc(MALL.address)}<br>${ic('schedule', 'text-[16px] align-middle')} Buka setiap hari ${MALL.hours}</p></div>
      ${col('Pengunjung', [['/pengunjung/tiket', 'Tiket saya'], ['/pengunjung/inbox', 'Kotak masuk'], ['#sec-panduan', 'Panduan pengunjung']])}
      ${col('Penyelenggara', [['/pengelola', 'Konsol pengelola'], ['/checkin', 'Check-in gate']])}
      ${col('Untuk staf', [['/command-center', 'Command Center'], ['/', 'Pilih peran']])}
      <div><div class="pv-foot-h">Pembayaran (simulasi)</div><div class="flex flex-wrap gap-1.5">${['QRIS', 'Virtual account', 'E-wallet', 'Kartu kredit'].map((m) => `<span class="pv-pay">${m}</span>`).join('')}</div></div>
    </div><div class="pv-foot-bot"><span>Prototipe Bandung Build Challenge 2026. Data contoh, pembayaran simulasi.</span><a href="/app/img/demo/CREDITS.md" target="_blank" rel="noopener">Kredit foto demo</a></div></footer>`;
  }

  V.home = () => {
    const all = E.s.order.map(E.ev).filter((e) => e && e.status !== 'DRAFT');
    if (!all.length) return `<div class="card p-6 text-center font-body-sm text-body-sm text-on-surface-variant">Belum ada acara yang dipublikasikan.</div>`;
    const q = query.trim().toLowerCase();
    if (q || catF || areaF) {
      const cats = [...new Set(all.map((e) => e.cat))];
      const chips = `<div class="pv-rail pv-chips mb-4" data-rail="cat"><button class="chip-btn ${!catF || catF === '__all' ? 'on' : ''}" data-cat="__all">Semua</button>${cats.map((c) => `<button class="chip-btn ${catF === c ? 'on' : ''}" data-cat="${esc(c)}">${ic(evIcon(c), 'text-[16px]')}${esc(c)}</button>`).join('')}</div>`;
      const hit = all.filter((e) => (!catF || catF === '__all' || e.cat === catF) && (!areaF || inArea(e, areaF)) && (!q || [e.name, e.tagline, e.venue, e.cat].join(' ').toLowerCase().includes(q))).sort((a, b) => a.start - b.start);
      return `<button type="button" class="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary mb-3" data-reset>${ic('arrow_back', 'text-[16px]')} Beranda</button>${chips}
        <div class="flex flex-wrap items-center gap-2 mb-3"><p class="font-body-sm text-body-sm text-on-surface-variant">${hit.length} acara${q ? ` untuk "${esc(query.trim())}"` : ''}${catF && catF !== '__all' ? ` di kategori ${esc(catF)}` : ''}${areaF ? ` di ${esc(areaF)}` : ''}</p>${areaF ? `<button type="button" class="chip-btn on" data-area="">${esc(areaF)} ${ic('close', 'text-[14px]')}</button>` : ''}</div>
        <div class="pv-grid">${hit.map(card).join('') || `<div class="inner p-4 font-body-sm text-body-sm text-on-surface-variant">Tidak ada acara yang cocok. Coba kata lain atau pilih Semua.</div>`}</div>`;
    }
    return homeSections(all);
  };

  V.event = (id) => {
    const e = E.ev(id); if (!e) return notFound();
    const s = E.stats(id); const sale = E.saleState(e);
    const onSale = e.types.filter((t) => t.onSale);
    const row = (icon, html) => `<div class="flex gap-2.5 items-start">${ic(icon, 'text-primary text-[20px]')}<span>${html}</span></div>`;
    const tix = (t) => {
      const p = s.per[t.id]; const sold = t.onSale && p.available === 0;
      const st = !t.onSale ? ['Tidak dijual', 'text-on-surface-variant'] : sold ? ['Habis terjual', 'text-rose-300'] : p.available < 10 ? ['Sisa ' + p.available, 'text-amber-300'] : ['Tersedia', 'text-emerald-300'];
      return `<div class="pv-tix" style="--c:${esc(t.color)}"><div class="px-4 pt-3 pb-3"><div class="flex items-start justify-between gap-2"><div class="font-label-lg text-label-lg">${esc(t.name)}</div><span class="font-label-md text-label-md whitespace-nowrap ${st[1]}">${st[0]}</span></div>
          <div class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">${esc(perks(t))}</div></div>
        <div class="pv-dash mx-4"></div>
        <div class="px-4 py-3 flex items-center justify-between gap-2"><span class="font-headline-sm text-headline-sm">${t.price ? rp(t.price) : 'Gratis'}</span><span class="font-label-sm text-label-sm text-on-surface-variant text-right">Penjualan berakhir<br>${E.fmtDT(e.saleEnd)} WIB</span></div></div>`;
    };
    const sk = [
      'Satu e-ticket berlaku untuk satu orang dan satu kali masuk.',
      `Maksimal ${e.maxPerOrder} tiket per pesanan.`,
      `Kursi yang kamu pilih ditahan ${e.holdMin} menit. Setelah pesanan dibuat, pembayaran harus selesai dalam ${E.PAY_MIN} menit.`,
      'Isi nama pemesan sesuai identitas. Petugas gate dapat mencocokkan nama pada e-ticket.',
      `Tunjukkan QR e-ticket di gate. Gate dibuka pukul ${E.fmtTime(e.doors)} WIB.`,
      'Bila acara dibatalkan pengelola, dana dikembalikan otomatis dan e-ticket tidak berlaku lagi.',
      'Prototipe: pembayaran memakai simulasi sandbox, tidak ada uang yang ditarik.',
    ];
    return `${back('/pengunjung', 'Semua acara')}
      <div class="pv-bleed mb-4">${banner(e)}</div>
      <h1 class="font-headline-md text-headline-md">${esc(e.name)}</h1>
      ${e.tagline ? `<p class="font-body-sm text-body-sm text-on-surface-variant">${esc(e.tagline)}</p>` : ''}
      <div class="flex flex-col gap-2.5 mt-4 font-body-sm text-body-sm">
        ${row('location_on', esc(e.venue))}
        ${row('calendar_month', `${E.fmtDate(e.start)}<br><span class="text-on-surface-variant">Mulai ${E.fmtTime(e.start)} WIB, gate dibuka ${E.fmtTime(e.doors)} WIB</span>`)}
        ${row('category', esc(e.cat))}
      </div>
      <button type="button" id="share" class="mt-3 inline-flex items-center gap-1.5 font-label-md text-label-md text-primary">${ic('share', 'text-[18px]')} Bagikan acara</button>
      <div class="pv-dash mt-4 pt-3 flex items-center gap-3"><span class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">${ic('storefront', 'text-[20px]')}</span><div><div class="font-label-sm text-label-sm text-on-surface-variant">Diselenggarakan oleh</div><div class="font-label-lg text-label-lg">${esc(e.org || 'Summarecon Mall Bandung')}</div></div></div>
      <nav class="pv-tabs" aria-label="Bagian acara"><button type="button" data-jump="desk" class="on">Deskripsi</button><button type="button" data-jump="tiket">Tiket</button><button type="button" data-jump="sk">Syarat & ketentuan</button></nav>
      <section id="sec-desk" class="pv-sec"><h2 class="font-headline-sm text-headline-sm mb-2">Deskripsi</h2><p class="font-body-md text-body-md text-on-surface-variant whitespace-pre-line">${esc(e.desc || 'Belum ada deskripsi.')}</p></section>
      <section id="sec-tiket" class="pv-sec"><h2 class="font-headline-sm text-headline-sm">Tiket</h2>
        <p class="font-body-sm text-body-sm text-on-surface-variant mb-3">${onSale.length} kategori tiket, harga mulai dari ${priceTxt(e)}</p>
        <div class="flex flex-col gap-3">${e.types.map(tix).join('')}</div></section>
      <section id="sec-sk" class="pv-sec"><h2 class="font-headline-sm text-headline-sm mb-2">Syarat & ketentuan</h2>
        <ol class="list-decimal pl-5 flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">${sk.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>
      <div class="fixed bottom-[60px] inset-x-0 z-30" style="margin-bottom: env(safe-area-inset-bottom)"><div class="max-w-xl mx-auto px-3"><div class="card-elev p-3 flex items-center justify-between gap-3">
        <div><div class="font-label-sm text-label-sm text-on-surface-variant">Harga mulai dari</div><div class="font-headline-sm text-headline-sm">${priceTxt(e)}</div></div>
        ${sale.open ? `<a href="/pengunjung/e/${id}/kategori" class="btn !px-6 !py-3">${ic('confirmation_number', 'text-[18px]')} Beli tiket</a>` : `<span class="font-label-md text-label-md text-on-surface-variant text-right">${ic('info', 'text-[16px] align-middle')} ${esc(sale.label)}</span>`}</div></div></div>`;
  };

  // Bilah bawah (langkah kategori & kursi): tiket yang sedang ditahan, sisa waktu tahan, total, tombol Lanjut.
  function cartBar(e, id, h) {
    const pr = E.price(e, h.items);
    const sumByType = {}; h.items.forEach((i) => (sumByType[i.type] = (sumByType[i.type] || 0) + 1));
    return `<div class="fixed bottom-[60px] inset-x-0 z-30" style="margin-bottom: env(safe-area-inset-bottom)"><div class="max-w-xl mx-auto px-3"><div class="card-elev p-3 flex flex-col gap-2">
        ${h.items.length ? `<div class="flex items-center justify-between font-label-md text-label-md"><span class="text-on-surface-variant">${ic('lock_clock', 'text-[16px] align-middle text-amber-300')} Ditahan untukmu <b class="text-amber-300" data-until="${h.until}">--:--</b></span><button class="text-on-surface-variant hover:text-rose-300 font-label-sm text-label-sm" id="clear">Lepas semua</button></div>
          <div class="flex flex-wrap gap-1.5">${h.items.filter((i) => i.seat).map((i) => `<span class="px-2 py-0.5 rounded-md font-label-sm text-label-sm" style="background:${E.typeById(e, i.type).color}33;border:1px solid ${E.typeById(e, i.type).color}">${i.seat}</span>`).join('')}${Object.entries(sumByType).filter(([tid]) => !E.typeById(e, tid).seated).map(([tid, n]) => `<span class="px-2 py-0.5 rounded-md font-label-sm text-label-sm bg-white/10">${n}× ${esc(E.typeById(e, tid).name)}</span>`).join('')}</div>` : `<div class="font-body-sm text-body-sm text-on-surface-variant">Belum ada tiket dipilih.</div>`}
        <div class="flex items-center justify-between gap-3"><div><div class="font-label-sm text-label-sm text-on-surface-variant">${h.items.length} tiket${pr.fee ? ' + biaya layanan' : ''}</div><div class="font-headline-sm text-headline-sm">${h.items.length ? rp(pr.total) : '–'}</div></div>
          <a href="/pengunjung/e/${id}/data" class="btn ${h.items.length ? '' : 'pointer-events-none opacity-40'}">Lanjut ${ic('arrow_forward', 'text-[18px]')}</a></div></div></div></div>`;
  }
  const saleNotice = (sale) => `<div class="inner p-3 mb-3 font-body-sm text-body-sm text-amber-300">${esc(sale.label)}. Tiket belum bisa dipilih.</div>`;

  // Langkah 1: pilih kategori. Kategori bernomor kursi -> lanjut ke denah kategori itu; tanpa nomor kursi -> atur jumlah di sini.
  V.cats = (id) => {
    const e = E.ev(id); if (!e) return notFound();
    const s = E.stats(id); const sale = E.saleState(e); const h = E.cartHolds(id, cart);
    const held = (tid) => h.items.filter((i) => i.type === tid).length;
    const card = (t) => {
      const p = s.per[t.id]; const n = held(t.id); const soldOut = p.available === 0 && !n;
      const st = soldOut ? ['Habis terjual', 'text-rose-300'] : p.available < 10 ? ['Sisa ' + p.available, 'text-amber-300'] : ['Tersedia', 'text-emerald-300'];
      const action = !sale.open ? ''
        : soldOut ? `<button class="btn-ghost" data-wl="${t.id}">${ic('hourglass_top', 'text-[16px]')} Daftar tunggu</button>`
        : t.seated ? `<a href="/pengunjung/e/${id}/kursi?kat=${encodeURIComponent(t.id)}" class="btn">${n ? n + ' kursi dipilih, ubah' : 'Pilih kursi'} ${ic('arrow_forward', 'text-[18px]')}</a>`
        : `<div class="flex items-center gap-2"><button class="btn-ghost !px-2" data-qty="${t.id}" data-d="-1" ${n === 0 ? 'disabled' : ''} aria-label="Kurangi ${esc(t.name)}">${ic('remove')}</button><span class="w-6 text-center font-headline-sm text-headline-sm" aria-live="polite">${n}</span><button class="btn-ghost !px-2" data-qty="${t.id}" data-d="1" ${p.available === 0 ? 'disabled' : ''} aria-label="Tambah ${esc(t.name)}">${ic('add')}</button></div>`;
      return `<div class="pv-tix ${n ? 'pv-tix-on' : ''}" style="--c:${esc(t.color)}"><div class="px-4 pt-3 pb-3"><div class="flex items-start justify-between gap-2"><div class="font-label-lg text-label-lg">${esc(t.name)}</div><span class="font-label-md text-label-md whitespace-nowrap ${st[1]}">${st[0]}</span></div>
          <div class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">${esc(perks(t))}</div></div>
        <div class="pv-dash mx-4"></div>
        <div class="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"><span class="font-headline-sm text-headline-sm">${t.price ? rp(t.price) : 'Gratis'}</span>${action}</div></div>`;
    };
    return `${back('/pengunjung/e/' + id, esc(e.name))}${steps('kategori', e)}
      <h1 class="font-headline-md text-headline-md">Pilih kategori tiket</h1>
      <p class="font-body-sm text-body-sm text-on-surface-variant mb-3">${hasSeats(e) ? 'Pilih kategori dulu. Untuk kategori bernomor kursi, kursinya kamu pilih di langkah berikutnya.' : 'Tentukan jumlah tiket untuk tiap kategori.'} Maksimal ${e.maxPerOrder} tiket per pesanan.</p>
      ${!sale.open ? saleNotice(sale) : ''}
      <div class="flex flex-col gap-3 mb-3">${e.types.filter((t) => t.onSale).map(card).join('')}</div>
      ${cartBar(e, id, h)}`;
  };

  // Langkah 2: pilih kursi, hanya untuk kategori yang dipilih (kursi kategori lain samar dan tidak bisa diketuk).
  V.seats = (id, kat) => {
    const e = E.ev(id); if (!e) return notFound();
    const t = E.typeById(e, kat);
    const s = E.stats(id); const sale = E.saleState(e); const h = E.cartHolds(id, cart); const p = s.per[t.id];
    const n = h.items.filter((i) => i.type === t.id).length;
    const more = e.types.some((x) => x.onSale && x.id !== t.id);
    return `${back('/pengunjung/e/' + id + '/kategori', 'Ganti kategori')}${steps('kursi', e)}
      <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full shrink-0" style="background:${esc(t.color)}"></span><h1 class="font-headline-md text-headline-md">Pilih kursi ${esc(t.name)}</h1></div>
      <p class="font-body-sm text-body-sm text-on-surface-variant mb-3">${t.price ? rp(t.price) : 'Gratis'} per kursi, sisa ${p.available} kursi${n ? ', ' + n + ' sudah kamu pilih' : ''}. Ketuk kursi berwarna untuk memilih; kursi ditahan untukmu selama ${e.holdMin} menit. Kursi kategori lain tampil samar.</p>
      ${!sale.open ? saleNotice(sale) : ''}
      ${p.available === 0 && !n ? `<div class="inner p-3 mb-3 flex items-center justify-between gap-3 font-body-sm text-body-sm"><span>${esc(t.name)} habis terjual.</span><button class="btn-ghost" data-wl="${t.id}">${ic('hourglass_top', 'text-[16px]')} Daftar tunggu</button></div>` : ''}
      <section class="card p-3 mb-3">${E.seatMap(id, { cart, only: t.id, lock: true })}
        <p class="font-label-sm text-label-sm text-on-surface-variant text-center mt-1 sm:hidden">${ic('swipe', 'text-[14px] align-middle')} Geser denah ke kiri/kanan untuk melihat semua kursi</p></section>
      <section class="card p-4 mb-3">${E.legend(e)}</section>
      ${more ? `<p class="font-body-sm text-body-sm text-on-surface-variant mb-3">Mau tambah kategori lain? <a class="text-primary" href="/pengunjung/e/${id}/kategori">Kembali ke pilihan kategori</a>. Kursi yang sudah kamu pilih tetap tersimpan.</p>` : ''}
      <details class="card p-4 mb-3"><summary class="flex items-center justify-between font-label-lg text-label-lg">${ic('verified_user', 'text-secondary text-[18px]')} <span class="flex-1 ml-2">Bagaimana kursi dijamin tidak dobel?</span>${ic('expand_more')}</summary>
        <ol class="list-decimal pl-5 mt-3 flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
          <li>Begitu kamu mengetuk kursi, kursi berstatus <b class="text-amber-300">sedang dipesan</b> untuk semua pengunjung lain selama ${e.holdMin} menit.</li>
          <li>Setiap pemesanan dicatat sebagai transaksi dengan nomor versi. Bila dua orang menekan kursi yang sama pada detik yang sama, server hanya menerima yang pertama; yang kedua otomatis ditolak.</li>
          <li>Saat pembayaran, sistem memeriksa ulang bahwa kursi masih ditahan untuk pesananmu dan belum kedaluwarsa, lalu kursi menjadi <b>terjual</b>.</li>
          <li>Jika waktu penahanan kursi atau batas pembayaran habis, kursi kembali tersedia untuk orang lain.</li></ol></details>
      ${cartBar(e, id, h)}`;
  };

  V.data = (id) => {
    const e = E.ev(id); if (!e) return notFound();
    const h = E.cartHolds(id, cart);
    if (!h.items.length) return `${back('/pengunjung/e/' + id + '/kategori', 'Pilih tiket lagi')}<div class="card p-6 text-center">${ic('timer_off', 'text-[40px] text-amber-300')}<h2 class="font-headline-sm text-headline-sm mt-2">Waktu penahanan kursi habis</h2><p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Kursi sudah dilepas dan kini bisa dipesan orang lain.</p><a href="/pengunjung/e/${id}/kategori" class="btn mt-4">Pilih tiket lagi</a></div>`;
    const pr = E.price(e, h.items);
    const saved = JSON.parse(sessionStorage.getItem('smicc-evt-form') || '{}');
    return `${back('/pengunjung/e/' + id + '/kategori', 'Ubah tiket')}${steps('data', e)}
      <h1 class="font-headline-md text-headline-md mb-3">Data peserta & ringkasan</h1>
      <form id="f-order" class="flex flex-col gap-4">
        <section class="card p-4 flex flex-col gap-3"><h2 class="font-headline-sm text-headline-sm">Data pemesan</h2>
          <label class="f">Nama lengkap<input class="inp" name="name" required autocomplete="name" value="${esc(saved.name || '')}" placeholder="Nama sesuai identitas"></label>
          <label class="f">Email (e-ticket dikirim ke sini)<input class="inp" name="email" type="email" required autocomplete="email" value="${esc(saved.email || '')}" placeholder="nama@email.com"></label>
          <label class="f">No. WhatsApp (pengingat acara)<input class="inp" name="phone" type="tel" required pattern="[0-9+\\- ]{9,16}" autocomplete="tel" value="${esc(saved.phone || '')}" placeholder="08xx-xxxx-xxxx"></label>
          ${h.items.length > 1 ? `<details><summary class="font-label-md text-label-md text-primary">${ic('group', 'text-[16px] align-middle')} Nama berbeda untuk tiap tiket (opsional)</summary><div class="flex flex-col gap-2 mt-2">${h.items.map((it, i) => `<label class="f">Tiket ${i + 1}: ${esc(E.typeById(e, it.type).name)}${it.seat ? ', kursi ' + it.seat : ''}<input class="inp" name="holder${i}" placeholder="Sama dengan pemesan"></label>`).join('')}</div></details>` : ''}
          <p class="font-label-sm text-label-sm text-on-surface-variant">Prototipe: gunakan data contoh, bukan data pribadi asli.</p></section>
        <section class="card p-4"><div class="flex items-center justify-between mb-2"><h2 class="font-headline-sm text-headline-sm">Ringkasan pesanan</h2><span class="font-label-md text-label-md text-amber-300">${ic('lock_clock', 'text-[16px] align-middle')} <span data-until="${h.until}">--:--</span></span></div>
          <div class="font-body-sm text-body-sm"><b>${esc(e.name)}</b><br><span class="text-on-surface-variant">${E.fmtDate(e.start)} · ${E.fmtTime(e.start)} WIB · ${esc(e.venue)}</span></div>
          <div class="mt-3 flex flex-col divide-y divide-white/5">${h.items.map((it) => { const t = E.typeById(e, it.type); return `<div class="flex justify-between py-2 font-body-sm text-body-sm"><span><span class="inline-block w-2 h-2 rounded-full mr-1" style="background:${t.color}"></span>${esc(t.name)}${it.seat ? ', kursi <b>' + it.seat + '</b>' : ', tanpa nomor kursi'}</span><span>${rp(t.price)}</span></div>`; }).join('')}
            <div class="flex justify-between py-2 font-body-sm text-body-sm text-on-surface-variant"><span>Biaya layanan</span><span>${pr.fee ? rp(pr.fee) : '–'}</span></div>
            <div class="flex justify-between py-2 font-headline-sm text-headline-sm"><span>Total</span><span>${rp(pr.total)}</span></div></div>
          <p class="font-label-sm text-label-sm text-on-surface-variant mt-1">Status: kursi ditahan, belum dibayar. Setelah pesanan dibuat, kamu punya ${E.PAY_MIN} menit untuk membayar.</p></section>
        <label class="flex items-start gap-2 font-body-sm text-body-sm"><input type="checkbox" required class="mt-1"> Saya setuju dengan syarat & ketentuan acara (simulasi) dan memastikan data sudah benar.</label>
        <button class="btn justify-center !py-3">${pr.total ? ic('payments') + ' Buat pesanan & bayar' : ic('how_to_reg') + ' Konfirmasi pendaftaran'}</button>
      </form>`;
  };

  V.order = (oid) => {
    const o = E.s.orders[oid]; if (!o) return notFound('Pesanan tidak ditemukan.');
    const e = E.ev(o.ev);
    const head = `${back('/pengunjung/tiket', 'Tiket saya')}<div class="flex items-center justify-between mb-3"><div><div class="font-label-md text-label-md text-on-surface-variant">Kode booking</div><div class="font-headline-md text-headline-md">${o.id}</div></div>${statusChip(o.status)}</div>`;
    const summary = `<section class="card p-4 mb-4"><div class="font-body-sm text-body-sm"><b>${esc(e.name)}</b><br><span class="text-on-surface-variant">${E.fmtDate(e.start)} · ${E.fmtTime(e.start)} WIB · ${esc(e.venue)}</span></div>
      <div class="mt-2 flex flex-col divide-y divide-white/5">${o.items.map((it) => `<div class="flex justify-between py-1.5 font-body-sm text-body-sm"><span>${esc(E.typeById(e, it.type).name)}${it.seat ? ', kursi <b>' + it.seat + '</b>' : ''}</span><span>${rp(E.typeById(e, it.type).price)}</span></div>`).join('')}
      ${o.fee ? `<div class="flex justify-between py-1.5 font-body-sm text-body-sm text-on-surface-variant"><span>Biaya layanan</span><span>${rp(o.fee)}</span></div>` : ''}<div class="flex justify-between py-2 font-headline-sm text-headline-sm"><span>Total</span><span>${rp(o.total)}</span></div></div>
      <div class="font-label-sm text-label-sm text-on-surface-variant">${esc(o.name)} · ${esc(o.email)} · ${esc(o.phone)}</div></section>`;
    if (o.status === 'PENDING' && o.until > E.now()) return head.replace('</a>', '</a>' + steps('bayar', e)) + payView(o) + summary;
    if (o.status === 'PAID') return head + ticketsView(o, e) + summary;
    const msg = { EXPIRED: ['timer_off', 'Batas waktu pembayaran habis', 'Kursi sudah dilepas. Pesan ulang bila kursi masih tersedia.'], CANCELLED: ['cancel', 'Pesanan dibatalkan', 'Kursi sudah dilepas.'], REFUNDED: ['currency_exchange', 'Pesanan di-refund', (o.refundReason ? o.refundReason.replace(/\.?\s*$/, '. ') : '') + 'E-ticket tidak berlaku lagi.'], PENDING: ['timer_off', 'Batas waktu pembayaran habis', 'Kursi dilepas.'] }[o.status];
    return head + `<div class="card p-6 text-center mb-4">${ic(msg[0], 'text-[40px] text-on-surface-variant')}<h2 class="font-headline-sm text-headline-sm mt-2">${msg[1]}</h2><p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${esc(msg[2])}</p><a href="/pengunjung/e/${e.id}" class="btn mt-4">Lihat acara</a></div>` + summary;
  };
  function payView(o) {
    const M = [['QRIS', 'qr_code_2', 'QRIS (semua bank & e-wallet)'], ['VA BCA', 'account_balance', 'Virtual Account BCA'], ['VA Mandiri', 'account_balance', 'Virtual Account Mandiri'], ['GoPay', 'account_balance_wallet', 'GoPay'], ['OVO', 'account_balance_wallet', 'OVO'], ['DANA', 'account_balance_wallet', 'DANA'], ['Kartu Kredit', 'credit_card', 'Kartu kredit/debit']];
    const va = '8808' + String(Math.abs(o.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 1e10).padStart(10, '0');
    const instr = payMethod === 'QRIS' ? `<div class="flex flex-col items-center gap-2"><div class="paper p-2 rounded-lg">${E.qrSvg('SANDBOX-QRIS|' + o.id + '|' + o.total, 170)}</div><span class="font-label-sm text-label-sm text-amber-300">QR sandbox, tidak bisa dibayar sungguhan</span></div>`
      : payMethod.startsWith('VA') ? `<div class="inner p-3"><div class="lbl">Nomor virtual account (sandbox)</div><div class="font-headline-md text-headline-md">${va}</div><div class="font-label-sm text-label-sm text-on-surface-variant">Transfer tepat ${rp(o.total)} melalui m-banking/ATM.</div></div>`
      : payMethod === 'Kartu Kredit' ? `<div class="inner p-3 font-body-sm text-body-sm text-on-surface-variant">Di versi produksi, pengunjung diarahkan ke halaman 3-D Secure milik gerbang pembayaran. Prototipe ini <b class="text-on-surface">tidak meminta data kartu apa pun</b>.</div>`
      : `<div class="inner p-3 font-body-sm text-body-sm text-on-surface-variant">Notifikasi pembayaran dikirim ke aplikasi ${payMethod} pada nomor ${esc(o.phone)} (simulasi).</div>`;
    return `<section class="card p-4 mb-4"><div class="flex items-center justify-between"><h2 class="font-headline-sm text-headline-sm">Pembayaran</h2><span class="font-label-md text-label-md text-amber-300">${ic('timer', 'text-[16px] align-middle')} <span data-until="${o.until}">--:--</span></span></div>
      <p class="font-label-sm text-label-sm text-on-surface-variant mb-3">Selesaikan sebelum ${E.fmtTime(o.until)} WIB. Kursi tetap ditahan untuk pesanan ini sampai batas waktu.</p>
      <div class="grid grid-cols-1 gap-2 mb-3">${M.map(([k, i, l]) => `<label class="inner px-3 py-2.5 flex items-center gap-3 cursor-pointer ${payMethod === k ? 'ring-1 ring-primary-container' : ''}"><input type="radio" name="pm" value="${k}" ${payMethod === k ? 'checked' : ''}>${ic(i, 'text-primary text-[20px]')}<span class="font-body-sm text-body-sm">${l}</span></label>`).join('')}</div>
      ${instr}
      <div class="mt-4 inner p-3 font-label-sm text-label-sm text-on-surface-variant">${ic('science', 'text-[14px] align-middle')} Mode sandbox: tombol di bawah meniru balasan dari gerbang pembayaran.</div>
      <div class="flex flex-col gap-2 mt-3"><button class="btn-ok justify-center !py-3" id="pay-ok">${ic('check_circle')} Simulasikan pembayaran berhasil</button>
        <div class="grid grid-cols-2 gap-2"><button class="btn-ghost justify-center" id="pay-fail">${ic('block', 'text-[16px]')} Simulasikan gagal</button><button class="btn-ghost justify-center" id="cancel">${ic('close', 'text-[16px]')} Batalkan pesanan</button></div></div></section>`;
  }
  function ticketsView(o, e) {
    return `<div class="inner p-3 mb-4 flex items-center gap-2 font-body-sm text-body-sm text-emerald-300">${ic('mark_email_read', 'text-[18px]')} E-ticket juga dikirim ke ${esc(o.email)} & WhatsApp ${esc(o.phone)} (simulasi).</div>
      <div class="flex flex-col gap-4 mb-4">${o.tickets.map((tid, i) => { const t = E.s.tickets[tid]; const ty = E.typeById(e, t.type); return `<section class="card p-0 overflow-hidden">
        <div class="px-4 py-3 flex items-center justify-between" style="background:linear-gradient(90deg, ${ty.color}44, transparent)"><span class="font-label-lg text-label-lg">E-ticket ${i + 1}/${o.tickets.length}</span><span class="font-label-sm text-label-sm">${esc(ty.name)}</span></div>
        <div class="p-4 flex flex-col items-center gap-3"><div class="paper p-2 rounded-lg">${E.qrSvg(E.qrText(t), 200)}</div>
          <div class="font-label-md text-label-md text-on-surface-variant">${t.id}</div>
          <div class="grid grid-cols-2 gap-3 w-full font-body-sm text-body-sm"><div><div class="lbl">Pemegang</div>${esc(t.holder)}</div><div><div class="lbl">Kursi</div><b class="font-headline-sm text-headline-sm">${t.seat || 'Bebas (berdiri)'}</b></div><div><div class="lbl">Tanggal</div>${E.fmtShort(e.start)} · ${E.fmtTime(e.start)}</div><div><div class="lbl">Gate dibuka</div>${E.fmtTime(e.doors)} WIB</div></div>
          <div class="w-full text-center px-3 py-2 rounded-lg font-label-md text-label-md ${t.checkedInAt ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-on-surface-variant'}">${t.checkedInAt ? 'Sudah check-in ' + E.fmtTime(t.checkedInAt) + ' di ' + esc(t.gate) : 'Belum check-in. Tunjukkan QR ini di gate.'}</div></div></section>`; }).join('')}</div>
      <div class="grid grid-cols-2 gap-2 mb-4"><button class="btn-ghost justify-center" id="ics">${ic('event', 'text-[16px]')} Simpan ke kalender</button><button class="btn-ghost justify-center" id="resend">${ic('forward_to_inbox', 'text-[16px]')} Kirim ulang</button></div>`;
  }

  V.tiket = () => {
    const mine = E.myOrders().map((id) => E.s.orders[id]).filter(Boolean);
    return `<h1 class="font-headline-md text-headline-md mb-3">Tiket saya</h1>
      <div class="flex flex-col gap-3 mb-5">${mine.length ? mine.map((o) => { const e = E.ev(o.ev); return `<a href="/pengunjung/o/${o.id}" class="card p-4 block"><div class="flex items-start justify-between gap-2"><div><div class="font-label-lg text-label-lg">${esc(e.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${E.fmtShort(e.start)} · ${o.items.length} tiket · ${o.items.map((i) => i.seat || E.typeById(e, i.type).name).join(', ')}</div></div>${statusChip(o.status === 'PENDING' && o.until < E.now() ? 'EXPIRED' : o.status)}</div><div class="font-label-md text-label-md text-on-surface-variant mt-2">${o.id} · ${rp(o.total)}</div></a>`; }).join('') : `<div class="inner p-4 font-body-sm text-body-sm text-on-surface-variant">Belum ada pesanan di perangkat ini.</div>`}</div>
      <section class="card p-4"><h2 class="font-headline-sm text-headline-sm mb-2">Cari pesanan</h2><p class="font-label-sm text-label-sm text-on-surface-variant mb-3">Pesan dari perangkat lain? Masukkan kode booking dan email pemesan.</p>
        <form id="f-find" class="flex flex-col gap-2"><input class="inp" name="code" placeholder="BK-XXXXXX" required><input class="inp" name="email" type="email" placeholder="Email pemesan" required><button class="btn justify-center">${ic('search')} Cari</button></form></section>`;
  };

  V.inbox = () => {
    const mine = E.myOrders().map((id) => E.s.orders[id]).filter(Boolean);
    const to = new Set(mine.flatMap((o) => [o.email, o.phone]));
    const msgs = E.s.outbox.filter((m) => to.has(m.to)).slice(0, 60);
    return `<h1 class="font-headline-md text-headline-md">Kotak masuk</h1><p class="font-body-sm text-body-sm text-on-surface-variant mb-3">Simulasi email & WhatsApp untuk pesanan di perangkat ini. Tidak ada pesan yang benar-benar dikirim.</p>
      <div class="flex flex-col gap-2">${msgs.length ? msgs.map((m) => `<div class="card p-3 flex gap-3">${ic(m.ch === 'Email' ? 'mail' : 'chat', 'text-[20px] ' + (m.ch === 'Email' ? 'text-primary' : 'text-emerald-300'))}<div class="min-w-0"><div class="font-label-sm text-label-sm text-on-surface-variant">${m.ch} · ${esc(m.to)} · ${E.fmtDT(m.ts)}</div><div class="font-label-lg text-label-lg">${esc(m.subject)}</div><div class="font-body-sm text-body-sm text-on-surface-variant">${esc(m.body)}</div>${m.order && m.order.startsWith('BK-') ? `<a class="font-label-md text-label-md text-primary" href="/pengunjung/o/${m.order}">Buka ${m.order}</a>` : ''}</div></div>`).join('') : `<div class="inner p-4 font-body-sm text-body-sm text-on-surface-variant">Belum ada pesan.</div>`}</div>`;
  };
  const notFound = (m) => `<div class="card p-6 text-center">${ic('search_off', 'text-[40px] text-on-surface-variant')}<p class="mt-2">${esc(m || 'Halaman tidak ditemukan.')}</p><a class="btn mt-4" href="/pengunjung">Ke daftar acara</a></div>`;

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
    return { name: 'home', args: [] };
  }
  // Hero carousel: titik mengikuti posisi geser, klik titik melompat, geser otomatis tiap 6 dtk
  // (berhenti saat disentuh/diarahkan kursor, tab tersembunyi, atau kurangi gerakan).
  let heroHold = false;
  function heroGo(i, smooth) {
    const tr = app.querySelector('.pv-hero-track'); if (!tr) return;
    const n = tr.children.length; heroIdx = ((i % n) + n) % n;
    tr.scrollTo({ left: tr.children[heroIdx].offsetLeft - tr.firstElementChild.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
    app.querySelectorAll('[data-hero-dot]').forEach((d) => d.classList.toggle('on', +d.dataset.heroDot === heroIdx));
  }
  function bindHero() {
    const tr = app.querySelector('.pv-hero-track'); if (!tr) return;
    let t = null;
    tr.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => { const w = tr.children[0].offsetWidth || 1; const i = Math.round(tr.scrollLeft / w); if (i !== heroIdx) { heroIdx = i; app.querySelectorAll('[data-hero-dot]').forEach((d) => d.classList.toggle('on', +d.dataset.heroDot === i)); } }, 80); }, { passive: true });
    const hero = tr.closest('.pv-hero');
    ['pointerenter', 'focusin', 'touchstart'].forEach((ev) => hero.addEventListener(ev, () => (heroHold = true), { passive: true }));
    ['pointerleave', 'focusout'].forEach((ev) => hero.addEventListener(ev, () => (heroHold = false)));
    app.querySelectorAll('[data-hero-dot]').forEach((d) => d.addEventListener('click', () => heroGo(+d.dataset.heroDot, true)));
  }
  if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    setInterval(() => { if (cur.name === 'home' && !document.hidden && !heroHold && app.querySelector('.pv-hero-track')) heroGo(heroIdx + 1, true); }, 6000);
  }
  function render(keepScroll) {
    const y = window.scrollY;
    const rails = {}; app.querySelectorAll('[data-rail]').forEach((r) => (rails[r.dataset.rail] = r.scrollLeft));
    app.innerHTML = E.modeBanner() + V[cur.name](...cur.args);
    document.body.classList.toggle('pv-wide', cur.name === 'home'); // beranda selebar desktop, langkah beli tetap sempit
    bind();
    tick();
    const nav = { home: 'home', event: 'home', cats: 'home', seats: 'home', data: 'home', order: 'tiket', tiket: 'tiket', inbox: 'inbox' }[cur.name];
    document.querySelectorAll('[data-nav]').forEach((a) => { a.classList.toggle('text-primary', a.dataset.nav === nav); a.classList.toggle('text-on-surface-variant', a.dataset.nav !== nav); });
    if (keepScroll) { window.scrollTo(0, y); app.querySelectorAll('[data-rail]').forEach((r) => { if (rails[r.dataset.rail]) r.scrollLeft = rails[r.dataset.rail]; }); }
    syncTabs();
    const sm = app.querySelector('.seatmap-wrap'); if (sm) sm.scrollLeft = keepScroll && render.sx != null ? render.sx : (sm.scrollWidth - sm.clientWidth) / 2;
  }
  function bind() {
    const id = cur.args[0];
    const sm = app.querySelector('.seatmap-wrap'); if (sm) sm.addEventListener('scroll', () => (render.sx = sm.scrollLeft));
    app.querySelectorAll('[data-seat]').forEach((b) => b.addEventListener('click', async () => {
      const st = b.dataset.st, seat = b.dataset.seat;
      if (st === 'available') { const r = await act(() => E.holdSeat(id, seat, cart)); if (r) toast(`Kursi <b>${seat}</b> ditahan untukmu.`, 'ok'); }
      else if (st === 'mine') await act(() => E.releaseSeat(id, seat, cart));
      else if (st === 'held') toast(`Kursi <b>${seat}</b> sedang dipesan pengunjung lain.`, 'err');
      else if (st === 'sold') toast(`Kursi <b>${seat}</b> sudah terjual.`, 'err');
      else toast(`Kursi <b>${seat}</b> tidak dijual.`, 'err');
    }));
    app.querySelectorAll('[data-qty]').forEach((b) => b.addEventListener('click', () => { const h = E.cartHolds(id, cart); const q = h.items.filter((i) => i.type === b.dataset.qty && !i.seat).length; act(() => E.setQty(id, b.dataset.qty, Math.max(0, q + +b.dataset.d), cart)); }));
    const clr = app.querySelector('#clear'); if (clr) clr.addEventListener('click', () => act(() => E.releaseCart(id, cart), 'Semua kursi dilepas.'));
    app.querySelectorAll('[data-wl]').forEach((b) => b.addEventListener('click', () => {
      const r = modal('Daftar tunggu ' + esc(E.typeById(E.ev(id), b.dataset.wl).name), `<form id="f-wl" class="flex flex-col gap-3"><p class="font-body-sm text-body-sm text-on-surface-variant">Kami kabari bila ada kursi yang tersedia lagi karena refund atau pesanan kedaluwarsa.</p><label class="f">Nama<input class="inp" name="name" required></label><label class="f">Email atau WhatsApp<input class="inp" name="contact" required></label><label class="f">Jumlah tiket<input class="inp" name="qty" type="number" min="1" max="4" value="1"></label><button class="btn justify-center">Gabung daftar tunggu</button></form>`);
      r.querySelector('#f-wl').addEventListener('submit', async (ev) => { ev.preventDefault(); const f = Object.fromEntries(new FormData(ev.target)); if (await act(() => E.joinWaitlist(id, b.dataset.wl, { name: f.name, contact: f.contact, qty: +f.qty }))) { closeModal(); toast('Kamu masuk daftar tunggu.', 'ok'); } });
      return r;
    }));
    const fo = app.querySelector('#f-order');
    if (fo) {
      fo.addEventListener('input', () => { const f = Object.fromEntries(new FormData(fo)); sessionStorage.setItem('smicc-evt-form', JSON.stringify({ name: f.name, email: f.email, phone: f.phone })); });
      fo.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const f = Object.fromEntries(new FormData(fo));
        const holders = Object.keys(f).filter((k) => k.startsWith('holder')).map((k) => f[k].trim());
        const oid = await act(() => E.createOrder(id, cart, { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), holders }));
        if (oid) { E.rememberOrder(oid); Router.go('/o/' + oid); }
      });
    }
    app.querySelectorAll('input[name=pm]').forEach((r) => r.addEventListener('change', () => { payMethod = r.value; render(true); }));
    const ok = app.querySelector('#pay-ok'); if (ok) ok.addEventListener('click', async () => { const r = await act(() => E.pay(id, payMethod, true)); if (r) { toast('Pembayaran berhasil. E-ticket terbit.', 'ok'); window.scrollTo(0, 0); } });
    const bad = app.querySelector('#pay-fail'); if (bad) bad.addEventListener('click', async () => { const r = await act(() => E.pay(id, payMethod, false)); if (r === 'FAILED') toast('Pembayaran ditolak (simulasi). Kursi tetap ditahan sampai batas waktu. Coba metode lain.', 'err'); });
    const cc = app.querySelector('#cancel'); if (cc) cc.addEventListener('click', () => { if (confirm('Batalkan pesanan dan lepas kursi?')) act(() => E.cancel(id), 'Pesanan dibatalkan, kursi dilepas.'); });
    const rs = app.querySelector('#resend'); if (rs) rs.addEventListener('click', () => act(() => E.resend(id), 'E-ticket dikirim ulang ke email & WhatsApp (simulasi).'));
    const ics = app.querySelector('#ics'); if (ics) ics.addEventListener('click', () => downloadIcs(E.s.orders[id]));
    // Beranda: filter kategori/area membuka hasil; tombol Beranda mengosongkan semua filter.
    const showResults = () => { render(); window.scrollTo(0, 0); };
    app.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { catF = b.dataset.cat || null; showResults(); }));
    app.querySelectorAll('[data-area]').forEach((b) => b.addEventListener('click', () => { areaF = b.dataset.area || null; showResults(); }));
    app.querySelectorAll('[data-reset]').forEach((b) => b.addEventListener('click', () => { catF = null; areaF = null; query = ''; qIn.value = ''; roll.sync(); showResults(); }));
    app.querySelectorAll('[data-week]').forEach((b) => b.addEventListener('click', () => { weekTab = b.dataset.week; render(true); }));
    const cr = app.querySelector('[data-creator]');
    if (cr) cr.addEventListener('click', () => modal('Hubungi tim event mal', `<p class="font-body-sm text-body-sm text-on-surface-variant">Contoh kontak untuk prototipe. Ganti dengan kontak tim event Summarecon Mall Bandung.</p>
      <ul class="mt-3 flex flex-col gap-2 font-body-sm text-body-sm"><li>${ic('support_agent', 'text-primary text-[18px] align-middle')} Customer Service, GF dekat lobi utama</li><li>${ic('schedule', 'text-primary text-[18px] align-middle')} Setiap hari ${MALL.hours}</li><li>${ic('description', 'text-primary text-[18px] align-middle')} Siapkan: jenis acara, perkiraan pengunjung, tanggal, dan area yang diinginkan</li></ul>`));
    bindHero();
    const mq = app.querySelector('[data-marquee]');
    if (mq) mq.addEventListener('click', () => {
      const box = app.querySelector('.pv-marquee'); const paused = box.classList.toggle('paused');
      mq.setAttribute('aria-pressed', String(paused)); mq.innerHTML = ic(paused ? 'play_arrow' : 'pause', 'text-[18px]') + (paused ? ' Putar' : ' Jeda');
    });
    app.querySelectorAll('[data-jump]').forEach((b) => b.addEventListener('click', () => { const sec = document.getElementById('sec-' + b.dataset.jump); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    const sh = app.querySelector('#share');
    if (sh) sh.addEventListener('click', async () => {
      const url = location.href;
      try {
        if (navigator.share) { await navigator.share({ title: E.ev(id).name, url }); return; }
        await navigator.clipboard.writeText(url); toast('Tautan acara disalin.', 'ok');
      } catch (err) { if (err && err.name !== 'AbortError') toast('Salin tautan ini: ' + esc(url), 'info'); }
    });
    const ff = app.querySelector('#f-find');
    if (ff) ff.addEventListener('submit', (ev) => { ev.preventDefault(); const f = Object.fromEntries(new FormData(ff)); const o = E.s.orders[f.code.trim().toUpperCase()]; if (o && o.email.toLowerCase() === f.email.trim().toLowerCase()) { E.rememberOrder(o.id); Router.go('/o/' + o.id); } else toast('Kode booking atau email tidak cocok.', 'err'); });
  }
  function downloadIcs(o) {
    const e = E.ev(o.ev); const f = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Summarecon Mall//Event Tiket//ID', 'BEGIN:VEVENT', 'UID:' + o.id + '@summarecon-mall.local', 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(e.start), 'DTEND:' + f(e.start + 3 * 3600000), 'SUMMARY:' + e.name, 'LOCATION:' + e.venue, 'DESCRIPTION:Kode booking ' + o.id + ', gate dibuka ' + E.fmtTime(e.doors), 'BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY', 'DESCRIPTION:Pengingat acara', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = o.id + '.ics'; a.click();
  }
  function tick() {
    let expired = false;
    document.querySelectorAll('[data-until]').forEach((el) => { const rem = +el.dataset.until - E.now(); el.textContent = rem > 0 ? E.mmss(rem) : 'habis'; if (rem <= 0 && el.dataset.until !== 'null') expired = true; });
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
    const STEP_MS = 2200, native = input.placeholder;
    const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    let words = [], i = 0, timer = null;
    const pos = (k) => { const n = words.length, d = (k - i + n) % n; return d === 0 ? [0, 1] : reduce ? [0, 0] : d === n - 1 ? [-100, 0] : [100, 0]; };
    const place = () => [...win.children].forEach((el, k) => { const [y, o] = pos(k); el.style.transform = `translateY(${y}%)`; el.style.opacity = o; });
    const sync = () => { const show = words.length > 0 && !input.value; ph.hidden = !show; input.placeholder = show ? '' : native; };
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
  const searchWords = () => {
    const evs = E.s.order.map(E.ev).filter((e) => e && e.status !== 'DRAFT' && E.saleState(e).open).sort((a, b) => a.start - b.start);
    const cats = [...new Set(evs.map((e) => e.cat.toLowerCase()))];
    return evs.map((e) => e.name).slice(0, 4).concat(cats).slice(0, 6);
  };

  E.init().then(() => {
    roll.start(searchWords());
    document.getElementById('mode').innerHTML = E.mode === 'server' ? '<span class="text-emerald-300">●</span> LAN' : '<span class="text-amber-300">●</span> Lokal';
    document.getElementById('mode').title = E.mode === 'server' ? 'Terhubung ke server.js. Kursi tersinkron ke semua perangkat di jaringan lokal.' : 'Tanpa server: data hanya di browser ini (sinkron antar-tab)';
    cur = parse(); render();
    E.subscribe(rerender);
    setInterval(() => { if (tick()) rerender(); }, 1000);
  });
})();

// Esc menutup modal portal pengunjung
document.addEventListener('keydown', (e) => { const r = document.getElementById('modal-root'); if (e.key === 'Escape' && r && r.innerHTML) r.innerHTML = ''; });
