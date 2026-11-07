# -*- coding: utf-8 -*-
"""
Generator dokumen & data SMICC-TS (Summarecon Mall).
  python3 tools/build_docs.py
Menghasilkan:
  app/js/sop-data.js
  docs/SOP_Drilldown_Summarecon_Mall_Command_Center.xlsx
  docs/UseCase_Relasi_Dashboard_Summarecon_Mall.xlsx
  docs/RUNBOOK_Relasi_Dashboard_Summarecon_Mall.md
"""
import html
import json
import os
import re
import sys
from collections import defaultdict, OrderedDict
from datetime import date

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

sys.path.insert(0, os.path.dirname(__file__))
from sop_data import (DASHBOARDS, ESCALATION, MALL_NAME, MALL_SUB, ROLES, SLA, SOPS,  # noqa: E402
                      SYSTEM_NAME)
from usecase_data import EVENTS, RELATIONS, USECASES  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
APPJS = os.path.join(ROOT, "app", "js")
DRAWIO = os.path.join(ROOT, "Mindmap_Super_Mall_Ticketing_system.drawio")
TODAY = date.today().isoformat()

DB = OrderedDict((d[0], d) for d in DASHBOARDS)
DBN = {k: v[1] for k, v in DB.items()}
SOPI = {s["id"]: s for s in SOPS}

# ------------------------------------------------------------------ mindmap
def parse_mindmap():
    s = open(DRAWIO, encoding="utf-8").read()
    nodes, edges = {}, []
    for c in re.findall(r"<mxCell ([^>]*)", s):
        a = dict(re.findall(r'(\w+)="([^"]*)"', c))
        if a.get("edge") == "1":
            edges.append((a.get("source"), a.get("target")))
        elif "value" in a:
            nodes[a["id"]] = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(a["value"]))).strip()
    ch, par = defaultdict(list), {}
    for a, b in edges:
        ch[a].append(b)
        par[b] = a
    root = [n for n in nodes if n not in par and nodes[n] and ch[n]][0]
    rows = []
    for p in ch[root]:
        for sd in ch[p]:
            for leaf in ch[sd]:
                rows.append((nodes[root], nodes[p], nodes[sd], nodes[leaf]))
    return rows


def norm(t):
    return re.sub(r"[^a-z0-9]", "", t.lower())


MINDMAP = parse_mindmap()


def sops_for_leaf(leaf, subdomain):
    out = []
    for s in SOPS:
        toks = [norm(x) for x in re.split(r",\s*", s["nodes"])]
        if norm(leaf) in toks:
            out.append(s["id"])
    return out


# ------------------------------------------------------------------ JS data
def write_js():
    data = dict(
        mall=MALL_NAME, mallSub=MALL_SUB, system=SYSTEM_NAME, generated=TODAY,
        dashboards=[dict(code=d[0], name=d[1], route=d[2], pillar=d[3], purpose=d[4], users=d[5],
                         sources=d[6], widgets=d[7]) for d in DASHBOARDS],
        roles=ROLES,
        sla=[dict(level=s[0], label=s[1], category=s[2], example=s[3], trigger=s[4], respond=s[5],
                  resolve=s[6], resolveText=s[7], pic=s[8], escalation=s[9]) for s in SLA],
        escalation=[dict(level=e[0], stage=e[1], t=e[2], to=e[3], channel=e[4], cond=e[5], msg=e[6]) for e in ESCALATION],
        sops=SOPS,
        usecases=USECASES,
        relations=[dict(frm=r[0], to=r[1], data=r[2]) for r in RELATIONS],
        events=[dict(code=e[0], name=e[1], producer=e[2], consumers=e[3], payload=e[4], protocol=e[5]) for e in EVENTS],
        mindmap=[dict(root=m[0], pillar=m[1], sub=m[2], leaf=m[3], sops=sops_for_leaf(m[3], m[2])) for m in MINDMAP],
    )
    with open(os.path.join(APPJS, "sop-data.js"), "w", encoding="utf-8") as f:
        f.write("/* AUTO-GENERATED oleh tools/build_docs.py - jangan edit manual */\n")
        f.write("window.SMICC_REF = ")
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write(";\n")


# ------------------------------------------------------------------ Excel styling helpers
FONT = "Arial"
NAVY = "0A122A"
NAVY2 = "171E37"
CYAN = "38BDF8"
THIN = Side(style="thin", color="C9D3E0")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
PRIO_FILL = {"P1": "FDE2E7", "P2": "FFEDD5", "P3": "FEF9C3", "P4": "DCFCE7"}
PRIO_FONT = {"P1": "B91C1C", "P2": "C2410C", "P3": "A16207", "P4": "15803D"}
PHASE_FILL = {"1": "E0F2FE", "2": "EDE9FE", "3": "FCE7F3", "4": "FFEDD5", "5": "FEF3C7",
              "6": "FEE2E2", "7": "DCFCE7", "8": "E2E8F0"}


def title_block(ws, title, subtitle, width):
    ws["A1"] = title
    ws["A1"].font = Font(name=FONT, size=15, bold=True, color="FFFFFF")
    ws["A2"] = subtitle
    ws["A2"].font = Font(name=FONT, size=10, italic=True, color="BDE7FF")
    for r in (1, 2):
        for c in range(1, width + 1):
            ws.cell(r, c).fill = PatternFill("solid", fgColor=NAVY)
    ws.row_dimensions[1].height = 26
    ws.row_dimensions[2].height = 18


def header(ws, row, cols, widths=None):
    for i, h in enumerate(cols, 1):
        c = ws.cell(row, i, h)
        c.font = Font(name=FONT, bold=True, color="FFFFFF", size=10)
        c.fill = PatternFill("solid", fgColor="1E3A5F")
        c.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
        c.border = BORDER
    ws.row_dimensions[row].height = 32
    if widths:
        for i, w in enumerate(widths, 1):
            ws.column_dimensions[get_column_letter(i)].width = w


def body(ws, r1, r2, ncol, center_cols=()):
    for r in range(r1, r2 + 1):
        for c in range(1, ncol + 1):
            cell = ws.cell(r, c)
            if cell.font is None or cell.font.name != FONT or not (cell.font.bold or cell.font.color):
                cell.font = Font(name=FONT, size=9)
            cell.alignment = Alignment(wrap_text=True, vertical="top",
                                       horizontal="center" if c in center_cols else "left")
            cell.border = BORDER


