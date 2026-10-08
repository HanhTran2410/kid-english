// Kiểm tra service worker cache đủ mọi file của app và đúng phiên bản.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../app');

async function walk(dir, base = '') {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...await walk(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

const swSource = await readFile(path.join(appDir, 'sw.js'), 'utf8');
const assets = [...swSource.matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1]);

test('service worker cache mọi file cần để chạy offline', async () => {
  const files = (await walk(appDir)).filter((f) => f !== 'sw.js' && !/LICENSE|OFL\.txt/.test(f));
  const missing = files.filter((f) => !assets.includes(f));
  assert.deepEqual(missing, [], `Thêm vào ASSETS trong sw.js: ${missing.join(', ')}`);
  const extra = assets.filter((a) => a !== './' && !files.includes(a));
  assert.deepEqual(extra, [], `ASSETS có file không tồn tại: ${extra.join(', ')}`);
});

test('phiên bản service worker trùng APP_VERSION', async () => {
  const appSource = await readFile(path.join(appDir, 'js/app.js'), 'utf8');
  const appVersion = appSource.match(/APP_VERSION = '([^']+)'/)[1];
  const swVersion = swSource.match(/const VERSION = '([^']+)'/)[1];
  assert.equal(swVersion, appVersion);
});

test('2 bài mẫu hợp lệ, không có cảnh báo', async () => {
  const { parseLesson } = await import('../../app/js/lesson.js');
  for (const file of ['animals.json', 'colors.json']) {
    const r = parseLesson(await readFile(path.join(appDir, 'lessons', file), 'utf8'));
    assert.equal(r.ok, true, `${file}: ${r.errors.join()}`);
    assert.deepEqual(r.warnings, [], file);
  }
});

test('mọi import trong code trỏ tới file có thật', async () => {
  const jsFiles = (await walk(path.join(appDir, 'js'))).map((f) => `js/${f}`);
  for (const file of jsFiles) {
    const src = await readFile(path.join(appDir, file), 'utf8');
    for (const m of src.matchAll(/from '(\.[^']+)'/g)) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), m[1]));
      assert.ok(jsFiles.includes(target), `${file} import ${m[1]} không tồn tại`);
    }
  }
});
