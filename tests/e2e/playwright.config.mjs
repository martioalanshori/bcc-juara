// Uji browser per peran (Playwright). Jalankan dari tests/e2e: npm install (sekali), lalu npm test.
import { defineConfig, devices } from '@playwright/test';

const PORT = 8799;
export default defineConfig({
  testDir: './specs',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // satu state acara bersama di server: tes berjalan berurutan
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'report' }]],
  outputDir: 'hasil',
  use: {
    baseURL: 'http://127.0.0.1:' + PORT,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // npm run lihat: jendela Chrome terbuka dan tiap aksi diperlambat agar bisa diikuti mata.
    headless: !process.env.LIHAT,
    launchOptions: { slowMo: process.env.LIHAT ? +process.env.LIHAT : 0 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: { command: 'node server.cjs ' + PORT, url: 'http://127.0.0.1:' + PORT + '/api/health', reuseExistingServer: false, timeout: 30_000 },
});
