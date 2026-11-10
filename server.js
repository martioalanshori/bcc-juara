#!/usr/bin/env node
/* Server LAN Summarecon Mall Command Center (Node 20+, tanpa npm & tanpa internet).
 * Logika aplikasi ada di server/app.js (sama dengan yang dipakai Vercel lewat api/index.js).
 *
 * Jalankan:  node server.js                  (0.0.0.0:8765, bisa diakses PC/ponsel lain di LAN)
 *            node server.js 9000 127.0.0.1   (hanya komputer ini)
 * Login staf: email + password di /masuk (akun di server/config.js; password demo smicc-demo-2026,
 *             ganti lewat variabel lingkungan STAFF_PASSWORD).
 * Data (state event, kunci sesi) ada di data/. Jangan dibagikan.
 */
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { createApp } = require('./server/app');
const { fileStore } = require('./server/store');
const { createAuth } = require('./server/auth');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const DEV = process.argv.includes('--dev'); // npm run dev: aset tidak di-cache
const args = process.argv.slice(2).filter((a) => a !== '--dev');

const port = +args[0] || 8765;
const host = args[1] || '0.0.0.0';
const handler = createApp({ root: ROOT, store: fileStore(DATA), auth: createAuth({ dataDir: DATA }), dev: DEV });
http.createServer((req, res) => {
  if (req.method === 'POST') res.on('finish', () => console.log(req.socket.remoteAddress, req.method, req.url, res.statusCode));
  handler(req, res);
}).listen(port, host, () => {
  console.log('Summarecon Mall · Event & Command Center berjalan di http://localhost:' + port + '/');
  const ips = host === '0.0.0.0' ? Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address) : [];
  for (const ip of ips) {
    const base = 'http://' + ip + ':' + port;
    console.log('  Pilih path (LAN)            : ' + base + '/');
    console.log('  1. Pengunjung (beli tiket)  : ' + base + '/pengunjung');
    console.log('  2. Pengelola acara (EO)     : ' + base + '/pengelola');
    console.log('  3. Command Center mall 360  : ' + base + '/command-center');
    console.log('  4. Petugas gate (check-in)  : ' + base + '/checkin');
  }
  if (DEV) console.log('Mode dev: aset tidak di-cache, server restart otomatis saat file server/ berubah.');
  console.log('Pengelola, Command Center & /checkin meminta login staf di /masuk (password demo: smicc-demo-2026, ganti lewat STAFF_PASSWORD).');
});
