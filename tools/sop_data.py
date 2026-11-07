# -*- coding: utf-8 -*-
"""
Single source of truth: SOP drill-down Summarecon Mall Integrated Command Center (SMICC).
Diturunkan dari:
  - Super_Mall_Command_Center_Blueprint.xlsx  (sheet 2 automated action, sheet 4 matriks SLA P1-P4)
  - Mindmap_Super_Mall_Ticketing_system.drawio (6 pilar, Level-3 data point)
Dipakai oleh build_docs.py untuk menghasilkan Excel SOP, Excel Use Case, Runbook, dan app/js/sop-data.js
"""

MALL_NAME = "Summarecon Mall"
MALL_SUB = "Integrated Command Center"
SYSTEM_NAME = "Summarecon Mall Integrated Command Center Ticketing System (SMICC-TS)"

# ---------------------------------------------------------------- dashboards
DASHBOARDS = [
    # code, nama, route, pilar mindmap, tujuan, pengguna utama, sumber data utama, widget kunci
    ("TIC", "Tiket & Insiden", "ticketing", "Lintas Pilar (Hub)",
     "Pusat semua tiket insiden: triage P1-P4, dispatch tim, hitung mundur SLA, eskalasi, dan penutupan.",
     "Operator Command Center, Shift Lead, Supervisor Lapangan",
     "Semua dashboard (event producer), Radio/HT GPS, Patroli App",
     "Antrean tiket, inspector tiket + checklist SOP, kesiapan tim, watchlist SLA tenant, distribusi domain"),
    ("BMS", "Fasilitas & BMS", "bms", "3. Smart BMS & Engineering",
     "Pemantauan dan kontrol MEP: chiller, AHU, lift/eskalator, trafo, genset, plumbing.",
     "Chief Engineering, Teknisi MEP, Operator BMS",
     "BMS SCADA (BACnet/Modbus), PLC Lift/Eskalator, FACP interlock, Smart Power Meter",
     "Status chiller plant, AHU zona, transport vertikal, gardu trafo, genset, log diagnostik"),
    ("TEN", "Layanan Tenant & SLA", "tenant", "1. Commercial & Tenant Mix",
     "Helpdesk tenant lewat semua kanal: komplain, izin kerja/fit-out, overtime, kepatuhan regulasi gedung.",
     "Tenant Relation Officer, Customer Service, Leasing",
     "Tenant App, WhatsApp Business API, PMS (SAP/Yardi), Sub-meter IoT tenant",
     "Daftar permintaan tenant, inspector profil tenant, kepatuhan regulasi, log percakapan semua kanal"),
    ("CCTV", "CCTV & Keamanan", "cctv", "5. Security, Safety & HSE",
     "Video wall dengan AI analytics, verifikasi visual insiden, kontrol PTZ, regu patroli, dan bukti video.",
     "Chief Security, Operator CCTV, Security Quick Response",
     "VMS IP CCTV + AI Video Analytics (ONVIF/RTSP), ANPR, Guard Tour NFC, FACP",
     "Grid kamera, alert keamanan, kontroler PTZ, regu patroli, timeline playback & ekspor bukti"),
    ("ENE", "Energi & Utilitas", "energy", "3. Smart BMS & Engineering / 6. Finance",
     "Audit konsumsi listrik/air, tarif WBP/LWBP, peak shaving, PLTS & ESG, sub-metering tenant.",
     "Energy Manager, Chief Engineering, Finance",
     "Smart Digital Power Meter (Modbus/LoRaWAN), Flow meter air, BESS, PLTS inverter",
     "Profil beban 24 jam, telemetri COP chiller, neraca air & STP, sub-meter tenant, anomali AI"),
    ("ANL", "Analitik & Laporan", "analytics", "Lintas Pilar (Executive)",
     "Konsolidasi KPI lintas departemen, tren SLA, pareto root-cause, generator laporan BOD.",
     "General Manager, Direksi/Owner, Head of Departments",
     "Data warehouse seluruh dashboard, ERP Finance",
     "Scorecard KPI, tren SLA per departemen, rincian biaya per zona, pareto insiden, rekomendasi AI"),
    ("PARK", "Parkir & Mobilitas", "parking", "4. Parking & Mobility",
     "Okupansi parkir per zona, antrean gate ANPR, drop-off lobi/valet, EV charger, rekonsiliasi QRIS.",
     "Koordinator Parkir, Security Lobi, Finance Parkir",
     "Ultrasonic Bay Sensor, LPR/ANPR Camera, Parking Management System, EVSE (OCPP)",
     "Okupansi per zona, status gate & antrean, drop-off lobi, EV charger, pendapatan parkir"),
    ("O360", "Komersial & Keuangan", "owner360", "1. Commercial / 2. Visitor / 6. Finance",
     "Ringkasan bisnis untuk pemilik mall: okupansi NLA, produktivitas tenant/OCR, footfall & CSAT, AR aging, P&L/NOI.",
     "Owner/Direksi, GM, Leasing, Finance, Marketing",
     "ERP Property (SAP/Yardi), POS Aggregator, 3D People Counter & Wi-Fi, CRM App, VA Bank",
     "Scorecard KPI eksekutif, zonasi lantai & OCR, footfall & heatmap, AR aging, tren NOI"),
    ("EVT", "Pemantauan Event", "event", "2. Visitor & Experience",
     "Tiket acara di Summarecon Mall Bandung lewat 3 path: /pengunjung (beli tiket: denah kursi, hold & anti double-booking, bayar sandbox, e-ticket QR), /pengelola (EO: tambah/hapus/batalkan acara, tiket, harga, kuota, denah, peserta, refund, check-in, waitlist), dan Pemantauan Event di Command Center (manajemen mall, hanya baca: portofolio acara, dampak operasional, keamanan gate → tiket insiden).",
     "Event Officer/Panitia (Konsol Pengelola), Petugas Gate, Manajemen Mall & Ops Command Center (Pemantauan Event), Marketing, Finance, Security",
     "Event Ticketing Engine (server LAN, transaksi berversi), Payment Gateway Sandbox, Scanner QR gate (kamera ponsel), Notifikasi Email/WhatsApp (simulasi)",
     "Pengelola: daftar acara (tambah/publikasi/batal/hapus), kelola acara/tiket/kuota, denah kursi, peserta & transaksi + CSV, check-in QR, notifikasi & waitlist. Command Center: portofolio event, detail acara, denah langsung, gate & keamanan, transaksi (hanya baca)"),
]

# ---------------------------------------------------------------- roles
ROLES = {
    "CCO": "Operator Command Center (Dispatcher)",
    "SL": "Shift Lead Ops Command Center",
    "CSEC": "Chief Security",
    "QRT": "Security Quick Response Team",
    "ERT": "Emergency Response Team (ERT)",
    "CENG": "Chief Engineering",
    "MEP": "Teknisi MEP Siaga",
    "BMSO": "Operator BMS",
    "HK": "Supervisor Housekeeping",
    "PKR": "Koordinator Parkir",
    "TRO": "Tenant Relation Officer",
    "CS": "Customer Service / Information Desk",
    "LSG": "Leasing Manager",
    "FIN": "Finance AR & Billing",
    "MKT": "Marketing & CRM",
    "HSE": "HSE Officer",
    "ENM": "Energy Manager",
    "IT": "IT/OT Engineer",
    "PR": "Corporate Communication / PR",
    "GM": "General Manager Mall",
    "BOD": "Direksi / Owner",
    "EO": "Event Officer / Panitia Acara",
    "GTE": "Petugas Gate Check-in (Usher)",
    "EXT": "Pihak Eksternal (Damkar/Polisi/PLN/Ambulans)",
}

# ---------------------------------------------------------------- SLA (blueprint sheet 4, di-drill)
SLA = [
    # level, label, kategori, contoh, trigger, respons(menit), resolusi(menit), resolusi teks, PIC, eskalasi owner
    ("P1", "CRITICAL", "Keselamatan jiwa & kebakaran",
     "Titik api di dapur F&B, gempa bumi, ancaman teror/keamanan",
     "FACP Fire Alarm, Thermal CCTV, Panic Button", 2, 15, "< 15 menit (evakuasi)",
     "Chief Security, ERT (Emergency Team) & Damkar",
     "Langsung, detik ke-1 via WhatsApp/call prioritas"),
    ("P2", "HIGH", "Kegagalan utilitas utama",
     "Pemadaman PLN (genset gagal sinkron), chiller utama trip, pipa utama pecah",
     "BMS SCADA Critical Alert & Smart Power Meter", 5, 30, "< 30 menit",
     "Chief Engineering & Teknisi MEP Siaga", "Jika belum pulih dalam 15 menit"),
    ("P3", "MEDIUM", "Gangguan operasional area",
     "Eskalator berhenti, antrean gate parkir macet >10 mobil, lift macet",
     "PLC Fault Code, ANPR Camera Queue Alert", 10, 120, "< 2 jam",
     "Supervisor Teknisi / Koordinator Parkir", "Laporan rekap harian (kecuali viral di medsos)"),
    ("P4", "LOW", "Kenyamanan & kebersihan",
     "Toilet bau/tisu habis, tumpahan minuman di koridor, suhu zona agak panas",
     "Smart Toilet Sensor (NH3), QR Code Visitor, Patroli App", 15, 45, "< 45 menit",
     "Tim Housekeeping & Teknisi Zona", "Rekap bulanan evaluasi vendor"),
]

# Eskalasi berjenjang (drill dari kolom 'Eskalasi ke Owner / Direksi')
ESCALATION = [
    # level prioritas, tahap, T+menit, ke siapa, kanal, kondisi pemicu, isi pesan minimum
    ("P1", "L0 Deteksi", 0, "CCO -> CSEC + ERT", "Radio HT CH-01 + Pop-up Command Center", "Alarm FACP/Thermal/Panic Button terverifikasi", "Kode insiden, lokasi zona, jenis bahaya"),
    ("P1", "L1 Manajemen", 1, "SL -> GM", "Call prioritas + WhatsApp Grup Crisis", "Otomatis untuk semua P1", "Kode, lokasi, status evakuasi, ETA Damkar"),
    ("P1", "L2 Direksi", 2, "GM -> BOD / Owner", "Call prioritas + WhatsApp", "Otomatis untuk semua P1 (detik ke-1 notifikasi sistem)", "Ringkasan situasi, korban (jika ada), keputusan yang dibutuhkan"),
    ("P1", "L3 Eksternal", 3, "CSEC -> Damkar / Polisi / Ambulans", "Telepon 112 / 113 / 110", "Api/ancaman tidak terkendali APAR atau ada korban", "Alamat mall, titik akses, jumlah orang terdampak"),
    ("P1", "L4 Komunikasi publik", 30, "GM -> PR", "Holding statement medsos & media", "Insiden terlihat publik / viral", "Holding statement terverifikasi legal"),
    ("P2", "L0 Deteksi", 0, "CCO -> CENG + MEP Siaga", "Radio HT CH-02 + Tiket otomatis", "BMS SCADA critical alert", "Kode alarm, aset, zona terdampak"),
    ("P2", "L1 Manajemen", 15, "CENG -> GM", "Call + WhatsApp", "Belum pulih dalam 15 menit", "Root cause awal, ETA pemulihan, dampak tenant"),
    ("P2", "L2 Direksi", 30, "GM -> BOD", "WhatsApp + email ringkas", "Belum pulih dalam 30 menit / dampak > 25% tenant", "Dampak bisnis & estimasi biaya"),
    ("P2", "L3 Eksternal", 15, "CENG -> PLN / Vendor OEM", "Hotline vendor/PLN", "Gangguan di sisi suplai/garansi OEM", "Nomor ID pelanggan/aset, kode fault"),
    ("P3", "L0 Deteksi", 0, "CCO -> Supervisor Teknisi / PKR", "Radio HT + Tiket", "PLC fault code / ANPR queue alert", "Lokasi, aset, dampak antrean"),
    ("P3", "L1 Shift Lead", 60, "Supervisor -> SL", "Tiket eskalasi", "Belum selesai 60 menit", "Kendala & kebutuhan sumber daya"),
    ("P3", "L2 Manajemen", 120, "SL -> GM", "Rekap harian", "SLA 2 jam terlampaui atau viral di medsos (langsung)", "Ringkasan & rencana perbaikan"),
    ("P4", "L0 Deteksi", 0, "CCO -> HK / Teknisi Zona", "Patroli App push", "Sensor NH3 / QR feedback / patroli", "Lokasi & jenis keluhan"),
    ("P4", "L1 Supervisor", 30, "HK -> SL", "Patroli App", "Belum selesai 30 menit", "Alasan keterlambatan"),
    ("P4", "L2 Review vendor", 43200, "SL -> GM (rekap bulanan)", "Laporan evaluasi vendor", "Akumulasi breach bulanan", "Skor kinerja vendor outsourcing"),
]

