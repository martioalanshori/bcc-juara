"""Kelompokkan ulasan/komentar per topik keluhan dan buat ringkasan angka.

Input: satu atau lebih CSV dengan kolom minimal `teks`.
Kolom opsional: `sumber`, `tanggal` (YYYY-MM-DD), `rating`, `nama`.
Bisa hasil scrape_gmaps.py atau CSV isian manual (lihat data/manual_template.csv).

Contoh:
    python analisis.py data/ulasan_gmaps.csv
    python analisis.py data/ulasan_gmaps.csv data/manual_medsos.csv
    python analisis.py data/ulasan_gmaps.csv --export-js   # + data menu Analisis Sentimen di Command Center
"""

import argparse
import csv
import json
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path

DATA = Path(__file__).parent / "data"
# Data menu Analisis Sentimen (Command Center). Hanya angka ringkasan dan kutipan tanpa nama.
EXPORT_JS = Path(__file__).resolve().parents[3] / "app" / "js" / "command-center" / "sentimen-data.js"

# Sumber yang didukung menu Analisis Sentimen. Sumber tanpa data tampil sebagai "Segera".
SUMBER = [("gmaps", "Google Maps", "map"), ("x", "X", "tag"), ("tiktok", "TikTok", "music_note"), ("instagram", "Instagram", "photo_camera")]

# Nada positif untuk komentar tanpa rating (media sosial)
POSITIF = r"seru|keren|mantap|suka|senang|seneng|bagus|rekomen|worth|asik|asyik|nyaman|bersih|enak|puas|cakep|kece|ramah|membantu|favorit|betah|aesthetic"

# Hal yang dipuji pengunjung (dipakai untuk rekomendasi "pertahankan")
PUJIAN = {
    "bersih & rapi": r"bersih|rapi|rapih|terawat",
    "luas & nyaman": r"luas|nyaman|asri|sejuk|adem|tenang|lega",
    "tenant & kuliner lengkap": r"lengkap|banyak pilihan|kuliner|makanan|tenant|resto",
    "event & hiburan": r"event|acara|konser|festival|hiburan|bazar|pameran",
}

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


def sentimen(r):
    """Sederhana untuk demo. Rating 1-2, atau keluhan dengan rating 3, = negatif. Rating 4-5 = positif, kecuali
    berisi keluhan (mis. "antrian cepat walaupun ramai") = netral/campuran. Tanpa rating: keluhan = negatif."""
    rating = int(r["rating"]) if (r.get("rating") or "").isdigit() else None
    if rating is None:  # komentar media sosial tidak punya rating: kata keluhan menang, lalu kata pujian
        if r["keluhan"] or r["negatif"]:
            return "negatif"
        return "positif" if re.search(POSITIF, r["teks"].lower()) else "netral"
    if rating <= 2 or (r["keluhan"] and rating == 3):
        return "negatif"
    if rating >= 4:
        return "netral" if r["keluhan"] else "positif"
    return "netral"


def sumber_id(nama):
    n = (nama or "").lower()
    for sid, label, _ in SUMBER:
        if sid in n or label.lower() in n:
            return sid
    return "gmaps" if "google" in n or "ulasan_gmaps" in n else n


