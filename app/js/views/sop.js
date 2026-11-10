/* Pusat SOP & Runbook — katalog SOP drill-down, matriks SLA/eskalasi, traceability mindmap */
(function () {
  window.Views = window.Views || {};
  const { esc, icon } = UI;
  const REF = window.SMICC_REF;
  const F = { tab: 'katalog', pillar: 'ALL', q: '', sel: 'SOP-CC-01' };

  function katalog() {
    const pillars = [...new Set(REF.sops.map((s) => s.pillar))];
    const list = REF.sops.filter((s) => (F.pillar === 'ALL' || s.pillar === F.pillar) && (!F.q || (s.id + s.title + s.nodes + s.trigger).toLowerCase().includes(F.q.toLowerCase())));
    const s = Store.SOP[F.sel] || list[0];
    const ucs = REF.usecases.filter((u) => u.sops.includes(s.id));
    const active = Store.activeTickets().filter((t) => t.sop === s.id);
    return `<div class="flex flex-wrap gap-2 mb-4"><div class="relative min-w-[260px] flex-1">${icon('search', 'absolute left-3 top-2.5 text-outline text-[20px]')}<input id="q" class="inp !pl-10" placeholder="Cari SOP, node mindmap, trigger..." value="${esc(F.q)}"></div>
      <button class="chip-btn ${F.pillar === 'ALL' ? 'on' : ''}" data-pillar="ALL">Semua (${REF.sops.length})</button>${pillars.map((p) => `<button class="chip-btn ${F.pillar === p ? 'on' : ''}" data-pillar="${esc(p)}">${esc(p.split(' ').slice(0, 3).join(' '))} (${REF.sops.filter((x) => x.pillar === p).length})</button>`).join('')}</div>
    <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <section class="card p-3 2xl:col-span-4 max-h-[calc(100vh-260px)] overflow-y-auto">${list.map((x) => `<button class="w-full text-left rel-row mb-1.5 ${x.id === s.id ? '!bg-sky-500/10 !border-sky-400/40' : ''}" data-sop="${x.id}"><div class="flex-1 min-w-0"><div class="flex items-center gap-2"><span class="font-label-lg text-label-lg text-primary">${x.id}</span>${x.priority.startsWith('P') ? UI.prio(x.priority.slice(0, 2)) : UI.chip('Proses bisnis')}</div><div class="font-body-sm text-body-sm text-on-surface mt-0.5">${esc(x.title)}</div><div class="font-label-sm text-label-sm text-outline">${esc(x.subdomain)} · ${x.steps.length} langkah · ${x.dashboard}</div></div></button>`).join('')}</section>
      <section class="card p-5 2xl:col-span-8">
        <div class="flex flex-wrap items-start justify-between gap-3"><div><div class="font-label-lg text-label-lg text-primary">${s.id} · ${esc(s.pillar)}</div><h2 class="font-headline-lg text-headline-lg">${esc(s.title)}</h2><div class="font-body-sm text-body-sm text-on-surface-variant">Sub-domain ${esc(s.subdomain)} · Node mindmap: ${esc(s.nodes)}</div></div>
          <div class="flex gap-2">${s.priority.startsWith('P') ? `<button class="btn" data-mk="${s.id}">${icon('add_circle')} Buat tiket dengan SOP ini</button>` : ''}</div></div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
          ${[['Prioritas bawaan', s.priority], ['PIC (penanggung jawab)', REF.roles[s.pic]], ['Dashboard utama', UI.DBMAP[s.dashboard].name], ['Dashboard terkait', s.related], ['Trigger', s.trigger], ['Sumber data/sensor', s.source + ' (' + s.protocol + ')'], ['Aksi otomatis (Blueprint)', s.auto_action], ['KPI SOP', s.kpi], ['Bukti wajib', s.evidence], ['Kriteria penutupan', s.closure]].map(([k, v], i) => `<div class="inner p-3 ${i >= 4 ? 'lg:col-span-2' : ''}"><div class="lbl">${k}</div><div class="font-body-sm text-body-sm mt-1">${esc(v)}</div></div>`).join('')}</div>
        <div class="lbl mt-5 mb-2">Rincian langkah eksekusi (${s.steps.length})</div>
        <div class="flex flex-col gap-2">${s.steps.map((st, i) => `<div class="inner p-3 grid grid-cols-12 gap-3 items-start"><div class="col-span-1 font-headline-md text-headline-md text-primary">${i + 1}</div><div class="col-span-2"><div class="font-label-sm text-label-sm text-outline">${esc(st.phase)}</div><div class="font-label-md text-label-md">${st.role}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${esc(REF.roles[st.role])}</div></div><div class="col-span-6 font-body-sm text-body-sm">${esc(st.action)}<div class="font-label-sm text-label-sm text-secondary mt-1">→ ${esc(st.output)}</div></div><div class="col-span-1 font-label-md text-label-md text-amber-300">${esc(st.target)}</div><div class="col-span-2 text-right">${UI.dbLink(st.dashboard, '', st.dashboard)}</div></div>`).join('')}</div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
          <div><div class="lbl mb-2">Use case yang memakai SOP ini</div>${ucs.map((u) => `<a href="/command-center/usecase?uc=${u.id}" class="rel-row mb-1.5"><span class="font-label-lg text-label-lg text-primary">${u.id}</span><span class="font-body-sm text-body-sm">${esc(u.name)}</span></a>`).join('') || '<div class="font-body-sm text-body-sm text-on-surface-variant">Belum ada.</div>'}</div>
          <div><div class="lbl mb-2">Tiket aktif memakai SOP ini</div>${active.map((t) => `<a href="/command-center/ticketing?id=${t.id}" class="rel-row mb-1.5">${UI.prio(t.priority)}<span class="font-body-sm text-body-sm">${t.id} · ${esc(t.title)}</span></a>`).join('') || '<div class="font-body-sm text-body-sm text-on-surface-variant">Tidak ada.</div>'}</div></div>
      </section></div>`;
  }

  function sla() {
    return `<div class="grid grid-cols-1 2xl:grid-cols-2 gap-5"><section class="card p-5">${UI.h('Matriks SLA insiden P1-P4', 'Blueprint 4_BMS_Utility_SLA_Matrix (rincian)', '', 'timer')}
      ${REF.sla.map((s) => `<div class="inner p-4 mb-2 ${s.level === 'P1' ? 'crit-left' : s.level === 'P2' ? 'warn-left' : 'info-left'}"><div class="flex items-center gap-2">${UI.prio(s.level)}<span class="font-headline-sm text-headline-sm">${esc(s.category)}</span><span class="ml-auto font-label-md text-label-md">Respons <b class="text-primary">${s.respond} mnt</b>, resolusi <b class="text-primary">${esc(s.resolveText)}</b></span></div>
        <div class="grid grid-cols-3 gap-3 mt-2 font-body-sm text-body-sm"><div><div class="lbl">Contoh</div>${esc(s.example)}</div><div><div class="lbl">Trigger deteksi</div>${esc(s.trigger)}</div><div><div class="lbl">PIC / eskalasi pemilik</div>${esc(s.pic)}, ${esc(s.escalation)}</div></div></div>`).join('')}</section>
      <section class="card p-5">${UI.h('Matriks eskalasi berjenjang', 'L0 deteksi → L4 komunikasi publik', '', 'north_east')}
        <table class="tbl"><thead><tr><th>Prio</th><th>Tahap</th><th>T+</th><th>Dari → Ke</th><th>Kanal / kondisi</th></tr></thead><tbody>${REF.escalation.map((e) => `<tr><td>${UI.prio(e.level)}</td><td class="font-label-md">${esc(e.stage)}</td><td class="font-label-md text-amber-300">${e.t >= 43200 ? 'Bulanan' : e.t + 'm'}</td><td class="font-body-sm">${esc(e.to)}</td><td class="font-body-sm text-on-surface-variant">${esc(e.channel)}<br><span class="text-outline">${esc(e.cond)}</span></td></tr>`).join('')}</tbody></table></section></div>`;
  }

  function trace() {
    const by = {};
    REF.mindmap.forEach((m) => { (by[m.pillar] = by[m.pillar] || {}); (by[m.pillar][m.sub] = by[m.pillar][m.sub] || []).push(m); });
    const cov = REF.mindmap.filter((m) => m.sops.length).length;
    return `<section class="card p-5">${UI.h('Keterlacakan mindmap → SOP → dashboard', 'Mindmap_Super_Mall_Ticketing_system.drawio, ' + REF.mindmap.length + ' titik data level 3', UI.chip('Cakupan ' + Math.round((cov / REF.mindmap.length) * 100) + '%', 'bg-secondary/15 text-secondary'), 'account_tree')}
      <div class="inner p-3 mb-4 text-center font-headline-sm text-headline-sm text-primary">Summarecon Mall Integrated Command Center Ticketing System</div>
      <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">${Object.entries(by).map(([p, subs]) => `<div class="inner p-4"><div class="font-headline-sm text-headline-sm text-secondary mb-3">${esc(p)}</div>${Object.entries(subs).map(([sub, leaves]) => `<div class="mb-3"><div class="font-label-lg text-label-lg text-on-surface">▸ ${esc(sub)}</div>${leaves.map((l) => `<div class="flex items-start gap-2 ml-4 mt-1"><span class="font-body-sm text-body-sm text-on-surface-variant flex-1">${esc(l.leaf)}</span><span class="flex flex-wrap gap-1 justify-end">${l.sops.map((x) => `<button class="chip-btn !py-0 !px-1.5" data-sop="${x}">${x}</button>`).join('')}</span></div>`).join('')}</div>`).join('')}</div>`).join('')}</div></section>`;
  }

  window.Views.sop = {
    title: 'Pusat SOP & Runbook', live: false,
    render(p) {
      if (p.id && Store.SOP[p.id]) { F.sel = p.id; F.tab = 'katalog'; }
      const nSteps = REF.sops.reduce((a, s) => a + s.steps.length, 0);
      return `<section class="card p-5 mb-5"><div class="flex flex-wrap items-center gap-4"><div><h2 class="font-headline-lg text-headline-lg">Pusat SOP & Runbook</h2><p class="font-body-sm text-body-sm text-on-surface-variant">${REF.sops.length} SOP, ${nSteps} langkah, ${REF.usecases.length} use case, ${REF.relations.length} relasi dashboard, versi ${REF.generated}</p></div>
        <div class="ml-auto flex flex-wrap gap-2"><a class="btn-ghost" href="/docs/SOP_Drilldown_Summarecon_Mall_Command_Center.xlsx" download>${icon('table_view', 'text-[16px]')} Excel rincian SOP</a><a class="btn-ghost" href="/docs/UseCase_Relasi_Dashboard_Summarecon_Mall.xlsx" download>${icon('table_view', 'text-[16px]')} Excel Use Case</a><a class="btn-ghost" href="/docs/RUNBOOK_Relasi_Dashboard_Summarecon_Mall.md" target="_blank">${icon('description', 'text-[16px]')} Runbook (.md)</a></div></div>
        <div class="flex gap-2 mt-4">${[['katalog', 'Katalog SOP'], ['sla', 'Matriks SLA & eskalasi'], ['trace', 'Keterlacakan mindmap']].map(([k, l]) => `<button class="chip-btn ${F.tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div></section>
        <div id="sop-body">${F.tab === 'katalog' ? katalog() : F.tab === 'sla' ? sla() : trace()}</div>`;
    },
    mount(root) {
      const re = () => { root.innerHTML = this.render({}); this.mount(root); };
      root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { F.tab = b.dataset.tab; re(); }));
      root.querySelectorAll('[data-pillar]').forEach((b) => b.addEventListener('click', () => { F.pillar = b.dataset.pillar; re(); }));
      root.querySelectorAll('[data-sop]').forEach((b) => b.addEventListener('click', () => { F.sel = b.dataset.sop; F.tab = 'katalog'; Router.replace('/sop?id=' + F.sel); re(); window.scrollTo(0, 0); }));
      root.querySelectorAll('[data-mk]').forEach((b) => b.addEventListener('click', () => { const s = Store.SOP[b.dataset.mk]; Shell.newTicket({ sop: s.id, priority: s.priority.slice(0, 2), title: s.title, source: 'Pusat SOP' }); }));
      const q = root.querySelector('#q');
      if (q) q.addEventListener('input', () => { F.q = q.value; const pos = q.selectionStart; re(); const n = root.querySelector('#q'); n.focus(); n.setSelectionRange(pos, pos); });
    },
  };
})();
