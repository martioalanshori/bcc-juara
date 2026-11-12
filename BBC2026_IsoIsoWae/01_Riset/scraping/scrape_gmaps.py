"""Ambil SEMUA ulasan Google Maps Summarecon Mall Bandung ke CSV.

Contoh:
    python scrape_gmaps.py                    # semua ulasan (urut terbaru)
    python scrape_gmaps.py --max 500          # dibatasi
    python scrape_gmaps.py --cdp http://127.0.0.1:9222   # pakai Chrome yang sudah jalan dengan port debug

Kenapa begini:
- Google Maps hanya menampilkan ulasan kalau sudah login.
- Login Google DITOLAK ("Browser atau aplikasi ini mungkin tidak aman") kalau
  Chrome dibuka oleh Playwright, karena ada tanda otomatisasi.
- Jadi script ini membuka Chrome ASLI sebagai proses biasa (profil terpisah di
  .chrome-profile, port debug 9222), lalu baru menyambung lewat CDP. Login di
  jendela itu diterima Google. Cukup sekali, sesi tersimpan di .chrome-profile.
- Chrome utama (profil Default) tidak bisa disambung langsung: sejak Chrome 136
  port debug diabaikan untuk profil bawaan. Karena itu dipakai profil terpisah.

Pengambilan data memakai API internal Maps (listugcposts) yang dipanggil dari
dalam tab yang sudah login, 20 ulasan per permintaan, sampai habis. Kalau format
API berubah, script otomatis kembali ke cara lama (scroll daftar ulasan).
"""

import argparse
import csv
import json
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path
from urllib.parse import quote, unquote

from playwright.sync_api import TimeoutError as PWTimeout
from playwright.sync_api import sync_playwright

DEFAULT_QUERY = "Summarecon Mall Bandung"
HERE = Path(__file__).parent
OUT_DEFAULT = HERE / "data" / "ulasan_gmaps.csv"
RAW_DEBUG = HERE / "data" / "_raw_listugcposts.txt"
PROFILE = HERE / ".chrome-profile"
KOLOM = ["sumber", "tempat", "review_id", "nama", "rating", "tanggal_relatif", "tanggal",
         "teks", "balasan_pengelola", "diambil_pada"]

CHROME_PATHS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    str(Path.home() / r"AppData\Local\Google\Chrome\Application\chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
]

# Perkiraan tanggal dari teks relatif Google Maps ("2 minggu lalu", "setahun lalu").
UNIT_DAYS = {
    "detik": 0, "menit": 0, "jam": 0, "hari": 1, "minggu": 7, "bulan": 30, "tahun": 365,
    "second": 0, "minute": 0, "hour": 0, "day": 1, "week": 7, "month": 30, "year": 365,
}


def perkiraan_tanggal(relatif: str, hari_ini: date) -> str:
    t = (relatif or "").lower().replace("diedit", "").replace("edited", "").strip()
    if "kemarin" in t or "yesterday" in t:
        return (hari_ini - timedelta(days=1)).isoformat()
    m = re.search(r"(\d+|se|a|an)\s*(detik|menit|jam|hari|minggu|bulan|tahun|second|minute|hour|day|week|month|year)", t)
    if not m:
        return ""
    n = 1 if m.group(1) in ("se", "a", "an") else int(m.group(1))
    return (hari_ini - timedelta(days=n * UNIT_DAYS[m.group(2)])).isoformat()


# ---------------------------------------------------------------- Chrome asli + CDP

def cdp_hidup(url: str) -> bool:
    try:
        with urllib.request.urlopen(url.rstrip("/") + "/json/version", timeout=2) as r:
            return r.status == 200
    except Exception:
        return False


def cari_chrome() -> str:
    for p in CHROME_PATHS:
        if Path(p).exists():
            return p
    p = shutil.which("chrome") or shutil.which("google-chrome")
    if p:
        return p
    print("Chrome tidak ditemukan. Pasang Google Chrome atau pakai --cdp.")
    sys.exit(1)


def jalankan_chrome(port: int, headless: bool):
    """Buka Chrome sebagai proses biasa (tanpa flag otomatisasi) supaya login Google diterima."""
    args = [cari_chrome(), f"--remote-debugging-port={port}", f"--user-data-dir={PROFILE.resolve()}",
            "--no-first-run", "--no-default-browser-check", "--lang=id"]
    if headless:
        args.append("--headless=new")
    args.append("about:blank")
    proc = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    url = f"http://127.0.0.1:{port}"
    for _ in range(60):
        if cdp_hidup(url):
            return proc, url
        time.sleep(0.5)
    print("Chrome tidak membuka port debug. Tutup semua jendela Chrome yang memakai .chrome-profile lalu ulangi.")
    sys.exit(1)


