// Pembantu bersama uji browser: login staf lewat formulir /masuk (sungguhan, bukan API), penangkap error halaman.
import { expect } from '@playwright/test';

export const PASS = 'smicc-demo-2026';
export const AKUN = {
  tenant: 'tenant@example.com',
  pengelola: 'pengelola@example.com',
  divisiEvent: 'divisi.event@example.com',
  divisiOps: 'divisi.ops@example.com',
  operator: 'cc@example.com',
  gate: 'gate@example.com',
};

// Isi formulir login staf seperti pengguna, lalu tunggu diarahkan ke tujuan.
export async function masukStaf(page, email, next, pass = PASS) {
  await page.goto('/masuk' + (next ? '?next=' + encodeURIComponent(next) : ''));
  await page.fill('#email', email);
  await page.fill('#password', pass);
  await page.click('#go');
}

// Gagalkan tes bila halaman melempar error JavaScript yang tidak tertangkap.
export function jagaError(page) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  return () => expect(errs, 'error JavaScript di halaman').toEqual([]);
}

// Notifikasi toast terakhir yang berisi teks tertentu.
export const toast = (page, text) => page.locator('#toast-root, .toast, [role=status]').filter({ hasText: text }).first();
