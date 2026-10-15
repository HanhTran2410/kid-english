// Hình của từ: ảnh bố mẹ thêm (Blob → object URL) hoặc emoji.

import { normalizeWord } from '../text.js';
import { latestImageForWord, mediaBlob } from '../db.js';

export class VisualSet {
  constructor() {
    this.map = new Map();
    this.urls = [];
  }

  add(word, emoji, blob) {
    const key = normalizeWord(word);
    let url = null;
    if (blob) {
      url = URL.createObjectURL(blob);
      this.urls.push(url);
    }
    this.map.set(key, { word, emoji, url });
  }

  get(word) {
    return this.map.get(normalizeWord(word)) ?? { word, emoji: '❓', url: null };
  }

  revoke() {
    for (const url of this.urls) URL.revokeObjectURL(url);
    this.urls = [];
  }
}

/**
 * Hình cho mọi từ của một bài: ảnh của chính bài; từ nào bài này chưa có ảnh thì dùng lại ảnh mới nhất của từ đó
 * ở bài khác (thêm ảnh một lần, mọi bài dùng chung); không có nữa thì emoji.
 */
export async function loadLessonVisuals(db, lesson, into = new VisualSet()) {
  const images = await db.getAllByIndex('images', 'lessonId', lesson.id);
  // Ảnh mới nhất của mỗi từ (sắp xếp cũ → mới, ảnh sau ghi đè ảnh trước).
  const byWord = new Map([...images].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)).map((img) => [img.word, mediaBlob(img)]));
  for (const w of lesson.words) {
    const own = byWord.get(normalizeWord(w.en));
    into.add(w.en, w.emoji, own ?? mediaBlob(await latestImageForWord(db, w.en)));
  }
  return into;
}

/** Hình cho một từ bất kỳ (ôn tập): ảnh mới nhất trong mọi bài, không có thì emoji. */
export async function loadWordVisual(db, visuals, word, emoji) {
  const img = await latestImageForWord(db, word);
  visuals.add(word, emoji, mediaBlob(img));
}
