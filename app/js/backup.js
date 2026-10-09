// Sao lưu / khôi phục ra file .zip (SPEC mục 4.6).
// JSZip được nạp sẵn từ app/vendor/jszip.min.js (biến toàn cục JSZip); test trong Node truyền vào qua tham số.

import { STORES, mediaSize } from './db.js';
import { normalizeWord } from './text.js';
import { lessonFileName } from './lesson.js';
import { mergeProgress } from './progress.js';
import { mergeSticker } from './stickers.js';
import { dayKey } from './text.js';

export const BACKUP_FORMAT = 1;
const APP_ID = 'kid-english';

const EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'audio/mp4': 'm4a', 'audio/aac': 'aac', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/wav': 'wav',
};

export function extensionFor(mimeType) {
  return EXT[String(mimeType ?? '').split(';')[0].trim()] ?? 'bin';
}

export class BackupError extends Error {}

/** Lần sửa gần nhất của bài (đổi tên, chủ đề, ảnh…). */
const editedAt = (lesson) => lesson.updatedAt ?? lesson.createdAt ?? 0;

/** "Chữ ký" của bài theo danh sách từ (không phân biệt thứ tự, hoa/thường). */
const wordSignature = (lesson) => (lesson.words ?? []).map((w) => normalizeWord(w.en)).sort().join('|');

const withoutBlob = ({ blob, data, ...meta }) => meta;

async function readAll(db) {
  const entries = await Promise.all(STORES.map(async (s) => [s, await db.getAll(s)]));
  return Object.fromEntries(entries);
}

/** Dung lượng ước tính của file sao lưu (byte), để hiện trước cho bố mẹ. */
export async function estimateBackupSize(db, { includeRecordings = true } = {}) {
  const data = await readAll(db);
  const blobs = (list) => list.reduce((sum, r) => sum + mediaSize(r), 0);
  const json = JSON.stringify([data.lessons, data.progress, data.stickers, data.settings,
    data.images.map(withoutBlob), data.recordings.map(withoutBlob)]).length;
  return json + blobs(data.images) + (includeRecordings ? blobs(data.recordings) : 0);
}

/**
 * Tạo file sao lưu.
 * @returns {Promise<{ blob: Blob, filename: string, counts: object }>}
 */
export async function createBackup(db, { includeRecordings = true, now = Date.now(), appVersion = '', JSZip = globalThis.JSZip, lessonIds = null } = {}) {
  const data = await readAll(db);
  if (lessonIds) {
    // Gói bài để chia sẻ sang máy khác: chỉ bài và ảnh của bài, không có ghi âm, tiến độ, sticker, cài đặt.
    const ids = new Set(lessonIds);
    data.lessons = data.lessons.filter((l) => ids.has(l.id)).map((l) => ({ ...l, timesCompleted: 0, resume: null }));
    data.images = data.images.filter((img) => ids.has(img.lessonId));
    data.progress = [];
    data.stickers = [];
    data.settings = [];
    includeRecordings = false;
  }
  const recordings = includeRecordings ? data.recordings : [];
  const zip = new JSZip();

  const counts = {
    lessons: data.lessons.length,
    images: data.images.length,
    recordings: recordings.length,
    progress: data.progress.length,
    stickers: data.stickers.length,
  };
  zip.file('manifest.json', JSON.stringify({
    app: APP_ID, format: BACKUP_FORMAT, kind: lessonIds ? 'lessons' : 'backup', appVersion, exportedAt: now, includeRecordings, counts,
  }, null, 2));

  for (const lesson of data.lessons) zip.file(`lessons/${lesson.id}.json`, JSON.stringify(lesson, null, 2));

  const media = async (folder, list) => {
    const meta = [];
    for (const item of list) {
      const file = `${folder}/${item.id}.${extensionFor(item.mimeType)}`;
      zip.file(file, new Uint8Array(item.data ?? await item.blob.arrayBuffer()));
      meta.push({ ...withoutBlob(item), file });
    }
    zip.file(`${folder}.json`, JSON.stringify(meta, null, 2));
  };
  await media('images', data.images);
  await media('recordings', recordings);

  zip.file('progress.json', JSON.stringify(data.progress, null, 2));
  zip.file('stickers.json', JSON.stringify(data.stickers, null, 2));
  zip.file('settings.json', JSON.stringify(data.settings, null, 2));

  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'STORE' });
  return {
    blob: new Blob([bytes], { type: 'application/zip' }),
    // Gói 1 bài: "03-animals.zip" (số đứng đầu, ngắn gọn). Sao lưu toàn bộ: "kid-english-backup-2026-10-09.zip".
    filename: lessonIds && data.lessons.length === 1
      ? lessonFileName(data.lessons[0])
      : `kid-english-${lessonIds ? 'bai' : 'backup'}-${dayKey(new Date(now))}.zip`,
    counts,
  };
}