# ---------------------------------------------------------------- SOP master + langkah
# Setiap langkah: (fase, role, aksi, dashboard, target waktu, output/bukti)
F_DET, F_VER, F_TIK, F_DIS, F_MIT, F_ESK, F_PUL, F_TUT = (
    "1-Deteksi", "2-Verifikasi", "3-Tiket & Klasifikasi", "4-Dispatch",
    "5-Mitigasi", "6-Eskalasi", "7-Pemulihan", "8-Penutupan & Pelaporan")

SOPS = []


def sop(id, title, pillar, subdomain, nodes, prio, trigger, source, protocol, dash, related,
        pic, kpi, evidence, closure, auto_action, steps):
    SOPS.append(dict(id=id, title=title, pillar=pillar, subdomain=subdomain, nodes=nodes,
                     priority=prio, trigger=trigger, source=source, protocol=protocol,
                     dashboard=dash, related=related, pic=pic, kpi=kpi, evidence=evidence,
                     closure=closure, auto_action=auto_action,
                     steps=[dict(phase=s[0], role=s[1], action=s[2], dashboard=s[3],
                                 target=s[4], output=s[5]) for s in steps]))


P0 = "0. Command Center (Lintas Pilar)"
P1 = "1. Commercial & Tenant Mix"
P2 = "2. Visitor & Experience"
P3 = "3. Smart BMS & Engineering"
P4 = "4. Parking & Mobility"
P5 = "5. Security, Safety & HSE"
P6 = "6. Finance & Asset Value"

# ============ 0. COMMAND CENTER UMUM =========================================
sop("SOP-CC-01", "Triage, klasifikasi severity & pembuatan tiket", P0, "Core Ticketing",
    "Semua node Level-3 (sumber event)", "P1-P4",
    "Setiap alarm sensor, laporan tenant/pengunjung, temuan patroli, atau panggilan radio",
    "Seluruh sensor IoT, Tenant App, QR, Radio HT", "REST/MQTT/Webhook", "TIC", "Semua",
    "CCO", "% tiket terklasifikasi benar (target >= 98%), waktu pembuatan tiket < 60 detik",
    "Tiket ID #TCK, snapshot sumber (alarm/foto/chat)", "Tiket memiliki kategori, prioritas, zona, PIC & SOP terkait",
    "Alarm dari sistem yang tersambung langsung membuat tiket; operator hanya memvalidasi",
    [(F_DET, "CCO", "Terima event dari sumber (pop-up alarm, chat tenant, QR, radio). Catat jam deteksi (T0).", "TIC", "T+0", "Event masuk antrian"),
     (F_VER, "CCO", "Cek duplikasi: cari tiket aktif di zona & kategori yang sama dalam 30 menit terakhir; gabungkan bila duplikat.", "TIC", "T+0:30", "Tiket baru / merge"),
     (F_VER, "CCO", "Verifikasi visual via kamera terdekat (auto-suggest CCTV per zona) atau konfirmasi radio patroli.", "CCTV", "T+1", "Screenshot verifikasi"),
     (F_TIK, "CCO", "Tetapkan prioritas memakai matriks: P1 jiwa/kebakaran, P2 utilitas utama, P3 gangguan area, P4 kenyamanan.", "TIC", "T+1", "Prioritas & SLA timer aktif"),
     (F_TIK, "CCO", "Lengkapi field wajib: kategori domain, zona/lantai, tenant (jika ada), sumber, SOP terkait (auto-map).", "TIC", "T+1:30", "Tiket lengkap"),
     (F_DIS, "CCO", "Jalankan SOP spesifik sesuai kategori (lihat kolom SOP terkait) & dispatch tim (SOP-CC-02).", "TIC", "T+2", "Status DISPATCHED"),
     (F_TUT, "SL", "Audit sampling 10% tiket per shift untuk ketepatan klasifikasi; koreksi & coaching operator.", "ANL", "Akhir shift", "Log audit klasifikasi")])

sop("SOP-CC-02", "Dispatch & penugasan tim lapangan", P0, "Core Ticketing",
    "Guard Tour NFC, HT GPS Tracker", "P1-P4",
    "Tiket berstatus OPEN/ACKNOWLEDGED", "Radio HT GPS, Patroli App", "BLE/App/Radio", "TIC", "CCTV, BMS, PARK",
    "CCO", "Waktu dispatch <= target respons SLA; ETA tim akurat +/- 1 menit",
    "Nama tim, ETA, konfirmasi radio", "Tim konfirmasi ON-SITE di aplikasi/radio",
    "Rekomendasi tim terdekat berdasarkan GPS HT & skill",
    [(F_DIS, "CCO", "Lihat panel kesiapan tim reaksi cepat; pilih tim terdekat dengan skill sesuai (MEP/Security/HK/Parkir).", "TIC", "T+0", "Tim terpilih"),
     (F_DIS, "CCO", "Kirim penugasan via Patroli App + radio channel sesuai domain (CH-01 Security, CH-02 MEP, CH-03 HK, CH-04 Parkir).", "TIC", "T+0:30", "Penugasan terkirim"),
     (F_DIS, "QRT", "Tim membalas 'COPY' dan berangkat; status otomatis ON-THE-WAY dengan ETA dari GPS.", "TIC", "T+1", "Status ON-THE-WAY"),
     (F_MIT, "CCO", "Pantau pergerakan tim via kamera rute; arahkan jalur tercepat (lift servis/tangga darurat).", "CCTV", "Kontinu", "Log pergerakan"),
     (F_MIT, "QRT", "Tiba di lokasi, tap NFC checkpoint terdekat, unggah foto kondisi awal.", "TIC", "<= SLA respons", "Status ON-SITE + foto"),
     (F_ESK, "CCO", "Jika tim tidak merespons 60 detik, re-dispatch ke tim cadangan & catat ke log kinerja vendor.", "TIC", "T+1", "Re-dispatch log")])

sop("SOP-CC-03", "Matriks eskalasi berjenjang & komunikasi krisis", P0, "Core Ticketing",
    "Tiket Komplain SLA < 15 Menit", "P1-P4",
    "SLA respons/resolusi terlampaui atau kriteria eskalasi otomatis (P1)", "Mesin SLA SMICC-TS", "Internal", "TIC", "ANL, O360",
    "SL", "100% P1 tereskalasi ke GM < 1 menit; 0 eskalasi terlewat",
    "Log eskalasi bertimestamp, bukti panggilan", "Penerima eskalasi mengakui (ACK) di sistem",
    "Notifikasi WhatsApp/Call prioritas otomatis untuk P1",
    [(F_ESK, "CCO", "Sistem menandai tiket 'SLA AT RISK' pada 80% waktu SLA; operator verifikasi kendala dengan tim lapangan.", "TIC", "80% SLA", "Flag AT RISK"),
     (F_ESK, "SL", "Untuk P1: konfirmasi panggilan prioritas ke GM tersambung; bila tidak, telepon Deputy GM.", "TIC", "T+1", "ACK GM"),
     (F_ESK, "SL", "Untuk P2: eskalasi ke GM jika belum pulih 15 menit; sertakan root cause awal & ETA.", "TIC", "T+15", "Pesan eskalasi"),
     (F_ESK, "GM", "Putuskan aktivasi Crisis Team & kebutuhan eskalasi ke Direksi/Owner serta pihak eksternal.", "ANL", "T+5 (P1)", "Keputusan krisis"),
     (F_ESK, "PR", "Siapkan holding statement jika insiden terlihat publik/viral (P1 atau P3 viral).", "ANL", "T+30", "Draft statement"),
     (F_TUT, "SL", "Rekap eskalasi harian & bulanan dikirim otomatis ke GM; review di rapat operasional mingguan.", "ANL", "Harian", "Laporan eskalasi")])

sop("SOP-CC-04", "Penutupan tiket, verifikasi bukti & root cause analysis", P0, "Core Ticketing",
    "Tiket Komplain SLA < 15 Menit", "P1-P4",
    "Tim lapangan menandai RESOLVED", "Patroli App, CCTV, BMS", "Internal", "TIC", "ANL, TEN",
    "SL", "First Contact Resolution >= 90%; reopen rate < 3%",
    "Foto sebelum/sesudah, rekaman CCTV, data sensor normal", "Bukti lengkap + konfirmasi pelapor + sensor normal",
    "Auto-close P4 jika sensor kembali normal 15 menit & tanpa keberatan pelapor",
    [(F_PUL, "MEP", "Tim lapangan unggah foto sesudah perbaikan & catatan tindakan (parts, durasi).", "TIC", "Saat selesai", "Foto sesudah"),
     (F_TUT, "CCO", "Verifikasi: sensor/BMS kembali normal, kamera menunjukkan area aman, pelapor (tenant/pengunjung) konfirmasi.", "BMS", "+5 menit", "Checklist verifikasi"),
     (F_TUT, "CCO", "Ubah status ke CLOSED; sistem kirim survei CSAT ke pelapor (tenant via app, pengunjung via QR).", "TEN", "+5 menit", "Survei CSAT"),
     (F_TUT, "SL", "P1/P2 atau tiket berulang (>= 3x/30 hari): wajib RCA 5-Why dalam 48 jam.", "ANL", "<= 48 jam", "Dokumen RCA"),
     (F_TUT, "CENG", "Tindak lanjut preventif (work order PM, perubahan setpoint, penggantian aset) dicatat & ditautkan.", "BMS", "<= 7 hari", "Work order PM")])

sop("SOP-CC-05", "Serah terima shift (shift handover) Command Center", P0, "Core Ticketing",
    "Zone Telemetry, IoT Grid Nodes", "-",
    "Pergantian shift A (07-15), B (15-23), C (23-07)", "SMICC-TS", "Internal", "TIC", "Semua",
    "SL", "Handover selesai < 15 menit; 0 tiket tanpa PIC setelah handover",
    "Form handover bertanda tangan digital", "Shift Lead masuk menandatangani form handover",
    "Ringkasan handover otomatis (tiket aktif, alarm, eskalasi)",
    [(F_VER, "SL", "Generate ringkasan otomatis: tiket aktif per prioritas, SLA at risk, alarm BMS aktif, kamera offline.", "TIC", "H-15 menit", "Ringkasan handover"),
     (F_VER, "SL", "Cek kesehatan sistem: latensi mesh, node IoT live, NVR, SCADA, radio. Catat yang degradasi.", "BMS", "H-10 menit", "Status sistem"),
     (F_VER, "SL", "Briefing tatap muka dengan shift masuk: insiden P1/P2, pekerjaan izin kerja tenant malam, event atrium.", "TEN", "H-5 menit", "Notulen briefing"),
     (F_TUT, "SL", "Re-assign PIC tiket aktif ke personel shift baru; tanda tangan digital kedua Shift Lead.", "TIC", "H+0", "Form handover")])

