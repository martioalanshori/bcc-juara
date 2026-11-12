/* DB-O360 Owner 360 · Commercial, Visitor & Finance (Blueprint sheet 1 & 3 + pilar 1,2,6 mindmap) */
(function () {
  window.Views = window.Views || {};
  const { esc, icon, num } = UI;
  const fmt = (v, t) => (t === 'pct' ? (v * 100).toFixed(1) + '%' : t === 'int' ? num(v) : num(v, v % 1 ? 2 : 0));

  // Laporan PDF Komersial & Keuangan (MiniPDF, app/js/core/pdf.js): ringkasan, scorecard KPI, tren bulanan,
  // zonasi & okupansi, umur piutang & tenant menunggak, kontrak jatuh tempo. Angka sama dengan layar.
  function reportPdf() {
    if (!window.MiniPDF) return UI.toast('Modul PDF belum dimuat. Muat ulang halaman.', 'P2');
    const S = window.SEED, K = S.KPIS, TR = S.TREND, Z = S.ZONES.filter((z) => z.nla), AR = S.AR;
    const d = MiniPDF.doc(), M = 40, W = d.W - 2 * M, INK = '#1B2333', MUT = '#5B6577', LINE = '#D5DAE1', SOFT = '#F3F4F6', PRI = '#2F6FDB';
    const nla = Z.reduce((a, z) => a + z.nla, 0), leased = Z.reduce((a, z) => a + z.leased, 0);
    const rent = Z.reduce((a, z) => a + (z.leased * z.rate) / 1e6, 0), sales = Z.reduce((a, z) => a + z.sales, 0), arTot = AR.reduce((a, x) => a + x.v, 0);
    const id = (v, dg) => Number(v).toLocaleString('id-ID', { minimumFractionDigits: dg || 0, maximumFractionDigits: dg || 0 });
    const fit = (s, w, size, bold) => { let x = String(s); if (d.width(x, size, bold) <= w) return x; while (x.length > 1 && d.width(x + '…', size, bold) > w) x = x.slice(0, -1); return x + '…'; };
    const now = new Date(), tgl = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    let y = 0;
    const head = (first) => {
      if (first) {
        d.text(M, 50, 'Summarecon Mall Bandung · Command Center', { size: 9, color: MUT });
        d.text(d.W - M, 50, 'Dibuat ' + tgl, { size: 9, color: MUT, align: 'right' });
        d.text(M, 84, 'Laporan Komersial & Keuangan', { size: 22, bold: true, color: INK });
        d.text(M, 102, 'Okupansi, pendapatan, piutang, dan kontrak tenant dari sudut pandang pemilik mal', { size: 10, color: MUT });
        d.rect(M, 112, W, 2, PRI); y = 140;
      } else { d.text(M, 34, 'Laporan Komersial & Keuangan', { size: 9, bold: true, color: INK }); d.text(d.W - M, 34, tgl, { size: 8.5, color: MUT, align: 'right' }); d.line(M, 42, d.W - M, 42, LINE); y = 66; }
    };
    const need = (h) => { if (y + h > d.H - 58) { d.addPage(); head(false); } };
    const section = (t, sub) => { need(90); y += 10; d.text(M, y, t, { size: 13, bold: true, color: INK }); if (sub) d.text(M, y + 13, sub, { size: 8.5, color: MUT }); y += sub ? 26 : 14; };
    // cols: [judul, lebar, 'right'?]; rows: array sel teks; total: baris terakhir tebal
    const table = (cols, rows, total) => {
      const hdr = () => { d.rect(M, y, W, 20, SOFT); let x = M; cols.forEach(([h, w, al]) => { d.text(al ? x + w - 6 : x + 6, y + 13.5, h, { size: 8, bold: true, color: MUT, align: al ? 'right' : 'left' }); x += w; }); y += 20; };
      need(44); hdr();
      rows.forEach((r, ri) => {
        if (y + 19 > d.H - 58) { d.addPage(); head(false); hdr(); }
        const bold = total && ri === rows.length - 1; let x = M;
        cols.forEach(([, w, al], ci) => { d.text(al ? x + w - 6 : x + 6, y + 13, fit(r[ci], w - 12, 8.5, bold), { size: 8.5, bold, color: INK, align: al ? 'right' : 'left' }); x += w; });
        y += 19; d.line(M, y, M + W, y, LINE, 0.4);
      });
      y += 10;
    };
    head(true);
    // Ringkasan: 4 kotak angka
    const boxes = [['Okupansi NLA', id((leased / nla) * 100, 1) + '%', id(leased) + ' / ' + id(nla) + ' m²'], ['Sewa bulanan', 'Rp ' + id(rent / 1000, 1) + ' M', 'Omzet tenant Rp ' + id(sales / 1000, 1) + ' M'],
      ['Total piutang', 'Rp ' + id(arTot, 1) + ' M', 'Lewat 60 hari Rp ' + id(AR[2].v + AR[3].v, 1) + ' M'], ['NOI tahun berjalan', 'Rp ' + id(TR.reduce((a, r) => a + r[2] - r[3], 0), 1) + ' M', 'Pendapatan Rp ' + id(TR.reduce((a, r) => a + r[2], 0), 1) + ' M']];
    const bw = (W - 3 * 10) / 4;
    boxes.forEach(([l, v, f], i) => { const x = M + i * (bw + 10); d.rect(x, y, bw, 64, SOFT); d.rect(x, y, 3, 64, PRI); d.text(x + 12, y + 18, l, { size: 8.5, color: MUT }); d.text(x + 12, y + 40, v, { size: 15, bold: true, color: INK }); d.text(x + 12, y + 54, fit(f, bw - 18, 7.5), { size: 7.5, color: MUT }); });
    y += 84;
    section('Scorecard KPI eksekutif', 'Capaian dihitung sesuai arah KPI (naik lebih baik atau turun lebih baik)');
    table([['Indikator', 225], ['Target', 70, 1], ['Realisasi', 70, 1], ['Capaian', 60, 1], ['Status', 90]], K.map((k) => {
      const ach = k[5] === 'up' ? k[3] / k[2] : k[2] / k[3], v = (x) => (k[4] === 'pct' ? id(x * 100, 1) + '%' : id(x, x % 1 ? 2 : 0));
      return [k[1], v(k[2]), v(k[3]), id(ach * 100, 1) + '%', ach >= 1 ? 'Optimal' : ach >= 0.95 ? 'Perlu perhatian' : 'Peringatan'];
    }));
    section('Tren kinerja bulanan', 'Rp miliar; pengunjung dalam ribu');
    table([['Bulan', 80], ['Pengunjung', 100, 1], ['Pendapatan', 110, 1], ['Biaya energi & ops', 115, 1], ['NOI', 110, 1]],
      TR.map((r) => [r[0], id(r[1]) + 'k', id(r[2], 1), id(r[3], 1), id(r[2] - r[3], 1)]).concat([['Total', id(TR.reduce((a, r) => a + r[1], 0)) + 'k', id(TR.reduce((a, r) => a + r[2], 0), 1), id(TR.reduce((a, r) => a + r[3], 0), 1), id(TR.reduce((a, r) => a + r[2] - r[3], 0), 1)]]), true);
    section('Zonasi, okupansi & produktivitas tenant', 'Sewa dan omzet dalam Rp juta per bulan');
    table([['Zona', 120], ['NLA (m²)', 70, 1], ['Okupansi', 65, 1], ['Sewa', 75, 1], ['Omzet', 75, 1], ['OCR', 110, 1]],
      Z.map((z) => { const r = (z.leased * z.rate) / 1e6; return [z.name, id(z.nla), id((z.leased / z.nla) * 100, 1) + '%', id(r), id(z.sales), id((r / z.sales) * 100, 1) + '%']; })
        .concat([['Total', id(nla), id((leased / nla) * 100, 1) + '%', id(rent), id(sales), id((rent / sales) * 100, 1) + '%']]), true);
    need(30 + Z.length * 13);
    d.text(M, y, 'Rekomendasi per zona', { size: 9.5, bold: true, color: INK }); y += 14;
    Z.forEach((z) => { d.wrap(z.name + ': ' + z.rec, W, 8.5).forEach((l) => { need(13); d.text(M, y, l, { size: 8.5, color: MUT }); y += 12; }); });
    y += 6;
    section('Tagihan & umur piutang', 'Rp miliar');
    table([['Umur piutang', 300], ['Nilai', 100, 1], ['Porsi', 115, 1]], AR.map((a) => [a.b, 'Rp ' + id(a.v, 1) + ' M', id((a.v / arTot) * 100, 1) + '%']).concat([['Total', 'Rp ' + id(arTot, 1) + ' M', '100%']]), true);
    const late = S.TENANTS.filter((t) => t.ar);
    if (late.length) table([['Tenant menunggak', 220], ['Unit', 70], ['Status', 135], ['Tunggakan', 90, 1]], late.map((t) => [t.name, t.id, t.pay, 'Rp ' + id(t.ar) + ' Jt']));
    section('Kontrak jatuh tempo', 'Tim leasing dipicu 6 bulan sebelum kontrak habis');
    table([['Tenant', 230], ['Sisa', 70, 1], ['Tindak lanjut', 215]], S.CONTRACTS.map((c) => [c.t, c.m + ' bulan', c.act]));
    d.eachPage((n, tot) => { d.line(M, d.H - 40, d.W - M, d.H - 40, LINE); d.text(M, d.H - 26, 'SMICC-TS · data contoh prototype', { size: 8, color: MUT }); d.text(d.W - M, d.H - 26, 'Halaman ' + n + ' dari ' + tot, { size: 8, color: MUT, align: 'right' }); });
    d.save('Laporan_Komersial_Keuangan_' + now.toISOString().slice(0, 10) + '.pdf');
    UI.toast('Laporan Komersial & Keuangan diunduh (PDF)', 'P4');
  }

  window.Views.owner360 = {
    title: 'Komersial & Keuangan', live: true,
    render() {
      const K = window.SEED.KPIS, TR = window.SEED.TREND, Z = window.SEED.ZONES.filter((z) => z.nla), AR = window.SEED.AR;
      const esc0 = Store.s.events.filter((e) => e.code === 'EVT-ESCALATION').slice(0, 5);
      const nla = Z.reduce((a, z) => a + z.nla, 0), leased = Z.reduce((a, z) => a + z.leased, 0);
      const rent = Z.reduce((a, z) => a + (z.leased * z.rate) / 1e6, 0), sales = Z.reduce((a, z) => a + z.sales, 0);
      const arTot = AR.reduce((a, x) => a + x.v, 0);
      const heat = [['LG', [62, 78, 55, 40, 71]], ['GF', [88, 95, 91, 76, 84]], ['1F', [70, 66, 81, 58, 63]], ['2F', [44, 38, 61, 29, 52]], ['3F', [80, 92, 74, 69, 87]], ['ROOF', [35, 22, 48, 30, 41]]];
      return `
      <section class="card pagebar">
        <div class="pagebar-title"><span class="crumb">Owner 360° / Summarecon Mall Bandung</span><h2>Komersial & Keuangan</h2><p>Operasional, komersial dan keuangan dari sudut pandang pemilik mal (sumber: Blueprint sheet 1, 2, 3)</p></div>
        <div class="pagebar-actions"><button type="button" class="btn" id="o360-pdf">${icon('picture_as_pdf', 'text-[18px]')} Unduh laporan PDF</button>${UI.dbLink('ANL', '', 'Laporan BOD')}${UI.dbLink('TEN', '', 'Layanan Tenant & SLA')}</div>
      </section>
      ${esc0.length ? `<section class="card p-4 mb-5 crit-left"><div class="flex items-center gap-2 mb-2">${icon('notifications_active', 'text-rose-300')}<span class="font-headline-sm text-headline-sm">Eskalasi ke pemilik (EVT-ESCALATION)</span></div>${esc0.map((e) => `<a href="/command-center/ticketing?id=${e.ticketId}" class="rel-row mb-1">${UI.prio(e.sev)}<span class="font-label-md text-label-md text-outline">${UI.time(e.ts)}</span><span class="font-body-sm text-body-sm">${esc(e.detail)}</span></a>`).join('')}</section>` : ''}
      <div class="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
        ${UI.kpi({ label: 'Okupansi NLA', icon: 'apartment', value: ((leased / nla) * 100).toFixed(1) + '%', bar: (leased / nla) * 100, foot: num(leased) + ' / ' + num(nla) + ' m², target ≥ 95%' })}
        ${UI.kpi({ label: 'Pendapatan sewa bulanan', icon: 'payments', value: 'Rp ' + num(rent / 1000, 1), unit: 'miliar', foot: 'Omzet tenant Rp ' + num(sales / 1000, 1) + ' M, OCR ' + ((rent / sales) * 100).toFixed(1) + '%' })}
        ${UI.kpi({ label: 'Rasio penagihan', icon: 'account_balance_wallet', value: '91.5%', vcls: 'text-amber-300', delta: 'Perlu perhatian', dcls: 'bg-amber-500/15 text-amber-300', foot: 'Target 98%, AR > 60 hari Rp ' + num(AR[2].v + AR[3].v, 1) + ' M' })}
        ${UI.kpi({ label: 'Footfall harian', icon: 'groups', value: '68.400', delta: '105% dari target', foot: 'Dwell time 165 menit, CSAT 4.72/5' })}
        ${UI.kpi({ label: 'NOI YTD', icon: 'trending_up', value: 'Rp ' + num(TR.reduce((a, r) => a + r[2] - r[3], 0), 1), unit: 'miliar', vcls: 'text-secondary', foot: 'Pendapatan Rp ' + num(TR.reduce((a, r) => a + r[2], 0), 1) + ' M − Opex Rp ' + num(TR.reduce((a, r) => a + r[3], 0), 1) + ' M' })}
      </div>
      <section class="card p-5 mb-5">${UI.h('Scorecard KPI eksekutif', 'Blueprint 1_Executive_Command_KPI. Capaian dihitung otomatis sesuai arah KPI (naik lebih baik atau turun lebih baik)', '', 'scoreboard')}
        <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>Domain pilar</th><th>Indikator utama (KPI)</th><th>Target</th><th>Realisasi</th><th>Capaian</th><th>Status</th><th>Sumber sensor/sistem</th><th>Pembaruan</th></tr></thead><tbody>
        ${K.map((k) => { const ach = k[5] === 'up' ? k[3] / k[2] : k[2] / k[3]; const st = ach >= 1 ? 'Optimal' : ach >= 0.95 ? 'Perlu perhatian' : 'Peringatan'; return `<tr><td class="font-label-md text-on-surface-variant">${k[0]}</td><td class="font-body-sm">${k[1]}</td><td class="font-label-md">${fmt(k[2], k[4])}</td><td class="font-label-lg">${fmt(k[3], k[4])}</td><td class="w-36"><div class="font-label-md ${ach >= 1 ? 'text-secondary' : ach >= 0.95 ? 'text-amber-300' : 'text-tertiary'}">${(ach * 100).toFixed(1)}%</div>${UI.bar(Math.min(100, ach * 100), ach >= 1 ? 'bg-secondary' : ach >= 0.95 ? 'bg-amber-400' : 'bg-rose-400')}</td><td>${UI.chip(st, ach >= 1 ? 'bg-secondary/15 text-secondary' : ach >= 0.95 ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300')}</td><td class="font-body-sm text-on-surface-variant">${k[6]}</td><td class="font-label-sm text-outline">${k[7]}</td></tr>`; }).join('')}</tbody></table></div></section>
      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
        <section class="card p-5 2xl:col-span-7">${UI.h('Tren kinerja bulanan (tahun berjalan)', 'Pendapatan, biaya energi & ops, NOI (Rp miliar), total pengunjung (ribu)', '', 'show_chart')}
          <div class="flex gap-4 font-label-sm text-label-sm mb-1"><span><span class="text-sky-300">●</span> Pendapatan</span><span><span class="text-secondary">●</span> NOI</span><span><span class="text-rose-300">●</span> Biaya energi & ops</span></div>
          ${UI.line([{ data: TR.map((r) => r[2]), color: '#38bdf8' }, { data: TR.map((r) => r[2] - r[3]), color: '#4edea3' }, { data: TR.map((r) => r[3]), color: '#fb7185' }], { labels: TR.map((r) => r[0]), min: 0, max: 56, h: 220 })}
          <div class="grid grid-cols-5 lg:grid-cols-10 gap-1 mt-2">${TR.map((r) => `<div class="inner p-1.5 text-center"><div class="lbl">${r[0]}</div><div class="font-label-md text-label-md">${num(r[1])}k</div></div>`).join('')}</div></section>
        <section class="card p-5 2xl:col-span-5">${UI.h('Tagihan & umur piutang (AR aging)', 'SOP-FIN-01 / SOP-FIN-02, Rp miliar', '', 'request_quote')}
          <div class="flex items-center gap-5">${UI.donut(AR.map((a, i) => ({ v: a.v, color: ['#4edea3', '#38bdf8', '#f59e0b', '#f43f5e'][i] })), { size: 150, center: num(arTot, 1), sub: 'Total AR (M)' })}
            <div class="flex-1 flex flex-col gap-2">${AR.map((a, i) => `<div class="flex items-center gap-2 font-label-md text-label-md"><span class="w-2.5 h-2.5 rounded-full" style="background:${['#4edea3', '#38bdf8', '#f59e0b', '#f43f5e'][i]}"></span><span class="flex-1">${a.b}</span><span>Rp ${num(a.v, 1)} M</span></div>`).join('')}</div></div>
          <div class="lbl mt-4 mb-2">Tenant menunggak (tindak lanjut otomatis)</div>
          ${window.SEED.TENANTS.filter((t) => t.ar).map((t) => `<div class="inner p-3 mb-2 flex items-center gap-3 ${/6\d|9\d/.test(t.pay) ? 'crit-left' : 'warn-left'}"><div class="flex-1"><div class="font-body-md text-body-md">${esc(t.name)} (${t.id})</div><div class="font-label-sm text-label-sm text-outline">${esc(t.pay)} · Rp ${t.ar} Jt</div></div><button class="btn-ghost !py-1" data-sp="${t.id}">${icon('mail', 'text-[14px]')} Kirim SP</button></div>`).join('')}</section>
      </div>
      <section class="card p-5 mb-5">${UI.h('Analisis zonasi lantai, okupansi & produktivitas tenant', 'Blueprint 3_Tenant_Zoning_Perf, optimasi tenant mix & tarif sewa', '', 'stacked_bar_chart')}
        <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>Lantai / zona</th><th>Tenant mix</th><th>NLA (m²)</th><th>Okupansi</th><th>Trafik/bulan</th><th>Tarif (Rp/m²)</th><th>Sewa (Jt)</th><th>Omzet (Jt)</th><th>OCR</th><th>Rekomendasi strategis pemilik</th></tr></thead><tbody>
        ${Z.map((z) => { const occ = z.leased / z.nla, r = (z.leased * z.rate) / 1e6, ocr = r / z.sales; return `<tr><td class="font-label-lg">${z.name}</td><td class="font-body-sm text-on-surface-variant">${esc(z.mix)}</td><td class="font-label-md">${num(z.nla)}</td><td class="w-28"><div class="font-label-md ${occ >= 0.95 ? 'text-secondary' : 'text-amber-300'}">${(occ * 100).toFixed(1)}%</div>${UI.bar(occ * 100, occ >= 0.95 ? 'bg-secondary' : 'bg-amber-400')}</td><td class="font-label-md">${num(z.traffic)}</td><td class="font-label-md">${num(z.rate)}</td><td class="font-label-md">${num(r, 0)}</td><td class="font-label-md">${num(z.sales)}</td><td class="font-label-md ${ocr > 0.12 ? 'text-amber-300' : 'text-secondary'}">${(ocr * 100).toFixed(1)}%</td><td class="font-body-sm">${esc(z.rec)}</td></tr>`; }).join('')}
        <tr><td class="font-headline-sm">Total</td><td class="font-body-sm text-on-surface-variant">Seluruh zona (6 lantai)</td><td class="font-label-md">${num(nla)}</td><td class="font-label-md">${((leased / nla) * 100).toFixed(1)}%</td><td class="font-label-md">${num(Z.reduce((a, z) => a + z.traffic, 0))}</td><td class="font-label-md">${num(Z.reduce((a, z) => a + z.rate, 0) / Z.length)}</td><td class="font-label-md">${num(rent)}</td><td class="font-label-md">${num(sales)}</td><td class="font-label-md">${((rent / sales) * 100).toFixed(1)}%</td><td class="font-body-sm">Target okupansi konsolidasi ≥ 95%</td></tr></tbody></table></div></section>
      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
        <section class="card p-5 2xl:col-span-7">${UI.h('Heatmap footfall & deteksi dead zone', 'People counter 3D & Wi-Fi probe, indeks trafik relatif per sektor (SOP-VIS-02)', '', 'grid_on')}
          <div class="grid grid-cols-6 gap-1.5"><div></div>${['Barat', 'Atrium Barat', 'Center Court', 'Atrium Timur', 'Timur'].map((h) => `<div class="lbl text-center">${h}</div>`).join('')}
          ${heat.map(([f, v]) => `<div class="lbl self-center">${f}</div>${v.map((x) => `<div class="rounded-md h-11 flex items-center justify-center font-label-md text-label-md ${x < 40 ? 'ring-1 ring-rose-400/70' : ''}" style="background:rgba(56,189,248,${(x / 100) * 0.85 + 0.05})" title="Indeks ${x}">${x}${x < 40 ? ' ⚠' : ''}</div>`).join('')}`).join('')}</div>
          <div class="font-label-sm text-label-sm text-on-surface-variant mt-3">⚠ Dead zone (indeks &lt; 40): 2F Atrium Barat & Atrium Timur, Rooftop Atrium Barat. Rekomendasi: aktivasi event atau pop-up (SOP-VIS-02).</div></section>
        <section class="card p-5 2xl:col-span-5">${UI.h('Kontrak jatuh tempo & pipeline leasing', 'Tim leasing dipicu 6 bulan sebelum kontrak habis (SOP-COM-01)', '', 'event_upcoming')}
          ${window.SEED.CONTRACTS.map((c) => `<div class="inner p-3 mb-2 flex items-center gap-3 ${c.m <= 3 ? 'crit-left' : c.m <= 6 ? 'warn-left' : ''}"><div class="w-12 text-center"><div class="font-headline-md text-headline-md ${c.m <= 3 ? 'text-tertiary' : c.m <= 6 ? 'text-amber-300' : ''}">${c.m}</div><div class="lbl">bulan</div></div><div class="flex-1"><div class="font-body-md text-body-md">${esc(c.t)}</div><div class="font-label-sm text-label-sm text-outline">${esc(c.act)}</div></div></div>`).join('')}
          <div class="grid grid-cols-3 gap-2 mt-3">${[['Tersewa', '93.7%'], ['Fit-out', '2.1%'], ['Kosong', '4.2%']].map((r) => `<div class="inner p-2 text-center"><div class="lbl">${r[0]}</div><div class="font-headline-sm text-headline-sm">${r[1]}</div></div>`).join('')}</div></section>
      </div>
      ${UI.relasi('O360')}`;
    },
    mount(root) {
      const pdf = root.querySelector('#o360-pdf'); if (pdf) pdf.addEventListener('click', reportPdf);
      root.querySelectorAll('[data-sp]').forEach((b) => b.addEventListener('click', () => {
        const t = window.SEED.TENANTS.find((x) => x.id === b.dataset.sp);
        Store.addEvent({ from: 'O360', to: 'TEN', code: 'EVT-AR-OVERDUE', title: 'Surat peringatan ' + t.name, detail: t.pay + ' · Rp ' + t.ar + ' Jt', sev: 'P3' });
        Store.chat({ from: 'Finance AR → ' + t.name, ch: 'Tenant App', bot: true, tenant: t.id, text: 'Surat peringatan: tagihan unit ' + t.id + ' (' + t.pay + ', Rp ' + t.ar + ' Jt). Mohon segera dilunasi.' });
        UI.toast('SP dikirim ke ' + t.name, 'P3', 'EVT-AR-OVERDUE → Layanan Tenant & SLA (SOP-FIN-02)');
      }));
    },
  };
})();
