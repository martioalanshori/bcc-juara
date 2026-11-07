// Harness test engine Event Ticketing: memuat app/js/evt/engine.js apa adanya di sandbox vm (mode lokal).
// Tanpa dependensi npm. Jalankan: node --test tools/tests/
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ENGINE = fileURLToPath(new URL('../../app/js/evt/engine.js', import.meta.url));
const SRC = readFileSync(ENGINE, 'utf8');

function storage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

// Jam yang bisa dimajukan test: clock.now dalam ms
export async function loadEvt() {
  const clock = { now: Date.now() };
  class FakeDate extends Date {
    constructor(...a) { if (a.length) super(...a); else super(clock.now); }
    static now() { return clock.now; }
  }
  const ctx = {
    localStorage: storage(),
    sessionStorage: storage(),
    location: { protocol: 'file:' },
    document: { addEventListener() {}, hidden: false },
    addEventListener() {},
    setInterval: () => 0,
    clearInterval() {},
    setTimeout,
    clearTimeout,
    console,
    Date: FakeDate,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx, { filename: ENGINE });
  await ctx.Evt.init();
  return { Evt: ctx.Evt, clock };
}
