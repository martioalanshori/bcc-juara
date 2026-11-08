"""Server LAN Summarecon Mall Command Center (Python standar, tanpa internet & tanpa dependensi).

- Menyajikan file statis proyek (app/, docs/).
- API state Event Ticketing yang dipakai bersama semua perangkat di jaringan lokal:
    GET  /api/evt/state[?v=N]   -> {version, now, state?}   (state hanya dikirim bila versi berubah)
    POST /api/evt/state         body {base, state} -> 200 {ok, version} | 409 {ok:false, version, state}
    POST /api/evt/reset         -> hapus state (klien pertama akan membuat seed ulang)
  POST memakai compare-and-swap berbasis versi di bawah satu lock: dua pembeli yang mengunci
  kursi yang sama pada saat bersamaan -> hanya satu commit berhasil, yang lain menerima 409,
  membaca ulang state, lalu mendapati kursi sudah dipegang orang lain (anti double-booking).

Tiga path (alias pendek, 302 ke halaman di app/):
    /                -> index.html (pilih path)
    /pengunjung      -> app/pengunjung.html   (1. pengunjung membeli tiket, mobile-first)
    /pengelola       -> app/pengelola.html    (2. pengelola/EO: tambah, hapus, batalkan & kelola acara)
    /command-center  -> app/index.html        (3. manajemen mall 360: Command Center, Event 360 hanya pantau)
    /checkin         -> app/checkin.html      (ponsel petugas gate pengelola)

Akses PIN per peran (diverifikasi di server, sesi cookie HttpOnly 12 jam):
    pengelola       -> app/pengelola.html, app/checkin.html, POST /api/evt/reset
    command-center  -> app/index.html (Command Center)
    Pengunjung tidak perlu PIN. PIN disimpan sebagai hash PBKDF2 di data/access.json.
    Saat pertama dijalankan dibuat PIN acak 6 digit, dicetak di konsol & ditulis ke data/PIN_AWAL.txt.
    Ganti PIN:  python3 server.py --set-pin pengelola 123456
                python3 server.py --set-pin command-center 654321
    Salah PIN 5x -> peran itu dikunci 60 detik untuk alamat IP tersebut.

Jalankan:  python3 server.py            (0.0.0.0:8765, bisa diakses PC/ponsel lain di LAN)
           python3 server.py 9000 127.0.0.1
"""
import hashlib
import hmac
import json
import os
import secrets
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import quote

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data", "event_state.json")
ACCESS = os.path.join(ROOT, "data", "access.json")
PIN_NOTE = os.path.join(ROOT, "data", "PIN_AWAL.txt")
LOCK = threading.Lock()
DB = {"version": 0, "state": None}
ALIASES = {
    "/pengunjung": "/app/pengunjung.html",
    "/pengelola": "/app/pengelola.html",
    "/command-center": "/app/index.html",
    "/checkin": "/app/checkin.html",
}

# ---------------------------------------------------------------- akses PIN per peran
ROLES = {
    "pengelola": {"label": "Konsol Pengelola Acara", "home": "/app/pengelola.html",
                  "pages": ["app/pengelola.html", "app/checkin.html"]},
    "command-center": {"label": "Command Center · Mall 360", "home": "/app/index.html",
                       "pages": ["app/index.html"]},
}
SESSION_TTL = 12 * 3600
MAX_FAIL, LOCK_SEC = 5, 60
SESSIONS = {}   # token -> {"role", "exp"}
FAILS = {}      # (ip, role) -> [jumlah gagal, terkunci sampai]
AUTH_LOCK = threading.Lock()
PINS = {}


def cookie_name(role):
    return "smicc_" + role.replace("-", "_")


def hash_pin(pin, salt):
    return hashlib.pbkdf2_hmac("sha256", pin.encode(), bytes.fromhex(salt), 200_000).hex()


def save_pins():
    os.makedirs(os.path.dirname(ACCESS), exist_ok=True)
    with open(ACCESS, "w", encoding="utf-8") as f:
        json.dump(PINS, f, indent=2)


def set_pin(role, pin):
    salt = secrets.token_hex(16)
    PINS[role] = {"salt": salt, "hash": hash_pin(pin, salt), "updated": int(time.time())}


