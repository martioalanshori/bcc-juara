/* Persetujuan Acara (Command Center): kotak masuk pengajuan acara untuk Divisi Event dan Operasional Mall.
 * Divisi hanya bisa memutuskan saat gilirannya (Evt.turn), operator Command Center melihat tanpa memutuskan.
 * Tampilan alur, dokumen, dan log memakai EvtApproval (app/js/event/approval-ui.js), sama dengan konsol pengelola. */
(function () {
  window.Views = window.Views || {};
  const { esc, icon, num } = UI;
  const DIV_ROLE = { 'divisi-event': ['event', 'Divisi Event', 'approval'], 'divisi-ops': ['ops', 'Operasional Mall', 'engineering'] };
  const cc = { role: null, div: null, label: 'Operator', name: 'Operator Command Center' }; // akun yang login di portal ini
  const active = () => window.Shell && Shell.current && Shell.current.route === 'persetujuan';

  // Identitas akun dari server: chip di header, nama di menu profil, hak memutuskan.
  // core/auth.js dimuat setelah file ini: ambil identitas setelah semua skrip siap.
  document.addEventListener('DOMContentLoaded', () => window.SMAuth && SMAuth.me().then((m) => {
    const r = m && m.active && m.active['/command-center'], a = r && m.accounts[r]; if (!a) return;
    const d = DIV_ROLE[r]; Object.assign(cc, { role: r, div: d ? d[0] : null, label: d ? d[1] : 'Operator', name: a.name });
    const ch = document.getElementById('cc-id-chip');
    if (ch) { ch.hidden = false; ch.className = 'id-chip ' + (cc.div || 'cc'); ch.innerHTML = icon(d ? d[2] : 'hub', 'text-[18px]') + '<span><b>' + esc(cc.label) + '</b>' + (d ? ' · ' + esc(a.name) : '') + '</span>'; }
    const head = document.querySelector('#cc-prof-menu .pg-prof-head');
    if (head && d) { head.querySelector('b').textContent = a.name; head.querySelector('small').textContent = d[1] + ', ' + a.email; const av = document.querySelector('#cc-prof-btn .pg-av'); if (av) av.textContent = a.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
      const tx = document.querySelector('#cc-prof-btn .cc-prof-txt'); if (tx) { tx.querySelector('b').textContent = a.name; tx.querySelector('small').textContent = d[1]; }
      document.getElementById('cc-prof-btn').setAttribute('aria-label', 'Menu profil ' + a.name); }
    if (window.Shell) Shell.rerender();
    if (active()) redraw();
  }));

  const pending = (e) => e.approval && e.status === 'DRAFT' && e.approval.st === 'DIAJUKAN';
  const mineNow = (e) => { const t = Evt.turn(e); return !!t && !!cc.div && t.who === cc.div; };
  const waitMs = (e) => { const c = Evt.currentStep(e); return c ? Evt.now() - e.approval.steps[c.id].since : 0; };
  // Badge menu: pengajuan yang menunggu keputusan akun ini (operator: semua yang sedang ditinjau).
  function count() { if (!Evt.s) return 0; return Evt.s.order.map(Evt.ev).filter((e) => e && (cc.div ? mineNow(e) : pending(e))).length; }
  window.CCApproval = { count };

  function groups() {
    const all = Evt.s.order.map(Evt.ev).filter((e) => e && e.approval), D7 = 7 * 86400000, t = Evt.now();
    const done = (e) => (e.approval.st === 'DISETUJUI' || e.status !== 'DRAFT') && (e.approval.approvedAt || 0) > t - D7;
    return [
      ['Menunggu keputusan Anda', cc.div ? all.filter(mineNow) : []],
      [cc.div ? 'Di divisi lain atau penyelenggara' : 'Sedang ditinjau', all.filter((e) => !mineNow(e) && pending(e)).concat(all.filter((e) => e.approval.st === 'REVISI'))],
      ['Selesai 7 hari terakhir', all.filter(done)],
    ];
  }
  function row(e, sel) {
    const t = Evt.turn(e), w = waitMs(e), slow = w > EvtApproval.SLOW_MS;
    return `<a href="/command-center/persetujuan?ev=${encodeURIComponent(e.id)}" class="apr-row${e.id === sel ? ' on' : ''}" style="--c:${esc(e.color)}">
      <span class="min-w-0 flex-1"><b>${esc(e.name)}</b><small>${esc(e.org || '-')} · ${esc((e.venue || '').split(',')[0])}</small><small>${t ? esc(t.label) : 'Sudah diputuskan'}${Evt.currentStep(e) ? ', menunggu ' + Evt.durTxt(w) : ''}</small></span>
      ${slow ? UI.chip('> 2 hari', 'bg-rose-500/15 text-rose-300') : UI.chip(esc(Evt.AP_ST[e.approval.st]), EvtApproval.AP_CHIP[e.approval.st])}</a>`;
  }
  function detail(e) {
    const A = EvtApproval, s = Evt.stats(e.id), cap = s.total - s.blocked, end = e.end || e.start + 3 * 3600000;
    const box = cc.div ? A.decideBox(e, cc.div) : '';
    const why = !box && e.status === 'DRAFT' && e.approval.st === 'DIAJUKAN' ? `<div class="inner p-3 mt-4 font-body-sm text-body-sm text-on-surface-variant">${cc.div ? 'Bukan giliran ' + esc(cc.label) + '. ' + esc(Evt.turn(e).label) + '.' : 'Keputusan oleh akun Divisi Event dan Operasional Mall. Operator Command Center hanya memantau.'}</div>` : '';
    return `<section class="card p-5">
        <div class="font-label-sm text-label-sm text-on-surface-variant">${esc(e.id)} · ${esc(e.org || '-')}</div>
        <h3 class="font-headline-md text-headline-md mb-1">${esc(e.name)}</h3>
        <div class="apr-facts"><span>${icon('event', 'text-[16px]')}${Evt.fmtDT(e.start)} sampai ${Evt.fmtDT(end)}</span><span>${icon('place', 'text-[16px]')}${esc((e.venue || '').split('·')[0].trim())}</span><span>${icon('confirmation_number', 'text-[16px]')}Kapasitas tiket ${num(cap)}</span></div>
        ${A.areaLine(e)}${A.turnBar(e)}${A.steps(e)}${box}${why}
      </section>
      <section class="card p-5">${UI.h('Dokumen persyaratan', 'Diunggah penyelenggara. Divisi memeriksa dokumen sesuai bagiannya', '', 'folder_open')}${A.docs(e, { editable: false })}</section>
      <section class="card p-5">${UI.h('Log aktivitas acara', 'Siapa melakukan apa dan kapan', A.integrity(e), 'history')}${A.log(e)}</section>`;
  }

  function redraw() {
    const view = document.getElementById('view'); if (!view || !active()) return;
    const n = view.querySelector('#ap-note'); if (n && (n.value || document.activeElement === n)) return; // jangan hapus catatan yang sedang diketik
    const y = window.scrollY; view.innerHTML = window.Views.persetujuan.render(Shell.current.params); window.Views.persetujuan.mount(view, Shell.current.params); window.scrollTo(0, y);
  }
  let subscribed = false;

  window.Views.persetujuan = {
    title: 'Persetujuan Acara',
    render(params) {
      if (!Evt.s) return `<section class="card p-8 flex items-center gap-3">${icon('progress_activity', 'animate-spin text-primary')} Memuat data acara…</section>`;
      const G = groups(), flat = G.flatMap((g) => g[1]), sel = (params.ev && Evt.ev(params.ev) && Evt.ev(params.ev).approval ? Evt.ev(params.ev) : flat[0]) || null;
      return `
      <section class="card pagebar">
        <div class="pagebar-title"><span class="crumb">Operasional / Summarecon Mall Bandung</span><h2>Persetujuan Acara</h2><p>Pengajuan acara dari tenant dan penyelenggara. Divisi Event memeriksa konsep, jadwal, dan area, lalu Operasional Mall memeriksa teknis, keamanan, dan parkir.</p></div>
        <div class="pagebar-actions">${UI.dbLink('EVT', '', 'Pemantauan Event')}${UI.dbLink('PARK', '', 'Parkir & Mobilitas')}</div>
      </section>
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <section class="card p-4 xl:col-span-4 apr-list">${G.map(([h, list]) => `<div class="apr-g"><div class="lbl mb-2">${esc(h)} <span>${list.length}</span></div>${list.length ? list.map((e) => row(e, sel && sel.id)).join('') : '<p class="font-body-sm text-body-sm text-on-surface-variant mb-2">Tidak ada.</p>'}</div>`).join('')}</section>
        <div class="xl:col-span-8 flex flex-col gap-5">${sel ? detail(sel) : `<section class="card p-8">${UI.h('Belum ada pengajuan', 'Pengajuan dari konsol pengelola akan muncul di sini.', '', 'inbox')}</section>`}</div>
      </div>`;
    },
    mount(root, params) {
      if (!subscribed && window.Evt) { subscribed = true; Evt.init().then(() => { let t = null; Evt.subscribe(() => { clearTimeout(t); t = setTimeout(() => { if (window.Shell) Shell.rerender(); redraw(); }, 120); }); if (active()) redraw(); if (window.Shell) Shell.rerender(); }); }
      if (!Evt.s) return;
      const G = groups(), flat = G.flatMap((g) => g[1]), id = params.ev && Evt.ev(params.ev) ? params.ev : flat[0] && flat[0].id; if (!id) return;
      const run = async (fn, ok) => {
        try { Evt.setActor({ name: cc.name, role: cc.label, div: cc.div }); const r = await fn(); if (ok) UI.toast(ok, 'P4'); const n = root.querySelector('#ap-note'); if (n) n.value = ''; redraw(); Shell.rerender(); return r === undefined ? true : r; }
        catch (e) { UI.toast(esc(e.message), 'P2'); return null; }
      };
      if (cc.div) EvtApproval.bindDecide(root, id, cc.div, run);
      EvtApproval.bindCsv(root);
    },
  };
})();