def prio_paint(cell, prio):
    k = (prio or "")[:2]
    if k in PRIO_FILL:
        cell.fill = PatternFill("solid", fgColor=PRIO_FILL[k])
        cell.font = Font(name=FONT, size=9, bold=True, color=PRIO_FONT[k])


def finish(ws, hdr_row, last_col, last_row):
    ws.freeze_panes = ws.cell(hdr_row + 1, 2 if last_col > 3 else 1)
    ws.auto_filter.ref = f"A{hdr_row}:{get_column_letter(last_col)}{max(last_row, hdr_row + 1)}"
    ws.sheet_view.showGridLines = False


def note(ws, row, text, ncol):
    ws.cell(row, 1, text).font = Font(name=FONT, size=8, italic=True, color="64748B")
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=ncol)
    ws.cell(row, 1).alignment = Alignment(wrap_text=True, vertical="top")
    ws.row_dimensions[row].height = 30


def cover(wb, title, purpose, sheets):
    ws = wb.active
    ws.title = "0_Cover"
    ws.sheet_view.showGridLines = False
    title_block(ws, title, f"{SYSTEM_NAME} | Versi {TODAY}", 6)
    ws.column_dimensions["A"].width = 30
    ws.column_dimensions["B"].width = 100
    r = 4
    for k, v in [("Mall", f"{MALL_NAME} - {MALL_SUB}"), ("Tujuan dokumen", purpose),
                 ("Sumber turunan", "Super_Mall_Command_Center_Blueprint.xlsx (KPI, Hirarki Data, Matriks SLA P1-P4); "
                                    "Mindmap_Super_Mall_Ticketing_system.drawio (6 pilar & data point Level-3); "
                                    "Desain Stitch 'Aegis Command' (6 dashboard)"),
                 ("Generator", "tools/build_docs.py (single source of truth: tools/sop_data.py & tools/usecase_data.py). "
                               "Ubah data di file Python lalu jalankan ulang agar Excel, Runbook & prototype tetap sinkron."),
                 ("Legenda prioritas", "P1 Critical (merah) | P2 High (oranye) | P3 Medium (kuning) | P4 Low (hijau) | '-' = SOP proses bisnis terjadwal (non-insiden)")]:
        ws.cell(r, 1, k).font = Font(name=FONT, bold=True, size=10)
        ws.cell(r, 2, v).font = Font(name=FONT, size=10)
        ws.cell(r, 2).alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[r].height = 32
        r += 1
    r += 1
    ws.cell(r, 1, "Daftar sheet").font = Font(name=FONT, bold=True, size=11, color="1E3A5F")
    r += 1
    for name, desc in sheets:
        ws.cell(r, 1, name).font = Font(name=FONT, size=10, bold=True)
        ws.cell(r, 2, desc).font = Font(name=FONT, size=10)
        ws.cell(r, 2).alignment = Alignment(wrap_text=True)
        r += 1
    return ws


def expand_levels(p):
    m = re.match(r"P(\d)-P(\d)", p)
    if m:
        return ",".join(f"P{i}" for i in range(int(m.group(1)), int(m.group(2)) + 1))
    return p if p.startswith("P") else "-"


