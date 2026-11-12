# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Summarecon Mall Integrated Command Center Ticketing System (SMICC-TS): an offline LAN prototype
with an Indonesian-language UI. There is no build step, no npm project and no framework. The
pages are plain HTML plus vanilla JS IIFEs (globals on `window`), styled with a prebuilt Tailwind
CSS file, and served by one dependency-free Node app (`server.js` + `server/`, no npm) that runs
both on the LAN and on Vercel. Everything has to keep working
**without internet**, so all assets stay local under `app/vendor/`. Never add CDN links.

`README.md` (Indonesian) covers the user-facing details: paths, staff demo accounts, running on a LAN.

## Commands

```sh
npm start                             # = node server.js: 0.0.0.0:8765, shared state for all LAN devices
npm run dev                           # 127.0.0.1:8765, restarts when server/ changes (node --watch)
node server.js 8765 127.0.0.1         # local only (same as .claude/launch.json)
python tools/docs/build_docs.py       # validate SOP/use-case relations + regenerate outputs (needs openpyxl)
npx tailwindcss@3 -c tools/tailwind/tailwind.config.js -i tools/tailwind/input.css -o app/vendor/tailwind.css --minify
python tools/vendor_fonts.py          # re-download fonts (needs internet once)
```

There is no linter and no npm dependency. `package.json` only holds scripts (`npm run dev` = `node --watch`,
`npm start`, `npm test`). **Never add dependencies, a `build`/`postinstall`
script or `"type": "module"`**: LAN machines have no internet, Vercel would run the script on deploy, and
`server/` uses `require()`. `tests/deploy.test.mjs` enforces this (and the adaptive polling).

The Event Ticketing engine has dependency-free Node tests (Node 20+, no npm install), which load
`app/js/event/engine.js` unchanged in a `vm` sandbox in local mode (`tests/harness.mjs`).
`server.test.mjs` boots the real app on a random port (routes, staff login gate, legacy redirects, path
traversal, CAS):

```sh
npm test                               # = node --test "tests/*.test.mjs" (glob needed on Windows)
node --test tests/engine.test.mjs                       # one file
node --test --test-name-pattern="hold" "tests/*.test.mjs"   # tests matching a name
```

UI changes still have to be checked by running `node server.js` and opening the pages in a browser.

- Rebuild `app/vendor/tailwind.css` whenever you use a Tailwind class that isn't already in it.
  The content globs are `app/pages/*.html` and `app/js/**/*.js`. Theme "Papan Petunjuk":
  colour values are CSS variables in `app/css/tokens.css` (dark and light), mapped to Tailwind
  colour names in `tools/tailwind/tailwind.config.js` along with the font roles (`label-md`,
  `headline-sm`; Inter for everything, vendored in `app/vendor/fonts/`). Tailwind's status palettes (rose, amber, emerald,
  sky, ...) are mirrored in light mode, so `text-rose-300` stays readable in both modes. Never
  hard-code hex colours in views; inside SVG use `style="fill:rgb(var(--on-surface))"` because
  presentation attributes don't resolve `var()`.
- `app/js/core/theme.js` (loaded in `<head>` of every page) sets `data-theme` on `<html>`; any button
  with `data-theme-toggle` switches mode. QR codes sit on `.paper`, dialog backdrops on `.scrim`.
- UI copy follows `docs/PANDUAN_Teks_UI.md` (menu names, sentence case, no em dashes).
- Every `/app/...` script and stylesheet tag carries a cache-buster (currently `?v=61`; `fonts.css`
  has its own, `?v=5`). Assets are cached **1 year, immutable** (`assetCache` in `server/app.js`
  and the `/app/` header in `vercel.json`), so **bump it on every page (`app/pages/*.html`) whenever
  you change JS or CSS**, or browsers keep the old file. `npm run dev` (`--dev`) disables caching, so
  you only need the bump before committing. `tests/deploy.test.mjs` fails if a tag lacks `?v=` or
  the versions differ.

## Folder layout

