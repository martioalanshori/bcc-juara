/* Analisis Sentimen: ulasan dan komentar publik tentang mall dan event, plus rekomendasi pengembangan.
 * Data statis window.SENTIMEN dari BBC2026_IsoIsoWae/01_Riset/scraping/analisis.py --export-js (sentimen-data.js).
 * Sumber sekarang Google Maps; X, TikTok, dan Instagram tampil "Segera" sampai datanya ditambahkan ke analisis. */
(function () {
  window.Views = window.Views || {};
  const { esc, icon, num } = UI;
  const SENT = { positif: ['Positif', 'bg-emerald-500/15 text-emerald-300', '#22c55e'], netral: ['Netral', 'bg-slate-500/20 text-slate-300', '#94a3b8'], negatif: ['Negatif', 'bg-rose-500/15 text-rose-300', '#f43f5e'] };
  const PRIO = { Tinggi: 'bg-rose-500/15 text-rose-300', Sedang: 'bg-amber-500/15 text-amber-300', Rendah: 'bg-slate-500/20 text-slate-300' };
  const MENU = { parking: ['Parkir & Mobilitas', 'local_parking'], event: ['Pemantauan Event', 'local_activity'], cctv: ['CCTV & Keamanan', 'videocam'], ticketing: ['Tiket & Insiden', 'confirmation_number'] };
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const bln = (k) => BLN[+k.slice(5, 7) - 1] + ' ' + k.slice(2, 4);
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  let filter = 'semua'; // topik kutipan yang dipilih

  function quotes(S) {
    const list = S.kutipan.filter((k) => filter === 'semua' || (filter === 'positif' ? k.sentimen === 'positif' : k.topik.includes(filter))).slice(0, filter === 'semua' ? 8 : 99);
    return list.length ? list.map((k) => `<li class="snt-q"><p>"${esc(k.teks)}"</p><div class="snt-q-meta">${UI.chip(SENT[k.sentimen][0], SENT[k.sentimen][1])}${k.rating ? `<span>${'★'.repeat(k.rating)}<i>${'★'.repeat(5 - k.rating)}</i></span>` : ''}<span>${esc((S.sumber.find((s) => s.id === k.sumber) || {}).nama || k.sumber)}${k.tanggal ? ', ' + bln(k.tanggal) : ''}</span>${k.topik.map((t) => `<span class="snt-tag">${esc(t)}</span>`).join('')}</div></li>`).join('')
      : '<li class="font-body-sm text-body-sm text-on-surface-variant">Belum ada kutipan untuk topik ini.</li>';
  }

  window.Views.sentimen = {
    title: 'Analisis Sentimen',
    render() {
      const S = window.SENTIMEN;
      if (!S) return `<section class="card p-8">${UI.h('Analisis Sentimen', 'Data belum tersedia. Jalankan analisis.py --export-js di folder scraping.', '', 'sentiment_satisfied')}</section>`;
      const R = S.ringkasan, maxT = Math.max(1, ...S.topik.map((t) => t.keluhan)), parkir = (S.topik.find((t) => t.nama === 'parkir') || {}).keluhan || 0;
      const months = S.bulan.filter((b) => b.total >= 10);
      const rec = (who) => S.rekomendasi.filter((r) => r.untuk === who).sort((a, b) => ['Tinggi', 'Sedang', 'Rendah'].indexOf(a.prioritas) - ['Tinggi', 'Sedang', 'Rendah'].indexOf(b.prioritas));
      const recCard = (r) => `<article class="snt-rec">
        <div class="flex items-center gap-2 mb-1">${UI.chip('Prioritas ' + r.prioritas.toLowerCase(), PRIO[r.prioritas])}</div>
        <h4>${esc(r.judul)}</h4>
        <p class="snt-why">${icon('query_stats', 'text-[16px]')}<span>${esc(r.alasan)}</span></p>
        <p>${esc(r.aksi)}</p>
        ${MENU[r.menu] ? `<a href="/command-center/${r.menu}" class="snt-link">${icon(MENU[r.menu][1], 'text-[16px]')} ${MENU[r.menu][0]}</a>` : ''}</article>`;
      const topics = [['semua', 'Semua'], ['positif', 'Pujian']].concat(S.topik.filter((t) => S.kutipan.some((k) => k.topik.includes(t.nama))).map((t) => [t.nama, t.nama]));
      return `
      <section class="card pagebar">
        <div class="pagebar-title"><span class="crumb">Eksekutif / Summarecon Mall Bandung</span><h2>Analisis Sentimen</h2><p>Ulasan dan komentar publik tentang mall dan event, untuk menentukan perbaikan berikutnya. Data per ${esc(S.diambil)}.</p></div>
        <div class="pagebar-actions">${UI.dbLink('PARK', '', 'Parkir & Mobilitas')}${UI.dbLink('EVT', '', 'Pemantauan Event')}</div>
      </section>

      <div class="snt-src mb-5">${S.sumber.map((s) => {
        const st = { aktif: ['Aktif', 'bg-emerald-500/15 text-emerald-300'], contoh: ['Contoh', 'bg-amber-500/15 text-amber-300'], segera: ['Segera', 'bg-slate-500/20 text-slate-300'] }[s.status];
        const n = s.status === 'segera' ? 'Segera terhubung' : s.status === 'aktif' ? num(s.ulasan) + ' ulasan, ' + num(s.teks) + ' berteks' : num(s.teks) + ' komentar (data contoh)';
        const bar = s.teks ? `<div class="snt-src-bar" title="Positif ${s.positif}, netral ${s.netral}, negatif ${s.negatif}">${['positif', 'netral', 'negatif'].map((k) => `<i style="width:${(s[k] / s.teks) * 100}%;background:${SENT[k][2]}"></i>`).join('')}</div><small>${pct(s.positif, s.teks)}% positif, ${pct(s.negatif, s.teks)}% negatif</small>` : '';
        return `<div class="snt-src-item ${s.status}"><div class="snt-src-top">${icon(s.ikon, 'text-[20px]')}<div class="min-w-0"><b>${esc(s.nama)}</b><small>${n}</small></div>${UI.chip(st[0], st[1])}</div>${bar}</div>`;
      }).join('')}</div>

      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        ${UI.kpi({ label: 'Rating rata-rata', icon: 'star', value: String(R.rating).replace('.', ','), unit: '/ 5', foot: 'Google Maps, ' + num((S.sumber.find((x) => x.id === 'gmaps') || {}).ulasan || 0) + ' ulasan (platform lain tanpa rating)' })}
        ${UI.kpi({ label: 'Sentimen positif', icon: 'sentiment_satisfied', value: pct(R.positif, R.teks) + '%', bar: pct(R.positif, R.teks), barcls: 'bg-secondary', foot: num(R.positif) + ' dari ' + num(R.teks) + ' ulasan & komentar' })}
        ${UI.kpi({ label: 'Sentimen negatif', icon: 'sentiment_dissatisfied', value: pct(R.negatif, R.teks) + '%', vcls: 'text-rose-300', foot: num(R.negatif) + ' ulasan negatif, ' + num(R.netral) + ' campuran' })}
        ${UI.kpi({ label: 'Keluhan parkir', icon: 'local_parking', value: num(parkir), vcls: 'text-amber-300', foot: pct(parkir, R.keluhan) + '% dari semua keluhan, topik terbanyak' })}
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-5">
        <section class="card p-5 xl:col-span-4">${UI.h('Komposisi sentimen', 'Ulasan berteks', '', 'donut_large')}
          <div class="flex items-center gap-5 flex-wrap">${UI.donut(['positif', 'netral', 'negatif'].map((k) => ({ v: R[k], color: SENT[k][2] })), { size: 140, stroke: 18, center: pct(R.positif, R.teks) + '%', sub: 'positif' })}
            <ul class="snt-leg">${['positif', 'netral', 'negatif'].map((k) => `<li><i style="background:${SENT[k][2]}"></i>${SENT[k][0]}<b>${num(R[k])}</b></li>`).join('')}</ul></div>
          <div class="lbl mt-5 mb-2">Yang paling dipuji</div>
          <ul class="snt-bars">${S.pujian.map((p) => `<li><span>${esc(p.nama)}</span><b>${num(p.n)}</b>${UI.bar(pct(p.n, S.pujian[0].n), 'bg-secondary')}</li>`).join('')}</ul>
        </section>
        <section class="card p-5 xl:col-span-4">${UI.h('Keluhan per topik', num(R.keluhan) + ' keluhan dari ' + num(R.teks) + ' ulasan berteks', '', 'bar_chart')}
          <ul class="snt-bars">${S.topik.filter((t) => t.keluhan).map((t, i) => `<li><span>${esc(t.nama)}</span><b>${num(t.keluhan)}</b>${UI.bar((t.keluhan / maxT) * 100, i ? 'bg-primary-container' : 'bg-rose-500')}</li>`).join('')}</ul>
        </section>
        <section class="card p-5 xl:col-span-4">${UI.h('Tren per bulan', 'Persen ulasan negatif', '', 'show_chart')}
          ${months.length > 1 ? UI.line([{ data: months.map((b) => pct(b.negatif, b.total)), color: '#f43f5e', dot: months.length - 1 }], { labels: months.map((b, i) => (i % 2 ? '' : bln(b.bulan))), min: 0, unit: '%' }) : '<p class="font-body-sm text-body-sm text-on-surface-variant">Data per bulan belum cukup.</p>'}
          <div class="lbl mt-4 mb-2">Saat event besar</div>
          <div class="flex flex-col gap-2">${S.event.map((e) => `<div class="inner px-3 py-2 font-body-sm text-body-sm"><b>${esc(e.nama)}</b><div class="text-on-surface-variant">${num(e.data)} ulasan, ${num(e.keluhan)} keluhan, ${num(e.parkir)} soal parkir</div></div>`).join('')}</div>
        </section>
      </div>

      <section class="card p-5 mb-5">${UI.h('Rekomendasi pengembangan', 'Disusun otomatis dari angka di atas. Setiap rekomendasi menyebut dasar datanya', '', 'tips_and_updates')}
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div><div class="snt-col-h">${icon('storefront', 'text-[18px]')} Untuk mall</div><div class="flex flex-col gap-3">${rec('Mall').map(recCard).join('')}</div></div>
          <div><div class="snt-col-h">${icon('local_activity', 'text-[18px]')} Untuk event</div><div class="flex flex-col gap-3">${rec('Event').map(recCard).join('')}</div></div>
        </div>
      </section>

      <section class="card p-5 mb-5">${UI.h('Kutipan pengunjung', 'Tanpa nama pengulas. Teks dipotong 200 karakter', '', 'format_quote')}
        <div class="flex flex-wrap gap-2 mb-4" id="snt-filter">${topics.map(([k, l]) => `<button type="button" class="chip-btn ${filter === k ? 'on' : ''}" data-snt="${esc(k)}" aria-pressed="${filter === k}">${esc(l)}</button>`).join('')}</div>
        <ul class="flex flex-col gap-3" id="snt-quotes">${quotes(S)}</ul>
      </section>

      <p class="font-label-sm text-label-sm text-on-surface-variant mb-5">Metode demo: sentimen dari rating dan kata kunci (keluhan atau rating 1-2 = negatif, rating 4-5 = positif; komentar tanpa rating dinilai dari kata keluhan dan pujian). Data X, TikTok, dan Instagram adalah <b>data contoh</b> untuk mockup, bukan hasil scraping. Tanggal Google Maps adalah perkiraan dari teks seperti "2 bulan lalu". Sumber lain ditambahkan lewat CSV dengan kolom sumber, tanggal, rating, teks.</p>`;
    },
    mount(root) {
      const S = window.SENTIMEN; if (!S) return;
      const f = root.querySelector('#snt-filter'); if (!f) return;
      f.addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-snt]'); if (!b) return;
        filter = b.dataset.snt;
        f.querySelectorAll('[data-snt]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
        root.querySelector('#snt-quotes').innerHTML = quotes(S);
      });
    },
  };
})();
