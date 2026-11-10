# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Summarecon Mall Integrated Command Center Ticketing System (SMICC-TS): an offline LAN prototype
with an Indonesian-language UI. There is no build step, no npm project and no framework. The
pages are plain HTML plus vanilla JS IIFEs (globals on `window`), styled with a prebuilt Tailwind
CSS file, and served by a dependency-free Python server. Everything has to keep working
**without internet**, so all assets stay local under `app/vendor/`. Never add CDN links.

`README.md` (Indonesian) covers the user-facing details: paths, PINs, running on a LAN.

## Commands

```sh
python server.py                      # 0.0.0.0:8765, shared state for all LAN devices
python server.py 8765 127.0.0.1       # local only (same as .claude/launch.json)
python server.py --set-pin pengelola 123456          # change role PIN (also: command-center)
python tools/build_docs.py            # validate SOP/use-case relations + regenerate outputs (needs openpyxl)
npx tailwindcss@3 -c tools/tailwind/tailwind.config.js -i tools/tailwind/input.css -o app/vendor/tailwind.css --minify
python tools/vendor_fonts.py          # re-download fonts (needs internet once)
```

There is no linter or package manager. The Event Ticketing engine has dependency-free Node tests
(Node 20+, no npm install), which load `app/js/evt/engine.js` unchanged in a `vm` sandbox in local
mode (`tools/tests/harness.mjs`):

```sh
node --test "tools/tests/*.test.mjs"   # the glob is needed on Windows; a bare folder path fails
node --test tools/tests/engine.test.mjs                       # one file
node --test --test-name-pattern="hold" "tools/tests/*.test.mjs"   # tests matching a name
python -m unittest discover -s tools/tests -p "test_*.py"     # Python guard tests
```

UI changes still have to be checked by running `server.py` and opening the pages in a browser.

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
- Script and stylesheet tags carry a cache-buster (currently `?v=22`; `fonts.css` has its own,
  `?v=4`). Bump it on every page (`index.html` and `app/*.html`) when you change JS or CSS.

## Architecture

**Four entry pages, two independent state systems.**

| Path (alias in `server.py`) | Page | Scripts |
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

**Command Center shell** (`app/js/app.js` → `window.Shell`): a hash router (`#/route?k=v`) over
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

**Server/auth** (`server.py`, stdlib `ThreadingHTTPServer`):
- Serves static files and the short path aliases (302).
- Gates `pengelola.html`/`checkin.html` (role `pengelola`) and `app/index.html` (role
  `command-center`) behind PIN login at `app/masuk.html`. PINs are stored as PBKDF2 hashes in
  `data/access.json`. Sessions are HttpOnly cookies valid for 12 hours, and 5 wrong PINs lock
  the role for 60 s.
- `POST /api/evt/reset` requires the `pengelola` session.
- `POST /api/evt/state` checks the change against the caller's role before saving: `guard()` in
  `server.py` and `api/_guard.js` (Vercel), both tested against the same cases in
  `tools/tests/guard_cases.json`; keep the two in step. Without a session only buyer changes pass
  (holds, new orders, pay/cancel/expire PENDING orders, waitlist); `command-center` may also change
  gate reports; `pengelola` may change anything. Rejections are 403 and `tx()` surfaces them without
  retrying. The rules themselves still run in the browser, and the QR signing key is client-side.
- `app/js/auth.js` calls `/api/auth/me` and `/api/auth/logout` to show the "Keluar" button; it
  hides the button in local mode.

**Two backends, same API.** Production (https://smiccts.vercel.app, auto-deployed on push to
`main`) does not run `server.py`. It runs `api/index.js`, a dependency-free Vercel function that
serves the same `/api/*` endpoints and the PIN-gated pages (`vercel.json` routes them through
`?__page=`). The differences: state lives in Upstash Redis with the version CAS done atomically
in a Lua script, sessions are stateless HMAC-signed cookies, the lockout is per IP, and PINs come
from env vars (`PIN_PENGELOLA`, `PIN_COMMAND_CENTER`, `SESSION_SECRET`, `KV_REST_API_URL`,
`KV_REST_API_TOKEN`). Any API or auth change has to be made in both `server.py` and
`api/index.js`. `.vercelignore` keeps `tools/`, `data/` and the xlsx/drawio files out of the deploy.

`data/` holds runtime secrets and state (`access.json`, `event_state.json`, `PIN_AWAL.txt`).
Don't commit or share it.

## Conventions

- UI strings, comments and docs are in Indonesian. Keep them that way.
- `app/event.html` is a legacy redirect to `pengunjung.html`. Keep it.
- `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md` documents the seat-selection and QR-validation
  logic. Update it when the engine's rules change.