async function toArrayBuffer(input) {
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) return input;
  if (typeof input?.arrayBuffer === 'function') return input.arrayBuffer();
  throw new BackupError('Không đọc được file.');
}

/**
 * Đọc và kiểm tra TOÀN BỘ file sao lưu trước khi ghi gì vào máy.
 * @returns {Promise<object>} dữ liệu sẵn sàng để applyBackup
 */
export async function readBackup(input, { JSZip = globalThis.JSZip } = {}) {
  let zip;
  try {
    zip = await JSZip.loadAsync(await toArrayBuffer(input));
  } catch {
    throw new BackupError('File không phải file sao lưu hợp lệ (không mở được file zip).');
  }

  const readJson = async (path, required = true) => {
    const file = zip.file(path);
    if (!file) {
      if (required) throw new BackupError(`File sao lưu thiếu ${path}.`);
      return null;
    }
    try {
      return JSON.parse(await file.async('string'));
    } catch {
      throw new BackupError(`File sao lưu bị hỏng (${path}).`);
    }
  };

  const manifest = await readJson('manifest.json');
  if (manifest?.app !== APP_ID) throw new BackupError('Đây không phải file sao lưu của app này.');
  if (!(manifest.format <= BACKUP_FORMAT)) {
    throw new BackupError('File sao lưu được tạo từ phiên bản app mới hơn. Hãy cập nhật app rồi thử lại.');
  }

  const lessons = [];
  for (const file of zip.file(/^lessons\/[^/]+\.json$/)) {
    const lesson = await readJson(file.name);
    if (!lesson?.id || !lesson.title || !Array.isArray(lesson.words)) {
      throw new BackupError(`File sao lưu bị hỏng (${file.name}).`);
    }
    lessons.push(lesson);
  }

  const media = async (folder) => {
    const meta = (await readJson(`${folder}.json`, false)) ?? [];
    const list = [];
    for (const item of meta) {
      const file = zip.file(item.file ?? '');
      if (!item.id || !file) throw new BackupError(`File sao lưu bị hỏng (thiếu ${item.file ?? folder}).`);
      const { file: _path, ...rest } = item;
      list.push({ ...rest, data: await file.async('arraybuffer') });
    }
    return list;
  };

  const asArray = (v, name) => {
    if (v == null) return [];
    if (!Array.isArray(v)) throw new BackupError(`File sao lưu bị hỏng (${name}).`);
    return v;
  };

  return {
    manifest,
    lessons,
    images: await media('images'),
    recordings: await media('recordings'),
    progress: asArray(await readJson('progress.json', false), 'progress.json'),
    stickers: asArray(await readJson('stickers.json', false), 'stickers.json'),
    settings: asArray(await readJson('settings.json', false), 'settings.json'),
  };
}

/**
 * Ghi dữ liệu sao lưu vào máy trong một transaction.
 * @param {'merge'|'replace'} mode gộp với dữ liệu hiện có, hoặc thay thế toàn bộ
 */
/**
 * Ghi dữ liệu sao lưu vào máy trong một transaction.
 * @param {'merge'|'replace'} mode gộp với dữ liệu hiện có, hoặc thay thế toàn bộ
 * @param {{ updateLessons?: boolean }} [options] updateLessons: bài đã có (cùng id) thì cập nhật nội dung theo file
 *   (dùng khi nhập "file bài" chia sẻ từ máy khác), giữ số lần học xong và chỗ đang học dở của máy này.
 * @returns {Promise<{ added: number, updated: number }>} số bài thêm mới / cập nhật
 */
