/* Simulator Use Case — relasi antar dashboard (swimlane + matriks + eksekusi skenario) */
(function () {
  window.Views = window.Views || {};
  const { esc, icon } = UI;
  const REF = window.SMICC_REF;
  const CODES = REF.dashboards.map((d) => d.code);
  const F = { uc: 'UC-01', cell: null };

  function swimlane(u) {
    const sim = Store.s.sim;
    const runIdx = sim && sim.ucId === u.id ? sim.idx : -1;
    const touched = CODES.filter((c) => u.steps.some((s) => s.frm === c || s.to === c));
    const n = u.steps.length;
    return `<div class="overflow-x-auto"><div class="grid gap-y-1" style="grid-template-columns: 170px repeat(${n}, minmax(92px, 1fr))">
      <div></div>${u.steps.map((s, i) => `<div class="text-center font-label-sm text-label-sm ${i === runIdx ? 'text-primary' : 'text-outline'} pb-1">#${i + 1}<br>${esc(s.t)}</div>`).join('')}
      ${touched.map((c) => `<a href="#/${UI.DBMAP[c].route}" class="flex items-center gap-2 pr-2 font-label-md text-label-md text-on-surface hover:text-primary">${icon(UI.ICON[c], 'text-[16px] text-primary')}${c}<span class="text-outline truncate text-[10px]">${esc(UI.DBMAP[c].name.split(' ')[0])}</span></a>
        ${u.steps.map((s, i) => { const isF = s.frm === c, isT = s.to === c; const lo = Math.min(touched.indexOf(s.frm), touched.indexOf(s.to)), hi = Math.max(touched.indexOf(s.frm), touched.indexOf(s.to)); const mid = touched.indexOf(c) > lo && touched.indexOf(c) < hi; const done = i < runIdx, cur = i === runIdx;
          const col = cur ? '#38bdf8' : done ? '#4edea3' : 'rgba(189,200,209,.45)';
          return `<div class="relative h-11 flex items-center justify-center border-l border-white/5">${(isF || isT || mid) && s.frm !== s.to ? `<div class="absolute left-1/2 -translate-x-1/2 w-0.5" style="background:${col};top:${isF && touched.indexOf(c) === lo || isT && touched.indexOf(c) === lo ? '50%' : '0'};bottom:${isF && touched.indexOf(c) === hi || isT && touched.indexOf(c) === hi ? '50%' : '0'}"></div>` : ''}
            ${isT ? `<div class="relative z-[1] w-5 h-5 rounded-full flex items-center justify-center ${cur ? 'pulse-ring' : ''}" style="background:${col}" title="${esc(s.event)}: ${esc(s.action)}">${icon(s.frm === s.to ? 'adjust' : 'south', 'text-[13px] text-surface')}</div>` : isF ? `<div class="relative z-[1] w-3.5 h-3.5 rounded-full border-2 bg-surface" style="border-color:${col}"></div>` : ''}</div>`; }).join('')}`).join('')}
    </div></div>`;
  }

  function matrix() {
    const cnt = {};
    REF.usecases.forEach((u) => u.steps.forEach((s) => { if (s.frm !== s.to) { const k = s.frm + '>' + s.to; cnt[k] = (cnt[k] || 0) + 1; } }));
    const rel = {};
    REF.relations.forEach((r) => (rel[r.frm + '>' + r.to] = r.data));
    const max = Math.max(...Object.values(cnt));
    const sel = F.cell;
    return `<div class="grid grid-cols-1 xl:grid-cols-12 gap-5"><div class="xl:col-span-7 overflow-x-auto"><div class="grid gap-1" style="grid-template-columns: 70px repeat(${CODES.length}, minmax(44px,1fr))">
      <div class="lbl self-end">Dari\\Ke</div>${CODES.map((c) => `<div class="lbl text-center">${c}</div>`).join('')}
      ${CODES.map((a) => `<div class="lbl self-center">${a}</div>${CODES.map((b) => { const k = a + '>' + b, n = cnt[k] || 0, has = rel[k]; return a === b ? `<div class="mx-cell bg-white/5 text-outline">·</div>` : `<button class="mx-cell ${sel === k ? 'ring-2 ring-sky-300' : ''}" data-cell="${k}" style="background:${has ? `rgba(56,189,248,${0.12 + (n / max) * 0.7})` : 'rgba(255,255,255,.02)'};color:${n / max > 0.5 ? '#0a122a' : '#dbe1ff'}" title="${esc(has || 'tidak ada relasi')}">${has ? n || '●' : ''}</button>`; }).join('')}`).join('')}</div>
      <div class="font-label-sm text-label-sm text-on-surface-variant mt-2">Angka = jumlah langkah use case yang melewati relasi tersebut · ● = relasi terdefinisi tanpa langkah UC · klik sel untuk detail</div></div>
      <div class="xl:col-span-5">${sel ? (() => { const [a, b] = sel.split('>'); const steps = REF.usecases.flatMap((u) => u.steps.map((s, i) => ({ u, s, i })).filter((x) => x.s.frm === a && x.s.to === b)); return `<div class="inner p-4"><div class="flex items-center gap-2">${UI.dbLink(a)}${icon('arrow_forward', 'text-outline')}${UI.dbLink(b)}</div><p class="font-body-sm text-body-sm mt-3">${esc(rel[sel] || 'Tidak ada relasi terdefinisi.')}</p><div class="lbl mt-3 mb-2">Langkah use case (${steps.length})</div>${steps.map((x) => `<a href="#/usecase?uc=${x.u.id}" class="rel-row mb-1.5"><span class="font-label-md text-label-md text-primary shrink-0">${x.u.id}#${x.i + 1}</span><div><div class="font-label-sm text-label-sm text-outline">${x.s.event} · ${x.s.actor}</div><div class="font-body-sm text-body-sm">${esc(x.s.action)}</div></div></a>`).join('')}</div>`; })() : `<div class="inner p-4 font-body-sm text-body-sm text-on-surface-variant">Pilih sel matriks untuk melihat data yang mengalir & langkah use case terkait.</div>`}</div></div>`;
  }

  window.Views.usecase = {
    title: 'Simulator Use Case', live: true,
    render(p) {
      if (p.uc) F.uc = p.uc;
      const u = REF.usecases.find((x) => x.id === F.uc) || REF.usecases[0];
      const sim = Store.s.sim;
      const running = sim && sim.running;
      return `<section class="card p-5 mb-5"><div class="flex flex-wrap items-center gap-4"><div><h2 class="font-headline-lg text-headline-lg">Simulator Use Case · Relasi Antar Dashboard</h2><p class="font-body-sm text-body-sm text-on-surface-variant">${REF.usecases.length} skenario lintas ${CODES.length} dashboard. Jalankan untuk melihat event mengalir: tiket dibuat, aset berubah status, kamera ditandai, tenant di-broadcast, KPI ter-update.</p></div>
        <div class="ml-auto flex items-center gap-3"><label class="flex items-center gap-2 font-label-md text-label-md"><input type="checkbox" id="follow" class="accent-sky-400" ${Store.s.settings.follow ? 'checked' : ''}> Ikuti alur (auto-navigasi)</label>
          <select id="speed" class="inp !w-auto !py-1.5">${[[0.5, '0.5x lambat'], [1, '1x normal'], [2, '2x cepat']].map(([v, l]) => `<option value="${v}" ${Store.s.settings.speed == v ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <a class="btn-ghost" href="../docs/RUNBOOK_Relasi_Dashboard_Summarecon_Mall.md" target="_blank">${icon('description', 'text-[16px]')} Runbook</a></div></div></section>
      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
        <section class="card p-3 2xl:col-span-4 max-h-[860px] overflow-y-auto">${REF.usecases.map((x) => `<button class="w-full text-left rel-row mb-1.5 ${x.id === u.id ? '!bg-sky-500/10 !border-sky-400/40' : ''}" data-uc="${x.id}"><div class="flex-1"><div class="flex items-center gap-2"><span class="font-label-lg text-label-lg text-primary">${x.id}</span>${x.priority.startsWith('P') ? UI.prio(x.priority) : UI.chip('Bisnis')}${sim && sim.ucId === x.id ? UI.chip(sim.running ? 'BERJALAN' : 'SELESAI', sim.running ? 'bg-sky-500/20 text-sky-200' : 'bg-secondary/15 text-secondary') : ''}</div><div class="font-body-sm text-body-sm mt-0.5">${esc(x.name)}</div><div class="font-label-sm text-label-sm text-outline">${x.primary} → ${esc(x.related)}</div></div></button>`).join('')}</section>
        <section class="card p-5 2xl:col-span-8">
          <div class="flex flex-wrap items-start justify-between gap-3"><div><div class="font-label-lg text-label-lg text-primary">${u.id} · Dashboard utama ${u.primary}</div><h2 class="font-headline-lg text-headline-lg">${esc(u.name)}</h2><p class="font-body-sm text-body-sm text-on-surface-variant mt-1"><b>Trigger:</b> ${esc(u.trigger)}</p></div>
            <div class="flex gap-2">${running ? `<button class="btn-danger" id="stop">${icon('stop')} Hentikan</button>` : `<button class="btn" id="run">${icon('play_arrow')} Jalankan Simulasi</button>`}</div></div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">${[['Prioritas', u.priority], ['SOP Acuan', u.sops], ['Aktor', u.actors], ['Kriteria Sukses', u.goal]].map(([k, v]) => `<div class="inner p-3"><div class="lbl">${k}</div><div class="font-body-sm text-body-sm mt-1">${k === 'SOP Acuan' ? v.split(/,\s*/).map((s) => `<a class="text-primary hover:underline" href="#/sop?id=${s}">${s}</a>`).join(', ') : esc(v)}</div></div>`).join('')}</div>
          <div class="lbl mt-5 mb-2">Swimlane alur antar dashboard (○ asal · ● tujuan)</div>${swimlane(u)}
          <div class="lbl mt-5 mb-2">Langkah</div>
          <div class="flex flex-col gap-2">${u.steps.map((s, i) => { const st = sim && sim.ucId === u.id ? (i < sim.idx ? 'done' : i === sim.idx && sim.running ? 'cur' : '') : ''; return `<div class="flow-node ${st} grid grid-cols-12 gap-3 items-start"><div class="col-span-1 font-headline-sm text-headline-sm ${st === 'done' ? 'text-secondary' : st === 'cur' ? 'text-primary' : 'text-outline'}">${st === 'done' ? icon('check_circle', 'text-[20px]') : i + 1}</div>
            <div class="col-span-3 flex items-center gap-1 flex-wrap">${UI.dbLink(s.frm, '', s.frm)}${s.frm !== s.to ? icon('arrow_forward', 'text-outline text-[16px]') + UI.dbLink(s.to, '', s.to) : ''}</div>
            <div class="col-span-6"><div class="font-label-sm text-label-sm text-outline">${s.event} · ${s.actor} (${esc(REF.roles[s.actor])}) · ${esc(s.t)}</div><div class="font-body-sm text-body-sm">${esc(s.action)}</div>${s.data ? `<div class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">data: ${esc(s.data)}</div>` : ''}</div>
            <div class="col-span-2 text-right">${s.fx ? UI.chip(esc(s.fx.split(':')[0]), 'bg-white/5 text-outline') : ''}</div></div>`; }).join('')}</div>
        </section></div>
      <section class="card p-5">${UI.h('Matriks Relasi Dashboard', 'Baris = dashboard asal, kolom = dashboard tujuan · ' + REF.relations.length + ' relasi', '', 'grid_on')}${matrix()}</section>`;
    },
    mount(root) {
      root.querySelectorAll('[data-uc]').forEach((b) => b.addEventListener('click', () => { F.uc = b.dataset.uc; history.replaceState(null, '', '#/usecase?uc=' + F.uc); Shell.rerender(); }));
      root.querySelectorAll('[data-cell]').forEach((b) => b.addEventListener('click', () => { F.cell = b.dataset.cell; Shell.rerender(); }));
      const run = root.querySelector('#run');
      run && run.addEventListener('click', () => Sim.run(F.uc));
      const stop = root.querySelector('#stop');
      stop && stop.addEventListener('click', () => Sim.stop());
      root.querySelector('#follow').addEventListener('change', (e) => Store.setting('follow', e.target.checked));
      root.querySelector('#speed').addEventListener('change', (e) => Store.setting('speed', +e.target.value));
    },
  };
})();
