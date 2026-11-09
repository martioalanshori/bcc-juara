// Uji ekspor CSV (Evt.csvText): ramah Excel Indonesia dan aman dari CSV/formula injection.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEvt } from './harness.mjs';

test('pemisah titik koma, BOM UTF-8, baris CRLF', async () => {
  const { Evt } = await loadEvt();
  const s = Evt.csvText([['Nama', 'Total'], ['Rizky', 755000]]);
  assert.equal(s, '﻿Nama;Total\r\nRizky;755000');
});

test('nilai berisi pemisah, kutip atau baris baru dibungkus kutip', async () => {
  const { Evt } = await loadEvt();
  const s = Evt.csvText([['a;b', 'Konser "Senja"', 'x\ny', 'c,d', null]]);
  assert.equal(s, '﻿"a;b";"Konser ""Senja""";"x\ny";"c,d";');
});

test('teks berawalan = + - @ tab CR dinetralkan dengan kutip tunggal', async () => {
  const { Evt } = await loadEvt();
  const s = Evt.csvText([['=HYPERLINK("http://x")', '+6281', '-1', '@SUM(A1)', '\tx', '\rx', 'aman']]);
  assert.equal(s, '﻿"\'=HYPERLINK(""http://x"")";\'+6281;\'-1;\'@SUM(A1);\'\tx;"\'\rx";aman');
});

test('angka asli (termasuk negatif) tidak diubah', async () => {
  const { Evt } = await loadEvt();
  assert.equal(Evt.csvText([[-5000, 0, 12.5]]), '﻿-5000;0;12.5');
});
