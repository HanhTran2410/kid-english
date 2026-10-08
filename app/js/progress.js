// Tiến độ từng từ (SPEC mục 4.7) và chọn từ để ôn (mục 4.4).
// Các hàm đều thuần: nhận bản ghi, trả về bản ghi mới; việc lưu do db.js làm.

import { normalizeWord, dayKey, DAY_MS } from './text.js';

export const MAX_MASTERY = 5;
export const KNOWN_MASTERY = 3; // từ 3⭐ trở lên là "thuộc"
export const VOICE_MASTERY_CAP = 2; // lên tiếng chỉ đưa tối đa tới 2⭐
export const STALE_DAYS = 7;

export function progressKey(en) {
  return normalizeWord(en);
}

export function emptyProgress(en, emoji = '') {
  return {
    word: progressKey(en),
    emoji,
    mastery: 0,
    practiceCount: 0,
    lastPracticedAt: null,
    lastVoiceDay: null,
  };
}

const clamp = (n) => Math.max(0, Math.min(MAX_MASTERY, n));

/** Bé chọn đúng hình ngay lần đầu: +1. */
export function onPickedCorrectFirstTry(rec) {
  return { ...rec, mastery: clamp(rec.mastery + 1) };
}

/** Bé chọn sai: từ đúng bị −1 (người gọi chỉ gọi một lần cho mỗi câu hỏi). */
export function onPickedWrong(rec) {
  return { ...rec, mastery: clamp(rec.mastery - 1) };
}

/** Bé lên tiếng khi tới lượt nói từ: +1, tối đa một lần mỗi ngày, không vượt quá 2⭐. */
export function onSpoke(rec, now = Date.now()) {
  const today = dayKey(new Date(now));
  if (rec.lastVoiceDay === today) return rec;
  const mastery = rec.mastery < VOICE_MASTERY_CAP ? rec.mastery + 1 : rec.mastery;
  return { ...rec, mastery, lastVoiceDay: today };
}

/** Từ xuất hiện trong một lượt học bài / ôn tập / Học cùng Bông. */
export function onPracticed(rec, now = Date.now()) {
  return { ...rec, practiceCount: rec.practiceCount + 1, lastPracticedAt: now };
}

export const isLearned = (rec) => rec.practiceCount > 0;
export const isUnknown = (rec) => isLearned(rec) && rec.mastery < KNOWN_MASTERY;
export const isStale = (rec, now = Date.now()) =>
  isLearned(rec) && rec.lastPracticedAt != null && now - rec.lastPracticedAt > STALE_DAYS * DAY_MS;

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const byWeakest = (a, b) => a.mastery - b.mastery || (a.lastPracticedAt ?? 0) - (b.lastPracticedAt ?? 0);

/**
 * Chọn từ để ôn: chưa thuộc → lâu chưa gặp → ngẫu nhiên. Chỉ xét từ đã học.
 * @returns {object[]} các bản ghi tiến độ
 */
export function pickReviewWords(records, { count = 6, now = Date.now(), rng = Math.random } = {}) {
  const learned = records.filter(isLearned);
  const unknown = learned.filter((r) => isUnknown(r)).sort(byWeakest);
  const stale = learned
    .filter((r) => !isUnknown(r) && isStale(r, now))
    .sort((a, b) => a.lastPracticedAt - b.lastPracticedAt);
  const picked = new Set([...unknown, ...stale]);
  const rest = shuffle(learned.filter((r) => !picked.has(r)), rng);
  return [...unknown, ...stale, ...rest].slice(0, count);
}

/** Chọn tối đa `count` từ chưa thuộc để đưa vào prompt tạo bài: mastery thấp nhất, rồi lâu chưa gặp nhất. */
export function pickWordsForPrompt(records, count = 2) {
  return records.filter(isUnknown).sort(byWeakest).slice(0, count);
}

/** Gộp tiến độ khi khôi phục: lấy số cao hơn, ngày mới hơn. */
export function mergeProgress(current, incoming) {
  if (!current) return incoming;
  if (!incoming) return current;
  const later = (a, b) => (a == null ? b : b == null ? a : Math.max(a, b));
  const laterDay = (a, b) => (a == null ? b : b == null ? a : a > b ? a : b);
  return {
    ...current,
    emoji: current.emoji || incoming.emoji,
    mastery: Math.max(current.mastery, incoming.mastery),
    practiceCount: Math.max(current.practiceCount, incoming.practiceCount),
    lastPracticedAt: later(current.lastPracticedAt, incoming.lastPracticedAt),
    lastVoiceDay: laterDay(current.lastVoiceDay, incoming.lastVoiceDay),
  };
}
