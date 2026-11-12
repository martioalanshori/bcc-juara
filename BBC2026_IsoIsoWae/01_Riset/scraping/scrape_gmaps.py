"""Ambil ulasan Google Maps Summarecon Mall Bandung ke CSV.

Contoh:
    python scrape_gmaps.py                 # 300 ulasan terbaru
    python scrape_gmaps.py --max 1000
    python scrape_gmaps.py --headless      # tanpa jendela browser

Google Maps hanya menampilkan ulasan kalau sudah login. Jalankan pertama kali
TANPA --headless: login Google di jendela Chrome yang terbuka, lalu tekan Enter
di terminal. Sesi login disimpan di folder .chrome-profile, jadi berikutnya
tidak perlu login lagi (dan boleh pakai --headless).
"""

import argparse
import csv
import re
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path

from playwright.sync_api import TimeoutError as PWTimeout
from playwright.sync_api import sync_playwright

DEFAULT_QUERY = "Summarecon Mall Bandung"
OUT_DEFAULT = Path(__file__).parent / "data" / "ulasan_gmaps.csv"
PROFILE = Path(__file__).parent / ".chrome-profile"

# Perkiraan tanggal dari teks relatif Google Maps ("2 minggu lalu", "setahun lalu").
UNIT_DAYS = {
    "detik": 0, "menit": 0, "jam": 0, "hari": 1, "minggu": 7, "bulan": 30, "tahun": 365,
    "second": 0, "minute": 0, "hour": 0, "day": 1, "week": 7, "month": 30, "year": 365,
}


def perkiraan_tanggal(relatif: str, hari_ini: date) -> str:
    t = relatif.lower().replace("diedit", "").replace("edited", "").strip()
    if "kemarin" in t or "yesterday" in t:
        return (hari_ini - timedelta(days=1)).isoformat()
    m = re.search(r"(\d+|se|a|an)\s*(detik|menit|jam|hari|minggu|bulan|tahun|second|minute|hour|day|week|month|year)", t)
    if not m:
        return ""
    n = 1 if m.group(1) in ("se", "a", "an") else int(m.group(1))
    return (hari_ini - timedelta(days=n * UNIT_DAYS[m.group(2)])).isoformat()


def klik_jika_ada(page, selectors, timeout=3000):
    for sel in selectors:
        try:
            page.locator(sel).first.click(timeout=timeout)
            return True
        except PWTimeout:
            continue
        except Exception:
            continue
    return False


def buka_tempat(page, query: str, url: str | None):
    target = url or f"https://www.google.com/maps/search/{query.replace(' ', '+')}?hl=id"
    page.goto(target, wait_until="domcontentloaded")

    # Halaman persetujuan cookie (kadang muncul)
    if "consent." in page.url:
        klik_jika_ada(page, ['button:has-text("Terima semua")', 'button:has-text("Accept all")'], 8000)

    # Kalau hasil pencarian berupa daftar, buka hasil pertama
    try:
        page.wait_for_selector('h1, a.hfpxzc', timeout=30000)
    except PWTimeout:
        print("Halaman tidak termuat. Selesaikan captcha/persetujuan di browser lalu jalankan ulang.")
        sys.exit(1)
    if page.locator("a.hfpxzc").count() and not page.locator('button[role="tab"]').count():
        page.locator("a.hfpxzc").first.click()

    page.wait_for_selector('button[role="tab"]', timeout=30000)
    nama = page.locator("h1").first.inner_text().strip()
    print(f"Tempat: {nama}")
    return nama


TAB_ULASAN = [
    'button[role="tab"][aria-label*="Ulasan"]',
    'button[role="tab"][aria-label*="Reviews"]',
    'button[role="tab"]:has-text("Ulasan")',
    'button[role="tab"]:has-text("Reviews")',
]


