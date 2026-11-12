// Uji server tunggal (server/app.js): URL bersih, gerbang login staf, alamat lama, aset statis, API CAS.
// Server sungguhan di port acak dengan penyimpanan file di folder sementara. Tanpa dependensi npm.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const { createApp } = require('../server/app.js');
const { fileStore } = require('../server/store.js');
const { createAuth } = require('../server/auth.js');

let srv, port, dir;
before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'smicc-'));
  const env = { STAFF_PASSWORD: 'rahasia-uji' };
  // Alamat klien dari header uji, agar uji kunci salah login tidak mengunci uji lain.
  const app = createApp({ root: ROOT, store: fileStore(dir), auth: createAuth({ dataDir: dir, env }), clientIp: (r) => r.headers['x-test-ip'] || 'utama' });
  srv = http.createServer(app);
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  port = srv.address().port;
});
after(() => { srv.close(); rmSync(dir, { recursive: true, force: true }); });

// http.request mentah: path dikirim apa adanya (fetch akan menormalkan ../).
function req(method, p, { body, cookie, ip } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = http.request({ host: '127.0.0.1', port, method, path: p, headers: { ...(ip ? { 'X-Test-Ip': ip } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(data ? { 'Content-Type': 'application/json' } : {}) } }, (res) => {
      let s = ''; res.setEncoding('utf8'); res.on('data', (c) => (s += c));
      res.on('end', () => { let j = null; try { j = JSON.parse(s); } catch (e) { /* bukan JSON */ } resolve({ status: res.statusCode, headers: res.headers, text: s, json: j }); });
    });
    r.on('error', reject); r.end(data);
  });
}
const EMAIL = { pengelola: 'pengelola@example.com', gate: 'gate@example.com', 'command-center': 'cc@example.com' };
const login = async (role, password, next, ip) => req('POST', '/api/auth/login', { body: { email: EMAIL[role] || role, password, next }, ip });
const PW = 'rahasia-uji';
const sessionOf = (r) => r.headers['set-cookie'][0].split(';')[0];

test('URL bersih menyajikan halaman, termasuk sub-rute SPA', async () => {
  for (const [p, mark] of [['/', 'data-path="/pengunjung"'], ['/pengunjung', 'data-base="/pengunjung"'], ['/pengunjung/', 'data-base="/pengunjung"'], ['/pengunjung/e/EVT-01/kursi', 'data-base="/pengunjung"'], ['/masuk?role=pengelola', 'id="f-login"']]) {
    const r = await req('GET', p);
    assert.equal(r.status, 200, p);
    assert.match(r.headers['content-type'], /text\/html/);
    assert.ok(r.text.includes(mark), p + ' harus berisi ' + mark);
  }
});

test('alamat lama .html dialihkan permanen ke URL bersih (query dipertahankan)', async () => {
  for (const [from, to] of [['/app/pengunjung.html', '/pengunjung'], ['/app/event.html', '/pengunjung'], ['/app/index.html?x=1', '/command-center?x=1'], ['/app/', '/command-center'], ['/app/pengelola.html', '/pengelola'], ['/app/checkin.html', '/checkin'], ['/index.html', '/']]) {
    const r = await req('GET', from);
    assert.equal(r.status, 301, from);
    assert.equal(r.headers.location, to);
  }
});

test('halaman berperan tanpa sesi diarahkan ke /masuk dengan tujuan lengkap', async () => {
  const r = await req('GET', '/command-center/sop?id=SOP-EVT-01');
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/masuk?role=command-center&next=' + encodeURIComponent('/command-center/sop?id=SOP-EVT-01'));
  assert.equal((await req('GET', '/pengelola')).status, 302);
  assert.equal((await req('GET', '/checkin')).status, 302);
  const deep = await req('GET', '/pengelola/e/EVT-01/peserta');
  assert.equal(deep.status, 302, 'sub-path konsol (SPA) tetap butuh login');
  assert.equal(deep.headers.location, '/masuk?role=pengelola&next=' + encodeURIComponent('/pengelola/e/EVT-01/peserta'));
  assert.equal((await req('GET', '/checkin/apa-saja')).status, 404, 'checkin bukan SPA');
});

