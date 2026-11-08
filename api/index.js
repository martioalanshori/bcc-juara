/* Backend Vercel (serverless, tanpa dependensi) — padanan server.py untuk hosting di Vercel.
 * State Event Ticketing disimpan di Redis (Upstash / Vercel KV) lewat REST API; compare-and-swap
 * versi dijalankan atomik dengan skrip Lua sehingga jaminan anti double-booking tetap berlaku.
 * Sesi PIN = cookie HttpOnly bertanda tangan HMAC (stateless). Salah PIN 5x -> kunci 60 detik per IP.
 *
 * Variabel lingkungan:
 *   KV_REST_API_URL, KV_REST_API_TOKEN   (atau UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
 *   PIN_PENGELOLA, PIN_COMMAND_CENTER    (4–8 digit)
 *   SESSION_SECRET                        (string acak panjang)
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { guard } = require('./_guard.js');

const ROLES = {
  pengelola: { label: 'Konsol Pengelola Acara', home: '/app/pengelola.html', pages: ['pengelola.html', 'checkin.html'], env: 'PIN_PENGELOLA' },
  'command-center': { label: 'Command Center · Mall 360', home: '/app/index.html', pages: ['index.html'], env: 'PIN_COMMAND_CENTER' },
};
const SESSION_TTL = 12 * 3600, MAX_FAIL = 5, LOCK_SEC = 60;
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SECRET = process.env.SESSION_SECRET || '';

async function redis(cmd) {
  const r = await fetch(KV_URL, { method: 'POST', headers: { Authorization: 'Bearer ' + KV_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
// KEYS: versi, state. ARGV: base, state baru ('' = hapus). Return {1, versi} | {0, versi, state}
const CAS = `local v=tonumber(redis.call('GET',KEYS[1]) or '0')
if ARGV[1]~='*' and v~=tonumber(ARGV[1]) then return {0,v,redis.call('GET',KEYS[2]) or ''} end
if ARGV[2]=='' then redis.call('DEL',KEYS[2]) else redis.call('SET',KEYS[2],ARGV[2]) end
return {1,redis.call('INCR',KEYS[1])}`;
const cas = (base, st) => redis(['EVAL', CAS, '2', 'evt:v', 'evt:s', base, st]);

const cookieName = (role) => 'smicc_' + role.replace(/-/g, '_');
const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
function cookies(req) {
  const out = {};
  for (const p of (req.headers.cookie || '').split(';')) { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }
  return out;
}
function hasRole(req, role) {
  if (!SECRET) return false;
  const tok = cookies(req)[cookieName(role)]; if (!tok) return false;
  const [r, exp, sig] = tok.split('.');
  if (r !== role || !(+exp > Date.now() / 1000) || !sig) return false;
  const want = sign(r + '.' + exp);
  return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want));
}
function pinOk(role, pin) {
  const want = process.env[ROLES[role].env] || '';
  if (!want) return false;
  const a = crypto.createHash('sha256').update(pin).digest(), b = crypto.createHash('sha256').update(want).digest();
  return crypto.timingSafeEqual(a, b);
}
function gatedPage(p) {
  const m = /^\/app(?:\/([^/?#]*))?\/?$/i.exec(decodeURIComponent(p));
  if (!m) return null;
  const file = (m[1] || 'index.html').toLowerCase();
  for (const [role, c] of Object.entries(ROLES)) if (c.pages.includes(file)) return { role, file };
  return null;
}
const json = (res, code, obj, extra) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); if (extra) for (const k in extra) res.setHeader(k, extra[k]); res.end(JSON.stringify(obj)); };
const now = () => Date.now();

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.searchParams.has('__page') ? '/app/' + (url.searchParams.get('__page') || 'index.html') : url.pathname;
  url.searchParams.delete('__page');
  try {
    // Halaman yang dilindungi PIN (dialihkan ke sini oleh vercel.json)
    const g = gatedPage(p);
    if (g) {
      if (!hasRole(req, g.role)) {
        res.statusCode = 302; res.setHeader('Location', '/app/masuk.html?role=' + g.role + '&next=' + encodeURIComponent(p + url.search)); return res.end();
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'no-store');
      return res.end(fs.readFileSync(path.join(process.cwd(), 'app', g.file)));
    }
    if (p === '/api/health') return json(res, KV_URL ? 200 : 503, { ok: !!KV_URL, now: now() });
    if (p === '/api/auth/me') return json(res, 200, { ok: true, server: true, roles: Object.keys(ROLES).filter((r) => hasRole(req, r)), labels: Object.fromEntries(Object.entries(ROLES).map(([r, c]) => [r, c.label])) });
    if (p === '/api/evt/state' && req.method === 'GET') {
      const known = url.searchParams.has('v') ? parseInt(url.searchParams.get('v'), 10) : null;
      const v = +((await redis(['GET', 'evt:v'])) || 0);
      const out = { version: v, now: now() };
      if (known !== v) { const s = await redis(['GET', 'evt:s']); out.state = s ? JSON.parse(s) : null; }
      return json(res, 200, out);
    }
    if (req.method !== 'POST') return json(res, 404, { ok: false });
    const body = typeof req.body === 'object' && req.body ? req.body : (() => { try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; } })();

    if (p === '/api/evt/state') {
      if (typeof body.base !== 'number') return json(res, 400, { ok: false, error: 'base tidak valid' });
      // Baca versi + state sekaligus (MGET atomik). Base basi -> 409 seperti biasa; selain itu periksa peran,
      // lalu CAS memastikan tidak ada penulisan lain di antara pemeriksaan dan penyimpanan.
      const [v0, s0] = await redis(['MGET', 'evt:v', 'evt:s']);
      const cur = s0 ? JSON.parse(s0) : null;
      if (+(v0 || 0) !== body.base) return json(res, 409, { ok: false, version: +(v0 || 0), state: cur, now: now() });
      const err = guard(cur, body.state == null ? null : body.state, Object.keys(ROLES).filter((r) => hasRole(req, r)), now());
      if (err) return json(res, 403, { ok: false, error: err });
      const r = await cas(String(body.base), body.state == null ? '' : JSON.stringify(body.state));
      if (r[0] === 1) return json(res, 200, { ok: true, version: r[1], now: now() });
      return json(res, 409, { ok: false, version: r[1], state: r[2] ? JSON.parse(r[2]) : null, now: now() });
    }
    if (p === '/api/evt/reset') {
      if (!hasRole(req, 'pengelola')) return json(res, 401, { ok: false, error: 'Reset data event hanya untuk pengelola (masuk dengan PIN pengelola).' });
      const r = await cas('*', '');
      return json(res, 200, { ok: true, version: r[1] });
    }
    if (p === '/api/auth/logout') {
      const role = body.role;
      return json(res, 200, { ok: true }, ROLES[role] ? { 'Set-Cookie': cookieName(role) + '=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict' } : null);
    }
    if (p === '/api/auth/login') {
      const role = body.role, pin = String(body.pin || '');
      if (!ROLES[role]) return json(res, 400, { ok: false, error: 'Peran tidak dikenal.' });
      if (!SECRET) return json(res, 500, { ok: false, error: 'SESSION_SECRET belum diatur di Vercel.' });
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
      const lockKey = 'lock:' + ip + ':' + role, failKey = 'fail:' + ip + ':' + role;
      const ttl = await redis(['TTL', lockKey]);
      if (ttl > 0) return json(res, 429, { ok: false, error: 'Terlalu banyak percobaan. Coba lagi dalam ' + ttl + ' detik.', retry: ttl });
      if (!(/^\d{4,8}$/.test(pin) && pinOk(role, pin))) {
        const n = await redis(['INCR', failKey]); await redis(['EXPIRE', failKey, '900']);
        if (n >= MAX_FAIL) {
          await redis(['DEL', failKey]); await redis(['SET', lockKey, '1', 'EX', String(LOCK_SEC)]);
          return json(res, 429, { ok: false, error: 'PIN salah ' + MAX_FAIL + ' kali. Akses dikunci ' + LOCK_SEC + ' detik.', retry: LOCK_SEC });
        }
        return json(res, 401, { ok: false, error: 'PIN salah. Sisa percobaan: ' + (MAX_FAIL - n) + '.' });
      }
      await redis(['DEL', failKey]);
      const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
      const tok = role + '.' + exp + '.' + sign(role + '.' + exp);
      let next = String(body.next || '');
      const ng = next.startsWith('/') && !next.startsWith('//') ? gatedPage(next.split('?')[0]) : null;
      if (!ng || ng.role !== role) next = ROLES[role].home;
      return json(res, 200, { ok: true, role, next }, { 'Set-Cookie': cookieName(role) + '=' + tok + '; Path=/; Max-Age=' + SESSION_TTL + '; HttpOnly; Secure; SameSite=Strict' });
    }
    return json(res, 404, { ok: false });
  } catch (e) {
    return json(res, 500, { ok: false, error: 'Kesalahan server: ' + e.message });
  }
};
