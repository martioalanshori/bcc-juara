/* Komponen tampilan persetujuan acara, dipakai konsol pengelola (/pengelola, menu Persetujuan) dan Command Center
 * (menu Persetujuan Acara). Hanya membaca Evt dan UI; aksi tulis lewat fungsi run(fn, okText) dari pemanggil,
 * yang mengurus toast error dan gambar ulang. window.EvtApproval:
 *   turnBar(e), steps(e), areaLine(e), docs(e, {editable}), bindDocs(root, evId, run), log(e), integrity(e), csv(evId),
 *   decideBox(e, div), bindDecide(root, evId, div, run), ACT, AP_CHIP, SLOW_MS */
(function () {
  const { esc, icon } = UI;
  const ACT = { BUAT: ['Dibuat', 'bg-slate-500/20 text-slate-300'], DOKUMEN: ['Dokumen', 'bg-slate-500/20 text-slate-300'], AJUKAN: ['Diajukan', 'bg-primary/15 text-primary'], SETUJU: ['Disetujui', 'bg-emerald-500/15 text-emerald-300'], DISETUJUI: ['Persetujuan lengkap', 'bg-emerald-500/15 text-emerald-300'], REVISI: ['Revisi', 'bg-rose-500/15 text-rose-300'], STATUS: ['Status', 'bg-primary/15 text-primary'], UBAH: ['Diubah', 'bg-amber-500/15 text-amber-300'], BATAL: ['Dibatalkan', 'bg-rose-500/15 text-rose-300'], REFUND: ['Refund', 'bg-rose-500/15 text-rose-300'], PESAN: ['Pesan', 'bg-slate-500/20 text-slate-300'] };
  const AP_CHIP = { DRAFT: 'bg-slate-500/20 text-slate-300', DIAJUKAN: 'bg-amber-500/15 text-amber-300', REVISI: 'bg-rose-500/15 text-rose-300', DISETUJUI: 'bg-emerald-500/15 text-emerald-300' };
  const SLOW_MS = 2 * 86400000; // menunggu keputusan lebih dari 2 hari = ditandai terlambat
  const DIV_NAME = { event: 'Divisi Event', ops: 'Operasional Mall' };
  const fsize = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
  const dayRange = (a, b) => (Evt.fmtShort(a) === Evt.fmtShort(b) ? Evt.fmtShort(a) + ', ' + Evt.fmtTime(a) + '-' + Evt.fmtTime(b) : Evt.fmtShort(a) + ' sampai ' + Evt.fmtShort(b));

  // "Giliran: …" di atas alur, sama di konsol dan Command Center.
  function turnBar(e) {
    const t = Evt.turn(e); if (!t) return '';
    return `<div class="ap-turn">${icon('arrow_forward', 'text-[18px]')}<b>${esc(t.label)}</b>${UI.chip(esc(Evt.AP_ST[e.approval.st]), AP_CHIP[e.approval.st])}</div>`;
  }

  function steps(e) {
    const ap = e.approval, t = Evt.now(), on = ap.st !== 'DRAFT';
    const li = (cls, ic, title, body) => `<li class="${cls}"><span class="pg-ap-dot">${icon(ic, 'text-[16px]')}</span><div class="min-w-0"><b>${title}</b>${body}</div></li>`;
    const q = (n) => (n ? `<q class="pg-q">${esc(n)}</q>` : '');
    const rows = [on ? li('ok', 'send', 'Pengajuan' + (ap.round > 1 ? ' (putaran ' + ap.round + ')' : ''), `<p>Diajukan penyelenggara ${Evt.fmtDT(ap.submittedAt)}</p>`)
      : li('wait', 'edit_document', 'Pengajuan', '<p>Belum diajukan. Unggah dokumen wajib, lalu ajukan.</p>')];
    Evt.APPROVERS.forEach((a) => {
      const x = (on && ap.steps[a.id]) || {};
      if (x.st === 'SETUJU') rows.push(li('ok', 'check', a.name, `<p>Disetujui ${esc(x.by)}, ${Evt.fmtDT(x.at)}, ditinjau ${Evt.durTxt(x.at - x.since)}</p>${q(x.note)}`));
      else if (x.st === 'REVISI') rows.push(li('bad', 'undo', a.name, `<p>Minta revisi: ${esc(x.by)}, ${Evt.fmtDT(x.at)}</p>${q(x.note)}`));
      else if (x.st === 'MENUNGGU') { const w = t - x.since, slow = w > SLOW_MS; rows.push(li(slow ? 'wait slow' : 'wait', 'hourglass_top', a.name, `<p>Menunggu sejak ${Evt.fmtDT(x.since)}, sudah <b>${Evt.durTxt(w)}</b>${slow ? ' (lewat dari 2 hari)' : ''}</p>`)); }
      else rows.push(li('todo', 'radio_button_unchecked', a.name, `<p>${x.st === 'ANTRE' ? 'Menunggu keputusan tahap sebelumnya' : 'Belum mulai'}</p>`));
    });
    rows.push(e.status !== 'DRAFT' ? li('ok', 'public', 'Publikasi', '<p>Sudah tampil di portal pengunjung</p>')
      : li(ap.st === 'DISETUJUI' ? 'wait' : 'todo', 'public', 'Publikasi', `<p>${ap.st === 'DISETUJUI' ? 'Siap dipublikasikan' : 'Terbuka setelah kedua divisi setuju'}</p>`));
    const first = ap.firstAt || ap.submittedAt;
    const total = ap.st === 'DISETUJUI' ? 'Selesai dalam <b>' + Evt.durTxt(ap.approvedAt - first) + '</b> sejak pengajuan pertama' + (ap.round > 1 ? ', ' + ap.round + ' putaran' : '')
      : ap.st === 'DIAJUKAN' ? 'Sudah berjalan <b>' + Evt.durTxt(t - first) + '</b> sejak pengajuan pertama'
      : ap.st === 'REVISI' ? 'Putaran ' + ap.round + ' dikembalikan untuk revisi, ' + Evt.durTxt(t - first) + ' sejak pengajuan pertama' : '';
    return `<ol class="pg-ap">${rows.join('')}</ol>${total ? `<div class="pg-ap-total">${icon('timer', 'text-[18px]')}<span>${total}</span></div>` : ''}`;
  }

  // Cek otomatis area & jadwal (untuk Divisi Event) dan pemakaian lahan parkir (untuk Operasional Mall).
  function areaLine(e) {
    const A = (Evt.AREAS || []).find((x) => x.id === e.area); if (!A) return '';
    const end = e.end || e.start + 3 * 3600000, c = Evt.areaClash(A.id, e.start, end, e.id);
    const ok = !c.length;
    return `<div class="ap-check ${ok ? 'ok' : 'bad'}">${icon(ok ? 'event_available' : 'event_busy', 'text-[18px]')}<span><b>Area & jadwal:</b> ${esc(A.name)}${A.floor ? ' (' + A.floor + ')' : ''}, ${dayRange(e.start, end)}, ${ok ? 'tidak bentrok' : 'bentrok dengan ' + c.map((x) => esc(x.name)).join(', ')}</span></div>`
      + (A.parking ? `<div class="ap-check warn">${icon('local_parking', 'text-[18px]')}<span><b>Memakai lahan parkir.</b> Kapasitas parkir berkurang selama acara, diperiksa Operasional Mall.</span></div>` : '');
  }

  function docs(e, o) {
    const ap = e.approval, open = !!(o && o.editable) && e.status === 'DRAFT' && (ap.st === 'DRAFT' || ap.st === 'REVISI');
    return `<ul class="pg-docs">${Evt.DOCS.map((d) => {
      const f = ap.docs[d.id];
      return `<li class="${f ? 'ok' : d.req ? 'miss' : ''}">${icon(f ? 'task' : 'draft', 'text-[20px]')}<div class="min-w-0 flex-1"><b>${esc(d.name)}</b> <small>${d.req ? 'wajib' : 'opsional'}, diperiksa ${DIV_NAME[d.by] || '-'}</small><p>${f ? esc(f.name) + ' · ' + fsize(f.size) + ' · ' + Evt.fmtDT(f.at) + ' oleh ' + esc(f.by) : 'Belum diunggah'}</p></div>${open ? `<label class="btn-ghost !py-1 pg-upload">${icon('upload', 'text-[16px]')} ${f ? 'Ganti' : 'Unggah'}<input type="file" class="sr-only" data-doc-up="${d.id}" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"></label>${f ? `<button type="button" class="btn-ghost !py-1" data-doc-del="${d.id}" aria-label="Hapus ${esc(d.name)}">${icon('delete', 'text-[16px]')}</button>` : ''}` : ''}</li>`;
    }).join('')}</ul><p class="font-label-sm text-label-sm text-on-surface-variant mt-2">Prototype: yang dicatat hanya nama dan ukuran file sebagai bukti di log. Isi file tidak dikirim ke server.</p>`;
  }
  function bindDocs(root, id, run) {
    root.querySelectorAll('[data-doc-up]').forEach((inp) => inp.addEventListener('change', () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      if (f.size > 20 * 1024 * 1024) return UI.toast('Ukuran file maksimal 20 MB', 'P3');
      run(() => Evt.uploadDoc(id, inp.dataset.docUp, { name: f.name, size: f.size }), 'Dokumen dicatat: ' + esc(f.name));
    }));
    root.querySelectorAll('[data-doc-del]').forEach((b) => b.addEventListener('click', async () => {
      const d = Evt.DOCS.find((x) => x.id === b.dataset.docDel);
      if (await UI.confirm({ title: 'Hapus dokumen?', body: esc(d.name) + ' dihapus dari pengajuan. Penghapusan tetap tercatat di log.', confirmText: 'Hapus', danger: true })) run(() => Evt.removeDoc(id, d.id), 'Dokumen dihapus');
    }));
  }

  function log(e) {
    const rows = (e.audit || []).map((x, i) => Object.assign({ i }, x)).reverse();
    if (!rows.length) return '<p class="font-body-sm text-body-sm text-on-surface-variant">Belum ada aktivitas tercatat. Mulai sekarang setiap perubahan pada acara ini masuk ke log.</p>';
    return `<div class="overflow-x-auto"><table class="tbl pg-log"><thead><tr><th>#</th><th>Waktu</th><th>Pelaku</th><th>Aktivitas</th></tr></thead><tbody>${rows.map((x) => {
      const a = ACT[x.act] || [x.act, 'bg-slate-500/20 text-slate-300'];
      return `<tr><td class="font-label-sm text-label-sm text-on-surface-variant">${x.i + 1}</td><td class="whitespace-nowrap"><div class="font-body-sm text-body-sm">${Evt.fmtDT(x.ts)}</div><code class="pg-hash" title="Kode rantai log">${esc(x.h)}</code></td><td><div class="font-body-sm text-body-sm">${esc(x.by)}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${esc(x.role)}</div></td><td>${UI.chip(a[0], a[1])} <span class="font-body-sm text-body-sm">${esc(x.text)}</span>${x.note ? `<q class="pg-q">${esc(x.note)}</q>` : ''}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  // Tanda keutuhan log + tombol unduh CSV (id="csv-audit", diikat lewat bindCsv).
  function integrity(e) {
    const v = Evt.verifyAudit(e);
    const chip = v.ok ? UI.chip(icon('verified_user', 'text-[14px]') + ' Log utuh, ' + v.n + ' entri', 'bg-emerald-500/15 text-emerald-300') : UI.chip(icon('gpp_bad', 'text-[14px]') + ' Log tidak cocok mulai entri #' + (v.at + 1), 'bg-rose-500/15 text-rose-300');
    return `<div class="flex flex-wrap items-center gap-2">${chip}<button type="button" class="btn-ghost !py-1" data-csv-audit="${esc(e.id)}"${v.n ? '' : ' disabled'}>${icon('download', 'text-[16px]')} Unduh CSV</button></div>`;
  }
  function csv(id) {
    const e = Evt.ev(id); if (!e) return;
    const rows = [['No', 'Waktu', 'Pelaku', 'Peran', 'Aksi', 'Keterangan', 'Catatan', 'Kode rantai']];
    (e.audit || []).forEach((x, i) => rows.push([i + 1, Evt.fmtDT(x.ts), x.by, x.role, (ACT[x.act] || [x.act])[0], x.text, x.note || '', x.h]));
    Evt.csv('log_aktivitas_' + id + '.csv', rows);
  }

  // Kotak keputusan untuk divisi yang sedang gilirannya (Command Center). Kosong bila bukan gilirannya.
  function decideBox(e, div) {
    const c = Evt.currentStep(e);
    if (!c || c.id !== div || e.status !== 'DRAFT') return '';
    return `<div class="inner p-3 mt-4"><div class="lbl mb-1">Keputusan ${c.name}</div>
      <label class="f">Catatan (wajib bila minta revisi)<textarea class="inp" id="ap-note" rows="2" maxlength="300" placeholder="Mis. syarat atau alasan revisi"></textarea></label>
      <div class="flex flex-wrap gap-2 mt-3"><button type="button" class="btn" data-decide="1">${icon('check', 'text-[16px]')} Setujui</button><button type="button" class="btn-ghost" data-decide="0">${icon('undo', 'text-[16px]')} Minta revisi</button></div></div>`;
  }
  function bindDecide(root, id, div, run) {
    const note = () => { const n = root.querySelector('#ap-note'); return n ? n.value.trim() : ''; };
    root.querySelectorAll('[data-decide]').forEach((b) => b.addEventListener('click', async () => {
      const ok = b.dataset.decide === '1', c = Evt.currentStep(Evt.ev(id)); if (!c || c.id !== div) return;
      if (ok && !(await UI.confirm({ title: 'Setujui sebagai ' + c.name + '?', body: 'Keputusan dicatat di log dengan nama Anda dan waktu sekarang, dan tidak bisa diubah.', confirmText: 'Setujui' }))) return;
      const r = await run(() => Evt.decide(id, c.id, ok, note()));
      if (r) UI.toast(r === 'REVISI' ? 'Revisi diminta dan tercatat di log' : r === 'NEXT' ? c.name + ' menyetujui, diteruskan ke tahap berikutnya' : 'Persetujuan lengkap, acara siap dipublikasikan', 'P4');
    }));
  }
  // Mode demo: setelah tiap langkah, tombol untuk pindah ke akun yang gilirannya berikutnya (satu klik, tanpa login ulang).
  // me = hasil /api/auth/me; current = peran yang sedang dipakai di halaman ini. Kosong bila bukan mode demo atau giliran = akun ini.
  function nextStepCard(e, me, current) {
    const t = Evt.turn(e); if (!t || !me || !me.demo || !me.demoAccounts) return '';
    const acc = (role) => me.demoAccounts.find((a) => a.role === role);
    const tenant = acc('tenant');
    const target = t.who === 'event' ? acc('divisi-event') : t.who === 'ops' ? acc('divisi-ops') : tenant && e.org === tenant.org ? tenant : acc('pengelola');
    if (!target || target.role === current) return '';
    const next = target.role.startsWith('divisi') ? '/command-center/persetujuan?ev=' + encodeURIComponent(e.id) : '/pengelola/e/' + encodeURIComponent(e.id) + '/persetujuan';
    const lbl = target.role.startsWith('divisi') ? 'Lanjut sebagai ' + target.label : 'Kembali ke ' + target.label;
    return `<div class="ap-next">${icon('play_circle', 'text-[22px]')}<div class="min-w-0 flex-1"><b>Langkah demo berikutnya</b><span>${esc(t.label)}. Pindah akun tanpa login ulang.</span></div><button type="button" class="btn" data-switch-email="${esc(target.email)}" data-switch-next="${esc(next)}">${esc(lbl)} ${icon('arrow_forward', 'text-[18px]')}</button></div>`;
  }
  function bindCsv(root) { root.querySelectorAll('[data-csv-audit]').forEach((b) => b.addEventListener('click', () => csv(b.dataset.csvAudit))); }

  window.EvtApproval = { nextStepCard, turnBar, steps, areaLine, docs, bindDocs, log, integrity, csv, bindCsv, decideBox, bindDecide, ACT, AP_CHIP, SLOW_MS, DIV_NAME };
})();
