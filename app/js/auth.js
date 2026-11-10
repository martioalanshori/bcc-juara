/* Sesi PIN per peran (server.js). Menampilkan tombol "Keluar" pada elemen [data-logout="<peran>"].
 * Tanpa server.js (mode lokal) tombol disembunyikan karena akses PIN tidak berlaku. */
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
      if (!m || !m.server || !m.roles.includes(el.dataset.logout)) { el.hidden = true; return; }
      el.hidden = false;
      el.addEventListener('click', () => { if (confirm('Keluar dari ' + (m.labels[el.dataset.logout] || 'sesi ini') + '?')) logout(el.dataset.logout); });
    });
  });
})();