# ------------------------------------------------------------------ SOP workbook
def build_sop_xlsx():
    wb = Workbook()
    sheets = [
        ("1_SLA_Matrix", "Matriks SLA P1-P4 (drill dari blueprint) + jumlah SOP per prioritas (formula)"),
        ("2_Eskalasi", "Matriks eskalasi berjenjang L0-L4 per prioritas (T+menit, penerima, kanal, isi pesan)"),
        ("3_SOP_Master", "Katalog seluruh SOP: pilar, sub-domain, node mindmap, trigger, sensor, PIC, SLA, KPI, bukti & kriteria penutupan"),
        ("4_SOP_Langkah", "Drill-down langkah per SOP: fase, role, aksi, dashboard, target waktu, output/bukti"),
        ("5_RACI", "Matriks RACI SOP x Role (A = Accountable/PIC, R = Responsible pada langkah, I = Informed)"),
        ("6_Trace_Mindmap", "Traceability setiap data point mindmap Level-3 -> SOP -> dashboard"),
        ("7_Ringkasan_Pilar", "Ringkasan jumlah SOP & langkah per pilar (formula COUNTIF)"),
        ("8_Roles", "Kamus role / PIC"),
    ]
    cover(wb, f"SOP drill-down {MALL_NAME} Integrated Command Center",
          "Drill-down seluruh SOP Command Center: dari matriks SLA & automated action blueprint menjadi langkah eksekusi "
          "per role & dashboard, lengkap dengan eskalasi, RACI dan traceability ke mindmap data.", sheets)

    # 1 SLA
    ws = wb.create_sheet("1_SLA_Matrix")
    cols = ["Level", "Label", "Kategori Insiden", "Contoh Kejadian di Lapangan", "Trigger Deteksi di Command Center",
            "Target Respons (Menit)", "Target Resolusi (Menit)", "Target Resolusi (Teks)", "PIC Eksekutor Utama",
            "Eskalasi ke Owner / Direksi", "Jumlah SOP yang Mencakup Level (formula)", "Warning SLA At-Risk (80% Resolusi, Menit)"]
    title_block(ws, "Matriks SLA insiden Command Center (drill-down)", "Sumber: Blueprint sheet 4_BMS_Utility_SLA_Matrix", len(cols))
    header(ws, 4, cols, [7, 11, 24, 36, 32, 12, 12, 16, 28, 30, 12, 16])
    for i, s in enumerate(SLA):
        r = 5 + i
        vals = list(s) + [f'=COUNTIF(\'3_SOP_Master\'!$U:$U,"*"&A{r}&"*")', f"=G{r}*0.8"]
        for c, v in enumerate(vals, 1):
            ws.cell(r, c, v)
        body(ws, r, r, len(cols), center_cols=(1, 2, 6, 7, 11, 12))
        prio_paint(ws.cell(r, 1), s[0])
        for c in (6, 7):
            ws.cell(r, c).font = Font(name=FONT, size=9, color="0000FF")
    note(ws, 10, "Angka biru = input dari blueprint (Target Respons/Resolusi). Kolom 'Jumlah SOP' menghitung SOP di 3_SOP_Master "
                 "kolom 'Level Tercakup' (rentang seperti P1-P4 sudah diurai menjadi P1,P2,P3,P4).", len(cols))
    finish(ws, 4, len(cols), 8)

    # 2 Eskalasi
    ws = wb.create_sheet("2_Eskalasi")
    cols = ["Prioritas", "Tahap Eskalasi", "T+ (Menit)", "Dari -> Ke", "Kanal", "Kondisi Pemicu", "Isi Pesan Minimum"]
    title_block(ws, "Matriks eskalasi berjenjang", "Drill dari kolom 'Eskalasi ke Owner / Direksi' pada blueprint", len(cols))
    header(ws, 4, cols, [10, 20, 10, 30, 32, 42, 42])
    for i, e in enumerate(ESCALATION):
        r = 5 + i
        for c, v in enumerate(e, 1):
            ws.cell(r, c, v)
        body(ws, r, r, len(cols), center_cols=(1, 3))
        prio_paint(ws.cell(r, 1), e[0])
    note(ws, 6 + len(ESCALATION), "T+43200 menit = rekap bulanan (30 hari).", len(cols))
    finish(ws, 4, len(cols), 4 + len(ESCALATION))

    # 3 SOP Master
    ws = wb.create_sheet("3_SOP_Master")
    cols = ["SOP ID", "Judul SOP", "Pilar", "Sub-Domain", "Node Mindmap (Level-3)", "Prioritas Default",
            "Trigger", "Sumber Data / Sensor", "Protokol", "Dashboard Utama", "Dashboard Terkait",
            "PIC (Accountable)", "Target Respons (Menit)", "Target Resolusi (Menit)", "Automated Action (Blueprint)",
            "KPI SOP", "Bukti Wajib", "Kriteria Penutupan", "Jumlah Langkah", "Use Case Terkait", "Level Tercakup"]
    title_block(ws, "Katalog SOP Command Center", f"{len(SOPS)} SOP lintas 6 pilar + Command Center umum", len(cols))
    header(ws, 4, cols, [12, 34, 22, 20, 28, 10, 34, 28, 16, 18, 18, 22, 11, 11, 34, 32, 26, 30, 9, 16, 14])
    uc_by_sop = defaultdict(list)
    for u in USECASES:
        for sid in re.split(r",\s*", u["sops"]):
            uc_by_sop[sid].append(u["id"])
    for i, s in enumerate(SOPS):
        r = 5 + i
        top = s["priority"][:2] if s["priority"].startswith("P") else ""
        resp = f'=IFERROR(INDEX(\'1_SLA_Matrix\'!$F$5:$F$8,MATCH("{top}",\'1_SLA_Matrix\'!$A$5:$A$8,0)),"-")' if top else "-"
        reso = f'=IFERROR(INDEX(\'1_SLA_Matrix\'!$G$5:$G$8,MATCH("{top}",\'1_SLA_Matrix\'!$A$5:$A$8,0)),"-")' if top else "-"
        vals = [s["id"], s["title"], s["pillar"], s["subdomain"], s["nodes"], s["priority"], s["trigger"], s["source"],
                s["protocol"], DBN[s["dashboard"]], s["related"], ROLES[s["pic"]], resp, reso, s["auto_action"],
                s["kpi"], s["evidence"], s["closure"], f"=COUNTIF('4_SOP_Langkah'!$A:$A,A{r})",
                ", ".join(uc_by_sop.get(s["id"], [])) or "-", expand_levels(s["priority"])]
        for c, v in enumerate(vals, 1):
            ws.cell(r, c, v)
        body(ws, r, r, len(cols), center_cols=(1, 6, 13, 14, 19, 21))
        ws.cell(r, 1).font = Font(name=FONT, size=9, bold=True)
        prio_paint(ws.cell(r, 6), s["priority"])
    last = 4 + len(SOPS)
    note(ws, last + 2, "Target Respons/Resolusi diambil dengan INDEX/MATCH dari 1_SLA_Matrix memakai level tertinggi pada kolom Prioritas Default. "
                       "'-' = SOP proses bisnis terjadwal (bukan insiden ber-SLA).", len(cols))
    finish(ws, 4, len(cols), last)

    # 4 Langkah
    ws = wb.create_sheet("4_SOP_Langkah")
    cols = ["SOP ID", "Judul SOP", "No", "Fase", "Role", "Nama Role", "Aksi / Instruksi Kerja", "Dashboard",
            "Target Waktu", "Output / Bukti", "Selesai? (Y/N)"]
    title_block(ws, "Drill-down langkah SOP", "Satu baris = satu langkah eksekusi. Kolom 'Selesai?' dapat dipakai sebagai checklist drill/audit.", len(cols))
    header(ws, 4, cols, [12, 30, 5, 18, 8, 26, 60, 22, 14, 24, 10])
    r = 5
    dv = DataValidation(type="list", formula1='"Y,N"', allow_blank=True)
    ws.add_data_validation(dv)
    for s in SOPS:
        for n, st in enumerate(s["steps"], 1):
            vals = [s["id"], s["title"], n, st["phase"], st["role"], ROLES[st["role"]], st["action"],
                    DBN[st["dashboard"]], st["target"], st["output"], ""]
            for c, v in enumerate(vals, 1):
                ws.cell(r, c, v)
            body(ws, r, r, len(cols), center_cols=(3, 5, 9, 11))
            ws.cell(r, 4).fill = PatternFill("solid", fgColor=PHASE_FILL[st["phase"][0]])
            ws.cell(r, 11).fill = PatternFill("solid", fgColor="FFFF00")
            dv.add(ws.cell(r, 11))
            r += 1
    note(ws, r + 1, "Sel kuning kolom 'Selesai?' = isian checklist (Y/N) saat drill atau audit kepatuhan SOP.", len(cols))
    finish(ws, 4, len(cols), r - 1)
    n_steps = r - 5

    # 5 RACI
    ws = wb.create_sheet("5_RACI")
    rk = list(ROLES.keys())
    cols = ["SOP ID", "Judul SOP"] + rk
    title_block(ws, "Matriks RACI SOP x role", "A = Accountable (PIC) | R = Responsible (eksekutor langkah) | I = Informed (GM/BOD untuk P1-P2)", len(cols))
    header(ws, 4, cols, [12, 34] + [6] * len(rk))
    fills = {"A": "1E3A5F", "R": "38BDF8", "I": "E2E8F0"}
    for i, s in enumerate(SOPS):
        r = 5 + i
        ws.cell(r, 1, s["id"])
        ws.cell(r, 2, s["title"])
        steproles = {st["role"] for st in s["steps"]}
        for j, k in enumerate(rk):
            v = ""
            if k == s["pic"]:
                v = "A"
            elif k in steproles:
                v = "R"
            elif k in ("GM", "BOD") and any(p in s["priority"] for p in ("P1", "P2")):
                v = "I"
            ws.cell(r, 3 + j, v)
        body(ws, r, r, len(cols), center_cols=tuple(range(3, len(cols) + 1)))
        for j in range(len(rk)):
            c = ws.cell(r, 3 + j)
            if c.value:
                c.fill = PatternFill("solid", fgColor=fills[c.value])
                c.font = Font(name=FONT, size=9, bold=True, color="FFFFFF" if c.value == "A" else "0A122A")
    tr = 5 + len(SOPS)
    ws.cell(tr, 2, "Total keterlibatan (A+R)").font = Font(name=FONT, bold=True, size=9)
    for j in range(len(rk)):
        col = get_column_letter(3 + j)
        ws.cell(tr, 3 + j, f'=COUNTIF({col}5:{col}{tr - 1},"A")+COUNTIF({col}5:{col}{tr - 1},"R")')
        ws.cell(tr, 3 + j).font = Font(name=FONT, bold=True, size=9)
        ws.cell(tr, 3 + j).alignment = Alignment(horizontal="center")
    ws.cell(tr + 2, 1, "Kode role: lihat sheet 8_Roles.").font = Font(name=FONT, size=8, italic=True, color="64748B")
    finish(ws, 4, len(cols), tr - 1)

    # 6 Trace mindmap
    ws = wb.create_sheet("6_Trace_Mindmap")
    cols = ["Level 0: Core", "Level 1: Pilar", "Level 2: Sub-Domain", "Level 3: Data Point", "SOP Terkait", "Dashboard Utama SOP", "Status Cakupan"]
    title_block(ws, "Traceability mindmap -> SOP -> dashboard", "Setiap node Level-3 pada Mindmap_Super_Mall_Ticketing_system.drawio", len(cols))
    header(ws, 4, cols, [30, 28, 24, 32, 30, 34, 14])
    for i, m in enumerate(MINDMAP):
        r = 5 + i
        ids = sops_for_leaf(m[3], m[2])
        dbs = sorted({DBN[SOPI[x]["dashboard"]] for x in ids})
        vals = [m[0].replace("SUPER MALL", MALL_NAME.upper()), m[1], m[2], m[3], ", ".join(ids) or "-", ", ".join(dbs) or "-",
                f'=IF(E{r}="-","GAP","Tercakup")']
        for c, v in enumerate(vals, 1):
            ws.cell(r, c, v)
        body(ws, r, r, len(cols), center_cols=(7,))
    last = 4 + len(MINDMAP)
    ws.cell(last + 2, 4, "Cakupan node (%)").font = Font(name=FONT, bold=True, size=9)
    ws.cell(last + 2, 5, f'=COUNTIF(G5:G{last},"Tercakup")/COUNTA(D5:D{last})')
    ws.cell(last + 2, 5).number_format = "0.0%"
    ws.cell(last + 2, 5).font = Font(name=FONT, bold=True, size=9)
    finish(ws, 4, len(cols), last)

    # 7 Ringkasan pilar
    ws = wb.create_sheet("7_Ringkasan_Pilar")
    cols = ["Pilar", "Jumlah SOP", "Jumlah Langkah", "Rata-rata Langkah / SOP", "SOP Prioritas P1 (mengandung P1)"]
    title_block(ws, "Ringkasan SOP per pilar", "Semua angka adalah formula ke 3_SOP_Master & 4_SOP_Langkah", len(cols))
    header(ws, 4, cols, [36, 14, 14, 18, 22])
    pillars = list(OrderedDict.fromkeys(s["pillar"] for s in SOPS))
    for i, p in enumerate(pillars):
        r = 5 + i
        ws.cell(r, 1, p)
        ws.cell(r, 2, f"=COUNTIF('3_SOP_Master'!$C:$C,A{r})")
        ws.cell(r, 3, f"=SUMIF('3_SOP_Master'!$C:$C,A{r},'3_SOP_Master'!$S:$S)")
        ws.cell(r, 4, f"=IF(B{r}=0,0,C{r}/B{r})")
        ws.cell(r, 4).number_format = "0.0"
        ws.cell(r, 5, f'=COUNTIFS(\'3_SOP_Master\'!$C:$C,A{r},\'3_SOP_Master\'!$F:$F,"*P1*")')
        body(ws, r, r, len(cols), center_cols=(2, 3, 4, 5))
    tr = 5 + len(pillars)
    ws.cell(tr, 1, "TOTAL")
    for c, f in ((2, f"=SUM(B5:B{tr-1})"), (3, f"=SUM(C5:C{tr-1})"), (4, f"=IF(B{tr}=0,0,C{tr}/B{tr})"), (5, f"=SUM(E5:E{tr-1})")):
        ws.cell(tr, c, f)
    body(ws, tr, tr, len(cols), center_cols=(2, 3, 4, 5))
    for c in range(1, 6):
        ws.cell(tr, c).font = Font(name=FONT, bold=True, size=9)
        ws.cell(tr, c).fill = PatternFill("solid", fgColor="E0F2FE")
    ws.cell(tr, 4).number_format = "0.0"
    finish(ws, 4, len(cols), tr)

    # 8 Roles
    ws = wb.create_sheet("8_Roles")
    cols = ["Kode", "Role / Jabatan", "Jumlah SOP sebagai PIC", "Jumlah Langkah sebagai Eksekutor"]
    title_block(ws, "Kamus role / PIC", "", len(cols))
    header(ws, 4, cols, [10, 40, 18, 22])
    for i, (k, v) in enumerate(ROLES.items()):
        r = 5 + i
        ws.cell(r, 1, k)
        ws.cell(r, 2, v)
        ws.cell(r, 3, f"=COUNTIF('3_SOP_Master'!$L:$L,B{r})")
        ws.cell(r, 4, f"=COUNTIF('4_SOP_Langkah'!$E:$E,A{r})")
        body(ws, r, r, len(cols), center_cols=(1, 3, 4))
    finish(ws, 4, len(cols), 4 + len(ROLES))

    path = os.path.join(DOCS, "SOP_Drilldown_Summarecon_Mall_Command_Center.xlsx")
    wb.save(path)
    return path, n_steps


