/* State store + event bus SMICC-TS. Disimpan di localStorage agar relasi antar dashboard persisten. */
(function () {
  const KEY = 'smicc-ts-summarecon-v1';
  const REF = window.SMICC_REF;
  const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'DISPATCHED', 'ON-SITE', 'RESOLVED', 'CLOSED'];
  const STATUS_LABEL = { OPEN: 'Baru', ACKNOWLEDGED: 'Diakui', DISPATCHED: 'Tim Dikirim', 'ON-SITE': 'Di Lokasi', RESOLVED: 'Selesai', CLOSED: 'Ditutup', ESCALATED: 'Eskalasi' };
  const SLA = {};
  REF.sla.forEach((s) => (SLA[s.level] = s));
  const SOP = {};
  REF.sops.forEach((s) => (SOP[s.id] = s));

  let state = null;
  const subs = new Set();
  let saveT = null;

  function seed() {
    const S = window.SEED;
    const now = Date.now();
    const tickets = S.TICKETS.map((t) => {
      const created = now - t.ago * 60000;
      const tk = Object.assign({ tenant: '', cam: '', escalations: [], checks: [], log: [] }, t);
      tk.createdAt = created;
      delete tk.ago;
      if (t.resolvedAgo != null) { tk.resolvedAt = now - t.resolvedAgo * 60000; delete tk.resolvedAgo; }
      tk.log = [{ ts: created, who: 'SYSTEM', text: 'Tiket dibuat dari ' + t.source }];
      const idx = STATUSES.indexOf(t.status);
      if (idx >= 1) tk.log.push({ ts: created + 40000, who: 'CCO', text: 'Tiket diakui operator, SOP ' + t.sop + ' dijalankan' });
      if (idx >= 2) tk.log.push({ ts: created + 90000, who: 'CCO', text: 'Dispatch ke ' + t.team });
      if (idx >= 3) tk.log.push({ ts: created + 240000, who: t.team, text: 'Tim tiba di lokasi (NFC check-in)' });
      if (idx >= 4) tk.log.push({ ts: tk.resolvedAt || now, who: t.team, text: 'Perbaikan selesai, foto sesudah diunggah' });
      const sop = SOP[t.sop];
      tk.checks = sop ? sop.steps.map((_, i) => i < Math.min(sop.steps.length, idx + 1)) : [];
      return tk;
    });
    return {
      v: 1,
      seq: 8930,
      tickets,
      devices: JSON.parse(JSON.stringify(S.DEVICES)),
      camAlerts: {
        'CAM-01': { label: 'Orang dalam pengawasan #WL-402 (FR 94.2%)', sev: 'P2', ts: now - 120000 },
        'CAM-33': { label: 'Objek tak bertuan > 12 menit', sev: 'P2', ts: now - 13 * 60000, ticketId: 'TCK-8899' },
        'CAM-29': { label: 'Eskalator E-04 TRIP (comb-plate)', sev: 'P3', ts: now - 14 * 60000, ticketId: 'TCK-8919' },
      },
      events: [],
      broadcasts: [],
      kpiNotes: [],
      chats: [
        { ts: now - 18 * 60000, from: 'Maya Kartika (Store Manager Zara GF)', ch: 'WhatsApp API', tenant: 'GF-104', text: 'Selamat sore Command Center, mohon konfirmasi teknisi listrik yang dijadwalkan cek panel kWh meter toko kami. Apakah tim MEP sudah menuju ruang panel AHU GF Barat?' },
        { ts: now - 16 * 60000, from: 'Command Center Auto-Bot #04', ch: 'Bot', tenant: 'GF-104', bot: true, text: 'Halo Ibu Maya, Tim MEP Bravo regu 2 personil telah tiba di zona VAV GF Barat. Sedang melakukan re-kalibrasi motorized valve. Estimasi normalisasi suhu 15 menit.' },
        { ts: now - 4 * 60000, from: 'Bambang S. (Duty Mgr Cinema XXI)', ch: 'Tenant App', tenant: 'L3-01', text: 'Formulir perpanjangan jam tayang malam minggu sudah kami submit via app, mohon persetujuan overtime AC & loading dock B2.' },
      ],
      sim: null,
      settings: { follow: true, speed: 1 },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { state = JSON.parse(raw); state.sim = null; return; }
    } catch (e) { /* ignore */ }
    state = seed();
    save(true);
  }
  function save(now) {
    clearTimeout(saveT);
    const f = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota */ } };
    if (now) f(); else saveT = setTimeout(f, 300);
  }
  function emit(kind) {
    save();
    subs.forEach((fn) => { try { fn(kind); } catch (e) { console.error(e); } });
  }

  const api = {
    STATUSES, STATUS_LABEL, SLA, SOP,
    get s() { return state; },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    reset() { state = seed(); emit('reset'); },
    ticket(id) { return state.tickets.find((t) => t.id === id); },
    activeTickets() { return state.tickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED'); },

    slaInfo(t) {
      const lvl = SLA[t.priority] || SLA.P4;
      const due = t.createdAt + lvl.resolve * 60000;
      const respDue = t.createdAt + lvl.respond * 60000;
      const end = t.resolvedAt || Date.now();
      const remain = due - end;
      const pct = Math.min(1, (end - t.createdAt) / (lvl.resolve * 60000));
      const responded = STATUSES.indexOf(t.status) >= 2;
      return { due, respDue, remain, pct, breached: remain < 0, atRisk: !t.resolvedAt && pct >= 0.8 && remain >= 0, responded, lvl };
    },

    createTicket(o, quiet) {
      state.seq += 1;
      const id = 'TCK-' + state.seq;
      const sop = SOP[o.sop];
      const t = Object.assign({
        id, title: '', desc: '', priority: 'P3', category: window.SEED.CATEGORIES[0], zone: 'GF', location: '', source: 'Manual (Operator)',
        sop: '', cam: '', tenant: '', team: '', status: 'OPEN', escalations: [], log: [],
      }, o);
      t.id = id;
      t.createdAt = Date.now();
      t.checks = sop ? sop.steps.map(() => false) : [];
      t.log = [{ ts: t.createdAt, who: o.by || 'CCO', text: 'Tiket dibuat - sumber: ' + t.source + (sop ? ' | SOP ' + sop.id : '') }];
      state.tickets.unshift(t);
      if (!quiet) api.addEvent({ from: o.fromDb || 'TIC', to: 'TIC', code: 'EVT-TICKET-CREATED', title: id + ' ' + t.title, detail: t.priority + ' · ' + t.location, sev: t.priority, ticketId: id, ucId: o.ucId });
      if (t.priority === 'P1') api.escalate(id, 'L1+L2 GM & Owner (otomatis P1)', true);
      emit('ticket');
      return t;
    },
    updateTicket(id, patch, logText, who) {
      const t = api.ticket(id);
      if (!t) return;
      Object.assign(t, patch);
      if (patch.status === 'RESOLVED' || patch.status === 'CLOSED') t.resolvedAt = t.resolvedAt || Date.now();
      if (logText) t.log.push({ ts: Date.now(), who: who || 'CCO', text: logText });
      if (patch.status) {
        api.addEvent({ from: 'TIC', to: t.tenant ? 'TEN' : 'ANL', code: 'EVT-TICKET-STATUS', title: id + ' → ' + STATUS_LABEL[patch.status], detail: t.title, sev: t.priority, ticketId: id, quiet: true });
      }
      emit('ticket');
    },
    advance(id, who) {
      const t = api.ticket(id);
      const i = STATUSES.indexOf(t.status);
      if (i < 0 || i >= STATUSES.length - 1) return;
      const next = STATUSES[i + 1];
      const msg = { ACKNOWLEDGED: 'Tiket diakui operator', DISPATCHED: 'Tim ' + (t.team || '-') + ' dikirim', 'ON-SITE': 'Tim tiba di lokasi', RESOLVED: 'Pekerjaan selesai, menunggu verifikasi', CLOSED: 'Diverifikasi & ditutup, survei CSAT dikirim' }[next];
      api.updateTicket(id, { status: next }, msg, who);
    },
    escalate(id, level, silentEmit) {
      const t = api.ticket(id);
      if (!t) return;
      t.escalations.push({ ts: Date.now(), level });
      t.log.push({ ts: Date.now(), who: 'SL', text: 'ESKALASI: ' + level });
      api.addEvent({ from: 'TIC', to: 'O360', code: 'EVT-ESCALATION', title: 'Eskalasi ' + id, detail: level + ' · ' + t.title, sev: t.priority, ticketId: id, quiet: true });
      if (!silentEmit) emit('ticket');
    },
    toggleCheck(id, i) {
      const t = api.ticket(id);
      t.checks[i] = !t.checks[i];
      const sop = SOP[t.sop];
      if (t.checks[i] && sop) t.log.push({ ts: Date.now(), who: sop.steps[i].role, text: 'Checklist SOP #' + (i + 1) + ': ' + sop.steps[i].action.slice(0, 80) });
      emit('ticket');
    },
    addLog(id, text) { const t = api.ticket(id); t.log.push({ ts: Date.now(), who: 'CCO', text }); emit('ticket'); },

    setDevice(id, status) {
      if (id === 'GATE-ALL') { Object.keys(state.devices).filter((k) => k.startsWith('GATE')).forEach((k) => (state.devices[k].status = status)); emit('device'); return; }
      const d = state.devices[id];
      if (!d) return;
      d.status = status;
      if (d.type === 'chiller') {
        if (status === 'RUNNING' && !d.load) Object.assign(d, { sup: 6.9, ret: 12.3, flow: 2050, vfd: '46.0 Hz (92%)', kwtr: 0.58, load: 70, kw: 410, cop: 6.1 });
        if (status === 'LEAK') Object.assign(d, { flow: 980, note: 'Tekanan loop turun 12%' });
      }
      if (d.type === 'gate') {
        if (status === 'FAULT') Object.assign(d, { queue: 11, wait: 22 });
        if (status === 'NORMAL') Object.assign(d, { queue: 2, wait: 12 });
        if (status === 'OPEN') Object.assign(d, { queue: 1, wait: 9 });
      }
      if (d.type === 'esc') d.vib = status === 'WARN' ? 2.6 : status === 'RUNNING' ? 0.9 : 0;
      emit('device');
    },
    camAlert(cam, label, sev, ticketId) { state.camAlerts[cam] = { label, sev: sev || 'P2', ts: Date.now(), ticketId }; emit('cam'); },
    clearCam(cam) { delete state.camAlerts[cam]; emit('cam'); },
    broadcast(text, zone, ucId) {
      state.broadcasts.unshift({ ts: Date.now(), text, zone: zone || 'ALL', ucId });
      state.chats.push({ ts: Date.now(), from: 'Command Center Broadcast', ch: 'Broadcast ' + (zone || 'Semua Zona'), bot: true, text });
      api.addEvent({ from: 'TIC', to: 'TEN', code: 'EVT-TENANT-BROADCAST', title: 'Broadcast tenant ' + (zone || 'semua zona'), detail: text, sev: 'P3', ucId, quiet: true });
      emit('tenant');
    },
    chat(msg) { state.chats.push(Object.assign({ ts: Date.now() }, msg)); emit('tenant'); },
    kpiNote(text, ucId) { state.kpiNotes.unshift({ ts: Date.now(), text, ucId }); emit('kpi'); },

    addEvent(e) {
      e.id = 'E' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      e.ts = Date.now();
      state.events.unshift(e);
      if (state.events.length > 300) state.events.length = 300;
      if (!e.quiet) emit('event');
    },
    eventsFor(code, n) { return state.events.filter((e) => e.to === code || e.from === code).slice(0, n || 8); },
    setSim(sim) { state.sim = sim; emit('sim'); },
    setting(k, v) { state.settings[k] = v; emit('settings'); },
  };

  load();
  window.Store = api;
})();
