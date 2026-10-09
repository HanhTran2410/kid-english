// IndexedDB (SPEC mục 2.1). Ảnh và ghi âm lưu dạng Blob.

import { normalizeWord, dayKey } from './text.js';
import { emptyProgress, progressKey } from './progress.js';

export const DB_NAME = 'kid-english';
export const STORES = ['lessons', 'images', 'recordings', 'progress', 'stickers', 'settings'];

// Mỗi phần tử là một bước nâng cấp cấu trúc. Thêm bước mới vào cuối khi đổi cấu trúc;
// dữ liệu cũ được chuyển tự động khi mở app (SPEC mục 4.9).
const MIGRATIONS = [
  (db) => {
    db.createObjectStore('lessons', { keyPath: 'id' });
    const images = db.createObjectStore('images', { keyPath: 'id' });
    images.createIndex('lessonId', 'lessonId');
    images.createIndex('word', 'word');
    const recordings = db.createObjectStore('recordings', { keyPath: 'id' });
    recordings.createIndex('lessonId', 'lessonId');
    recordings.createIndex('word', 'word');
    db.createObjectStore('progress', { keyPath: 'word' });
    db.createObjectStore('stickers', { keyPath: 'id' });
    db.createObjectStore('settings', { keyPath: 'key' });
  },
];

const request = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const done = (tx) => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error ?? new DOMException('Transaction aborted', 'AbortError'));
});

export class Database {
  constructor(idb) {
    this.idb = idb;
  }

  async get(store, key) {
    return request(this.idb.transaction(store).objectStore(store).get(key));
  }

  async getAll(store) {
    return request(this.idb.transaction(store).objectStore(store).getAll());
  }

  async getAllByIndex(store, index, value) {
    return request(this.idb.transaction(store).objectStore(store).index(index).getAll(value));
  }

  async put(store, value) {
    const tx = this.idb.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    await done(tx);
    return value;
  }

  async delete(store, key) {
    const tx = this.idb.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    await done(tx);
  }

  /**
   * Ghi nhiều thay đổi trong một transaction (tất cả hoặc không gì cả).
   * @param {string[]} stores
   * @param {(tx: IDBTransaction) => void} fn chỉ được gọi put/delete/clear đồng bộ
   */
  async write(stores, fn) {
    const tx = this.idb.transaction(stores, 'readwrite');
    fn(tx);
    await done(tx);
  }

  close() {
    this.idb.close();
  }
}

export async function openDatabase(name = DB_NAME, factory = globalThis.indexedDB) {
  const req = factory.open(name, MIGRATIONS.length);
  req.onupgradeneeded = (event) => {
    const db = req.result;
    for (let v = event.oldVersion; v < MIGRATIONS.length; v++) MIGRATIONS[v](db, req.transaction);
  };
  return new Database(await request(req));
}

export function isQuotaError(err) {
  return err?.name === 'QuotaExceededError' || /quota/i.test(err?.message ?? '');
}

// ---------- Bài học ----------

/** Xóa bài cùng ảnh và ghi âm của bài; giữ tiến độ (SPEC mục 4.6). */
export async function deleteLesson(db, lessonId) {
  const [images, recordings] = await Promise.all([
    db.getAllByIndex('images', 'lessonId', lessonId),
    db.getAllByIndex('recordings', 'lessonId', lessonId),
  ]);
  await db.write(['lessons', 'images', 'recordings'], (tx) => {
    tx.objectStore('lessons').delete(lessonId);
    for (const img of images) tx.objectStore('images').delete(img.id);
    for (const rec of recordings) tx.objectStore('recordings').delete(rec.id);
  });
}

export async function listLessons(db) {
  const lessons = await db.getAll('lessons');
  return lessons.sort((a, b) => b.createdAt - a.createdAt);
}

// ---------- Ảnh ----------

export async function getWordImage(db, lessonId, word) {
  const key = normalizeWord(word);
  const images = await db.getAllByIndex('images', 'lessonId', lessonId);
  return images.find((img) => img.word === key) ?? null;
}