```
server.js            LAN entry (node server.js)          api/index.js   Vercel entry (must live in api/)
server/              backend: config (routes), app, auth, store, guard
app/                 everything sent to the browser (served at /app/...)
  pages/             one HTML file per clean URL (beranda, pengunjung, pengelola, checkin, command-center, masuk)
  css/  vendor/      styles, Tailwind build, fonts, QR libraries
  js/core/           shared by all pages: theme, router, auth, ui, pdf (MiniPDF, console report)
  js/command-center/ Command Center shell (app, store, data, sim, sop-data) + views/
  js/event/          Event Ticketing: engine, visitor, checkin-ui, admin (pengelola console), cc-bridge
tests/               node --test suites (+ harness, guard_cases.json)
tools/docs/          SOP/use-case sources + build_docs.py      tools/tailwind/  tools/vendor_fonts.py
docs/                reference docs (*.md); unduhan/ = generated files linked from the app (served);
                     sumber/ = source drawio & xlsx; rencana/ = historical plans (not served)
data/                runtime secrets & state (gitignored)
```

## Architecture

**Four entry pages, two independent state systems.**

| Path (`PAGES` in `server/config.js`) | Page | Scripts |
|---|---|---|
| `/` | `app/pages/beranda.html` | `core/theme` (role picker) |
| `/command-center` | `app/pages/command-center.html` | everything: `core/*`, `command-center/*` + `views/*`, `event/engine`, `event/checkin-ui`, `event/admin`, `event/cc-bridge` |
| `/pengelola` | `app/pages/pengelola.html` | `core/router`, `core/ui`, `core/pdf`, `command-center/sop-data`, `event/engine`, `event/checkin-ui`, `event/admin` → `EvtAdmin.mount(el, 'pengelola')` (SPA: `/pengelola/acara`, `/pengelola/e/<id>/<menu>`) |
| `/pengunjung` | `app/pages/pengunjung.html` | `core/router`, `event/engine`, `event/visitor` (mobile-first buyer portal) |
| `/checkin` | `app/pages/checkin.html` | `event/engine`, `event/checkin-ui` (gate QR scanner) |
| `/masuk` | `app/pages/masuk.html` | staff login (email + password, demo account cards) |

`event/admin.js` is shared. The Command Center mounts it read-only ("Event 360 Monitoring", tab bar), and
the organizer console mounts it with full admin rights: sidebar (`sideHtml()`: one event picker whose default is "Semua acara" with cross-event menus `GTABS`
(`/pengelola/dasbor`, `/acara`, `/transaksi`, `/kehadiran`, `/keuangan`, plus an all-events PDF `reportAllPdf()`),
and the 7 event menus `ETABS` once an event is picked; collapsible, drawer under 1024px, bottom bar under 768px). The console uses only
Inter and one palette (primary blue tints, neutral, signal yellow, error red; `tc()`/`recolor()` map ticket-category
colours to it) and neutral number colours (`.pg-body` overrides in `app.css`; section/KPI icon boxes hidden there), clean URLs (`fromUrl()`/`evUrl()`), a sticky event header with the status action, and a
"Perlu tindakan" block whose items also feed the sidebar badges (`attention(e)`). Risky actions use `UI.confirm()`
(`core/ui.js`, a themed promise dialog), never `confirm()`/`prompt()`. Demo tools (race, stress, 2-gate, reset) are commands in the Ctrl+K palette. The profile menu (top right:
"Edit profil" saved in localStorage `smicc-pengelola-profil`, "Keluar") replaces the old account block. Ctrl/⌘+K (or `/`) opens a search palette (`palette()`: menus, events, orders by booking
code/name, commands). KPI cards with `UI.kpi({ key })` are clickable and open `kpiModal(key)` (quick insight: headline number,
24 h / 7 day pace, warnings, one breakdown). Pengaturan is one form saved by `Evt.saveEvent(evId, { patch, types, add })` in a single transaction (new
ticket types are quota-only; quota may not drop below sold + held). Money inputs (`data-rp`) show "Rp 1.500.000"
and are parsed back to numbers. Event posters are cropped to 16:9 and resized to 960x540 JPEG in the browser
(`posterFrom()`) and stored as a data URL in `events[id].img`, so keep them small: state goes to every device.
A scrolling activity ticker (`ticker()` / `feed()`, last 3 days of
payments, check-ins, refunds, gate reports) sits above the cards on Semua acara and Ringkasan. "Laporan PDF"
(`reportPdf(e)`) builds an aggregate-only event report with `app/js/core/pdf.js` (`window.MiniPDF`, a tiny
dependency-free PDF writer: Helvetica/WinAnsi text, rects, lines, A4 pages). All portals read the same engine state, so an event created and published here shows up in
`/pengunjung` and the Command Center immediately.