def buka_tab_ulasan(page, headless: bool):
    if klik_jika_ada(page, TAB_ULASAN, 10000):
        page.wait_for_selector("div.jftiEf[data-review-id]", timeout=30000)
        return
    # Google Maps menyembunyikan ulasan kalau belum login.
    if headless:
        print("Tab Ulasan tidak muncul (belum login Google). Jalankan sekali tanpa --headless untuk login.")
        sys.exit(1)
    print("\nTab Ulasan tidak muncul karena belum login Google.")
    print("Login Google di jendela Chrome yang terbuka (cukup sekali, sesi disimpan di folder .chrome-profile).")
    input("Setelah login dan kembali ke halaman Summarecon Mall Bandung, tekan Enter di sini... ")
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(4000)
    if not klik_jika_ada(page, TAB_ULASAN, 15000):
        print("Tab Ulasan masih tidak ditemukan. Pastikan sudah login dan halaman tempat terbuka.")
        sys.exit(1)
    page.wait_for_selector("div.jftiEf[data-review-id]", timeout=30000)


def urutkan_terbaru(page):
    if klik_jika_ada(page, [
        'button[aria-label*="Urutkan"]', 'button[aria-label*="Sort"]',
        'button:has-text("Urutkan")', 'button:has-text("Sort")',
    ], 8000):
        if klik_jika_ada(page, [
            'div[role="menuitemradio"]:has-text("Terbaru")',
            'div[role="menuitemradio"]:has-text("Newest")',
        ], 8000):
            page.wait_for_timeout(2500)
            print("Urutan: Terbaru")
            return
    print("Peringatan: gagal mengurutkan ke Terbaru, memakai urutan bawaan (Paling relevan).")


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


def kumpulkan(page, maks: int):
    hasil = {}
    tanpa_tambahan = 0
    while len(hasil) < maks and tanpa_tambahan < 8:
        # Buka teks panjang ("Lainnya")
        for b in page.locator('button.w8nwRe').all():
            try:
                b.click(timeout=500)
            except Exception:
                pass
        sebelum = len(hasil)
        for r in page.evaluate(EXTRACT_JS):
            if r["review_id"] and r["review_id"] not in hasil:
                hasil[r["review_id"]] = r
        tanpa_tambahan = tanpa_tambahan + 1 if len(hasil) == sebelum else 0
        print(f"\r  terkumpul {len(hasil)} ulasan", end="", flush=True)
        page.evaluate(SCROLL_JS)
        page.wait_for_timeout(1500)
    print()
    return list(hasil.values())[:maks]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--query", default=DEFAULT_QUERY, help="kata kunci tempat di Google Maps")
    ap.add_argument("--url", help="link Google Maps tempat (opsional, menggantikan --query)")
    ap.add_argument("--max", type=int, default=300, help="jumlah ulasan maksimal (default 300)")
    ap.add_argument("--out", type=Path, default=OUT_DEFAULT)
    ap.add_argument("--headless", action="store_true")
    a = ap.parse_args()

    hari_ini = date.today()
    with sync_playwright() as p:
        # Profil Chrome terpisah supaya login Google tersimpan (tidak mengganggu Chrome utama)
        ctx = p.chromium.launch_persistent_context(
            str(PROFILE), channel="chrome", headless=a.headless,
            locale="id-ID", viewport={"width": 1280, "height": 900},
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        tempat = buka_tempat(page, a.query, a.url)
        buka_tab_ulasan(page, a.headless)
        urutkan_terbaru(page)
        data = kumpulkan(page, a.max)
        ctx.close()

    a.out.parent.mkdir(parents=True, exist_ok=True)
    waktu = datetime.now().isoformat(timespec="seconds")
    kolom = ["sumber", "tempat", "review_id", "nama", "rating", "tanggal_relatif", "tanggal", "teks", "diambil_pada"]
    with a.out.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=kolom)
        w.writeheader()
        for r in data:
            w.writerow({
                "sumber": "Google Maps", "tempat": tempat, **r,
                "tanggal": perkiraan_tanggal(r["tanggal_relatif"], hari_ini),
                "diambil_pada": waktu,
            })
    print(f"Tersimpan {len(data)} ulasan ke {a.out}")


if __name__ == "__main__":
    main()