/** Ảnh mới nhất của một từ trong mọi bài (dùng khi ôn tập). */
export async function latestImageForWord(db, word) {
  const images = await db.getAllByIndex('images', 'word', normalizeWord(word));
  return images.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
}

/** Đặt hoặc thay ảnh cho một từ của bài. */
export async function setWordImage(db, { lessonId, word, blob, mimeType, width, height }, now = Date.now()) {
  const key = normalizeWord(word);
  const old = await db.getAllByIndex('images', 'lessonId', lessonId);
  const record = { id: crypto.randomUUID(), lessonId, word: key, blob, mimeType, width, height, createdAt: now };
  const lesson = await db.get('lessons', lessonId);
  await db.write(['images', 'lessons'], (tx) => {
    for (const img of old) if (img.word === key) tx.objectStore('images').delete(img.id);
    tx.objectStore('images').put(record);
    // Đánh dấu bài vừa được sửa, để khi chia sẻ lại thì máy kia nhận bản mới này.
    if (lesson) tx.objectStore('lessons').put({ ...lesson, updatedAt: now });
  });
  return record;
}

export async function removeWordImage(db, lessonId, word, now = Date.now()) {
  const img = await getWordImage(db, lessonId, word);
  const lesson = await db.get('lessons', lessonId);
  if (!img) return;
  await db.write(['images', 'lessons'], (tx) => {
    tx.objectStore('images').delete(img.id);
    if (lesson) tx.objectStore('lessons').put({ ...lesson, updatedAt: now });
  });
}

// ---------- Ghi âm ----------

export async function addRecording(db, { lessonId, word, blob, mimeType, durationMs }, now = Date.now()) {
  const record = { id: crypto.randomUUID(), lessonId, word: normalizeWord(word), date: now, blob, mimeType, durationMs };
  await db.put('recordings', record);
  return record;
}

/** Hôm nay đã có bản ghi cho từ này chưa (mỗi từ mỗi ngày tối đa 1 bản ghi). */
export async function hasRecordingToday(db, word, now = Date.now()) {
  const today = dayKey(new Date(now));
  const list = await db.getAllByIndex('recordings', 'word', normalizeWord(word));
  return list.some((r) => dayKey(new Date(r.date)) === today);
}

/**
 * Lọc bản ghi theo bài, từ, khoảng ngày. Trả về mới nhất trước.
 * @param {{ lessonId?: string, word?: string, from?: number, to?: number }} filter
 */
export function filterRecordings(records, { lessonId, word, from, to } = {}) {
  const key = word ? normalizeWord(word) : null;
  return records
    .filter((r) => (!lessonId || r.lessonId === lessonId)
      && (!key || r.word === key)
      && (from == null || r.date >= from)
      && (to == null || r.date <= to))
    .sort((a, b) => b.date - a.date);
}

export async function queryRecordings(db, filter) {
  return filterRecordings(await db.getAll('recordings'), filter);
}

export async function deleteRecordings(db, ids) {
  await db.write(['recordings'], (tx) => {
    for (const id of ids) tx.objectStore('recordings').delete(id);
  });
}

export function recordingStats(records) {
  return { count: records.length, bytes: records.reduce((sum, r) => sum + (r.blob?.size ?? 0), 0) };
}

// ---------- Tiến độ ----------

export async function getProgress(db, word, emoji = '') {
  return (await db.get('progress', progressKey(word))) ?? emptyProgress(word, emoji);
}

/** Đọc → biến đổi → lưu tiến độ một từ. */
export async function updateProgress(db, word, emoji, fn) {
  const current = await getProgress(db, word, emoji);
  const next = fn(current);
  if (emoji && !next.emoji) next.emoji = emoji;
  await db.put('progress', next);
  return next;
}

// ---------- Sticker ----------

export async function getStickers(db) {
  const list = await db.getAll('stickers');
  return Object.fromEntries(list.map((s) => [s.id, s]));
}
