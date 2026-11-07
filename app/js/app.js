/* Shell aplikasi: router hash, navigasi, header live, ticker, modal buat tiket & broadcast. */
(function () {
  const REF = window.SMICC_REF;
  const { esc, icon } = UI;
  const NAV = [
    { group: 'Operasional', items: [
      ['ticketing', 'Tiket & Insiden', 'confirmation_number', 'TIC'],
      ['bms', 'Fasilitas & BMS', 'hvac', 'BMS'],
      ['tenant', 'Layanan Tenant & SLA', 'storefront', 'TEN'],
      ['cctv', 'CCTV & Keamanan', 'videocam', 'CCTV'],
      ['energy', 'Energi & Utilitas', 'bolt', 'ENE'],
      ['parking', 'Parkir & Mobilitas', 'local_parking', 'PARK'],
      ['event', 'Pemantauan Event', 'local_activity', 'EVT'],
    ] },
    { group: 'Eksekutif', items: [
      ['analytics', 'Analitik & Laporan', 'analytics', 'ANL'],
      ['owner360', 'Komersial & Keuangan', 'apartment', 'O360'],
    ] },
    { group: 'SOP & Simulasi', items: [
      ['sop', 'Pusat SOP & Runbook', 'menu_book'],
      ['usecase', 'Simulator Use Case', 'account_tree'],
    ] },
  ];
  let current = { route: '', params: {} };

  function parse() {
    const h = location.hash.replace(/^#\/?/, '') || 'ticketing';
    const [route, qs] = h.split('?');
    const params = {};
    (qs || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); params[k] = decodeURIComponent(v || ''); });
    return { route: window.Views[route] ? route : 'ticketing', params };
  }

  function renderNav() {
    const act = Store.activeTickets();
    const cnt = { TIC: act.length, CCTV: Object.keys(Store.s.camAlerts).length, BMS: Object.values(Store.s.devices).filter((d) => ['TRIP', 'FAULT', 'LEAK'].includes(d.status)).length, TEN: act.filter((t) => t.tenant).length };
    document.getElementById('nav').innerHTML = NAV.map((g) => `<div class="lbl px-3 mt-2 mb-0.5">${g.group}</div>` + g.items.map(([r, n, ic, code]) =>
      `<a class="nav-item ${current.route === r ? 'active' : ''}" href="#/${r}">${icon(ic, 'text-[20px]')}<span>${n}</span>${code && cnt[code] ? `<span class="cnt">${cnt[code]}</span>` : ''}</a>`).join('')).join('');
  }

  function renderHeader() {
    const act = Store.activeTickets();
    document.getElementById('hdr-active').textContent = act.length;
    const bad = Object.values(Store.s.devices).filter((d) => ['TRIP', 'FAULT', 'LEAK'].includes(d.status)).length;
    document.getElementById('hdr-health').textContent = (99.9 - bad * 0.4).toFixed(1) + '%';
    document.getElementById('tele-status').textContent = bad ? bad + ' alarm aset' : 'Semua normal';
    document.getElementById('tele-status').className = 'font-label-sm text-label-sm ' + (bad ? 'text-tertiary' : 'text-secondary');
    const h = new Date().getHours();
    document.getElementById('shift').textContent = h >= 7 && h < 15 ? 'Shift A (07-15)' : h >= 15 && h < 23 ? 'Shift B (15-23)' : 'Shift C (23-07)';
    // ticker
    const crit = act.filter((t) => t.priority === 'P1' || t.priority === 'P2').sort((a, b) => a.priority.localeCompare(b.priority) || b.createdAt - a.createdAt);
    const top = crit[0];
    const tickerHtml = top ? `<div class="flex items-stretch rounded-xl overflow-hidden border ${top.priority === 'P1' ? 'border-rose-500/50 bg-rose-950/40' : 'border-orange-500/30 bg-orange-950/20'}">
      <a href="#/ticketing?id=${top.id}" class="flex items-center gap-2 px-4 py-2 ${top.priority === 'P1' ? 'bg-rose-600/30' : 'bg-orange-500/15'} shrink-0"><span class="w-2 h-2 rounded-md ${top.priority === 'P1' ? 'bg-rose-500 pulse-ring' : 'bg-orange-400'}"></span><span class="font-label-sm text-label-sm ${top.priority === 'P1' ? 'text-rose-200' : 'text-orange-200'}">Protokol insiden prioritas ${top.priority.slice(1)}</span></a>
      <div class="ticker-wrap flex-1 py-2"><div class="ticker-move font-body-sm text-body-sm text-on-surface">${crit.slice(0, 6).map((t) => `<b class="${t.priority === 'P1' ? 'text-rose-300' : 'text-orange-300'}">${t.priority} ${t.id}:</b> ${esc(t.title)}, ${esc(t.location)} (${Store.STATUS_LABEL[t.status]}, SOP ${t.sop})`).join('<span class="mx-6 text-outline">◆</span>')}</div></div>
      <a href="#/sop?id=${top.sop}" class="flex items-center px-3 font-label-sm text-label-sm text-on-surface-variant hover:text-primary shrink-0">SOP ${top.sop}</a></div>` : '';
    // Tulis ulang hanya bila isinya berubah, supaya animasi geser tidak mulai lagi dari awal.
    const tk = document.getElementById('ticker');
    if (tk.dataset.html !== tickerHtml) { tk.innerHTML = tickerHtml; tk.dataset.html = tickerHtml; }
  }

  function route() {
    current = parse();
    const V = window.Views[current.route];
    const view = document.getElementById('view');
    view.innerHTML = V.render(current.params);
    V.mount && V.mount(view, current.params);
    renderNav();
    renderHeader();
    tick();
    document.title = V.title + ' · Summarecon Mall Command Center';
  }
  let rerenderT = null;
  function rerender() {
    clearTimeout(rerenderT);
    rerenderT = setTimeout(() => {
      const V = window.Views[current.route];
      renderNav(); renderHeader();
      if (!V.live) return;
      const y = window.scrollY;
      const keep = V.keep ? V.keep() : null;
      const view = document.getElementById('view');
      view.innerHTML = V.render(current.params);
      V.mount && V.mount(view, current.params, keep);
      window.scrollTo(0, y);
      tick();
    }, 60);
  }

  // countdown elemen: data-due (ms), data-start
  function tick() {
    document.querySelectorAll('[data-due]').forEach((el) => {
      const due = +el.dataset.due;
      const rem = due - Date.now();
      el.textContent = rem >= 0 ? UI.dur(rem) + ' tersisa' : 'Terlambat ' + UI.dur(-rem);
      el.classList.toggle('text-rose-300', rem < 0);
    });
    document.querySelectorAll('[data-clock]').forEach((el) => (el.textContent = UI.time(Date.now()) + ' WIB'));
  }

  // ------------------------------------------------------------ modal buat tiket (dipakai semua dashboard)
  function newTicket(pre) {
    pre = pre || {};
    const S = window.SEED;
    const sops = REF.sops;
    const body = `<form id="f-new" class="grid grid-cols-2 gap-4">
      <label class="f col-span-2">Judul insiden<input class="inp" name="title" required value="${esc(pre.title || '')}" placeholder="mis. AC Food Court panas 27°C"></label>
      <label class="f col-span-2">Deskripsi<textarea class="inp" name="desc" rows="2">${esc(pre.desc || '')}</textarea></label>
      <label class="f">SOP acuan (prioritas otomatis)<select class="inp" name="sop">${sops.map((s) => `<option value="${s.id}" ${pre.sop === s.id ? 'selected' : ''}>${s.id} · ${esc(s.title)}</option>`).join('')}</select></label>
      <label class="f">Prioritas<select class="inp" name="priority">${['P1', 'P2', 'P3', 'P4'].map((p) => `<option ${pre.priority === p ? 'selected' : ''} value="${p}">${p} · ${UI.PRIO[p].label} (respons ${Store.SLA[p].respond}m / resolusi ${Store.SLA[p].resolveText})</option>`).join('')}</select></label>
      <label class="f">Kategori domain<select class="inp" name="category">${S.CATEGORIES.map((c) => `<option ${pre.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="f">Zona / lantai<select class="inp" name="zone">${S.ZONES.map((z) => `<option value="${z.id}" ${pre.zone === z.id ? 'selected' : ''}>${z.name}</option>`).join('')}</select></label>
      <label class="f">Lokasi detail<input class="inp" name="location" value="${esc(pre.location || '')}" placeholder="mis. Unit GF-104 / Koridor 2F"></label>
      <label class="f">Sumber laporan<input class="inp" name="source" value="${esc(pre.source || 'Manual (Operator)')}"></label>
      <label class="f">Tenant (opsional)<select class="inp" name="tenant"><option value="">Tidak terkait tenant</option>${S.TENANTS.map((t) => `<option value="${t.id}" ${pre.tenant === t.id ? 'selected' : ''}>${esc(t.name)} (${t.id})</option>`).join('')}</select></label>
      <label class="f">Kamera terkait<select class="inp" name="cam"><option value="">Tanpa kamera</option>${S.CAMERAS.map((c) => `<option value="${c.id}" ${pre.cam === c.id ? 'selected' : ''}>${c.id} · ${esc(c.name)}</option>`).join('')}</select></label>
      <label class="f">Tim yang ditugaskan<select class="inp" name="team">${S.TEAMS.map((t) => `<option ${pre.team === t.name ? 'selected' : ''}>${t.name}</option>`).join('')}<option ${pre.team === 'Tenant Relation' ? 'selected' : ''}>Tenant Relation</option></select></label>
      <div class="col-span-2 inner p-3 font-body-sm text-body-sm text-on-surface-variant" id="sop-hint"></div>
      <div class="col-span-2 flex justify-end gap-2"><button type="button" class="btn-ghost" data-close>Batal</button><button class="btn">${icon('add_circle')} Buat tiket</button></div></form>`;
    const root = UI.modal(icon('confirmation_number', 'text-primary text-[22px] align-middle') + ' Buat tiket insiden', body, { wide: true });
    const f = root.querySelector('#f-new');
    const hint = () => {
      const s = Store.SOP[f.sop.value];
      root.querySelector('#sop-hint').innerHTML = `<b class="text-on-surface">${s.id}</b>, PIC ${esc(REF.roles[s.pic])}, dashboard utama <b class="text-primary">${s.dashboard}</b>, terkait ${esc(s.related)}<br>Pemicu: ${esc(s.trigger)}<br>Aksi otomatis: ${esc(s.auto_action)}`;
    };
    f.sop.addEventListener('change', () => { const p = Store.SOP[f.sop.value].priority; if (p.startsWith('P')) f.priority.value = p.slice(0, 2); hint(); });
    hint();
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const o = Object.fromEntries(new FormData(f).entries());
      o.fromDb = pre.fromDb;
      const t = Store.createTicket(o);
      UI.closeModal();
      UI.toast(`Tiket <b>${t.id}</b> dibuat`, t.priority, `${t.priority}, SLA respons ${Store.SLA[t.priority].respond} menit, ${t.sop}`);
      if (pre.cam) Store.camAlert(pre.cam, t.title, t.priority, t.id);
      location.hash = '#/ticketing?id=' + t.id;
    });
  }

  function broadcast(pre) {
    const S = window.SEED;
    const tpl = [
      'Code Red: Mohon karyawan tenant di zona terdampak melakukan evakuasi melalui tangga darurat terdekat.',
      'Gangguan suplai listrik PLN, daya genset aktif. Mohon kurangi beban non-esensial.',
      'Imbauan hemat energi WBP 18:00-22:00: matikan beban non-esensial.',
      'Uji alarm kebakaran terjadwal pukul 23:00 WIB. Mohon abaikan bunyi alarm.',
    ];
    const root = UI.modal(icon('campaign', 'text-rose-400 text-[22px] align-middle') + ' Kirim siaran ke tenant & personel', `
      <form id="f-bc" class="flex flex-col gap-4">
        <label class="f">Zona sasaran<select class="inp" name="zone"><option value="ALL">Semua zona</option>${S.ZONES.map((z) => `<option value="${z.id}">${z.name}</option>`).join('')}</select></label>
        <label class="f">Pesan<textarea class="inp" name="text" rows="3" required>${esc(pre || '')}</textarea></label>
        <div class="flex flex-wrap gap-2">${tpl.map((t, i) => `<button type="button" class="chip-btn" data-tpl="${i}">Template ${i + 1}</button>`).join('')}</div>
        <div class="font-body-sm text-body-sm text-on-surface-variant">Kanal: notifikasi Tenant App, WhatsApp Business API, PA system zona, dan radio HT. Siaran tercatat sebagai event <code>EVT-TENANT-BROADCAST</code> di Layanan Tenant &amp; SLA.</div>
        <div class="flex justify-end gap-2"><button type="button" class="btn-ghost" data-close>Batal</button><button class="btn-danger">${icon('send')} Kirim siaran</button></div></form>`);
    const f = root.querySelector('#f-bc');
    root.querySelectorAll('[data-tpl]').forEach((b) => b.addEventListener('click', () => (f.text.value = tpl[+b.dataset.tpl])));
    f.addEventListener('submit', (e) => { e.preventDefault(); Store.broadcast(f.text.value, f.zone.value === 'ALL' ? '' : f.zone.value); UI.closeModal(); UI.toast('Siaran dikirim ke ' + (f.zone.value === 'ALL' ? 'semua zona' : 'zona ' + f.zone.value), 'P2'); });
  }

  window.Shell = { newTicket, broadcast, rerender, tick, get current() { return current; } };

  document.getElementById('btn-broadcast').addEventListener('click', () => broadcast());
  document.getElementById('btn-reset').addEventListener('click', () => { if (confirm('Reset seluruh data demo ke kondisi awal?')) { Store.reset(); UI.toast('Data demo direset', 'P4'); } });
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
  Store.subscribe(() => rerender());
  setInterval(() => {
    tick();
    const l = 12 + Math.round(Math.random() * 5);
    document.getElementById('tele-lat').textContent = l + 'ms';
  }, 1000);
  route();
})();
