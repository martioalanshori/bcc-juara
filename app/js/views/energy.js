/* DB-ENE Energy & Utility Audit */
(function () {
  window.Views = window.Views || {};
  const { esc, icon, num } = UI;
  const F = { period: 'today' };
  const LOAD = [5.8, 5.5, 5.4, 5.4, 5.6, 6.3, 7.8, 9.2, 10.6, 11.9, 12.8, 13.6, 13.9, 14.2, 14.5, 14.8, 15.1, 15.4, 15.6, 15.2, 14.1, 12.4, 9.9, 7.1];

  window.Views.energy = {
    title: 'Energi & Utilitas', live: true,
    render() {
      const D = Store.s.devices;
      const ch = Object.entries(D).filter(([, d]) => d.type === 'chiller');
      const U = window.SEED.UTILITY;
      const totCost = U.reduce((a, u) => a + u[3], 0), totRec = U.reduce((a, u) => a + u[4], 0);
      const ten = window.SEED.TENANTS.slice().sort((a, b) => b.kw - a.kw).slice(0, 4);
      const anomalies = [
        { sev: 'P2', title: 'Fouling kondensor Chiller-04', cost: 'Beban biaya +Rp 4.2 Jt/mgg', text: 'Efisiensi termal anjlok ke 0.68 kW/TR akibat penurunan laju sirkulasi kondensor (fouling kerak pipa).', act: 'Jadwalkan descaling malam ini', sop: 'SOP-BMS-01' },
        { sev: 'P3', title: 'Beban liar F&B foodcourt', cost: 'Beban liar 48 kW', text: 'Konsumsi listrik zona F&B pukul 23:00-04:00 melebihi standar baseline malam (indikasi showcase pendingin standby dibiarkan terbuka).', act: 'Kabari dispatcher lapangan', sop: 'SOP-BMS-04' },
      ];
      return `
      <section class="card p-4 mb-5 flex flex-wrap items-center gap-2">
        <span class="chip-btn"><span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>Audit energi aktif</span>
        <span class="chip-btn">ISO 50001:2018 terverifikasi</span><span class="chip-btn text-secondary">Bangunan hijau LEED Gold, 84 poin</span>
        <span class="font-label-md text-label-md text-on-surface-variant">Sinkronisasi grid SCADA: 14 detik lalu</span>
        <div class="ml-auto flex gap-2"><button class="btn-ghost" data-act="sim">${icon('calculate', 'text-[16px]')} Simulasi tarif WBP/LWBP</button><button class="btn-ghost" data-act="esg">${icon('download', 'text-[16px]')} Ekspor audit ESG (CSV)</button><button class="btn" data-act="ai">${icon('auto_awesome')} Optimasi AI chiller VFD</button></div>
      </section>
      <div class="flex flex-wrap gap-2 mb-5"><span class="lbl self-center mr-1">Periode:</span>${[['today', 'Hari ini'], ['mtd', 'Bulan berjalan (MTD)'], ['q', 'Kuartal'], ['ytd', 'YTD']].map(([k, l]) => `<button class="chip-btn ${F.period === k ? 'on' : ''}" data-period="${k}">${l}</button>`).join('')}</div>

      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        ${UI.kpi({ label: 'Total daya listrik (grid)', icon: 'electric_meter', value: '14.82', unit: 'MW, puncak 16.2 MW', delta: '-3.8% dari baseline', foot: 'Estimasi biaya hari ini Rp 218.4 Jt' })}
        ${UI.kpi({ label: 'Efisiensi chiller plant', icon: 'ac_unit', value: '0.562', unit: 'kW/TR · COP 6.25', vcls: 'text-secondary', foot: 'Target ≤ 0.62 kW/TR, hemat Rp 42.1 Jt/hari' })}
        ${UI.kpi({ label: 'Konsumsi & daur ulang air', icon: 'water_drop', value: '1.840', unit: 'm³/hari, 42% daur ulang', foot: 'PDAM 58% (1.060 m³), daur ulang STP 780 m³' })}
        ${UI.kpi({ label: 'Dekarbonisasi & ESG', icon: 'eco', value: '18.42', unit: 'Ton CO2e', delta: '-14.6% YoY', foot: 'Skor 92.4 (A+), PLTS 4.82 MWh' })}
      </div>

      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
        <div class="2xl:col-span-8 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Profil beban listrik 24 jam & tarif PLN', 'Manajemen beban aktif: WBP (waktu beban puncak) 18:00-22:00 dan LWBP, tarif B3/TM 150 kV', '', 'monitoring')}
            <div class="inner p-3 mb-3 flex items-center gap-3 font-body-sm text-body-sm">${icon('battery_charging_full', 'text-secondary')}<span><b class="text-secondary">Peak shaving otomatis aktif:</b> BESS 1.5 MWh & VFD pre-cooling chiller</span><span class="ml-auto chip-btn text-secondary">Hemat Rp 18.5 Jt/sesi</span></div>
            ${UI.line([{ data: LOAD, color: '#38bdf8', dot: new Date().getHours() }, { data: LOAD.map((v, i) => (i >= 7 && i <= 17 ? Math.max(0, 1.8 * Math.sin(((i - 7) / 10) * Math.PI)) : 0)), color: '#4edea3' }], { labels: LOAD.map((_, i) => (i % 4 === 0 ? String(i).padStart(2, '0') + ':00' : '')), min: 0, max: 18, band: [18, 22], bandLabel: 'Zona WBP (18:00-22:00)', refLine: 16.5, refLabel: 'Batas kontrak 16.5 MW', h: 230 })}
            <div class="flex gap-4 font-label-sm text-label-sm text-on-surface-variant"><span><span class="text-sky-300">●</span> Daya total aktif (MW)</span><span><span class="text-secondary">●</span> Kontribusi PLTS</span><span><span class="text-rose-300">■</span> LWBP Rp 1.114/kWh · WBP Rp 1.671/kWh</span></div>
            <div class="lbl mt-4 mb-2">Distribusi beban sub-sektoral (dari Blueprint sheet 4)</div>
            <div class="flex h-3 rounded-full overflow-hidden">${U.map((u, i) => `<div style="width:${u[1] * 100}%" class="${['bg-sky-400', 'bg-amber-300', 'bg-violet-400', 'bg-secondary'][i]}"></div>`).join('')}</div>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">${U.map((u, i) => `<div class="font-label-sm text-label-sm"><span class="${['text-sky-300', 'text-amber-300', 'text-violet-300', 'text-secondary'][i]}">●</span> ${esc(u[0].split('(')[0])}<div class="text-on-surface">${Math.round(u[1] * 100)}% (${num(u[2])} kWh)</div></div>`).join('')}</div>
          </section>
          <section class="card p-5">${UI.h('Matriks cost recovery utilitas', 'Blueprint 4_BMS_Utility_SLA_Matrix, target recovery ≥ 85%', `<span class="chip-btn ${totRec / totCost >= 0.85 ? 'text-secondary' : 'text-amber-300'}">Recovery ${(totRec / totCost * 100).toFixed(1)}%</span>`, 'account_balance')}
            <table class="tbl"><thead><tr><th>Komponen</th><th>Konsumsi</th><th>Biaya (Jt)</th><th>Recovery (Jt)</th><th>Biaya bersih</th><th>Efisiensi</th><th>Strategi IoT</th></tr></thead><tbody>
            ${U.map((u) => `<tr><td class="font-body-sm">${esc(u[0])}</td><td class="font-label-md">${num(u[2])} kWh</td><td class="font-label-md">${num(u[3], 1)}</td><td class="font-label-md">${num(u[4])}</td><td class="font-label-md ${u[3] - u[4] < 0 ? 'text-secondary' : ''}">${num(u[3] - u[4], 1)}</td><td class="font-label-md">${((u[4] / u[3]) * 100).toFixed(1)}%</td><td class="font-body-sm text-on-surface-variant">${esc(u[5])}</td></tr>`).join('')}
            <tr><td class="font-headline-sm">Total</td><td class="font-label-md">${num(U.reduce((a, u) => a + u[2], 0))} kWh</td><td class="font-label-md">${num(totCost, 1)}</td><td class="font-label-md">${num(totRec)}</td><td class="font-label-md">${num(totCost - totRec, 1)}</td><td class="font-label-md text-secondary">${((totRec / totCost) * 100).toFixed(1)}%</td><td></td></tr></tbody></table></section>
          <section class="card p-5">${UI.h('Telemetri & audit termal central chiller plant', '5 unit chiller sentral, kapasitas 5.800 TR, status sinkron dengan Fasilitas & BMS', UI.link('bms', 'Kontrol di Fasilitas & BMS', 'font-label-md text-label-md text-primary'), 'mode_fan')}
            <table class="tbl"><thead><tr><th>Unit</th><th>Tipe & kapasitas</th><th>Beban</th><th>Daya</th><th>Efisiensi</th><th>Status</th></tr></thead><tbody>
            ${ch.map(([id, d]) => `<tr class="${d.status === 'WARN' || d.status === 'LEAK' ? 'bg-rose-500/5' : ''}"><td class="font-label-lg">${id}</td><td class="font-label-md text-on-surface-variant">${esc(d.brand)} (${d.cap})</td><td class="font-label-md">${d.load}%</td><td class="font-label-md">${d.kw} kW</td><td class="font-label-md ${d.kwtr > 0.62 ? 'text-tertiary' : 'text-secondary'}">${d.kwtr ? d.kwtr + ' · COP ' + d.cop : '-'}</td><td>${UI.devStatus(d.status)}</td></tr>`).join('')}</tbody></table>
            <div class="inner p-3 mt-3 flex items-center gap-3 font-body-sm text-body-sm">${icon('psychology', 'text-primary')}<span><b class="text-primary">Optimasi setpoint dinamis (AI):</b> kenaikan suhu pasok +0.5°C pukul 21:00 (RH mall 54%) menghemat 240 kWh tanpa mengorbankan indeks kenyamanan ASHRAE.</span><button class="btn-ghost ml-auto" data-act="setpoint">Setujui jadwal</button></div></section>
          <section class="card p-5">${UI.h('Audit neraca air & daur ulang STP/greywater', 'Siklus tertutup air mall & konsumsi sanitasi tenant, 36 flowmeter IoT', '<span class="chip-btn text-secondary">Sirkularitas 42.4%</span>', 'water')}
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div class="inner p-3"><div class="lbl mb-2">Sumber masukan</div>${[['PDAM Kota Utama', '1.060 m³', '57.6%'], ['Daur ulang STP (UF + RO)', '780 m³', '42.4%'], ['Sumur dalam (nonaktif)', '0 m³', '0%']].map((r) => `<div class="flex justify-between py-1.5 border-b border-white/5 font-label-md text-label-md"><span>${r[0]}</span><span class="text-primary">${r[1]} <span class="text-outline">${r[2]}</span></span></div>`).join('')}</div>
              <div class="inner p-3"><div class="lbl mb-2">Distribusi konsumsi</div>${[['Tenant F&B (grease trap)', '680 m³'], ['Make-up cooling tower', '650 m³'], ['Flushing toilet umum', '510 m³']].map((r) => `<div class="flex justify-between py-1.5 border-b border-white/5 font-label-md text-label-md"><span>${r[0]}</span><span class="text-primary">${r[1]}</span></div>`).join('')}</div>
              <div class="inner p-3"><div class="lbl mb-2">Penghematan & integritas pipa</div><div class="font-label-md text-label-md">Efisiensi STP <span class="text-secondary">94.8% (normal)</span></div><div class="font-body-sm text-body-sm text-on-surface-variant mt-1">Air baku olahan memenuhi baku mutu Permen LHK P.68/2016 (BOD &lt; 10 mg/L).</div><div class="font-headline-md text-headline-md text-secondary mt-2">Rp 10.920.000</div><div class="font-label-sm text-label-sm text-outline">Penghematan PDAM hari ini</div>
                <button class="btn-ghost mt-2" data-act="leak">${icon('sensors', 'text-[16px]')} Sensor akustik pipa: 0 kebocoran</button></div></div></section>
        </div>
        <div class="2xl:col-span-4 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Dashboard PLTS atap & ESG', 'PLTS atap 1.2 MWp (sayap timur & barat)', UI.chip('GBCI 88 poin', 'bg-secondary/15 text-secondary'), 'solar_power')}
            <div class="inner p-4 flex items-center gap-4"><div class="flex-1"><div class="lbl">Generasi solar hari ini</div><div class="font-display-lg text-display-lg text-secondary">4.820</div><div class="font-label-md text-label-md text-on-surface-variant">kWh, kontribusi 6.8% dari konsumsi</div></div>${UI.ring(82, { size: 96, sub: 'kapasitas' })}</div>
            <div class="grid grid-cols-2 gap-2 mt-3"><div class="inner p-3"><div class="lbl">CO2e dihindari</div><div class="font-headline-md text-headline-md">3.8 Ton</div><div class="font-label-sm text-label-sm text-secondary">Setara 175 pohon</div></div><div class="inner p-3"><div class="lbl">Net-Zero 2030 MTD</div><div class="font-headline-md text-headline-md">462 Ton</div><div class="font-label-sm text-label-sm text-outline">Target ≤ 520 Ton</div></div></div>
            <div class="mt-3">${UI.bar(88.8, 'bg-secondary')}<div class="font-label-sm text-label-sm text-on-surface-variant mt-1">Emisi karbon bulan ini 11.2% di bawah kuota</div></div></section>
          <section class="card p-5">${UI.h('Audit sub-metering tenant', '4 konsumen energi terbesar dari 512 tenant aktif', '', 'electric_meter')}
            ${ten.map((t) => `<a href="/command-center/tenant?tenant=${t.id}" class="block inner p-3 mb-2 hover:bg-white/5"><div class="flex justify-between"><span class="font-body-md text-body-md">${esc(t.name)}</span><span class="font-label-lg text-label-lg ${t.kw > 400 ? 'text-tertiary' : 'text-primary'}">${t.kw} kW</span></div><div class="font-label-sm text-label-sm text-outline">Zona ${t.zone} · ${esc(t.cat)}</div><div class="mt-2">${UI.bar((t.kw / 500) * 100, t.kw > 400 ? 'bg-rose-400' : 'bg-secondary')}</div></a>`).join('')}
            <div class="flex gap-2 mt-2"><button class="btn-ghost flex-1 justify-center" data-act="portal">Kirim laporan ke portal tenant</button><button class="btn-ghost flex-1 justify-center" data-act="limit">Atur batas daya</button></div></section>
          <section class="card p-5">${UI.h('Anomali & mitigasi AI', 'Deteksi disipasi panas & beban liar', UI.chip(anomalies.length + ' temuan', 'bg-rose-500/15 text-rose-300'), 'troubleshoot')}
            ${anomalies.map((a, i) => `<div class="inner p-3 mb-3 ${a.sev === 'P2' ? 'crit-left' : 'warn-left'}"><div class="flex justify-between gap-2">${UI.prio(a.sev)}<span class="font-label-sm text-label-sm text-tertiary">${a.cost}</span></div><div class="font-headline-sm text-headline-sm mt-2">${a.title}</div><p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${a.text}</p><button class="btn-ghost mt-2" data-anom="${i}">${icon('event', 'text-[16px]')} ${a.act}</button></div>`).join('')}
            <button class="btn w-full justify-center" data-act="all">${icon('auto_awesome')} Terapkan semua optimasi hemat energi AI</button></section>
        </div>
      </div>
      ${UI.relasi('ENE')}`;
    },
    mount(root) {
      const anomalies = [{ title: 'Descaling kondensor Chiller-04 (fouling, COP 5.1)', sop: 'SOP-BMS-01', p: 'P3', loc: 'Central Chiller Plant B2', team: 'MEP Bravo', cat: 'Energi & Utilitas' }, { title: 'Beban liar 48 kW zona F&B foodcourt malam hari', sop: 'SOP-BMS-04', p: 'P3', loc: '3F Food Court', team: 'MEP Alpha', cat: 'Energi & Utilitas', tenant: 'L3-22' }];
      root.querySelectorAll('[data-period]').forEach((b) => b.addEventListener('click', () => { F.period = b.dataset.period; Shell.rerender(); }));
      root.querySelectorAll('[data-anom]').forEach((b) => b.addEventListener('click', () => { const a = anomalies[+b.dataset.anom]; Shell.newTicket({ title: a.title, sop: a.sop, priority: a.p, category: a.cat, zone: a.loc.startsWith('3F') ? '3F' : 'BASEMENT', location: a.loc, source: 'Anomali energi AI', team: a.team, tenant: a.tenant || '', fromDb: 'ENE' }); }));
      root.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.act;
        if (k === 'esg') { const U = window.SEED.UTILITY; const csv = [['Komponen', 'Alokasi', 'kWh', 'Biaya Jt', 'Recovery Jt', 'Net', 'Efisiensi']].concat(U.map((u) => [u[0], u[1], u[2], u[3], u[4], u[3] - u[4], (u[4] / u[3]).toFixed(3)])).map((r) => r.map((c) => '"' + c + '"').join(',')).join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'Audit_ESG_Summarecon.csv'; a.click(); return; }
        if (k === 'portal') { Store.broadcast('Laporan konsumsi energi bulanan unit Anda tersedia di portal tenant. Empat konsumen terbesar diminta meninjau rekomendasi hemat energi.', '', null); UI.toast('Laporan sub-meter dikirim ke portal tenant', 'P4', 'EVT-TENANT-BROADCAST → Layanan Tenant & SLA'); return; }
        const msg = { sim: 'Simulasi: menggeser 1.2 MW beban ke LWBP menghemat Rp 3.2 Jt/hari', ai: 'Optimasi AI chiller VFD dikirim ke BMS (EVT-ENERGY-ANOMALY)', setpoint: 'Jadwal setpoint +0.5°C 21:00 disetujui, diteruskan ke BMS', leak: 'Sensor akustik: tidak ada kebocoran tersembunyi', limit: 'Batas daya per tenant diperbarui (perlu persetujuan GM)', all: 'Semua optimasi AI diteruskan ke Fasilitas & BMS dan Tiket & Insiden' }[k];
        if (['ai', 'setpoint', 'all'].includes(k)) Store.addEvent({ from: 'ENE', to: 'BMS', code: 'EVT-ENERGY-ANOMALY', title: msg, detail: 'Perintah optimasi dari Energi & Utilitas', sev: 'P4' });
        UI.toast(msg, 'P4');
      }));
    },
  };
})();
