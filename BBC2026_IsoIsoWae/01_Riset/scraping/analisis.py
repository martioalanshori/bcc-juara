"""Kelompokkan ulasan/komentar per topik keluhan dan buat ringkasan angka.

Input: satu atau lebih CSV dengan kolom minimal `teks`.
Kolom opsional: `sumber`, `tanggal` (YYYY-MM-DD), `rating`, `nama`.
Bisa hasil scrape_gmaps.py atau CSV isian manual (lihat data/manual_template.csv).

Contoh:
    python analisis.py data/ulasan_gmaps.csv
    python analisis.py data/ulasan_gmaps.csv data/manual_medsos.csv
"""

import argparse
import csv
import re
from collections import Counter
from datetime import date
from pathlib import Path

DATA = Path(__file__).parent / "data"

# Kata kunci per topik (huruf kecil, regex). Tambahkan kalau ketemu istilah baru.
TOPIK = {
    "parkir": r"parkir|parkiran|parking|slot|lahan parkir|valet",
    "antre/gate": r"antre|antri|ngantri|ngantre|antrian|antrean|gate|palang|pintu masuk|loket",
    "penuh/crowded": r"penuh|rame banget|ramai banget|padat|sesak|crowded|desak|berjubel|full",
    "macet/akses": r"macet|kemacetan|akses jalan|jalan sempit|bahu jalan|lalu lintas|traffic",
    "toilet": r"toilet|wc|kamar mandi|restroom|bau pesing|bau",
    "event": r"event|acara|festival|konser|bazar|bazaar|expo|pameran|kuliner|fkb|roeang|atrium|panggung",
    "tiket": r"tiket|ticket|loket\.com|gelang|registrasi|check.?in",
    "petugas/keamanan": r"satpam|security|petugas|tukang parkir|jukir|keamanan",
}

# Kata yang menandakan nada keluhan (dipakai untuk memisahkan keluhan vs pujian)
NEGATIF = r"susah|sulit|lama|kecewa|parah|ribet|ga ada|gak ada|nggak ada|tidak ada|kurang|jelek|buruk|bau|kotor|macet|penuh|antri|antre|mahal|lambat|nyesel|zonk|capek|cape|ga dapet|gak dapet|ditutup|muter|bingung|semrawut|kacau"

# Periode event besar untuk membandingkan keluhan saat event vs di luar event
EVENT = {
    "FKB Vol. 3 (25 Agu - 27 Sep 2026)": (date(2026, 8, 25), date(2026, 9, 27)),
    "Roeang Kita (6 - 8 Nov 2026)": (date(2026, 11, 6), date(2026, 11, 8)),
}


def baca(paths):
    rows = []
    for p in paths:
        with open(p, encoding="utf-8-sig", newline="") as f:
            for r in csv.DictReader(f):
                if (r.get("teks") or "").strip():
                    r.setdefault("sumber", Path(p).stem)
                    rows.append(r)
    return rows


def label(teks):
    t = teks.lower()
    topik = [k for k, pola in TOPIK.items() if re.search(pola, t)]
    negatif = bool(re.search(NEGATIF, t))
    return topik, negatif