def load_pins():
    """Muat hash PIN; peran yang belum punya PIN diberi PIN acak 6 digit (dicetak sekali)."""
    try:
        with open(ACCESS, encoding="utf-8") as f:
            PINS.update(json.load(f))
    except (OSError, ValueError):
        pass
    fresh = {r: "%06d" % secrets.randbelow(10**6) for r in ROLES if r not in PINS}
    if fresh:
        for r, pin in fresh.items():
            set_pin(r, pin)
        save_pins()
        with open(PIN_NOTE, "a", encoding="utf-8") as f:
            f.write("PIN awal (dibuat %s). Ganti dengan: python3 server.py --set-pin <peran> <PIN baru>, lalu hapus file ini.\n"
                    % time.strftime("%Y-%m-%d %H:%M"))
            for r, pin in fresh.items():
                f.write("  %-15s %s\n" % (r, pin))
        print("PIN awal dibuat (simpan, lalu ganti bila perlu) -> data/PIN_AWAL.txt")
        for r, pin in fresh.items():
            print("  %-15s %s" % (r, pin))


def check_pin(role, pin):
    rec = PINS.get(role)
    return bool(rec) and hmac.compare_digest(hash_pin(pin, rec["salt"]), rec["hash"])


def gated_role(fs_path):
    """Peran yang wajib untuk file ini (perbandingan path nyata, kebal huruf besar/kecil & ../ & %xx)."""
    real = os.path.normcase(os.path.realpath(fs_path)).lower()
    for role, cfg in ROLES.items():
        for page in cfg["pages"]:
            if real == os.path.normcase(os.path.realpath(os.path.join(ROOT, page))).lower():
                return role
    app_dir = os.path.normcase(os.path.realpath(os.path.join(ROOT, "app"))).lower()
    if real == app_dir:  # /app/ -> index.html (Command Center)
        return "command-center"
    return None


def load():
    try:
        with open(DATA, encoding="utf-8") as f:
            DB.update(json.load(f))
    except (OSError, ValueError):
        pass


def persist():
    os.makedirs(os.path.dirname(DATA), exist_ok=True)
    tmp = DATA + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(DB, f, ensure_ascii=False)
    os.replace(tmp, DATA)


# Pemeriksaan tulis state (padanan api/_guard.js; kasus uji bersama tools/tests/guard_cases.json, ubah
# keduanya bersamaan). Aturan bisnis dijalankan engine di browser; server memastikan perubahan yang butuh
# peran datang dari sesi peran itu dan bentuk data tidak dirusak. None = boleh, selain itu pesan penolakan.
OPEN_ORDER = ("PENDING", "PAID", "CANCELLED", "EXPIRED")
HOLD_MAX_MS = 60 * 60000
ARRS = ("order", "scans", "outbox", "waitlist", "reports")
OBJS = ("events", "seats", "qholds", "orders", "tickets")
_MISSING = object()


def _same(a, b):
    """Kesetaraan ketat seperti same() di JS: bool bukan angka, tipe harus cocok."""
    if isinstance(a, bool) or isinstance(b, bool):
        return type(a) is type(b) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return a == b
    if type(a) is not type(b):
        return False
    if isinstance(a, dict):
        return a.keys() == b.keys() and all(_same(a[k], b[k]) for k in a)
    if isinstance(a, list):
        return len(a) == len(b) and all(_same(x, y) for x, y in zip(a, b))
    return a == b


def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _d(x):
    return x if isinstance(x, dict) else {}