sop("SOP-CC-06", "Mode degradasi: sensor / sistem offline", P0, "Core Ticketing",
    "IoT Grid Nodes, Core Mesh Latency", "P2",
    "Node IoT offline > 5%, NVR/SCADA tidak sinkron > 2 menit, latensi mesh > 200 ms", "Network Monitoring, SCADA heartbeat", "SNMP/ICMP", "TIC", "BMS, CCTV, ENE",
    "IT", "Pemulihan sistem kritikal < 30 menit; 0 insiden tak terdeteksi selama degradasi",
    "Log heartbeat, daftar node offline", "Semua node kritikal online & sinkron",
    "Banner 'DEGRADED MODE' + aktifkan patroli manual area terdampak",
    [(F_DET, "IT", "Sistem memunculkan banner DEGRADED MODE dan daftar node/kamera offline per zona.", "TIC", "T+0", "Banner degradasi"),
     (F_MIT, "SL", "Aktifkan patroli manual & radio check 15 menit sekali di zona tanpa sensor.", "CCTV", "T+5", "Jadwal patroli manual"),
     (F_MIT, "IT", "Diagnosa: switch, PoE, gateway LoRaWAN, server VMS/SCADA; failover ke server cadangan.", "BMS", "T+10", "Hasil diagnosa"),
     (F_ESK, "IT", "Eskalasi ke vendor sistem jika belum pulih 30 menit (P2).", "TIC", "T+30", "Tiket vendor"),
     (F_TUT, "IT", "Validasi data backfill & catat periode blind-spot di laporan harian.", "ANL", "Setelah pulih", "Laporan blind-spot")])

# ============ 1. COMMERCIAL & TENANT =========================================
sop("SOP-COM-01", "Notifikasi kontrak jatuh tempo & renewal tenant", P1, "Leasing & Occupancy",
    "Kontrak Expired, Leased vs Vacant, Anchor vs Regular", "-",
    "Kontrak tenant akan habis < 12, < 6, < 3 bulan", "ERP Property Management (SAP/Yardi)", "REST API / DB Sync", "O360", "TEN, ANL",
    "LSG", "Renewal rate >= 90%; 0 unit vacant tanpa pipeline pengganti",
    "Surat penawaran renewal, notulen negosiasi", "Kontrak diperpanjang atau tenant pengganti ditandatangani",
    "Trigger tim Leasing 6 bulan sebelum kontrak habis",
    [(F_DET, "LSG", "Sistem menampilkan daftar kontrak jatuh tempo bucket <12/<6/<3 bulan di Komersial & Keuangan.", "O360", "Harian", "Daftar kontrak"),
     (F_VER, "LSG", "Tarik data kinerja tenant: omzet POS, OCR, kepatuhan bayar (AR aging), tiket komplain 12 bulan.", "O360", "H-180", "Profil kinerja"),
     (F_VER, "TRO", "Tambahkan riwayat SLA & kepatuhan regulasi gedung dari Tenant Support.", "TEN", "H-180", "Skor kepatuhan"),
     (F_MIT, "LSG", "Tentukan strategi: renewal + kenaikan tarif (zona performa tinggi), diskon (OCR > 15%), atau ganti tenant.", "O360", "H-170", "Rekomendasi"),
     (F_ESK, "GM", "Persetujuan GM untuk anchor tenant & perubahan tarif > 8%.", "ANL", "H-150", "Persetujuan"),
     (F_TUT, "LSG", "Perbarui status unit di PMS (Leased/Vacant/Fit-out) & pipeline leasing.", "O360", "Saat tanda tangan", "Status unit")])

sop("SOP-COM-02", "Pemantauan fit-out & izin kerja tenant", P1, "Leasing & Occupancy",
    "Jadwal Fit-Out", "P3",
    "Pengajuan izin kerja / fit-out / hot work oleh tenant", "Tenant App, PMS", "REST API", "TEN", "CCTV, BMS, TIC",
    "TRO", "100% pekerjaan berisiko memiliki permit; 0 insiden K3 fit-out",
    "Form izin kerja, permit hot work, daftar pekerja", "Pekerjaan selesai, area bersih, inspeksi HSE lulus",
    "E-pass pekerja otomatis & isolasi detektor asap zona hot work (terjadwal)",
    [(F_DET, "TRO", "Terima pengajuan izin kerja via Tenant App (jenis pekerjaan, jam, pekerja, metode kerja).", "TEN", "H-2", "Pengajuan"),
     (F_VER, "HSE", "Review risiko: hot work, ketinggian, listrik; minta JSA & APAR standby bila perlu.", "TEN", "H-1", "Approval HSE"),
     (F_TIK, "TRO", "Terbitkan e-pass pekerja & jadwal; untuk hot work buat tiket koordinasi ke BMS (isolasi detektor terjadwal).", "TIC", "H-1", "E-pass + tiket"),
     (F_DIS, "CSEC", "Security memeriksa e-pass di loading dock; CCTV zona ditandai 'pekerjaan berizin'.", "CCTV", "Hari-H", "Log akses"),
     (F_MIT, "BMSO", "Isolasi detektor asap zona hot work sesuai jadwal; aktifkan kembali segera setelah selesai.", "BMS", "Hari-H", "Log isolasi"),
     (F_TUT, "HSE", "Inspeksi penutupan: area bersih, detektor aktif, tidak ada sisa panas (fire watch 30 menit).", "TEN", "+30 menit", "Checklist penutupan")])

sop("SOP-COM-03", "Evaluasi produktivitas POS & occupancy cost ratio", P1, "POS Revenue Share",
    "Omzet per Tenant, Revenue Share, Occupancy Cost Ratio (OCR %)", "-",
    "OCR tenant > 15% atau omzet turun > 20% MoM", "POS Tenant Aggregator / API Kasir", "Webhook / SFTP Batch", "O360", "ANL, TEN",
    "LSG", "OCR konsolidasi 8-12%; tenant at-risk teridentifikasi 3 bulan lebih awal",
    "Laporan POS bulanan, analisis OCR", "Rencana aksi tenant disepakati",
    "Evaluasi diskon sewa atau kenaikan tarif saat perpanjangan",
    [(F_DET, "LSG", "Dashboard menandai tenant dengan OCR > 15% atau penurunan omzet > 20% MoM.", "O360", "Bulanan", "Daftar tenant at-risk"),
     (F_VER, "MKT", "Korelasikan dengan footfall zona, dead-zone & event: apakah penurunan karena traffic?", "O360", "+3 hari", "Analisis traffic"),
     (F_MIT, "LSG", "Susun opsi: program co-marketing, relokasi, restrukturisasi sewa, turnover rent.", "O360", "+7 hari", "Opsi aksi"),
     (F_TUT, "GM", "Review bulanan di rapat komersial; keputusan dicatat di pipeline leasing.", "ANL", "Bulanan", "Keputusan")])

sop("SOP-COM-04", "Monetisasi non-sewa: atrium, kiosk, LED & naming rights", P1, "Monetisasi Non-Sewa",
    "Sewa Atrium/Kiosk, LED Indoor/Fasad, Naming Rights", "-",
    "Permintaan booking atrium/LED atau slot kosong > 14 hari", "CRM, Booking System", "REST API", "O360", "CCTV, BMS, TEN",
    "MKT", "Utilisasi atrium >= 75%; pendapatan non-sewa sesuai target bulanan",
    "Kontrak booking, layout, izin keamanan", "Event selesai, area kembali normal, invoice terbit",
    "Rekomendasi penempatan event di dead-zone",
    [(F_DET, "MKT", "Cek kalender atrium/LED & rekomendasi lokasi dari heatmap dead-zone.", "O360", "H-30", "Slot tersedia"),
     (F_VER, "HSE", "Review layout, beban lantai, jalur evakuasi, kapasitas kerumunan.", "TEN", "H-14", "Approval layout"),
     (F_DIS, "CSEC", "Rencana pengamanan event: personel, kamera crowd density, threshold kerumunan.", "CCTV", "H-3", "Rencana pengamanan"),
     (F_MIT, "BMSO", "Jadwalkan pre-cooling AHU atrium & daya listrik tambahan event.", "BMS", "H-1", "Jadwal BMS"),
     (F_TUT, "FIN", "Terbitkan invoice & hitung ROI event (footfall, basket size) untuk laporan.", "O360", "H+3", "Invoice & ROI")])

sop("SOP-COM-05", "Penanganan permintaan & komplain tenant (tenant helpdesk)", P1, "Tenant Support",
    "Anchor vs Regular, Komplain AC/Bau", "P2-P4",
    "Tenant mengirim komplain via Tenant App / WhatsApp / telepon", "Tenant App, WhatsApp Business API", "Webhook", "TEN", "TIC, BMS, ENE",
    "TRO", "First response <= 8.4 menit; CSAT tenant >= 4.6/5; SLA tenant >= 95%",
    "Log percakapan terpadu, tiket, data sub-meter", "Tenant konfirmasi selesai + CSAT terisi",
    "Template respons cepat & tiket otomatis dari chat",
    [(F_DET, "TRO", "Pesan tenant masuk ke log percakapan tenant; bot mengklasifikasikan kategori (HVAC, listrik, kebersihan, izin).", "TEN", "T+0", "Kategori awal"),
     (F_VER, "TRO", "Cek data pendukung: sub-meter IoT unit (suhu, beban kW, tekanan air) di inspector profil tenant.", "TEN", "T+2", "Data sensor"),
     (F_TIK, "TRO", "Konversi chat menjadi tiket (prioritas: anchor tenant +1 level) & tautkan ke tenant & unit.", "TIC", "T+3", "Tiket #TCK"),
     (F_DIS, "CCO", "Dispatch teknisi zona; kirim template respons 'Konfirmasi Jadwal MEP' ke tenant.", "TIC", "T+5", "Respons ke tenant"),
     (F_MIT, "MEP", "Tindakan teknis (kalibrasi VAV, cek panel, dll). Update progres ke chat tenant otomatis.", "BMS", "Sesuai SLA", "Progress update"),
     (F_TUT, "TRO", "Konfirmasi ke store manager; tutup tiket; survei CSAT; catat ke skor kepuasan tenant.", "TEN", "Saat selesai", "CSAT")])

sop("SOP-COM-06", "Izin overtime AC & loading dock tenant", P1, "Tenant Support",
    "Jadwal Fit-Out, Smart Sub-Meter", "P3",
    "Permintaan overtime AC di luar jam operasional / slot bongkar muat", "Tenant App", "REST API", "TEN", "BMS, ENE, CCTV, FIN",
    "TRO", "Persetujuan <= 2 jam; 100% overtime tertagih",
    "Form overtime, log BMS, data sub-meter", "Overtime selesai & tagihan otomatis terbit",
    "Penjadwalan AHU otomatis & tagihan utilitas tenant otomatis",
    [(F_DET, "TRO", "Terima permintaan (jam mulai/selesai, zona AHU, alasan) dari Tenant App.", "TEN", "T+0", "Permintaan"),
     (F_VER, "CENG", "Cek kapasitas chiller & AHU zona di jam tersebut.", "BMS", "T+30", "Kelayakan teknis"),
     (F_TIK, "TRO", "Setujui & jadwalkan AHU di BMS; untuk loading dock tetapkan bay & jam.", "BMS", "T+60", "Jadwal AHU/bay"),
     (F_DIS, "CSEC", "Informasikan pos security loading dock & akses gerbang di jam tersebut.", "CCTV", "Hari-H", "Akses dibuka"),
     (F_TUT, "FIN", "Hitung konsumsi kWh overtime dari sub-meter & terbitkan tagihan otomatis.", "ENE", "H+1", "Invoice overtime")])