def tanggal(r):
    try:
        return date.fromisoformat((r.get("tanggal") or "")[:10])
    except ValueError:
        return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("csv", nargs="+", type=Path)
    ap.add_argument("--contoh", type=int, default=3, help="contoh kutipan per topik")
    a = ap.parse_args()

    rows = baca(a.csv)
    if not rows:
        print("Tidak ada data dengan kolom 'teks' yang terisi.")
        return

    for r in rows:
        r["topik"], r["negatif"] = label(r["teks"])
        rating = (r.get("rating") or "").strip()
        r["keluhan"] = bool(r["topik"]) and (r["negatif"] or (rating.isdigit() and int(rating) <= 3))

    total = len(rows)
    keluhan = [r for r in rows if r["keluhan"]]
    per_topik = Counter(t for r in keluhan for t in r["topik"])
    sumber = Counter(r["sumber"] for r in rows)
    ratings = [int(r["rating"]) for r in rows if (r.get("rating") or "").isdigit()]
    tgl = [d for d in map(tanggal, rows) if d]

    # Simpan CSV berlabel
    out_csv = DATA / "hasil_berlabel.csv"
    out_csv.parent.mkdir(exist_ok=True)
    with out_csv.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["sumber", "tanggal", "rating", "keluhan", "topik", "teks"])
        for r in rows:
            w.writerow([r["sumber"], r.get("tanggal", ""), r.get("rating", ""),
                        "ya" if r["keluhan"] else "", ", ".join(r["topik"]), r["teks"]])

    # Ringkasan markdown
    L = [f"# Hasil Analisis Ulasan & Komentar", "",
         f"- Dibuat: {date.today().isoformat()}",
         f"- Sumber: " + ", ".join(f"{k} ({v})" for k, v in sumber.items()),
         f"- Total data: **{total}**"]
    if tgl:
        L.append(f"- Rentang tanggal (perkiraan): {min(tgl)} s.d. {max(tgl)}")
    if ratings:
        L.append(f"- Rata-rata rating: {sum(ratings)/len(ratings):.2f} dari {len(ratings)} ulasan "
                 f"({sum(1 for x in ratings if x <= 3)} ulasan rating ≤3)")
    L += ["", "## Keluhan per topik", "",
          f"Keluhan = menyebut topik di bawah **dan** bernada negatif (atau rating ≤3). "
          f"Total keluhan: **{len(keluhan)} dari {total} ({len(keluhan)/total:.1%})**.", "",
          "| Topik | Jumlah keluhan | % dari total data |", "|---|---|---|"]
    for t in TOPIK:
        n = per_topik.get(t, 0)
        L.append(f"| {t} | {n} | {n/total:.1%} |")

    # Saat event vs di luar event
    if tgl:
        L += ["", "## Keluhan saat periode event besar", "",
              "| Periode | Data | Keluhan | Keluhan parkir | Keluhan antre/penuh |", "|---|---|---|---|---|"]
        for nama, (mulai, akhir) in EVENT.items():
            di = [r for r in rows if (d := tanggal(r)) and mulai <= d <= akhir]
            k = [r for r in di if r["keluhan"]]
            L.append(f"| {nama} | {len(di)} | {len(k)} | "
                     f"{sum('parkir' in r['topik'] for r in k)} | "
                     f"{sum(bool({'antre/gate','penuh/crowded'} & set(r['topik'])) for r in k)} |")
        L.append("")
        L.append("> Tanggal Google Maps hanya perkiraan dari teks relatif (\"2 bulan lalu\"), "
                 "jadi pencocokan dengan periode event bersifat kasar.")

    L += ["", "## Contoh kutipan", ""]
    for t in TOPIK:
        contoh = [r for r in keluhan if t in r["topik"]][: a.contoh]
        if not contoh:
            continue
        L.append(f"**{t}**")
        for r in contoh:
            teks = re.sub(r"\s+", " ", r["teks"])[:280]
            L.append(f"> \"{teks}\" — {r['sumber']}, {r.get('tanggal') or 'tanpa tanggal'}"
                     + (f", rating {r['rating']}" if r.get("rating") else ""))
            L.append("")

    top = per_topik.most_common(2)
    if top:
        L += ["## Kalimat siap pakai untuk deck", "",
              f"> \"Dari {total} ulasan/komentar pengunjung, {len(keluhan)} berisi keluhan. "
              + ", ".join(f"{n} di antaranya soal {t}" for t, n in top) + ".\""]

    out_md = DATA / "hasil_analisis.md"
    out_md.write_text("\n".join(L) + "\n", encoding="utf-8")
    print("\n".join(L[:20]))
    print(f"\nRingkasan: {out_md}\nData berlabel: {out_csv}")


if __name__ == "__main__":
    main()
