/* Mesin simulasi use case: menjalankan langkah UC, menerapkan efek ke Store, panel tracker melayang. */
(function () {
  const REF = window.SMICC_REF;
  const { esc, icon } = UI;
  let timer = null;

  function routeFor(code, sim, uc) {
    const d = UI.DBMAP[code];
    const t = uc.ticket;
    const q = code === 'TIC' && sim.ticketId ? 'id=' + sim.ticketId : code === 'CCTV' && t.cam ? 'cam=' + t.cam : code === 'TEN' && t.tenant ? 'tenant=' + (window.SEED.TENANTS.find((x) => x.name === t.tenant) || {}).id : '';
    return '#/' + d.route + (q && !q.endsWith('undefined') ? '?' + q : '');
  }

  function apply(uc, step, sim) {
    const fx = step.fx || '';
    const sev = uc.priority.startsWith('P') ? uc.priority : uc.ticket.priority;
    const [kind, ...rest] = fx.split(':');
    const arg = rest.join(':');
    if (kind === 'ticket') {
      const t = uc.ticket;
      const ten = t.tenant ? window.SEED.TENANTS.find((x) => x.name === t.tenant) : null;
      const tk = Store.createTicket({ title: t.title, desc: step.action, priority: t.priority, category: t.category, zone: t.zone === 'ALL' ? 'BASEMENT' : t.zone, location: t.location, source: t.source + ' [' + uc.id + ']', sop: t.sop, cam: t.cam, tenant: ten ? ten.id : '', team: t.team, ucId: uc.id, fromDb: step.frm, by: step.actor }, false);
      sim.ticketId = tk.id;
      if (t.cam) Store.camAlert(t.cam, t.title, t.priority, tk.id);
    } else if (kind === 'status' && sim.ticketId) {
      const tk = Store.ticket(sim.ticketId);
      const target = Store.STATUSES.indexOf(arg);
      if (tk && tk.checks.length) tk.checks = tk.checks.map((c, i) => c || i < Math.ceil(((target + 1) / Store.STATUSES.length) * tk.checks.length));
      Store.updateTicket(sim.ticketId, { status: arg }, '[' + uc.id + '] ' + step.action, step.actor);
      if (arg === 'RESOLVED' && uc.ticket.cam) Store.clearCam(uc.ticket.cam);
    } else if (kind === 'device') {
      const [id, st] = arg.split(':');
      Store.setDevice(id, st);
    } else if (kind === 'cam') {
      Store.camAlert(arg, step.action.slice(0, 70), sev, sim.ticketId);
    } else if (kind === 'escalate' && sim.ticketId) {
      Store.escalate(sim.ticketId, arg + ' [' + uc.id + ']');
    } else if (kind === 'tenant') {
      Store.broadcast(arg, uc.ticket.zone === 'ALL' ? '' : uc.ticket.zone, uc.id);
    } else if (kind === 'kpi') {
      Store.kpiNote(arg, uc.id);
    }
    if (kind !== 'status' && sim.ticketId && kind !== 'ticket') {
      const tk = Store.ticket(sim.ticketId);
      tk && tk.log.push({ ts: Date.now(), who: step.actor, text: '[' + uc.id + ' #' + (sim.idx + 1) + '] ' + step.frm + '→' + step.to + ': ' + step.action });
    }
    Store.addEvent({ from: step.frm, to: step.to, code: step.event, title: step.action, detail: step.data, sev, ucId: uc.id, ticketId: sim.ticketId });
  }

  function next() {
    const sim = Store.s.sim;
    if (!sim || !sim.running) return;
    const uc = REF.usecases.find((u) => u.id === sim.ucId);
    const step = uc.steps[sim.idx];
    if (!step) { sim.running = false; sim.doneAt = Date.now(); Store.setSim(sim); UI.toast(uc.id + ' selesai — ' + uc.steps.length + ' langkah lintas dashboard', 'P4', 'Cek KPI di Analytics & tiket ' + (sim.ticketId || '')); return; }
    apply(uc, step, sim);
    UI.toast(`<b>${uc.id} #${sim.idx + 1}</b> ${step.frm}${step.frm !== step.to ? ' → ' + step.to : ''}: ${esc(step.action)}`, uc.priority.startsWith('P') ? uc.priority : 'P3', step.event + ' · ' + step.actor + ' · ' + step.t);
    if (Store.s.settings.follow) { const r = routeFor(step.to, sim, uc); if (location.hash !== r) location.hash = r; }
    sim.idx += 1;
    Store.setSim(sim);
    render();
    timer = setTimeout(next, 3200 / (Store.s.settings.speed || 1));
  }

  function render() {
    const root = document.getElementById('sim-root');
    const sim = Store.s.sim;
    if (!sim) { root.innerHTML = ''; return; }
    const uc = REF.usecases.find((u) => u.id === sim.ucId);
    const pct = (sim.idx / uc.steps.length) * 100;
    root.innerHTML = `<div class="fixed bottom-6 left-[19.5rem] z-[70] w-[400px] card-elev">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-white/10">${icon('account_tree', 'text-primary text-[20px]')}<div class="flex-1 min-w-0"><div class="font-label-sm text-label-sm text-outline">SIMULASI ${sim.running ? 'BERJALAN' : 'SELESAI'} · ${sim.idx}/${uc.steps.length}</div><div class="font-headline-sm text-headline-sm truncate">${uc.id} ${esc(uc.name)}</div></div>
        ${sim.running ? `<button class="btn-ghost !px-2" id="sim-stop" title="Hentikan">${icon('stop')}</button>` : `<button class="btn-ghost !px-2" id="sim-close" title="Tutup">${icon('close')}</button>`}<button class="btn-ghost !px-2" id="sim-min">${icon(sim.min ? 'expand_less' : 'expand_more')}</button></div>
      <div class="px-4 pt-3">${UI.bar(pct, sim.running ? 'bg-primary-container' : 'bg-secondary')}</div>
      ${sim.min ? '<div class="h-3"></div>' : `<div class="p-3 flex flex-col gap-1 max-h-[300px] overflow-y-auto">${uc.steps.map((s, i) => `<a href="${routeFor(s.to, sim, uc)}" class="flex items-start gap-2 rounded-lg px-2 py-1.5 ${i === sim.idx - 1 ? 'bg-sky-500/10' : ''} hover:bg-white/5">
        <span class="mt-0.5">${i < sim.idx ? icon('check_circle', 'text-[16px] text-secondary') : icon('radio_button_unchecked', 'text-[16px] text-outline')}</span>
        <div class="min-w-0"><div class="font-label-sm text-label-sm ${i < sim.idx ? 'text-primary' : 'text-outline'}">${s.frm}${s.frm !== s.to ? ' → ' + s.to : ''} · ${s.event}</div><div class="font-body-sm text-body-sm ${i < sim.idx ? 'text-on-surface' : 'text-on-surface-variant'} truncate">${esc(s.action)}</div></div></a>`).join('')}</div>
        <div class="flex gap-2 px-3 pb-3">${sim.ticketId ? `<a class="btn-ghost flex-1 justify-center" href="#/ticketing?id=${sim.ticketId}">${icon('confirmation_number', 'text-[16px]')} ${sim.ticketId}</a>` : ''}<a class="btn-ghost flex-1 justify-center" href="#/usecase?uc=${uc.id}">${icon('account_tree', 'text-[16px]')} Detail UC</a></div>`}</div>`;
    const b = (id, fn) => { const el = document.getElementById(id); el && el.addEventListener('click', fn); };
    b('sim-stop', () => Sim.stop());
    b('sim-close', () => { Store.setSim(null); render(); });
    b('sim-min', () => { sim.min = !sim.min; render(); });
  }

  window.Sim = {
    run(ucId) {
      clearTimeout(timer);
      Store.setSim({ ucId, idx: 0, running: true, ticketId: null, startedAt: Date.now() });
      render();
      UI.toast('Simulasi ' + ucId + ' dimulai', 'P3', REF.usecases.find((u) => u.id === ucId).name);
      timer = setTimeout(next, 600);
    },
    stop() { clearTimeout(timer); const s = Store.s.sim; if (s) { s.running = false; Store.setSim(s); } render(); },
    render,
  };
  render();
})();
