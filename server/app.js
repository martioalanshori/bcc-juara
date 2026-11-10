/* Aplikasi web tunggal (tanpa dependensi): halaman ber-URL bersih, aset statis, API Event Ticketing & PIN.
 * Dipakai server.js (LAN, `node server.js`) dan api/index.js (Vercel). Hanya penyimpanan yang berbeda.
 *
 * API:
 *   GET  /api/health               -> {ok, now, poll}  (503 bila penyimpanan belum diatur -> browser pakai mode lokal)
 *       poll {min, max, hidden} = jadwal tarik state untuk browser (ms), lihat engine.js pollTick.
 *   GET  /api/auth/me              -> {ok, server, roles, labels}
 *   GET  /api/evt/state[?v=N]      -> {version, now, state?}  (state hanya bila versi berubah)
 *   POST /api/evt/state  {base, state} -> 200 {ok, version} | 409 {ok:false, version, state} | 403 {ok:false, error}
 *       Compare-and-swap berversi: dua pembeli yang mengunci kursi sama bersamaan -> satu commit berhasil,
 *       yang lain 409, membaca ulang, dan mendapati kursi sudah dipegang orang lain (anti double-booking).
 *   POST /api/evt/reset            -> hapus state (sesi pengelola)
 *   POST /api/auth/login {role, pin, next} | /api/auth/logout {role}
 */
const fs = require('fs');
const path = require('path');
const { ROLES, LEGACY, STATIC_DIRS, SESSION_TTL, MAX_FAIL, LOCK_SEC, pageFor } = require('./config');
const { guard } = require('./guard');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const MAX_BODY = 5 * 1024 * 1024;