# ------------------------------------------------------------------ Use case workbook
def build_uc_xlsx():
    wb = Workbook()
    sheets = [
        ("1_Katalog_Dashboard", f"{len(DASHBOARDS)} dashboard SMICC-TS: tujuan, pengguna, sumber data, widget kunci, jumlah relasi (formula)"),
        ("2_Matriks_Relasi", "Matriks dashboard (dari) x dashboard (ke) berisi aliran data/aksi"),
        ("3_Daftar_Relasi", "Daftar relasi antar dashboard dalam format tabel"),
        ("4_Daftar_UseCase", "Katalog use case: trigger, dashboard utama & terkait, SOP, prioritas, aktor, tujuan"),
        ("5_Alur_UseCase", "Langkah per use case: dashboard asal -> tujuan, event, aktor, aksi, data, waktu"),
        ("6_Trace_UC_Dashboard", "Matriks use case x dashboard: jumlah langkah yang menyentuh tiap dashboard (formula COUNTIFS)"),
        ("7_Event_Dictionary", "Kamus event integrasi (producer, consumer, payload, protokol)"),
    ]
    cover(wb, f"Use case relasi antar dashboard {MALL_NAME}",
          f"Mendefinisikan bagaimana {len(DASHBOARDS)} dashboard Command Center saling bertukar data & memicu aksi pada setiap skenario operasional. "
          "Pendamping dari RUNBOOK_Relasi_Dashboard_Summarecon_Mall.md dan simulator use case di prototype.", sheets)
    codes = list(DB.keys())

    # 1 Katalog
    ws = wb.create_sheet("1_Katalog_Dashboard")
    cols = ["Kode", "Dashboard", "Route Prototype", "Pilar Mindmap", "Tujuan", "Pengguna Utama", "Sumber Data Utama",
            "Widget Kunci", "Relasi Keluar (formula)", "Relasi Masuk (formula)", "Langkah Use Case Menyentuh (formula)"]
    title_block(ws, "Katalog dashboard", f"{MALL_NAME} {MALL_SUB}", len(cols))
    header(ws, 4, cols, [8, 28, 14, 26, 42, 30, 38, 46, 11, 11, 13])
    for i, d in enumerate(DASHBOARDS):
        r = 5 + i
        vals = [d[0], d[1], "#/" + d[2], d[3], d[4], d[5], d[6], d[7],
                f"=COUNTIF('3_Daftar_Relasi'!$A:$A,A{r})", f"=COUNTIF('3_Daftar_Relasi'!$C:$C,A{r})",
                f"=COUNTIF('5_Alur_UseCase'!$D:$D,A{r})+COUNTIFS('5_Alur_UseCase'!$F:$F,A{r},'5_Alur_UseCase'!$D:$D,\"<>\"&A{r})"]
        for c, v in enumerate(vals, 1):
            ws.cell(r, c, v)
        body(ws, r, r, len(cols), center_cols=(1, 3, 9, 10, 11))
        ws.cell(r, 1).font = Font(name=FONT, size=9, bold=True)
    finish(ws, 4, len(cols), 4 + len(DASHBOARDS))

    # 2 Matriks
    ws = wb.create_sheet("2_Matriks_Relasi")
    title_block(ws, "Matriks relasi dashboard (baris = dari, kolom = ke)", "Isi sel = data/aksi yang mengalir", len(codes) + 1)
    header(ws, 4, ["Dari \\ Ke"] + [f"{c}\n{DBN[c]}" for c in codes], [24] + [30] * len(codes))
    rel = {(a, b): t for a, b, t in RELATIONS}
    for i, a in enumerate(codes):
        r = 5 + i
        ws.cell(r, 1, f"{a} - {DBN[a]}").font = Font(name=FONT, bold=True, size=9)
        for j, b in enumerate(codes):
            ws.cell(r, 2 + j, "■ (diri sendiri)" if a == b else rel.get((a, b), ""))
        body(ws, r, r, len(codes) + 1)
        ws.cell(r, 1).font = Font(name=FONT, bold=True, size=9)
        ws.cell(r, 1).fill = PatternFill("solid", fgColor="E0F2FE")
        for j, b in enumerate(codes):
            c = ws.cell(r, 2 + j)
            if a == b:
                c.fill = PatternFill("solid", fgColor="E2E8F0")
            elif c.value:
                c.fill = PatternFill("solid", fgColor="ECFEFF")
        ws.row_dimensions[r].height = 70
    ws.freeze_panes = "B5"
    ws.sheet_view.showGridLines = False

    # 3 Daftar relasi
    ws = wb.create_sheet("3_Daftar_Relasi")
    cols = ["Dari (Kode)", "Dari Dashboard", "Ke (Kode)", "Ke Dashboard", "Data / Aksi yang Mengalir", "Dipakai di Use Case"]
    title_block(ws, "Daftar relasi antar dashboard", f"{len(RELATIONS)} relasi", len(cols))
    header(ws, 4, cols, [10, 28, 10, 28, 64, 30])
    for i, (a, b, t) in enumerate(RELATIONS):
        r = 5 + i
        ucs = sorted({u["id"] for u in USECASES for s in u["steps"] if s["frm"] == a and s["to"] == b})
        for c, v in enumerate([a, DBN[a], b, DBN[b], t, ", ".join(ucs) or "-"], 1):
            ws.cell(r, c, v)
        body(ws, r, r, len(cols), center_cols=(1, 3))
    finish(ws, 4, len(cols), 4 + len(RELATIONS))

    # 4 Use cases
    ws = wb.create_sheet("4_Daftar_UseCase")
    cols = ["UC ID", "Nama Use Case", "Trigger", "Dashboard Utama", "Dashboard Terkait", "SOP Terkait", "Prioritas",
            "Aktor (Role)", "Tujuan / Kriteria Sukses", "Judul Tiket", "Lokasi", "Kamera", "Jumlah Langkah (formula)",
            "Jumlah Dashboard Disentuh"]
    title_block(ws, "Daftar use case relasi dashboard", f"{len(USECASES)} use case", len(cols))
    header(ws, 4, cols, [8, 34, 40, 22, 26, 26, 9, 30, 40, 34, 26, 10, 11, 12])
    for i, u in enumerate(USECASES):
        r = 5 + i
        touched = {s["frm"] for s in u["steps"]} | {s["to"] for s in u["steps"]}
        vals = [u["id"], u["name"], u["trigger"], DBN[u["primary"]], u["related"], u["sops"], u["priority"], u["actors"],
                u["goal"], u["ticket"]["title"], u["ticket"]["location"], u["ticket"]["cam"] or "-",
                f"=COUNTIF('5_Alur_UseCase'!$A:$A,A{r})", len(touched)]
        for c, v in enumerate(vals, 1):
            ws.cell(r, c, v)
        body(ws, r, r, len(cols), center_cols=(1, 7, 12, 13, 14))
        ws.cell(r, 1).font = Font(name=FONT, size=9, bold=True)
        prio_paint(ws.cell(r, 7), u["priority"])
    finish(ws, 4, len(cols), 4 + len(USECASES))

    # 5 Alur
    ws = wb.create_sheet("5_Alur_UseCase")
    cols = ["UC ID", "Nama Use Case", "Langkah", "Dari (Kode)", "Dari Dashboard", "Ke (Kode)", "Ke Dashboard", "Event",
            "Aktor", "Aksi / Respons Sistem", "Data / Payload", "Waktu (T+)"]
    title_block(ws, "Alur langkah use case antar dashboard", "Baris dengan Dari = Ke adalah aksi internal dashboard", len(cols))
    header(ws, 4, cols, [8, 30, 7, 8, 24, 8, 24, 22, 8, 56, 22, 10])
    r = 5
    for u in USECASES:
        for n, s in enumerate(u["steps"], 1):
            vals = [u["id"], u["name"], n, s["frm"], DBN[s["frm"]], s["to"], DBN[s["to"]], s["event"], s["actor"],
                    s["action"], s["data"], s["t"]]
            for c, v in enumerate(vals, 1):
                ws.cell(r, c, v)
            body(ws, r, r, len(cols), center_cols=(1, 3, 4, 6, 9, 12))
            if s["frm"] != s["to"]:
                ws.cell(r, 6).fill = PatternFill("solid", fgColor="ECFEFF")
            r += 1
    finish(ws, 4, len(cols), r - 1)

    # 6 Trace
    ws = wb.create_sheet("6_Trace_UC_Dashboard")
    cols = ["UC ID", "Nama Use Case"] + codes + ["Total Lintas Dashboard"]
    title_block(ws, "Traceability use case x dashboard", "Angka = jumlah langkah yang berasal dari atau menuju dashboard (formula COUNTIFS ke 5_Alur_UseCase)", len(cols))
    header(ws, 4, cols, [8, 36] + [9] * len(codes) + [12])
    for i, u in enumerate(USECASES):
        r = 5 + i
        ws.cell(r, 1, u["id"])
        ws.cell(r, 2, u["name"])
        for j, c in enumerate(codes):
            col = get_column_letter(3 + j)
            ws.cell(r, 3 + j, f"=COUNTIFS('5_Alur_UseCase'!$A:$A,$A{r},'5_Alur_UseCase'!$D:$D,{col}$4)"
                              f"+COUNTIFS('5_Alur_UseCase'!$A:$A,$A{r},'5_Alur_UseCase'!$F:$F,{col}$4,'5_Alur_UseCase'!$D:$D,\"<>\"&{col}$4)")
        lc = get_column_letter(2 + len(codes))
        ws.cell(r, 3 + len(codes), f'=COUNTIF(C{r}:{lc}{r},">0")')
        body(ws, r, r, len(cols), center_cols=tuple(range(3, len(cols) + 1)))
    # header row uses codes exactly (needed by formula)
    for j, c in enumerate(codes):
        ws.cell(4, 3 + j, c)
    tr = 5 + len(USECASES)
    ws.cell(tr, 2, "Total langkah per dashboard").font = Font(name=FONT, bold=True, size=9)
    for j in range(len(codes) + 1):
        col = get_column_letter(3 + j)
        ws.cell(tr, 3 + j, f"=SUM({col}5:{col}{tr - 1})")
        ws.cell(tr, 3 + j).font = Font(name=FONT, bold=True, size=9)
        ws.cell(tr, 3 + j).alignment = Alignment(horizontal="center")
    from openpyxl.formatting.rule import ColorScaleRule
    ws.conditional_formatting.add(f"C5:{get_column_letter(2 + len(codes))}{tr - 1}",
                                  ColorScaleRule(start_type="num", start_value=0, start_color="FFFFFF",
                                                 end_type="max", end_color="38BDF8"))
    finish(ws, 4, len(cols), tr - 1)

    # 7 Events
    ws = wb.create_sheet("7_Event_Dictionary")
    cols = ["Kode Event", "Nama", "Producer", "Consumers", "Payload", "Protokol", "Dipakai di Langkah (formula)"]
    title_block(ws, "Kamus event integrasi", "Event bus antar dashboard", len(cols))
    header(ws, 4, cols, [22, 28, 12, 28, 56, 26, 14])
    for i, e in enumerate(EVENTS):
        r = 5 + i
        for c, v in enumerate(list(e) + [f"=COUNTIF('5_Alur_UseCase'!$H:$H,A{r})"], 1):
            ws.cell(r, c, v)
        body(ws, r, r, len(cols), center_cols=(3, 7))
    finish(ws, 4, len(cols), 4 + len(EVENTS))

    path = os.path.join(DOCS, "UseCase_Relasi_Dashboard_Summarecon_Mall.xlsx")
    wb.save(path)
    return path