def rekomendasi(total, keluhan, per_topik, events, pujian):
    """Aturan sederhana berbasis angka. Setiap rekomendasi menyebut dasar datanya."""
    nk = len(keluhan) or 1
    out = []
    def add(untuk, prio, judul, alasan, aksi, menu):
        out.append({"untuk": untuk, "prioritas": prio, "judul": judul, "alasan": alasan, "aksi": aksi, "menu": menu})
    p = per_topik.get("parkir", 0)
    if p:
        add("Mall", "Tinggi" if p / nk >= 0.3 else "Sedang", "Informasi sisa slot parkir sebelum pengunjung masuk",
            f"{p} dari {len(keluhan)} keluhan ({p / nk:.0%}) membahas parkir: sulit dapat tempat, antre keluar, tarif.",
            "Tampilkan sisa slot per area (mobil dan motor) di pintu masuk dan portal pengunjung; arahkan ke area yang masih kosong.", "parking")
    for t, n in [(t, per_topik.get(t, 0)) for t in ("petugas/keamanan",)]:
        if n >= 10:
            add("Mall", "Sedang", "Standar layanan petugas parkir dan keamanan",
                f"{n} keluhan menyebut petugas, jukir, atau keamanan.",
                "Briefing layanan per shift, tambah petugas di jam ramai, dan kanal lapor cepat ke Command Center.", "cctv")
    if per_topik.get("toilet", 0) >= 5:
        add("Mall", "Sedang", "Kebersihan toilet mengikuti kepadatan pengunjung",
            f"{per_topik['toilet']} keluhan soal toilet.",
            "Buat tugas kebersihan otomatis saat check-in event atau footfall melewati ambang.", "ticketing")
    if per_topik.get("macet/akses", 0) >= 10:
        add("Event", "Sedang", "Rencana arus kendaraan untuk event besar",
            f"{per_topik['macet/akses']} keluhan soal macet dan akses.",
            "Koordinasi rekayasa lalu lintas, shuttle, dan titik jemput ojek online sebelum event dibuka.", "parking")
    ev_parkir = sum(e["parkir"] for e in events)
    if ev_parkir:
        add("Event", "Tinggi", "Wajib registrasi tiket agar perkiraan kendaraan dihitung",
            f"{ev_parkir} keluhan parkir muncul saat periode event besar ({', '.join(e['nama'].split(' (')[0] for e in events if e['parkir'])}).",
            "Semua event, termasuk yang gratis, memakai registrasi tiket. Perkiraan mobil dan motor dibandingkan sisa kapasitas parkir sebelum hari H.", "event")
    if per_topik.get("penuh/crowded", 0) + per_topik.get("antre/gate", 0) >= 10:
        add("Event", "Sedang", "Batasi kapasitas area dan percepat masuk",
            f"{per_topik.get('penuh/crowded', 0)} keluhan soal penuh dan {per_topik.get('antre/gate', 0)} soal antre.",
            "Check-in QR di beberapa gate dan peringatan saat area event terisi 80%.", "event")
    top = pujian.most_common(1)
    if top:
        t, n = top[0]
        add("Event", "Rendah", f"Pertahankan: pengunjung memuji {t}",
            f"{n} ulasan positif menyebut {t}.",
            "Jadikan kekuatan ini tema promosi event berikutnya dan syarat untuk penyelenggara eksternal.", "event")
    return out


