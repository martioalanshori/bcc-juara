/* Penulis PDF kecil tanpa dependensi (window.MiniPDF). Cukup untuk laporan: teks Helvetica/Helvetica-Bold
 * (font standar PDF, tanpa embed), persegi berwarna, garis, beberapa halaman A4. Koordinat dari kiri atas, satuan pt.
 *   const d = MiniPDF.doc();  d.text(40, 60, 'Judul', { size: 18, bold: true, color: '#14213D', align: 'left' });
 *   d.rect(x, y, w, h, '#FFC72C');  d.line(x1, y1, x2, y2, '#D5DAE1', 0.5);  d.addPage();  d.save('laporan.pdf');
 * Teks dikodekan WinAnsi: huruf Latin, tanda baca umum, "·", "–", "×". Karakter lain diganti '?'. */
(function () {
  const PW = 595.28, PH = 841.89; // A4
  // Lebar glyph Helvetica (per 1000 em) untuk ASCII 32..126; tebal didekati x1.06.
  const WD = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015,
    667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333,
    556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
  const WIN = { '€': 128, '‚': 130, '„': 132, '…': 133, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '·': 183, '×': 215, '°': 176, '±': 177, '²': 178, '³': 179 };
  const SUB = { '≥': '>=', '≤': '<=', '→': '->', '←': '<-', ' ': ' ', ' ': ' ' };
  function enc(s) {
    let out = '';
    for (const ch of String(s == null ? '' : s)) {
      if (SUB[ch]) { out += SUB[ch]; continue; }
      const c = ch.codePointAt(0);
      if (c >= 32 && c < 127) out += ch;
      else if (WIN[ch]) out += String.fromCharCode(WIN[ch]);
      else if (c >= 160 && c < 256) out += ch; // Latin-1 = WinAnsi di rentang ini
      else out += '?';
    }
    return out;
  }
  const glyphW = (code) => (code >= 32 && code < 127 ? WD[code - 32] : code === 183 ? 278 : 556);
  function width(s, size, bold) {
    const t = enc(s); let w = 0;
    for (let i = 0; i < t.length; i++) w += glyphW(t.charCodeAt(i));
    return (w * size / 1000) * (bold ? 1.06 : 1);
  }
  const esc = (t) => t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const rgb = (hex) => { const h = String(hex || '#000').replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255).toFixed(3)).join(' '); };
  const f = (n) => (Math.round(n * 100) / 100).toString();

  function doc() {
    const pages = [];
    const d = {
      W: PW, H: PH,
      get page() { return pages.length; },
      addPage() { pages.push([]); return d; },
      text(x, y, s, o) {
        o = o || {}; const size = o.size || 10, bold = !!o.bold, t = enc(s);
        let px = x; const w = width(s, size, bold);
        if (o.align === 'right') px = x - w; else if (o.align === 'center') px = x - w / 2;
        pages[pages.length - 1].push(`BT /${bold ? 'F2' : 'F1'} ${f(size)} Tf ${rgb(o.color || '#1B2333')} rg ${f(px)} ${f(PH - y)} Td (${esc(t)}) Tj ET`);
        return w;
      },
      rect(x, y, w, h, fill) { pages[pages.length - 1].push(`${rgb(fill)} rg ${f(x)} ${f(PH - y - h)} ${f(w)} ${f(h)} re f`); },
      line(x1, y1, x2, y2, color, lw) { pages[pages.length - 1].push(`${f(lw || 0.5)} w ${rgb(color || '#D5DAE1')} RG ${f(x1)} ${f(PH - y1)} m ${f(x2)} ${f(PH - y2)} l S`); },
      width,
      // Pecah teks menjadi baris dengan lebar maksimum.
      wrap(s, maxW, size, bold) {
        const words = String(s).split(/\s+/); const lines = []; let cur = '';
        words.forEach((w) => { const t = cur ? cur + ' ' + w : w; if (width(t, size, bold) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
        if (cur) lines.push(cur); return lines;
      },
      // Tulis teks pada semua halaman (mis. kaki halaman). fn(nomor, total) -> dipanggil per halaman.
      eachPage(fn) { const keep = pages.length; for (let i = 0; i < keep; i++) { const save = pages.length; pages.push(pages[i]); fn(i + 1, keep); pages.length = save; } },
      bytes() {
        const objs = [];
        const add = (s) => { objs.push(s); return objs.length; };
        add('<< /Type /Catalog /Pages 2 0 R >>');
        add(''); // Pages, diisi setelah halaman diketahui
        add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
        add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
        const kids = [];
        pages.forEach((ops) => {
          const body = ops.join('\n');
          const c = add(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`);
          kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(PW)} ${f(PH)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${c} 0 R >>`));
        });
        objs[1] = `<< /Type /Pages /Kids [${kids.map((k) => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
        let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'; const offs = [];
        objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
        const xref = out.length;
        out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
        out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
        const u = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) u[i] = out.charCodeAt(i) & 255;
        return u;
      },
      // Unduh sebagai file. Browser tanpa atribut download (mis. iOS lama) membuka PDF di tab baru.
      save(name) {
        const blob = new Blob([d.bytes()], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        // Jangan beri rel="noopener": Chrome lalu mengabaikan atribut download dan menamai file dengan ID blob (UUID).
        if ('download' in a) { a.href = url; a.download = name; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); }
        else window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60000); // beri waktu browser selesai menyimpan
        return blob;
      },
    };
    d.addPage();
    return d;
  }
  window.MiniPDF = { doc, enc, width };
})();