def guard(old, new, roles, now_ms=None):
    roles = roles or []
    if "pengelola" in roles:
        return None
    if new is None:
        return "Reset data hanya untuk pengelola."
    if not isinstance(new, dict) or not _same(new.get("v", _MISSING), 1):
        return "Format data tidak valid."
    if old is None:
        return None  # seed awal setelah reset
    lim = (now_ms if now_ms is not None else time.time() * 1000) + HOLD_MAX_MS
    ok_until = lambda u: _num(u) and u <= lim
    if not _same(old.get("v", _MISSING), new.get("v", _MISSING)) or not _same(old.get("seededAt", _MISSING), new.get("seededAt", _MISSING)):
        return "Versi data contoh hanya diubah pengelola (reset)."
    if any(not isinstance(new.get(k), list) for k in ARRS) or any(not isinstance(new.get(k), dict) for k in OBJS):
        return "Format data tidak valid."
    if not _same(old.get("events"), new["events"]) or not _same(old.get("order"), new["order"]):
        return "Perubahan data acara hanya untuk pengelola."
    if not _same(old.get("scans"), new["scans"]):
        return "Check-in hanya dari halaman Check-in (login pengelola)."
    if "command-center" not in roles and not _same(old.get("reports"), new["reports"]):
        return "Laporan gate hanya dari Command Center atau petugas gate."
    oo, no = _d(old.get("orders")), new["orders"]
    ot, nt = _d(old.get("tickets")), new["tickets"]

    def fresh(oid):  # pesanan yang lunas di penulisan ini (sebelumnya PENDING atau belum ada)
        return isinstance(oid, str) and isinstance(no.get(oid), dict) and no[oid].get("status") == "PAID"             and (oid not in oo or _d(oo[oid]).get("status") == "PENDING")

    for k, a in oo.items():
        b = no.get(k)
        if not isinstance(b, dict):
            return "Pesanan tidak boleh dihapus."
        if (not _same(a, b)) if _d(a).get("status") != "PENDING" else (b.get("status") not in OPEN_ORDER):
            return "Refund dan perubahan pesanan lunas hanya untuk pengelola."
    for k, b in no.items():
        if not isinstance(b, dict):
            return "Format pesanan tidak valid."
        if k in oo and _same(oo[k], b):
            continue
        if k not in oo and b.get("status") not in ("PENDING", "PAID"):
            return "Pesanan baru harus menunggu pembayaran atau lunas."
        if not all(isinstance(b.get(f), list) for f in ("items", "tickets", "log")):
            return "Format pesanan tidak valid."
        if b.get("status") == "PENDING" and not ok_until(b.get("until")):
            return "Batas waktu pembayaran tidak valid."
    for k, a in ot.items():
        if k not in nt or not _same(a, nt[k]):
            return "Perubahan e-ticket hanya untuk pengelola."
    for k, x in nt.items():
        if k in ot:
            continue
        if not isinstance(x, dict) or x.get("status") != "ACTIVE" or x.get("checkedInAt"):
            return "E-ticket baru harus aktif dan belum check-in."
        if not fresh(x.get("order")) or k not in no[x["order"]]["tickets"]:
            return "E-ticket hanya terbit untuk pesanan yang baru lunas."
    os_, ns = _d(old.get("seats")), new["seats"]
    for ev in set(os_) | set(ns):
        a = _d(os_.get(ev))
        if ev in ns and not isinstance(ns[ev], dict):
            return "Format kursi tidak valid."
        bb = _d(ns.get(ev))
        for sid in set(a) | set(bb):
            x, y = a.get(sid, _MISSING), bb.get(sid, _MISSING)
            if x is not _MISSING and y is not _MISSING and _same(x, y):
                continue
            if isinstance(x, dict) and x.get("st") == "SOLD":
                return "Kursi terjual hanya bisa dilepas pengelola (refund)."
            if y is _MISSING:
                continue
            if not isinstance(y, dict):
                return "Format kursi tidak valid."
            if y.get("st") == "SOLD":
                if not fresh(y.get("order")) or not any(isinstance(it, dict) and it.get("seat") == sid for it in no[y["order"]]["items"]):
                    return "Kursi hanya terjual lewat pesanan yang lunas."
            elif y.get("st") == "HELD":
                if not ok_until(y.get("until")):
                    return "Batas waktu hold kursi tidak valid."
            else:
                return "Status kursi tidak valid."
    for q in new["qholds"].values():
        if not isinstance(q, list) or any(not isinstance(h, dict) or not ok_until(h.get("until")) for h in q):
            return "Format hold kuota tidak valid."
    return None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, fmt, *args):  # log ringkas: hanya API tulis
        if self.command == "POST":
            sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))

    def end_headers(self):
        if self.path.startswith("/api/") or self.path.endswith((".js", ".html", ".css")):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _redirect(self, location, cookies=()):
        self.send_response(302)
        self.send_header("Location", location)
        for c in cookies:
            self.send_header("Set-Cookie", c)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _cookies(self):
        out = {}
        for part in (self.headers.get("Cookie") or "").split(";"):
            if "=" in part:
                k, v = part.strip().split("=", 1)
                out[k] = v
        return out

    def has_role(self, role):
        tok = self._cookies().get(cookie_name(role))
        if not tok:
            return False
        with AUTH_LOCK:
            sess = SESSIONS.get(tok)
            if sess and sess["role"] == role and sess["exp"] > time.time():
                return True
            SESSIONS.pop(tok, None)
        return False

    def _gate(self):
        """True bila permintaan sudah dijawab (dialihkan ke halaman PIN)."""
        role = gated_role(self.translate_path(self.path))
        if role and not self.has_role(role):
            nxt = self.path if self.path.startswith("/") and not self.path.startswith("//") else ROLES[role]["home"]
            self._redirect("/app/masuk.html?role=%s&next=%s" % (role, quote(nxt, safe="")))
            return True
        return False

    def do_HEAD(self):
        if self._gate():
            return None
        return super().do_HEAD()

    def do_GET(self):
        route = self.path.split("?")[0].rstrip("/").lower()
        if route in ALIASES:
            return self._redirect(ALIASES[route])
        if route == "/api/auth/me":
            return self._json(200, {"ok": True, "server": True, "roles": [r for r in ROLES if self.has_role(r)],
                                    "labels": {r: c["label"] for r, c in ROLES.items()}})
        if self._gate():
            return None
        if self.path.startswith("/api/evt/state"):
            known = None
            if "?v=" in self.path:
                try:
                    known = int(self.path.split("?v=")[1].split("&")[0])
                except ValueError:
                    known = None
            with LOCK:
                out = {"version": DB["version"], "now": int(time.time() * 1000)}
                if known != DB["version"]:
                    out["state"] = DB["state"]
            return self._json(200, out)
        if self.path == "/api/health":
            return self._json(200, {"ok": True, "now": int(time.time() * 1000)})
        return super().do_GET()

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return self._json(400, {"ok": False, "error": "JSON tidak valid"})
        if self.path == "/api/evt/state":
            with LOCK:
                if type(body.get("base")) is not int or body.get("base") != DB["version"]:
                    return self._json(409, {"ok": False, "version": DB["version"], "state": DB["state"],
                                            "now": int(time.time() * 1000)})
                err = guard(DB["state"], body.get("state"), [r for r in ROLES if self.has_role(r)], time.time() * 1000)
                if err:
                    return self._json(403, {"ok": False, "error": err})
                DB["version"] += 1
                DB["state"] = body.get("state")
                persist()
                return self._json(200, {"ok": True, "version": DB["version"], "now": int(time.time() * 1000)})
        if self.path == "/api/auth/login":
            return self._login(body)
        if self.path == "/api/auth/logout":
            role = body.get("role")
            tok = self._cookies().get(cookie_name(role)) if role in ROLES else None
            with AUTH_LOCK:
                SESSIONS.pop(tok, None)
            body_out = json.dumps({"ok": True}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            if role in ROLES:
                self.send_header("Set-Cookie", "%s=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict" % cookie_name(role))
            self.send_header("Content-Length", str(len(body_out)))
            self.end_headers()
            self.wfile.write(body_out)
            return None
        if self.path == "/api/evt/reset":
            if not self.has_role("pengelola"):
                return self._json(401, {"ok": False, "error": "Reset data event hanya untuk pengelola (masuk dengan PIN pengelola)."})
            with LOCK:
                DB["version"] += 1
                DB["state"] = None
                persist()
                return self._json(200, {"ok": True, "version": DB["version"]})
        return self._json(404, {"ok": False})


def _login(self, body):
    role, pin = body.get("role"), str(body.get("pin") or "")
    if role not in ROLES:
        return self._json(400, {"ok": False, "error": "Peran tidak dikenal."})
    key, now = (self.client_address[0], role), time.time()
    with AUTH_LOCK:
        fails, until = FAILS.get(key, [0, 0])
        if until > now:
            return self._json(429, {"ok": False, "error": "Terlalu banyak percobaan. Coba lagi dalam %d detik." % (until - now + 1),
                                    "retry": int(until - now + 1)})
    if not (pin.isdigit() and 4 <= len(pin) <= 8 and check_pin(role, pin)):
        with AUTH_LOCK:
            fails += 1
            left = MAX_FAIL - fails
            if left <= 0:
                FAILS[key] = [0, now + LOCK_SEC]
                return self._json(429, {"ok": False, "error": "PIN salah %d kali. Akses dikunci %d detik." % (MAX_FAIL, LOCK_SEC),
                                        "retry": LOCK_SEC})
            FAILS[key] = [fails, 0]
        return self._json(401, {"ok": False, "error": "PIN salah. Sisa percobaan: %d." % left})
    tok = secrets.token_urlsafe(32)
    with AUTH_LOCK:
        FAILS.pop(key, None)
        for t in [t for t, x in SESSIONS.items() if x["exp"] < now]:
            SESSIONS.pop(t, None)
        SESSIONS[tok] = {"role": role, "exp": now + SESSION_TTL}
    nxt = str(body.get("next") or "")
    if not (nxt.startswith("/") and not nxt.startswith("//") and gated_role(self.translate_path(nxt)) == role):
        nxt = ROLES[role]["home"]
    out = json.dumps({"ok": True, "role": role, "next": nxt}).encode()
    self.send_response(200)
    self.send_header("Content-Type", "application/json; charset=utf-8")
    self.send_header("Set-Cookie", "%s=%s; Path=/; Max-Age=%d; HttpOnly; SameSite=Strict" % (cookie_name(role), tok, SESSION_TTL))
    self.send_header("Content-Length", str(len(out)))
    self.end_headers()
    self.wfile.write(out)
    return None


Handler._login = _login


def lan_ips():
    import socket
    ips = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))  # tidak mengirim paket; hanya memilih interface
        ips.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    return sorted(ips)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--set-pin":
        if len(sys.argv) != 4 or sys.argv[2] not in ROLES or not (sys.argv[3].isdigit() and 4 <= len(sys.argv[3]) <= 8):
            sys.exit("Pemakaian: python3 server.py --set-pin {%s} <PIN 4-8 digit>" % "|".join(ROLES))
        load_pins()
        set_pin(sys.argv[2], sys.argv[3])
        save_pins()
        print("PIN %s diperbarui. Restart server agar sesi lama tidak berlaku." % sys.argv[2])
        if os.path.exists(PIN_NOTE):  # buang PIN awal peran ini dari catatan; hapus file bila sudah kosong
            with open(PIN_NOTE, encoding="utf-8") as f:
                lines = [ln for ln in f if not ln.strip().startswith(sys.argv[2] + " ")]
            if any(ln.startswith("  ") for ln in lines):
                with open(PIN_NOTE, "w", encoding="utf-8") as f:
                    f.writelines(lines)
            else:
                os.remove(PIN_NOTE)
                print("data/PIN_AWAL.txt dihapus (semua PIN awal sudah diganti).")
        sys.exit(0)
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    host = sys.argv[2] if len(sys.argv) > 2 else "0.0.0.0"
    load()
    load_pins()
    srv = ThreadingHTTPServer((host, port), Handler)
    print(f"Summarecon Mall · Event & Command Center berjalan di http://localhost:{port}/")
    for ip in lan_ips():
        base = f"http://{ip}:{port}"
        print(f"  Pilih path (LAN)            : {base}/")
        print(f"  1. Pengunjung (beli tiket)  : {base}/pengunjung")
        print(f"  2. Pengelola acara (EO)     : {base}/pengelola")
        print(f"  3. Command Center mall 360  : {base}/command-center")
        print(f"     Check-in gate (ponsel)   : {base}/checkin")
    print("Path 2 & 3 (dan /checkin) meminta PIN peran. Ganti PIN: python3 server.py --set-pin <peran> <PIN>")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
