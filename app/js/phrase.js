// Bài "Câu nói hằng ngày" (SPEC-v1.0): kiểm tra JSON bài câu, hiệu ứng chuyển động, chia cụm, khóa tiến độ.

import { normalizeWord, tokenize, wordCount } from './text.js';
import { MISSING_EMOJI } from './lesson.js';

export const PHRASE_KIND = 'phrases';
export const WORDS_KIND = 'words';

export const PHRASE_LIMITS = { minPhrases: 2, maxPhrases: 8, maxWords: 5, maxFramePrompts: 4 };

/**
 * Hiệu ứng chuyển động (SPEC-v1.0 mục 2.2).
 * needsObject: cần emoji của vật; overlay: emoji phụ do app vẽ thêm; onImage: hiệu ứng nhẹ dùng khi hình là ảnh/flipbook.
 */
export const MOTIONS = {
  open: { needsObject: true, onImage: 'pulse' },
  close: { needsObject: true, onImage: 'pulse' },
  'put-on': { needsObject: true, onImage: 'pulse' },
  'take-off': { needsObject: true, onImage: 'pulse' },
  wash: { needsObject: false, overlay: '🫧', onImage: 'pulse' },
  brush: { needsObject: false, overlay: '🪥', onImage: 'pulse' },
  eat: { needsObject: true, onImage: 'pulse' },
  drink: { needsObject: true, onImage: 'pulse' },
  'turn-on': { needsObject: true, onImage: 'glow' },
  'turn-off': { needsObject: true, onImage: 'glow' },
  'sit-down': { needsObject: false, onImage: 'bounce' },
  'stand-up': { needsObject: false, onImage: 'bounce' },
  wave: { needsObject: false, overlay: '👋', onImage: 'bounce' },
  clap: { needsObject: false, overlay: '👏', onImage: 'bounce' },
  jump: { needsObject: false, onImage: 'bounce' },
  sleep: { needsObject: false, overlay: '💤', onImage: 'bounce' },
  go: { needsObject: false, overlay: '👣', onImage: 'bounce' },
  none: { needsObject: false, onImage: 'bounce' },
};

export const MOTION_NAMES = Object.keys(MOTIONS);

/** Hiệu ứng thực sự dùng: thiếu điều kiện thì dự phòng `none`; trên ảnh/flipbook chỉ dùng hiệu ứng nhẹ. */
export function effectiveMotion(motion, { hasObject = true, isImage = false } = {}) {
  const spec = MOTIONS[motion] ?? MOTIONS.none;
  if (isImage) return spec.onImage;
  if (spec.needsObject && !hasObject) return 'none';
  return MOTIONS[motion] ? motion : 'none';
}

// Từ phụ không phải từ khóa.
const FILLER = new Set(['the', 'a', 'an', 'your', 'my', 'our', 'his', 'her', 'its', "let's", 'lets', 'please', 'to', 'it', 'up', 'down', 'on', 'off', 'in', 'out', 'and', 'now']);

/** Bài từ vựng cũ không có `kind` → coi là bài từ vựng. */
export const lessonKind = (lesson) => (lesson?.kind === PHRASE_KIND || Array.isArray(lesson?.phrases) ? PHRASE_KIND : WORDS_KIND);
export const isPhraseLesson = (lesson) => lessonKind(lesson) === PHRASE_KIND;

/** Khóa tiến độ của câu: dùng chung giữa các bài có cùng câu (SPEC-v1.0 mục 8). */
export const phraseKey = (en) => `phrase:${normalizeWord(en).replace(/[!?.]+$/, '')}`;
export const isPhraseKey = (key) => String(key).startsWith('phrase:');

/** Cụm có nằm liền nhau trong câu không; trả về vị trí cụm (theo từ) hoặc -1. */
function phraseIndex(tokens, phrase) {
  const p = tokenize(phrase);
  if (!p.length) return -1;
  for (let i = 0; i + p.length <= tokens.length; i++) {
    if (p.every((t, k) => tokens[i + k] === t)) return i;
  }
  return -1;
}

