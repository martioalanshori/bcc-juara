/* DB-EVT Event Ticketing — modul dua peran (Bandung Build Challenge 2026):
 *  - ROLE 'pengelola' (/pengelola): panitia/EO. Tambah/hapus/batalkan acara, jenis tiket, harga, kuota,
 *    denah & periode jual, peserta & pembayaran, refund, check-in QR, pengingat, daftar tunggu, lapor ke Command Center.
 *  - ROLE 'mall' (Command Center, /command-center/event): manajemen mall 360. Hanya memantau: portofolio semua acara,
 *    dampak ke parkir/crowd/BMS/tenant, keamanan gate → tiket insiden (SOP-EVT-03). Tidak dapat mengubah data acara. */
(function () {
  window.Views = window.Views || {};
  const { esc, icon, num } = UI;
  let ROLE = 'mall'; const isMgr = () => ROLE === 'pengelola';
  // Pengelola: sidebar (Semua acara + menu per acara), URL /pengelola/acara & /pengelola/e/<id>/<menu>.
  // Command Center: baris tab read-only seperti sebelumnya.
  // [tab, label, ikon, segmen URL] untuk tampilan lintas acara (pemilih acara = "Semua acara")
  const GTABS_ = [['gdash', 'Dasbor', 'space_dashboard', 'dasbor'], ['acara', 'Daftar acara', 'event_note', 'acara'], ['gtrx', 'Transaksi', 'receipt_long', 'transaksi'], ['gck', 'Check-in & gate', 'qr_code_scanner', 'kehadiran'], ['gfin', 'Keuangan', 'account_balance', 'keuangan']];
  const TABS = {
    pengelola: GTABS_.map((x) => x.slice(0, 3)).concat([['ringkasan', 'Ringkasan', 'monitoring'], ['pengaturan', 'Pengaturan', 'tune'], ['persetujuan', 'Persetujuan', 'approval'], ['kursi', 'Denah kursi', 'event_seat'], ['peserta', 'Peserta & transaksi', 'groups'], ['checkin', 'Check-in & gate', 'qr_code_scanner'], ['komunikasi', 'Kirim broadcast', 'campaign'], ['keuangan', 'Keuangan & ROI', 'account_balance']]),
    mall: [['portofolio', 'Portofolio event', 'travel_explore'], ['ringkasan', 'Detail acara', 'monitoring'], ['kursi', 'Denah langsung', 'event_seat'], ['gate', 'Gate & keamanan', 'shield_person'], ['peserta', 'Transaksi', 'receipt_long'], ['keuangan', 'Keuangan & ROI', 'account_balance']],
  };
  const GLOBAL_TABS = ['acara', 'portofolio']; // tab lintas acara (tanpa pemilih acara)
  const GTABS = GTABS_, ETABS = TABS.pengelola.slice(GTABS_.length); // menu lintas acara & menu per acara
  const isG = (tab) => GTABS.some((x) => x[0] === tab);
  const ui = { ev: 'EVT-01', tab: null, seatMode: 'info', seatSel: null, q: '', st: 'ALL', gate: null, ch: 'ALL', aq: '', ast: 'ALL', gq: '', gst: 'ALL' };
  let unsub = null, host = null;
  const EV_ST = { DRAFT: ['Draft', 'bg-slate-500/20 text-slate-300'], PUBLISHED: ['Dipublikasikan', 'bg-emerald-500/15 text-emerald-300'], CLOSED: ['Penjualan ditutup', 'bg-amber-500/15 text-amber-300'], CANCELLED: ['Dibatalkan', 'bg-rose-500/15 text-rose-300'] };
  const evChip = (e) => UI.chip(EV_ST[e.status][0], EV_ST[e.status][1]);
  const O_ST = { PENDING: ['Menunggu bayar', 'bg-amber-500/15 text-amber-300'], PAID: ['Lunas', 'bg-emerald-500/15 text-emerald-300'], EXPIRED: ['Kedaluwarsa', 'bg-slate-500/20 text-slate-300'], CANCELLED: ['Batal', 'bg-slate-500/20 text-slate-300'], REFUNDED: ['Refund', 'bg-rose-500/15 text-rose-300'] };
  const oChip = (o) => { const st = o.status === 'PENDING' && o.until < Evt.now() ? 'EXPIRED' : o.status; return UI.chip(O_ST[st][0], O_ST[st][1]); };
  const rp = (n) => Evt.rp(n);
  const rpJt = (n) => 'Rp ' + (n >= 1e6 ? (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) : n.toLocaleString('id-ID')); // KPI: 0 tampil 'Rp 0', bukan 'Gratis'
  const dtl = (ms) => { const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
  // Kategori acara: daftar baku + kategori yang sudah dipakai acara lain (pilihan dropdown).
  const CATS = ['Konser', 'Komedi', 'Teater', 'Pameran', 'Kuliner', 'Bazar', 'Anak', 'Keluarga', 'Olahraga', 'Esports', 'Workshop', 'Seminar', 'Teknologi', 'Umum'];
  const catOptions = (sel) => { const all = Array.from(new Set(CATS.concat(Evt.s.order.map((id) => Evt.ev(id).cat).filter(Boolean)))).sort((a, b) => (a === 'Umum') - (b === 'Umum') || a.localeCompare(b, 'id')); if (sel && !all.includes(sel)) all.unshift(sel); return all.map((c) => `<option ${c === sel ? 'selected' : ''}>${esc(c)}</option>`).join(''); };
  // Palet konsol: kategori tiket memakai tingkat biru primer, bukan warna masing-masing kategori.
  const PAL = ['rgb(var(--primary))', 'rgb(var(--primary) / .62)', 'rgb(var(--primary) / .36)', 'rgb(var(--on-surface) / .55)', 'rgb(var(--on-surface) / .3)'];
  const PAL_PDF = ['#2F6FDB', '#6E9BEA', '#A9C4F3', '#5B6577', '#9AA3B2'];
  const tcIdx = (e, ty) => Math.max(0, e.types.indexOf(ty)) % PAL.length;
  const tc = (e, ty) => (isMgr() && ty ? PAL[tcIdx(e, ty)] : ty && ty.color);
  const recolor = (e, html) => (isMgr() ? e.types.reduce((h, ty) => h.split(ty.color).join(tc(e, ty)), html) : html);
  const money = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID'); // uang: 0 ditulis 'Rp 0' ("Gratis" hanya untuk harga tiket)
  const redraw = () => draw(host);
  async function act(p, ok) { try { if (isMgr()) Evt.setActor(actorOf()); // pelaku di log aktivitas
     const r = await p(); if (ok) UI.toast(ok, 'P4'); return r; } catch (e) { UI.toast(esc(e.message), 'P2'); return null; } }

  // ------------------------------------------------------------------ konsol pengelola: rute, kesiapan, "perlu tindakan"
  const SLUG = { kursi: 'denah' }; // tab -> segmen URL
  const tabLabel = (k) => (TABS.pengelola.find((x) => x[0] === k) || [k, k])[1];
  const evUrl = (id, tab) => { const g = GTABS.find((x) => x[0] === tab); return g || !id ? '/' + (g ? g[3] : 'dasbor') : '/e/' + encodeURIComponent(id) + '/' + (SLUG[tab] || tab); };
  const href = (id, tab) => Router.href(evUrl(id, tab));
  function goTab(tab, ev) {
    EvtCheckin.stopCam();
    if (ev && ev !== ui.ev) { ui.ev = ev; ui.seatSel = null; }
    if (isMgr() && window.Router) return Router.go(evUrl(ui.ev, tab));
    ui.tab = tab; redraw();
  }
  function fromUrl() {
    const seg = Router.path().split('/').filter(Boolean);
    ui.tab = 'gdash';
    if (seg[0] === 'e' && seg[1]) {
      const id = decodeURIComponent(seg[1]), sub = seg[2] === 'denah' ? 'kursi' : seg[2] || 'ringkasan';
      if (seen(Evt.ev(id))) { if (id !== ui.ev) ui.seatSel = null; ui.ev = id; ui.tab = ETABS.some((x) => x[0] === sub) ? sub : 'ringkasan'; }
      else UI.toast('Acara ' + esc(id) + ' tidak ditemukan atau sudah dihapus', 'P3');
    } else if (seg[0]) { const g = GTABS.find((x) => x[3] === seg[0]); if (g) ui.tab = g[0]; }
  }
  // Plat lantai dari venue: "…, GF" -> GF, "…, 2F" / "…, Lt. 2" -> L2, Parkir Barat (luar gedung) -> P.
  const plateOf = (e) => { const v = e.venue || '', m = /,\s*(GF|(\d)F|Lt\.\s*(\d+))/.exec(v); return m ? (m[2] || m[3] ? 'L' + (m[2] || m[3]) : 'GF') : /luar gedung/.test(v) ? 'P' : '–'; };
  const plate = (e) => `<span class="pg-plate" title="Lantai">${plateOf(e)}</span>`;
  const place = (e) => esc((e.venue || '').split(',')[0].trim());
  const liveOrders = (e) => { const t = Evt.now(); return Evt.stats(e.id).orders.filter((o) => o.status === 'PAID' || (o.status === 'PENDING' && o.until > t)).length; };
  const isHariH = (e) => { const t = Evt.now(); return e.status !== 'CANCELLED' && e.status !== 'DRAFT' && t > e.doors - 2 * 3600000 && t < e.start + 6 * 3600000; };
  // Fase untuk saringan Semua acara.
  function phase(e) {
    if (e.status === 'CANCELLED') return 'CANCELLED';
    if (e.status === 'DRAFT') return 'DRAFT';
    if (Evt.now() > e.start + 6 * 3600000) return 'DONE';
    return e.status === 'CLOSED' ? 'CLOSED' : 'PUBLISHED';
  }
  // Daftar periksa sebelum dipublikasikan (warn = disarankan, tidak memblokir).
  function readiness(e) {
    const t = Evt.now(), per = Evt.stats(e.id).per;
    return [
      { label: 'Jadwal', ok: e.doors < e.start && e.start > t, hint: 'Gate dibuka sebelum acara mulai, acara belum lewat' },
      { label: 'Periode jual', ok: e.saleStart < e.saleEnd && e.saleEnd <= e.start, hint: 'Dibuka sebelum ditutup, ditutup paling lambat saat acara mulai' },
      { label: 'Tiket', ok: e.types.some((ty) => ty.onSale && ty.price >= 0 && per[ty.id] && per[ty.id].total - per[ty.id].blocked > 0), hint: 'Minimal satu jenis tiket dijual dengan kuota' },
      { label: 'Gate', ok: e.gates.length > 0, hint: 'Minimal satu gate check-in' },
      { label: 'Deskripsi & foto', ok: !!(e.desc && e.img), warn: true, hint: 'Disarankan agar acara menarik di portal' },
    ];
  }
  // Satu sumber untuk blok "Perlu tindakan" dan badge sidebar. n = angka badge, sev crit = merah.
  function attention(e) {
    const t = Evt.now(), out = [];
    EvtCheckin.anomalies(e.id).forEach((a) => out.push({ sev: 'crit', tab: 'checkin', focus: 'ck-anom', n: 1, text: `${a.n} pindaian gagal atau duplikat di ${a.gate} (ambang 3 dalam 10 menit)`, btn: 'Lihat gate' }));
    const rep = Evt.s.reports.filter((r) => r.ev === e.id && !r.ticketId).length;
    if (rep) out.push({ sev: 'warn', tab: 'checkin', focus: 'ck-anom', n: rep, text: rep + ' laporan gate menunggu tindak lanjut Command Center', btn: 'Lihat laporan' });
    const pend = Evt.stats(e.id).orders.filter((o) => o.status === 'PENDING' && o.until > t);
    if (pend.length) out.push({ sev: 'info', tab: 'peserta', st: 'PENDING', n: pend.length, text: `${pend.length} pesanan menunggu bayar, batas terdekat ${Evt.fmtTime(Math.min(...pend.map((o) => o.until)))} WIB`, btn: 'Lihat pesanan' });
    const mm = Evt.finance(e.id).mismatches.length;
    if (mm) out.push({ sev: 'crit', tab: 'keuangan', n: mm, text: 'Selisih rekonsiliasi pada ' + mm + ' pesanan', btn: 'Periksa' });
    const wl = Evt.s.waitlist.filter((w) => w.ev === e.id && !w.notified).length;
    if (wl && e.status === 'PUBLISHED') out.push({ sev: 'info', tab: 'komunikasi', n: wl, text: wl + ' orang di daftar tunggu belum dikabari', btn: 'Kabari' });
    if (e.status === 'DRAFT') {
      const miss = readiness(e).filter((x) => !x.ok && !x.warn);
      if (miss.length) out.push({ sev: 'warn', tab: 'pengaturan', n: miss.length, text: 'Draft belum siap: ' + miss.map((x) => x.label.toLowerCase()).join(', '), btn: 'Lengkapi' });
      if (Evt.needsApproval(e)) out.push(apAttn(e));
      else if (!miss.length) out.push({ sev: 'info', tab: 'ringkasan', n: 0, text: 'Draft sudah lengkap dan disetujui, siap dipublikasikan', btn: 'Publikasikan', publish: true });
    }
    return out;
  }
  // ---- persetujuan acara: status singkat untuk "Perlu tindakan", daftar acara, dan header
  const waitMs = (e) => { const c = Evt.currentStep(e); return c ? Evt.now() - e.approval.steps[c.id].since : 0; };
  const revNote = (e) => { const r = Evt.APPROVERS.map((a) => e.approval.steps[a.id]).find((x) => x && x.st === 'REVISI'); return r && r.note ? r.note : ''; };
  function apNext(e) {
    const ap = e.approval;
    if (ap.st === 'DRAFT') { const m = Evt.missingDocs(e); return m.length ? 'unggah ' + m.length + ' dokumen wajib lalu ajukan persetujuan' : 'ajukan persetujuan ke Divisi Event'; }
    if (ap.st === 'REVISI') return 'perbaiki sesuai catatan revisi lalu ajukan ulang';
    if (ap.st === 'DIAJUKAN') return 'menunggu ' + Evt.currentStep(e).name + ' sejak ' + Evt.durTxt(waitMs(e)) + ' lalu';
    return 'disetujui, siap dipublikasikan';
  }
  function apAttn(e) {
    const ap = e.approval;
    if (ap.st === 'REVISI') return { sev: 'warn', tab: 'persetujuan', n: 1, text: 'Diminta revisi' + (revNote(e) ? ': ' + revNote(e) : ''), btn: 'Lihat catatan' };
    if (ap.st === 'DIAJUKAN') { const w = waitMs(e), slow = w > EvtApproval.SLOW_MS; return { sev: slow ? 'warn' : 'info', tab: 'persetujuan', n: 1, text: 'Menunggu persetujuan ' + Evt.currentStep(e).name + ' sejak ' + Evt.durTxt(w) + (slow ? ', lewat dari 2 hari' : ''), btn: 'Lihat persetujuan' }; }
    const t = apNext(e); return { sev: 'info', tab: 'persetujuan', n: 1, text: t[0].toUpperCase() + t.slice(1), btn: 'Ajukan' };
  }
  function badges(e) {
    const a = attention(e), b = { ringkasan: [a.length, a.some((x) => x.sev === 'crit')] };
    a.forEach((x) => { if (x.tab === 'ringkasan') return; const c = b[x.tab] || [0, false]; b[x.tab] = [c[0] + x.n, c[1] || x.sev === 'crit']; });
    return b;
  }
  const cnt = (v) => (v && v[0] ? `<span class="pg-cnt${v[1] ? ' red' : ''}">${v[0] > 99 ? '99+' : v[0]}</span>` : '');

  // ------------------------------------------------------------------ sidebar, bar bawah ponsel, header acara
  let acct = null; // akun yang login (dari /api/auth/me)
  // Akun konsol: 'tenant' (penyelenggara eksternal, hanya acara org-nya) atau 'pengelola' (Tim Event Mall, semua acara).
  // null = belum diketahui atau mode lokal tanpa server (diperlakukan sebagai Tim Event Mall).
  let acctRole = null, meInfo = null; // meInfo = /api/auth/me (mode demo, daftar akun demo)
  const who = () => (ROLE === 'mall' ? 'mall' : acctRole || 'pengelola');
  const seen = (e) => !!e && (who() !== 'tenant' || !acct || e.org === acct.org);
  const visEvs = () => Evt.s.order.map(Evt.ev).filter(seen); // acara yang boleh dilihat akun ini
  const can = (a) => who() !== 'tenant' || !['refund', 'reset', 'demo'].includes(a); // hak yang tidak dimiliki tenant
  const actorOf = () => { const pf = profile(); return { name: pf.name, role: who() === 'tenant' ? 'Tenant/EO' : 'Tim Event Mall', org: (acct && acct.org) || null }; };
  // Profil tampilan (nama, jabatan, WhatsApp) disimpan di browser ini; email & password akun diatur di server/config.js.
  const PROF_KEY = 'smicc-pengelola-profil';
  const loadProf = () => { try { return JSON.parse(localStorage.getItem(PROF_KEY)) || {}; } catch (err) { return {}; } };
  const profile = () => { const p = loadProf(); return { name: p.name || (acct && acct.name) || 'Pengelola acara', title: p.title || 'Pengelola acara', phone: p.phone || '', email: acct ? acct.email : '' }; };
  const initialsOf = (n) => String(n).split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'EO';
  function renderProfile() {
    const p = profile(), $ = (id) => document.getElementById(id);
    if (!$('pg-prof-btn')) return;
    $('pg-av').textContent = initialsOf(p.name); $('pg-prof-name').textContent = p.name;
    $('pg-prof-n2').textContent = p.name; $('pg-prof-sub').textContent = p.email ? p.title + ', ' + p.email : p.title + ' (mode lokal)';
    $('pg-prof-btn').setAttribute('aria-label', 'Menu profil ' + p.name);
    const ch = $('pg-id-chip');
    if (ch && acct) { const t = who() === 'tenant'; ch.hidden = false; ch.className = 'id-chip ' + (t ? 'tenant' : 'mall'); ch.innerHTML = icon(t ? 'storefront' : 'admin_panel_settings', 'text-[18px]') + '<span><b>' + (t ? 'Tenant/EO' : 'Tim Event Mall') + '</b>' + (t ? ' · ' + esc(acct.org) : '') + '</span>'; }
  }
  function profMenu(open) {
    const m = document.getElementById('pg-prof-menu'), b = document.getElementById('pg-prof-btn'); if (!m) return;
    if (open === m.hidden) { m.hidden = !open; b.setAttribute('aria-expanded', String(!!open)); if (open) { const f = m.querySelector('button:not([hidden])'); if (f) f.focus(); } }
  }
  function editProfile() {
    profMenu(false);
    const p = profile();
    const root = UI.modal('Edit profil', `<form id="f-prof" class="flex flex-col gap-4" novalidate>
      <div class="flex items-center gap-3"><span class="pg-av pg-av-lg" id="prof-av">${esc(initialsOf(p.name))}</span><div class="min-w-0"><b class="block truncate">${esc(p.email || 'Mode lokal, belum masuk')}</b><span class="font-body-sm text-body-sm text-on-surface-variant">Email dan password diatur admin mal</span></div></div>
      <label class="f">Nama tampilan<input class="inp" name="name" value="${esc(p.name)}" maxlength="60" required autocomplete="name"></label>
      <label class="f">Jabatan<input class="inp" name="title" value="${esc(p.title)}" maxlength="60" placeholder="Misalnya koordinator acara"></label>
      <label class="f">Nomor WhatsApp<input class="inp" name="phone" value="${esc(p.phone)}" inputmode="tel" maxlength="20" placeholder="0812xxxxxxxx" autocomplete="tel"></label>
      <p class="font-body-sm text-body-sm text-on-surface-variant">Profil ini hanya tersimpan di browser ini.</p>
      <p class="cf-err" role="alert" hidden></p>
      <div class="cf-actions"><button type="button" class="btn-ghost" data-close>Batal</button><button class="btn">Simpan profil</button></div></form>`, { small: true });
    const f = root.querySelector('#f-prof'), err = f.querySelector('.cf-err');
    f.name.addEventListener('input', () => (root.querySelector('#prof-av').textContent = initialsOf(f.name.value)));
    f.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const v = { name: f.name.value.trim(), title: f.title.value.trim(), phone: f.phone.value.trim() };
      if (!v.name) { err.hidden = false; err.textContent = 'Isi nama tampilan.'; return f.name.focus(); }
      if (v.phone && !/^\+?[0-9 -]{8,20}$/.test(v.phone)) { err.hidden = false; err.textContent = 'Nomor WhatsApp hanya boleh angka, spasi, atau tanda +.'; return f.phone.focus(); }
      try { localStorage.setItem(PROF_KEY, JSON.stringify(v)); } catch (e2) { err.hidden = false; err.textContent = 'Browser ini tidak mengizinkan penyimpanan. Profil tidak tersimpan.'; return; }
      UI.closeModal(); renderProfile(); UI.toast('Profil disimpan', 'P4');
    });
    f.name.focus();
  }
  const EV_TXT = { DRAFT: 'Draft', PUBLISHED: 'Dijual', CLOSED: 'Ditutup', CANCELLED: 'Dibatalkan', DONE: 'Selesai' };
  // Label status untuk pemilih acara, palet & laporan: Dijual hanya bila periode jual sedang berjalan.
  const phaseTxt = (e) => { const ph = phase(e); if (ph !== 'PUBLISHED') return EV_TXT[ph]; const t = Evt.now(); return t < e.saleStart ? 'Belum dijual' : t > e.saleEnd ? 'Penjualan berakhir' : 'Dijual'; };
  function sideHtml() {
    const all = isG(ui.tab), e = all ? null : Evt.ev(ui.ev), b = all ? gBadges() : e ? badges(e) : {};
    const item = (tab, label, ic, badge) => `<a href="${href(ui.ev, tab)}" class="pg-nav-item${ui.tab === tab ? ' on' : ''}"${ui.tab === tab ? ' aria-current="page"' : ''} title="${esc(label)}">${icon(ic, 'text-[20px]')}<span class="pg-lbl">${esc(label)}</span>${badge || ''}</a>`;
    return `<div class="pg-brand"><a href="${Router.href('/dasbor')}" class="pg-brand-link" title="Konsol Pengelola Acara"><span class="pg-brand-ic">${icon('event_available', 'text-[18px]')}</span><span class="pg-lbl flex flex-col leading-tight min-w-0"><b>Konsol Pengelola</b><small>Summarecon Mall Bandung</small></span></a>
        <button type="button" class="pg-collapse" data-collapse aria-label="Ciutkan sidebar" title="Ciutkan atau lebarkan sidebar">${icon('left_panel_close', 'text-[20px]')}</button>
        <button type="button" class="pg-close" data-drawer-close aria-label="Tutup menu">${icon('close', 'text-[20px]')}</button></div>
      <nav class="pg-nav" aria-label="Navigasi konsol">
        ${(all ? GTABS : e ? ETABS : []).map(([k, l, i]) => item(k, l, i, cnt(b[k]))).join('')}
      </nav>
      <div class="pg-side-foot">
        ${e && e.status !== 'DRAFT' ? `<a href="/pengunjung/e/${encodeURIComponent(e.id)}" target="_blank" rel="noopener" class="pg-nav-item" title="Lihat di portal pengunjung">${icon('open_in_new', 'text-[20px]')}<span class="pg-lbl">Lihat di portal pengunjung</span></a>` : ''}
        <a href="/checkin" target="_blank" rel="noopener" class="pg-nav-item" title="Pemindai gate di ponsel">${icon('qr_code_scanner', 'text-[20px]')}<span class="pg-lbl">Pemindai gate</span></a>
      </div>`;
  }
  function bnavHtml() {
    const all = isG(ui.tab), e = Evt.ev(ui.ev), b = all ? gBadges() : e ? badges(e) : {};
    const it = (tab, label, ic) => `<a href="${href(ui.ev, tab)}" class="${ui.tab === tab ? 'on' : ''}"${ui.tab === tab ? ' aria-current="page"' : ''}>${icon(ic, 'text-[22px]')}<span>${label}</span>${b[tab] && b[tab][0] ? `<i class="${b[tab][1] ? 'red' : ''}"></i>` : ''}</a>`;
    const links = all ? it('gdash', 'Dasbor', 'space_dashboard') + it('acara', 'Acara', 'event_note') + it('gtrx', 'Transaksi', 'receipt_long')
      : it('gdash', 'Semua', 'apps') + it('ringkasan', 'Ringkasan', 'monitoring') + it('peserta', 'Peserta', 'groups');
    return links + it(all ? 'gck' : 'checkin', 'Check-in', 'qr_code_scanner') + `<button type="button" data-drawer-open>${icon('menu', 'text-[22px]')}<span>Lainnya</span></button>`;
  }
  const narrow = () => window.matchMedia('(max-width: 1023px)').matches;
  function drawer(open) {
    const side = document.getElementById('pg-side'), scrim = document.getElementById('pg-scrim'), btn = document.getElementById('pg-menu');
    if (!side) return;
    const was = document.body.classList.contains('pg-open');
    document.body.classList.toggle('pg-open', !!open);
    scrim.hidden = !open; btn.setAttribute('aria-expanded', String(!!open));
    side.inert = narrow() && !open;
    if (open && !was) { const f = side.querySelector('.pg-nav-item.on') || side.querySelector('a,button'); if (f) f.focus(); }
    if (!open && was) btn.focus();
  }
  let lastSide = '';
  function shell(force) {
    const side = document.getElementById('pg-side'); if (!side) return;
    const html = sideHtml();
    if (!force && html === lastSide) return; // badge tidak berubah: jangan ganggu fokus di sidebar
    lastSide = html;
    const keepScroll = side.scrollTop;
    side.innerHTML = html; side.scrollTop = keepScroll;
    side.inert = narrow() && !document.body.classList.contains('pg-open');
    document.getElementById('pg-bnav').innerHTML = bnavHtml();
    const e = Evt.ev(ui.ev), title = tabLabel(ui.tab), g = isG(ui.tab);
    document.getElementById('pg-title').textContent = title;
    document.getElementById('pg-crumb').textContent = g || !e ? 'Semua acara' : e.id + ' · ' + e.name;
    document.title = title + (!g && e ? ' · ' + e.name : ' · Semua acara') + ' · Konsol Pengelola';
    const pk = document.getElementById('pg-evpick'); if (pk) { const lbl = pickerLabel(); if (pk.innerHTML !== lbl) pk.innerHTML = lbl; }
    bindHeader();
    side.querySelector('[data-collapse]').addEventListener('click', () => {
      const mini = document.documentElement.classList.toggle('pg-mini');
      try { localStorage.setItem('smicc-pengelola-nav', mini ? 'mini' : 'open'); } catch (err) { /* tanpa storage */ }
    });
    side.querySelector('[data-drawer-close]').addEventListener('click', () => drawer(false));
    document.querySelectorAll('#pg-bnav [data-drawer-open]').forEach((x) => x.addEventListener('click', () => drawer(true)));
  }
  // ---- dropdown di header (pemilih acara, + Acara baru): menempel di bawah tombol, bukan modal, agar kursor tidak jauh.
  let dd = null; // dropdown yang sedang terbuka
  function dropdown(btn, html, onBind) {
    if (dd) { const same = dd.btn === btn; dd.close(); if (same) return null; }
    const wrap = btn.parentElement, el = document.createElement('div');
    el.className = 'pg-dd-panel'; el.innerHTML = html; wrap.appendChild(el); btn.setAttribute('aria-expanded', 'true');
    const onDoc = (ev) => { if (!wrap.contains(ev.target)) close(); };
    const onKey = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(); btn.focus(); } };
    function close() { el.remove(); btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey, true); if (dd && dd.el === el) dd = null; }
    setTimeout(() => document.addEventListener('mousedown', onDoc)); document.addEventListener('keydown', onKey, true);
    el.querySelectorAll('[data-dd-close]').forEach((b) => b.addEventListener('click', close));
    dd = { el, btn, close }; if (onBind) onBind(el, close); return dd;
  }
  let headerBound = false;
  function bindHeader() {
    if (headerBound) return; const pk = document.getElementById('pg-evpick'), nw = document.getElementById('pg-new');
    if (!pk || !nw) return; headerBound = true;
    pk.addEventListener('click', evPicker); nw.addEventListener('click', newEventPanel);
  }
  const pickerLabel = () => { const all = isG(ui.tab), e = all ? null : Evt.ev(ui.ev);
    return (e ? `${plate(e)}<span class="pg-evpick-t"><b>${esc(e.name)}</b><small>${e.id}, ${phaseTxt(e).toLowerCase()}</small></span>`
      : `<span class="pg-pick-all">${icon('apps', 'text-[18px]')}</span><span class="pg-evpick-t"><b>Semua acara</b><small>${visEvs().length} acara</small></span>`) + icon('expand_more', 'text-[20px] pg-evpick-ic'); };
  function evPicker() {
    const btn = document.getElementById('pg-evpick'); if (!btn) return; drawer(false);
    const rows = (q) => visEvs().filter((e) => !q || (e.name + ' ' + e.id + ' ' + e.cat).toLowerCase().includes(q)).map((e) => `<a href="${href(e.id, isG(ui.tab) ? 'ringkasan' : ui.tab)}" class="pg-pick-row${e.id === ui.ev && !isG(ui.tab) ? ' on' : ''}" data-pick-ev="${e.id}" style="--c:${esc(e.color)}">${plate(e)}<span class="min-w-0 flex-1"><b>${esc(e.name)}</b><small>${e.id}, ${Evt.fmtShort(e.start)}, ${phaseTxt(e).toLowerCase()}</small></span></a>`).join('') || '<p class="font-body-sm text-body-sm text-on-surface-variant p-2">Tidak ada acara yang cocok.</p>';
    const allRow = `<a href="${Router.href('/dasbor')}" class="pg-pick-row${isG(ui.tab) ? ' on' : ''}" data-pick-all><span class="pg-pick-all">${icon('apps', 'text-[18px]')}</span><span class="min-w-0 flex-1"><b>Semua acara</b><small>${visEvs().length} acara</small></span></a>`;
    dropdown(btn, `<input class="inp w-full" id="pick-q" placeholder="Cari nama, ID, atau kategori" autocomplete="off" aria-label="Cari acara"><div class="pg-pick-list" id="pick-list">${allRow}${rows('')}</div>`, (el, close) => {
      const q = el.querySelector('#pick-q'), list = el.querySelector('#pick-list'); let at = -1;
      const items = () => Array.from(list.querySelectorAll('a'));
      const mark = () => items().forEach((a, i) => { a.classList.toggle('kb', i === at); if (i === at) a.scrollIntoView({ block: 'nearest' }); });
      q.addEventListener('input', () => { list.innerHTML = (q.value.trim() ? '' : allRow) + rows(q.value.trim().toLowerCase()); at = -1; });
      q.addEventListener('keydown', (ev) => {
        const it = items();
        if (ev.key === 'ArrowDown') { ev.preventDefault(); at = Math.min(it.length - 1, at + 1); mark(); }
        else if (ev.key === 'ArrowUp') { ev.preventDefault(); at = Math.max(0, at - 1); mark(); }
        else if (ev.key === 'Enter') { ev.preventDefault(); const a = it[at] || it[0]; if (a) a.click(); }
      });
      list.addEventListener('click', (ev) => {
        const all = ev.target.closest('[data-pick-all]'), a = ev.target.closest('[data-pick-ev]'); if (!all && !a) return;
        ev.preventDefault(); close(); if (all) goTab('gdash'); else goTab(isG(ui.tab) ? 'ringkasan' : ui.tab, a.dataset.pickEv);
      });
      q.focus();
    });
  }
  // + Acara baru: nama, area (dengan ketersediaan), jadwal, format tiket. Sisanya diisi di Pengaturan.
  function newEventPanel() {
    const btn = document.getElementById('pg-new'); if (!btn) return; drawer(false);
    const s0 = Math.ceil((Evt.now() + 14 * 86400000) / 3600000) * 3600000, e0 = s0 + 3 * 3600000;
    const free = (Evt.AREAS.find((a) => !Evt.areaClash(a.id, s0, e0).length) || Evt.AREAS[0]).id;
    dropdown(btn, `<form id="f-new-ev" class="pg-newform" novalidate>
      <div class="pg-dd-h"><b>Acara baru</b><small>Disimpan sebagai draft, lalu diajukan ke Command Center</small></div>
      <label class="f">Nama acara<input class="inp" name="name" required maxlength="80" placeholder="Mis. Expo UMKM Gedebage" autocomplete="off"></label>
      <div class="grid grid-cols-2 gap-3"><label class="f">Mulai<input class="inp" type="datetime-local" name="start" required value="${dtl(s0)}"></label><label class="f">Selesai<input class="inp" type="datetime-local" name="end" required value="${dtl(e0)}"></label></div>
      <label class="f">Area<select class="inp" name="area" id="ne-area">${areaOptions(s0, e0, free, null)}</select></label>
      <div id="ne-area-info">${areaInfo(free)}</div>
      <label class="f">Format tiket<select class="inp" name="template">${Object.entries(Evt.TEMPLATES).map(([k, T]) => `<option value="${k}"${k === 'KUOTA' ? ' selected' : ''}>${esc(T.name)}</option>`).join('')}</select></label>
      <p class="pg-dd-err" id="ne-err" role="alert" hidden></p>
      <div class="flex justify-end gap-2"><button type="button" class="btn-ghost" data-dd-close>Batal</button><button class="btn">${icon('add', 'text-[18px]')} Buat draft</button></div></form>`, (el, close) => {
      const f = el.querySelector('#f-new-ev'), ar = el.querySelector('#ne-area'), err = el.querySelector('#ne-err');
      const say = (t) => { err.hidden = !t; err.textContent = t || ''; };
      const upd = () => { const v = ar.value; ar.innerHTML = areaOptions(new Date(f.elements.start.value).getTime(), new Date(f.elements.end.value).getTime(), v, null); ar.value = v; el.querySelector('#ne-area-info').innerHTML = areaInfo(v); say(''); };
      ['start', 'end', 'area'].forEach((n) => f.elements[n].addEventListener('change', upd));
      f.addEventListener('submit', async (ev) => {
        ev.preventDefault(); const x = Object.fromEntries(new FormData(f)), start = new Date(x.start).getTime(), end = new Date(x.end).getTime();
        if (!x.name.trim()) return say('Isi nama acara.');
        if (!(start > Evt.now())) return say('Waktu mulai sudah lewat. Pilih waktu setelah sekarang.');
        if (!(end > start)) return say('Acara harus selesai setelah mulai.');
        try {
          Evt.setActor(actorOf());
          const id = await Evt.addEvent({ name: x.name.trim(), cat: 'Umum', start, end, area: x.area, template: x.template });
          close(); UI.toast('Draft dibuat. Lengkapi datanya, unggah dokumen, lalu ajukan persetujuan.', 'P4'); goTab('pengaturan', id);
        } catch (e) { say(e.message); }
      });
      f.elements.name.focus();
    });
  }
  // Header acara (menempel): nama, status, aksi utama sesuai status, menu aksi lain.
  const PRIMARY = { DRAFT: ['PUBLISHED', 'Publikasikan', 'publish', 'btn'], PUBLISHED: ['CLOSED', 'Tutup penjualan', 'block', 'btn-ghost'], CLOSED: ['PUBLISHED', 'Buka lagi penjualan', 'storefront', 'btn'] };
  function moreMenu(e) {
    const live = liveOrders(e);
    return `<details class="pg-more"><summary class="pg-more-btn" aria-label="Aksi lain untuk ${esc(e.name)}" title="Aksi lain">${icon('more_horiz', 'text-[20px]')}</summary><div class="pg-menu">
      ${e.status !== 'DRAFT' ? `<a href="/pengunjung/e/${encodeURIComponent(e.id)}" target="_blank" rel="noopener">${icon('open_in_new', 'text-[18px]')} Lihat di portal</a>` : ''}
      <a href="${href(e.id, 'pengaturan')}">${icon('tune', 'text-[18px]')} Pengaturan</a>
      <button type="button" data-report-ev="${e.id}">${icon('picture_as_pdf', 'text-[18px]')} Unduh laporan PDF</button>
      ${e.status === 'DRAFT' && !Evt.needsApproval(e) ? `<button type="button" data-status="PUBLISHED" data-ev-id="${e.id}">${icon('publish', 'text-[18px]')} Publikasikan</button>` : ''}
      ${e.status === 'DRAFT' ? `<a href="${href(e.id, 'persetujuan')}">${icon('approval', 'text-[18px]')} Persetujuan</a>` : ''}
      ${e.status !== 'CANCELLED' && e.status !== 'DRAFT' ? (who() === 'tenant' && live ? `<button type="button" class="warn" disabled>${icon('event_busy', 'text-[18px]')} Batalkan acara<small>Sudah ada transaksi, hubungi Tim Event Mall</small></button>` : `<button type="button" class="warn" data-cancel-ev="${e.id}">${icon('event_busy', 'text-[18px]')} Batalkan acara</button>`) : ''}
      <button type="button" class="danger" data-del-ev="${e.id}" ${live ? `disabled title="Ada ${live} pesanan aktif. Batalkan acara dulu agar peserta di-refund."` : ''}>${icon('delete', 'text-[18px]')} Hapus acara${live ? `<small>Ada ${live} pesanan aktif</small>` : ''}</button></div></details>`;
  }
  const DOT = { DRAFT: 'rgb(var(--on-surface) / .4)', PUBLISHED: 'rgb(var(--primary))', CLOSED: '#FFC72C', CANCELLED: 'rgb(var(--error))' };
  function mgrHead(e) {
    const sale = Evt.saleState(e), apGate = e.status === 'DRAFT' && Evt.needsApproval(e), p = apGate ? null : PRIMARY[e.status];
    const apLbl = apGate && { DRAFT: 'Ajukan persetujuan', REVISI: 'Perbaiki & ajukan ulang', DIAJUKAN: 'Menunggu ' + ((Evt.currentStep(e) || {}).name || 'persetujuan') }[e.approval.st];
    const apBtn = apGate ? `<a class="pg-sign-btn main" href="${href(e.id, 'persetujuan')}">${icon('approval', 'text-[18px]')}<span>${esc(apLbl)}</span></a>` : '';
    return `<section class="pg-sign" style="--c:${esc(e.color)}">
      <span class="pg-sign-plate" title="Lantai">${plateOf(e)}</span>
      <div class="pg-sign-main">
        <div class="pg-sign-kick"><span>${place(e)}</span><span>${esc(e.cat)}</span><span>${e.id}</span>${isHariH(e) ? '<span class="pg-hari">Hari H</span>' : ''}</div>
        <h2 class="pg-sign-h">${esc(e.name)}</h2>
        <div class="pg-sign-meta"><span>${Evt.fmtDate(e.start)}, ${Evt.fmtTime(e.start)} WIB</span><span>Gate dibuka ${Evt.fmtTime(e.doors)}</span>
          <span class="pg-tag"><i style="background:${DOT[e.status]}"></i>${phase(e) === 'DONE' ? 'Selesai' : EV_ST[e.status][0]}</span>${e.status === 'CANCELLED' || e.status === 'DRAFT' ? '' : `<span class="pg-tag"><i style="background:${sale.open ? 'rgb(var(--primary))' : 'rgb(var(--on-surface) / .4)'}"></i>${esc(sale.label)}</span>`}</div>
      </div>
      <div class="pg-sign-act"><button type="button" class="pg-sign-btn" data-report-ev="${e.id}" title="Unduh laporan acara (PDF)">${icon('picture_as_pdf', 'text-[18px]')}<span>Laporan PDF</span></button>${apBtn}${p ? `<button type="button" class="pg-sign-btn ${p[3] === 'btn' ? 'main' : ''}" data-status="${p[0]}" data-ev-id="${e.id}">${icon(p[2], 'text-[18px]')}<span>${p[1]}</span></button>` : ''}${moreMenu(e)}</div></section>`;
  }
  function attnBlock(e) {
    const a = attention(e);
    if (!a.length) return `<section class="card pg-attn ok">${icon('task_alt', 'text-emerald-300 text-[22px]')}<div><b>Tidak ada yang perlu ditindaklanjuti</b><p>Masalah gate, pesanan yang menunggu bayar, dan selisih keuangan akan muncul di sini.</p></div></section>`;
    return `<section class="card pg-attn" aria-labelledby="attn-h"><h3 id="attn-h">Perlu tindakan <span>${a.length}</span></h3><ul>${a.map((x) => `<li class="${x.sev}">${icon(x.sev === 'crit' ? 'error' : x.sev === 'warn' ? 'warning' : 'info', 'text-[20px]')}<span class="flex-1 min-w-0">${esc(x.text)}</span>${x.publish ? `<button type="button" class="btn !py-1.5" data-status="PUBLISHED" data-ev-id="${e.id}">${x.btn}</button>` : `<a class="btn-ghost !py-1.5" href="${href(e.id, x.tab)}"${x.st ? ` data-attn-st="${x.st}"` : ''}${x.focus ? ` data-attn-focus="${x.focus}"` : ''}>${x.btn}</a>`}</li>`).join('')}</ul></section>`;
  }

  // ------------------------------------------------------------------ Semua acara: dasbor, transaksi, check-in & keuangan lintas acara
  const PRI = '#2F6FDB'; // primary-container, dipakai grafik SVG (atribut tidak bisa membaca var())
  const liveEvs = () => visEvs().filter((e) => e.status !== 'CANCELLED' && phase(e) !== 'DONE');
  function attentionAll() {
    const rank = { crit: 0, warn: 1, info: 2 };
    return liveEvs().flatMap((e) => attention(e).map((x) => Object.assign({ e }, x))).sort((a, b) => rank[a.sev] - rank[b.sev]);
  }
  function gBadges() {
    const a = attentionAll(), of = (tab) => { const r = a.filter((x) => x.tab === tab); return [r.reduce((s, x) => s + (x.n || 0), 0), r.some((x) => x.sev === 'crit')]; };
    return { gdash: [a.length, a.some((x) => x.sev === 'crit')], gtrx: of('peserta'), gck: of('checkin'), gfin: of('keuangan') };
  }
  function attnAllBlock() {
    const a = attentionAll();
    if (!a.length) return `<section class="card pg-attn ok">${icon('task_alt', 'text-[22px]')}<div><b>Tidak ada yang perlu ditindaklanjuti</b><p>Masalah gate, pesanan yang menunggu bayar, dan selisih keuangan dari semua acara akan muncul di sini.</p></div></section>`;
    const shown = a.slice(0, 8);
    return `<section class="card pg-attn" aria-labelledby="attn-all-h"><h3 id="attn-all-h">Perlu tindakan <span>${a.length}</span></h3><ul>${shown.map((x) => `<li class="${x.sev}">${icon(x.sev === 'crit' ? 'error' : x.sev === 'warn' ? 'warning' : 'info', 'text-[20px]')}<span class="flex-1 min-w-0"><b class="pg-attn-ev">${esc(x.e.name)}</b> ${esc(x.text)}</span><a class="btn-ghost !py-1.5" href="${href(x.e.id, x.tab)}"${x.st ? ` data-attn-st="${x.st}"` : ''}${x.focus ? ` data-attn-focus="${x.focus}"` : ''}>${x.btn}</a></li>`).join('')}</ul>${a.length > shown.length ? `<p class="pg-mnote">Dan ${a.length - shown.length} hal lain. Buka acaranya untuk melihat semua.</p>` : ''}</section>`;
  }
  function globalHead() {
    const all = visEvs();
    return `<section class="pg-sign pg-sign-all"><span class="pg-sign-plate">${icon('apps', 'text-[22px]')}</span>
      <div class="pg-sign-main"><div class="pg-sign-kick"><span>Summarecon Mall Bandung</span></div><h2 class="pg-sign-h">Semua acara</h2>
        <div class="pg-sign-meta"><span>${all.length} acara</span><span>${all.filter((e) => phaseTxt(e) === 'Dijual').length} sedang dijual</span><span>${all.filter((e) => e.status === 'DRAFT').length} draft</span></div></div>
      <div class="pg-sign-act"><button type="button" class="pg-sign-btn" data-report-all title="Unduh laporan semua acara (PDF)">${icon('picture_as_pdf', 'text-[18px]')}<span>Laporan PDF</span></button><button type="button" class="pg-sign-btn main" data-new-ev>${icon('add', 'text-[18px]')}<span>Acara baru</span></button></div></section>`;
  }
  function gdash() {
    const all = visEvs(), t = Evt.now(), D = 86400000;
    const days = Array.from({ length: 14 }, (_, i) => { const x = new Date(t - (13 - i) * D); x.setHours(0, 0, 0, 0); return x.getTime(); });
    const paid = all.flatMap((e) => Evt.stats(e.id).paid);
    const perDay = days.map((d) => paid.filter((o) => o.paidAt >= d && o.paidAt < d + D).reduce((a, o) => a + o.items.length, 0));
    const next = all.filter((e) => e.status !== 'CANCELLED' && e.status !== 'DRAFT' && e.start + 2 * 3600000 > t).sort((a, b) => a.start - b.start).slice(0, 6);
    return `<div id="g-feed">${ticker(null)}</div><div id="g-attn">${attnAllBlock()}</div>
      <div id="acara-kpi" class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">${acaraKpi()}</div>
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <section class="card p-5 xl:col-span-7">${UI.h('Tiket terjual per hari', '14 hari terakhir, semua acara', '', 'trending_up')}${UI.line([{ data: perDay, color: PRI }], { labels: days.map((d, i) => (i % 3 === 0 ? new Date(d).getDate() + '/' + (new Date(d).getMonth() + 1) : '')), min: 0, h: 200 })}</section>
        <section class="card p-5 xl:col-span-5">${UI.h('Acara berikutnya', '', `<a class="btn-ghost" href="${Router.href('/acara')}">Daftar acara</a>`, 'event_upcoming')}
          ${next.length ? `<ul class="pg-mlist">${next.map((x) => { const s = Evt.stats(x.id), cap = s.total - s.blocked; return `<li>${plate(x)}<div class="min-w-0 flex-1"><a class="pg-mlink" href="${href(x.id, 'ringkasan')}">${esc(x.name)}</a><small>${x.start <= t ? 'Sedang berlangsung' : Evt.fmtShort(x.start) + ', ' + Evt.fmtTime(x.start) + ' WIB'}</small></div><b class="whitespace-nowrap">${num(s.sold)} / ${num(cap)}</b></li>`; }).join('')}</ul>` : '<p class="pg-mempty">Tidak ada acara yang akan datang.</p>'}</section>
      </div>`;
  }
  const gStOf = (o) => (o.status === 'PENDING' && o.until < Evt.now() ? 'EXPIRED' : o.status);
  function gtrxTable() {
    const q = ui.gq.trim().toLowerCase();
    const list = Object.values(Evt.s.orders).filter((o) => seen(Evt.ev(o.ev)) && (ui.gst === 'ALL' || gStOf(o) === ui.gst) && (!q || [o.id, o.name, o.email, o.phone, Evt.ev(o.ev).name].join(' ').toLowerCase().includes(q))).sort((a, b) => b.createdAt - a.createdAt);
    return `<div class="font-label-md text-label-md text-on-surface-variant mb-2">${num(list.length)} transaksi</div><div class="overflow-x-auto"><table class="tbl min-w-[760px]"><thead><tr><th>Booking</th><th>Acara</th><th>Pemesan</th><th class="text-right">Tiket</th><th class="text-right">Total</th><th>Status</th><th>Dibuat</th></tr></thead><tbody>
      ${list.slice(0, 150).map((o) => { const e = Evt.ev(o.ev); return `<tr class="row" data-order="${o.id}"><td class="font-label-lg text-label-lg">${o.id}</td><td><div class="font-body-sm text-body-sm">${esc(e.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${e.id}</div></td><td><div class="font-body-sm text-body-sm">${esc(o.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${esc(o.email)}</div></td><td class="text-right">${o.items.length}</td><td class="text-right whitespace-nowrap">${rp(o.total)}</td><td>${oChip(o)}</td><td class="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">${Evt.fmtDT(o.createdAt)}</td></tr>`; }).join('') || '<tr><td colspan="7" class="text-on-surface-variant">Tidak ada transaksi yang cocok.</td></tr>'}
      </tbody></table></div>${list.length > 150 ? '<p class="pg-mnote">Menampilkan 150 transaksi terbaru. Pakai pencarian atau unduh CSV untuk semuanya.</p>' : ''}`;
  }
  function gtrx() {
    const all = Object.values(Evt.s.orders).filter((o) => seen(Evt.ev(o.ev))), c = {}; all.forEach((o) => { const s = gStOf(o); c[s] = (c[s] || 0) + 1; });
    const sts = [['ALL', 'Semua', all.length], ['PAID', 'Lunas'], ['PENDING', 'Menunggu bayar'], ['EXPIRED', 'Kedaluwarsa'], ['CANCELLED', 'Batal'], ['REFUNDED', 'Refund']];
    return `<section class="card p-5">${UI.h('Transaksi semua acara', 'Klik baris untuk melihat detail, mengubah data peserta, atau refund', `<button class="btn-ghost" id="g-csv">${icon('download', 'text-[16px]')} Unduh CSV</button>`, 'receipt_long')}
      <div class="pg-filter"><label class="pg-search">${icon('search', 'text-[18px]')}<span class="sr-only">Cari transaksi</span><input id="gq" class="inp" type="search" placeholder="Cari booking, nama, email, atau acara" value="${esc(ui.gq)}" autocomplete="off"></label>
        <div class="pg-chips" role="group" aria-label="Saring menurut status">${sts.map(([k, l, n]) => `<button type="button" class="chip-btn ${ui.gst === k ? 'on' : ''}" data-gst="${k}" aria-pressed="${ui.gst === k}">${l} <span class="opacity-70">${n != null ? n : c[k] || 0}</span></button>`).join('')}</div></div>
      <div id="g-table">${gtrxTable()}</div></section>`;
  }
  function gck() {
    const t = Evt.now();
    const rows = liveEvs().filter((e) => e.status !== 'DRAFT').map((e) => ({ e, s: Evt.stats(e.id), an: EvtCheckin.anomalies(e.id), rep: Evt.s.reports.filter((r) => r.ev === e.id && !r.ticketId) })).sort((a, b) => a.e.start - b.e.start);
    const alerts = rows.filter((r) => r.an.length || r.rep.length);
    const today = rows.filter((r) => isHariH(r.e));
    return `${alerts.length ? `<section class="card pg-attn" aria-labelledby="gck-h"><h3 id="gck-h">Masalah gate <span>${alerts.length}</span></h3><ul>${alerts.map((r) => `<li class="crit">${icon('error', 'text-[20px]')}<span class="flex-1 min-w-0"><b class="pg-attn-ev">${esc(r.e.name)}</b> ${[...r.an.map((a) => a.n + ' pindaian gagal di ' + esc(a.gate)), ...(r.rep.length ? [r.rep.length + ' laporan menunggu Command Center'] : [])].join(', ')}</span><a class="btn-ghost !py-1.5" href="${href(r.e.id, 'checkin')}" data-attn-focus="ck-anom">Lihat gate</a></li>`).join('')}</ul></section>` : `<section class="card pg-attn ok">${icon('task_alt', 'text-[22px]')}<div><b>Semua gate normal</b><p>Pindaian gagal berulang dan laporan petugas dari semua acara akan muncul di sini.</p></div></section>`}
      <section class="card p-5">${UI.h('Kehadiran per acara', today.length ? today.length + ' acara berlangsung hari ini' : 'Tidak ada acara yang berlangsung hari ini', `<a class="btn-ghost" href="/checkin" target="_blank" rel="noopener">${icon('smartphone', 'text-[16px]')} Pemindai gate</a>`, 'how_to_reg')}
        <div class="overflow-x-auto"><table class="tbl min-w-[720px]"><thead><tr><th>Acara</th><th>Jadwal</th><th>Gate dibuka</th><th class="w-[28%]">Sudah masuk</th><th>Gate</th><th></th></tr></thead><tbody>
        ${rows.map(({ e, s, an, rep }) => `<tr><td><div class="font-label-lg text-label-lg">${esc(e.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${e.id}${isHariH(e) ? ' <span class="pg-hari">Hari H</span>' : ''}</div></td><td class="whitespace-nowrap">${Evt.fmtShort(e.start)}<div class="font-label-sm text-label-sm text-on-surface-variant">${Evt.fmtTime(e.start)} WIB</div></td><td class="whitespace-nowrap">${Evt.fmtTime(e.doors)}</td><td><div class="font-label-md text-label-md mb-1">${num(s.checkedIn)} / ${num(s.tickets)}</div>${UI.bar(s.tickets ? (s.checkedIn / s.tickets) * 100 : 0, 'bg-primary-container')}</td><td>${an.length || rep.length ? `<span class="pg-flag">${an.length + rep.length} peringatan</span>` : '<span class="text-on-surface-variant">Normal</span>'}</td><td class="text-right"><a class="btn-ghost !py-1.5" href="${href(e.id, 'checkin')}">Buka</a></td></tr>`).join('') || '<tr><td colspan="6" class="text-on-surface-variant">Belum ada acara yang dijual.</td></tr>'}
        </tbody></table></div></section>`;
  }
  function gfin() {
    const rows = visEvs().map((e) => ({ e, f: Evt.finance(e.id) })).filter((r) => r.f.totals.orders > 0);
    const T = rows.reduce((a, r) => { const x = r.f.totals; a.gross += x.gross; a.ref += x.refunded; a.net += x.net; a.fee += x.fee; a.mm += r.f.mismatches.length; a.share += r.f.roi.share; return a; }, { gross: 0, ref: 0, net: 0, fee: 0, mm: 0, share: 0 });
    const by = {}; rows.forEach((r) => r.f.byMethod.forEach((m) => { const b = by[m.method] || (by[m.method] = { orders: 0, net: 0 }); b.orders += m.orders; b.net += m.net; }));
    const methods = Object.entries(by).sort((a, b) => b[1].net - a[1].net);
    return `<div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        ${UI.kpi({ label: 'Pendapatan neto', value: rpJt(T.net), unit: T.net >= 1e6 ? 'Jt' : '', foot: 'bruto ' + money(T.gross) })}
        ${UI.kpi({ label: 'Refund', value: rpJt(T.ref), unit: T.ref >= 1e6 ? 'Jt' : '', foot: 'dikembalikan ke peserta' })}
        ${UI.kpi({ label: 'Bagi hasil untuk mall', value: rpJt(T.share), unit: T.share >= 1e6 ? 'Jt' : '', foot: 'dari pendapatan tiket' })}
        ${UI.kpi({ label: 'Selisih rekonsiliasi', value: num(T.mm), foot: T.mm ? 'pesanan perlu diperiksa' : 'semua pesanan cocok' })}</div>
      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
        <section class="card p-5 2xl:col-span-8">${UI.h('Keuangan per acara', 'Pesanan lunas dan refund, dihitung dari setiap transaksi', `<button class="btn-ghost" id="g-csv-fin">${icon('download', 'text-[16px]')} Unduh CSV</button>`, 'account_balance')}
          <div class="overflow-x-auto"><table class="tbl min-w-[720px]"><thead><tr><th>Acara</th><th class="text-right">Transaksi</th><th class="text-right">Bruto</th><th class="text-right">Refund</th><th class="text-right">Neto</th><th class="text-right">ROI mall</th><th></th></tr></thead><tbody>
          ${rows.sort((a, b) => b.f.totals.net - a.f.totals.net).map(({ e, f }) => `<tr><td><div class="font-label-lg text-label-lg">${esc(e.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${e.id}${f.mismatches.length ? ' · <span class="text-rose-300">' + f.mismatches.length + ' selisih</span>' : ''}</div></td><td class="text-right">${f.totals.orders}</td><td class="text-right whitespace-nowrap">${money(f.totals.gross)}</td><td class="text-right whitespace-nowrap">${money(f.totals.refunded)}</td><td class="text-right whitespace-nowrap"><b>${money(f.totals.net)}</b></td><td class="text-right">${f.roi.roi == null ? '-' : Math.round(f.roi.roi * 100) + '%'}</td><td class="text-right"><a class="btn-ghost !py-1.5" href="${href(e.id, 'keuangan')}">Buka</a></td></tr>`).join('') || '<tr><td colspan="7" class="text-on-surface-variant">Belum ada transaksi.</td></tr>'}
          <tr><td><b>Total</b></td><td class="text-right"><b>${rows.reduce((a, r) => a + r.f.totals.orders, 0)}</b></td><td class="text-right whitespace-nowrap"><b>${money(T.gross)}</b></td><td class="text-right whitespace-nowrap"><b>${money(T.ref)}</b></td><td class="text-right whitespace-nowrap"><b>${money(T.net)}</b></td><td></td><td></td></tr></tbody></table></div></section>
        <section class="card p-5 2xl:col-span-4">${UI.h('Per metode pembayaran', 'Semua acara', '', 'payments')}
          ${bars(methods.map(([m, b]) => ({ label: esc(m), v: b.net, sub: b.orders + ' transaksi' })), (r) => money(r.v))}</section></div>`;
  }
  function bindGlobal(el) {
    const gq = el.querySelector('#gq'), gt = el.querySelector('#g-table');
    const regt = () => { gt.innerHTML = gtrxTable(); bindRows(gt); };
    if (gq) gq.addEventListener('input', () => { ui.gq = gq.value; regt(); });
    el.querySelectorAll('[data-gst]').forEach((b) => b.addEventListener('click', () => { ui.gst = b.dataset.gst; el.querySelectorAll('[data-gst]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); regt(); }));
    const csv = el.querySelector('#g-csv'); if (csv) csv.addEventListener('click', () => {
      const rows = [['Booking', 'Acara', 'Pemesan', 'Email', 'WhatsApp', 'Jumlah Tiket', 'Total', 'Metode', 'Status', 'Dibuat', 'Dibayar']];
      Object.values(Evt.s.orders).filter((o) => seen(Evt.ev(o.ev))).forEach((o) => rows.push([o.id, Evt.ev(o.ev).name, o.name, o.email, o.phone, o.items.length, o.total, o.method || '', gStOf(o), Evt.fmtDT(o.createdAt), o.paidAt ? Evt.fmtDT(o.paidAt) : '']));
      Evt.csv('transaksi_semua_acara.csv', rows);
    });
    const cf = el.querySelector('#g-csv-fin'); if (cf) cf.addEventListener('click', () => {
      const rows = [['ID', 'Acara', 'Transaksi', 'Bruto', 'Refund', 'Neto', 'Biaya Layanan', 'Bagi Hasil Mall', 'ROI Mall', 'Selisih']];
      visEvs().forEach((e) => { const f = Evt.finance(e.id), x = f.totals; rows.push([e.id, e.name, x.orders, x.gross, x.refunded, x.net, x.fee, Math.round(f.roi.share), f.roi.roi == null ? '' : (f.roi.roi * 100).toFixed(1) + '%', f.mismatches.length]); });
      Evt.csv('keuangan_semua_acara.csv', rows);
    });
  }

  // Laporan PDF semua acara (ringkasan portofolio, hanya angka agregat).
  function reportAllPdf() {
    if (!window.MiniPDF) return UI.toast('Modul PDF belum dimuat. Muat ulang halaman.', 'P2');
    const d = MiniPDF.doc(), M = 40, W = d.W - 2 * M, INK = '#1B2333', MUT = '#5B6577', LINE = '#D5DAE1', SOFT = '#F3F4F6', t = Evt.now();
    const all = visEvs(), rows = all.map((e) => { const s = Evt.stats(e.id), f = Evt.finance(e.id); return { e, s, f, cap: s.total - s.blocked }; });
    const fit = (str, w, size, bold) => { let x = String(str); if (d.width(x, size, bold) <= w) return x; while (x.length > 1 && d.width(x + '…', size, bold) > w) x = x.slice(0, -1); return x + '…'; };
    const pc = (x) => (x * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%';
    let y = 0;
    const top = (first) => {
      if (!first) { d.text(M, 34, 'Laporan semua acara', { size: 9, bold: true, color: INK }); d.text(d.W - M, 34, 'Summarecon Mall Bandung', { size: 8.5, color: MUT, align: 'right' }); d.line(M, 42, d.W - M, 42, LINE, 0.6); y = 64; return; }
      d.text(M, 50, 'Laporan acara', { size: 9, color: MUT }); d.text(M, 64, 'Summarecon Mall Bandung', { size: 9, color: MUT });
      d.text(d.W - M, 50, 'Dibuat ' + Evt.fmtDT(t) + ' WIB', { size: 9, color: MUT, align: 'right' });
      d.text(M, 104, 'Semua acara', { size: 22, bold: true, color: INK });
      d.text(M, 124, all.length + ' acara, ' + all.filter((e) => phaseTxt(e) === 'Dijual').length + ' sedang dijual, ' + all.filter((e) => e.status === 'DRAFT').length + ' draft', { size: 10, color: MUT });
      d.rect(M, 138, W, 2, PRI); y = 166;
    };
    const need = (h) => { if (y + h > d.H - 58) { d.addPage(); top(false); return true; } return false; };
    const section = (title, sub, keep) => { need(36 + (keep || 60)); y += 12; d.text(M, y, title, { size: 13, bold: true, color: INK }); if (sub) d.text(M, y + 13, sub, { size: 8.5, color: MUT }); y += sub ? 26 : 14; };
    const table = (cols, data, total) => {
      const rh = 19; const head = () => { d.rect(M, y, W, rh, SOFT); let x = M; cols.forEach((c) => { d.text(c.align === 'right' ? x + c.w - 6 : x + 6, y + 13, c.h, { size: 8, bold: true, color: MUT, align: c.align === 'right' ? 'right' : 'left' }); x += c.w; }); y += rh; };
      need(rh * 3); head();
      data.forEach((r, ri) => { if (need(rh)) head(); const bold = total && ri === data.length - 1; let x = M; r.forEach((cell, ci) => { const c = cols[ci]; d.text(c.align === 'right' ? x + c.w - 6 : x + 6, y + 13, fit(cell, c.w - 12, 9, bold), { size: 9, bold, color: INK, align: c.align === 'right' ? 'right' : 'left' }); x += c.w; }); d.line(M, y + rh, M + W, y + rh, bold ? INK : LINE, bold ? 0.8 : 0.5); y += rh; });
      y += 18;
    };
    top(true);
    const T = rows.reduce((a, r) => { a.sold += r.s.sold; a.cap += r.cap; a.net += r.f.totals.net; a.gross += r.f.totals.gross; a.ref += r.f.totals.refunded; a.orders += r.f.totals.orders; a.ck += r.s.checkedIn; a.tk += r.s.tickets; a.share += r.f.roi.share; return a; }, { sold: 0, cap: 0, net: 0, gross: 0, ref: 0, orders: 0, ck: 0, tk: 0, share: 0 });
    const box = (W - 30) / 4;
    [['Tiket terjual', num(T.sold) + ' / ' + num(T.cap), pc(T.cap ? T.sold / T.cap : 0) + ' kapasitas jual'], ['Pendapatan neto', money(T.net), 'bruto ' + money(T.gross)], ['Kehadiran', pc(T.tk ? T.ck / T.tk : 0), num(T.ck) + ' dari ' + num(T.tk) + ' tiket'], ['Bagi hasil mall', money(T.share), num(T.orders) + ' transaksi']]
      .forEach(([l, v, f], i) => { const x = M + i * (box + 10); d.rect(x, y, box, 66, SOFT); d.text(x + 12, y + 17, l, { size: 8.5, color: MUT }); let vs = 16; while (vs > 10 && d.width(v, vs, true) > box - 20) vs -= 0.5; d.text(x + 12, y + 41, v, { size: vs, bold: true, color: INK }); d.text(x + 12, y + 56, fit(f, box - 20, 8), { size: 8, color: MUT }); });
    y += 92;
    section('Per acara', 'Diurutkan menurut tanggal acara');
    table([{ h: 'Acara', w: 148 }, { h: 'Tanggal', w: 52 }, { h: 'Status', w: 105 }, { h: 'Terjual', w: 70, align: 'right' }, { h: 'Neto', w: 82, align: 'right' }, { h: 'Hadir', w: 58, align: 'right' }],
      rows.slice().sort((a, b) => a.e.start - b.e.start).map((r) => [r.e.name, Evt.fmtShort(r.e.start).replace(/ \d{4}$/, ''), phaseTxt(r.e), num(r.s.sold) + '/' + num(r.cap), money(r.f.totals.net), r.s.tickets ? pc(r.s.checkedIn / r.s.tickets) : '-'])
        .concat([['Total', '', '', num(T.sold) + '/' + num(T.cap), money(T.net), T.tk ? pc(T.ck / T.tk) : '-']]), true);
    const by = {}; rows.forEach((r) => r.f.byMethod.forEach((m) => { const b = by[m.method] || (by[m.method] = { orders: 0, gross: 0, ref: 0, net: 0 }); b.orders += m.orders; b.gross += m.gross; b.ref += m.refunded; b.net += m.net; }));
    section('Per metode pembayaran', 'Semua acara');
    table([{ h: 'Metode', w: 185 }, { h: 'Transaksi', w: 70, align: 'right' }, { h: 'Bruto', w: 90, align: 'right' }, { h: 'Refund', w: 80, align: 'right' }, { h: 'Neto', w: 90, align: 'right' }],
      Object.entries(by).sort((a, b) => b[1].net - a[1].net).map(([m, b]) => [m, num(b.orders), money(b.gross), money(b.ref), money(b.net)]).concat([['Total', num(T.orders), money(T.gross), money(T.ref), money(T.net)]]), true);
    const src = 'Data versi ' + (Evt.mode === 'server' ? Evt.version : 'lokal') + '. Pembayaran dan pesan di prototipe ini adalah simulasi.';
    d.eachPage((i, n) => { d.line(M, d.H - 40, d.W - M, d.H - 40, LINE, 0.5); d.text(M, d.H - 26, 'Konsol Pengelola Acara, Summarecon Mall Bandung. ' + src, { size: 8, color: MUT }); d.text(d.W - M, d.H - 26, 'Halaman ' + i + ' dari ' + n, { size: 8, color: MUT, align: 'right' }); });
    const day = new Date(t);
    d.save('Laporan_Semua_Acara_' + day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0') + '.pdf');
    UI.toast('Laporan semua acara diunduh (PDF)', 'P4');
    return d;
  }

  // ------------------------------------------------------------------ aksi status & aksi berisiko (dialog bertema)
  async function setStatus(e, next) {
    if (e.status === 'DRAFT' && next === 'PUBLISHED' && Evt.needsApproval(e)) {
      if (await UI.confirm({ title: 'Belum disetujui', body: 'Acara baru harus disetujui Divisi Event lalu Operasional Mall sebelum dipublikasikan.', impact: Evt.APPROVERS.map((a) => [a.name, (e.approval.steps[a.id] || {}).st === 'SETUJU' ? 'Disetujui' : 'Belum']), confirmText: 'Buka persetujuan' })) goTab('persetujuan', e.id);
      return;
    }
    if (e.status === 'DRAFT' && next === 'PUBLISHED') {
      const miss = readiness(e).filter((x) => !x.ok && !x.warn);
      if (miss.length) { if (await UI.confirm({ title: 'Belum bisa dipublikasikan', body: 'Lengkapi dulu bagian berikut di Pengaturan:', impact: miss.map((x) => [esc(x.label), esc(x.hint)]), confirmText: 'Buka pengaturan' })) goTab('pengaturan', e.id); return; }
      if (!(await UI.confirm({ title: 'Publikasikan ' + e.name + '?', body: 'Acara langsung tampil di portal pengunjung dan Command Center. Penjualan mengikuti periode jual.', impact: [['Penjualan dibuka', Evt.fmtDT(e.saleStart)], ['Penjualan ditutup', Evt.fmtDT(e.saleEnd)]], confirmText: 'Publikasikan' }))) return;
    }
    if (next === 'CLOSED' && !(await UI.confirm({ title: 'Tutup penjualan?', body: 'Pengunjung tidak bisa membeli tiket <b>' + esc(e.name) + '</b> sampai penjualan dibuka lagi. Tiket yang sudah terjual tetap berlaku.', confirmText: 'Tutup penjualan' }))) return;
    const ok = next === 'CLOSED' ? 'Penjualan ' + e.id + ' ditutup' : e.status === 'CLOSED' ? 'Penjualan ' + e.id + ' dibuka lagi'
      : e.id + ' dipublikasikan. <a class="underline" href="/pengunjung/e/' + encodeURIComponent(e.id) + '" target="_blank" rel="noopener">Lihat di portal</a>';
    await act(() => Evt.updateEvent(e.id, { status: next }), ok); redraw();
  }
  async function cancelEv(x) {
    const s = Evt.stats(x.id), t = Evt.now();
    const paid = s.orders.filter((o) => o.status === 'PAID'), pend = s.orders.filter((o) => o.status === 'PENDING' && o.until > t);
    const r0 = await UI.confirm({ title: 'Batalkan ' + x.name + '?', danger: true, body: 'Pembatalan tidak bisa diurungkan. Pesanan lunas di-refund otomatis dan peserta dikabari lewat email & WhatsApp.',
      impact: [['Pesanan lunas di-refund', num(paid.length)], ['Total refund', money(paid.reduce((a, o) => a + o.total, 0))], ['Menunggu bayar dibatalkan', num(pend.length)], ['Daftar tunggu', num(Evt.s.waitlist.filter((w) => w.ev === x.id).length) + ' orang']],
      reason: { label: 'Alasan pembatalan', required: true }, typeToConfirm: x.id, confirmText: 'Batalkan acara', cancelText: 'Kembali' });
    if (!r0) return;
    const r = await act(() => Evt.cancelEvent(x.id, r0.reason));
    if (r) { UI.toast(`${x.id} dibatalkan. ${r.refunded} pesanan di-refund (${money(r.total)}), ${r.cancelled} pesanan menunggu bayar dibatalkan`, 'P3'); redraw(); }
  }
  async function deleteEv(x) {
    if (!(await UI.confirm({ title: 'Hapus ' + x.name + '?', danger: true, body: 'Acara dihapus permanen dari semua portal. Denah, log check-in, dan notifikasi acara ini ikut terhapus.', impact: [['ID', x.id], ['Status', EV_TXT[phase(x)]]], confirmText: 'Hapus acara' }))) return;
    const name = await act(() => Evt.deleteEvent(x.id));
    if (name) { UI.toast('Acara "' + esc(name) + '" dihapus', 'P4'); if (ui.ev === x.id) { ui.ev = null; goTab('acara'); } else redraw(); }
  }
  async function resetDemo() {
    if (!(await UI.confirm({ title: 'Reset data contoh?', danger: true, body: 'Semua acara, pesanan, dan check-in dikembalikan ke data contoh awal. Berlaku untuk <b>semua perangkat</b> yang tersambung.', typeToConfirm: 'RESET', confirmText: 'Reset data' }))) return;
    try { await Evt.reset(); } catch (err) { return UI.toast(esc(err.message), 'P2'); }
    ui.seatSel = null; redraw(); UI.toast('Data contoh direset', 'P4');
  }
  // Alat demo (lewat pencarian Ctrl+K): hasil tampil di dialog.
  function demoLog(title, lines, foot) {
    UI.modal(icon('science', 'text-primary text-[22px] align-middle') + ' ' + esc(title), `<ol class="flex flex-col gap-1.5 font-body-sm text-body-sm list-decimal pl-5">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ol>${foot ? `<p class="font-body-sm text-body-sm text-on-surface-variant mt-4">${foot}</p>` : ''}<div class="flex justify-end mt-5"><button class="btn-ghost" data-close>Tutup</button></div>`, { small: true });
  }
  async function demo(kind) {
    drawer(false);
    if (kind === 'reset') return resetDemo();
    const e = Evt.ev(ui.ev); if (!e) return UI.toast('Pilih acara dulu', 'P3');
    const free = Evt.allSeats(e).filter((x) => Evt.seatStatus(e.id, x, null) === 'available');
    const CAS = 'Server menerima perubahan dari pembeli pertama dan menolak pembeli kedua karena versi datanya sudah berubah. Pembeli kedua membaca ulang data dan melihat kursi sudah dipegang orang lain, jadi satu kursi tidak pernah punya dua pesanan.';
    if (kind === 'race') {
      if (!free.length) return UI.toast(e.id + ' tidak punya kursi bernomor yang tersedia. Pilih acara berkursi.', 'P3');
      const seat = free[Math.floor(Math.random() * free.length)];
      const log = await act(() => Evt.raceDemo(e.id, seat));
      if (log) { ui.seatSel = seat; if (ui.tab === 'kursi') redraw(); demoLog('Uji rebutan kursi ' + seat, log, CAS); }
    } else if (kind === 'stress') {
      const seat = ui.seatSel && free.includes(ui.seatSel) ? ui.seatSel : free[0];
      if (!seat) return UI.toast(e.id + ' tidak punya kursi bernomor yang tersedia. Pilih acara berkursi.', 'P3');
      UI.toast('Uji tekan berjalan, 25 pembeli menekan kursi ' + seat + '…', 'P4');
      const r = await act(() => Evt.stressTest(e.id, seat, 25));
      if (r) { ui.seatSel = seat; if (ui.tab === 'kursi') redraw(); demoLog(`Uji tekan: ${r.n - r.rejected} berhasil, ${r.rejected} ditolak`, r.log, CAS); }
    } else if (kind === 'dual') {
      const r = await act(() => Evt.dualGateTest(e.id));
      if (r) demoLog('Uji check-in 2 gate · tiket ' + r.ticket, r.results.map((x) => `${x.gate}: ${x.result === 'VALID' ? 'VALID' : x.result === 'USED' ? 'SUDAH DIGUNAKAN' : 'TIDAK VALID'}. ${x.reason}`), 'Hanya satu gate yang menerima. Setelah uji, tiket dikembalikan ke belum check-in dan pindaian uji tidak dihitung sebagai anomali gate.');
    }
  }

  // ------------------------------------------------------------------ laporan acara (PDF, app/js/core/pdf.js). Hanya angka agregat, tanpa data pribadi peserta.
  function reportPdf(e) {
    if (!window.MiniPDF) return UI.toast('Modul PDF belum dimuat. Muat ulang halaman.', 'P2');
    const d = MiniPDF.doc(), M = 40, W = d.W - 2 * M, INK = '#1B2333', MUT = '#5B6577', LINE = '#D5DAE1', SOFT = '#F3F4F6';
    const s = Evt.stats(e.id), fin = Evt.finance(e.id), T = fin.totals, R = fin.roi, t = Evt.now();
    const cap = s.total - s.blocked, att = s.tickets ? s.checkedIn / s.tickets : 0;
    const pc = (x) => (x * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%';
    const fit = (str, w, size, bold) => { let x = String(str); if (d.width(x, size, bold) <= w) return x; while (x.length > 1 && d.width(x + '…', size, bold) > w) x = x.slice(0, -1); return x + '…'; };
    let y = 0;
    function top(first) {
      if (!first) { d.text(M, 34, fit(e.name, W - 160, 9, true), { size: 9, bold: true, color: INK }); d.text(d.W - M, 34, 'Laporan acara ' + e.id, { size: 8.5, color: MUT, align: 'right' }); d.line(M, 42, d.W - M, 42, LINE, 0.6); y = 64; return; }
      d.rect(M, 40, 30, 30, INK); d.text(M + 15, 60, plateOf(e), { size: 13, bold: true, color: '#FFFFFF', align: 'center' });
      d.text(M + 42, 50, 'Laporan acara', { size: 9, color: MUT });
      d.text(M + 42, 64, 'Summarecon Mall Bandung', { size: 9, color: MUT });
      d.text(d.W - M, 50, 'Dibuat ' + Evt.fmtDT(t) + ' WIB', { size: 9, color: MUT, align: 'right' });
      d.text(d.W - M, 64, e.id, { size: 9, color: MUT, align: 'right' });
      const name = d.wrap(e.name, W, 22, true).slice(0, 2);
      name.forEach((l, i) => d.text(M, 104 + i * 26, l, { size: 22, bold: true, color: INK }));
      y = 104 + (name.length - 1) * 26 + 20;
      d.text(M, y, fit(Evt.fmtDate(e.start) + ', ' + Evt.fmtTime(e.start) + ' WIB, ' + (e.venue || '').split('·')[0].trim(), W, 10), { size: 10, color: MUT });
      y += 14; d.rect(M, y, W, 2, PAL_PDF[0]);
      y += 26;
    }
    const need = (h) => { if (y + h > d.H - 58) { d.addPage(); top(false); return true; } return false; };
    // keep: ruang minimum untuk isi setelah judul, agar judul tidak tertinggal sendirian di bawah halaman
    function section(title, sub, keep) {
      need(36 + (keep || 60)); y += 12; // jarak di atas judul bagian (judul ditulis pada garis dasar y)
      d.text(M, y, title, { size: 13, bold: true, color: INK });
      if (sub) d.text(M, y + 13, sub, { size: 8.5, color: MUT });
      y += sub ? 26 : 14;
    }
    // cols: [{h, w, align}], rows: array sel (string atau {bar, color, txt}), opts.total: baris terakhir tebal
    function table(cols, rows, opts) {
      opts = opts || {}; const rh = 19;
      const head = () => { d.rect(M, y, W, rh, SOFT); let x = M; cols.forEach((c) => { d.text(c.align === 'right' ? x + c.w - 6 : x + 6, y + 13, c.h, { size: 8, bold: true, color: MUT, align: c.align === 'right' ? 'right' : 'left' }); x += c.w; }); y += rh; };
      need(rh * 3); head();
      rows.forEach((r, ri) => {
        if (need(rh)) head();
        const bold = opts.total && ri === rows.length - 1; let x = M;
        r.forEach((cell, ci) => {
          const c = cols[ci];
          if (cell && typeof cell === 'object') {
            const bw = c.w - 52; d.rect(x + 6, y + 7, bw, 5, '#E3E7ED'); d.rect(x + 6, y + 7, Math.max(cell.bar > 0 ? 1.5 : 0, bw * Math.min(1, cell.bar || 0)), 5, cell.color || INK);
            d.text(x + c.w - 6, y + 13, cell.txt, { size: 8.5, color: INK, align: 'right' });
          } else {
            const txt = fit(cell, c.w - 12, 9, bold);
            d.text(c.align === 'right' ? x + c.w - 6 : x + 6, y + 13, txt, { size: 9, bold, color: INK, align: c.align === 'right' ? 'right' : 'left' });
          }
          x += c.w;
        });
        d.line(M, y + rh, M + W, y + rh, bold ? INK : LINE, bold ? 0.8 : 0.5); y += rh;
      });
      y += 18;
    }
    function kv(pairs, cols) {
      const cw = W / cols; const rows = Math.ceil(pairs.length / cols);
      for (let r = 0; r < rows; r++) {
        const cells = pairs.slice(r * cols, r * cols + cols).map((p) => ({ p, lines: d.wrap(p[1], cw - 14, 9.5, !!p[2]).slice(0, 2) }));
        const rh = 20 + Math.max(...cells.map((c) => c.lines.length)) * 12;
        need(rh);
        cells.forEach((c, i) => { d.text(M + i * cw, y + 8, c.p[0], { size: 8, color: MUT }); c.lines.forEach((l, k) => d.text(M + i * cw, y + 21 + k * 12, k === 1 ? fit(l, cw - 14, 9.5, !!c.p[2]) : l, { size: 9.5, bold: !!c.p[2], color: INK })); });
        y += rh;
      }
      y += 10;
    }
    const para = (txt, size, color) => { const ls = d.wrap(txt, W, size || 9, false); need(ls.length * 13); ls.forEach((l) => { d.text(M, y + 9, l, { size: size || 9, color: color || INK }); y += 13; }); y += 6; };

    top(true);
    // ringkasan: 4 angka utama
    const box = (W - 30) / 4, stats = [
      ['Tiket terjual', num(s.sold) + ' / ' + num(cap), pc(cap ? s.sold / cap : 0) + ' kapasitas jual'],
      ['Pendapatan neto', money(T.net), 'bruto ' + money(T.gross)],
      ['Kehadiran', pc(att), num(s.checkedIn) + ' dari ' + num(s.tickets) + ' tiket'],
      ['Transaksi lunas', num(s.paid.length), num(s.registrants) + ' pemesan unik'],
    ];
    stats.forEach(([l, v, f], i) => { const x = M + i * (box + 10); d.rect(x, y, box, 66, SOFT); d.text(x + 12, y + 17, l, { size: 8.5, color: MUT }); let vs = 16; while (vs > 10 && d.width(v, vs, true) > box - 20) vs -= 0.5; d.text(x + 12, y + 41, v, { size: vs, bold: true, color: INK }); d.text(x + 12, y + 56, fit(f, box - 20, 8), { size: 8, color: MUT }); });
    y += 92;

    section('Informasi acara');
    kv([['Status', phaseTxt(e), true], ['Kategori', e.cat], ['Penyelenggara', e.org || 'Tim Event Summarecon Mall Bandung'],
      ['Acara mulai', Evt.fmtDT(e.start) + ' WIB'], ['Gate dibuka', Evt.fmtDT(e.doors) + ' WIB'], ['Lokasi', (e.venue || '').split('·')[0].trim()],
      ['Penjualan dibuka', Evt.fmtDT(e.saleStart) + ' WIB'], ['Penjualan ditutup', Evt.fmtDT(e.saleEnd) + ' WIB'], ['Maks tiket per pesanan', String(e.maxPerOrder)],
      ['Gate check-in', e.gates.join(', ')]].concat(e.status === 'CANCELLED' ? [['Dibatalkan', Evt.fmtDT(e.cancelledAt) + (e.cancelReason ? ', ' + e.cancelReason : ''), true]] : []), 3);

    section('Penjualan per kategori', 'Pesanan lunas, dihitung dengan harga saat pembelian');
    const byT = {}; fin.byType.forEach((b) => (byT[b.type] = b));
    table([{ h: 'Kategori', w: 118 }, { h: 'Harga', w: 72, align: 'right' }, { h: 'Terjual', w: 50, align: 'right' }, { h: 'Kapasitas', w: 58, align: 'right' }, { h: 'Okupansi', w: 92 }, { h: 'Pendapatan tiket', w: 82, align: 'right' }, { h: 'Check-in', w: 43, align: 'right' }],
      e.types.map((ty) => { const p = s.per[ty.id], c = p.total - p.blocked; return [ty.name, ty.price ? money(ty.price) : 'Gratis', num(p.sold), num(c), { bar: c ? p.sold / c : 0, color: PAL_PDF[tcIdx(e, ty)], txt: pc(c ? p.sold / c : 0) }, money(byT[ty.id] ? byT[ty.id].gross : 0), num(p.checkedIn)]; })
        .concat([['Total', '', num(s.sold), num(cap), { bar: cap ? s.sold / cap : 0, color: INK, txt: pc(cap ? s.sold / cap : 0) }, money(fin.byType.reduce((a, b) => a + b.gross, 0)), num(s.checkedIn)]]), { total: true });

    // tren 14 hari
    section('Tiket terjual 14 hari terakhir', 'Jumlah tiket dari pesanan yang lunas per hari', 112);
    const D = 86400000, days = Array.from({ length: 14 }, (_, i) => { const d0 = new Date(t - (13 - i) * D); d0.setHours(0, 0, 0, 0); return d0.getTime(); });
    const per = days.map((d0) => s.paid.filter((o) => o.paidAt >= d0 && o.paidAt < d0 + D).reduce((a, o) => a + o.items.length, 0));
    need(112); const ch = 76, mx = Math.max(1, ...per), bw = W / 14;
    d.line(M, y + ch, M + W, y + ch, LINE, 0.6);
    per.forEach((v, i) => { const h = (v / mx) * (ch - 14), x = M + i * bw + bw * 0.18; if (v) { d.rect(x, y + ch - h, bw * 0.64, h, i === 13 ? PAL_PDF[0] : INK); d.text(x + bw * 0.32, y + ch - h - 4, String(v), { size: 7.5, color: INK, align: 'center' }); } const dt = new Date(days[i]); d.text(x + bw * 0.32, y + ch + 12, dt.getDate() + '/' + (dt.getMonth() + 1), { size: 7, color: MUT, align: 'center' }); });
    y += ch + 28;

    section('Rekonsiliasi pembayaran', 'Total = subtotal + biaya layanan, jumlah e-ticket = jumlah tiket. Biaya layanan ' + money(T.fee));
    table([{ h: 'Metode', w: 185 }, { h: 'Transaksi', w: 70, align: 'right' }, { h: 'Bruto', w: 90, align: 'right' }, { h: 'Refund', w: 80, align: 'right' }, { h: 'Neto', w: 90, align: 'right' }],
      (fin.byMethod.length ? fin.byMethod.map((m) => [m.method, num(m.orders), money(m.gross), money(m.refunded), money(m.net)]) : [['Belum ada transaksi', '', '', '', '']])
        .concat([['Total', num(T.orders), money(T.gross), money(T.refunded), money(T.net)]]), { total: true });
    if (fin.mismatches.length) { need(20); d.rect(M, y - 6, 4, 14, '#C62828'); d.text(M + 10, y + 5, fin.mismatches.length + ' pesanan perlu diperiksa:', { size: 9, bold: true, color: '#C62828' }); y += 18; fin.mismatches.slice(0, 8).forEach((m) => para(m.order + ': ' + m.reason, 8.5, MUT)); }
    else { need(20); d.text(M, y, 'Semua pesanan cocok, tidak ada selisih rekonsiliasi.', { size: 9, color: MUT }); y += 22; }

    section('Kehadiran per gate', 'Pindaian QR yang diterima di setiap gate');
    const byGate = {}; Object.values(Evt.s.tickets).filter((k) => k.ev === e.id && k.checkedInAt).forEach((k) => (byGate[k.gate] = (byGate[k.gate] || 0) + 1));
    table([{ h: 'Gate', w: 240 }, { h: 'Check-in', w: 80, align: 'right' }, { h: 'Porsi dari kehadiran', w: 195 }],
      e.gates.map((g) => [g, num(byGate[g] || 0), { bar: s.checkedIn ? (byGate[g] || 0) / s.checkedIn : 0, color: INK, txt: pc(s.checkedIn ? (byGate[g] || 0) / s.checkedIn : 0) }])
        .concat([['Belum hadir', num(s.tickets - s.checkedIn), { bar: s.tickets ? (s.tickets - s.checkedIn) / s.tickets : 0, color: '#9AA3B2', txt: pc(s.tickets ? (s.tickets - s.checkedIn) / s.tickets : 0) }]]));
    const anom = EvtCheckin.anomalies(e.id), reps = Evt.s.reports.filter((r) => r.ev === e.id);
    if (anom.length || reps.length) { anom.forEach((a) => para('Anomali: ' + a.n + ' pindaian gagal atau duplikat di ' + a.gate + ' dalam 10 menit terakhir.', 9, '#C62828')); reps.forEach((r) => para('Laporan ' + r.id + ' (' + Evt.fmtDT(r.ts) + ', ' + r.gate + '): ' + r.text + (r.ticketId ? ' Ditangani ' + r.ticketId + '.' : ' Menunggu Command Center.'), 8.5, MUT)); }
    else para('Tidak ada anomali gate atau laporan lapangan.', 9, MUT);

    section('ROI acara untuk mall', 'Manfaat = sewa venue + bagi hasil tiket. ROI = (manfaat - biaya) / biaya', 96);
    kv([['Sewa venue', money(R.rent)], ['Bagi hasil tiket (' + pc(R.revShare) + ')', money(R.share)], ['Total manfaat', money(R.benefit), true],
      ['Biaya operasional mall', money(R.cost)], ['ROI', R.roi == null ? '-' : pc(R.roi), true], ['Estimasi belanja di tenant', money(R.tenantSpend)]], 3);
    para('Estimasi belanja tenant = ' + num(R.attendees) + ' pengunjung x ' + money(R.spend) + ', tidak masuk ROI. Angka kontrak diisi di Pengaturan acara.', 8.5, MUT);
    const src = 'Data versi ' + (Evt.mode === 'server' ? Evt.version : 'lokal') + '. Pembayaran dan pesan di prototipe ini adalah simulasi.';

    d.eachPage((i, n) => { d.line(M, d.H - 40, d.W - M, d.H - 40, LINE, 0.5); d.text(M, d.H - 26, 'Konsol Pengelola Acara, Summarecon Mall Bandung. ' + src, { size: 8, color: MUT }); d.text(d.W - M, d.H - 26, 'Halaman ' + i + ' dari ' + n, { size: 8, color: MUT, align: 'right' }); });
    const day = new Date(t); const ymd = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0');
    d.save('Laporan_' + e.id + '_' + ymd + '.pdf');
    UI.toast('Laporan ' + e.id + ' diunduh (PDF)', 'P4');
    return d;
  }

  // ------------------------------------------------------------------ alert berjalan: aktivitas terbaru acara (3 hari terakhir)
  const HOUR = 3600000, DAY = 24 * HOUR;
  const dur = (ms) => { const m = Math.max(0, Math.round(ms / 60000)); if (m < 60) return m + ' menit'; const h = Math.floor(m / 60); if (h < 48) return h + ' jam' + (m % 60 && h < 6 ? ' ' + (m % 60) + ' menit' : ''); return Math.round(h / 24) + ' hari'; };
  const firstName = (n) => esc(String(n || 'Pengunjung').trim().split(/\s+/)[0]);
  function feed(evId) {
    const t = Evt.now(), since = t - 3 * DAY, out = [];
    const evs = evId ? [Evt.ev(evId)].filter(Boolean) : visEvs();
    const evName = (e) => (evId ? '' : esc(e.name.length > 34 ? e.name.slice(0, 34) + '…' : e.name));
    evs.forEach((e) => {
      Evt.stats(e.id).orders.forEach((o) => {
        const ty = Evt.typeById(e, o.items[0].type);
        if (o.status === 'PAID' && o.paidAt > since) out.push({ ts: o.paidAt, tone: 'ok', tag: 'Lunas', code: o.id, txt: `${firstName(o.name)} membeli ${o.items.length} tiket ${esc(ty ? ty.name : '')}`, ev: evName(e) });
        if (o.status === 'PENDING' && o.until > t) out.push({ ts: o.createdAt, tone: 'warn', tag: 'Menunggu bayar', code: o.id, txt: `batas ${Evt.fmtTime(o.until)} WIB, ${rp(o.total)}`, ev: evName(e) });
        if (o.status === 'REFUNDED' && o.refundedAt > since) out.push({ ts: o.refundedAt, tone: 'bad', tag: 'Refund', code: o.id, txt: money(o.total) + (o.refundReason ? ', ' + esc(o.refundReason) : ''), ev: evName(e) });
      });
      // check-in dikelompokkan per gate per 15 menit agar tidak membanjiri
      const ck = {};
      Object.values(Evt.s.tickets).filter((k) => k.ev === e.id && k.checkedInAt > since).forEach((k) => { const key = k.gate + '|' + Math.floor(k.checkedInAt / 900000); const c = ck[key] || (ck[key] = { gate: k.gate, ts: 0, n: 0 }); c.n++; c.ts = Math.max(c.ts, k.checkedInAt); });
      Object.values(ck).forEach((c) => out.push({ ts: c.ts, tone: 'ok', tag: 'Masuk', code: esc(c.gate.replace(/\s*\(.*\)$/, '')), txt: `${c.n} pengunjung check-in`, ev: evName(e) }));
      Evt.s.reports.filter((r) => r.ev === e.id && r.ts > since).forEach((r) => out.push({ ts: r.ts, tone: 'bad', tag: 'Laporan', code: r.id, txt: `${esc(r.text)} (${esc(r.gate)}${r.ticketId ? ', ditangani ' + esc(r.ticketId) : ', menunggu Command Center'})`, ev: evName(e) }));
      EvtCheckin.anomalies(e.id).forEach((a) => out.push({ ts: t, tone: 'bad', tag: 'Pindaian gagal', code: esc(a.gate.replace(/\s*\(.*\)$/, '')), txt: `${a.n} kali dalam 10 menit, indikasi tiket palsu`, ev: evName(e) }));
    });
    return out.sort((a, b) => (a.tone === 'bad') - (b.tone === 'bad') ? (b.tone === 'bad') - (a.tone === 'bad') : b.ts - a.ts).slice(0, evId ? 10 : 14);
  }
  function ticker(evId) {
    const items = feed(evId), d0 = new Date(Evt.now()); d0.setHours(0, 0, 0, 0);
    const when = (ts) => (ts >= d0.getTime() ? Evt.fmtTime(ts) : Evt.fmtShort(ts).replace(/ \d{4}$/, '') + ' ' + Evt.fmtTime(ts));
    const bad = items.filter((x) => x.tone === 'bad').length;
    const label = 'Informasi Terbaru';
    const more = evId ? href(evId, bad ? 'checkin' : 'peserta') : Router.href(bad ? '/kehadiran' : '/transaksi');
    const tag = `<a class="pg-ticker-tag" href="${more}"><i class="${bad ? 'pulse-ring' : ''}"></i>${label}</a>`;
    if (!items.length) return `<div class="pg-ticker" role="region" aria-label="Informasi terbaru">${tag}<div class="pg-ticker-vp"><span class="tk-empty">Belum ada aktivitas dalam 3 hari terakhir.</span></div></div>`;
    const seq = items.map((x) => `<span class="tk-it ${x.tone}"><b>${x.tag} ${x.code}:</b> ${x.txt}${x.ev ? ', ' + x.ev : ''} <time>(${when(x.ts)})</time></span>`).join('<span class="tk-sep" aria-hidden="true">◆</span>');
    const sec = Math.max(30, items.length * 7);
    // delay negatif dari jam dinding: setelah digambar ulang, posisi berjalan tetap menyambung
    return `<div class="pg-ticker" role="region" aria-label="Informasi terbaru">${tag}<div class="ticker-wrap pg-ticker-vp"><div class="ticker-move" style="animation-duration:${sec}s;animation-delay:-${((Date.now() / 1000) % sec).toFixed(2)}s">${seq}</div></div><a class="pg-ticker-more" href="${more}">Lihat semua</a></div>`;
  }

  // ------------------------------------------------------------------ rincian kartu: jawaban cepat yang dibutuhkan EO
  const pctTxt = (a, b) => (b ? Math.round((a / b) * 100) : 0) + '%';
  function bars(rows, fmt) {
    const max = Math.max(1, ...rows.map((r) => r.max || r.v));
    if (!rows.length) return '<p class="pg-mempty">Belum ada data.</p>';
    return `<ul class="pg-bars">${rows.map((r) => `<li><div class="pg-bars-t"><span>${r.label}</span><b>${fmt(r)}</b></div><div class="pg-bars-track"><i style="width:${r.v ? Math.max(2, Math.min(100, (r.v / (r.max || max)) * 100)) : 0}%;background:${r.color || 'rgb(var(--primary))'}"></i></div>${r.sub ? `<small>${r.sub}</small>` : ''}</li>`).join('')}</ul>`;
  }
  const mh = (t) => `<h4 class="pg-mh">${t}</h4>`;
  const evName = (x) => `<a href="${href(x.id, 'ringkasan')}" class="pg-mlink">${esc(x.name)}</a>`;
  // Angka utama + konteks, lalu maksimal 3 angka pendukung.
  const qiHead = (big, sub, tiles) => `<div class="qi-head"><b>${big}</b><span>${sub}</span></div>${tiles && tiles.length ? `<div class="qi-tiles">${tiles.map(([l, v, tone]) => `<div class="${tone || ''}"><span>${l}</span><b>${v}</b></div>`).join('')}</div>` : ''}`;
  const qiNote = (txt, tone) => `<p class="qi-note ${tone || ''}">${icon(tone === 'warn' ? 'warning' : tone === 'good' ? 'trending_up' : tone === 'bad' ? 'error' : 'schedule', 'text-[18px]')}<span>${txt}</span></p>`;
  const paidIn = (orders, from) => orders.filter((o) => o.paidAt >= from);
  const qtyOf = (orders) => orders.reduce((a, o) => a + o.items.length, 0);
  const sumOf = (orders) => orders.reduce((a, o) => a + o.total, 0);
  function kpiModal(key) {
    const all = visEvs(), e = Evt.ev(ui.ev), t = Evt.now();
    const today = new Date(t); today.setHours(0, 0, 0, 0); const T0 = today.getTime();
    let title = '', html = '', links = [];
    if (key === 'all:events') {
      const live = all.filter((x) => x.status !== 'CANCELLED' && x.status !== 'DRAFT' && x.start + 6 * HOUR > t);
      const todayN = live.filter((x) => x.start >= T0 && x.start < T0 + DAY).length, weekN = live.filter((x) => x.start >= t && x.start < t + 7 * DAY).length;
      const drafts = all.filter((x) => x.status === 'DRAFT'), notReady = drafts.filter((x) => readiness(x).some((r) => !r.ok && !r.warn));
      const next = live.filter((x) => x.start + 2 * HOUR > t).sort((a, b) => a.start - b.start).slice(0, 5);
      title = 'Acara';
      html = qiHead(num(all.length), `${num(live.length)} sedang dijual atau berjalan, ${num(drafts.length)} draft`, [['Hari ini', num(todayN)], ['7 hari ke depan', num(weekN)], ['Draft belum lengkap', num(notReady.length), notReady.length ? 'warn' : '']])
        + mh('Berikutnya') + (next.length ? `<ul class="pg-mlist">${next.map((x) => { const s = Evt.stats(x.id), cap = s.total - s.blocked; return `<li>${plate(x)}<div class="min-w-0 flex-1">${evName(x)}<small>${x.start <= t ? 'Sedang berlangsung' : Evt.fmtShort(x.start) + ', ' + Evt.fmtTime(x.start) + ' (' + dur(x.start - t) + ' lagi)'}</small></div><b class="whitespace-nowrap">${pctTxt(s.sold, cap)}</b></li>`; }).join('')}</ul><p class="pg-mnote">Angka kanan = persentase tiket terjual.</p>` : '<p class="pg-mempty">Tidak ada acara yang akan datang.</p>')
        + (notReady.length ? mh('Draft yang perlu dilengkapi') + `<ul class="pg-mlist">${notReady.slice(0, 4).map((x) => `<li>${plate(x)}<div class="min-w-0 flex-1"><a class="pg-mlink" href="${href(x.id, 'pengaturan')}">${esc(x.name)}</a><small>Belum: ${readiness(x).filter((r) => !r.ok && !r.warn).map((r) => r.label.toLowerCase()).join(', ')}</small></div></li>`).join('')}</ul>` : '');
    } else if (key === 'all:sold' || key === 'all:rev') {
      const rev = key === 'all:rev';
      const rows = all.map((x) => { const s = Evt.stats(x.id); return { x, s, cap: s.total - s.blocked }; });
      const paid = rows.flatMap((r) => r.s.paid);
      const tot = rev ? rows.reduce((a, r) => a + r.s.revenue, 0) : rows.reduce((a, r) => a + r.s.sold, 0);
      const d1 = rev ? sumOf(paidIn(paid, t - DAY)) : qtyOf(paidIn(paid, t - DAY)), d7 = rev ? sumOf(paidIn(paid, t - 7 * DAY)) : qtyOf(paidIn(paid, t - 7 * DAY));
      const hot = rows.filter((r) => r.x.status === 'PUBLISHED' && r.cap && r.s.sold / r.cap >= 0.8 && r.s.sold < r.cap);
      const top = rows.filter((r) => (rev ? r.s.revenue : r.s.sold) > 0).sort((a, b) => (rev ? b.s.revenue - a.s.revenue : b.s.sold - a.s.sold)).slice(0, 5);
      const fmtV = (v) => (rev ? money(v) : num(v) + ' tiket');
      title = rev ? 'Pendapatan semua acara' : 'Tiket terjual semua acara';
      html = qiHead(rev ? money(tot) : num(tot), rev ? 'dari ' + num(paid.length) + ' transaksi lunas' : 'tiket dari ' + num(rows.filter((r) => r.s.sold).length) + ' acara', [['24 jam terakhir', '+' + fmtV(d1)], ['7 hari terakhir', '+' + fmtV(d7)], rev ? ['Rata-rata per transaksi', money(paid.length ? tot / paid.length : 0)] : ['Hampir habis', num(hot.length) + ' acara', hot.length ? 'warn' : '']])
        + (!rev && hot.length ? qiNote('Terjual di atas 80%: ' + hot.slice(0, 3).map((r) => esc(r.x.name) + ' (' + pctTxt(r.s.sold, r.cap) + ')').join(', ') + '. Pertimbangkan membuka daftar tunggu atau menambah kuota.', 'warn') : '')
        + mh(rev ? '5 acara dengan pendapatan tertinggi' : '5 acara paling laku')
        + bars(top.map((r) => ({ label: evName(r.x), v: rev ? r.s.revenue : r.s.sold, max: rev ? 0 : r.cap, color: 'rgb(var(--primary))', sub: rev ? pctTxt(r.s.revenue, tot) + ' dari total' : 'sisa ' + num(r.cap - r.s.sold) })), (r) => (rev ? money(r.v) : num(r.v) + ' / ' + num(r.max)));
    } else if (key === 'all:ck') {
      const d0 = new Date(t); d0.setHours(0, 0, 0, 0);
      const rows = all.map((x) => ({ x, n: Object.values(Evt.s.tickets).filter((k) => k.ev === x.id && k.checkedInAt >= d0.getTime()).length, s: Evt.stats(x.id) })).filter((r) => r.n || isHariH(r.x));
      title = 'Check-in hari ini';
      html = qiHead(num(rows.reduce((a, r) => a + r.n, 0)), 'pengunjung masuk lewat gate sejak pukul 00.00')
        + mh('Per acara') + bars(rows.map((r) => ({ label: evName(r.x), v: r.n, max: r.s.tickets || 1, sub: num(r.s.tickets - r.s.checkedIn) + ' belum hadir' })), (r) => num(r.v) + ' / ' + num(r.max));
      links = [];
      const root = UI.modal(esc(title), html + `<div class="pg-mfoot"><a class="btn-ghost" href="${Router.href('/kehadiran')}">Buka Check-in & gate</a><button type="button" class="btn" data-close>Tutup</button></div>`, { small: true });
      return root;
    } else if (key === 'all:cancel') {
      const c = all.filter((x) => x.status === 'CANCELLED');
      const refunded = c.reduce((a, x) => a + Evt.finance(x.id).totals.refunded, 0);
      title = 'Acara dibatalkan';
      html = qiHead(num(c.length), c.length ? 'acara, total refund ' + money(refunded) : 'acara. Semua acara masih berjalan.')
        + (c.length ? `<ul class="pg-mlist">${c.map((x) => `<li>${plate(x)}<div class="min-w-0 flex-1">${evName(x)}<small>${Evt.fmtDT(x.cancelledAt)}${x.cancelReason ? ', ' + esc(x.cancelReason) : ''}</small></div><b class="whitespace-nowrap">${money(Evt.finance(x.id).totals.refunded)}</b></li>`).join('')}</ul>` : '');
    } else if (e && key === 'ev:sold') {
      const s = Evt.stats(e.id), cap = s.total - s.blocked, left = cap - s.sold;
      const d1 = qtyOf(paidIn(s.paid, t - DAY)), d7 = qtyOf(paidIn(s.paid, t - 7 * DAY)), pace = d7 / 7;
      const cats = e.types.map((ty) => { const p = s.per[ty.id], c = p.total - p.blocked; return { ty, p, c, r: c ? p.sold / c : 0 }; });
      const low = cats.filter((x) => x.ty.onSale && x.p.available > 0 && x.p.available <= Math.max(5, x.c * 0.1));
      const gone = cats.filter((x) => x.ty.onSale && x.c && x.p.available === 0);
      const saleLeft = e.saleEnd - t;
      let proj = '';
      if (e.status === 'PUBLISHED' && saleLeft > 0 && left > 0) proj = pace > 0 ? (left / pace) * DAY <= saleLeft ? `Dengan laju 7 hari terakhir (${pace.toLocaleString('id-ID', { maximumFractionDigits: 1 })} tiket per hari), sisa tiket habis sekitar ${dur((left / pace) * DAY)} lagi.` : `Dengan laju 7 hari terakhir, sekitar ${num(Math.min(left, Math.round(pace * saleLeft / DAY)))} tiket lagi terjual sebelum penjualan ditutup ${dur(saleLeft)} lagi.` : `Belum ada penjualan dalam 7 hari terakhir. Penjualan ditutup ${dur(saleLeft)} lagi.`;
      title = 'Tiket terjual';
      html = qiHead(`${num(s.sold)} <small>/ ${num(cap)}</small>`, `${pctTxt(s.sold, cap)} terjual, sisa ${num(left)} tiket`, [['24 jam terakhir', '+' + num(d1)], ['7 hari terakhir', '+' + num(d7)], ['Sedang dipesan', num(s.held + s.pending), s.held + s.pending ? 'warn' : '']])
        + (gone.length ? qiNote('Habis: ' + gone.map((x) => esc(x.ty.name)).join(', ') + '.', 'bad') : '')
        + (low.length ? qiNote('Hampir habis: ' + low.map((x) => esc(x.ty.name) + ' sisa ' + x.p.available).join(', ') + '.', 'warn') : '')
        + (proj ? qiNote(proj, pace > 0 ? 'good' : '') : '')
        + mh('Per kategori') + bars(cats.map((x) => ({ label: esc(x.ty.name) + ` <span class="pg-mdim">${x.ty.price ? rp(x.ty.price) : 'Gratis'}</span>`, v: x.p.sold, max: x.c || 1, color: tc(e, x.ty), sub: `sisa ${x.p.available}${x.p.held ? ', ' + x.p.held + ' sedang dipesan' : ''}` })), (r) => pctTxt(r.v, r.max));
      links = [['kursi', 'Buka denah'], ['peserta', 'Lihat peserta']];
    } else if (e && ['ev:rev', 'fin:gross', 'fin:net', 'fin:fee'].includes(key)) {
      const s = Evt.stats(e.id), f = Evt.finance(e.id), T = f.totals;
      const dT = sumOf(paidIn(s.paid, T0)), d7 = sumOf(paidIn(s.paid, t - 7 * DAY));
      const topM = f.byMethod.slice().sort((a, b) => b.orders - a.orders)[0];
      const refN = Object.values(Evt.s.orders).filter((o) => o.ev === e.id && o.status === 'REFUNDED').length;
      title = 'Pendapatan';
      html = qiHead(money(T.net), `neto setelah refund, bruto ${money(T.gross)}`, [['Hari ini', money(dT)], ['7 hari terakhir', money(d7)], ['Rata-rata per transaksi', money(s.paid.length ? T.gross / s.paid.length : 0)]])
        + (T.refunded ? qiNote(`Refund ${money(T.refunded)} dari ${refN} pesanan.`, 'warn') : '')
        + (topM ? qiNote(`Metode paling sering: ${esc(topM.method)} (${pctTxt(topM.orders, T.orders)} transaksi). Biaya layanan terkumpul ${money(T.fee)}.`) : '')
        + (f.mismatches.length ? qiNote(f.mismatches.length + ' pesanan tidak cocok saat rekonsiliasi. Periksa di Keuangan.', 'bad') : '')
        + mh('Pendapatan tiket per kategori') + bars(f.byType.map((b) => ({ label: esc(b.name), v: b.gross, color: tc(e, Evt.typeById(e, b.type)), sub: num(b.qty) + ' tiket' })), (r) => money(r.v));
      links = [['keuangan', 'Buka Keuangan & ROI']];
    } else if (e && key === 'ev:att') {
      const s = Evt.stats(e.id), ck = Object.values(Evt.s.tickets).filter((k) => k.ev === e.id && k.checkedInAt);
      const byGate = {}; ck.forEach((k) => (byGate[k.gate] = (byGate[k.gate] || 0) + 1));
      const last15 = ck.filter((k) => k.checkedInAt > t - 15 * 60000).length;
      const busiest = Object.entries(byGate).sort((a, b) => b[1] - a[1])[0];
      const anom = EvtCheckin.anomalies(e.id);
      const timing = t < e.doors ? `Gate dibuka ${dur(e.doors - t)} lagi (${Evt.fmtTime(e.doors)} WIB).` : t < e.start ? `Acara mulai ${dur(e.start - t)} lagi. ${num(s.tickets - s.checkedIn)} pemegang tiket belum datang.` : t < e.start + 6 * HOUR ? `Acara sudah mulai ${dur(t - e.start)} yang lalu.` : 'Acara sudah selesai.';
      title = 'Kehadiran';
      html = qiHead(pctTxt(s.checkedIn, s.tickets), `${num(s.checkedIn)} dari ${num(s.tickets)} pemegang tiket sudah masuk`, [['15 menit terakhir', '+' + num(last15)], ['Belum hadir', num(s.tickets - s.checkedIn)], ['Gate tersibuk', busiest ? esc(busiest[0].replace(/\s*\(.*\)$/, '')) : '-']])
        + qiNote(timing)
        + (anom.length ? qiNote(anom.map((a) => `${a.n} pindaian gagal di ${esc(a.gate)}`).join(', ') + '. Periksa di Check-in & gate.', 'bad') : '')
        + mh('Per gate') + bars(e.gates.map((g) => ({ label: esc(g), v: byGate[g] || 0, max: s.checkedIn || 1 })), (r) => num(r.v))
        + mh('Per kategori') + bars(e.types.filter((ty) => s.per[ty.id].sold).map((ty) => ({ label: esc(ty.name), v: s.per[ty.id].checkedIn, max: s.per[ty.id].sold, color: tc(e, ty) })), (r) => num(r.v) + ' / ' + num(r.max));
      links = [['checkin', 'Buka Check-in & gate']];
    } else if (e && key === 'ev:held') {
      const s = Evt.stats(e.id), pend = s.orders.filter((o) => o.status === 'PENDING' && o.until > t).sort((a, b) => a.until - b.until);
      const soon = pend.filter((o) => o.until - t < 5 * 60000);
      title = 'Sedang dipesan';
      html = qiHead(num(s.held + s.pending), 'tiket belum lunas', [['Di keranjang', num(s.held)], ['Menunggu bayar', num(s.pending)], ['Nilai tertunda', money(sumOf(pend))]])
        + qiNote(`Keranjang ditahan ${e.holdMin} menit, pembayaran ditunggu ${Evt.PAY_MIN} menit. Tiket yang tidak dibayar kembali dijual otomatis.`)
        + (soon.length ? qiNote(soon.length + ' pesanan habis dalam 5 menit.', 'warn') : '')
        + mh('Menunggu bayar') + (pend.length ? `<ul class="pg-mlist">${pend.slice(0, 8).map((o) => `<li><button type="button" class="pg-mrow" data-order="${o.id}"><b>${o.id}</b><span>${esc(o.name)}, ${o.items.length} tiket, ${rp(o.total)}</span></button><small class="whitespace-nowrap ${o.until - t < 5 * 60000 ? 'qi-warn' : ''}">${dur(o.until - t)} lagi</small></li>`).join('')}</ul>` : '<p class="pg-mempty">Tidak ada pesanan yang menunggu bayar.</p>');
      links = [['peserta', 'Lihat semua pesanan', 'PENDING']];
    } else if (e && key === 'fin:refund') {
      const list = Object.values(Evt.s.orders).filter((o) => o.ev === e.id && o.status === 'REFUNDED').sort((a, b) => (b.refundedAt || 0) - (a.refundedAt || 0));
      title = 'Refund';
      html = qiHead(money(sumOf(list)), list.length ? 'dikembalikan ke ' + list.length + ' pemesan' : 'Belum ada refund untuk acara ini.')
        + (list.length ? `<ul class="pg-mlist">${list.slice(0, 10).map((o) => `<li><button type="button" class="pg-mrow" data-order="${o.id}"><b>${o.id}</b><span>${esc(o.refundReason || 'Tanpa alasan')}${o.refundedAt ? ', ' + Evt.fmtDT(o.refundedAt) : ''}</span></button><b class="whitespace-nowrap">${money(o.total)}</b></li>`).join('')}</ul>` : '');
      links = [['peserta', 'Lihat peserta', 'REFUNDED']];
    } else if (e && key === 'fin:mm') {
      const f = Evt.finance(e.id);
      title = 'Rekonsiliasi';
      html = qiHead(f.mismatches.length ? num(f.mismatches.length) : 'Cocok', f.mismatches.length ? 'pesanan perlu diperiksa' : `semua ${num(f.totals.orders)} pesanan lunas dan refund sesuai`)
        + (f.mismatches.length ? `<ul class="pg-mlist">${f.mismatches.map((m) => `<li><button type="button" class="pg-mrow" data-order="${esc(m.order)}"><b>${esc(m.order)}</b><span>${esc(m.reason)}</span></button></li>`).join('')}</ul>` : qiNote('Setiap pesanan dicek: total sama dengan subtotal ditambah biaya layanan, dan jumlah e-ticket sama dengan jumlah tiket.', 'good'));
    } else return;
    const root = UI.modal(esc(title) + (e && key.indexOf('all:') ? ` <span class="qi-ev">${esc(e.name)}</span>` : ''), html + `<div class="pg-mfoot">${links.map(([tab, l, st]) => `<a class="btn-ghost" href="${href(e.id, tab)}"${st ? ` data-attn-st="${st}"` : ''}>${l}</a>`).join('')}<button type="button" class="btn" data-close>Tutup</button></div>`, { small: true });
    root.querySelectorAll('[data-order]').forEach((b) => b.addEventListener('click', () => orderModal(b.dataset.order)));
    root.querySelectorAll('[data-attn-st]').forEach((a) => a.addEventListener('click', () => (ui.st = a.dataset.attnSt)));
  }
  const K = (key) => (isMgr() ? key : null); // rincian kartu hanya di konsol pengelola

  // ------------------------------------------------------------------ cari & navigasi cepat (Ctrl+K)
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
  function paletteItems(q) {
    const e = Evt.ev(ui.ev), words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hit = (txt) => words.every((w) => txt.toLowerCase().includes(w));
    const out = [];
    const push = (group, it) => { if (!words.length || hit(it.label + ' ' + (it.sub || '') + ' ' + (it.kw || ''))) out.push(Object.assign({ group }, it)); };
    // Nama acara cukup di judul grup, tidak diulang di setiap baris menu.
    if (e) ETABS.forEach(([k, l, i]) => push('Menu · ' + e.name, { icon: i, label: l, kw: 'buka menu ' + e.id + ' ' + e.name, run: () => goTab(k) }));
    GTABS.forEach(([k, l, i]) => push('Semua acara', { icon: i, label: l, kw: 'menu global semua acara', run: () => goTab(k) }));
    const evs = visEvs();
    evs.filter((x) => !words.length || hit(x.name + ' ' + x.id + ' ' + x.cat + ' ' + (x.org || '') + ' ' + place(x))).slice(0, words.length ? 8 : 5)
      .forEach((x) => out.push({ group: 'Acara', plate: plateOf(x), label: x.name, sub: x.id + ', ' + Evt.fmtShort(x.start) + ', ' + phaseTxt(x).toLowerCase(), run: () => goTab(isG(ui.tab) ? 'ringkasan' : ui.tab, x.id) }));
    if (q.trim().length >= 3) Object.values(Evt.s.orders).filter((o) => seen(Evt.ev(o.ev)) && hit([o.id, o.name, o.email].join(' '))).slice(0, 5)
      .forEach((o) => out.push({ group: 'Pesanan', icon: 'receipt_long', label: o.id + ', ' + o.name, sub: Evt.ev(o.ev) ? Evt.ev(o.ev).name : o.ev, run: () => { goTab('peserta', o.ev); orderModal(o.id); } }));
    push('Perintah', { icon: 'add_circle', label: 'Buat acara baru', kw: 'tambah', run: newEventPanel });
    push('Perintah', { icon: 'picture_as_pdf', label: 'Unduh laporan PDF semua acara', kw: 'report cetak export', run: reportAllPdf });
    if (e) push('Perintah', { icon: 'picture_as_pdf', label: 'Unduh laporan PDF', sub: e.id, kw: 'report cetak export', run: () => reportPdf(e) });
    if (e && e.status !== 'DRAFT') push('Perintah', { icon: 'open_in_new', label: 'Lihat di portal pengunjung', sub: e.id, run: () => window.open('/pengunjung/e/' + encodeURIComponent(e.id), '_blank', 'noopener') });
    push('Perintah', { icon: 'contrast', label: 'Ganti mode terang atau gelap', kw: 'tema dark light', run: () => { const b = document.querySelector('[data-theme-toggle]'); if (b) b.click(); } });
    push('Perintah', { icon: 'smartphone', label: 'Buka pemindai gate di ponsel', kw: 'checkin scan', run: () => window.open('/checkin', '_blank', 'noopener') });
    push('Perintah', { icon: 'manage_accounts', label: 'Edit profil', kw: 'akun nama', run: editProfile });
    if (e) {
      push('Alat demo', { icon: 'bolt', label: 'Uji rebutan kursi', sub: 'Dua pembeli menekan kursi yang sama di ' + e.id, kw: 'uji demo race', run: () => demo('race') });
      push('Alat demo', { icon: 'groups', label: 'Uji tekan 25 pembeli', sub: e.id, kw: 'uji demo stress', run: () => demo('stress') });
      push('Alat demo', { icon: 'qr_code_scanner', label: 'Uji check-in di 2 gate', sub: 'Satu QR dipindai dua gate bersamaan', kw: 'uji demo gate', run: () => demo('dual') });
    }
    push('Alat demo', { icon: 'restart_alt', label: 'Reset data contoh', sub: 'Berlaku untuk semua perangkat', kw: 'uji demo', run: resetDemo });
    return out.filter((it) => it.group !== 'Alat demo' || can('demo'));
  }
  function palette() {
    if (document.getElementById('pg-cmdk')) return;
    drawer(false); closeMenus(); profMenu(false);
    const back = document.activeElement;
    const wrap = document.createElement('div'); wrap.id = 'pg-cmdk'; wrap.className = 'cmdk-wrap';
    wrap.innerHTML = `<div class="cmdk" role="dialog" aria-modal="true" aria-label="Cari dan navigasi">
      <div class="cmdk-in">${icon('search', 'text-[22px]')}<input id="cmdk-q" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list" placeholder="Cari acara, menu, atau kode booking" autocomplete="off" spellcheck="false"><button type="button" class="cmdk-esc" data-cmdk-close aria-label="Tutup pencarian">Esc</button></div>
      <ul id="cmdk-list" class="cmdk-list" role="listbox" aria-label="Hasil"></ul>
      <div class="cmdk-foot" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> pilih</span><span><kbd>↵</kbd> buka</span><span><kbd>Esc</kbd> tutup</span><span class="cmdk-count" id="cmdk-count"></span></div></div>`;
    document.body.appendChild(wrap);
    const q = wrap.querySelector('#cmdk-q'), list = wrap.querySelector('#cmdk-list'), count = wrap.querySelector('#cmdk-count');
    let items = [], at = 0;
    const close = () => { wrap.remove(); if (back && back.focus) back.focus(); };
    const run = (i) => { const it = items[i]; if (!it) return; close(); it.run(); };
    // Tebalkan bagian teks yang cocok dengan kata yang diketik (teks di-escape per potongan).
    const mark = (txt) => {
      const words = q.value.trim().split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (!words.length) return esc(txt);
      return String(txt).split(new RegExp('(' + words.join('|') + ')', 'gi')).map((p, i) => (i % 2 ? '<mark>' + esc(p) + '</mark>' : esc(p))).join('');
    };
    function paint() {
      items = paletteItems(q.value); at = Math.min(at, Math.max(0, items.length - 1));
      let g = '';
      list.innerHTML = items.length ? items.map((it, i) => { const head = it.group !== g ? `<li class="cmdk-g" role="presentation">${esc((g = it.group))}</li>` : '';
        return head + `<li id="cmdk-${i}" role="option" aria-selected="${i === at}" class="cmdk-it${i === at ? ' on' : ''}" data-i="${i}">${it.plate ? `<span class="cmdk-ic"><span class="pg-plate">${it.plate}</span></span>` : `<span class="cmdk-ic">${icon(it.icon, 'text-[18px]')}</span>`}<span class="min-w-0 flex-1"><b>${mark(it.label)}</b>${it.sub ? `<small>${mark(it.sub)}</small>` : ''}</span><kbd class="cmdk-enter">↵</kbd></li>`; }).join('')
        : `<li class="cmdk-empty">${icon('search_off', 'text-[28px]')}<b>Tidak ada hasil untuk "${esc(q.value)}"</b><span>Coba nama acara, EVT-01, atau kode booking.</span></li>`;
      count.textContent = items.length ? items.length + ' hasil' : '';
      q.setAttribute('aria-activedescendant', items.length ? 'cmdk-' + at : '');
      const on = list.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    }
    q.addEventListener('input', () => { at = 0; paint(); });
    q.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); at = (at + 1) % Math.max(1, items.length); paint(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); at = (at - 1 + items.length) % Math.max(1, items.length); paint(); }
      else if (ev.key === 'Enter') { ev.preventDefault(); run(at); }
      else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(); }
      else if (ev.key === 'Tab') ev.preventDefault(); // fokus tetap di kotak cari
    });
    list.addEventListener('mousemove', (ev) => { const li = ev.target.closest('[data-i]'); if (li && +li.dataset.i !== at) { at = +li.dataset.i; paint(); } });
    list.addEventListener('click', (ev) => { const li = ev.target.closest('[data-i]'); if (li) run(+li.dataset.i); });
    wrap.addEventListener('mousedown', (ev) => { if (ev.target === wrap) close(); });
    wrap.querySelector('[data-cmdk-close]').addEventListener('click', close);
    paint(); q.focus();
  }

  // ------------------------------------------------------------------ anomali gate (pengelola melapor, Command Center membuat tiket insiden)
  // Tiket insiden ada di Store (localStorage) browser CC yang membuatnya. Nomor TCK dihitung per browser,
  // jadi tautkan hanya bila tiket itu memang tiket SOP-EVT-03 di browser ini.
  const tkLink = (id) => (window.Store && Store.ticket(id) && Store.ticket(id).sop === 'SOP-EVT-03'
    ? `<a href="/command-center/ticketing?id=${encodeURIComponent(id)}" class="chip-btn">${esc(id)}</a>`
    : `<span class="font-label-sm text-label-sm text-emerald-300" title="Tiket dibuat di perangkat Command Center lain">${esc(id)} (perangkat CC lain)</span>`);
  function anomList(e) {
    const anom = EvtCheckin.anomalies(e.id);
    const reports = Evt.s.reports.filter((r) => r.ev === e.id);
    const rows = anom.map((a) => { const rep = reports.find((r) => r.gate === a.gate && r.ts > Evt.now() - 30 * 60000);
      const btn = isMgr() ? (rep ? `<span class="font-label-sm text-label-sm ${rep.ticketId ? 'text-emerald-300' : 'text-amber-300'}">${rep.ticketId ? 'Ditangani ' + esc(rep.ticketId) : 'Terkirim, menunggu CC'}</span>` : `<button class="btn-danger !px-2 !py-1 text-[12px]" data-report="${esc(a.gate)}">Laporkan ke CC</button>`)
        : rep && rep.ticketId ? tkLink(rep.ticketId)
        : rep && rep.claimedBy ? '<span class="font-label-sm text-label-sm text-amber-300">Sedang dibuat otomatis</span>'
        : `<button class="btn-danger !px-2 !py-1 text-[12px]" data-inc="${esc(a.gate)}">Buat tiket insiden</button>`;
      return `<div class="rel-row !cursor-default items-center">${icon('warning', 'text-rose-300 text-[18px]')}<div class="flex-1"><div class="font-label-lg text-label-lg">${esc(a.gate)}</div><div class="font-body-sm text-body-sm text-on-surface-variant">${a.n} pindaian tidak valid/duplikat, indikasi tiket palsu atau calo</div></div>${btn}</div>`; });
    reports.forEach((r) => rows.push(`<div class="rel-row !cursor-default items-center">${icon('campaign', 'text-amber-300 text-[18px]')}<div class="flex-1"><div class="font-label-md text-label-md text-on-surface-variant">${r.id} · ${Evt.fmtTime(r.ts)} · ${esc(r.gate)}</div><div class="font-body-sm text-body-sm">${esc(r.text)}</div></div>${r.ticketId ? (isMgr() ? `<span class="chip-btn">${esc(r.ticketId)}</span>` : tkLink(r.ticketId)) : isMgr() ? '<span class="font-label-sm text-label-sm text-amber-300">Menunggu CC</span>' : r.claimedBy ? '<span class="font-label-sm text-label-sm text-amber-300">Sedang dibuat otomatis</span>' : `<button class="btn-danger !px-2 !py-1 text-[12px]" data-rep="${r.id}">Buat tiket insiden</button>`}</div>`));
    return { html: rows.join('') || '<div class="font-body-sm text-body-sm text-on-surface-variant">Tidak ada anomali. Gate normal.</div>', alert: anom.length || reports.some((r) => !r.ticketId) };
  }
  function anomPanel(e) {
    const a = anomList(e);
    return `<section class="card p-5 ${a.alert ? 'crit-left' : ''}">${UI.h('Anomali gate & laporan lapangan', 'Muncul bila satu gate menerima 3 pindaian gagal atau ganda dalam 10 menit (SOP-EVT-03).' + (isMgr() ? ' Laporan Anda diteruskan ke Command Center.' : ' Buat tiket insiden bila perlu.'), '', 'gpp_maybe')}<div class="flex flex-col gap-2">${a.html}</div></section>`;
  }

  // ------------------------------------------------------------------ tab: ringkasan
  function ringkasan(e, s) {
    const cap = s.total - s.blocked;
    const att = s.tickets ? (s.checkedIn / s.tickets) * 100 : 0;
    const t = Evt.now(), D = 86400000;
    const days = Array.from({ length: 14 }, (_, i) => { const d0 = new Date(t - (13 - i) * D); d0.setHours(0, 0, 0, 0); return d0.getTime(); });
    const perDay = days.map((d0) => s.paid.filter((o) => o.paidAt >= d0 && o.paidAt < d0 + D).reduce((a, o) => a + o.items.length, 0));
    const slots = Array.from({ length: 12 }, (_, i) => t - (11 - i) * 15 * 60000);
    const ck = Object.values(Evt.s.tickets).filter((x) => x.ev === e.id && x.checkedInAt);
    const perSlot = slots.map((s0) => ck.filter((x) => x.checkedInAt > s0 - 15 * 60000 && x.checkedInAt <= s0).length);
    const recent = s.orders.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    const kAtt = UI.kpi({ key: K('ev:att'), label: 'Kehadiran', icon: 'how_to_reg', value: att.toFixed(0) + '%', unit: num(s.checkedIn) + '/' + num(s.tickets), bar: att, barcls: 'bg-secondary', foot: 'tiket sudah check-in' });
    const kpis = isMgr() ? `<div id="evt-feed">${ticker(e.id)}</div>${attnBlock(e)}<div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      ${isHariH(e) ? kAtt : ''}
      ${UI.kpi({ key: K('ev:sold'), label: 'Tiket terjual', icon: 'confirmation_number', value: num(s.sold), unit: '/ ' + num(cap), bar: cap ? (s.sold / cap) * 100 : 0, foot: (cap ? ((s.sold / cap) * 100).toFixed(1) : 0) + '% kapasitas jual' })}
      ${UI.kpi({ key: K('ev:rev'), label: 'Pendapatan', icon: 'payments', value: rpJt(s.revenue), unit: s.revenue >= 1e6 ? 'Jt' : '', foot: s.paid.length + ' transaksi lunas · ' + num(s.registrants) + ' pemesan unik' })}
      ${isHariH(e) ? '' : kAtt}
      ${UI.kpi({ key: K('ev:held'), label: 'Sedang dipesan', icon: 'lock_clock', value: num(s.held + s.pending), vcls: s.held + s.pending ? 'text-amber-300' : 'text-on-surface', foot: num(s.held) + ' di keranjang, ' + num(s.pending) + ' menunggu bayar' })}
    </div>` : '';
    return kpis + (isMgr() ? '' : `<div class="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-5">
      ${UI.kpi({ label: 'Tiket terjual', icon: 'confirmation_number', value: num(s.sold), unit: '/ ' + num(cap), bar: cap ? (s.sold / cap) * 100 : 0, foot: (cap ? ((s.sold / cap) * 100).toFixed(1) : 0) + '% kapasitas jual' })}
      ${UI.kpi({ label: 'Pendapatan', icon: 'payments', value: rpJt(s.revenue), unit: s.revenue >= 1e6 ? 'Jt' : '', foot: s.paid.length + ' transaksi lunas' })}
      ${UI.kpi({ label: 'Pendaftar unik', icon: 'person_add', value: num(s.registrants), foot: 'berdasarkan email pemesan' })}
      ${UI.kpi({ label: 'Kehadiran', icon: 'how_to_reg', value: att.toFixed(0) + '%', unit: num(s.checkedIn) + '/' + num(s.tickets), bar: att, barcls: 'bg-secondary', foot: 'tiket sudah check-in' })}
      ${UI.kpi({ label: 'Sedang dipesan', icon: 'lock_clock', value: num(s.held), vcls: 'text-amber-300', foot: 'kursi/kuota di-hold pengunjung' })}
      ${UI.kpi({ label: 'Menunggu bayar', icon: 'pending', value: num(s.pending), vcls: s.pending ? 'text-amber-300' : 'text-on-surface', foot: 'batas bayar ' + Evt.PAY_MIN + ' menit' })}
    </div>`) + `
    <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
      <div class="2xl:col-span-8 flex flex-col gap-5">
        <section class="card p-5">${UI.h('Ketersediaan per kategori', 'Angka yang sama dilihat pengunjung di portal', '', 'stacked_bar_chart')}
          <div class="overflow-x-auto"><table class="tbl min-w-[640px]"><thead><tr><th>Kategori</th><th>Harga</th><th class="w-[38%]">Komposisi</th><th>Terjual</th><th>Dipesan</th><th>Tersedia</th><th>Tidak dijual</th><th>Check-in</th></tr></thead><tbody>
          ${e.types.map((ty) => { const p = s.per[ty.id]; const w = (k) => (p.total ? (p[k] / p.total) * 100 : 0); return `<tr><td><span class="inline-block w-2.5 h-2.5 rounded-full mr-2" style="background:${tc(e, ty)}"></span><b>${esc(ty.name)}</b>${ty.seated ? '' : '<div class="font-label-sm text-label-sm text-on-surface-variant">kuota tanpa kursi</div>'}</td><td class="font-label-md text-label-md">${rp(ty.price)}</td>
            <td><div class="flex h-2.5 rounded-full overflow-hidden bg-surface-container-highest"><div style="width:${w('sold')}%;background:${isMgr() ? 'rgb(var(--on-surface) / .16)' : '#64748b'}"></div><div style="width:${w('held')}%;background:${isMgr() ? '#FFC72C' : '#fb923c'}"></div><div style="width:${w('available')}%;background:${tc(e, ty)}"></div></div></td>
            <td class="font-label-md text-label-md">${p.sold}</td><td class="font-label-md text-label-md text-amber-300">${p.held}</td><td class="font-label-md text-label-md text-emerald-300">${p.available}</td><td class="font-label-md text-label-md text-on-surface-variant">${p.blocked}</td><td class="font-label-md text-label-md">${p.checkedIn}</td></tr>`; }).join('')}
          </tbody></table></div>
          <div class="flex flex-wrap gap-4 mt-3 font-label-sm text-label-sm text-on-surface-variant"><span><span class="inline-block w-2 h-2 rounded-full bg-slate-500 mr-1 lg-sold"></span>Terjual</span><span><span class="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1 lg-held"></span>Sedang dipesan</span><span><span class="inline-block w-2 h-2 rounded-full bg-sky-300 mr-1 lg-avail"></span>Tersedia</span></div></section>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <section class="card p-5">${UI.h('Tiket terjual per hari', '14 hari terakhir', '', 'trending_up')}${UI.line([{ data: perDay, color: isMgr() ? PRI : '#38bdf8' }], { labels: days.map((d, i) => (i % 3 === 0 ? new Date(d).getDate() + '/' + (new Date(d).getMonth() + 1) : '')), min: 0, h: 180 })}</section>
          <section class="card p-5">${UI.h('Arus check-in per 15 menit', '3 jam terakhir, semua gate', '', 'how_to_reg')}${UI.line([{ data: perSlot, color: isMgr() ? PRI : '#4edea3' }], { labels: slots.map((x, i) => (i % 3 === 0 ? Evt.fmtTime(x) : '')), min: 0, h: 180 })}</section>
        </div>
      </div>
      <div class="2xl:col-span-4 flex flex-col gap-5">
        ${anomPanel(e)}
        <section class="card p-5">${UI.h('Transaksi terbaru', '', `<button class="btn-ghost" data-tab="peserta">Semua transaksi</button>`, 'receipt_long')}
          <div class="flex flex-col gap-2">${recent.map((o) => `<button class="rel-row text-left w-full" data-order="${o.id}"><div class="flex-1 min-w-0"><div class="flex justify-between"><span class="font-label-lg text-label-lg">${o.id}</span>${oChip(o)}</div><div class="font-body-sm text-body-sm text-on-surface-variant truncate">${esc(o.name)} · ${o.items.map((i) => i.seat || Evt.typeById(e, i.type).name).join(', ')} · ${rp(o.total)}</div></div></button>`).join('')}</div></section>
        ${isMgr() ? '' : `<section class="card p-5">${UI.h('Dampak lintas dashboard', 'Prediksi dari tiket terjual', '', 'hub')}
          <div class="flex flex-col gap-2 font-body-sm text-body-sm">
            <div class="rel-row !cursor-default">${icon('local_parking', 'text-primary text-[18px]')}<div>Estimasi tambahan kendaraan <b>${num(Math.round(s.sold * 0.42))}</b> (1 mobil / 2,4 pengunjung) → ${UI.dbLink('PARK', '', 'Parkir & Mobilitas')}</div></div>
            <div class="rel-row !cursor-default">${icon('groups', 'text-primary text-[18px]')}<div>Kepadatan ${esc(e.venue.split(',')[0])}: ${num(s.sold)} orang, puncak ${Evt.fmtTime(e.doors + 3600000)} → ${UI.dbLink('CCTV', 'cam=CAM-01', 'CCTV Atrium')}</div></div>
            <div class="rel-row !cursor-default">${icon('hvac', 'text-primary text-[18px]')}<div>Pre-cooling atrium mulai ${Evt.fmtTime(e.doors - 3600000)} → ${UI.dbLink('BMS', '', 'BMS')}</div></div>
            <div class="rel-row !cursor-default">${icon('restaurant', 'text-primary text-[18px]')}<div>Info lonjakan pengunjung untuk tenant F&B → ${UI.dbLink('TEN', '', 'Layanan Tenant & SLA')}</div></div></div></section>`}
      </div></div>
    ${isMgr() ? '' : UI.relasi('EVT')}`;
  }

  // ------------------------------------------------------------------ tab: denah kursi
  function kursi(e, s) {
    const sel = ui.seatSel;
    let info = '<div class="font-body-sm text-body-sm text-on-surface-variant">Klik kursi untuk melihat detail pemesan.</div>';
    if (sel) {
      const x = Evt.s.seats[e.id][sel]; const st = Evt.seatStatus(e.id, sel, null); const ty = Evt.typeById(e, Evt.seatType(e, sel));
      const o = x && x.order && Evt.s.orders[x.order];
      const tk = o && o.tickets.map((id) => Evt.s.tickets[id]).find((t) => t.seat === sel);
      info = `<div class="flex items-center gap-3 mb-3"><span class="seat ${st} pointer-events-none" style="--c:${tc(e, ty)}">${sel}</span><div><div class="font-headline-sm text-headline-sm">Kursi ${sel}</div><div class="font-label-md text-label-md text-on-surface-variant">${esc(ty.name)} · ${rp(ty.price)} · ${Evt.STATUS_TXT[st]}</div></div></div>
        ${o ? `<div class="inner p-3 font-body-sm text-body-sm flex flex-col gap-1"><div class="flex justify-between"><b>${o.id}</b>${oChip(o)}</div><div>${esc(o.name)}</div><div class="text-on-surface-variant">${esc(o.email)} · ${esc(o.phone)}</div>${tk ? `<div>${tk.id} · ${tk.checkedInAt ? '<span class="text-emerald-300">check-in ' + Evt.fmtTime(tk.checkedInAt) + '</span>' : 'belum check-in'}</div>` : ''}${o.status === 'PENDING' ? `<div class="text-amber-300">Hold berakhir ${Evt.fmtTime(o.until)} WIB</div>` : ''}<button class="btn-ghost mt-2" data-order="${o.id}">Buka transaksi</button></div>` : x && x.st === 'HELD' ? `<div class="inner p-3 font-body-sm text-body-sm">Sedang dipilih pengunjung (keranjang ${esc(x.cart)}), belum membuat pesanan. Hold berakhir ${Evt.fmtTime(x.until)}.</div>` : ''}`;
    }
    return `<div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <section class="card p-5 2xl:col-span-9">${UI.h('Denah ' + esc(e.venue), isMgr() ? 'Ikut berubah saat ada pembelian atau check-in di perangkat lain' : 'Pemantauan langsung, hanya baca (perubahan denah dilakukan pengelola acara)', isMgr() ? `<div class="flex gap-2"><button class="chip-btn ${ui.seatMode === 'info' ? 'on' : ''}" data-smode="info">${icon('info', 'text-[14px]')} Mode info</button><button class="chip-btn ${ui.seatMode === 'block' ? 'on' : ''}" data-smode="block">${icon('block', 'text-[14px]')} Mode blokir kursi</button></div>` : '', 'event_seat')}
        ${ui.seatMode === 'block' ? '<div class="inner p-3 mb-3 font-body-sm text-body-sm text-amber-300">Mode blokir aktif. Klik kursi yang tersedia untuk menutupnya dari penjualan, misalnya untuk kamera atau kursi roda. Klik lagi untuk membukanya.</div>' : ''}
        <div class="admin-map">${recolor(e, Evt.seatMap(e.id, { admin: true }))}</div><div class="mt-4">${recolor(e, Evt.legend(e, { admin: true }))}</div></section>
      <div class="2xl:col-span-3 flex flex-col gap-5">
        <section class="card p-5">${UI.h('Detail kursi', '', '', 'chair')}${info}</section>
        <section class="card p-5">${UI.h('Ringkasan status', '', '', 'donut_small')}
          ${`<div class="flex justify-center">${UI.donut(isMgr() ? [{ v: s.sold, color: '#5B6577' }, { v: s.held, color: '#FFC72C' }, { v: s.available, color: PRI }, { v: s.blocked, color: '#C9D1DC' }] : [{ v: s.sold, color: '#64748b' }, { v: s.held, color: '#fb923c' }, { v: s.available, color: '#38bdf8' }, { v: s.blocked, color: '#334155' }], { center: num(s.sold), sub: 'terjual' })}</div>`}
          <div class="grid grid-cols-2 gap-2 mt-3 font-label-md text-label-md"><span>Terjual <b>${s.sold}</b></span><span class="text-amber-300">Dipesan <b>${s.held}</b></span><span class="text-emerald-300">Tersedia <b>${s.available}</b></span><span class="text-on-surface-variant">Tidak dijual <b>${s.blocked}</b></span></div></section>
        ${isMgr() ? `<p class="font-body-sm text-body-sm text-on-surface-variant px-1">${icon('science', 'text-[16px] align-middle')} Untuk uji rebutan kursi atau uji tekan, buka pencarian (Ctrl K) dan ketik "uji". Uji tekan memakai kursi yang Anda pilih di denah.</p>` : ''}
      </div></div>`;
  }

  // ------------------------------------------------------------------ tab: kelola acara
  // Uang: tampil "Rp 1.500.000" saat diketik, disimpan sebagai angka.
  const rpFmt = (n) => 'Rp ' + Math.max(0, Math.round(+n || 0)).toLocaleString('id-ID');
  const rpVal = (v) => +String(v || '').replace(/\D/g, '') || 0;
  const rpInput = (name, val) => `<input class="inp" name="${esc(name)}" value="${rpFmt(val)}" inputmode="numeric" autocomplete="off" data-rp>`;
  function finFields(e) {
    const raw = Object.assign({}, Evt.FIN_DEFAULT, e.fin);
    const fin = { rent: +raw.rent || 0, revShare: +raw.revShare || 0, cost: +raw.cost || 0, spend: +raw.spend || 0 }; // angka saja
    return `<h3 class="pg-form-h col-span-2">Kontrak venue</h3>
          <p class="pg-form-sub col-span-2">Sesuai perjanjian dengan mall. Dipakai untuk menghitung ROI di Keuangan.</p>
          <label class="f">Sewa venue${rpInput('finRent', fin.rent)}</label>
          <label class="f">Bagi hasil tiket ke mall (%)<input class="inp" type="number" min="0" max="100" step="0.5" name="finShare" value="${+(fin.revShare * 100).toFixed(2)}"></label>
          <label class="f">Biaya operasional mall${rpInput('finCost', fin.cost)}</label>
          <label class="f">Rata-rata belanja pengunjung di tenant${rpInput('finSpend', fin.spend)}</label>`;
  }
  const POSTER = { w: 960, h: 540, maxMb: 5 };
  function typeBlock(e, ty, s) {
    const p = s.per[ty.id], k = 't.' + ty.id + '.';
    return `<div role="group" class="pg-type" data-type="${ty.id}" style="--c:${tc(e, ty)}">
      <div class="pg-type-h col-span-2"><span class="pg-type-dot"></span>${esc(ty.name)}<small>${ty.seated ? 'kursi bernomor' : 'kuota tanpa kursi'}, terjual ${p.sold}, tersedia ${p.available}</small></div>
      <label class="f">Nama<input class="inp" name="${k}name" value="${esc(ty.name)}" maxlength="40" required></label>
      <label class="f">Harga${rpInput(k + 'price', ty.price)}</label>
      ${ty.seated ? `<div class="f">Kuota<div class="inp pg-ro">${p.total - p.blocked} kursi, mengikuti denah</div></div>` : `<label class="f">Kuota<input class="inp" type="number" min="${p.sold + p.held}" name="${k}quota" value="${ty.quota}"></label>`}
      <label class="f">Dijual<select class="inp" name="${k}onSale"><option value="1" ${ty.onSale ? 'selected' : ''}>Ya</option><option value="0" ${ty.onSale ? '' : 'selected'}>Tidak (undangan)</option></select></label>
      <label class="f col-span-2">Benefit<input class="inp" name="${k}perks" value="${esc(ty.perks || '')}" maxlength="80"></label></div>`;
  }
  let newSeq = 0;
  const newTypeBlock = () => { const n = ++newSeq, k = 'n.' + n + '.'; return `<div role="group" class="pg-type is-new" data-new="${n}">
      <div class="pg-type-h col-span-2"><span class="pg-type-dot"></span>Jenis tiket baru<small>kuota tanpa kursi bernomor</small><button type="button" class="pg-type-del" data-del-new="${n}" aria-label="Hapus jenis tiket baru">${icon('close', 'text-[18px]')}</button></div>
      <label class="f">Nama<input class="inp" name="${k}name" maxlength="40" placeholder="Misalnya Early bird" required></label>
      <label class="f">Harga${rpInput(k + 'price', 0)}</label>
      <label class="f">Kuota<input class="inp" type="number" min="1" name="${k}quota" placeholder="100" required></label>
      <label class="f">Dijual<select class="inp" name="${k}onSale"><option value="1">Ya</option><option value="0">Tidak (undangan)</option></select></label>
      <label class="f col-span-2">Benefit<input class="inp" name="${k}perks" maxlength="80" placeholder="Opsional"></label></div>`; };
  // Pilihan area + ketersediaan untuk rentang waktu (Pengaturan dan panel Acara baru). Area yang dipakai acara lain nonaktif.
  function areaOptions(start, end, sel, exceptId) {
    const opt = (a) => { const c = start > 0 && end > start ? Evt.areaClash(a.id, start, end, exceptId) : [], off = c.length && a.id !== sel;
      return `<option value="${a.id}"${a.id === sel ? ' selected' : ''}${off ? ' disabled' : ''}>${esc(a.name)}${a.floor ? ' (' + a.floor + ')' : ''}, ${c.length ? 'dipakai ' + esc(c[0].name) + ' ' + Evt.fmtShort(c[0].start) : 'tersedia'}</option>`; };
    // Area lama (data contoh versi sebelumnya) atau belum ada: jangan biarkan browser memilih opsi pertama diam-diam.
    const unknown = !Evt.AREAS.some((a) => a.id === sel);
    return (unknown ? `<option value="" selected>${sel ? 'Area lama, pilih area baru' : 'Pilih area'}</option>` : '') + `<optgroup label="Indoor">${Evt.AREAS.filter((a) => a.kind === 'Indoor').map(opt).join('')}</optgroup><optgroup label="Outdoor & semi-outdoor">${Evt.AREAS.filter((a) => a.kind !== 'Indoor').map(opt).join('')}</optgroup>`;
  }
  function areaInfo(id) {
    const a = Evt.AREAS.find((x) => x.id === id); if (!a) return '';
    return `<div class="area-info">${icon(a.parking ? 'local_parking' : 'place', 'text-[20px]')}<div class="min-w-0"><b>${esc(a.name)}</b><span>${a.floor ? 'Lantai ' + a.floor : 'Luar gedung'}, ${a.kind.toLowerCase()}${a.size ? ', ' + a.size : ''}. Cocok untuk ${esc(a.fit.toLowerCase())}.</span>${a.parking ? '<p>Memakai lahan parkir. Kapasitas parkir berkurang selama acara, diperiksa Operasional Mall.</p>' : ''}</div></div>`;
  }
  function kelola(e) {
    ui.dirty = false;
    if (e.status === 'CANCELLED') return `<section class="card p-8 crit-left">${UI.h('Acara dibatalkan', 'Dibatalkan ' + Evt.fmtDT(e.cancelledAt) + (e.cancelReason ? ' (' + esc(e.cancelReason) + ')' : ''), '', 'event_busy')}<p class="font-body-sm text-body-sm text-on-surface-variant mb-4">Semua pesanan lunas sudah di-refund dan peserta sudah dikabari. Data acara tidak bisa diubah lagi. Bila tidak diperlukan, hapus acara lewat menu ⋯ di atas.</p><button class="btn-ghost" data-tab="acara">${icon('event_note', 'text-[16px]')} Ke Semua acara</button></section>`;
    const s = Evt.stats(e.id);
    return `<form id="f-ev" novalidate>
      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <section class="card p-5 2xl:col-span-7">${UI.h('Informasi acara', 'Perubahan tampil di portal pengunjung dan Command Center setelah disimpan', '', 'edit_calendar')}
        ${e.status === 'DRAFT' ? `<div class="inner p-3 mb-4"><div class="lbl mb-2">Kesiapan publikasi</div><ul class="pg-ready">${readiness(e).map((x) => `<li class="${x.ok ? 'ok' : x.warn ? 'warn' : 'miss'}">${icon(x.ok ? 'check_circle' : x.warn ? 'info' : 'radio_button_unchecked', 'text-[18px]')}<b>${x.label}</b><span>${x.hint}</span></li>`).join('')}</ul></div>` : ''}
        <div class="pg-poster">
          <div class="pg-poster-prev" id="poster-prev">${e.img ? `<img src="${esc(e.img)}" alt="Poster ${esc(e.name)}">` : `<span>${icon('image', 'text-[28px]')}Belum ada poster</span>`}</div>
          <div class="pg-poster-info">
            <b>Poster acara</b>
            <p>JPG, PNG, atau WebP, maksimal ${POSTER.maxMb} MB. Rasio 16:9, disarankan 1600 × 900 piksel (minimal ${POSTER.w} × ${POSTER.h}). Poster dipotong ke 16:9 dan diperkecil ke ${POSTER.w} × ${POSTER.h} agar cepat dimuat di portal.</p>
            <div class="flex flex-wrap gap-2"><label class="btn-ghost pg-upload">${icon('upload', 'text-[18px]')} ${e.img ? 'Ganti poster' : 'Unggah poster'}<input type="file" accept="image/jpeg,image/png,image/webp" id="poster-file" class="sr-only"></label><button type="button" class="btn-ghost" id="poster-del"${e.img ? '' : ' hidden'}>${icon('delete', 'text-[18px]')} Hapus poster</button></div>
            <p class="pg-poster-msg" id="poster-msg" role="status"></p>
            <input type="hidden" name="img" value="${esc(e.img || '')}">
          </div>
        </div>
        <div class="pg-form grid grid-cols-2 gap-4">
          <label class="f col-span-2">Nama acara<input class="inp" name="name" value="${esc(e.name)}" maxlength="80" required></label>
          <label class="f col-span-2">Tagline<input class="inp" name="tagline" value="${esc(e.tagline)}" maxlength="120"></label>
          <label class="f">Kategori<select class="inp" name="cat">${catOptions(e.cat)}</select></label>
          <div class="f">Status<div class="inp pg-ro flex items-center gap-2">${evChip(e)}<span class="font-label-sm text-label-sm text-on-surface-variant">ubah lewat tombol di atas</span></div></div>
          <label class="f">Mulai acara<input class="inp" type="datetime-local" name="start" value="${dtl(e.start)}" required></label>
          <label class="f">Selesai acara<input class="inp" type="datetime-local" name="end" value="${dtl(e.end || e.start + 3 * 3600000)}" required></label>
          <label class="f">Gate dibuka<input class="inp" type="datetime-local" name="doors" value="${dtl(e.doors)}" required></label>
          <label class="f">Penjualan dibuka<input class="inp" type="datetime-local" name="saleStart" value="${dtl(e.saleStart)}" required></label>
          <label class="f">Penjualan ditutup<input class="inp" type="datetime-local" name="saleEnd" value="${dtl(e.saleEnd)}" required></label>
          ${(() => { const locked = e.approval && ['DIAJUKAN', 'DISETUJUI'].includes(e.approval.st); return `<label class="f col-span-2">Area<select class="inp" name="area" id="ev-area"${locked ? ' disabled' : ''}>${areaOptions(e.start, e.end || e.start + 3 * 3600000, e.area, e.id)}</select>${locked ? '<small class="font-label-sm text-label-sm text-on-surface-variant">Area dikunci setelah diajukan</small>' : ''}</label><div class="col-span-2" id="ev-area-info">${areaInfo(e.area)}</div>`; })()}
          <label class="f">Durasi hold kursi (menit)<input class="inp" type="number" min="2" max="30" name="holdMin" value="${e.holdMin}"></label>
          <label class="f">Maks tiket per pesanan<input class="inp" type="number" min="1" max="10" name="maxPerOrder" value="${e.maxPerOrder}"></label>
          <label class="f col-span-2">Gate check-in (pisahkan dengan koma)<input class="inp" name="gates" value="${esc(e.gates.join(', '))}"></label>
          <label class="f col-span-2">Deskripsi<textarea class="inp" name="desc" rows="3">${esc(e.desc)}</textarea></label>
          ${finFields(e)}
        </div></section>
      <section class="card p-5 2xl:col-span-5">${UI.h('Jenis tiket, harga & kuota', 'Kuota kursi bernomor mengikuti denah. Untuk menutup kursi, pakai mode blokir di Denah kursi.', '', 'sell')}
        <div class="flex flex-col gap-3" id="type-list">${e.types.map((ty) => typeBlock(e, ty, s)).join('')}</div>
        <button type="button" class="btn-ghost w-full justify-center mt-3 pg-add-type" id="add-type">${icon('add', 'text-[18px]')} Tambah jenis tiket</button>
      </section></div>
      <div class="pg-savebar" id="savebar"><span id="save-state">Belum ada perubahan</span><div class="flex gap-2"><button type="button" class="btn-ghost" id="ev-reset" disabled>Batalkan</button><button class="btn" id="ev-save" disabled>${icon('save', 'text-[18px]')} Simpan semua perubahan</button></div></div>
    </form>`;
  }
  // Poster: potong ke 16:9 & perkecil ke 960x540 JPEG (dikirim ke semua perangkat lewat state, jadi dijaga kecil).
  function posterFrom(file) {
    return new Promise((res, rej) => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return rej(new Error('Format harus JPG, PNG, atau WebP.'));
      if (file.size > POSTER.maxMb * 1048576) return rej(new Error(`Ukuran file ${(file.size / 1048576).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB, maksimal ${POSTER.maxMb} MB.`));
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const c = document.createElement('canvas'); c.width = POSTER.w; c.height = POSTER.h; const g = c.getContext('2d');
        const r = Math.max(POSTER.w / img.naturalWidth, POSTER.h / img.naturalHeight), w = img.naturalWidth * r, h = img.naturalHeight * r;
        g.fillStyle = '#fff'; g.fillRect(0, 0, POSTER.w, POSTER.h); g.drawImage(img, (POSTER.w - w) / 2, (POSTER.h - h) / 2, w, h);
        let q = 0.82, out = c.toDataURL('image/jpeg', q);
        while (out.length > 160000 && q > 0.45) { q -= 0.08; out = c.toDataURL('image/jpeg', q); }
        res({ data: out, w: img.naturalWidth, h: img.naturalHeight, kb: Math.round((out.length * 0.75) / 1024) });
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('File gambar tidak bisa dibaca.')); };
      img.src = url;
    });
  }
  function bindKelola(el, e) {
    const fe = el.querySelector('#f-ev'); if (!fe) return;
    const st = fe.querySelector('#save-state'), save = fe.querySelector('#ev-save'), reset = fe.querySelector('#ev-reset');
    const dirty = () => { if (ui.dirty) return; ui.dirty = true; st.textContent = 'Ada perubahan yang belum disimpan'; fe.querySelector('#savebar').classList.add('on'); save.disabled = false; reset.disabled = false; };
    fe.addEventListener('input', dirty); fe.addEventListener('change', (ev) => { if (ev.target.id !== 'poster-file') dirty(); });
    // Area: ketersediaan diperbarui saat tanggal atau area berubah
    const ar = fe.querySelector('#ev-area');
    const updArea = () => { if (!ar || ar.disabled) return; const v = ar.value; ar.innerHTML = areaOptions(new Date(fe.elements.start.value).getTime(), new Date(fe.elements.end.value).getTime(), v, e.id); ar.value = v; fe.querySelector('#ev-area-info').innerHTML = areaInfo(v); };
    ['start', 'end', 'area'].forEach((n) => fe.elements[n] && fe.elements[n].addEventListener('change', updArea));
    // format uang saat diketik
    fe.addEventListener('input', (ev) => { const x = ev.target; if (!x.matches('[data-rp]')) return; const d = String(x.value).replace(/\D/g, ''); x.value = d ? rpFmt(+d) : ''; });
    fe.addEventListener('focusout', (ev) => { const x = ev.target; if (x.matches('[data-rp]') && !x.value) x.value = rpFmt(0); });
    // poster
    const pf = fe.querySelector('#poster-file'), msg = fe.querySelector('#poster-msg'), prev = fe.querySelector('#poster-prev'), hid = fe.querySelector('[name=img]'), del = fe.querySelector('#poster-del');
    pf.addEventListener('change', async () => {
      const file = pf.files[0]; pf.value = ''; if (!file) return;
      msg.className = 'pg-poster-msg'; msg.textContent = 'Memproses poster…';
      try {
        const r = await posterFrom(file);
        hid.value = r.data; prev.innerHTML = `<img src="${r.data}" alt="Poster baru">`; del.hidden = false; dirty();
        const warn = [];
        if (r.w < POSTER.w || r.h < POSTER.h) warn.push(`resolusi ${r.w} × ${r.h} di bawah ${POSTER.w} × ${POSTER.h}, poster bisa tampak buram`);
        if (Math.abs(r.w / r.h - 16 / 9) > 0.08) warn.push('rasio bukan 16:9, sebagian gambar terpotong');
        msg.className = 'pg-poster-msg ' + (warn.length ? 'warn' : 'ok');
        msg.textContent = `Poster ${r.w} × ${r.h} diperkecil ke ${POSTER.w} × ${POSTER.h} (${r.kb} KB).` + (warn.length ? ' Perhatian: ' + warn.join('; ') + '.' : '') + ' Tekan Simpan semua perubahan untuk memakainya.';
      } catch (err) { msg.className = 'pg-poster-msg bad'; msg.textContent = err.message; }
    });
    del.addEventListener('click', () => { hid.value = ''; prev.innerHTML = `<span>${icon('image', 'text-[28px]')}Belum ada poster</span>`; del.hidden = true; msg.className = 'pg-poster-msg'; msg.textContent = 'Poster akan dihapus setelah disimpan.'; dirty(); });
    // jenis tiket baru
    const list = fe.querySelector('#type-list');
    fe.querySelector('#add-type').addEventListener('click', () => { list.insertAdjacentHTML('beforeend', newTypeBlock()); const b = list.lastElementChild; b.querySelector('input').focus(); dirty(); });
    list.addEventListener('click', (ev) => { const b = ev.target.closest('[data-del-new]'); if (b) { b.closest('[data-new]').remove(); dirty(); } });
    reset.addEventListener('click', () => { ui.dirty = false; redraw(); UI.toast('Perubahan dibatalkan', 'P4'); });
    fe.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = Object.fromEntries(new FormData(fe));
      const bad = (name, text) => { const x = fe.querySelector(`[name="${name}"]`); if (x) { x.focus(); x.setAttribute('aria-invalid', 'true'); } UI.toast(text, 'P2'); return null; };
      fe.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
      if (!f.name.trim()) return bad('name', 'Nama acara wajib diisi.');
      const patch = { name: f.name.trim(), tagline: f.tagline.trim(), cat: f.cat, ...(f.area ? { area: f.area } : {}), desc: f.desc.trim(), img: f.img || '', start: new Date(f.start).getTime(), end: new Date(f.end).getTime(), doors: new Date(f.doors).getTime(), saleStart: new Date(f.saleStart).getTime(), saleEnd: new Date(f.saleEnd).getTime(), holdMin: Math.min(30, Math.max(2, +f.holdMin || 8)), maxPerOrder: Math.min(10, Math.max(1, +f.maxPerOrder || 4)), gates: f.gates.split(',').map((x) => x.trim()).filter(Boolean),
        fin: { rent: rpVal(f.finRent), revShare: Math.min(100, Math.max(0, +f.finShare || 0)) / 100, cost: rpVal(f.finCost), spend: rpVal(f.finSpend) } };
      if (!(patch.start > 0) || !(patch.doors > 0) || !(patch.saleStart > 0) || !(patch.saleEnd > 0)) return bad('start', 'Lengkapi semua tanggal dan jam.');
      if (!(patch.end > patch.start)) return bad('end', 'Acara harus selesai setelah mulai.');
      if (patch.doors > patch.start) return bad('doors', 'Jam gate dibuka harus sebelum acara mulai.');
      if (patch.saleEnd <= patch.saleStart) return bad('saleEnd', 'Penjualan ditutup harus setelah penjualan dibuka.');
      if (!patch.gates.length) return bad('gates', 'Isi minimal satu gate check-in.');
      const types = {};
      for (const ty of e.types) {
        const g = (k) => f['t.' + ty.id + '.' + k];
        if (g('name') == null) continue;
        if (!g('name').trim()) return bad('t.' + ty.id + '.name', 'Nama jenis tiket wajib diisi.');
        types[ty.id] = { name: g('name').trim(), price: rpVal(g('price')), onSale: g('onSale') === '1', perks: (g('perks') || '').trim() };
        if (!ty.seated) { const q = +g('quota'); if (!(q >= 0)) return bad('t.' + ty.id + '.quota', 'Kuota ' + ty.name + ' harus angka.'); types[ty.id].quota = q; }
      }
      const add = [];
      for (const fs of fe.querySelectorAll('[data-new]')) {
        const g = (k) => f['n.' + fs.dataset.new + '.' + k];
        if (!(g('name') || '').trim()) return bad('n.' + fs.dataset.new + '.name', 'Beri nama jenis tiket baru.');
        if (!(+g('quota') > 0)) return bad('n.' + fs.dataset.new + '.quota', 'Isi kuota jenis tiket baru (minimal 1).');
        add.push({ name: g('name').trim(), price: rpVal(g('price')), quota: +g('quota'), onSale: g('onSale') === '1', perks: (g('perks') || '').trim() });
      }
      save.disabled = true; st.textContent = 'Menyimpan…';
      const r = await act(() => Evt.saveEvent(e.id, { patch, types, add }), 'Perubahan ' + e.id + ' disimpan' + (add.length ? ', ' + add.length + ' jenis tiket ditambahkan' : ''));
      if (r === null) { save.disabled = false; st.textContent = 'Belum tersimpan. Periksa pesan di atas lalu coba lagi.'; return; }
      ui.dirty = false; redraw();
    });
  }

  // ------------------------------------------------------------------ tab: peserta & transaksi
  function pesertaTable(e) {
    const q = ui.q.toLowerCase();
    const list = Evt.stats(e.id).orders.filter((o) => { const st = o.status === 'PENDING' && o.until < Evt.now() ? 'EXPIRED' : o.status; return (ui.st === 'ALL' || st === ui.st) && (!q || [o.id, o.name, o.email, o.phone, ...o.items.map((i) => i.seat || '')].join(' ').toLowerCase().includes(q)); }).sort((a, b) => b.createdAt - a.createdAt);
    return `<div class="font-label-md text-label-md text-on-surface-variant mb-2">${list.length} transaksi</div><div class="overflow-x-auto"><table class="tbl"><thead><tr><th>Booking</th><th>Peserta</th><th>Tiket</th><th>Total</th><th>Metode</th><th>Status</th><th>Kehadiran</th><th>Dibuat</th></tr></thead><tbody>
      ${list.slice(0, 120).map((o) => { const ck = o.tickets.filter((id) => Evt.s.tickets[id].checkedInAt).length; return `<tr class="row" data-order="${o.id}"><td class="font-label-lg text-label-lg">${o.id}</td><td><div class="font-body-sm text-body-sm">${esc(o.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${esc(o.email)} · ${esc(o.phone)}</div></td><td class="font-label-md text-label-md">${o.items.map((i) => `<span class="inline-block mr-1"><span class="inline-block w-2 h-2 rounded-full" style="background:${tc(e, Evt.typeById(e, i.type))}"></span> ${i.seat || Evt.typeById(e, i.type).name}</span>`).join('')}</td><td class="font-label-md text-label-md whitespace-nowrap">${rp(o.total)}</td><td class="font-body-sm text-body-sm">${o.method || '-'}</td><td>${oChip(o)}</td><td class="font-label-md text-label-md">${o.tickets.length ? ck + '/' + o.tickets.length : '-'}</td><td class="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">${Evt.fmtDT(o.createdAt)}</td></tr>`; }).join('')}
      </tbody></table></div>${list.length > 120 ? '<div class="font-label-sm text-label-sm text-on-surface-variant mt-2">Menampilkan 120 transaksi terbaru. Gunakan pencarian atau ekspor CSV untuk data lengkap.</div>' : ''}`;
  }
  function peserta(e) {
    const sts = [['ALL', 'Semua'], ['PAID', 'Lunas'], ['PENDING', 'Menunggu bayar'], ['EXPIRED', 'Kedaluwarsa'], ['CANCELLED', 'Batal'], ['REFUNDED', 'Refund']];
    return `<section class="card p-5">${UI.h('Data peserta & status pembayaran', isMgr() ? 'Klik baris untuk mengubah data peserta, mengirim ulang e-ticket, atau refund' : 'Pemantauan transaksi, hanya baca (refund & perubahan data oleh pengelola acara)', `<div class="flex gap-2"><button class="btn-ghost" id="csv-p">${icon('download', 'text-[16px]')} Peserta (CSV)</button><button class="btn-ghost" id="csv-t">${icon('download', 'text-[16px]')} Transaksi (CSV)</button></div>`, 'groups')}
      <div class="flex flex-wrap gap-2 items-center mb-4"><input class="inp !w-80" id="q" placeholder="Cari booking, nama, email, HP, kursi…" value="${esc(ui.q)}">${sts.map(([k, l]) => `<button class="chip-btn ${ui.st === k ? 'on' : ''}" data-st="${k}">${l}</button>`).join('')}</div>
      <div id="evt-table">${pesertaTable(e)}</div></section>`;
  }

  // ------------------------------------------------------------------ tab: keuangan & ROI (Finance & Marketing)
  function keuangan(e) {
    const f = Evt.finance(e.id), T = f.totals, R = f.roi;
    const pct = (x) => (x * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%';
    const money = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
    const row = (k, v, cls) => `<div class="flex justify-between gap-3 py-1.5"><span class="text-on-surface-variant">${k}</span><b class="${cls || ''}">${v}</b></div>`;
    return `<div class="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
      ${UI.kpi({ key: K('fin:gross'), label: 'Bruto', icon: 'payments', value: rpJt(T.gross), unit: T.gross >= 1e6 ? 'Jt' : '', foot: T.orders + ' transaksi lunas & refund' })}
      ${UI.kpi({ key: K('fin:refund'), label: 'Refund', icon: 'currency_exchange', value: rpJt(T.refunded), unit: T.refunded >= 1e6 ? 'Jt' : '', vcls: T.refunded ? 'text-amber-300' : 'text-on-surface', foot: 'dikembalikan ke peserta' })}
      ${UI.kpi({ key: K('fin:net'), label: 'Neto', icon: 'account_balance_wallet', value: rpJt(T.net), unit: T.net >= 1e6 ? 'Jt' : '', vcls: 'text-emerald-300', foot: 'bruto dikurangi refund' })}
      ${UI.kpi({ key: K('fin:fee'), label: 'Biaya layanan', icon: 'receipt', value: rpJt(T.fee), unit: T.fee >= 1e6 ? 'Jt' : '', foot: rp(Evt.FEE) + ' per tiket berbayar' })}
      ${UI.kpi({ key: K('fin:mm'), label: 'Selisih rekonsiliasi', icon: f.mismatches.length ? 'error' : 'verified', value: f.mismatches.length, vcls: f.mismatches.length ? 'text-rose-300' : 'text-emerald-300', foot: f.mismatches.length ? 'pesanan perlu diperiksa' : 'semua pesanan cocok' })}</div>
    <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <div class="2xl:col-span-7 flex flex-col gap-5">
        <section class="card p-5">${UI.h('Rekonsiliasi per metode pembayaran', 'Setiap pesanan dicek: total harus sama dengan subtotal ditambah biaya layanan, dan jumlah e-ticket sama dengan jumlah tiket', `<div class="flex gap-2">${isMgr() ? `<button class="btn-ghost" data-report-ev="${e.id}">${icon('picture_as_pdf', 'text-[16px]')} Laporan PDF</button>` : ''}<button class="btn-ghost" id="csv-fin">${icon('download', 'text-[16px]')} Rekonsiliasi (CSV)</button></div>`, 'account_balance')}
          <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>Metode</th><th>Transaksi</th><th>Bruto</th><th>Refund</th><th>Neto</th></tr></thead><tbody>
          ${f.byMethod.map((m) => `<tr><td class="font-body-sm text-body-sm">${esc(m.method)}</td><td class="font-label-md text-label-md">${m.orders}</td><td class="font-label-md text-label-md whitespace-nowrap">${money(m.gross)}</td><td class="font-label-md text-label-md whitespace-nowrap text-amber-300">${money(m.refunded)}</td><td class="font-label-md text-label-md whitespace-nowrap">${money(m.net)}</td></tr>`).join('') || '<tr><td colspan="5" class="text-on-surface-variant">Belum ada transaksi.</td></tr>'}
          <tr><td><b>Total</b></td><td class="font-label-md text-label-md"><b>${T.orders}</b></td><td class="font-label-md text-label-md whitespace-nowrap"><b>${money(T.gross)}</b></td><td class="font-label-md text-label-md whitespace-nowrap text-amber-300"><b>${money(T.refunded)}</b></td><td class="font-label-md text-label-md whitespace-nowrap"><b>${money(T.net)}</b></td></tr></tbody></table></div>
          ${f.mismatches.length ? `<div class="flex flex-col gap-2 mt-3">${f.mismatches.map((m) => `<button class="rel-row text-left w-full" data-order="${esc(m.order)}">${icon('error', 'text-rose-300 text-[18px]')}<div class="flex-1"><b>${esc(m.order)}</b><div class="font-body-sm text-body-sm text-on-surface-variant">${esc(m.reason)}</div></div></button>`).join('')}</div>` : ''}</section>
        <section class="card p-5">${UI.h('Laporan penjualan per kategori', 'Pesanan lunas, dihitung dengan harga saat pembelian', '', 'sell')}
          <table class="tbl"><thead><tr><th>Kategori</th><th>Tiket</th><th>Pendapatan tiket</th></tr></thead><tbody>
          ${f.byType.map((b) => `<tr><td><span class="inline-block w-2.5 h-2.5 rounded-full mr-2" style="background:${tc(e, Evt.typeById(e, b.type))}"></span>${esc(b.name)}</td><td class="font-label-md text-label-md">${b.qty}</td><td class="font-label-md text-label-md whitespace-nowrap">${money(b.gross)}</td></tr>`).join('') || '<tr><td colspan="3" class="text-on-surface-variant">Belum ada tiket terjual.</td></tr>'}</tbody></table></section></div>
      <div class="2xl:col-span-5 flex flex-col gap-5">
        <section class="card p-5">${UI.h('ROI acara untuk mall', 'Manfaat = sewa venue + bagi hasil tiket. ROI = (manfaat - biaya) / biaya', '', 'trending_up')}
          <div class="font-body-sm text-body-sm">${row('Sewa venue', money(R.rent))}${row('Bagi hasil tiket (' + pct(R.revShare) + ' dari pendapatan tiket)', money(R.share))}${row('Total manfaat', money(R.benefit))}${row('Biaya operasional mall', money(R.cost))}${row('ROI', R.roi == null ? '-' : pct(R.roi), R.roi == null ? '' : R.roi >= 0 ? 'text-emerald-300' : 'text-rose-300')}</div>
          <div class="inner p-3 mt-4 font-body-sm text-body-sm">${icon('storefront', 'text-primary text-[16px] align-middle')} Estimasi belanja pengunjung di tenant: <b>${money(R.tenantSpend)}</b><div class="text-on-surface-variant">${num(R.attendees)} pengunjung (${R.basis}) × ${money(R.spend)}. Tidak dihitung dalam ROI.</div></div>
          <p class="font-label-sm text-label-sm text-on-surface-variant mt-3">Angka sewa, bagi hasil, biaya dan belanja adalah asumsi${isMgr() ? ', ubah di tab Kelola acara sesuai perjanjian dengan mall.' : ' dari pengelola acara (diisi di Konsol Pengelola).'}</p></section></div></div>`;
  }

  // ------------------------------------------------------------------ tab: check-in
  function ckStats(e, noAnom) {
    const s = Evt.stats(e.id);
    const byGate = {}; Object.values(Evt.s.tickets).filter((t) => t.ev === e.id && t.checkedInAt).forEach((t) => (byGate[t.gate] = (byGate[t.gate] || 0) + 1));
    const a = anomList(e);
    return `${a.alert && !noAnom ? `<div class="flex flex-col gap-2 mb-4">${a.html}</div>` : ''}
      <div class="grid grid-cols-2 gap-3 mb-4">${UI.kpi({ label: 'Sudah check-in', value: num(s.checkedIn), unit: '/ ' + num(s.tickets), bar: s.tickets ? (s.checkedIn / s.tickets) * 100 : 0, barcls: 'bg-secondary' })}${UI.kpi({ label: 'Belum hadir', value: num(s.tickets - s.checkedIn), foot: 'Gate dibuka ' + Evt.fmtTime(e.doors) })}</div>
      <div class="flex flex-col gap-2 mb-4">${e.gates.map((g) => `<div class="inner px-3 py-2 flex justify-between font-body-sm text-body-sm"><span>${esc(g)}</span><b>${byGate[g] || 0}</b></div>`).join('')}</div>`;
  }
  // Panel anomali & laporan gate di atas halaman Check-in; kosong bila tidak ada anomali maupun laporan.
  const ckAnom = (e) => (EvtCheckin.anomalies(e.id).length || Evt.s.reports.some((r) => r.ev === e.id) ? anomPanel(e) : '');
  function checkin(e) {
    ui.gate = e.gates.includes(ui.gate) ? ui.gate : e.gates[0];
    return `<div id="ck-anom" class="pg-ck-anom">${ckAnom(e)}</div><div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <section class="card p-5 2xl:col-span-5">${UI.h('Pemindai gate', 'Pindai QR e-ticket pengunjung yang datang', `<a class="btn-ghost" href="/checkin" target="_blank" rel="noopener">${icon('smartphone', 'text-[16px]')} Versi ponsel</a>`, 'qr_code_scanner')}
        <label class="f mb-3">Gate<select class="inp" id="gate">${e.gates.map((g) => `<option ${g === ui.gate ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></label>
        ${EvtCheckin.panel()}</section>
      <div class="2xl:col-span-7 flex flex-col gap-5">
        <section class="card p-5"><div id="ck-stats">${ckStats(e, true)}</div></section>
        <section class="card p-5">${UI.h('Log pindaian', 'Semua gate', '', 'list_alt')}<div id="ck-log">${EvtCheckin.logTable(e.id, 30)}</div></section></div></div>`;
  }

  // ------------------------------------------------------------------ tab: notifikasi & waitlist
  const WL_REASON = { refund: 'refund', kedaluwarsa: 'pesanan kedaluwarsa', batal: 'pesanan batal', 'acara-batal': 'acara dibatalkan', manual: 'manual' };
  function notif(e) {
    const ids = new Set(Evt.stats(e.id).orders.map((o) => o.id));
    const wl = Evt.s.waitlist.filter((w) => w.ev === e.id);
    const msgs = Evt.s.outbox.filter((m) => (ids.has(m.order) || wl.some((w) => w.id === m.order)) && (ui.ch === 'ALL' || m.ch === ui.ch)).slice(0, 80);
    return `<div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <section class="card p-5 2xl:col-span-8">${UI.h('Pesan email & WhatsApp', 'Pesan e-ticket, instruksi bayar, pengingat, dan refund. Ini simulasi, jadi tidak ada pesan yang terkirim', `<div class="flex gap-2">${['ALL', 'Email', 'WhatsApp'].map((c) => `<button class="chip-btn ${ui.ch === c ? 'on' : ''}" data-ch="${c}">${c === 'ALL' ? 'Semua' : c}</button>`).join('')}</div>`, 'outbox')}
        <div class="overflow-x-auto"><table class="tbl min-w-[640px]"><thead><tr><th>Waktu</th><th>Kanal</th><th>Penerima</th><th>Pesan</th></tr></thead><tbody>${msgs.map((m) => `<tr><td class="font-label-md text-label-md whitespace-nowrap">${Evt.fmtDT(m.ts)}</td><td>${icon(m.ch === 'Email' ? 'mail' : 'chat', 'text-[18px] ' + (m.ch === 'Email' ? 'text-primary' : 'text-emerald-300'))}</td><td class="font-body-sm text-body-sm">${esc(m.to)}<div class="font-label-sm text-label-sm text-on-surface-variant">${m.order}</div></td><td class="font-body-sm text-body-sm"><b>${esc(m.subject)}</b><div class="text-on-surface-variant">${esc(m.body)}</div></td></tr>`).join('')}</tbody></table></div></section>
      <div class="2xl:col-span-4 flex flex-col gap-5">
        <section class="card p-5">${UI.h('Pengingat acara', Evt.fmtDT(e.start) + ' · ' + Evt.stats(e.id).paid.length + ' pemesan lunas', '', 'notifications_active')}
          <p class="font-body-sm text-body-sm text-on-surface-variant mb-3">Pengingat berisi jadwal, lokasi, jam gate dibuka, dan QR. Dikirim lewat email dan WhatsApp ke semua pemesan lunas. Di versi produksi, pengingat terkirim sendiri H-1 dan 3 jam sebelum acara.</p>
          <button class="btn w-full justify-center" id="remind">${icon('send')} Kirim pengingat</button></section>
        <section class="card p-5">${UI.h('Daftar tunggu', wl.length + ' orang', '', 'hourglass_top')}
          <div class="flex flex-col gap-2 mb-3">${wl.length ? wl.map((w) => `<div class="inner px-3 py-2 font-body-sm text-body-sm flex justify-between gap-2"><span>${esc(w.name)} · ${w.qty}× ${esc(Evt.typeById(e, w.type).name)}<br><span class="text-on-surface-variant">${esc(w.contact)}</span></span><span class="font-label-sm text-label-sm ${w.notified ? 'text-emerald-300' : 'text-amber-300'}">${w.notified ? 'Dikabari ' + Evt.fmtTime(w.notified) + (WL_REASON[w.reason] ? ' · ' + WL_REASON[w.reason] : '') : 'Menunggu'}</span></div>`).join('') : '<div class="font-body-sm text-body-sm text-on-surface-variant">Belum ada. Pengunjung dapat bergabung saat kategori habis.</div>'}</div>
          <button class="btn-ghost w-full justify-center" id="wl-notify" ${wl.some((w) => !w.notified) ? '' : 'disabled'}>${icon('campaign', 'text-[16px]')} Kabari daftar tunggu (kursi tersedia: ${Evt.stats(e.id).available})</button></section></div></div>`;
  }

  // ------------------------------------------------------------------ modal detail transaksi
  function orderModal(id) {
    const o = Evt.s.orders[id]; const e = Evt.ev(o.ev);
    const root = UI.modal(icon('receipt_long', 'text-primary text-[22px] align-middle') + ' Transaksi ' + o.id, `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="flex flex-col gap-3"><div class="flex items-center gap-2">${oChip(o)}<span class="font-label-md text-label-md text-on-surface-variant">${o.method || ''}</span></div>
          ${isMgr() ? `<form id="f-contact" class="flex flex-col gap-3"><label class="f">Nama pemesan<input class="inp" name="name" value="${esc(o.name)}"></label><label class="f">Email<input class="inp" name="email" value="${esc(o.email)}"></label><label class="f">WhatsApp<input class="inp" name="phone" value="${esc(o.phone)}"></label>
            ${o.tickets.map((tid, i) => `<label class="f">Pemegang tiket ${i + 1} (${Evt.s.tickets[tid].seat || 'berdiri'})<input class="inp" name="h${i}" value="${esc(Evt.s.tickets[tid].holder)}"></label>`).join('')}
            <button class="btn-ghost self-start">${icon('save', 'text-[16px]')} Simpan perubahan data</button></form>` : `<div class="inner p-3 flex flex-col gap-1 font-body-sm text-body-sm"><b>${esc(o.name)}</b><span class="text-on-surface-variant">${esc(o.email)} · ${esc(o.phone)}</span>${o.tickets.map((tid) => `<span>${esc(Evt.s.tickets[tid].seat || 'Berdiri')} · ${esc(Evt.s.tickets[tid].holder)}</span>`).join('')}</div><p class="font-label-sm text-label-sm text-on-surface-variant">${icon('visibility', 'text-[14px] align-middle')} Mode pemantauan Command Center. Perubahan data, refund, dan pembatalan dilakukan di Konsol Pengelola.</p>`}</div>
        <div class="flex flex-col gap-3"><div class="inner p-3 font-body-sm text-body-sm"><b>${esc(e.name)}</b><br>${o.items.map((i) => esc(Evt.typeById(e, i.type).name) + (i.seat ? ' · ' + i.seat : '')).join('<br>')}<div class="mt-2 flex justify-between"><span>Total</span><b>${rp(o.total)}</b></div></div>
          ${o.tickets.length ? `<div class="flex flex-col gap-2">${o.tickets.map((tid) => { const t = Evt.s.tickets[tid]; return `<div class="inner p-2 flex items-center gap-3"><div class="bg-white p-1 rounded">${Evt.qrSvg(Evt.qrText(t), 64)}</div><div class="font-label-md text-label-md">${t.id}<br><span class="${t.status === 'VOID' ? 'text-rose-300' : t.checkedInAt ? 'text-emerald-300' : 'text-on-surface-variant'}">${t.status === 'VOID' ? 'VOID' : t.checkedInAt ? 'Check-in ' + Evt.fmtTime(t.checkedInAt) + ' · ' + esc(t.gate) : 'Belum check-in'}</span></div></div>`; }).join('')}</div>` : ''}
          <div class="lbl mt-1">Riwayat</div><div class="flex flex-col gap-1 font-body-sm text-body-sm text-on-surface-variant">${(o.log || []).map((l) => `<div>${Evt.fmtDT(l.ts)} · ${esc(l.text)}</div>`).join('') || '-'}</div>
          <div class="flex flex-wrap gap-2 mt-2">${!isMgr() ? '' : o.status === 'PAID' ? `<button class="btn-ghost" id="o-resend">${icon('forward_to_inbox', 'text-[16px]')} Kirim ulang e-ticket</button>${can('refund') ? `<button class="btn-danger" id="o-refund">${icon('currency_exchange', 'text-[16px]')} Refund</button>` : ''}` : ''}${o.status === 'PENDING' && o.until > Evt.now() ? `<button class="btn-ghost" id="o-cancel">${icon('cancel', 'text-[16px]')} Batalkan pesanan</button>` : ''}</div></div></div>`, { wide: true });
    if (!isMgr()) return;
    root.querySelector('#f-contact').addEventListener('submit', async (ev) => { ev.preventDefault(); const f = Object.fromEntries(new FormData(ev.target)); const holders = o.tickets.map((_, i) => f['h' + i]); if (await act(() => Evt.updateContact(id, { name: f.name, email: f.email, phone: f.phone, holders }), 'Data peserta ' + id + ' diperbarui')) UI.closeModal(); });
    const rs = root.querySelector('#o-resend'); if (rs) rs.addEventListener('click', () => act(() => Evt.resend(id), 'E-ticket dikirim ulang (simulasi)'));
    const rf = root.querySelector('#o-refund'); if (rf) rf.addEventListener('click', async () => {
      const seats = o.items.map((i) => i.seat).filter(Boolean).join(', ');
      const r0 = await UI.confirm({ title: 'Refund ' + id + '?', danger: true, body: 'Dana dikembalikan ke pemesan, e-ticket dibatalkan (VOID), dan kursi kembali tersedia untuk dijual.', impact: [['Nominal', money(o.total)], ['Tiket dibatalkan', num(o.tickets.length) + (seats ? ' · ' + esc(seats) : '')], ['Dikabari', esc(o.email)]], reason: { label: 'Alasan refund', value: 'Permintaan peserta', required: true }, confirmText: 'Refund ' + money(o.total), cancelText: 'Kembali' });
      if (!r0) return orderModal(id);
      await act(() => Evt.refund(id, r0.reason), 'Refund ' + id + ' diproses, kursi kembali tersedia');
    });
    const cc = root.querySelector('#o-cancel'); if (cc) cc.addEventListener('click', async () => { if ((await act(() => Evt.cancel(id, 'panitia'), 'Pesanan dibatalkan')) !== null) UI.closeModal(); });
  }
  // Field tiket insiden anomali gate (SOP-EVT-03, P2). Dipakai tombol manual dan jembatan otomatis (event/cc-bridge.js).
  function incidentFields(e, gate, text, source) {
    return { title: 'Indikasi tiket palsu/calo di ' + gate, desc: (text ? text + ' ' : '') + 'Acara ' + e.name + '. Pindaian QR gagal/duplikat berulang (lihat log check-in DB-EVT).', sop: 'SOP-EVT-03', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: 'GF', location: gate + ' · ' + e.venue.split(',')[0], source: source || 'Check-in event (DB-EVT)', cam: 'CAM-01', team: 'Regu Bravo', fromDb: 'EVT' };
  }
  function incident(e, gate, report) {
    // Command Center: buat lewat jembatan otomatis (klaim atomik), jadi tidak bisa balapan dengan pembuatan otomatis
    if (window.CCBridge) { CCBridge.check(); return; }
    Shell.newTicket(incidentFields(e, gate, report && report.text));
    const t0 = Store.s.tickets.length;
    const watch = Store.subscribe(() => { if (Store.s.tickets.length > t0) { watch(); const tk = Store.s.tickets[0]; if (report) Evt.linkReport(report.id, tk.id); } });
  }

  // ------------------------------------------------------------------ pengelola: Semua acara (cari, saring, satu tombol utama + menu aksi lain)
  const FILTERS = [['ALL', 'Semua'], ['DRAFT', 'Draft'], ['PUBLISHED', 'Dijual'], ['CLOSED', 'Ditutup'], ['DONE', 'Selesai'], ['CANCELLED', 'Dibatalkan']];
  function acaraRow(e) {
    const s = Evt.stats(e.id), cap = s.total - s.blocked, ph = phase(e), sale = Evt.saleState(e);
    const ready = e.status === 'DRAFT' ? readiness(e).filter((x) => !x.warn) : null;
    const nOk = ready ? ready.filter((x) => x.ok).length : 0;
    const apGo = e.status === 'DRAFT' && ready && nOk === ready.length && Evt.needsApproval(e);
    const primary = apGo ? ['persetujuan', 'Persetujuan', 'btn'] : e.status === 'DRAFT' ? ['pengaturan', 'Lanjutkan', 'btn'] : ['ringkasan', 'Buka', 'btn-ghost'];
    const next = {
      DRAFT: apGo ? apNext(e) : ready && nOk === ready.length ? 'siap dipublikasikan' : 'lengkapi ' + (ready || []).filter((x) => !x.ok).map((x) => x.label.toLowerCase()).join(', '),
      PUBLISHED: isHariH(e) ? 'hari H, pantau check-in di gate' : sale.open ? 'penjualan berjalan, pantau ringkasan' : sale.label.toLowerCase(),
      CLOSED: 'penjualan ditutup, buka lagi bila perlu', DONE: 'acara selesai, periksa rekonsiliasi keuangan', CANCELLED: 'dibatalkan, refund peserta sudah diproses',
    }[ph];
    const chip = (ph === 'DONE' ? UI.chip('Selesai', 'bg-slate-500/20 text-slate-300') : evChip(e)) + (e.status === 'DRAFT' && e.approval ? UI.chip(esc(Evt.AP_ST[e.approval.st]), EvtApproval.AP_CHIP[e.approval.st]) : '');
    return `<article class="pg-ev" style="--c:${esc(e.color)}">
      <div class="pg-ev-name"><a href="${href(e.id, primary[0])}" class="pg-ev-title">${esc(e.name)}</a><div class="pg-ev-sub">${plate(e)}<span>${place(e)} · ${e.id} · ${esc(e.cat)}${e.org ? ' · ' + esc(e.org) : ''}</span></div></div>
      <div class="pg-ev-date"><b>${Evt.fmtShort(e.start)}</b><span>${Evt.fmtTime(e.start)} WIB</span></div>
      <div class="pg-ev-st">${chip}${ph === 'PUBLISHED' ? `<span class="pg-ev-sale">${esc(sale.label)}</span>` : ''}</div>
      <div class="pg-ev-sold">${ready ? `<b>${nOk} dari ${ready.length} siap</b>${UI.bar((nOk / ready.length) * 100, 'bg-primary')}` : `<b>${num(s.sold)} / ${num(cap)}</b>${UI.bar(cap ? (s.sold / cap) * 100 : 0, 'bg-secondary')}`}</div>
      <div class="pg-ev-rev"><b>${money(s.revenue)}</b><span>${s.paid.length} transaksi</span></div>
      <div class="pg-ev-act"><a class="${primary[2]}" href="${href(e.id, primary[0])}">${primary[1]}</a>${moreMenu(e)}</div>
      <div class="pg-ev-next">${icon('subdirectory_arrow_right', 'text-[16px]')}<span>Langkah berikutnya: ${esc(next)}</span></div>
    </article>`;
  }
  function acaraList() {
    const q = ui.aq.trim().toLowerCase();
    const evs = visEvs().filter((e) => (ui.ast === 'ALL' || phase(e) === ui.ast) && (!q || [e.name, e.id, e.cat, e.org || '', e.venue].join(' ').toLowerCase().includes(q)));
    return evs.length ? evs.map(acaraRow).join('')
      : `<div class="pg-empty">${icon('search_off', 'text-[28px]')}<p>${visEvs().length ? 'Tidak ada acara yang cocok dengan saringan.' : 'Belum ada acara. Klik <b>Acara baru</b> untuk membuat.'}</p>${q || ui.ast !== 'ALL' ? '<button type="button" class="btn-ghost" data-clear-filter>Hapus saringan</button>' : ''}</div>`;
  }
  function acaraKpi() {
    const evs = visEvs();
    const tot = evs.reduce((a, e) => { const s = Evt.stats(e.id); a.sold += s.sold; a.rev += s.revenue; return a; }, { sold: 0, rev: 0 });
    return `${UI.kpi({ key: K('all:events'), label: 'Total acara', icon: 'event_note', value: evs.length, foot: evs.filter((e) => phase(e) === 'PUBLISHED').length + ' dijual, ' + evs.filter((e) => e.status === 'DRAFT').length + ' draft' })}
      ${UI.kpi({ key: K('all:sold'), label: 'Tiket terjual', icon: 'confirmation_number', value: num(tot.sold), foot: 'semua acara' })}
      ${UI.kpi({ key: K('all:rev'), label: 'Pendapatan', icon: 'payments', value: rpJt(tot.rev), unit: tot.rev >= 1e6 ? 'Jt' : '', foot: 'transaksi lunas' })}
      ${(() => { const d0 = new Date(Evt.now()); d0.setHours(0, 0, 0, 0); const n = Object.values(Evt.s.tickets).filter((k) => k.checkedInAt >= d0.getTime()).length; return UI.kpi({ key: K('all:ck'), label: 'Check-in hari ini', icon: 'how_to_reg', value: num(n), foot: 'pengunjung masuk lewat gate' }); })()}`;
  }
  function acara() {
    const all = visEvs(), c = {}; all.forEach((e) => { const p = phase(e); c[p] = (c[p] || 0) + 1; });
    return `
    <section class="card p-4 sm:p-5">
      <div class="pg-list-head"><div class="min-w-0"><h2 class="font-headline-sm text-headline-sm">Acara di Summarecon Mall Bandung</h2><p class="font-body-sm text-body-sm text-on-surface-variant">Acara yang dipublikasikan langsung tampil di portal pengunjung dan Command Center.</p></div><button type="button" class="btn shrink-0" id="new-ev">${icon('add')} Acara baru</button></div>
      <div class="pg-filter"><label class="pg-search">${icon('search', 'text-[18px]')}<span class="sr-only">Cari acara</span><input id="aq" class="inp" type="search" placeholder="Cari nama, ID, kategori, penyelenggara" value="${esc(ui.aq)}" autocomplete="off"></label>
        <div class="pg-chips" role="group" aria-label="Saring menurut status">${FILTERS.map(([k, l]) => `<button type="button" class="chip-btn ${ui.ast === k ? 'on' : ''}" data-ast="${k}" aria-pressed="${ui.ast === k}">${l} <span class="opacity-70">${k === 'ALL' ? all.length : c[k] || 0}</span></button>`).join('')}</div></div>
      <div class="pg-ev pg-ev-head" aria-hidden="true"><span>Acara</span><span>Jadwal</span><span>Status</span><span>Terjual</span><span>Pendapatan</span><span></span></div>
      <div id="acara-list" class="pg-ev-list">${acaraList()}</div>
      <p class="pg-note">${icon('info', 'text-[18px]')}<span>Acara yang sudah punya pesanan tidak bisa dihapus. Batalkan acaranya, lalu peserta otomatis di-refund dan dikabari.</span></p></section>`;
  }
  // ------------------------------------------------------------------ tab Command Center: portofolio event 360 (hanya baca)
  function portofolio() {
    const t = Evt.now(), D = 86400000; const d0 = new Date(t); d0.setHours(0, 0, 0, 0);
    const evs = visEvs().filter((e) => e.status !== 'DRAFT');
    const st = evs.map((e) => ({ e, s: Evt.stats(e.id), an: EvtCheckin.anomalies(e.id).length, rep: Evt.s.reports.filter((r) => r.ev === e.id && !r.ticketId).length }));
    const active = st.filter((x) => x.e.status !== 'CANCELLED' && x.e.start > t - 6 * 3600000);
    const ckToday = Object.values(Evt.s.tickets).filter((k) => k.checkedInAt >= d0.getTime()).length;
    const sum = (f) => st.reduce((a, x) => a + f(x), 0);
    const anomN = sum((x) => x.an), repN = sum((x) => x.rep);
    const up = active.filter((x) => x.e.start < t + 30 * D).sort((a, b) => a.e.start - b.e.start);
    const draft = visEvs().filter((e) => e.status === 'DRAFT').length;
    return `<div class="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-5">
      ${UI.kpi({ label: 'Acara aktif', icon: 'event_available', value: active.length, foot: draft + ' draft disiapkan pengelola' })}
      ${UI.kpi({ label: 'Tiket terjual', icon: 'confirmation_number', value: num(sum((x) => x.s.sold)), foot: 'seluruh acara dipublikasikan' })}
      ${UI.kpi({ label: 'Pendapatan event', icon: 'payments', value: rpJt(sum((x) => x.s.revenue)), unit: sum((x) => x.s.revenue) >= 1e6 ? 'Jt' : '', foot: 'potensi bagi hasil venue' })}
      ${UI.kpi({ label: 'Check-in hari ini', icon: 'how_to_reg', value: num(ckToday), vcls: 'text-emerald-300', foot: 'pengunjung event masuk mall' })}
      ${UI.kpi({ label: 'Anomali gate', icon: 'gpp_maybe', value: anomN, vcls: anomN ? 'text-rose-300' : 'text-on-surface', foot: 'indikasi tiket palsu/calo' })}
      ${UI.kpi({ label: 'Laporan lapangan', icon: 'campaign', value: repN, vcls: repN ? 'text-amber-300' : 'text-on-surface', foot: 'menunggu tiket insiden' })}</div>
    <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
      <section class="card p-5 2xl:col-span-8">${UI.h('Portofolio acara', 'Semua acara di Summarecon Mall Bandung. Klik baris untuk detail (data dari Konsol Pengelola, hanya baca)', `<a class="btn-ghost" href="/pengelola" target="_blank">${icon('open_in_new', 'text-[16px]')} Konsol Pengelola</a>`, 'travel_explore')}
        <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>Acara</th><th>Jadwal</th><th>Status</th><th class="w-[22%]">Okupansi</th><th>Pendapatan</th><th>Kehadiran</th><th>Gate</th></tr></thead><tbody>
        ${st.map(({ e, s, an, rep }) => { const cap = s.total - s.blocked; return `<tr class="row" data-goto="${e.id}"><td><div class="font-label-lg text-label-lg"><span class="inline-block w-2.5 h-2.5 rounded-full mr-2" style="background:${esc(e.color)}"></span>${esc(e.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${e.id} · ${esc(e.cat)} · ${esc(e.venue.split('·')[0].trim())}</div></td>
          <td class="font-body-sm text-body-sm whitespace-nowrap">${Evt.fmtShort(e.start)} · ${Evt.fmtTime(e.start)}</td><td>${evChip(e)}</td>
          <td><div class="font-label-md text-label-md mb-1">${num(s.sold)}/${num(cap)} · ${cap ? Math.round((s.sold / cap) * 100) : 0}%</div>${UI.bar(cap ? (s.sold / cap) * 100 : 0, 'bg-secondary')}</td>
          <td class="font-label-md text-label-md whitespace-nowrap">${rp(s.revenue)}</td><td class="font-label-md text-label-md">${s.tickets ? Math.round((s.checkedIn / s.tickets) * 100) + '%' : '-'}</td>
          <td>${an || rep ? UI.chip((an + rep) + ' peringatan', 'bg-rose-500/15 text-rose-300') : '<span class="font-label-sm text-label-sm text-emerald-300">Normal</span>'}</td></tr>`; }).join('') || '<tr><td colspan="7" class="text-on-surface-variant">Belum ada acara dipublikasikan.</td></tr>'}
        </tbody></table></div></section>
      <section class="card p-5 2xl:col-span-4">${UI.h('Dampak operasional mall', 'Proyeksi 30 hari dari tiket terjual, dasar persiapan lintas dashboard', '', 'hub')}
        <div class="flex flex-col gap-3">${up.map(({ e, s }) => `<div class="inner p-3 flex flex-col gap-1.5 font-body-sm text-body-sm"><div class="flex justify-between gap-2"><b>${esc(e.name)}</b><span class="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">${Evt.fmtShort(e.start)}</span></div>
          <div class="flex items-center gap-2">${icon('local_parking', 'text-primary text-[16px]')} +${num(Math.round(s.sold * 0.42))} kendaraan · ${UI.dbLink('PARK', '', 'Parkir & Mobilitas')}</div>
          <div class="flex items-center gap-2">${icon('groups', 'text-primary text-[16px]')} ${num(s.sold)} orang, puncak ${Evt.fmtTime(e.doors + 3600000)} · ${UI.dbLink('CCTV', 'cam=CAM-01', 'CCTV')}</div>
          <div class="flex items-center gap-2">${icon('hvac', 'text-primary text-[16px]')} Pre-cooling ${Evt.fmtTime(e.doors - 3600000)} · ${UI.dbLink('BMS', '', 'BMS')}</div>
          <div class="flex items-center gap-2">${icon('shield_person', 'text-primary text-[16px]')} ${Math.ceil(s.sold / 75) + 2} personel keamanan · ${e.gates.length} gate</div></div>`).join('') || '<div class="font-body-sm text-body-sm text-on-surface-variant">Tidak ada acara dalam 30 hari ke depan.</div>'}</div></section></div>
    ${UI.relasi('EVT')}`;
  }

  // ------------------------------------------------------------------ Persetujuan acara & log aktivitas
  // Tampilan alur, dokumen, dan log ada di approval-ui.js (dipakai juga Command Center). Keputusan divisi hanya di
  // Command Center; konsol ini mengajukan, mengunggah dokumen, dan mempublikasikan.
  function apActions(e) {
    const ap = e.approval;
    if (!isMgr() || e.status !== 'DRAFT') return '';
    if (ap.st === 'DRAFT' || ap.st === 'REVISI') {
      const miss = Evt.missingDocs(e);
      return `<div class="inner p-3 mt-4"><label class="f">Catatan untuk peninjau (opsional)<textarea class="inp" id="ap-note" rows="2" maxlength="300" placeholder="${ap.st === 'REVISI' ? 'Jelaskan apa saja yang sudah diperbaiki' : 'Mis. kebutuhan listrik, jam loading barang'}"></textarea></label>
        <div class="flex flex-wrap items-center gap-2 mt-3"><button type="button" class="btn" id="ap-submit"${miss.length ? ' disabled' : ''}>${icon('send', 'text-[16px]')} ${ap.st === 'REVISI' ? 'Ajukan ulang' : 'Ajukan persetujuan'}</button>${miss.length ? `<span class="font-label-sm text-label-sm text-on-surface-variant">Belum ada: ${miss.map((x) => esc(x.name[0].toLowerCase() + x.name.slice(1))).join(', ')}</span>` : ''}</div></div>`;
    }
    if (ap.st === 'DIAJUKAN') {
      const c = Evt.currentStep(e);
      return `<div class="inner p-3 mt-4 flex items-start gap-3">${icon('hourglass_top', 'text-[20px] text-primary')}<span class="font-body-sm text-body-sm">Menunggu keputusan <b>${c ? c.name : 'divisi'}</b> di Command Center. Dokumen terkunci selama peninjauan.</span></div>`;
    }
    return `<div class="inner p-3 mt-4 flex flex-wrap items-center gap-3"><span class="flex-1 min-w-[220px] font-body-sm text-body-sm">Divisi Event dan Operasional Mall sudah setuju. Acara bisa dipublikasikan.</span><button type="button" class="btn" data-status="PUBLISHED" data-ev-id="${e.id}">${icon('publish', 'text-[16px]')} Publikasikan</button></div>`;
  }
  function persetujuan(e) {
    const A = EvtApproval, ap = e.approval, miss = ap ? Evt.missingDocs(e).length : 0;
    const flow = ap ? A.turnBar(e) + A.areaLine(e) + A.steps(e) + apActions(e) + (isMgr() ? A.nextStepCard(e, meInfo, acctRole) : '') : '<p class="font-body-sm text-body-sm text-on-surface-variant">Acara ini dipublikasikan sebelum persetujuan digital dipakai, jadi tidak punya riwayat persetujuan. Acara baru selalu melewati Divisi Event lalu Operasional Mall.</p>';
    return `<div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <div class="2xl:col-span-5 flex flex-col gap-5">
        <section class="card p-5">${UI.h('Alur persetujuan', 'Penyelenggara mengajukan, Divisi Event lalu Operasional Mall memutuskan di Command Center', '', 'approval')}${flow}</section>
        ${ap ? `<section class="card p-5">${UI.h('Dokumen persyaratan', miss ? miss + ' dokumen wajib belum diunggah' : 'Semua dokumen wajib sudah ada', '', 'folder_open')}${A.docs(e, { editable: isMgr() })}</section>` : ''}
      </div>
      <section class="card p-5 2xl:col-span-7">${UI.h('Log aktivitas acara', 'Siapa melakukan apa dan kapan. Entri hanya bisa ditambah, tidak bisa diubah atau dihapus', A.integrity(e), 'history')}${A.log(e)}</section></div>`;
  }
  function bindApproval(el, id) {
    const note = () => { const n = el.querySelector('#ap-note'); return n ? n.value.trim() : ''; };
    // Setelah aksi berhasil gambar ulang (refresh() menahan redraw selama catatan terisi); bila gagal, catatan tetap ada.
    const run = async (fn, ok) => { let bad = false; const r = await act(() => fn().catch((err) => { bad = true; throw err; }), ok); if (bad) return null; redraw(); return r === undefined ? true : r; };
    EvtApproval.bindDocs(el, id, run);
    EvtApproval.bindCsv(el);
    const sub = el.querySelector('#ap-submit'); if (sub) sub.addEventListener('click', () => run(() => Evt.submitApproval(id, note()), 'Pengajuan dikirim ke Divisi Event'));
  }

  // ------------------------------------------------------------------ tab Command Center: gate & keamanan (pantau, tanpa pemindai)
  function gate(e) {
    return `<div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <div class="2xl:col-span-5 flex flex-col gap-5">${anomPanel(e)}
        <section class="card p-5">${UI.h('Kehadiran per gate', 'Pemindaian dilakukan petugas gate pengelola (ponsel atau konsol)', '', 'how_to_reg')}<div id="ck-stats">${ckStats(e, true)}</div></section></div>
      <section class="card p-5 2xl:col-span-7">${UI.h('Log pindaian', 'Semua gate', '', 'list_alt')}<div id="ck-log">${EvtCheckin.logTable(e.id, 30)}</div></section></div>`;
  }

  // ------------------------------------------------------------------ view
  function body() {
    if (ui.tab === 'acara') return acara();
    if (ui.tab === 'gdash') return gdash();
    if (ui.tab === 'gtrx') return gtrx();
    if (ui.tab === 'gck') return gck();
    if (ui.tab === 'gfin') return gfin();
    if (ui.tab === 'portofolio') return portofolio();
    const e = Evt.ev(ui.ev); const s = Evt.stats(ui.ev);
    return { ringkasan, kursi, kelola, pengaturan: kelola, persetujuan, peserta, keuangan, checkin, notif, komunikasi: notif, gate }[ui.tab](e, s);
  }
  function staleBanner() {
    return isMgr() && Evt.demoStale() ? `<div class="card p-3 mb-4 border border-amber-500/30 bg-amber-500/10 font-body-sm text-body-sm flex flex-wrap items-center gap-2" data-stale-banner>${icon('history', 'text-amber-300 text-[20px]')}<span class="flex-1 min-w-[220px]"><b class="text-amber-300">Data contoh dibuat ${Evt.fmtDT(Evt.s.seededAt)}.</b> ${Evt.demoOld() ? 'Aplikasi sudah punya data contoh yang lebih baru (lebih banyak acara dan foto). Reset agar beranda pengunjung menampilkannya.' : 'Jadwal acara contoh sudah lewat, jadi penjualan dan uji tekan bisa ditolak. Reset data sebelum demo.'}${can('reset') ? '' : ' Minta Tim Event Mall menekan Reset data contoh.'}</span>${can('reset') ? `<button class="btn-ghost" data-stale-reset>${icon('restart_alt', 'text-[16px]')} Reset sekarang</button>` : ''}</div>` : '';
  }
  function header() {
    const tabs = TABS[ROLE]; const global = GLOBAL_TABS.includes(ui.tab);
    const links = isMgr()
      ? `<a class="btn-ghost" href="/pengunjung" target="_blank">${icon('open_in_new', 'text-[16px]')} Portal pengunjung</a><a class="btn-ghost" href="/checkin" target="_blank">${icon('qr_code_scanner', 'text-[16px]')} Check-in ponsel</a><button class="btn-ghost" id="evt-reset" title="Kembalikan data event ke kondisi awal">${icon('restart_alt', 'text-[16px]')} Reset</button>`
      : `<a class="btn-ghost" href="/pengelola" target="_blank">${icon('admin_panel_settings', 'text-[16px]')} Konsol Pengelola</a><a class="btn-ghost" href="/pengunjung" target="_blank">${icon('open_in_new', 'text-[16px]')} Portal pengunjung</a>`;
    const stale = staleBanner();
    let h = Evt.modeBanner() + stale + `<section class="card pagebar">
      <div class="pagebar-info">
        ${Evt.mode === 'server' ? '<span class="stat live"><span class="dot"></span>Server LAN</span><span class="stat">Versi data <b>' + Evt.version + '</b></span>' : '<span class="stat live"><span class="dot warn"></span>Mode lokal (1 perangkat)</span>'}
        ${isMgr() ? UI.chip('Event Organizer, kendali penuh', 'bg-primary/15 text-primary') : UI.chip('Manajemen mal, read-only', 'bg-secondary/15 text-secondary')}
      </div>
      <div class="pagebar-actions">${links}</div>
      <div class="pagebar-row" role="tablist">${tabs.map(([k, l, i]) => `<button class="chip-btn !py-2 !px-3 ${ui.tab === k ? 'on' : ''}" role="tab" aria-selected="${ui.tab === k}" data-tab="${k}">${icon(i, 'text-[16px]')} ${l}</button>`).join('')}</div></section>`;
    if (global) return h;
    const e = Evt.ev(ui.ev); const sale = Evt.saleState(e);
    h += `<div class="flex flex-wrap gap-2 mb-3">${Evt.s.order.filter((id) => seen(Evt.ev(id)) && (isMgr() || Evt.ev(id).status !== 'DRAFT')).map((id) => { const x = Evt.ev(id); return `<button class="chip-btn ${id === ui.ev ? 'on' : ''}" data-ev="${id}" title="${esc(x.name)}">${id} · ${esc(x.name.length > 28 ? x.name.slice(0, 28) + '…' : x.name)}${x.status === 'CANCELLED' ? ' (batal)' : x.status === 'DRAFT' ? ' (draft)' : ''}</button>`; }).join('')}</div>
    <section class="card p-5 mb-5 flex flex-wrap items-center gap-5" style="background:linear-gradient(110deg, ${esc(e.color)}22, rgb(var(--surface-container)) 55%)">
      <div class="flex-1 min-w-[280px]"><div class="font-label-sm text-label-sm text-secondary">${esc(e.cat)} · ${e.id}</div><h2 class="font-headline-lg text-headline-lg">${esc(e.name)}</h2><div class="font-body-sm text-body-sm text-on-surface-variant">${Evt.fmtDate(e.start)} · ${Evt.fmtTime(e.start)} WIB · gate ${Evt.fmtTime(e.doors)} · ${esc(e.venue)}</div></div>
      <div class="flex flex-col items-end gap-1"><div class="flex gap-2">${evChip(e)}${UI.chip(esc(sale.label), sale.open ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/20 text-slate-300')}</div><span class="font-label-sm text-label-sm text-on-surface-variant">Jual ${Evt.fmtDT(e.saleStart)} sampai ${Evt.fmtDT(e.saleEnd)}, hold ${e.holdMin} mnt, maks ${e.maxPerOrder}/pesanan</span></div></section>`;
    return h;
  }
  function normalize() {
    const tabs = TABS[ROLE].map((x) => x[0]);
    if (!tabs.includes(ui.tab)) ui.tab = tabs[0];
    if (isMgr() && !isG(ui.tab) && !Evt.ev(ui.ev)) { ui.tab = 'gdash'; ui.ev = null; } // acara dihapus (di perangkat lain)
    const pool = Evt.s.order.filter((id) => seen(Evt.ev(id)) && (isMgr() || Evt.ev(id).status !== 'DRAFT'));
    if (!pool.includes(ui.ev)) ui.ev = pool[0] || null;
    if (!ui.ev && !isG(ui.tab)) ui.tab = tabs[0]; // tidak ada acara → hanya tab lintas acara
  }
  let lastHead = '';
  function draw(root) {
    const el = root && root.querySelector('#evt-root'); if (!el) return;
    normalize();
    if (ui.tab !== 'pengaturan') ui.dirty = false; // form Pengaturan tidak tampil lagi: tidak ada yang perlu dijaga
    if (isMgr()) {
      Evt.setActor(actorOf()); // pelaku yang tercatat di log aktivitas
      const canon = evUrl(ui.ev, ui.tab); if (Router.path() !== canon) Router.replace(canon);
      shell(true);
      lastHead = isG(ui.tab) ? globalHead() : mgrHead(Evt.ev(ui.ev));
      el.innerHTML = Evt.modeBanner() + staleBanner() + (lastHead ? `<div id="evt-head" class="pg-head-wrap">${lastHead}</div>` : '') + `<div id="evt-body">${body()}</div>`;
    } else el.innerHTML = header() + `<div id="evt-body">${body()}</div>`;
    bind(el);
    if (ui.focus) {
      const t = el.querySelector('#' + ui.focus + ' > *'); ui.focus = null;
      if (t) { t.scrollIntoView({ block: 'start', behavior: 'smooth' }); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); }
    }
  }
  function refresh() {
    const el = document.getElementById('evt-root');
    if (!el) { if (unsub) { unsub(); unsub = null; } EvtCheckin.stopCam(); return; }
    if (document.getElementById('modal-root').innerHTML) return;
    let e = Evt.ev(ui.ev);
    if (isMgr()) {
      if (document.querySelector('.pg-more[open]')) return; // menu aksi sedang terbuka
      if (!isG(ui.tab) && !e) return redraw();
      shell();
      const h = el.querySelector('#evt-head'), nh = isG(ui.tab) ? globalHead() : mgrHead(e);
      if (h && nh !== lastHead) { lastHead = nh; h.innerHTML = nh; bindActions(h); }
      if (ui.tab === 'acara') { const l = el.querySelector('#acara-list'); l.innerHTML = acaraList(); bindActions(l); return; }
      if (ui.tab === 'gtrx') { const gt = el.querySelector('#g-table'); gt.innerHTML = gtrxTable(); bindRows(gt); return; }
      if (isG(ui.tab)) { const y = window.scrollY; draw(host); window.scrollTo(0, y); return; }
      if (h && nh !== lastHead) { lastHead = nh; h.innerHTML = nh; bindActions(h); }
      if (ui.tab === 'pengaturan') return; // jangan timpa form yang sedang diisi
    } else if (ui.tab === 'kelola' && e) return;
    if (!e || GLOBAL_TABS.includes(ui.tab) || ui.tab === 'gate') { const y = window.scrollY; draw(host); window.scrollTo(0, y); return; }
    if (ui.tab === 'checkin') { el.querySelector('#ck-anom').innerHTML = ckAnom(e); el.querySelector('#ck-stats').innerHTML = ckStats(e, true); el.querySelector('#ck-log').innerHTML = EvtCheckin.logTable(e.id, 30); bindInc(el); return; }
    if (ui.tab === 'peserta') { el.querySelector('#evt-table').innerHTML = pesertaTable(e); bindRows(el); return; }
    if (ui.tab === 'persetujuan') { const n = el.querySelector('#ap-note'); if (n && (n.value || document.activeElement === n)) return; } // jangan hapus catatan yang sedang diketik
    const y = window.scrollY; draw(host); window.scrollTo(0, y);
  }
  const closeMenus = (except) => document.querySelectorAll('.pg-more[open]').forEach((d) => { if (d !== except) d.removeAttribute('open'); });
  // Tombol aksi acara (header acara, Semua acara, Perlu tindakan). Dipanggil ulang untuk region yang diganti.
  function bindActions(root) {
    root.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', () => { closeMenus(); const x = Evt.ev(b.dataset.evId); if (x) setStatus(x, b.dataset.status); }));
    root.querySelectorAll('[data-cancel-ev]').forEach((b) => b.addEventListener('click', () => { closeMenus(); const x = Evt.ev(b.dataset.cancelEv); if (x) cancelEv(x); }));
    root.querySelectorAll('[data-del-ev]').forEach((b) => b.addEventListener('click', () => { closeMenus(); const x = Evt.ev(b.dataset.delEv); if (x) deleteEv(x); }));
    root.querySelectorAll('[data-attn-st]').forEach((a) => a.addEventListener('click', () => (ui.st = a.dataset.attnSt)));
    root.querySelectorAll('[data-attn-focus]').forEach((a) => a.addEventListener('click', () => (ui.focus = a.dataset.attnFocus)));
    root.querySelectorAll('[data-report-all]').forEach((b) => b.addEventListener('click', reportAllPdf));
    root.querySelectorAll('[data-new-ev]').forEach((b) => b.addEventListener('click', (ev) => { ev.stopPropagation(); newEventPanel(); }));
    root.querySelectorAll('[data-report-ev]').forEach((b) => b.addEventListener('click', () => { closeMenus(); const x = Evt.ev(b.dataset.reportEv); if (x) reportPdf(x); }));
    root.querySelectorAll('[data-kpi]').forEach((c) => { const go = () => kpiModal(c.dataset.kpi); c.addEventListener('click', go); c.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } }); });
    root.querySelectorAll('[data-clear-filter]').forEach((b) => b.addEventListener('click', () => { ui.aq = ''; ui.ast = 'ALL'; redraw(); }));
    root.querySelectorAll('.pg-more').forEach((d) => d.addEventListener('toggle', () => { if (d.open) closeMenus(d); }));
  }
  function bindRows(el) { el.querySelectorAll('[data-order]').forEach((b) => b.addEventListener('click', () => orderModal(b.dataset.order))); }
  function bindInc(el) {
    const e = Evt.ev(ui.ev);
    if (!e) return;
    el.querySelectorAll('[data-report]').forEach((b) => b.addEventListener('click', async () => { b.disabled = true; if ((await act(() => Evt.report(e.id, b.dataset.report, 'Pengelola melaporkan pindaian QR gagal/duplikat berulang di ' + b.dataset.report + ' (indikasi tiket palsu/calo). Mohon dukungan keamanan mall.'), 'Laporan terkirim ke Command Center')) === null) b.disabled = false; }));
    if (isMgr()) return;
    el.querySelectorAll('[data-inc]').forEach((b) => b.addEventListener('click', () => incident(e, b.dataset.inc)));
    el.querySelectorAll('[data-rep]').forEach((b) => b.addEventListener('click', () => { const r = Evt.s.reports.find((x) => x.id === b.dataset.rep); incident(e, r.gate, r); }));
  }
  function bind(el) {
    const e = Evt.ev(ui.ev);
    el.querySelectorAll('[data-ev]').forEach((b) => b.addEventListener('click', () => { ui.ev = b.dataset.ev; ui.seatSel = null; redraw(); }));
    el.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => goTab(b.dataset.tab)));
    el.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => { ui.ev = b.dataset.goto; ui.tab = 'ringkasan'; redraw(); }));
    const sr = el.querySelector('[data-stale-reset]'); if (sr) sr.addEventListener('click', resetDemo);
    bindRows(el); bindInc(el);
    // Semua acara & header acara (pengelola)
    if (isMgr()) {
      bindActions(el); bindGlobal(el);
      const ne = el.querySelector('#new-ev'); if (ne) ne.addEventListener('click', (ev) => { ev.stopPropagation(); newEventPanel(); });
      const list = el.querySelector('#acara-list');
      const relist = () => { list.innerHTML = acaraList(); bindActions(list); };
      const aq = el.querySelector('#aq'); if (aq) aq.addEventListener('input', () => { ui.aq = aq.value; relist(); });
      el.querySelectorAll('[data-ast]').forEach((b) => b.addEventListener('click', () => { ui.ast = b.dataset.ast; el.querySelectorAll('[data-ast]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); relist(); }));
    }
    if (!e) return;
    // denah
    el.querySelectorAll('[data-smode]').forEach((b) => b.addEventListener('click', () => { ui.seatMode = b.dataset.smode; redraw(); }));
    el.querySelectorAll('.admin-map [data-seat]').forEach((b) => b.addEventListener('click', () => {
      if (isMgr() && ui.seatMode === 'block') act(() => Evt.toggleBlock(e.id, b.dataset.seat), 'Status jual kursi ' + b.dataset.seat + ' diubah');
      else { ui.seatSel = b.dataset.seat; redraw(); }
    }));
    // kelola
    bindKelola(el, e);
    if (ui.tab === 'persetujuan') bindApproval(el, e.id);
    // peserta
    const q = el.querySelector('#q'); if (q) q.addEventListener('input', () => { ui.q = q.value; el.querySelector('#evt-table').innerHTML = pesertaTable(e); bindRows(el); });
    el.querySelectorAll('button[data-st]:not([data-seat])').forEach((b) => b.addEventListener('click', () => { ui.st = b.dataset.st; redraw(); }));
    const cp = el.querySelector('#csv-p'); if (cp) cp.addEventListener('click', () => {
      const rows = [['Acara', 'ID Tiket', 'Booking', 'Kategori', 'Kursi', 'Pemegang', 'Pemesan', 'Email', 'WhatsApp', 'Status Tiket', 'Check-in', 'Gate']];
      Object.values(Evt.s.tickets).filter((t) => t.ev === e.id).forEach((t) => { const o = Evt.s.orders[t.order]; rows.push([e.name, t.id, o.id, Evt.typeById(e, t.type).name, t.seat || 'Berdiri', t.holder, o.name, o.email, o.phone, t.status, t.checkedInAt ? Evt.fmtDT(t.checkedInAt) : '', t.gate || '']); });
      Evt.csv('peserta_' + e.id + '.csv', rows);
    });
    const ct = el.querySelector('#csv-t'); if (ct) ct.addEventListener('click', () => {
      const rows = [['Booking', 'Acara', 'Pemesan', 'Email', 'WhatsApp', 'Jumlah Tiket', 'Kursi', 'Subtotal', 'Biaya Layanan', 'Total', 'Metode', 'Status', 'Dibuat', 'Dibayar', 'Catatan Refund']];
      Evt.stats(e.id).orders.forEach((o) => rows.push([o.id, e.name, o.name, o.email, o.phone, o.items.length, o.items.map((i) => i.seat || Evt.typeById(e, i.type).name).join(' '), o.sub, o.fee, o.total, o.method || '', o.status === 'PENDING' && o.until < Evt.now() ? 'EXPIRED' : o.status, Evt.fmtDT(o.createdAt), o.paidAt ? Evt.fmtDT(o.paidAt) : '', o.refundReason || '']));
      Evt.csv('transaksi_' + e.id + '.csv', rows);
    });
    // keuangan
    const cf = el.querySelector('#csv-fin'); if (cf) cf.addEventListener('click', () => {
      const rows = [['Booking', 'Acara', 'Metode', 'Status', 'Subtotal', 'Biaya Layanan', 'Total', 'Jumlah Tiket', 'Dibayar', 'Refund']];
      Object.values(Evt.s.orders).filter((o) => o.ev === e.id && (o.status === 'PAID' || o.status === 'REFUNDED')).forEach((o) => rows.push([o.id, e.name, o.method || '', o.status, o.sub, o.fee, o.total, o.items.length, o.paidAt ? Evt.fmtDT(o.paidAt) : '', o.refundedAt ? Evt.fmtDT(o.refundedAt) : '']));
      Evt.csv('rekonsiliasi_' + e.id + '.csv', rows);
    });
    // check-in
    const g = el.querySelector('#gate'); if (g) g.addEventListener('change', () => (ui.gate = g.value));
    if (ui.tab === 'checkin') EvtCheckin.mount(el, () => ui.ev, () => ui.gate);
    // notifikasi
    el.querySelectorAll('[data-ch]').forEach((b) => b.addEventListener('click', () => { ui.ch = b.dataset.ch; redraw(); }));
    const rm = el.querySelector('#remind'); if (rm) rm.addEventListener('click', async () => {
      const n0 = Evt.stats(e.id).paid.length; if (!n0) return UI.toast('Belum ada pemesan lunas yang bisa dikabari', 'P3');
      if (!(await UI.confirm({ title: 'Kirim pengingat?', body: 'Pengingat berisi jadwal, lokasi, jam gate dibuka, dan QR e-ticket. Simulasi: pesan masuk ke kotak keluar, tidak benar-benar terkirim.', impact: [['Pemesan lunas', num(n0)], ['Email', num(n0) + ' pesan'], ['WhatsApp', num(n0) + ' pesan']], confirmText: 'Kirim pengingat' }))) return;
      const n = await act(() => Evt.sendReminders(e.id)); if (n != null) UI.toast('Pengingat dikirim ke ' + n + ' pemesan (email dan WhatsApp, simulasi)', 'P4'); });
    const wn = el.querySelector('#wl-notify'); if (wn) wn.addEventListener('click', async () => { const n = await act(() => Evt.notifyWaitlist(e.id)); if (n != null) UI.toast(n + ' orang di daftar tunggu dikabari', 'P4'); });
  }

  let shellReady = false;
  function setupShell() {
    if (shellReady || !window.Router) return; shellReady = true;
    Router.on(async () => {
      if (dd) dd.close(); // dropdown header ditutup saat pindah halaman
      if (!document.getElementById('evt-root')) return;
      if (ui.dirty && ui.tab === 'pengaturan') {
        const target = Router.current(); Router.replace(evUrl(ui.ev, 'pengaturan'));
        if (!(await UI.confirm({ title: 'Buang perubahan?', body: 'Ada perubahan di Pengaturan yang belum disimpan.', confirmText: 'Buang perubahan', cancelText: 'Kembali ke pengaturan', danger: true }))) return;
        ui.dirty = false; Router.replace(target);
      }
      UI.closeModal(); fromUrl(); drawer(false); draw(host); window.scrollTo(0, 0);
    });
    window.addEventListener('beforeunload', (ev) => { if (ui.dirty) { ev.preventDefault(); ev.returnValue = ''; } });
    document.getElementById('pg-menu').addEventListener('click', () => drawer(!document.body.classList.contains('pg-open')));
    document.getElementById('pg-scrim').addEventListener('click', () => drawer(false));
    const pb = document.getElementById('pg-prof-btn');
    if (pb) {
      pb.addEventListener('click', () => profMenu(document.getElementById('pg-prof-menu').hidden));
      document.getElementById('pg-prof-edit').addEventListener('click', editProfile);
      document.getElementById('pg-prof-menu').addEventListener('click', (ev) => { if (ev.target.closest('[data-logout]')) profMenu(false); });
      document.addEventListener('click', (ev) => { if (!ev.target.closest('#pg-prof')) profMenu(false); });
      document.getElementById('pg-prof').addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); profMenu(false); pb.focus(); } });
      renderProfile();
    }
    const kb = document.getElementById('pg-cmdk-btn'); if (kb) { kb.addEventListener('click', palette); const k = kb.querySelector('[data-kbd]'); if (k) k.textContent = isMac ? '⌘K' : 'Ctrl K'; }
    document.addEventListener('keydown', (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && ev.key.toLowerCase() === 'k') { ev.preventDefault(); const open = document.getElementById('pg-cmdk'); if (open) open.remove(); else palette(); return; }
      if (ev.key === '/' && !ev.ctrlKey && !ev.metaKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable && !document.getElementById('modal-root').innerHTML) { ev.preventDefault(); palette(); }
    });
    document.addEventListener('keydown', (ev) => { if (ev.key !== 'Escape') return; if (document.body.classList.contains('pg-open')) drawer(false); closeMenus(); });
    document.addEventListener('click', (ev) => { if (!ev.target.closest('.pg-more')) closeMenus(); });
    window.matchMedia('(max-width: 1023px)').addEventListener('change', () => drawer(false));
    if (window.SMAuth) SMAuth.me().then((m) => { meInfo = m; const r = m && m.active && m.active['/pengelola'], a = r && m.accounts[r]; if (a) { acct = a; acctRole = r; renderProfile(); redraw(); } });
  }
  function mount(root, role) {
    ROLE = role === 'pengelola' ? 'pengelola' : 'mall'; host = root;
    Evt.init().then(async () => {
      // Identitas akun dulu: tenant tidak boleh sempat melihat acara organisasi lain dari tautan langsung.
      if (isMgr() && window.Router && window.SMAuth) { const m = await SMAuth.me().catch(() => null); meInfo = m; const r = m && m.active && m.active['/pengelola'], a = r && m.accounts[r]; if (a) { acct = a; acctRole = r; } }
      if (isMgr() && window.Router) { fromUrl(); setupShell(); }
      draw(root);
      if (!unsub) { let t = null; unsub = Evt.subscribe(() => { clearTimeout(t); t = setTimeout(refresh, 120); }); }
    });
  }
  const loading = `<div id="evt-root"><section class="card p-10 text-center text-on-surface-variant">${icon('progress_activity', 'animate-spin text-[32px]')}<br>Menghubungkan ke engine Event Ticketing…</section></div>`;
  window.EvtAdmin = {
    mount(root, role) { root.innerHTML = loading; mount(root, role); },
    open(params) { if (params.ev) ui.ev = params.ev; if (params.tab) ui.tab = params.tab; },
    incidentFields,
  };
  // Command Center: sudut pandang manajemen mall 360 (hanya baca)
  window.Views.event = {
    title: 'Pemantauan Event', live: false,
    render(params) { window.EvtAdmin.open(params); return loading; },
    mount(root) { mount(root, 'mall'); },
  };
})();
