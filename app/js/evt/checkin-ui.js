/* Komponen check-in QR (dipakai dashboard panitia & checkin.html di ponsel gate).
 * Input: kamera (butuh HTTPS/localhost), foto QR dari kamera ponsel (berjalan di HTTP LAN), ketik/tempel kode, tombol demo.
 * Hasil: VALID (masuk), USED (sudah digunakan), INVALID (palsu/dibatalkan/acara lain). */
(function () {
  const E = window.Evt;
  const { esc } = E;
  const ic = (n, c) => `<span class="material-symbols-outlined ${c || ''}">${n}</span>`;
  let last = null; // teks QR terakhir yang dipindai (untuk demo "pindai ulang")
  let stream = null;

  function beep(ok) {
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(); const g = a.createGain();
      o.frequency.value = ok ? 880 : 220; o.connect(g); g.connect(a.destination); g.gain.value = 0.08; o.start(); o.stop(a.currentTime + (ok ? 0.15 : 0.4));
      if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(ok ? 80 : [120, 60, 120]);
    } catch (e) { /* audio tidak tersedia */ }
  }
  const canCam = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.isSecureContext);

  function panel(opts) {
    opts = opts || {};
    return `<div class="flex flex-col gap-3" data-ck>
      <div class="inner p-3 flex flex-col gap-3">
        <div class="relative rounded-xl overflow-hidden bg-black/60 ${opts.compact ? 'h-56' : 'h-64'} flex items-center justify-center" data-cam-box>
          <video data-video playsinline muted class="absolute inset-0 w-full h-full object-cover hidden"></video>
          <div class="absolute inset-8 border-2 border-primary-container/70 rounded-xl pointer-events-none"></div>
          <div class="text-center px-6 font-body-sm text-body-sm text-on-surface-variant" data-cam-hint>${ic('qr_code_scanner', 'text-[40px] text-primary')}<br>${canCam() ? 'Tekan <b>Kamera</b> untuk memindai QR secara langsung' : 'Kamera langsung butuh HTTPS. Gunakan <b>Foto QR</b> (kamera ponsel) atau ketik kode.'}</div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button class="btn justify-center" data-cam ${canCam() ? '' : 'disabled'}>${ic('photo_camera', 'text-[18px]')} Kamera</button>
          <label class="btn-ghost justify-center cursor-pointer">${ic('add_a_photo', 'text-[18px]')} Foto QR<input type="file" accept="image/*" capture="environment" class="hidden" data-photo></label>
        </div>
        <form class="flex gap-2" data-manual><input class="inp" name="code" placeholder="Pindai / ketik: QR, kode tiket T-… atau booking BK-…" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go" aria-label="Kode QR, kode tiket, atau kode booking"><button class="btn-ghost">Validasi</button></form>
      </div>
      <div class="flex flex-wrap gap-2"><span class="lbl self-center mr-1">Demo:</span>
        <button class="chip-btn" data-demo="valid">${ic('check_circle', 'text-[14px]')} Tiket valid acak</button>
        <button class="chip-btn" data-demo="again">${ic('replay', 'text-[14px]')} Pindai ulang terakhir</button>
        <button class="chip-btn" data-demo="fake">${ic('gpp_bad', 'text-[14px]')} QR palsu</button>
        <button class="chip-btn" data-demo="refund">${ic('currency_exchange', 'text-[14px]')} Tiket refund</button></div>
      <div data-result>${result(null)}</div></div>`;
  }

  function result(r) {
    if (!r) return `<div class="ck-res border-white/10 bg-white/5 text-center font-body-sm text-body-sm text-on-surface-variant">${ic('hourglass_empty', 'text-[28px]')}<br>Menunggu pindaian…</div>`;
    const m = { VALID: ['check_circle', 'text-emerald-300', 'VALID · Silakan masuk'], USED: ['history', 'text-amber-300', 'SUDAH DIGUNAKAN'], INVALID: ['cancel', 'text-rose-300', 'TIDAK VALID'] }[r.result];
    const t = r.ticket, o = r.order;
    const e = t ? E.ev(t.ev) : null;
    return `<div class="ck-res ck-${r.result} flashin"><div class="flex items-center gap-3">${ic(m[0], 'text-[44px] ' + m[1])}<div><div class="font-headline-md text-headline-md ${m[1]}">${m[2]}</div><div class="font-body-sm text-body-sm">${esc(r.reason)}</div></div></div>
      ${t ? `<div class="grid grid-cols-2 gap-3 mt-4 font-body-sm text-body-sm"><div><div class="lbl">Pemegang</div>${esc(t.holder)}</div><div><div class="lbl">Kursi / Kategori</div><b>${t.seat || 'Berdiri'}</b> · ${esc(E.typeById(e, t.type).name)}</div><div><div class="lbl">Tiket</div>${t.id}</div><div><div class="lbl">Booking</div>${o ? o.id : '-'}</div></div>` : ''}
      <div class="font-label-sm text-label-sm text-on-surface-variant mt-3">${E.fmtTime(E.now())} WIB</div></div>`;
  }

  async function scan(root, text, getEv, getGate, onDone) {
    if (!text) return;
    last = text;
    try {
      const r = await E.checkIn(text, getEv(), getGate());
      root.querySelector('[data-result]').innerHTML = result(r);
      beep(r.result === 'VALID');
      if (onDone) onDone(r);
    } catch (e) { root.querySelector('[data-result]').innerHTML = `<div class="ck-res ck-INVALID">${esc(e.message)}</div>`; }
  }

  // src = <img> atau <video>; w/h = ukuran asli sumber
  function decodeImage(src, w, h) {
    const c = document.createElement('canvas'); const max = 1200; const k = Math.min(1, max / Math.max(w, h));
    c.width = Math.round(w * k); c.height = Math.round(h * k);
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height);
    const q = window.jsQR(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' });
    return q ? q.data : null;
  }
  function stopCam() { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } }

  function mount(root, getEv, getGate, onDone) {
    const box = root.querySelector('[data-ck]'); if (!box) return;
    const go = (txt) => scan(box, txt, getEv, getGate, onDone);
    box.querySelector('[data-manual]').addEventListener('submit', (e) => { e.preventDefault(); go(e.target.code.value.trim()); e.target.code.value = ''; e.target.code.focus(); }); // fokus tetap di kolom: pemindai HID bisa langsung memindai berikutnya
    box.querySelector('[data-photo]').addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      const img = new Image(); img.onload = () => { const txt = decodeImage(img, img.naturalWidth, img.naturalHeight); URL.revokeObjectURL(img.src); if (txt) go(txt); else box.querySelector('[data-result]').innerHTML = `<div class="ck-res ck-INVALID">QR tidak terbaca dari foto. Dekatkan kamera & pastikan cukup cahaya.</div>`; }; img.src = URL.createObjectURL(f); e.target.value = '';
    });
    box.querySelector('[data-cam]').addEventListener('click', async () => {
      if (stream) { stopCam(); box.querySelector('[data-video]').classList.add('hidden'); box.querySelector('[data-cam-hint]').classList.remove('hidden'); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const v = box.querySelector('[data-video]'); v.srcObject = stream; v.classList.remove('hidden'); box.querySelector('[data-cam-hint]').classList.add('hidden'); await v.play();
        let cool = 0, prev = '';
        const loop = () => {
          if (!stream) return;
          if (!box.isConnected) { stopCam(); return; }
          if (v.readyState >= 2 && Date.now() > cool) {
            const txt = decodeImage(v, v.videoWidth, v.videoHeight);
            if (txt && (txt !== prev || Date.now() > cool + 3000)) { prev = txt; cool = Date.now() + 2500; go(txt); }
          }
          setTimeout(loop, 250);
        };
        loop();
      } catch (err) { box.querySelector('[data-result]').innerHTML = `<div class="ck-res ck-INVALID">Kamera tidak dapat dibuka: ${esc(err.message)}</div>`; }
    });
    box.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => {
      const evId = getEv();
      const tks = Object.values(E.s.tickets).filter((t) => t.ev === evId);
      if (b.dataset.demo === 'valid') { const t = tks.filter((x) => x.status === 'ACTIVE' && !x.checkedInAt); if (!t.length) return; go(E.qrText(t[Math.floor(Math.random() * t.length)])); }
      if (b.dataset.demo === 'again') { const t = last || (tks.find((x) => x.checkedInAt) && E.qrText(tks.find((x) => x.checkedInAt))); go(t); }
      if (b.dataset.demo === 'fake') { const t = tks[0]; go(t ? `SMB1|T-${Math.random().toString(36).slice(2, 9).toUpperCase()}|${evId}|${t.seat || '-'}|0000000000` : 'QR-PALSU'); }
      if (b.dataset.demo === 'refund') { const t = tks.find((x) => x.status === 'VOID'); go(t ? E.qrText(t) : 'SMB1|X|X|X|X'); }
    }));
  }
  function anomalies(evId, mins) {
    const t = E.now() - (mins || 10) * 60000; const by = {};
    E.s.scans.filter((s) => s.ev === evId && s.ts > t && s.result !== 'VALID').forEach((s) => { by[s.gate] = (by[s.gate] || 0) + 1; });
    return Object.entries(by).filter(([, n]) => n >= 3).map(([gate, n]) => ({ gate, n }));
  }
  function logTable(evId, n) {
    const rows = E.s.scans.filter((s) => s.ev === evId).slice(0, n || 25);
    const col = { VALID: 'text-emerald-300', USED: 'text-amber-300', INVALID: 'text-rose-300' };
    return rows.length ? `<table class="tbl"><thead><tr><th>Waktu</th><th>Gate</th><th>Hasil</th><th>Tiket</th><th>Keterangan</th></tr></thead><tbody>${rows.map((s) => { const t = s.ticket && E.s.tickets[s.ticket]; return `<tr><td class="font-label-md text-label-md whitespace-nowrap">${E.fmtTime(s.ts)}</td><td class="font-body-sm text-body-sm">${esc(s.gate)}</td><td class="font-label-md text-label-md ${col[s.result]}">${s.result}</td><td class="font-label-md text-label-md">${s.ticket || '–'}${t ? '<br><span class="text-on-surface-variant">' + esc(t.holder) + ' · ' + (t.seat || 'Berdiri') + '</span>' : ''}</td><td class="font-body-sm text-body-sm text-on-surface-variant">${esc(s.reason)}</td></tr>`; }).join('')}</tbody></table>` : '<div class="font-body-sm text-body-sm text-on-surface-variant">Belum ada pindaian.</div>';
  }

  window.EvtCheckin = { panel, mount, result, anomalies, logTable, stopCam };
})();
