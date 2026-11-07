/* DB-PARK Parking & Mobility (pilar 4 mindmap) */
(function () {
  window.Views = window.Views || {};
  const { esc, icon, num } = UI;
  const REV = [2.1, 1.2, 0.6, 0.4, 0.3, 0.5, 1.4, 3.2, 5.8, 7.9, 9.4, 11.2, 12.6, 12.1, 11.4, 11.8, 12.9, 14.2, 15.1, 14.0, 11.6, 8.3, 5.1, 3.0];

  window.Views.parking = {
    title: 'Parkir & Mobilitas', live: true,
    render() {
      const P = window.SEED.PARKING;
      const D = Store.s.devices;
      const gates = Object.entries(D).filter(([, d]) => d.type === 'gate');
      const evs = Object.entries(D).filter(([, d]) => d.type === 'ev');
      const car = P.filter((z) => z.id !== 'MTR');
      const cap = car.reduce((a, z) => a + z.cap, 0), used = car.reduce((a, z) => a + z.used, 0);
      const maxQ = Math.max(...gates.map(([, g]) => g.queue));
      const tk = Store.activeTickets().filter((t) => t.zone === 'BASEMENT' || /parkir|gate|drop-off/i.test(t.title));
      const anpr = [['14:21:08', 'B 1204 KOS', 'B1 Zona C', 'Pelanggaran jalur damkar', 'text-rose-300'], ['14:20:55', 'B 2871 PJN', 'Gate P1', 'Masuk, member Gold', 'text-on-surface'], ['14:20:41', 'B 1990 SKY', 'Gate Keluar', 'Keluar, QRIS Rp 12.000', 'text-on-surface'], ['14:20:12', 'D 1445 ABC', 'EV Bay 03', 'Mulai mengisi daya', 'text-secondary'], ['14:19:58', 'B 7710 TRI', 'VIP Lobby', 'Valet terdaftar', 'text-on-surface']];
      return `
      <section class="card pagebar">
        <div class="pagebar-info">
          <span class="stat live"><span class="dot"></span>Smart parking aktif</span>
          <span class="stat">Sensor ultrasonik bay <b>1.724 node</b></span>
          <span class="stat">LPR/ANPR <b>18 kamera</b></span>
          <span class="stat">EVSE <b>OCPP 1.6J</b></span>
        </div>
        <div class="pagebar-actions"><a class="btn-ghost" href="#/cctv?cam=CAM-61">${icon('videocam', 'text-[16px]')} Kamera gate</a><button class="btn" id="newpark">${icon('add_circle')} Buat tiket parkir</button></div>
      </section>
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        ${UI.kpi({ label: 'Okupansi parkir mobil', icon: 'local_parking', value: ((used / cap) * 100).toFixed(1) + '%', unit: num(used) + ' / ' + num(cap) + ' slot', bar: (used / cap) * 100, barcls: used / cap > 0.9 ? 'bg-rose-400' : 'bg-primary-container' })}
        ${UI.kpi({ label: 'Rasio turnover', icon: 'sync', value: '4.1', unit: 'putaran/slot/hari', vcls: 'text-secondary', delta: 'Target 3.8', foot: 'Durasi parkir rata-rata 2j 46m' })}
        ${UI.kpi({ label: 'Waktu antrean gate utama', icon: 'timer', value: Math.max(...gates.map(([, g]) => g.wait)) + 's', vcls: maxQ > 8 ? 'text-tertiary' : 'text-amber-300', delta: maxQ > 8 ? 'Antrean > 8 mobil' : 'Waspada (target 15s)', dcls: 'bg-amber-500/15 text-amber-300', foot: 'Antrean terpanjang ' + maxQ + ' mobil' })}
        ${UI.kpi({ label: 'Pendapatan parkir hari ini', icon: 'payments', value: 'Rp 184.6', unit: 'Jt', foot: 'QRIS 62%, e-Money 31%, member 7%, rekonsiliasi 99.94%' })}
      </div>
      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
        <div class="2xl:col-span-8 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Okupansi per zona & panduan LED', 'Sensor ultrasonik per bay, arahan LED otomatis ke zona kosong (SOP-PRK-06)', '', 'garage')}
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">${P.map((z) => { const pct = (z.used / z.cap) * 100; return `<div class="inner p-4 ${pct > 95 ? 'crit-left' : pct > 85 ? 'warn-left' : 'ok-left'}"><div class="lbl">${esc(z.name)}</div><div class="flex items-end justify-between mt-2"><span class="font-headline-md text-headline-md">${num(z.cap - z.used)}</span><span class="font-label-sm text-label-sm text-on-surface-variant">slot kosong</span></div><div class="mt-2">${UI.bar(pct, pct > 95 ? 'bg-rose-400' : pct > 85 ? 'bg-amber-400' : 'bg-secondary')}</div><div class="font-label-sm text-label-sm text-outline mt-1">${num(z.used)}/${num(z.cap)} · ${pct.toFixed(0)}%</div></div>`; }).join('')}</div></section>
          <section class="card p-5">${UI.h('Status gate & antrean ANPR', 'Buka gate tambahan otomatis jika antrean > 8 mobil (SOP-PRK-01)', '', 'toll')}
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-3">${gates.map(([id, g]) => `<button data-gate="${id}" class="text-left inner p-4 hover:bg-white/5 ${g.status === 'FAULT' ? 'crit-left' : g.queue > 8 ? 'warn-left' : ''}"><div class="flex justify-between items-center"><span class="font-label-md text-label-md">${id}</span>${UI.devStatus(g.status)}</div><div class="font-headline-sm text-headline-sm mt-2">${esc(g.name)}</div><div class="font-label-sm text-label-sm text-outline">${g.dir}</div><div class="flex justify-between mt-3"><div><div class="lbl">Antrean</div><div class="font-headline-md text-headline-md ${g.queue > 8 ? 'text-tertiary' : ''}">${g.queue} <span class="font-label-sm text-label-sm">mobil</span></div></div><div class="text-right"><div class="lbl">Waktu/mobil</div><div class="font-headline-md text-headline-md">${g.wait}s</div></div></div><div class="flex gap-1 mt-2">${Array.from({ length: Math.min(12, g.queue) }, () => `<span class="w-3 h-2 rounded-sm ${g.queue > 8 ? 'bg-rose-400' : 'bg-sky-300'}"></span>`).join('')}</div></button>`).join('')}</div></section>
          <section class="card p-5">${UI.h('Pendapatan parkir per jam', 'Pendapatan gate & nontunai, rekonsiliasi QRIS/e-Money harian (SOP-PRK-04)', UI.link('owner360', 'Ke Komersial & Keuangan', 'font-label-md text-label-md text-primary'), 'payments')}
            ${UI.line([{ data: REV, color: '#4edea3', dot: new Date().getHours() }], { labels: REV.map((_, i) => (i % 3 === 0 ? String(i).padStart(2, '0') : '')), min: 0, h: 190 })}</section>
        </div>
        <div class="2xl:col-span-4 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Drop-off lobi, valet & taksi online', 'Kamera lalu lintas AI CAM-05 (SOP-PRK-03)', '', 'local_taxi')}
            <a href="#/cctv?cam=CAM-05" class="block cam-tile aspect-video mb-3"><div class="scan"></div>${UI.cam(window.SEED.CAMERAS.find((c) => c.id === 'CAM-05'))}<div class="cam-ov top">● CAM-05 Drop-off lobi</div></a>
            ${[['Waktu tunggu lobi utama', '3m 40s', 'text-secondary'], ['Kepadatan jalur drop-off', '68%', 'text-amber-300'], ['Antrean valet', '6 mobil', 'text-on-surface'], ['Waktu tunggu taksi online', '4m 10s', 'text-on-surface'], ['Shuttle feeder berikutnya', '08 menit', 'text-on-surface']].map((r) => `<div class="flex justify-between py-1.5 border-b border-white/5 font-label-md text-label-md"><span class="text-on-surface-variant">${r[0]}</span><span class="${r[2]}">${r[1]}</span></div>`).join('')}</section>
          <section class="card p-5">${UI.h('Stasiun pengisian EV (OCPP)', evs.filter(([, e]) => e.status === 'CHARGING').length + '/' + evs.length + ' sedang mengisi daya', '', 'ev_station')}
            <div class="grid grid-cols-2 gap-2">${evs.map(([id, e]) => `<button data-ev="${id}" class="text-left inner p-3 hover:bg-white/5 ${e.status === 'FAULT' ? 'crit-left' : ''}"><div class="font-label-md text-label-md">${esc(e.name)}</div><div class="mt-1">${UI.devStatus(e.status)}</div><div class="font-label-sm text-label-sm text-outline mt-1">${e.kwh ? e.kwh + ' kWh sesi ini' : '-'}</div></button>`).join('')}</div>
            <div class="font-label-sm text-label-sm text-on-surface-variant mt-3">Pemakaian EV hari ini 412 kWh, uptime 98.2%</div></section>
          <section class="card p-5">${UI.h('Log ANPR', '', '', 'pin')}
            ${anpr.map((a) => `<div class="flex gap-2 py-1.5 border-b border-white/5 font-label-md text-label-md"><span class="text-outline">${a[0]}</span><span class="px-1.5 rounded bg-white/10 text-on-surface">${a[1]}</span><span class="text-on-surface-variant flex-1">${a[2]}</span><span class="${a[4]}">${a[3]}</span></div>`).join('')}</section>
          <section class="card p-5">${UI.h('Tiket area parkir & mobilitas', '', '', 'confirmation_number')}
            ${tk.map((t) => `<a href="#/ticketing?id=${t.id}" class="rel-row mb-2">${UI.prio(t.priority)}<div><div class="font-body-sm text-body-sm">${esc(t.title)}</div><div class="font-label-sm text-label-sm text-outline">${t.id} · <span data-due="${Store.slaInfo(t).due}"></span></div></div></a>`).join('') || '<div class="font-body-sm text-body-sm text-on-surface-variant">Tidak ada tiket aktif.</div>'}</section>
        </div>
      </div>
      ${UI.relasi('PARK')}`;
    },
    mount(root) {
      root.querySelector('#newpark').addEventListener('click', () => Shell.newTicket({ sop: 'SOP-PRK-01', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', team: 'Tim Parkir', source: 'Parkir & Mobilitas', cam: 'CAM-61', fromDb: 'PARK' }));
      root.querySelectorAll('[data-gate]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.gate, g = Store.s.devices[id];
        UI.modal(esc(g.name) + ' <span class="font-label-md text-label-md text-outline">' + id + '</span>', `<div class="flex flex-wrap gap-2">${['NORMAL', 'OPEN', 'FAULT', 'STANDBY'].map((s) => `<button class="chip-btn ${g.status === s ? 'on' : ''}" data-st="${s}">${s}</button>`).join('')}</div><div class="flex justify-end gap-2 mt-4"><a class="btn-ghost" href="#/cctv?cam=CAM-61">CAM-61</a><button class="btn" id="mk">Buat tiket antrean</button></div>`);
        document.querySelectorAll('[data-st]').forEach((x) => x.addEventListener('click', () => { Store.setDevice(id, x.dataset.st); Store.addEvent({ from: 'PARK', to: x.dataset.st === 'FAULT' ? 'TIC' : 'PARK', code: 'EVT-PARK-QUEUE', title: id + ' → ' + x.dataset.st, detail: g.name, sev: x.dataset.st === 'FAULT' ? 'P3' : 'P4' }); UI.closeModal(); }));
        document.getElementById('mk').addEventListener('click', () => Shell.newTicket({ title: 'Antrean ' + g.name + ' ' + g.queue + ' mobil', sop: 'SOP-PRK-01', priority: 'P3', category: 'Keamanan, Parkir & Crowd', zone: 'BASEMENT', location: g.name, source: 'Peringatan antrean ANPR ' + id, team: 'Tim Parkir', cam: 'CAM-61', fromDb: 'PARK' }));
      }));
      root.querySelectorAll('[data-ev]').forEach((b) => b.addEventListener('click', () => { const e = Store.s.devices[b.dataset.ev]; if (e.status === 'FAULT') { Store.setDevice(b.dataset.ev, 'AVAILABLE'); UI.toast(e.name + ' di-reset jarak jauh lewat OCPP', 'P4', 'SOP-PRK-05'); } else UI.toast(e.name + ': ' + e.status, 'P4'); }));
    },
  };
})();
