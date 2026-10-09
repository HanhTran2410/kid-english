// Làm sạch và kiểm tra JSON bài học do AI trả về (SPEC mục 3.1).
// Lỗi nặng → từ chối bài. Lỗi nhẹ → tự sửa và trả về cảnh báo để hiện ở màn xem trước.

import { normalizeWord, wordCount } from './text.js';

export const LIMITS = {
  minWords: 2,
  maxWords: 12,
  maxConversation: 24,
  maxQuestions: 12,
  maxStory: 10,
  maxChildWords: 5,
  maxRepeatWords: 3,
};

export const FORMAT_VERSION = 1;
export const MISSING_EMOJI = '🖼️';

const COLORS = new Set([
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
  'black', 'white', 'brown', 'gray', 'grey',
]);

/**
 * Tìm và đọc đối tượng JSON trong đoạn văn bản bố mẹ dán vào
 * (có thể bọc trong ```json, kèm lời chào, dấu nháy cong, dấu phẩy thừa).
 * @returns {{ ok: true, value: any } | { ok: false, error: string }}
 */
export function extractJson(text) {
  const source = String(text ?? '');
  const start = source.indexOf('{');
  if (start < 0) {
    return { ok: false, error: 'Không tìm thấy bài học trong đoạn đã dán. Hãy copy toàn bộ câu trả lời của AI.' };
  }

  const end = findMatchingBrace(source, start);
  if (end < 0) {
    return { ok: false, error: 'Bài bị cắt dở (thiếu phần cuối). Hãy nhắn AI: continue, rồi copy lại toàn bộ.' };
  }

  const candidate = source.slice(start, end + 1);
  try {
    return { ok: true, value: JSON.parse(candidate) };
  } catch {
    // Thử sửa các lỗi AI hay mắc rồi đọc lại.
  }
  try {
    return { ok: true, value: JSON.parse(repairJson(candidate)) };
  } catch (err) {
    return { ok: false, error: `Bài không đúng định dạng JSON (${err.message}). Hãy bảo AI trả lại đúng định dạng.` };
  }
}

/** Vị trí dấu } đóng tương ứng với dấu { ở vị trí start, bỏ qua dấu ngoặc nằm trong chuỗi. -1 nếu không có. */
function findMatchingBrace(text, start) {
  let depth = 0;
  let closeQuote = null; // khác null khi đang ở trong chuỗi
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (closeQuote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === closeQuote) closeQuote = null;
      continue;
    }
    if (ch === '"') closeQuote = '"';
    else if (ch === '“') closeQuote = '”';
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function repairJson(text) {
  return text
    .replace(/[“”„‟]/g, '"')
    .replace(/,\s*([}\]])/g, '$1');
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Kiểm tra và làm sạch bài học.
 * @param {any} raw đối tượng đã đọc từ JSON
 * @param {{ reviewWords?: string[] }} [options] các từ cần ôn đã đưa vào prompt
 * @returns {{ ok: boolean, lesson: object|null, errors: string[], warnings: string[] }}
 */
