import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import JSZip from 'jszip';
import {
  openDatabase, deleteLesson, setWordImage, getWordImage, latestImageForWord, addRecording,
  hasRecordingToday, queryRecordings, deleteRecordings, recordingStats, updateProgress, getStickers,
  mediaBlob, migrateMedia,
} from '../../app/js/db.js';
import { createBackup, readBackup, applyBackup, estimateBackupSize, BackupError } from '../../app/js/backup.js';
import { onPracticed } from '../../app/js/progress.js';
import { loadSettings, saveSetting, isBackupDue } from '../../app/js/settings.js';

const DAY = 24 * 60 * 60 * 1000;
const open = () => openDatabase('test', new IDBFactory());
const blob = (text, type) => new Blob([text], { type });

const lesson = (id, title = 'Farm') => ({
  id, title, emoji: '🐄', createdAt: 1, timesCompleted: 0, resume: null,
  words: [{ en: 'cow', vi: 'con bò', emoji: '🐄' }, { en: 'dog', vi: 'con chó', emoji: '🐶' }],
  conversation: [], questions: [], story: [],
});

async function seed(db) {
  await db.put('lessons', lesson('L1'));
  await db.put('lessons', lesson('L2', 'Pets'));
  await setWordImage(db, { lessonId: 'L1', word: 'Cow', blob: blob('img1', 'image/jpeg'), mimeType: 'image/jpeg', width: 1, height: 1 }, 10);
  await setWordImage(db, { lessonId: 'L2', word: 'cow', blob: blob('img2', 'image/png'), mimeType: 'image/png', width: 1, height: 1 }, 20);
  await addRecording(db, { lessonId: 'L1', word: 'cow', blob: blob('rec-a', 'audio/mp4'), mimeType: 'audio/mp4', durationMs: 900 }, 1 * DAY);
  await addRecording(db, { lessonId: 'L1', word: 'dog', blob: blob('rec-bb', 'audio/mp4'), mimeType: 'audio/mp4', durationMs: 900 }, 5 * DAY);
  await addRecording(db, { lessonId: 'L2', word: 'cow', blob: blob('rec-ccc', 'audio/webm'), mimeType: 'audio/webm', durationMs: 900 }, 9 * DAY);
  await updateProgress(db, 'cow', '🐄', (p) => ({ ...onPracticed(p, 5), mastery: 3 }));
  await db.put('stickers', { id: 'lion', firstEarnedAt: 1, count: 2 });
  await saveSetting(db, 'characterName', 'Bông');
}

test('xóa bài thì xóa ảnh và ghi âm của bài, giữ tiến độ', async () => {
  const db = await open();
  await seed(db);
  await deleteLesson(db, 'L1');
  assert.equal(await db.get('lessons', 'L1'), undefined);
  assert.equal(await getWordImage(db, 'L1', 'cow'), null);
  assert.equal((await queryRecordings(db, { lessonId: 'L1' })).length, 0);
  assert.ok(await db.get('lessons', 'L2'));
  assert.ok(await getWordImage(db, 'L2', 'cow'));
  assert.equal((await db.get('progress', 'cow')).mastery, 3);
});

test('đặt lại ảnh thay ảnh cũ; ảnh mới nhất của từ trong mọi bài', async () => {
  const db = await open();
  await seed(db);
  await setWordImage(db, { lessonId: 'L1', word: 'cow', blob: blob('new', 'image/jpeg'), mimeType: 'image/jpeg' }, 30);
  assert.equal((await db.getAllByIndex('images', 'lessonId', 'L1')).length, 1);
  assert.equal(await mediaBlob(await getWordImage(db, 'L1', 'cow')).text(), 'new');
  assert.equal((await latestImageForWord(db, 'COW')).createdAt, 30);
});