# ============ 2. VISITOR & EXPERIENCE ========================================
sop("SOP-VIS-01", "Respons kepadatan pengunjung & crowd flow", P2, "Footfall & Crowd Flow",
    "Traffic per Pintu, Pergerakan Lantai, Deteksi Kerumunan", "P2-P3",
    "Kepadatan zona > 80% kapasitas atau laju aliran > 150 orang/menit", "3D Stereoscopic Camera & Wi-Fi AP, AI CCTV", "MQTT / RTSP Analytics", "CCTV", "TIC, BMS, O360",
    "CSEC", "0 insiden desak-desakan; waktu respons kepadatan <= 5 menit",
    "Snapshot heatmap, rekaman CCTV", "Kepadatan < 70% selama 15 menit",
    "Penyesuaian HVAC mengikuti kepadatan; pengalihan arus pengunjung",
    [(F_DET, "CCO", "Alert kepadatan dari people counter/AI CCTV muncul di grid kamera (badge Kerapatan).", "CCTV", "T+0", "Alert kepadatan"),
     (F_VER, "CCO", "Verifikasi visual multi-kamera; cek apakah ada event atrium/promo.", "CCTV", "T+1", "Verifikasi"),
     (F_TIK, "CCO", "Buat tiket kategori Crowd (P3; naik P2 bila > 95% atau ada dorong-dorongan).", "TIC", "T+2", "Tiket"),
     (F_DIS, "CSEC", "Kirim regu patroli untuk crowd control; buka jalur alternatif & pintu tambahan.", "CCTV", "T+3", "Regu on-site"),
     (F_MIT, "BMSO", "Naikkan suplai udara AHU zona (CO2 > 900 ppm) & cek eskalator arah aliran.", "BMS", "T+5", "Setpoint AHU"),
     (F_TUT, "MKT", "Catat data puncak kepadatan untuk perencanaan event berikutnya.", "O360", "H+1", "Laporan crowd")])

sop("SOP-VIS-02", "Aktivasi dead-zone & evaluasi ROI event atrium", P2, "Heatmap & Zoning",
    "Deteksi Dead-Zone, Dwell Time (Menit), ROI Event Atrium", "-",
    "Zona dengan traffic < 40% rata-rata lantai selama 14 hari", "3D People Counter, Wi-Fi Analytics, CRM", "MQTT / REST", "O360", "ANL, TEN",
    "MKT", "Kenaikan traffic dead-zone >= 15% pasca aktivasi; ROI event >= 3x",
    "Heatmap sebelum/sesudah, data struk member", "Evaluasi ROI terdokumentasi",
    "Penyesuaian harga sewa zona & penempatan event di area dead-zone",
    [(F_DET, "MKT", "Heatmap menandai dead-zone; sistem menampilkan dwell time & tenant terdampak.", "O360", "Mingguan", "Daftar dead-zone"),
     (F_MIT, "MKT", "Rencanakan aktivasi (pop-up, event, signage, rute promo) bersama Leasing.", "O360", "+7 hari", "Rencana aktivasi"),
     (F_DIS, "TRO", "Informasikan tenant zona tentang program & ajak co-promo.", "TEN", "+10 hari", "Broadcast tenant"),
     (F_TUT, "MKT", "Ukur dampak: footfall, dwell time, basket size member, omzet tenant zona.", "ANL", "+30 hari", "Laporan ROI")])

sop("SOP-VIS-03", "Feedback pengunjung omnichannel (QR toilet, app, review)", P2, "Omnichannel Feedback",
    "QR Code Toilet, Komplain AC/Bau, Review Medsos", "P4",
    "Pengunjung scan QR / rating app <= 2 / komplain kanal digital", "QR Feedback Toilet, App, Social Listening", "Webhook / NLP API", "TIC", "CCTV, BMS, ANL",
    "CCO", "Tiket otomatis ke tim dengan SLA < 15 menit respons; CSAT >= 4.6",
    "Feedback asli, foto sesudah", "Area diperbaiki & feedback ditutup dengan balasan",
    "Tiket otomatis ke tim Housekeeping/Teknisi dengan SLA < 15 menit",
    [(F_DET, "CCO", "Feedback masuk & diklasifikasi NLP (kebersihan, AC, bau, fasilitas rusak).", "TIC", "T+0", "Tiket otomatis P4"),
     (F_DIS, "HK", "Housekeeping/Teknisi zona menerima push di Patroli App.", "TIC", "T+2", "Penugasan"),
     (F_MIT, "HK", "Tindakan di lokasi & unggah foto sesudah.", "TIC", "<= 15 menit", "Foto sesudah"),
     (F_TUT, "CS", "Balas pengunjung (app/medsos) bahwa keluhan telah ditangani.", "TIC", "Saat selesai", "Balasan"),
     (F_TUT, "SL", "Agregasi feedback per toilet/zona untuk evaluasi vendor bulanan.", "ANL", "Bulanan", "Skor vendor")])

sop("SOP-VIS-04", "Krisis sentimen medsos / isu viral", P2, "Sentimen & CSAT",
    "Review Medsos", "P2",
    "Lonjakan sentimen negatif > 3x baseline atau konten viral terkait mall", "Social Listening (NLP)", "API", "ANL", "TIC, CCTV, TEN",
    "PR", "Holding statement <= 60 menit; sentimen kembali baseline <= 72 jam",
    "Tangkapan layar, rekaman CCTV terkait", "Isu terklarifikasi & tindakan korektif selesai",
    "Alert sentimen & tautan ke tiket/rekaman terkait",
    [(F_DET, "PR", "Alert lonjakan sentimen; identifikasi waktu & lokasi kejadian dari konten.", "ANL", "T+0", "Alert sentimen"),
     (F_VER, "CCO", "Cari rekaman CCTV & tiket terkait di waktu/lokasi tersebut.", "CCTV", "T+15", "Bukti faktual"),
     (F_ESK, "GM", "Brief GM; putuskan pernyataan & tindakan korektif.", "ANL", "T+30", "Keputusan"),
     (F_MIT, "PR", "Publikasi holding statement & respons personal ke pengunggah.", "ANL", "T+60", "Statement"),
     (F_TUT, "PR", "Monitor sentimen 72 jam & laporan dampak.", "ANL", "+72 jam", "Laporan krisis")])

sop("SOP-VIS-05", "Program loyalty, konversi & basket size member", P2, "Loyalty & CRM",
    "Akuisisi Member, Basket Size Struk, Konversi per Jam", "-",
    "Konversi pengunjung->transaksi per jam < 18% atau akuisisi member < target mingguan", "Mobile App Summarecon Mall & CRM, People Counter", "REST API / GraphQL", "O360", "ANL, TEN",
    "MKT", "Konversi >= 20%; basket size member +10% YoY; akuisisi member sesuai target",
    "Laporan CRM, struk ter-scan", "Kampanye dievaluasi & anggaran direalokasi",
    "Alokasi budget marketing ke event yang menghasilkan konversi belanja tertinggi",
    [(F_DET, "MKT", "Dashboard menampilkan konversi per jam (struk ter-scan / footfall) & akuisisi member per kanal.", "O360", "Harian", "Tren konversi"),
     (F_VER, "MKT", "Bandingkan dengan jadwal event, cuaca, dan promo tenant; identifikasi jam/zona konversi rendah.", "O360", "Mingguan", "Analisis gap"),
     (F_MIT, "MKT", "Aktifkan push promo app berbasis lokasi (beacon) di jam konversi rendah & program scan struk berhadiah.", "O360", "+1 hari", "Kampanye aktif"),
     (F_DIS, "TRO", "Koordinasikan promo bersama tenant zona (co-funding voucher).", "TEN", "+3 hari", "Kesepakatan tenant"),
     (F_TUT, "MKT", "Ukur basket size member & ROI kampanye; realokasi budget ke kanal terbaik.", "ANL", "Bulanan", "Laporan ROI CRM")])

# ============ 3. SMART BMS & ENGINEERING =====================================
sop("SOP-BMS-01", "Anomali HVAC & chiller (trip, suhu zona, CO2)", P3, "HVAC & Chiller Plant",
    "Suhu/Kelembaban, Beban kW/TR, Sensor CO2 Udara", "P2-P4",
    "Chiller trip / COP < 5.5 / suhu zona > 26 C / CO2 > 1000 ppm", "BMS SCADA, IoT Temp/CO2 Sensors", "BACnet / Modbus TCP", "BMS", "TIC, TEN, ENE",
    "CENG", "Uptime HVAC >= 99.5%; suhu zona 22-24 C",
    "Trend log BMS, kode fault, foto", "Parameter normal 30 menit & tenant terdampak konfirmasi",
    "Auto-modulation Chiller mengikuti kepadatan pengunjung (hemat listrik 15-25%)",
    [(F_DET, "BMSO", "Alarm BMS: chiller trip/COP drop/suhu atau CO2 zona di luar ambang muncul di Fasilitas & BMS.", "BMS", "T+0", "Alarm BMS"),
     (F_TIK, "CCO", "Tiket otomatis: chiller utama trip = P2, suhu zona/CO2 = P4 (P3 jika anchor/>3 tenant).", "TIC", "T+1", "Tiket"),
     (F_MIT, "BMSO", "Start chiller standby / naikkan kapasitas chiller lain; cek supply/return CHW.", "BMS", "T+3", "Chiller standby running"),
     (F_DIS, "MEP", "Teknisi ke plant/AHU: cek kode fault, VFD, flow, kondensor, damper VAV.", "BMS", "T+5", "Diagnosa lapangan"),
     (F_DIS, "TRO", "Informasikan tenant terdampak (suhu) via template respons & ETA.", "TEN", "T+5", "Notifikasi tenant"),
     (F_ESK, "CENG", "Bila P2 belum pulih 15 menit -> eskalasi GM; hubungi vendor OEM.", "TIC", "T+15", "Eskalasi"),
     (F_TUT, "ENM", "Analisis dampak energi (kWh, COP) & rekomendasi (descaling, setpoint reset).", "ENE", "H+1", "Laporan dampak")])

sop("SOP-BMS-02", "Kebocoran pipa & genangan air (chiller, PDAM, malam hari)", P3, "Water & Waste Management",
    "Debit PDAM/Sumur, Air & Lingkungan", "P2",
    "Penurunan tekanan pipa > 15% / flow malam > baseline / laporan genangan", "Smart Flow Meter, Sensor Akustik Pipa, BMS", "LoRaWAN / NB-IoT", "BMS", "TIC, CCTV, TEN, ENE",
    "CENG", "Isolasi kebocoran <= 10 menit; 0 insiden terpeleset",
    "Foto genangan, data flow/tekanan, CCTV", "Pipa diperbaiki, area kering, tekanan normal",
    "Deteksi dini kebocoran pipa malam hari",
    [(F_DET, "BMSO", "Alarm tekanan/flow atau laporan genangan (CCTV/Patroli).", "BMS", "T+0", "Alarm"),
     (F_VER, "CCO", "Verifikasi visual via kamera zona; cek risiko terhadap pengunjung & panel listrik.", "CCTV", "T+1", "Verifikasi"),
     (F_TIK, "CCO", "Buat tiket P2 (pipa utama) / P3 (lokal); tautkan kamera & aset BMS.", "TIC", "T+2", "Tiket"),
     (F_MIT, "HK", "Pasang yellow cone, barikade, wet vac; arahkan pengunjung memutar.", "TIC", "T+5", "Area aman"),
     (F_MIT, "MEP", "Tutup valve isolasi segmen; pasang pompa submersible bila perlu.", "BMS", "T+10", "Valve tertutup"),
     (F_DIS, "TRO", "Informasikan tenant sekitar (risiko air ke unit/stok).", "TEN", "T+10", "Notifikasi tenant"),
     (F_TUT, "ENM", "Hitung volume air hilang & biaya; update neraca air.", "ENE", "H+1", "Laporan kehilangan air")])

