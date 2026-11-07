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

There are no tests, linter or package manager. Check changes by running `server.py` and opening
the pages in a browser.

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
- Script tags carry a cache-buster (`?v=10`). Bump it on every page when you change JS or CSS.

## Architecture

**Four entry pages, two independent state systems.**

| Path (alias in `server.py`) | Page | Scripts |
|---|---|---|
| `/command-center` | `app/index.html` | everything: `sop-data`, `data`, `store`, `ui`, `views/*`, `evt/engine`, `sim`, `app` |
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
- Known prototype limitation: the event state API itself is not role-authorized.

`data/` holds runtime secrets and state (`access.json`, `event_state.json`, `PIN_AWAL.txt`).
Don't commit or share it.

## Conventions

- UI strings, comments and docs are in Indonesian. Keep them that way.
- `app/event.html` is a legacy redirect to `pengunjung.html`. Keep it.
- `docs/EVENT_TICKETING_Asumsi_Alur_Logika.md` documents the seat-selection and QR-validation
  logic. Update it when the engine's rules change.
