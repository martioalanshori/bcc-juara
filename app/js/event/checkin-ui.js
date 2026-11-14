/* Komponen check-in QR (dipakai konsol pengelola & /checkin di ponsel gate).
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
          <div class="text-center px-6 font-body-sm text-body-sm text-on-surface-variant" data-cam-hint>${ic('qr_code_scanner', 'text-[40px] text-primary')}<br>${canCam() ? 'Tekan <b>Kamera</b> untuk memindai QR' : 'Kamera langsung butuh HTTPS. Gunakan <b>Foto QR</b> (kamera ponsel) atau ketik kode.'}</div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button class="btn justify-center" data-cam ${canCam() ? '' : 'disabled'}>${ic('photo_camera', 'text-[18px]')} Kamera</button>
          <label class="btn-ghost justify-center cursor-pointer">${ic('add_a_photo', 'text-[18px]')} Foto QR<input type="file" accept="image/*" capture="environment" class="hidden" data-photo></label>
        </div>
        <form class="flex gap-2" data-manual><input class="inp" name="code" placeholder="Pindai atau ketik QR, kode tiket T-…, atau kode booking BK-…" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go" aria-label="Kode QR, kode tiket, atau kode booking"><button class="btn-ghost">Validasi</button></form>
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
    const m = { VALID: ['check_circle', 'text-emerald-300', 'Valid, silakan masuk'], USED: ['history', 'text-amber-300', 'Sudah digunakan'], INVALID: ['cancel', 'text-rose-300', 'Tidak valid'] }[r.result];
    const t = r.ticket, o = r.order;
    const e = t ? E.ev(t.ev) : null;
    return `<div class="ck-res ck-${r.result} flashin"><div class="flex items-center gap-3">${ic(m[0], 'text-[44px] ' + m[1])}<div><div class="font-headline-md text-headline-md ${m[1]}">${m[2]}</div><div class="font-body-sm text-body-sm">${esc(r.reason)}</div></div></div>
      ${t ? `<div class="grid grid-cols-2 gap-3 mt-4 font-body-sm text-body-sm"><div><div class="lbl">Pemegang</div>${esc(t.holder)}</div><div><div class="lbl">Kursi / kategori</div><b>${t.seat || 'Berdiri'}</b> · ${esc(E.typeById(e, t.type).name)}</div><div><div class="lbl">Tiket</div>${t.id}</div><div><div class="lbl">Booking</div>${o ? o.id : '-'}</div></div>` : ''}
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
      const img = new Image(); img.onload = () => { const txt = decodeImage(img, img.naturalWidth, img.naturalHeight); URL.revokeObjectURL(img.src); if (txt) go(txt); else box.querySelector('[data-result]').innerHTML = `<div class="ck-res ck-INVALID">QR tidak terbaca dari foto. Dekatkan kamera dan pastikan cahaya cukup.</div>`; }; img.src = URL.createObjectURL(f); e.target.value = '';
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
  const anomalies = (evId, mins) => E.anomalies(evId, mins); // aturan ambang ada di engine
  function logTable(evId, n) {
    const rows = E.s.scans.filter((s) => s.ev === evId).slice(0, n || 25);
    const col = { VALID: 'text-emerald-300', USED: 'text-amber-300', INVALID: 'text-rose-300' };
    return rows.length ? `<div class="overflow-x-auto -mx-1"><table class="tbl min-w-[520px]"><thead><tr><th>Waktu</th><th>Gate</th><th>Hasil</th><th>Tiket</th><th>Keterangan</th></tr></thead><tbody>${rows.map((s) => { const t = s.ticket && E.s.tickets[s.ticket]; return `<tr><td class="font-label-md text-label-md whitespace-nowrap">${E.fmtTime(s.ts)}</td><td class="font-body-sm text-body-sm">${esc(s.gate)}</td><td class="font-label-md text-label-md ${col[s.result]}">${s.result}</td><td class="font-label-md text-label-md">${s.ticket || '–'}${t ? '<br><span class="text-on-surface-variant">' + esc(t.holder) + ' · ' + (t.seat || 'Berdiri') + '</span>' : ''}</td><td class="font-body-sm text-body-sm text-on-surface-variant">${esc(s.reason)}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="font-body-sm text-body-sm text-on-surface-variant">Belum ada pindaian.</div>';
  }

  // Manifest cadangan untuk gate saat sistem mati (SOP-EVT-05). Disimpan di perangkat ini (localStorage) dan diperbarui
  // otomatis setiap data acara berubah (paling sering 30 detik sekali) selama server terhubung, untuk acara 48 jam ke depan
  // atau yang sedang berjalan. Saat server putus, salinan terakhir tetap bisa diunduh: Excel, CSV, atau manifest offline
  // (satu file HTML mandiri untuk mencari & mencentang peserta tanpa server). cutoff() = batas harian 23.00 (label lama).
  const DL_KEY = 'smicc-manifest-dl', BK_KEY = 'smicc-manifest-v1', BK_HOUR = 23, BK_V = 2, FRESH_MS = 30000, HOUR = 3600000;
  const COLS = ['Hadir', 'Booking', 'ID Tiket', 'Pemegang', 'Pemesan', 'Kategori', 'Kursi', 'Kendaraan', 'Plat', 'WhatsApp', 'Email', 'Status', 'Check-in', 'Gate'];
  const WIDTHS = [7, 11, 12, 24, 24, 16, 8, 11, 12, 18, 26, 14, 16, 18];
  // Untuk file Excel/CSV: acara tanpa peserta diberi satu baris keterangan agar file tidak tampak kosong atau rusak.
  const EMPTY_ROW = ['', '', '', 'Belum ada peserta untuk acara ini.', '', '', '', '', '', '', '', '', '', ''];
  const outRows = (rows) => (rows.length > 1 ? rows : rows.concat([EMPTY_ROW]));
  const ymd = (t) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const backup = {
    cutoff(t) { const d = new Date(t); d.setHours(BK_HOUR, 0, 0, 0); if (d.getTime() > t) d.setDate(d.getDate() - 1); return d.getTime(); },
    all() { try { return JSON.parse(localStorage.getItem(BK_KEY) || '{}') || {}; } catch (e) { return {}; } },
    load(evId) { return backup.all()[evId] || null; },
    // Satu baris per e-ticket, tiket aktif dulu lalu urut nama pemegang (mudah dicari di kertas).
    rows(evId) {
      const e = E.ev(evId);
      const list = Object.values(E.s.tickets).filter((t) => t.ev === evId).map((t) => {
        const o = E.s.orders[t.order] || {}, ty = e && E.typeById(e, t.type), v = o.veh;
        return [t.checkedInAt ? 'Sudah' : '', t.order || '', t.id, t.holder || o.name || '', o.name || '', ty ? ty.name : t.type, t.seat || 'Berdiri',
          !o || !('veh' in o) ? '' : v ? E.VEH[v.t] : 'Tidak bawa', v ? v.p : '', o.phone || '', o.email || '', t.status === 'VOID' ? 'Batal, tolak' : 'Aktif',
          t.checkedInAt ? E.fmtDT(t.checkedInAt) : '', t.gate || ''];
      }).sort((a, b) => (a[11] === 'Aktif' ? 0 : 1) - (b[11] === 'Aktif' ? 0 : 1) || a[3].localeCompare(b[3], 'id') || a[2].localeCompare(b[2]));
      return [COLS.slice()].concat(list);
    },
    save(evId) {
      const e = E.ev(evId); if (!e) return null;
      const t = E.now();
      const m = { v: BK_V, ev: evId, name: e.name, start: e.start, at: t, savedAt: t, ver: E.version, rows: backup.rows(evId) };
      const A = backup.all(); A[evId] = m;
      Object.keys(A).forEach((k) => { const x = A[k]; if (k !== evId && (!x.start || x.start < t - 3 * 24 * HOUR)) delete A[k]; }); // buang manifest acara lama
      try { localStorage.setItem(BK_KEY, JSON.stringify(A)); } catch (x) { return m; } // penyimpanan penuh: tetap bisa diunduh dari memori
      return m;
    },
    // Salinan yang dipakai kartu: server putus = salinan terakhir; terhubung = diperbarui bila data berubah (maks. tiap 30 detik).
    ensure(evId) {
      const m = backup.load(evId);
      if (E.offline) return m || backup.save(evId);
      if (!m || m.v !== BK_V || (m.ver !== E.version && E.now() - m.savedAt >= FRESH_MS)) return backup.save(evId);
      return m;
    },
    // Untuk diunduh: data terbaru bila server terhubung, salinan terakhir bila putus.
    latest(evId) { return E.offline ? backup.load(evId) || backup.save(evId) : backup.save(evId); },
    // Acara yang perlu cadangan: belum selesai dan mulai dalam 48 jam (termasuk yang sedang berjalan).
    near() { const t = E.now(); return (E.s ? E.s.order : []).map((id) => E.ev(id)).filter((e) => e && e.status !== 'DRAFT' && e.status !== 'CANCELLED' && e.start < t + 48 * HOUR && (e.end || e.start + 3 * HOUR) + 2 * HOUR > t).map((e) => e.id); },
    autoSave() { if (E.s && !E.offline) backup.near().forEach((id) => backup.ensure(id)); },
    fname(m, ext) { return 'manifest_' + m.ev + '_' + ymd(m.savedAt) + '.' + ext; },
    download(evId) { const m = backup.latest(evId); if (m) { E.csv(backup.fname(m, 'csv'), outRows(m.rows)); backup.markDl([evId]); } return m; },
    xlsx(evId) { const m = backup.latest(evId); if (m) { E.xlsx(backup.fname(m, 'xlsx'), outRows(m.rows), { sheet: 'Manifest ' + m.ev, widths: WIDTHS }); backup.markDl([evId]); } return m; },
    offline(evId) { const m = backup.latest(evId); if (m) { E.download(backup.fname(m, 'html'), backup.offlineHtml(m), 'text/html;charset=utf-8'); backup.markDl([evId]); } return m; },
    // Kapan manifest acara terakhir diunduh di perangkat ini (localStorage), untuk status di Dasbor & bilah Informasi terbaru.
    dlAll() { try { return JSON.parse(localStorage.getItem(DL_KEY) || '{}') || {}; } catch (e) { return {}; } },
    dlAt(evId) { return backup.dlAll()[evId] || 0; },
    markDl(ids) { const d = backup.dlAll(), t = E.now(); ids.forEach((id) => (d[id] = t)); try { localStorage.setItem(DL_KEY, JSON.stringify(d)); } catch (e) { /* tidak tersimpan */ } },
    // [nada, label]: bad = server putus & data > 30 menit; ok = sudah diunduh 24 jam terakhir; warn = acara <= 36 jam lagi
    // tapi belum diunduh; idle = tersimpan di perangkat, belum mendesak.
    status(evId) {
      const e = E.ev(evId), m = backup.load(evId), t = E.now();
      if (E.offline && m && t - m.savedAt > 30 * 60000) return ['bad', 'Data lama'];
      if (backup.dlAt(evId) > t - 24 * HOUR) return ['ok', 'Siap'];
      if (e && e.start < t + 36 * HOUR) return ['warn', 'Belum diunduh'];
      return ['idle', 'Tersimpan'];
    },
    // Semua acara (kecuali draft & dibatalkan) dalam satu ZIP: per acara satu folder berisi manifest Excel, CSV, dan manifest
    // offline (HTML), ditambah DAFTAR_ACARA.xlsx dan BACA_SAYA.txt. Data dari state di memori perangkat ini (saat server
    // putus = data terakhir yang diterima).
    allFiles() {
      const t = E.now(), evs = (E.s ? E.s.order : []).map((id) => E.ev(id)).filter((e) => e && e.status !== 'DRAFT' && e.status !== 'CANCELLED').sort((a, b) => a.start - b.start);
      const idx = [['ID', 'Acara', 'Mulai', 'Lokasi', 'Tiket aktif', 'Sudah check-in', 'Folder']], files = [];
      const everyone = [['ID acara', 'Acara', 'Mulai'].concat(COLS)]; // SEMUA_PESERTA.xlsx: peserta semua acara dalam satu file
      evs.forEach((e) => {
        const rows = backup.rows(e.id), m = { v: BK_V, ev: e.id, name: e.name, start: e.start, at: t, savedAt: t, rows }, dir = e.id + '/';
        const act = rows.slice(1).filter((r) => r[11] === 'Aktif');
        idx.push([e.id, e.name, E.fmtDT(e.start), String(e.venue || '').split('·')[0].trim(), act.length, act.filter((r) => r[0] === 'Sudah').length, dir]);
        rows.slice(1).forEach((r) => everyone.push([e.id, e.name, E.fmtDT(e.start)].concat(r)));
        files.push([dir + backup.fname(m, 'xlsx'), E.xlsxBytes(outRows(rows), { sheet: 'Manifest ' + e.id, widths: WIDTHS })], [dir + backup.fname(m, 'csv'), E.csvText(outRows(rows))], [dir + 'manifest_offline_' + e.id + '.html', backup.offlineHtml(m)]);
      });
      const readme = ['Cadangan manifest peserta Summarecon Mall Bandung (SOP-EVT-05)', 'Data per ' + E.fmtDT(t) + ', ' + evs.length + ' acara.', '',
        'Isi:', '- SEMUA_PESERTA.xlsx: daftar peserta semua acara dalam satu file (kolom ID acara & Acara bisa disaring).',
        '- DAFTAR_ACARA.xlsx: semua acara, jumlah tiket aktif dan yang sudah check-in, nama foldernya.',
        '- <ID acara>/manifest_offline_<ID>.html: buka di browser tanpa server atau internet. Cari nama, booking, plat, atau kursi, lalu centang hadir.',
        '- <ID acara>/manifest_<ID>_<tanggal>.xlsx: daftar peserta untuk dicetak atau dicentang manual (kolom Hadir).',
        '- <ID acara>/manifest_<ID>_<tanggal>.csv: data yang sama dalam CSV.', '',
        'Tiket berstatus "Batal, tolak" tidak boleh masuk. Setelah server pulih, unduh hasil centang dari manifest offline dan cocokkan ke sistem.'].join(String.fromCharCode(13, 10));
      return [['BACA_SAYA.txt', readme], ['SEMUA_PESERTA.xlsx', E.xlsxBytes(outRows(everyone), { sheet: 'Semua peserta', widths: [10, 32, 18].concat(WIDTHS) })], ['DAFTAR_ACARA.xlsx', E.xlsxBytes(idx, { sheet: 'Daftar acara', widths: [10, 44, 18, 26, 12, 15, 10] })]].concat(files);
    },
    zip() { const f = backup.allFiles(); E.download('manifest_semua_acara_' + ymd(E.now()) + '.zip', E.zipBytes(f), 'application/zip'); backup.markDl([...new Set(f.map(([n]) => n.split('/')[0]).filter((x) => /^EVT-/.test(x)))]); },
    // Manifest offline: satu file HTML tanpa server & internet. Cari nama/booking/plat/kursi, centang hadir (tersimpan di
    // perangkat itu), dan unduh hasil centang sebagai CSV untuk dicocokkan ke sistem setelah server pulih.
    offlineHtml(m) {
      const data = JSON.stringify({ ev: m.ev, name: m.name, at: E.fmtDT(m.savedAt), cols: m.rows[0], rows: m.rows.slice(1) }).replace(/</g, '\\u003c');
      return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Manifest offline ${esc(m.ev)}</title>
<style>*{box-sizing:border-box}body{margin:0;font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#14213D;background:#F5F6F8}header{background:#14213D;color:#fff;padding:16px}h1{margin:0;font-size:19px}header p{margin:4px 0 0;opacity:.85;font-size:13px}
.bar{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 16px;background:#fff;border-bottom:1px solid #DDE1E7}#q{flex:1;min-width:200px;height:44px;padding:0 12px;font-size:16px;border:1px solid #9AA3B2;border-radius:8px}
#cnt{font-weight:600}button{height:44px;padding:0 14px;border:0;border-radius:8px;background:#1D4ED8;color:#fff;font-weight:600;font-size:14px;cursor:pointer}
ul{list-style:none;margin:0;padding:8px 16px 40px;display:grid;gap:8px}li{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid #DDE1E7;border-radius:10px;padding:10px 12px}
li.on{border-color:#15803D;background:#F0FDF4}li.void{opacity:.75;border-color:#DC2626;background:#FEF2F2}input[type=checkbox]{width:28px;height:28px;flex-shrink:0;accent-color:#15803D}
.n{font-weight:700}.s{font-size:13px;color:#4B5563}.tag{display:inline-block;padding:0 6px;border-radius:4px;background:#14213D;color:#fff;font-weight:700;letter-spacing:.06em;font-size:12px}.x{color:#DC2626;font-weight:700}.ok{color:#15803D;font-weight:600}.empty{padding:24px 16px;color:#4B5563}</style></head>
<body><header><h1>${esc(m.name)}</h1><p>Manifest offline ${esc(m.ev)} · data per ${esc(E.fmtDT(m.savedAt))} · SOP-EVT-05. Centang tersimpan di perangkat ini.</p></header>
<div class="bar"><input id="q" type="search" placeholder="Cari nama, booking, plat, kursi" autocomplete="off"><span id="cnt"></span><button id="exp" type="button">Unduh hasil centang (CSV)</button></div>
<ul id="list"></ul>
<script>(function(){var D=${data};var K='smicc-offline-'+D.ev,C={};try{C=JSON.parse(localStorage.getItem(K)||'{}')||{}}catch(e){}
var q=document.getElementById('q'),L=document.getElementById('list'),N=document.getElementById('cnt');
function h(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function save(){try{localStorage.setItem(K,JSON.stringify(C))}catch(e){}}
function hhmm(t){var d=new Date(t);return('0'+d.getHours()).slice(-2)+'.'+('0'+d.getMinutes()).slice(-2)}
function draw(){var w=q.value.toLowerCase().trim().split(/\\s+/).filter(Boolean),act=0,in_=0,out=[];
D.rows.forEach(function(r){var v=r[11]!=='Aktif',sv=r[0]==='Sudah',on=sv||!!C[r[2]];if(!v){act++;if(on)in_++}
var hay=(r[1]+' '+r[2]+' '+r[3]+' '+r[4]+' '+r[6]+' '+r[8]+' '+r[9]).toLowerCase();if(w.length&&!w.every(function(x){return hay.indexOf(x)>=0}))return;
if(out.length<300)out.push('<li class="'+(v?'void':on?'on':'')+'"><input type="checkbox" data-id="'+h(r[2])+'"'+(on?' checked':'')+(v||sv?' disabled':'')+' aria-label="Hadir '+h(r[3])+'"><div><div class="n">'+h(r[3])+'</div><div class="s">'+h(r[1])+' · '+h(r[5])+(r[6]!=='Berdiri'?' · kursi '+h(r[6]):'')+(r[8]?' · <span class="tag">'+h(r[8])+'</span>':'')+'</div><div class="s">'+(v?'<span class="x">Tiket dibatalkan, tolak masuk</span>':sv?'<span class="ok">Sudah check-in di sistem '+h(r[12])+'</span>':C[r[2]]?'<span class="ok">Dicentang '+hhmm(C[r[2]])+'</span>':'Pemesan '+h(r[4]))+'</div></div></li>')});
L.innerHTML=out.join('')||'<li class="empty">Tidak ada yang cocok.</li>';N.textContent='Hadir '+in_+' / '+act;}
L.addEventListener('change',function(e){var id=e.target.getAttribute('data-id');if(!id)return;if(e.target.checked)C[id]=Date.now();else delete C[id];save();draw()});
q.addEventListener('input',draw);
document.getElementById('exp').addEventListener('click',function(){var rows=[['ID Tiket','Booking','Pemegang','Waktu centang']];D.rows.forEach(function(r){if(C[r[2]])rows.push([r[2],r[1],r[3],new Date(C[r[2]]).toLocaleString('id-ID')])});
var csv='\\ufeff'+rows.map(function(r){return r.map(function(v){v=String(v);if(/^[=+\\-@\\t\\r]/.test(v))v="'"+v;return/[";,\\r\\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(';')}).join('\\r\\n');
var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='hasil_centang_'+D.ev+'.csv';document.body.appendChild(a);a.click();a.remove()});
draw();q.focus()})();</script></body></html>`;
    },
    card(evId, opts) {
      const m = backup.ensure(evId); if (!m) return '';
      const n = m.rows.length - 1, sop = opts && opts.sopHref;
      const sopTxt = sop ? `<a class="text-primary" href="${sop}">SOP-EVT-05</a>` : 'SOP-EVT-05';
      return `<div class="ck-bk" data-bk="${esc(evId)}">${ic('cloud_off', 'text-[22px] text-primary')}<div class="min-w-0 flex-1"><b>Cadangan kalau sistem mati</b>
        <p>Daftar ${n} tiket tersimpan di perangkat ini dan diperbarui otomatis setiap ada perubahan. Terakhir diperbarui <b>${E.fmtDT(m.savedAt)}</b>.</p>
        ${E.offline ? `<p class="ck-bk-warn">${ic('wifi_off', 'text-[16px] align-middle')} Server tidak terhubung. Unduhan memakai data per ${E.fmtDT(m.savedAt)}.</p>` : ''}
        <p>Sebelum gate dibuka, simpan <b>Manifest offline</b> di ponsel atau laptop gate. File itu tetap bisa dibuka tanpa server untuk mencari nama, booking, atau plat dan mencentang kehadiran (${sopTxt}).</p></div>
        <div class="ck-bk-act"><button class="btn" data-bk-off>${ic('offline_pin', 'text-[16px]')} Manifest offline</button><button class="btn-ghost" data-bk-xlsx>${ic('table_view', 'text-[16px]')} Excel</button><button class="btn-ghost" data-bk-dl>${ic('download', 'text-[16px]')} CSV</button><button class="btn-ghost" data-bk-zip title="Manifest semua acara dalam satu file ZIP">${ic('folder_zip', 'text-[16px]')} Semua acara (ZIP)</button></div></div>`;
    },
    bind(root) {
      root.querySelectorAll('[data-bk]').forEach((el) => {
        const id = el.dataset.bk;
        const on = (sel, fn) => { const b = el.querySelector(sel); if (b) b.addEventListener('click', () => fn(id)); };
        on('[data-bk-off]', backup.offline); on('[data-bk-xlsx]', backup.xlsx); on('[data-bk-dl]', backup.download); on('[data-bk-zip]', () => backup.zip());
      });
    },
  };
  // Cadangan otomatis di setiap perangkat yang memuat komponen ini (gate, konsol pengelola, Command Center).
  if (E.init) E.init().then(() => { let t = null; E.subscribe(() => { clearTimeout(t); t = setTimeout(backup.autoSave, 2000); if (t && t.unref) t.unref(); }); backup.autoSave(); }).catch(() => {});

  window.EvtCheckin = { panel, mount, result, anomalies, logTable, stopCam, backup };
})();
