/* Portal pengunjung (mobile-first): acara -> kategori & kursi -> data peserta -> ringkasan -> pembayaran sandbox -> e-ticket QR */
(function () {
  const E = window.Evt;
  const { esc, rp } = E;
  const ic = (n, c) => `<span class="material-symbols-outlined ${c || ''}">${n}</span>`;
  const app = document.getElementById('app');
  const cart = E.cartId();
  let cur = { name: 'home', args: [] };
  let filter = null; // kategori yang disorot di denah
  let payMethod = 'QRIS';
  let busy = false;

  // ---------------------------------------------------------------- util UI
  function toast(text, kind) {
    const col = { ok: '#10b981', err: '#f43f5e', info: '#38bdf8' }[kind || 'info'];
    const el = document.createElement('div');
    el.className = 'toast card-elev px-4 py-3 font-body-sm text-body-sm max-w-md w-full pointer-events-auto';
    el.style.borderLeft = '4px solid ' + col;
    el.innerHTML = text;
    document.getElementById('toast-root').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; }, 3800);
    setTimeout(() => el.remove(), 4300);
  }
  function modal(title, body) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center scrim" data-close>
      <div class="card-elev w-full max-w-xl rounded-b-none sm:rounded-2xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10"><h3 class="font-headline-sm text-headline-sm">${title}</h3><button class="btn-ghost !px-2" data-close>${ic('close')}</button></div>
        <div class="p-5">${body}</div></div></div>`;
    root.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', (e) => { if (e.target === el || el.tagName === 'BUTTON') root.innerHTML = ''; }));
    return root;
  }
  const closeModal = () => (document.getElementById('modal-root').innerHTML = '');
  async function act(p, okMsg) {
    if (busy) return null; busy = true;
    try { const r = await p(); if (okMsg) toast(okMsg, 'ok'); return r; } catch (e) { toast(ic('error', 'text-[18px] align-middle text-rose-300') + ' ' + esc(e.message), 'err'); return null; } finally { busy = false; }
  }
  const back = (href, label) => `<a href="${href}" class="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary mb-3">${ic('arrow_back', 'text-[16px]')} ${label}</a>`;
  const statusChip = (st) => {
    const m = { PENDING: ['Menunggu pembayaran', 'bg-amber-500/15 text-amber-300'], PAID: ['Lunas, e-ticket terbit', 'bg-emerald-500/15 text-emerald-300'], EXPIRED: ['Kedaluwarsa', 'bg-slate-500/20 text-slate-300'], CANCELLED: ['Dibatalkan', 'bg-slate-500/20 text-slate-300'], REFUNDED: ['Refund', 'bg-rose-500/15 text-rose-300'] }[st];
    return `<span class="px-2 py-0.5 rounded-md font-label-sm text-label-sm ${m[1]}">${m[0]}</span>`;
  };
  const avail = (e) => { const s = E.stats(e.id); const sale = e.types.filter((t) => t.onSale).map((t) => s.per[t.id]); const total = sale.reduce((a, p) => a + p.total - p.blocked, 0); const left = sale.reduce((a, p) => a + p.available, 0); return { left, total, pct: total ? (left / total) * 100 : 0 }; };

  // ---------------------------------------------------------------- views
  const V = {};
  V.home = () => {
    const evs = E.s.order.map(E.ev).filter((e) => e.status !== 'DRAFT');
    return `<section class="mb-5"><h1 class="font-headline-lg text-headline-lg">Acara di Summarecon Mall Bandung</h1>
      <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Pilih acara dan kursi di denah, bayar lewat simulasi sandbox, lalu terima e-ticket ber-QR.</p></section>
      <div class="flex flex-col gap-4">${evs.map((e) => {
        const a = avail(e); const sale = E.saleState(e); const min = Math.min(...e.types.filter((t) => t.onSale).map((t) => t.price));
        const sold = sale.open && a.left === 0;
        return `<a href="#/e/${e.id}" class="card p-0 overflow-hidden block hover:ring-1 hover:ring-primary-container/50">
          <div class="h-24 relative" style="background:linear-gradient(120deg, ${e.color}55, rgb(var(--surface-container-low)) 70%)"><div class="absolute inset-0 p-4 flex flex-col justify-between"><span class="self-start px-2 py-0.5 rounded bg-black/50 font-label-sm text-label-sm">${esc(e.cat)}</span><span class="font-label-md text-label-md text-white/90">${ic('calendar_month', 'text-[14px] align-middle')} ${E.fmtDate(e.start)} · ${E.fmtTime(e.start)} WIB</span></div></div>
          <div class="p-4"><h2 class="font-headline-sm text-headline-sm">${esc(e.name)}</h2><p class="font-body-sm text-body-sm text-on-surface-variant">${esc(e.tagline)}</p>
            <p class="font-label-md text-label-md text-on-surface-variant mt-2">${ic('location_on', 'text-[14px] align-middle')} ${esc(e.venue)}</p>
            <div class="flex items-center justify-between mt-3"><span class="font-label-lg text-label-lg text-primary">${min === 0 ? 'Gratis' : 'Mulai ' + rp(min)}</span>
              <span class="font-label-sm text-label-sm px-2 py-1 rounded-md ${sold ? 'bg-rose-500/15 text-rose-300' : sale.open ? (a.pct < 15 ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300') : 'bg-slate-500/20 text-slate-300'}">${sold ? 'Habis terjual' : sale.open ? (a.pct < 15 ? 'Hampir habis, sisa ' : 'Tersedia ') + a.left + ' tiket' : esc(sale.label)}</span></div>
            ${sale.open ? `<div class="mt-2">${bar(100 - a.pct, e.color)}</div>` : ''}</div></a>`;
      }).join('') || `<div class="card p-6 text-center font-body-sm text-body-sm text-on-surface-variant">Belum ada acara yang dipublikasikan.</div>`}</div>`;
  };
  const bar = (pct, col) => `<div class="h-1.5 rounded-full bg-surface-container-highest overflow-hidden"><div class="h-full rounded-full" style="width:${Math.max(2, Math.min(100, pct))}%;background:${col}"></div></div>`;

  V.event = (id) => {
    const e = E.ev(id); if (!e) return notFound();
    const s = E.stats(id); const sale = E.saleState(e);
    return `${back('#/', 'Semua acara')}
      <section class="card p-5 mb-4"><span class="font-label-sm text-label-sm text-secondary">${esc(e.cat)}</span>
        <h1 class="font-headline-md text-headline-md mt-1">${esc(e.name)}</h1><p class="font-body-sm text-body-sm text-on-surface-variant">${esc(e.tagline)}</p>
        <div class="grid grid-cols-1 gap-2 mt-4 font-body-sm text-body-sm">
          <div class="flex gap-2">${ic('calendar_month', 'text-primary text-[18px]')}<span>${E.fmtDate(e.start)}<br><span class="text-on-surface-variant">Mulai ${E.fmtTime(e.start)} WIB, gate dibuka ${E.fmtTime(e.doors)} WIB</span></span></div>
          <div class="flex gap-2">${ic('location_on', 'text-primary text-[18px]')}<span>${esc(e.venue)}</span></div>
          <div class="flex gap-2">${ic('schedule', 'text-primary text-[18px]')}<span>Periode penjualan ${E.fmtDT(e.saleStart)} sampai ${E.fmtDT(e.saleEnd)}</span></div>
        </div>
        <p class="font-body-sm text-body-sm text-on-surface-variant mt-3">${esc(e.desc)}</p></section>
      <section class="card p-5 mb-4"><h2 class="font-headline-sm text-headline-sm mb-3">Kategori tiket</h2><div class="flex flex-col gap-2">
        ${e.types.map((t) => { const p = s.per[t.id]; const sold = t.onSale && p.available === 0; return `<div class="inner p-3 flex items-center gap-3"><span class="w-3 h-10 rounded" style="background:${t.color}"></span><div class="flex-1 min-w-0"><div class="font-label-lg text-label-lg">${esc(t.name)} ${t.seated ? '' : '<span class="font-label-sm text-label-sm text-on-surface-variant">(tanpa nomor kursi)</span>'}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${esc(t.perks || '')}</div></div><div class="text-right"><div class="font-label-lg text-label-lg">${rp(t.price)}</div><div class="font-label-sm text-label-sm ${!t.onSale ? 'text-on-surface-variant' : sold ? 'text-rose-300' : p.available < 10 ? 'text-amber-300' : 'text-emerald-300'}">${!t.onSale ? 'Tidak dijual' : sold ? 'Habis' : 'Sisa ' + p.available}</div></div></div>`; }).join('')}
      </div></section>
      ${sale.open ? `<a href="#/e/${id}/kursi" class="btn w-full justify-center !py-3">${ic('event_seat')} Pilih kategori & kursi</a>` : `<div class="inner p-4 text-center font-body-sm text-body-sm text-on-surface-variant">${ic('info', 'text-[18px] align-middle')} ${esc(sale.label)}</div>`}`;
  };

  V.seats = (id) => {
    const e = E.ev(id); if (!e) return notFound();
    const s = E.stats(id); const sale = E.saleState(e);
    const h = E.cartHolds(id, cart);
    const pr = E.price(e, h.items);
    const fes = e.types.filter((t) => !t.seated && t.onSale);
    const seated = e.types.filter((t) => t.seated && t.onSale);
    const myQ = (tid) => h.items.filter((i) => i.type === tid && !i.seat).length;
    const sumByType = {}; h.items.forEach((i) => (sumByType[i.type] = (sumByType[i.type] || 0) + 1));
    return `${back('#/e/' + id, esc(e.name))}
      <h1 class="font-headline-md text-headline-md">Pilih kategori & kursi</h1>
      <p class="font-body-sm text-body-sm text-on-surface-variant mb-3">Ketuk kursi untuk memilih. Kursi langsung ditahan untukmu selama ${e.holdMin} menit. Maksimal ${e.maxPerOrder} tiket per pesanan.</p>
      ${!sale.open ? `<div class="inner p-3 mb-3 font-body-sm text-body-sm text-amber-300">${esc(sale.label)}. Denah hanya untuk dilihat.</div>` : ''}
      <div class="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-4 px-4">
        <button class="chip-btn ${!filter ? 'on' : ''}" data-filter="">Semua</button>
        ${seated.map((t) => `<button class="chip-btn ${filter === t.id ? 'on' : ''}" data-filter="${t.id}"><span class="w-2 h-2 rounded-full" style="background:${t.color}"></span>${esc(t.name)} · ${rp(t.price)} · sisa ${s.per[t.id].available}</button>`).join('')}
      </div>
      <section class="card p-3 mb-3">${E.seatMap(id, { cart, only: filter })}
        <p class="font-label-sm text-label-sm text-on-surface-variant text-center mt-1 sm:hidden">${ic('swipe', 'text-[14px] align-middle')} Geser denah ke kiri/kanan untuk melihat semua kursi</p></section>
      <section class="card p-4 mb-3">${E.legend(e)}</section>
      ${fes.map((t) => { const p = s.per[t.id]; const q = myQ(t.id); return `<section class="card p-4 mb-3 flex items-center gap-3"><span class="w-3 h-10 rounded" style="background:${t.color}"></span><div class="flex-1"><div class="font-label-lg text-label-lg">${esc(t.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${rp(t.price)} · sisa kuota ${p.available} dari ${p.total}</div></div>
        <div class="flex items-center gap-2"><button class="btn-ghost !px-2" data-qty="${t.id}" data-d="-1" ${q === 0 || !sale.open ? 'disabled' : ''} aria-label="Kurangi">${ic('remove')}</button><span class="w-6 text-center font-headline-sm text-headline-sm">${q}</span><button class="btn-ghost !px-2" data-qty="${t.id}" data-d="1" ${!sale.open || p.available === 0 ? 'disabled' : ''} aria-label="Tambah">${ic('add')}</button></div></section>`; }).join('')}
      ${e.types.filter((t) => t.onSale && s.per[t.id].available === 0).map((t) => `<div class="inner p-3 mb-3 flex items-center justify-between gap-3 font-body-sm text-body-sm"><span>${esc(t.name)} habis terjual.</span><button class="btn-ghost" data-wl="${t.id}">${ic('hourglass_top', 'text-[16px]')} Daftar tunggu</button></div>`).join('')}
      <details class="card p-4 mb-3"><summary class="flex items-center justify-between font-label-lg text-label-lg">${ic('verified_user', 'text-secondary text-[18px]')} <span class="flex-1 ml-2">Bagaimana kursi dijamin tidak dobel?</span>${ic('expand_more')}</summary>
        <ol class="list-decimal pl-5 mt-3 flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
          <li>Begitu kamu mengetuk kursi, kursi berstatus <b class="text-amber-300">sedang dipesan</b> untuk semua pengunjung lain selama ${e.holdMin} menit.</li>
          <li>Setiap pemesanan dicatat sebagai transaksi dengan nomor versi. Bila dua orang menekan kursi yang sama pada detik yang sama, server hanya menerima yang pertama; yang kedua otomatis ditolak.</li>
          <li>Saat pembayaran, sistem memeriksa ulang bahwa kursi masih ditahan untuk pesananmu dan belum kedaluwarsa, lalu kursi menjadi <b>terjual</b>.</li>
          <li>Jika waktu penahanan kursi atau batas pembayaran habis, kursi kembali tersedia untuk orang lain.</li></ol></details>
      <div class="fixed bottom-[60px] inset-x-0 z-30" style="margin-bottom: env(safe-area-inset-bottom)"><div class="max-w-xl mx-auto px-3"><div class="card-elev p-3 flex flex-col gap-2">
        ${h.items.length ? `<div class="flex items-center justify-between font-label-md text-label-md"><span class="text-on-surface-variant">${ic('lock_clock', 'text-[16px] align-middle text-amber-300')} Ditahan untukmu <b class="text-amber-300" data-until="${h.until}">--:--</b></span><button class="text-on-surface-variant hover:text-rose-300 font-label-sm text-label-sm" id="clear">Lepas semua</button></div>
          <div class="flex flex-wrap gap-1.5">${h.items.filter((i) => i.seat).map((i) => `<span class="px-2 py-0.5 rounded-md font-label-sm text-label-sm" style="background:${E.typeById(e, i.type).color}33;border:1px solid ${E.typeById(e, i.type).color}">${i.seat}</span>`).join('')}${Object.entries(sumByType).filter(([tid]) => !E.typeById(e, tid).seated).map(([tid, n]) => `<span class="px-2 py-0.5 rounded-md font-label-sm text-label-sm bg-white/10">${n}× ${esc(E.typeById(e, tid).name)}</span>`).join('')}</div>` : `<div class="font-body-sm text-body-sm text-on-surface-variant">Belum ada kursi dipilih.</div>`}
        <div class="flex items-center justify-between gap-3"><div><div class="font-label-sm text-label-sm text-on-surface-variant">${h.items.length} tiket${pr.fee ? ' + biaya layanan' : ''}</div><div class="font-headline-sm text-headline-sm">${h.items.length ? rp(pr.total) : '–'}</div></div>
          <a href="#/e/${id}/data" class="btn ${h.items.length ? '' : 'pointer-events-none opacity-40'}">Lanjut ${ic('arrow_forward', 'text-[18px]')}</a></div></div></div></div>`;
  };

  V.data = (id) => {
    const e = E.ev(id); if (!e) return notFound();
    const h = E.cartHolds(id, cart);
    if (!h.items.length) return `${back('#/e/' + id + '/kursi', 'Kembali ke denah')}<div class="card p-6 text-center">${ic('timer_off', 'text-[40px] text-amber-300')}<h2 class="font-headline-sm text-headline-sm mt-2">Waktu penahanan kursi habis</h2><p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Kursi sudah dilepas dan kini bisa dipesan orang lain.</p><a href="#/e/${id}/kursi" class="btn mt-4">Pilih kursi lagi</a></div>`;
    const pr = E.price(e, h.items);
    const saved = JSON.parse(sessionStorage.getItem('smicc-evt-form') || '{}');
    return `${back('#/e/' + id + '/kursi', 'Ubah kursi')}
      <h1 class="font-headline-md text-headline-md mb-3">Data peserta & ringkasan</h1>
      <form id="f-order" class="flex flex-col gap-4">
        <section class="card p-4 flex flex-col gap-3"><h2 class="font-headline-sm text-headline-sm">Data pemesan</h2>
          <label class="f">Nama lengkap<input class="inp" name="name" required autocomplete="name" value="${esc(saved.name || '')}" placeholder="Nama sesuai identitas"></label>
          <label class="f">Email (e-ticket dikirim ke sini)<input class="inp" name="email" type="email" required autocomplete="email" value="${esc(saved.email || '')}" placeholder="nama@email.com"></label>
          <label class="f">No. WhatsApp (pengingat acara)<input class="inp" name="phone" type="tel" required pattern="[0-9+\\- ]{9,16}" autocomplete="tel" value="${esc(saved.phone || '')}" placeholder="08xx-xxxx-xxxx"></label>
          ${h.items.length > 1 ? `<details><summary class="font-label-md text-label-md text-primary">${ic('group', 'text-[16px] align-middle')} Nama berbeda untuk tiap tiket (opsional)</summary><div class="flex flex-col gap-2 mt-2">${h.items.map((it, i) => `<label class="f">Tiket ${i + 1}: ${esc(E.typeById(e, it.type).name)}${it.seat ? ', kursi ' + it.seat : ''}<input class="inp" name="holder${i}" placeholder="Sama dengan pemesan"></label>`).join('')}</div></details>` : ''}
          <p class="font-label-sm text-label-sm text-on-surface-variant">Prototipe: gunakan data contoh, bukan data pribadi asli.</p></section>
        <section class="card p-4"><div class="flex items-center justify-between mb-2"><h2 class="font-headline-sm text-headline-sm">Ringkasan pesanan</h2><span class="font-label-md text-label-md text-amber-300">${ic('lock_clock', 'text-[16px] align-middle')} <span data-until="${h.until}">--:--</span></span></div>
          <div class="font-body-sm text-body-sm"><b>${esc(e.name)}</b><br><span class="text-on-surface-variant">${E.fmtDate(e.start)} · ${E.fmtTime(e.start)} WIB · ${esc(e.venue)}</span></div>
          <div class="mt-3 flex flex-col divide-y divide-white/5">${h.items.map((it) => { const t = E.typeById(e, it.type); return `<div class="flex justify-between py-2 font-body-sm text-body-sm"><span><span class="inline-block w-2 h-2 rounded-full mr-1" style="background:${t.color}"></span>${esc(t.name)}${it.seat ? ', kursi <b>' + it.seat + '</b>' : ', tanpa nomor kursi'}</span><span>${rp(t.price)}</span></div>`; }).join('')}
            <div class="flex justify-between py-2 font-body-sm text-body-sm text-on-surface-variant"><span>Biaya layanan</span><span>${pr.fee ? rp(pr.fee) : '–'}</span></div>
            <div class="flex justify-between py-2 font-headline-sm text-headline-sm"><span>Total</span><span>${rp(pr.total)}</span></div></div>
          <p class="font-label-sm text-label-sm text-on-surface-variant mt-1">Status: kursi ditahan, belum dibayar. Setelah pesanan dibuat, kamu punya ${E.PAY_MIN} menit untuk membayar.</p></section>
        <label class="flex items-start gap-2 font-body-sm text-body-sm"><input type="checkbox" required class="mt-1"> Saya setuju dengan syarat & ketentuan acara (simulasi) dan memastikan data sudah benar.</label>
        <button class="btn justify-center !py-3">${pr.total ? ic('payments') + ' Buat pesanan & bayar' : ic('how_to_reg') + ' Konfirmasi pendaftaran'}</button>
      </form>`;
  };

  V.order = (oid) => {
    const o = E.s.orders[oid]; if (!o) return notFound('Pesanan tidak ditemukan.');
    const e = E.ev(o.ev);
    const head = `${back('#/tiket', 'Tiket saya')}<div class="flex items-center justify-between mb-3"><div><div class="font-label-md text-label-md text-on-surface-variant">Kode booking</div><div class="font-headline-md text-headline-md">${o.id}</div></div>${statusChip(o.status)}</div>`;
    const summary = `<section class="card p-4 mb-4"><div class="font-body-sm text-body-sm"><b>${esc(e.name)}</b><br><span class="text-on-surface-variant">${E.fmtDate(e.start)} · ${E.fmtTime(e.start)} WIB · ${esc(e.venue)}</span></div>
      <div class="mt-2 flex flex-col divide-y divide-white/5">${o.items.map((it) => `<div class="flex justify-between py-1.5 font-body-sm text-body-sm"><span>${esc(E.typeById(e, it.type).name)}${it.seat ? ', kursi <b>' + it.seat + '</b>' : ''}</span><span>${rp(E.typeById(e, it.type).price)}</span></div>`).join('')}
      ${o.fee ? `<div class="flex justify-between py-1.5 font-body-sm text-body-sm text-on-surface-variant"><span>Biaya layanan</span><span>${rp(o.fee)}</span></div>` : ''}<div class="flex justify-between py-2 font-headline-sm text-headline-sm"><span>Total</span><span>${rp(o.total)}</span></div></div>
      <div class="font-label-sm text-label-sm text-on-surface-variant">${esc(o.name)} · ${esc(o.email)} · ${esc(o.phone)}</div></section>`;
    if (o.status === 'PENDING' && o.until > E.now()) return head + payView(o) + summary;
    if (o.status === 'PAID') return head + ticketsView(o, e) + summary;
    const msg = { EXPIRED: ['timer_off', 'Batas waktu pembayaran habis', 'Kursi sudah dilepas. Pesan ulang bila kursi masih tersedia.'], CANCELLED: ['cancel', 'Pesanan dibatalkan', 'Kursi sudah dilepas.'], REFUNDED: ['currency_exchange', 'Pesanan di-refund', (o.refundReason ? o.refundReason.replace(/\.?\s*$/, '. ') : '') + 'E-ticket tidak berlaku lagi.'], PENDING: ['timer_off', 'Batas waktu pembayaran habis', 'Kursi dilepas.'] }[o.status];
    return head + `<div class="card p-6 text-center mb-4">${ic(msg[0], 'text-[40px] text-on-surface-variant')}<h2 class="font-headline-sm text-headline-sm mt-2">${msg[1]}</h2><p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${esc(msg[2])}</p><a href="#/e/${e.id}" class="btn mt-4">Lihat acara</a></div>` + summary;
  };
  function payView(o) {
    const M = [['QRIS', 'qr_code_2', 'QRIS (semua bank & e-wallet)'], ['VA BCA', 'account_balance', 'Virtual Account BCA'], ['VA Mandiri', 'account_balance', 'Virtual Account Mandiri'], ['GoPay', 'account_balance_wallet', 'GoPay'], ['OVO', 'account_balance_wallet', 'OVO'], ['DANA', 'account_balance_wallet', 'DANA'], ['Kartu Kredit', 'credit_card', 'Kartu kredit/debit']];
    const va = '8808' + String(Math.abs(o.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 1e10).padStart(10, '0');
    const instr = payMethod === 'QRIS' ? `<div class="flex flex-col items-center gap-2"><div class="paper p-2 rounded-lg">${E.qrSvg('SANDBOX-QRIS|' + o.id + '|' + o.total, 170)}</div><span class="font-label-sm text-label-sm text-amber-300">QR sandbox, tidak bisa dibayar sungguhan</span></div>`
      : payMethod.startsWith('VA') ? `<div class="inner p-3"><div class="lbl">Nomor virtual account (sandbox)</div><div class="font-headline-md text-headline-md">${va}</div><div class="font-label-sm text-label-sm text-on-surface-variant">Transfer tepat ${rp(o.total)} melalui m-banking/ATM.</div></div>`
      : payMethod === 'Kartu Kredit' ? `<div class="inner p-3 font-body-sm text-body-sm text-on-surface-variant">Di versi produksi, pengunjung diarahkan ke halaman 3-D Secure milik gerbang pembayaran. Prototipe ini <b class="text-on-surface">tidak meminta data kartu apa pun</b>.</div>`
      : `<div class="inner p-3 font-body-sm text-body-sm text-on-surface-variant">Notifikasi pembayaran dikirim ke aplikasi ${payMethod} pada nomor ${esc(o.phone)} (simulasi).</div>`;
    return `<section class="card p-4 mb-4"><div class="flex items-center justify-between"><h2 class="font-headline-sm text-headline-sm">Pembayaran</h2><span class="font-label-md text-label-md text-amber-300">${ic('timer', 'text-[16px] align-middle')} <span data-until="${o.until}">--:--</span></span></div>
      <p class="font-label-sm text-label-sm text-on-surface-variant mb-3">Selesaikan sebelum ${E.fmtTime(o.until)} WIB. Kursi tetap ditahan untuk pesanan ini sampai batas waktu.</p>
      <div class="grid grid-cols-1 gap-2 mb-3">${M.map(([k, i, l]) => `<label class="inner px-3 py-2.5 flex items-center gap-3 cursor-pointer ${payMethod === k ? 'ring-1 ring-primary-container' : ''}"><input type="radio" name="pm" value="${k}" ${payMethod === k ? 'checked' : ''}>${ic(i, 'text-primary text-[20px]')}<span class="font-body-sm text-body-sm">${l}</span></label>`).join('')}</div>
      ${instr}
      <div class="mt-4 inner p-3 font-label-sm text-label-sm text-on-surface-variant">${ic('science', 'text-[14px] align-middle')} Mode sandbox: tombol di bawah meniru balasan dari gerbang pembayaran.</div>
      <div class="flex flex-col gap-2 mt-3"><button class="btn-ok justify-center !py-3" id="pay-ok">${ic('check_circle')} Simulasikan pembayaran berhasil</button>
        <div class="grid grid-cols-2 gap-2"><button class="btn-ghost justify-center" id="pay-fail">${ic('block', 'text-[16px]')} Simulasikan gagal</button><button class="btn-ghost justify-center" id="cancel">${ic('close', 'text-[16px]')} Batalkan pesanan</button></div></div></section>`;
  }
  function ticketsView(o, e) {
    return `<div class="inner p-3 mb-4 flex items-center gap-2 font-body-sm text-body-sm text-emerald-300">${ic('mark_email_read', 'text-[18px]')} E-ticket juga dikirim ke ${esc(o.email)} & WhatsApp ${esc(o.phone)} (simulasi).</div>
      <div class="flex flex-col gap-4 mb-4">${o.tickets.map((tid, i) => { const t = E.s.tickets[tid]; const ty = E.typeById(e, t.type); return `<section class="card p-0 overflow-hidden">
        <div class="px-4 py-3 flex items-center justify-between" style="background:linear-gradient(90deg, ${ty.color}44, transparent)"><span class="font-label-lg text-label-lg">E-ticket ${i + 1}/${o.tickets.length}</span><span class="font-label-sm text-label-sm">${esc(ty.name)}</span></div>
        <div class="p-4 flex flex-col items-center gap-3"><div class="paper p-2 rounded-lg">${E.qrSvg(E.qrText(t), 200)}</div>
          <div class="font-label-md text-label-md text-on-surface-variant">${t.id}</div>
          <div class="grid grid-cols-2 gap-3 w-full font-body-sm text-body-sm"><div><div class="lbl">Pemegang</div>${esc(t.holder)}</div><div><div class="lbl">Kursi</div><b class="font-headline-sm text-headline-sm">${t.seat || 'Bebas (berdiri)'}</b></div><div><div class="lbl">Tanggal</div>${E.fmtShort(e.start)} · ${E.fmtTime(e.start)}</div><div><div class="lbl">Gate dibuka</div>${E.fmtTime(e.doors)} WIB</div></div>
          <div class="w-full text-center px-3 py-2 rounded-lg font-label-md text-label-md ${t.checkedInAt ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-on-surface-variant'}">${t.checkedInAt ? 'Sudah check-in ' + E.fmtTime(t.checkedInAt) + ' di ' + esc(t.gate) : 'Belum check-in. Tunjukkan QR ini di gate.'}</div></div></section>`; }).join('')}</div>
      <div class="grid grid-cols-2 gap-2 mb-4"><button class="btn-ghost justify-center" id="ics">${ic('event', 'text-[16px]')} Simpan ke kalender</button><button class="btn-ghost justify-center" id="resend">${ic('forward_to_inbox', 'text-[16px]')} Kirim ulang</button></div>`;
  }

  V.tiket = () => {
    const mine = E.myOrders().map((id) => E.s.orders[id]).filter(Boolean);
    return `<h1 class="font-headline-md text-headline-md mb-3">Tiket saya</h1>
      <div class="flex flex-col gap-3 mb-5">${mine.length ? mine.map((o) => { const e = E.ev(o.ev); return `<a href="#/o/${o.id}" class="card p-4 block"><div class="flex items-start justify-between gap-2"><div><div class="font-label-lg text-label-lg">${esc(e.name)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${E.fmtShort(e.start)} · ${o.items.length} tiket · ${o.items.map((i) => i.seat || E.typeById(e, i.type).name).join(', ')}</div></div>${statusChip(o.status === 'PENDING' && o.until < E.now() ? 'EXPIRED' : o.status)}</div><div class="font-label-md text-label-md text-on-surface-variant mt-2">${o.id} · ${rp(o.total)}</div></a>`; }).join('') : `<div class="inner p-4 font-body-sm text-body-sm text-on-surface-variant">Belum ada pesanan di perangkat ini.</div>`}</div>
      <section class="card p-4"><h2 class="font-headline-sm text-headline-sm mb-2">Cari pesanan</h2><p class="font-label-sm text-label-sm text-on-surface-variant mb-3">Pesan dari perangkat lain? Masukkan kode booking dan email pemesan.</p>
        <form id="f-find" class="flex flex-col gap-2"><input class="inp" name="code" placeholder="BK-XXXXXX" required><input class="inp" name="email" type="email" placeholder="Email pemesan" required><button class="btn justify-center">${ic('search')} Cari</button></form></section>`;
  };

  V.inbox = () => {
    const mine = E.myOrders().map((id) => E.s.orders[id]).filter(Boolean);
    const to = new Set(mine.flatMap((o) => [o.email, o.phone]));
    const msgs = E.s.outbox.filter((m) => to.has(m.to)).slice(0, 60);
    return `<h1 class="font-headline-md text-headline-md">Kotak masuk</h1><p class="font-body-sm text-body-sm text-on-surface-variant mb-3">Simulasi email & WhatsApp untuk pesanan di perangkat ini. Tidak ada pesan yang benar-benar dikirim.</p>
      <div class="flex flex-col gap-2">${msgs.length ? msgs.map((m) => `<div class="card p-3 flex gap-3">${ic(m.ch === 'Email' ? 'mail' : 'chat', 'text-[20px] ' + (m.ch === 'Email' ? 'text-primary' : 'text-emerald-300'))}<div class="min-w-0"><div class="font-label-sm text-label-sm text-on-surface-variant">${m.ch} · ${esc(m.to)} · ${E.fmtDT(m.ts)}</div><div class="font-label-lg text-label-lg">${esc(m.subject)}</div><div class="font-body-sm text-body-sm text-on-surface-variant">${esc(m.body)}</div>${m.order && m.order.startsWith('BK-') ? `<a class="font-label-md text-label-md text-primary" href="#/o/${m.order}">Buka ${m.order}</a>` : ''}</div></div>`).join('') : `<div class="inner p-4 font-body-sm text-body-sm text-on-surface-variant">Belum ada pesan.</div>`}</div>`;
  };
  const notFound = (m) => `<div class="card p-6 text-center">${ic('search_off', 'text-[40px] text-on-surface-variant')}<p class="mt-2">${esc(m || 'Halaman tidak ditemukan.')}</p><a class="btn mt-4" href="#/">Ke daftar acara</a></div>`;

  // ---------------------------------------------------------------- router & binding
  function parse() {
    const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (p[0] === 'e' && p[2] === 'kursi') return { name: 'seats', args: [p[1]] };
    if (p[0] === 'e' && p[2] === 'data') return { name: 'data', args: [p[1]] };
    if (p[0] === 'e') return { name: 'event', args: [p[1]] };
    if (p[0] === 'o') return { name: 'order', args: [p[1]] };
    if (p[0] === 'tiket') return { name: 'tiket', args: [] };
    if (p[0] === 'inbox') return { name: 'inbox', args: [] };
    return { name: 'home', args: [] };
  }
  function render(keepScroll) {
    const y = window.scrollY;
    app.innerHTML = E.modeBanner() + V[cur.name](...cur.args);
    bind();
    tick();
    const nav = { home: 'home', event: 'home', seats: 'home', data: 'home', order: 'tiket', tiket: 'tiket', inbox: 'inbox' }[cur.name];
    document.querySelectorAll('[data-nav]').forEach((a) => { a.classList.toggle('text-primary', a.dataset.nav === nav); a.classList.toggle('text-on-surface-variant', a.dataset.nav !== nav); });
    if (keepScroll) window.scrollTo(0, y);
    const sm = app.querySelector('.seatmap-wrap'); if (sm) sm.scrollLeft = keepScroll && render.sx != null ? render.sx : (sm.scrollWidth - sm.clientWidth) / 2;
  }
  function bind() {
    const id = cur.args[0];
    app.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.filter || null; render(true); }));
    const sm = app.querySelector('.seatmap-wrap'); if (sm) sm.addEventListener('scroll', () => (render.sx = sm.scrollLeft));
    app.querySelectorAll('[data-seat]').forEach((b) => b.addEventListener('click', async () => {
      const st = b.dataset.st, seat = b.dataset.seat;
      if (st === 'available') { const r = await act(() => E.holdSeat(id, seat, cart)); if (r) toast(`Kursi <b>${seat}</b> ditahan untukmu.`, 'ok'); }
      else if (st === 'mine') await act(() => E.releaseSeat(id, seat, cart));
      else if (st === 'held') toast(`Kursi <b>${seat}</b> sedang dipesan pengunjung lain.`, 'err');
      else if (st === 'sold') toast(`Kursi <b>${seat}</b> sudah terjual.`, 'err');
      else toast(`Kursi <b>${seat}</b> tidak dijual.`, 'err');
    }));
    app.querySelectorAll('[data-qty]').forEach((b) => b.addEventListener('click', () => { const h = E.cartHolds(id, cart); const q = h.items.filter((i) => i.type === b.dataset.qty && !i.seat).length; act(() => E.setQty(id, b.dataset.qty, Math.max(0, q + +b.dataset.d), cart)); }));
    const clr = app.querySelector('#clear'); if (clr) clr.addEventListener('click', () => act(() => E.releaseCart(id, cart), 'Semua kursi dilepas.'));
    app.querySelectorAll('[data-wl]').forEach((b) => b.addEventListener('click', () => {
      const r = modal('Daftar tunggu ' + esc(E.typeById(E.ev(id), b.dataset.wl).name), `<form id="f-wl" class="flex flex-col gap-3"><p class="font-body-sm text-body-sm text-on-surface-variant">Kami kabari bila ada kursi yang tersedia lagi karena refund atau pesanan kedaluwarsa.</p><label class="f">Nama<input class="inp" name="name" required></label><label class="f">Email atau WhatsApp<input class="inp" name="contact" required></label><label class="f">Jumlah tiket<input class="inp" name="qty" type="number" min="1" max="4" value="1"></label><button class="btn justify-center">Gabung daftar tunggu</button></form>`);
      r.querySelector('#f-wl').addEventListener('submit', async (ev) => { ev.preventDefault(); const f = Object.fromEntries(new FormData(ev.target)); if (await act(() => E.joinWaitlist(id, b.dataset.wl, { name: f.name, contact: f.contact, qty: +f.qty }))) { closeModal(); toast('Kamu masuk daftar tunggu.', 'ok'); } });
      return r;
    }));
    const fo = app.querySelector('#f-order');
    if (fo) {
      fo.addEventListener('input', () => { const f = Object.fromEntries(new FormData(fo)); sessionStorage.setItem('smicc-evt-form', JSON.stringify({ name: f.name, email: f.email, phone: f.phone })); });
      fo.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const f = Object.fromEntries(new FormData(fo));
        const holders = Object.keys(f).filter((k) => k.startsWith('holder')).map((k) => f[k].trim());
        const oid = await act(() => E.createOrder(id, cart, { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), holders }));
        if (oid) { E.rememberOrder(oid); location.hash = '#/o/' + oid; }
      });
    }
    app.querySelectorAll('input[name=pm]').forEach((r) => r.addEventListener('change', () => { payMethod = r.value; render(true); }));
    const ok = app.querySelector('#pay-ok'); if (ok) ok.addEventListener('click', async () => { const r = await act(() => E.pay(id, payMethod, true)); if (r) { toast('Pembayaran berhasil. E-ticket terbit.', 'ok'); window.scrollTo(0, 0); } });
    const bad = app.querySelector('#pay-fail'); if (bad) bad.addEventListener('click', async () => { const r = await act(() => E.pay(id, payMethod, false)); if (r === 'FAILED') toast('Pembayaran ditolak (simulasi). Kursi tetap ditahan sampai batas waktu. Coba metode lain.', 'err'); });
    const cc = app.querySelector('#cancel'); if (cc) cc.addEventListener('click', () => { if (confirm('Batalkan pesanan dan lepas kursi?')) act(() => E.cancel(id), 'Pesanan dibatalkan, kursi dilepas.'); });
    const rs = app.querySelector('#resend'); if (rs) rs.addEventListener('click', () => act(() => E.resend(id), 'E-ticket dikirim ulang ke email & WhatsApp (simulasi).'));
    const ics = app.querySelector('#ics'); if (ics) ics.addEventListener('click', () => downloadIcs(E.s.orders[id]));
    const ff = app.querySelector('#f-find');
    if (ff) ff.addEventListener('submit', (ev) => { ev.preventDefault(); const f = Object.fromEntries(new FormData(ff)); const o = E.s.orders[f.code.trim().toUpperCase()]; if (o && o.email.toLowerCase() === f.email.trim().toLowerCase()) { E.rememberOrder(o.id); location.hash = '#/o/' + o.id; } else toast('Kode booking atau email tidak cocok.', 'err'); });
  }
  function downloadIcs(o) {
    const e = E.ev(o.ev); const f = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Summarecon Mall//Event Tiket//ID', 'BEGIN:VEVENT', 'UID:' + o.id + '@summarecon-mall.local', 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(e.start), 'DTEND:' + f(e.start + 3 * 3600000), 'SUMMARY:' + e.name, 'LOCATION:' + e.venue, 'DESCRIPTION:Kode booking ' + o.id + ', gate dibuka ' + E.fmtTime(e.doors), 'BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY', 'DESCRIPTION:Pengingat acara', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = o.id + '.ics'; a.click();
  }
  function tick() {
    let expired = false;
    document.querySelectorAll('[data-until]').forEach((el) => { const rem = +el.dataset.until - E.now(); el.textContent = rem > 0 ? E.mmss(rem) : 'habis'; if (rem <= 0 && el.dataset.until !== 'null') expired = true; });
    return expired;
  }

  let rt = null;
  const rerender = () => { clearTimeout(rt); rt = setTimeout(() => { if (cur.name === 'data') return; if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#modal-root')) return; render(true); }, 80); };
  window.addEventListener('hashchange', () => { cur = parse(); render(); window.scrollTo(0, 0); });
  E.init().then(() => {
    document.getElementById('mode').innerHTML = E.mode === 'server' ? '<span class="text-emerald-300">●</span> LAN' : '<span class="text-amber-300">●</span> Lokal';
    document.getElementById('mode').title = E.mode === 'server' ? 'Terhubung ke server.py. Kursi tersinkron ke semua perangkat di jaringan lokal.' : 'Tanpa server: data hanya di browser ini (sinkron antar-tab)';
    cur = parse(); render();
    E.subscribe(rerender);
    setInterval(() => { if (tick()) rerender(); }, 1000);
  });
})();

// Esc menutup modal portal pengunjung
document.addEventListener('keydown', (e) => { const r = document.getElementById('modal-root'); if (e.key === 'Escape' && r && r.innerHTML) r.innerHTML = ''; });