test('aset statis tersaji; file di luar folder aset & .html mentah tidak', async () => {
  const js = await req('GET', '/app/js/core/router.js?v=24');
  assert.equal(js.status, 200);
  assert.match(js.headers['content-type'], /javascript/);
  assert.equal((await req('GET', '/app/vendor/fonts/fonts.css?v=4')).status, 200);
  assert.equal((await req('GET', '/docs/unduhan/RUNBOOK_Relasi_Dashboard_Summarecon_Mall.md')).status, 200, 'unduhan yang ditautkan aplikasi');
  for (const p of ['/server.js', '/data/access.json', '/app/../data/access.json', '/app/%2e%2e/data/access.json', '/app/..%2fserver.js', '/docs/../server/auth.js', '/README.md', '/app/js/../../server.js', '/docs/rencana/PLAN_Perbaikan_Teks_dan_UIUX.md', '/docs/sumber/Super_Mall_Command_Center_Blueprint.xlsx', '/app/pages/pengelola.html', '/tests/harness.mjs']) {
    assert.equal((await req('GET', p)).status, 404, p);
  }
});

test('login email & password: salah, benar, validasi tujuan, sesi membuka halaman perannya saja', async () => {
  const bad = await login('pengelola', 'salah');
  assert.equal(bad.status, 401);
  assert.equal(bad.json.error, 'Email atau password salah.');
  assert.equal((await login('orang@example.com', PW)).status, 401, 'email tak terdaftar');
  assert.equal((await login('pengelola', 'smicc-demo-2026')).status, 401, 'STAFF_PASSWORD menggantikan password demo');
  assert.equal((await login('pengelola', PW, '/pengunjung')).json.next, '/pengelola', 'tujuan peran lain ditolak');
  assert.equal((await login('pengelola', PW, '//evil.example')).json.next, '/pengelola');
  assert.equal((await login('command-center', PW, '/command-center/sop?id=X')).json.next, '/command-center/sop?id=X');
  const ok = await login('pengelola', PW, '/checkin');
  assert.equal(ok.status, 200);
  assert.equal(ok.json.next, '/checkin');
  const c = sessionOf(ok);
  assert.match(ok.headers['set-cookie'][0], /HttpOnly; SameSite=Strict/);
  assert.equal((await req('GET', '/pengelola', { cookie: c })).status, 200);
  assert.match((await req('GET', '/pengelola/e/EVT-01/ringkasan', { cookie: c })).text, /data-base="\/pengelola"/, 'rute dalam konsol menyajikan halaman yang sama');
  assert.equal((await req('GET', '/checkin', { cookie: c })).status, 200);
  assert.equal((await req('GET', '/command-center', { cookie: c })).status, 302);
  const me = (await req('GET', '/api/auth/me', { cookie: c })).json;
  assert.deepEqual(me.roles, ['pengelola']);
  assert.equal(me.accounts.pengelola.email, 'pengelola@example.com');
  assert.equal((await req('GET', '/pengelola', { cookie: c.replace(/.$/, (x) => (x === 'A' ? 'B' : 'A')) })).status, 302, 'tanda tangan rusak');
  const g = await login('GATE@example.com ', PW, '/pengelola');
  assert.equal(g.json.role, 'gate');
  assert.equal(g.json.next, '/checkin', 'petugas gate tidak bisa diarahkan ke konsol pengelola');
  const gc = sessionOf(g);
  assert.equal((await req('GET', '/checkin', { cookie: gc })).status, 200);
  assert.equal((await req('GET', '/pengelola', { cookie: gc })).status, 302);
});

test('salah password 5 kali mengunci login dari alamat itu', async () => {
  let r;
  for (let i = 0; i < 5; i++) r = await login('command-center', 'xxxx', null, 'penebak');
  assert.equal(r.status, 429);
  assert.equal((await login('command-center', PW, null, 'penebak')).status, 429, 'password benar pun ditolak selama terkunci');
  assert.equal((await login('pengelola', PW, null, 'penebak')).status, 429, 'ganti email tidak membuka kunci');
  assert.equal((await login('pengelola', PW)).status, 200, 'alamat lain tidak ikut terkunci');
});

