/* Penyimpanan state Event Ticketing + penghitung salah PIN. Dua implementasi dengan antarmuka sama:
 *   fileStore(dir)   -> LAN: data/event_state.json, penghitung di memori (Node satu thread = atomik).
 *   redisStore(url, token) -> Vercel: Upstash Redis REST, CAS versi atomik lewat skrip Lua.
 *
 * Antarmuka:
 *   read(known)                 -> {version, state?}  (state hanya bila versi != known)
 *   write(base, state, check)   -> {ok:true, version} | {ok:false, version, state} (409) | {ok:false, error} (403)
 *       base '*' = tanpa cek versi (reset). check(cur) dipanggil dengan state saat ini, kembalikan pesan untuk menolak.
 *   lockLeft(key) -> detik tersisa | 0, fail(key) -> jumlah gagal, lock(key, sec), clear(key)
 */
const fs = require('fs');
const path = require('path');

function fileStore(dir) {
  const file = path.join(dir, 'event_state.json');
  const db = { version: 0, state: null };
  try { Object.assign(db, JSON.parse(fs.readFileSync(file, 'utf8'))); } catch (e) { /* belum ada: mulai kosong */ }
  const persist = () => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file + '.tmp', JSON.stringify(db));
    fs.renameSync(file + '.tmp', file);
  };
  const kv = new Map(); // key -> {n, exp(ms)}
  const get = (k) => { const x = kv.get(k); if (x && x.exp <= Date.now()) { kv.delete(k); return null; } return x; };
  return {
    kind: 'file',
    async read(known) {
      return known === db.version ? { version: db.version } : { version: db.version, state: db.state };
    },
    // Sinkron dari awal sampai akhir: tidak ada penulisan lain yang bisa menyela di antara cek dan simpan.
    async write(base, state, check) {
      if (base !== '*' && base !== db.version) return { ok: false, version: db.version, state: db.state };
      const err = check && check(db.state);
      if (err) return { ok: false, error: err };
      db.version += 1; db.state = state; persist();
      return { ok: true, version: db.version };
    },
    async lockLeft(key) { const x = get('lock:' + key); return x ? Math.ceil((x.exp - Date.now()) / 1000) : 0; },
    async fail(key) { const x = get('fail:' + key) || { n: 0 }; const n = x.n + 1; kv.set('fail:' + key, { n, exp: Date.now() + 900e3 }); return n; },
    async lock(key, sec) { kv.delete('fail:' + key); kv.set('lock:' + key, { n: 1, exp: Date.now() + sec * 1000 }); },
    async clear(key) { kv.delete('fail:' + key); },
  };
}

// KEYS: versi, state. ARGV: base ('*' = abaikan), state baru ('' = hapus). Return {1, versi} | {0, versi, state}
const CAS = `local v=tonumber(redis.call('GET',KEYS[1]) or '0')
if ARGV[1]~='*' and v~=tonumber(ARGV[1]) then return {0,v,redis.call('GET',KEYS[2]) or ''} end
if ARGV[2]=='' then redis.call('DEL',KEYS[2]) else redis.call('SET',KEYS[2],ARGV[2]) end
return {1,redis.call('INCR',KEYS[1])}`;

function redisStore(url, token) {
  async function redis(cmd) {
    const r = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
    const j = await r.json();
    if (j.error) throw new Error(j.error);
    return j.result;
  }
  const parse = (s) => (s ? JSON.parse(s) : null);
  return {
    kind: 'redis',
    async read(known) {
      const v = +((await redis(['GET', 'evt:v'])) || 0);
      return known === v ? { version: v } : { version: v, state: parse(await redis(['GET', 'evt:s'])) };
    },
    // Baca versi + state sekaligus (MGET atomik), periksa, lalu CAS memastikan tidak ada penulisan lain di antaranya.
    async write(base, state, check) {
      if (base !== '*') {
        const [v0, s0] = await redis(['MGET', 'evt:v', 'evt:s']);
        const cur = parse(s0);
        if (+(v0 || 0) !== base) return { ok: false, version: +(v0 || 0), state: cur };
        const err = check && check(cur);
        if (err) return { ok: false, error: err };
      }
      const r = await redis(['EVAL', CAS, '2', 'evt:v', 'evt:s', String(base), state == null ? '' : JSON.stringify(state)]);
      return r[0] === 1 ? { ok: true, version: r[1] } : { ok: false, version: r[1], state: parse(r[2]) };
    },
    async lockLeft(key) { const t = await redis(['TTL', 'lock:' + key]); return t > 0 ? t : 0; },
    async fail(key) { const n = await redis(['INCR', 'fail:' + key]); await redis(['EXPIRE', 'fail:' + key, '900']); return n; },
    async lock(key, sec) { await redis(['DEL', 'fail:' + key]); await redis(['SET', 'lock:' + key, '1', 'EX', String(sec)]); },
    async clear(key) { await redis(['DEL', 'fail:' + key]); },
  };
}

module.exports = { fileStore, redisStore };
