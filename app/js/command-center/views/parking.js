/* DB-PARK Parking & Mobility (pilar 4 mindmap)
 * Okupansi per zona ada di Store.s.parking (localStorage per browser). Prediksi parkir memakai kendaraan yang
 * didaftarkan pemesan tiket acara (Evt.parkDemand) ditambah pola okupansi harian mal (BASE). Simulasi parkir
 * penuh menaikkan okupansi zona sampai 100%, lalu membuat peringatan + tiket P2 (SOP-PRK-06). */
(function () {
  window.Views = window.Views || {};
  const { esc, icon, num } = UI;
  const REV = [2.1, 1.2, 0.6, 0.4, 0.3, 0.5, 1.4, 3.2, 5.8, 7.9, 9.4, 11.2, 12.6, 12.1, 11.4, 11.8, 12.9, 14.2, 15.1, 14.0, 11.6, 8.3, 5.1, 3.0];
  // Pola okupansi parkir mobil mal tanpa acara (fraksi kapasitas per jam), akhir pekan +6 poin.
  const BASE = [0.05, 0.03, 0.03, 0.03, 0.03, 0.04, 0.06, 0.12, 0.2, 0.3, 0.42, 0.52, 0.6, 0.62, 0.58, 0.56, 0.6, 0.66, 0.7, 0.69, 0.61, 0.46, 0.26, 0.12];
  const HOUR = 3600000, DAY = 24 * HOUR;
  const WARN = 0.85, CRIT = 0.95;

  // Evt.parkDemand dihitung sekali per acara per render (prediksi per jam memanggilnya berulang).
  let pdCache = {};
  const pdOf = (id) => pdCache[id] || (pdCache[id] = Evt.parkDemand(id));
  const zones = () => Store.s.parking;
  const isCar = (z) => z.id !== 'MTR';
  const baseAt = (ts) => { const d = new Date(ts); const wk = d.getDay() === 0 || d.getDay() === 6; return Math.min(0.97, BASE[d.getHours()] + (wk ? 0.06 : 0)); };

  // Acara yang relevan untuk parkir (dijual/berjalan, belum selesai).
  function evList(from, to) {
    if (!window.Evt || !Evt.s) return [];
    return Evt.s.order.map((id) => Evt.ev(id)).filter((e) => e && e.status !== 'DRAFT' && e.status !== 'CANCELLED' && e.start < to && (e.end || e.start + 3 * HOUR) > from);
  }
  // Fraksi kendaraan acara yang sedang parkir pada waktu ts. Acara > 12 jam (bazar beberapa hari): permintaan dibagi per hari,
  // jendela harian mulai jam buka pintu selama 8 jam.
  function presence(pd, ts) {
    const long = pd.end - pd.start > 12 * HOUR;
    if (!long) {
      if (ts >= pd.doors - HOUR && ts < pd.doors) return 0.5;
      return ts >= pd.doors && ts < pd.end ? 1 : 0;
    }
    if (ts < pd.doors - HOUR || ts >= pd.end) return 0;
    const days = Math.max(1, Math.ceil((pd.end - pd.start) / DAY));
    const d0 = new Date(pd.doors), t = new Date(ts);
    const open = new Date(ts); open.setHours(d0.getHours(), d0.getMinutes(), 0, 0);
    const h = (t - open) / HOUR;
    return (h >= -1 && h < 0 ? 0.5 : h >= 0 && h < 8 ? 1 : 0) / days;
  }
  // Kapasitas mobil efektif: Parkir Barat ditutup selama acara yang memakai lahannya.
  function carCap(ts, evs) {
    const closed = evs.some((e) => { const pd = pdOf(e.id); return pd.usesParking && ts >= pd.doors - 2 * HOUR && ts < pd.end; });
    return zones().filter((z) => isCar(z) && !(closed && z.id === 'PB')).reduce((a, z) => a + z.cap, 0);
  }
  const normalCap = () => zones().filter(isCar).reduce((a, z) => a + z.cap, 0);
  // Prediksi okupansi mobil pada waktu ts: pola mal + kendaraan semua acara yang berlangsung.
  function forecastAt(ts, evs) {
    const ev = evs.reduce((a, e) => { const pd = pdOf(e.id); return a + pd.mobil * presence(pd, ts); }, 0);
    const moto = evs.reduce((a, e) => { const pd = pdOf(e.id); return a + pd.motor * presence(pd, ts); }, 0);
    const cap = carCap(ts, evs);
    const cars = baseAt(ts) * normalCap() + ev;
    return { cars, cap, pct: cars / cap, evCars: ev, evMoto: moto };
  }
  const tone = (p) => (p >= CRIT ? ['Penuh', 'text-rose-300', 'crit-left', 'bg-rose-400'] : p >= WARN ? ['Waspada', 'text-amber-300', 'warn-left', 'bg-amber-400'] : ['Aman', 'text-emerald-300', 'ok-left', 'bg-secondary']);
  function advice(p, pd) {
    const a = [];
    if (pd.usesParking) a.push('Parkir Barat ditutup untuk acara, arahkan ke basement');
    if (p >= CRIT) a.push('Buka parkir overflow + shuttle, LED panduan ke zona kosong, tambah 4 petugas gate');
    else if (p >= WARN) a.push('Siagakan petugas gate tambahan dan LED panduan');
    else a.push('Operasi normal');
    return a.join('. ') + '.';
  }

  // Baris prediksi per acara 7 hari ke depan, dihitung pada jam puncak (buka pintu) masing-masing acara.
  function predRows() {
    const t = Date.now(), evs = evList(t - 6 * HOUR, t + 8 * DAY);
    return evs.filter((e) => e.start < t + 7 * DAY).map((e) => {
      const pd = pdOf(e.id);
      const peak = Math.max(pd.doors, Math.min(t, pd.end - HOUR)); // acara yang sedang berjalan: puncak dianggap sekarang
      const f = forecastAt(peak, evList(peak - DAY, peak + DAY));
      return { e, pd, peak, f };
    }).sort((a, b) => a.peak - b.peak);
  }

  // ------------------------------------------------------------ simulasi parkir penuh
  let simT = null;
  function simStep() {
    const s = Store.s.parkSim; if (!s || s.full) { clearInterval(simT); simT = null; return; }
    const ids = s.zone === 'ALL' ? zones().filter((z) => isCar(z) && z.id !== 'PB').map((z) => z.id) : [s.zone];
    ids.forEach((id) => { const z = zones().find((x) => x.id === id); Store.parkSet(id, z.used + Math.max(2, Math.ceil(z.cap * 0.025))); });
    const zs = ids.map((id) => zones().find((x) => x.id === id));
    const used = zs.reduce((a, z) => a + z.used, 0), cap = zs.reduce((a, z) => a + z.cap, 0);
    const name = s.zone === 'ALL' ? 'Parkir mobil (semua zona)' : zs[0].name;
    if (!s.warned && used / cap >= 0.9) { Store.setParkSim(Object.assign({}, Store.s.parkSim, { warned: true })); UI.toast(esc(name) + ' sudah 90%. Siapkan pengalihan.', 'P3', 'SOP-PRK-06'); }
    if (used >= cap) {
      clearInterval(simT); simT = null;
      const alt = zones().filter((z) => isCar(z) && !ids.includes(z.id) && z.cap - z.used > 0).sort((a, b) => (b.cap - b.used) - (a.cap - a.used))[0];
      const to = alt ? alt.name + ' (' + num(alt.cap - alt.used) + ' slot kosong)' : 'parkir overflow';
      const tk = Store.createTicket({ title: name + ' penuh (100%)', desc: 'Sensor bay melaporkan ' + name + ' penuh. Arahkan LED panduan dan petugas ke ' + to + '. Simulasi dari Parkir & Mobilitas.', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', location: name, source: 'Simulasi sensor bay (Parkir & Mobilitas)', sop: 'SOP-PRK-06', cam: 'CAM-42', team: 'Tim Parkir', fromDb: 'PARK' });
      Store.addEvent({ from: 'PARK', to: 'TIC', code: 'EVT-PARK-FULL', title: name + ' penuh', detail: 'Alihkan ke ' + to, sev: 'P2', ticketId: tk.id });
      Store.setParkSim(Object.assign({}, Store.s.parkSim, { full: true, at: Date.now(), ticketId: tk.id, to, name }));
      UI.toast('<b>Parkir penuh:</b> ' + esc(name) + '. Tiket ' + tk.id + ' dibuat, alihkan ke ' + esc(to) + '.', 'P2', 'SOP-PRK-06');
    }
  }
  function startSim(zone) {
    if (Store.s.parkSim) return;
    Store.setParkSim({ zone, base: zones().map((z) => [z.id, z.used]), startedAt: Date.now(), full: false });
    simT = setInterval(simStep, 800);
  }
  function endSim() {
    const s = Store.s.parkSim; if (!s) return;
    clearInterval(simT); simT = null;
    s.base.forEach(([id, used]) => Store.parkSet(id, used));
    Store.setParkSim(null);
    UI.toast('Simulasi parkir penuh diakhiri, okupansi kembali ke data sensor.', 'P4');
  }
  // Simulasi yang masih berjalan saat halaman dimuat ulang dilanjutkan.
  if (Store.s.parkSim && !Store.s.parkSim.full) simT = setInterval(simStep, 800);

  function simBanner() {
    const s = Store.s.parkSim; if (!s) return '';
    if (!s.full) {
      const ids = s.zone === 'ALL' ? zones().filter((z) => isCar(z) && z.id !== 'PB') : zones().filter((z) => z.id === s.zone);
      const pct = (ids.reduce((a, z) => a + z.used, 0) / ids.reduce((a, z) => a + z.cap, 0)) * 100;
      return `<section class="card p-4 mb-5 warn-left flex flex-wrap items-center gap-3"><span class="text-amber-300">${icon('directions_car', 'text-[22px]')}</span><div class="flex-1 min-w-0"><div class="font-headline-sm text-headline-sm">Simulasi berjalan: ${esc(s.zone === 'ALL' ? 'semua zona mobil' : ids[0].name)} ${pct.toFixed(0)}%</div><div class="font-label-sm text-label-sm text-on-surface-variant">Okupansi naik bertahap. Peringatan muncul di 90% dan tiket dibuat saat penuh.</div></div><button class="btn-ghost" data-sim-end>${icon('stop_circle', 'text-[16px]')} Akhiri simulasi</button></section>`;
    }
    return `<section class="card p-4 mb-5 crit-left flex flex-wrap items-center gap-3" role="alert"><span class="text-rose-300 pulse-ring rounded-full">${icon('warning', 'text-[24px]')}</span><div class="flex-1 min-w-0"><div class="font-headline-sm text-headline-sm text-rose-300">Parkir penuh: ${esc(s.name)}</div><div class="font-body-sm text-body-sm text-on-surface-variant">Alihkan kendaraan ke ${esc(s.to)}. LED panduan dan petugas gate diarahkan sesuai SOP-PRK-06.</div></div><a class="btn-ghost" href="/command-center/ticketing?id=${s.ticketId}">${icon('confirmation_number', 'text-[16px]')} ${s.ticketId}</a><button class="btn-ghost" data-sim-end>${icon('restart_alt', 'text-[16px]')} Akhiri simulasi</button></section>`;
  }

  window.Views.parking = {
    title: 'Parkir & Mobilitas', live: true,
    render() {
      pdCache = {};
      const P = zones();
      const D = Store.s.devices;
      const gates = Object.entries(D).filter(([, d]) => d.type === 'gate');
      const evs = Object.entries(D).filter(([, d]) => d.type === 'ev');
      const now = Date.now();
      const evNow = evList(now - DAY, now + DAY);
      const pbEv = evNow.find((e) => { const pd = pdOf(e.id); return pd.usesParking && now >= pd.doors - 2 * HOUR && now < pd.end; });
      const car = P.filter((z) => isCar(z) && !(pbEv && z.id === 'PB'));
      const cap = car.reduce((a, z) => a + z.cap, 0), used = car.reduce((a, z) => a + z.used, 0);
      const maxQ = Math.max(...gates.map(([, g]) => g.queue));
      const tk = Store.activeTickets().filter((t) => t.zone === 'BASEMENT' || /parkir|gate|drop-off/i.test(t.title));
      // Prediksi per jam hari ini (00-23).
      const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
      const hrs = Array.from({ length: 24 }, (_, h) => d0.getTime() + h * HOUR + 30 * 60000);
      const evToday = evList(d0.getTime() - DAY, d0.getTime() + 2 * DAY);
      const fc = hrs.map((ts) => forecastAt(ts, evToday));
      const peakI = fc.reduce((bi, f, i) => (f.pct > fc[bi].pct ? i : bi), 0);
      const rows = predRows();
      // ANPR: plat kendaraan peserta acara hari ini ikut tercatat dan ditandai.
      const reg = {};
      evNow.forEach((e) => Object.values(Evt.s.orders).forEach((o) => { if (o.ev === e.id && o.veh && o.status === 'PAID') reg[o.veh.p] = e.id; }));
      const regPlates = Object.keys(reg).slice(-2);
      const hh = (m) => { const x = new Date(now - m * 60000); return [x.getHours(), x.getMinutes(), x.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':'); };
      const anpr = regPlates.map((p, i) => [hh(i + 0.3), p, 'Gate P1', 'Masuk, peserta ' + reg[p], 'text-secondary']).concat([['14:21:08', 'B 1204 KOS', 'B1 Zona C', 'Pelanggaran jalur damkar', 'text-rose-300'], ['14:20:55', 'B 2871 PJN', 'Gate P1', 'Masuk, member Gold', 'text-on-surface'], ['14:20:41', 'B 1990 SKY', 'Gate Keluar', 'Keluar, QRIS Rp 12.000', 'text-on-surface'], ['14:20:12', 'D 1445 ABC', 'EV Bay 03', 'Mulai mengisi daya', 'text-secondary'], ['14:19:58', 'B 7710 TRI', 'VIP Lobby', 'Valet terdaftar', 'text-on-surface']]).slice(0, 6);
      return `
      <section class="card pagebar">
        <div class="pagebar-info">
          <span class="stat live"><span class="dot"></span>Smart parking aktif</span>
          <span class="stat">Sensor ultrasonik bay <b>1.724 node</b></span>
          <span class="stat">LPR/ANPR <b>18 kamera</b></span>
          <span class="stat">EVSE <b>OCPP 1.6J</b></span>
        </div>
        <div class="pagebar-actions"><a class="btn-ghost" href="/command-center/cctv?cam=CAM-61">${icon('videocam', 'text-[16px]')} Kamera gate</a><button class="btn-ghost" id="simpark" ${Store.s.parkSim ? 'disabled' : ''}>${icon('car_crash', 'text-[16px]')} Simulasi parkir penuh</button><button class="btn" id="newpark">${icon('add_circle')} Buat tiket parkir</button></div>
      </section>
      ${simBanner()}
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        ${UI.kpi({ label: 'Okupansi parkir mobil', icon: 'local_parking', value: ((used / cap) * 100).toFixed(1) + '%', unit: num(used) + ' / ' + num(cap) + ' slot', bar: (used / cap) * 100, barcls: used / cap > 0.9 ? 'bg-rose-400' : 'bg-primary-container' })}
        ${UI.kpi({ label: 'Prediksi puncak hari ini', icon: 'query_stats', value: (Math.min(fc[peakI].pct, 1.5) * 100).toFixed(0) + '%', unit: 'pukul ' + String(peakI).padStart(2, '0') + '.00', vcls: tone(fc[peakI].pct)[1], foot: num(Math.round(fc[peakI].evCars)) + ' mobil dari acara, ' + num(Math.round(fc[peakI].cars)) + ' / ' + num(fc[peakI].cap) + ' slot' })}
        ${UI.kpi({ label: 'Waktu antrean gate utama', icon: 'timer', value: Math.max(...gates.map(([, g]) => g.wait)) + 's', vcls: maxQ > 8 ? 'text-tertiary' : 'text-amber-300', delta: maxQ > 8 ? 'Antrean > 8 mobil' : 'Waspada (target 15s)', dcls: 'bg-amber-500/15 text-amber-300', foot: 'Antrean terpanjang ' + maxQ + ' mobil' })}
        ${UI.kpi({ label: 'Pendapatan parkir hari ini', icon: 'payments', value: 'Rp 184.6', unit: 'Jt', foot: 'QRIS 62%, e-Money 31%, member 7%, rekonsiliasi 99.94%' })}
      </div>
      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
        <div class="2xl:col-span-8 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Okupansi per zona & panduan LED', 'Sensor ultrasonik per bay, arahan LED otomatis ke zona kosong (SOP-PRK-06)', '', 'garage')}
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">${P.map((z) => { const shut = z.id === 'PB' && pbEv; const pct = (z.used / z.cap) * 100; return `<div class="inner p-4 ${shut ? '' : pct > 95 ? 'crit-left' : pct > 85 ? 'warn-left' : 'ok-left'}"><div class="lbl">${esc(z.name)}</div>${shut ? `<div class="font-headline-sm text-headline-sm mt-2 text-amber-300">Dipakai acara</div><div class="font-label-sm text-label-sm text-on-surface-variant mt-1">${esc(pbEv.name)}</div>` : `<div class="flex items-end justify-between mt-2"><span class="font-headline-md text-headline-md">${num(z.cap - z.used)}</span><span class="font-label-sm text-label-sm text-on-surface-variant">slot kosong</span></div><div class="mt-2">${UI.bar(pct, pct > 95 ? 'bg-rose-400' : pct > 85 ? 'bg-amber-400' : 'bg-secondary')}</div><div class="font-label-sm text-label-sm text-outline mt-1">${num(z.used)}/${num(z.cap)} · ${pct.toFixed(0)}%</div>`}</div>`; }).join('')}</div></section>
          <section class="card p-5">${UI.h('Prediksi okupansi parkir mobil hari ini', 'Pola harian mal ditambah kendaraan peserta acara (data pemesan tiket). Garis merah = kapasitas.', '', 'query_stats')}
            ${UI.line([{ data: fc.map((f) => Math.round(f.pct * 100)), color: '#38bdf8', dot: new Date(now).getHours() }, { data: fc.map((f) => Math.round((f.cars - f.evCars) / f.cap * 100)), color: '#94a3b8' }], { labels: hrs.map((_, i) => (i % 3 === 0 ? String(i).padStart(2, '0') : '')), min: 0, max: Math.max(110, ...fc.map((f) => Math.ceil(f.pct * 100) + 5)), h: 200, refLine: 100, refLabel: 'Kapasitas 100%', unit: '%' })}
            <div class="flex flex-wrap gap-4 mt-2 font-label-sm text-label-sm text-on-surface-variant"><span><span class="inline-block w-3 h-1.5 rounded-sm bg-sky-300 align-middle mr-1"></span>Dengan acara</span><span><span class="inline-block w-3 h-1.5 rounded-sm bg-slate-400 align-middle mr-1"></span>Tanpa acara</span><span>Puncak ${String(peakI).padStart(2, '0')}.00: <b class="${tone(fc[peakI].pct)[1]}">${(fc[peakI].pct * 100).toFixed(0)}% (${tone(fc[peakI].pct)[0]})</b>, ${num(Math.round(fc[peakI].evMoto))} motor dari acara</span></div></section>
          <section class="card p-5">${UI.h('Prediksi parkir dari acara', 'Acara 7 hari ke depan. Kendaraan terdaftar dari form pemesanan, sisanya proyeksi rasio kendaraan per pesanan.', UI.link('event', 'Ke Pemantauan Event', 'font-label-md text-label-md text-primary'), 'event_available')}
            <div class="overflow-x-auto"><table class="tbl min-w-[720px]"><thead><tr><th>Acara</th><th>Jam puncak</th><th class="text-right">Mobil</th><th class="text-right">Motor</th><th>Okupansi puncak</th><th>Rekomendasi</th><th></th></tr></thead><tbody>
            ${rows.map(({ e, pd, peak, f }) => { const [lbl, cls] = tone(f.pct); return `<tr><td><div class="font-body-sm text-body-sm">${esc(e.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${e.id} · ${esc(pd.area)}${pd.usesParking ? ' · <span class="text-amber-300">pakai lahan parkir</span>' : ''}</div></td><td class="font-label-md text-label-md whitespace-nowrap">${Evt.fmtShort(peak)}, ${Evt.fmtTime(peak)}</td><td class="text-right font-label-md text-label-md">${num(pd.mobil)}<div class="font-label-sm text-label-sm text-on-surface-variant">${num(pd.declared.mobil)} terdaftar</div></td><td class="text-right font-label-md text-label-md">${num(pd.motor)}<div class="font-label-sm text-label-sm text-on-surface-variant">${num(pd.declared.motor)} terdaftar</div></td><td><div class="flex justify-between font-label-md text-label-md"><b class="${cls}">${lbl}</b><span>${(f.pct * 100).toFixed(0)}%</span></div>${UI.bar(f.pct * 100, tone(f.pct)[3])}<div class="font-label-sm text-label-sm text-outline mt-1">basis ${pd.basis}${pd.answered ? ', ' + num(pd.answered) + ' pesanan menjawab' : ''}</div></td><td class="font-body-sm text-body-sm text-on-surface-variant min-w-[220px]">${esc(advice(f.pct, pd))}</td><td>${f.pct >= WARN || pd.usesParking ? `<button class="btn-ghost whitespace-nowrap" data-prep="${e.id}">${icon('assignment_add', 'text-[16px]')} Tiket persiapan</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="7" class="text-on-surface-variant">Tidak ada acara dalam 7 hari ke depan.</td></tr>'}
            </tbody></table></div></section>
          <section class="card p-5">${UI.h('Status gate & antrean ANPR', 'Buka gate tambahan otomatis jika antrean > 8 mobil (SOP-PRK-01)', '', 'toll')}
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-3">${gates.map(([id, g]) => `<button data-gate="${id}" class="text-left inner p-4 hover:bg-white/5 ${g.status === 'FAULT' ? 'crit-left' : g.queue > 8 ? 'warn-left' : ''}"><div class="flex justify-between items-center"><span class="font-label-md text-label-md">${id}</span>${UI.devStatus(g.status)}</div><div class="font-headline-sm text-headline-sm mt-2">${esc(g.name)}</div><div class="font-label-sm text-label-sm text-outline">${g.dir}</div><div class="flex justify-between mt-3"><div><div class="lbl">Antrean</div><div class="font-headline-md text-headline-md ${g.queue > 8 ? 'text-tertiary' : ''}">${g.queue} <span class="font-label-sm text-label-sm">mobil</span></div></div><div class="text-right"><div class="lbl">Waktu/mobil</div><div class="font-headline-md text-headline-md">${g.wait}s</div></div></div><div class="flex gap-1 mt-2">${Array.from({ length: Math.min(12, g.queue) }, () => `<span class="w-3 h-2 rounded-sm ${g.queue > 8 ? 'bg-rose-400' : 'bg-sky-300'}"></span>`).join('')}</div></button>`).join('')}</div></section>
          <section class="card p-5">${UI.h('Pendapatan parkir per jam', 'Pendapatan gate & nontunai, rekonsiliasi QRIS/e-Money harian (SOP-PRK-04)', UI.link('owner360', 'Ke Komersial & Keuangan', 'font-label-md text-label-md text-primary'), 'payments')}
            ${UI.line([{ data: REV, color: '#4edea3', dot: new Date().getHours() }], { labels: REV.map((_, i) => (i % 3 === 0 ? String(i).padStart(2, '0') : '')), min: 0, h: 190 })}</section>
        </div>
        <div class="2xl:col-span-4 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Drop-off lobi, valet & taksi online', 'Kamera lalu lintas AI CAM-05 (SOP-PRK-03)', '', 'local_taxi')}
            <a href="/command-center/cctv?cam=CAM-05" class="block cam-tile aspect-video mb-3"><div class="scan"></div>${UI.cam(window.SEED.CAMERAS.find((c) => c.id === 'CAM-05'))}<div class="cam-ov top">● CAM-05 Drop-off lobi</div></a>
            ${[['Waktu tunggu lobi utama', '3m 40s', 'text-secondary'], ['Kepadatan jalur drop-off', '68%', 'text-amber-300'], ['Antrean valet', '6 mobil', 'text-on-surface'], ['Waktu tunggu taksi online', '4m 10s', 'text-on-surface'], ['Shuttle feeder berikutnya', '08 menit', 'text-on-surface']].map((r) => `<div class="flex justify-between py-1.5 border-b border-white/5 font-label-md text-label-md"><span class="text-on-surface-variant">${r[0]}</span><span class="${r[2]}">${r[1]}</span></div>`).join('')}</section>
          <section class="card p-5">${UI.h('Stasiun pengisian EV (OCPP)', evs.filter(([, e]) => e.status === 'CHARGING').length + '/' + evs.length + ' sedang mengisi daya', '', 'ev_station')}
            <div class="grid grid-cols-2 gap-2">${evs.map(([id, e]) => `<button data-ev="${id}" class="text-left inner p-3 hover:bg-white/5 ${e.status === 'FAULT' ? 'crit-left' : ''}"><div class="font-label-md text-label-md">${esc(e.name)}</div><div class="mt-1">${UI.devStatus(e.status)}</div><div class="font-label-sm text-label-sm text-outline mt-1">${e.kwh ? e.kwh + ' kWh sesi ini' : '-'}</div></button>`).join('')}</div>
            <div class="font-label-sm text-label-sm text-on-surface-variant mt-3">Pemakaian EV hari ini 412 kWh, uptime 98.2%</div></section>
          <section class="card p-5">${UI.h('Log ANPR', Object.keys(reg).length ? num(Object.keys(reg).length) + ' plat peserta acara hari ini terdaftar' : '', '', 'pin')}
            ${anpr.map((a) => `<div class="flex gap-2 py-1.5 border-b border-white/5 font-label-md text-label-md"><span class="text-outline">${a[0]}</span><span class="px-1.5 rounded bg-white/10 text-on-surface">${esc(a[1])}</span><span class="text-on-surface-variant flex-1">${a[2]}</span><span class="${a[4]}">${esc(a[3])}</span></div>`).join('')}</section>
          <section class="card p-5">${UI.h('Tiket area parkir & mobilitas', '', '', 'confirmation_number')}
            ${tk.map((t) => `<a href="/command-center/ticketing?id=${t.id}" class="rel-row mb-2">${UI.prio(t.priority)}<div><div class="font-body-sm text-body-sm">${esc(t.title)}</div><div class="font-label-sm text-label-sm text-outline">${t.id} · <span data-due="${Store.slaInfo(t).due}"></span></div></div></a>`).join('') || '<div class="font-body-sm text-body-sm text-on-surface-variant">Tidak ada tiket aktif.</div>'}</section>
        </div>
      </div>
      ${UI.relasi('PARK')}`;
    },
    mount(root) {
      root.querySelector('#newpark').addEventListener('click', () => Shell.newTicket({ sop: 'SOP-PRK-01', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', team: 'Tim Parkir', source: 'Parkir & Mobilitas', cam: 'CAM-61', fromDb: 'PARK' }));
      root.querySelector('#simpark').addEventListener('click', () => {
        const opts = [['ALL', 'Semua zona mobil']].concat(zones().filter((z) => z.id !== 'PB').map((z) => [z.id, z.name]));
        UI.modal(icon('car_crash', 'text-primary text-[22px] align-middle') + ' Simulasi parkir penuh', `<p class="font-body-sm text-body-sm text-on-surface-variant mb-3">Okupansi zona dinaikkan bertahap sampai penuh. Di 90% muncul peringatan, di 100% Command Center membuat peringatan parkir penuh dan tiket P2 untuk Tim Parkir (SOP-PRK-06). Data sensor dikembalikan saat simulasi diakhiri.</p><div class="flex flex-wrap gap-2">${opts.map(([k, l]) => `<button class="chip-btn" data-simz="${k}">${esc(l)}</button>`).join('')}</div>`);
        document.querySelectorAll('[data-simz]').forEach((b) => b.addEventListener('click', () => { UI.closeModal(); startSim(b.dataset.simz); }));
      });
      root.querySelectorAll('[data-sim-end]').forEach((b) => b.addEventListener('click', endSim));
      root.querySelectorAll('[data-prep]').forEach((b) => b.addEventListener('click', () => {
        pdCache = {};
        const r = predRows().find((x) => x.e.id === b.dataset.prep); if (!r) return;
        Shell.newTicket({ title: 'Persiapan parkir ' + r.e.name, desc: 'Prediksi ' + r.pd.mobil + ' mobil dan ' + r.pd.motor + ' motor, okupansi puncak ' + (r.f.pct * 100).toFixed(0) + '% pada ' + Evt.fmtShort(r.peak) + ' ' + Evt.fmtTime(r.peak) + '. ' + advice(r.f.pct, r.pd), sop: 'SOP-PRK-06', priority: r.f.pct >= CRIT ? 'P2' : 'P3', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', location: r.pd.area, team: 'Tim Parkir', source: 'Prediksi parkir acara ' + r.e.id, cam: 'CAM-61', fromDb: 'PARK' });
      }));
      root.querySelectorAll('[data-gate]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.gate, g = Store.s.devices[id];
        UI.modal(esc(g.name) + ' <span class="font-label-md text-label-md text-outline">' + id + '</span>', `<div class="flex flex-wrap gap-2">${['NORMAL', 'OPEN', 'FAULT', 'STANDBY'].map((s) => `<button class="chip-btn ${g.status === s ? 'on' : ''}" data-st="${s}">${s}</button>`).join('')}</div><div class="flex justify-end gap-2 mt-4"><a class="btn-ghost" href="/command-center/cctv?cam=CAM-61">CAM-61</a><button class="btn" id="mk">Buat tiket antrean</button></div>`);
        document.querySelectorAll('[data-st]').forEach((x) => x.addEventListener('click', () => { Store.setDevice(id, x.dataset.st); Store.addEvent({ from: 'PARK', to: x.dataset.st === 'FAULT' ? 'TIC' : 'PARK', code: 'EVT-PARK-QUEUE', title: id + ' → ' + x.dataset.st, detail: g.name, sev: x.dataset.st === 'FAULT' ? 'P3' : 'P4' }); UI.closeModal(); }));
        document.getElementById('mk').addEventListener('click', () => Shell.newTicket({ title: 'Antrean ' + g.name + ' ' + g.queue + ' mobil', sop: 'SOP-PRK-01', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', location: g.name, source: 'Peringatan antrean ANPR ' + id, team: 'Tim Parkir', cam: 'CAM-61', fromDb: 'PARK' }));
      }));
      root.querySelectorAll('[data-ev]').forEach((b) => b.addEventListener('click', () => { const e = Store.s.devices[b.dataset.ev]; if (e.status === 'FAULT') { Store.setDevice(b.dataset.ev, 'AVAILABLE'); UI.toast(e.name + ' di-reset jarak jauh lewat OCPP', 'P4', 'SOP-PRK-05'); } else UI.toast(e.name + ': ' + e.status, 'P4'); }));
    },
  };
  // Prediksi memakai data acara (Evt): render ulang saat data acara berubah, paling sering 5 detik sekali.
  window.addEventListener('load', () => {
    if (!window.Evt) return;
    let last = 0;
    Evt.subscribe(() => { if (Shell.current.route !== 'parking' || Date.now() - last < 5000) return; last = Date.now(); Shell.rerender(); });
  });
})();
