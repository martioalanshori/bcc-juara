/* UI helpers: badge, kartu, chart SVG, scene kamera, modal, toast, panel relasi. */
(function () {
  const REF = window.SMICC_REF;
  const DBMAP = {};
  REF.dashboards.forEach((d) => (DBMAP[d.code] = d));
  const ICON = { TIC: 'confirmation_number', BMS: 'hvac', TEN: 'storefront', CCTV: 'videocam', ENE: 'bolt', ANL: 'analytics', PARK: 'local_parking', O360: 'apartment', EVT: 'local_activity' };
  const PRIO = {
    P1: { label: 'Kritis', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40', dot: 'bg-rose-500', hex: '#f43f5e' },
    P2: { label: 'Tinggi', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/40', dot: 'bg-orange-400', hex: '#fb923c' },
    P3: { label: 'Sedang', cls: 'bg-amber-400/15 text-amber-300 border-amber-400/40', dot: 'bg-amber-400', hex: '#f59e0b' },
    P4: { label: 'Rendah', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400', hex: '#10b981' },
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const time = (ts) => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); };
  const hm = (ts) => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const ago = (ts) => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? 'baru saja' : m < 60 ? m + 'm lalu' : Math.floor(m / 60) + 'j ' + (m % 60) + 'm lalu'; };
  const dur = (ms) => { const neg = ms < 0; ms = Math.abs(ms); const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000); return (neg ? '-' : '') + (h ? h + 'j ' : '') + m + 'm ' + pad(s) + 's'; };
  const num = (n, d) => Number(n).toLocaleString('id-ID', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d || 0 });
  const icon = (n, cls) => `<span class="material-symbols-outlined ${cls || 'text-[18px]'}">${n}</span>`;

  const UI = {
    esc, time, hm, ago, dur, num, icon, PRIO, DBMAP, ICON,
    prio(p, small) {
      const x = PRIO[p] || PRIO.P4;
      return `<span class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-label-sm text-label-sm ${x.cls} ${small ? '' : 'whitespace-nowrap'}">${x.label} ${p}</span>`;
    },
    status(st) {
      const map = { OPEN: 'text-sky-300 bg-sky-500/10 border-sky-500/30', ACKNOWLEDGED: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30', DISPATCHED: 'text-amber-300 bg-amber-500/10 border-amber-500/30', 'ON-SITE': 'text-orange-300 bg-orange-500/10 border-orange-500/30', RESOLVED: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', CLOSED: 'text-slate-300 bg-slate-500/10 border-slate-500/30' };
      return `<span class="inline-flex items-center rounded-full border px-2 py-0.5 font-label-sm text-label-sm ${map[st] || ''}">${esc(Store.STATUS_LABEL[st] || st)}</span>`;
    },
    devStatus(st) {
      const ok = ['RUNNING', 'NORMAL', 'AVAILABLE', 'CHARGING', 'OPEN', 'BOOST'];
      const warn = ['WARN', 'STANDBY'];
      const c = ok.includes(st) ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : warn.includes(st) ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' : 'text-rose-300 bg-rose-500/15 border-rose-500/40';
      const lbl = { RUNNING: 'Berjalan', NORMAL: 'Normal', STANDBY: 'Standby', WARN: 'Perlu perhatian', TRIP: 'TRIP (stop darurat)', FAULT: 'Gangguan', LEAK: 'Bocor', OFF: 'Mati (interlock)', OPEN: 'Terbuka', BOOST: 'Boost +25%', AVAILABLE: 'Tersedia', CHARGING: 'Mengisi daya' }[st] || st;
      return `<span class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-label-sm text-label-sm ${c}"><span class="w-1.5 h-1.5 rounded-md ${ok.includes(st) ? 'bg-emerald-400' : warn.includes(st) ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'}"></span>${lbl}</span>`;
    },
    chip(text, cls) { return `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-sm text-label-sm ${cls || 'bg-surface-container-high text-on-surface-variant'}">${text}</span>`; },
    card(inner, cls) { return `<section class="card ${cls || ''}">${inner}</section>`; },
    h(title, sub, right, ic) {
      return `<div class="flex items-start justify-between gap-3 mb-4"><div class="flex items-start gap-3">${ic ? `<div class="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">${icon(ic, 'text-[20px]')}</div>` : ''}<div><h3 class="font-headline-sm text-headline-sm text-on-surface">${title}</h3>${sub ? `<p class="font-body-sm text-body-sm text-on-surface-variant">${sub}</p>` : ''}</div></div>${right || ''}</div>`;
    },
    kpi(o) {
      return `<div class="card p-4 flex flex-col gap-2 ${o.cls || ''}">
        <div class="flex items-start justify-between"><span class="font-label-sm text-label-sm text-on-surface-variant">${o.label}</span>${o.icon ? `<span class="text-primary">${icon(o.icon, 'text-[20px]')}</span>` : ''}</div>
        <div class="flex items-end gap-2"><span class="font-display-lg ${String(o.value).length > 7 ? 'text-[26px] leading-[34px] font-bold' : 'text-display-lg'} whitespace-nowrap ${o.vcls || 'text-on-surface'}">${o.value}</span>${o.unit ? `<span class="font-label-md text-label-md text-on-surface-variant pb-2">${o.unit}</span>` : ''}${o.delta ? `<span class="ml-auto font-label-sm text-label-sm px-2 py-0.5 rounded ${o.dcls || 'bg-secondary/15 text-secondary'}">${o.delta}</span>` : ''}</div>
        ${o.bar != null ? `<div class="h-1.5 rounded-full bg-surface-container-highest overflow-hidden"><div class="h-full rounded-md ${o.barcls || 'bg-secondary'}" style="width:${Math.max(2, Math.min(100, o.bar))}%"></div></div>` : ''}
        ${o.foot ? `<div class="font-label-sm text-label-sm text-on-surface-variant">${o.foot}</div>` : ''}</div>`;
    },
    bar(pct, cls) { return `<div class="h-1.5 rounded-full bg-surface-container-highest overflow-hidden"><div class="h-full rounded-md ${cls || 'bg-primary-container'}" style="width:${Math.max(1, Math.min(100, pct))}%"></div></div>`; },
    link(route, label, cls) { return `<a href="/command-center/${route}" class="${cls || 'text-primary hover:underline'}">${label}</a>`; },
    dbLink(code, params, label) {
      const d = DBMAP[code];
      return `<a href="/command-center/${d.route}${params ? '?' + params : ''}" class="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2 py-1 font-label-md text-label-md text-on-surface">${icon(ICON[code], 'text-[16px] text-primary')}${label || d.name}</a>`;
    },

    // ------------------------------------------------ charts (SVG)
    line(series, o) {
      o = Object.assign({ w: 640, h: 220, pad: 32, min: null, max: null, labels: [], band: null, refLine: null, area: true, unit: '' }, o || {});
      const all = series.flatMap((s) => s.data);
      const min = o.min != null ? o.min : Math.min(...all) * 0.95;
      const max = o.max != null ? o.max : Math.max(...all) * 1.05;
      const n = series[0].data.length;
      const X = (i) => o.pad + (i * (o.w - o.pad * 1.5)) / (n - 1);
      const Y = (v) => o.h - o.pad + 4 - ((v - min) / (max - min || 1)) * (o.h - o.pad * 1.6);
      let g = '';
      for (let k = 0; k <= 4; k++) {
        const v = min + ((max - min) * k) / 4;
        g += `<line x1="${o.pad}" x2="${o.w - o.pad / 2}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:rgb(var(--on-surface) / .08)"/><text x="${o.pad - 6}" y="${Y(v) + 3}" text-anchor="end" class="ctext">${num(v, max - min < 10 ? 1 : 0)}</text>`;
      }
      if (o.band) g += `<rect x="${X(o.band[0])}" y="${o.pad / 2}" width="${X(o.band[1]) - X(o.band[0])}" height="${o.h - o.pad * 1.2}" fill="rgba(244,63,94,.12)" stroke="rgba(244,63,94,.35)" stroke-dasharray="3 3"/><text x="${(X(o.band[0]) + X(o.band[1])) / 2}" y="${o.pad / 2 + 10}" text-anchor="middle" class="ctext" fill="#fb7185">${o.bandLabel || ''}</text>`;
      if (o.refLine != null) g += `<line x1="${o.pad}" x2="${o.w - o.pad / 2}" y1="${Y(o.refLine)}" y2="${Y(o.refLine)}" stroke="#fb7185" stroke-dasharray="5 4"/><text x="${o.w - o.pad / 2}" y="${Y(o.refLine) - 4}" text-anchor="end" class="ctext" fill="#fb7185">${o.refLabel || ''}</text>`;
      o.labels.forEach((l, i) => { if (l) g += `<text x="${X(i)}" y="${o.h - 6}" text-anchor="middle" class="ctext">${l}</text>`; });
      series.forEach((s, si) => {
        const pts = s.data.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
        if (o.area && si === 0) g += `<defs><linearGradient id="ga${si}${o.w}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".35"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs><polygon points="${X(0)},${Y(min)} ${pts} ${X(n - 1)},${Y(min)}" fill="url(#ga${si}${o.w})"/>`;
        g += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
        if (s.dot != null) g += `<circle cx="${X(s.dot)}" cy="${Y(s.data[s.dot])}" r="5" fill="${s.color}" style="stroke:rgb(var(--surface-container))" stroke-width="2"/>`;
      });
      return `<svg viewBox="0 0 ${o.w} ${o.h}" class="w-full h-auto">${g}</svg>`;
    },
    donut(segs, o) {
      o = Object.assign({ size: 150, stroke: 18, center: '', sub: '' }, o || {});
      const r = (o.size - o.stroke) / 2, c = 2 * Math.PI * r, tot = segs.reduce((a, s) => a + s.v, 0) || 1;
      let off = 0, g = '';
      segs.forEach((s) => { const l = (s.v / tot) * c; g += `<circle r="${r}" cx="${o.size / 2}" cy="${o.size / 2}" fill="none" style="stroke:${s.color}" stroke-width="${o.stroke}" stroke-dasharray="${l} ${c - l}" stroke-dashoffset="${-off}" transform="rotate(-90 ${o.size / 2} ${o.size / 2})"/>`; off += l; });
      return `<svg viewBox="0 0 ${o.size} ${o.size}" width="${o.size}" height="${o.size}"><circle r="${r}" cx="${o.size / 2}" cy="${o.size / 2}" fill="none" style="stroke:rgb(var(--on-surface) / .08)" stroke-width="${o.stroke}"/>${g}<text x="50%" y="48%" text-anchor="middle" class="font-display" font-size="${o.size / 6}" style="fill:rgb(var(--on-surface))" font-weight="700">${o.center}</text><text x="50%" y="62%" text-anchor="middle" class="ctext">${o.sub}</text></svg>`;
    },
    ring(pct, o) { o = o || {}; return UI.donut([{ v: pct, color: o.color || '#4edea3' }, { v: 100 - pct, color: 'rgb(var(--on-surface) / .06)' }], { size: o.size || 120, stroke: o.stroke || 12, center: o.center || Math.round(pct) + '%', sub: o.sub || '' }); },
    spark(data, color, w, h) {
      w = w || 160; h = h || 36;
      const min = Math.min(...data), max = Math.max(...data);
      const pts = data.map((v, i) => `${(i * w) / (data.length - 1)},${h - 3 - ((v - min) / (max - min || 1)) * (h - 6)}`).join(' ');
      return `<svg viewBox="0 0 ${w} ${h}" class="w-full" style="height:${h}px"><polyline points="${pts}" fill="none" stroke="${color || '#38bdf8'}" stroke-width="2"/></svg>`;
    },

    // ------------------------------------------------ camera scene placeholder (SVG ilustratif)
    cam(c, o) {
      o = o || {};
      const seed = [...c.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
      const rnd = (i) => { const x = Math.sin(seed * 9.13 + i * 3.7) * 10000; return x - Math.floor(x); };
      const th = c.thermal;
      const bg = th ? ['#1a0b2e', '#3b0d3f'] : c.kind === 'parking' || c.kind === 'dock' || c.kind === 'gate' ? ['#0b1220', '#1b2638'] : c.kind === 'server' ? ['#06121a', '#0e2733'] : ['#151c2e', '#2b3550'];
      let g = `<defs><linearGradient id="cb${c.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[1]}"/><stop offset="1" stop-color="${bg[0]}"/></linearGradient><radialGradient id="cl${c.id}" cx=".5" cy=".1" r=".8"><stop offset="0" stop-color="${th ? '#ff6b3d' : '#fff7e0'}" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>`;
      g += `<rect width="320" height="180" fill="url(#cb${c.id})"/><rect width="320" height="180" fill="url(#cl${c.id})"/>`;
      // perspective floor
      for (let i = 0; i <= 10; i++) g += `<line x1="${160}" y1="70" x2="${-80 + i * 48}" y2="180" stroke="rgba(255,255,255,.07)"/>`;
      for (let i = 0; i < 6; i++) { const y = 74 + i * i * 3.3; g += `<line x1="0" y1="${y}" x2="320" y2="${y}" stroke="rgba(255,255,255,.05)"/>`; }
      // architecture
      if (c.kind === 'atrium' || c.kind === 'corridor' || c.kind === 'lobby') {
        g += `<rect x="20" y="20" width="80" height="50" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.12)"/><rect x="220" y="20" width="80" height="50" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.12)"/><rect x="128" y="34" width="64" height="36" fill="rgba(56,189,248,.08)" stroke="rgba(56,189,248,.25)"/>`;
        g += `<line x1="0" y1="18" x2="320" y2="18" stroke="rgba(255,255,255,.15)"/>`;
      }
      if (c.kind === 'escalator') g += `<polygon points="120,180 170,60 200,60 170,180" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.2)"/><rect x="150" y="120" width="40" height="8" fill="#f59e0b" opacity=".8"/><text x="170" y="117" text-anchor="middle" font-size="7" fill="#fbbf24">CAUTION</text>`;
      if (c.kind === 'parking' || c.kind === 'gate') { for (let i = 0; i < 5; i++) g += `<rect x="${20 + i * 60}" y="${110 + (i % 2) * 8}" width="44" height="22" rx="5" fill="rgba(148,163,184,${0.18 + rnd(i) * 0.2})"/>`; g += `<line x1="0" y1="100" x2="320" y2="100" stroke="#fbbf24" stroke-dasharray="8 6" opacity=".4"/>`; }
      if (c.kind === 'gate') g += `<rect x="150" y="70" width="6" height="60" fill="#94a3b8"/><rect x="156" y="72" width="90" height="5" fill="#f43f5e"/>`;
      if (c.kind === 'dock') g += `<rect x="40" y="40" width="110" height="80" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.15)"/><rect x="180" y="70" width="100" height="55" fill="rgba(148,163,184,.25)"/>`;
      if (c.kind === 'server') for (let i = 0; i < 6; i++) g += `<rect x="${30 + i * 45}" y="40" width="34" height="100" fill="rgba(15,40,55,.9)" stroke="rgba(56,189,248,.3)"/>${[0, 1, 2, 3, 4].map((k) => `<circle cx="${38 + i * 45}" cy="${50 + k * 18}" r="1.6" fill="${rnd(i + k) > 0.3 ? '#4edea3' : '#f43f5e'}"/>`).join('')}`;
      if (c.kind === 'foodcourt') for (let i = 0; i < 8; i++) g += `<rect x="${20 + (i % 4) * 75}" y="${95 + Math.floor(i / 4) * 35}" width="50" height="16" rx="3" fill="rgba(255,255,255,.08)"/>`;
      // people
      const n = c.kind === 'server' ? 0 : c.kind === 'parking' || c.kind === 'dock' || c.kind === 'gate' ? 3 : c.kind === 'atrium' ? 22 : 12;
      for (let i = 0; i < n; i++) {
        const y = 85 + rnd(i) * 85, s = 0.5 + (y - 80) / 90, x = 10 + rnd(i + 50) * 300;
        const col = th ? `hsl(${20 + rnd(i) * 40},100%,${50 + rnd(i + 1) * 15}%)` : `rgba(${150 + rnd(i) * 80},${150 + rnd(i + 2) * 60},${170 + rnd(i + 3) * 60},.75)`;
        g += `<g class="ppl" style="animation-delay:-${(rnd(i + 9) * 6).toFixed(2)}s"><circle cx="${x}" cy="${y - 13 * s}" r="${3.2 * s}" fill="${col}"/><rect x="${x - 3.5 * s}" y="${y - 10 * s}" width="${7 * s}" height="${12 * s}" rx="${2 * s}" fill="${col}"/></g>`;
      }
      if (th) g += `<circle cx="210" cy="120" r="26" fill="url(#fire${c.id})"/><defs><radialGradient id="fire${c.id}"><stop offset="0" stop-color="#fff59d"/><stop offset=".4" stop-color="#ff7043" stop-opacity=".8"/><stop offset="1" stop-color="#ff7043" stop-opacity="0"/></radialGradient></defs>`;
      if (o.box) g += `<rect x="${o.box[0]}" y="${o.box[1]}" width="${o.box[2]}" height="${o.box[3]}" fill="none" stroke="#f43f5e" stroke-width="1.5"/><rect x="${o.box[0]}" y="${o.box[1] - 9}" width="${Math.max(60, o.box[2])}" height="9" fill="#f43f5e"/><text x="${o.box[0] + 2}" y="${o.box[1] - 2}" font-size="7" fill="#fff" font-family="JetBrains Mono">${esc(o.boxLabel || 'TARGET')}</text>`;
      return `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" class="w-full h-full block">${g}</svg>`;
    },

    // ------------------------------------------------ modal & toast
    modal(title, body, opts) {
      opts = opts || {};
      const root = document.getElementById('modal-root');
      root.innerHTML = `<div class="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto scrim p-6" data-close>
        <div class="card-elev w-full ${opts.wide ? 'max-w-4xl' : 'max-w-2xl'} mt-10" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-4 border-b border-white/10"><h3 class="font-headline-md text-headline-md">${title}</h3><button class="btn-ghost !px-2" data-close>${icon('close')}</button></div>
          <div class="p-6">${body}</div></div></div>`;
      root.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', (e) => { if (e.target === el || el.tagName === 'BUTTON') UI.closeModal(); }));
      return root;
    },
    closeModal() { document.getElementById('modal-root').innerHTML = ''; },
    toast(text, sev, sub) {
      const root = document.getElementById('toast-root');
      const el = document.createElement('div');
      const col = (PRIO[sev] || {}).hex || '#38bdf8';
      el.className = 'toast card-elev px-4 py-3 flex gap-3 items-start w-[380px]';
      el.style.borderLeft = '3px solid ' + col;
      el.innerHTML = `<span class="w-2 h-2 rounded-full mt-1.5 shrink-0" style="background:${col}"></span><div class="min-w-0"><div class="font-body-md text-body-md text-on-surface">${text}</div>${sub ? `<div class="font-label-md text-label-md text-on-surface-variant mt-0.5">${sub}</div>` : ''}</div>`;
      root.appendChild(el);
      setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; }, 4200);
      setTimeout(() => el.remove(), 4700);
    },

    // ------------------------------------------------ panel relasi antar dashboard (dipakai semua view)
    relasi(code) {
      const out = REF.relations.filter((r) => r.frm === code);
      const inn = REF.relations.filter((r) => r.to === code);
      const ev = Store.eventsFor(code, 8);
      const ucs = REF.usecases.filter((u) => u.primary === code || u.related.split(/,\s*/).includes(code));
      return `<section class="card p-5" id="relasi-panel">
        ${UI.h('Relasi dashboard & event lintas modul', 'Aliran data masuk dan keluar ' + esc(DBMAP[code].name) + ' (sumber: UseCase_Relasi_Dashboard.xlsx)', `<a href="/command-center/usecase" class="btn-ghost">${icon('account_tree', 'text-[16px]')} Simulator Use Case</a>`, 'hub')}
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div><div class="lbl mb-2">Masuk dari</div><div class="flex flex-col gap-2">${inn.map((r) => `<a href="/command-center/${DBMAP[r.frm].route}" class="rel-row">${icon(ICON[r.frm], 'text-[16px] text-primary')}<div><div class="font-label-lg text-label-lg text-on-surface">${r.frm} → ${code}</div><div class="font-body-sm text-body-sm text-on-surface-variant">${esc(r.data)}</div></div></a>`).join('')}</div></div>
          <div><div class="lbl mb-2">Keluar ke</div><div class="flex flex-col gap-2">${out.map((r) => `<a href="/command-center/${DBMAP[r.to].route}" class="rel-row">${icon(ICON[r.to], 'text-[16px] text-secondary')}<div><div class="font-label-lg text-label-lg text-on-surface">${code} → ${r.to}</div><div class="font-body-sm text-body-sm text-on-surface-variant">${esc(r.data)}</div></div></a>`).join('')}</div></div>
          <div><div class="lbl mb-2">Event terbaru</div><div class="flex flex-col gap-2">${ev.length ? ev.map((e) => `<div class="rel-row !cursor-default"><span class="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style="background:${(PRIO[e.sev] || {}).hex || '#38bdf8'}"></span><div class="min-w-0"><div class="font-label-md text-label-md text-on-surface-variant">${time(e.ts)} · ${e.from}→${e.to} · ${e.code}${e.ucId ? ' · ' + e.ucId : ''}</div><div class="font-body-sm text-body-sm text-on-surface truncate">${esc(e.title)}</div></div></div>`).join('') : `<div class="font-body-sm text-body-sm text-on-surface-variant">Belum ada event. Jalankan skenario di Simulator Use Case untuk melihat aliran antar dashboard.</div>`}</div>
            <div class="lbl mt-4 mb-2">Use case terkait</div><div class="flex flex-wrap gap-1.5">${ucs.map((u) => `<a href="/command-center/usecase?uc=${u.id}" class="chip-btn" title="${esc(u.name)}">${u.id}</a>`).join('')}</div></div>
        </div></section>`;
    },
  };
  window.UI = UI;
})();

// Esc menutup modal yang sedang terbuka (Command Center dan konsol pengelola)
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('modal-root')?.innerHTML) UI.closeModal(); });