test('lọc ghi âm theo bài, từ, khoảng ngày; xóa đúng các bản đã chọn', async () => {
  const db = await open();
  await seed(db);
  assert.equal((await queryRecordings(db, {})).length, 3);
  assert.equal((await queryRecordings(db, { lessonId: 'L1' })).length, 2);
  assert.equal((await queryRecordings(db, { word: 'Cow' })).length, 2);
  const old = await queryRecordings(db, { to: 6 * DAY });
  assert.deepEqual(old.map((r) => r.word), ['dog', 'cow'], 'mới nhất trước');
  assert.equal((await queryRecordings(db, { from: 4 * DAY, to: 6 * DAY })).length, 1);

  const all = await queryRecordings(db, {});
  assert.deepEqual(recordingStats(all), { count: 3, bytes: 5 + 6 + 7 });
  await deleteRecordings(db, old.map((r) => r.id));
  const left = await queryRecordings(db, {});
  assert.equal(left.length, 1);
  assert.equal(left[0].lessonId, 'L2');
});

test('mỗi từ mỗi ngày: biết hôm nay đã có bản ghi chưa', async () => {
  const db = await open();
  await seed(db);
  assert.equal(await hasRecordingToday(db, 'cow', 1 * DAY + 1000), true);
  assert.equal(await hasRecordingToday(db, 'cow', 3 * DAY), false);
});

test('cài đặt: giá trị mặc định và nhắc sao lưu sau 7 ngày', async () => {
  const db = await open();
  const s = await loadSettings(db);
  assert.equal(s.rate, 0.8);
  assert.equal(s.limitMinutes, 15);
  await saveSetting(db, 'rate', 1);
  assert.equal((await loadSettings(db)).rate, 1);
  assert.equal(isBackupDue({ firstUseAt: 0, lastBackupAt: null }, 6 * DAY), false);
  assert.equal(isBackupDue({ firstUseAt: 0, lastBackupAt: null }, 8 * DAY), true);
  assert.equal(isBackupDue({ firstUseAt: 0, lastBackupAt: 7 * DAY }, 8 * DAY), false);
});

test('sao lưu rồi khôi phục (thay thế) thì dữ liệu giống hệt, kể cả ảnh, ghi âm, sticker', async () => {
  const src = await open();
  await seed(src);
  const { blob: zipBlob, filename, counts } = await createBackup(src, { now: new Date(2026, 9, 8).getTime(), JSZip });
  assert.equal(filename, 'kid-english-backup-2026-10-08.zip');
  assert.deepEqual(counts, { lessons: 2, images: 2, recordings: 3, progress: 1, stickers: 1 });

  const dst = await open();
  await dst.put('lessons', lesson('OLD', 'Sẽ bị thay'));
  await applyBackup(dst, await readBackup(zipBlob, { JSZip }), 'replace');

  assert.equal(await dst.get('lessons', 'OLD'), undefined);
  assert.deepEqual(await dst.get('lessons', 'L1'), await src.get('lessons', 'L1'));
  const img = await getWordImage(dst, 'L1', 'cow');
  assert.equal(await mediaBlob(img).text(), 'img1');
  assert.equal(img.mimeType, 'image/jpeg');
  const recs = await queryRecordings(dst, {});
  assert.deepEqual(recs.map((r) => r.durationMs), [900, 900, 900]);
  assert.equal(await mediaBlob(recs[0]).text(), 'rec-ccc');
  assert.equal(recs[0].mimeType, 'audio/webm');
  assert.deepEqual(await dst.get('progress', 'cow'), await src.get('progress', 'cow'));
  assert.deepEqual(await getStickers(dst), await getStickers(src));
  assert.equal((await loadSettings(dst)).characterName, 'Bông');
});