sop("SOP-BMS-03", "Pemadaman PLN & kegagalan sinkronisasi genset", P3, "Smart Energy & Power",
    "Status Genset/PV, Peak Load (kVA)", "P2",
    "Tegangan PLN hilang / ATS gagal transfer / genset gagal sinkron", "Smart Power Meter, ATS, Genset Controller", "Modbus TCP", "BMS", "TIC, ENE, TEN, CCTV",
    "CENG", "ATS transfer <= 12 detik; daya kritikal pulih <= 30 menit",
    "Log ATS/genset, data beban", "Suplai normal (PLN/genset) & seluruh sistem kritikal online",
    "Load shedding otomatis beban non-kritikal",
    [(F_DET, "BMSO", "Alarm power failure & status ATS/genset di panel Gardu Trafo & Genset.", "BMS", "T+0", "Alarm"),
     (F_MIT, "BMSO", "Pastikan beban life-safety (FACP, lift evakuasi, lampu darurat, CCTV) ter-backup UPS/genset.", "BMS", "T+1", "Beban kritikal aman"),
     (F_TIK, "CCO", "Tiket P2; kirim instruksi radio ke Security untuk cek lift terjebak.", "TIC", "T+1", "Tiket"),
     (F_DIS, "QRT", "Cek seluruh lift (penumpang terjebak) & pandu pengunjung di area gelap.", "CCTV", "T+3", "Laporan lift"),
     (F_MIT, "MEP", "Sinkronisasi manual genset; load shedding non-kritikal (fasad, sebagian AHU).", "ENE", "T+5", "Genset online"),
     (F_ESK, "CENG", "Hubungi PLN; eskalasi GM bila > 15 menit.", "TIC", "T+15", "Eskalasi"),
     (F_DIS, "TRO", "Broadcast tenant: status listrik & estimasi pemulihan.", "TEN", "T+10", "Broadcast"),
     (F_TUT, "CENG", "Kembalikan ke PLN, audit konsumsi solar, RCA.", "ENE", "Setelah pulih", "RCA")])

sop("SOP-BMS-04", "Peak load / load shedding waktu beban puncak (WBP)", P3, "Smart Energy & Power",
    "Peak Load (kVA), Smart Sub-Meter", "P3",
    "Beban total mendekati 90% batas kontrak PLN pada WBP 18:00-22:00", "Smart Digital Power Meter", "Modbus TCP / LoRaWAN", "ENE", "BMS, TEN, ANL",
    "ENM", "Tidak melampaui batas kontrak kVA; penghematan WBP sesuai target",
    "Profil beban 24 jam", "Beban < 85% batas kontrak",
    "Load shedding otomatis saat beban puncak & tagihan utilitas tenant otomatis",
    [(F_DET, "ENM", "Profil beban 24 jam memproyeksikan beban melewati 90% batas di WBP.", "ENE", "T-30 menit", "Alert prediksi"),
     (F_MIT, "BMSO", "Aktifkan peak shaving: BESS discharge, pre-cooling, reset setpoint CHW +0.5 C.", "BMS", "T-15", "Mode peak shaving"),
     (F_MIT, "BMSO", "Dimming DALI 40% parkir & fasad; eskalator mode slow-speed.", "BMS", "T+0", "Beban turun"),
     (F_DIS, "TRO", "Himbau tenant boros (top 4 sub-meter) mengurangi beban non-esensial.", "TEN", "T+0", "Himbauan"),
     (F_TUT, "ENM", "Laporan penghematan WBP & biaya ke Analitik & Laporan.", "ANL", "Harian", "Laporan")])

sop("SOP-BMS-05", "Gangguan lift & eskalator (trip / penumpang terjebak)", P3, "Vertical Transport",
    "Uptime Lift/Eskalator", "P1-P3",
    "PLC fault code eskalator/lift, tombol darurat kabin, laporan pengunjung", "Controller Lift/Eskalator & Vibration IoT", "BACnet / OPC-UA", "BMS", "TIC, CCTV",
    "CENG", "Pembebasan penumpang terjebak <= 15 menit; uptime >= 99.5%",
    "Kode fault, rekaman CCTV, foto", "Unit uji jalan aman & dibuka kembali",
    "Stop darurat otomatis & barikade digital (signage)",
    [(F_DET, "BMSO", "Status eskalator/lift berubah TRIP; kode fault (mis. comb-plate) tampil di panel transport vertikal.", "BMS", "T+0", "Alarm fault"),
     (F_VER, "CCO", "Buka kamera eskalator/lift: cek korban, penumpang terjebak, kerumunan.", "CCTV", "T+1", "Verifikasi"),
     (F_TIK, "CCO", "Tiket: penumpang terjebak/cedera = P1; unit berhenti tanpa korban = P3.", "TIC", "T+1", "Tiket"),
     (F_DIS, "QRT", "Security barikade & arahkan pengunjung ke unit lain; komunikasi intercom kabin.", "CCTV", "T+3", "Area aman"),
     (F_MIT, "MEP", "Teknisi bersertifikat lakukan rescue/inspeksi; ganti komponen bila perlu.", "BMS", "T+5", "Tindakan teknis"),
     (F_ESK, "CENG", "Panggil vendor OEM bila kerusakan mayor; eskalasi GM bila P1.", "TIC", "T+15", "Vendor dipanggil"),
     (F_TUT, "CENG", "Uji jalan, buka kembali, catat downtime & RCA.", "ANL", "Setelah pulih", "Laporan downtime")])

sop("SOP-BMS-06", "Predictive maintenance transport vertikal (getaran motor)", P3, "Vertical Transport",
    "Sensor Getaran Motor, Uptime Lift/Eskalator", "P3",
    "Getaran > 2.8 mm/s atau suhu motor > 75 C (tren naik 7 hari)", "Vibration IoT & Controller", "BACnet / OPC-UA", "BMS", "TIC, ANL",
    "CENG", "0 kerusakan tak terencana akhir pekan; downtime tak terencana < 2 jam/bulan",
    "Trend getaran/suhu", "Parameter kembali di bawah ambang",
    "Predictive maintenance sebelum eskalator mati saat akhir pekan",
    [(F_DET, "BMSO", "Model prediktif menandai unit dengan tren getaran/suhu naik.", "BMS", "Harian", "Daftar unit at-risk"),
     (F_TIK, "CENG", "Buat work order PM terjadwal di jam non-operasional (P3).", "TIC", "H+0", "Work order"),
     (F_MIT, "MEP", "Pelumasan, alignment, ganti bearing/step chain sesuai temuan.", "BMS", "Malam hari", "Laporan PM"),
     (F_TUT, "CENG", "Validasi parameter normal 48 jam & update MTBF di Analitik & Laporan.", "ANL", "+48 jam", "Validasi")])

sop("SOP-BMS-07", "Kualitas efluen STP/IPAL & pengelolaan sampah", P3, "Water & Waste Management",
    "Kualitas Air IPAL, Tonase Sampah", "P3",
    "pH di luar 6-9, COD/BOD melampaui baku mutu, tonase sampah > kapasitas TPS", "Water Quality Sensor, Timbangan TPS", "LoRaWAN / NB-IoT", "ENE", "BMS, TIC, ANL",
    "HSE", "100% kepatuhan baku mutu (Permen LHK P.68/2016); daur ulang air >= 40%",
    "Log kualitas air, manifest sampah", "Parameter efluen sesuai baku mutu",
    "Kepatuhan regulasi lingkungan (Green Building)",
    [(F_DET, "ENM", "Sensor kualitas air/tonase memberi alert di Neraca Air & STP.", "ENE", "T+0", "Alert"),
     (F_TIK, "CCO", "Tiket P3 ke HSE & MEP STP.", "TIC", "T+10", "Tiket"),
     (F_MIT, "MEP", "Penyesuaian dosis bakteri/aerasi; stop bypass ke saluran kota bila melanggar.", "BMS", "T+60", "Tindakan"),
     (F_TUT, "HSE", "Uji lab pihak ketiga & laporan kepatuhan bulanan ESG.", "ANL", "Bulanan", "Laporan ESG")])

# ============ 4. PARKING & MOBILITY ==========================================
sop("SOP-PRK-01", "Antrean gate parkir masuk > 8 mobil", P4, "Gate & Cashless Revenue",
    "Kecepatan Masuk, Rekonsiliasi QRIS", "P3",
    "ANPR queue alert > 8 mobil atau waktu antrean gate > 15 detik/mobil", "ANPR Camera & Gate Telemetry", "REST API", "PARK", "TIC, CCTV",
    "PKR", "Waktu antrean gate <= 15 detik; antrean > 10 mobil = 0 kejadian/hari",
    "Snapshot ANPR, log gate", "Antrean < 4 mobil selama 15 menit",
    "Buka gate tambahan otomatis jika antrean > 8 mobil",
    [(F_DET, "PKR", "Alert antrean dari ANPR tampil di Parkir & Mobilitas.", "PARK", "T+0", "Alert antrean"),
     (F_MIT, "PKR", "Sistem membuka gate tambahan otomatis (reversible lane); verifikasi gate berfungsi.", "PARK", "T+1", "Gate tambahan aktif"),
     (F_VER, "CCO", "Cek kamera jalan akses: antrean meluber ke jalan raya?", "CCTV", "T+2", "Verifikasi"),
     (F_TIK, "CCO", "Bila > 10 mobil atau gate error: tiket P3 & dispatch petugas parkir manual.", "TIC", "T+3", "Tiket"),
     (F_DIS, "PKR", "Petugas lakukan manual tapping/handheld QRIS & atur lalu lintas.", "PARK", "T+5", "Antrean terurai"),
     (F_TUT, "PKR", "Catat penyebab (reader error, saldo kartu, lonjakan) untuk evaluasi.", "ANL", "Harian", "Laporan gate")])

sop("SOP-PRK-06", "Smart parking guidance & optimasi turnover slot", P4, "Smart Parking Guidance",
    "Slot Kosong/Zona, Durasi & Turnover, Parkir VIP & EV", "P4",
    "Okupansi zona > 95% atau turnover < 3.8 putaran/slot/hari atau sensor bay error", "Ultrasonic Bay Sensor & LPR Camera", "TCP/IP / RS-485", "PARK", "TIC, O360, ANL",
    "PKR", "Turnover >= 3.8 putaran/slot/hari; waktu cari parkir <= 3 menit",
    "Snapshot okupansi, log sensor bay", "Layar LED akurat & distribusi okupansi seimbang",
    "Update layar LED penunjuk slot kosong & rekayasa arus lalu lintas internal",
    [(F_DET, "PKR", "Panel okupansi menandai zona penuh (> 95%) atau sensor bay tidak terbaca.", "PARK", "T+0", "Alert okupansi"),
     (F_MIT, "PKR", "Sistem mengalihkan arahan LED ke zona kosong; petugas memasang rambu 'PENUH'.", "PARK", "T+2", "LED diperbarui"),
     (F_TIK, "CCO", "Sensor bay error > 5% zona: tiket P4 ke vendor parkir.", "TIC", "T+10", "Tiket"),
     (F_VER, "PKR", "Analisis durasi parkir & kendaraan menginap > 24 jam (cek plat via LPR).", "PARK", "Harian", "Daftar kendaraan inap"),
     (F_TUT, "FIN", "Evaluasi tarif progresif/VIP & EV untuk menaikkan turnover; laporan ke Komersial & Keuangan.", "O360", "Bulanan", "Rekomendasi tarif")])

