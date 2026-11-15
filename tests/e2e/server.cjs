// Server uji untuk Playwright: server/app.js yang sama dengan LAN, tapi state & kunci sesi di folder sementara
// (data/ milik pengembang tidak tersentuh) dan tanpa STAFF_PASSWORD (mode demo, password smicc-demo-2026).
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { createApp } = require(path.join(ROOT, 'server/app'));
const { fileStore } = require(path.join(ROOT, 'server/store'));
const { createAuth } = require(path.join(ROOT, 'server/auth'));

const port = +process.argv[2] || 8799;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smicc-e2e-'));
const env = Object.assign({}, process.env); delete env.STAFF_PASSWORD;
// Alamat klien dari header uji agar penguncian salah login satu tes tidak mengunci tes lain.
const app = createApp({ root: ROOT, store: fileStore(dir), auth: createAuth({ dataDir: dir, env }), dev: true, clientIp: (r) => r.headers['x-test-ip'] || r.socket.remoteAddress });
const srv = http.createServer(app).listen(port, '127.0.0.1', () => console.log('e2e server http://127.0.0.1:' + port + ' data ' + dir));
const stop = () => { srv.close(); fs.rmSync(dir, { recursive: true, force: true }); process.exit(0); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