# ---------------------------------------------------------------- navigasi Maps

def klik_jika_ada(page, selectors, timeout=3000):
    for sel in selectors:
        try:
            page.locator(sel).first.click(timeout=timeout)
            return True
        except Exception:
            continue
    return False


TAB_ULASAN = [
    'button[role="tab"][aria-label*="Ulasan"]',
    'button[role="tab"][aria-label*="Reviews"]',
    'button[role="tab"]:has-text("Ulasan")',
    'button[role="tab"]:has-text("Reviews")',
]


def buka_tempat(page, query: str, url: str | None):
    target = url or f"https://www.google.com/maps/search/{query.replace(' ', '+')}?hl=id"
    page.goto(target, wait_until="domcontentloaded")
    if "consent." in page.url:
        klik_jika_ada(page, ['button:has-text("Terima semua")', 'button:has-text("Accept all")'], 8000)
    try:
        page.wait_for_selector('h1, a.hfpxzc', timeout=30000)
    except PWTimeout:
        print("Halaman tidak termuat. Selesaikan captcha/persetujuan di jendela Chrome lalu jalankan ulang.")
        sys.exit(1)
    if page.locator("a.hfpxzc").count() and not page.locator('button[role="tab"]').count():
        page.locator("a.hfpxzc").first.click()
    page.wait_for_selector('button[role="tab"]', timeout=30000)
    page.wait_for_timeout(1500)
    nama = page.locator("h1").first.inner_text().strip()
    print(f"Tempat: {nama}")
    return nama


def feature_id(page) -> str | None:
    m = re.search(r"!1s(0x[0-9a-f]+:0x[0-9a-f]+)", unquote(page.url))
    return m.group(1) if m else None


def tab_ulasan_ada(page) -> bool:
    return any(page.locator(s).count() for s in TAB_ULASAN)


def pastikan_login(page, headless: bool, query, url):
    if tab_ulasan_ada(page):
        return
    if headless:
        print("Tab Ulasan tidak muncul (belum login Google). Jalankan sekali tanpa --headless untuk login.")
        sys.exit(1)
    print("\n================ PERLU LOGIN (cukup sekali) ================")
    print("Tab Ulasan tidak muncul karena belum login Google.")
    print("1. Di jendela Chrome yang terbuka, klik 'Login' di kanan atas dan masuk akun Google.")
    print("   (Chrome ini dibuka biasa, bukan otomatisasi, jadi login seharusnya diterima.)")
    print("2. Setelah selesai login, kembali ke terminal ini.")
    input("Tekan Enter kalau sudah login... ")
    buka_tempat(page, query, url)
    if not tab_ulasan_ada(page):
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
    if not tab_ulasan_ada(page):
        print("Tab Ulasan masih tidak ada. Cek apakah sudah login (foto profil muncul di kanan atas Maps).")
        sys.exit(1)


def total_ulasan(page) -> int | None:
    txt = page.evaluate("""() => {
      const t = [...document.querySelectorAll('[aria-label], span, button')]
        .map(e => (e.getAttribute('aria-label') || '') + ' ' + (e.innerText || ''))
        .find(s => /[\\d.,]+\\s*(ulasan|reviews)/i.test(s));
      return t || '';
    }""")
    m = re.search(r"([\d.,]+)\s*(ulasan|reviews)", txt, re.I)
    return int(re.sub(r"[.,]", "", m.group(1))) if m else None


def buka_tab_ulasan(page):
    klik_jika_ada(page, TAB_ULASAN, 10000)
    page.wait_for_selector("div.jftiEf[data-review-id]", timeout=30000)


def urutkan_terbaru(page):
    if klik_jika_ada(page, ['button[aria-label*="Urutkan"]', 'button[aria-label*="Sort"]',
                            'button:has-text("Urutkan")', 'button:has-text("Sort")'], 8000):
        if klik_jika_ada(page, ['div[role="menuitemradio"]:has-text("Terbaru")',
                                'div[role="menuitemradio"]:has-text("Newest")'], 8000):
            page.wait_for_timeout(2500)
            print("Urutan: Terbaru")
            return
    print("Peringatan: gagal mengurutkan ke Terbaru, memakai urutan bawaan.")


SCROLL_JS = """
() => {
  const card = document.querySelector('div.jftiEf[data-review-id]');
  let el = card;
  while (el && !(el.scrollHeight > el.clientHeight + 50 &&
         ['auto','scroll'].includes(getComputedStyle(el).overflowY))) el = el.parentElement;
  if (el) { el.scrollTop = el.scrollHeight; return true; }
  return false;
}
"""


# ---------------------------------------------------------------- cara 1: API listugcposts

def g(o, *path):
    for k in path:
        try:
            o = o[k]
        except (IndexError, KeyError, TypeError):
            return None
    return o


