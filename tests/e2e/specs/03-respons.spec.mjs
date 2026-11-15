// Respons tombol saat server lambat (meniru Vercel: tiap simpan ±1,5 detik). Ketukan harus langsung tampil,
// tidak ada ketukan yang dibuang, dan halaman berikutnya membaca keranjang yang sudah tersimpan.
import { test, expect } from '@playwright/test';

const langkah = (page, teks) => test.step(teks, async () => {});
const lihat = async () => {};

const LAMBAT = 1500;
async function serverLambat(page) {
  await page.route('**/api/evt/state', async (route) => {
    if (route.request().method() === 'POST') await new Promise((r) => setTimeout(r, LAMBAT));
    await route.continue();
  });
}
const angka = (page, ty) => page.locator(`[data-qty="${ty}"][data-d="1"]`).locator('xpath=preceding-sibling::span[1]');

test('Pengunjung: ketuk + tiga kali cepat, angka langsung 3 dan tersimpan 3 (server lambat)', async ({ page }) => {
  await serverLambat(page);
  await page.goto('/pengunjung/e/EVT-04/kategori');
  const plus = page.locator('[data-qty=MSK][data-d="1"]');
  await expect(plus).toBeEnabled();
  await langkah(page, 'Server dibuat lambat 1,5 detik per simpan. Ketuk + tiga kali cepat');
  const t0 = Date.now();
  await plus.click(); await plus.click(); await plus.click();
  await expect(angka(page, 'MSK')).toHaveText('3', { timeout: 1000 }); // tampil seketika, tidak menunggu server
  expect(Date.now() - t0, 'angka tampil sebelum server selesai').toBeLessThan(LAMBAT);
  await langkah(page, 'Angka langsung 3, penyimpanan berjalan di belakang');
  // Ketukan beruntun digabung: tersimpan 3 di server dengan paling banyak 2 kali simpan.
  await expect.poll(() => page.evaluate(() => Evt.s.qholds['EVT-04'].filter((h) => h.cart === Evt.cartId() && !h.order).reduce((a, h) => a + h.qty, 0)), { timeout: 10000 }).toBe(3);
  await lihat(page);

  await langkah(page, 'Kurangi satu, lalu langsung Lanjut: Lanjut menunggu simpanan selesai');
  await page.click('[data-qty=MSK][data-d="-1"]');
  await expect(angka(page, 'MSK')).toHaveText('2', { timeout: 1000 });
  await page.getByRole('link', { name: /Lanjut/ }).click();
  await expect(page.getByRole('heading', { name: 'Konfirmasi pesanan' })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.lp-seat-chips')).toContainText('2 tiket');
  await lihat(page);
});

test('Pengunjung: ketuk tiga kursi cepat di denah, semuanya langsung terpilih dan tersimpan (server lambat)', async ({ page }) => {
  await serverLambat(page);
  await page.goto('/pengunjung/e/EVT-01/kategori');
  const kat = page.locator('a[href*="/kursi?kat="]').first();
  await kat.click();
  await expect(page.locator('.seatmap')).toBeVisible();
  const kursi = page.locator('.seatmap [data-seat].seat.available:not([disabled])');
  const ids = [];
  for (let i = 0; i < 3; i++) ids.push(await kursi.nth(i * 2).getAttribute('data-seat'));
  await langkah(page, 'Server lambat 1,5 detik. Ketuk 3 kursi cepat: ' + ids.join(', '));
  for (const s of ids) await page.click(`[data-seat="${s}"]`);
  for (const s of ids) await expect(page.locator(`[data-seat="${s}"]`), s + ' langsung terpilih').toHaveAttribute('data-st', 'mine', { timeout: 1000 });
  await langkah(page, 'Ketiga kursi langsung bertanda ✓ (berdenyut = sedang disimpan)');
  await expect.poll(() => page.evaluate((ids) => ids.filter((s) => { const x = Evt.s.seats['EVT-01'][s]; return x && x.st === 'HELD' && x.cart === Evt.cartId(); }).length, ids), { timeout: 15000 }).toBe(3);
  await expect(page.locator('.seat.pending')).toHaveCount(0);
  await langkah(page, 'Ketiganya tersimpan di server, tidak ada ketukan yang hilang');
  await lihat(page);

  await langkah(page, 'Ketuk lagi satu kursi untuk melepasnya');
  await page.click(`[data-seat="${ids[0]}"]`);
  await expect(page.locator(`[data-seat="${ids[0]}"]`)).toHaveAttribute('data-st', 'available', { timeout: 1000 });
  await expect.poll(() => page.evaluate((s) => !Evt.s.seats['EVT-01'][s], ids[0]), { timeout: 10000 }).toBe(true);
  await lihat(page);
});

test('Pengunjung: kursi yang ternyata diambil orang lain dikembalikan dengan pesan', async ({ page, browser }) => {
  await page.goto('/pengunjung/e/EVT-01/kategori');
  await page.locator('a[href*="/kursi?kat="]').first().click();
  await expect(page.locator('.seatmap')).toBeVisible();
  const s = await page.locator('.seatmap [data-seat].seat.available:not([disabled])').last().getAttribute('data-seat');
  // Halaman ini berhenti menerima kabar (seolah dua orang mengetuk di detik yang sama): tarik data dijawab "tidak ada
  // perubahan" pada versi yang sedang dipegang halaman. Lalu pembeli lain mengambil kursi itu lebih dulu.
  const v = await page.evaluate(() => Evt.version);
  await page.route('**/api/evt/state?v=*', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: v, now: Date.now() }) }));
  const lain = await browser.newPage();
  await lain.goto('/pengunjung/e/EVT-01/kategori');
  await lain.evaluate((s) => Evt.holdSeat('EVT-01', s, 'PEMBELI-LAIN'), s);
  await lain.close();
  await expect(page.locator(`[data-seat="${s}"]`), 'halaman masih melihat data lama').toHaveAttribute('data-st', 'available');
  await serverLambat(page);
  await page.click(`[data-seat="${s}"]`);
  await expect(page.locator(`[data-seat="${s}"]`)).toHaveAttribute('data-st', 'mine', { timeout: 1000 }); // optimis dulu
  await expect(page.locator('#toast-root, .toast, [role=status]').filter({ hasText: 'sedang dipesan pengunjung lain' }).first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator(`[data-seat="${s}"]`)).not.toHaveAttribute('data-st', 'mine');
});
