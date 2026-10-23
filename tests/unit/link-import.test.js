// Nhập bài từ link (SPEC-drive.md mục 7–8): link Google Drive như trước + link file .zip trên GitHub.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseImportLink, githubRawUrl, zipImportLink, downloadZip, LinkError } from '../../app/js/link-import.js';

const BASE = 'https://hanhtran2410.github.io/kid-english/';

test('link GitHub: trang app, link nhập bài #zip=, github.com/…/blob/…, raw.githubusercontent.com, đường dẫn tương đối', () => {
  assert.deepEqual(parseImportLink('https://hanhtran2410.github.io/kid-english/shared/08-family.zip', BASE),
    { type: 'zip', url: 'https://hanhtran2410.github.io/kid-english/shared/08-family.zip' });
  assert.deepEqual(parseImportLink(`${BASE}#zip=${encodeURIComponent('shared/08-family.zip')}`, BASE),
    { type: 'zip', url: `${BASE}shared/08-family.zip` });
  assert.deepEqual(parseImportLink('https://github.com/HanhTran2410/kid-english/blob/main/app/shared/08-family.zip', BASE),
    { type: 'zip', url: 'https://raw.githubusercontent.com/HanhTran2410/kid-english/main/app/shared/08-family.zip' });
  assert.equal(githubRawUrl('https://github.com/a/b/raw/main/x/y.zip?raw=true'), 'https://raw.githubusercontent.com/a/b/main/x/y.zip');
  assert.deepEqual(parseImportLink('https://raw.githubusercontent.com/a/b/main/app/shared/x.zip', BASE),
    { type: 'zip', url: 'https://raw.githubusercontent.com/a/b/main/app/shared/x.zip' });
  assert.deepEqual(parseImportLink('shared/12-fruits.zip', BASE), { type: 'zip', url: `${BASE}shared/12-fruits.zip` });
  assert.equal(zipImportLink('08-family.zip', BASE), `${BASE}#zip=shared%2F08-family.zip`);
  assert.deepEqual(parseImportLink(zipImportLink('08-family.zip', BASE), BASE), { type: 'zip', url: `${BASE}shared/08-family.zip` });
});

test('link Google Drive vẫn như trước; link không phải .zip / rỗng → null', () => {
  const id = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
  assert.deepEqual(parseImportLink(`${BASE}#drive=${id}&key=K123`, BASE), { type: 'drive', id, key: 'K123' });
  assert.deepEqual(parseImportLink(`https://drive.google.com/file/d/${id}/view`, BASE), { type: 'drive', id, key: null });
  assert.equal(parseImportLink('https://github.com/a/b/blob/main/README.md', BASE), null);
  assert.equal(parseImportLink('https://example.com/page.html', BASE), null);
  assert.equal(parseImportLink('', BASE), null);
});

test('tải file: lỗi mạng / 404 thành câu dễ hiểu; tên file lấy từ link', async () => {
  const blob = new Blob(['x']);
  const ok = await downloadZip(`${BASE}shared/08-family.zip`, async () => ({ ok: true, status: 200, blob: async () => blob }));
  assert.equal(ok.name, '08-family.zip');
  await assert.rejects(downloadZip(`${BASE}x.zip`, async () => { throw new TypeError('Failed to fetch'); }), LinkError);
  await assert.rejects(downloadZip(`${BASE}x.zip`, async () => ({ ok: false, status: 404 })), /Không tìm thấy file/);
});

test('thư viện bài: index.json khớp các file .zip trong app/shared/', async () => {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../app/shared');
  const zips = (await readdir(dir)).filter((f) => f.endsWith('.zip')).sort();
  const index = JSON.parse(await readFile(path.join(dir, 'index.json'), 'utf8'));
  assert.deepEqual(index.files.map((f) => f.file).sort(), zips, 'Chạy: node scripts/make-shared-index.mjs');
  for (const f of index.files) assert.ok(f.title && f.kind && f.size > 0, f.file);
});
