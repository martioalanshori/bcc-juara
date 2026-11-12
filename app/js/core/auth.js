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
  // Mode demo: masuk sebagai akun lain tanpa password lalu buka halaman tujuan (POST /api/auth/demo).
  async function switchTo(email, next) {
    try {
      const r = await fetch('/api/auth/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, next }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || 'Ganti akun gagal.');
      location.assign(j.next);
    } catch (e) { if (window.UI && UI.toast) UI.toast(e.message, 'P2'); else alert(e.message); }
  }
  window.SMAuth = { me, logout, switchTo };
  // Tombol "Lanjut sebagai …" (data-switch-email + data-switch-next) di halaman mana pun.
  document.addEventListener('click', (ev) => { const b = ev.target.closest('[data-switch-email]'); if (!b) return; ev.preventDefault(); b.disabled = true; switchTo(b.dataset.switchEmail, b.dataset.switchNext || ''); });
  // Menu profil: daftar "Ganti akun demo" pada elemen [data-demo-switch] (hanya mode demo).
  const escH = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function renderSwitch(m) {
    const boxes = document.querySelectorAll('[data-demo-switch]'); if (!boxes.length) return;
    const accs = (m && m.demo && m.demoAccounts) || [];
    boxes.forEach((box) => {
      if (!accs.length) { box.hidden = true; return; }
      box.hidden = false;
      box.innerHTML = '<div class="pg-sw-h">Ganti akun demo</div>' + accs.filter((a) => !(m.roles || []).includes(a.role)).map((a) => '<button type="button" data-switch-email="' + escH(a.email) + '" data-switch-next="' + escH(a.home) + '"><span class="material-symbols-outlined text-[20px]">' + escH(a.icon) + '</span><span><b>' + escH(a.label) + '</b><small>' + escH(a.group) + '</small></span></button>').join('');
    });
  }
  document.addEventListener('DOMContentLoaded', async () => {
    const els = document.querySelectorAll('[data-logout]');
    const m = await me();
    renderSwitch(m);
    if (!els.length) return;
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
