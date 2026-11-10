/* Daftar tenant untuk logo berjalan di beranda pengunjung (section "Tenant di Summarecon Mall Bandung").
 * Urutan = urutan tampil, paling "hype" di depan (penilaian awal berdasarkan daya tarik merek; ubah sesuai data mal).
 * Logo di app/img/tenant/ (PNG/JPG/SVG/WebP, latar putih atau transparan, tinggi +-160px).
 * Tenant tanpa file logo boleh: isi tanpa `logo`, tampil sebagai nama. Kosong = section tidak ditampilkan.
 * Logo adalah merek dagang pemiliknya; dipakai untuk prototipe internal mal. */
window.SMB_TENANTS = [
  { name: 'adidas', cat: 'Fashion olahraga', logo: '/app/img/tenant/adidas.png' },
  { name: 'Chatime', cat: 'Minuman', logo: '/app/img/tenant/chatime.png' },
  { name: 'Blibli', cat: 'Belanja & gadget', logo: '/app/img/tenant/blibli.svg' },
];