sop("SOP-PRK-02","Kendaraan menghalangi jalur darurat / difabel / damkar", P4, "Smart Parking Guidance",
    "Slot Kosong/Zona, Parkir VIP & EV", "P2",
    "Smart Cam ANPR mendeteksi kendaraan diam di jalur damkar/difabel > 3 menit", "Smart Cam ANPR, Ultrasonic Bay Sensor", "TCP/IP / RS-485", "PARK", "TIC, CCTV",
    "PKR", "Jalur darurat bebas <= 10 menit",
    "Snapshot plat nomor, foto", "Jalur darurat kosong",
    "Panggilan pemilik kendaraan via data member/plat",
    [(F_DET, "PKR", "Alert pelanggaran jalur darurat dengan plat nomor (mis. B 1204 KOS).", "PARK", "T+0", "Alert"),
     (F_TIK, "CCO", "Tiket P2 dengan snapshot kamera.", "TIC", "T+1", "Tiket"),
     (F_DIS, "QRT", "Security ke lokasi; cari pemilik via paging/info desk/data member.", "CCTV", "T+5", "Pemilik dihubungi"),
     (F_MIT, "PKR", "Bila pemilik tidak ditemukan 15 menit: gembok roda/derek sesuai kebijakan.", "PARK", "T+15", "Tindakan"),
     (F_TUT, "PKR", "Tutup tiket & catat pelanggaran plat (blacklist berulang).", "TIC", "Saat selesai", "Log pelanggaran")])

sop("SOP-PRK-03", "Kepadatan drop-off lobi, valet & taksi", P4, "Drop-off & Valet / Taxi",
    "Antrean Drop-off Lobi & Valet, Taksi & Ride-Hail (Waiting Time)", "P3",
    "Waktu tunggu lobi > 5 menit atau jalur drop-off padat > 80%", "AI Traffic Camera", "RTSP", "PARK", "CCTV, TIC",
    "PKR", "Waktu tunggu lobi <= 5 menit",
    "Snapshot AI camera", "Waktu tunggu normal 15 menit",
    "Pengerahan petugas keamanan lobi saat antrean drop-off padat",
    [(F_DET, "PKR", "Alert kepadatan lobi dari AI traffic camera.", "PARK", "T+0", "Alert"),
     (F_VER, "CCO", "Verifikasi kamera lobi & jalur masuk.", "CCTV", "T+1", "Verifikasi"),
     (F_DIS, "QRT", "Kerahkan Regu Alpha (drop-off & gerbang) untuk atur lalu lintas.", "CCTV", "T+3", "Regu on-site"),
     (F_MIT, "PKR", "Aktifkan zona tunggu ride-hail alternatif & tambah petugas valet.", "PARK", "T+5", "Zona alternatif"),
     (F_TUT, "PKR", "Catat puncak & pola untuk penjadwalan personel.", "ANL", "Harian", "Laporan")])

sop("SOP-PRK-04", "Rekonsiliasi pendapatan parkir & QRIS/e-money", P4, "Gate & Cashless Revenue",
    "Rekonsiliasi QRIS", "-",
    "Selisih transaksi gate vs settlement bank > 0.5%", "Parking Management System, Bank", "REST API", "PARK", "O360, ANL",
    "FIN", "Selisih rekonsiliasi < 0.1%",
    "Laporan rekonsiliasi", "Selisih terjelaskan & dikoreksi",
    "Auto-recon harian",
    [(F_DET, "FIN", "Auto-recon harian menandai selisih per gate/metode bayar.", "PARK", "Harian 06:00", "Laporan selisih"),
     (F_VER, "PKR", "Cocokkan log gate, foto ANPR, & transaksi gagal.", "PARK", "+4 jam", "Analisis"),
     (F_TUT, "FIN", "Jurnal koreksi & laporan ke Komersial & Keuangan.", "O360", "+1 hari", "Jurnal")])

sop("SOP-PRK-05", "Gangguan EV charger (OCPP) & shuttle/feeder", P4, "Integrasi Transit",
    "EV Charger (OCPP), Feeder/Shuttle", "P4",
    "EVSE offline/fault, shuttle terlambat > 10 menit", "EVSE Backend (OCPP)", "OCPP", "PARK", "TIC, ENE",
    "PKR", "Uptime EVSE >= 98%",
    "Log OCPP", "EVSE online & sesi charging normal",
    "Reset remote EVSE",
    [(F_DET, "PKR", "Status EVSE fault/offline tampil di panel EV charger.", "PARK", "T+0", "Alert"),
     (F_MIT, "IT", "Remote reset via OCPP; bila gagal buat tiket P4 ke vendor EVSE.", "TIC", "T+10", "Reset/tiket"),
     (F_TUT, "ENM", "Catat kWh terjual & downtime.", "ENE", "Harian", "Laporan EVSE")])

# ============ 5. SECURITY, SAFETY & HSE ======================================
sop("SOP-SEC-01", "Kebakaran / fire alarm (Code Red) & evakuasi", P5, "Fire & Life Safety",
    "Status Smoke/Heat, Tekanan Hydrant", "P1",
    "FACP fire alarm, thermal CCTV, panic button, laporan titik api", "Fire Alarm Control Panel (FACP), Thermal CCTV", "BACnet / Dry Contact", "CCTV", "TIC, BMS, TEN, ANL, PARK",
    "CSEC", "Respons <= 2 menit; evakuasi zona < 15 menit; 0 korban",
    "Log FACP, rekaman CCTV, daftar hadir titik kumpul", "Damkar menyatakan aman; sistem fire di-reset",
    "Interlock otomatis: matikan AHU, buka pintu akses darurat, aktifkan PA Evakuasi",
    [(F_DET, "CCO", "Alarm FACP pop-up layar utama (zona detektor) + kamera thermal zona otomatis dibuka.", "CCTV", "T+0", "Alarm P1"),
     (F_VER, "CCO", "Verifikasi visual/thermal dan radio Security terdekat (maks 60 detik). False alarm -> reset & catat.", "CCTV", "T+1", "Konfirmasi api"),
     (F_TIK, "CCO", "Tiket P1 otomatis; kode CODE RED; notifikasi WhatsApp/Call prioritas ke GM & Owner (detik ke-1).", "TIC", "T+1", "Tiket P1 + eskalasi"),
     (F_MIT, "BMSO", "Pastikan interlock: AHU zona OFF, smoke exhaust ON, fire curtain turun, pintu darurat terbuka, lift ke lantai dasar.", "BMS", "T+1", "Interlock aktif"),
     (F_DIS, "ERT", "ERT padamkan dengan APAR/hydrant (cek tekanan hydrant); hubungi Damkar 113 bila tidak terkendali.", "TIC", "T+2", "Pemadaman awal"),
     (F_MIT, "CSEC", "Aktifkan PA evakuasi bertahap (zona -> lantai -> gedung); marshal arahkan ke titik kumpul.", "CCTV", "T+3", "Evakuasi"),
     (F_DIS, "TRO", "Broadcast darurat ke seluruh tenant zona (tutup gas/listrik, evakuasi karyawan).", "TEN", "T+3", "Broadcast tenant"),
     (F_DIS, "PKR", "Buka semua gate parkir (free exit) & kosongkan jalur akses Damkar.", "PARK", "T+5", "Jalur damkar bebas"),
     (F_PUL, "CSEC", "Headcount di titik kumpul; koordinasi Damkar; reset FACP setelah dinyatakan aman.", "CCTV", "< 15 menit", "Headcount"),
     (F_TUT, "HSE", "Laporan insiden, klaim asuransi, RCA & drill ulang; laporan ke BOD.", "ANL", "<= 24 jam", "Laporan insiden")])

sop("SOP-SEC-02", "Kebocoran gas dapur F&B", P5, "Fire & Life Safety",
    "Gas Leak Detector (Dapur F&B)", "P1",
    "Gas leak detector > 20% LEL di dapur tenant F&B", "Gas Leak Detector", "BACnet / Dry Contact", "BMS", "TIC, CCTV, TEN",
    "CSEC", "Isolasi gas <= 3 menit; 0 ledakan/kebakaran",
    "Log detektor, foto valve", "Konsentrasi gas 0% LEL & instalasi diperiksa",
    "Auto shut-off solenoid valve gas & exhaust ON",
    [(F_DET, "BMSO", "Alarm gas leak unit F&B; solenoid valve gas menutup otomatis.", "BMS", "T+0", "Alarm"),
     (F_TIK, "CCO", "Tiket P1; hubungi store manager tenant via VoIP direct.", "TIC", "T+1", "Tiket"),
     (F_DIS, "ERT", "ERT ke lokasi dengan detektor portabel; larang sumber api & saklar listrik.", "CCTV", "T+2", "ERT on-site"),
     (F_MIT, "TRO", "Evakuasi dapur & unit sebelah; ventilasi maksimum.", "TEN", "T+3", "Area kosong"),
     (F_TUT, "HSE", "Pemeriksaan instalasi oleh vendor gas bersertifikat sebelum dapur dibuka.", "TEN", "Sebelum buka", "Sertifikat cek")])

sop("SOP-SEC-03", "Barang tertinggal / mencurigakan (unattended object)", P5, "Surveillance & AI Video",
    "Barang Tertinggal", "P2",
    "AI mendeteksi objek tak bertuan > 10 menit", "IP CCTV + AI Video Analytics (VMS)", "ONVIF / RTSP", "CCTV", "TIC",
    "CSEC", "Respons <= 5 menit; klarifikasi <= 15 menit",
    "Klip video, foto objek", "Objek diklarifikasi (pemilik ditemukan / diamankan / Gegana)",
    "Pop-up layar utama + dispatch personel terdekat",
    [(F_DET, "CCO", "Alert objek tak bertuan + timer di panel alert keamanan.", "CCTV", "T+0", "Alert"),
     (F_VER, "CCO", "Playback ke saat objek ditinggalkan; identifikasi pemilik & arah pergi.", "CCTV", "T+2", "Klip pemilik"),
     (F_TIK, "CCO", "Tiket P2 (naik P1 bila ciri mencurigakan: kabel, bau, ancaman).", "TIC", "T+2", "Tiket"),
     (F_DIS, "QRT", "Security ke lokasi; jangan sentuh; radius aman 10 m; tanya sekitar.", "CCTV", "T+5", "Area diamankan"),
     (F_ESK, "CSEC", "Bila mencurigakan: eskalasi P1, evakuasi zona, hubungi Polisi/Gegana.", "TIC", "T+10", "Eskalasi"),
     (F_TUT, "CS", "Bila barang hilang biasa: serahkan ke Lost & Found, catat & paging pemilik.", "TIC", "T+15", "Log Lost & Found")])

