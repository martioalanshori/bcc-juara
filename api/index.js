/* Entry Vercel: aplikasi yang sama dengan server.js (server/app.js), hanya penyimpanannya Redis.
 * vercel.json meneruskan semua path selain aset ke fungsi ini dengan ?__path=<path asli>.
 *
 * Variabel lingkungan:
 *   KV_REST_API_URL, KV_REST_API_TOKEN   (atau UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
 *   PIN_PENGELOLA, PIN_COMMAND_CENTER    (4-8 digit)
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
});
