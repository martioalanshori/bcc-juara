/* DB-ANL Analytics & Executive Reports */
(function () {
  window.Views = window.Views || {};
  const { esc, icon, num } = UI;
  const F = { range: 'MTD', preset: 0, fmt: 'html' };
  const PRESETS = ['Kinerja Bulanan Komprehensif BOD', 'ESG & Greenship Audit Karbon Mall', 'Evaluasi Tenant SLA & CSAT Skor', 'Audit K3 Mall Insiden & Kebakaran'];

  function report() {
    const t = Store.s.tickets;
    const K = window.SEED.KPIS;
    const done = t.filter((x) => x.resolvedAt);
    const byP = ['P1', 'P2', 'P3', 'P4'].map((p) => { const a = t.filter((x) => x.priority === p); const d = a.filter((x) => x.resolvedAt); return [p, a.length, d.length, d.filter((x) => !Store.slaInfo(x).breached).length]; });
    if (F.fmt === 'csv') {
      const rows = [['Laporan', PRESETS[F.preset]], ['Dibuat', new Date().toLocaleString('id-ID')], [], ['Pilar', 'KPI', 'Target', 'Realisasi']].concat(K.map((k) => [k[0], k[1], k[2], k[3]])).concat([[], ['Prioritas', 'Total', 'Selesai', 'Dalam SLA']]).concat(byP);
      return { name: 'Laporan_BOD_Summarecon.csv', type: 'text/csv', body: '﻿' + rows.map((r) => r.map((c) => '"' + (c == null ? '' : c) + '"').join(',')).join('\n') };
    }
    const html = `<!doctype html><html lang="id"><meta charset="utf-8"><title>${PRESETS[F.preset]}</title><style>body{font-family:Arial;margin:32px;color:#0a122a}h1{margin:0}table{border-collapse:collapse;width:100%;margin:12px 0}td,th{border:1px solid #cbd5e1;padding:6px 8px;font-size:12px;text-align:left}th{background:#0a122a;color:#fff}.s{color:#64748b;font-size:12px}</style>
      <h1>Summarecon Mall — ${PRESETS[F.preset]}</h1><div class="s">Integrated Command Center · Periode ${F.range} · dibuat ${new Date().toLocaleString('id-ID')} · sumber: SMICC-TS</div>
      <h2>Scorecard KPI Pemilik</h2><table><tr><th>Pilar</th><th>KPI</th><th>Target</th><th>Realisasi</th><th>Capaian</th></tr>${K.map((k) => `<tr><td>${k[0]}</td><td>${k[1]}</td><td>${k[2]}</td><td>${k[3]}</td><td>${((k[5] === 'up' ? k[3] / k[2] : k[2] / k[3]) * 100).toFixed(1)}%</td></tr>`).join('')}</table>
      <h2>Kinerja Tiket & SLA</h2><table><tr><th>Prioritas</th><th>Total</th><th>Selesai</th><th>Dalam SLA</th></tr>${byP.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</table>
      <p>MTTR rata-rata: ${done.length ? Math.round(done.reduce((a, x) => a + (x.resolvedAt - x.createdAt), 0) / done.length / 60000) : 0} menit · Eskalasi: ${t.reduce((a, x) => a + x.escalations.length, 0)}</p>
      <h2>Dampak KPI dari Use Case</h2><ul>${Store.s.kpiNotes.map((n) => `<li>${n.ucId || ''} ${n.text}</li>`).join('') || '<li>-</li>'}</ul><script>setTimeout(()=>print(),400)<\/script></html>`;
    return { name: 'Laporan_BOD_Summarecon.html', type: 'text/html', body: html };
  }

  window.Views.analytics = {
    title: 'Analytics & Reports', live: true,
    render() {
      const T = Store.s.tickets;
      const done = T.filter((t) => t.resolvedAt);
      const comp = ((469 + done.filter((t) => !Store.slaInfo(t).breached).length) / (482 + done.length)) * 100;
      const cats = window.SEED.CATEGORIES.map((c, i) => ({ c, v: T.filter((t) => t.category === c).length + [183, 87, 58, 116, 38][i], color: ['#38bdf8', '#4edea3', '#bae6fd', '#fb7185', '#94a3b8'][i] }));
      const tot = cats.reduce((a, c) => a + c.v, 0);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN (EST)'];
      const zones = [['West Wing Luxury & Fashion', 'Lantai GF - L3 · 84 Tenants', 482, 537.4, 98.1, 'Optimal'], ['East Atrium & Anchor', 'Lantai GF - L5 · Sogo & Gramedia', 610, 680.1, 96.4, 'Optimal'], ['F&B Food Court & Dining', 'Lantai 3 · Beban termal dapur', 390, 435.2, 94.2, 'Perlu Optimasi'], ['Entertainment & Cinema', 'Lantai 3 · XXI & Timezone', 295, 328.9, 99.0, 'Optimal'], ['Central Chiller Plant', '5x Centrifugal · 5.800 TR', 840, 936.6, 6.2, 'COP Prima']];
      return `
      <section class="card p-4 mb-5 flex flex-wrap items-center gap-3">
        <div><div class="flex gap-2 font-label-sm text-label-sm"><span class="chip-btn on">PORTAL EKSEKUTIF</span><span class="text-on-surface-variant self-center">SUMMARECON MALL OPS HUB /</span></div><h2 class="font-headline-lg text-headline-lg mt-1">Eksekutif Analytics & Laporan</h2><span class="chip-btn text-secondary mt-1">● Konsolidasi data bulanan & triwulan</span></div>
        <div class="ml-auto flex flex-wrap gap-2">${['Hari Ini', 'MTD', 'Q4 2026', 'YTD'].map((r) => `<button class="chip-btn ${F.range === r ? 'on' : ''}" data-range="${r}">${r}</button>`).join('')}<button class="btn-ghost" data-gen="csv">${icon('table_view', 'text-[16px]')} Ekspor .CSV</button><button class="btn" data-gen="html">${icon('picture_as_pdf')} Unduh BOD (.PDF)</button></div>
      </section>
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        ${UI.kpi({ label: 'OEE & Efisiensi Gedung', icon: 'precision_manufacturing', value: '96.8%', delta: '+2.4% MoM', foot: 'Ketersediaan BMS core 99.85% · MTTR ' + (done.length ? Math.round(done.reduce((a, t) => a + (t.resolvedAt - t.createdAt), 0) / done.length / 60000) : 0) + ' menit · LTI 0' })}
        ${UI.kpi({ label: 'Kepatuhan SLA & CSAT', icon: 'verified', value: comp.toFixed(1) + '%', vcls: 'text-secondary', delta: '★ 4.86 / 5.0', foot: `Total tiket ${T.length} · breach ${done.filter((t) => Store.slaInfo(t).breached).length} · FCR 91.4%` })}
        ${UI.kpi({ label: 'Efisiensi Energi & Opex', icon: 'bolt', value: 'Rp 418.5', unit: 'Jt hemat MTD', vcls: 'text-secondary', delta: '-8.6% EUI', foot: 'Chiller COP 0.548 kW/TR · IKE 184 kWh/m²/th · PLTS 92.4 MWh' })}
        ${UI.kpi({ label: 'Keamanan & Trafik', icon: 'shield', value: '1.284.500', unit: 'footfall', delta: '+14.2% YoY', foot: '420 hari tanpa LTI · CCTV AI 614 valid (0 false alarm)' })}
      </div>
      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
        <div class="2xl:col-span-8 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Tren Performa Operasional & SLA Multi-Departemen', 'Histori 6 bulan pasca integrasi algoritma SCADA AI', UI.chip('Rata-rata kenaikan +1.8% / bulan', 'bg-secondary/15 text-secondary'), 'trending_up')}
            <div class="flex flex-wrap gap-4 font-label-sm text-label-sm mb-2"><span><span class="text-sky-300">■</span> MEP & BMS Chiller</span><span><span class="text-emerald-300">■</span> Keamanan & CCTV</span><span><span class="text-slate-200">■</span> Sanitasi & Lingkungan</span><span><span class="text-rose-300">■</span> Tenant Fit-Out & Support</span><span class="text-rose-300">- - BOD SLA Benchmark 95%</span></div>
            ${UI.line([{ data: [91.2, 92.6, 94.0, 95.1, 97.4, 98.2], color: '#38bdf8', dot: 4 }, { data: [96.0, 96.8, 97.2, 97.9, 99.0, 99.3], color: '#4edea3' }, { data: [92.5, 93.4, 94.6, 95.5, 96.8, 97.1], color: '#e2e8f0' }, { data: [88.0, 89.9, 91.8, 93.6, 95.2, 96.0], color: '#fb7185' }], { labels: months, min: 86, max: 100, refLine: 95, refLabel: 'SLA 95%', h: 240 })}
            <div class="grid grid-cols-4 gap-2 mt-2">${[['MEP & BMS', '97.4%', '+1.2%'], ['Keamanan & CCTV', '99.0%', '+0.9%'], ['Sanitasi', '96.8%', '+1.3%'], ['Tenant Fit-Out', '95.2%', '+1.4%']].map((r) => `<div class="inner p-3"><div class="lbl">${r[0]}</div><div class="font-headline-md text-headline-md text-secondary">${r[1]}</div><div class="font-label-sm text-label-sm text-secondary">${r[2]} MoM</div></div>`).join('')}</div></section>
          <section class="card p-5">${UI.h('Breakdown Biaya Utilitas & Konsumsi Energi per Zona', 'Audit finansial tarif WBP/LWBP & indeks efisiensi sub-metering', UI.chip('Total 2.617 MWh'), 'receipt_long')}
            ${zones.map((z) => `<div class="inner p-4 mb-2 grid grid-cols-12 gap-3 items-center"><div class="col-span-4"><div class="font-headline-sm text-headline-sm">${z[0]}</div><div class="font-label-sm text-label-sm text-outline">${z[1]}</div></div><div class="col-span-2"><div class="lbl">Konsumsi</div><div class="font-label-lg">${z[2]} MWh</div></div><div class="col-span-2"><div class="lbl">Biaya Opex</div><div class="font-label-lg text-primary">Rp ${z[3]} Jt</div></div><div class="col-span-2"><div class="lbl">${z[4] < 10 ? 'COP' : 'Efisiensi HVAC'}</div><div class="font-label-lg">${z[4]}${z[4] < 10 ? '' : '%'}</div></div><div class="col-span-2"><div class="font-label-sm text-label-sm text-right ${z[5] === 'Perlu Optimasi' ? 'text-tertiary' : 'text-secondary'}">${z[5]}</div>${UI.bar(z[4] < 10 ? 90 : z[4], z[5] === 'Perlu Optimasi' ? 'bg-rose-300' : 'bg-secondary')}</div></div>`).join('')}</section>
          <section class="card p-5">${UI.h('Analisis Pareto Root-Cause & Matriks Insiden (30 Hari)', 'Distribusi komplain tenant & anomali fisik tereskalasi ke dispatcher (termasuk tiket live)', UI.chip('Total ' + tot + ' tercatat'), 'donut_large')}
            <div class="flex flex-col lg:flex-row items-center gap-6">${UI.donut(cats.map((c) => ({ v: c.v, color: c.color })), { size: 190, stroke: 26, center: String(tot), sub: 'KASUS TIKET' })}
              <div class="flex-1 w-full flex flex-col gap-2">${cats.sort((a, b) => b.v - a.v).map((c) => `<div class="inner px-3 py-2 flex items-center gap-3"><span class="w-2.5 h-2.5 rounded-full" style="background:${c.color}"></span><span class="flex-1 font-body-sm text-body-sm">${c.c}</span><span class="font-label-md text-label-md">${c.v} Tiket</span><span class="font-label-md text-label-md text-primary w-10 text-right">${Math.round((c.v / tot) * 100)}%</span></div>`).join('')}</div></div>
            <div class="inner p-4 mt-4"><div class="font-headline-sm text-headline-sm text-primary">${icon('psychology', 'text-[18px] align-middle')} Insight Algoritma AI Pemeliharaan Prediktif</div><p class="font-body-sm text-body-sm mt-1">"82% komplain temperatur HVAC terpusat pada rentang jam pergantian shift operasional tenant retail (17:00-18:30 WIB). Intervensi otomatis modul preskriptif SCADA yang menaikkan debit aliran pre-cooling 30 menit lebih awal telah terbukti memangkas keluhan hawa panas 45% berturut-turut pada 2 pekan terakhir."</p></div></section>
        </div>
        <div class="2xl:col-span-4 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Generator Laporan BOD', '', UI.chip('OTOMATIS'), 'description')}
            <div class="lbl mb-2">Pilih preset template</div><div class="grid grid-cols-2 gap-2">${PRESETS.map((p, i) => `<button class="inner p-3 text-left font-label-md text-label-md ${F.preset === i ? '!border-primary-container text-primary' : ''}" data-preset="${i}">${p}</button>`).join('')}</div>
            <div class="lbl mt-4 mb-2">Format keluaran</div><div class="flex gap-2">${[['html', 'PDF Resmi (print)'], ['csv', 'Excel Raw (.CSV)']].map(([k, l]) => `<button class="chip-btn ${F.fmt === k ? 'on' : ''}" data-fmt="${k}">${l}</button>`).join('')}</div>
            <button class="btn w-full justify-center mt-4" data-gen="sel">${icon('bolt')} Generate Paket Laporan Sekarang</button>
            <div class="lbl mt-5 mb-2">Arsip dokumen tersedia</div>
            ${[['Laporan_Kinerja_Okt_2026.pdf', '14.2 MB · Signed GM Ops'], ['Audit_Efisiensi_Energi_Q3.xlsx', '8.4 MB · Disetujui'], ['Evaluasi_SLA_Tenant_Sep.pdf', '3.1 MB · Raw Telemetry']].map((a) => `<div class="inner p-3 mb-2 flex items-center gap-3">${icon('draft', 'text-primary')}<div class="flex-1"><div class="font-body-sm text-body-sm">${a[0]}</div><div class="font-label-sm text-label-sm text-outline">${a[1]}</div></div>${icon('download', 'text-outline')}</div>`).join('')}</section>
          <section class="card p-5">${UI.h('Dampak KPI dari Use Case (Live)', 'EVT-KPI-UPDATE dari seluruh dashboard', '', 'insights')}
            ${Store.s.kpiNotes.slice(0, 6).map((n) => `<div class="inner p-3 mb-2"><div class="font-label-sm text-label-sm text-outline">${UI.time(n.ts)} ${n.ucId ? '· <a class="text-primary" href="#/usecase?uc=' + n.ucId + '">' + n.ucId + '</a>' : ''}</div><div class="font-body-sm text-body-sm">${esc(n.text)}</div></div>`).join('') || `<div class="font-body-sm text-body-sm text-on-surface-variant">Belum ada. Jalankan skenario di ${UI.link('usecase', 'Simulator Use Case')} untuk melihat KPI ter-update otomatis.</div>`}</section>
          <section class="card p-5">${UI.h('Rekomendasi AI Engine', '', UI.chip('Aktif · Prioritas Tinggi', 'bg-secondary/15 text-secondary'), 'auto_awesome')}
            ${[['Optimasi Chiller Plant 04', 'Efisiensi chiller berkontribusi pada penghematan Rp 42.1 Jt/minggu. Disarankan descaling tabung kondensor Unit 04 sebelum akhir bulan guna mempertahankan COP di atas 6.0.', 'BMS'], ['Insentif Green Tenant Fashion', 'Kepatuhan SOP hemat energi tenant fashion mencapai 99.8%. Ajukan surat apresiasi GM & diskon promosi digital signage Atrium.', 'TEN'], ['Peak-Shaving BESS 1.5 MWh', 'Proyeksi beban listrik WBP bulan depan naik +3.5% seiring expo liburan sekolah; aktifkan baterai BESS untuk beban puncak jam 18:00-22:00.', 'ENE']].map((r, i) => `<div class="inner p-3 mb-2"><div class="font-headline-sm text-headline-sm">0${i + 1}. ${r[0]}</div><p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${r[1]}</p><div class="mt-2">${UI.dbLink(r[2])}</div></div>`).join('')}
            <button class="btn-ghost w-full justify-center" data-apply>${icon('done_all', 'text-[16px]')} Terapkan Rekomendasi ke Rencana Kerja</button></section>
        </div>
      </div>
      ${UI.relasi('ANL')}`;
    },
    mount(root) {
      root.querySelectorAll('[data-range]').forEach((b) => b.addEventListener('click', () => { F.range = b.dataset.range; Shell.rerender(); }));
      root.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => { F.preset = +b.dataset.preset; Shell.rerender(); }));
      root.querySelectorAll('[data-fmt]').forEach((b) => b.addEventListener('click', () => { F.fmt = b.dataset.fmt; Shell.rerender(); }));
      root.querySelectorAll('[data-gen]').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.gen !== 'sel') F.fmt = b.dataset.gen;
        const r = report();
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([r.body], { type: r.type })); a.download = r.name; a.click();
        UI.toast('Paket laporan "' + PRESETS[F.preset] + '" dibuat', 'P4', r.name);
      }));
      root.querySelector('[data-apply]').addEventListener('click', () => { Store.addEvent({ from: 'ANL', to: 'BMS', code: 'EVT-KPI-UPDATE', title: 'Rekomendasi AI diteruskan ke rencana kerja Engineering', detail: 'Descaling Chiller-04, BESS peak shaving', sev: 'P4' }); UI.toast('Rekomendasi diteruskan ke BMS, Tenant & Energy', 'P4'); });
    },
  };
})();