1. **Command Center store**: `app/js/command-center/store.js` → `window.Store`. It holds incident tickets,
   devices, camera alerts and similar data, seeded from `window.SEED` (`data.js`). It stays in
   **localStorage only** (`smicc-ts-summarecon-v1`), so the state is per browser and is never
   shared through the server. Callers use `Store.subscribe` / `emit`.
2. **Event Ticketing engine**: `app/js/event/engine.js` → `window.Evt`. It holds events, seats,
   orders, tickets and check-ins. It runs in one of two modes:
   - `server`: when `/api/health` answers, state is the single JSON blob in
     `data/event_state.json`, read with `GET /api/evt/state?v=N` and written with
     `POST /api/evt/state {base, state}`. The write is **compare-and-swap on a version**: a 409
     means "re-read, re-run the rules, retry". This retry is the whole anti-double-booking
     guarantee for seat holds, payments and check-ins, so every mutation must go through the
     engine's transaction helper and must never write state directly.
   - `lokal`: the same CAS against localStorage (`smicc-evt-v1`). Tabs on one device stay in
     sync, and the pages show a yellow "Mode lokal" banner.
   New events go through approval (`e.approval`: documents → Divisi Event → Operasional Mall, `submitApproval`/`decide`)
   before they can be published, and important event changes append to a hash-chained log `e.audit` (`audit()`,
   `verifyAudit()`); the "Persetujuan" menu in the organizer console shows both. Seeded state is ~347 KB of the
   350 KB test budget, so don't backfill logs into sample events.
   Seed data has 28 sample events (EVT-01..03 in `seed()`, EVT-04..28 in `seedMore()`; EVT-28 is a draft waiting for Operasional Mall; each with a demo photo and an `org` organiser name) across five mall areas
   (`AREA` in `engine.js`), scheduled relative to seed time so the landing page always has "today/weekend/this week"
   content. Events may carry `img` (`/app/img/demo/*.jpg`); `banner()` in `visitor.js` falls back to a gradient
   and category icon without one. Demo photos are Wikimedia Commons (licences in `app/img/demo/CREDITS.md`) meant to
   be replaced in place under the same file names; keep sample sales small, state size is sent to every device.
   The visitor landing page (`V.home` / `homeSections()` in `visitor.js`) widens to 1200px via `body.pv-wide`;
   all other visitor screens stay phone-width. Its static content (mall hours, areas, tenant promos, guide) is the
   `MALL`, `AREAS`, `PROMOS`, `GUIDE` constants at the top of that block.
   QR payload: `SMB1|ticketId|eventId|seat|sig`. The signature is a cyrb53 hash with a
   hard-coded sandbox secret (prototype only).

**Clean URLs, no `#`.** `app/js/core/router.js` (`window.Router`, loaded in `<head>` of `app/pages/command-center.html`
and `app/pages/pengunjung.html`) is a History API router. A page declares its prefix with
`<html data-base="/command-center">`; routes are relative to it (`Router.path()`, `Router.query()`,
`Router.go()`, `Router.replace()`, `Router.on()`). Clicks on same-page links (`<a href="/pengunjung/e/ID">`)
are intercepted automatically, so write in-app links as absolute paths with the page prefix. Old
`#/...` URLs are converted on load. Asset tags use absolute `/app/...` paths so deep links work.

**Command Center shell** (`app/js/command-center/app.js` → `window.Shell`): routes `/command-center/<route>?k=v` over
`window.Views[route]`. Each `app/js/command-center/views/*.js` is an IIFE that registers
`window.Views.<name>`. The sidebar menu is the `NAV` array in `app.js`. `ui.js` (`window.UI`:
`esc`, `icon`, badges, SVG charts, modals, toasts, relation panel) is shared by all views. `sim.js`
runs use-case simulations step by step against `Store`.