/**
 * Chia câu thành cụm để Bông đọc từng cụm: phần động từ (requiredKeywords) và phần còn lại.
 * "Put on your shirt" + ["put on"] → ["Put on", "your shirt"]. Câu ngắn (≤ 2 từ) thì giữ nguyên.
 */
export function autoChunks(en, requiredKeywords = []) {
  const words = String(en).trim().split(/\s+/);
  if (words.length <= 2) return [String(en).trim()];
  const tokens = tokenize(en);
  for (const kw of requiredKeywords) {
    const i = phraseIndex(tokens, kw);
    if (i < 0) continue;
    const end = i + tokenize(kw).length;
    if (end >= words.length) continue;
    return [words.slice(0, end).join(' '), words.slice(end).join(' ')];
  }
  return [String(en).trim()];
}

/** `chunks` hợp lệ khi ghép lại đúng bằng câu (không tính hoa/thường, dấu câu). */
export function chunksMatch(en, chunks) {
  return Array.isArray(chunks) && chunks.length > 0
    && tokenize(chunks.join(' ')).join(' ') === tokenize(en).join(' ');
}

/** Từ khóa mặc định khi AI không ghi: từ đầu tiên không phải từ phụ (thường là động từ). */
export function defaultRequired(en) {
  const first = tokenize(en).find((t) => !FILLER.has(t));
  return first ? [first] : [];
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const strList = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

/**
 * Kiểm tra và làm sạch bài câu (lỗi nặng → từ chối, lỗi nhẹ → tự sửa + cảnh báo).
 * @returns {{ ok: boolean, lesson: object|null, errors: string[], warnings: string[] }}
 */
export function validatePhraseLesson(raw) {
  const errors = [];
  const warnings = [];
  const fail = () => ({ ok: false, lesson: null, errors, warnings });

  if (raw.version != null && Number(raw.version) > 2) {
    errors.push(`Bài dùng định dạng mới hơn app (version ${raw.version}). Hãy cập nhật app.`);
    return fail();
  }
  const title = str(raw.title);
  if (!title) errors.push('Bài thiếu tên bài (title).');
  if (!Array.isArray(raw.phrases)) errors.push('Bài thiếu danh sách câu (phrases).');
  if (errors.length) return fail();

  const phrases = [];
  const seen = new Set();
  raw.phrases.forEach((p, i) => {
    const n = i + 1;
    if (!p || typeof p !== 'object') {
      errors.push(`Câu số ${n} không đúng định dạng.`);
      return;
    }
    const en = str(p.en).replace(/\s+/g, ' ');
    const vi = str(p.vi);
    if (!en) {
      errors.push(`Câu số ${n} thiếu câu tiếng Anh (en).`);
      return;
    }
    if (!vi) {
      errors.push(`Câu số ${n} ("${en}") thiếu nghĩa tiếng Việt (vi).`);
      return;
    }
    const key = tokenize(en).join(' ');
    if (seen.has(key)) {
      warnings.push(`Câu "${en}" bị trùng, chỉ giữ lần đầu.`);
      return;
    }
    seen.add(key);
    if (wordCount(en) > PHRASE_LIMITS.maxWords) warnings.push(`Câu "${en}" dài hơn ${PHRASE_LIMITS.maxWords} từ.`);

    let emoji = str(p.emoji);
    if (!emoji) {
      emoji = MISSING_EMOJI;
      warnings.push(`Câu "${en}" thiếu emoji, tạm dùng ${MISSING_EMOJI}.`);
    }
    let motion = str(p.motion).toLowerCase();
    if (!MOTIONS[motion]) {
      if (motion) warnings.push(`Câu "${en}": hiệu ứng "${motion}" không có, dùng "none".`);
      motion = 'none';
    }
    let requiredKeywords = strList(p.requiredKeywords).map((k) => k.toLowerCase())
      .filter((k) => phraseIndex(tokenize(en), k) >= 0);
    if (!requiredKeywords.length) {
      requiredKeywords = defaultRequired(en);
      if (p.requiredKeywords != null) warnings.push(`Câu "${en}": từ khóa bắt buộc không có trong câu, app tự chọn "${requiredKeywords.join(', ')}".`);
    }
    const keywords = strList(p.keywords).map((k) => k.toLowerCase());
    let chunks = strList(p.chunks);
    if (!chunksMatch(en, chunks)) {
      if (chunks.length) warnings.push(`Câu "${en}": cách chia cụm không khớp với câu, app tự chia.`);
      chunks = autoChunks(en, requiredKeywords);
    }
    let framePrompts = strList(p.framePrompts ?? p.frames);
    if (framePrompts.length > PHRASE_LIMITS.maxFramePrompts) {
      warnings.push(`Câu "${en}" có ${framePrompts.length} khung hình, chỉ giữ ${PHRASE_LIMITS.maxFramePrompts}.`);
      framePrompts = framePrompts.slice(0, PHRASE_LIMITS.maxFramePrompts);
    }
    const phrase = { id: str(p.id), en, vi, emoji, motion, requiredKeywords, keywords, chunks };
    if (str(p.imagePrompt)) phrase.imagePrompt = str(p.imagePrompt);
    if (framePrompts.length) phrase.framePrompts = framePrompts;
    phrases.push(phrase);
  });
  if (errors.length) return fail();

  if (phrases.length > PHRASE_LIMITS.maxPhrases) {
    warnings.push(`Bài có ${phrases.length} câu, chỉ giữ ${PHRASE_LIMITS.maxPhrases} câu đầu.`);
    phrases.length = PHRASE_LIMITS.maxPhrases;
  }
  if (phrases.length < PHRASE_LIMITS.minPhrases) {
    errors.push(`Bài cần ít nhất ${PHRASE_LIMITS.minPhrases} câu.`);
    return fail();
  }

  // Mã câu: thiếu hoặc trùng thì đặt lại p1, p2… theo thứ tự.
  const ids = phrases.map((p) => p.id);
  if (ids.some((id, i) => !id || ids.indexOf(id) !== i)) {
    if (ids.some(Boolean)) warnings.push('Mã câu (id) bị thiếu hoặc trùng, app đặt lại p1, p2…');
    phrases.forEach((p, i) => { p.id = `p${i + 1}`; });
  }
  const idSet = new Set(phrases.map((p) => p.id));

  let commands = strList(raw.commands);
  const unknown = commands.filter((c) => !idSet.has(c));
  if (unknown.length) warnings.push(`"commands" có mã câu không tồn tại (${unknown.join(', ')}), đã bỏ.`);
  commands = commands.filter((c) => idSet.has(c));

  let emoji = str(raw.emoji);
  if (!emoji) {
    emoji = phrases[0].emoji;
    warnings.push(`Bài thiếu emoji, dùng emoji của câu đầu tiên (${emoji}).`);
  }

  const lesson = {
    version: 2,
    kind: PHRASE_KIND,
    title,
    emoji,
    routine: raw.routine === true,
    phrases,
    commands,
  };
  const titleVi = str(raw.titleVi);
  if (titleVi) lesson.titleVi = titleVi;
  return { ok: true, lesson, errors, warnings };
}

/** Câu trong bài theo mã. */
export const findPhrase = (lesson, id) => lesson.phrases.find((p) => p.id === id) ?? null;

/** Các câu bài mới đã có ở bài câu khác. */
export function phraseOverlap(lesson, lessons) {
  const owner = new Map();
  for (const l of lessons) {
    if (!isPhraseLesson(l)) continue;
    for (const p of l.phrases) if (!owner.has(phraseKey(p.en))) owner.set(phraseKey(p.en), l.title);
  }
  return lesson.phrases.filter((p) => owner.has(phraseKey(p.en))).map((p) => ({ phrase: p.en, lessonTitle: owner.get(phraseKey(p.en)) }));
}

/**
 * Các bước của một bài câu: với từng câu A (xem và nghe) → B (làm theo) → C (nói theo);
 * sau đó D (chọn hình đúng câu) cho từng câu. Dùng chung cơ chế Học tiếp như bài từ vựng.
 */
export function buildPhraseSteps(lesson) {
  const steps = [];
  lesson.phrases.forEach((_, index) => {
    steps.push({ stage: 'watch', index }, { stage: 'do', index }, { stage: 'say', index });
  });
  if (lesson.phrases.length >= 2) lesson.phrases.forEach((_, index) => steps.push({ stage: 'pick', index }));
  return steps;
}
