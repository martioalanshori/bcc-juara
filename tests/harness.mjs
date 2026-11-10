// Harness test engine Event Ticketing: memuat app/js/event/engine.js apa adanya di sandbox vm (mode lokal).
// Tanpa dependensi npm. Jalankan: node --test tests/
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ENGINE = fileURLToPath(new URL('../app/js/event/engine.js', import.meta.url));
const SRC = readFileSync(ENGINE, 'utf8');

function storage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

// Jam yang bisa dimajukan test: clock.now dalam ms.
// opts.globals: objek tambahan di window (mis. stub Store/UI). opts.scripts: skrip lain yang dimuat setelah engine.
export async function loadEvt(opts = {}) {
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
  Object.assign(ctx, opts.globals || {});
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx, { filename: ENGINE });
  for (const rel of opts.scripts || []) {
    const f = fileURLToPath(new URL('../' + rel, import.meta.url));
    vm.runInContext(readFileSync(f, 'utf8'), ctx, { filename: f });
  }
  await ctx.Evt.init();
  return { Evt: ctx.Evt, clock, ctx };
}
