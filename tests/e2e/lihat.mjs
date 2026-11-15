// npm run lihat [-- argumen playwright]: jalankan uji dengan jendela Chrome terbuka, tiap aksi diperlambat 400 ms
// (ubah lewat LIHAT=800). Contoh: npm run lihat -- specs/02-alur-peran.spec.mjs
import { spawnSync } from 'node:child_process';

const env = { ...process.env, LIHAT: process.env.LIHAT || '400' };
const r = spawnSync('npx', ['playwright', 'test', ...process.argv.slice(2)], { stdio: 'inherit', shell: true, env });
process.exit(r.status ?? 1);
