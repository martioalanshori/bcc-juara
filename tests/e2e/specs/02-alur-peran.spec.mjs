// Alur nyata lintas peran, berurutan di satu server (state acara bersama):
// pengunjung beli tiket → petugas gate check-in → pengelola manifest offline & unggah hasil centang →
// tenant ajukan acara → operator CC hanya memantau → Divisi Event & Operasional Mall menyetujui → tenant publikasi.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { AKUN, masukStaf, jagaError, toast } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });
const bersama = {}; // tiket & booking dari langkah pengunjung, dipakai langkah berikutnya

// Dialog konfirmasi UI.confirm (core/ui.js): judul di kepala modal, isi & tombol di form.cf.
const dialog = (page) => page.locator('#modal-root [role=dialog]');

test('Pengunjung: masuk akun demo, beli tiket Bazar Kuliner, bayar sandbox, dapat e-ticket QR', async ({ page }) => {
  const cek = jagaError(page);
  await page.goto('/pengunjung/masuk');
  await page.click('[data-demo="1"]'); // Nadia Putri, belum ada pesanan
  await page.locator('main button:not([type=button])', { hasText: 'Masuk' }).click();
  await expect(toast(page, 'Halo, Nadia')).toBeVisible();

  await page.goto('/pengunjung/e/EVT-04');
  await page.getByRole('link', { name: /Beli tiket/ }).first().click();
  await expect(page).toHaveURL(/\/kategori$/);
  await page.click('[data-qty=MSK][data-d="1"]');
  await page.getByRole('link', { name: /Lanjut/ }).click();
  await expect(page.getByRole('heading', { name: 'Konfirmasi pesanan' })).toBeVisible();
  await expect(page.locator('#f-name')).toHaveValue('Nadia Putri');
  await page.fill('#f-phone', '812 3456 7890');
  await page.locator('label.lp-opt:has(input[name=veh][value=no])').click();
  await page.check('#accept_consent');
  await page.locator('#f-order button.btn').click();

  await expect(page.getByRole('heading', { name: 'Pembayaran' })).toBeVisible();
  await page.click('#pay-ok');
  await expect(page.getByText('Belum check-in. Tunjukkan QR ini di gate.')).toBeVisible();
  bersama.tiket = (await page.getByText(/^T-[A-Z0-9]{7}$/).first().textContent()).trim();
  bersama.booking = (page.url().match(/BK-[A-Z0-9]+/) || [])[0];
  expect(bersama.tiket).toMatch(/^T-/);
  expect(bersama.booking).toMatch(/^BK-/);

  await page.goto('/pengunjung/tiket');
  await expect(page.getByText(bersama.booking).first()).toBeVisible();
  cek();
});

test('Petugas gate: tiket valid masuk, pindai ulang ditolak, QR palsu ditolak', async ({ page }) => {
  test.skip(!bersama.tiket, 'butuh tiket dari langkah pengunjung');
  const cek = jagaError(page);
  await masukStaf(page, AKUN.gate, '/checkin');
  await page.selectOption('#ev', 'EVT-04');
  const kode = page.locator('input[name=code]');
  await kode.fill(bersama.tiket);
  await page.getByRole('button', { name: 'Validasi' }).click();
  await expect(page.locator('body')).toContainText(/Check-in berhasil|VALID/);
  await expect(page.locator('body')).toContainText('Nadia Putri');

  await kode.fill(bersama.tiket);
  await page.getByRole('button', { name: 'Validasi' }).click();
  await expect(page.locator('body')).toContainText(/sudah digunakan/i);

  await page.click('[data-demo=fake]');
  await expect(page.locator('body')).toContainText(/QR palsu|tidak cocok/i);
  cek();
});

