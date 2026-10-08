// Kế hoạch các bước của một bài học và các hàm chọn thuần (không phụ thuộc DOM, test được trong Node).

import { autoQuestions } from '../lesson.js';
import { normalizeWord } from '../text.js';

export const STAGES = ['words', 'conversation', 'quiz', 'story'];

const COLORS = new Set(['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'brown', 'gray', 'grey']);

export const isColor = (word) => COLORS.has(normalizeWord(word));

/** "a cow", "an apple", "red" (màu không cần mạo từ). */
export function withArticle(word) {
  if (isColor(word)) return word;
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`;
}

/** Câu "Find the …" khi chơi chọn hình (SPEC 4.3 C, 4.4). */
export function findPrompt(word) {
  return isColor(word) ? `Which one is ${word}?` : `Where is the ${word}?`;
}

/** Câu trả lời mẫu cho "What's this?". */
export function answerSentence(word) {
  return isColor(word) ? `It's ${word}!` : `It's ${withArticle(word)}!`;
}

/** Câu hỏi của phần trò chơi: của AI nếu có, không thì tự tạo. */
export function quizQuestions(lesson) {
  return lesson.questions?.length ? lesson.questions : autoQuestions(lesson);
}

/** Danh sách các bước theo thứ tự: thẻ từ → hội thoại → trò chơi → truyện. Phần nào không có thì bỏ qua. */
export function buildSteps(lesson) {
  const counts = {
    words: lesson.words.length,
    conversation: lesson.conversation?.length ?? 0,
    quiz: lesson.words.length >= 2 ? quizQuestions(lesson).length : 0,
    story: lesson.story?.length ?? 0,
  };
  return STAGES.flatMap((stage) => Array.from({ length: counts[stage] }, (_, index) => ({ stage, index })));
}

/** Vị trí bắt đầu khi "Học tiếp"; không tìm thấy (bài đã đổi) thì học từ đầu. */
export function startIndexFor(steps, resume) {
  if (!resume) return 0;
  const i = steps.findIndex((s) => s.stage === resume.stage && s.index === resume.index);
  return i < 0 ? 0 : i;
}

/** Chỗ dừng sau khi xong bước `doneIndex` (null nếu đã hết bài). */
export function resumeAfter(steps, doneIndex, now = Date.now()) {
  const next = steps[doneIndex + 1];
  if (!next) return null;
  return { stage: next.stage, index: next.index, savedAt: now, progress: (doneIndex + 1) / steps.length };
}

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Các lựa chọn cho câu hỏi chọn hình: 1 đúng + 1–2 sai lấy ngẫu nhiên, xáo trộn.
 * @param {string} answer
 * @param {string[]} pool tất cả các từ có thể dùng
 */
export function pickChoices(answer, pool, rng = Math.random, maxChoices = 3) {
  const key = normalizeWord(answer);
  const others = [...new Set(pool.filter((w) => normalizeWord(w) !== key))];
  const wrong = shuffle(others, rng).slice(0, Math.max(1, maxChoices - 1));
  return shuffle([answer, ...wrong], rng);
}

/**
 * Lượt hỏi đáp cho "Học cùng Bông" (SPEC 4.5): từ chưa thuộc trước, rồi bài mới nhất trước.
 * Bài không có hội thoại thì dùng mẫu "What's this?" → "It's a ___!".
 * @param {object[]} lessons mới nhất trước
 * @param {Set<string>} weakWords khóa các từ chưa thuộc
 */
export function buildChatTurns(lessons, weakWords = new Set(), count = 7) {
  const all = [];
  for (const lesson of lessons) {
    const turns = lesson.conversation?.length
      ? lesson.conversation
      : lesson.words.map((w) => ({ word: w.en, teacher: "What's this?", child: answerSentence(w.en) }));
    for (const t of turns) all.push({ ...t, lessonId: lesson.id });
  }
  const weak = all.filter((t) => weakWords.has(normalizeWord(t.word)));
  const rest = all.filter((t) => !weakWords.has(normalizeWord(t.word)));
  return [...weak, ...rest].slice(0, count);
}