export function validateLesson(raw, { reviewWords = [] } = {}) {
  const errors = [];
  const warnings = [];
  const fail = () => ({ ok: false, lesson: null, errors, warnings });

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push('Bài học phải là một đối tượng JSON { ... }.');
    return fail();
  }

  if (raw.version != null && Number(raw.version) > FORMAT_VERSION) {
    errors.push(`Bài dùng định dạng mới hơn app (version ${raw.version}). Hãy cập nhật app.`);
    return fail();
  }

  const title = str(raw.title);
  if (!title) errors.push('Bài thiếu tên bài (title).');
  if (!Array.isArray(raw.words)) errors.push('Bài thiếu danh sách từ (words).');
  if (errors.length) return fail();

  // --- words ---
  const words = [];
  const seen = new Set();
  raw.words.forEach((w, i) => {
    const n = i + 1;
    if (!w || typeof w !== 'object') {
      errors.push(`Từ số ${n} không đúng định dạng.`);
      return;
    }
    const en = str(w.en).replace(/\s+/g, ' ');
    const vi = str(w.vi);
    if (!en) {
      errors.push(`Từ số ${n} thiếu từ tiếng Anh (en).`);
      return;
    }
    if (!vi) {
      errors.push(`Từ số ${n} ("${en}") thiếu nghĩa tiếng Việt (vi).`);
      return;
    }
    const key = normalizeWord(en);
    if (seen.has(key)) {
      warnings.push(`Từ "${en}" bị trùng, chỉ giữ lần đầu.`);
      return;
    }
    seen.add(key);
    let emoji = str(w.emoji);
    if (!emoji) {
      emoji = MISSING_EMOJI;
      warnings.push(`Từ "${en}" thiếu emoji, tạm dùng ${MISSING_EMOJI} (có thể thêm ảnh sau).`);
    }
    const word = { en, vi, emoji };
    if (str(w.sentence)) word.sentence = str(w.sentence);
    if (str(w.imagePrompt)) word.imagePrompt = str(w.imagePrompt);
    words.push(word);
  });
  if (errors.length) return fail();

  if (words.length > LIMITS.maxWords) {
    warnings.push(`Bài có ${words.length} từ, chỉ giữ ${LIMITS.maxWords} từ đầu.`);
    words.length = LIMITS.maxWords;
  }
  if (words.length < LIMITS.minWords) {
    errors.push(`Bài cần ít nhất ${LIMITS.minWords} từ.`);
    return fail();
  }

  const byKey = new Map(words.map((w) => [normalizeWord(w.en), w.en]));
  const canonical = (v) => byKey.get(normalizeWord(v));

  let emoji = str(raw.emoji);
  if (!emoji) {
    emoji = words[0].emoji;
    warnings.push(`Bài thiếu emoji, dùng emoji của từ đầu tiên (${emoji}).`);
  }

  // --- conversation ---
  let conversation = [];
  if (raw.conversation != null && !Array.isArray(raw.conversation)) {
    warnings.push('Phần hội thoại không đúng định dạng, đã bỏ.');
  } else {
    (raw.conversation ?? []).forEach((t, i) => {
      const n = i + 1;
      const teacher = str(t?.teacher);
      const child = str(t?.child);
      const rawWord = str(t?.word);
      if (!teacher || !child || !rawWord) {
        warnings.push(`Lượt hội thoại số ${n} thiếu nội dung, đã bỏ.`);
        return;
      }
      const word = canonical(rawWord);
      if (!word) {
        warnings.push(`Lượt hội thoại số ${n} dùng từ "${rawWord}" không có trong bài, đã bỏ.`);
        return;
      }
      if (wordCount(child) > LIMITS.maxChildWords) {
        warnings.push(`Câu của bé ở lượt hội thoại số ${n} dài hơn ${LIMITS.maxChildWords} từ: "${child}".`);
      }
      conversation.push({ word, teacher, child });
    });
    if (conversation.length > LIMITS.maxConversation) {
      warnings.push(`Hội thoại có ${conversation.length} lượt, chỉ giữ ${LIMITS.maxConversation} lượt đầu.`);
      conversation = conversation.slice(0, LIMITS.maxConversation);
    }
  }

  // --- questions ---
  let questions = [];
  if (raw.questions != null && !Array.isArray(raw.questions)) {
    warnings.push('Phần câu hỏi không đúng định dạng, đã bỏ.');
  } else {
    (raw.questions ?? []).forEach((q, i) => {
      const n = i + 1;
      const ask = str(q?.ask);
      const rawAnswer = str(q?.answer);
      if (!ask || !rawAnswer) {
        warnings.push(`Câu hỏi số ${n} thiếu nội dung, đã bỏ.`);
        return;
      }
      const answer = canonical(rawAnswer);
      if (!answer) {
        warnings.push(`Câu hỏi số ${n} có đáp án "${rawAnswer}" không có trong bài, đã bỏ.`);
        return;
      }
      questions.push({ ask, answer });
    });
    if (questions.length > LIMITS.maxQuestions) {
      warnings.push(`Có ${questions.length} câu hỏi, chỉ giữ ${LIMITS.maxQuestions} câu đầu.`);
      questions = questions.slice(0, LIMITS.maxQuestions);
    }
  }

  // --- story ---
  let story = [];
  if (raw.story != null && !Array.isArray(raw.story)) {
    warnings.push('Phần truyện không đúng định dạng, đã bỏ.');
  } else {
    (raw.story ?? []).forEach((s, i) => {
      const n = i + 1;
      const text = typeof s === 'string' ? s.trim() : str(s?.text);
      if (!text) {
        warnings.push(`Câu truyện số ${n} trống, đã bỏ.`);
        return;
      }
      const line = { text };
      const repeat = typeof s === 'object' ? str(s?.repeat) : '';
      if (repeat) {
        if (wordCount(repeat) > LIMITS.maxRepeatWords) {
          warnings.push(`Câu truyện số ${n}: cụm nói theo "${repeat}" dài hơn ${LIMITS.maxRepeatWords} từ, bé sẽ chỉ nghe câu này.`);
        } else {
          line.repeat = repeat;
        }
      }
      story.push(line);
    });
    if (story.length > LIMITS.maxStory) {
      warnings.push(`Truyện có ${story.length} câu, chỉ giữ ${LIMITS.maxStory} câu đầu.`);
      story = story.slice(0, LIMITS.maxStory);
    }
  }

  // --- từ cần ôn ---
  const missingReview = reviewWords.filter((w) => !canonical(w));
  if (missingReview.length) {
    warnings.push(`Bài thiếu từ cần ôn: ${missingReview.join(', ')}.`);
  }

  const lesson = { version: FORMAT_VERSION, title, emoji, words, conversation, questions, story };
  const titleVi = str(raw.titleVi);
  if (titleVi) lesson.titleVi = titleVi;

  return { ok: true, lesson, errors, warnings };
}

