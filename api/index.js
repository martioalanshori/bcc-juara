/* Entry Vercel: aplikasi yang sama dengan server.js (server/app.js), hanya penyimpanannya Redis.
 * vercel.json meneruskan semua path selain aset ke fungsi ini dengan ?__path=<path asli>.
 *
 * Variabel lingkungan:
 *   KV_REST_API_URL, KV_REST_API_TOKEN   (atau UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
 *   STAFF_PASSWORD                        (opsional; tanpa ini password demo smicc-demo-2026)
 *   SESSION_SECRET                        (string acak panjang)
 */
const path = require('path');
const { createApp } = require('../server/app');
const { redisStore } = require('../server/store');
const { createAuth } = require('../server/auth');

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

module.exports = createApp({
  root: path.join(__dirname, '..'),
  store: KV_URL && KV_TOKEN ? redisStore(KV_URL, KV_TOKEN) : null,
  auth: createAuth({ dataDir: null }),
  secureCookie: true,
  clientIp: (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown',
  // Hemat kuota gratis (invocation Vercel & command Upstash): tarik tiap 2 dtk saat ramai, melambat sampai
  // 15 dtk saat sepi, berhenti saat tab tersembunyi. Satu tab terlihat terus-menerus <= ~5.800 request/hari.
  poll: { min: 2000, max: 15000, hidden: false },
});
