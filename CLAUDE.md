# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Summarecon Mall Integrated Command Center Ticketing System (SMICC-TS): an offline LAN prototype
with an Indonesian-language UI. There is no build step, no npm project and no framework. The
pages are plain HTML plus vanilla JS IIFEs (globals on `window`), styled with a prebuilt Tailwind
CSS file, and served by one dependency-free Node app (`server.js` + `server/`, no npm) that runs
both on the LAN and on Vercel. Everything has to keep working
**without internet**, so all assets stay local under `app/vendor/`. Never add CDN links.

`README.md` (Indonesian) covers the user-facing details: paths, PINs, running on a LAN.

## Commands

```sh
npm start                             # = node server.js: 0.0.0.0:8765, shared state for all LAN devices
npm run dev                           # 127.0.0.1:8765, restarts when server/ changes (node --watch)
node server.js 8765 127.0.0.1         # local only (same as .claude/launch.json)
npm run set-pin -- pengelola 123456   # change role PIN (also: command-center)
python tools/build_docs.py            # validate SOP/use-case relations + regenerate outputs (needs openpyxl)
npx tailwindcss@3 -c tools/tailwind/tailwind.config.js -i tools/tailwind/input.css -o app/vendor/tailwind.css --minify
python tools/vendor_fonts.py          # re-download fonts (needs internet once)
```

There is no linter and no npm dependency. `package.json` only holds scripts (`npm run dev` = `node --watch`,
`npm start`, `npm test`, `npm run set-pin -- <role> <PIN>`). **Never add dependencies, a `build`/`postinstall`
script or `"type": "module"`**: LAN machines have no internet, Vercel would run the script on deploy, and
`server/` uses `require()`. `tools/tests/deploy.test.mjs` enforces this (and the adaptive polling).

The Event Ticketing engine has dependency-free Node tests (Node 20+, no npm install), which load
`app/js/evt/engine.js` unchanged in a `vm` sandbox in local mode (`tools/tests/harness.mjs`).
`server.test.mjs` boots the real app on a random port (routes, PIN gate, legacy redirects, path
traversal, CAS):

```sh
npm test                               # = node --test "tools/tests/*.test.mjs" (glob needed on Windows)
node --test tools/tests/engine.test.mjs                       # one file
node --test --test-name-pattern="hold" "tools/tests/*.test.mjs"   # tests matching a name
```

UI changes still have to be checked by running `node server.js` and opening the pages in a browser.

- Rebuild `app/vendor/tailwind.css` whenever you use a Tailwind class that isn't already in it.
  The content globs are `index.html`, `app/*.html` and `app/js/**/*.js`. Theme "Papan Petunjuk":
  colour values are CSS variables in `app/css/tokens.css` (dark and light), mapped to Tailwind
  colour names in `tools/tailwind/tailwind.config.js` along with the font roles (`label-md`,
  `headline-sm`; Barlow / Barlow Condensed). Tailwind's status palettes (rose, amber, emerald,
  sky, ...) are mirrored in light mode, so `text-rose-300` stays readable in both modes. Never
  hard-code hex colours in views; inside SVG use `style="fill:rgb(var(--on-surface))"` because
  presentation attributes don't resolve `var()`.
- `app/js/theme.js` (loaded in `<head>` of every page) sets `data-theme` on `<html>`; any button
  with `data-theme-toggle` switches mode. QR codes sit on `.paper`, dialog backdrops on `.scrim`.
- UI copy follows `docs/PANDUAN_Teks_UI.md` (menu names, sentence case, no em dashes).
- Script and stylesheet tags carry a cache-buster (currently `?v=24`; `fonts.css` has its own,
  `?v=4`). Bump it on every page (`index.html` and `app/*.html`) when you change JS or CSS.

## Architecture

**Four entry pages, two independent state systems.**

| Path (`PAGES` in `server/config.js`) | Page | Scripts |
|---|---|---|
| `/command-center` | `app/index.html` | everything: `sop-data`, `data`, `store`, `ui`, `views/*`, `evt/engine`, `evt/cc-bridge`, `sim`, `app` |
| `/pengelola` | `app/pengelola.html` | `ui`, `evt/engine`, `evt/checkin-ui`, `views/event.js` → `EvtAdmin.mount(el, 'pengelola')` |
| `/pengunjung` | `app/pengunjung.html` | `evt/engine`, `evt/visitor` (mobile-first buyer portal) |
| `/checkin` | `app/checkin.html` | `evt/engine`, `evt/checkin-ui` (gate QR scanner) |

`views/event.js` is shared. The Command Center mounts it read-only ("Event 360 Monitoring"), and
the organizer console mounts it with full admin rights.

1. **Command Center store**: `app/js/store.js` → `window.Store`. It holds incident tickets,
   devices, camera alerts and similar data, seeded from `window.SEED` (`data.js`). It stays in
   **localStorage only** (`smicc-ts-summarecon-v1`), so the state is per browser and is never
   shared through the server. Callers use `Store.subscribe` / `emit`.
2. **Event Ticketing engine**: `app/js/evt/engine.js` → `window.Evt`. It holds events, seats,
   orders, tickets and check-ins. It runs in one of two modes:
   - `server`: when `/api/health` answers, state is the single JSON blob in
     `data/event_state.json`, read with `GET /api/evt/state?v=N` and written with
     `POST /api/evt/state {base, state}`. The write is **compare-and-swap on a version**: a 409
     means "re-read, re-run the rules, retry". This retry is the whole anti-double-booking
     guarantee for seat holds, payments and check-ins, so every mutation must go through the
     engine's transaction helper and must never write state directly.
   - `lokal`: the same CAS against localStorage (`smicc-evt-v1`). Tabs on one device stay in
     sync, and the pages show a yellow "Mode lokal" banner.
   QR payload: `SMB1|ticketId|eventId|seat|sig`. The signature is a cyrb53 hash with a
   hard-coded sandbox secret (prototype only).