/** Đọc đoạn văn bản bố mẹ dán vào thành bài học đã kiểm tra. */
export function parseLesson(text, options) {
  const extracted = extractJson(text);
  if (!extracted.ok) return { ok: false, lesson: null, errors: [extracted.error], warnings: [] };
  return validateLesson(extracted.value, options);
}

/** Tạo bản ghi để lưu vào IndexedDB: id do app tạo, không dùng id của AI. */
export function createLessonRecord(lesson, now = Date.now()) {
  return {
    ...lesson,
    id: crypto.randomUUID(),
    createdAt: now,
    timesCompleted: 0,
    resume: null,
  };
}

/** Câu hỏi tự tạo khi bài không có `questions` (SPEC mục 4.3). */
export function autoQuestions(lesson) {
  return lesson.words.map((w) => ({
    ask: COLORS.has(normalizeWord(w.en)) ? `Which one is ${w.en}?` : `Where is the ${w.en}?`,
    answer: w.en,
  }));
}

/** Tìm từ trong bài theo cách so sánh lỏng. */
export function findWord(lesson, en) {
  const key = normalizeWord(en);
  return lesson.words.find((w) => normalizeWord(w.en) === key) ?? null;
}

/**
 * Các từ của bài mới đã có ở bài khác (không tính từ cần ôn, vì cố ý đưa vào).
 * @returns {{ word: string, lessonTitle: string }[]}
 */
export function overlapWithLessons(lesson, lessons, reviewWords = []) {
  const review = new Set(reviewWords.map(normalizeWord));
  const owner = new Map();
  for (const l of lessons) {
    for (const w of l.words) if (!owner.has(normalizeWord(w.en))) owner.set(normalizeWord(w.en), l.title);
  }
  return lesson.words
    .map((w) => normalizeWord(w.en))
    .filter((k) => owner.has(k) && !review.has(k))
    .map((k) => ({ word: k, lessonTitle: owner.get(k) }));
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Bỏ số thứ tự ở cuối tên: "Animals 2" → "Animals". */
export function baseTitle(title) {
  return String(title ?? '').trim().replace(/\s+\d+$/, '').trim();
}

/** Chủ đề của bài (để chia tab): `topic` do bố mẹ chọn lúc tạo bài, không có thì lấy theo tên bài. */
export function topicOf(lesson) {
  const t = String(lesson.topic ?? '').trim() || baseTitle(lesson.title) || 'Other';
  return capitalize(t.replace(/\s+/g, ' '));
}

/** Tên không trùng: "Animals" đã có → "Animals 2", "Animals 3"… (so sánh không phân biệt hoa/thường). */
export function uniqueTitle(title, existingTitles) {
  const taken = new Set(existingTitles.map((t) => String(t).trim().toLowerCase()));
  const wanted = String(title).trim();
  if (!taken.has(wanted.toLowerCase())) return wanted;
  const base = baseTitle(wanted) || wanted;
  for (let n = 2; ; n++) {
    const candidate = `${base} ${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

/**
 * Nhóm bài theo chủ đề (giữ thứ tự bài mới nhất trước).
 * @returns {{ topic: string, emoji: string, lessons: object[] }[]}
 */
export function groupByTopic(lessons) {
  const groups = new Map();
  for (const l of lessons) {
    const key = topicOf(l);
    if (!groups.has(key)) groups.set(key, { topic: key, emoji: l.emoji, lessons: [] });
    groups.get(key).lessons.push(l);
  }
  return [...groups.values()];
}

/** Số thứ tự bài dạng 2 chữ số: 3 → "03". */
export const formatLessonNo = (no) => String(no ?? 0).padStart(2, '0');

/** Số tiếp theo cho bài mới (lớn nhất hiện có + 1). */
export function nextLessonNo(lessons) {
  return lessons.reduce((max, l) => Math.max(max, Number(l.no) || 0), 0) + 1;
}

/**
 * Đánh số cho các bài chưa có số, theo thứ tự tạo (cũ trước). Không đổi số của bài đã có.
 * @returns {object[]} các bài vừa được đánh số (cần lưu lại)
 */
export function assignLessonNumbers(lessons) {
  let next = nextLessonNo(lessons);
  return lessons
    .filter((l) => !(Number(l.no) > 0))
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
    .map((l) => ({ ...l, no: next++ }));
}

/** Tên file chia sẻ bài: số đứng đầu, ngắn gọn để không bị cắt "…": "03-animals.zip". */
export function lessonFileName(lesson) {
  const slug = String(lesson.title ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24).replace(/-$/, '') || 'bai-hoc';
  return `${formatLessonNo(lesson.no)}-${slug}.zip`;
}