test('API state: CAS berversi, 409 saat basi, 403 dari guard, reset hanya pengelola', async () => {
  const s0 = await req('GET', '/api/evt/state');
  assert.equal(s0.status, 200);
  const v = s0.json.version;
  const seed = { v: 1, seededAt: 1, events: {}, order: [], scans: [], outbox: [], waitlist: [], reports: [], seats: {}, qholds: {}, orders: {}, tickets: {} };
  const w = await req('POST', '/api/evt/state', { body: { base: v, state: seed } });
  assert.equal(w.status, 200);
  assert.equal(w.json.version, v + 1);
  const stale = await req('POST', '/api/evt/state', { body: { base: v, state: seed } });
  assert.equal(stale.status, 409);
  assert.deepEqual(stale.json.state, seed);
  assert.equal((await req('GET', '/api/evt/state?v=' + (v + 1))).json.state, undefined, 'versi sama: state tidak dikirim ulang');
  const evil = await req('POST', '/api/evt/state', { body: { base: v + 1, state: { ...seed, events: { X: {} } } } });
  assert.equal(evil.status, 403);
  assert.equal((await req('POST', '/api/evt/state', { body: { base: 'x', state: seed } })).status, 400);
  assert.equal((await req('POST', '/api/evt/reset')).status, 401);
  const c = sessionOf(await login('pengelola', PW));
  const rs = await req('POST', '/api/evt/reset', { cookie: c });
  assert.equal(rs.status, 200);
  assert.equal((await req('GET', '/api/evt/state')).json.state, null);
});

test('cache: aset ber-?v= immutable, unduhan 1 jam, HTML & API tidak di-cache', async () => {
  const cc = async (p) => (await req('GET', p)).headers['cache-control'];
  assert.equal(await cc('/app/js/event/engine.js?v=99'), 'public, max-age=31536000, immutable');
  assert.equal(await cc('/app/vendor/qrcode.js?v=99'), 'public, max-age=31536000, immutable');
  assert.equal(await cc('/docs/unduhan/RUNBOOK_Relasi_Dashboard_Summarecon_Mall.md'), 'public, max-age=3600');
  assert.equal(await cc('/pengunjung'), 'no-store');
  assert.equal(await cc('/api/health'), 'no-store');
});

test('cache: mode dev (npm run dev) tidak meng-cache aset', async () => {
  const app = createApp({ root: ROOT, store: fileStore(dir), auth: createAuth({ dataDir: dir, env: {} }), dev: true });
  const s = http.createServer(app); await new Promise((r) => s.listen(0, '127.0.0.1', r));
  const cc = await new Promise((resolve) => http.get({ host: '127.0.0.1', port: s.address().port, path: '/app/js/event/engine.js?v=99' }, (res) => { res.resume(); resolve(res.headers['cache-control']); }));
  s.close();
  assert.equal(cc, 'no-store');
});

test('health & API tak dikenal', async () => {
  assert.equal((await req('GET', '/api/health')).json.ok, true);
  assert.equal((await req('GET', '/api/tidak-ada')).status, 404);
  assert.equal((await req('POST', '/api/evt/state', { body: undefined })).status, 400);
});

// ------------------------------------------------------------------ akun tenant & divisi, satu identitas per portal, ganti akun demo
// Server kedua dengan env bebas (mode demo = tanpa STAFF_PASSWORD).
async function withServer(env, fn) {
  const d = mkdtempSync(path.join(tmpdir(), 'smicc-'));
  const s = http.createServer(createApp({ root: ROOT, store: fileStore(d), auth: createAuth({ dataDir: d, env }), clientIp: () => 'lain' }));
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  const call = (method, p, { body, cookie } = {}) => new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = http.request({ host: '127.0.0.1', port: s.address().port, method, path: p, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(data ? { 'Content-Type': 'application/json' } : {}) } }, (res) => {
      let t = ''; res.setEncoding('utf8'); res.on('data', (c) => (t += c));
      res.on('end', () => { let j = null; try { j = JSON.parse(t); } catch (e) { /* bukan JSON */ } resolve({ status: res.statusCode, headers: res.headers, json: j }); });
    });
    r.on('error', reject); r.end(data);
  });
  try { return await fn(call); } finally { s.close(); rmSync(d, { recursive: true, force: true }); }
}
// Cookie jar sederhana: terapkan Set-Cookie (Max-Age=0 menghapus).
function jarApply(jar, res) {
  for (const c of [].concat(res.headers['set-cookie'] || [])) {
    const [kv] = c.split(';'); const i = kv.indexOf('='); const k = kv.slice(0, i), v = kv.slice(i + 1);
    if (/Max-Age=0/i.test(c) || !v) delete jar[k]; else jar[k] = v;
  }
  return jar;
}
const jarStr = (jar) => Object.entries(jar).map(([k, v]) => k + '=' + v).join('; ');

