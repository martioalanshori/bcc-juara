/* DB-TEN Tenant Support & SLA */
(function () {
  window.Views = window.Views || {};
  const { esc, icon } = UI;
  const F = { cat: 'ALL', tenant: 'GF-104', q: '' };
  const TPL = ['Konfirmasi Jadwal MEP: tim teknisi menuju unit Anda, estimasi tiba 15 menit.', 'Izin Loading Dock diterima. Silakan gunakan Bay B1 sesuai jadwal.', 'Pemberitahuan uji alarm kebakaran pukul 23:00 WIB.'];

  window.Views.tenant = {
    title: 'Tenant Support & SLA', live: true,
    render(p) {
      if (p.tenant) F.tenant = p.tenant;
      const T = window.SEED.TENANTS;
      const ten = T.find((t) => t.id === F.tenant) || T[0];
      const tk = Store.s.tickets.filter((t) => t.tenant);
      const act = tk.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED');
      const cats = [['ALL', 'Semua Kategori (284)'], ['Luxury & Fashion', 'Luxury & Fashion (94)'], ['F&B & Dining', 'F&B & Dining (72)'], ['Entertainment', 'Entertainment & Cinema (18)'], ['Electronics', 'Electronics (31)']];
      const list = act.filter((t) => { const tn = T.find((x) => x.id === t.tenant); return F.cat === 'ALL' || (tn && tn.cat === F.cat); }).sort((a, b) => a.priority.localeCompare(b.priority));
      const tTk = Store.s.tickets.filter((t) => t.tenant === ten.id);
      const chats = Store.s.chats.slice(-7).reverse();
      return `
      <section class="card p-4 mb-5 flex flex-wrap items-center gap-3">
        <span class="chip-btn"><span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>TENANT OPERATIONS DESK LIVE</span>
        <span class="font-label-md text-label-md text-on-surface-variant">Active tenants: <b class="text-secondary">284 / 284 connected</b></span>
        <span class="font-label-md text-label-md text-on-surface-variant">Omni-channel sync: 6 detik lalu</span>
        <span class="chip-btn">Dispatcher Active: 6 Desks</span>
        <div class="ml-auto flex gap-2"><button class="btn-ghost" id="memo">${icon('campaign', 'text-[16px]')} Siaran Memo</button><button class="btn-ghost" id="permit">${icon('assignment', 'text-[16px]')} Izin Kerja</button><button class="btn" id="newreq">${icon('add_circle')} Tiket Tenant</button></div>
      </section>
      <div class="flex flex-wrap gap-2 mb-5">${cats.map(([k, l]) => `<button class="chip-btn ${F.cat === k ? 'on' : ''}" data-cat="${k}">${l}</button>`).join('')}</div>

      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        ${UI.kpi({ label: 'Konektivitas Tenant', icon: 'storefront', value: '284', unit: 'Toko', delta: 'Operasional Normal', foot: 'Portal synced 98.6% · 4 toko verifikasi kontrak baru' })}
        ${UI.kpi({ label: 'Skor CSAT & SLA Rate', icon: 'sentiment_satisfied', value: '97.4%', vcls: 'text-secondary', unit: 'SLA', bar: 97.4, foot: 'Avg first response 8.4 menit (target ≤ 15)' })}
        ${UI.kpi({ label: 'Tiket Terbuka & Request', icon: 'confirmation_number', value: act.length, unit: 'Aktif', vcls: 'text-tertiary', foot: `${act.filter((t) => t.priority <= 'P2').length} kritis/tinggi · MTTR rata-rata gedung 38 menit` })}
        ${UI.kpi({ label: 'Izin Kerja & Fit-out Hari Ini', icon: 'engineering', value: '14', unit: 'Izin', foot: '8 disetujui · 4 safety review · 2 overtime dock' })}
      </div>

      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
        <div class="2xl:col-span-7 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Daftar Permintaan & Tiket Dukungan Tenant', 'Live dispatch stream · Summarecon Mall West & East Wings', `<span class="chip-btn">AUTO-REFRESH 1s</span>`, 'support_agent')}
            <div class="flex flex-col gap-3">${list.length ? list.map((t) => { const tn = T.find((x) => x.id === t.tenant); const s = Store.slaInfo(t); return `
              <div class="inner p-4 ${t.priority === 'P1' || t.priority === 'P2' ? 'crit-left' : 'info-left'}">
                <div class="flex flex-wrap items-center gap-2">${UI.prio(t.priority)}<a href="#/tenant?tenant=${tn.id}" class="font-headline-sm text-headline-sm hover:text-primary">${esc(tn.name)}</a>${UI.chip('Unit ' + tn.id)}${UI.chip(tn.cat, 'bg-white/5 text-outline')}<span class="ml-auto">${UI.status(t.status)}</span></div>
                <div class="mt-2 font-label-md text-label-md ${s.breached ? 'text-rose-300' : s.atRisk ? 'text-amber-300' : 'text-on-surface-variant'}">${icon('timer', 'text-[14px] align-middle')} SLA: <span data-due="${s.due}"></span></div>
                <p class="font-body-md text-body-md mt-2">${esc(t.title)} — ${esc(t.desc)}</p>
                <div class="grid grid-cols-3 gap-3 mt-3 font-label-sm text-label-sm"><div><div class="text-outline">PIC CS COMMAND</div><div class="text-on-surface">Sarah Lestari (Ext 402)</div></div><div><div class="text-outline">TIM LAPANGAN</div><div class="text-primary">${esc(t.team)}</div></div><div><div class="text-outline">SOP</div><a class="text-primary" href="#/sop?id=${t.sop}">${t.sop}</a></div></div>
                <div class="flex flex-wrap gap-2 mt-3 justify-end"><button class="btn-ghost" data-chat="${tn.id}">${icon('chat', 'text-[16px]')} Quick Chat Store</button><a class="btn-ghost" href="#/ticketing?id=${t.id}">${icon('open_in_new', 'text-[16px]')} Buka Tiket</a>${t.priority !== 'P1' ? `<button class="btn-danger" data-esc="${t.id}">${icon('priority_high', 'text-[16px]')} Eskalasi Chief</button>` : ''}</div></div>`; }).join('') : `<div class="text-center text-on-surface-variant py-8">Tidak ada permintaan aktif untuk kategori ini.</div>`}</div></section>

          <section class="card p-5">${UI.h('Log Percakapan Terpadu & Saluran Tenant', 'WhatsApp Business API · Tenant Mobile App · Hotdesk · Broadcast Command Center', `<span class="chip-btn text-secondary">API Active</span>`, 'forum')}
            <div class="flex flex-col gap-3">${chats.map((c) => `<div class="inner p-3 ${c.bot ? 'ml-8 info-left' : ''}"><div class="flex justify-between"><span class="font-label-lg text-label-lg ${c.bot ? 'text-primary' : 'text-on-surface'}">${esc(c.from)} ${UI.chip(c.ch, 'bg-white/5 text-outline')}</span><span class="font-label-sm text-label-sm text-outline">${UI.time(c.ts)} WIB</span></div><p class="font-body-sm text-body-sm mt-1 text-on-surface">"${esc(c.text)}"</p>${!c.bot && c.tenant ? `<div class="flex gap-2 mt-2"><button class="chip-btn" data-conv="${c.tenant}" data-text="${esc(c.text)}">${icon('confirmation_number', 'text-[14px]')} Konversi ke Tiket</button></div>` : ''}</div>`).join('')}</div>
            <div class="lbl mt-4 mb-2">Templat respons operasional cepat → ${esc(ten.name)}</div>
            <div class="flex flex-wrap gap-2">${TPL.map((t, i) => `<button class="chip-btn" data-tpl="${i}">${['⚡ Konfirmasi Jadwal MEP', '🚚 Izin Loading Dock Diterima', '⏰ Pemberitahuan Uji Alarm 23:00'][i]}</button>`).join('')}</div>
          </section>
        </div>

        <div class="2xl:col-span-5 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Tenant Profile Inspector', '', `<select id="selten" class="inp !w-auto !py-1 font-label-md">${T.map((t) => `<option value="${t.id}" ${t.id === ten.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>`, 'badge')}
            <div class="flex items-start justify-between"><div><h2 class="font-headline-lg text-headline-lg uppercase">${esc(ten.name)}</h2><div class="font-label-md text-label-md text-primary">${esc(ten.group)} · Unit ${ten.id} · Zona ${ten.zone}</div></div>${UI.chip(ten.score >= 95 ? 'Good Standing' : ten.score >= 90 ? 'Perhatian' : 'Risiko', ten.score >= 95 ? 'bg-secondary/15 text-secondary' : 'bg-amber-500/15 text-amber-300')}</div>
            <div class="grid grid-cols-2 gap-2 mt-4">
              <div class="inner p-3 col-span-2 flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center font-label-md text-primary">${ten.mgr.split(' ').slice(-2).map((w) => w[0]).join('')}</div><div class="flex-1"><div class="lbl">Store Manager on Duty</div><div class="font-body-md text-body-md">${esc(ten.mgr)}</div><div class="font-label-sm text-label-sm text-outline">${ten.phone}</div></div><button class="btn-ghost !px-2" data-chat="${ten.id}">${icon('call', 'text-[16px]')}</button></div>
              <div class="inner p-3"><div class="lbl">Masa Sewa Unit</div><div class="font-body-md text-body-md text-primary">Hingga ${ten.lease}</div></div>
              <div class="inner p-3"><div class="lbl">Pembayaran Utilitas</div><div class="font-body-md text-body-md ${ten.ar ? 'text-rose-300' : 'text-secondary'}">${esc(ten.pay)}</div>${ten.ar ? `<a href="#/owner360" class="font-label-sm text-label-sm text-primary">AR Rp ${ten.ar} Jt → Owner 360</a>` : ''}</div>
              <div class="inner p-3"><div class="lbl">Audit Damkar & APAR</div><div class="font-body-md text-body-md">${esc(ten.safety)}</div></div>
              <div class="inner p-3"><div class="lbl">Tiket 30 Hari</div><div class="font-body-md text-body-md">${tTk.length} tiket · ${tTk.filter((t) => t.status === 'CLOSED').length} selesai</div></div>
            </div>
            <div class="inner p-4 mt-3"><div class="flex justify-between"><span class="lbl">Sub-meter IoT Telemetry Unit ${ten.id}</span><span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span></div>
              <div class="grid grid-cols-3 gap-2 mt-2"><div><div class="lbl">Beban Listrik</div><div class="font-headline-md text-headline-md">${ten.kw} kW</div></div><div><div class="lbl">Suhu Toko</div><div class="font-headline-md text-headline-md ${ten.temp > 24.5 ? 'text-tertiary' : 'text-secondary'}">${ten.temp}°C</div></div><div><div class="lbl">Tekanan Air</div><div class="font-headline-md text-headline-md">${ten.water} Bar</div></div></div>
              ${UI.spark([23, 23.2, 23.1, 23.6, 24.2, 24.9, 25.3, ten.temp, ten.temp - 0.2, ten.temp + 0.1], ten.temp > 24.5 ? '#fb7185' : '#4edea3', 300, 40)}
              <div class="flex gap-2 mt-2">${UI.dbLink('ENE', '', 'Sub-meter di Energy')}${UI.dbLink('BMS', '', 'AHU zona di BMS')}${UI.dbLink('O360', '', 'Kinerja sewa')}</div></div>
            <div class="flex gap-2 mt-3"><button class="btn flex-1 justify-center" data-chat="${ten.id}">${icon('call')} Panggil VoIP Direct</button><button class="btn-ghost flex-1 justify-center" data-new="${ten.id}">${icon('send', 'text-[16px]')} Kirim Investigasi</button></div>
          </section>
          <section class="card p-5">${UI.h('Kepatuhan Regulasi Gedung', 'Audit operasional & standar Summarecon Mall · bulan berjalan', '', 'rule')}
            ${[['Kategori F&B: Grease Trap & Dapur Kotor', 94.2, '72 outlet F&B terpantau · target minimal 98%'], ['Fashion / Retail: Jam Buka & Display Etalase', 99.8, 'Batas buka pintu 10:00 WIB · 1 teguran ringan'], ['Anchor Tenants: Pembatasan Daya WBP PLN', 96.5, 'Peak hours 17:00-22:00 · penghematan 42.1 MWh']].map(([n, v, f]) => `<div class="mb-4"><div class="flex justify-between font-label-md text-label-md mb-1"><span>${n}</span><span class="${v >= 98 ? 'text-secondary' : 'text-amber-300'}">${v}% Patuh</span></div>${UI.bar(v, v >= 98 ? 'bg-secondary' : 'bg-amber-400')}<div class="font-label-sm text-label-sm text-outline mt-1">${f}</div></div>`).join('')}
            <div class="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3"><div class="flex justify-between"><span class="font-label-lg text-label-lg text-amber-300">${icon('warning', 'text-[16px] align-middle')} Pelanggaran SOP Terdeteksi</span><span class="font-label-sm text-label-sm text-outline">15:45 WIB</span></div><p class="font-body-sm text-body-sm mt-1">1 tenant terdeteksi buka folding gate melebihi batas waktu loading dock (Batik Keris L2-18). Surat teguran otomatis terkirim via Tenant App.</p></div>
          </section>
          <section class="card p-5">${UI.h('Broadcast Terakhir', 'Event EVT-TENANT-BROADCAST dari dashboard lain', '', 'campaign')}
            ${Store.s.broadcasts.slice(0, 4).map((b) => `<div class="inner p-3 mb-2"><div class="font-label-sm text-label-sm text-outline">${UI.time(b.ts)} · Zona ${b.zone || 'Semua'} ${b.ucId ? '· ' + b.ucId : ''}</div><div class="font-body-sm text-body-sm">${esc(b.text)}</div></div>`).join('') || '<div class="font-body-sm text-body-sm text-on-surface-variant">Belum ada broadcast.</div>'}
          </section>
        </div>
      </div>
      ${UI.relasi('TEN')}`;
    },
    mount(root) {
      root.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { F.cat = b.dataset.cat; Shell.rerender(); }));
      const sel = root.querySelector('#selten');
      sel.addEventListener('change', () => { F.tenant = sel.value; history.replaceState(null, '', '#/tenant?tenant=' + F.tenant); Shell.rerender(); });
      root.querySelector('#memo').addEventListener('click', () => Shell.broadcast());
      root.querySelector('#permit').addEventListener('click', () => Shell.newTicket({ title: 'Pengajuan Izin Kerja / Fit-Out', sop: 'SOP-COM-02', priority: 'P3', category: 'Tenant Fit-Out & Kasir IT', tenant: F.tenant, team: 'Tenant Relation', source: 'Tenant App - Izin Kerja', fromDb: 'TEN' }));
      root.querySelector('#newreq').addEventListener('click', () => Shell.newTicket({ sop: 'SOP-COM-05', priority: 'P3', tenant: F.tenant, team: 'MEP Bravo', source: 'Tenant Helpdesk', fromDb: 'TEN' }));
      root.querySelectorAll('[data-new]').forEach((b) => b.addEventListener('click', () => Shell.newTicket({ sop: 'SOP-COM-05', priority: 'P3', tenant: b.dataset.new, team: 'MEP Bravo', source: 'Investigasi Tenant Inspector', fromDb: 'TEN' })));
      root.querySelectorAll('[data-chat]').forEach((b) => b.addEventListener('click', () => { const t = window.SEED.TENANTS.find((x) => x.id === b.dataset.chat); UI.toast('Memanggil ' + t.mgr + ' (' + t.name + ') via VoIP', 'P4', t.phone); }));
      root.querySelectorAll('[data-esc]').forEach((b) => b.addEventListener('click', () => { Store.escalate(b.dataset.esc, 'L1 Chief Engineering/Security — eskalasi dari Tenant Support'); UI.toast('Eskalasi ' + b.dataset.esc + ' ke Chief', 'P2'); }));
      root.querySelectorAll('[data-tpl]').forEach((b) => b.addEventListener('click', () => { Store.chat({ from: 'Command Center → ' + window.SEED.TENANTS.find((x) => x.id === F.tenant).name, ch: 'WhatsApp API', bot: true, text: TPL[+b.dataset.tpl] }); UI.toast('Templat terkirim', 'P4'); }));
      root.querySelectorAll('[data-conv]').forEach((b) => b.addEventListener('click', () => Shell.newTicket({ title: 'Permintaan tenant: ' + b.dataset.text.slice(0, 60), desc: b.dataset.text, sop: 'SOP-COM-05', priority: window.SEED.TENANTS.find((x) => x.id === b.dataset.conv).anchor ? 'P2' : 'P3', tenant: b.dataset.conv, source: 'Chat Tenant (konversi)', team: 'MEP Bravo', fromDb: 'TEN', zone: window.SEED.TENANTS.find((x) => x.id === b.dataset.conv).zone })));
    },
  };
})();
