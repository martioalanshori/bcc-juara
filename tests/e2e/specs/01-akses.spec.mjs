// Akses per peran: setiap akun staf masuk lewat /masuk dan hanya membuka portal perannya.
import { test, expect } from '@playwright/test';
import { AKUN, masukStaf, jagaError } from './helpers.mjs';

const PERAN = [
  { nama: 'Tenant/EO', email: AKUN.tenant, tujuan: '/pengelola', tiba: /\/pengelola\/dasbor/, teks: 'Sari Wulandari', ditolak: '/command-center' },
  { nama: 'Pengelola (Tim Event Mall)', email: AKUN.pengelola, tiba: /\/pengelola\/dasbor/, tujuan: '/pengelola', teks: 'Tim Event Summarecon Mall Bandung', ditolak: '/command-center' },
  { nama: 'Divisi Event', email: AKUN.divisiEvent, tujuan: '/command-center', tiba: /\/command-center/, teks: 'Andi Firmansyah', ditolak: '/pengelola' },
  { nama: 'Operasional Mall', email: AKUN.divisiOps, tujuan: '/command-center', tiba: /\/command-center/, teks: 'Rudi Hartono', ditolak: '/pengelola' },
  { nama: 'Operator Command Center', email: AKUN.operator, tujuan: '/command-center', tiba: /\/command-center/, teks: 'Tiket & Insiden', ditolak: '/pengelola' },
  { nama: 'Petugas gate', email: AKUN.gate, tujuan: '/checkin', tiba: /\/checkin/, teks: 'Pindaian terakhir', ditolak: '/pengelola' },
];

for (const p of PERAN) {
  test(`${p.nama}: masuk ke portalnya, portal lain meminta login`, async ({ page }) => {
    const cek = jagaError(page);
    await masukStaf(page, p.email, p.tujuan);
    await expect(page).toHaveURL(p.tiba);
    await expect(page.locator('body')).toContainText(p.teks); // nama di menu profil bisa disembunyikan CSS
    await page.goto(p.ditolak);
    await expect(page, 'portal di luar peran diarahkan ke /masuk').toHaveURL(/\/masuk\?role=/);
    cek();
  });
}

test('password salah menampilkan pesan dan tidak membuat sesi', async ({ page }) => {
  await masukStaf(page, AKUN.pengelola, '/pengelola', 'salah-sekali');
  await expect(page.locator('#msg')).toBeVisible();
  await expect(page).toHaveURL(/\/masuk/);
  await page.goto('/pengelola');
  await expect(page).toHaveURL(/\/masuk\?role=/);
});

test('tanpa login: portal staf diarahkan ke /masuk, portal pengunjung terbuka', async ({ page }) => {
  for (const u of ['/pengelola', '/command-center', '/checkin']) {
    await page.goto(u);
    await expect(page, u).toHaveURL(/\/masuk\?role=/);
  }
  await page.goto('/pengunjung');
  await expect(page.getByRole('heading', { name: 'Acara di Summarecon Mall' })).toBeVisible();
});

test('tenant hanya melihat acara organisasinya sendiri', async ({ page }) => {
  await masukStaf(page, AKUN.tenant, '/pengelola/acara');
  await expect(page.locator('#pg-evpick')).toContainText('1 acara');
  await page.goto('/pengelola/e/EVT-01/ringkasan');
  await expect(page.getByText('Konser Akustik "Senja di Bandung"')).toHaveCount(0);
});