// opts: root (folder proyek), store (lihat store.js; null = belum diatur), auth (auth.js),
//       secureCookie (true di HTTPS), clientIp(req) (alamat untuk kunci salah PIN),
//       poll (jadwal tarik state di browser; default LAN = tiap 1 detik, juga saat tab tersembunyi).
const LAN_POLL = { min: 1000, max: 1000, hidden: true };
function createApp({ root, store, auth, secureCookie = false, clientIp = (req) => req.socket.remoteAddress || 'unknown', poll = LAN_POLL }) {
  const now = () => Date.now();
  const send = (res, code, headers, body) => { res.writeHead(code, headers); res.end(res.req.method === 'HEAD' ? undefined : body); };
  const json = (res, code, obj, extra) => send(res, code, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store', ...extra }, JSON.stringify(obj));
  const redirect = (res, code, to) => send(res, code, { Location: to, 'Cache-Control': 'no-store' }, '');
  const cookie = (role, val, age) => auth.cookieName(role) + '=' + val + '; Path=/; Max-Age=' + age + '; HttpOnly; SameSite=Strict' + (secureCookie ? '; Secure' : '');
  // Tujuan setelah login: hanya path lokal yang memang halaman peran itu.
  const safeNext = (next, role) => {
    const n = String(next || '');
    const pg = n.startsWith('/') && !n.startsWith('//') ? pageFor(n.split(/[?#]/)[0]) : null;
    return pg && pg.role === role ? n : ROLES[role].home;
  };

  async function readBody(req) {
    if ('body' in req && req.body !== undefined) return typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}'); // Vercel
    const chunks = []; let n = 0;
    for await (const c of req) { n += c.length; if (n > MAX_BODY) throw Object.assign(new Error('besar'), { code: 413 }); chunks.push(c); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  }

  function serveFile(res, file, cache) {
    let data;
    try { data = fs.readFileSync(file); } catch (e) { return json(res, 404, { ok: false, error: 'Tidak ditemukan' }); }
    const ext = path.extname(file).toLowerCase();
    send(res, 200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': cache || (/\.(html|js|css)$/.test(ext) ? 'no-store' : 'public, max-age=86400') }, data);
  }

  async function api(req, res, p, url) {
    const roles = auth.roles(req);
    if (req.method === 'GET' || req.method === 'HEAD') {
      if (p === '/api/health') return json(res, store ? 200 : 503, { ok: !!store, now: now(), poll });
      if (p === '/api/auth/me') return json(res, 200, { ok: true, server: true, roles, labels: Object.fromEntries(Object.entries(ROLES).map(([r, c]) => [r, c.label])) });
      if (p === '/api/evt/state') {
        if (!store) return json(res, 503, { ok: false, error: 'Penyimpanan belum diatur.' });
        const known = url.searchParams.has('v') ? parseInt(url.searchParams.get('v'), 10) : null;
        return json(res, 200, { ...(await store.read(known)), now: now() });
      }
      return json(res, 404, { ok: false });
    }
    if (req.method !== 'POST') return json(res, 405, { ok: false });
    let body;
    try { body = await readBody(req); } catch (e) { return json(res, e.code || 400, { ok: false, error: 'JSON tidak valid' }); }
    if (!body || typeof body !== 'object') body = {};

    if (p === '/api/evt/state') {
      if (!store) return json(res, 503, { ok: false, error: 'Penyimpanan belum diatur.' });
      if (!Number.isInteger(body.base)) return json(res, 400, { ok: false, error: 'base tidak valid' });
      const next = body.state == null ? null : body.state;
      const r = await store.write(body.base, next, (cur) => guard(cur, next, roles, now()));
      if (r.ok) return json(res, 200, { ok: true, version: r.version, now: now() });
      if (r.error) return json(res, 403, { ok: false, error: r.error });
      return json(res, 409, { ok: false, version: r.version, state: r.state, now: now() });
    }
    if (p === '/api/evt/reset') {
      if (!roles.includes('pengelola')) return json(res, 401, { ok: false, error: 'Reset data event hanya untuk pengelola (masuk dengan PIN pengelola).' });
      if (!store) return json(res, 503, { ok: false, error: 'Penyimpanan belum diatur.' });
      const r = await store.write('*', null);
      return json(res, 200, { ok: true, version: r.version });
    }
    if (p === '/api/auth/logout') {
      const role = body.role;
      return json(res, 200, { ok: true }, ROLES[role] ? { 'Set-Cookie': cookie(role, '', 0) } : null);
    }
    if (p === '/api/auth/login') {
      const role = body.role, pin = String(body.pin || '');
      if (!ROLES[role]) return json(res, 400, { ok: false, error: 'Peran tidak dikenal.' });
      if (!auth.ready) return json(res, 500, { ok: false, error: 'SESSION_SECRET belum diatur.' });
      if (!store) return json(res, 503, { ok: false, error: 'Penyimpanan belum diatur.' });
      const key = clientIp(req) + ':' + role;
      const left = await store.lockLeft(key);
      if (left > 0) return json(res, 429, { ok: false, error: 'Terlalu banyak percobaan. Coba lagi dalam ' + left + ' detik.', retry: left });
      if (!auth.checkPin(role, pin)) {
        const n = await store.fail(key);
        if (n >= MAX_FAIL) {
          await store.lock(key, LOCK_SEC);
          return json(res, 429, { ok: false, error: 'PIN salah ' + MAX_FAIL + ' kali. Akses dikunci ' + LOCK_SEC + ' detik.', retry: LOCK_SEC });
        }
        return json(res, 401, { ok: false, error: 'PIN salah. Sisa percobaan: ' + (MAX_FAIL - n) + '.' });
      }
      await store.clear(key);
      return json(res, 200, { ok: true, role, next: safeNext(body.next, role) }, { 'Set-Cookie': cookie(role, auth.token(role), SESSION_TTL) });
    }
    return json(res, 404, { ok: false });
  }

  return async function handler(req, res) {
    const url = new URL(req.url, 'http://x');
    // Vercel meneruskan path asli lewat ?__path= (lihat vercel.json); di LAN path dipakai langsung.
    let p = url.searchParams.get('__path') || url.pathname;
    url.searchParams.delete('__path');
    try { p = decodeURIComponent(p); } catch (e) { return json(res, 400, { ok: false }); }
    const qs = url.search;
    try {
      if (p.startsWith('/api/')) return await api(req, res, p, url);
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { ok: false });

      const legacy = LEGACY[p.replace(/\/+$/, '') || '/'] || LEGACY[p];
      if (legacy) return redirect(res, 301, legacy + qs);

      const page = pageFor(p);
      if (page) {
        if (page.role && !auth.roles(req).includes(page.role)) return redirect(res, 302, '/masuk?role=' + page.role + '&next=' + encodeURIComponent(p + qs));
        return serveFile(res, path.join(root, page.file), 'no-store');
      }

      // Aset: file harus benar-benar berada di dalam folder statis (kebal ../ dan %2e%2e).
      const file = path.resolve(root, '.' + p);
      const inStatic = STATIC_DIRS.some((d) => file.startsWith(path.resolve(root, '.' + d) + path.sep));
      if (inStatic && path.extname(file).toLowerCase() !== '.html' && fs.existsSync(file) && fs.statSync(file).isFile()) return serveFile(res, file);
      return send(res, 404, { 'Content-Type': TYPES['.txt'] }, 'Halaman tidak ditemukan.');
    } catch (e) {
      return json(res, 500, { ok: false, error: 'Kesalahan server: ' + e.message });
    }
  };
}

module.exports = { createApp };