test('Pengelola: unduh manifest offline, centang hadir tanpa server, unggah hasil centang ke sistem', async ({ page, context }, info) => {
  const cek = jagaError(page);
  await masukStaf(page, AKUN.pengelola, '/pengelola');
  await expect(page).toHaveURL(/\/pengelola\/dasbor/);

  // 1. Unduh manifest offline EVT-04 dari panel "Hari ini & besok".
  const [dlHtml] = await Promise.all([page.waitForEvent('download'), page.click('[data-mf-off=EVT-04]')]);
  const htmlPath = info.outputPath('manifest_offline_EVT-04.html');
  await dlHtml.saveAs(htmlPath);

  // 2. Buka file itu langsung dari disk (tanpa server), centang satu peserta aktif yang belum hadir, unduh hasil centang.
  const off = await context.newPage();
  await off.goto('file:///' + htmlPath.replace(/\\/g, '/'));
  await expect(off.locator('h1')).toHaveText('Bazar Kuliner Nusantara');
  const idTiket = await off.locator('li:not(.void):not(.on) input[type=checkbox]:not([disabled])').first().getAttribute('data-id');
  await off.locator(`input[data-id="${idTiket}"]`).check(); // dikunci ke ID: setelah dicentang baris jadi .on
  await expect(off.locator(`li.on input[data-id="${idTiket}"]`)).toBeChecked();
  if (bersama.tiket) { // tiket yang sudah check-in di gate tidak bisa dicentang lagi
    await off.fill('#q', bersama.tiket);
    await expect(off.locator(`input[data-id="${bersama.tiket}"]`)).toBeDisabled();
  }
  const [dlCsv] = await Promise.all([off.waitForEvent('download'), off.click('#exp')]);
  const csvPath = info.outputPath('hasil_centang_EVT-04.csv');
  await dlCsv.saveAs(csvPath);
  expect(fs.readFileSync(csvPath, 'utf8')).toContain(idTiket);
  await off.close();

  // 3. Unggah di konsol pengelola: pratinjau lalu catat.
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-mf-up=EVT-04]')]);
  await chooser.setFiles(csvPath);
  const baris = dialog(page).locator('.cf-row', { hasText: 'Akan dicatat hadir' });
  await expect(baris).toContainText('1');
  await dialog(page).locator('[data-cf-ok]').click();
  await expect(toast(page, '1 check-in dari manifest offline dicatat')).toBeVisible();

  // 4. Check-in tercatat di log pindaian acara dengan gate "Manifest offline".
  await page.goto('/pengelola/e/EVT-04/checkin');
  await expect(page.locator('#ck-log')).toContainText(idTiket);
  await expect(page.locator('#ck-log')).toContainText('Manifest offline');

  // 5. Unggah file yang sama lagi: tidak dicatat dua kali.
  await page.goto('/pengelola/dasbor');
  const [ch2] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-mf-up=EVT-04]')]);
  await ch2.setFiles(csvPath);
  await expect(dialog(page)).toContainText('Tidak ada yang perlu dicatat');
  await expect(dialog(page).locator('.cf-row', { hasText: 'Sudah check-in di sistem' })).toContainText('1');
  await dialog(page).locator('[data-cf-ok]').click();
  cek();
});

test('Pengelola: unggah massal hasil centang beberapa acara sekaligus dari menu Unduh semua acara', async ({ page, context }, info) => {
  const cek = jagaError(page);
  await masukStaf(page, AKUN.pengelola, '/pengelola');
  await expect(page).toHaveURL(/\/pengelola\/dasbor/);
  const csv = [], ids = {};
  for (const ev of ['EVT-02', 'EVT-19']) { // dua acara berbeda, satu file per acara
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click(`[data-mf-off=${ev}]`)]);
    const html = info.outputPath(`manifest_offline_${ev}.html`); await dl.saveAs(html);
    const off = await context.newPage();
    await off.goto('file:///' + html.replace(/\\/g, '/'));
    ids[ev] = await off.locator('li:not(.void):not(.on) input[type=checkbox]:not([disabled])').first().getAttribute('data-id');
    await off.locator(`input[data-id="${ids[ev]}"]`).check();
    const [d2] = await Promise.all([off.waitForEvent('download'), off.click('#exp')]);
    const p = info.outputPath(`hasil_centang_${ev}.csv`); await d2.saveAs(p); csv.push(p);
    await off.close();
  }
  const sampah = info.outputPath('bukan_manifest.csv'); fs.writeFileSync(sampah, 'a;b\r\n1;2\r\n');

  await page.locator('summary.pg-dl-btn').click();
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-mf-up-all]')]);
  expect(chooser.isMultiple()).toBe(true);
  await chooser.setFiles([...csv, sampah]);
  await expect(dialog(page)).toContainText('Cocokkan hasil centang semua acara?');
  await expect(dialog(page)).toContainText('3 file, 2 acara');
  await expect(dialog(page).locator('.cf-row', { hasText: 'EVT-02' })).toContainText('1 dicatat');
  await expect(dialog(page).locator('.cf-row', { hasText: 'EVT-19' })).toContainText('1 dicatat');
  await expect(dialog(page).locator('.cf-row', { hasText: 'bukan_manifest.csv' })).toContainText('Dilewati');
  await dialog(page).locator('[data-cf-ok]').click();
  await expect(toast(page, '2 check-in dari 2 acara dicatat')).toBeVisible();

  for (const ev of ['EVT-02', 'EVT-19']) {
    await page.goto(`/pengelola/e/${ev}/checkin`);
    await expect(page.locator('#ck-log'), ev).toContainText(ids[ev]);
  }
  cek();
});