sop("SOP-SEC-04", "Intrusi area terbatas (server/kas) & pencurian", P5, "Surveillance & AI Video",
    "Intrusion Alert", "P1-P2",
    "Akses tidak sah ruang server/kas/rooftop, alarm anti-theft tenant, orang dalam pengawasan (watchlist)", "AI Video, Access Control, FR", "ONVIF / RTSP", "CCTV", "TIC, TEN",
    "CSEC", "Intersep <= 5 menit",
    "Klip video, log akses kartu", "Pelaku diamankan/diserahkan ke Polisi atau alarm diklarifikasi",
    "Pop-up layar utama + lock-down pintu akses",
    [(F_DET, "CCO", "Alert intrusi/FR watchlist dengan akurasi AI & lokasi kamera.", "CCTV", "T+0", "Alert"),
     (F_VER, "CCO", "Verifikasi visual & log access control; tracking multi-kamera.", "CCTV", "T+1", "Verifikasi"),
     (F_TIK, "CCO", "Tiket P2 (P1 bila senjata/kekerasan).", "TIC", "T+2", "Tiket"),
     (F_DIS, "QRT", "Kirim intersep (Regu Bravo) dengan koordinat; lockdown pintu bila perlu.", "CCTV", "T+3", "Intersep"),
     (F_DIS, "TRO", "Informasikan tenant terdampak (pencurian toko).", "TEN", "T+5", "Info tenant"),
     (F_TUT, "CSEC", "Ekspor bukti video watermark (.MP4) & BAP ke Polisi.", "CCTV", "+1 jam", "Bukti video")])

sop("SOP-SEC-05", "Kerumunan abnormal / ancaman keamanan / teror", P5, "Surveillance & AI Video",
    "Deteksi Kerumunan", "P1",
    "AI mendeteksi kerumunan abnormal/perkelahian/kepanikan atau ancaman teror", "AI Video Analytics, Panic Button", "ONVIF / RTSP", "CCTV", "TIC, BMS, TEN, PARK, ANL",
    "CSEC", "Respons <= 2 menit; lockdown/evakuasi sesuai keputusan <= 5 menit",
    "Klip video, log komunikasi", "Ancaman dinetralisir & dinyatakan aman Polisi",
    "Pop-up layar utama + dispatch personel terdekat",
    [(F_DET, "CCO", "Alert anomali kerumunan/kepanikan/panic button.", "CCTV", "T+0", "Alert"),
     (F_VER, "CSEC", "Nilai jenis ancaman: perkelahian, kepanikan, senjata, bom.", "CCTV", "T+1", "Penilaian"),
     (F_TIK, "CCO", "Tiket P1; eskalasi langsung ke GM/Owner; hubungi Polisi 110.", "TIC", "T+1", "Tiket + eskalasi"),
     (F_MIT, "CSEC", "Putuskan lockdown (shelter-in-place) atau evakuasi; kontrol pintu akses.", "CCTV", "T+3", "Keputusan"),
     (F_DIS, "TRO", "Broadcast tenant: tutup rolling door / evakuasi sesuai keputusan.", "TEN", "T+3", "Broadcast"),
     (F_DIS, "PKR", "Kendalikan gate parkir (tahan keluar/masuk sesuai instruksi Polisi).", "PARK", "T+5", "Kontrol gate"),
     (F_TUT, "GM", "Komunikasi publik via PR & laporan BOD.", "ANL", "<= 24 jam", "Laporan")])

sop("SOP-SEC-06", "Guard tour & kepatuhan patroli security", P5, "Guard Tour & Housekeeping",
    "Guard Tour NFC", "P4",
    "Checkpoint NFC terlewat > 10 menit dari jadwal", "NFC Checkpoint, Patroli App", "BLE / App", "CCTV", "TIC, ANL",
    "CSEC", "Kepatuhan rute patroli >= 98%",
    "Log NFC", "Checkpoint terkunjungi",
    "Audit otomatis kinerja vendor outsourcing (Security)",
    [(F_DET, "CCO", "Sistem menandai checkpoint terlewat pada panel Regu Patroli.", "CCTV", "T+0", "Alert"),
     (F_DIS, "CSEC", "Hubungi regu via HT; kirim ulang ke checkpoint.", "CCTV", "T+5", "Konfirmasi"),
     (F_TUT, "SL", "Akumulasi kepatuhan per regu/vendor bulanan.", "ANL", "Bulanan", "Skor vendor")])

sop("SOP-SEC-07", "Kebersihan & sanitasi (smart toilet NH3, tumpahan)", P5, "Guard Tour & Housekeeping",
    "Smart Toilet (NH3), Tiket Komplain SLA < 15 Menit", "P4",
    "NH3 toilet > 25 ppm, tisu/sabun habis, tumpahan dilaporkan CCTV/patroli", "Smart Toilet Ammonia Sensor, CCTV", "LoRaWAN / App", "TIC", "CCTV, ANL",
    "HK", "Respons <= 15 menit; resolusi <= 45 menit",
    "Foto sebelum/sesudah", "Sensor NH3 normal / area bersih kering",
    "Tiket otomatis ke Housekeeping",
    [(F_DET, "CCO", "Sensor NH3/dispenser atau CCTV mendeteksi masalah kebersihan -> tiket P4 otomatis.", "TIC", "T+0", "Tiket"),
     (F_DIS, "HK", "Janitorial Crew terdekat menerima push; pasang yellow cone bila tumpahan.", "TIC", "T+5", "Penugasan"),
     (F_MIT, "HK", "Pembersihan, isi ulang supply, unggah foto sesudah.", "TIC", "<= 15 menit", "Foto"),
     (F_TUT, "HK", "Sensor kembali normal -> auto-close; rekap untuk evaluasi vendor cleaning.", "ANL", "Bulanan", "Skor vendor")])

sop("SOP-SEC-08", "Gempa bumi / bencana alam", P5, "Fire & Life Safety",
    "Status Smoke/Heat, Tekanan Hydrant", "P1",
    "Notifikasi BMKG / sensor seismik / guncangan dirasakan", "BMKG API, Sensor Seismik", "API", "TIC", "BMS, CCTV, TEN, PARK, ANL",
    "CSEC", "Instruksi 'Drop-Cover-Hold' <= 30 detik; evakuasi pasca guncangan < 15 menit",
    "Log PA, daftar headcount", "Inspeksi struktur aman & operasional dibuka kembali",
    "PA otomatis & lift recall ke lantai terdekat",
    [(F_DET, "CCO", "Alert gempa; PA otomatis 'Drop-Cover-Hold'; lift recall.", "TIC", "T+0", "PA aktif"),
     (F_MIT, "BMSO", "Pastikan lift berhenti di lantai terdekat & pintu terbuka; cek gas & chiller.", "BMS", "T+1", "Status aset"),
     (F_MIT, "CSEC", "Setelah guncangan berhenti: evakuasi ke titik kumpul terbuka.", "CCTV", "T+2", "Evakuasi"),
     (F_DIS, "TRO", "Broadcast tenant & headcount karyawan tenant.", "TEN", "T+5", "Headcount tenant"),
     (F_PUL, "CENG", "Inspeksi struktur cepat (retakan, kebocoran, plafon) sebelum re-entry.", "BMS", "T+30", "Laporan inspeksi"),
     (F_TUT, "GM", "Keputusan buka kembali & laporan ke BOD.", "ANL", "T+60", "Keputusan")])

sop("SOP-SEC-09", "Anak / orang hilang (Code Adam)", P5, "Surveillance & AI Video",
    "Deteksi Kerumunan, Traffic per Pintu", "P1",
    "Laporan orang tua / pengunjung ke Info Desk atau Security", "Info Desk, CCTV AI (attribute search)", "ONVIF", "CCTV", "TIC, PARK",
    "CSEC", "Anak ditemukan <= 15 menit; semua pintu terkontrol <= 3 menit",
    "Foto/ciri anak, klip CCTV", "Anak diserahkan ke orang tua dengan verifikasi identitas",
    "Pencarian atribut AI (warna baju, tinggi) di seluruh kamera",
    [(F_DET, "CS", "Info Desk catat ciri-ciri (baju, usia, lokasi terakhir) & foto dari HP orang tua.", "TIC", "T+0", "Data anak"),
     (F_TIK, "CCO", "Tiket P1 Code Adam; broadcast radio ke semua pos pintu & parkir.", "TIC", "T+1", "Code Adam aktif"),
     (F_VER, "CCO", "AI attribute search & playback lokasi terakhir.", "CCTV", "T+2", "Jejak kamera"),
     (F_DIS, "QRT", "Pos pintu & gate parkir awasi setiap anak keluar; tim sisir zona.", "PARK", "T+3", "Pintu terkontrol"),
     (F_TUT, "CSEC", "Serahkan anak dengan verifikasi; bila > 15 menit belum ditemukan, lapor Polisi.", "TIC", "<= 15 menit", "Serah terima")])

sop("SOP-SEC-10", "Medical emergency pengunjung (Code Blue)", P5, "Guard Tour & Housekeeping",
    "Tiket Komplain SLA < 15 Menit", "P1",
    "Pengunjung pingsan/cedera dilaporkan atau terdeteksi AI (orang jatuh)", "AI Video (fall detection), Radio", "ONVIF / Radio", "TIC", "CCTV, PARK",
    "ERT", "First aid tiba <= 3 menit; ambulans dipanggil <= 5 menit bila perlu",
    "Form pertolongan pertama", "Pasien ditangani/dirujuk",
    "Dispatch ERT bersertifikat P3K + AED terdekat",
    [(F_DET, "CCO", "Laporan/AI fall detection; buka kamera lokasi.", "CCTV", "T+0", "Alert"),
     (F_TIK, "CCO", "Tiket P1 Code Blue; dispatch ERT + AED terdekat.", "TIC", "T+1", "Tiket"),
     (F_MIT, "ERT", "Pertolongan pertama, CPR/AED bila perlu; amankan area.", "TIC", "T+3", "Penanganan"),
     (F_DIS, "PKR", "Siapkan jalur ambulans di lobi/drop-off.", "PARK", "T+5", "Jalur ambulans"),
     (F_TUT, "HSE", "Laporan insiden & tindak lanjut (asuransi, keluarga).", "ANL", "<= 24 jam", "Laporan")])

# ============ 6. FINANCE & ASSET VALUE =======================================
sop("SOP-FIN-01", "Billing otomatis & collection tenant", P6, "Billing & Collection",
    "Auto-Invoicing, Aging Piutang", "-",
    "Siklus tagihan bulanan (sewa, service charge, utilitas sub-meter)", "ERP Finance & Virtual Account Bank", "ISO 20022 / Open API", "O360", "TEN, ENE",
    "FIN", "Collection ratio >= 98%",
    "Invoice, bukti VA", "Pembayaran terekonsiliasi otomatis",
    "Tagihan utilitas tenant otomatis dari sub-meter (AMR)",
    [(F_DET, "FIN", "AMR menarik konsumsi sub-meter tenant; ERP generate invoice + VA.", "ENE", "Tgl 1", "Invoice"),
     (F_DIS, "TRO", "Invoice terkirim ke Tenant App & email.", "TEN", "Tgl 1", "Invoice terkirim"),
     (F_VER, "FIN", "Auto-recon VA harian; update AR aging di Komersial & Keuangan.", "O360", "Harian", "AR aging"),
     (F_TUT, "FIN", "Laporan collection ratio bulanan.", "ANL", "Bulanan", "Laporan")])

