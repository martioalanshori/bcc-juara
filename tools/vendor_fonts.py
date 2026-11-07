"""Unduh Google Fonts (Barlow, Barlow Condensed, JetBrains Mono, Material Symbols)
ke app/vendor/fonts agar aplikasi berjalan tanpa internet (jaringan lokal saja).

Jalankan sekali saat masih ada internet:  python3 tools/vendor_fonts.py
Hasil: app/vendor/fonts/fonts.css + file .woff2
"""
import hashlib
import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "app" / "vendor" / "fonts"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")  # agar Google mengirim woff2
CSS_URLS = [
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",
    "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700"
    "&family=Barlow+Condensed:wght@500;600;700&family=JetBrains+Mono:wght@400..700&display=swap",
]
# Subset yang dipakai aplikasi (teks Indonesia/Inggris); cyrillic/greek/vietnamese dilewati.
KEEP_SUBSETS = {"latin", "latin-ext", "fallback", None}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    blocks_out = []
    for css_url in CSS_URLS:
        css = get(css_url).decode()
        # Setiap blok @font-face didahului komentar subset, mis. /* latin */
        for m in re.finditer(r"(?:/\*\s*([\w-]+)\s*\*/\s*)?(@font-face\s*\{[^}]+\})", css):
            subset, block = m.group(1), m.group(2)
            if subset not in KEEP_SUBSETS:
                continue
            fam = re.search(r"font-family:\s*'([^']+)'", block).group(1)
            src = re.search(r"url\((https://[^)]+)\)", block).group(1)
            name = f"{fam.replace(' ', '')}-{subset or 'all'}-{hashlib.md5(src.encode()).hexdigest()[:6]}.woff2"
            (OUT / name).write_bytes(get(src))
            blocks_out.append(f"/* {fam} · {subset or 'all'} */\n" + block.replace(src, name))
            print("ok", name)
        # Kelas helper (mis. .material-symbols-outlined) ikut disalin
        for rule in re.findall(r"(\.[\w-]+\s*\{[^}]+\})", css):
            blocks_out.append(rule)
    (OUT / "fonts.css").write_text("\n".join(blocks_out) + "\n")
    print("fonts.css ditulis:", OUT / "fonts.css")


if __name__ == "__main__":
    main()
