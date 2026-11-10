/* PIN per peran & sesi cookie. Sama untuk LAN dan Vercel:
 *   - PIN: variabel lingkungan (PIN_PENGELOLA, PIN_COMMAND_CENTER) bila diisi; selain itu hash PBKDF2
 *     di data/access.json (format lama server.py tetap terbaca). PIN awal acak dibuat bila belum ada.
 *   - Sesi: cookie HttpOnly "peran.kedaluwarsa.tandaHMAC" (tanpa state). Kunci: SESSION_SECRET, atau
 *     data/session.key yang dibuat otomatis. Ganti PIN lewat CLI memutar kunci ini -> semua sesi lama berakhir.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ROLES, SESSION_TTL } = require('./config');

const cookieName = (role) => 'smicc_' + role.replace(/-/g, '_');
const hashPin = (pin, salt) => crypto.pbkdf2Sync(pin, Buffer.from(salt, 'hex'), 200000, 32, 'sha256').toString('hex');
const eq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return {}; } };

function writeSecret(dir) {
  const s = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'session.key'), s);
  return s;
}

// dataDir null = tanpa file (Vercel): PIN & kunci sesi wajib dari env.
function createAuth({ dataDir = null, env = process.env } = {}) {
  const pins = dataDir ? readJson(path.join(dataDir, 'access.json')) : {};
  let secret = env.SESSION_SECRET || '';
  if (!secret && dataDir) {
    try { secret = fs.readFileSync(path.join(dataDir, 'session.key'), 'utf8').trim(); } catch (e) { /* buat baru */ }
    if (!secret) secret = writeSecret(dataDir);
  }
  const sign = (s) => crypto.createHmac('sha256', secret).update(s).digest('base64url');

  function checkPin(role, pin) {
    if (!/^\d{4,8}$/.test(pin)) return false;
    const want = env[ROLES[role].env];
    if (want) return eq(crypto.createHash('sha256').update(pin).digest('hex'), crypto.createHash('sha256').update(want).digest('hex'));
    const rec = pins[role];
    return !!rec && eq(hashPin(pin, rec.salt), rec.hash);
  }
  function token(role) {
    const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
    return role + '.' + exp + '.' + sign(role + '.' + exp);
  }
  function roles(req) {
    if (!secret) return [];
    const jar = {};
    for (const p of (req.headers.cookie || '').split(';')) { const i = p.indexOf('='); if (i > 0) jar[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }
    return Object.keys(ROLES).filter((role) => {
      const [r, exp, sig] = String(jar[cookieName(role)] || '').split('.');
      return r === role && +exp > Date.now() / 1000 && !!sig && eq(sig, sign(r + '.' + exp));
    });
  }
  return { ready: !!secret, checkPin, token, roles, cookieName };
}

// ------------------------------------------------------------------ CLI (hanya LAN, lewat server.js)
function setPin(dataDir, role, pin) {
  const file = path.join(dataDir, 'access.json');
  const pins = readJson(file);
  const salt = crypto.randomBytes(16).toString('hex');
  pins[role] = { salt, hash: hashPin(pin, salt), updated: Math.floor(Date.now() / 1000) };
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(pins, null, 2));
  writeSecret(dataDir); // semua sesi lama tidak berlaku lagi
}

// Peran tanpa PIN (dan tanpa env) diberi PIN acak 6 digit, dicetak sekali & dicatat di data/PIN_AWAL.txt.
function ensureInitialPins(dataDir, env = process.env) {
  const pins = readJson(path.join(dataDir, 'access.json'));
  const fresh = {};
  for (const role of Object.keys(ROLES)) if (!pins[role] && !env[ROLES[role].env]) fresh[role] = String(crypto.randomInt(1e6)).padStart(6, '0');
  if (!Object.keys(fresh).length) return {};
  for (const [role, pin] of Object.entries(fresh)) {
    const salt = crypto.randomBytes(16).toString('hex');
    pins[role] = { salt, hash: hashPin(pin, salt), updated: Math.floor(Date.now() / 1000) };
  }
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'access.json'), JSON.stringify(pins, null, 2));
  const lines = Object.entries(fresh).map(([r, p]) => '  ' + r.padEnd(15) + ' ' + p + '\n').join('');
  fs.appendFileSync(path.join(dataDir, 'PIN_AWAL.txt'), 'PIN awal (dibuat ' + new Date().toISOString().slice(0, 16).replace('T', ' ')
    + '). Ganti dengan: node server.js --set-pin <peran> <PIN baru>, lalu hapus file ini.\n' + lines);
  return fresh;
}

module.exports = { createAuth, setPin, ensureInitialPins, cookieName };