**Clean URLs, no `#`.** `app/js/router.js` (`window.Router`, loaded in `<head>` of `app/index.html`
and `app/pengunjung.html`) is a History API router. A page declares its prefix with
`<html data-base="/command-center">`; routes are relative to it (`Router.path()`, `Router.query()`,
`Router.go()`, `Router.replace()`, `Router.on()`). Clicks on same-page links (`<a href="/pengunjung/e/ID">`)
are intercepted automatically, so write in-app links as absolute paths with the page prefix. Old
`#/...` URLs are converted on load. Asset tags use absolute `/app/...` paths so deep links work.

**Command Center shell** (`app/js/app.js` → `window.Shell`): routes `/command-center/<route>?k=v` over
`window.Views[route]`. Each `app/js/views/*.js` is an IIFE that registers
`window.Views.<name>`. The sidebar menu is the `NAV` array in `app.js`. `ui.js` (`window.UI`:
`esc`, `icon`, badges, SVG charts, modals, toasts, relation panel) is shared by all views. `sim.js`
runs use-case simulations step by step against `Store`.

**Generated reference data.** `app/js/sop-data.js` (`window.SMICC_REF`: dashboards, SLA, SOPs,
roles, use cases, relations) is **generated. Never edit it by hand.** The single sources are
`tools/sop_data.py` and `tools/usecase_data.py`. `tools/build_docs.py` validates them (also
against `Mindmap_Super_Mall_Ticketing_system.drawio`), then writes `sop-data.js`, the two Excel
workbooks in `docs/` and `docs/RUNBOOK_Relasi_Dashboard_Summarecon_Mall.md`. After a regenerate,
open each Excel file in Excel and save it once so the formulas recalculate.

**Server** (one app, `server/app.js`; `server.js` runs it on the LAN, `api/index.js` on Vercel):
- `server/config.js` is the single route table: `PAGES` (clean URL → HTML file, required role, `spa` =
  sub-paths serve the same page), `LEGACY` (old `/app/*.html` → 301 to clean URL), `STATIC_DIRS`
  (`/app/`, `/docs/`; `.html` files there are never served raw). Anything else is 404, so `data/` and
  source files are not reachable.
- PIN gate: a page with a role and no session → 302 `/masuk?role=…&next=<path+query>`. PINs come from
  env (`PIN_PENGELOLA`, `PIN_COMMAND_CENTER`) or PBKDF2 hashes in `data/access.json`. Sessions are
  stateless HMAC-signed HttpOnly cookies (12 h) keyed by `SESSION_SECRET` or `data/session.key`;
  `--set-pin` rotates the key, ending all sessions. 5 wrong PINs lock the role for 60 s per IP
  (`server/auth.js`).
- `server/store.js` has two stores with one interface: `fileStore` (`data/event_state.json`, LAN) and
  `redisStore` (Upstash, Vercel, CAS in a Lua script). `read(known)` / `write(base, state, check)`; the
  guard runs inside `write` between the version check and the save.
- `POST /api/evt/state` is checked by `guard()` in `server/guard.js` (cases in
  `tools/tests/guard_cases.json`). Without a session only buyer changes pass (holds, new orders,
  pay/cancel/expire PENDING orders, waitlist); `command-center` may also change gate reports;
  `pengelola` may change anything. Rejections are 403 and `tx()` surfaces them without retrying.
  `POST /api/evt/reset` requires `pengelola`. The rules themselves still run in the browser, and the
  QR signing key is client-side.
- `app/js/auth.js` calls `/api/auth/me` and `/api/auth/logout` to show the "Keluar" button.
- `/api/health` also returns `poll {min, max, hidden}`, the engine's pull schedule (`pollTick` in
  `engine.js`). LAN default: every 1 s, also in hidden tabs. Vercel (`api/index.js`): 2 s after a change,
  backing off x1.5 to 15 s when idle, paused in hidden tabs, to stay inside the free Vercel Hobby and Upstash
  quotas. Correctness never depends on polling speed (CAS does that), so tune these numbers freely.

**Vercel.** Production (https://smiccts.vercel.app, auto-deployed on push to `main`) runs `api/index.js`,
which wraps the same `server/app.js` with the Redis store and env PINs. `vercel.json` sends every
non-asset path (and every `.html`) to it as `?__path=<original path>`. Env: `PIN_PENGELOLA`,
`PIN_COMMAND_CENTER`, `SESSION_SECRET`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`. Without KV, `/api/health`
answers 503 and pages fall back to local mode. `.vercelignore` keeps `tools/`, `data/` and the
xlsx/drawio files out of the deploy.

`data/` holds runtime secrets and state (`access.json`, `session.key`, `event_state.json`, `PIN_AWAL.txt`).
Don't commit or share it.

## Conventions

- UI strings, comments and docs are in Indonesian. Keep them that way.
- `app/event.html` is a legacy page; the server 301s `/app/event.html` to `/pengunjung`. Keep it.
- New page: add it to `PAGES` in `server/config.js` (and `LEGACY` if it replaces an old URL). Never link to
  `app/*.html` directly.
- `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md` documents the seat-selection and QR-validation
  logic. Update it when the engine's rules change.
