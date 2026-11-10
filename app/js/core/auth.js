/* Sesi login staf per peran (server.js). Menampilkan tombol "Keluar" pada elemen [data-logout="<peran> [peran lain]"]:
 * dipakai peran pertama dalam daftar yang sesinya aktif. Tanpa server.js (mode lokal) tombol disembunyikan. */
(function () {
  async function me() {
    try { const r = await fetch('/api/auth/me', { cache: 'no-store' }); if (!r.ok) return null; return await r.json(); } catch (e) { return null; }
  }
  async function logout(role) {
    try { await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) }); } catch (e) { /* abaikan */ }
    location.href = '/';
  }
  window.SMAuth = { me, logout };
  document.addEventListener('DOMContentLoaded', async () => {
    const els = document.querySelectorAll('[data-logout]'); if (!els.length) return;
    const m = await me();
    els.forEach((el) => {
      const role = m && m.server ? el.dataset.logout.split(/\s+/).find((r) => m.roles.includes(r)) : null;
      if (!role) { el.hidden = true; return; }
      el.hidden = false;
      el.addEventListener('click', async () => {
        const name = m.labels[role] || 'sesi ini';
        // Dialog bertema bila halaman memuat core/ui.js (konsol & Command Center), selain itu confirm() bawaan.
        const ok = window.UI && UI.confirm ? await UI.confirm({ title: 'Keluar dari ' + name + '?', body: 'Anda perlu masuk lagi dengan email dan password untuk membuka portal ini.', confirmText: 'Keluar' }) : confirm('Keluar dari ' + name + '?');
        if (ok) logout(role);
      });
    });
  });
})();
