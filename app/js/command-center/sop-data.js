/* AUTO-GENERATED oleh tools/docs/build_docs.py - jangan edit manual */
window.SMICC_REF = {
 "mall": "Summarecon Mall",
 "mallSub": "Integrated Command Center",
 "system": "Summarecon Mall Integrated Command Center Ticketing System (SMICC-TS)",
 "generated": "2026-11-12",
 "dashboards": [
  {
   "code": "TIC",
   "name": "Tiket & Insiden",
   "route": "ticketing",
   "pillar": "Lintas Pilar (Hub)",
   "purpose": "Pusat semua tiket insiden: triage P1-P4, dispatch tim, hitung mundur SLA, eskalasi, dan penutupan.",
   "users": "Operator Command Center, Shift Lead, Supervisor Lapangan",
   "sources": "Semua dashboard (event producer), Radio/HT GPS, Patroli App",
   "widgets": "Antrean tiket, inspector tiket + checklist SOP, kesiapan tim, watchlist SLA tenant, distribusi domain"
  },
  {
   "code": "BMS",
   "name": "Fasilitas & BMS",
   "route": "bms",
   "pillar": "3. Smart BMS & Engineering",
   "purpose": "Pemantauan dan kontrol MEP: chiller, AHU, lift/eskalator, trafo, genset, plumbing.",
   "users": "Chief Engineering, Teknisi MEP, Operator BMS",
   "sources": "BMS SCADA (BACnet/Modbus), PLC Lift/Eskalator, FACP interlock, Smart Power Meter",
   "widgets": "Status chiller plant, AHU zona, transport vertikal, gardu trafo, genset, log diagnostik"
  },
  {
   "code": "TEN",
   "name": "Layanan Tenant & SLA",
   "route": "tenant",
   "pillar": "1. Commercial & Tenant Mix",
   "purpose": "Helpdesk tenant lewat semua kanal: komplain, izin kerja/fit-out, overtime, kepatuhan regulasi gedung.",
   "users": "Tenant Relation Officer, Customer Service, Leasing",
   "sources": "Tenant App, WhatsApp Business API, PMS (SAP/Yardi), Sub-meter IoT tenant",
   "widgets": "Daftar permintaan tenant, inspector profil tenant, kepatuhan regulasi, log percakapan semua kanal"
  },
  {
   "code": "CCTV",
   "name": "CCTV & Keamanan",
   "route": "cctv",
   "pillar": "5. Security, Safety & HSE",
   "purpose": "Video wall dengan AI analytics, verifikasi visual insiden, kontrol PTZ, regu patroli, dan bukti video.",
   "users": "Chief Security, Operator CCTV, Security Quick Response",
   "sources": "VMS IP CCTV + AI Video Analytics (ONVIF/RTSP), ANPR, Guard Tour NFC, FACP",
   "widgets": "Grid kamera, alert keamanan, kontroler PTZ, regu patroli, timeline playback & ekspor bukti"
  },
  {
   "code": "ENE",
   "name": "Energi & Utilitas",
   "route": "energy",
   "pillar": "3. Smart BMS & Engineering / 6. Finance",
   "purpose": "Audit konsumsi listrik/air, tarif WBP/LWBP, peak shaving, PLTS & ESG, sub-metering tenant.",
   "users": "Energy Manager, Chief Engineering, Finance",
   "sources": "Smart Digital Power Meter (Modbus/LoRaWAN), Flow meter air, BESS, PLTS inverter",
   "widgets": "Profil beban 24 jam, telemetri COP chiller, neraca air & STP, sub-meter tenant, anomali AI"
  },
  {
   "code": "ANL",
   "name": "Analitik & Laporan",
   "route": "analytics",
   "pillar": "Lintas Pilar (Executive)",
   "purpose": "Konsolidasi KPI lintas departemen, tren SLA, pareto root-cause, generator laporan BOD.",
   "users": "General Manager, Direksi/Owner, Head of Departments",
   "sources": "Data warehouse seluruh dashboard, ERP Finance",
   "widgets": "Scorecard KPI, tren SLA per departemen, rincian biaya per zona, pareto insiden, rekomendasi AI"
  },
  {
   "code": "PARK",
   "name": "Parkir & Mobilitas",
   "route": "parking",
   "pillar": "4. Parking & Mobility",
   "purpose": "Okupansi parkir per zona, antrean gate ANPR, drop-off lobi/valet, EV charger, rekonsiliasi QRIS.",
   "users": "Koordinator Parkir, Security Lobi, Finance Parkir",
   "sources": "Ultrasonic Bay Sensor, LPR/ANPR Camera, Parking Management System, EVSE (OCPP)",
   "widgets": "Okupansi per zona, status gate & antrean, drop-off lobi, EV charger, pendapatan parkir"
  },
  {
   "code": "O360",
   "name": "Komersial & Keuangan",
   "route": "owner360",
   "pillar": "1. Commercial / 2. Visitor / 6. Finance",
   "purpose": "Ringkasan bisnis untuk pemilik mall: okupansi NLA, produktivitas tenant/OCR, footfall & CSAT, AR aging, P&L/NOI.",
   "users": "Owner/Direksi, GM, Leasing, Finance, Marketing",
   "sources": "ERP Property (SAP/Yardi), POS Aggregator, 3D People Counter & Wi-Fi, CRM App, VA Bank",
   "widgets": "Scorecard KPI eksekutif, zonasi lantai & OCR, footfall & heatmap, AR aging, tren NOI"
  },
  {
   "code": "EVT",
   "name": "Pemantauan Event",
   "route": "event",
   "pillar": "2. Visitor & Experience",
   "purpose": "Tiket acara di Summarecon Mall Bandung lewat 3 path: /pengunjung (beli tiket: denah kursi, hold & anti double-booking, bayar sandbox, e-ticket QR), /pengelola (EO: tambah/hapus/batalkan acara, tiket, harga, kuota, denah, peserta, refund, check-in, waitlist), dan Pemantauan Event di Command Center (manajemen mall, hanya baca: portofolio acara, dampak operasional, keamanan gate → tiket insiden).",
   "users": "Event Officer/Panitia (Konsol Pengelola), Petugas Gate, Manajemen Mall & Ops Command Center (Pemantauan Event), Marketing, Finance, Security",
   "sources": "Event Ticketing Engine (server LAN, transaksi berversi), Payment Gateway Sandbox, Scanner QR gate (kamera ponsel), Notifikasi Email/WhatsApp (simulasi)",
   "widgets": "Pengelola: daftar acara (tambah/publikasi/batal/hapus), kelola acara/tiket/kuota, denah kursi, peserta & transaksi + CSV, check-in QR, notifikasi & waitlist. Command Center: portofolio event, detail acara, denah langsung, gate & keamanan, transaksi (hanya baca)"
  }
 ],
 "roles": {
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
  "EXT": "Pihak Eksternal (Damkar/Polisi/PLN/Ambulans)"
 },
 "sla": [
  {
   "level": "P1",
   "label": "CRITICAL",
   "category": "Keselamatan jiwa & kebakaran",
   "example": "Titik api di dapur F&B, gempa bumi, ancaman teror/keamanan",
   "trigger": "FACP Fire Alarm, Thermal CCTV, Panic Button",
   "respond": 2,
   "resolve": 15,
   "resolveText": "< 15 menit (evakuasi)",
   "pic": "Chief Security, ERT (Emergency Team) & Damkar",
   "escalation": "Langsung, detik ke-1 via WhatsApp/call prioritas"
  },
  {
   "level": "P2",
   "label": "HIGH",
   "category": "Kegagalan utilitas utama",
   "example": "Pemadaman PLN (genset gagal sinkron), chiller utama trip, pipa utama pecah",
   "trigger": "BMS SCADA Critical Alert & Smart Power Meter",
   "respond": 5,
   "resolve": 30,
   "resolveText": "< 30 menit",
   "pic": "Chief Engineering & Teknisi MEP Siaga",
   "escalation": "Jika belum pulih dalam 15 menit"
  },
  {
   "level": "P3",
   "label": "MEDIUM",
   "category": "Gangguan operasional area",
   "example": "Eskalator berhenti, antrean gate parkir macet >10 mobil, lift macet",
   "trigger": "PLC Fault Code, ANPR Camera Queue Alert",
   "respond": 10,
   "resolve": 120,
   "resolveText": "< 2 jam",
   "pic": "Supervisor Teknisi / Koordinator Parkir",
   "escalation": "Laporan rekap harian (kecuali viral di medsos)"
  },
  {
   "level": "P4",
   "label": "LOW",
   "category": "Kenyamanan & kebersihan",
   "example": "Toilet bau/tisu habis, tumpahan minuman di koridor, suhu zona agak panas",
   "trigger": "Smart Toilet Sensor (NH3), QR Code Visitor, Patroli App",
   "respond": 15,
   "resolve": 45,
   "resolveText": "< 45 menit",
   "pic": "Tim Housekeeping & Teknisi Zona",
   "escalation": "Rekap bulanan evaluasi vendor"
  }
 ],
 "escalation": [
  {
   "level": "P1",
   "stage": "L0 Deteksi",
   "t": 0,
   "to": "CCO -> CSEC + ERT",
   "channel": "Radio HT CH-01 + Pop-up Command Center",
   "cond": "Alarm FACP/Thermal/Panic Button terverifikasi",
   "msg": "Kode insiden, lokasi zona, jenis bahaya"
  },
  {
   "level": "P1",
   "stage": "L1 Manajemen",
   "t": 1,
   "to": "SL -> GM",
   "channel": "Call prioritas + WhatsApp Grup Crisis",
   "cond": "Otomatis untuk semua P1",
   "msg": "Kode, lokasi, status evakuasi, ETA Damkar"
  },
  {
   "level": "P1",
   "stage": "L2 Direksi",
   "t": 2,
   "to": "GM -> BOD / Owner",
   "channel": "Call prioritas + WhatsApp",
   "cond": "Otomatis untuk semua P1 (detik ke-1 notifikasi sistem)",
   "msg": "Ringkasan situasi, korban (jika ada), keputusan yang dibutuhkan"
  },
  {
   "level": "P1",
   "stage": "L3 Eksternal",
   "t": 3,
   "to": "CSEC -> Damkar / Polisi / Ambulans",
   "channel": "Telepon 112 / 113 / 110",
   "cond": "Api/ancaman tidak terkendali APAR atau ada korban",
   "msg": "Alamat mall, titik akses, jumlah orang terdampak"
  },
  {
   "level": "P1",
   "stage": "L4 Komunikasi publik",
   "t": 30,
   "to": "GM -> PR",
   "channel": "Holding statement medsos & media",
   "cond": "Insiden terlihat publik / viral",
   "msg": "Holding statement terverifikasi legal"
  },
  {
   "level": "P2",
   "stage": "L0 Deteksi",
   "t": 0,
   "to": "CCO -> CENG + MEP Siaga",
   "channel": "Radio HT CH-02 + Tiket otomatis",
   "cond": "BMS SCADA critical alert",
   "msg": "Kode alarm, aset, zona terdampak"
  },
  {
   "level": "P2",
   "stage": "L1 Manajemen",
   "t": 15,
   "to": "CENG -> GM",
   "channel": "Call + WhatsApp",
   "cond": "Belum pulih dalam 15 menit",
   "msg": "Root cause awal, ETA pemulihan, dampak tenant"
  },
  {
   "level": "P2",
   "stage": "L2 Direksi",
   "t": 30,
   "to": "GM -> BOD",
   "channel": "WhatsApp + email ringkas",
   "cond": "Belum pulih dalam 30 menit / dampak > 25% tenant",
   "msg": "Dampak bisnis & estimasi biaya"
  },
  {
   "level": "P2",
   "stage": "L3 Eksternal",
   "t": 15,
   "to": "CENG -> PLN / Vendor OEM",
   "channel": "Hotline vendor/PLN",
   "cond": "Gangguan di sisi suplai/garansi OEM",
   "msg": "Nomor ID pelanggan/aset, kode fault"
  },
  {
   "level": "P3",
   "stage": "L0 Deteksi",
   "t": 0,
   "to": "CCO -> Supervisor Teknisi / PKR",
   "channel": "Radio HT + Tiket",
   "cond": "PLC fault code / ANPR queue alert",
   "msg": "Lokasi, aset, dampak antrean"
  },
  {
   "level": "P3",
   "stage": "L1 Shift Lead",
   "t": 60,
   "to": "Supervisor -> SL",
   "channel": "Tiket eskalasi",
   "cond": "Belum selesai 60 menit",
   "msg": "Kendala & kebutuhan sumber daya"
  },
  {
   "level": "P3",
   "stage": "L2 Manajemen",
   "t": 120,
   "to": "SL -> GM",
   "channel": "Rekap harian",
   "cond": "SLA 2 jam terlampaui atau viral di medsos (langsung)",
   "msg": "Ringkasan & rencana perbaikan"
  },
  {
   "level": "P4",
   "stage": "L0 Deteksi",
   "t": 0,
   "to": "CCO -> HK / Teknisi Zona",
   "channel": "Patroli App push",
   "cond": "Sensor NH3 / QR feedback / patroli",
   "msg": "Lokasi & jenis keluhan"
  },
  {
   "level": "P4",
   "stage": "L1 Supervisor",
   "t": 30,
   "to": "HK -> SL",
   "channel": "Patroli App",
   "cond": "Belum selesai 30 menit",
   "msg": "Alasan keterlambatan"
  },
  {
   "level": "P4",
   "stage": "L2 Review vendor",
   "t": 43200,
   "to": "SL -> GM (rekap bulanan)",
   "channel": "Laporan evaluasi vendor",
   "cond": "Akumulasi breach bulanan",
   "msg": "Skor kinerja vendor outsourcing"
  }
 ],
 "sops": [
  {
   "id": "SOP-CC-01",
   "title": "Triage, klasifikasi severity & pembuatan tiket",
   "pillar": "0. Command Center (Lintas Pilar)",
   "subdomain": "Core Ticketing",
   "nodes": "Semua node Level-3 (sumber event)",
   "priority": "P1-P4",
   "trigger": "Setiap alarm sensor, laporan tenant/pengunjung, temuan patroli, atau panggilan radio",
   "source": "Seluruh sensor IoT, Tenant App, QR, Radio HT",
   "protocol": "REST/MQTT/Webhook",
   "dashboard": "TIC",
   "related": "Semua",
   "pic": "CCO",
   "kpi": "% tiket terklasifikasi benar (target >= 98%), waktu pembuatan tiket < 60 detik",
   "evidence": "Tiket ID #TCK, snapshot sumber (alarm/foto/chat)",
   "closure": "Tiket memiliki kategori, prioritas, zona, PIC & SOP terkait",
   "auto_action": "Alarm dari sistem yang tersambung langsung membuat tiket; operator hanya memvalidasi",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CCO",
     "action": "Terima event dari sumber (pop-up alarm, chat tenant, QR, radio). Catat jam deteksi (T0).",
     "dashboard": "TIC",
     "target": "T+0",
     "output": "Event masuk antrian"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CCO",
     "action": "Cek duplikasi: cari tiket aktif di zona & kategori yang sama dalam 30 menit terakhir; gabungkan bila duplikat.",
     "dashboard": "TIC",
     "target": "T+0:30",
     "output": "Tiket baru / merge"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CCO",
     "action": "Verifikasi visual via kamera terdekat (auto-suggest CCTV per zona) atau konfirmasi radio patroli.",
     "dashboard": "CCTV",
     "target": "T+1",
     "output": "Screenshot verifikasi"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tetapkan prioritas memakai matriks: P1 jiwa/kebakaran, P2 utilitas utama, P3 gangguan area, P4 kenyamanan.",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "Prioritas & SLA timer aktif"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Lengkapi field wajib: kategori domain, zona/lantai, tenant (jika ada), sumber, SOP terkait (auto-map).",
     "dashboard": "TIC",
     "target": "T+1:30",
     "output": "Tiket lengkap"
    },
    {
     "phase": "4-Dispatch",
     "role": "CCO",
     "action": "Jalankan SOP spesifik sesuai kategori (lihat kolom SOP terkait) & dispatch tim (SOP-CC-02).",
     "dashboard": "TIC",
     "target": "T+2",
     "output": "Status DISPATCHED"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "SL",
     "action": "Audit sampling 10% tiket per shift untuk ketepatan klasifikasi; koreksi & coaching operator.",
     "dashboard": "ANL",
     "target": "Akhir shift",
     "output": "Log audit klasifikasi"
    }
   ]
  },
  {
   "id": "SOP-CC-02",
   "title": "Dispatch & penugasan tim lapangan",
   "pillar": "0. Command Center (Lintas Pilar)",
   "subdomain": "Core Ticketing",
   "nodes": "Guard Tour NFC, HT GPS Tracker",
   "priority": "P1-P4",
   "trigger": "Tiket berstatus OPEN/ACKNOWLEDGED",
   "source": "Radio HT GPS, Patroli App",
   "protocol": "BLE/App/Radio",
   "dashboard": "TIC",
   "related": "CCTV, BMS, PARK",
   "pic": "CCO",
   "kpi": "Waktu dispatch <= target respons SLA; ETA tim akurat +/- 1 menit",
   "evidence": "Nama tim, ETA, konfirmasi radio",
   "closure": "Tim konfirmasi ON-SITE di aplikasi/radio",
   "auto_action": "Rekomendasi tim terdekat berdasarkan GPS HT & skill",
   "steps": [
    {
     "phase": "4-Dispatch",
     "role": "CCO",
     "action": "Lihat panel kesiapan tim reaksi cepat; pilih tim terdekat dengan skill sesuai (MEP/Security/HK/Parkir).",
     "dashboard": "TIC",
     "target": "T+0",
     "output": "Tim terpilih"
    },
    {
     "phase": "4-Dispatch",
     "role": "CCO",
     "action": "Kirim penugasan via Patroli App + radio channel sesuai domain (CH-01 Security, CH-02 MEP, CH-03 HK, CH-04 Parkir).",
     "dashboard": "TIC",
     "target": "T+0:30",
     "output": "Penugasan terkirim"
    },
    {
     "phase": "4-Dispatch",
     "role": "QRT",
     "action": "Tim membalas 'COPY' dan berangkat; status otomatis ON-THE-WAY dengan ETA dari GPS.",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "Status ON-THE-WAY"
    },
    {
     "phase": "5-Mitigasi",
     "role": "CCO",
     "action": "Pantau pergerakan tim via kamera rute; arahkan jalur tercepat (lift servis/tangga darurat).",
     "dashboard": "CCTV",
     "target": "Kontinu",
     "output": "Log pergerakan"
    },
    {
     "phase": "5-Mitigasi",
     "role": "QRT",
     "action": "Tiba di lokasi, tap NFC checkpoint terdekat, unggah foto kondisi awal.",
     "dashboard": "TIC",
     "target": "<= SLA respons",
     "output": "Status ON-SITE + foto"
    },
    {
     "phase": "6-Eskalasi",
     "role": "CCO",
     "action": "Jika tim tidak merespons 60 detik, re-dispatch ke tim cadangan & catat ke log kinerja vendor.",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "Re-dispatch log"
    }
   ]
  },
  {
   "id": "SOP-CC-03",
   "title": "Matriks eskalasi berjenjang & komunikasi krisis",
   "pillar": "0. Command Center (Lintas Pilar)",
   "subdomain": "Core Ticketing",
   "nodes": "Tiket Komplain SLA < 15 Menit",
   "priority": "P1-P4",
   "trigger": "SLA respons/resolusi terlampaui atau kriteria eskalasi otomatis (P1)",
   "source": "Mesin SLA SMICC-TS",
   "protocol": "Internal",
   "dashboard": "TIC",
   "related": "ANL, O360",
   "pic": "SL",
   "kpi": "100% P1 tereskalasi ke GM < 1 menit; 0 eskalasi terlewat",
   "evidence": "Log eskalasi bertimestamp, bukti panggilan",
   "closure": "Penerima eskalasi mengakui (ACK) di sistem",
   "auto_action": "Notifikasi WhatsApp/Call prioritas otomatis untuk P1",
   "steps": [
    {
     "phase": "6-Eskalasi",
     "role": "CCO",
     "action": "Sistem menandai tiket 'SLA AT RISK' pada 80% waktu SLA; operator verifikasi kendala dengan tim lapangan.",
     "dashboard": "TIC",
     "target": "80% SLA",
     "output": "Flag AT RISK"
    },
    {
     "phase": "6-Eskalasi",
     "role": "SL",
     "action": "Untuk P1: konfirmasi panggilan prioritas ke GM tersambung; bila tidak, telepon Deputy GM.",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "ACK GM"
    },
    {
     "phase": "6-Eskalasi",
     "role": "SL",
     "action": "Untuk P2: eskalasi ke GM jika belum pulih 15 menit; sertakan root cause awal & ETA.",
     "dashboard": "TIC",
     "target": "T+15",
     "output": "Pesan eskalasi"
    },
    {
     "phase": "6-Eskalasi",
     "role": "GM",
     "action": "Putuskan aktivasi Crisis Team & kebutuhan eskalasi ke Direksi/Owner serta pihak eksternal.",
     "dashboard": "ANL",
     "target": "T+5 (P1)",
     "output": "Keputusan krisis"
    },
    {
     "phase": "6-Eskalasi",
     "role": "PR",
     "action": "Siapkan holding statement jika insiden terlihat publik/viral (P1 atau P3 viral).",
     "dashboard": "ANL",
     "target": "T+30",
     "output": "Draft statement"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "SL",
     "action": "Rekap eskalasi harian & bulanan dikirim otomatis ke GM; review di rapat operasional mingguan.",
     "dashboard": "ANL",
     "target": "Harian",
     "output": "Laporan eskalasi"
    }
   ]
  },
  {
   "id": "SOP-CC-04",
   "title": "Penutupan tiket, verifikasi bukti & root cause analysis",
   "pillar": "0. Command Center (Lintas Pilar)",
   "subdomain": "Core Ticketing",
   "nodes": "Tiket Komplain SLA < 15 Menit",
   "priority": "P1-P4",
   "trigger": "Tim lapangan menandai RESOLVED",
   "source": "Patroli App, CCTV, BMS",
   "protocol": "Internal",
   "dashboard": "TIC",
   "related": "ANL, TEN",
   "pic": "SL",
   "kpi": "First Contact Resolution >= 90%; reopen rate < 3%",
   "evidence": "Foto sebelum/sesudah, rekaman CCTV, data sensor normal",
   "closure": "Bukti lengkap + konfirmasi pelapor + sensor normal",
   "auto_action": "Auto-close P4 jika sensor kembali normal 15 menit & tanpa keberatan pelapor",
   "steps": [
    {
     "phase": "7-Pemulihan",
     "role": "MEP",
     "action": "Tim lapangan unggah foto sesudah perbaikan & catatan tindakan (parts, durasi).",
     "dashboard": "TIC",
     "target": "Saat selesai",
     "output": "Foto sesudah"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "CCO",
     "action": "Verifikasi: sensor/BMS kembali normal, kamera menunjukkan area aman, pelapor (tenant/pengunjung) konfirmasi.",
     "dashboard": "BMS",
     "target": "+5 menit",
     "output": "Checklist verifikasi"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "CCO",
     "action": "Ubah status ke CLOSED; sistem kirim survei CSAT ke pelapor (tenant via app, pengunjung via QR).",
     "dashboard": "TEN",
     "target": "+5 menit",
     "output": "Survei CSAT"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "SL",
     "action": "P1/P2 atau tiket berulang (>= 3x/30 hari): wajib RCA 5-Why dalam 48 jam.",
     "dashboard": "ANL",
     "target": "<= 48 jam",
     "output": "Dokumen RCA"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "CENG",
     "action": "Tindak lanjut preventif (work order PM, perubahan setpoint, penggantian aset) dicatat & ditautkan.",
     "dashboard": "BMS",
     "target": "<= 7 hari",
     "output": "Work order PM"
    }
   ]
  },
  {
   "id": "SOP-CC-05",
   "title": "Serah terima shift (shift handover) Command Center",
   "pillar": "0. Command Center (Lintas Pilar)",
   "subdomain": "Core Ticketing",
   "nodes": "Zone Telemetry, IoT Grid Nodes",
   "priority": "-",
   "trigger": "Pergantian shift A (07-15), B (15-23), C (23-07)",
   "source": "SMICC-TS",
   "protocol": "Internal",
   "dashboard": "TIC",
   "related": "Semua",
   "pic": "SL",
   "kpi": "Handover selesai < 15 menit; 0 tiket tanpa PIC setelah handover",
   "evidence": "Form handover bertanda tangan digital",
   "closure": "Shift Lead masuk menandatangani form handover",
   "auto_action": "Ringkasan handover otomatis (tiket aktif, alarm, eskalasi)",
   "steps": [
    {
     "phase": "2-Verifikasi",
     "role": "SL",
     "action": "Generate ringkasan otomatis: tiket aktif per prioritas, SLA at risk, alarm BMS aktif, kamera offline.",
     "dashboard": "TIC",
     "target": "H-15 menit",
     "output": "Ringkasan handover"
    },
    {
     "phase": "2-Verifikasi",
     "role": "SL",
     "action": "Cek kesehatan sistem: latensi mesh, node IoT live, NVR, SCADA, radio. Catat yang degradasi.",
     "dashboard": "BMS",
     "target": "H-10 menit",
     "output": "Status sistem"
    },
    {
     "phase": "2-Verifikasi",
     "role": "SL",
     "action": "Briefing tatap muka dengan shift masuk: insiden P1/P2, pekerjaan izin kerja tenant malam, event atrium.",
     "dashboard": "TEN",
     "target": "H-5 menit",
     "output": "Notulen briefing"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "SL",
     "action": "Re-assign PIC tiket aktif ke personel shift baru; tanda tangan digital kedua Shift Lead.",
     "dashboard": "TIC",
     "target": "H+0",
     "output": "Form handover"
    }
   ]
  },
  {
   "id": "SOP-CC-06",
   "title": "Mode degradasi: sensor / sistem offline",
   "pillar": "0. Command Center (Lintas Pilar)",
   "subdomain": "Core Ticketing",
   "nodes": "IoT Grid Nodes, Core Mesh Latency",
   "priority": "P2",
   "trigger": "Node IoT offline > 5%, NVR/SCADA tidak sinkron > 2 menit, latensi mesh > 200 ms",
   "source": "Network Monitoring, SCADA heartbeat",
   "protocol": "SNMP/ICMP",
   "dashboard": "TIC",
   "related": "BMS, CCTV, ENE",
   "pic": "IT",
   "kpi": "Pemulihan sistem kritikal < 30 menit; 0 insiden tak terdeteksi selama degradasi",
   "evidence": "Log heartbeat, daftar node offline",
   "closure": "Semua node kritikal online & sinkron",
   "auto_action": "Banner 'DEGRADED MODE' + aktifkan patroli manual area terdampak",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "IT",
     "action": "Sistem memunculkan banner DEGRADED MODE dan daftar node/kamera offline per zona.",
     "dashboard": "TIC",
     "target": "T+0",
     "output": "Banner degradasi"
    },
    {
     "phase": "5-Mitigasi",
     "role": "SL",
     "action": "Aktifkan patroli manual & radio check 15 menit sekali di zona tanpa sensor.",
     "dashboard": "CCTV",
     "target": "T+5",
     "output": "Jadwal patroli manual"
    },
    {
     "phase": "5-Mitigasi",
     "role": "IT",
     "action": "Diagnosa: switch, PoE, gateway LoRaWAN, server VMS/SCADA; failover ke server cadangan.",
     "dashboard": "BMS",
     "target": "T+10",
     "output": "Hasil diagnosa"
    },
    {
     "phase": "6-Eskalasi",
     "role": "IT",
     "action": "Eskalasi ke vendor sistem jika belum pulih 30 menit (P2).",
     "dashboard": "TIC",
     "target": "T+30",
     "output": "Tiket vendor"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "IT",
     "action": "Validasi data backfill & catat periode blind-spot di laporan harian.",
     "dashboard": "ANL",
     "target": "Setelah pulih",
     "output": "Laporan blind-spot"
    }
   ]
  },
  {
   "id": "SOP-COM-01",
   "title": "Notifikasi kontrak jatuh tempo & renewal tenant",
   "pillar": "1. Commercial & Tenant Mix",
   "subdomain": "Leasing & Occupancy",
   "nodes": "Kontrak Expired, Leased vs Vacant, Anchor vs Regular",
   "priority": "-",
   "trigger": "Kontrak tenant akan habis < 12, < 6, < 3 bulan",
   "source": "ERP Property Management (SAP/Yardi)",
   "protocol": "REST API / DB Sync",
   "dashboard": "O360",
   "related": "TEN, ANL",
   "pic": "LSG",
   "kpi": "Renewal rate >= 90%; 0 unit vacant tanpa pipeline pengganti",
   "evidence": "Surat penawaran renewal, notulen negosiasi",
   "closure": "Kontrak diperpanjang atau tenant pengganti ditandatangani",
   "auto_action": "Trigger tim Leasing 6 bulan sebelum kontrak habis",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "LSG",
     "action": "Sistem menampilkan daftar kontrak jatuh tempo bucket <12/<6/<3 bulan di Komersial & Keuangan.",
     "dashboard": "O360",
     "target": "Harian",
     "output": "Daftar kontrak"
    },
    {
     "phase": "2-Verifikasi",
     "role": "LSG",
     "action": "Tarik data kinerja tenant: omzet POS, OCR, kepatuhan bayar (AR aging), tiket komplain 12 bulan.",
     "dashboard": "O360",
     "target": "H-180",
     "output": "Profil kinerja"
    },
    {
     "phase": "2-Verifikasi",
     "role": "TRO",
     "action": "Tambahkan riwayat SLA & kepatuhan regulasi gedung dari Tenant Support.",
     "dashboard": "TEN",
     "target": "H-180",
     "output": "Skor kepatuhan"
    },
    {
     "phase": "5-Mitigasi",
     "role": "LSG",
     "action": "Tentukan strategi: renewal + kenaikan tarif (zona performa tinggi), diskon (OCR > 15%), atau ganti tenant.",
     "dashboard": "O360",
     "target": "H-170",
     "output": "Rekomendasi"
    },
    {
     "phase": "6-Eskalasi",
     "role": "GM",
     "action": "Persetujuan GM untuk anchor tenant & perubahan tarif > 8%.",
     "dashboard": "ANL",
     "target": "H-150",
     "output": "Persetujuan"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "LSG",
     "action": "Perbarui status unit di PMS (Leased/Vacant/Fit-out) & pipeline leasing.",
     "dashboard": "O360",
     "target": "Saat tanda tangan",
     "output": "Status unit"
    }
   ]
  },
  {
   "id": "SOP-COM-02",
   "title": "Pemantauan fit-out & izin kerja tenant",
   "pillar": "1. Commercial & Tenant Mix",
   "subdomain": "Leasing & Occupancy",
   "nodes": "Jadwal Fit-Out",
   "priority": "P3",
   "trigger": "Pengajuan izin kerja / fit-out / hot work oleh tenant",
   "source": "Tenant App, PMS",
   "protocol": "REST API",
   "dashboard": "TEN",
   "related": "CCTV, BMS, TIC",
   "pic": "TRO",
   "kpi": "100% pekerjaan berisiko memiliki permit; 0 insiden K3 fit-out",
   "evidence": "Form izin kerja, permit hot work, daftar pekerja",
   "closure": "Pekerjaan selesai, area bersih, inspeksi HSE lulus",
   "auto_action": "E-pass pekerja otomatis & isolasi detektor asap zona hot work (terjadwal)",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "TRO",
     "action": "Terima pengajuan izin kerja via Tenant App (jenis pekerjaan, jam, pekerja, metode kerja).",
     "dashboard": "TEN",
     "target": "H-2",
     "output": "Pengajuan"
    },
    {
     "phase": "2-Verifikasi",
     "role": "HSE",
     "action": "Review risiko: hot work, ketinggian, listrik; minta JSA & APAR standby bila perlu.",
     "dashboard": "TEN",
     "target": "H-1",
     "output": "Approval HSE"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "TRO",
     "action": "Terbitkan e-pass pekerja & jadwal; untuk hot work buat tiket koordinasi ke BMS (isolasi detektor terjadwal).",
     "dashboard": "TIC",
     "target": "H-1",
     "output": "E-pass + tiket"
    },
    {
     "phase": "4-Dispatch",
     "role": "CSEC",
     "action": "Security memeriksa e-pass di loading dock; CCTV zona ditandai 'pekerjaan berizin'.",
     "dashboard": "CCTV",
     "target": "Hari-H",
     "output": "Log akses"
    },
    {
     "phase": "5-Mitigasi",
     "role": "BMSO",
     "action": "Isolasi detektor asap zona hot work sesuai jadwal; aktifkan kembali segera setelah selesai.",
     "dashboard": "BMS",
     "target": "Hari-H",
     "output": "Log isolasi"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "HSE",
     "action": "Inspeksi penutupan: area bersih, detektor aktif, tidak ada sisa panas (fire watch 30 menit).",
     "dashboard": "TEN",
     "target": "+30 menit",
     "output": "Checklist penutupan"
    }
   ]
  },
  {
   "id": "SOP-COM-03",
   "title": "Evaluasi produktivitas POS & occupancy cost ratio",
   "pillar": "1. Commercial & Tenant Mix",
   "subdomain": "POS Revenue Share",
   "nodes": "Omzet per Tenant, Revenue Share, Occupancy Cost Ratio (OCR %)",
   "priority": "-",
   "trigger": "OCR tenant > 15% atau omzet turun > 20% MoM",
   "source": "POS Tenant Aggregator / API Kasir",
   "protocol": "Webhook / SFTP Batch",
   "dashboard": "O360",
   "related": "ANL, TEN",
   "pic": "LSG",
   "kpi": "OCR konsolidasi 8-12%; tenant at-risk teridentifikasi 3 bulan lebih awal",
   "evidence": "Laporan POS bulanan, analisis OCR",
   "closure": "Rencana aksi tenant disepakati",
   "auto_action": "Evaluasi diskon sewa atau kenaikan tarif saat perpanjangan",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "LSG",
     "action": "Dashboard menandai tenant dengan OCR > 15% atau penurunan omzet > 20% MoM.",
     "dashboard": "O360",
     "target": "Bulanan",
     "output": "Daftar tenant at-risk"
    },
    {
     "phase": "2-Verifikasi",
     "role": "MKT",
     "action": "Korelasikan dengan footfall zona, dead-zone & event: apakah penurunan karena traffic?",
     "dashboard": "O360",
     "target": "+3 hari",
     "output": "Analisis traffic"
    },
    {
     "phase": "5-Mitigasi",
     "role": "LSG",
     "action": "Susun opsi: program co-marketing, relokasi, restrukturisasi sewa, turnover rent.",
     "dashboard": "O360",
     "target": "+7 hari",
     "output": "Opsi aksi"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "GM",
     "action": "Review bulanan di rapat komersial; keputusan dicatat di pipeline leasing.",
     "dashboard": "ANL",
     "target": "Bulanan",
     "output": "Keputusan"
    }
   ]
  },
  {
   "id": "SOP-COM-04",
   "title": "Monetisasi non-sewa: atrium, kiosk, LED & naming rights",
   "pillar": "1. Commercial & Tenant Mix",
   "subdomain": "Monetisasi Non-Sewa",
   "nodes": "Sewa Atrium/Kiosk, LED Indoor/Fasad, Naming Rights",
   "priority": "-",
   "trigger": "Permintaan booking atrium/LED atau slot kosong > 14 hari",
   "source": "CRM, Booking System",
   "protocol": "REST API",
   "dashboard": "O360",
   "related": "CCTV, BMS, TEN",
   "pic": "MKT",
   "kpi": "Utilisasi atrium >= 75%; pendapatan non-sewa sesuai target bulanan",
   "evidence": "Kontrak booking, layout, izin keamanan",
   "closure": "Event selesai, area kembali normal, invoice terbit",
   "auto_action": "Rekomendasi penempatan event di dead-zone",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "MKT",
     "action": "Cek kalender atrium/LED & rekomendasi lokasi dari heatmap dead-zone.",
     "dashboard": "O360",
     "target": "H-30",
     "output": "Slot tersedia"
    },
    {
     "phase": "2-Verifikasi",
     "role": "HSE",
     "action": "Review layout, beban lantai, jalur evakuasi, kapasitas kerumunan.",
     "dashboard": "TEN",
     "target": "H-14",
     "output": "Approval layout"
    },
    {
     "phase": "4-Dispatch",
     "role": "CSEC",
     "action": "Rencana pengamanan event: personel, kamera crowd density, threshold kerumunan.",
     "dashboard": "CCTV",
     "target": "H-3",
     "output": "Rencana pengamanan"
    },
    {
     "phase": "5-Mitigasi",
     "role": "BMSO",
     "action": "Jadwalkan pre-cooling AHU atrium & daya listrik tambahan event.",
     "dashboard": "BMS",
     "target": "H-1",
     "output": "Jadwal BMS"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "FIN",
     "action": "Terbitkan invoice & hitung ROI event (footfall, basket size) untuk laporan.",
     "dashboard": "O360",
     "target": "H+3",
     "output": "Invoice & ROI"
    }
   ]
  },
  {
   "id": "SOP-COM-05",
   "title": "Penanganan permintaan & komplain tenant (tenant helpdesk)",
   "pillar": "1. Commercial & Tenant Mix",
   "subdomain": "Tenant Support",
   "nodes": "Anchor vs Regular, Komplain AC/Bau",
   "priority": "P2-P4",
   "trigger": "Tenant mengirim komplain via Tenant App / WhatsApp / telepon",
   "source": "Tenant App, WhatsApp Business API",
   "protocol": "Webhook",
   "dashboard": "TEN",
   "related": "TIC, BMS, ENE",
   "pic": "TRO",
   "kpi": "First response <= 8.4 menit; CSAT tenant >= 4.6/5; SLA tenant >= 95%",
   "evidence": "Log percakapan terpadu, tiket, data sub-meter",
   "closure": "Tenant konfirmasi selesai + CSAT terisi",
   "auto_action": "Template respons cepat & tiket otomatis dari chat",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "TRO",
     "action": "Pesan tenant masuk ke log percakapan tenant; bot mengklasifikasikan kategori (HVAC, listrik, kebersihan, izin).",
     "dashboard": "TEN",
     "target": "T+0",
     "output": "Kategori awal"
    },
    {
     "phase": "2-Verifikasi",
     "role": "TRO",
     "action": "Cek data pendukung: sub-meter IoT unit (suhu, beban kW, tekanan air) di inspector profil tenant.",
     "dashboard": "TEN",
     "target": "T+2",
     "output": "Data sensor"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "TRO",
     "action": "Konversi chat menjadi tiket (prioritas: anchor tenant +1 level) & tautkan ke tenant & unit.",
     "dashboard": "TIC",
     "target": "T+3",
     "output": "Tiket #TCK"
    },
    {
     "phase": "4-Dispatch",
     "role": "CCO",
     "action": "Dispatch teknisi zona; kirim template respons 'Konfirmasi Jadwal MEP' ke tenant.",
     "dashboard": "TIC",
     "target": "T+5",
     "output": "Respons ke tenant"
    },
    {
     "phase": "5-Mitigasi",
     "role": "MEP",
     "action": "Tindakan teknis (kalibrasi VAV, cek panel, dll). Update progres ke chat tenant otomatis.",
     "dashboard": "BMS",
     "target": "Sesuai SLA",
     "output": "Progress update"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "TRO",
     "action": "Konfirmasi ke store manager; tutup tiket; survei CSAT; catat ke skor kepuasan tenant.",
     "dashboard": "TEN",
     "target": "Saat selesai",
     "output": "CSAT"
    }
   ]
  },
  {
   "id": "SOP-COM-06",
   "title": "Izin overtime AC & loading dock tenant",
   "pillar": "1. Commercial & Tenant Mix",
   "subdomain": "Tenant Support",
   "nodes": "Jadwal Fit-Out, Smart Sub-Meter",
   "priority": "P3",
   "trigger": "Permintaan overtime AC di luar jam operasional / slot bongkar muat",
   "source": "Tenant App",
   "protocol": "REST API",
   "dashboard": "TEN",
   "related": "BMS, ENE, CCTV, FIN",
   "pic": "TRO",
   "kpi": "Persetujuan <= 2 jam; 100% overtime tertagih",
   "evidence": "Form overtime, log BMS, data sub-meter",
   "closure": "Overtime selesai & tagihan otomatis terbit",
   "auto_action": "Penjadwalan AHU otomatis & tagihan utilitas tenant otomatis",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "TRO",
     "action": "Terima permintaan (jam mulai/selesai, zona AHU, alasan) dari Tenant App.",
     "dashboard": "TEN",
     "target": "T+0",
     "output": "Permintaan"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CENG",
     "action": "Cek kapasitas chiller & AHU zona di jam tersebut.",
     "dashboard": "BMS",
     "target": "T+30",
     "output": "Kelayakan teknis"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "TRO",
     "action": "Setujui & jadwalkan AHU di BMS; untuk loading dock tetapkan bay & jam.",
     "dashboard": "BMS",
     "target": "T+60",
     "output": "Jadwal AHU/bay"
    },
    {
     "phase": "4-Dispatch",
     "role": "CSEC",
     "action": "Informasikan pos security loading dock & akses gerbang di jam tersebut.",
     "dashboard": "CCTV",
     "target": "Hari-H",
     "output": "Akses dibuka"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "FIN",
     "action": "Hitung konsumsi kWh overtime dari sub-meter & terbitkan tagihan otomatis.",
     "dashboard": "ENE",
     "target": "H+1",
     "output": "Invoice overtime"
    }
   ]
  },
  {
   "id": "SOP-VIS-01",
   "title": "Respons kepadatan pengunjung & crowd flow",
   "pillar": "2. Visitor & Experience",
   "subdomain": "Footfall & Crowd Flow",
   "nodes": "Traffic per Pintu, Pergerakan Lantai, Deteksi Kerumunan",
   "priority": "P2-P3",
   "trigger": "Kepadatan zona > 80% kapasitas atau laju aliran > 150 orang/menit",
   "source": "3D Stereoscopic Camera & Wi-Fi AP, AI CCTV",
   "protocol": "MQTT / RTSP Analytics",
   "dashboard": "CCTV",
   "related": "TIC, BMS, O360",
   "pic": "CSEC",
   "kpi": "0 insiden desak-desakan; waktu respons kepadatan <= 5 menit",
   "evidence": "Snapshot heatmap, rekaman CCTV",
   "closure": "Kepadatan < 70% selama 15 menit",
   "auto_action": "Penyesuaian HVAC mengikuti kepadatan; pengalihan arus pengunjung",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CCO",
     "action": "Alert kepadatan dari people counter/AI CCTV muncul di grid kamera (badge Kerapatan).",
     "dashboard": "CCTV",
     "target": "T+0",
     "output": "Alert kepadatan"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CCO",
     "action": "Verifikasi visual multi-kamera; cek apakah ada event atrium/promo.",
     "dashboard": "CCTV",
     "target": "T+1",
     "output": "Verifikasi"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Buat tiket kategori Crowd (P3; naik P2 bila > 95% atau ada dorong-dorongan).",
     "dashboard": "TIC",
     "target": "T+2",
     "output": "Tiket"
    },
    {
     "phase": "4-Dispatch",
     "role": "CSEC",
     "action": "Kirim regu patroli untuk crowd control; buka jalur alternatif & pintu tambahan.",
     "dashboard": "CCTV",
     "target": "T+3",
     "output": "Regu on-site"
    },
    {
     "phase": "5-Mitigasi",
     "role": "BMSO",
     "action": "Naikkan suplai udara AHU zona (CO2 > 900 ppm) & cek eskalator arah aliran.",
     "dashboard": "BMS",
     "target": "T+5",
     "output": "Setpoint AHU"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "MKT",
     "action": "Catat data puncak kepadatan untuk perencanaan event berikutnya.",
     "dashboard": "O360",
     "target": "H+1",
     "output": "Laporan crowd"
    }
   ]
  },
  {
   "id": "SOP-VIS-02",
   "title": "Aktivasi dead-zone & evaluasi ROI event atrium",
   "pillar": "2. Visitor & Experience",
   "subdomain": "Heatmap & Zoning",
   "nodes": "Deteksi Dead-Zone, Dwell Time (Menit), ROI Event Atrium",
   "priority": "-",
   "trigger": "Zona dengan traffic < 40% rata-rata lantai selama 14 hari",
   "source": "3D People Counter, Wi-Fi Analytics, CRM",
   "protocol": "MQTT / REST",
   "dashboard": "O360",
   "related": "ANL, TEN",
   "pic": "MKT",
   "kpi": "Kenaikan traffic dead-zone >= 15% pasca aktivasi; ROI event >= 3x",
   "evidence": "Heatmap sebelum/sesudah, data struk member",
   "closure": "Evaluasi ROI terdokumentasi",
   "auto_action": "Penyesuaian harga sewa zona & penempatan event di area dead-zone",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "MKT",
     "action": "Heatmap menandai dead-zone; sistem menampilkan dwell time & tenant terdampak.",
     "dashboard": "O360",
     "target": "Mingguan",
     "output": "Daftar dead-zone"
    },
    {
     "phase": "5-Mitigasi",
     "role": "MKT",
     "action": "Rencanakan aktivasi (pop-up, event, signage, rute promo) bersama Leasing.",
     "dashboard": "O360",
     "target": "+7 hari",
     "output": "Rencana aktivasi"
    },
    {
     "phase": "4-Dispatch",
     "role": "TRO",
     "action": "Informasikan tenant zona tentang program & ajak co-promo.",
     "dashboard": "TEN",
     "target": "+10 hari",
     "output": "Broadcast tenant"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "MKT",
     "action": "Ukur dampak: footfall, dwell time, basket size member, omzet tenant zona.",
     "dashboard": "ANL",
     "target": "+30 hari",
     "output": "Laporan ROI"
    }
   ]
  },
  {
   "id": "SOP-VIS-03",
   "title": "Feedback pengunjung omnichannel (QR toilet, app, review)",
   "pillar": "2. Visitor & Experience",
   "subdomain": "Omnichannel Feedback",
   "nodes": "QR Code Toilet, Komplain AC/Bau, Review Medsos",
   "priority": "P4",
   "trigger": "Pengunjung scan QR / rating app <= 2 / komplain kanal digital",
   "source": "QR Feedback Toilet, App, Social Listening",
   "protocol": "Webhook / NLP API",
   "dashboard": "TIC",
   "related": "CCTV, BMS, ANL",
   "pic": "CCO",
   "kpi": "Tiket otomatis ke tim dengan SLA < 15 menit respons; CSAT >= 4.6",
   "evidence": "Feedback asli, foto sesudah",
   "closure": "Area diperbaiki & feedback ditutup dengan balasan",
   "auto_action": "Tiket otomatis ke tim Housekeeping/Teknisi dengan SLA < 15 menit",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CCO",
     "action": "Feedback masuk & diklasifikasi NLP (kebersihan, AC, bau, fasilitas rusak).",
     "dashboard": "TIC",
     "target": "T+0",
     "output": "Tiket otomatis P4"
    },
    {
     "phase": "4-Dispatch",
     "role": "HK",
     "action": "Housekeeping/Teknisi zona menerima push di Patroli App.",
     "dashboard": "TIC",
     "target": "T+2",
     "output": "Penugasan"
    },
    {
     "phase": "5-Mitigasi",
     "role": "HK",
     "action": "Tindakan di lokasi & unggah foto sesudah.",
     "dashboard": "TIC",
     "target": "<= 15 menit",
     "output": "Foto sesudah"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "CS",
     "action": "Balas pengunjung (app/medsos) bahwa keluhan telah ditangani.",
     "dashboard": "TIC",
     "target": "Saat selesai",
     "output": "Balasan"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "SL",
     "action": "Agregasi feedback per toilet/zona untuk evaluasi vendor bulanan.",
     "dashboard": "ANL",
     "target": "Bulanan",
     "output": "Skor vendor"
    }
   ]
  },
  {
   "id": "SOP-VIS-04",
   "title": "Krisis sentimen medsos / isu viral",
   "pillar": "2. Visitor & Experience",
   "subdomain": "Sentimen & CSAT",
   "nodes": "Review Medsos",
   "priority": "P2",
   "trigger": "Lonjakan sentimen negatif > 3x baseline atau konten viral terkait mall",
   "source": "Social Listening (NLP)",
   "protocol": "API",
   "dashboard": "ANL",
   "related": "TIC, CCTV, TEN",
   "pic": "PR",
   "kpi": "Holding statement <= 60 menit; sentimen kembali baseline <= 72 jam",
   "evidence": "Tangkapan layar, rekaman CCTV terkait",
   "closure": "Isu terklarifikasi & tindakan korektif selesai",
   "auto_action": "Alert sentimen & tautan ke tiket/rekaman terkait",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "PR",
     "action": "Alert lonjakan sentimen; identifikasi waktu & lokasi kejadian dari konten.",
     "dashboard": "ANL",
     "target": "T+0",
     "output": "Alert sentimen"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CCO",
     "action": "Cari rekaman CCTV & tiket terkait di waktu/lokasi tersebut.",
     "dashboard": "CCTV",
     "target": "T+15",
     "output": "Bukti faktual"
    },
    {
     "phase": "6-Eskalasi",
     "role": "GM",
     "action": "Brief GM; putuskan pernyataan & tindakan korektif.",
     "dashboard": "ANL",
     "target": "T+30",
     "output": "Keputusan"
    },
    {
     "phase": "5-Mitigasi",
     "role": "PR",
     "action": "Publikasi holding statement & respons personal ke pengunggah.",
     "dashboard": "ANL",
     "target": "T+60",
     "output": "Statement"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "PR",
     "action": "Monitor sentimen 72 jam & laporan dampak.",
     "dashboard": "ANL",
     "target": "+72 jam",
     "output": "Laporan krisis"
    }
   ]
  },
  {
   "id": "SOP-VIS-05",
   "title": "Program loyalty, konversi & basket size member",
   "pillar": "2. Visitor & Experience",
   "subdomain": "Loyalty & CRM",
   "nodes": "Akuisisi Member, Basket Size Struk, Konversi per Jam",
   "priority": "-",
   "trigger": "Konversi pengunjung->transaksi per jam < 18% atau akuisisi member < target mingguan",
   "source": "Mobile App Summarecon Mall & CRM, People Counter",
   "protocol": "REST API / GraphQL",
   "dashboard": "O360",
   "related": "ANL, TEN",
   "pic": "MKT",
   "kpi": "Konversi >= 20%; basket size member +10% YoY; akuisisi member sesuai target",
   "evidence": "Laporan CRM, struk ter-scan",
   "closure": "Kampanye dievaluasi & anggaran direalokasi",
   "auto_action": "Alokasi budget marketing ke event yang menghasilkan konversi belanja tertinggi",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "MKT",
     "action": "Dashboard menampilkan konversi per jam (struk ter-scan / footfall) & akuisisi member per kanal.",
     "dashboard": "O360",
     "target": "Harian",
     "output": "Tren konversi"
    },
    {
     "phase": "2-Verifikasi",
     "role": "MKT",
     "action": "Bandingkan dengan jadwal event, cuaca, dan promo tenant; identifikasi jam/zona konversi rendah.",
     "dashboard": "O360",
     "target": "Mingguan",
     "output": "Analisis gap"
    },
    {
     "phase": "5-Mitigasi",
     "role": "MKT",
     "action": "Aktifkan push promo app berbasis lokasi (beacon) di jam konversi rendah & program scan struk berhadiah.",
     "dashboard": "O360",
     "target": "+1 hari",
     "output": "Kampanye aktif"
    },
    {
     "phase": "4-Dispatch",
     "role": "TRO",
     "action": "Koordinasikan promo bersama tenant zona (co-funding voucher).",
     "dashboard": "TEN",
     "target": "+3 hari",
     "output": "Kesepakatan tenant"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "MKT",
     "action": "Ukur basket size member & ROI kampanye; realokasi budget ke kanal terbaik.",
     "dashboard": "ANL",
     "target": "Bulanan",
     "output": "Laporan ROI CRM"
    }
   ]
  },
  {
   "id": "SOP-BMS-01",
   "title": "Anomali HVAC & chiller (trip, suhu zona, CO2)",
   "pillar": "3. Smart BMS & Engineering",
   "subdomain": "HVAC & Chiller Plant",
   "nodes": "Suhu/Kelembaban, Beban kW/TR, Sensor CO2 Udara",
   "priority": "P2-P4",
   "trigger": "Chiller trip / COP < 5.5 / suhu zona > 26 C / CO2 > 1000 ppm",
   "source": "BMS SCADA, IoT Temp/CO2 Sensors",
   "protocol": "BACnet / Modbus TCP",
   "dashboard": "BMS",
   "related": "TIC, TEN, ENE",
   "pic": "CENG",
   "kpi": "Uptime HVAC >= 99.5%; suhu zona 22-24 C",
   "evidence": "Trend log BMS, kode fault, foto",
   "closure": "Parameter normal 30 menit & tenant terdampak konfirmasi",
   "auto_action": "Auto-modulation Chiller mengikuti kepadatan pengunjung (hemat listrik 15-25%)",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "BMSO",
     "action": "Alarm BMS: chiller trip/COP drop/suhu atau CO2 zona di luar ambang muncul di Fasilitas & BMS.",
     "dashboard": "BMS",
     "target": "T+0",
     "output": "Alarm BMS"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tiket otomatis: chiller utama trip = P2, suhu zona/CO2 = P4 (P3 jika anchor/>3 tenant).",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "Tiket"
    },
    {
     "phase": "5-Mitigasi",
     "role": "BMSO",
     "action": "Start chiller standby / naikkan kapasitas chiller lain; cek supply/return CHW.",
     "dashboard": "BMS",
     "target": "T+3",
     "output": "Chiller standby running"
    },
    {
     "phase": "4-Dispatch",
     "role": "MEP",
     "action": "Teknisi ke plant/AHU: cek kode fault, VFD, flow, kondensor, damper VAV.",
     "dashboard": "BMS",
     "target": "T+5",
     "output": "Diagnosa lapangan"
    },
    {
     "phase": "4-Dispatch",
     "role": "TRO",
     "action": "Informasikan tenant terdampak (suhu) via template respons & ETA.",
     "dashboard": "TEN",
     "target": "T+5",
     "output": "Notifikasi tenant"
    },
    {
     "phase": "6-Eskalasi",
     "role": "CENG",
     "action": "Bila P2 belum pulih 15 menit -> eskalasi GM; hubungi vendor OEM.",
     "dashboard": "TIC",
     "target": "T+15",
     "output": "Eskalasi"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "ENM",
     "action": "Analisis dampak energi (kWh, COP) & rekomendasi (descaling, setpoint reset).",
     "dashboard": "ENE",
     "target": "H+1",
     "output": "Laporan dampak"
    }
   ]
  },
  {
   "id": "SOP-BMS-02",
   "title": "Kebocoran pipa & genangan air (chiller, PDAM, malam hari)",
   "pillar": "3. Smart BMS & Engineering",
   "subdomain": "Water & Waste Management",
   "nodes": "Debit PDAM/Sumur, Air & Lingkungan",
   "priority": "P2",
   "trigger": "Penurunan tekanan pipa > 15% / flow malam > baseline / laporan genangan",
   "source": "Smart Flow Meter, Sensor Akustik Pipa, BMS",
   "protocol": "LoRaWAN / NB-IoT",
   "dashboard": "BMS",
   "related": "TIC, CCTV, TEN, ENE",
   "pic": "CENG",
   "kpi": "Isolasi kebocoran <= 10 menit; 0 insiden terpeleset",
   "evidence": "Foto genangan, data flow/tekanan, CCTV",
   "closure": "Pipa diperbaiki, area kering, tekanan normal",
   "auto_action": "Deteksi dini kebocoran pipa malam hari",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "BMSO",
     "action": "Alarm tekanan/flow atau laporan genangan (CCTV/Patroli).",
     "dashboard": "BMS",
     "target": "T+0",
     "output": "Alarm"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CCO",
     "action": "Verifikasi visual via kamera zona; cek risiko terhadap pengunjung & panel listrik.",
     "dashboard": "CCTV",
     "target": "T+1",
     "output": "Verifikasi"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Buat tiket P2 (pipa utama) / P3 (lokal); tautkan kamera & aset BMS.",
     "dashboard": "TIC",
     "target": "T+2",
     "output": "Tiket"
    },
    {
     "phase": "5-Mitigasi",
     "role": "HK",
     "action": "Pasang yellow cone, barikade, wet vac; arahkan pengunjung memutar.",
     "dashboard": "TIC",
     "target": "T+5",
     "output": "Area aman"
    },
    {
     "phase": "5-Mitigasi",
     "role": "MEP",
     "action": "Tutup valve isolasi segmen; pasang pompa submersible bila perlu.",
     "dashboard": "BMS",
     "target": "T+10",
     "output": "Valve tertutup"
    },
    {
     "phase": "4-Dispatch",
     "role": "TRO",
     "action": "Informasikan tenant sekitar (risiko air ke unit/stok).",
     "dashboard": "TEN",
     "target": "T+10",
     "output": "Notifikasi tenant"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "ENM",
     "action": "Hitung volume air hilang & biaya; update neraca air.",
     "dashboard": "ENE",
     "target": "H+1",
     "output": "Laporan kehilangan air"
    }
   ]
  },
  {
   "id": "SOP-BMS-03",
   "title": "Pemadaman PLN & kegagalan sinkronisasi genset",
   "pillar": "3. Smart BMS & Engineering",
   "subdomain": "Smart Energy & Power",
   "nodes": "Status Genset/PV, Peak Load (kVA)",
   "priority": "P2",
   "trigger": "Tegangan PLN hilang / ATS gagal transfer / genset gagal sinkron",
   "source": "Smart Power Meter, ATS, Genset Controller",
   "protocol": "Modbus TCP",
   "dashboard": "BMS",
   "related": "TIC, ENE, TEN, CCTV",
   "pic": "CENG",
   "kpi": "ATS transfer <= 12 detik; daya kritikal pulih <= 30 menit",
   "evidence": "Log ATS/genset, data beban",
   "closure": "Suplai normal (PLN/genset) & seluruh sistem kritikal online",
   "auto_action": "Load shedding otomatis beban non-kritikal",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "BMSO",
     "action": "Alarm power failure & status ATS/genset di panel Gardu Trafo & Genset.",
     "dashboard": "BMS",
     "target": "T+0",
     "output": "Alarm"
    },
    {
     "phase": "5-Mitigasi",
     "role": "BMSO",
     "action": "Pastikan beban life-safety (FACP, lift evakuasi, lampu darurat, CCTV) ter-backup UPS/genset.",
     "dashboard": "BMS",
     "target": "T+1",
     "output": "Beban kritikal aman"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tiket P2; kirim instruksi radio ke Security untuk cek lift terjebak.",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "Tiket"
    },
    {
     "phase": "4-Dispatch",
     "role": "QRT",
     "action": "Cek seluruh lift (penumpang terjebak) & pandu pengunjung di area gelap.",
     "dashboard": "CCTV",
     "target": "T+3",
     "output": "Laporan lift"
    },
    {
     "phase": "5-Mitigasi",
     "role": "MEP",
     "action": "Sinkronisasi manual genset; load shedding non-kritikal (fasad, sebagian AHU).",
     "dashboard": "ENE",
     "target": "T+5",
     "output": "Genset online"
    },
    {
     "phase": "6-Eskalasi",
     "role": "CENG",
     "action": "Hubungi PLN; eskalasi GM bila > 15 menit.",
     "dashboard": "TIC",
     "target": "T+15",
     "output": "Eskalasi"
    },
    {
     "phase": "4-Dispatch",
     "role": "TRO",
     "action": "Broadcast tenant: status listrik & estimasi pemulihan.",
     "dashboard": "TEN",
     "target": "T+10",
     "output": "Broadcast"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "CENG",
     "action": "Kembalikan ke PLN, audit konsumsi solar, RCA.",
     "dashboard": "ENE",
     "target": "Setelah pulih",
     "output": "RCA"
    }
   ]
  },
  {
   "id": "SOP-BMS-04",
   "title": "Peak load / load shedding waktu beban puncak (WBP)",
   "pillar": "3. Smart BMS & Engineering",
   "subdomain": "Smart Energy & Power",
   "nodes": "Peak Load (kVA), Smart Sub-Meter",
   "priority": "P3",
   "trigger": "Beban total mendekati 90% batas kontrak PLN pada WBP 18:00-22:00",
   "source": "Smart Digital Power Meter",
   "protocol": "Modbus TCP / LoRaWAN",
   "dashboard": "ENE",
   "related": "BMS, TEN, ANL",
   "pic": "ENM",
   "kpi": "Tidak melampaui batas kontrak kVA; penghematan WBP sesuai target",
   "evidence": "Profil beban 24 jam",
   "closure": "Beban < 85% batas kontrak",
   "auto_action": "Load shedding otomatis saat beban puncak & tagihan utilitas tenant otomatis",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "ENM",
     "action": "Profil beban 24 jam memproyeksikan beban melewati 90% batas di WBP.",
     "dashboard": "ENE",
     "target": "T-30 menit",
     "output": "Alert prediksi"
    },
    {
     "phase": "5-Mitigasi",
     "role": "BMSO",
     "action": "Aktifkan peak shaving: BESS discharge, pre-cooling, reset setpoint CHW +0.5 C.",
     "dashboard": "BMS",
     "target": "T-15",
     "output": "Mode peak shaving"
    },
    {
     "phase": "5-Mitigasi",
     "role": "BMSO",
     "action": "Dimming DALI 40% parkir & fasad; eskalator mode slow-speed.",
     "dashboard": "BMS",
     "target": "T+0",
     "output": "Beban turun"
    },
    {
     "phase": "4-Dispatch",
     "role": "TRO",
     "action": "Himbau tenant boros (top 4 sub-meter) mengurangi beban non-esensial.",
     "dashboard": "TEN",
     "target": "T+0",
     "output": "Himbauan"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "ENM",
     "action": "Laporan penghematan WBP & biaya ke Analitik & Laporan.",
     "dashboard": "ANL",
     "target": "Harian",
     "output": "Laporan"
    }
   ]
  },
  {
   "id": "SOP-BMS-05",
   "title": "Gangguan lift & eskalator (trip / penumpang terjebak)",
   "pillar": "3. Smart BMS & Engineering",
   "subdomain": "Vertical Transport",
   "nodes": "Uptime Lift/Eskalator",
   "priority": "P1-P3",
   "trigger": "PLC fault code eskalator/lift, tombol darurat kabin, laporan pengunjung",
   "source": "Controller Lift/Eskalator & Vibration IoT",
   "protocol": "BACnet / OPC-UA",
   "dashboard": "BMS",
   "related": "TIC, CCTV",
   "pic": "CENG",
   "kpi": "Pembebasan penumpang terjebak <= 15 menit; uptime >= 99.5%",
   "evidence": "Kode fault, rekaman CCTV, foto",
   "closure": "Unit uji jalan aman & dibuka kembali",
   "auto_action": "Stop darurat otomatis & barikade digital (signage)",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "BMSO",
     "action": "Status eskalator/lift berubah TRIP; kode fault (mis. comb-plate) tampil di panel transport vertikal.",
     "dashboard": "BMS",
     "target": "T+0",
     "output": "Alarm fault"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CCO",
     "action": "Buka kamera eskalator/lift: cek korban, penumpang terjebak, kerumunan.",
     "dashboard": "CCTV",
     "target": "T+1",
     "output": "Verifikasi"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tiket: penumpang terjebak/cedera = P1; unit berhenti tanpa korban = P3.",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "Tiket"
    },
    {
     "phase": "4-Dispatch",
     "role": "QRT",
     "action": "Security barikade & arahkan pengunjung ke unit lain; komunikasi intercom kabin.",
     "dashboard": "CCTV",
     "target": "T+3",
     "output": "Area aman"
    },
    {
     "phase": "5-Mitigasi",
     "role": "MEP",
     "action": "Teknisi bersertifikat lakukan rescue/inspeksi; ganti komponen bila perlu.",
     "dashboard": "BMS",
     "target": "T+5",
     "output": "Tindakan teknis"
    },
    {
     "phase": "6-Eskalasi",
     "role": "CENG",
     "action": "Panggil vendor OEM bila kerusakan mayor; eskalasi GM bila P1.",
     "dashboard": "TIC",
     "target": "T+15",
     "output": "Vendor dipanggil"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "CENG",
     "action": "Uji jalan, buka kembali, catat downtime & RCA.",
     "dashboard": "ANL",
     "target": "Setelah pulih",
     "output": "Laporan downtime"
    }
   ]
  },
  {
   "id": "SOP-BMS-06",
   "title": "Predictive maintenance transport vertikal (getaran motor)",
   "pillar": "3. Smart BMS & Engineering",
   "subdomain": "Vertical Transport",
   "nodes": "Sensor Getaran Motor, Uptime Lift/Eskalator",
   "priority": "P3",
   "trigger": "Getaran > 2.8 mm/s atau suhu motor > 75 C (tren naik 7 hari)",
   "source": "Vibration IoT & Controller",
   "protocol": "BACnet / OPC-UA",
   "dashboard": "BMS",
   "related": "TIC, ANL",
   "pic": "CENG",
   "kpi": "0 kerusakan tak terencana akhir pekan; downtime tak terencana < 2 jam/bulan",
   "evidence": "Trend getaran/suhu",
   "closure": "Parameter kembali di bawah ambang",
   "auto_action": "Predictive maintenance sebelum eskalator mati saat akhir pekan",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "BMSO",
     "action": "Model prediktif menandai unit dengan tren getaran/suhu naik.",
     "dashboard": "BMS",
     "target": "Harian",
     "output": "Daftar unit at-risk"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CENG",
     "action": "Buat work order PM terjadwal di jam non-operasional (P3).",
     "dashboard": "TIC",
     "target": "H+0",
     "output": "Work order"
    },
    {
     "phase": "5-Mitigasi",
     "role": "MEP",
     "action": "Pelumasan, alignment, ganti bearing/step chain sesuai temuan.",
     "dashboard": "BMS",
     "target": "Malam hari",
     "output": "Laporan PM"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "CENG",
     "action": "Validasi parameter normal 48 jam & update MTBF di Analitik & Laporan.",
     "dashboard": "ANL",
     "target": "+48 jam",
     "output": "Validasi"
    }
   ]
  },
  {
   "id": "SOP-BMS-07",
   "title": "Kualitas efluen STP/IPAL & pengelolaan sampah",
   "pillar": "3. Smart BMS & Engineering",
   "subdomain": "Water & Waste Management",
   "nodes": "Kualitas Air IPAL, Tonase Sampah",
   "priority": "P3",
   "trigger": "pH di luar 6-9, COD/BOD melampaui baku mutu, tonase sampah > kapasitas TPS",
   "source": "Water Quality Sensor, Timbangan TPS",
   "protocol": "LoRaWAN / NB-IoT",
   "dashboard": "ENE",
   "related": "BMS, TIC, ANL",
   "pic": "HSE",
   "kpi": "100% kepatuhan baku mutu (Permen LHK P.68/2016); daur ulang air >= 40%",
   "evidence": "Log kualitas air, manifest sampah",
   "closure": "Parameter efluen sesuai baku mutu",
   "auto_action": "Kepatuhan regulasi lingkungan (Green Building)",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "ENM",
     "action": "Sensor kualitas air/tonase memberi alert di Neraca Air & STP.",
     "dashboard": "ENE",
     "target": "T+0",
     "output": "Alert"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tiket P3 ke HSE & MEP STP.",
     "dashboard": "TIC",
     "target": "T+10",
     "output": "Tiket"
    },
    {
     "phase": "5-Mitigasi",
     "role": "MEP",
     "action": "Penyesuaian dosis bakteri/aerasi; stop bypass ke saluran kota bila melanggar.",
     "dashboard": "BMS",
     "target": "T+60",
     "output": "Tindakan"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "HSE",
     "action": "Uji lab pihak ketiga & laporan kepatuhan bulanan ESG.",
     "dashboard": "ANL",
     "target": "Bulanan",
     "output": "Laporan ESG"
    }
   ]
  },
  {
   "id": "SOP-PRK-01",
   "title": "Antrean gate parkir masuk > 8 mobil",
   "pillar": "4. Parking & Mobility",
   "subdomain": "Gate & Cashless Revenue",
   "nodes": "Kecepatan Masuk, Rekonsiliasi QRIS",
   "priority": "P3",
   "trigger": "ANPR queue alert > 8 mobil atau waktu antrean gate > 15 detik/mobil",
   "source": "ANPR Camera & Gate Telemetry",
   "protocol": "REST API",
   "dashboard": "PARK",
   "related": "TIC, CCTV",
   "pic": "PKR",
   "kpi": "Waktu antrean gate <= 15 detik; antrean > 10 mobil = 0 kejadian/hari",
   "evidence": "Snapshot ANPR, log gate",
   "closure": "Antrean < 4 mobil selama 15 menit",
   "auto_action": "Buka gate tambahan otomatis jika antrean > 8 mobil",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "PKR",
     "action": "Alert antrean dari ANPR tampil di Parkir & Mobilitas.",
     "dashboard": "PARK",
     "target": "T+0",
     "output": "Alert antrean"
    },
    {
     "phase": "5-Mitigasi",
     "role": "PKR",
     "action": "Sistem membuka gate tambahan otomatis (reversible lane); verifikasi gate berfungsi.",
     "dashboard": "PARK",
     "target": "T+1",
     "output": "Gate tambahan aktif"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CCO",
     "action": "Cek kamera jalan akses: antrean meluber ke jalan raya?",
     "dashboard": "CCTV",
     "target": "T+2",
     "output": "Verifikasi"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Bila > 10 mobil atau gate error: tiket P3 & dispatch petugas parkir manual.",
     "dashboard": "TIC",
     "target": "T+3",
     "output": "Tiket"
    },
    {
     "phase": "4-Dispatch",
     "role": "PKR",
     "action": "Petugas lakukan manual tapping/handheld QRIS & atur lalu lintas.",
     "dashboard": "PARK",
     "target": "T+5",
     "output": "Antrean terurai"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "PKR",
     "action": "Catat penyebab (reader error, saldo kartu, lonjakan) untuk evaluasi.",
     "dashboard": "ANL",
     "target": "Harian",
     "output": "Laporan gate"
    }
   ]
  },
  {
   "id": "SOP-PRK-06",
   "title": "Smart parking guidance & optimasi turnover slot",
   "pillar": "4. Parking & Mobility",
   "subdomain": "Smart Parking Guidance",
   "nodes": "Slot Kosong/Zona, Durasi & Turnover, Parkir VIP & EV",
   "priority": "P4",
   "trigger": "Okupansi zona > 95% atau turnover < 3.8 putaran/slot/hari atau sensor bay error",
   "source": "Ultrasonic Bay Sensor & LPR Camera",
   "protocol": "TCP/IP / RS-485",
   "dashboard": "PARK",
   "related": "TIC, O360, ANL",
   "pic": "PKR",
   "kpi": "Turnover >= 3.8 putaran/slot/hari; waktu cari parkir <= 3 menit",
   "evidence": "Snapshot okupansi, log sensor bay",
   "closure": "Layar LED akurat & distribusi okupansi seimbang",
   "auto_action": "Update layar LED penunjuk slot kosong & rekayasa arus lalu lintas internal",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "PKR",
     "action": "Panel okupansi menandai zona penuh (> 95%) atau sensor bay tidak terbaca.",
     "dashboard": "PARK",
     "target": "T+0",
     "output": "Alert okupansi"
    },
    {
     "phase": "5-Mitigasi",
     "role": "PKR",
     "action": "Sistem mengalihkan arahan LED ke zona kosong; petugas memasang rambu 'PENUH'.",
     "dashboard": "PARK",
     "target": "T+2",
     "output": "LED diperbarui"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Sensor bay error > 5% zona: tiket P4 ke vendor parkir.",
     "dashboard": "TIC",
     "target": "T+10",
     "output": "Tiket"
    },
    {
     "phase": "2-Verifikasi",
     "role": "PKR",
     "action": "Analisis durasi parkir & kendaraan menginap > 24 jam (cek plat via LPR).",
     "dashboard": "PARK",
     "target": "Harian",
     "output": "Daftar kendaraan inap"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "FIN",
     "action": "Evaluasi tarif progresif/VIP & EV untuk menaikkan turnover; laporan ke Komersial & Keuangan.",
     "dashboard": "O360",
     "target": "Bulanan",
     "output": "Rekomendasi tarif"
    }
   ]
  },
  {
   "id": "SOP-PRK-02",
   "title": "Kendaraan menghalangi jalur darurat / difabel / damkar",
   "pillar": "4. Parking & Mobility",
   "subdomain": "Smart Parking Guidance",
   "nodes": "Slot Kosong/Zona, Parkir VIP & EV",
   "priority": "P2",
   "trigger": "Smart Cam ANPR mendeteksi kendaraan diam di jalur damkar/difabel > 3 menit",
   "source": "Smart Cam ANPR, Ultrasonic Bay Sensor",
   "protocol": "TCP/IP / RS-485",
   "dashboard": "PARK",
   "related": "TIC, CCTV",
   "pic": "PKR",
   "kpi": "Jalur darurat bebas <= 10 menit",
   "evidence": "Snapshot plat nomor, foto",
   "closure": "Jalur darurat kosong",
   "auto_action": "Panggilan pemilik kendaraan via data member/plat",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "PKR",
     "action": "Alert pelanggaran jalur darurat dengan plat nomor (mis. B 1204 KOS).",
     "dashboard": "PARK",
     "target": "T+0",
     "output": "Alert"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tiket P2 dengan snapshot kamera.",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "Tiket"
    },
    {
     "phase": "4-Dispatch",
     "role": "QRT",
     "action": "Security ke lokasi; cari pemilik via paging/info desk/data member.",
     "dashboard": "CCTV",
     "target": "T+5",
     "output": "Pemilik dihubungi"
    },
    {
     "phase": "5-Mitigasi",
     "role": "PKR",
     "action": "Bila pemilik tidak ditemukan 15 menit: gembok roda/derek sesuai kebijakan.",
     "dashboard": "PARK",
     "target": "T+15",
     "output": "Tindakan"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "PKR",
     "action": "Tutup tiket & catat pelanggaran plat (blacklist berulang).",
     "dashboard": "TIC",
     "target": "Saat selesai",
     "output": "Log pelanggaran"
    }
   ]
  },
  {
   "id": "SOP-PRK-03",
   "title": "Kepadatan drop-off lobi, valet & taksi",
   "pillar": "4. Parking & Mobility",
   "subdomain": "Drop-off & Valet / Taxi",
   "nodes": "Antrean Drop-off Lobi & Valet, Taksi & Ride-Hail (Waiting Time)",
   "priority": "P3",
   "trigger": "Waktu tunggu lobi > 5 menit atau jalur drop-off padat > 80%",
   "source": "AI Traffic Camera",
   "protocol": "RTSP",
   "dashboard": "PARK",
   "related": "CCTV, TIC",
   "pic": "PKR",
   "kpi": "Waktu tunggu lobi <= 5 menit",
   "evidence": "Snapshot AI camera",
   "closure": "Waktu tunggu normal 15 menit",
   "auto_action": "Pengerahan petugas keamanan lobi saat antrean drop-off padat",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "PKR",
     "action": "Alert kepadatan lobi dari AI traffic camera.",
     "dashboard": "PARK",
     "target": "T+0",
     "output": "Alert"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CCO",
     "action": "Verifikasi kamera lobi & jalur masuk.",
     "dashboard": "CCTV",
     "target": "T+1",
     "output": "Verifikasi"
    },
    {
     "phase": "4-Dispatch",
     "role": "QRT",
     "action": "Kerahkan Regu Alpha (drop-off & gerbang) untuk atur lalu lintas.",
     "dashboard": "CCTV",
     "target": "T+3",
     "output": "Regu on-site"
    },
    {
     "phase": "5-Mitigasi",
     "role": "PKR",
     "action": "Aktifkan zona tunggu ride-hail alternatif & tambah petugas valet.",
     "dashboard": "PARK",
     "target": "T+5",
     "output": "Zona alternatif"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "PKR",
     "action": "Catat puncak & pola untuk penjadwalan personel.",
     "dashboard": "ANL",
     "target": "Harian",
     "output": "Laporan"
    }
   ]
  },
  {
   "id": "SOP-PRK-04",
   "title": "Rekonsiliasi pendapatan parkir & QRIS/e-money",
   "pillar": "4. Parking & Mobility",
   "subdomain": "Gate & Cashless Revenue",
   "nodes": "Rekonsiliasi QRIS",
   "priority": "-",
   "trigger": "Selisih transaksi gate vs settlement bank > 0.5%",
   "source": "Parking Management System, Bank",
   "protocol": "REST API",
   "dashboard": "PARK",
   "related": "O360, ANL",
   "pic": "FIN",
   "kpi": "Selisih rekonsiliasi < 0.1%",
   "evidence": "Laporan rekonsiliasi",
   "closure": "Selisih terjelaskan & dikoreksi",
   "auto_action": "Auto-recon harian",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "FIN",
     "action": "Auto-recon harian menandai selisih per gate/metode bayar.",
     "dashboard": "PARK",
     "target": "Harian 06:00",
     "output": "Laporan selisih"
    },
    {
     "phase": "2-Verifikasi",
     "role": "PKR",
     "action": "Cocokkan log gate, foto ANPR, & transaksi gagal.",
     "dashboard": "PARK",
     "target": "+4 jam",
     "output": "Analisis"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "FIN",
     "action": "Jurnal koreksi & laporan ke Komersial & Keuangan.",
     "dashboard": "O360",
     "target": "+1 hari",
     "output": "Jurnal"
    }
   ]
  },
  {
   "id": "SOP-PRK-05",
   "title": "Gangguan EV charger (OCPP) & shuttle/feeder",
   "pillar": "4. Parking & Mobility",
   "subdomain": "Integrasi Transit",
   "nodes": "EV Charger (OCPP), Feeder/Shuttle",
   "priority": "P4",
   "trigger": "EVSE offline/fault, shuttle terlambat > 10 menit",
   "source": "EVSE Backend (OCPP)",
   "protocol": "OCPP",
   "dashboard": "PARK",
   "related": "TIC, ENE",
   "pic": "PKR",
   "kpi": "Uptime EVSE >= 98%",
   "evidence": "Log OCPP",
   "closure": "EVSE online & sesi charging normal",
   "auto_action": "Reset remote EVSE",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "PKR",
     "action": "Status EVSE fault/offline tampil di panel EV charger.",
     "dashboard": "PARK",
     "target": "T+0",
     "output": "Alert"
    },
    {
     "phase": "5-Mitigasi",
     "role": "IT",
     "action": "Remote reset via OCPP; bila gagal buat tiket P4 ke vendor EVSE.",
     "dashboard": "TIC",
     "target": "T+10",
     "output": "Reset/tiket"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "ENM",
     "action": "Catat kWh terjual & downtime.",
     "dashboard": "ENE",
     "target": "Harian",
     "output": "Laporan EVSE"
    }
   ]
  },
  {
   "id": "SOP-SEC-01",
   "title": "Kebakaran / fire alarm (Code Red) & evakuasi",
   "pillar": "5. Security, Safety & HSE",
   "subdomain": "Fire & Life Safety",
   "nodes": "Status Smoke/Heat, Tekanan Hydrant",
   "priority": "P1",
   "trigger": "FACP fire alarm, thermal CCTV, panic button, laporan titik api",
   "source": "Fire Alarm Control Panel (FACP), Thermal CCTV",
   "protocol": "BACnet / Dry Contact",
   "dashboard": "CCTV",
   "related": "TIC, BMS, TEN, ANL, PARK",
   "pic": "CSEC",
   "kpi": "Respons <= 2 menit; evakuasi zona < 15 menit; 0 korban",
   "evidence": "Log FACP, rekaman CCTV, daftar hadir titik kumpul",
   "closure": "Damkar menyatakan aman; sistem fire di-reset",
   "auto_action": "Interlock otomatis: matikan AHU, buka pintu akses darurat, aktifkan PA Evakuasi",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CCO",
     "action": "Alarm FACP pop-up layar utama (zona detektor) + kamera thermal zona otomatis dibuka.",
     "dashboard": "CCTV",
     "target": "T+0",
     "output": "Alarm P1"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CCO",
     "action": "Verifikasi visual/thermal dan radio Security terdekat (maks 60 detik). False alarm -> reset & catat.",
     "dashboard": "CCTV",
     "target": "T+1",
     "output": "Konfirmasi api"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tiket P1 otomatis; kode CODE RED; notifikasi WhatsApp/Call prioritas ke GM & Owner (detik ke-1).",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "Tiket P1 + eskalasi"
    },
    {
     "phase": "5-Mitigasi",
     "role": "BMSO",
     "action": "Pastikan interlock: AHU zona OFF, smoke exhaust ON, fire curtain turun, pintu darurat terbuka, lift ke lantai dasar.",
     "dashboard": "BMS",
     "target": "T+1",
     "output": "Interlock aktif"
    },
    {
     "phase": "4-Dispatch",
     "role": "ERT",
     "action": "ERT padamkan dengan APAR/hydrant (cek tekanan hydrant); hubungi Damkar 113 bila tidak terkendali.",
     "dashboard": "TIC",
     "target": "T+2",
     "output": "Pemadaman awal"
    },
    {
     "phase": "5-Mitigasi",
     "role": "CSEC",
     "action": "Aktifkan PA evakuasi bertahap (zona -> lantai -> gedung); marshal arahkan ke titik kumpul.",
     "dashboard": "CCTV",
     "target": "T+3",
     "output": "Evakuasi"
    },
    {
     "phase": "4-Dispatch",
     "role": "TRO",
     "action": "Broadcast darurat ke seluruh tenant zona (tutup gas/listrik, evakuasi karyawan).",
     "dashboard": "TEN",
     "target": "T+3",
     "output": "Broadcast tenant"
    },
    {
     "phase": "4-Dispatch",
     "role": "PKR",
     "action": "Buka semua gate parkir (free exit) & kosongkan jalur akses Damkar.",
     "dashboard": "PARK",
     "target": "T+5",
     "output": "Jalur damkar bebas"
    },
    {
     "phase": "7-Pemulihan",
     "role": "CSEC",
     "action": "Headcount di titik kumpul; koordinasi Damkar; reset FACP setelah dinyatakan aman.",
     "dashboard": "CCTV",
     "target": "< 15 menit",
     "output": "Headcount"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "HSE",
     "action": "Laporan insiden, klaim asuransi, RCA & drill ulang; laporan ke BOD.",
     "dashboard": "ANL",
     "target": "<= 24 jam",
     "output": "Laporan insiden"
    }
   ]
  },
  {
   "id": "SOP-SEC-02",
   "title": "Kebocoran gas dapur F&B",
   "pillar": "5. Security, Safety & HSE",
   "subdomain": "Fire & Life Safety",
   "nodes": "Gas Leak Detector (Dapur F&B)",
   "priority": "P1",
   "trigger": "Gas leak detector > 20% LEL di dapur tenant F&B",
   "source": "Gas Leak Detector",
   "protocol": "BACnet / Dry Contact",
   "dashboard": "BMS",
   "related": "TIC, CCTV, TEN",
   "pic": "CSEC",
   "kpi": "Isolasi gas <= 3 menit; 0 ledakan/kebakaran",
   "evidence": "Log detektor, foto valve",
   "closure": "Konsentrasi gas 0% LEL & instalasi diperiksa",
   "auto_action": "Auto shut-off solenoid valve gas & exhaust ON",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "BMSO",
     "action": "Alarm gas leak unit F&B; solenoid valve gas menutup otomatis.",
     "dashboard": "BMS",
     "target": "T+0",
     "output": "Alarm"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tiket P1; hubungi store manager tenant via VoIP direct.",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "Tiket"
    },
    {
     "phase": "4-Dispatch",
     "role": "ERT",
     "action": "ERT ke lokasi dengan detektor portabel; larang sumber api & saklar listrik.",
     "dashboard": "CCTV",
     "target": "T+2",
     "output": "ERT on-site"
    },
    {
     "phase": "5-Mitigasi",
     "role": "TRO",
     "action": "Evakuasi dapur & unit sebelah; ventilasi maksimum.",
     "dashboard": "TEN",
     "target": "T+3",
     "output": "Area kosong"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "HSE",
     "action": "Pemeriksaan instalasi oleh vendor gas bersertifikat sebelum dapur dibuka.",
     "dashboard": "TEN",
     "target": "Sebelum buka",
     "output": "Sertifikat cek"
    }
   ]
  },
  {
   "id": "SOP-SEC-03",
   "title": "Barang tertinggal / mencurigakan (unattended object)",
   "pillar": "5. Security, Safety & HSE",
   "subdomain": "Surveillance & AI Video",
   "nodes": "Barang Tertinggal",
   "priority": "P2",
   "trigger": "AI mendeteksi objek tak bertuan > 10 menit",
   "source": "IP CCTV + AI Video Analytics (VMS)",
   "protocol": "ONVIF / RTSP",
   "dashboard": "CCTV",
   "related": "TIC",
   "pic": "CSEC",
   "kpi": "Respons <= 5 menit; klarifikasi <= 15 menit",
   "evidence": "Klip video, foto objek",
   "closure": "Objek diklarifikasi (pemilik ditemukan / diamankan / Gegana)",
   "auto_action": "Pop-up layar utama + dispatch personel terdekat",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CCO",
     "action": "Alert objek tak bertuan + timer di panel alert keamanan.",
     "dashboard": "CCTV",
     "target": "T+0",
     "output": "Alert"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CCO",
     "action": "Playback ke saat objek ditinggalkan; identifikasi pemilik & arah pergi.",
     "dashboard": "CCTV",
     "target": "T+2",
     "output": "Klip pemilik"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tiket P2 (naik P1 bila ciri mencurigakan: kabel, bau, ancaman).",
     "dashboard": "TIC",
     "target": "T+2",
     "output": "Tiket"
    },
    {
     "phase": "4-Dispatch",
     "role": "QRT",
     "action": "Security ke lokasi; jangan sentuh; radius aman 10 m; tanya sekitar.",
     "dashboard": "CCTV",
     "target": "T+5",
     "output": "Area diamankan"
    },
    {
     "phase": "6-Eskalasi",
     "role": "CSEC",
     "action": "Bila mencurigakan: eskalasi P1, evakuasi zona, hubungi Polisi/Gegana.",
     "dashboard": "TIC",
     "target": "T+10",
     "output": "Eskalasi"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "CS",
     "action": "Bila barang hilang biasa: serahkan ke Lost & Found, catat & paging pemilik.",
     "dashboard": "TIC",
     "target": "T+15",
     "output": "Log Lost & Found"
    }
   ]
  },
  {
   "id": "SOP-SEC-04",
   "title": "Intrusi area terbatas (server/kas) & pencurian",
   "pillar": "5. Security, Safety & HSE",
   "subdomain": "Surveillance & AI Video",
   "nodes": "Intrusion Alert",
   "priority": "P1-P2",
   "trigger": "Akses tidak sah ruang server/kas/rooftop, alarm anti-theft tenant, orang dalam pengawasan (watchlist)",
   "source": "AI Video, Access Control, FR",
   "protocol": "ONVIF / RTSP",
   "dashboard": "CCTV",
   "related": "TIC, TEN",
   "pic": "CSEC",
   "kpi": "Intersep <= 5 menit",
   "evidence": "Klip video, log akses kartu",
   "closure": "Pelaku diamankan/diserahkan ke Polisi atau alarm diklarifikasi",
   "auto_action": "Pop-up layar utama + lock-down pintu akses",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CCO",
     "action": "Alert intrusi/FR watchlist dengan akurasi AI & lokasi kamera.",
     "dashboard": "CCTV",
     "target": "T+0",
     "output": "Alert"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CCO",
     "action": "Verifikasi visual & log access control; tracking multi-kamera.",
     "dashboard": "CCTV",
     "target": "T+1",
     "output": "Verifikasi"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tiket P2 (P1 bila senjata/kekerasan).",
     "dashboard": "TIC",
     "target": "T+2",
     "output": "Tiket"
    },
    {
     "phase": "4-Dispatch",
     "role": "QRT",
     "action": "Kirim intersep (Regu Bravo) dengan koordinat; lockdown pintu bila perlu.",
     "dashboard": "CCTV",
     "target": "T+3",
     "output": "Intersep"
    },
    {
     "phase": "4-Dispatch",
     "role": "TRO",
     "action": "Informasikan tenant terdampak (pencurian toko).",
     "dashboard": "TEN",
     "target": "T+5",
     "output": "Info tenant"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "CSEC",
     "action": "Ekspor bukti video watermark (.MP4) & BAP ke Polisi.",
     "dashboard": "CCTV",
     "target": "+1 jam",
     "output": "Bukti video"
    }
   ]
  },
  {
   "id": "SOP-SEC-05",
   "title": "Kerumunan abnormal / ancaman keamanan / teror",
   "pillar": "5. Security, Safety & HSE",
   "subdomain": "Surveillance & AI Video",
   "nodes": "Deteksi Kerumunan",
   "priority": "P1",
   "trigger": "AI mendeteksi kerumunan abnormal/perkelahian/kepanikan atau ancaman teror",
   "source": "AI Video Analytics, Panic Button",
   "protocol": "ONVIF / RTSP",
   "dashboard": "CCTV",
   "related": "TIC, BMS, TEN, PARK, ANL",
   "pic": "CSEC",
   "kpi": "Respons <= 2 menit; lockdown/evakuasi sesuai keputusan <= 5 menit",
   "evidence": "Klip video, log komunikasi",
   "closure": "Ancaman dinetralisir & dinyatakan aman Polisi",
   "auto_action": "Pop-up layar utama + dispatch personel terdekat",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CCO",
     "action": "Alert anomali kerumunan/kepanikan/panic button.",
     "dashboard": "CCTV",
     "target": "T+0",
     "output": "Alert"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CSEC",
     "action": "Nilai jenis ancaman: perkelahian, kepanikan, senjata, bom.",
     "dashboard": "CCTV",
     "target": "T+1",
     "output": "Penilaian"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tiket P1; eskalasi langsung ke GM/Owner; hubungi Polisi 110.",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "Tiket + eskalasi"
    },
    {
     "phase": "5-Mitigasi",
     "role": "CSEC",
     "action": "Putuskan lockdown (shelter-in-place) atau evakuasi; kontrol pintu akses.",
     "dashboard": "CCTV",
     "target": "T+3",
     "output": "Keputusan"
    },
    {
     "phase": "4-Dispatch",
     "role": "TRO",
     "action": "Broadcast tenant: tutup rolling door / evakuasi sesuai keputusan.",
     "dashboard": "TEN",
     "target": "T+3",
     "output": "Broadcast"
    },
    {
     "phase": "4-Dispatch",
     "role": "PKR",
     "action": "Kendalikan gate parkir (tahan keluar/masuk sesuai instruksi Polisi).",
     "dashboard": "PARK",
     "target": "T+5",
     "output": "Kontrol gate"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "GM",
     "action": "Komunikasi publik via PR & laporan BOD.",
     "dashboard": "ANL",
     "target": "<= 24 jam",
     "output": "Laporan"
    }
   ]
  },
  {
   "id": "SOP-SEC-06",
   "title": "Guard tour & kepatuhan patroli security",
   "pillar": "5. Security, Safety & HSE",
   "subdomain": "Guard Tour & Housekeeping",
   "nodes": "Guard Tour NFC",
   "priority": "P4",
   "trigger": "Checkpoint NFC terlewat > 10 menit dari jadwal",
   "source": "NFC Checkpoint, Patroli App",
   "protocol": "BLE / App",
   "dashboard": "CCTV",
   "related": "TIC, ANL",
   "pic": "CSEC",
   "kpi": "Kepatuhan rute patroli >= 98%",
   "evidence": "Log NFC",
   "closure": "Checkpoint terkunjungi",
   "auto_action": "Audit otomatis kinerja vendor outsourcing (Security)",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CCO",
     "action": "Sistem menandai checkpoint terlewat pada panel Regu Patroli.",
     "dashboard": "CCTV",
     "target": "T+0",
     "output": "Alert"
    },
    {
     "phase": "4-Dispatch",
     "role": "CSEC",
     "action": "Hubungi regu via HT; kirim ulang ke checkpoint.",
     "dashboard": "CCTV",
     "target": "T+5",
     "output": "Konfirmasi"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "SL",
     "action": "Akumulasi kepatuhan per regu/vendor bulanan.",
     "dashboard": "ANL",
     "target": "Bulanan",
     "output": "Skor vendor"
    }
   ]
  },
  {
   "id": "SOP-SEC-07",
   "title": "Kebersihan & sanitasi (smart toilet NH3, tumpahan)",
   "pillar": "5. Security, Safety & HSE",
   "subdomain": "Guard Tour & Housekeeping",
   "nodes": "Smart Toilet (NH3), Tiket Komplain SLA < 15 Menit",
   "priority": "P4",
   "trigger": "NH3 toilet > 25 ppm, tisu/sabun habis, tumpahan dilaporkan CCTV/patroli",
   "source": "Smart Toilet Ammonia Sensor, CCTV",
   "protocol": "LoRaWAN / App",
   "dashboard": "TIC",
   "related": "CCTV, ANL",
   "pic": "HK",
   "kpi": "Respons <= 15 menit; resolusi <= 45 menit",
   "evidence": "Foto sebelum/sesudah",
   "closure": "Sensor NH3 normal / area bersih kering",
   "auto_action": "Tiket otomatis ke Housekeeping",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CCO",
     "action": "Sensor NH3/dispenser atau CCTV mendeteksi masalah kebersihan -> tiket P4 otomatis.",
     "dashboard": "TIC",
     "target": "T+0",
     "output": "Tiket"
    },
    {
     "phase": "4-Dispatch",
     "role": "HK",
     "action": "Janitorial Crew terdekat menerima push; pasang yellow cone bila tumpahan.",
     "dashboard": "TIC",
     "target": "T+5",
     "output": "Penugasan"
    },
    {
     "phase": "5-Mitigasi",
     "role": "HK",
     "action": "Pembersihan, isi ulang supply, unggah foto sesudah.",
     "dashboard": "TIC",
     "target": "<= 15 menit",
     "output": "Foto"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "HK",
     "action": "Sensor kembali normal -> auto-close; rekap untuk evaluasi vendor cleaning.",
     "dashboard": "ANL",
     "target": "Bulanan",
     "output": "Skor vendor"
    }
   ]
  },
  {
   "id": "SOP-SEC-08",
   "title": "Gempa bumi / bencana alam",
   "pillar": "5. Security, Safety & HSE",
   "subdomain": "Fire & Life Safety",
   "nodes": "Status Smoke/Heat, Tekanan Hydrant",
   "priority": "P1",
   "trigger": "Notifikasi BMKG / sensor seismik / guncangan dirasakan",
   "source": "BMKG API, Sensor Seismik",
   "protocol": "API",
   "dashboard": "TIC",
   "related": "BMS, CCTV, TEN, PARK, ANL",
   "pic": "CSEC",
   "kpi": "Instruksi 'Drop-Cover-Hold' <= 30 detik; evakuasi pasca guncangan < 15 menit",
   "evidence": "Log PA, daftar headcount",
   "closure": "Inspeksi struktur aman & operasional dibuka kembali",
   "auto_action": "PA otomatis & lift recall ke lantai terdekat",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CCO",
     "action": "Alert gempa; PA otomatis 'Drop-Cover-Hold'; lift recall.",
     "dashboard": "TIC",
     "target": "T+0",
     "output": "PA aktif"
    },
    {
     "phase": "5-Mitigasi",
     "role": "BMSO",
     "action": "Pastikan lift berhenti di lantai terdekat & pintu terbuka; cek gas & chiller.",
     "dashboard": "BMS",
     "target": "T+1",
     "output": "Status aset"
    },
    {
     "phase": "5-Mitigasi",
     "role": "CSEC",
     "action": "Setelah guncangan berhenti: evakuasi ke titik kumpul terbuka.",
     "dashboard": "CCTV",
     "target": "T+2",
     "output": "Evakuasi"
    },
    {
     "phase": "4-Dispatch",
     "role": "TRO",
     "action": "Broadcast tenant & headcount karyawan tenant.",
     "dashboard": "TEN",
     "target": "T+5",
     "output": "Headcount tenant"
    },
    {
     "phase": "7-Pemulihan",
     "role": "CENG",
     "action": "Inspeksi struktur cepat (retakan, kebocoran, plafon) sebelum re-entry.",
     "dashboard": "BMS",
     "target": "T+30",
     "output": "Laporan inspeksi"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "GM",
     "action": "Keputusan buka kembali & laporan ke BOD.",
     "dashboard": "ANL",
     "target": "T+60",
     "output": "Keputusan"
    }
   ]
  },
  {
   "id": "SOP-SEC-09",
   "title": "Anak / orang hilang (Code Adam)",
   "pillar": "5. Security, Safety & HSE",
   "subdomain": "Surveillance & AI Video",
   "nodes": "Deteksi Kerumunan, Traffic per Pintu",
   "priority": "P1",
   "trigger": "Laporan orang tua / pengunjung ke Info Desk atau Security",
   "source": "Info Desk, CCTV AI (attribute search)",
   "protocol": "ONVIF",
   "dashboard": "CCTV",
   "related": "TIC, PARK",
   "pic": "CSEC",
   "kpi": "Anak ditemukan <= 15 menit; semua pintu terkontrol <= 3 menit",
   "evidence": "Foto/ciri anak, klip CCTV",
   "closure": "Anak diserahkan ke orang tua dengan verifikasi identitas",
   "auto_action": "Pencarian atribut AI (warna baju, tinggi) di seluruh kamera",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CS",
     "action": "Info Desk catat ciri-ciri (baju, usia, lokasi terakhir) & foto dari HP orang tua.",
     "dashboard": "TIC",
     "target": "T+0",
     "output": "Data anak"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tiket P1 Code Adam; broadcast radio ke semua pos pintu & parkir.",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "Code Adam aktif"
    },
    {
     "phase": "2-Verifikasi",
     "role": "CCO",
     "action": "AI attribute search & playback lokasi terakhir.",
     "dashboard": "CCTV",
     "target": "T+2",
     "output": "Jejak kamera"
    },
    {
     "phase": "4-Dispatch",
     "role": "QRT",
     "action": "Pos pintu & gate parkir awasi setiap anak keluar; tim sisir zona.",
     "dashboard": "PARK",
     "target": "T+3",
     "output": "Pintu terkontrol"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "CSEC",
     "action": "Serahkan anak dengan verifikasi; bila > 15 menit belum ditemukan, lapor Polisi.",
     "dashboard": "TIC",
     "target": "<= 15 menit",
     "output": "Serah terima"
    }
   ]
  },
  {
   "id": "SOP-SEC-10",
   "title": "Medical emergency pengunjung (Code Blue)",
   "pillar": "5. Security, Safety & HSE",
   "subdomain": "Guard Tour & Housekeeping",
   "nodes": "Tiket Komplain SLA < 15 Menit",
   "priority": "P1",
   "trigger": "Pengunjung pingsan/cedera dilaporkan atau terdeteksi AI (orang jatuh)",
   "source": "AI Video (fall detection), Radio",
   "protocol": "ONVIF / Radio",
   "dashboard": "TIC",
   "related": "CCTV, PARK",
   "pic": "ERT",
   "kpi": "First aid tiba <= 3 menit; ambulans dipanggil <= 5 menit bila perlu",
   "evidence": "Form pertolongan pertama",
   "closure": "Pasien ditangani/dirujuk",
   "auto_action": "Dispatch ERT bersertifikat P3K + AED terdekat",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CCO",
     "action": "Laporan/AI fall detection; buka kamera lokasi.",
     "dashboard": "CCTV",
     "target": "T+0",
     "output": "Alert"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Tiket P1 Code Blue; dispatch ERT + AED terdekat.",
     "dashboard": "TIC",
     "target": "T+1",
     "output": "Tiket"
    },
    {
     "phase": "5-Mitigasi",
     "role": "ERT",
     "action": "Pertolongan pertama, CPR/AED bila perlu; amankan area.",
     "dashboard": "TIC",
     "target": "T+3",
     "output": "Penanganan"
    },
    {
     "phase": "4-Dispatch",
     "role": "PKR",
     "action": "Siapkan jalur ambulans di lobi/drop-off.",
     "dashboard": "PARK",
     "target": "T+5",
     "output": "Jalur ambulans"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "HSE",
     "action": "Laporan insiden & tindak lanjut (asuransi, keluarga).",
     "dashboard": "ANL",
     "target": "<= 24 jam",
     "output": "Laporan"
    }
   ]
  },
  {
   "id": "SOP-FIN-01",
   "title": "Billing otomatis & collection tenant",
   "pillar": "6. Finance & Asset Value",
   "subdomain": "Billing & Collection",
   "nodes": "Auto-Invoicing, Aging Piutang",
   "priority": "-",
   "trigger": "Siklus tagihan bulanan (sewa, service charge, utilitas sub-meter)",
   "source": "ERP Finance & Virtual Account Bank",
   "protocol": "ISO 20022 / Open API",
   "dashboard": "O360",
   "related": "TEN, ENE",
   "pic": "FIN",
   "kpi": "Collection ratio >= 98%",
   "evidence": "Invoice, bukti VA",
   "closure": "Pembayaran terekonsiliasi otomatis",
   "auto_action": "Tagihan utilitas tenant otomatis dari sub-meter (AMR)",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "FIN",
     "action": "AMR menarik konsumsi sub-meter tenant; ERP generate invoice + VA.",
     "dashboard": "ENE",
     "target": "Tgl 1",
     "output": "Invoice"
    },
    {
     "phase": "4-Dispatch",
     "role": "TRO",
     "action": "Invoice terkirim ke Tenant App & email.",
     "dashboard": "TEN",
     "target": "Tgl 1",
     "output": "Invoice terkirim"
    },
    {
     "phase": "2-Verifikasi",
     "role": "FIN",
     "action": "Auto-recon VA harian; update AR aging di Komersial & Keuangan.",
     "dashboard": "O360",
     "target": "Harian",
     "output": "AR aging"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "FIN",
     "action": "Laporan collection ratio bulanan.",
     "dashboard": "ANL",
     "target": "Bulanan",
     "output": "Laporan"
    }
   ]
  },
  {
   "id": "SOP-FIN-02",
   "title": "Tunggakan tenant > 30/60/90 hari & pembatasan fasilitas",
   "pillar": "6. Finance & Asset Value",
   "subdomain": "Billing & Collection",
   "nodes": "Aging Piutang, Denda Otomatis",
   "priority": "-",
   "trigger": "AR aging tenant melewati 30, 60, 90 hari",
   "source": "ERP Finance & VA Bank",
   "protocol": "ISO 20022 / Open API",
   "dashboard": "O360",
   "related": "TEN, BMS, ANL",
   "pic": "FIN",
   "kpi": "AR > 60 hari < 2% total piutang",
   "evidence": "Surat peringatan SP1/SP2/SP3, log pembatasan",
   "closure": "Lunas / rencana cicilan disetujui",
   "auto_action": "Surat peringatan otomatis & pembatasan fasilitas jika menunggak >60 hari",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "FIN",
     "action": "Aging 30 hari: reminder otomatis + denda sesuai kontrak.",
     "dashboard": "O360",
     "target": "H+30",
     "output": "Reminder"
    },
    {
     "phase": "6-Eskalasi",
     "role": "FIN",
     "action": "Aging 60 hari: SP otomatis via Tenant App; TRO lakukan kunjungan.",
     "dashboard": "TEN",
     "target": "H+60",
     "output": "SP + kunjungan"
    },
    {
     "phase": "5-Mitigasi",
     "role": "CENG",
     "action": "Atas persetujuan GM: batasi fasilitas (overtime AC, izin loading non-esensial).",
     "dashboard": "BMS",
     "target": "H+60",
     "output": "Pembatasan"
    },
    {
     "phase": "6-Eskalasi",
     "role": "GM",
     "action": "Aging 90 hari: rapat legal & Leasing (restrukturisasi/terminasi).",
     "dashboard": "ANL",
     "target": "H+90",
     "output": "Keputusan"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "FIN",
     "action": "Cabut pembatasan otomatis setelah pelunasan terekonsiliasi.",
     "dashboard": "O360",
     "target": "Saat lunas",
     "output": "Status normal"
    }
   ]
  },
  {
   "id": "SOP-FIN-03",
   "title": "Kontrol opex vs budget & P&L harian",
   "pillar": "6. Finance & Asset Value",
   "subdomain": "Real-time P&L & Cashflow",
   "nodes": "Daily Revenue, Opex vs Budget, EBITDA Harian",
   "priority": "-",
   "trigger": "Opex harian > 105% budget atau EBITDA margin turun > 3 poin",
   "source": "Enterprise ERP & Treasury System",
   "protocol": "API / Data Warehouse",
   "dashboard": "O360",
   "related": "ENE, ANL",
   "pic": "FIN",
   "kpi": "Opex <= budget; EBITDA margin sesuai target",
   "evidence": "Laporan varians",
   "closure": "Varians terjelaskan & aksi korektif disepakati",
   "auto_action": "Alert varians otomatis",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "FIN",
     "action": "Alert varians opex (energi, vendor, perbaikan) di Komersial & Keuangan.",
     "dashboard": "O360",
     "target": "Harian",
     "output": "Alert"
    },
    {
     "phase": "2-Verifikasi",
     "role": "ENM",
     "action": "Drill ke biaya energi per zona & anomali.",
     "dashboard": "ENE",
     "target": "+1 hari",
     "output": "Analisis"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "GM",
     "action": "Aksi korektif di rapat mingguan.",
     "dashboard": "ANL",
     "target": "Mingguan",
     "output": "Aksi"
    }
   ]
  },
  {
   "id": "SOP-FIN-04",
   "title": "Pelaporan BOD, proyeksi dividen & capex",
   "pillar": "6. Finance & Asset Value",
   "subdomain": "Valuasi & Capex",
   "nodes": "ROI Renovasi, Cost per m2, Proyeksi Dividen Pemilik Mall",
   "priority": "-",
   "trigger": "Siklus bulanan/triwulan atau permintaan BOD",
   "source": "Data warehouse SMICC, ERP",
   "protocol": "API / Data Warehouse",
   "dashboard": "ANL",
   "related": "O360, semua",
   "pic": "FIN",
   "kpi": "Laporan BOD terbit <= H+5 bulan berikutnya",
   "evidence": "Paket laporan BOD (PDF/XLSX/PPTX)",
   "closure": "BOD menyetujui laporan",
   "auto_action": "Generator Laporan BOD otomatis",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "FIN",
     "action": "Generator laporan menarik KPI semua dashboard (SLA, energi, okupansi, NOI).",
     "dashboard": "ANL",
     "target": "H+1",
     "output": "Draft"
    },
    {
     "phase": "2-Verifikasi",
     "role": "GM",
     "action": "Review & beri komentar; validasi angka dengan Finance.",
     "dashboard": "ANL",
     "target": "H+3",
     "output": "Review"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "FIN",
     "action": "Simulasi dividen & alokasi capex (ROI renovasi, cost/m2).",
     "dashboard": "O360",
     "target": "H+4",
     "output": "Simulasi"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "GM",
     "action": "Kirim paket laporan BOD.",
     "dashboard": "ANL",
     "target": "H+5",
     "output": "Laporan terkirim"
    }
   ]
  },
  {
   "id": "SOP-EVT-01",
   "title": "Setup acara, jenis tiket, kuota & denah kursi",
   "pillar": "2. Visitor & Experience",
   "subdomain": "Event Ticketing",
   "nodes": "ROI Event Atrium",
   "priority": "-",
   "trigger": "Acara baru disetujui di kalender event atrium (minimal H-21)",
   "source": "Event Ticketing Engine & Kalender Event",
   "protocol": "REST/JSON (transaksi berversi)",
   "dashboard": "EVT",
   "related": "O360, ANL, BMS, PARK",
   "pic": "EO",
   "kpi": "Acara dipublikasikan <= H-14; 0 kursi salah kategori/harga",
   "evidence": "Checklist setup, tangkapan layar denah & konfigurasi tiket",
   "closure": "Acara berstatus Dipublikasikan & UAT pesan-bayar-check-in lulus",
   "auto_action": "Kuota kursi bernomor dihitung otomatis dari denah; kursi teknis/kursi roda diblokir dari penjualan",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "EO",
     "action": "Terima brief acara (jadwal, venue, kapasitas, kategori harga) & buat acara berstatus Draft di Konsol Pengelola (/pengelola → Daftar acara → Acara baru, pilih templat venue).",
     "dashboard": "EVT",
     "target": "H-21",
     "output": "Acara Draft"
    },
    {
     "phase": "2-Verifikasi",
     "role": "HSE",
     "action": "Verifikasi kapasitas venue terhadap jalur evakuasi; tetapkan kursi yang diblokir (kamera, FOH, kursi roda).",
     "dashboard": "EVT",
     "target": "H-18",
     "output": "Kapasitas & daftar blokir disetujui"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "EO",
     "action": "Atur jenis tiket, harga, kuota area berdiri, periode jual, durasi hold kursi (8 menit) & maksimal tiket per pesanan.",
     "dashboard": "EVT",
     "target": "H-16",
     "output": "Konfigurasi tiket"
    },
    {
     "phase": "4-Dispatch",
     "role": "FIN",
     "action": "Verifikasi harga, biaya layanan & akun settlement payment gateway (sandbox pada prototype).",
     "dashboard": "EVT",
     "target": "H-15",
     "output": "Persetujuan Finance"
    },
    {
     "phase": "5-Mitigasi",
     "role": "IT",
     "action": "UAT end-to-end: pilih kursi, hold, bayar, e-ticket, check-in, refund, termasuk uji rebutan kursi (2 pembeli bersamaan).",
     "dashboard": "EVT",
     "target": "H-15",
     "output": "Berita acara UAT"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "EO",
     "action": "Publikasikan acara di Konsol Pengelola; manajemen mall memantau di Pemantauan Event, Command Center (pre-cooling BMS & antisipasi parkir PARK sesuai prediksi pengunjung).",
     "dashboard": "EVT",
     "target": "H-14",
     "output": "Acara live"
    }
   ]
  },
  {
   "id": "SOP-EVT-02",
   "title": "Penjualan tiket, hold kursi & pencegahan double-booking",
   "pillar": "2. Visitor & Experience",
   "subdomain": "Event Ticketing",
   "nodes": "ROI Event Atrium",
   "priority": "P3",
   "trigger": "Laporan kursi ganda, kegagalan pembayaran massal, atau keluhan pembeli",
   "source": "Event Ticketing Engine, Payment Gateway Sandbox",
   "protocol": "REST/JSON + webhook pembayaran",
   "dashboard": "EVT",
   "related": "TIC, O360, ANL",
   "pic": "EO",
   "kpi": "0 kursi terjual ganda; konversi hold->bayar >= 70%; callback pembayaran idempoten 100%",
   "evidence": "Log transaksi berversi, log callback pembayaran",
   "closure": "Tidak ada pesanan konflik & seluruh keluhan pembeli dijawab",
   "auto_action": "Hold kursi kedaluwarsa otomatis; commit transaksi yang kalah balapan ditolak (compare-and-swap) lalu diperiksa ulang",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "EO",
     "action": "Pantau ringkasan: kursi sedang dipesan, pesanan menunggu bayar, pembayaran gagal, konversi.",
     "dashboard": "EVT",
     "target": "Kontinu",
     "output": "Dashboard penjualan"
    },
    {
     "phase": "2-Verifikasi",
     "role": "IT",
     "action": "Bila ada laporan kursi ganda: telusuri versi transaksi & status kursi (HELD/SOLD, pemilik pesanan).",
     "dashboard": "EVT",
     "target": "T+10",
     "output": "Hasil penelusuran"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Buat tiket insiden P3 bila gangguan sistem/pembayaran berdampak > 10 pembeli.",
     "dashboard": "TIC",
     "target": "T+15",
     "output": "Tiket insiden"
    },
    {
     "phase": "5-Mitigasi",
     "role": "EO",
     "action": "Lepas hold kedaluwarsa, kabari daftar tunggu, tawarkan kursi setara untuk pesanan bermasalah.",
     "dashboard": "EVT",
     "target": "T+30",
     "output": "Kursi tersedia kembali"
    },
    {
     "phase": "7-Pemulihan",
     "role": "FIN",
     "action": "Rekonsiliasi pembayaran vs pesanan lunas; refund bila terbayar ganda.",
     "dashboard": "EVT",
     "target": "H+1",
     "output": "Laporan rekonsiliasi"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "EO",
     "action": "Kirim laporan penjualan harian ke Marketing dan Komersial & Keuangan.",
     "dashboard": "O360",
     "target": "Harian",
     "output": "Laporan penjualan"
    }
   ]
  },
  {
   "id": "SOP-EVT-03",
   "title": "Check-in gate QR & penanganan tiket palsu/calo",
   "pillar": "5. Security, Safety & HSE",
   "subdomain": "Event Ticketing",
   "nodes": "Traffic per Pintu, ROI Event Atrium",
   "priority": "P2",
   "trigger": ">= 3 pindaian QR gagal/duplikat per gate dalam 10 menit, antrean gate > 15 menit, atau QR palsu",
   "source": "Scanner QR gate (kamera ponsel/handheld), CCTV gate",
   "protocol": "REST/JSON (transaksi check-in atomik)",
   "dashboard": "EVT",
   "related": "TIC, CCTV, PARK",
   "pic": "EO",
   "kpi": "Check-in <= 10 detik/orang; 0 tiket dipakai dua kali; antrean gate <= 15 menit",
   "evidence": "Log pindaian, klip CCTV gate",
   "closure": "Gate normal 15 menit & pelaku tertangani",
   "auto_action": "Validasi tanda tangan QR & status tiket; pindaian kedua ditandai SUDAH DIGUNAKAN; anomali memicu tiket insiden",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "GTE",
     "action": "Pindai QR; sistem menampilkan VALID / SUDAH DIGUNAKAN / TIDAK VALID beserta pemegang & kursi.",
     "dashboard": "EVT",
     "target": "T+0",
     "output": "Hasil pindaian"
    },
    {
     "phase": "2-Verifikasi",
     "role": "GTE",
     "action": "Untuk SUDAH DIGUNAKAN/TIDAK VALID: cocokkan identitas & kode booking, arahkan ke meja bantuan; bila berulang tekan 'Laporkan ke Command Center' (ponsel gate / Konsol Pengelola).",
     "dashboard": "EVT",
     "target": "T+1",
     "output": "Verifikasi manual + laporan lapangan"
    },
    {
     "phase": "3-Tiket & Klasifikasi",
     "role": "CCO",
     "action": "Anomali >= 3 per gate/10 menit -> tiket insiden P2 'Indikasi tiket palsu/calo' dari Pemantauan Event → Gate & Keamanan di Command Center.",
     "dashboard": "TIC",
     "target": "T+2",
     "output": "Tiket P2"
    },
    {
     "phase": "4-Dispatch",
     "role": "QRT",
     "action": "Dispatch regu keamanan ke gate; verifikasi visual via CCTV gate.",
     "dashboard": "CCTV",
     "target": "T+5",
     "output": "Regu di gate + klip bukti"
    },
    {
     "phase": "5-Mitigasi",
     "role": "EO",
     "action": "Buka gate tambahan bila antrean > 15 menit; info ke Parkir & Security lobi.",
     "dashboard": "EVT",
     "target": "T+10",
     "output": "Gate tambahan aktif"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "CSEC",
     "action": "Tutup tiket insiden, simpan bukti (log pindaian + klip), laporan pasca-acara.",
     "dashboard": "TIC",
     "target": "H+1",
     "output": "Laporan insiden"
    }
   ]
  },
  {
   "id": "SOP-EVT-04",
   "title": "Pembatalan, refund, perubahan data peserta & daftar tunggu",
   "pillar": "2. Visitor & Experience",
   "subdomain": "Event Ticketing",
   "nodes": "ROI Event Atrium",
   "priority": "-",
   "trigger": "Permintaan peserta, acara diubah/dibatalkan, atau pembayaran gagal",
   "source": "Event Ticketing Engine, Payment Gateway Sandbox",
   "protocol": "REST/JSON",
   "dashboard": "EVT",
   "related": "O360, ANL",
   "pic": "EO",
   "kpi": "Refund diproses <= 3x24 jam; kursi refund kembali dijual <= 5 menit",
   "evidence": "Log refund & notifikasi",
   "closure": "Peserta menerima konfirmasi & e-ticket lama nonaktif",
   "auto_action": "E-ticket di-VOID, kursi kembali tersedia, daftar tunggu dikabari",
   "steps": [
    {
     "phase": "1-Deteksi",
     "role": "CS",
     "action": "Terima permintaan (batal/refund/ubah nama) via info desk, email, atau WhatsApp.",
     "dashboard": "EVT",
     "target": "T+0",
     "output": "Permintaan tercatat"
    },
    {
     "phase": "2-Verifikasi",
     "role": "EO",
     "action": "Cek status pesanan & kebijakan (tiket belum check-in, batas waktu).",
     "dashboard": "EVT",
     "target": "T+1 jam",
     "output": "Keputusan"
    },
    {
     "phase": "5-Mitigasi",
     "role": "EO",
     "action": "Ubah data peserta / batalkan pesanan menunggu bayar / proses refund pesanan lunas.",
     "dashboard": "EVT",
     "target": "T+2 jam",
     "output": "Status diperbarui"
    },
    {
     "phase": "7-Pemulihan",
     "role": "FIN",
     "action": "Eksekusi refund ke metode bayar asal (sandbox) & catat di rekonsiliasi.",
     "dashboard": "EVT",
     "target": "<= 3x24 jam",
     "output": "Bukti refund"
    },
    {
     "phase": "8-Penutupan & Pelaporan",
     "role": "EO",
     "action": "Kabari daftar tunggu bahwa kursi tersedia & kirim konfirmasi ke peserta. Acara batal: 'Batalkan acara' di daftar acara (refund otomatis semua pesanan lunas); hapus hanya untuk acara tanpa transaksi.",
     "dashboard": "EVT",
     "target": "T+5 menit",
     "output": "Notifikasi terkirim"
    }
   ]
  }
 ],
 "usecases": [
  {
   "id": "UC-01",
   "name": "Kebocoran pipa chiller & genangan di atrium",
   "trigger": "Sensor tekanan CHW turun + laporan genangan di UG Main Atrium",
   "primary": "BMS",
   "related": "TIC, CCTV, TEN, ENE, ANL",
   "sops": "SOP-BMS-02, SOP-BMS-01, SOP-CC-02",
   "priority": "P2",
   "actors": "BMSO, CCO, MEP, HK, TRO, ENM",
   "goal": "Kebocoran terisolasi <= 10 menit, tanpa pengunjung terpeleset, tenant sekitar terinformasi",
   "ticket": {
    "title": "Kebocoran pipa chiller & genangan air",
    "priority": "P2",
    "category": "Fasilitas MEP, AC & Plumbing",
    "zone": "LG",
    "location": "LG Main Atrium",
    "source": "BMS SCADA #BMS-CH-04",
    "sop": "SOP-BMS-02",
    "cam": "CAM-17",
    "tenant": "",
    "team": "MEP Alpha"
   },
   "steps": [
    {
     "frm": "BMS",
     "to": "BMS",
     "event": "EVT-BMS-ALARM",
     "actor": "BMSO",
     "action": "Alarm tekanan loop CHW Chiller-04 turun 12% & delta T abnormal",
     "data": "asset=CH-04, P=3.1 bar",
     "t": "T+0",
     "fx": "device:CH-04:LEAK"
    },
    {
     "frm": "BMS",
     "to": "TIC",
     "event": "EVT-BMS-ALARM",
     "actor": "CCO",
     "action": "Tiket P2 dibuat otomatis, SLA respons 5 menit aktif",
     "data": "ticket, aset, zona LG",
     "t": "T+0:30",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "CCTV",
     "event": "EVT-CAM-VERIFY",
     "actor": "CCO",
     "action": "Kamera CAM-17 LG Atrium dibuka otomatis, genangan terkonfirmasi",
     "data": "cam=CAM-17",
     "t": "T+1",
     "fx": "cam:CAM-17"
    },
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "CCO",
     "action": "Dispatch MEP Alpha + Janitorial Bravo (yellow cone & wet vac)",
     "data": "team, ETA 3 menit",
     "t": "T+2",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "BMS",
     "to": "BMS",
     "event": "EVT-BMS-ALARM",
     "actor": "BMSO",
     "action": "Chiller-05 standby di-start, valve isolasi segmen CH-04 ditutup",
     "data": "CH-05 RUNNING",
     "t": "T+5",
     "fx": "device:CH-05:RUNNING"
    },
    {
     "frm": "TIC",
     "to": "TEN",
     "event": "EVT-TENANT-BROADCAST",
     "actor": "TRO",
     "action": "Notifikasi tenant LG Atrium: area basah, rute memutar, suhu dapat naik sementara",
     "data": "zone=LG",
     "t": "T+6",
     "fx": "tenant:Area LG Atrium sedang penanganan kebocoran pipa. Mohon arahkan pengunjung memutar."
    },
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "MEP",
     "action": "Tim on-site, pipa di-clamp, area dikeringkan",
     "data": "foto sesudah",
     "t": "T+12",
     "fx": "status:RESOLVED"
    },
    {
     "frm": "BMS",
     "to": "ENE",
     "event": "EVT-ENERGY-ANOMALY",
     "actor": "ENM",
     "action": "Hitung kehilangan air 3.2 m3 & dampak COP sementara",
     "data": "m3, kWh",
     "t": "T+30",
     "fx": ""
    },
    {
     "frm": "TIC",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "SL",
     "action": "MTTR & SLA P2 tercatat; RCA dijadwalkan (tiket berulang)",
     "data": "mttr=12m",
     "t": "T+60",
     "fx": "kpi:MTTR P2 = 12 menit (SLA < 30 menit tercapai)"
    }
   ]
  },
  {
   "id": "UC-02",
   "name": "Eskalator trip (comb-plate) di area ramai",
   "trigger": "PLC fault code comb-plate eskalator E-04 West Atrium",
   "primary": "BMS",
   "related": "TIC, CCTV, ANL",
   "sops": "SOP-BMS-05, SOP-CC-02",
   "priority": "P3",
   "actors": "BMSO, CCO, QRT, MEP, CENG",
   "goal": "Area aman <= 3 menit, tidak ada korban, eskalator kembali beroperasi <= 2 jam",
   "ticket": {
    "title": "Eskalator E-04 mati mendadak (emergency trip)",
    "priority": "P3",
    "category": "Fasilitas MEP, AC & Plumbing",
    "zone": "2F",
    "location": "2F West Atrium E-04",
    "source": "PLC Fault Code ESC-E04",
    "sop": "SOP-BMS-05",
    "cam": "CAM-29",
    "tenant": "",
    "team": "MEP Bravo"
   },
   "steps": [
    {
     "frm": "BMS",
     "to": "BMS",
     "event": "EVT-BMS-ALARM",
     "actor": "BMSO",
     "action": "E-04 TRIP: sensor comb-plate kanan bawah, motor berhenti 0.32 detik",
     "data": "fault=CP-R",
     "t": "T+0",
     "fx": "device:ESC-E04:TRIP"
    },
    {
     "frm": "BMS",
     "to": "TIC",
     "event": "EVT-BMS-ALARM",
     "actor": "CCO",
     "action": "Tiket P3 otomatis",
     "data": "ticket",
     "t": "T+0:20",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "CCTV",
     "event": "EVT-CAM-VERIFY",
     "actor": "CCO",
     "action": "CAM-29 diverifikasi: tidak ada korban, antrean menumpuk di landing",
     "data": "cam=CAM-29",
     "t": "T+1",
     "fx": "cam:CAM-29"
    },
    {
     "frm": "CCTV",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "QRT",
     "action": "Regu Bravo barikade & arahkan ke E-03/lift",
     "data": "team",
     "t": "T+3",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "TIC",
     "to": "BMS",
     "event": "EVT-TICKET-STATUS",
     "actor": "MEP",
     "action": "Teknisi bersihkan benda asing di comb-plate, reset & uji jalan",
     "data": "uji 10 menit",
     "t": "T+40",
     "fx": "device:ESC-E04:RUNNING"
    },
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "CCO",
     "action": "Tiket resolved dengan validasi sensor normal",
     "data": "",
     "t": "T+55",
     "fx": "status:RESOLVED"
    },
    {
     "frm": "TIC",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "CENG",
     "action": "Downtime 55 menit masuk KPI uptime transport vertikal",
     "data": "downtime",
     "t": "T+60",
     "fx": "kpi:Uptime eskalator bulan berjalan 99.7%"
    }
   ]
  },
  {
   "id": "UC-03",
   "name": "Komplain suhu tenant anchor (Zara GF-104)",
   "trigger": "Store manager mengirim komplain suhu fitting room 28 C via WhatsApp",
   "primary": "TEN",
   "related": "TIC, BMS, ENE, O360",
   "sops": "SOP-COM-05, SOP-BMS-01",
   "priority": "P2",
   "actors": "TRO, CCO, MEP, BMSO, ENM",
   "goal": "Suhu kembali <= 24 C <= 30 menit, tenant memberikan CSAT",
   "ticket": {
    "title": "Tenant Zara (GF-104): suhu AC 28 C",
    "priority": "P2",
    "category": "Fasilitas MEP, AC & Plumbing",
    "zone": "GF",
    "location": "GF Luxury Wing Unit GF-104",
    "source": "WhatsApp Tenant",
    "sop": "SOP-COM-05",
    "cam": "CAM-14",
    "tenant": "Zara Flagship Store",
    "team": "MEP Bravo"
   },
   "steps": [
    {
     "frm": "TEN",
     "to": "TEN",
     "event": "EVT-TENANT-MSG",
     "actor": "TRO",
     "action": "Pesan tenant masuk; NLP kategori HVAC; sub-meter menunjukkan 24.8 C (+3.8 delta)",
     "data": "tenant=GF-104",
     "t": "T+0",
     "fx": ""
    },
    {
     "frm": "TEN",
     "to": "TIC",
     "event": "EVT-TICKET-CREATED",
     "actor": "TRO",
     "action": "Konversi chat ke tiket; anchor tenant -> P2",
     "data": "ticket",
     "t": "T+2",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "BMS",
     "event": "EVT-BMS-ALARM",
     "actor": "BMSO",
     "action": "Cek AHU-LUX-01: damper VAV zona fitting room macet 20%",
     "data": "AHU-LUX",
     "t": "T+4",
     "fx": "device:AHU-LUX:FAULT"
    },
    {
     "frm": "TIC",
     "to": "TEN",
     "event": "EVT-TICKET-STATUS",
     "actor": "CCO",
     "action": "Template 'Konfirmasi Jadwal MEP' terkirim ke store manager (ETA 15 menit)",
     "data": "",
     "t": "T+5",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "BMS",
     "to": "BMS",
     "event": "EVT-TICKET-STATUS",
     "actor": "MEP",
     "action": "Re-kalibrasi motorized valve VAV; suhu turun bertahap",
     "data": "",
     "t": "T+20",
     "fx": "device:AHU-LUX:RUNNING"
    },
    {
     "frm": "TIC",
     "to": "TEN",
     "event": "EVT-TICKET-STATUS",
     "actor": "TRO",
     "action": "Konfirmasi tenant suhu 23.5 C; tiket ditutup; survei CSAT",
     "data": "csat=5",
     "t": "T+32",
     "fx": "status:RESOLVED"
    },
    {
     "frm": "BMS",
     "to": "ENE",
     "event": "EVT-ENERGY-ANOMALY",
     "actor": "ENM",
     "action": "Catat pemakaian sub-meter selama gangguan (tidak ditagihkan)",
     "data": "",
     "t": "T+60",
     "fx": ""
    },
    {
     "frm": "TEN",
     "to": "O360",
     "event": "EVT-KPI-UPDATE",
     "actor": "LSG",
     "action": "Riwayat SLA tenant anchor diperbarui untuk evaluasi renewal",
     "data": "",
     "t": "H+1",
     "fx": "kpi:Skor kepuasan Zara 98.2%"
    }
   ]
  },
  {
   "id": "UC-04",
   "name": "Kebakaran dapur F&B (Code Red)",
   "trigger": "FACP smoke+heat detector dapur Food Court 3F + thermal CCTV",
   "primary": "CCTV",
   "related": "TIC, BMS, TEN, PARK, ANL, O360",
   "sops": "SOP-SEC-01, SOP-CC-03",
   "priority": "P1",
   "actors": "CCO, CSEC, ERT, BMSO, TRO, PKR, GM, BOD, HSE",
   "goal": "Api padam / evakuasi zona < 15 menit, 0 korban, owner terinformasi detik pertama",
   "ticket": {
    "title": "Alarm kebakaran dapur F&B Food Court 3F",
    "priority": "P1",
    "category": "Keamanan, Parkir & Crowd",
    "zone": "3F",
    "location": "3F Food Court - Dapur Unit L3-22",
    "source": "FACP Zone 3F-FC-07 + Thermal CAM-08",
    "sop": "SOP-SEC-01",
    "cam": "CAM-08",
    "tenant": "Food Avenue - Haidilao Hotpot",
    "team": "ERT Alpha"
   },
   "steps": [
    {
     "frm": "BMS",
     "to": "CCTV",
     "event": "EVT-FACP-FIRE",
     "actor": "CCO",
     "action": "FACP zone 3F-FC-07 aktif; kamera thermal CAM-08 otomatis tampil fullscreen",
     "data": "detector=3F-FC-07",
     "t": "T+0",
     "fx": "cam:CAM-08"
    },
    {
     "frm": "CCTV",
     "to": "TIC",
     "event": "EVT-CAM-AI",
     "actor": "CCO",
     "action": "Titik api terkonfirmasi visual; tiket P1 CODE RED",
     "data": "ticket",
     "t": "T+0:40",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "O360",
     "event": "EVT-ESCALATION",
     "actor": "SL",
     "action": "Notifikasi WhatsApp/Call prioritas ke GM & Owner (detik ke-1)",
     "data": "level=L1+L2",
     "t": "T+1",
     "fx": "escalate:L2 GM & Owner"
    },
    {
     "frm": "CCTV",
     "to": "BMS",
     "event": "EVT-FACP-FIRE",
     "actor": "BMSO",
     "action": "Interlock: AHU-FC OFF, smoke exhaust ON, fire curtain turun, lift recall",
     "data": "AHU-FC",
     "t": "T+1",
     "fx": "device:AHU-FC:OFF"
    },
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "ERT",
     "action": "ERT Alpha padamkan dengan APAR & hydrant (tekanan 7 bar)",
     "data": "",
     "t": "T+2",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "TIC",
     "to": "TEN",
     "event": "EVT-TENANT-BROADCAST",
     "actor": "TRO",
     "action": "Broadcast darurat tenant 3F: matikan kompor & gas, evakuasi karyawan",
     "data": "zone=3F",
     "t": "T+3",
     "fx": "tenant:CODE RED 3F Food Court. Matikan gas & listrik dapur, evakuasi melalui tangga darurat terdekat."
    },
    {
     "frm": "TIC",
     "to": "PARK",
     "event": "EVT-TICKET-STATUS",
     "actor": "PKR",
     "action": "Free-exit semua gate & kosongkan jalur akses Damkar",
     "data": "gate=ALL",
     "t": "T+5",
     "fx": "device:GATE-ALL:OPEN"
    },
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "CSEC",
     "action": "Api padam, headcount lengkap, Damkar menyatakan aman",
     "data": "",
     "t": "T+13",
     "fx": "status:RESOLVED"
    },
    {
     "frm": "TIC",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "HSE",
     "action": "Laporan insiden + RCA (exhaust hood berminyak) ke BOD",
     "data": "",
     "t": "H+1",
     "fx": "kpi:Insiden K3 P1 tertangani 13 menit (target < 15)"
    }
   ]
  },
  {
   "id": "UC-05",
   "name": "Orang dalam pengawasan & barang tak bertuan",
   "trigger": "AI Face Recognition watchlist #WL-402 di Atrium GF + objek tak bertuan di Koridor 2F",
   "primary": "CCTV",
   "related": "TIC, TEN, ANL",
   "sops": "SOP-SEC-04, SOP-SEC-03",
   "priority": "P2",
   "actors": "CCO, CSEC, QRT, TRO, CS",
   "goal": "Intersep <= 5 menit; objek diklarifikasi <= 15 menit",
   "ticket": {
    "title": "Deteksi orang dalam pengawasan (#WL-402) Atrium GF",
    "priority": "P2",
    "category": "Keamanan, Parkir & Crowd",
    "zone": "GF",
    "location": "GF Atrium dekat Rolex",
    "source": "AI FR CAM-01",
    "sop": "SOP-SEC-04",
    "cam": "CAM-01",
    "tenant": "",
    "team": "Regu Bravo"
   },
   "steps": [
    {
     "frm": "CCTV",
     "to": "CCTV",
     "event": "EVT-CAM-AI",
     "actor": "CCO",
     "action": "AI FR akurasi 94.2% -> target #WL-402 di CAM-01",
     "data": "conf=0.942",
     "t": "T+0",
     "fx": "cam:CAM-01"
    },
    {
     "frm": "CCTV",
     "to": "TIC",
     "event": "EVT-TICKET-CREATED",
     "actor": "CCO",
     "action": "Tiket P2 + rekomendasi regu terdekat (Bravo Pos 1)",
     "data": "ticket",
     "t": "T+1",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "CCTV",
     "event": "EVT-TICKET-STATUS",
     "actor": "QRT",
     "action": "Kirim intersep; tracking multi-kamera CAM-01 -> CAM-14",
     "data": "",
     "t": "T+2",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "CCTV",
     "to": "TEN",
     "event": "EVT-TENANT-BROADCAST",
     "actor": "TRO",
     "action": "Info diskret ke tenant luxury GF untuk waspada",
     "data": "zone=GF",
     "t": "T+3",
     "fx": "tenant:Mohon waspada, tim security sedang menangani situasi di Atrium GF."
    },
    {
     "frm": "CCTV",
     "to": "TIC",
     "event": "EVT-CAM-AI",
     "actor": "CCO",
     "action": "Paralel: objek tas ransel hitam > 12 menit di CAM-33 Koridor 2F -> SOP-SEC-03",
     "data": "cam=CAM-33",
     "t": "T+4",
     "fx": "cam:CAM-33"
    },
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "CSEC",
     "action": "Target dikonfirmasi & diserahkan ke Polisi; tas ternyata milik pengunjung (Lost & Found)",
     "data": "",
     "t": "T+12",
     "fx": "status:RESOLVED"
    },
    {
     "frm": "CCTV",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "CSEC",
     "action": "Ekspor bukti video watermark; KPI respons keamanan",
     "data": "",
     "t": "T+60",
     "fx": "kpi:Respons insiden keamanan rata-rata 2.4 menit"
    }
   ]
  },
  {
   "id": "UC-06",
   "name": "Antrean gate parkir utama > 8 mobil",
   "trigger": "ANPR queue alert gate P1 Utara saat jam makan siang akhir pekan",
   "primary": "PARK",
   "related": "TIC, CCTV, ANL",
   "sops": "SOP-PRK-01",
   "priority": "P3",
   "actors": "PKR, CCO, QRT",
   "goal": "Antrean terurai <= 10 menit tanpa meluber ke jalan raya",
   "ticket": {
    "title": "Antrean gate masuk P1 Utara 11 mobil",
    "priority": "P3",
    "category": "Keamanan, Parkir & Crowd",
    "zone": "BASEMENT",
    "location": "Gate Masuk P1 Utara",
    "source": "ANPR CAM-61",
    "sop": "SOP-PRK-01",
    "cam": "CAM-61",
    "tenant": "",
    "team": "Tim Parkir"
   },
   "steps": [
    {
     "frm": "PARK",
     "to": "PARK",
     "event": "EVT-PARK-QUEUE",
     "actor": "PKR",
     "action": "Antrean 11 mobil, waktu proses 22 detik/mobil (reader e-money lambat)",
     "data": "gate=G1",
     "t": "T+0",
     "fx": "device:GATE-G1:FAULT"
    },
    {
     "frm": "PARK",
     "to": "PARK",
     "event": "EVT-PARK-QUEUE",
     "actor": "PKR",
     "action": "Gate tambahan G2 (reversible) dibuka otomatis",
     "data": "gate=G2",
     "t": "T+1",
     "fx": "device:GATE-G2:OPEN"
    },
    {
     "frm": "PARK",
     "to": "CCTV",
     "event": "EVT-CAM-VERIFY",
     "actor": "CCO",
     "action": "CAM-61 menunjukkan antrean mendekati bahu jalan raya",
     "data": "",
     "t": "T+2",
     "fx": "cam:CAM-61"
    },
    {
     "frm": "PARK",
     "to": "TIC",
     "event": "EVT-TICKET-CREATED",
     "actor": "CCO",
     "action": "Tiket P3 + dispatch petugas handheld QRIS",
     "data": "ticket",
     "t": "T+3",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "PARK",
     "event": "EVT-TICKET-STATUS",
     "actor": "PKR",
     "action": "Petugas manual tapping; reader G1 di-restart",
     "data": "",
     "t": "T+5",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "PARK",
     "to": "PARK",
     "event": "EVT-PARK-QUEUE",
     "actor": "PKR",
     "action": "Antrean < 4 mobil; G1 normal",
     "data": "",
     "t": "T+11",
     "fx": "device:GATE-G1:NORMAL"
    },
    {
     "frm": "TIC",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "PKR",
     "action": "Waktu antrean gate masuk KPI parkir (warning)",
     "data": "",
     "t": "T+20",
     "fx": "status:RESOLVED"
    }
   ]
  },
  {
   "id": "UC-07",
   "name": "Peak load WBP & peak shaving otomatis",
   "trigger": "Prediksi beban 15.6 MW mendekati batas kontrak 16.5 MVA pukul 18:30",
   "primary": "ENE",
   "related": "BMS, TEN, ANL, O360",
   "sops": "SOP-BMS-04",
   "priority": "P3",
   "actors": "ENM, BMSO, TRO, FIN",
   "goal": "Beban < 85% kontrak sepanjang WBP; hemat biaya >= Rp 18 Jt/sesi",
   "ticket": {
    "title": "Prediksi peak load WBP 18:00-22:00",
    "priority": "P3",
    "category": "Energi & Utilitas",
    "zone": "ALL",
    "location": "Gardu Induk B1",
    "source": "Smart Power Meter PLN",
    "sop": "SOP-BMS-04",
    "cam": "",
    "tenant": "",
    "team": "Energy Desk"
   },
   "steps": [
    {
     "frm": "ENE",
     "to": "ENE",
     "event": "EVT-ENERGY-ANOMALY",
     "actor": "ENM",
     "action": "Model memprediksi beban 15.6 MW (94% kontrak) pukul 18:30",
     "data": "kw=15600",
     "t": "T-30",
     "fx": "ticket"
    },
    {
     "frm": "ENE",
     "to": "BMS",
     "event": "EVT-ENERGY-ANOMALY",
     "actor": "BMSO",
     "action": "Perintah peak shaving: BESS 1.5 MWh discharge, CHW setpoint +0.5 C",
     "data": "",
     "t": "T-15",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "BMS",
     "to": "BMS",
     "event": "EVT-BMS-ALARM",
     "actor": "BMSO",
     "action": "DALI dimming parkir 40%, eskalator slow-speed",
     "data": "",
     "t": "T+0",
     "fx": ""
    },
    {
     "frm": "ENE",
     "to": "TEN",
     "event": "EVT-TENANT-BROADCAST",
     "actor": "TRO",
     "action": "Himbauan top-4 konsumen (XXI, Hypermart, Food Avenue, Zara) kurangi beban non-esensial",
     "data": "",
     "t": "T+0",
     "fx": "tenant:Himbauan hemat energi WBP 18:00-22:00: matikan beban non-esensial (display ekstra, AC gudang)."
    },
    {
     "frm": "ENE",
     "to": "ENE",
     "event": "EVT-KPI-UPDATE",
     "actor": "ENM",
     "action": "Beban terjaga 14.2 MW (86%)",
     "data": "",
     "t": "T+120",
     "fx": "status:RESOLVED"
    },
    {
     "frm": "ENE",
     "to": "O360",
     "event": "EVT-KPI-UPDATE",
     "actor": "FIN",
     "action": "Penghematan Rp 18.5 Jt masuk Opex energi & NOI",
     "data": "",
     "t": "H+1",
     "fx": "kpi:Hemat WBP Rp 18.5 Jt / sesi"
    }
   ]
  },
  {
   "id": "UC-08",
   "name": "Pemadaman PLN & genset gagal sinkron",
   "trigger": "Tegangan PLN 20 kV hilang, ATS transfer, Genset 03 gagal sinkron",
   "primary": "BMS",
   "related": "TIC, CCTV, ENE, TEN, O360, ANL",
   "sops": "SOP-BMS-03, SOP-BMS-05, SOP-CC-03",
   "priority": "P2",
   "actors": "BMSO, CCO, MEP, QRT, CENG, TRO, GM",
   "goal": "Daya kritikal pulih <= 30 menit; tidak ada penumpang lift terjebak > 15 menit",
   "ticket": {
    "title": "Pemadaman PLN, Genset 03 gagal sinkron",
    "priority": "P2",
    "category": "Fasilitas MEP, AC & Plumbing",
    "zone": "ALL",
    "location": "Gardu Trafo B1 / Genset Room",
    "source": "ATS & Genset Controller",
    "sop": "SOP-BMS-03",
    "cam": "CAM-88",
    "tenant": "",
    "team": "MEP Alpha"
   },
   "steps": [
    {
     "frm": "BMS",
     "to": "BMS",
     "event": "EVT-BMS-ALARM",
     "actor": "BMSO",
     "action": "PLN loss; ATS transfer 11 detik; GEN-03 fail-to-sync",
     "data": "",
     "t": "T+0",
     "fx": "device:GEN-03:FAULT"
    },
    {
     "frm": "BMS",
     "to": "TIC",
     "event": "EVT-BMS-ALARM",
     "actor": "CCO",
     "action": "Tiket P2; instruksi cek lift terjebak",
     "data": "ticket",
     "t": "T+1",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "CCTV",
     "event": "EVT-TICKET-STATUS",
     "actor": "QRT",
     "action": "Cek kabin lift via kamera & intercom: 1 kabin L-03 berhenti antar lantai",
     "data": "",
     "t": "T+2",
     "fx": "cam:CAM-88"
    },
    {
     "frm": "TIC",
     "to": "BMS",
     "event": "EVT-TICKET-STATUS",
     "actor": "MEP",
     "action": "Sinkronisasi manual GEN-03; load shedding fasad & 30% AHU",
     "data": "",
     "t": "T+6",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "TIC",
     "to": "TEN",
     "event": "EVT-TENANT-BROADCAST",
     "actor": "TRO",
     "action": "Broadcast status listrik ke seluruh tenant",
     "data": "",
     "t": "T+8",
     "fx": "tenant:Gangguan suplai PLN. Daya genset aktif; mohon kurangi beban non-esensial. Estimasi normal 30 menit."
    },
    {
     "frm": "TIC",
     "to": "O360",
     "event": "EVT-ESCALATION",
     "actor": "CENG",
     "action": "Belum pulih 15 menit -> eskalasi GM",
     "data": "",
     "t": "T+15",
     "fx": "escalate:L1 GM"
    },
    {
     "frm": "BMS",
     "to": "BMS",
     "event": "EVT-BMS-ALARM",
     "actor": "BMSO",
     "action": "PLN kembali; transfer balik; semua genset standby",
     "data": "",
     "t": "T+26",
     "fx": "device:GEN-03:STANDBY"
    },
    {
     "frm": "BMS",
     "to": "ENE",
     "event": "EVT-ENERGY-ANOMALY",
     "actor": "ENM",
     "action": "Audit solar terpakai 420 L & biaya",
     "data": "",
     "t": "H+1",
     "fx": "status:RESOLVED"
    }
   ]
  },
  {
   "id": "UC-09",
   "name": "Toilet bau (NH3) & feedback QR pengunjung",
   "trigger": "Sensor NH3 toilet 2F > 25 ppm + 3 scan QR 'bau'",
   "primary": "TIC",
   "related": "CCTV, ANL",
   "sops": "SOP-SEC-07, SOP-VIS-03",
   "priority": "P4",
   "actors": "CCO, HK, CS",
   "goal": "Respons <= 15 menit, resolusi <= 45 menit, auto-close saat sensor normal",
   "ticket": {
    "title": "Toilet pria 2F bau (NH3 32 ppm) & tisu habis",
    "priority": "P4",
    "category": "Kebersihan & Sanitasi",
    "zone": "2F",
    "location": "Toilet Pria 2F Timur",
    "source": "Smart Toilet NH3 + QR",
    "sop": "SOP-SEC-07",
    "cam": "",
    "tenant": "",
    "team": "Janitorial Crew"
   },
   "steps": [
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-CREATED",
     "actor": "CCO",
     "action": "Tiket P4 otomatis dari sensor + 3 feedback QR digabung",
     "data": "ticket",
     "t": "T+0",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "HK",
     "action": "Janitorial Crew 2F menerima push",
     "data": "",
     "t": "T+3",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "HK",
     "action": "Pembersihan & isi ulang tisu; foto sesudah",
     "data": "",
     "t": "T+14",
     "fx": "status:RESOLVED"
    },
    {
     "frm": "TIC",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "SL",
     "action": "Sensor normal 15 menit -> auto-close; skor vendor cleaning",
     "data": "",
     "t": "T+30",
     "fx": "kpi:SLA P4 kebersihan 100% bulan ini"
    }
   ]
  },
  {
   "id": "UC-10",
   "name": "Tenant menunggak > 60 hari",
   "trigger": "AR aging tenant 2F mencapai 61 hari",
   "primary": "O360",
   "related": "TEN, BMS, ANL",
   "sops": "SOP-FIN-02",
   "priority": "-",
   "actors": "FIN, TRO, GM, CENG",
   "goal": "Tenant melunasi / restrukturisasi; pembatasan fasilitas terkendali",
   "ticket": {
    "title": "Tunggakan > 60 hari unit 2F-31",
    "priority": "P4",
    "category": "Tenant Fit-Out & Kasir IT",
    "zone": "2F",
    "location": "Unit 2F-31",
    "source": "ERP Finance AR Aging",
    "sop": "SOP-FIN-02",
    "cam": "",
    "tenant": "Gadget Hub 2F-31",
    "team": "Finance AR"
   },
   "steps": [
    {
     "frm": "O360",
     "to": "O360",
     "event": "EVT-AR-OVERDUE",
     "actor": "FIN",
     "action": "AR aging 61 hari, Rp 384 Jt",
     "data": "",
     "t": "H+0",
     "fx": "ticket"
    },
    {
     "frm": "O360",
     "to": "TEN",
     "event": "EVT-AR-OVERDUE",
     "actor": "TRO",
     "action": "SP-2 otomatis via Tenant App; jadwal kunjungan TRO",
     "data": "",
     "t": "H+0",
     "fx": "tenant:SP-2: Tagihan unit 2F-31 telah melewati 60 hari. Mohon segera melakukan pelunasan."
    },
    {
     "frm": "O360",
     "to": "BMS",
     "event": "EVT-AR-OVERDUE",
     "actor": "CENG",
     "action": "Atas persetujuan GM: blokir izin overtime AC unit 2F-31",
     "data": "",
     "t": "H+1",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "TEN",
     "to": "O360",
     "event": "EVT-KPI-UPDATE",
     "actor": "FIN",
     "action": "Tenant setuju cicilan 3x; pembatasan dicabut otomatis saat pembayaran pertama",
     "data": "",
     "t": "H+7",
     "fx": "status:RESOLVED"
    },
    {
     "frm": "O360",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "FIN",
     "action": "Collection ratio & AR > 60 hari diperbarui",
     "data": "",
     "t": "H+7",
     "fx": "kpi:Collection ratio 91.5% -> 92.8%"
    }
   ]
  },
  {
   "id": "UC-11",
   "name": "Izin overtime AC & loading dock tenant malam",
   "trigger": "Cinema XXI meminta overtime AC 00:00-03:00 & bongkar muat B2",
   "primary": "TEN",
   "related": "BMS, CCTV, ENE, O360",
   "sops": "SOP-COM-06, SOP-COM-02",
   "priority": "P3",
   "actors": "TRO, CENG, BMSO, CSEC, FIN",
   "goal": "Izin disetujui <= 2 jam, overtime tertagih otomatis",
   "ticket": {
    "title": "Izin overtime AC & loading dock Cinema XXI",
    "priority": "P3",
    "category": "Tenant Fit-Out & Kasir IT",
    "zone": "3F",
    "location": "3F Cinema West / Dock B2",
    "source": "Tenant App FORM-OT-2026-884",
    "sop": "SOP-COM-06",
    "cam": "CAM-88",
    "tenant": "Cinema XXI & IMAX",
    "team": "Tenant Relation"
   },
   "steps": [
    {
     "frm": "TEN",
     "to": "TEN",
     "event": "EVT-TENANT-MSG",
     "actor": "TRO",
     "action": "Form overtime diterima",
     "data": "",
     "t": "T+0",
     "fx": "ticket"
    },
    {
     "frm": "TEN",
     "to": "BMS",
     "event": "EVT-PERMIT",
     "actor": "CENG",
     "action": "Kapasitas chiller malam cukup; AHU-CIN dijadwalkan 00:00-03:00",
     "data": "",
     "t": "T+30",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "TEN",
     "to": "CCTV",
     "event": "EVT-PERMIT",
     "actor": "CSEC",
     "action": "Pos dock B2 & CAM-88 ditandai 'pekerjaan berizin'",
     "data": "",
     "t": "T+40",
     "fx": "cam:CAM-88"
    },
    {
     "frm": "BMS",
     "to": "ENE",
     "event": "EVT-PERMIT",
     "actor": "ENM",
     "action": "Sub-meter AHU-CIN dicatat 00:00-03:00 (165 kWh)",
     "data": "",
     "t": "H+1",
     "fx": "status:RESOLVED"
    },
    {
     "frm": "ENE",
     "to": "O360",
     "event": "EVT-KPI-UPDATE",
     "actor": "FIN",
     "action": "Tagihan overtime otomatis masuk invoice bulan berjalan",
     "data": "",
     "t": "H+1",
     "fx": "kpi:Recovery utilitas overtime +Rp 2.1 Jt"
    }
   ]
  },
  {
   "id": "UC-12",
   "name": "Kebocoran air malam hari (flow anomali)",
   "trigger": "Flow meter PDAM 02:00 menunjukkan 9 m3/jam saat mall tutup (baseline 2)",
   "primary": "ENE",
   "related": "TIC, BMS, CCTV",
   "sops": "SOP-BMS-02",
   "priority": "P2",
   "actors": "ENM, CCO, MEP, QRT",
   "goal": "Sumber kebocoran ditemukan sebelum mall buka",
   "ticket": {
    "title": "Flow air malam abnormal 9 m3/jam",
    "priority": "P2",
    "category": "Fasilitas MEP, AC & Plumbing",
    "zone": "LG",
    "location": "Riser Pipa LG Timur",
    "source": "Smart Flow Meter FM-PDAM-01",
    "sop": "SOP-BMS-02",
    "cam": "CAM-17",
    "tenant": "",
    "team": "MEP Siaga Malam"
   },
   "steps": [
    {
     "frm": "ENE",
     "to": "ENE",
     "event": "EVT-ENERGY-ANOMALY",
     "actor": "ENM",
     "action": "Anomali flow malam 4.5x baseline",
     "data": "",
     "t": "T+0",
     "fx": ""
    },
    {
     "frm": "ENE",
     "to": "TIC",
     "event": "EVT-ENERGY-ANOMALY",
     "actor": "CCO",
     "action": "Tiket P2 investigasi",
     "data": "ticket",
     "t": "T+2",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "BMS",
     "event": "EVT-TICKET-STATUS",
     "actor": "MEP",
     "action": "Sensor akustik pipa melokalisasi riser LG Timur",
     "data": "",
     "t": "T+10",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "TIC",
     "to": "CCTV",
     "event": "EVT-CAM-VERIFY",
     "actor": "QRT",
     "action": "Patroli malam & CAM-17 konfirmasi rembesan di shaft",
     "data": "",
     "t": "T+15",
     "fx": "cam:CAM-17"
    },
    {
     "frm": "BMS",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "MEP",
     "action": "Valve segmen ditutup; perbaikan fitting",
     "data": "",
     "t": "T+45",
     "fx": "status:RESOLVED"
    }
   ]
  },
  {
   "id": "UC-13",
   "name": "Kerumunan event atrium melebihi kapasitas",
   "trigger": "Kerapatan Atrium Utama 92% saat meet & greet artis",
   "primary": "CCTV",
   "related": "TIC, BMS, O360, PARK",
   "sops": "SOP-VIS-01, SOP-COM-04",
   "priority": "P2",
   "actors": "CCO, CSEC, QRT, BMSO, MKT, PKR",
   "goal": "Kepadatan < 70% <= 20 menit, 0 insiden desak-desakan",
   "ticket": {
    "title": "Kepadatan Atrium Utama 92% (event meet & greet)",
    "priority": "P2",
    "category": "Keamanan, Parkir & Crowd",
    "zone": "GF",
    "location": "GF Atrium Cibadak",
    "source": "AI Crowd Density CAM-01",
    "sop": "SOP-VIS-01",
    "cam": "CAM-01",
    "tenant": "",
    "team": "Regu Alpha + Bravo"
   },
   "steps": [
    {
     "frm": "CCTV",
     "to": "CCTV",
     "event": "EVT-CAM-AI",
     "actor": "CCO",
     "action": "Kerapatan 92%, laju +142 orang/menit",
     "data": "",
     "t": "T+0",
     "fx": "cam:CAM-01"
    },
    {
     "frm": "CCTV",
     "to": "TIC",
     "event": "EVT-TICKET-CREATED",
     "actor": "CCO",
     "action": "Tiket P2 crowd control",
     "data": "ticket",
     "t": "T+1",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "CCTV",
     "event": "EVT-TICKET-STATUS",
     "actor": "CSEC",
     "action": "Regu Alpha & Bravo buka jalur alternatif, antrean berlapis",
     "data": "",
     "t": "T+3",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "CCTV",
     "to": "BMS",
     "event": "EVT-BMS-ALARM",
     "actor": "BMSO",
     "action": "CO2 atrium 980 ppm -> AHU-ATR suplai udara +25%",
     "data": "",
     "t": "T+5",
     "fx": "device:AHU-ATR:BOOST"
    },
    {
     "frm": "TIC",
     "to": "PARK",
     "event": "EVT-PARK-QUEUE",
     "actor": "PKR",
     "action": "Antisipasi lonjakan keluar: buka gate tambahan",
     "data": "",
     "t": "T+10",
     "fx": "device:GATE-G2:OPEN"
    },
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "CSEC",
     "action": "Kepadatan 65%; event lanjut aman",
     "data": "",
     "t": "T+18",
     "fx": "status:RESOLVED"
    },
    {
     "frm": "CCTV",
     "to": "O360",
     "event": "EVT-KPI-UPDATE",
     "actor": "MKT",
     "action": "Data puncak footfall & dwell time event untuk ROI",
     "data": "",
     "t": "H+1",
     "fx": "kpi:Footfall event +38% vs hari biasa"
    }
   ]
  },
  {
   "id": "UC-14",
   "name": "Predictive maintenance eskalator sebelum akhir pekan",
   "trigger": "Tren getaran E-07 naik ke 2.6 mm/s (batas 2.8) hari Kamis",
   "primary": "BMS",
   "related": "TIC, ANL",
   "sops": "SOP-BMS-06",
   "priority": "P3",
   "actors": "BMSO, CENG, MEP",
   "goal": "Perbaikan terencana malam Jumat, 0 downtime tak terencana akhir pekan",
   "ticket": {
    "title": "PM eskalator E-07, getaran naik 2.6 mm/s",
    "priority": "P3",
    "category": "Fasilitas MEP, AC & Plumbing",
    "zone": "1F",
    "location": "1F East E-07",
    "source": "Vibration IoT ESC-E07",
    "sop": "SOP-BMS-06",
    "cam": "",
    "tenant": "",
    "team": "MEP Bravo"
   },
   "steps": [
    {
     "frm": "BMS",
     "to": "BMS",
     "event": "EVT-BMS-ALARM",
     "actor": "BMSO",
     "action": "Model prediktif: probabilitas fault 7 hari 68%",
     "data": "",
     "t": "T+0",
     "fx": "device:ESC-E07:WARN"
    },
    {
     "frm": "BMS",
     "to": "TIC",
     "event": "EVT-TICKET-CREATED",
     "actor": "CENG",
     "action": "Work order PM malam Jumat 23:00",
     "data": "ticket",
     "t": "T+30",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "BMS",
     "event": "EVT-TICKET-STATUS",
     "actor": "MEP",
     "action": "Ganti bearing & pelumasan step chain",
     "data": "",
     "t": "H+1",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "BMS",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "CENG",
     "action": "Getaran 0.9 mm/s; MTBF diperbarui",
     "data": "",
     "t": "H+3",
     "fx": "device:ESC-E07:RUNNING"
    },
    {
     "frm": "TIC",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "CENG",
     "action": "Downtime tak terencana bulan ini tetap 0.5 jam",
     "data": "",
     "t": "H+3",
     "fx": "status:RESOLVED"
    }
   ]
  },
  {
   "id": "UC-15",
   "name": "Anak hilang (Code Adam)",
   "trigger": "Orang tua melapor ke Info Desk GF: anak 6 tahun baju merah",
   "primary": "TIC",
   "related": "CCTV, PARK, TEN",
   "sops": "SOP-SEC-09",
   "priority": "P1",
   "actors": "CS, CCO, CSEC, QRT, PKR, TRO",
   "goal": "Anak ditemukan <= 15 menit",
   "ticket": {
    "title": "Code Adam: anak 6 th baju merah",
    "priority": "P1",
    "category": "Keamanan, Parkir & Crowd",
    "zone": "2F",
    "location": "2F Kids Zone (lokasi terakhir)",
    "source": "Info Desk GF",
    "sop": "SOP-SEC-09",
    "cam": "CAM-33",
    "tenant": "",
    "team": "Seluruh Regu"
   },
   "steps": [
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-CREATED",
     "actor": "CS",
     "action": "Data & foto anak diinput; Code Adam aktif",
     "data": "ticket",
     "t": "T+0",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "PARK",
     "event": "EVT-TICKET-STATUS",
     "actor": "PKR",
     "action": "Semua pintu & gate parkir awasi anak keluar",
     "data": "",
     "t": "T+1",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "TIC",
     "to": "CCTV",
     "event": "EVT-CAM-AI",
     "actor": "CCO",
     "action": "AI attribute search 'baju merah, anak' -> CAM-33 2F 4 menit lalu",
     "data": "",
     "t": "T+3",
     "fx": "cam:CAM-33"
    },
    {
     "frm": "TIC",
     "to": "TEN",
     "event": "EVT-TENANT-BROADCAST",
     "actor": "TRO",
     "action": "Info ke tenant 2F (Kids & Toys) ciri anak",
     "data": "",
     "t": "T+4",
     "fx": "tenant:CODE ADAM: anak laki-laki 6 th, baju merah, terakhir di 2F Kids Zone. Hubungi Command Center bila melihat."
    },
    {
     "frm": "CCTV",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "QRT",
     "action": "Anak ditemukan di toko mainan 2F; diserahkan dengan verifikasi",
     "data": "",
     "t": "T+9",
     "fx": "status:RESOLVED"
    }
   ]
  },
  {
   "id": "UC-16",
   "name": "Laporan BOD bulanan gabungan",
   "trigger": "Akhir bulan / permintaan Direksi",
   "primary": "ANL",
   "related": "O360, TIC, BMS, ENE, TEN, CCTV, PARK",
   "sops": "SOP-FIN-04, SOP-FIN-03",
   "priority": "-",
   "actors": "FIN, GM, BOD",
   "goal": "Paket laporan BOD terbit <= H+5",
   "ticket": {
    "title": "Susun laporan BOD bulanan",
    "priority": "P4",
    "category": "Tenant Fit-Out & Kasir IT",
    "zone": "ALL",
    "location": "Command Center",
    "source": "Generator Laporan",
    "sop": "SOP-FIN-04",
    "cam": "",
    "tenant": "",
    "team": "Finance & GM Office"
   },
   "steps": [
    {
     "frm": "TIC",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "FIN",
     "action": "Tarik KPI tiket: total, breach, MTTR, eskalasi",
     "data": "",
     "t": "H+1",
     "fx": "ticket"
    },
    {
     "frm": "ENE",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "ENM",
     "action": "Tarik IKE, biaya energi, penghematan, ESG",
     "data": "",
     "t": "H+1",
     "fx": ""
    },
    {
     "frm": "O360",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "FIN",
     "action": "Tarik okupansi, OCR, AR aging, NOI",
     "data": "",
     "t": "H+1",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "ANL",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "GM",
     "action": "Review & komentar GM; rekomendasi AI ditambahkan",
     "data": "",
     "t": "H+3",
     "fx": ""
    },
    {
     "frm": "ANL",
     "to": "O360",
     "event": "EVT-KPI-UPDATE",
     "actor": "BOD",
     "action": "Laporan disetujui; target & capex diperbarui",
     "data": "",
     "t": "H+5",
     "fx": "status:RESOLVED"
    }
   ]
  },
  {
   "id": "UC-17",
   "name": "Hari-H acara atrium: indikasi tiket palsu & lonjakan check-in",
   "trigger": ">= 3 pindaian QR tidak valid/duplikat di Gate A dalam 10 menit saat konser Atrium Cibadak",
   "primary": "EVT",
   "related": "TIC, CCTV, PARK, ANL",
   "sops": "SOP-EVT-03, SOP-EVT-01",
   "priority": "P2",
   "actors": "GTE, EO, CCO, QRT, CSEC, PKR",
   "goal": "Gate kembali normal <= 30 menit; 0 tiket dipakai dua kali",
   "ticket": {
    "title": "Indikasi tiket palsu/calo di Gate A Atrium Cibadak",
    "priority": "P2",
    "category": "Keamanan, Parkir & Crowd",
    "zone": "GF",
    "location": "Gate A (Lobby Utama) - Atrium Cibadak",
    "source": "Event Check-in (DB-EVT)",
    "sop": "SOP-EVT-03",
    "cam": "CAM-01",
    "tenant": "",
    "team": "Regu Bravo"
   },
   "steps": [
    {
     "frm": "EVT",
     "to": "EVT",
     "event": "EVT-EVENT-CHECKIN",
     "actor": "GTE",
     "action": "Gate A: 3 QR TIDAK VALID (tanda tangan tidak cocok) & 1 SUDAH DIGUNAKAN dalam 8 menit",
     "data": "gate=A, invalid=3, used=1",
     "t": "T+0",
     "fx": ""
    },
    {
     "frm": "EVT",
     "to": "TIC",
     "event": "EVT-TICKET-CREATED",
     "actor": "CCO",
     "action": "Petugas gate/pengelola melapor ke Command Center; operator CC membuat tiket insiden P2 indikasi tiket palsu/calo dari Pemantauan Event → Gate & Keamanan",
     "data": "ticket",
     "t": "T+2",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "CCTV",
     "event": "EVT-CAM-VERIFY",
     "actor": "QRT",
     "action": "CAM-01 diarahkan ke Gate A; pelaku penjual QR hasil tangkapan layar teridentifikasi",
     "data": "",
     "t": "T+5",
     "fx": "cam:CAM-01"
    },
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "QRT",
     "action": "Regu Bravo tiba di Gate A, pelaku diamankan ke pos keamanan",
     "data": "",
     "t": "T+7",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "EVT",
     "to": "PARK",
     "event": "EVT-PARK-QUEUE",
     "actor": "PKR",
     "action": "Antrean gate acara > 15 menit: buka gate parkir tambahan & arahkan drop-off",
     "data": "",
     "t": "T+10",
     "fx": "device:GATE-G2:OPEN"
    },
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "CSEC",
     "action": "Gate B dibuka sebagai gate tambahan; antrean normal, bukti disimpan",
     "data": "",
     "t": "T+25",
     "fx": "status:RESOLVED"
    },
    {
     "frm": "EVT",
     "to": "ANL",
     "event": "EVT-KPI-UPDATE",
     "actor": "EO",
     "action": "Kehadiran, waktu check-in & insiden gate masuk laporan pasca-acara",
     "data": "",
     "t": "H+1",
     "fx": "kpi:Check-in konser: 1 insiden calo tertangani <= 25 menit"
    }
   ]
  },
  {
   "id": "UC-18",
   "name": "Rebutan kursi & pembayaran gagal saat penjualan dibuka",
   "trigger": "Penjualan konser dibuka: dua pembeli memilih kursi VIP yang sama pada detik yang sama; gateway sandbox menolak sebagian pembayaran",
   "primary": "EVT",
   "related": "TIC, O360, ANL",
   "sops": "SOP-EVT-02, SOP-EVT-04",
   "priority": "P3",
   "actors": "EO, IT, CCO, FIN, CS",
   "goal": "0 kursi terjual ganda; pembeli gagal bayar mendapat kursi kembali atau dikabari via daftar tunggu",
   "ticket": {
    "title": "Lonjakan transaksi & gagal bayar penjualan konser",
    "priority": "P3",
    "category": "Tenant Fit-Out & Kasir IT",
    "zone": "ALL",
    "location": "Portal tiket online",
    "source": "Event Ticketing Engine",
    "sop": "SOP-EVT-02",
    "cam": "",
    "tenant": "",
    "team": "IT/OT On-Call"
   },
   "steps": [
    {
     "frm": "EVT",
     "to": "EVT",
     "event": "EVT-EVENT-SALE",
     "actor": "EO",
     "action": "Pembeli A & B menekan kursi A5 bersamaan; commit A diterima, commit B ditolak (versi berubah) & B diminta memilih kursi lain",
     "data": "seat=A5, version=v+1",
     "t": "T+0",
     "fx": ""
    },
    {
     "frm": "EVT",
     "to": "TIC",
     "event": "EVT-TICKET-CREATED",
     "actor": "CCO",
     "action": "Tingkat gagal bayar 18% dalam 10 menit -> tiket P3 ke IT",
     "data": "ticket",
     "t": "T+10",
     "fx": "ticket"
    },
    {
     "frm": "TIC",
     "to": "TIC",
     "event": "EVT-TICKET-STATUS",
     "actor": "IT",
     "action": "IT cek log callback sandbox; callback idempoten, tidak ada tiket terbit ganda",
     "data": "",
     "t": "T+20",
     "fx": "status:DISPATCHED"
    },
    {
     "frm": "EVT",
     "to": "EVT",
     "event": "EVT-EVENT-SALE",
     "actor": "EO",
     "action": "Hold pesanan gagal bayar kedaluwarsa, kursi kembali tersedia; daftar tunggu dikabari",
     "data": "",
     "t": "T+25",
     "fx": ""
    },
    {
     "frm": "EVT",
     "to": "O360",
     "event": "EVT-KPI-UPDATE",
     "actor": "FIN",
     "action": "Rekonsiliasi pendapatan tiket vs pesanan lunas",
     "data": "",
     "t": "H+1",
     "fx": "status:RESOLVED"
    }
   ]
  }
 ],
 "relations": [
  {
   "frm": "BMS",
   "to": "TIC",
   "data": "Alarm SCADA kritikal -> tiket otomatis (P2/P3) dengan aset, kode fault, zona"
  },
  {
   "frm": "BMS",
   "to": "CCTV",
   "data": "Lokasi aset alarm -> auto-open kamera terdekat untuk verifikasi visual"
  },
  {
   "frm": "BMS",
   "to": "TEN",
   "data": "Gangguan HVAC/listrik/air zona -> daftar tenant terdampak & notifikasi"
  },
  {
   "frm": "BMS",
   "to": "ENE",
   "data": "Status chiller, VFD, setpoint -> perhitungan COP, kWh & biaya"
  },
  {
   "frm": "BMS",
   "to": "ANL",
   "data": "Uptime, MTTR, downtime aset -> KPI fasilitas & tren SLA MEP"
  },
  {
   "frm": "CCTV",
   "to": "TIC",
   "data": "Alert AI (kerumunan, objek, intrusi, api thermal) -> tiket P1/P2 + klip bukti"
  },
  {
   "frm": "CCTV",
   "to": "BMS",
   "data": "Konfirmasi visual kebakaran -> verifikasi interlock FACP/AHU/fire curtain"
  },
  {
   "frm": "CCTV",
   "to": "PARK",
   "data": "ANPR & kamera lobi -> antrean gate, pelanggaran jalur darurat"
  },
  {
   "frm": "CCTV",
   "to": "TEN",
   "data": "Pencurian/insiden di depan unit -> info ke tenant terkait"
  },
  {
   "frm": "CCTV",
   "to": "ANL",
   "data": "Jumlah insiden keamanan, false alarm, respons -> KPI keamanan & K3"
  },
  {
   "frm": "TEN",
   "to": "TIC",
   "data": "Chat/komplain tenant -> tiket (anchor +1 prioritas)"
  },
  {
   "frm": "TEN",
   "to": "BMS",
   "data": "Izin overtime AC / hot work -> jadwal AHU & isolasi detektor"
  },
  {
   "frm": "TEN",
   "to": "CCTV",
   "data": "Izin kerja & loading dock -> akses pos security & pemantauan"
  },
  {
   "frm": "TEN",
   "to": "ENE",
   "data": "Unit tenant -> sub-meter kWh & tagihan overtime"
  },
  {
   "frm": "TEN",
   "to": "O360",
   "data": "CSAT, kepatuhan & riwayat komplain tenant -> evaluasi renewal"
  },
  {
   "frm": "TIC",
   "to": "TEN",
   "data": "Progres & penutupan tiket -> update chat tenant & survei CSAT"
  },
  {
   "frm": "TIC",
   "to": "CCTV",
   "data": "Dispatch tim -> pelacakan rute tim & verifikasi area aman"
  },
  {
   "frm": "TIC",
   "to": "BMS",
   "data": "Tiket MEP -> work order & validasi sensor normal sebelum close"
  },
  {
   "frm": "TIC",
   "to": "ANL",
   "data": "Data tiket (respons, resolusi, breach, eskalasi) -> tren SLA & pareto"
  },
  {
   "frm": "TIC",
   "to": "O360",
   "data": "Eskalasi P1/P2 -> notifikasi owner & dampak bisnis"
  },
  {
   "frm": "ENE",
   "to": "BMS",
   "data": "Prediksi peak load / anomali COP -> perintah peak shaving & setpoint"
  },
  {
   "frm": "ENE",
   "to": "TEN",
   "data": "Top konsumen sub-meter -> himbauan hemat & tagihan"
  },
  {
   "frm": "ENE",
   "to": "TIC",
   "data": "Anomali konsumsi (beban liar, kebocoran air) -> tiket investigasi"
  },
  {
   "frm": "ENE",
   "to": "O360",
   "data": "Biaya energi & recovery utilitas -> Opex & NOI"
  },
  {
   "frm": "ENE",
   "to": "ANL",
   "data": "IKE, penghematan, ESG -> laporan BOD"
  },
  {
   "frm": "PARK",
   "to": "TIC",
   "data": "Antrean > 8 mobil / pelanggaran jalur -> tiket P2/P3"
  },
  {
   "frm": "PARK",
   "to": "CCTV",
   "data": "Plat nomor & lokasi bay -> verifikasi kamera & pencarian kendaraan"
  },
  {
   "frm": "PARK",
   "to": "O360",
   "data": "Pendapatan & rekonsiliasi QRIS -> revenue non-sewa"
  },
  {
   "frm": "PARK",
   "to": "ANL",
   "data": "Turnover, waktu antrean gate -> KPI parkir"
  },
  {
   "frm": "O360",
   "to": "TEN",
   "data": "Kontrak jatuh tempo, AR aging -> tindak lanjut TRO & SP"
  },
  {
   "frm": "O360",
   "to": "BMS",
   "data": "Pembatasan fasilitas tenant menunggak -> blokir overtime AC"
  },
  {
   "frm": "O360",
   "to": "ANL",
   "data": "Okupansi, OCR, footfall, NOI -> laporan BOD & proyeksi dividen"
  },
  {
   "frm": "ANL",
   "to": "O360",
   "data": "Rekomendasi AI & keputusan BOD -> target KPI & capex"
  },
  {
   "frm": "ANL",
   "to": "BMS",
   "data": "Rekomendasi optimasi (descaling, setpoint) -> rencana kerja engineering"
  },
  {
   "frm": "EVT",
   "to": "TIC",
   "data": "Anomali check-in (QR palsu/duplikat), antrean gate, gangguan pembayaran -> tiket insiden"
  },
  {
   "frm": "EVT",
   "to": "CCTV",
   "data": "Jadwal & gate acara -> preset kamera gate/venue untuk verifikasi & crowd counting"
  },
  {
   "frm": "EVT",
   "to": "PARK",
   "data": "Tiket terjual & jam acara -> prediksi lonjakan kendaraan & pengaturan gate parkir"
  },
  {
   "frm": "EVT",
   "to": "BMS",
   "data": "Jadwal & kapasitas acara -> pre-cooling atrium & lighting scene"
  },
  {
   "frm": "EVT",
   "to": "ANL",
   "data": "Penjualan, kehadiran, no-show -> KPI event & ROI atrium"
  },
  {
   "frm": "EVT",
   "to": "O360",
   "data": "Pendapatan tiket & pengunjung event -> P&L dan footfall"
  },
  {
   "frm": "EVT",
   "to": "TEN",
   "data": "Prediksi lonjakan pengunjung -> info ke tenant F&B/retail sekitar venue"
  },
  {
   "frm": "TIC",
   "to": "EVT",
   "data": "Insiden di venue (P1/P2) -> jeda check-in/penjualan & info ke peserta"
  },
  {
   "frm": "CCTV",
   "to": "EVT",
   "data": "Kepadatan venue/gate -> buka gate tambahan atau tahan check-in"
  }
 ],
 "events": [
  {
   "code": "EVT-BMS-ALARM",
   "name": "Alarm SCADA/BMS",
   "producer": "BMS",
   "consumers": "TIC, CCTV, TEN, ENE",
   "payload": "asset_id, alarm_code, severity, zone, value, threshold, ts",
   "protocol": "BACnet/Modbus -> MQTT"
  },
  {
   "code": "EVT-FACP-FIRE",
   "name": "Alarm kebakaran FACP",
   "producer": "BMS",
   "consumers": "TIC, CCTV, TEN, PARK, ANL",
   "payload": "detector_id, zone, type(smoke/heat), interlock_state, ts",
   "protocol": "Dry Contact/BACnet"
  },
  {
   "code": "EVT-CAM-AI",
   "name": "Deteksi AI video",
   "producer": "CCTV",
   "consumers": "TIC, ANL",
   "payload": "cam_id, class(crowd/object/intrusion/fall/fire), confidence, bbox_snapshot, ts",
   "protocol": "ONVIF/RTSP + Webhook"
  },
  {
   "code": "EVT-CAM-VERIFY",
   "name": "Verifikasi visual operator",
   "producer": "CCTV",
   "consumers": "TIC",
   "payload": "ticket_id, cam_id, verdict(true/false alarm), clip_url",
   "protocol": "Internal"
  },
  {
   "code": "EVT-TICKET-CREATED",
   "name": "Tiket dibuat",
   "producer": "TIC",
   "consumers": "TEN, ANL, O360",
   "payload": "ticket_id, priority, category, zone, tenant_id, source, sop_id, sla_due",
   "protocol": "Internal Bus"
  },
  {
   "code": "EVT-TICKET-STATUS",
   "name": "Perubahan status tiket",
   "producer": "TIC",
   "consumers": "TEN, ANL",
   "payload": "ticket_id, status, team, eta, evidence",
   "protocol": "Internal Bus"
  },
  {
   "code": "EVT-ESCALATION",
   "name": "Eskalasi",
   "producer": "TIC",
   "consumers": "O360, ANL",
   "payload": "ticket_id, level, recipient, channel, ack_ts",
   "protocol": "WhatsApp API / Call"
  },
  {
   "code": "EVT-TENANT-MSG",
   "name": "Pesan / komplain tenant",
   "producer": "TEN",
   "consumers": "TIC",
   "payload": "tenant_id, unit, channel, text, category_nlp",
   "protocol": "WhatsApp Business API / App"
  },
  {
   "code": "EVT-TENANT-BROADCAST",
   "name": "Broadcast ke tenant",
   "producer": "TEN",
   "consumers": "-",
   "payload": "zone, tenants[], template, text",
   "protocol": "App Push / WhatsApp"
  },
  {
   "code": "EVT-PERMIT",
   "name": "Izin kerja/overtime disetujui",
   "producer": "TEN",
   "consumers": "BMS, CCTV, ENE",
   "payload": "permit_id, tenant_id, type, start, end, zone_ahu",
   "protocol": "Internal"
  },
  {
   "code": "EVT-ENERGY-ANOMALY",
   "name": "Anomali energi/air",
   "producer": "ENE",
   "consumers": "BMS, TIC, TEN",
   "payload": "meter_id, kind(peak/leak/waste), kw_or_m3, baseline, cost_impact",
   "protocol": "Modbus/LoRaWAN"
  },
  {
   "code": "EVT-PARK-QUEUE",
   "name": "Antrean / pelanggaran parkir",
   "producer": "PARK",
   "consumers": "TIC, CCTV",
   "payload": "gate_id, queue_len, wait_s, plate, ts",
   "protocol": "REST / ANPR"
  },
  {
   "code": "EVT-AR-OVERDUE",
   "name": "Tunggakan tenant",
   "producer": "O360",
   "consumers": "TEN, BMS",
   "payload": "tenant_id, aging_days, amount, sp_level",
   "protocol": "ISO 20022 / ERP"
  },
  {
   "code": "EVT-KPI-UPDATE",
   "name": "Pembaruan KPI",
   "producer": "Semua",
   "consumers": "ANL, O360",
   "payload": "kpi_code, value, period, source_dashboard",
   "protocol": "Data Warehouse"
  },
  {
   "code": "EVT-EVENT-SALE",
   "name": "Transaksi tiket acara",
   "producer": "EVT",
   "consumers": "ANL, O360, PARK",
   "payload": "order_id, event_id, items(type, seat), total, method, status, version, ts",
   "protocol": "REST/JSON (CAS berversi)"
  },
  {
   "code": "EVT-EVENT-CHECKIN",
   "name": "Pindaian check-in gate",
   "producer": "EVT",
   "consumers": "TIC, CCTV, ANL",
   "payload": "ticket_id, event_id, gate, result(VALID/USED/INVALID), reason, ts",
   "protocol": "REST/JSON (transaksi atomik)"
  }
 ],
 "mindmap": [
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "1. COMMERCIAL & TENANT MIX",
   "sub": "Okupansi (NLA)",
   "leaf": "Leased vs Vacant",
   "sops": [
    "SOP-COM-01"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "1. COMMERCIAL & TENANT MIX",
   "sub": "Okupansi (NLA)",
   "leaf": "Jadwal Fit-Out",
   "sops": [
    "SOP-COM-02",
    "SOP-COM-06"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "1. COMMERCIAL & TENANT MIX",
   "sub": "Okupansi (NLA)",
   "leaf": "Kontrak Expired",
   "sops": [
    "SOP-COM-01"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "1. COMMERCIAL & TENANT MIX",
   "sub": "Okupansi (NLA)",
   "leaf": "Anchor vs Regular",
   "sops": [
    "SOP-COM-01",
    "SOP-COM-05"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "1. COMMERCIAL & TENANT MIX",
   "sub": "Produktivitas POS",
   "leaf": "Omzet per Tenant",
   "sops": [
    "SOP-COM-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "1. COMMERCIAL & TENANT MIX",
   "sub": "Produktivitas POS",
   "leaf": "Revenue Share",
   "sops": [
    "SOP-COM-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "1. COMMERCIAL & TENANT MIX",
   "sub": "Produktivitas POS",
   "leaf": "Occupancy Cost Ratio (OCR %)",
   "sops": [
    "SOP-COM-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "1. COMMERCIAL & TENANT MIX",
   "sub": "Monetisasi Non-Sewa",
   "leaf": "Sewa Atrium/Kiosk",
   "sops": [
    "SOP-COM-04"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "1. COMMERCIAL & TENANT MIX",
   "sub": "Monetisasi Non-Sewa",
   "leaf": "LED Indoor/Fasad",
   "sops": [
    "SOP-COM-04"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "1. COMMERCIAL & TENANT MIX",
   "sub": "Monetisasi Non-Sewa",
   "leaf": "Naming Rights",
   "sops": [
    "SOP-COM-04"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "2. VISITOR & EXPERIENCE",
   "sub": "Footfall Counter",
   "leaf": "Traffic per Pintu",
   "sops": [
    "SOP-VIS-01",
    "SOP-SEC-09",
    "SOP-EVT-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "2. VISITOR & EXPERIENCE",
   "sub": "Footfall Counter",
   "leaf": "Konversi per Jam",
   "sops": [
    "SOP-VIS-05"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "2. VISITOR & EXPERIENCE",
   "sub": "Heatmap & Zoning",
   "leaf": "Pergerakan Lantai",
   "sops": [
    "SOP-VIS-01"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "2. VISITOR & EXPERIENCE",
   "sub": "Heatmap & Zoning",
   "leaf": "Deteksi Dead-Zone",
   "sops": [
    "SOP-VIS-02"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "2. VISITOR & EXPERIENCE",
   "sub": "Heatmap & Zoning",
   "leaf": "Dwell Time (Menit)",
   "sops": [
    "SOP-VIS-02"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "2. VISITOR & EXPERIENCE",
   "sub": "Loyalty & CRM",
   "leaf": "Akuisisi Member",
   "sops": [
    "SOP-VIS-05"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "2. VISITOR & EXPERIENCE",
   "sub": "Loyalty & CRM",
   "leaf": "Basket Size Struk",
   "sops": [
    "SOP-VIS-05"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "2. VISITOR & EXPERIENCE",
   "sub": "Loyalty & CRM",
   "leaf": "ROI Event Atrium",
   "sops": [
    "SOP-VIS-02",
    "SOP-EVT-01",
    "SOP-EVT-02",
    "SOP-EVT-03",
    "SOP-EVT-04"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "2. VISITOR & EXPERIENCE",
   "sub": "Sentimen & CSAT",
   "leaf": "QR Code Toilet",
   "sops": [
    "SOP-VIS-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "2. VISITOR & EXPERIENCE",
   "sub": "Sentimen & CSAT",
   "leaf": "Review Medsos",
   "sops": [
    "SOP-VIS-03",
    "SOP-VIS-04"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "2. VISITOR & EXPERIENCE",
   "sub": "Sentimen & CSAT",
   "leaf": "Komplain AC/Bau",
   "sops": [
    "SOP-COM-05",
    "SOP-VIS-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "3. SMART BMS & ENGINEERING",
   "sub": "HVAC & Chiller",
   "leaf": "Suhu/Kelembaban",
   "sops": [
    "SOP-BMS-01"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "3. SMART BMS & ENGINEERING",
   "sub": "HVAC & Chiller",
   "leaf": "Beban kW/TR",
   "sops": [
    "SOP-BMS-01"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "3. SMART BMS & ENGINEERING",
   "sub": "HVAC & Chiller",
   "leaf": "Sensor CO2 Udara",
   "sops": [
    "SOP-BMS-01"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "3. SMART BMS & ENGINEERING",
   "sub": "Energi & Listrik",
   "leaf": "Smart Sub-Meter",
   "sops": [
    "SOP-COM-06",
    "SOP-BMS-04"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "3. SMART BMS & ENGINEERING",
   "sub": "Energi & Listrik",
   "leaf": "Peak Load (kVA)",
   "sops": [
    "SOP-BMS-03",
    "SOP-BMS-04"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "3. SMART BMS & ENGINEERING",
   "sub": "Energi & Listrik",
   "leaf": "Status Genset/PV",
   "sops": [
    "SOP-BMS-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "3. SMART BMS & ENGINEERING",
   "sub": "Air & Lingkungan",
   "leaf": "Debit PDAM/Sumur",
   "sops": [
    "SOP-BMS-02"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "3. SMART BMS & ENGINEERING",
   "sub": "Air & Lingkungan",
   "leaf": "Kualitas Air IPAL",
   "sops": [
    "SOP-BMS-07"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "3. SMART BMS & ENGINEERING",
   "sub": "Air & Lingkungan",
   "leaf": "Tonase Sampah",
   "sops": [
    "SOP-BMS-07"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "3. SMART BMS & ENGINEERING",
   "sub": "Transport Vertikal",
   "leaf": "Uptime Lift/Eskalator",
   "sops": [
    "SOP-BMS-05",
    "SOP-BMS-06"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "3. SMART BMS & ENGINEERING",
   "sub": "Transport Vertikal",
   "leaf": "Sensor Getaran Motor",
   "sops": [
    "SOP-BMS-06"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "4. PARKING & MOBILITY",
   "sub": "Smart Parking",
   "leaf": "Slot Kosong/Zona",
   "sops": [
    "SOP-PRK-06",
    "SOP-PRK-02"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "4. PARKING & MOBILITY",
   "sub": "Smart Parking",
   "leaf": "Durasi & Turnover",
   "sops": [
    "SOP-PRK-06"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "4. PARKING & MOBILITY",
   "sub": "Smart Parking",
   "leaf": "Parkir VIP & EV",
   "sops": [
    "SOP-PRK-06",
    "SOP-PRK-02"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "4. PARKING & MOBILITY",
   "sub": "Gate & LPR Camera",
   "leaf": "Kecepatan Masuk",
   "sops": [
    "SOP-PRK-01"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "4. PARKING & MOBILITY",
   "sub": "Gate & LPR Camera",
   "leaf": "Rekonsiliasi QRIS",
   "sops": [
    "SOP-PRK-01",
    "SOP-PRK-04"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "4. PARKING & MOBILITY",
   "sub": "Gate & LPR Camera",
   "leaf": "Antrean Drop-off Lobi & Valet",
   "sops": [
    "SOP-PRK-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "4. PARKING & MOBILITY",
   "sub": "Integrasi Transit",
   "leaf": "Feeder/Shuttle",
   "sops": [
    "SOP-PRK-05"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "4. PARKING & MOBILITY",
   "sub": "Integrasi Transit",
   "leaf": "Taksi & Ride-Hail (Waiting Time)",
   "sops": [
    "SOP-PRK-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "4. PARKING & MOBILITY",
   "sub": "Integrasi Transit",
   "leaf": "EV Charger (OCPP)",
   "sops": [
    "SOP-PRK-05"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "5. SECURITY, SAFETY & HSE",
   "sub": "AI CCTV Analytics",
   "leaf": "Deteksi Kerumunan",
   "sops": [
    "SOP-VIS-01",
    "SOP-SEC-05",
    "SOP-SEC-09"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "5. SECURITY, SAFETY & HSE",
   "sub": "AI CCTV Analytics",
   "leaf": "Barang Tertinggal",
   "sops": [
    "SOP-SEC-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "5. SECURITY, SAFETY & HSE",
   "sub": "AI CCTV Analytics",
   "leaf": "Intrusion Alert",
   "sops": [
    "SOP-SEC-04"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "5. SECURITY, SAFETY & HSE",
   "sub": "Fire & Life Safety",
   "leaf": "Status Smoke/Heat",
   "sops": [
    "SOP-SEC-01",
    "SOP-SEC-08"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "5. SECURITY, SAFETY & HSE",
   "sub": "Fire & Life Safety",
   "leaf": "Tekanan Hydrant",
   "sops": [
    "SOP-SEC-01",
    "SOP-SEC-08"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "5. SECURITY, SAFETY & HSE",
   "sub": "Fire & Life Safety",
   "leaf": "Gas Leak Detector (Dapur F&B)",
   "sops": [
    "SOP-SEC-02"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "5. SECURITY, SAFETY & HSE",
   "sub": "Patroli & Kebersihan",
   "leaf": "Guard Tour NFC",
   "sops": [
    "SOP-CC-02",
    "SOP-SEC-06"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "5. SECURITY, SAFETY & HSE",
   "sub": "Patroli & Kebersihan",
   "leaf": "Smart Toilet (NH3)",
   "sops": [
    "SOP-SEC-07"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "5. SECURITY, SAFETY & HSE",
   "sub": "Patroli & Kebersihan",
   "leaf": "Tiket Komplain SLA < 15 Menit",
   "sops": [
    "SOP-CC-03",
    "SOP-CC-04",
    "SOP-SEC-07",
    "SOP-SEC-10"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "6. FINANCE & ASSET VALUE",
   "sub": "Real-time P&L",
   "leaf": "Daily Revenue",
   "sops": [
    "SOP-FIN-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "6. FINANCE & ASSET VALUE",
   "sub": "Real-time P&L",
   "leaf": "Opex vs Budget",
   "sops": [
    "SOP-FIN-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "6. FINANCE & ASSET VALUE",
   "sub": "Real-time P&L",
   "leaf": "EBITDA Harian",
   "sops": [
    "SOP-FIN-03"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "6. FINANCE & ASSET VALUE",
   "sub": "Billing & AR",
   "leaf": "Auto-Invoicing",
   "sops": [
    "SOP-FIN-01"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "6. FINANCE & ASSET VALUE",
   "sub": "Billing & AR",
   "leaf": "Aging Piutang",
   "sops": [
    "SOP-FIN-01",
    "SOP-FIN-02"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "6. FINANCE & ASSET VALUE",
   "sub": "Billing & AR",
   "leaf": "Denda Otomatis",
   "sops": [
    "SOP-FIN-02"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "6. FINANCE & ASSET VALUE",
   "sub": "Valuasi & Capex",
   "leaf": "ROI Renovasi",
   "sops": [
    "SOP-FIN-04"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "6. FINANCE & ASSET VALUE",
   "sub": "Valuasi & Capex",
   "leaf": "Cost per m2",
   "sops": [
    "SOP-FIN-04"
   ]
  },
  {
   "root": "SUPER MALL INTEGRATED COMMAND CENTER TICKETING SYSTEM",
   "pillar": "6. FINANCE & ASSET VALUE",
   "sub": "Valuasi & Capex",
   "leaf": "Proyeksi Dividen Pemilik Mall",
   "sops": [
    "SOP-FIN-04"
   ]
  }
 ]
};
