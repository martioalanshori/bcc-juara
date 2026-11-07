/* Jembatan Event Ticketing -> Command Center (hanya dimuat di app/index.html).
 * SOP-EVT-03: >= 3 pindaian gagal/duplikat per gate dalam 10 menit, atau laporan petugas gate,
 * otomatis menjadi tiket insiden P2. Klaim dilakukan atomik di state Evt (CAS), jadi bila beberapa
 * browser Command Center terbuka hanya satu yang membuat tiket. Klaim yang menggantung > 60 detik
 * (browser ditutup sebelum tiket dibuat) boleh diambil alih browser CC lain.
 * Keterbatasan: tiket insiden disimpan di Store (localStorage) browser CC yang mengklaim; browser CC
 * lain hanya melihat nomor tiketnya di laporan gate. */
(function () {
  if (!window.Evt || !window.Store) return;
  const KEY = 'smicc-cc-id';
  let me = null;
  try { me = localStorage.getItem(KEY); if (!me) { me = 'CC-' + Math.random().toString(36).slice(2, 7).toUpperCase(); localStorage.setItem(KEY, me); } } catch (e) { me = 'CC-' + Math.random().toString(36).slice(2, 7).toUpperCase(); }
  let busy = false;

  async function open(id) {
    const r = Evt.s.reports.find((x) => x.id === id); const e = r && Evt.ev(r.ev);
    if (!r || !e) return;
    const t = Store.createTicket(EvtAdmin.incidentFields(e, r.gate, r.text, r.auto ? 'Otomatis: anomali check-in (DB-EVT)' : 'Laporan petugas gate (DB-EVT)'));
    await Evt.linkReport(id, t.id);
    if (window.UI) UI.toast('Tiket insiden ' + t.id + ' dibuat otomatis untuk ' + UI.esc(r.gate), 'P2');
  }

  async function check() {
    if (busy || !Evt.s) return; busy = true;
    try {
      const t = Evt.now();
      for (const id of Evt.s.order) {
        const e = Evt.ev(id);
        if (!e || e.status === 'DRAFT' || e.status === 'CANCELLED') continue;
        for (const a of Evt.anomalies(id)) { const rid = await Evt.claimAnomaly(id, a.gate, me); if (rid) await open(rid); }
        const pending = Evt.s.reports.filter((r) => r.ev === id && !r.ticketId && r.ts > t - 30 * 60000).map((r) => r.id);
        for (const rid0 of pending) { const rid = await Evt.claimReport(rid0, me); if (rid) await open(rid); }
      }
    } catch (err) { console.warn('cc-bridge:', err && err.message); } finally { busy = false; }
  }

  Evt.init().then(() => { Evt.subscribe(() => setTimeout(check, 0)); check(); setInterval(check, 5000); });
})();
