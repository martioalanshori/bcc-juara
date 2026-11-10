/* Router URL bersih (History API) untuk semua halaman. Dimuat di <head> setelah theme.js.
 * Halaman menyatakan prefiksnya lewat <html data-base="/pengunjung">. Rute di dalam halaman relatif
 * terhadap prefiks itu: /pengunjung/e/EVT-01 -> Router.path() === '/e/EVT-01'.
 *   Router.go('/e/EVT-01')       pindah layar (pushState) + beri tahu pendengar
 *   Router.replace('/sop?id=X')  ganti URL tanpa menggambar ulang (mis. filter yang sudah diterapkan)
 *   Router.on(fn)                dipanggil setiap rute berubah (klik tautan, go(), tombol back/forward)
 *   Router.query()               objek parameter ?k=v
 * Klik <a href="/pengunjung/..."> di halaman yang sama dicegat otomatis; tautan ke halaman lain tetap normal.
 * Alamat lama dengan hash (#/e/EVT-01) diubah ke bentuk baru saat halaman dibuka. */
(function () {
  const base = (document.documentElement.dataset.base || '').replace(/\/+$/, '');
  const subs = [];
  const inBase = (p) => !!base && (p === base || p.startsWith(base + '/'));
  const href = (r) => base + (!r || r === '/' ? '' : r.startsWith('/') || r.startsWith('?') ? r : '/' + r);
  const fire = () => subs.forEach((fn) => fn());

  if (base && location.hash.startsWith('#/')) history.replaceState(null, '', href(location.hash.slice(1)));

  const Router = {
    base,
    href,
    path() { return (inBase(location.pathname) ? location.pathname.slice(base.length) : location.pathname) || '/'; },
    query() { return Object.fromEntries(new URLSearchParams(location.search)); },
    current() { return Router.path() + location.search; },
    go(r) { const u = href(r); if (u !== location.pathname + location.search) history.pushState(null, '', u); fire(); },
    replace(r) { history.replaceState(null, '', href(r)); },
    on(fn) { subs.push(fn); },
  };
  window.addEventListener('popstate', fire);
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !inBase(u.pathname)) return;
    if (u.hash && u.pathname === location.pathname && u.search === location.search) return; // jangkar di halaman ini
    e.preventDefault();
    Router.go(u.pathname.slice(base.length) + u.search);
  });
  window.Router = Router;
})();