test('sao lưu không kèm ghi âm thì file không có recordings/', async () => {
  const db = await open();
  await seed(db);
  const withRec = await estimateBackupSize(db, { includeRecordings: true });
  const without = await estimateBackupSize(db, { includeRecordings: false });
  assert.equal(withRec - without, 18);
  const { blob: zipBlob } = await createBackup(db, { includeRecordings: false, JSZip });
  const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
  assert.equal(zip.file(/^recordings\//).length, 0);
  assert.equal((await readBackup(zipBlob, { JSZip })).recordings.length, 0);
});

test('khôi phục kiểu gộp: trùng id giữ bản đang có, tiến độ và sticker lấy số cao hơn', async () => {
  const src = await open();
  await seed(src);
  const { blob: zipBlob } = await createBackup(src, { JSZip });

  const dst = await open();
  await dst.put('lessons', lesson('L1', 'Tên đã đổi trên máy này'));
  await updateProgress(dst, 'cow', '🐄', (p) => ({ ...p, mastery: 1, practiceCount: 9, lastPracticedAt: 99 }));
  await dst.put('stickers', { id: 'lion', firstEarnedAt: 5, count: 1 });
  await saveSetting(dst, 'characterName', 'Mimi');

  await applyBackup(dst, await readBackup(zipBlob, { JSZip }), 'merge');
  assert.equal((await dst.get('lessons', 'L1')).title, 'Tên đã đổi trên máy này');
  assert.ok(await dst.get('lessons', 'L2'));
  const p = await dst.get('progress', 'cow');
  assert.equal(p.mastery, 3);
  assert.equal(p.practiceCount, 9);
  assert.equal(p.lastPracticedAt, 99);
  assert.equal((await dst.get('stickers', 'lion')).count, 2);
  assert.equal((await loadSettings(dst)).characterName, 'Mimi');
});

test('file hỏng hoặc phiên bản mới hơn thì từ chối, dữ liệu hiện có không đổi', async () => {
  await assert.rejects(readBackup(blob('not a zip', 'application/zip'), { JSZip }), BackupError);

  const newer = new JSZip();
  newer.file('manifest.json', JSON.stringify({ app: 'kid-english', format: 99 }));
  await assert.rejects(
    readBackup(await newer.generateAsync({ type: 'uint8array' }), { JSZip }),
    /phiên bản app mới hơn/,
  );

  const broken = new JSZip();
  broken.file('manifest.json', JSON.stringify({ app: 'kid-english', format: 1 }));
  broken.file('images.json', JSON.stringify([{ id: 'x', file: 'images/x.jpg', mimeType: 'image/jpeg' }]));
  await assert.rejects(readBackup(await broken.generateAsync({ type: 'uint8array' }), { JSZip }), /thiếu images\/x.jpg/);

  const other = new JSZip();
  other.file('manifest.json', JSON.stringify({ app: 'other' }));
  await assert.rejects(readBackup(await other.generateAsync({ type: 'uint8array' }), { JSZip }), /không phải file sao lưu/);
});

test('gói bài để chia sẻ: chỉ bài được chọn và ảnh của bài, không có ghi âm/tiến độ/sticker/cài đặt', async () => {
  const db = await open();
  await seed(db);
  await db.put('lessons', { ...(await db.get('lessons', 'L1')), timesCompleted: 5, resume: { stage: 'quiz', index: 1 } });
  await db.put('lessons', { ...(await db.get('lessons', 'L1')), no: 7 });
  const { blob: zipBlob, filename } = await createBackup(db, { lessonIds: ['L1'], now: new Date(2026, 9, 9).getTime(), JSZip });
  assert.equal(filename, '07-farm.zip');
  const p = await readBackup(zipBlob, { JSZip });
  assert.equal(p.manifest.kind, 'lessons');
  assert.deepEqual(p.lessons.map((l) => l.id), ['L1']);
  assert.equal(p.lessons[0].timesCompleted, 0);
  assert.equal(p.lessons[0].resume, null);
  assert.equal(p.images.length, 1);
  assert.deepEqual([p.recordings.length, p.progress.length, p.stickers.length, p.settings.length], [0, 0, 0, 0]);
});

test('nhập lại file bài đã sửa: cập nhật nội dung và ảnh mới hơn, giữ số lần học và chỗ đang học', async () => {
  // "Máy tính": tạo bài L1 có ảnh cũ, chia sẻ sang "điện thoại".
  const pc = await open();
  await seed(pc);
  const phone = await open();
  const first = await readBackup((await createBackup(pc, { lessonIds: ['L1'], JSZip })).blob, { JSZip });
  assert.deepEqual(await applyBackup(phone, first, 'merge', { updateLessons: true }), { added: 1, updated: 0 });
  await phone.put('lessons', { ...(await phone.get('lessons', 'L1')), timesCompleted: 3, resume: { stage: 'quiz', index: 0 } });

  // Trên máy tính: đổi tên bài, thay ảnh "cow", thêm ảnh "dog"; chia sẻ lại.
  await pc.put('lessons', { ...(await pc.get('lessons', 'L1')), title: 'Farm (mới)', updatedAt: 400 });
  await setWordImage(pc, { lessonId: 'L1', word: 'cow', blob: blob('cow-new', 'image/jpeg'), mimeType: 'image/jpeg' }, 500);
  await setWordImage(pc, { lessonId: 'L1', word: 'dog', blob: blob('dog-new', 'image/jpeg'), mimeType: 'image/jpeg' }, 500);
  const second = await readBackup((await createBackup(pc, { lessonIds: ['L1'], JSZip })).blob, { JSZip });
  assert.deepEqual(await applyBackup(phone, second, 'merge', { updateLessons: true }), { added: 0, updated: 1 });

  const lesson = await phone.get('lessons', 'L1');
  assert.equal(lesson.title, 'Farm (mới)');
  assert.equal(lesson.timesCompleted, 3);
  assert.deepEqual(lesson.resume, { stage: 'quiz', index: 0 });
  const imgs = await phone.getAllByIndex('images', 'lessonId', 'L1');
  assert.equal(imgs.length, 2, 'mỗi từ chỉ một ảnh');
  assert.equal(await mediaBlob(await getWordImage(phone, 'L1', 'cow')).text(), 'cow-new');
  assert.equal(await mediaBlob(await getWordImage(phone, 'L1', 'dog')).text(), 'dog-new');

  // Nhập lại file CŨ thì không ghi đè tên và ảnh mới hơn.
  assert.deepEqual(await applyBackup(phone, first, 'merge', { updateLessons: true }), { added: 0, updated: 0 });
  assert.equal((await phone.get('lessons', 'L1')).title, 'Farm (mới)');
  assert.equal(await mediaBlob(await getWordImage(phone, 'L1', 'cow')).text(), 'cow-new');
});

test('ảnh/ghi âm lưu dạng ArrayBuffer (không lưu Blob); bản ghi cũ dạng Blob được chuyển đổi', async () => {
  const db = await open();
  await seed(db);
  const img = await getWordImage(db, 'L1', 'cow');
  assert.ok(img.data instanceof ArrayBuffer);
  assert.equal('blob' in img, false);
  assert.equal(await mediaBlob(img).text(), 'img1');
  assert.equal(mediaBlob(img).type, 'image/jpeg');

  await db.put('images', { id: 'old', lessonId: 'L2', word: 'dog', blob: blob('old-img', 'image/png'), mimeType: 'image/png', createdAt: 1 });
  await db.put('images', { id: 'dup-old', lessonId: 'L1', word: 'cow', data: new ArrayBuffer(1), mimeType: 'image/jpeg', createdAt: 0 });
  assert.deepEqual(await migrateMedia(db), { converted: 1, broken: 0, duplicates: 1 });
  assert.equal(await db.get('images', 'dup-old'), undefined, 'ảnh trùng cũ hơn bị dọn');
  const migrated = await db.get('images', 'old');
  assert.equal('blob' in migrated, false);
  assert.equal(await mediaBlob(migrated).text(), 'old-img');
});

test('nhập file bài: bài trên máy này có cùng danh sách từ (khác mã bài) thì cập nhật, không tạo bài mới', async () => {
  const pc = await open();
  await seed(pc);
  await setWordImage(pc, { lessonId: 'L1', word: 'dog', blob: blob('dog-pc', 'image/jpeg'), mimeType: 'image/jpeg' }, 900);
  const pack = await readBackup((await createBackup(pc, { lessonIds: ['L1'], JSZip })).blob, { JSZip });

  const phone = await open();
  // Bài cùng nội dung nhưng tạo riêng trên điện thoại (dán lại JSON) → mã bài khác.
  await phone.put('lessons', { ...lesson('PHONE'), timesCompleted: 2 });
  const r = await applyBackup(phone, pack, 'merge', { updateLessons: true });
  assert.deepEqual(r, { added: 0, updated: 1 });
  assert.equal((await phone.getAll('lessons')).length, 1);
  assert.equal((await phone.get('lessons', 'PHONE')).timesCompleted, 2);
  assert.equal(await mediaBlob(await getWordImage(phone, 'PHONE', 'dog')).text(), 'dog-pc');
  assert.equal(await mediaBlob(await getWordImage(phone, 'PHONE', 'cow')).text(), 'img1');
});
