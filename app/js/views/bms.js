/* DB-BMS Facility & BMS Control */
(function () {
  window.Views = window.Views || {};
  const { esc, icon } = UI;
  const BAD = ['TRIP', 'FAULT', 'LEAK', 'OFF'];
  const SOPBY = { chiller: 'SOP-BMS-01', ahu: 'SOP-BMS-01', lift: 'SOP-BMS-05', esc: 'SOP-BMS-05', trafo: 'SOP-BMS-03', genset: 'SOP-BMS-03' };
  const CAMBY = { 'ESC-E04': 'CAM-29', 'CH-04': 'CAM-17', 'AHU-FC': 'CAM-08', 'AHU-ATR': 'CAM-01', 'AHU-LUX': 'CAM-14', 'AHU-CIN': 'CAM-71' };
  let area = 'ALL';

  function devModal(id) {
    const d = Store.s.devices[id];
    const opts = { chiller: ['RUNNING', 'STANDBY', 'WARN', 'LEAK', 'TRIP'], ahu: ['RUNNING', 'BOOST', 'FAULT', 'OFF'], lift: ['RUNNING', 'FAULT'], esc: ['RUNNING', 'WARN', 'TRIP'], trafo: ['RUNNING', 'FAULT'], genset: ['STANDBY', 'RUNNING', 'FAULT'] }[d.type] || ['RUNNING', 'FAULT'];
    const rel = Store.activeTickets().filter((t) => (t.source + t.title + t.desc).includes(d.name) || (t.source || '').includes(id));
    const fields = Object.entries(d).filter(([k]) => !['type', 'name', 'status'].includes(k));
    UI.modal(icon('hvac', 'text-primary text-[22px] align-middle') + ' ' + esc(d.name) + ' <span class="font-label-md text-label-md text-outline">' + id + '</span>', `
      <div class="flex items-center gap-2 mb-4">${UI.devStatus(d.status)}<span class="font-body-sm text-body-sm text-on-surface-variant">Simulasi perintah SCADA / perubahan status aset</span></div>
      <div class="grid grid-cols-3 gap-2 mb-4">${fields.map(([k, v]) => `<div class="inner p-2"><div class="lbl">${esc(k)}</div><div class="font-label-lg text-label-lg">${esc(v)}</div></div>`).join('')}</div>
      <div class="lbl mb-2">Ubah status (perintah BMS)</div><div class="flex flex-wrap gap-2 mb-4">${opts.map((o) => `<button class="chip-btn ${d.status === o ? 'on' : ''}" data-st="${o}">${o}</button>`).join('')}</div>
      ${rel.length ? `<div class="lbl mb-2">Tiket terkait</div>${rel.map((t) => `<a href="#/ticketing?id=${t.id}" class="rel-row mb-1">${UI.prio(t.priority)}<span>${t.id} · ${esc(t.title)}</span></a>`).join('')}` : ''}
      <div class="flex justify-end gap-2 mt-4">${CAMBY[id] ? `<a class="btn-ghost" href="#/cctv?cam=${CAMBY[id]}">${icon('videocam', 'text-[16px]')} Kamera ${CAMBY[id]}</a>` : ''}<button class="btn" id="mk">${icon('add_circle')} Buat tiket dari alarm</button></div>`);
    document.querySelectorAll('[data-st]').forEach((b) => b.addEventListener('click', () => {
      Store.setDevice(id, b.dataset.st);
      Store.addEvent({ from: 'BMS', to: BAD.includes(b.dataset.st) ? 'TIC' : 'BMS', code: 'EVT-BMS-ALARM', title: id + ' → ' + b.dataset.st, detail: d.name, sev: BAD.includes(b.dataset.st) ? 'P2' : 'P4' });
      UI.closeModal(); UI.toast(`${d.name} → ${b.dataset.st}`, BAD.includes(b.dataset.st) ? 'P2' : 'P4', BAD.includes(b.dataset.st) ? 'Alarm dikirim ke Tiket & Insiden (EVT-BMS-ALARM)' : 'Perintah SCADA dikirim');
    }));
    document.getElementById('mk').addEventListener('click', () => {
      Shell.newTicket({ title: `${d.name} ${d.status}: alarm BMS`, desc: 'Alarm dari Fasilitas & BMS untuk aset ' + id, sop: SOPBY[d.type] || 'SOP-BMS-01', priority: d.type === 'chiller' || d.type === 'trafo' || d.type === 'genset' ? 'P2' : 'P3', category: 'Fasilitas MEP, AC & Plumbing', zone: d.zone || 'BASEMENT', location: d.name, source: 'BMS SCADA ' + id, cam: CAMBY[id] || '', team: 'MEP Alpha', fromDb: 'BMS' });
    });
  }

  function load24() { return [6.2, 5.8, 5.6, 5.4, 5.6, 6.4, 8.1, 9.2, 10.8, 12.0, 13.1, 13.9, 14.2, 14.5, 14.8, 14.9, 15.1, 15.3, 15.4, 15.0, 14.1, 12.6, 10.0, 7.1]; }

  window.Views.bms = {
    title: 'Fasilitas & BMS', live: true,
    render() {
      const D = Store.s.devices;
      const g = (t) => Object.entries(D).filter(([, d]) => d.type === t);
      const ch = g('chiller'), ahu = g('ahu'), lifts = g('lift'), escs = g('esc'), trafo = g('trafo'), gens = g('genset');
      const chRun = ch.filter(([, d]) => d.status === 'RUNNING').length;
      const tripped = escs.filter(([, d]) => d.status === 'TRIP');
      const totalMW = trafo.reduce((a, [, d]) => a + d.mw, 0);
      const bad = Object.entries(D).filter(([, d]) => BAD.includes(d.status));
      const ev = Store.s.events.filter((e) => e.from === 'BMS' || e.to === 'BMS').slice(0, 6);
      const staticLog = [
        ['14:18:42', 'Peringatan', 'BMS-CH-04: kebocoran mikro terdeteksi di bypass valve kondensor. Tekanan delta turun 0.12 bar.', 'B2 Central Plant', 'text-amber-300 bg-amber-500/15'],
        ['14:15:22', 'TRIP kritis', 'Eskalator E-04 (West Atrium 2F-3F) terhenti darurat. Sensor comb-plate kanan bawah aktif. Tim MEP ditugaskan.', 'West Mall Atrium', 'text-rose-300 bg-rose-500/15'],
        ['14:02:10', 'Normal otomatis', 'Auto tap-changer Trafo 1B beralih ke posisi 3. Tegangan L-L stabil di 380.2V.', 'Gardu B1', 'text-emerald-300 bg-emerald-500/15'],
        ['13:48:05', 'Otomasi AHU', 'VAV Food Court Skybridge menaikkan aliran udara 12% karena CO2 ruangan naik ke 690 ppm.', 'Level 3 Skybridge', 'text-sky-300 bg-sky-500/15'],
      ];
      const devCard = ([id, d]) => {
        const isBad = BAD.includes(d.status), warn = d.status === 'WARN' || d.status === 'LEAK';
        return `<button data-dev="${id}" class="text-left inner p-4 hover:bg-white/5 transition ${isBad ? 'crit-left' : warn ? 'warn-left' : d.status === 'RUNNING' ? 'ok-left' : ''}">
          <div class="flex items-center justify-between"><span class="lbl">${esc(d.name)}</span>${UI.devStatus(d.status)}</div>
          <div class="font-headline-sm text-headline-sm mt-2">${esc(d.brand)}</div><div class="font-label-sm text-label-sm text-outline">${d.cap} · ${id}</div>
          <div class="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 font-label-md text-label-md">
            <span class="text-on-surface-variant">Supply/Return</span><span class="text-right">${d.sup ? d.sup + '/' + d.ret + '°C' : '-- / --'}</span>
            <span class="text-on-surface-variant">Aliran air</span><span class="text-right">${d.flow ? num(d.flow) + ' GPM' : '0'}</span>
            <span class="text-on-surface-variant">Motor VFD</span><span class="text-right ${d.load ? 'text-secondary' : 'text-outline'}">${d.vfd}</span>
            <span class="text-on-surface-variant">Konsumsi</span><span class="text-right">${d.kwtr ? d.kwtr + ' kW/TR' : '-'}</span></div>
          <div class="font-label-sm text-label-sm mt-2 ${warn || isBad ? 'text-amber-300' : 'text-on-surface-variant'}">${esc(d.note || '')}</div></button>`;
      };
      const num = UI.num;
      return `
      <section class="card pagebar">
        <div class="pagebar-info">
          <span class="stat live"><span class="dot"></span>Jaringan BMS online</span>
          <span class="stat">Sinkronisasi terakhir <b data-clock></b></span>
          <span class="stat">LIDAR-SCADA v6.2, BACnet/Modbus</span>
          ${bad.length ? `<span class="stat-alarm">${icon('warning', 'text-[16px]')} ${bad.length} alarm aktif: ${bad.map(([id]) => id).join(', ')}</span>` : ''}
        </div>
        <div class="pagebar-actions seg" role="group" aria-label="Area">${[['ALL', 'Seluruh mal'], ['PLANT', 'Central Plant B2'], ['EAST', 'East Mall'], ['WEST', 'West Mall']].map(([k, l]) => `<button class="chip-btn ${area === k ? 'on' : ''}" data-area="${k}">${l}</button>`).join('')}</div>
      </section>

      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        ${UI.kpi({ label: 'Central plant HVAC', icon: 'ac_unit', value: chRun + '/5', unit: 'chiller aktif', foot: 'Debit chilled water 3.420 GPM, beban termal 74%', delta: ch.some(([, d]) => BAD.includes(d.status) || d.status === 'LEAK') ? 'Alarm' : 'Normal', dcls: ch.some(([, d]) => d.status === 'LEAK' || BAD.includes(d.status)) ? 'bg-rose-500/20 text-rose-300' : '' })}
        ${UI.kpi({ label: 'Transportasi vertikal', icon: 'elevator', value: lifts.length + escs.length, unit: 'unit', delta: tripped.length ? tripped.length + ' unit trip' : 'Semua normal', dcls: tripped.length ? 'bg-rose-500/20 text-rose-300' : '', foot: 'Lift penumpang 6/6, eskalator ' + (escs.length - tripped.length) + '/' + escs.length + ' aktif, uptime 99.8%' })}
        ${UI.kpi({ label: 'Gardu distribusi listrik', icon: 'electrical_services', value: totalMW.toFixed(1), unit: 'MW beban aktual', foot: 'Kapasitas 18.5 MVA, faktor daya 0.98 pf, THD-V 1.8%', delta: gens.some(([, d]) => d.status === 'FAULT') ? 'Genset gangguan' : '4 genset siap', dcls: gens.some(([, d]) => d.status === 'FAULT') ? 'bg-rose-500/20 text-rose-300' : '' })}
        ${UI.kpi({ label: 'Hidrolika & drainase', icon: 'water_drop', value: '4.2', unit: 'bar tekanan pipa', foot: 'Sump pit B2 38%, pompa otomatis, air bersih 142 L/min', delta: 'Aman' })}
      </div>

      <section class="card p-5 mb-5">${UI.h('Central chiller plant & otomasi tata udara', 'Pemantauan 5 unit chiller Basement 2 dan sensor AHU di dalam mal. Klik unit untuk mengirim perintah SCADA atau membuat tiket.', `<div class="flex gap-2"><button class="btn-ghost" data-q="setpoint">${icon('device_thermostat', 'text-[16px]')} Atur setpoint suhu</button><button class="btn-ghost" data-q="vfd">${icon('tune', 'text-[16px]')} Seimbangkan VFD otomatis</button><button class="btn-ghost" data-q="reset">${icon('restart_alt', 'text-[16px]')} Reset alarm HVAC</button></div>`, 'mode_fan')}
        <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">${ch.map(devCard).join('')}</div>
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-3">${ahu.map(([id, a]) => `<button data-dev="${id}" class="text-left inner p-4 hover:bg-white/5 ${BAD.includes(a.status) ? 'crit-left' : a.status === 'BOOST' ? 'info-left' : ''}"><div class="flex items-center justify-between"><div class="flex items-center gap-2">${icon('air', 'text-primary')}<span class="font-headline-sm text-headline-sm">${esc(a.name)}</span></div><span class="font-headline-md text-headline-md ${a.temp > 23 ? 'text-amber-300' : 'text-secondary'}">${a.temp}°C</span></div><div class="flex justify-between mt-2 font-label-sm text-label-sm text-on-surface-variant"><span>${a.code}, zona ${a.zone}</span><span>CO2 ${a.co2} ppm · RH ${a.rh}%</span></div><div class="mt-2">${UI.devStatus(a.status)}</div></button>`).join('')}</div>
      </section>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-5">
        <section class="card p-5 xl:col-span-7">${UI.h('Armada transportasi vertikal (lift & kapsul)', 'Posisi, kecepatan, dan beban kabin', '', 'elevator')}
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">${lifts.map(([id, l]) => `<button data-dev="${id}" class="text-left inner p-3 hover:bg-white/5 ${BAD.includes(l.status) ? 'crit-left' : ''}"><div class="flex justify-between items-center"><span class="font-label-md text-label-md">${esc(l.name)}</span>${UI.chip(l.dir, l.dir === 'PADAT' ? 'bg-rose-500/15 text-rose-300' : 'bg-white/5 text-on-surface-variant')}</div><div class="flex justify-between items-end mt-2"><span class="font-label-sm text-label-sm text-outline">Lantai</span><span class="font-headline-md text-headline-md text-primary">Lt. ${l.floor}</span></div><div class="mt-2">${UI.bar(l.load, l.load > 85 ? 'bg-rose-400' : 'bg-secondary')}</div><div class="flex justify-between font-label-sm text-label-sm text-on-surface-variant mt-1"><span>Beban ${l.load}%</span><span>${l.speed} m/s</span></div></button>`).join('')}</div>
          <div class="flex justify-between mt-3 font-label-sm text-label-sm text-on-surface-variant"><span>Suhu motor traksi 51.4°C (normal)</span><span>Getaran gearbox 1.1 mm/s (batas 2.8)</span></div></section>
        <section class="card p-5 xl:col-span-5">${UI.h('Status eskalator E-01 s/d E-08', '', tripped.length ? UI.chip(tripped.length + ' kritis', 'bg-rose-500/20 text-rose-300') : UI.chip('Semua aktif', 'bg-secondary/15 text-secondary'), 'escalator')}
          ${tripped.map(([id, e]) => `<div class="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 mb-3"><div class="flex items-center justify-between"><span class="font-headline-sm text-headline-sm text-rose-200">${icon('emergency', 'text-[18px] align-middle')} Eskalator ${e.name} (${e.route})</span>${UI.chip('TRIP (stop darurat)', 'bg-rose-500 text-white')}</div><p class="font-body-sm text-body-sm text-on-surface mt-2">Sensor comb-plate kanan bawah terpicu. Motor berhenti otomatis dalam 0.32 detik. Tidak ada laporan korban.</p><div class="flex gap-2 mt-3"><a href="#/cctv?cam=CAM-29" class="btn-ghost">${icon('videocam', 'text-[16px]')} CAM-29</a><button class="btn-danger" data-dev="${id}">${icon('engineering', 'text-[16px]')} Kirim tim MEP</button></div></div>`).join('')}
          <div class="grid grid-cols-4 gap-2">${escs.map(([id, e]) => `<button data-dev="${id}" class="inner p-2 text-center hover:bg-white/5 ${e.status === 'TRIP' ? '!border-rose-500/60 bg-rose-500/10' : e.status === 'WARN' ? '!border-amber-500/50' : ''}"><div class="font-label-md text-label-md">${e.name}</div><div class="font-label-sm text-[9px] text-outline">${e.route}</div><div class="font-label-sm text-label-sm mt-1 ${e.status === 'TRIP' ? 'text-rose-300' : e.status === 'WARN' ? 'text-amber-300' : 'text-secondary'}">${e.status === 'TRIP' ? 'TRIP' : e.status === 'WARN' ? 'Getaran ' + e.vib : '↑ aktif'}</div></button>`).join('')}</div>
          <div class="flex justify-between mt-3 font-label-sm text-label-sm text-on-surface-variant"><span>Sensor step chain: ${escs.length - tripped.length}/${escs.length} selaras</span><span class="text-secondary">Drive handrail: tegangan normal</span></div></section>
      </div>

      <section class="card p-5 mb-5">${UI.h('Gardu trafo & distribusi tenaga listrik', 'Beban PLN 20 kV, trafo MV/LV step-down, harmonisa, dan kesiapan genset', `<span class="chip-btn">Sinkronisasi 50.02 Hz · L-L 380.2 V</span>`, 'electric_bolt')}
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">${trafo.map(([id, t]) => `<button data-dev="${id}" class="text-left inner p-4 hover:bg-white/5"><div class="lbl">${esc(t.name)}</div><div class="flex items-center justify-between mt-1"><span class="font-headline-sm text-headline-sm">${t.mva} MVA cast-resin</span>${UI.chip('Beban ' + t.load + '%', 'bg-secondary/15 text-secondary')}</div><div class="grid grid-cols-2 gap-y-1 mt-3 font-label-md text-label-md"><span class="text-on-surface-variant">Daya aktif</span><span class="text-right">${t.mw} MW</span><span class="text-on-surface-variant">Suhu belitan</span><span class="text-right">${t.temp}°C</span><span class="text-on-surface-variant">THD</span><span class="text-right text-secondary">${t.thd}% aman</span></div><div class="mt-3">${UI.bar(t.load, 'bg-sky-400')}</div></button>`).join('')}</div>
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
          <div class="xl:col-span-7 inner p-4"><div class="flex justify-between"><span class="font-headline-sm text-headline-sm">Kurva beban daya 24 jam</span><span class="font-label-sm text-label-sm text-outline">— konsumsi aktual · - - batas kontrak PLN 16.5 MW</span></div>${UI.line([{ data: load24(), color: '#38bdf8', dot: new Date().getHours() }], { labels: load24().map((_, i) => (i % 3 === 0 ? String(i).padStart(2, '0') + ':00' : '')), min: 0, max: 18, refLine: 16.5, refLabel: 'Batas 16.5 MW', h: 200 })}
            <div class="flex justify-between font-label-sm text-label-sm text-on-surface-variant"><span>Target hemat energi bulan ini: +4.2% efisiensi</span>${UI.link('energy', 'Audit di Energi & Utilitas', 'text-primary')}</div></div>
          <div class="xl:col-span-5 inner p-4"><div class="flex justify-between mb-3"><span class="font-headline-sm text-headline-sm">Genset cadangan (4x Cummins 2500 kVA)</span>${UI.chip(gens.some(([, d]) => d.status === 'FAULT') ? 'Perlu tindakan' : 'Siap 100%', gens.some(([, d]) => d.status === 'FAULT') ? 'bg-rose-500/20 text-rose-300' : 'bg-secondary/15 text-secondary')}</div>
            <div class="grid grid-cols-2 gap-2">${gens.map(([id, gn]) => `<button data-dev="${id}" class="text-left rounded-lg p-3 bg-white/5 hover:bg-white/10 ${gn.status === 'FAULT' ? 'border border-rose-500/50' : ''}"><div class="flex justify-between"><span class="font-label-md text-label-md">${gn.name.toUpperCase()}</span><span class="font-label-sm text-label-sm ${gn.status === 'FAULT' ? 'text-rose-300' : 'text-secondary'}">${gn.status}</span></div><div class="font-label-sm text-label-sm text-on-surface-variant mt-1">Solar ${gn.fuel}% (${num(gn.liters)} L)<br>Aki ${gn.batt} V · Water jacket ${gn.temp}°C</div></button>`).join('')}</div>
            <div class="flex justify-between mt-3 font-label-sm text-label-sm text-on-surface-variant"><span>Tangki induk 65.000 L (92%)</span><span>Transfer otomatis ATS: 12 detik</span></div></div>
        </div></section>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-5">
        <section class="card p-5 xl:col-span-8">${UI.h('Log diagnostik lapangan BMS', 'Aliran data SCADA v6.2 (buffer 250 event) dan event lintas dashboard', '', 'terminal')}
          <div class="flex flex-col gap-2">${ev.map((e) => `<div class="inner p-3 flex gap-3"><span class="font-label-md text-label-md text-outline">[${UI.time(e.ts)}]</span><span class="px-2 rounded font-label-sm text-label-sm h-fit ${(UI.PRIO[e.sev] || {}).cls || ''}">${e.code}</span><span class="font-body-sm text-body-sm flex-1">${esc(e.title)}${e.detail ? ': ' + esc(e.detail) : ''}</span><span class="font-label-sm text-label-sm text-outline">${e.from}→${e.to}</span></div>`).join('')}
          ${staticLog.map((l) => `<div class="inner p-3 flex gap-3"><span class="font-label-md text-label-md text-outline">[${l[0]}]</span><span class="px-2 rounded font-label-sm text-label-sm h-fit ${l[4]}">${l[1]}</span><span class="font-body-sm text-body-sm flex-1">${l[2]}</span><span class="font-label-sm text-label-sm text-outline">${l[3]}</span></div>`).join('')}</div></section>
        <section class="card p-5 xl:col-span-4">${UI.h('Stasiun aksi operasional cepat', 'Perintah kendali langsung dengan otorisasi kepala operasional (level 4)', '', 'bolt')}
          <div class="flex flex-col gap-2">
            <button class="rel-row" data-q="gen">${icon('power', 'text-primary')}<span class="flex-1 text-left">Pindah ke mode generator</span>${icon('chevron_right')}</button>
            <button class="rel-row" data-q="vfdreset">${icon('restart_alt', 'text-primary')}<span class="flex-1 text-left">Reset VFD chiller yang trip</span>${icon('chevron_right')}</button>
            <button class="rel-row" data-q="mep">${icon('engineering', 'text-primary')}<span class="flex-1 text-left">Kirim regu MEP ke lokasi (buat tiket)</span>${icon('chevron_right')}</button>
            <a class="rel-row" href="#/sop?id=SOP-BMS-03">${icon('menu_book', 'text-primary')}<span class="flex-1">SOP pemadaman PLN & genset</span>${icon('chevron_right')}</a>
            <button class="btn justify-center mt-2" data-q="csv">${icon('download')} Unduh laporan BMS (.csv)</button>
          </div>
          <div class="flex justify-between mt-4 font-label-sm text-label-sm text-on-surface-variant"><span>Koneksi BACnet/IP: 100% OK</span><span>Modbus RTU: 0 error</span></div></section>
      </div>
      ${UI.relasi('BMS')}`;
    },
    mount(root) {
      root.querySelectorAll('[data-dev]').forEach((b) => b.addEventListener('click', () => devModal(b.dataset.dev)));
      root.querySelectorAll('[data-area]').forEach((b) => b.addEventListener('click', () => { area = b.dataset.area; Shell.rerender(); }));
      root.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
        const q = b.dataset.q;
        if (q === 'mep') return Shell.newTicket({ sop: 'SOP-BMS-01', category: 'Fasilitas MEP, AC & Plumbing', team: 'MEP Alpha', source: 'Fasilitas & BMS', fromDb: 'BMS', priority: 'P3' });
        if (q === 'csv') {
          const rows = [['ID', 'Tipe', 'Nama', 'Status']].concat(Object.entries(Store.s.devices).map(([id, d]) => [id, d.type, d.name, d.status]));
          const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })); a.download = 'Laporan_BMS_Summarecon.csv'; a.click(); return;
        }
        if (q === 'reset') { Object.entries(Store.s.devices).forEach(([id, d]) => { if (d.type === 'ahu' && d.status === 'FAULT') Store.setDevice(id, 'RUNNING'); }); }
        if (q === 'vfdreset') { Object.entries(Store.s.devices).forEach(([id, d]) => { if (d.type === 'chiller' && d.status === 'TRIP') Store.setDevice(id, 'RUNNING'); }); }
        const msg = { setpoint: 'Setpoint CHW di-reset ke 6.8°C (AI optimizer)', vfd: 'Penyeimbangan VFD otomatis aktif untuk 4 chiller', reset: 'Alarm HVAC direset', gen: 'Perintah pindah ke mode generator perlu konfirmasi kedua (dual-control)', vfdreset: 'Perintah reset VFD dikirim ke chiller yang trip' }[q];
        Store.addEvent({ from: 'BMS', to: 'BMS', code: 'EVT-BMS-ALARM', title: msg, detail: 'Perintah operator', sev: 'P4' });
        UI.toast(msg, 'P4', 'Perintah SCADA tercatat di log');
      }));
    },
  };
})();