def parse_json(teks: str):
    return json.loads(teks[teks.index("\n") + 1:] if teks.startswith(")]}'") else teks)


def parse_ulasan(item, hari_ini: date):
    rv = g(item, 0)
    rid, rating = g(rv, 0), g(rv, 2, 0, 0)
    if not isinstance(rid, str) or not isinstance(rating, int) or not 1 <= rating <= 5:
        return None
    relatif = g(rv, 1, 6) if isinstance(g(rv, 1, 6), str) else ""
    tanggal = ""
    for ts in (g(rv, 1, 2), g(rv, 1, 3)):  # mikrodetik sejak epoch = tanggal pasti
        if isinstance(ts, int) and ts > 10**15:
            tanggal = datetime.fromtimestamp(ts / 1e6).date().isoformat()
            break
    teks = g(rv, 2, 15, 0, 0)
    balasan = g(rv, 3, 14, 0, 0)
    nama = g(rv, 1, 4, 5, 0) or g(rv, 1, 4, 0, 4)
    return {
        "review_id": rid,
        "nama": nama if isinstance(nama, str) else "",
        "rating": rating,
        "tanggal_relatif": relatif,
        "tanggal": tanggal or perkiraan_tanggal(relatif, hari_ini),
        "teks": teks.strip() if isinstance(teks, str) else "",
        "balasan_pengelola": balasan.strip() if isinstance(balasan, str) else "",
    }


FETCH_JS = """async (url) => {
  const r = await fetch(url, {credentials: 'include'});
  return {status: r.status, text: await r.text()};
}"""


def url_halaman(template: str, token: str, ukuran: int) -> str:
    u = re.sub(r"!2m2!1i\d+!2s[^!&]*", f"!2m2!1i{ukuran}!2s{quote(token, safe='')}", template, count=1)
    return u


def template_bawaan(fid: str) -> str:
    pb = (f"!1m6!1s{fid}!6m4!4m1!1e1!4m1!1e3!2m2!1i20!2s!5m2!1s0!7e81"
          "!8m9!2b1!3b1!5b1!7b1!12m4!1b1!2b1!4m1!1e1!11m0!13m1!1e2")  # 13m1!1e2 = terbaru
    return "https://www.google.com/maps/rpc/listugcposts?authuser=0&hl=id&gl=id&pb=" + quote(pb, safe="!:")


def ambil_lewat_api(page, templates, maks, hari_ini, simpan_sementara):
    hasil = {}
    for template in templates:
        token, ukuran, gagal, halaman = "", 20, 0, 0
        while len(hasil) < maks:
            res = page.evaluate(FETCH_JS, url_halaman(template, token, ukuran))
            if res["status"] != 200:
                if ukuran == 20 and halaman == 0:
                    ukuran = 10  # sebagian format hanya menerima 10 per halaman
                    continue
                gagal += 1
                print(f"\n  HTTP {res['status']}, coba lagi ({gagal}/5)")
                if gagal >= 5:
                    break
                time.sleep(5 * gagal)
                continue
            try:
                data = parse_json(res["text"])
            except Exception:
                RAW_DEBUG.write_text(res["text"][:200000], encoding="utf-8")
                break
            baru = [u for u in (parse_ulasan(it, hari_ini) for it in (g(data, 2) or [])) if u]
            if halaman == 0 and not baru:
                RAW_DEBUG.write_text(res["text"][:200000], encoding="utf-8")
                break  # format tidak dikenali, coba template berikutnya
            gagal = 0
            halaman += 1
            for u in baru:
                hasil.setdefault(u["review_id"], u)
            print(f"\r  terkumpul {len(hasil)} ulasan (halaman {halaman})", end="", flush=True)
            if halaman % 25 == 0:
                simpan_sementara(list(hasil.values()))
            token = g(data, 1)
            if not isinstance(token, str) or not token:
                break  # halaman terakhir
            time.sleep(0.6)
        if hasil:
            print()
            return list(hasil.values())[:maks]
    print()
    return []


# ---------------------------------------------------------------- cara 2: scroll (cadangan)

EXTRACT_JS = """
() => Array.from(document.querySelectorAll('div.jftiEf[data-review-id]')).map(c => {
  const q = s => c.querySelector(s);
  const rating = q('.kvMYJc')?.getAttribute('aria-label') || q('.fzvQIb')?.innerText || '';
  return {
    review_id: c.getAttribute('data-review-id'),
    nama: q('.d4r55')?.innerText?.trim() || '',
    rating: (rating.match(/\\d+/) || [''])[0],
    tanggal_relatif: (q('.rsqaWe') || q('.xRkPPb'))?.innerText?.trim() || '',
    teks: q('.wiI7pd')?.innerText?.trim() || '',
  };
})
"""


