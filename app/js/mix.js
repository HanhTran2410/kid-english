// Ôn tập chung và Trò chơi tổng hợp (SPEC-mix.md): gom mục từ mọi bài (từ vựng, câu, số), chọn mục để hỏi,
// chọn đáp án sai cùng loại. Các hàm đều thuần (không phụ thuộc DOM), test được trong Node.

import { progressKey, isLearned, isUnknown, isStale } from './progress.js';
import { phraseKey, lessonKind, PHRASE_KIND } from './phrase.js';
import { NUMBER_KIND, numberKey } from './numbers.js';
import { PHONICS_KIND, letterKey } from './phonics.js';
import { TALK_KIND } from './talk.js';

export const REVIEW_COUNT = 8;
export const PLAY_COUNT = 10;
export const KINDS = ['word', 'phrase', 'number', 'letter'];

/**
 * Mọi mục có trên máy, mỗi mục một lần (bài mới nhất trước).
 * @param {object[]} lessons mới nhất trước
 * @param {Map<string, object>} records tiến độ theo khóa
 * @returns {{ kind: 'word'|'phrase'|'number', key: string, en: string, emoji: string, lessonId: string, data: object, record: object|null }[]}
 */
export function collectItems(lessons, records = new Map()) {
  const items = [];
  const seen = new Set();
  const add = (kind, key, en, emoji, lessonId, data) => {
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ kind, key, en, emoji, lessonId, data, record: records.get(key) ?? null });
  };
  for (const lesson of lessons) {
    const kind = lessonKind(lesson);
    if (kind === TALK_KIND) continue; // hội thoại chưa vào Ôn tập / Trò chơi (SPEC-talk T-b3)
    if (kind === PHONICS_KIND) {
      for (const l of lesson.letters ?? []) add('letter', letterKey(l.letter), l.letter.toUpperCase(), l.words[0]?.emoji ?? '', lesson.id, l);
    } else if (kind === NUMBER_KIND) {
      for (const x of lesson.numbers ?? []) add('number', numberKey(x.n), String(x.n), x.emoji, lesson.id, x);
    } else if (kind === PHRASE_KIND) {
      for (const p of lesson.phrases ?? []) add('phrase', phraseKey(p.en), p.en, p.emoji, lesson.id, p);
    } else {
      for (const w of lesson.words ?? []) add('word', progressKey(w.en), w.en, w.emoji, lesson.id, w);
    }
  }
  return items;
}

const learned = (item) => Boolean(item.record && isLearned(item.record));

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ưu tiên ôn: chưa thuộc (ít sao trước) → lâu chưa gặp → ngẫu nhiên. */
function byPriority(items, now, rng) {
  const unknown = shuffle(items.filter((i) => isUnknown(i.record)), rng).sort((a, b) => a.record.mastery - b.record.mastery);
  const stale = items.filter((i) => !isUnknown(i.record) && isStale(i.record, now));
  const rest = shuffle(items.filter((i) => !unknown.includes(i) && !stale.includes(i)), rng);
  return [...unknown, ...stale, ...rest];
}

/** Chọn `count` mục, mỗi loại có mặt ít nhất 1 mục (nếu có), còn lại theo thứ tự ưu tiên. */
function takeWithEveryKind(ordered, count) {
  const picked = [];
  for (const kind of KINDS) {
    const first = ordered.find((i) => i.kind === kind);
    if (first && picked.length < count) picked.push(first);
  }
  for (const item of ordered) {
    if (picked.length >= count) break;
    if (!picked.includes(item)) picked.push(item);
  }
  return picked;
}

/**
 * Xếp lại để không có 3 mục liền nhau cùng loại (khi còn loại khác).
 */
export function spreadKinds(items, rng = Math.random) {
  // Mỗi bước lấy loại còn NHIỀU nhất
  // không bị chặn (bằng nhau thì ngẫu nhiên) → loại nhiều được rải đều giữa các loại ít.
  const queues = new Map();
  for (const x of shuffle(items, rng)) {
    if (!queues.has(x.kind)) queues.set(x.kind, []);
    queues.get(x.kind).push(x);
  }
  const out = [];
  while (out.length < items.length) {
    const n = out.length;
    const blocked = n >= 2 && out[n - 1].kind === out[n - 2].kind ? out[n - 1].kind : null;
    const left = [...queues].filter(([, q]) => q.length);
    const allowed = left.filter(([k]) => k !== blocked);
    const pool = allowed.length ? allowed : left;
    const most = Math.max(...pool.map(([, q]) => q.length));
    const top = pool.filter(([, q]) => q.length === most);
    out.push(top[Math.floor(rng() * top.length)][1].shift());
  }
  return out;
}

/** Ôn tập (SPEC-mix mục 2): chỉ mục đã học, ưu tiên chưa thuộc / lâu chưa gặp, đủ loại, trộn loại. */
export function pickReviewItems(items, { count = REVIEW_COUNT, now = Date.now(), rng = Math.random } = {}) {
  const ordered = byPriority(items.filter(learned), now, rng);
  return spreadKinds(takeWithEveryKind(ordered, count), rng);
}

/**
 * Trò chơi tổng hợp (SPEC-mix mục 4): một nửa từ mục đã học (ưu tiên chưa thuộc), một nửa ngẫu nhiên trong TẤT CẢ
 * (kể cả chưa học); mỗi loại ít nhất 1 mục; không lặp mục.
 */
export function pickPlayItems(items, { count = PLAY_COUNT, now = Date.now(), rng = Math.random } = {}) {
  const fromLearned = byPriority(items.filter(learned), now, rng).slice(0, Math.floor(count / 2));
  const others = shuffle(items.filter((i) => !fromLearned.includes(i)), rng);
  return spreadKinds(takeWithEveryKind([...fromLearned, ...others], count), rng);
}

/**
 * Đáp án sai cùng loại: ưu tiên cùng bài, thiếu thì lấy bài khác; không trùng đáp án đúng.
 * (Số đếm dùng thẻ chữ số riêng — numberChoices — không cần hàm này.)
 */
export function distractors(item, items, { count = 2, rng = Math.random } = {}) {
  const same = items.filter((i) => i.kind === item.kind && i.key !== item.key && normEn(i) !== normEn(item));
  const sameLesson = shuffle(same.filter((i) => i.lessonId === item.lessonId), rng);
  const other = shuffle(same.filter((i) => i.lessonId !== item.lessonId), rng);
  const out = [];
  for (const i of [...sameLesson, ...other]) {
    if (out.length >= count) break;
    if (!out.some((o) => normEn(o) === normEn(i))) out.push(i);
  }
  return out;
}

const normEn = (item) => item.en.toLowerCase().trim();

/** Mục đã học trước lượt này (để chỉ cộng sao cho mục đã học — đoán trúng mục mới không tính là thuộc). */
export const learnedKeys = (items) => new Set(items.filter(learned).map((i) => i.key));
