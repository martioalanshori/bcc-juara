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
  // Menu profil: bagian "Ubah peran" pada elemen [data-demo-switch] (Pengelola, Command Center, Pengunjung).
  // Empat peran utama, peran yang sedang dipakai ditandai "Aktif". Akun demo lain (Divisi Event, Operasional Mall,
  // Petugas gate) di bawah "Akun lain". Mode demo: pindah akun satu klik (/api/auth/demo). Bukan mode demo atau tanpa
  // server: tautan ke halaman masuk peran itu.
  const escH = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MAIN = [
    ['pengunjung', 'Pengunjung', 'Beli tiket & lihat e-ticket', 'person', '/pengunjung'],
    ['pengelola', 'Pengelola', 'Tim Event Mall', 'event_note', '/pengelola'],
    ['tenant', 'Tenant', 'Penyelenggara acara (EO)', 'storefront', '/pengelola'],
    ['command-center', 'Command Center', 'Operator mall', 'hub', '/command-center'],
  ];
  function currentRole(m) {
    const p = location.pathname, a = (m && m.active) || {};
    if (p.startsWith('/pengunjung')) return 'pengunjung';
    if (p.startsWith('/pengelola')) return a['/pengelola'] || 'pengelola';
    if (p.startsWith('/command-center')) return a['/command-center'] || 'command-center';
    if (p.startsWith('/checkin')) return a['/checkin'] || 'gate';
    return '';
  }
  function roleItem(role, label, sub, icon, home, cur, accs) {
    const inner = '<span class="material-symbols-outlined text-[20px]">' + escH(icon) + '</span><span class="pg-sw-t"><b>' + escH(label) + '</b><small>' + escH(sub) + '</small></span>';
    if (role === cur) return '<div class="pg-sw-it is-cur" aria-current="true">' + inner + '<em>Aktif</em></div>';
    if (role === 'pengunjung') return '<a class="pg-sw-it" href="' + escH(home) + '">' + inner + '</a>';
    const acc = accs.find((x) => x.role === role);
    if (acc) return '<button type="button" class="pg-sw-it" data-switch-email="' + escH(acc.email) + '" data-switch-next="' + escH(acc.home || home) + '">' + inner + '</button>';
    return '<a class="pg-sw-it" href="/masuk?role=' + encodeURIComponent(role) + '&amp;next=' + encodeURIComponent(home) + '">' + inner + '</a>';
  }
  function renderSwitch(m) {
    const boxes = document.querySelectorAll('[data-demo-switch]'); if (!boxes.length) return;
    const accs = (m && m.demo && m.demoAccounts) || [], cur = currentRole(m);
    const main = MAIN.map(([r, l, s, i, h]) => roleItem(r, l, s, i, h, cur, accs)).join('');
    const others = accs.filter((a) => !MAIN.some((x) => x[0] === a.role));
    const more = others.length ? '<details class="pg-sw-more"' + (others.some((a) => a.role === cur) ? ' open' : '') + '><summary>Akun lain</summary>'
      + others.map((a) => roleItem(a.role, a.label, a.group, a.icon, a.home, cur, accs)).join('') + '</details>' : '';
    boxes.forEach((box) => { box.hidden = false; box.innerHTML = '<div class="pg-sw-h">Ubah peran</div>' + main + more; });
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