# ------------------------------------------------------------------ Runbook
def build_runbook():
    L = []
    w = L.append
    w(f"# Runbook relasi antar dashboard {MALL_NAME} Integrated Command Center")
    w("")
    w(f"> **Sistem:** {SYSTEM_NAME}  ")
    w(f"> **Versi:** {TODAY} · dihasilkan oleh `tools/build_docs.py` (sumber data `tools/sop_data.py` & `tools/usecase_data.py`)  ")
    w("> **Pendamping:** `docs/UseCase_Relasi_Dashboard_Summarecon_Mall.xlsx`, `docs/SOP_Drilldown_Summarecon_Mall_Command_Center.xlsx`, prototype `app/index.html` (menu *Simulator Use Case*)")
    w("")
    w("## Daftar isi")
    w("1. [Tujuan & ruang lingkup](#1-tujuan--ruang-lingkup)")
    w("2. [Peta dashboard & relasi](#2-peta-dashboard--relasi)")
    w("3. [Prinsip operasi lintas dashboard](#3-prinsip-operasi-lintas-dashboard)")
    w("4. [Matriks SLA & eskalasi](#4-matriks-sla--eskalasi)")
    w("5. [Prosedur rutin Command Center](#5-prosedur-rutin-command-center)")
    w("6. [Runbook per use case](#6-runbook-per-use-case)")
    w("7. [Kamus event integrasi](#7-kamus-event-integrasi)")
    w("8. [Lampiran: role & kontak](#8-lampiran-role--kontak)")
    w("")
    w("## 1. Tujuan & ruang lingkup")
    w("")
    w(f"Runbook ini menjadi panduan operasional bagi operator, Shift Lead, dan PIC lapangan {MALL_NAME} dalam menjalankan "
      "skenario yang melibatkan **lebih dari satu dashboard**. Setiap use case menjelaskan siapa melakukan apa, di dashboard mana, "
      "data apa yang berpindah, dan kapan harus eskalasi. Detail langkah per SOP ada di Excel SOP drill-down.")
    w("")
    w(f"**Ruang lingkup:** {len(DASHBOARDS)} dashboard, "
      f"{len(USECASES)} use case lintas dashboard, {len(SOPS)} SOP, {len(RELATIONS)} relasi data, dan {len(EVENTS)} jenis event integrasi.")
    w("")
    w("## 2. Peta dashboard & relasi")
    w("")
    w("| Kode | Dashboard | Route prototype | Tujuan | Pengguna utama |")
    w("|---|---|---|---|---|")
    for d in DASHBOARDS:
        w(f"| **{d[0]}** | {d[1]} | `#/{d[2]}` | {d[4]} | {d[5]} |")
    w("")
    w("```mermaid")
    w("flowchart LR")
    for d in DASHBOARDS:
        w(f'  {d[0]}["{d[1]}"]')
    for a, b, t in RELATIONS:
        short = t.split("->")[0].strip()[:38].replace('"', "'")
        w(f'  {a} -->|"{short}"| {b}')
    w("  classDef hub fill:#38bdf8,stroke:#0a122a,color:#0a122a;")
    w("  class TIC hub;")
    w("```")
    w("")
    w(f"**{DBN['TIC']} (TIC)** adalah *hub*: setiap event dari BMS, CCTV, TEN, ENE, dan PARK yang memerlukan tindakan manusia "
      f"**wajib** berakhir sebagai tiket agar SLA, eskalasi, dan pelaporan {DBN['ANL']} terukur.")
    w("")
    w("### Matriks relasi ringkas")
    w("")
    codes = list(DB.keys())
    rel = {(a, b) for a, b, _ in RELATIONS}
    w("| Dari \\ Ke | " + " | ".join(codes) + " |")
    w("|---|" + "---|" * len(codes))
    for a in codes:
        w(f"| **{a}** | " + " | ".join("·" if a == b else ("●" if (a, b) in rel else "") for b in codes) + " |")
    w("")
    w("● = ada aliran data/aksi. Detail isi tiap relasi: sheet `2_Matriks_Relasi` dan `3_Daftar_Relasi`.")
    w("")
    w("## 3. Prinsip operasi lintas dashboard")
    w("")
    for p in [
        "**Satu insiden = satu tiket.** Alarm dari beberapa sumber (BMS + CCTV + chat tenant) untuk lokasi & kejadian sama digabung (merge) ke tiket induk.",
        "**Verifikasi visual sebelum dispatch P1/P2.** Operator membuka kamera terdekat (CCTV) maksimal 60 detik; tidak boleh menunda dispatch P1 lebih dari itu.",
        "**Dashboard pemilik aset melakukan mitigasi teknis**, dashboard TIC mencatat status. Contoh: start chiller standby dilakukan di BMS, status DISPATCHED/RESOLVED di TIC.",
        "**Tenant selalu diberi tahu** bila zona tenant terdampak (TEN broadcast), paling lambat T+10 untuk P2 dan T+3 untuk P1.",
        "**Tidak ada tiket ditutup tanpa bukti**: foto sesudah, sensor normal (BMS/ENE), atau kamera aman (CCTV).",
        f"**{DBN['ANL']} hanya membaca** (consumer). Semua KPI dihitung dari event; tidak ada input manual angka KPI.",
        f"**{DBN['O360']} menerima eskalasi P1 otomatis** (detik ke-1) dan P2 bila melewati 15 menit.",
    ]:
        w(f"- {p}")
    w("")
    w("### Status siklus tiket")
    w("")
    w("```")
    w("OPEN -> ACKNOWLEDGED -> DISPATCHED -> ON-SITE -> RESOLVED -> CLOSED")
    w("                 \\-> ESCALATED (paralel, tidak menghentikan siklus)")
    w("```")
    w("")
    w("## 4. Matriks SLA & eskalasi")
    w("")
    w("| Level | Kategori | Contoh | Respons | Resolusi | PIC | Eskalasi owner |")
    w("|---|---|---|---|---|---|---|")
    for s in SLA:
        w(f"| **{s[0]} {s[1]}** | {s[2]} | {s[3]} | {s[5]} menit | {s[7]} | {s[8]} | {s[9]} |")
    w("")
    w("**Eskalasi berjenjang**")
    w("")
    w("| Prioritas | Tahap | T+ | Dari → Ke | Kanal | Kondisi |")
    w("|---|---|---|---|---|---|")
    for e in ESCALATION:
        t = "Bulanan" if e[2] >= 43200 else f"{e[2]} mnt"
        w(f"| {e[0]} | {e[1]} | {t} | {e[3]} | {e[4]} | {e[5]} |")
    w("")
    w("## 5. Prosedur rutin Command Center")
    w("")
    for sid in ("SOP-CC-05", "SOP-CC-01", "SOP-CC-02", "SOP-CC-03", "SOP-CC-04", "SOP-CC-06"):
        s = SOPI[sid]
        w(f"### {s['id']}: {s['title']}")
        w("")
        w(f"*Trigger:* {s['trigger']} · *PIC:* {ROLES[s['pic']]} · *KPI:* {s['kpi']}")
        w("")
        for n, st in enumerate(s["steps"], 1):
            w(f"{n}. **[{st['role']} · {st['dashboard']} · {st['target']}]** {st['action']} → _{st['output']}_")
        w("")
    w("## 6. Runbook per use case")
    w("")
    w("| UC | Nama | Prioritas | Dashboard utama | Dashboard terkait | SOP |")
    w("|---|---|---|---|---|---|")
    for u in USECASES:
        w(f"| [{u['id']}](#{u['id'].lower()}) | {u['name']} | {u['priority']} | {u['primary']} | {u['related']} | {u['sops']} |")
    w("")
    for u in USECASES:
        w(f"### {u['id']}")
        w(f"#### {u['name']}")
        w("")
        w(f"- **Trigger:** {u['trigger']}")
        w(f"- **Prioritas:** {u['priority']} · **Dashboard utama:** {DBN[u['primary']]} · **Terkait:** {u['related']}")
        w(f"- **SOP acuan:** {u['sops']}")
        w(f"- **Aktor:** {', '.join(f'{a.strip()} ({ROLES[a.strip()]})' for a in u['actors'].split(','))}")
        w(f"- **Kriteria sukses:** {u['goal']}")
        t = u["ticket"]
        w(f"- **Tiket:** \"{t['title']}\" · lokasi {t['location']} · sumber {t['source']}" + (f" · kamera {t['cam']}" if t["cam"] else ""))
        w("")
        w("```mermaid")
        w("sequenceDiagram")
        touched = []
        for s in u["steps"]:
            for c in (s["frm"], s["to"]):
                if c not in touched:
                    touched.append(c)
        for c in touched:
            w(f"  participant {c} as {DBN[c]}")
        for s in u["steps"]:
            msg = f"{s['t']} {s['event']}: {s['action'][:60]}".replace(";", ",").replace("#", "No.")
            w(f"  {s['frm']}->>{s['to']}: {msg}")
        w("```")
        w("")
        w("| # | T+ | Dari → Ke | Event | Aktor | Aksi | Data |")
        w("|---|---|---|---|---|---|---|")
        for n, s in enumerate(u["steps"], 1):
            arrow = s["frm"] if s["frm"] == s["to"] else f"{s['frm']} → {s['to']}"
            w(f"| {n} | {s['t']} | {arrow} | `{s['event']}` | {s['actor']} | {s['action']} | {s['data'] or '-'} |")
        w("")
        w("**Titik keputusan & eskalasi**")
        w("")
        prios = u["priority"]
        if prios == "P1":
            w("- Bila verifikasi visual > 60 detik belum selesai → dispatch tetap jalan (asumsikan nyata).")
            w("- Eskalasi GM & Owner otomatis detik ke-1; Shift Lead memastikan ACK.")
            w("- Bila tidak terkendali dalam 3 menit → panggil pihak eksternal (Damkar 113 / Polisi 110 / Ambulans 118/119).")
        elif prios == "P2":
            w("- Bila belum pulih 15 menit → eskalasi GM (L1). 30 menit → Direksi (L2).")
            w("- Bila ada korban/risiko jiwa → naikkan ke P1 dan ikuti SOP-SEC terkait.")
        elif prios == "P3":
            w("- Bila belum selesai 60 menit → eskalasi Shift Lead; 2 jam → GM.")
            w("- Bila viral di media sosial → langsung eskalasi GM & PR (SOP-VIS-04).")
        elif prios == "P4":
            w("- Bila belum selesai 30 menit → Supervisor; akumulasi breach masuk evaluasi vendor bulanan.")
        else:
            w("- Proses bisnis terjadwal: keputusan diambil di rapat mingguan/bulanan sesuai SOP.")
        w("")
        w("**Verifikasi penutupan:** " + "; ".join(SOPI[x.strip()]["closure"] for x in u["sops"].split(",")[:1]) + ".")
        w("")
    w("## 7. Kamus event integrasi")
    w("")
    w("| Event | Nama | Producer | Consumers | Payload | Protokol |")
    w("|---|---|---|---|---|---|")
    for e in EVENTS:
        w(f"| `{e[0]}` | {e[1]} | {e[2]} | {e[3]} | {e[4]} | {e[5]} |")
    w("")
    w("## 8. Lampiran: role & kontak")
    w("")
    w("| Kode | Role | Kanal radio |")
    w("|---|---|---|")
    radio = {"CSEC": "CH-01", "QRT": "CH-01", "ERT": "CH-01", "CENG": "CH-02", "MEP": "CH-02", "BMSO": "CH-02",
             "HK": "CH-03", "PKR": "CH-04"}
    for k, v in ROLES.items():
        w(f"| {k} | {v} | {radio.get(k, '-')} |")
    w("")
    w("---")
    w("*Ubah konten runbook melalui `tools/sop_data.py` / `tools/usecase_data.py`, lalu jalankan `python3 tools/build_docs.py`.*")
    path = os.path.join(DOCS, "RUNBOOK_Relasi_Dashboard_Summarecon_Mall.md")
    open(path, "w", encoding="utf-8").write("\n".join(L) + "\n")
    return path


