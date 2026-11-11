// "Thêm lại bài mẫu" (samples.js): chỉ thêm bài mẫu đang THIẾU trên máy — bấm nhiều lần không tạo bản trùng; bài đã xóa
// thì thêm lại; bài mẫu từ bản cũ (chưa có dấu `sampleFile` / `builtin`) vẫn được nhận ra.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IDBFactory } from 'fake-indexeddb';
import { openDatabase } from '../../app/js/db.js';
import { addSampleLessons, seedSamplesOnce, SAMPLE_FILES } from '../../app/js/samples.js';
import { parseLesson, createLessonRecord } from '../../app/js/lesson.js';

before(() => {
  // Bài mẫu dạng file: đọc thẳng từ thư mục app/.
  globalThis.fetch = async (file) => ({ text: async () => fs.readFileSync(new URL(`../../app/${file}`, import.meta.url), 'utf8') });
});

let n = 0;
async function makeApp() {
  const db = await openDatabase(`samples-${n++}`, new IDBFactory());
  const settings = {};
  return { db, settings, setSetting: async (k, v) => { settings[k] = v; } };
}
const keysOf = async (app) => (await app.db.getAll('lessons')).map((l) => `${l.kind ?? 'words'}|${l.style ?? ''}|${l.title}`).sort();
const dupes = (list) => list.filter((x, i) => list.indexOf(x) !== i);

test('mở app lần đầu rồi bấm "Thêm lại bài mẫu" 2 lần: không thêm gì, không có bản trùng', async () => {
  const app = await makeApp();
  await seedSamplesOnce(app);
  const first = await keysOf(app);
  assert.ok(first.length > 30, `có đủ bài mẫu (${first.length})`);
  assert.deepEqual(dupes(first), []);
  assert.equal(await addSampleLessons(app), 0);
  assert.equal(await addSampleLessons(app), 0);
  assert.deepEqual(await keysOf(app), first);
});

test('xóa vài bài mẫu (file, có sẵn, hội thoại) → "Thêm lại bài mẫu" chỉ thêm đúng các bài đó', async () => {
  const app = await makeApp();
  await seedSamplesOnce(app);
  const before = await keysOf(app);
  const all = await app.db.getAll('lessons');
  const pick = [
    all.find((l) => l.sampleFile === SAMPLE_FILES[0]), // bài từ vựng Animals (file)
    all.find((l) => l.builtin === 'count-1-10'), // bài số
    all.find((l) => l.builtin === 'near-park'), // bài Gần – xa
    all.find((l) => l.builtin === 'talk-hello'), // bài hội thoại
    all.find((l) => l.builtin === 'math-l1'), // bài Toán
  ];
  assert.ok(pick.every(Boolean));
  for (const l of pick) await app.db.delete('lessons', l.id);
  assert.equal(await addSampleLessons(app), 5);
  assert.deepEqual(await keysOf(app), before);
  assert.equal(await addSampleLessons(app), 0);
});

test('bài mẫu từ bản cũ chưa có dấu: bài file (cùng từ) và bài có sẵn chưa có `builtin` (cùng loại + tên) không bị thêm trùng', async () => {
  const app = await makeApp();
  await seedSamplesOnce(app);
  const all = await app.db.getAll('lessons');
  // Giả lập máy cũ: bỏ dấu `sampleFile` của Animals và mã `builtin` của bài số 1–10.
  const animals = all.find((l) => l.sampleFile === SAMPLE_FILES[0]);
  delete animals.sampleFile;
  await app.db.put('lessons', animals);
  const count = all.find((l) => l.builtin === 'count-1-10');
  delete count.builtin;
  await app.db.put('lessons', count);
  const before = await keysOf(app);
  assert.equal(await addSampleLessons(app), 0);
  assert.deepEqual(await keysOf(app), before);
  // Bài bố mẹ tự tạo trùng tên nhưng khác từ thì không làm mất bài mẫu.
  const parsed = parseLesson(JSON.stringify({ title: 'Colors', words: [{ en: 'pink', vi: 'hồng', emoji: '🩷' }, { en: 'gray', vi: 'xám', emoji: '🩶' }] }));
  assert.ok(parsed.ok, parsed.errors.join('; '));
  const colors = (await app.db.getAll('lessons')).find((l) => l.sampleFile === SAMPLE_FILES[1]);
  await app.db.delete('lessons', colors.id);
  await app.db.put('lessons', createLessonRecord(parsed.lesson));
  assert.equal(await addSampleLessons(app), 1, 'bài mẫu Colors bị xóa vẫn được thêm lại');
});
