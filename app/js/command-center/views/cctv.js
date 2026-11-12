/* DB-CCTV CCTV & Security Feeds */
(function () {
  window.Views = window.Views || {};
  const { esc, icon } = UI;
  const F = { zone: 'ALL', focus: 'CAM-01', grid: 4, speed: '1x' };
  const SOPCAM = { escalator: 'SOP-BMS-05', parking: 'SOP-PRK-02', gate: 'SOP-PRK-01', foodcourt: 'SOP-SEC-01', server: 'SOP-SEC-04', dock: 'SOP-SEC-04', lobby: 'SOP-PRK-03', atrium: 'SOP-VIS-01', corridor: 'SOP-SEC-03' };

  function tile(c, big) {
    const a = Store.s.camAlerts[c.id];
    const t = a && a.ticketId ? Store.ticket(a.ticketId) : null;
    return `<div class="cam-tile ${a ? 'alert' : ''} ${big ? 'aspect-[16/9]' : 'aspect-video'}" data-cam="${c.id}"><div class="scan"></div>${UI.cam(c, a ? { box: [120, 80, 70, 60], boxLabel: a.label.slice(0, 26) } : null)}
      <div class="cam-ov top flex items-start justify-between gap-2"><span><span class="${a ? 'text-rose-400' : 'text-secondary'}">●</span> ${big ? 'REC · ' : ''}${c.id} [${esc(c.name.toUpperCase())}]</span><span class="flex gap-1 shrink-0">${c.thermal ? '<span class="px-1 rounded bg-orange-500/80">Termografi</span>' : ''}${c.anpr ? '<span class="px-1 rounded bg-sky-600/80">ANPR</span>' : ''}${c.fr ? '<span class="px-1 rounded bg-sky-600/80">FR aktif</span>' : ''}${c.ptz ? '<span class="px-1 rounded bg-white/10">PTZ</span>' : ''}<span class="px-1 rounded bg-white/10">${c.res}</span></span></div>
      ${a ? `<div class="absolute right-2 top-9 z-[3] px-2 py-1 rounded bg-rose-600/90 font-label-sm text-label-sm text-white max-w-[70%]">Insiden ${a.sev}${t ? ' · ' + t.id : ''}</div>` : ''}
      <div class="cam-ov bot flex justify-between"><span>${a ? esc(a.label) : 'Zona ' + c.zone + ' · ' + c.fps + ' FPS'}</span><span data-clock></span></div></div>`;
  }

  window.Views.cctv = {
    title: 'CCTV & Keamanan', live: true,
    render(p) {
      if (p.cam) { F.focus = p.cam; }
      const C = window.SEED.CAMERAS;
      const cams = C.filter((c) => F.zone === 'ALL' || c.zone === F.zone);
      const focus = C.find((c) => c.id === F.focus) || cams[0];
      const others = cams.filter((c) => c.id !== focus.id).slice(0, F.grid === 1 ? 0 : F.grid === 4 ? 4 : 8);
      const alerts = Object.entries(Store.s.camAlerts).sort((a, b) => b[1].ts - a[1].ts);
      const zones = [['ALL', 'Semua zona (1.420)'], ['GF', 'Atrium Cibadag & Lobby (312)'], ['LG', 'LG & Retail (184)'], ['2F', 'Family & Kids (96)'], ['3F', 'Food Court & Hiburan (142)'], ['BASEMENT', 'Basement & Loading (420)']];
      const secTk = Store.activeTickets().filter((t) => t.category.startsWith('Keamanan'));
      return `
      <section class="card pagebar">
        <div class="pagebar-info">
          <span class="stat live"><span class="dot"></span>Jaringan pengawasan online</span>
          <span class="stat">Cluster NVR <b>v8.4.1 (active-sync)</b></span>
          <span class="stat">Latensi stream <b class="!text-secondary">18ms</b></span>
          <span class="stat">${icon('videocam', 'text-[16px]')} <b>1.420 / 1.428</b> kamera aktif (99.4%)</span>
        </div>
        <div class="pagebar-actions"><button class="btn-ghost" id="patrol">${icon('local_police', 'text-[16px]')} Patroli keamanan (14 personel)</button><button class="btn-danger" id="lock">${icon('lock', 'text-[16px]')} Lockdown otomatis</button></div>
      </section>
      <div class="flex flex-wrap items-center gap-2 mb-5">${zones.map(([k, l]) => `<button class="chip-btn ${F.zone === k ? 'on' : ''}" data-zone="${k}">${l}</button>`).join('')}
        <span class="ml-auto flex gap-1">${[[1, 'crop_square'], [4, 'grid_view'], [9, 'apps']].map(([n, ic]) => `<button class="chip-btn ${F.grid === n ? 'on' : ''}" data-grid="${n}">${icon(ic, 'text-[16px]')}</button>`).join('')}<button class="chip-btn" id="tour">${icon('autorenew', 'text-[14px]')} Tur otomatis (15 detik)</button></span></div>

      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
        <div class="2xl:col-span-8 flex flex-col gap-4">
          <div class="grid ${F.grid === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'} gap-4">
            <div class="${F.grid === 1 ? '' : 'lg:col-span-2 lg:row-span-2'}">${tile(focus, true)}
              <div class="flex flex-wrap items-center gap-2 mt-2 font-label-md text-label-md"><span class="text-on-surface-variant">Laju aliran pengunjung <b class="text-secondary">+142 orang/menit</b></span><span class="text-on-surface-variant">Sensor suhu ruang 22.4°C</span>
                <span class="ml-auto flex gap-1"><button class="btn-ghost !px-2" data-snap>${icon('photo_camera', 'text-[16px]')}</button><button class="btn-ghost !px-2" data-talk>${icon('mic', 'text-[16px]')}</button><button class="btn-danger !py-1.5" data-mk="${focus.id}">${icon('add_alert', 'text-[16px]')} Buat tiket dari kamera</button></span></div></div>
            ${others.slice(0, F.grid === 4 ? 2 : 2).map((c) => tile(c)).join('')}
          </div>
          ${F.grid !== 1 ? `<div class="grid grid-cols-2 lg:grid-cols-3 gap-4">${others.slice(2).map((c) => tile(c)).join('')}</div>` : ''}
          <section class="card p-4"><div class="flex flex-wrap items-center gap-3"><div class="flex gap-1">${['replay_10', 'fast_rewind', 'pause', 'fast_forward'].map((i) => `<button class="btn-ghost !px-2">${icon(i, 'text-[18px]')}</button>`).join('')}</div>
            <span class="lbl">Kecepatan</span>${['0.5x', '1x', '2x', '4x'].map((s) => `<button class="chip-btn ${F.speed === s ? 'on' : ''}" data-speed="${s}">${s}</button>`).join('')}
            <span class="chip-btn text-primary" data-clock></span><span class="font-label-md text-label-md text-on-surface-variant">Storage SAN: 184.2 TB / 240 TB (76.8%), retensi 45 hari</span>
            <button class="btn-ghost" data-bm>${icon('bookmark_add', 'text-[16px]')} Bookmark</button><button class="btn" data-exp>${icon('download')} Ekspor bukti (.mp4 dengan watermark)</button></div>
            <div class="relative mt-4 h-10 rounded-lg bg-surface-container-lowest overflow-hidden"><div class="absolute inset-y-3 left-0 right-0 bg-secondary/40 rounded"></div>
              ${alerts.map(([, a]) => { const d = new Date(a.ts); const x = ((d.getHours() * 60 + d.getMinutes()) / 1440) * 100; return `<div class="absolute top-0 bottom-0 w-0.5 bg-rose-500" style="left:${x}%"><span class="absolute -top-0.5 -left-1.5 w-3 h-3 rounded-full bg-rose-500"></span></div>`; }).join('')}
              <div class="absolute top-0 bottom-0 w-0.5 bg-sky-300" style="left:${((new Date().getHours() * 60 + new Date().getMinutes()) / 1440) * 100}%"></div></div>
            <div class="flex justify-between font-label-sm text-label-sm text-outline mt-1">${['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'].map((t) => `<span>${t}</span>`).join('')}</div></section>
        </div>

        <div class="2xl:col-span-4 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Alert keamanan', 'AI video analytics, FR, thermal, dan ANPR', UI.chip(alerts.length + ' aktif', alerts.length ? 'bg-rose-500/20 text-rose-300' : ''), 'shield')}
            <div class="flex flex-col gap-3">${alerts.map(([cid, a]) => { const c = C.find((x) => x.id === cid); return `<div class="inner p-3 ${a.sev === 'P1' || a.sev === 'P2' ? 'crit-left' : 'warn-left'}"><div class="flex justify-between items-start gap-2">${UI.prio(a.sev)}<button class="font-label-md text-label-md text-primary" data-focus="${cid}">${cid} · ${esc(c ? c.zone : '')}</button></div>
              <div class="font-body-md text-body-md mt-2">${esc(a.label)}</div><div class="font-label-sm text-label-sm text-outline mt-1">${UI.time(a.ts)} · ${esc(c ? c.name : '')}</div>
              <div class="flex gap-2 mt-2">${a.ticketId ? `<a class="btn-ghost !py-1" href="/command-center/ticketing?id=${a.ticketId}">${a.ticketId}</a>` : `<button class="btn-danger !py-1" data-intercept="${cid}">Kirim intersep</button>`}<button class="btn-ghost !py-1" data-verify="${cid}">${icon('task_alt', 'text-[14px]')} Verifikasi aman</button><button class="btn-ghost !py-1" data-focus="${cid}">${icon('zoom_in', 'text-[14px]')}</button></div></div>`; }).join('') || '<div class="text-on-surface-variant font-body-sm text-body-sm">Tidak ada alert aktif.</div>'}
              <div class="inner p-3"><div class="flex justify-between"><span class="font-label-sm text-label-sm text-primary">Info sensor · 14:08 WIB</span><span class="font-label-sm text-label-sm text-outline">Pintu E-12</span></div><div class="font-body-sm text-body-sm mt-1">Pintu evakuasi darurat sayap barat terbuka melewati batas waktu (3 menit).</div></div></div></section>
          <section class="card p-5">${UI.h('Kendali PTZ', focus.ptz ? focus.id + ' terkunci' : 'Kamera fokus bukan PTZ', '', 'control_camera')}
            <div class="flex items-center gap-6"><div class="relative w-36 h-36 rounded-full bg-surface-container-highest/60 border border-white/10">${[['keyboard_arrow_up', 'top-1 left-1/2 -translate-x-1/2'], ['keyboard_arrow_down', 'bottom-1 left-1/2 -translate-x-1/2'], ['chevron_left', 'left-1 top-1/2 -translate-y-1/2'], ['chevron_right', 'right-1 top-1/2 -translate-y-1/2']].map(([i, pos]) => `<button class="absolute ${pos} p-1 text-on-surface-variant hover:text-primary" data-ptz>${icon(i)}</button>`).join('')}<div class="absolute inset-10 rounded-full bg-surface-container flex items-center justify-center text-primary">${icon('control_camera')}</div></div>
              <div class="flex flex-col gap-2"><span class="lbl">Zoom</span><div class="flex gap-1"><button class="btn-ghost !px-3" data-ptz>+</button><button class="btn-ghost !px-3" data-ptz>−</button></div><span class="lbl">Iris</span><div class="flex gap-1"><button class="btn-ghost !px-2" data-ptz>+1</button><button class="btn-ghost !px-2" data-ptz>-1</button></div></div></div>
            <div class="flex gap-2 mt-4">${['01: Pintu Utama', '02: Center Court', '03: Rolex GF'].map((pr, i) => `<button class="chip-btn ${i === 2 ? 'on' : ''}" data-ptz>${pr}</button>`).join('')}</div></section>
          <section class="card p-5">${UI.h('Regu patroli mal', '14/14 aktif, guard tour NFC 98.6%', '', 'groups')}
            ${window.SEED.TEAMS.filter((t) => t.skill === 'Security' || t.skill === 'ERT').map((tm) => { const busy = secTk.filter((t) => t.team === tm.name); return `<div class="inner p-3 mb-2 flex items-center gap-3 ${busy.length ? 'warn-left' : ''}"><span class="w-2 h-2 rounded-md ${busy.length ? 'bg-amber-400' : 'bg-secondary'}"></span><div class="flex-1"><div class="font-body-md text-body-md">${tm.name}</div><div class="font-label-sm text-label-sm text-outline">${esc(tm.members)}</div></div>${busy.length ? `<a href="/command-center/ticketing?id=${busy[0].id}">${UI.chip('Bertugas: ' + busy[0].id, 'bg-amber-500/15 text-amber-300')}</a>` : UI.chip(tm.status, 'bg-secondary/15 text-secondary')}</div>`; }).join('')}
            <div class="flex items-center gap-2 mt-3"><span class="chip-btn">${icon('settings_input_antenna', 'text-[14px]')} HT-CH 01 (Operasional)</span><button class="btn-danger !px-2 ml-auto" data-ht>${icon('campaign', 'text-[16px]')}</button></div></section>
        </div>
      </div>
      ${UI.relasi('CCTV')}`;
    },
    mount(root) {
      root.querySelectorAll('[data-zone]').forEach((b) => b.addEventListener('click', () => { F.zone = b.dataset.zone; const c = window.SEED.CAMERAS.find((x) => F.zone === 'ALL' || x.zone === F.zone); if (c) F.focus = c.id; Shell.rerender(); }));
      root.querySelectorAll('[data-grid]').forEach((b) => b.addEventListener('click', () => { F.grid = +b.dataset.grid; Shell.rerender(); }));
      root.querySelectorAll('[data-speed]').forEach((b) => b.addEventListener('click', () => { F.speed = b.dataset.speed; Shell.rerender(); }));
      root.querySelectorAll('.cam-tile[data-cam]').forEach((b) => b.addEventListener('click', () => { F.focus = b.dataset.cam; Router.replace('/cctv?cam=' + F.focus); Shell.rerender(); }));
      root.querySelectorAll('[data-focus]').forEach((b) => b.addEventListener('click', () => { F.focus = b.dataset.focus; Router.replace('/cctv?cam=' + F.focus); Shell.rerender(); }));
      const mk = (cid, label) => { const c = window.SEED.CAMERAS.find((x) => x.id === cid); Shell.newTicket({ title: label || 'Insiden terdeteksi ' + c.name, sop: SOPCAM[c.kind] || 'SOP-SEC-03', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: c.zone, location: c.name, cam: cid, source: 'CCTV ' + cid + ' (verifikasi operator)', team: c.zone === 'BASEMENT' ? 'Regu Charlie' : 'Regu Bravo', fromDb: 'CCTV' }); };
      root.querySelectorAll('[data-mk]').forEach((b) => b.addEventListener('click', () => mk(b.dataset.mk)));
      root.querySelectorAll('[data-intercept]').forEach((b) => b.addEventListener('click', () => { const a = Store.s.camAlerts[b.dataset.intercept]; mk(b.dataset.intercept, a.label); }));
      root.querySelectorAll('[data-verify]').forEach((b) => b.addEventListener('click', () => { Store.addEvent({ from: 'CCTV', to: 'TIC', code: 'EVT-CAM-VERIFY', title: b.dataset.verify + ' diverifikasi aman', detail: 'Alarm palsu atau sudah ditangani', sev: 'P4' }); Store.clearCam(b.dataset.verify); UI.toast(b.dataset.verify + ' diverifikasi aman', 'P4', 'EVT-CAM-VERIFY ke Tiket & Insiden'); }));
      root.querySelector('#lock').addEventListener('click', () => { if (confirm('Aktifkan lockdown (shelter-in-place) sesuai SOP-SEC-05? Ini simulasi.')) { Store.broadcast('Lockdown: tutup rolling door, tahan pengunjung di dalam toko, dan tunggu instruksi Command Center.', '', null); UI.toast('Lockdown diaktifkan (simulasi)', 'P1', 'Siaran ke tenant & PA system'); } });
      root.querySelector('#patrol').addEventListener('click', () => UI.toast('Status 14 personel patroli: 3 regu aktif, 1 ERT siaga', 'P4'));
      root.querySelector('#tour').addEventListener('click', () => UI.toast('Tur otomatis aktif: kamera berganti tiap 15 detik', 'P4'));
      root.querySelectorAll('[data-ptz]').forEach((b) => b.addEventListener('click', () => UI.toast('Perintah PTZ dikirim (ONVIF)', 'P4')));
      root.querySelectorAll('[data-exp],[data-bm],[data-snap],[data-talk],[data-ht]').forEach((b) => b.addEventListener('click', () => UI.toast(b.hasAttribute('data-exp') ? 'Ekspor klip watermark (.MP4) disiapkan untuk BAP' : b.hasAttribute('data-bm') ? 'Bookmark ditambahkan pada timeline' : b.hasAttribute('data-snap') ? 'Snapshot disimpan ke tiket terkait' : 'Talk-back / HT aktif', 'P4')));
    },
  };
})();
