#!/usr/bin/env node
/* Server LAN Summarecon Mall Command Center (Node 20+, tanpa npm & tanpa internet).
 * Logika aplikasi ada di server/app.js (sama dengan yang dipakai Vercel lewat api/index.js).
 *
 * Jalankan:  node server.js                  (0.0.0.0:8765, bisa diakses PC/ponsel lain di LAN)
 *            node server.js 9000 127.0.0.1   (hanya komputer ini)
 * Ganti PIN: node server.js --set-pin pengelola 123456
 *            node server.js --set-pin command-center 654321
 * Data (state event, hash PIN, kunci sesi) ada di data/. Jangan dibagikan.
 */
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { ROLES } = require('./server/config');
const { createApp } = require('./server/app');
const { fileStore } = require('./server/store');
const { createAuth, setPin, ensureInitialPins } = require('./server/auth');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const PIN_NOTE = path.join(DATA, 'PIN_AWAL.txt');
const args = process.argv.slice(2);

if (args[0] === '--set-pin') {
  const [, role, pin] = args;
  if (args.length !== 3 || !ROLES[role] || !/^\d{4,8}$/.test(pin)) {
    console.error('Pemakaian: node server.js --set-pin {' + Object.keys(ROLES).join('|') + '} <PIN 4-8 digit>');
    process.exit(1);
  }
  setPin(DATA, role, pin);
  console.log('PIN ' + role + ' diperbarui dan semua sesi lama berakhir. Restart server agar berlaku.');
  if (fs.existsSync(PIN_NOTE)) { // buang PIN awal peran ini dari catatan; hapus file bila sudah kosong
    const lines = fs.readFileSync(PIN_NOTE, 'utf8').split(/(?<=\n)/).filter((ln) => !ln.trim().startsWith(role + ' '));
    if (lines.some((ln) => ln.startsWith('  '))) fs.writeFileSync(PIN_NOTE, lines.join(''));
    else { fs.unlinkSync(PIN_NOTE); console.log('data/PIN_AWAL.txt dihapus (semua PIN awal sudah diganti).'); }
  }
  process.exit(0);
}

const port = +args[0] || 8765;
const host = args[1] || '0.0.0.0';
const fresh = ensureInitialPins(DATA);
if (Object.keys(fresh).length) {
  console.log('PIN awal dibuat (simpan, lalu ganti bila perlu) -> data/PIN_AWAL.txt');
  for (const [r, p] of Object.entries(fresh)) console.log('  ' + r.padEnd(15) + ' ' + p);
}

const handler = createApp({ root: ROOT, store: fileStore(DATA), auth: createAuth({ dataDir: DATA }) });
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
    console.log('     Check-in gate (ponsel)   : ' + base + '/checkin');
  }
  console.log('Path 2 & 3 (dan /checkin) meminta PIN peran. Ganti PIN: node server.js --set-pin <peran> <PIN>');
});
