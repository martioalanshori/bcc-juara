/* DB-TIC Ticketing & Incident Ops — hub seluruh tiket. */
(function () {
  window.Views = window.Views || {};
  const { esc, icon } = UI;
  const REF = window.SMICC_REF;
  const F = { q: '', zone: 'ALL', prio: 'ALL', scope: 'ACTIVE', page: 1, sel: null };
  const PER = 7;

  function list() {
    let t = Store.s.tickets.slice();
    if (F.scope === 'ACTIVE') t = t.filter((x) => x.status !== 'CLOSED' && x.status !== 'RESOLVED');
    if (F.scope === 'DONE') t = t.filter((x) => x.status === 'CLOSED' || x.status === 'RESOLVED');
    if (F.zone !== 'ALL') t = t.filter((x) => x.zone === F.zone);
    if (F.prio === 'BREACH') t = t.filter((x) => Store.slaInfo(x).breached || Store.slaInfo(x).atRisk);
    else if (F.prio !== 'ALL') t = t.filter((x) => x.priority === F.prio);
    if (F.q) { const q = F.q.toLowerCase(); t = t.filter((x) => (x.id + x.title + x.location + (x.tenant || '') + x.sop + x.team).toLowerCase().includes(q)); }
    return t.sort((a, b) => a.priority.localeCompare(b.priority) || Store.slaInfo(a).remain - Store.slaInfo(b).remain);
  }

  function stats() {
    const all = Store.s.tickets;
    const act = Store.activeTickets();
    const done = all.filter((t) => t.resolvedAt);
    const mttr = done.length ? done.reduce((a, t) => a + (t.resolvedAt - t.createdAt), 0) / done.length / 60000 : 0;
    const within = done.filter((t) => !Store.slaInfo(t).breached).length;
    const comp = ((469 + within) / (482 + done.length)) * 100; // baseline MTD 482 tiket (Analytics) + tiket live
    const esc = act.filter((t) => t.escalations.length || Store.slaInfo(t).breached);
    return { all, act, done, mttr, comp, esc };
  }

  function row(t) {
    const s = Store.slaInfo(t);
    const ten = t.tenant ? window.SEED.TENANTS.find((x) => x.id === t.tenant) : null;
    const closed = t.status === 'CLOSED' || t.status === 'RESOLVED';
    return `<tr class="row ${F.sel === t.id ? 'sel' : ''}" data-id="${t.id}">
      <td class="w-28"><div class="flex items-start gap-2"><span class="w-2 h-2 mt-1.5 rounded-md ${UI.PRIO[t.priority].dot} ${t.priority === 'P1' && !closed ? 'pulse-ring' : ''}"></span><div><div class="font-label-lg text-label-lg text-primary">#${t.id}</div><div class="mt-1">${UI.prio(t.priority)}</div></div></div></td>
      <td><div class="font-headline-sm text-[15px] text-on-surface leading-snug">${esc(t.title)}</div><div class="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">${esc(t.desc)}</div><div class="mt-1 flex flex-wrap gap-1">${UI.status(t.status)}${UI.chip(t.sop, 'bg-white/5 text-on-surface-variant')}${t.escalations.length ? UI.chip(icon('north_east', 'text-[12px]') + 'Eskalasi', 'bg-rose-500/15 text-rose-300') : ''}</div></td>
      <td class="w-40"><div class="font-label-md text-label-md text-on-surface">${esc(t.location)}</div><div class="font-label-sm text-label-sm text-on-surface-variant mt-1">${ten ? 'Tenant: ' + esc(ten.name) : esc(t.source)}</div></td>
      <td class="w-36">${closed ? `<span class="font-label-md text-label-md ${s.breached ? 'text-rose-300' : 'text-secondary'}">${icon(s.breached ? 'error' : 'check_circle', 'text-[14px] align-middle')} ${s.breached ? 'Lewat SLA' : 'Dalam SLA'}</span><div class="font-label-sm text-label-sm text-outline mt-1">${UI.dur(t.resolvedAt - t.createdAt)}</div>` :
      `<div class="rounded-md px-2 py-1 font-label-md text-label-md ${s.breached ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : s.atRisk ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-on-surface border border-white/10'}"><span data-due="${s.due}"></span></div><div class="mt-1">${UI.bar(s.pct * 100, s.breached ? 'bg-rose-500' : s.atRisk ? 'bg-amber-400' : 'bg-secondary')}</div>`}</td></tr>`;
  }

  function inspector(t) {
    if (!t) return UI.card(`<div class="p-6 text-center text-on-surface-variant">${icon('touch_app', 'text-[32px]')}<p class="mt-2">Pilih tiket untuk melihat detail, checklist SOP, dan relasi dashboard.</p></div>`);
    const s = Store.slaInfo(t);
    const sop = Store.SOP[t.sop];
    const cam = t.cam ? window.SEED.CAMERAS.find((c) => c.id === t.cam) : null;
    const ten = t.tenant ? window.SEED.TENANTS.find((x) => x.id === t.tenant) : null;
    const si = Store.STATUSES.indexOf(t.status);
    const next = Store.STATUSES[si + 1];
    const nextLbl = { ACKNOWLEDGED: 'Akui tiket', DISPATCHED: 'Kirim tim', 'ON-SITE': 'Tandai tim tiba', RESOLVED: 'Tandai selesai', CLOSED: 'Verifikasi & tutup' }[next];
    const related = sop ? [sop.dashboard].concat(sop.related.split(/,\s*/)).filter((c) => UI.DBMAP[c] && c !== 'TIC') : [];
    const uniq = [...new Set(related)];
    const params = (c) => (c === 'CCTV' && t.cam ? 'cam=' + t.cam : c === 'TEN' && t.tenant ? 'tenant=' + t.tenant : c === 'SOP' ? '' : '');
    return `<section class="card p-5 ${t.priority === 'P1' ? 'crit-left' : t.priority === 'P2' ? 'warn-left' : 'info-left'}" id="inspector">
      <div class="flex items-center justify-between mb-2"><span class="flex items-center gap-2 font-label-sm text-label-sm text-tertiary"><span class="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>Inspeksi tiket aktif</span>${UI.prio(t.priority)}</div>
      <div class="font-label-lg text-label-lg text-primary">#${t.id}</div>
      <h2 class="font-headline-md text-headline-md text-on-surface mt-1">${esc(t.title)}</h2>
      <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${esc(t.location)}, zona ${t.zone}</p>
      <p class="font-body-md text-body-md text-on-surface mt-2">${esc(t.desc)}</p>
      ${cam ? `<a href="/command-center/cctv?cam=${cam.id}" class="block mt-3 cam-tile aspect-video"><div class="scan"></div>${UI.cam(cam, { box: [140, 90, 60, 40], boxLabel: t.title.slice(0, 22) })}<div class="cam-ov top flex justify-between"><span><span class="text-secondary">●</span> ${cam.id} · ${esc(cam.name)}</span></div><div class="cam-ov bot flex justify-end"><span class="flex items-center gap-1">${icon('open_in_full', 'text-[14px]')} Buka di CCTV</span></div></a>` : ''}
      <div class="grid grid-cols-2 gap-2 mt-3">
        <div class="inner p-2.5"><div class="lbl">SLA resolusi (${s.lvl.resolveText})</div><div class="font-label-lg text-label-lg mt-1 ${s.breached ? 'text-rose-300' : 'text-on-surface'}">${t.resolvedAt ? UI.dur(t.resolvedAt - t.createdAt) + ' total' : `<span data-due="${s.due}"></span>`}</div></div>
        <div class="inner p-2.5"><div class="lbl">Respons (${s.lvl.respond} menit)</div><div class="font-label-lg text-label-lg mt-1 ${s.responded ? 'text-secondary' : 'text-amber-300'}">${s.responded ? 'Terpenuhi' : `<span data-due="${s.respDue}"></span>`}</div></div>
        <div class="inner p-2.5"><div class="lbl">Tim yang ditugaskan</div><div class="font-body-sm text-body-sm mt-1 text-on-surface">${esc(t.team || '-')}</div></div>
        <div class="inner p-2.5"><div class="lbl">Sumber</div><div class="font-body-sm text-body-sm mt-1 text-on-surface">${esc(t.source)}</div></div>
        ${ten ? `<a href="/command-center/tenant?tenant=${ten.id}" class="inner p-2.5 col-span-2 hover:bg-white/5"><div class="lbl">Tenant terdampak</div><div class="font-body-sm text-body-sm mt-1 text-primary">${esc(ten.name)} (${ten.id}), ${esc(ten.mgr)}</div></a>` : ''}
      </div>
      <div class="mt-4"><div class="lbl mb-2">Siklus status</div><div class="flex items-center gap-1">${Store.STATUSES.map((st, i) => `<div class="flex-1"><div class="h-1.5 rounded-md ${i <= si ? 'bg-secondary' : 'bg-surface-container-highest'}"></div><div class="font-label-sm text-[9px] mt-1 ${i === si ? 'text-on-surface' : 'text-outline'}">${Store.STATUS_LABEL[st]}</div></div>`).join('')}</div></div>
      <div class="grid grid-cols-2 gap-2 mt-4">
        ${next ? `<button class="${next === 'CLOSED' ? 'btn-ok' : 'btn'} justify-center col-span-2" data-act="advance">${icon(next === 'CLOSED' ? 'verified' : 'arrow_forward')} ${nextLbl}</button>` : `<div class="col-span-2 text-center font-label-md text-label-md text-secondary">${icon('verified', 'text-[16px] align-middle')} Tiket ditutup</div>`}
        <button class="btn-danger justify-center" data-act="escalate" ${t.status === 'CLOSED' ? 'disabled' : ''}>${icon('north_east')} Eskalasi</button>
        <button class="btn-ghost justify-center" data-act="log">${icon('edit_note')} Tambah log</button>
      </div>
      ${uniq.length ? `<div class="mt-4"><div class="lbl mb-2">Relasi dashboard (dari SOP)</div><div class="flex flex-wrap gap-1.5">${uniq.map((c) => UI.dbLink(c, params(c), c)).join('')}<a href="/command-center/sop?id=${t.sop}" class="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2 py-1 font-label-md text-label-md">${icon('menu_book', 'text-[16px] text-primary')} SOP</a></div></div>` : ''}
      ${sop ? `<details class="mt-4" open><summary class="flex items-center justify-between"><span class="lbl">Checklist ${sop.id} (${t.checks.filter(Boolean).length}/${sop.steps.length})</span>${icon('expand_more', 'text-[18px] text-outline')}</summary>
        <div class="flex flex-col gap-1.5 mt-2">${sop.steps.map((st, i) => `<label class="flex gap-2 items-start inner p-2 cursor-pointer hover:bg-white/5"><input type="checkbox" data-chk="${i}" ${t.checks[i] ? 'checked' : ''} class="mt-0.5 accent-sky-400"><div class="min-w-0"><div class="font-label-sm text-label-sm text-outline">${esc(st.phase)} · ${st.role} · ${st.dashboard} · ${esc(st.target)}</div><div class="font-body-sm text-body-sm ${t.checks[i] ? 'text-on-surface-variant line-through' : 'text-on-surface'}">${esc(st.action)}</div></div></label>`).join('')}</div></details>` : ''}
      <div class="mt-4"><div class="lbl mb-2">Timeline & log</div><div class="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">${t.log.slice().reverse().map((l) => `<div class="flex gap-2"><span class="font-label-sm text-label-sm text-outline w-14 shrink-0">${UI.hm(l.ts)}</span><div class="font-body-sm text-body-sm"><span class="text-primary">${esc(l.who)}</span> ${esc(l.text)}</div></div>`).join('')}</div></div>
    </section>`;
  }

  window.Views.ticketing = {
    title: 'Tiket & Insiden', live: true,
    render(p) {
      if (p.id && Store.ticket(p.id)) { F.sel = p.id; }
      const st = stats();
      const L = list();
      const pages = Math.max(1, Math.ceil(L.length / PER));
      if (F.page > pages) F.page = pages;
      if (p.id && !L.slice((F.page - 1) * PER, F.page * PER).find((t) => t.id === p.id)) { const i = L.findIndex((t) => t.id === p.id); if (i >= 0) F.page = Math.floor(i / PER) + 1; }
      const sel = Store.ticket(F.sel) || L[0];
      if (sel) F.sel = sel.id;
      const zones = window.SEED.ZONES;
      const zc = (z) => Store.activeTickets().filter((t) => z === 'ALL' || t.zone === z).length;
      const crit = st.act.filter((t) => t.priority === 'P1').length, high = st.act.filter((t) => t.priority === 'P2').length;
      const cats = window.SEED.CATEGORIES.map((c, i) => ({ c, n: st.all.filter((t) => t.category === c).length, col: ['bg-sky-400', 'bg-emerald-400', 'bg-sky-200', 'bg-slate-400', 'bg-amber-400'][i] }));
      const doneP = (lv) => { const d = st.done.filter((t) => t.priority === lv); return d.length ? Math.round((d.filter((t) => !Store.slaInfo(t).breached).length / d.length) * 100) + '% (' + d.filter((t) => !Store.slaInfo(t).breached).length + '/' + d.length + ')' : '-'; };
      const breached = st.done.filter((t) => Store.slaInfo(t).breached).length;
      const tenants = window.SEED.TENANTS.filter((t) => t.anchor);
      return `
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        ${UI.kpi({ label: 'Total tiket aktif', icon: 'confirmation_number', value: st.act.length, unit: crit + ' kritis, ' + high + ' tinggi', foot: `${st.act.filter((t) => t.status === 'OPEN' || t.status === 'ACKNOWLEDGED').length} menunggu, ${st.act.filter((t) => t.status === 'DISPATCHED' || t.status === 'ON-SITE').length} diproses` })}
        ${UI.kpi({ label: 'MTTR (rata-rata resolusi)', icon: 'timer', value: Math.round(st.mttr) + 'm', delta: st.mttr < 45 ? 'Sesuai target' : 'Perlu perhatian', dcls: st.mttr < 45 ? 'bg-secondary/15 text-secondary' : 'bg-amber-500/15 text-amber-300', foot: 'Target rata-rata < 45 menit, ' + st.done.length + ' tiket selesai' })}
        ${UI.kpi({ label: 'Kepatuhan SLA', icon: 'verified', value: st.comp.toFixed(1) + '%', vcls: st.comp >= 95 ? 'text-secondary' : 'text-amber-300', bar: st.comp, foot: '284 tenant terhubung' })}
        ${UI.kpi({ label: 'Bahaya / eskalasi aktif', icon: 'warning', value: st.esc.length, vcls: st.esc.length ? 'text-tertiary' : 'text-secondary', delta: st.esc.length ? 'Segera atasi' : 'Aman', dcls: st.esc.length ? 'bg-rose-500/20 text-rose-300' : '', foot: esc(st.esc.slice(0, 2).map((t) => t.title.split(' ').slice(0, 3).join(' ')).join('; ') || 'Tidak ada eskalasi') })}
        ${UI.kpi({ label: 'Pengunjung saat ini', icon: 'groups', value: '34.820', delta: '+8,2% dibanding kemarin', foot: 'Kapasitas kompleks 78,4% (tinggi)' })}
      </div>

      <section class="card p-5 mb-5">
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative flex-1 min-w-[260px]">${icon('search', 'absolute left-3 top-2.5 text-outline text-[20px]')}<input id="q" class="inp !pl-10" placeholder="Cari ID tiket (#TCK-...), tenant, lokasi, atau SOP" value="${esc(F.q)}"></div>
          <button class="btn-ghost" id="exp">${icon('table_view', 'text-[16px]')} Ekspor log (.csv)</button>
          <button class="btn-ghost" id="radio">${icon('settings_input_antenna', 'text-[16px]')} Panggil tim lewat radio</button>
          <button class="btn" id="new">${icon('add_circle')} Buat tiket insiden</button>
        </div>
        <div class="flex flex-wrap items-center gap-2 mt-4"><span class="lbl mr-1">Zona:</span>
          ${[{ id: 'ALL', short: 'Semua' }].concat(zones).map((z) => `<button class="chip-btn ${F.zone === z.id ? 'on' : ''}" data-zone="${z.id}">${z.short} (${zc(z.id)})</button>`).join('')}</div>
        <div class="flex flex-wrap items-center gap-2 mt-3"><span class="lbl mr-1">Filter:</span>
          ${[['ALL', 'Semua prioritas'], ['P1', 'P1 Kritis'], ['P2', 'P2 Tinggi'], ['P3', 'P3 Sedang'], ['P4', 'P4 Rendah'], ['BREACH', 'SLA berisiko / terlewati']].map(([k, l]) => `<button class="chip-btn ${F.prio === k ? 'on' : ''}" data-prio="${k}">${k.startsWith('P') ? `<span class="w-1.5 h-1.5 rounded-md ${UI.PRIO[k].dot}"></span>` : ''}${l}</button>`).join('')}
          <span class="mx-2 h-5 w-px bg-white/10"></span>
          ${[['ACTIVE', 'Aktif'], ['DONE', 'Selesai/ditutup'], ['ALL', 'Semua']].map(([k, l]) => `<button class="chip-btn ${F.scope === k ? 'on' : ''}" data-scope="${k}">${l}</button>`).join('')}
        </div>
      </section>

      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
        <div class="2xl:col-span-8 flex flex-col gap-5">
          <section class="card p-5">
            ${UI.h(`Antrean tiket lapangan & mitigasi`, `${L.length} tiket sesuai filter, diurutkan menurut prioritas dan sisa SLA`, `<span class="chip-btn"><span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>Sinkron tiap 1 detik</span>`, 'list_alt')}
            <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>ID & prioritas</th><th>Insiden & deskripsi</th><th>Lokasi / tenant</th><th>Sisa waktu SLA</th></tr></thead>
            <tbody>${L.slice((F.page - 1) * PER, F.page * PER).map(row).join('') || `<tr><td colspan="4" class="text-center text-on-surface-variant py-10">Tidak ada tiket sesuai filter.</td></tr>`}</tbody></table></div>
            <div class="flex items-center justify-between mt-3"><span class="font-label-sm text-label-sm text-outline">Menampilkan ${Math.min(L.length, PER)} dari ${L.length} tiket</span>
              <div class="flex gap-1">${Array.from({ length: pages }, (_, i) => `<button class="chip-btn ${F.page === i + 1 ? 'on' : ''}" data-page="${i + 1}">${i + 1}</button>`).join('')}</div></div>
          </section>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section class="card p-5">${UI.h('Performa penyelesaian SLA', 'Tiket selesai hari ini per prioritas', `<span class="font-label-md text-label-md text-secondary">${st.comp.toFixed(1)}% patuh</span>`)}
              <div class="flex items-center gap-5">${UI.ring(st.comp, { center: st.comp.toFixed(1), sub: 'indeks', size: 130 })}
              <div class="flex-1 flex flex-col gap-2 font-label-md text-label-md">${['P1', 'P2', 'P3', 'P4'].map((p) => `<div class="flex justify-between"><span class="text-on-surface-variant">${Store.SLA[p].resolveText.replace(/\(.*\)/, '')} (${p} ${UI.PRIO[p].label})</span><span class="text-secondary">${doneP(p)}</span></div>`).join('')}
              <div class="text-rose-300">Melebihi SLA: ${breached} tiket</div></div></div></section>
            <section class="card p-5">${UI.h('Distribusi masalah per domain', '', `<span class="font-label-md text-label-md text-on-surface-variant">Total ${st.all.length} kasus</span>`)}
              <div class="flex flex-col gap-3">${cats.map((c) => `<div><div class="flex justify-between font-label-md text-label-md mb-1"><span class="text-on-surface">${c.c}</span><span class="text-primary">${c.n} kasus (${Math.round((c.n / st.all.length) * 100)}%)</span></div>${UI.bar((c.n / st.all.length) * 100, c.col)}</div>`).join('')}</div></section>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section class="card p-5">${UI.h('Kesiapan tim reaksi cepat', '', `<span class="font-label-md text-label-md text-secondary">92% siap siaga</span>`)}
            <div class="flex flex-col gap-2">${window.SEED.TEAMS.map((tm) => { const busy = Store.activeTickets().filter((t) => t.team === tm.name).length; return `<div class="inner p-3 flex items-center gap-3">${icon({ MEP: 'build', Security: 'shield', ERT: 'local_fire_department', Housekeeping: 'cleaning_services', Parkir: 'local_parking' }[tm.skill], 'text-primary text-[20px]')}<div class="flex-1 min-w-0"><div class="font-body-md text-body-md text-on-surface">${tm.name}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${esc(tm.members)} · ${tm.radio}</div></div><div class="text-right"><div class="font-label-md text-label-md text-on-surface">${tm.on}/${tm.total}</div><div class="font-label-sm text-label-sm ${busy ? 'text-amber-300' : 'text-secondary'}">${busy ? busy + ' tiket' : 'Siaga'}</div></div></div>`; }).join('')}</div></section>
          <section class="card p-5">${UI.h('Pantauan SLA tenant', 'Anchor tenant prioritas', UI.link('tenant', 'Buka Layanan Tenant & SLA', 'font-label-md text-label-md text-primary'))}
            <div class="flex flex-col gap-2">${tenants.map((tn) => { const open = Store.activeTickets().filter((t) => t.tenant === tn.id); return `<a href="/command-center/tenant?tenant=${tn.id}" class="inner p-3 flex items-center gap-3 hover:bg-white/5"><div class="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center font-label-md text-label-md text-primary">${tn.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div><div class="flex-1"><div class="font-body-md text-body-md">${esc(tn.name)} (${tn.id})</div><div class="font-label-sm text-label-sm text-on-surface-variant">Skor kepuasan ${tn.score}%</div></div>${open.length ? UI.chip(open.length + ' tiket aktif', 'bg-rose-500/15 text-rose-300') : UI.chip('Normal', 'bg-secondary/15 text-secondary')}</a>`; }).join('')}</div></section>
          </div>
        </div>
        <div class="2xl:col-span-4 flex flex-col gap-5">
          <div class="2xl:sticky 2xl:top-20 2xl:max-h-[calc(100vh-6rem)] 2xl:overflow-y-auto rounded-2xl">${inspector(sel)}</div>
        </div>
      </div>
      <div class="mt-5">${UI.relasi('TIC')}</div>`;
    },
    mount(root) {
      const q = root.querySelector('#q');
      q.addEventListener('input', () => { F.q = q.value; F.page = 1; const pos = q.selectionStart; Shell.rerender(); setTimeout(() => { const n = document.getElementById('q'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 80); });
      root.querySelectorAll('[data-zone]').forEach((b) => b.addEventListener('click', () => { F.zone = b.dataset.zone; F.page = 1; Shell.rerender(); }));
      root.querySelectorAll('[data-prio]').forEach((b) => b.addEventListener('click', () => { F.prio = b.dataset.prio; F.page = 1; Shell.rerender(); }));
      root.querySelectorAll('[data-scope]').forEach((b) => b.addEventListener('click', () => { F.scope = b.dataset.scope; F.page = 1; Shell.rerender(); }));
      root.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => { F.page = +b.dataset.page; Shell.rerender(); }));
      root.querySelectorAll('tr.row').forEach((r) => r.addEventListener('click', () => { F.sel = r.dataset.id; Router.replace('/ticketing?id=' + F.sel); Shell.rerender(); }));
      root.querySelector('#new').addEventListener('click', () => Shell.newTicket({}));
      root.querySelector('#radio').addEventListener('click', () => UI.toast('Panggilan radio ke CH-01 (Security), CH-02 (MEP), CH-03 (HK), CH-04 (Parkir)', 'P3', 'Semua tim: konfirmasi posisi & status siaga'));
      root.querySelector('#exp').addEventListener('click', () => {
        const rows = [['ID', 'Prioritas', 'Judul', 'Kategori', 'Zona', 'Lokasi', 'Tenant', 'Status', 'SOP', 'Tim', 'Dibuat', 'Selesai', 'Durasi(menit)', 'SLA']];
        Store.s.tickets.forEach((t) => { const s = Store.slaInfo(t); rows.push([t.id, t.priority, t.title, t.category, t.zone, t.location, t.tenant, t.status, t.sop, t.team, new Date(t.createdAt).toISOString(), t.resolvedAt ? new Date(t.resolvedAt).toISOString() : '', t.resolvedAt ? Math.round((t.resolvedAt - t.createdAt) / 60000) : '', s.breached ? 'BREACH' : 'OK']); });
        const csv = rows.map((r) => r.map((c) => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'SMICC_Ticket_Log_' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
      });
      const ins = root.querySelector('#inspector');
      if (!ins) return;
      const id = F.sel;
      ins.querySelectorAll('[data-chk]').forEach((c) => c.addEventListener('change', () => Store.toggleCheck(id, +c.dataset.chk)));
      const act = (a) => ins.querySelector(`[data-act="${a}"]`);
      act('advance') && act('advance').addEventListener('click', () => { Store.advance(id); const t = Store.ticket(id); UI.toast(`${id} → ${Store.STATUS_LABEL[t.status]}`, t.priority); });
      act('escalate').addEventListener('click', () => {
        const t = Store.ticket(id);
        const lv = REF.escalation.filter((e) => e.level === t.priority);
        UI.modal('Eskalasi ' + id, `<div class="flex flex-col gap-2">${lv.map((e, i) => `<button class="rel-row text-left" data-lv="${i}"><span class="font-label-md text-label-md text-primary w-24 shrink-0">${e.stage}</span><div><div class="font-body-md text-body-md">${esc(e.to)} · T+${e.t >= 43200 ? 'bulanan' : e.t + ' mnt'}</div><div class="font-body-sm text-body-sm text-on-surface-variant">${esc(e.channel)}: ${esc(e.cond)}</div></div></button>`).join('')}</div><p class="font-body-sm text-body-sm text-on-surface-variant mt-3">Sumber: sheet 2_Eskalasi (SOP Drill-down). Eskalasi tercatat sebagai event EVT-ESCALATION ke Komersial & Keuangan.</p>`);
        document.querySelectorAll('[data-lv]').forEach((b) => b.addEventListener('click', () => { const e = lv[+b.dataset.lv]; Store.escalate(id, e.stage + ': ' + e.to + ' via ' + e.channel); UI.closeModal(); UI.toast('Eskalasi ' + e.stage + ' dikirim', 'P1', e.to); }));
      });
      act('log').addEventListener('click', () => {
        UI.modal('Tambah log ' + id, `<form id="f-log" class="flex flex-col gap-3"><textarea class="inp" name="t" rows="3" required placeholder="Catatan lapangan atau kabar dari radio"></textarea><div class="flex justify-end"><button class="btn">Simpan</button></div></form>`);
        document.getElementById('f-log').addEventListener('submit', (e) => { e.preventDefault(); Store.addLog(id, e.target.t.value); UI.closeModal(); });
      });
    },
  };
})();
