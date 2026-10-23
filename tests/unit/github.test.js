// Tải bài lên Thư viện bài trên GitHub (SPEC-drive.md mục 9): đọc repo, gọi API, lỗi dễ hiểu; token không vào file sao lưu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import JSZip from 'jszip';
import { openDatabase } from '../../app/js/db.js';
import { createBackup, readBackup, applyBackup } from '../../app/js/backup.js';
import { saveSetting } from '../../app/js/settings.js';
import {
  parseRepo, defaultRepo, safeFileName, blobToBase64, checkAccess, getFile, putFile, GitHubError, SHARED_PATH,
} from '../../app/js/github.js';

const res = (status, body = {}) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

test('repo: owner/repo, link github.com, đoán từ địa chỉ GitHub Pages; tên file an toàn', () => {
  assert.equal(parseRepo('HanhTran2410/kid-english'), 'HanhTran2410/kid-english');
  assert.equal(parseRepo('https://github.com/HanhTran2410/kid-english.git'), 'HanhTran2410/kid-english');
  assert.equal(parseRepo('kid-english'), null);
  assert.equal(defaultRepo({ hostname: 'hanhtran2410.github.io', pathname: '/kid-english/' }), 'hanhtran2410/kid-english');
  assert.equal(defaultRepo({ hostname: 'localhost', pathname: '/' }), 'HanhTran2410/kid-english');
  assert.equal(safeFileName('41-Bé ăn sáng.zip'), '41-b-n-s-ng.zip');
  assert.equal(SHARED_PATH, 'app/shared');
});

test('API: kiểm quyền ghi, đọc sha file, tải lên base64 có sha khi ghi đè; lỗi 401 / 403 / mạng thành câu dễ hiểu', async () => {
  const calls = [];
  const fake = (map) => async (url, opts) => {
    calls.push({ url, opts });
    return map(url, opts);
  };
  assert.deepEqual(await checkAccess('t', 'a/b', fake(() => res(200, { full_name: 'a/b', permissions: { push: true }, private: false }))),
    { repo: 'a/b', canWrite: true, private: false });
  assert.equal(calls[0].opts.headers.Authorization, 'Bearer t');
  assert.equal(await getFile('t', 'a/b', 'app/shared/x.zip', fake(() => res(404))), null);
  assert.deepEqual(await getFile('t', 'a/b', 'app/shared/x.zip', fake(() => res(200, { sha: 'S1', size: 3 }))), { sha: 'S1', size: 3 });
  const put = await putFile('t', 'a/b', 'app/shared/x.zip', new Blob(['abc']), { message: 'm', sha: 'S1', fetchFn: fake(() => res(200)) });
  assert.deepEqual(put, { path: 'app/shared/x.zip', created: false });
  const body = JSON.parse(calls.at(-1).opts.body);
  assert.deepEqual(body, { message: 'm', content: 'YWJj', branch: 'main', sha: 'S1' });
  assert.equal(calls.at(-1).opts.method, 'PUT');
  await assert.rejects(checkAccess('t', 'a/b', fake(() => res(401))), /Token GitHub sai/);
  await assert.rejects(putFile('t', 'a/b', 'p', new Blob(['x']), { message: 'm', fetchFn: fake(() => res(403)) }), /không có quyền ghi/);
  await assert.rejects(getFile('t', 'a/b', 'p', async () => { throw new TypeError('x'); }), GitHubError);
  assert.equal(await blobToBase64(new Blob([new Uint8Array([0, 255, 1])])), 'AP8B');
});

test('token GitHub không bao giờ vào file sao lưu; khôi phục "thay toàn bộ" vẫn giữ token của máy này, không lấy token từ file', async () => {
  const db = await openDatabase('gh-test', new IDBFactory());
  await saveSetting(db, 'githubToken', 'SECRET-123');
  await saveSetting(db, 'githubAutoUpload', true);
  const full = await createBackup(db, { JSZip, appVersion: 'test' });
  const zip = await JSZip.loadAsync(await full.blob.arrayBuffer());
  const settingsJson = await zip.file('settings.json').async('string');
  assert.ok(!settingsJson.includes('SECRET-123'));
  assert.ok(settingsJson.includes('githubAutoUpload'));
  const payload = await readBackup(full.blob, { JSZip });
  payload.settings.push({ key: 'githubToken', value: 'FROM-FILE' });
  await applyBackup(db, payload, 'replace');
  assert.equal((await db.get('settings', 'githubToken'))?.value, 'SECRET-123');
  await saveSetting(db, 'githubToken', '');
  await applyBackup(db, payload, 'merge');
  assert.equal((await db.get('settings', 'githubToken'))?.value, '');
});
