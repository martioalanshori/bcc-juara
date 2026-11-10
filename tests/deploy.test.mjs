// Penjaga proyek: tetap tanpa dependensi (jalan tanpa internet) dan tetap gratis/berfungsi di Vercel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadEvt } from './harness.mjs';

const read = (f) => JSON.parse(readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
const pkg = read('package.json');
const vercel = read('vercel.json');

test('package.json tanpa dependensi (mesin LAN di mal tidak bisa npm install)', () => {
  for (const k of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'bundleDependencies']) {
    assert.ok(!pkg[k] || !Object.keys(pkg[k]).length, k + ' harus kosong');
  }
  assert.equal(pkg.private, true, 'private mencegah npm publish tak sengaja');
});

test('package.json aman untuk Vercel dan server CommonJS', () => {
  for (const s of ['build', 'vercel-build', 'prebuild', 'postinstall']) assert.equal(pkg.scripts[s], undefined, 'script "' + s + '" dijalankan otomatis oleh Vercel/npm saat deploy');
  assert.ok(!pkg.type || pkg.type === 'commonjs', '"type": "module" membuat require() di server/ gagal');
  assert.ok(pkg.scripts.dev && pkg.scripts.start && pkg.scripts.test);
});

test('vercel.json: semua path selain aset diteruskan ke server/app.js', () => {
  assert.deepEqual(Object.keys(vercel.functions), ['api/index.js']);
  const r = vercel.routes;
  assert.ok(r.some((x) => x.handle === 'filesystem'));
  const last = r[r.length - 1];
  assert.equal(last.src, '/(.*)');
  assert.match(last.dest, /^\/api\/index\.js\?__path=\/\$1$/);
  const html = r.find((x) => x.src.includes('html'));
  assert.ok(r.indexOf(html) < r.findIndex((x) => x.handle === 'filesystem'), '.html harus lewat fungsi sebelum filesystem (gerbang PIN)');
});

// Polling adaptif: jadwal dari /api/health. Vercel melambat saat sepi & berhenti saat tab tersembunyi.
async function serverEngine(poll) {
  const db = { version: 0, state: null }; let gets = 0; const ticks = [];
  const res = (code, obj) => ({ ok: code === 200, status: code, json: async () => obj });
  const fetch = async (url, init) => {
    const u = String(url);
    if (u.startsWith('/api/health')) return res(200, { ok: true, now: Date.now(), poll });
    if (init && init.method === 'POST') { const b = JSON.parse(init.body); db.version++; db.state = b.state; return res(200, { ok: true, version: db.version }); }
    gets++;
    const known = u.includes('?v=') ? +u.split('?v=')[1] : null;
    return res(200, known === db.version ? { version: db.version, now: Date.now() } : { version: db.version, state: db.state, now: Date.now() });
  };
  const doc = { addEventListener() {}, hidden: false };
  const { Evt, clock } = await loadEvt({ globals: { location: { protocol: 'http:' }, fetch, AbortController, document: doc, setInterval: (fn) => { ticks.push(fn); return 0; } } });
  const tick = ticks[0];
  // Jalankan detak 250 ms selama ms milidetik jam palsu, kembalikan jumlah GET.
  const run = async (ms) => { const g = gets; for (let t = 0; t < ms; t += 250) { clock.now += 250; await tick(); } return gets - g; };
  return { Evt, run, doc, db };
}

test('polling Vercel: melambat saat sepi, berhenti saat tab tersembunyi', async () => {
  const { Evt, run, doc } = await serverEngine({ min: 2000, max: 15000, hidden: false });
  assert.equal(Evt.mode, 'server');
  await run(60000);
  const idle = await run(60000);
  assert.ok(idle <= 5, 'tab sepi: paling banyak ~4 tarikan/menit, dapat ' + idle);
  doc.hidden = true;
  assert.equal(await run(60000), 0, 'tab tersembunyi tidak menarik');
});

test('polling LAN: tetap tiap 1 detik, juga saat tab tersembunyi', async () => {
  const { run, doc } = await serverEngine({ min: 1000, max: 1000, hidden: true });
  const n = await run(10000);
  assert.ok(n >= 9 && n <= 11, 'sekitar 10 tarikan per 10 detik, dapat ' + n);
  doc.hidden = true;
  assert.ok((await run(10000)) >= 9);
});

test('polling Vercel: perubahan dari perangkat lain mempercepat lagi', async () => {
  const { run, db } = await serverEngine({ min: 2000, max: 15000, hidden: false });
  await run(120000); // sudah melambat ke 15 dtk
  const idle = await run(30000);
  db.version++; // perangkat lain menulis: tertangkap paling lambat 15 dtk, lalu kembali tiap ~2 dtk (melambat bertahap)
  const busy = await run(30000);
  assert.ok(idle <= 2, 'sepi: ~2 tarikan per 30 dtk, dapat ' + idle);
  assert.ok(busy >= idle + 2, 'setelah perubahan lebih sering: sepi ' + idle + ', ramai ' + busy);
});

// Cache 1 tahun untuk aset hanya aman bila setiap tag aset ber-?v= (URL berubah saat versi naik).
test('setiap aset di app/pages ber-?v= dan versinya seragam (aman untuk cache immutable)', async () => {
  const { readdirSync } = await import('node:fs');
  const dir = new URL('../app/pages/', import.meta.url);
  const vers = new Set();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.html'))) {
    const html = readFileSync(new URL(f, dir), 'utf8');
    for (const [, u] of html.matchAll(/(?:src|href)="(\/app\/[^"]+)"/g)) {
      const m = /\?v=(\d+)$/.exec(u);
      assert.ok(m, f + ': aset tanpa ?v= akan ter-cache 1 tahun: ' + u);
      if (!u.includes('/fonts/fonts.css')) vers.add(m[1]); // fonts.css punya versi sendiri
    }
  }
  assert.equal(vers.size, 1, 'semua JS/CSS memakai ?v= yang sama, dapat: ' + [...vers].join(', '));
});

test('vercel.json: aset /app di-cache immutable, tidak ada no-store untuk aset', () => {
  const r = vercel.routes.find((x) => x.src.startsWith('/app/') && x.headers);
  assert.match(r.headers['Cache-Control'], /max-age=31536000, immutable/);
  assert.ok(!vercel.routes.some((x) => x.headers && /no-store/.test(x.headers['Cache-Control'] || '')));
});

// Function harus satu region dengan database Upstash (us-east-1 = Vercel iad1). Function di region lain
// menambah latensi setiap panggilan Redis (1-2 per request). Pindah region = pindah keduanya (lihat README).
test('vercel.json: region function dikunci sama dengan region Upstash', () => {
  assert.deepEqual(vercel.regions, ['iad1']);
});
