/* DB-EVT Event Ticketing — modul dua peran (Bandung Build Challenge 2026):
 *  - ROLE 'pengelola' (app/pengelola.html): panitia/EO. Tambah/hapus/batalkan acara, jenis tiket, harga, kuota,
 *    denah & periode jual, peserta & pembayaran, refund, check-in QR, pengingat, daftar tunggu, lapor ke Command Center.
 *  - ROLE 'mall' (Command Center, app/index.html #/event): manajemen mall 360. Hanya memantau: portofolio semua acara,
 *    dampak ke parkir/crowd/BMS/tenant, keamanan gate → tiket insiden (SOP-EVT-03). Tidak dapat mengubah data acara. */
(function () {
  window.Views = window.Views || {};
  const { esc, icon, num } = UI;
  let ROLE = 'mall'; const isMgr = () => ROLE === 'pengelola';
  const TABS = {
    pengelola: [['acara', 'Daftar acara', 'event_note'], ['ringkasan', 'Ringkasan', 'monitoring'], ['kursi', 'Denah kursi', 'event_seat'], ['kelola', 'Kelola acara', 'edit_calendar'], ['peserta', 'Peserta & transaksi', 'groups'], ['keuangan', 'Keuangan & ROI', 'account_balance'], ['checkin', 'Check-in QR', 'qr_code_scanner'], ['notif', 'Notifikasi & daftar tunggu', 'notifications']],
    mall: [['portofolio', 'Portofolio event', 'travel_explore'], ['ringkasan', 'Detail acara', 'monitoring'], ['kursi', 'Denah langsung', 'event_seat'], ['gate', 'Gate & keamanan', 'shield_person'], ['peserta', 'Transaksi', 'receipt_long'], ['keuangan', 'Keuangan & ROI', 'account_balance']],
  };
  const GLOBAL_TABS = ['acara', 'portofolio']; // tab lintas acara (tanpa pemilih acara)
  const ui = { ev: 'EVT-01', tab: null, seatMode: 'info', seatSel: null, race: null, q: '', st: 'ALL', gate: null, ch: 'ALL' };
  let unsub = null, host = null;
  const EV_ST = { DRAFT: ['Draft', 'bg-slate-500/20 text-slate-300'], PUBLISHED: ['Dipublikasikan', 'bg-emerald-500/15 text-emerald-300'], CLOSED: ['Penjualan ditutup', 'bg-amber-500/15 text-amber-300'], CANCELLED: ['Dibatalkan', 'bg-rose-500/15 text-rose-300'] };
  const evChip = (e) => UI.chip(EV_ST[e.status][0], EV_ST[e.status][1]);
  const O_ST = { PENDING: ['Menunggu bayar', 'bg-amber-500/15 text-amber-300'], PAID: ['Lunas', 'bg-emerald-500/15 text-emerald-300'], EXPIRED: ['Kedaluwarsa', 'bg-slate-500/20 text-slate-300'], CANCELLED: ['Batal', 'bg-slate-500/20 text-slate-300'], REFUNDED: ['Refund', 'bg-rose-500/15 text-rose-300'] };
  const oChip = (o) => { const st = o.status === 'PENDING' && o.until < Evt.now() ? 'EXPIRED' : o.status; return UI.chip(O_ST[st][0], O_ST[st][1]); };
  const rp = (n) => Evt.rp(n);
  const rpJt = (n) => 'Rp ' + (n >= 1e6 ? (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) : n.toLocaleString('id-ID')); // KPI: 0 tampil 'Rp 0', bukan 'Gratis'
  const dtl = (ms) => { const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
  const redraw = () => draw(host);
  async function act(p, ok) { try { const r = await p(); if (ok) UI.toast(ok, 'P4'); return r; } catch (e) { UI.toast(esc(e.message), 'P2'); return null; } }

  // ------------------------------------------------------------------ anomali gate (pengelola melapor, Command Center membuat tiket insiden)
  // Tiket insiden ada di Store (localStorage) browser CC yang membuatnya. Nomor TCK dihitung per browser,
  // jadi tautkan hanya bila tiket itu memang tiket SOP-EVT-03 di browser ini.
  const tkLink = (id) => (window.Store && Store.ticket(id) && Store.ticket(id).sop === 'SOP-EVT-03'
    ? `<a href="#/ticketing?id=${id}" class="chip-btn">${id}</a>`
    : `<span class="font-label-sm text-label-sm text-emerald-300" title="Tiket dibuat di perangkat Command Center lain">${id} (perangkat CC lain)</span>`);
  function anomList(e) {
    const anom = EvtCheckin.anomalies(e.id);
    const reports = Evt.s.reports.filter((r) => r.ev === e.id);
    const rows = anom.map((a) => { const rep = reports.find((r) => r.gate === a.gate && r.ts > Evt.now() - 30 * 60000);
      const btn = isMgr() ? (rep ? `<span class="font-label-sm text-label-sm ${rep.ticketId ? 'text-emerald-300' : 'text-amber-300'}">${rep.ticketId ? 'Ditangani ' + rep.ticketId : 'Terkirim, menunggu CC'}</span>` : `<button class="btn-danger !px-2 !py-1 text-[12px]" data-report="${esc(a.gate)}">Laporkan ke CC</button>`)
        : rep && rep.ticketId ? tkLink(rep.ticketId)
        : rep && rep.claimedBy ? '<span class="font-label-sm text-label-sm text-amber-300">Sedang dibuat otomatis</span>'
        : `<button class="btn-danger !px-2 !py-1 text-[12px]" data-inc="${esc(a.gate)}">Buat tiket insiden</button>`;
      return `<div class="rel-row !cursor-default items-center">${icon('warning', 'text-rose-300 text-[18px]')}<div class="flex-1"><div class="font-label-lg text-label-lg">${esc(a.gate)}</div><div class="font-body-sm text-body-sm text-on-surface-variant">${a.n} pindaian tidak valid/duplikat, indikasi tiket palsu atau calo</div></div>${btn}</div>`; });
    reports.forEach((r) => rows.push(`<div class="rel-row !cursor-default items-center">${icon('campaign', 'text-amber-300 text-[18px]')}<div class="flex-1"><div class="font-label-md text-label-md text-on-surface-variant">${r.id} · ${Evt.fmtTime(r.ts)} · ${esc(r.gate)}</div><div class="font-body-sm text-body-sm">${esc(r.text)}</div></div>${r.ticketId ? (isMgr() ? `<span class="chip-btn">${r.ticketId}</span>` : tkLink(r.ticketId)) : isMgr() ? '<span class="font-label-sm text-label-sm text-amber-300">Menunggu CC</span>' : r.claimedBy ? '<span class="font-label-sm text-label-sm text-amber-300">Sedang dibuat otomatis</span>' : `<button class="btn-danger !px-2 !py-1 text-[12px]" data-rep="${r.id}">Buat tiket insiden</button>`}</div>`));
    return { html: rows.join('') || '<div class="font-body-sm text-body-sm text-on-surface-variant">Tidak ada anomali. Gate normal.</div>', alert: anom.length || reports.some((r) => !r.ticketId) };
  }
  function anomPanel(e) {
    const a = anomList(e);
    return `<section class="card p-5 ${a.alert ? 'crit-left' : ''}">${UI.h('Anomali gate & laporan lapangan', 'Ambang: ≥3 pindaian gagal/duplikat per gate dalam 10 menit (SOP-EVT-03)' + (isMgr() ? ', laporan diteruskan ke Command Center' : ', eskalasi ke tiket insiden'), '', 'gpp_maybe')}<div class="flex flex-col gap-2">${a.html}</div></section>`;
  }

  // ------------------------------------------------------------------ tab: ringkasan
  function ringkasan(e, s) {
    const cap = s.total - s.blocked;
    const att = s.tickets ? (s.checkedIn / s.tickets) * 100 : 0;
    const t = Evt.now(), D = 86400000;
    const days = Array.from({ length: 14 }, (_, i) => { const d0 = new Date(t - (13 - i) * D); d0.setHours(0, 0, 0, 0); return d0.getTime(); });
    const perDay = days.map((d0) => s.paid.filter((o) => o.paidAt >= d0 && o.paidAt < d0 + D).reduce((a, o) => a + o.items.length, 0));
    const slots = Array.from({ length: 12 }, (_, i) => t - (11 - i) * 15 * 60000);
    const ck = Object.values(Evt.s.tickets).filter((x) => x.ev === e.id && x.checkedInAt);
    const perSlot = slots.map((s0) => ck.filter((x) => x.checkedInAt > s0 - 15 * 60000 && x.checkedInAt <= s0).length);
    const recent = s.orders.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    return `<div class="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-5">
      ${UI.kpi({ label: 'Tiket terjual', icon: 'confirmation_number', value: num(s.sold), unit: '/ ' + num(cap), bar: cap ? (s.sold / cap) * 100 : 0, foot: (cap ? ((s.sold / cap) * 100).toFixed(1) : 0) + '% kapasitas jual' })}
      ${UI.kpi({ label: 'Pendapatan', icon: 'payments', value: rpJt(s.revenue), unit: s.revenue >= 1e6 ? 'Jt' : '', foot: s.paid.length + ' transaksi lunas' })}
      ${UI.kpi({ label: 'Pendaftar unik', icon: 'person_add', value: num(s.registrants), foot: 'berdasarkan email pemesan' })}
      ${UI.kpi({ label: 'Kehadiran', icon: 'how_to_reg', value: att.toFixed(0) + '%', unit: num(s.checkedIn) + '/' + num(s.tickets), bar: att, barcls: 'bg-secondary', foot: 'tiket sudah check-in' })}
      ${UI.kpi({ label: 'Sedang dipesan', icon: 'lock_clock', value: num(s.held), vcls: 'text-amber-300', foot: 'kursi/kuota di-hold pengunjung' })}
      ${UI.kpi({ label: 'Menunggu bayar', icon: 'pending', value: num(s.pending), vcls: s.pending ? 'text-amber-300' : 'text-on-surface', foot: 'batas bayar ' + Evt.PAY_MIN + ' menit' })}
    </div>
    <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
      <div class="2xl:col-span-8 flex flex-col gap-5">
        <section class="card p-5">${UI.h('Ketersediaan per kategori', 'Status sama di semua alur: tersedia, sedang dipesan, terjual (langsung dari engine transaksi)', '', 'stacked_bar_chart')}
          <table class="tbl"><thead><tr><th>Kategori</th><th>Harga</th><th class="w-[38%]">Komposisi</th><th>Terjual</th><th>Dipesan</th><th>Tersedia</th><th>Tidak dijual</th><th>Check-in</th></tr></thead><tbody>
          ${e.types.map((ty) => { const p = s.per[ty.id]; const w = (k) => (p.total ? (p[k] / p.total) * 100 : 0); return `<tr><td><span class="inline-block w-2.5 h-2.5 rounded-full mr-2" style="background:${ty.color}"></span><b>${esc(ty.name)}</b>${ty.seated ? '' : '<div class="font-label-sm text-label-sm text-on-surface-variant">kuota tanpa kursi</div>'}</td><td class="font-label-md text-label-md">${rp(ty.price)}</td>
            <td><div class="flex h-2.5 rounded-full overflow-hidden bg-surface-container-highest"><div style="width:${w('sold')}%;background:#64748b"></div><div style="width:${w('held')}%;background:#fb923c"></div><div style="width:${w('available')}%;background:${ty.color}"></div></div></td>
            <td class="font-label-md text-label-md">${p.sold}</td><td class="font-label-md text-label-md text-amber-300">${p.held}</td><td class="font-label-md text-label-md text-emerald-300">${p.available}</td><td class="font-label-md text-label-md text-on-surface-variant">${p.blocked}</td><td class="font-label-md text-label-md">${p.checkedIn}</td></tr>`; }).join('')}
          </tbody></table>
          <div class="flex gap-4 mt-3 font-label-sm text-label-sm text-on-surface-variant"><span><span class="inline-block w-2 h-2 rounded-full bg-slate-500 mr-1"></span>Terjual</span><span><span class="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1"></span>Sedang dipesan</span><span><span class="inline-block w-2 h-2 rounded-full bg-sky-300 mr-1"></span>Tersedia (warna kategori)</span></div></section>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <section class="card p-5">${UI.h('Tiket terjual per hari', '14 hari terakhir', '', 'trending_up')}${UI.line([{ data: perDay, color: '#38bdf8' }], { labels: days.map((d, i) => (i % 3 === 0 ? new Date(d).getDate() + '/' + (new Date(d).getMonth() + 1) : '')), min: 0, h: 180 })}</section>
          <section class="card p-5">${UI.h('Arus check-in per 15 menit', '3 jam terakhir, semua gate', '', 'how_to_reg')}${UI.line([{ data: perSlot, color: '#4edea3' }], { labels: slots.map((x, i) => (i % 3 === 0 ? Evt.fmtTime(x) : '')), min: 0, h: 180 })}</section>
        </div>
      </div>
      <div class="2xl:col-span-4 flex flex-col gap-5">
        ${anomPanel(e)}
        <section class="card p-5">${UI.h('Transaksi terbaru', '', `<button class="btn-ghost" data-tab="peserta">Semua transaksi</button>`, 'receipt_long')}
          <div class="flex flex-col gap-2">${recent.map((o) => `<button class="rel-row text-left w-full" data-order="${o.id}"><div class="flex-1 min-w-0"><div class="flex justify-between"><span class="font-label-lg text-label-lg">${o.id}</span>${oChip(o)}</div><div class="font-body-sm text-body-sm text-on-surface-variant truncate">${esc(o.name)} · ${o.items.map((i) => i.seat || Evt.typeById(e, i.type).name).join(', ')} · ${rp(o.total)}</div></div></button>`).join('')}</div></section>
        ${isMgr() ? '' : `<section class="card p-5">${UI.h('Dampak lintas dashboard', 'Prediksi dari tiket terjual', '', 'hub')}
          <div class="flex flex-col gap-2 font-body-sm text-body-sm">
            <div class="rel-row !cursor-default">${icon('local_parking', 'text-primary text-[18px]')}<div>Estimasi tambahan kendaraan <b>${num(Math.round(s.sold * 0.42))}</b> (1 mobil / 2,4 pengunjung) → ${UI.dbLink('PARK', '', 'Parkir & Mobilitas')}</div></div>
            <div class="rel-row !cursor-default">${icon('groups', 'text-primary text-[18px]')}<div>Kepadatan ${esc(e.venue.split(',')[0])}: ${num(s.sold)} orang, puncak ${Evt.fmtTime(e.doors + 3600000)} → ${UI.dbLink('CCTV', 'cam=CAM-01', 'CCTV Atrium')}</div></div>
            <div class="rel-row !cursor-default">${icon('hvac', 'text-primary text-[18px]')}<div>Pre-cooling atrium mulai ${Evt.fmtTime(e.doors - 3600000)} → ${UI.dbLink('BMS', '', 'BMS')}</div></div>
            <div class="rel-row !cursor-default">${icon('restaurant', 'text-primary text-[18px]')}<div>Info lonjakan pengunjung untuk tenant F&B → ${UI.dbLink('TEN', '', 'Layanan Tenant & SLA')}</div></div></div></section>`}
      </div></div>
    ${isMgr() ? '' : UI.relasi('EVT')}`;
  }

  // ------------------------------------------------------------------ tab: denah kursi
  function kursi(e, s) {
    const sel = ui.seatSel;
    let info = '<div class="font-body-sm text-body-sm text-on-surface-variant">Klik kursi untuk melihat detail pemesan.</div>';
    if (sel) {
      const x = Evt.s.seats[e.id][sel]; const st = Evt.seatStatus(e.id, sel, null); const ty = Evt.typeById(e, Evt.seatType(e, sel));
      const o = x && x.order && Evt.s.orders[x.order];
      const tk = o && o.tickets.map((id) => Evt.s.tickets[id]).find((t) => t.seat === sel);
      info = `<div class="flex items-center gap-3 mb-3"><span class="seat ${st} pointer-events-none" style="--c:${ty.color}">${sel}</span><div><div class="font-headline-sm text-headline-sm">Kursi ${sel}</div><div class="font-label-md text-label-md text-on-surface-variant">${esc(ty.name)} · ${rp(ty.price)} · ${Evt.STATUS_TXT[st]}</div></div></div>
        ${o ? `<div class="inner p-3 font-body-sm text-body-sm flex flex-col gap-1"><div class="flex justify-between"><b>${o.id}</b>${oChip(o)}</div><div>${esc(o.name)}</div><div class="text-on-surface-variant">${esc(o.email)} · ${esc(o.phone)}</div>${tk ? `<div>${tk.id} · ${tk.checkedInAt ? '<span class="text-emerald-300">check-in ' + Evt.fmtTime(tk.checkedInAt) + '</span>' : 'belum check-in'}</div>` : ''}${o.status === 'PENDING' ? `<div class="text-amber-300">Hold berakhir ${Evt.fmtTime(o.until)} WIB</div>` : ''}<button class="btn-ghost mt-2" data-order="${o.id}">Buka transaksi</button></div>` : x && x.st === 'HELD' ? `<div class="inner p-3 font-body-sm text-body-sm">Sedang dipilih pengunjung (keranjang ${esc(x.cart)}), belum membuat pesanan. Hold berakhir ${Evt.fmtTime(x.until)}.</div>` : ''}`;
    }
    return `<div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <section class="card p-5 2xl:col-span-9">${UI.h('Denah ' + esc(e.venue), isMgr() ? 'Pembaruan otomatis dari semua perangkat (portal pengunjung, gate, panitia)' : 'Pemantauan langsung, hanya baca (perubahan denah dilakukan pengelola acara)', isMgr() ? `<div class="flex gap-2"><button class="chip-btn ${ui.seatMode === 'info' ? 'on' : ''}" data-smode="info">${icon('info', 'text-[14px]')} Mode info</button><button class="chip-btn ${ui.seatMode === 'block' ? 'on' : ''}" data-smode="block">${icon('block', 'text-[14px]')} Mode blokir kursi</button></div>` : '', 'event_seat')}
        ${ui.seatMode === 'block' ? '<div class="inner p-3 mb-3 font-body-sm text-body-sm text-amber-300">Mode blokir: klik kursi tersedia untuk menutup penjualan (mis. kursi kamera/teknis/kursi roda), klik lagi untuk membuka.</div>' : ''}
        <div class="admin-map">${Evt.seatMap(e.id, { admin: true })}</div><div class="mt-4">${Evt.legend(e, { admin: true })}</div></section>
      <div class="2xl:col-span-3 flex flex-col gap-5">
        <section class="card p-5">${UI.h('Detail kursi', '', '', 'chair')}${info}</section>
        <section class="card p-5">${UI.h('Ringkasan status', '', '', 'donut_small')}
          ${`<div class="flex justify-center">${UI.donut([{ v: s.sold, color: '#64748b' }, { v: s.held, color: '#fb923c' }, { v: s.available, color: '#38bdf8' }, { v: s.blocked, color: '#334155' }], { center: num(s.sold), sub: 'terjual' })}</div>`}
          <div class="grid grid-cols-2 gap-2 mt-3 font-label-md text-label-md"><span>Terjual <b>${s.sold}</b></span><span class="text-amber-300">Dipesan <b>${s.held}</b></span><span class="text-emerald-300">Tersedia <b>${s.available}</b></span><span class="text-on-surface-variant">Tidak dijual <b>${s.blocked}</b></span></div></section>
        ${isMgr() ? `<section class="card p-5">${UI.h('Uji anti double-booking', 'Dua pembeli menekan kursi yang sama pada detik yang sama', '', 'sync_lock')}
          <button class="btn w-full justify-center" id="race">${icon('bolt')} Jalankan simulasi rebutan kursi</button>
          <button class="btn-ghost w-full justify-center mt-2" id="stress">${icon('groups')} Uji tekan 25 pembeli${sel && Evt.seatStatus(e.id, sel, null) === 'available' ? ' di kursi ' + sel : ''}</button>
          ${ui.race ? `<ol class="mt-3 flex flex-col gap-1.5 font-body-sm text-body-sm list-decimal pl-5">${ui.race.map((l) => `<li>${esc(l)}</li>`).join('')}</ol>` : `<p class="font-body-sm text-body-sm text-on-surface-variant mt-3">Mekanisme: hold kursi + transaksi berversi (compare-and-swap) di server LAN. Commit yang datang belakangan ditolak lalu diperiksa ulang, sehingga tidak ada dua pesanan sah untuk satu kursi.</p>`}</section>` : ''}
      </div></div>`;
  }

  // ------------------------------------------------------------------ tab: kelola acara
  function finFields(e) {
    const fin = Object.assign({}, Evt.FIN_DEFAULT, e.fin);
    return `<div class="col-span-2 lbl mt-1">Kontrak venue (sesuai perjanjian dengan mall)</div>
          <label class="f">Sewa venue (Rp)<input class="inp" type="number" min="0" step="100000" name="finRent" value="${fin.rent}"></label>
          <label class="f">Bagi hasil tiket ke mall (%)<input class="inp" type="number" min="0" max="100" step="0.5" name="finShare" value="${+(fin.revShare * 100).toFixed(2)}"></label>
          <label class="f">Biaya operasional mall (Rp)<input class="inp" type="number" min="0" step="100000" name="finCost" value="${fin.cost}"></label>
          <label class="f">Rata-rata belanja pengunjung di tenant (Rp)<input class="inp" type="number" min="0" step="1000" name="finSpend" value="${fin.spend}"></label>`;
  }
  function kelola(e) {
    if (e.status === 'CANCELLED') return `<section class="card p-8 crit-left">${UI.h('Acara dibatalkan', 'Dibatalkan ' + Evt.fmtDT(e.cancelledAt) + (e.cancelReason ? ' (' + esc(e.cancelReason) + ')' : ''), '', 'event_busy')}<p class="font-body-sm text-body-sm text-on-surface-variant mb-4">Semua pesanan lunas sudah di-refund otomatis dan peserta dikabari. Data acara dikunci. Hapus acara dari tab Daftar acara bila tidak diperlukan lagi.</p><button class="btn-ghost" data-tab="acara">${icon('event_note', 'text-[16px]')} Ke Daftar acara</button></section>`;
    return `<div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <section class="card p-5 2xl:col-span-7">${UI.h('Informasi acara & periode penjualan', e.id + '. Perubahan langsung tampil di portal pengunjung', `<button class="btn-ghost" data-tab="acara">${icon('event_note', 'text-[16px]')} Daftar acara</button>`, 'edit_calendar')}
        <form id="f-ev" class="grid grid-cols-2 gap-4">
          <label class="f col-span-2">Nama acara<input class="inp" name="name" value="${esc(e.name)}" required></label>
          <label class="f col-span-2">Tagline<input class="inp" name="tagline" value="${esc(e.tagline)}"></label>
          <label class="f">Kategori<input class="inp" name="cat" value="${esc(e.cat)}"></label>
          <label class="f">Status<select class="inp" name="status">${['DRAFT', 'PUBLISHED', 'CLOSED'].map((x) => `<option ${e.status === x ? 'selected' : ''} value="${x}">${{ DRAFT: 'Draft (tidak tampil)', PUBLISHED: 'Dipublikasikan', CLOSED: 'Penjualan ditutup' }[x]}</option>`).join('')}</select></label>
          <label class="f">Mulai acara<input class="inp" type="datetime-local" name="start" value="${dtl(e.start)}" required></label>
          <label class="f">Gate dibuka<input class="inp" type="datetime-local" name="doors" value="${dtl(e.doors)}" required></label>
          <label class="f">Penjualan dibuka<input class="inp" type="datetime-local" name="saleStart" value="${dtl(e.saleStart)}" required></label>
          <label class="f">Penjualan ditutup<input class="inp" type="datetime-local" name="saleEnd" value="${dtl(e.saleEnd)}" required></label>
          <label class="f col-span-2">Lokasi / venue<input class="inp" name="venue" value="${esc(e.venue)}"></label>
          <label class="f">Durasi hold kursi (menit)<input class="inp" type="number" min="2" max="30" name="holdMin" value="${e.holdMin}"></label>
          <label class="f">Maks tiket per pesanan<input class="inp" type="number" min="1" max="10" name="maxPerOrder" value="${e.maxPerOrder}"></label>
          <label class="f col-span-2">Gate check-in (pisahkan dengan koma)<input class="inp" name="gates" value="${esc(e.gates.join(', '))}"></label>
          <label class="f col-span-2">Deskripsi<textarea class="inp" name="desc" rows="3">${esc(e.desc)}</textarea></label>
          ${finFields(e)}
          <div class="col-span-2 flex justify-end"><button class="btn">${icon('save')} Simpan acara</button></div></form></section>
      <section class="card p-5 2xl:col-span-5">${UI.h('Jenis tiket, harga & kuota', 'Kuota kursi bernomor = jumlah kursi kategori di denah (atur lewat mode blokir)', '', 'sell')}
        <div class="flex flex-col gap-3">${e.types.map((ty) => { const p = Evt.stats(e.id).per[ty.id]; return `<form class="inner p-4 grid grid-cols-2 gap-3" data-type="${ty.id}">
          <div class="col-span-2 flex items-center gap-2"><span class="w-3 h-3 rounded-full" style="background:${ty.color}"></span><span class="font-label-lg text-label-lg">${ty.id}</span><span class="ml-auto font-label-sm text-label-sm text-on-surface-variant">terjual ${p.sold}, tersedia ${p.available}</span></div>
          <label class="f">Nama<input class="inp" name="name" value="${esc(ty.name)}"></label>
          <label class="f">Harga (Rp)<input class="inp" type="number" min="0" step="1000" name="price" value="${ty.price}"></label>
          ${ty.seated ? `<div class="f">Kuota<div class="inp !bg-transparent">${p.total - p.blocked} kursi (denah)</div></div>` : `<label class="f">Kuota<input class="inp" type="number" min="${p.sold}" name="quota" value="${ty.quota}"></label>`}
          <label class="f">Dijual<select class="inp" name="onSale"><option value="1" ${ty.onSale ? 'selected' : ''}>Ya</option><option value="0" ${ty.onSale ? '' : 'selected'}>Tidak (undangan/tertutup)</option></select></label>
          <label class="f col-span-2">Benefit<input class="inp" name="perks" value="${esc(ty.perks || '')}"></label>
          <div class="col-span-2 flex justify-end"><button class="btn-ghost">${icon('save', 'text-[16px]')} Simpan ${esc(ty.id)}</button></div></form>`; }).join('')}</div></section></div>`;
  }

  // ------------------------------------------------------------------ tab: peserta & transaksi
  function pesertaTable(e) {
    const q = ui.q.toLowerCase();
    const list = Evt.stats(e.id).orders.filter((o) => { const st = o.status === 'PENDING' && o.until < Evt.now() ? 'EXPIRED' : o.status; return (ui.st === 'ALL' || st === ui.st) && (!q || [o.id, o.name, o.email, o.phone, ...o.items.map((i) => i.seat || '')].join(' ').toLowerCase().includes(q)); }).sort((a, b) => b.createdAt - a.createdAt);
    return `<div class="font-label-md text-label-md text-on-surface-variant mb-2">${list.length} transaksi</div><div class="overflow-x-auto"><table class="tbl"><thead><tr><th>Booking</th><th>Peserta</th><th>Tiket</th><th>Total</th><th>Metode</th><th>Status</th><th>Kehadiran</th><th>Dibuat</th></tr></thead><tbody>
      ${list.slice(0, 120).map((o) => { const ck = o.tickets.filter((id) => Evt.s.tickets[id].checkedInAt).length; return `<tr class="row" data-order="${o.id}"><td class="font-label-lg text-label-lg">${o.id}</td><td><div class="font-body-sm text-body-sm">${esc(o.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${esc(o.email)} · ${esc(o.phone)}</div></td><td class="font-label-md text-label-md">${o.items.map((i) => `<span class="inline-block mr-1"><span class="inline-block w-2 h-2 rounded-full" style="background:${Evt.typeById(e, i.type).color}"></span> ${i.seat || Evt.typeById(e, i.type).name}</span>`).join('')}</td><td class="font-label-md text-label-md whitespace-nowrap">${rp(o.total)}</td><td class="font-body-sm text-body-sm">${o.method || '-'}</td><td>${oChip(o)}</td><td class="font-label-md text-label-md">${o.tickets.length ? ck + '/' + o.tickets.length : '-'}</td><td class="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">${Evt.fmtDT(o.createdAt)}</td></tr>`; }).join('')}
      </tbody></table></div>${list.length > 120 ? '<div class="font-label-sm text-label-sm text-on-surface-variant mt-2">Menampilkan 120 transaksi terbaru. Gunakan pencarian atau ekspor CSV untuk data lengkap.</div>' : ''}`;
  }
  function peserta(e) {
    const sts = [['ALL', 'Semua'], ['PAID', 'Lunas'], ['PENDING', 'Menunggu bayar'], ['EXPIRED', 'Kedaluwarsa'], ['CANCELLED', 'Batal'], ['REFUNDED', 'Refund']];
    return `<section class="card p-5">${UI.h('Data peserta & status pembayaran', isMgr() ? 'Klik baris untuk detail: ubah data peserta, kirim ulang e-ticket, batalkan, refund' : 'Pemantauan transaksi, hanya baca (refund & perubahan data oleh pengelola acara)', `<div class="flex gap-2"><button class="btn-ghost" id="csv-p">${icon('download', 'text-[16px]')} Peserta (CSV)</button><button class="btn-ghost" id="csv-t">${icon('download', 'text-[16px]')} Transaksi (CSV)</button></div>`, 'groups')}
      <div class="flex flex-wrap gap-2 items-center mb-4"><input class="inp !w-80" id="q" placeholder="Cari booking, nama, email, HP, kursi…" value="${esc(ui.q)}">${sts.map(([k, l]) => `<button class="chip-btn ${ui.st === k ? 'on' : ''}" data-st="${k}">${l}</button>`).join('')}</div>
      <div id="evt-table">${pesertaTable(e)}</div></section>`;
  }

  // ------------------------------------------------------------------ tab: keuangan & ROI (Finance & Marketing)
  function keuangan(e) {
    const f = Evt.finance(e.id), T = f.totals, R = f.roi;
    const pct = (x) => (x * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%';
    const money = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
    const row = (k, v, cls) => `<div class="flex justify-between gap-3 py-1.5"><span class="text-on-surface-variant">${k}</span><b class="${cls || ''}">${v}</b></div>`;
    return `<div class="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
      ${UI.kpi({ label: 'Bruto', icon: 'payments', value: rpJt(T.gross), unit: T.gross >= 1e6 ? 'Jt' : '', foot: T.orders + ' transaksi lunas & refund' })}
      ${UI.kpi({ label: 'Refund', icon: 'currency_exchange', value: rpJt(T.refunded), unit: T.refunded >= 1e6 ? 'Jt' : '', vcls: T.refunded ? 'text-amber-300' : 'text-on-surface', foot: 'dikembalikan ke peserta' })}
      ${UI.kpi({ label: 'Neto', icon: 'account_balance_wallet', value: rpJt(T.net), unit: T.net >= 1e6 ? 'Jt' : '', vcls: 'text-emerald-300', foot: 'bruto dikurangi refund' })}
      ${UI.kpi({ label: 'Biaya layanan', icon: 'receipt', value: rpJt(T.fee), unit: T.fee >= 1e6 ? 'Jt' : '', foot: rp(Evt.FEE) + ' per tiket berbayar' })}
      ${UI.kpi({ label: 'Selisih rekonsiliasi', icon: f.mismatches.length ? 'error' : 'verified', value: f.mismatches.length, vcls: f.mismatches.length ? 'text-rose-300' : 'text-emerald-300', foot: f.mismatches.length ? 'pesanan perlu diperiksa' : 'semua pesanan cocok' })}</div>
    <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <div class="2xl:col-span-7 flex flex-col gap-5">
        <section class="card p-5">${UI.h('Rekonsiliasi per metode pembayaran', 'Dicocokkan dari setiap pesanan: total = subtotal + biaya layanan, jumlah e-ticket = jumlah tiket', `<button class="btn-ghost" id="csv-fin">${icon('download', 'text-[16px]')} Rekonsiliasi (CSV)</button>`, 'account_balance')}
          <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>Metode</th><th>Transaksi</th><th>Bruto</th><th>Refund</th><th>Neto</th></tr></thead><tbody>
          ${f.byMethod.map((m) => `<tr><td class="font-body-sm text-body-sm">${esc(m.method)}</td><td class="font-label-md text-label-md">${m.orders}</td><td class="font-label-md text-label-md whitespace-nowrap">${money(m.gross)}</td><td class="font-label-md text-label-md whitespace-nowrap text-amber-300">${money(m.refunded)}</td><td class="font-label-md text-label-md whitespace-nowrap">${money(m.net)}</td></tr>`).join('') || '<tr><td colspan="5" class="text-on-surface-variant">Belum ada transaksi.</td></tr>'}
          <tr><td><b>Total</b></td><td class="font-label-md text-label-md"><b>${T.orders}</b></td><td class="font-label-md text-label-md whitespace-nowrap"><b>${money(T.gross)}</b></td><td class="font-label-md text-label-md whitespace-nowrap text-amber-300"><b>${money(T.refunded)}</b></td><td class="font-label-md text-label-md whitespace-nowrap"><b>${money(T.net)}</b></td></tr></tbody></table></div>
          ${f.mismatches.length ? `<div class="flex flex-col gap-2 mt-3">${f.mismatches.map((m) => `<button class="rel-row text-left w-full" data-order="${m.order}">${icon('error', 'text-rose-300 text-[18px]')}<div class="flex-1"><b>${m.order}</b><div class="font-body-sm text-body-sm text-on-surface-variant">${esc(m.reason)}</div></div></button>`).join('')}</div>` : ''}</section>
        <section class="card p-5">${UI.h('Laporan penjualan per kategori', 'Pesanan lunas, dihitung dengan harga saat pembelian', '', 'sell')}
          <table class="tbl"><thead><tr><th>Kategori</th><th>Tiket</th><th>Pendapatan tiket</th></tr></thead><tbody>
          ${f.byType.map((b) => `<tr><td><span class="inline-block w-2.5 h-2.5 rounded-full mr-2" style="background:${Evt.typeById(e, b.type).color}"></span>${esc(b.name)}</td><td class="font-label-md text-label-md">${b.qty}</td><td class="font-label-md text-label-md whitespace-nowrap">${money(b.gross)}</td></tr>`).join('') || '<tr><td colspan="3" class="text-on-surface-variant">Belum ada tiket terjual.</td></tr>'}</tbody></table></section></div>
      <div class="2xl:col-span-5 flex flex-col gap-5">
        <section class="card p-5">${UI.h('ROI acara untuk mall', 'Manfaat = sewa venue + bagi hasil tiket. ROI = (manfaat - biaya) / biaya', '', 'trending_up')}
          <div class="font-body-sm text-body-sm">${row('Sewa venue', money(R.rent))}${row('Bagi hasil tiket (' + pct(R.revShare) + ' dari neto)', money(R.share))}${row('Total manfaat', money(R.benefit))}${row('Biaya operasional mall', money(R.cost))}${row('ROI', R.roi == null ? '-' : pct(R.roi), R.roi == null ? '' : R.roi >= 0 ? 'text-emerald-300' : 'text-rose-300')}</div>
          <div class="inner p-3 mt-4 font-body-sm text-body-sm">${icon('storefront', 'text-primary text-[16px] align-middle')} Estimasi belanja pengunjung di tenant: <b>${money(R.tenantSpend)}</b><div class="text-on-surface-variant">${num(R.attendees)} pengunjung (${R.basis}) × ${money(R.spend)}. Tidak dihitung dalam ROI.</div></div>
          <p class="font-label-sm text-label-sm text-on-surface-variant mt-3">Angka sewa, bagi hasil, biaya dan belanja adalah asumsi${isMgr() ? ', ubah di tab Kelola acara sesuai perjanjian dengan mall.' : ' dari pengelola acara (diisi di Konsol Pengelola).'}</p></section></div></div>`;
  }

  // ------------------------------------------------------------------ tab: check-in
  function ckStats(e, noAnom) {
    const s = Evt.stats(e.id);
    const byGate = {}; Object.values(Evt.s.tickets).filter((t) => t.ev === e.id && t.checkedInAt).forEach((t) => (byGate[t.gate] = (byGate[t.gate] || 0) + 1));
    const a = anomList(e);
    return `${a.alert && !noAnom ? `<div class="flex flex-col gap-2 mb-4">${a.html}</div>` : ''}
      <div class="grid grid-cols-2 gap-3 mb-4">${UI.kpi({ label: 'Sudah check-in', value: num(s.checkedIn), unit: '/ ' + num(s.tickets), bar: s.tickets ? (s.checkedIn / s.tickets) * 100 : 0, barcls: 'bg-secondary' })}${UI.kpi({ label: 'Belum hadir', value: num(s.tickets - s.checkedIn), foot: 'Gate dibuka ' + Evt.fmtTime(e.doors) })}</div>
      <div class="flex flex-col gap-2 mb-4">${e.gates.map((g) => `<div class="inner px-3 py-2 flex justify-between font-body-sm text-body-sm"><span>${esc(g)}</span><b>${byGate[g] || 0}</b></div>`).join('')}</div>`;
  }
  function checkin(e) {
    ui.gate = e.gates.includes(ui.gate) ? ui.gate : e.gates[0];
    return `<div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <section class="card p-5 2xl:col-span-5">${UI.h('Pemindai gate', 'Validasi QR e-ticket: valid, sudah digunakan, atau tidak valid', `<a class="btn-ghost" href="checkin.html" target="_blank">${icon('smartphone', 'text-[16px]')} Versi ponsel</a>`, 'qr_code_scanner')}
        <label class="f mb-3">Gate<select class="inp" id="gate">${e.gates.map((g) => `<option ${g === ui.gate ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></label>
        ${EvtCheckin.panel()}</section>
      <div class="2xl:col-span-7 flex flex-col gap-5">
        <section class="card p-5"><div id="ck-stats">${ckStats(e)}</div></section>
        <section class="card p-5">${UI.h('Uji check-in serentak', 'Dua gate memindai QR yang sama pada detik yang sama', '', 'sync_lock')}
          <button class="btn w-full justify-center" id="dual">${icon('qr_code_scanner')} Jalankan uji 2 gate</button>
          ${ui.dual && ui.dual.ev === e.id ? `<div class="flex flex-col gap-2 mt-3">${ui.dual.results.map((x) => `<div class="inner px-3 py-2 font-body-sm text-body-sm"><div class="flex justify-between gap-2"><span>${esc(x.gate)}</span><b class="${x.result === 'VALID' ? 'text-emerald-300' : x.result === 'USED' ? 'text-amber-300' : 'text-rose-300'}">${x.result === 'VALID' ? 'VALID' : x.result === 'USED' ? 'SUDAH DIGUNAKAN' : 'TIDAK VALID'}</b></div><div class="text-on-surface-variant">${esc(x.reason)}</div></div>`).join('')}<div class="font-label-sm text-label-sm text-on-surface-variant">Tiket ${esc(ui.dual.ticket)}: hanya satu gate yang menerima.</div></div>` : ''}
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-3">Satu tiket contoh akan tercatat sudah check-in. Gunakan Reset untuk mengembalikan data.</p></section>
        <section class="card p-5">${UI.h('Log pindaian', 'Semua gate', '', 'list_alt')}<div id="ck-log">${EvtCheckin.logTable(e.id, 30)}</div></section></div></div>`;
  }

  // ------------------------------------------------------------------ tab: notifikasi & waitlist
  const WL_REASON = { refund: 'refund', kedaluwarsa: 'pesanan kedaluwarsa', batal: 'pesanan batal', 'acara-batal': 'acara dibatalkan', manual: 'manual' };
  function notif(e) {
    const ids = new Set(Evt.stats(e.id).orders.map((o) => o.id));
    const wl = Evt.s.waitlist.filter((w) => w.ev === e.id);
    const msgs = Evt.s.outbox.filter((m) => (ids.has(m.order) || wl.some((w) => w.id === m.order)) && (ui.ch === 'ALL' || m.ch === ui.ch)).slice(0, 80);
    return `<div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <section class="card p-5 2xl:col-span-8">${UI.h('Kotak keluar email & WhatsApp (simulasi)', 'E-ticket, instruksi bayar, pengingat, dan refund. Tidak ada pesan yang benar-benar dikirim', `<div class="flex gap-2">${['ALL', 'Email', 'WhatsApp'].map((c) => `<button class="chip-btn ${ui.ch === c ? 'on' : ''}" data-ch="${c}">${c === 'ALL' ? 'Semua' : c}</button>`).join('')}</div>`, 'outbox')}
        <table class="tbl"><thead><tr><th>Waktu</th><th>Kanal</th><th>Penerima</th><th>Pesan</th></tr></thead><tbody>${msgs.map((m) => `<tr><td class="font-label-md text-label-md whitespace-nowrap">${Evt.fmtDT(m.ts)}</td><td>${icon(m.ch === 'Email' ? 'mail' : 'chat', 'text-[18px] ' + (m.ch === 'Email' ? 'text-primary' : 'text-emerald-300'))}</td><td class="font-body-sm text-body-sm">${esc(m.to)}<div class="font-label-sm text-label-sm text-on-surface-variant">${m.order}</div></td><td class="font-body-sm text-body-sm"><b>${esc(m.subject)}</b><div class="text-on-surface-variant">${esc(m.body)}</div></td></tr>`).join('')}</tbody></table></section>
      <div class="2xl:col-span-4 flex flex-col gap-5">
        <section class="card p-5">${UI.h('Pengingat acara', Evt.fmtDT(e.start) + ' · ' + Evt.stats(e.id).paid.length + ' pemesan lunas', '', 'notifications_active')}
          <p class="font-body-sm text-body-sm text-on-surface-variant mb-3">Kirim pengingat (jadwal, lokasi, jam gate, QR) lewat email & WhatsApp ke semua pemesan lunas. Di versi produksi, pengingat terkirim otomatis H-1 dan 3 jam sebelum acara.</p>
          <button class="btn w-full justify-center" id="remind">${icon('send')} Kirim pengingat</button></section>
        <section class="card p-5">${UI.h('Daftar tunggu', wl.length + ' orang', '', 'hourglass_top')}
          <div class="flex flex-col gap-2 mb-3">${wl.length ? wl.map((w) => `<div class="inner px-3 py-2 font-body-sm text-body-sm flex justify-between gap-2"><span>${esc(w.name)} · ${w.qty}× ${esc(Evt.typeById(e, w.type).name)}<br><span class="text-on-surface-variant">${esc(w.contact)}</span></span><span class="font-label-sm text-label-sm ${w.notified ? 'text-emerald-300' : 'text-amber-300'}">${w.notified ? 'Dikabari ' + Evt.fmtTime(w.notified) + (WL_REASON[w.reason] ? ' · ' + WL_REASON[w.reason] : '') : 'Menunggu'}</span></div>`).join('') : '<div class="font-body-sm text-body-sm text-on-surface-variant">Belum ada. Pengunjung dapat bergabung saat kategori habis.</div>'}</div>
          <button class="btn-ghost w-full justify-center" id="wl-notify" ${wl.some((w) => !w.notified) ? '' : 'disabled'}>${icon('campaign', 'text-[16px]')} Kabari daftar tunggu (kursi tersedia: ${Evt.stats(e.id).available})</button></section></div></div>`;
  }

  // ------------------------------------------------------------------ modal detail transaksi
  function orderModal(id) {
    const o = Evt.s.orders[id]; const e = Evt.ev(o.ev);
    const root = UI.modal(icon('receipt_long', 'text-primary text-[22px] align-middle') + ' Transaksi ' + o.id, `
      <div class="grid grid-cols-2 gap-5">
        <div class="flex flex-col gap-3"><div class="flex items-center gap-2">${oChip(o)}<span class="font-label-md text-label-md text-on-surface-variant">${o.method || ''}</span></div>
          ${isMgr() ? `<form id="f-contact" class="flex flex-col gap-3"><label class="f">Nama pemesan<input class="inp" name="name" value="${esc(o.name)}"></label><label class="f">Email<input class="inp" name="email" value="${esc(o.email)}"></label><label class="f">WhatsApp<input class="inp" name="phone" value="${esc(o.phone)}"></label>
            ${o.tickets.map((tid, i) => `<label class="f">Pemegang tiket ${i + 1} (${Evt.s.tickets[tid].seat || 'berdiri'})<input class="inp" name="h${i}" value="${esc(Evt.s.tickets[tid].holder)}"></label>`).join('')}
            <button class="btn-ghost self-start">${icon('save', 'text-[16px]')} Simpan perubahan data</button></form>` : `<div class="inner p-3 flex flex-col gap-1 font-body-sm text-body-sm"><b>${esc(o.name)}</b><span class="text-on-surface-variant">${esc(o.email)} · ${esc(o.phone)}</span>${o.tickets.map((tid) => `<span>${esc(Evt.s.tickets[tid].seat || 'Berdiri')} · ${esc(Evt.s.tickets[tid].holder)}</span>`).join('')}</div><p class="font-label-sm text-label-sm text-on-surface-variant">${icon('visibility', 'text-[14px] align-middle')} Mode pemantauan Command Center. Perubahan data, refund, dan pembatalan dilakukan di Konsol Pengelola.</p>`}</div>
        <div class="flex flex-col gap-3"><div class="inner p-3 font-body-sm text-body-sm"><b>${esc(e.name)}</b><br>${o.items.map((i) => esc(Evt.typeById(e, i.type).name) + (i.seat ? ' · ' + i.seat : '')).join('<br>')}<div class="mt-2 flex justify-between"><span>Total</span><b>${rp(o.total)}</b></div></div>
          ${o.tickets.length ? `<div class="flex flex-col gap-2">${o.tickets.map((tid) => { const t = Evt.s.tickets[tid]; return `<div class="inner p-2 flex items-center gap-3"><div class="bg-white p-1 rounded">${Evt.qrSvg(Evt.qrText(t), 64)}</div><div class="font-label-md text-label-md">${t.id}<br><span class="${t.status === 'VOID' ? 'text-rose-300' : t.checkedInAt ? 'text-emerald-300' : 'text-on-surface-variant'}">${t.status === 'VOID' ? 'VOID' : t.checkedInAt ? 'Check-in ' + Evt.fmtTime(t.checkedInAt) + ' · ' + esc(t.gate) : 'Belum check-in'}</span></div></div>`; }).join('')}</div>` : ''}
          <div class="lbl mt-1">Riwayat</div><div class="flex flex-col gap-1 font-body-sm text-body-sm text-on-surface-variant">${(o.log || []).map((l) => `<div>${Evt.fmtDT(l.ts)} · ${esc(l.text)}</div>`).join('') || '-'}</div>
          <div class="flex flex-wrap gap-2 mt-2">${!isMgr() ? '' : o.status === 'PAID' ? `<button class="btn-ghost" id="o-resend">${icon('forward_to_inbox', 'text-[16px]')} Kirim ulang e-ticket</button><button class="btn-danger" id="o-refund">${icon('currency_exchange', 'text-[16px]')} Refund</button>` : ''}${o.status === 'PENDING' && o.until > Evt.now() ? `<button class="btn-ghost" id="o-cancel">${icon('cancel', 'text-[16px]')} Batalkan pesanan</button>` : ''}</div></div></div>`, { wide: true });
    if (!isMgr()) return;
    root.querySelector('#f-contact').addEventListener('submit', async (ev) => { ev.preventDefault(); const f = Object.fromEntries(new FormData(ev.target)); const holders = o.tickets.map((_, i) => f['h' + i]); if (await act(() => Evt.updateContact(id, { name: f.name, email: f.email, phone: f.phone, holders }), 'Data peserta ' + id + ' diperbarui')) UI.closeModal(); });
    const rs = root.querySelector('#o-resend'); if (rs) rs.addEventListener('click', () => act(() => Evt.resend(id), 'E-ticket dikirim ulang (simulasi)'));
    const rf = root.querySelector('#o-refund'); if (rf) rf.addEventListener('click', async () => { const reason = prompt('Alasan refund:', 'Permintaan peserta'); if (reason == null) return; if ((await act(() => Evt.refund(id, reason), 'Refund ' + id + ' diproses, kursi kembali tersedia')) !== null) UI.closeModal(); });
    const cc = root.querySelector('#o-cancel'); if (cc) cc.addEventListener('click', async () => { if ((await act(() => Evt.cancel(id, 'panitia'), 'Pesanan dibatalkan')) !== null) UI.closeModal(); });
  }
  // Field tiket insiden anomali gate (SOP-EVT-03, P2). Dipakai tombol manual dan jembatan otomatis (evt/cc-bridge.js).
  function incidentFields(e, gate, text, source) {
    return { title: 'Indikasi tiket palsu/calo di ' + gate, desc: (text ? text + ' ' : '') + 'Acara ' + e.name + '. Pindaian QR gagal/duplikat berulang (lihat log check-in DB-EVT).', sop: 'SOP-EVT-03', priority: 'P2', category: 'Keamanan, Parkir & Crowd', zone: 'GF', location: gate + ' · ' + e.venue.split(',')[0], source: source || 'Check-in event (DB-EVT)', cam: 'CAM-01', team: 'Regu Bravo', fromDb: 'EVT' };
  }
  function incident(e, gate, report) {
    Shell.newTicket(incidentFields(e, gate, report && report.text));
    const t0 = Store.s.tickets.length;
    const watch = Store.subscribe(() => { if (Store.s.tickets.length > t0) { watch(); const tk = Store.s.tickets[0]; if (report) Evt.linkReport(report.id, tk.id); } });
  }

  // ------------------------------------------------------------------ tab pengelola: daftar acara (tambah / batalkan / hapus)
  function acara() {
    const t = Evt.now();
    const evs = Evt.s.order.map(Evt.ev);
    const rows = evs.map((e) => { const s = Evt.stats(e.id); const cap = s.total - s.blocked; const live = s.orders.filter((o) => o.status === 'PAID' || (o.status === 'PENDING' && o.until > t)).length;
      return `<tr><td class="font-label-lg text-label-lg whitespace-nowrap"><span class="inline-block w-2.5 h-2.5 rounded-full mr-2" style="background:${e.color}"></span>${e.id}</td>
        <td><div class="font-label-lg text-label-lg">${esc(e.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${esc(e.cat)} · ${esc(e.venue.split('·')[0].trim())}</div></td>
        <td class="font-body-sm text-body-sm whitespace-nowrap">${Evt.fmtShort(e.start)}<div class="font-label-sm text-label-sm text-on-surface-variant">${Evt.fmtTime(e.start)} WIB</div></td>
        <td>${evChip(e)}<div class="font-label-sm text-label-sm text-on-surface-variant mt-1">${esc(Evt.saleState(e).label)}</div></td>
        <td class="min-w-[140px]"><div class="font-label-md text-label-md mb-1">${num(s.sold)} / ${num(cap)}</div>${UI.bar(cap ? (s.sold / cap) * 100 : 0, 'bg-secondary')}</td>
        <td class="font-label-md text-label-md whitespace-nowrap">${rp(s.revenue)}</td>
        <td><div class="flex gap-1.5 justify-end whitespace-nowrap">
          <button class="chip-btn" data-manage="${e.id}">${icon('edit_calendar', 'text-[14px]')} Kelola</button>
          ${e.status === 'DRAFT' ? `<button class="chip-btn" data-publish="${e.id}">${icon('publish', 'text-[14px]')} Publikasikan</button>` : ''}
          ${e.status !== 'DRAFT' ? `<a class="chip-btn" href="pengunjung.html#/e/${e.id}" target="_blank">${icon('open_in_new', 'text-[14px]')} Portal</a>` : ''}
          ${e.status !== 'CANCELLED' ? `<button class="chip-btn !text-amber-300" data-cancel-ev="${e.id}" data-live="${live}">${icon('event_busy', 'text-[14px]')} Batalkan</button>` : ''}
          <button class="chip-btn !text-rose-300" data-del-ev="${e.id}">${icon('delete', 'text-[14px]')} Hapus</button></div></td></tr>`; }).join('');
    const tot = evs.reduce((a, e) => { const s = Evt.stats(e.id); a.sold += s.sold; a.rev += s.revenue; return a; }, { sold: 0, rev: 0 });
    return `<div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      ${UI.kpi({ label: 'Total acara', icon: 'event_note', value: evs.length, foot: evs.filter((e) => e.status === 'PUBLISHED').length + ' dipublikasikan, ' + evs.filter((e) => e.status === 'DRAFT').length + ' draft' })}
      ${UI.kpi({ label: 'Tiket terjual', icon: 'confirmation_number', value: num(tot.sold), foot: 'semua acara' })}
      ${UI.kpi({ label: 'Pendapatan', icon: 'payments', value: rpJt(tot.rev), unit: tot.rev >= 1e6 ? 'Jt' : '', foot: 'transaksi lunas' })}
      ${UI.kpi({ label: 'Dibatalkan', icon: 'event_busy', value: evs.filter((e) => e.status === 'CANCELLED').length, vcls: 'text-on-surface', foot: 'refund otomatis ke peserta' })}</div>
    <section class="card p-5">${UI.h('Daftar acara', 'Tambah acara baru, publikasikan, batalkan (refund otomatis), atau hapus acara', `<button class="btn" id="new-ev">${icon('add')} Acara baru</button>`, 'event_note')}
      ${evs.length ? `<div class="overflow-x-auto"><table class="tbl"><thead><tr><th>ID</th><th>Acara</th><th>Jadwal</th><th>Status</th><th>Terjual</th><th>Pendapatan</th><th class="text-right">Aksi</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="font-body-sm text-body-sm text-on-surface-variant">Belum ada acara. Klik <b>Acara baru</b>.</div>'}
      <div class="inner p-3 mt-4 font-body-sm text-body-sm text-on-surface-variant">${icon('info', 'text-[16px] align-middle')} <b>Hapus</b> hanya untuk acara tanpa transaksi lunas/menunggu bayar (mis. draft atau salah input). Acara yang sudah terjual harus <b>dibatalkan</b> dulu agar semua peserta di-refund dan dikabari.</div></section>`;
  }
  function newEventModal() {
    const r = UI.modal(icon('add', 'text-primary align-middle') + ' Acara baru', `<form id="f-new-ev" class="grid grid-cols-2 gap-4">
      <label class="f col-span-2">Nama acara<input class="inp" name="name" required maxlength="80"></label>
      <label class="f col-span-2">Tagline<input class="inp" name="tagline" maxlength="120"></label>
      <label class="f">Kategori<input class="inp" name="cat" value="Umum"></label>
      <label class="f">Mulai acara<input class="inp" type="datetime-local" name="start" required value="${dtl(Math.ceil((Evt.now() + 14 * 86400000) / 3600000) * 3600000)}"></label>
      <label class="f col-span-2">Venue & denah templat<select class="inp" name="template">${Object.entries(Evt.TEMPLATES).map(([k, T]) => `<option value="${k}">${esc(T.name)}</option>`).join('')}</select></label>
      <label class="f col-span-2">Deskripsi<textarea class="inp" name="desc" rows="2"></textarea></label>
      <p class="col-span-2 font-body-sm text-body-sm text-on-surface-variant">Acara dibuat sebagai <b>Draft</b> (belum tampil di portal pengunjung) dengan denah & jenis tiket dari templat. Atur harga, kuota, gate, dan periode jual di tab Kelola acara, lalu publikasikan.</p>
      <div class="col-span-2 flex justify-end gap-2"><button type="button" class="btn-ghost" data-close>Batal</button><button class="btn">${icon('add')} Buat acara</button></div></form>`);
    r.querySelector('#f-new-ev').addEventListener('submit', async (ev) => {
      ev.preventDefault(); const f = Object.fromEntries(new FormData(ev.target)); const start = new Date(f.start).getTime();
      if (!(start > Evt.now())) return UI.toast('Waktu mulai sudah lewat. Pilih waktu setelah sekarang.', 'P2');
      const id = await act(() => Evt.addEvent({ name: f.name.trim(), tagline: f.tagline.trim(), cat: f.cat.trim() || 'Umum', desc: f.desc.trim(), start, template: f.template }), 'Acara dibuat sebagai draft. Lengkapi datanya lalu publikasikan.');
      if (id) { UI.closeModal(); ui.ev = id; ui.tab = 'kelola'; redraw(); }
    });
  }

  // ------------------------------------------------------------------ tab Command Center: portofolio event 360 (hanya baca)
  function portofolio() {
    const t = Evt.now(), D = 86400000; const d0 = new Date(t); d0.setHours(0, 0, 0, 0);
    const evs = Evt.s.order.map(Evt.ev).filter((e) => e.status !== 'DRAFT');
    const st = evs.map((e) => ({ e, s: Evt.stats(e.id), an: EvtCheckin.anomalies(e.id).length, rep: Evt.s.reports.filter((r) => r.ev === e.id && !r.ticketId).length }));
    const active = st.filter((x) => x.e.status !== 'CANCELLED' && x.e.start > t - 6 * 3600000);
    const ckToday = Object.values(Evt.s.tickets).filter((k) => k.checkedInAt >= d0.getTime()).length;
    const sum = (f) => st.reduce((a, x) => a + f(x), 0);
    const anomN = sum((x) => x.an), repN = sum((x) => x.rep);
    const up = active.filter((x) => x.e.start < t + 30 * D).sort((a, b) => a.e.start - b.e.start);
    const draft = Evt.s.order.map(Evt.ev).filter((e) => e.status === 'DRAFT').length;
    return `<div class="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-5">
      ${UI.kpi({ label: 'Acara aktif', icon: 'event_available', value: active.length, foot: draft + ' draft disiapkan pengelola' })}
      ${UI.kpi({ label: 'Tiket terjual', icon: 'confirmation_number', value: num(sum((x) => x.s.sold)), foot: 'seluruh acara dipublikasikan' })}
      ${UI.kpi({ label: 'Pendapatan event', icon: 'payments', value: rpJt(sum((x) => x.s.revenue)), unit: sum((x) => x.s.revenue) >= 1e6 ? 'Jt' : '', foot: 'potensi bagi hasil venue' })}
      ${UI.kpi({ label: 'Check-in hari ini', icon: 'how_to_reg', value: num(ckToday), vcls: 'text-emerald-300', foot: 'pengunjung event masuk mall' })}
      ${UI.kpi({ label: 'Anomali gate', icon: 'gpp_maybe', value: anomN, vcls: anomN ? 'text-rose-300' : 'text-on-surface', foot: 'indikasi tiket palsu/calo' })}
      ${UI.kpi({ label: 'Laporan lapangan', icon: 'campaign', value: repN, vcls: repN ? 'text-amber-300' : 'text-on-surface', foot: 'menunggu tiket insiden' })}</div>
    <div class="grid grid-cols-1 2xl:grid-cols-12 gap-5 mb-5">
      <section class="card p-5 2xl:col-span-8">${UI.h('Portofolio acara', 'Semua acara di Summarecon Mall Bandung. Klik baris untuk detail (data dari Konsol Pengelola, hanya baca)', `<a class="btn-ghost" href="pengelola.html" target="_blank">${icon('open_in_new', 'text-[16px]')} Konsol Pengelola</a>`, 'travel_explore')}
        <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>Acara</th><th>Jadwal</th><th>Status</th><th class="w-[22%]">Okupansi</th><th>Pendapatan</th><th>Kehadiran</th><th>Gate</th></tr></thead><tbody>
        ${st.map(({ e, s, an, rep }) => { const cap = s.total - s.blocked; return `<tr class="row" data-goto="${e.id}"><td><div class="font-label-lg text-label-lg"><span class="inline-block w-2.5 h-2.5 rounded-full mr-2" style="background:${e.color}"></span>${esc(e.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${e.id} · ${esc(e.cat)} · ${esc(e.venue.split('·')[0].trim())}</div></td>
          <td class="font-body-sm text-body-sm whitespace-nowrap">${Evt.fmtShort(e.start)} · ${Evt.fmtTime(e.start)}</td><td>${evChip(e)}</td>
          <td><div class="font-label-md text-label-md mb-1">${num(s.sold)}/${num(cap)} · ${cap ? Math.round((s.sold / cap) * 100) : 0}%</div>${UI.bar(cap ? (s.sold / cap) * 100 : 0, 'bg-secondary')}</td>
          <td class="font-label-md text-label-md whitespace-nowrap">${rp(s.revenue)}</td><td class="font-label-md text-label-md">${s.tickets ? Math.round((s.checkedIn / s.tickets) * 100) + '%' : '-'}</td>
          <td>${an || rep ? UI.chip((an + rep) + ' peringatan', 'bg-rose-500/15 text-rose-300') : '<span class="font-label-sm text-label-sm text-emerald-300">Normal</span>'}</td></tr>`; }).join('') || '<tr><td colspan="7" class="text-on-surface-variant">Belum ada acara dipublikasikan.</td></tr>'}
        </tbody></table></div></section>
      <section class="card p-5 2xl:col-span-4">${UI.h('Dampak operasional mall', 'Proyeksi 30 hari dari tiket terjual, dasar persiapan lintas dashboard', '', 'hub')}
        <div class="flex flex-col gap-3">${up.map(({ e, s }) => `<div class="inner p-3 flex flex-col gap-1.5 font-body-sm text-body-sm"><div class="flex justify-between gap-2"><b>${esc(e.name)}</b><span class="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">${Evt.fmtShort(e.start)}</span></div>
          <div class="flex items-center gap-2">${icon('local_parking', 'text-primary text-[16px]')} +${num(Math.round(s.sold * 0.42))} kendaraan · ${UI.dbLink('PARK', '', 'Parkir & Mobilitas')}</div>
          <div class="flex items-center gap-2">${icon('groups', 'text-primary text-[16px]')} ${num(s.sold)} orang, puncak ${Evt.fmtTime(e.doors + 3600000)} · ${UI.dbLink('CCTV', 'cam=CAM-01', 'CCTV')}</div>
          <div class="flex items-center gap-2">${icon('hvac', 'text-primary text-[16px]')} Pre-cooling ${Evt.fmtTime(e.doors - 3600000)} · ${UI.dbLink('BMS', '', 'BMS')}</div>
          <div class="flex items-center gap-2">${icon('shield_person', 'text-primary text-[16px]')} ${Math.ceil(s.sold / 75) + 2} personel keamanan · ${e.gates.length} gate</div></div>`).join('') || '<div class="font-body-sm text-body-sm text-on-surface-variant">Tidak ada acara dalam 30 hari ke depan.</div>'}</div></section></div>
    ${UI.relasi('EVT')}`;
  }

  // ------------------------------------------------------------------ tab Command Center: gate & keamanan (pantau, tanpa pemindai)
  function gate(e) {
    return `<div class="grid grid-cols-1 2xl:grid-cols-12 gap-5">
      <div class="2xl:col-span-5 flex flex-col gap-5">${anomPanel(e)}
        <section class="card p-5">${UI.h('Kehadiran per gate', 'Pemindaian dilakukan petugas gate pengelola (ponsel atau konsol)', '', 'how_to_reg')}<div id="ck-stats">${ckStats(e, true)}</div></section></div>
      <section class="card p-5 2xl:col-span-7">${UI.h('Log pindaian', 'Semua gate', '', 'list_alt')}<div id="ck-log">${EvtCheckin.logTable(e.id, 30)}</div></section></div>`;
  }

  // ------------------------------------------------------------------ view
  function body() {
    if (ui.tab === 'acara') return acara();
    if (ui.tab === 'portofolio') return portofolio();
    const e = Evt.ev(ui.ev); const s = Evt.stats(ui.ev);
    return { ringkasan, kursi, kelola, peserta, keuangan, checkin, notif, gate }[ui.tab](e, s);
  }
  function header() {
    const tabs = TABS[ROLE]; const global = GLOBAL_TABS.includes(ui.tab);
    const links = isMgr()
      ? `<a class="btn-ghost" href="pengunjung.html" target="_blank">${icon('open_in_new', 'text-[16px]')} Portal pengunjung</a><a class="btn-ghost" href="checkin.html" target="_blank">${icon('qr_code_scanner', 'text-[16px]')} Check-in ponsel</a><button class="btn-ghost" id="evt-reset" title="Kembalikan data event ke kondisi awal">${icon('restart_alt', 'text-[16px]')} Reset</button>`
      : `<a class="btn-ghost" href="pengelola.html" target="_blank">${icon('admin_panel_settings', 'text-[16px]')} Konsol Pengelola</a><a class="btn-ghost" href="pengunjung.html" target="_blank">${icon('open_in_new', 'text-[16px]')} Portal pengunjung</a>`;
    let h = Evt.modeBanner() + `<section class="card pagebar">
      <div class="pagebar-info">
        ${Evt.mode === 'server' ? '<span class="stat live"><span class="dot"></span>Server LAN</span><span class="stat">Versi data <b>' + Evt.version + '</b></span>' : '<span class="stat live"><span class="dot warn"></span>Mode lokal (1 perangkat)</span>'}
        ${isMgr() ? UI.chip('Event Organizer, kendali penuh', 'bg-primary/15 text-primary') : UI.chip('Manajemen mal, read-only', 'bg-secondary/15 text-secondary')}
      </div>
      <div class="pagebar-actions">${links}</div>
      <div class="pagebar-row" role="tablist">${tabs.map(([k, l, i]) => `<button class="chip-btn !py-2 !px-3 ${ui.tab === k ? 'on' : ''}" role="tab" aria-selected="${ui.tab === k}" data-tab="${k}">${icon(i, 'text-[16px]')} ${l}</button>`).join('')}</div></section>`;
    if (global) return h;
    const e = Evt.ev(ui.ev); const sale = Evt.saleState(e);
    h += `<div class="flex flex-wrap gap-2 mb-3">${Evt.s.order.filter((id) => isMgr() || Evt.ev(id).status !== 'DRAFT').map((id) => { const x = Evt.ev(id); return `<button class="chip-btn ${id === ui.ev ? 'on' : ''}" data-ev="${id}" title="${esc(x.name)}">${id} · ${esc(x.name.length > 28 ? x.name.slice(0, 28) + '…' : x.name)}${x.status === 'CANCELLED' ? ' (batal)' : x.status === 'DRAFT' ? ' (draft)' : ''}</button>`; }).join('')}</div>
    <section class="card p-5 mb-5 flex flex-wrap items-center gap-5" style="background:linear-gradient(110deg, ${e.color}22, rgb(var(--surface-container)) 55%)">
      <div class="flex-1 min-w-[280px]"><div class="font-label-sm text-label-sm text-secondary">${esc(e.cat)} · ${e.id}</div><h2 class="font-headline-lg text-headline-lg">${esc(e.name)}</h2><div class="font-body-sm text-body-sm text-on-surface-variant">${Evt.fmtDate(e.start)} · ${Evt.fmtTime(e.start)} WIB · gate ${Evt.fmtTime(e.doors)} · ${esc(e.venue)}</div></div>
      <div class="flex flex-col items-end gap-1"><div class="flex gap-2">${evChip(e)}${UI.chip(esc(sale.label), sale.open ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/20 text-slate-300')}</div><span class="font-label-sm text-label-sm text-on-surface-variant">Jual ${Evt.fmtDT(e.saleStart)} sampai ${Evt.fmtDT(e.saleEnd)}, hold ${e.holdMin} mnt, maks ${e.maxPerOrder}/pesanan</span></div></section>`;
    return h;
  }
  function normalize() {
    const tabs = TABS[ROLE].map((x) => x[0]);
    if (!tabs.includes(ui.tab)) ui.tab = tabs[0];
    const pool = Evt.s.order.filter((id) => isMgr() || Evt.ev(id).status !== 'DRAFT');
    if (!pool.includes(ui.ev)) ui.ev = pool[0] || null;
    if (!ui.ev) ui.tab = tabs[0]; // tidak ada acara → hanya tab lintas acara
  }
  function draw(root) {
    const el = root && root.querySelector('#evt-root'); if (!el) return;
    normalize();
    el.innerHTML = header() + `<div id="evt-body">${body()}</div>`;
    bind(el);
  }
  function refresh() {
    const el = document.getElementById('evt-root');
    if (!el) { if (unsub) { unsub(); unsub = null; } EvtCheckin.stopCam(); return; }
    if (ui.tab === 'kelola' && Evt.ev(ui.ev)) return; // jangan timpa form yang sedang diisi
    if (document.getElementById('modal-root').innerHTML) return;
    const e = Evt.ev(ui.ev);
    if (!e || GLOBAL_TABS.includes(ui.tab) || ui.tab === 'gate') { const y = window.scrollY; draw(host); window.scrollTo(0, y); return; }
    if (ui.tab === 'checkin') { el.querySelector('#ck-stats').innerHTML = ckStats(e); el.querySelector('#ck-log').innerHTML = EvtCheckin.logTable(e.id, 30); bindInc(el); return; }
    if (ui.tab === 'peserta') { el.querySelector('#evt-table').innerHTML = pesertaTable(e); bindRows(el); return; }
    const y = window.scrollY; draw(host); window.scrollTo(0, y);
  }
  function bindRows(el) { el.querySelectorAll('[data-order]').forEach((b) => b.addEventListener('click', () => orderModal(b.dataset.order))); }
  function bindInc(el) {
    const e = Evt.ev(ui.ev);
    if (!e) return;
    el.querySelectorAll('[data-report]').forEach((b) => b.addEventListener('click', async () => { b.disabled = true; if ((await act(() => Evt.report(e.id, b.dataset.report, 'Pengelola melaporkan pindaian QR gagal/duplikat berulang di ' + b.dataset.report + ' (indikasi tiket palsu/calo). Mohon dukungan keamanan mall.'), 'Laporan terkirim ke Command Center')) === null) b.disabled = false; }));
    if (isMgr()) return;
    el.querySelectorAll('[data-inc]').forEach((b) => b.addEventListener('click', () => incident(e, b.dataset.inc)));
    el.querySelectorAll('[data-rep]').forEach((b) => b.addEventListener('click', () => { const r = Evt.s.reports.find((x) => x.id === b.dataset.rep); incident(e, r.gate, r); }));
  }
  function bind(el) {
    const e = Evt.ev(ui.ev);
    el.querySelectorAll('[data-ev]').forEach((b) => b.addEventListener('click', () => { ui.ev = b.dataset.ev; ui.seatSel = null; ui.race = null; redraw(); }));
    el.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { EvtCheckin.stopCam(); ui.tab = b.dataset.tab; redraw(); }));
    el.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => { ui.ev = b.dataset.goto; ui.tab = 'ringkasan'; redraw(); }));
    const rs = el.querySelector('#evt-reset'); if (rs) rs.addEventListener('click', async () => { if (!confirm('Reset seluruh data Event Ticketing (semua perangkat di LAN) ke kondisi awal?')) return; try { await Evt.reset(); } catch (err) { return UI.toast(esc(err.message), 'P2'); } ui.seatSel = null; ui.race = null; redraw(); UI.toast('Data event direset', 'P4'); });
    bindRows(el); bindInc(el);
    // daftar acara (pengelola)
    if (isMgr()) {
      const ne = el.querySelector('#new-ev'); if (ne) ne.addEventListener('click', newEventModal);
      el.querySelectorAll('[data-manage]').forEach((b) => b.addEventListener('click', () => { ui.ev = b.dataset.manage; ui.tab = 'kelola'; redraw(); }));
      el.querySelectorAll('[data-publish]').forEach((b) => b.addEventListener('click', () => act(() => Evt.updateEvent(b.dataset.publish, { status: 'PUBLISHED' }), b.dataset.publish + ' dipublikasikan ke portal pengunjung').then(redraw)));
      el.querySelectorAll('[data-cancel-ev]').forEach((b) => b.addEventListener('click', async () => {
        const x = Evt.ev(b.dataset.cancelEv);
        const reason = prompt(`Batalkan "${x.name}"?\n${b.dataset.live} pesanan aktif akan di-refund/dibatalkan otomatis dan peserta dikabari.\n\nAlasan pembatalan:`, 'Keputusan panitia');
        if (reason == null) return;
        const r = await act(() => Evt.cancelEvent(x.id, reason.trim()));
        if (r) { UI.toast(`${x.id} dibatalkan. ${r.refunded} pesanan di-refund (${rp(r.total)}), ${r.cancelled} pesanan menunggu bayar dibatalkan`, 'P3'); redraw(); }
      }));
      el.querySelectorAll('[data-del-ev]').forEach((b) => b.addEventListener('click', async () => {
        const x = Evt.ev(b.dataset.delEv);
        if (!confirm(`Hapus permanen "${x.name}" (${x.id})?\nDenah, data peserta, log check-in, dan notifikasi acara ini ikut terhapus.`)) return;
        const name = await act(() => Evt.deleteEvent(x.id));
        if (name) { UI.toast('Acara "' + esc(name) + '" dihapus', 'P4'); redraw(); }
      }));
    }
    if (!e) return;
    // denah
    el.querySelectorAll('[data-smode]').forEach((b) => b.addEventListener('click', () => { ui.seatMode = b.dataset.smode; redraw(); }));
    el.querySelectorAll('.admin-map [data-seat]').forEach((b) => b.addEventListener('click', () => {
      if (isMgr() && ui.seatMode === 'block') act(() => Evt.toggleBlock(e.id, b.dataset.seat), 'Status jual kursi ' + b.dataset.seat + ' diubah');
      else { ui.seatSel = b.dataset.seat; redraw(); }
    }));
    const race = el.querySelector('#race'); if (race) race.addEventListener('click', async () => {
      const free = Evt.allSeats(e).filter((x) => Evt.seatStatus(e.id, x, null) === 'available');
      if (!free.length) return UI.toast('Tidak ada kursi tersedia untuk demo', 'P3');
      const seat = free[Math.floor(Math.random() * free.length)];
      const log = await act(() => Evt.raceDemo(e.id, seat)); if (log) { ui.race = log; ui.seatSel = seat; redraw(); }
    });
    const stress = el.querySelector('#stress'); if (stress) stress.addEventListener('click', async () => {
      const seat = ui.seatSel && Evt.seatStatus(e.id, ui.seatSel, null) === 'available' ? ui.seatSel : Evt.allSeats(e).find((x) => Evt.seatStatus(e.id, x, null) === 'available');
      if (!seat) return UI.toast('Tidak ada kursi tersedia untuk uji tekan', 'P3');
      stress.disabled = true;
      const r = await act(() => Evt.stressTest(e.id, seat, 25));
      stress.disabled = false;
      if (r) { ui.race = r.log; ui.seatSel = seat; redraw(); UI.toast(`Uji tekan: ${r.n - r.rejected} berhasil, ${r.rejected} ditolak`, 'P4'); }
    });
    // kelola
    const fe = el.querySelector('#f-ev'); if (fe) fe.addEventListener('submit', (ev) => {
      ev.preventDefault(); const f = Object.fromEntries(new FormData(fe));
      const p = { name: f.name, tagline: f.tagline, cat: f.cat, status: f.status, venue: f.venue, desc: f.desc, start: new Date(f.start).getTime(), doors: new Date(f.doors).getTime(), saleStart: new Date(f.saleStart).getTime(), saleEnd: new Date(f.saleEnd).getTime(), holdMin: +f.holdMin, maxPerOrder: +f.maxPerOrder, gates: f.gates.split(',').map((x) => x.trim()).filter(Boolean),
        fin: { rent: Math.max(0, +f.finRent || 0), revShare: Math.min(100, Math.max(0, +f.finShare || 0)) / 100, cost: Math.max(0, +f.finCost || 0), spend: Math.max(0, +f.finSpend || 0) } };
      if (p.saleEnd <= p.saleStart) return UI.toast('Waktu penjualan ditutup harus setelah penjualan dibuka.', 'P2');
      if (p.doors > p.start) return UI.toast('Jam gate dibuka harus sebelum acara mulai.', 'P2');
      act(() => Evt.updateEvent(e.id, p), 'Acara ' + e.id + ' disimpan').then(() => redraw());
    });
    el.querySelectorAll('form[data-type]').forEach((fm) => fm.addEventListener('submit', (ev) => {
      ev.preventDefault(); const f = Object.fromEntries(new FormData(fm));
      const p = { name: f.name, price: Math.max(0, +f.price), onSale: f.onSale === '1', perks: f.perks }; if (f.quota != null) p.quota = +f.quota;
      act(() => Evt.updateType(e.id, fm.dataset.type, p), 'Tiket ' + fm.dataset.type + ' disimpan').then(() => redraw());
    }));
    // peserta
    const q = el.querySelector('#q'); if (q) q.addEventListener('input', () => { ui.q = q.value; el.querySelector('#evt-table').innerHTML = pesertaTable(e); bindRows(el); });
    el.querySelectorAll('button[data-st]:not([data-seat])').forEach((b) => b.addEventListener('click', () => { ui.st = b.dataset.st; redraw(); }));
    const cp = el.querySelector('#csv-p'); if (cp) cp.addEventListener('click', () => {
      const rows = [['Acara', 'ID Tiket', 'Booking', 'Kategori', 'Kursi', 'Pemegang', 'Pemesan', 'Email', 'WhatsApp', 'Status Tiket', 'Check-in', 'Gate']];
      Object.values(Evt.s.tickets).filter((t) => t.ev === e.id).forEach((t) => { const o = Evt.s.orders[t.order]; rows.push([e.name, t.id, o.id, Evt.typeById(e, t.type).name, t.seat || 'Berdiri', t.holder, o.name, o.email, o.phone, t.status, t.checkedInAt ? Evt.fmtDT(t.checkedInAt) : '', t.gate || '']); });
      Evt.csv('peserta_' + e.id + '.csv', rows);
    });
    const ct = el.querySelector('#csv-t'); if (ct) ct.addEventListener('click', () => {
      const rows = [['Booking', 'Acara', 'Pemesan', 'Email', 'WhatsApp', 'Jumlah Tiket', 'Kursi', 'Subtotal', 'Biaya Layanan', 'Total', 'Metode', 'Status', 'Dibuat', 'Dibayar', 'Catatan Refund']];
      Evt.stats(e.id).orders.forEach((o) => rows.push([o.id, e.name, o.name, o.email, o.phone, o.items.length, o.items.map((i) => i.seat || Evt.typeById(e, i.type).name).join(' '), o.sub, o.fee, o.total, o.method || '', o.status === 'PENDING' && o.until < Evt.now() ? 'EXPIRED' : o.status, Evt.fmtDT(o.createdAt), o.paidAt ? Evt.fmtDT(o.paidAt) : '', o.refundReason || '']));
      Evt.csv('transaksi_' + e.id + '.csv', rows);
    });
    // keuangan
    const cf = el.querySelector('#csv-fin'); if (cf) cf.addEventListener('click', () => {
      const rows = [['Booking', 'Acara', 'Metode', 'Status', 'Subtotal', 'Biaya Layanan', 'Total', 'Jumlah Tiket', 'Dibayar', 'Refund']];
      Object.values(Evt.s.orders).filter((o) => o.ev === e.id && (o.status === 'PAID' || o.status === 'REFUNDED')).forEach((o) => rows.push([o.id, e.name, o.method || '', o.status, o.sub, o.fee, o.total, o.items.length, o.paidAt ? Evt.fmtDT(o.paidAt) : '', o.refundedAt ? Evt.fmtDT(o.refundedAt) : '']));
      Evt.csv('rekonsiliasi_' + e.id + '.csv', rows);
    });
    // check-in
    const g = el.querySelector('#gate'); if (g) g.addEventListener('change', () => (ui.gate = g.value));
    if (ui.tab === 'checkin') EvtCheckin.mount(el, () => ui.ev, () => ui.gate);
    const dual = el.querySelector('#dual'); if (dual) dual.addEventListener('click', async () => {
      dual.disabled = true;
      const r = await act(() => Evt.dualGateTest(e.id));
      dual.disabled = false;
      if (r) { ui.dual = Object.assign({ ev: e.id }, r); EvtCheckin.stopCam(); redraw(); }
    });
    // notifikasi
    el.querySelectorAll('[data-ch]').forEach((b) => b.addEventListener('click', () => { ui.ch = b.dataset.ch; redraw(); }));
    const rm = el.querySelector('#remind'); if (rm) rm.addEventListener('click', async () => { const n = await act(() => Evt.sendReminders(e.id)); if (n != null) UI.toast('Pengingat dikirim ke ' + n + ' pemesan (email dan WhatsApp, simulasi)', 'P4'); });
    const wn = el.querySelector('#wl-notify'); if (wn) wn.addEventListener('click', async () => { const n = await act(() => Evt.notifyWaitlist(e.id)); if (n != null) UI.toast(n + ' orang di daftar tunggu dikabari', 'P4'); });
  }

  function mount(root, role) {
    ROLE = role === 'pengelola' ? 'pengelola' : 'mall'; host = root;
    Evt.init().then(() => {
      draw(root);
      if (!unsub) { let t = null; unsub = Evt.subscribe(() => { clearTimeout(t); t = setTimeout(refresh, 120); }); }
    });
  }
  const loading = `<div id="evt-root"><section class="card p-10 text-center text-on-surface-variant">${icon('progress_activity', 'animate-spin text-[32px]')}<br>Menghubungkan ke engine Event Ticketing…</section></div>`;
  window.EvtAdmin = {
    mount(root, role) { root.innerHTML = loading; mount(root, role); },
    open(params) { if (params.ev) ui.ev = params.ev; if (params.tab) ui.tab = params.tab; },
    incidentFields,
  };
  // Command Center: sudut pandang manajemen mall 360 (hanya baca)
  window.Views.event = {
    title: 'Pemantauan Event', live: false,
    render(params) { window.EvtAdmin.open(params); return loading; },
    mount(root) { mount(root, 'mall'); },
  };
})();