**Generated reference data.** `app/js/command-center/sop-data.js` (`window.SMICC_REF`: dashboards, SLA, SOPs,
roles, use cases, relations) is **generated. Never edit it by hand.** The single sources are
`tools/docs/sop_data.py` and `tools/docs/usecase_data.py`. `tools/docs/build_docs.py` validates them (also
against `docs/sumber/Mindmap_Super_Mall_Ticketing_system.drawio`), then writes `sop-data.js`, the two Excel
workbooks in `docs/unduhan/` and `docs/unduhan/RUNBOOK_Relasi_Dashboard_Summarecon_Mall.md`. After a regenerate,
open each Excel file in Excel and save it once so the formulas recalculate.

**Server** (one app, `server/app.js`; `server.js` runs it on the LAN, `api/index.js` on Vercel):
- `server/config.js` is the single route table: `PAGES` (clean URL → HTML file, required role, `spa` =
  sub-paths serve the same page), `LEGACY` (old `/app/*.html` → 301 to clean URL), `STATIC_DIRS`
  (`/app/`, `/docs/unduhan/`; `.html` files there are never served raw). Anything else is 404, so `data/` and
  source files are not reachable.
- Staff login: a page with a role (one or a list, e.g. `/checkin` = `['gate', 'pengelola']`) and no session → 302
  `/masuk?role=…&next=<path+query>`. Accounts are `ACCOUNTS` in `server/config.js` (email → role: `pengelola`,
  `gate`, `command-center`); one shared password, env `STAFF_PASSWORD` or the demo `smicc-demo-2026` shown on
  `/masuk`. Sessions are stateless HMAC-signed HttpOnly cookies per role (12 h) keyed by `SESSION_SECRET` or
  `data/session.key`. 5 wrong logins lock that IP for 60 s (`server/auth.js`). The visitor portal has its own
  client-side demo login (`/pengunjung/masuk`, `DEMO` in `visitor.js`), not a server session.
- `server/store.js` has two stores with one interface: `fileStore` (`data/event_state.json`, LAN) and
  `redisStore` (Upstash, Vercel, CAS in a Lua script). `read(known)` / `write(base, state, check)`; the
  guard runs inside `write` between the version check and the save.
- `POST /api/evt/state` is checked by `guard()` in `server/guard.js` (cases in
  `tests/guard_cases.json`). Without a session only buyer changes pass (holds, new orders,
  pay/cancel/expire PENDING orders, waitlist); `gate` may also add scans, change only `checkedInAt`/`gate` on tickets and gate reports; `command-center` may also change gate reports;
  `pengelola` may change anything. Rejections are 403 and `tx()` surfaces them without retrying.
  `POST /api/evt/reset` requires `pengelola`. The rules themselves still run in the browser, and the
  QR signing key is client-side.
- `app/js/core/auth.js` calls `/api/auth/me` and `/api/auth/logout` to show the "Keluar" button.
- `/api/health` also returns `poll {min, max, hidden}`, the engine's pull schedule (`pollTick` in
  `engine.js`). LAN default: every 1 s, also in hidden tabs. Vercel (`api/index.js`): 2 s after a change,
  backing off x1.5 to 15 s when idle, paused in hidden tabs, to stay inside the free Vercel Hobby and Upstash
  quotas. Correctness never depends on polling speed (CAS does that), so tune these numbers freely.

**Vercel.** Production (https://smiccts.vercel.app, auto-deployed on push to `main`) runs `api/index.js`,
which wraps the same `server/app.js` with the Redis store. `vercel.json` sends every
non-asset path (and every `.html`) to it as `?__path=<original path>`. Env: `SESSION_SECRET`, optional
`STAFF_PASSWORD`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`. Without KV, `/api/health`
answers 503 and pages fall back to local mode. `"regions": ["iad1"]` keeps the function next to the
Upstash database (`us-east-1`); move both together or neither (README explains how). `.vercelignore` keeps `tools/`, `data/` and the
xlsx/drawio files out of the deploy.

`data/` holds runtime secrets and state (`session.key`, `event_state.json`; old `access.json`/`PIN_AWAL.txt` are unused).
Don't commit or share it.

## Conventions

- UI strings, comments and docs are in Indonesian. Keep them that way.
- Old addresses (`/index.html`, `/app/*.html` incl. the removed `app/event.html`) are 301s in `LEGACY`. Keep them.
- New page: add it to `PAGES` in `server/config.js` (and `LEGACY` if it replaces an old URL). Never link to
  `app/pages/*.html` directly; pages are only reachable through their clean URL.
- `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md` documents the seat-selection and QR-validation
  logic. Update it when the engine's rules change.
