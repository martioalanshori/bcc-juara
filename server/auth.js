/* Login staf (email + password) & sesi cookie. Sama untuk LAN dan Vercel:
 *   - Akun: ACCOUNTS di server/config.js (email -> peran). Password: env STAFF_PASSWORD bila diisi, selain itu
 *     DEMO_PASSWORD (ditampilkan di /masuk untuk demo). Versi baru memakai Supabase Auth (docs/rewrite/PRD.md).
 *   - Sesi: cookie HttpOnly "peran.kedaluwarsa.tandaHMAC" (tanpa state). Kunci: SESSION_SECRET, atau
 *     data/session.key yang dibuat otomatis (LAN).
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ROLES, ACCOUNTS, DEMO_PASSWORD, SESSION_TTL } = require('./config');

const cookieName = (role) => 'smicc_' + role.replace(/-/g, '_');
const digest = (s) => crypto.createHash('sha256').update(String(s)).digest();

// dataDir null = tanpa file (Vercel): kunci sesi wajib dari env SESSION_SECRET.
function createAuth({ dataDir = null, env = process.env } = {}) {
  let secret = env.SESSION_SECRET || '';
  if (!secret && dataDir) {
    try { secret = fs.readFileSync(path.join(dataDir, 'session.key'), 'utf8').trim(); } catch (e) { /* buat baru */ }
    if (!secret) {
      secret = crypto.randomBytes(32).toString('hex');
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(path.join(dataDir, 'session.key'), secret);
    }
  }
  const password = env.STAFF_PASSWORD || DEMO_PASSWORD;
  const sign = (s) => crypto.createHmac('sha256', secret).update(s).digest('base64url');

  // Akun bila email & password cocok, selain itu null. Perbandingan password waktu-konstan.
  function checkLogin(email, pass) {
    const acc = ACCOUNTS.find((a) => a.email === String(email || '').trim().toLowerCase());
    const ok = crypto.timingSafeEqual(digest(pass), digest(password));
    return acc && ok ? acc : null;
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
      if (r !== role || !(+exp > Date.now() / 1000) || !sig) return false;
      const a = Buffer.from(sig), b = Buffer.from(sign(r + '.' + exp));
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });
  }
  // demo = memakai password demo (env STAFF_PASSWORD kosong): ganti akun satu klik (/api/auth/demo) diizinkan.
  return { ready: !!secret, demo: !env.STAFF_PASSWORD, checkLogin, token, roles, cookieName };
}

module.exports = { createAuth, cookieName };