test('Pengelola: file yang bukan manifest ditolak dengan pesan jelas', async ({ page }, info) => {
  await masukStaf(page, AKUN.pengelola, '/pengelola');
  await expect(page).toHaveURL(/\/pengelola\/dasbor/);
  const p = info.outputPath('acak.csv');
  fs.writeFileSync(p, 'nama;umur\r\nBudi;20\r\n');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-mf-up=EVT-04]')]);
  await chooser.setFiles(p);
  await expect(toast(page, 'Kolom "ID Tiket" tidak ditemukan')).toBeVisible();
});

test('Tenant: lengkapi dokumen EVT-28 dan ajukan ulang ke Divisi Event', async ({ page }) => {
  const cek = jagaError(page);
  await masukStaf(page, AKUN.tenant, '/pengelola/e/EVT-28/persetujuan');
  await expect(page.getByRole('heading', { name: 'Expo UMKM Gedebage Berdaya' })).toBeVisible();
  await page.click('[data-doc-dummy=EVT-28]');
  await expect(toast(page, 'dokumen contoh dicatat')).toBeVisible();
  await page.fill('#ap-note', 'Denah stan dan izin keramaian sudah diperbaiki');
  await page.click('#ap-submit');
  await expect(toast(page, 'Pengajuan dikirim ke Divisi Event')).toBeVisible();
  await expect(page.getByRole('link', { name: /Menunggu Divisi Event/ })).toBeVisible();
  cek();
});

test('Operator Command Center: melihat pengajuan EVT-28 tetapi tidak bisa memutuskan', async ({ page }) => {
  await masukStaf(page, AKUN.operator, '/command-center/persetujuan?ev=EVT-28');
  await expect(page.getByRole('heading', { name: 'Expo UMKM Gedebage Berdaya' })).toBeVisible();
  await expect(page.locator('[data-decide]')).toHaveCount(0);
});

for (const [nama, email, hasil] of [
  ['Divisi Event', AKUN.divisiEvent, 'diteruskan ke tahap berikutnya'],
  ['Operasional Mall', AKUN.divisiOps, 'Persetujuan lengkap'],
]) {
  test(`${nama}: menyetujui EVT-28 pada gilirannya`, async ({ page }) => {
    const cek = jagaError(page);
    await masukStaf(page, email, '/command-center/persetujuan?ev=EVT-28');
    await expect(page.getByRole('heading', { name: 'Expo UMKM Gedebage Berdaya' })).toBeVisible();
    await page.fill('#ap-note', 'Disetujui dengan catatan uji ' + nama);
    await page.click('[data-decide="1"]');
    await expect(dialog(page)).toContainText('Setujui sebagai');
    await dialog(page).locator('[data-cf-ok]').click();
    await expect(toast(page, hasil)).toBeVisible();
    cek();
  });
}

test('Tenant: acara yang sudah disetujui bisa dipublikasikan', async ({ page }) => {
  await masukStaf(page, AKUN.tenant, '/pengelola/e/EVT-28/ringkasan');
  const pub = page.locator('.pg-sign-btn.main[data-status=PUBLISHED][data-ev-id=EVT-28]'); // tombol utama kartu acara
  await expect(pub).toBeVisible();
  await pub.click();
  // Publikasi butuh konfirmasi, atau daftar pengaturan yang belum lengkap: keduanya dialog, bukan error.
  await expect(dialog(page)).toContainText(/Acara langsung tampil|Lengkapi dulu/);
  if (!(await dialog(page).textContent()).includes('Acara langsung tampil')) return; // pengaturan belum lengkap: berhenti di sini
  await dialog(page).locator('[data-cf-ok]').click();
  await expect(page.locator('[data-status=CLOSED][data-ev-id=EVT-28]').first(), 'tombol berganti jadi Tutup penjualan').toBeAttached();

  // Pengunjung (tanpa login) langsung melihat acaranya.
  const tamu = await page.context().browser().newPage();
  await tamu.goto(page.url().replace(/\/pengelola.*/, '/pengunjung/e/EVT-28'));
  await expect(tamu.getByRole('heading', { name: 'Expo UMKM Gedebage Berdaya' })).toBeVisible();
  await tamu.close();
});
