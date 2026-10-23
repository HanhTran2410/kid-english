// Chuông thông báo (SPEC-drive.md mục 10): đọc số phiên bản, so phiên bản, bài mới / cập nhật trong thư viện.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSwVersion, isNewer, libraryNews, fileKey } from '../../app/js/notices.js';

test('phiên bản: đọc từ sw.js; so từng số (0.35.10 > 0.35.9)', () => {
  assert.equal(parseSwVersion("const VERSION = '0.36.0';\nconst CACHE = 1;"), '0.36.0');
  assert.equal(parseSwVersion('xyz'), null);
  assert.ok(isNewer('0.36.0', '0.35.0'));
  assert.ok(isNewer('0.35.10', '0.35.9'));
  assert.ok(isNewer('1.0', '0.99.99'));
  assert.ok(!isNewer('0.35.0', '0.35.0'));
  assert.ok(!isNewer('0.34.9', '0.35.0'));
});

test('thư viện: lần đầu không báo gì (lấy mốc); sau đó báo file mới và file bị cập nhật (dung lượng đổi)', () => {
  const files = [{ file: 'a.zip', size: 10 }, { file: 'b.zip', size: 20 }];
  assert.deepEqual(libraryNews(files, null), []);
  const seen = files.map(fileKey);
  assert.deepEqual(libraryNews(files, seen), []);
  const later = [{ file: 'a.zip', size: 10 }, { file: 'b.zip', size: 25 }, { file: 'c.zip', size: 5 }];
  assert.deepEqual(libraryNews(later, seen).map((f) => [f.file, f.updated]), [['b.zip', true], ['c.zip', false]]);
});