sop("SOP-FIN-02", "Tunggakan tenant > 30/60/90 hari & pembatasan fasilitas", P6, "Billing & Collection",
    "Aging Piutang, Denda Otomatis", "-",
    "AR aging tenant melewati 30, 60, 90 hari", "ERP Finance & VA Bank", "ISO 20022 / Open API", "O360", "TEN, BMS, ANL",
    "FIN", "AR > 60 hari < 2% total piutang",
    "Surat peringatan SP1/SP2/SP3, log pembatasan", "Lunas / rencana cicilan disetujui",
    "Surat peringatan otomatis & pembatasan fasilitas jika menunggak >60 hari",
    [(F_DET, "FIN", "Aging 30 hari: reminder otomatis + denda sesuai kontrak.", "O360", "H+30", "Reminder"),
     (F_ESK, "FIN", "Aging 60 hari: SP otomatis via Tenant App; TRO lakukan kunjungan.", "TEN", "H+60", "SP + kunjungan"),
     (F_MIT, "CENG", "Atas persetujuan GM: batasi fasilitas (overtime AC, izin loading non-esensial).", "BMS", "H+60", "Pembatasan"),
     (F_ESK, "GM", "Aging 90 hari: rapat legal & Leasing (restrukturisasi/terminasi).", "ANL", "H+90", "Keputusan"),
     (F_TUT, "FIN", "Cabut pembatasan otomatis setelah pelunasan terekonsiliasi.", "O360", "Saat lunas", "Status normal")])

sop("SOP-FIN-03", "Kontrol opex vs budget & P&L harian", P6, "Real-time P&L & Cashflow",
    "Daily Revenue, Opex vs Budget, EBITDA Harian", "-",
    "Opex harian > 105% budget atau EBITDA margin turun > 3 poin", "Enterprise ERP & Treasury System", "API / Data Warehouse", "O360", "ENE, ANL",
    "FIN", "Opex <= budget; EBITDA margin sesuai target",
    "Laporan varians", "Varians terjelaskan & aksi korektif disepakati",
    "Alert varians otomatis",
    [(F_DET, "FIN", "Alert varians opex (energi, vendor, perbaikan) di Komersial & Keuangan.", "O360", "Harian", "Alert"),
     (F_VER, "ENM", "Drill ke biaya energi per zona & anomali.", "ENE", "+1 hari", "Analisis"),
     (F_TUT, "GM", "Aksi korektif di rapat mingguan.", "ANL", "Mingguan", "Aksi")])

sop("SOP-FIN-04", "Pelaporan BOD, proyeksi dividen & capex", P6, "Valuasi & Capex",
    "ROI Renovasi, Cost per m2, Proyeksi Dividen Pemilik Mall", "-",
    "Siklus bulanan/triwulan atau permintaan BOD", "Data warehouse SMICC, ERP", "API / Data Warehouse", "ANL", "O360, semua",
    "FIN", "Laporan BOD terbit <= H+5 bulan berikutnya",
    "Paket laporan BOD (PDF/XLSX/PPTX)", "BOD menyetujui laporan",
    "Generator Laporan BOD otomatis",
    [(F_DET, "FIN", "Generator laporan menarik KPI semua dashboard (SLA, energi, okupansi, NOI).", "ANL", "H+1", "Draft"),
     (F_VER, "GM", "Review & beri komentar; validasi angka dengan Finance.", "ANL", "H+3", "Review"),
     (F_TUT, "FIN", "Simulasi dividen & alokasi capex (ROI renovasi, cost/m2).", "O360", "H+4", "Simulasi"),
     (F_TUT, "GM", "Kirim paket laporan BOD.", "ANL", "H+5", "Laporan terkirim")])


# ============ EVENT TICKETING (Bandung Build Challenge 2026) =================
sop("SOP-EVT-01", "Setup acara, jenis tiket, kuota & denah kursi", P2, "Event Ticketing",
    "ROI Event Atrium", "-",
    "Acara baru disetujui di kalender event atrium (minimal H-21)", "Event Ticketing Engine & Kalender Event", "REST/JSON (transaksi berversi)", "EVT", "O360, ANL, BMS, PARK",
    "EO", "Acara dipublikasikan <= H-14; 0 kursi salah kategori/harga",
    "Checklist setup, tangkapan layar denah & konfigurasi tiket", "Acara berstatus Dipublikasikan & UAT pesan-bayar-check-in lulus",
    "Kuota kursi bernomor dihitung otomatis dari denah; kursi teknis/kursi roda diblokir dari penjualan",
    [(F_DET, "EO", "Terima brief acara (jadwal, venue, kapasitas, kategori harga) & buat acara berstatus Draft di Konsol Pengelola (/pengelola → Daftar acara → Acara baru, pilih templat venue).", "EVT", "H-21", "Acara Draft"),
     (F_VER, "HSE", "Verifikasi kapasitas venue terhadap jalur evakuasi; tetapkan kursi yang diblokir (kamera, FOH, kursi roda).", "EVT", "H-18", "Kapasitas & daftar blokir disetujui"),
     (F_TIK, "EO", "Atur jenis tiket, harga, kuota area berdiri, periode jual, durasi hold kursi (8 menit) & maksimal tiket per pesanan.", "EVT", "H-16", "Konfigurasi tiket"),
     (F_DIS, "FIN", "Verifikasi harga, biaya layanan & akun settlement payment gateway (sandbox pada prototype).", "EVT", "H-15", "Persetujuan Finance"),
     (F_MIT, "IT", "UAT end-to-end: pilih kursi, hold, bayar, e-ticket, check-in, refund, termasuk uji rebutan kursi (2 pembeli bersamaan).", "EVT", "H-15", "Berita acara UAT"),
     (F_TUT, "EO", "Publikasikan acara di Konsol Pengelola; manajemen mall memantau di Pemantauan Event, Command Center (pre-cooling BMS & antisipasi parkir PARK sesuai prediksi pengunjung).", "EVT", "H-14", "Acara live")])

sop("SOP-EVT-02", "Penjualan tiket, hold kursi & pencegahan double-booking", P2, "Event Ticketing",
    "ROI Event Atrium", "P3",
    "Laporan kursi ganda, kegagalan pembayaran massal, atau keluhan pembeli", "Event Ticketing Engine, Payment Gateway Sandbox", "REST/JSON + webhook pembayaran", "EVT", "TIC, O360, ANL",
    "EO", "0 kursi terjual ganda; konversi hold->bayar >= 70%; callback pembayaran idempoten 100%",
    "Log transaksi berversi, log callback pembayaran", "Tidak ada pesanan konflik & seluruh keluhan pembeli dijawab",
    "Hold kursi kedaluwarsa otomatis; commit transaksi yang kalah balapan ditolak (compare-and-swap) lalu diperiksa ulang",
    [(F_DET, "EO", "Pantau ringkasan: kursi sedang dipesan, pesanan menunggu bayar, pembayaran gagal, konversi.", "EVT", "Kontinu", "Dashboard penjualan"),
     (F_VER, "IT", "Bila ada laporan kursi ganda: telusuri versi transaksi & status kursi (HELD/SOLD, pemilik pesanan).", "EVT", "T+10", "Hasil penelusuran"),
     (F_TIK, "CCO", "Buat tiket insiden P3 bila gangguan sistem/pembayaran berdampak > 10 pembeli.", "TIC", "T+15", "Tiket insiden"),
     (F_MIT, "EO", "Lepas hold kedaluwarsa, kabari daftar tunggu, tawarkan kursi setara untuk pesanan bermasalah.", "EVT", "T+30", "Kursi tersedia kembali"),
     (F_PUL, "FIN", "Rekonsiliasi pembayaran vs pesanan lunas; refund bila terbayar ganda.", "EVT", "H+1", "Laporan rekonsiliasi"),
     (F_TUT, "EO", "Kirim laporan penjualan harian ke Marketing dan Komersial & Keuangan.", "O360", "Harian", "Laporan penjualan")])

sop("SOP-EVT-03", "Check-in gate QR & penanganan tiket palsu/calo", P5, "Event Ticketing",
    "Traffic per Pintu, ROI Event Atrium", "P2",
    ">= 3 pindaian QR gagal/duplikat per gate dalam 10 menit, antrean gate > 15 menit, atau QR palsu", "Scanner QR gate (kamera ponsel/handheld), CCTV gate", "REST/JSON (transaksi check-in atomik)", "EVT", "TIC, CCTV, PARK",
    "EO", "Check-in <= 10 detik/orang; 0 tiket dipakai dua kali; antrean gate <= 15 menit",
    "Log pindaian, klip CCTV gate", "Gate normal 15 menit & pelaku tertangani",
    "Validasi tanda tangan QR & status tiket; pindaian kedua ditandai SUDAH DIGUNAKAN; anomali memicu tiket insiden",
    [(F_DET, "GTE", "Pindai QR; sistem menampilkan VALID / SUDAH DIGUNAKAN / TIDAK VALID beserta pemegang & kursi.", "EVT", "T+0", "Hasil pindaian"),
     (F_VER, "GTE", "Untuk SUDAH DIGUNAKAN/TIDAK VALID: cocokkan identitas & kode booking, arahkan ke meja bantuan; bila berulang tekan 'Laporkan ke Command Center' (ponsel gate / Konsol Pengelola).", "EVT", "T+1", "Verifikasi manual + laporan lapangan"),
     (F_TIK, "CCO", "Anomali >= 3 per gate/10 menit -> tiket insiden P2 'Indikasi tiket palsu/calo' dari Pemantauan Event → Gate & Keamanan di Command Center.", "TIC", "T+2", "Tiket P2"),
     (F_DIS, "QRT", "Dispatch regu keamanan ke gate; verifikasi visual via CCTV gate.", "CCTV", "T+5", "Regu di gate + klip bukti"),
     (F_MIT, "EO", "Buka gate tambahan bila antrean > 15 menit; info ke Parkir & Security lobi.", "EVT", "T+10", "Gate tambahan aktif"),
     (F_TUT, "CSEC", "Tutup tiket insiden, simpan bukti (log pindaian + klip), laporan pasca-acara.", "TIC", "H+1", "Laporan insiden")])

sop("SOP-EVT-04", "Pembatalan, refund, perubahan data peserta & daftar tunggu", P2, "Event Ticketing",
    "ROI Event Atrium", "-",
    "Permintaan peserta, acara diubah/dibatalkan, atau pembayaran gagal", "Event Ticketing Engine, Payment Gateway Sandbox", "REST/JSON", "EVT", "O360, ANL",
    "EO", "Refund diproses <= 3x24 jam; kursi refund kembali dijual <= 5 menit",
    "Log refund & notifikasi", "Peserta menerima konfirmasi & e-ticket lama nonaktif",
    "E-ticket di-VOID, kursi kembali tersedia, daftar tunggu dikabari",
    [(F_DET, "CS", "Terima permintaan (batal/refund/ubah nama) via info desk, email, atau WhatsApp.", "EVT", "T+0", "Permintaan tercatat"),
     (F_VER, "EO", "Cek status pesanan & kebijakan (tiket belum check-in, batas waktu).", "EVT", "T+1 jam", "Keputusan"),
     (F_MIT, "EO", "Ubah data peserta / batalkan pesanan menunggu bayar / proses refund pesanan lunas.", "EVT", "T+2 jam", "Status diperbarui"),
     (F_PUL, "FIN", "Eksekusi refund ke metode bayar asal (sandbox) & catat di rekonsiliasi.", "EVT", "<= 3x24 jam", "Bukti refund"),
     (F_TUT, "EO", "Kabari daftar tunggu bahwa kursi tersedia & kirim konfirmasi ke peserta. Acara batal: 'Batalkan acara' di daftar acara (refund otomatis semua pesanan lunas); hapus hanya untuk acara tanpa transaksi.", "EVT", "T+5 menit", "Notifikasi terkirim")])
