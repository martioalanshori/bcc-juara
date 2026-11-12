/* Pratinjau di browser saja: skala slide 1920x1080 agar muat lebar jendela, dan tombol panah/PageUp/PageDown
 * untuk berpindah slide. Tidak dipakai saat cetak PDF (CSS print mengembalikan ukuran asli). */
(function () {
  const deck = document.querySelector('.deck');
  const slides = Array.from(document.querySelectorAll('.slide'));
  function fit() {
    if (window.matchMedia('print').matches) return;
    const s = Math.min(1, (window.innerWidth - 48) / 1920);
    deck.style.zoom = s;
  }
  function go(dir) {
    const y = window.scrollY + 10, z = parseFloat(deck.style.zoom || 1);
    const tops = slides.map((el) => el.offsetTop * z);
    const i = dir > 0 ? tops.findIndex((t) => t > y + 20) : tops.map((t, k) => [t, k]).filter(([t]) => t < y - 20).pop()?.[1];
    if (i != null && i >= 0) window.scrollTo({ top: tops[i] - 24, behavior: 'smooth' });
  }
  window.addEventListener('resize', fit);
  window.addEventListener('keydown', (e) => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(1); }
    if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
  });
  window.addEventListener('beforeprint', () => { deck.style.zoom = 1; });
  window.addEventListener('afterprint', fit);
  fit();
})();
