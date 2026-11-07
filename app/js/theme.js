/* Mode gelap/terang. Dimuat di <head> tanpa defer agar halaman tidak berkedip saat dibuka.
   Pilihan disimpan per perangkat; bila belum pernah dipilih, mengikuti pengaturan perangkat.
   Tombol apa pun dengan atribut data-theme-toggle akan mengganti mode. */
(function () {
  const KEY = 'smicc-theme';
  const root = document.documentElement;
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function current() { return root.getAttribute('data-theme') || 'dark'; }
  function syncButtons() {
    const t = current();
    document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
      const next = t === 'dark' ? 'terang' : 'gelap';
      b.setAttribute('aria-label', 'Ganti ke mode ' + next);
      b.setAttribute('title', 'Ganti ke mode ' + next);
      const ic = b.querySelector('.material-symbols-outlined');
      if (ic) ic.textContent = t === 'dark' ? 'light_mode' : 'dark_mode';
    });
  }
  function apply(t) { root.setAttribute('data-theme', t); syncButtons(); }
  function set(t) { try { localStorage.setItem(KEY, t); } catch (e) { /* mode privat: abaikan */ } apply(t); }

  apply(saved() || (mq && mq.matches ? 'light' : 'dark'));
  if (mq && mq.addEventListener) mq.addEventListener('change', (e) => { if (!saved()) apply(e.matches ? 'light' : 'dark'); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (b) set(current() === 'dark' ? 'light' : 'dark');
  });
  document.addEventListener('DOMContentLoaded', syncButtons);
  window.Theme = { set, current, sync: syncButtons };
})();