def validate():
    errs = []
    for s in SOPS:
        if s["dashboard"] not in DB:
            errs.append(f"{s['id']} dashboard {s['dashboard']}")
        if s["pic"] not in ROLES:
            errs.append(f"{s['id']} pic {s['pic']}")
        for st in s["steps"]:
            if st["role"] not in ROLES:
                errs.append(f"{s['id']} role {st['role']}")
            if st["dashboard"] not in DB:
                errs.append(f"{s['id']} step dash {st['dashboard']}")
    for u in USECASES:
        for x in u["sops"].split(","):
            if x.strip() not in SOPI:
                errs.append(f"{u['id']} sop {x}")
        for a in u["actors"].split(","):
            if a.strip() not in ROLES:
                errs.append(f"{u['id']} actor {a}")
        for s in u["steps"]:
            for c in (s["frm"], s["to"]):
                if c not in DB:
                    errs.append(f"{u['id']} dash {c}")
            if s["actor"] not in ROLES:
                errs.append(f"{u['id']} step actor {s['actor']}")
            if s["event"] not in {e[0] for e in EVENTS}:
                errs.append(f"{u['id']} event {s['event']}")
    for a, b, _ in RELATIONS:
        if a not in DB or b not in DB:
            errs.append(f"relation {a}->{b}")
    gaps = [m[3] for m in MINDMAP if not sops_for_leaf(m[3], m[2])]
    return errs, gaps


if __name__ == "__main__":
    os.makedirs(DOCS, exist_ok=True)
    os.makedirs(APPJS, exist_ok=True)
    errs, gaps = validate()
    if errs:
        print("VALIDATION ERRORS:\n  " + "\n  ".join(errs))
        sys.exit(1)
    print(f"Mindmap leaves: {len(MINDMAP)}, gaps: {len(gaps)} {gaps}")
    write_js()
    p1, n = build_sop_xlsx()
    p2 = build_uc_xlsx()
    p3 = build_runbook()
    print(f"SOP: {len(SOPS)} SOP / {n} langkah -> {p1}")
    print(f"UC : {len(USECASES)} use case -> {p2}")
    print(f"Runbook -> {p3}")
