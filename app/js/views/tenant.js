/* DB-TEN Tenant Support & SLA */
(function () {
  window.Views = window.Views || {};
  const { esc, icon } = UI;
  const F = { cat: 'ALL', tenant: 'GF-104', q: '' };
  const TPL = ['Konfirmasi jadwal MEP: tim teknisi menuju unit Anda, estimasi tiba 15 menit.', 'Izin loading dock diterima. Silakan gunakan Bay B1 sesuai jadwal.', 'Pemberitahuan uji alarm kebakaran pukul 23:00 WIB.'];

  window.Views.tenant = {
    title: 'Layanan Tenant & SLA', live: true,
    render(p) {
      if (p.tenant) F.tenant = p.tenant;
      const T = window.SEED.TENANTS;
      const ten = T.find((t) => t.id === F.tenant) || T[0];
      const tk = Store.s.tickets.filter((t) => t.tenant);
      const act = tk.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED');
      const cats = [['ALL', 'Semua kategori (284)'], ['Luxury & Fashion', 'Luxury & Fashion (94)'], ['F&B & Dining', 'F&B & Dining (72)'], ['Entertainment', 'Entertainment & Cinema (18)'], ['Electronics', 'Electronics (31)']];
      const list = act.filter((t) => { const tn = T.find((x) => x.id === t.tenant); return F.cat === 'ALL' || (tn && tn.cat === F.cat); }).sort((a, b) => a.priority.localeCompare(b.priority));
      const tTk = Store.s.tickets.filter((t) => t.tenant === ten.id);
      const chats = Store.s.chats.slice(-7).reverse();
      return `
      <section class="card p-4 mb-5 flex flex-wrap items-center gap-3">
        <span class="chip-btn"><span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>Meja operasional tenant</span>
        <span class="font-label-md text-label-md text-on-surface-variant">Tenant aktif: <b class="text-secondary">284 / 284 terhubung</b></span>
        <span class="font-label-md text-label-md text-on-surface-variant">Sinkronisasi omnichannel: 6 detik lalu</span>
        <span class="chip-btn">Dispatcher aktif: 6 meja</span>
        <div class="ml-auto flex gap-2"><button class="btn-ghost" id="memo">${icon('campaign', 'text-[16px]')} Siaran memo</button><button class="btn-ghost" id="permit">${icon('assignment', 'text-[16px]')} Izin kerja</button><button class="btn" id="newreq">${icon('add_circle')} Buat tiket tenant</button></div>
      </section>
      <div class="flex flex-wrap gap-2 mb-5">${cats.map(([k, l]) => `<button class="chip-btn ${F.cat === k ? 'on' : ''}" data-cat="${k}">${l}</button>`).join('')}</div>

      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        ${UI.kpi({ label: 'Konektivitas tenant', icon: 'storefront', value: '284', unit: 'toko', delta: 'Operasional normal', foot: 'Portal tersinkron 98.6%, 4 toko dalam verifikasi kontrak baru' })}
        ${UI.kpi({ label: 'Skor CSAT & tingkat SLA', icon: 'sentiment_satisfied', value: '97.4%', vcls: 'text-secondary', unit: 'SLA', bar: 97.4, foot: 'Rata-rata respons pertama 8.4 menit (target ≤ 15)' })}
        ${UI.kpi({ label: 'Tiket terbuka & permintaan', icon: 'confirmation_number', value: act.length, unit: 'aktif', vcls: 'text-tertiary', foot: `${act.filter((t) => t.priority <= 'P2').length} kritis/tinggi, MTTR rata-rata gedung 38 menit` })}
        ${UI.kpi({ label: 'Izin kerja & fit-out hari ini', icon: 'engineering', value: '14', unit: 'izin', foot: '8 disetujui, 4 safety review, 2 lembur dock' })}
      </div>

      <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
        <div class="2xl:col-span-7 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Daftar permintaan & tiket dukungan tenant', 'Aliran dispatch Summarecon Mall West & East Wing', `<span class="chip-btn">Muat ulang tiap 1 detik</span>`, 'support_agent')}
            <div class="flex flex-col gap-3">${list.length ? list.map((t) => { const tn = T.find((x) => x.id === t.tenant); const s = Store.slaInfo(t); return `
              <div class="inner p-4 ${t.priority === 'P1' || t.priority === 'P2' ? 'crit-left' : 'info-left'}">
                <div class="flex flex-wrap items-center gap-2">${UI.prio(t.priority)}<a href="#/tenant?tenant=${tn.id}" class="font-headline-sm text-headline-sm hover:text-primary">${esc(tn.name)}</a>${UI.chip('Unit ' + tn.id)}${UI.chip(tn.cat, 'bg-white/5 text-outline')}<span class="ml-auto">${UI.status(t.status)}</span></div>
                <div class="mt-2 font-label-md text-label-md ${s.breached ? 'text-rose-300' : s.atRisk ? 'text-amber-300' : 'text-on-surface-variant'}">${icon('timer', 'text-[14px] align-middle')} SLA: <span data-due="${s.due}"></span></div>
                <p class="font-body-md text-body-md mt-2">${esc(t.title)}: ${esc(t.desc)}</p>
                <div class="grid grid-cols-3 gap-3 mt-3 font-label-sm text-label-sm"><div><div class="text-outline">PIC CS Command</div><div class="text-on-surface">Sarah Lestari (Ext 402)</div></div><div><div class="text-outline">Tim lapangan</div><div class="text-primary">${esc(t.team)}</div></div><div><div class="text-outline">SOP</div><a class="text-primary" href="#/sop?id=${t.sop}">${t.sop}</a></div></div>
                <div class="flex flex-wrap gap-2 mt-3 justify-end"><button class="btn-ghost" data-chat="${tn.id}">${icon('chat', 'text-[16px]')} Chat toko</button><a class="btn-ghost" href="#/ticketing?id=${t.id}">${icon('open_in_new', 'text-[16px]')} Buka tiket</a>${t.priority !== 'P1' ? `<button class="btn-danger" data-esc="${t.id}">${icon('priority_high', 'text-[16px]')} Eskalasi ke chief</button>` : ''}</div></div>`; }).join('') : `<div class="text-center text-on-surface-variant py-8">Tidak ada permintaan aktif untuk kategori ini.</div>`}</div></section>

          <section class="card p-5">${UI.h('Log percakapan & saluran tenant', 'WhatsApp Business API, Tenant Mobile App, hotdesk, dan siaran Command Center', `<span class="chip-btn text-secondary">API aktif</span>`, 'forum')}
            <div class="flex flex-col gap-3">${chats.map((c) => `<div class="inner p-3 ${c.bot ? 'ml-8 info-left' : ''}"><div class="flex justify-between"><span class="font-label-lg text-label-lg ${c.bot ? 'text-primary' : 'text-on-surface'}">${esc(c.from)} ${UI.chip(c.ch, 'bg-white/5 text-outline')}</span><span class="font-label-sm text-label-sm text-outline">${UI.time(c.ts)} WIB</span></div><p class="font-body-sm text-body-sm mt-1 text-on-surface">"${esc(c.text)}"</p>${!c.bot && c.tenant ? `<div class="flex gap-2 mt-2"><button class="chip-btn" data-conv="${c.tenant}" data-text="${esc(c.text)}">${icon('confirmation_number', 'text-[14px]')} Jadikan tiket</button></div>` : ''}</div>`).join('')}</div>
            <div class="lbl mt-4 mb-2">Templat respons operasional cepat untuk ${esc(ten.name)}</div>
            <div class="flex flex-wrap gap-2">${TPL.map((t, i) => `<button class="chip-btn" data-tpl="${i}">${['Konfirmasi jadwal MEP', 'Izin loading dock diterima', 'Pemberitahuan uji alarm 23:00'][i]}</button>`).join('')}</div>
          </section>
        </div>

        <div class="2xl:col-span-5 flex flex-col gap-5">
          <section class="card p-5">${UI.h('Profil tenant', '', `<select id="selten" class="inp !w-auto !py-1 font-label-md">${T.map((t) => `<option value="${t.id}" ${t.id === ten.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>`, 'badge')}
            <div class="flex items-start justify-between"><div><h2 class="font-headline-lg text-headline-lg">${esc(ten.name)}</h2><div class="font-label-md text-label-md text-primary">${esc(ten.group)} · Unit ${ten.id} · Zona ${ten.zone}</div></div>${UI.chip(ten.score >= 95 ? 'Baik' : ten.score >= 90 ? 'Perhatian' : 'Risiko', ten.score >= 95 ? 'bg-secondary/15 text-secondary' : 'bg-amber-500/15 text-amber-300')}</div>
            <div class="grid grid-cols-2 gap-2 mt-4">
              <div class="inner p-3 col-span-2 flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center font-label-md text-primary">${ten.mgr.split(' ').slice(-2).map((w) => w[0]).join('')}</div><div class="flex-1"><div class="lbl">Store manager bertugas</div><div class="font-body-md text-body-md">${esc(ten.mgr)}</div><div class="font-label-sm text-label-sm text-outline">${ten.phone}</div></div><button class="btn-ghost !px-2" data-chat="${ten.id}">${icon('call', 'text-[16px]')}</button></div>
              <div class="inner p-3"><div class="lbl">Masa sewa unit</div><div class="font-body-md text-body-md text-primary">Hingga ${ten.lease}</div></div>
              <div class="inner p-3"><div class="lbl">Pembayaran utilitas</div><div class="font-body-md text-body-md ${ten.ar ? 'text-rose-300' : 'text-secondary'}">${esc(ten.pay)}</div>${ten.ar ? `<a href="#/owner360" class="font-label-sm text-label-sm text-primary">AR Rp ${ten.ar} jt di Komersial & Keuangan</a>` : ''}</div>
              <div class="inner p-3"><div class="lbl">Audit damkar & APAR</div><div class="font-body-md text-body-md">${esc(ten.safety)}</div></div>
              <div class="inner p-3"><div class="lbl">Tiket 30 hari</div><div class="font-body-md text-body-md">${tTk.length} tiket, ${tTk.filter((t) => t.status === 'CLOSED').length} selesai</div></div>
            </div>
            <div class="inner p-4 mt-3"><div class="flex justify-between"><span class="lbl">Telemetri sub-meter IoT unit ${ten.id}</span><span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span></div>
              <div class="grid grid-cols-3 gap-2 mt-2"><div><div class="lbl">Beban listrik</div><div class="font-headline-md text-headline-md">${ten.kw} kW</div></div><div><div class="lbl">Suhu toko</div><div class="font-headline-md text-headline-md ${ten.temp > 24.5 ? 'text-tertiary' : 'text-secondary'}">${ten.temp}°C</div></div><div><div class="lbl">Tekanan air</div><div class="font-headline-md text-headline-md">${ten.water} Bar</div></div></div>
              ${UI.spark([23, 23.2, 23.1, 23.6, 24.2, 24.9, 25.3, ten.temp, ten.temp - 0.2, ten.temp + 0.1], ten.temp > 24.5 ? '#fb7185' : '#4edea3', 300, 40)}
              <div class="flex gap-2 mt-2">${UI.dbLink('ENE', '', 'Sub-meter di Energi & Utilitas')}${UI.dbLink('BMS', '', 'AHU zona di BMS')}${UI.dbLink('O360', '', 'Kinerja sewa')}</div></div>
            <div class="flex gap-2 mt-3"><button class="btn flex-1 justify-center" data-chat="${ten.id}">${icon('call')} Telepon langsung (VoIP)</button><button class="btn-ghost flex-1 justify-center" data-new="${ten.id}">${icon('send', 'text-[16px]')} Kirim investigasi</button></div>
          </section>
          <section class="card p-5">${UI.h('Kepatuhan regulasi gedung', 'Audit operasional dan standar Summarecon Mall bulan berjalan', '', 'rule')}
            ${[['Kategori F&B: grease trap & dapur kotor', 94.2, '72 outlet F&B terpantau, target minimal 98%'], ['Fashion / retail: jam buka & display etalase', 99.8, 'Batas buka pintu 10:00 WIB, 1 teguran ringan'], ['Anchor tenant: pembatasan daya WBP PLN', 96.5, 'Jam puncak 17:00-22:00, penghematan 42.1 MWh']].map(([n, v, f]) => `<div class="mb-4"><div class="flex justify-between font-label-md text-label-md mb-1"><span>${n}</span><span class="${v >= 98 ? 'text-secondary' : 'text-amber-300'}">${v}% patuh</span></div>${UI.bar(v, v >= 98 ? 'bg-secondary' : 'bg-amber-400')}<div class="font-label-sm text-label-sm text-outline mt-1">${f}</div></div>`).join('')}
            <div class="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3"><div class="flex justify-between"><span class="font-label-lg text-label-lg text-amber-300">${icon('warning', 'text-[16px] align-middle')} Pelanggaran SOP terdeteksi</span><span class="font-label-sm text-label-sm text-outline">15:45 WIB</span></div><p class="font-body-sm text-body-sm mt-1">1 tenant (Batik Keris L2-18) membuka folding gate melewati batas waktu loading dock. Surat teguran otomatis sudah dikirim lewat Tenant App.</p></div>
          </section>
          <section class="card p-5">${UI.h('Siaran terakhir', 'Event EVT-TENANT-BROADCAST dari dashboard lain', '', 'campaign')}
            ${Store.s.broadcasts.slice(0, 4).map((b) => `<div class="inner p-3 mb-2"><div class="font-label-sm text-label-sm text-outline">${UI.time(b.ts)} · Zona ${b.zone || 'Semua'} ${b.ucId ? '· ' + b.ucId : ''}</div><div class="font-body-sm text-body-sm">${esc(b.text)}</div></div>`).join('') || '<div class="font-body-sm text-body-sm text-on-surface-variant">Belum ada siaran.</div>'}
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
      root.querySelector('#permit').addEventListener('click', () => Shell.newTicket({ title: 'Pengajuan izin kerja / fit-out', sop: 'SOP-COM-02', priority: 'P3', category: 'Tenant Fit-Out & Kasir IT', tenant: F.tenant, team: 'Tenant Relation', source: 'Tenant App, izin kerja', fromDb: 'TEN' }));
      root.querySelector('#newreq').addEventListener('click', () => Shell.newTicket({ sop: 'SOP-COM-05', priority: 'P3', tenant: F.tenant, team: 'MEP Bravo', source: 'Helpdesk tenant', fromDb: 'TEN' }));
      root.querySelectorAll('[data-new]').forEach((b) => b.addEventListener('click', () => Shell.newTicket({ sop: 'SOP-COM-05', priority: 'P3', tenant: b.dataset.new, team: 'MEP Bravo', source: 'Investigasi profil tenant', fromDb: 'TEN' })));
      root.querySelectorAll('[data-chat]').forEach((b) => b.addEventListener('click', () => { const t = window.SEED.TENANTS.find((x) => x.id === b.dataset.chat); UI.toast('Memanggil ' + t.mgr + ' (' + t.name + ') via VoIP', 'P4', t.phone); }));
      root.querySelectorAll('[data-esc]').forEach((b) => b.addEventListener('click', () => { Store.escalate(b.dataset.esc, 'L1 Chief Engineering/Security: eskalasi dari Layanan Tenant & SLA'); UI.toast('Eskalasi ' + b.dataset.esc + ' ke chief', 'P2'); }));
      root.querySelectorAll('[data-tpl]').forEach((b) => b.addEventListener('click', () => { Store.chat({ from: 'Command Center → ' + window.SEED.TENANTS.find((x) => x.id === F.tenant).name, ch: 'WhatsApp API', bot: true, text: TPL[+b.dataset.tpl] }); UI.toast('Templat dikirim', 'P4'); }));
      root.querySelectorAll('[data-conv]').forEach((b) => b.addEventListener('click', () => Shell.newTicket({ title: 'Permintaan tenant: ' + b.dataset.text.slice(0, 60), desc: b.dataset.text, sop: 'SOP-COM-05', priority: window.SEED.TENANTS.find((x) => x.id === b.dataset.conv).anchor ? 'P2' : 'P3', tenant: b.dataset.conv, source: 'Chat tenant (konversi)', team: 'MEP Bravo', fromDb: 'TEN', zone: window.SEED.TENANTS.find((x) => x.id === b.dataset.conv).zone })));
    },
  };
})();