def ambil_lewat_scroll(page, maks, hari_ini):
    hasil, tanpa_tambahan = {}, 0
    while len(hasil) < maks and tanpa_tambahan < 15:
        for b in page.locator('button.w8nwRe').all():
            try:
                b.click(timeout=500)
            except Exception:
                pass
        sebelum = len(hasil)
        for r in page.evaluate(EXTRACT_JS):
            if r["review_id"] and r["review_id"] not in hasil:
                r["tanggal"] = perkiraan_tanggal(r["tanggal_relatif"], hari_ini)
                r["balasan_pengelola"] = ""
                hasil[r["review_id"]] = r
        tanpa_tambahan = tanpa_tambahan + 1 if len(hasil) == sebelum else 0
        print(f"\r  terkumpul {len(hasil)} ulasan", end="", flush=True)
        page.evaluate(SCROLL_JS)
        page.wait_for_timeout(1500)
    print()
    return list(hasil.values())[:maks]


# ---------------------------------------------------------------- simpan

def tulis_csv(path: Path, data, tempat: str, waktu: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=KOLOM, extrasaction="ignore")
        w.writeheader()
        for r in data:
            w.writerow({"sumber": "Google Maps", "tempat": tempat, "diambil_pada": waktu, **r})


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--query", default=DEFAULT_QUERY, help="kata kunci tempat di Google Maps")
    ap.add_argument("--url", help="link Google Maps tempat (opsional, menggantikan --query)")
    ap.add_argument("--max", type=int, default=100000, help="jumlah ulasan maksimal (default: semua)")
    ap.add_argument("--out", type=Path, default=OUT_DEFAULT)
    ap.add_argument("--port", type=int, default=9222, help="port debug Chrome (default 9222)")
    ap.add_argument("--cdp", help="sambung ke Chrome yang sudah jalan, mis. http://127.0.0.1:9222")
    ap.add_argument("--headless", action="store_true", help="Chrome tanpa jendela (setelah pernah login)")
    ap.add_argument("--scroll", action="store_true", help="paksa cara lama (scroll), tanpa API")
    a = ap.parse_args()

    hari_ini = date.today()
    waktu = datetime.now().isoformat(timespec="seconds")
    proc, cdp_url = None, a.cdp
    if not cdp_url:
        cdp_url = f"http://127.0.0.1:{a.port}"
        if not cdp_hidup(cdp_url):
            proc, cdp_url = jalankan_chrome(a.port, a.headless)
    print(f"Tersambung ke Chrome di {cdp_url}")

    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(cdp_url)
        ctx = browser.contexts[0] if browser.contexts else browser.new_context()
        try:
            page = ctx.new_page()
            tertangkap = []
            page.on("request", lambda r: tertangkap.append(r.url) if "/maps/rpc/listugcposts" in r.url else None)

            tempat = buka_tempat(page, a.query, a.url)
            pastikan_login(page, a.headless, a.query, a.url)
            total = total_ulasan(page)
            if total:
                print(f"Google Maps mencatat sekitar {total:,} ulasan".replace(",", "."))
            fid = feature_id(page)
            buka_tab_ulasan(page)
            urutkan_terbaru(page)

            def simpan_sementara(d):
                tulis_csv(a.out, d, tempat, waktu)

            data = []
            if not a.scroll:
                for _ in range(3):  # pancing Maps memanggil API supaya formatnya bisa ditiru
                    page.evaluate(SCROLL_JS)
                    page.wait_for_timeout(1500)
                templates = [u for u in tertangkap[-1:]] + ([template_bawaan(fid)] if fid else [])
                if templates:
                    print("Mengambil lewat API Maps...")
                    data = ambil_lewat_api(page, templates, a.max, hari_ini, simpan_sementara)
                if not data:
                    print(f"API tidak bisa dipakai (respons mentah di {RAW_DEBUG.name}). Beralih ke scroll...")
            if not data:
                data = ambil_lewat_scroll(page, a.max, hari_ini)

        finally:
            if proc:  # tutup Chrome dengan rapi supaya sesi login tersimpan
                try:
                    browser.new_browser_cdp_session().send("Browser.close")
                except Exception:
                    proc.terminate()
            else:  # Chrome milik pengguna: cukup tutup tab yang dibuka script
                try:
                    page.close()
                except Exception:
                    pass

    tulis_csv(a.out, data, tempat, waktu)
    print(f"Tersimpan {len(data)} ulasan ke {a.out}")
    if total and len(data) < total * 0.9:
        print(f"Catatan: Google mencatat {total} ulasan, tetapi sebagian ulasan hanya rating tanpa teks"
              " atau disembunyikan Google, jadi jumlah yang bisa diambil bisa lebih sedikit.")


if __name__ == "__main__":
    main()