export async function applyBackup(db, payload, mode, { updateLessons = false } = {}) {
  if (mode === 'replace') {
    await db.write(STORES, (tx) => {
      for (const s of STORES) tx.objectStore(s).clear();
      for (const s of STORES) for (const item of payload[s]) tx.objectStore(s).put(item);
    });
    return { added: payload.lessons.length, updated: 0 };
  }

  // Gộp: đọc dữ liệu hiện có trước, tính kết quả, rồi ghi một lần.
  const current = await readAll(db);
  const byKey = (list, key) => new Map(list.map((x) => [x[key], x]));
  const writes = { lessons: [], images: [], recordings: [], progress: [], stickers: [], settings: [] };
  const deletes = { images: [] };
  let added = 0;
  let updated = 0;

  // Bài: trùng id thì giữ bản đang có, trừ khi được yêu cầu cập nhật.
  // Khi cập nhật, bài có CÙNG DANH SÁCH TỪ cũng coi là cùng một bài (ví dụ bài đã tạo riêng trên máy này
  // bằng cách dán lại đoạn trả lời của AI, nên mã bài khác với máy kia).
  const lessons = byKey(current.lessons, 'id');
  const bySignature = new Map(current.lessons.map((l) => [wordSignature(l), l]));
  const idMap = new Map(); // id trong file → id bài trên máy này
  const touched = new Set();
  const payloadImages = payload.images.map((img) => ({ ...img }));
  for (const l of payload.lessons) {
    const mine = lessons.get(l.id) ?? (updateLessons ? bySignature.get(wordSignature(l)) : null);
    if (!mine) {
      writes.lessons.push(l);
      added++;
      continue;
    }
    idMap.set(l.id, mine.id);
    if (updateLessons && editedAt(l) > editedAt(mine)) {
      // Chỉ bản sửa mới hơn mới ghi đè (nhập lại file cũ thì không làm mất chỗ đã sửa).
      writes.lessons.push({ ...l, id: mine.id, createdAt: mine.createdAt, timesCompleted: mine.timesCompleted ?? 0, resume: mine.resume ?? null });
      touched.add(mine.id);
    }
  }
  for (const img of payloadImages) if (idMap.has(img.lessonId)) img.lessonId = idMap.get(img.lessonId);

  // Ảnh: mỗi từ của mỗi bài chỉ giữ MỘT ảnh — ảnh mới hơn thắng.
  const imageKey = (img) => `${img.lessonId}|${img.word}`;
  const images = byKey(current.images, 'id');
  const imagesByWord = new Map(current.images.map((img) => [imageKey(img), img]));
  for (const img of payloadImages) {
    if (images.has(img.id)) continue;
    const mine = imagesByWord.get(imageKey(img));
    if (mine && (mine.createdAt ?? 0) >= (img.createdAt ?? 0)) continue;
    if (mine) deletes.images.push(mine.id);
    imagesByWord.set(imageKey(img), img);
    writes.images.push(img);
    if (lessons.has(img.lessonId)) touched.add(img.lessonId);
  }
  if (updateLessons) updated = touched.size;

  const recordings = byKey(current.recordings, 'id');
  writes.recordings = payload.recordings.filter((x) => !recordings.has(x.id));
  const progress = byKey(current.progress, 'word');
  writes.progress = payload.progress.map((p) => mergeProgress(progress.get(p.word), p));
  const stickers = byKey(current.stickers, 'id');
  writes.stickers = payload.stickers.map((s) => mergeSticker(stickers.get(s.id), s));
  const settings = byKey(current.settings, 'key');
  writes.settings = payload.settings.filter((s) => !settings.has(s.key)); // cài đặt giữ bản đang có

  await db.write(STORES, (tx) => {
    for (const id of deletes.images) tx.objectStore('images').delete(id);
    for (const s of STORES) for (const item of writes[s]) tx.objectStore(s).put(item);
  });
  return { added, updated };
}