test('login tenant menghapus sesi pengelola (satu identitas per portal)', async () => {
  const jar = {};
  jarApply(jar, await login('pengelola', PW));
  const r = await req('POST', '/api/auth/login', { body: { email: 'tenant@example.com', password: PW } });
  assert.equal(r.status, 200);
  assert.ok([].concat(r.headers['set-cookie']).some((c) => c.startsWith('smicc_pengelola=;') && /Max-Age=0/.test(c)), 'cookie pengelola dihapus');
  jarApply(jar, r);
  const me = (await req('GET', '/api/auth/me', { cookie: jarStr(jar) })).json;
  assert.equal(me.active['/pengelola'], 'tenant');
  assert.equal(me.accounts.tenant.org, 'Komunitas UMKM Gedebage');
  assert.ok(!me.roles.includes('pengelola'));
});

test('cookie lama pengelola + tenant sekaligus: active memakai pengelola', async () => {
  const both = sessionOf(await login('pengelola', PW)) + '; ' + sessionOf(await req('POST', '/api/auth/login', { body: { email: 'tenant@example.com', password: PW } }));
  const me = (await req('GET', '/api/auth/me', { cookie: both })).json;
  assert.equal(me.active['/pengelola'], 'pengelola');
});

test('tenant boleh /pengelola, divisi-event boleh /command-center, tenant tidak boleh /command-center', async () => {
  const t = sessionOf(await req('POST', '/api/auth/login', { body: { email: 'tenant@example.com', password: PW } }));
  const dv = sessionOf(await req('POST', '/api/auth/login', { body: { email: 'divisi.event@example.com', password: PW } }));
  assert.equal((await req('GET', '/pengelola', { cookie: t })).status, 200);
  assert.equal((await req('GET', '/command-center/persetujuan', { cookie: dv })).status, 200);
  const no = await req('GET', '/command-center', { cookie: t });
  assert.equal(no.status, 302);
  assert.match(no.headers.location, /^\/masuk\?/);
});

test('ganti akun demo: tanpa password, hanya mode demo', async () => {
  await withServer({}, async (call) => {
    const r = await call('POST', '/api/auth/demo', { body: { email: 'divisi.ops@example.com', next: '/command-center/persetujuan?ev=EVT-28' } });
    assert.equal(r.status, 200);
    assert.equal(r.json.next, '/command-center/persetujuan?ev=EVT-28');
    const me = (await call('GET', '/api/auth/me', { cookie: jarStr(jarApply({}, r)) })).json;
    assert.equal(me.demo, true);
    assert.equal(me.active['/command-center'], 'divisi-ops');
    assert.ok(Array.isArray(me.demoAccounts) && me.demoAccounts.some((a) => a.email === 'tenant@example.com' && a.group && a.label));
    assert.ok(me.demoAccounts.every((a) => !('password' in a)));
    assert.equal((await call('POST', '/api/auth/demo', { body: { email: 'tidakada@example.com' } })).status, 404);
  });
  await withServer({ STAFF_PASSWORD: 'x' }, async (call) => {
    assert.equal((await call('POST', '/api/auth/demo', { body: { email: 'tenant@example.com' } })).status, 403);
    const me = (await call('GET', '/api/auth/me')).json;
    assert.equal(me.demo, false);
    assert.equal(me.demoAccounts, undefined);
  });
});

test('halaman masuk memakai daftar akun dari server (bukan salinan di HTML)', async () => {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(new URL('../app/pages/masuk.html', import.meta.url), 'utf8');
  for (const em of ['pengelola@example.com', 'tenant@example.com', 'cc@example.com', 'gate@example.com']) assert.ok(!html.includes(em), 'masuk.html tidak boleh menyimpan daftar akun sendiri: ' + em);
  assert.ok(html.includes('demoAccounts'), 'kartu akun demo dibangun dari /api/auth/me');
});
