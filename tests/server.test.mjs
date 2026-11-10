// Uji server tunggal (server/app.js): URL bersih, gerbang PIN, alamat lama, aset statis, API CAS.
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
  const env = { PIN_PENGELOLA: '1234', PIN_COMMAND_CENTER: '5678' };
  const app = createApp({ root: ROOT, store: fileStore(dir), auth: createAuth({ dataDir: dir, env }) });
  srv = http.createServer(app);
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  port = srv.address().port;
});
after(() => { srv.close(); rmSync(dir, { recursive: true, force: true }); });

// http.request mentah: path dikirim apa adanya (fetch akan menormalkan ../).
function req(method, p, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = http.request({ host: '127.0.0.1', port, method, path: p, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(data ? { 'Content-Type': 'application/json' } : {}) } }, (res) => {
      let s = ''; res.setEncoding('utf8'); res.on('data', (c) => (s += c));
      res.on('end', () => { let j = null; try { j = JSON.parse(s); } catch (e) { /* bukan JSON */ } resolve({ status: res.statusCode, headers: res.headers, text: s, json: j }); });
    });
    r.on('error', reject); r.end(data);
  });
}
const login = async (role, pin, next) => req('POST', '/api/auth/login', { body: { role, pin, next } });
const sessionOf = (r) => r.headers['set-cookie'][0].split(';')[0];

test('URL bersih menyajikan halaman, termasuk sub-rute SPA', async () => {
  for (const [p, mark] of [['/', 'Pilih pintu masuk'], ['/pengunjung', 'data-base="/pengunjung"'], ['/pengunjung/', 'data-base="/pengunjung"'], ['/pengunjung/e/EVT-01/kursi', 'data-base="/pengunjung"'], ['/masuk?role=pengelola', 'Masuk dengan PIN']]) {
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
  assert.equal((await req('GET', '/pengelola/apa-saja')).status, 404, 'pengelola bukan SPA');
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

test('login PIN: salah, benar, validasi tujuan, sesi membuka halaman perannya saja', async () => {
  const bad = await login('pengelola', '0000');
  assert.equal(bad.status, 401);
  assert.match(bad.json.error, /Sisa percobaan: 4/);
  assert.equal((await login('pengelola', '1234', '/pengunjung')).json.next, '/pengelola', 'tujuan peran lain ditolak');
  assert.equal((await login('pengelola', '1234', '//evil.example')).json.next, '/pengelola');
  assert.equal((await login('command-center', '5678', '/command-center/sop?id=X')).json.next, '/command-center/sop?id=X');
  const ok = await login('pengelola', '1234', '/checkin');
  assert.equal(ok.status, 200);
  assert.equal(ok.json.next, '/checkin');
  const c = sessionOf(ok);
  assert.match(ok.headers['set-cookie'][0], /HttpOnly; SameSite=Strict/);
  assert.equal((await req('GET', '/pengelola', { cookie: c })).status, 200);
  assert.equal((await req('GET', '/checkin', { cookie: c })).status, 200);
  assert.equal((await req('GET', '/command-center', { cookie: c })).status, 302);
  assert.deepEqual((await req('GET', '/api/auth/me', { cookie: c })).json.roles, ['pengelola']);
  assert.equal((await req('GET', '/pengelola', { cookie: c.replace(/.$/, (x) => (x === 'A' ? 'B' : 'A')) })).status, 302, 'tanda tangan rusak');
});

test('salah PIN 5 kali mengunci peran', async () => {
  let r;
  for (let i = 0; i < 5; i++) r = await login('command-center', '1111');
  assert.equal(r.status, 429);
  assert.equal((await login('command-center', '5678')).status, 429, 'PIN benar pun ditolak selama terkunci');
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
  const c = sessionOf(await login('pengelola', '1234'));
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