def export_js(rows, keluhan, per_topik, semua, events, contoh_n, contoh=frozenset()):
    """contoh = id sumber yang datanya contoh (file data/contoh_*.csv), tampil berlabel "Contoh" di Command Center."""
    kut = lambda r: {"teks": re.sub(r"\s+", " ", r["teks"]).strip()[:200], "rating": int(r["rating"]) if (r.get("rating") or "").isdigit() else None,
                     "tanggal": (r.get("tanggal") or "")[:7], "sumber": sumber_id(r["sumber"]), "sentimen": r["sentimen"],
                     "topik": r["topik"]}
    sent = Counter(r["sentimen"] for r in rows)
    pujian = Counter(t for r in rows if r["sentimen"] == "positif" for t, pola in PUJIAN.items() if re.search(pola, r["teks"].lower()))
    bulan = {}
    for r in rows:
        d = tanggal(r)
        if d:
            b = bulan.setdefault(d.strftime("%Y-%m"), Counter())
            b["total"] += 1
            b[r["sentimen"]] += 1
    ratings = [int(r["rating"]) for r in rows if (r.get("rating") or "").isdigit()]
    data = {
        "diambil": max((r.get("diambil_pada") or "")[:10] for r in rows) or date.today().isoformat(),
        "sumber": [{"id": sid, "nama": label, "ikon": ic, "ulasan": semua.get(sid, 0),
                    "teks": sum(1 for r in rows if sumber_id(r["sumber"]) == sid),
                    **{s: sum(1 for r in rows if sumber_id(r["sumber"]) == sid and r["sentimen"] == s) for s in ("positif", "netral", "negatif")},
                    "status": ("contoh" if sid in contoh else "aktif") if semua.get(sid) else "segera"}
                   for sid, label, ic in SUMBER],
        "ringkasan": {"ulasan": sum(semua.values()), "teks": len(rows), "rating": round(sum(ratings) / len(ratings), 2) if ratings else None,
                      "positif": sent["positif"], "netral": sent["netral"], "negatif": sent["negatif"], "keluhan": len(keluhan)},
        "topik": [{"nama": t, "keluhan": per_topik.get(t, 0)} for t in sorted(TOPIK, key=lambda t: -per_topik.get(t, 0))],
        "pujian": [{"nama": t, "n": n} for t, n in pujian.most_common()],
        "bulan": [{"bulan": k, **{s: v.get(s, 0) for s in ("total", "positif", "netral", "negatif")}} for k, v in sorted(bulan.items())],
        "event": events,
        "rekomendasi": rekomendasi(len(rows), keluhan, per_topik, events, pujian),
        "kutipan": [kut(r) for t in TOPIK for r in [x for x in keluhan if t in x["topik"]][:contoh_n]]
                   + [kut(r) for r in sorted((x for x in rows if x["sentimen"] == "positif"), key=lambda x: -len(x["teks"]))[:6]]
                   # tiap sumber selain Google Maps: 2 keluhan + 1 pujian, agar semua platform terwakili di kutipan
                   + [kut(r) for sid, _, _ in SUMBER if sid != "gmaps"
                      for r in [x for x in keluhan if sumber_id(x["sumber"]) == sid][:2] + [x for x in rows if sumber_id(x["sumber"]) == sid and x["sentimen"] == "positif"][:1]],
    }
    # kutipan unik (satu ulasan bisa masuk beberapa topik)
    seen, uniq = set(), []
    for k in data["kutipan"]:
        if k["teks"] not in seen:
            seen.add(k["teks"]); uniq.append(k)
    data["kutipan"] = uniq
    EXPORT_JS.write_text("/* Dibuat otomatis oleh BBC2026_IsoIsoWae/01_Riset/scraping/analisis.py --export-js. Jangan diedit manual.\n"
                         " * Ringkasan sentimen ulasan publik (tanpa nama pengulas). Dipakai menu Analisis Sentimen di Command Center. */\n"
                         "window.SENTIMEN = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"Data Command Center: {EXPORT_JS} ({EXPORT_JS.stat().st_size // 1024} KB, {len(uniq)} kutipan, {len(data['rekomendasi'])} rekomendasi)")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # konsol Windows (cp1252) tidak bisa mencetak "≤"
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("csv", nargs="+", type=Path)
    ap.add_argument("--contoh", type=int, default=3, help="contoh kutipan per topik")
    ap.add_argument("--export-js", action="store_true", help="tulis data menu Analisis Sentimen (app/js/command-center/sentimen-data.js)")
    a = ap.parse_args()

    rows = baca(a.csv)
    if not rows:
        print("Tidak ada data dengan kolom 'teks' yang terisi.")
        return

    for r in rows:
        r["topik"], r["negatif"] = label(r["teks"])
        rating = (r.get("rating") or "").strip()
        r["keluhan"] = bool(r["topik"]) and (r["negatif"] or (rating.isdigit() and int(rating) <= 3))
        r["sentimen"] = sentimen(r)

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

    if a.export_js:
        semua, contoh = Counter(), set()  # semua ulasan per sumber, termasuk yang hanya rating tanpa teks
        for p in a.csv:
            with open(p, encoding="utf-8-sig", newline="") as f:
                for r in csv.DictReader(f):
                    sid = sumber_id(r.get("sumber") or p.stem)
                    semua[sid] += 1
                    if p.stem.startswith("contoh"):
                        contoh.add(sid)
        events = []
        for nama, (mulai, akhir) in EVENT.items():
            di = [r for r in rows if (d := tanggal(r)) and mulai <= d <= akhir]
            k = [r for r in di if r["keluhan"]]
            events.append({"nama": nama, "data": len(di), "keluhan": len(k), "parkir": sum("parkir" in r["topik"] for r in k),
                           "negatif": sum(r["sentimen"] == "negatif" for r in di)})
        export_js(rows, keluhan, per_topik, semua, events, a.contoh, frozenset(contoh))


if __name__ == "__main__":
    main()
