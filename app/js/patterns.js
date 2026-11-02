// Mẫu câu (SPEC-patterns.md): một khung câu có MỘT chỗ trống (It is ___.) + 4–6 hình để điền vào.
// Ghép câu, mạo từ, nhận câu bé nói 3 mức, khóa tiến độ, chọn hình / trò chơi, kiểm tra bài, bài có sẵn.
// Các hàm đều thuần (không phụ thuộc DOM), test được trong Node.

import { normalizeWord, tokenize } from './text.js';
import { matches } from './match.js';

export const PATTERN_KIND = 'patterns';
export const PATTERN_LIMITS = { min: 4, max: 6 };
export const ARTICLES = ['auto', 'a', 'an', 'none'];
export const SAY_ROUNDS = 4; // phần B
export const TELL_ROUNDS = 3; // phần C
export const GAME_ROUNDS = 2; // phần D
export const GAMES = ['listenTap', 'reveal', 'realLife'];

/** Mức câu bé nói (mục 4.4). */
export const LEVEL = { FULL: 'full', PARTIAL: 'partial', KEYWORD: 'keyword', NONE: 'none' };
const LEVEL_RANK = { none: 0, keyword: 1, partial: 2, full: 3 };
export const betterLevel = (a, b) => (LEVEL_RANK[b] > LEVEL_RANK[a] ? b : a);

export const isPatternLesson = (lesson) => lesson?.kind === PATTERN_KIND || Array.isArray(lesson?.slots);

const BLANK = /_{2,}/;
const BLANKS = /_{2,}/g;
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const tidy = (s) => s.replace(/\s+/g, ' ').replace(/\s+([.!?,])/g, '$1').trim();

// ---------- Khung, mạo từ, câu ----------

/** Khóa khung (mục 5): chữ thường, bỏ dấu câu, mọi ____ thành ___, `{a}` giữ nguyên. "It is ____." → "it is ___". */
export function frameKey(frame) {
  return String(frame ?? '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(BLANKS, ' ___ ')
    .replace(/\{a\}/g, ' {a} ')
    .replace(/[^\p{L}\p{N}'{}_ ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export const frameKeyOf = (lesson) => frameKey(lesson.frameId || lesson.frame);

/** Mạo từ của một từ trong khung có `{a}`: "a" / "an" / "" (none). */
export function articleOf(slot) {
  const art = slot.article ?? 'auto';
  if (art === 'none') return '';
  if (art === 'a' || art === 'an') return art;
  return /^[aeiou]/i.test(slot.word) ? 'an' : 'a';
}

/** Hai nửa của khung quanh chỗ trống, `{a}` đã bỏ ra (mạo từ đi cùng từ điền vào). */
export function frameParts(lesson) {
  const [before = '', after = ''] = String(lesson.frame).split(BLANK);
  const hasArticle = /\{a\}\s*$/.test(before);
  return { before: tidy(before.replace(/\{a\}\s*$/, '')), after: tidy(after), hasArticle };
}

/** Chữ điền vào chỗ trống: "a duck", "an egg", "eyes", "sunny". */
export function filledText(lesson, slot) {
  const { hasArticle } = frameParts(lesson);
  const art = hasArticle ? articleOf(slot) : '';
  return art ? `${art} ${slot.word}` : slot.word;
}

/** Câu đầy đủ: "It is sunny.", "I can see an egg.", "I have eyes.". */
export function sentenceOf(lesson, slot) {
  const { before, after } = frameParts(lesson);
  return capital(tidy(`${before} ${filledText(lesson, slot)} ${after || '.'}`));
}

/** Câu Bông đọc: "It is sunny!" (dấu chấm thành dấu chấm than cho vui). */
export const spokenSentence = (lesson, slot) => sentenceOf(lesson, slot).replace(/\.$/, '!');

/** Câu đọc khung khi chỗ trống còn trống: "It is…", "I can see…". */
export const frameLead = (lesson) => `${frameParts(lesson).before}…`;

/** Câu "nối dần" (phần B, hai hình đầu): ["It is…", "rainy!"]. */
export const chunkedSentence = (lesson, slot) => [frameLead(lesson), `${filledText(lesson, slot)}!`];

/** Câu tiếng Việt của từ: sentenceVi, không có thì ghép từ frameVi. */
export const sentenceViOf = (lesson, slot) => slot.sentenceVi
  || (lesson.frameVi ? capital(tidy(String(lesson.frameVi).replace(BLANK, slot.vi || slot.word))) : '');

/** Câu đời thật (phần D, realLife): "It is cloudy today!". */
export const realLifeSentence = (lesson, slot) => (lesson.askTail
  ? `${sentenceOf(lesson, slot).replace(/[.!?]$/, '')} ${lesson.askTail}!` : spokenSentence(lesson, slot));

// ---------- Nhận câu bé nói (mục 4.4) ----------

const CONTRACTIONS = [
  [/\bit's\b/g, 'it is'], [/\bi'm\b/g, 'i am'], [/\bthat's\b/g, 'that is'], [/\bwhat's\b/g, 'what is'],
  [/\bi've\b/g, 'i have'], [/\bhe's\b/g, 'he is'], [/\bshe's\b/g, 'she is'], [/\bthere's\b/g, 'there is'],
];
const ARTICLE_WORDS = new Set(['a', 'an', 'the']);

/** Chữ thường, mở rút gọn (it's → it is). */
export function expandSpeech(text) {
  let s = String(text ?? '').toLowerCase().replace(/[’‘]/g, "'");
  for (const [re, to] of CONTRACTIONS) s = s.replace(re, to);
  return s;
}

/** Từ chính của khung: mọi từ trừ chỗ trống, `{a}` và mạo từ. "I can see {a} ___." → i, can, see. */
export function frameMainWords(lesson) {
  const raw = expandSpeech(String(lesson.frame).replace(BLANKS, ' ').replace(/\{a\}/g, ' '));
  return [...new Set(tokenize(raw).filter((t) => !ARTICLE_WORDS.has(t)))];
}

/**
 * Mức câu bé nói, lấy phương án tốt nhất trong các phương án nhận dạng:
 * cả câu = từ khóa + đủ từ chính; một phần = từ khóa + ít nhất một từ chính; từ khóa = chỉ từ khóa; none = không có từ khóa.
 * Từ khóa so lỏng (số ít / nhiều, gần giống); từ của khung phải đúng (it / is gần nhau quá).
 */
export function speechLevel(alternatives, lesson, slot) {
  const main = frameMainWords(lesson);
  const keys = [...new Set([slot.word, slot.concept].filter(Boolean))];
  let best = LEVEL.NONE;
  const mainSet = new Set(main);
  for (const alt of alternatives ?? []) {
    const words = tokenize(expandSpeech(alt));
    // Tìm từ khóa trong phần KHÔNG phải từ của khung: so lỏng theo âm thì "it" ≈ "hot", "is" ≈ "ice"…
    const rest = words.filter((t) => !mainSet.has(t) && !ARTICLE_WORDS.has(t));
    if (!rest.length || !matches([rest.join(' ')], keys)) continue;
    const tokens = new Set(words);
    const hits = main.filter((w) => tokens.has(w)).length;
    const level = hits === main.length ? LEVEL.FULL : hits > 0 ? LEVEL.PARTIAL : LEVEL.KEYWORD;
    best = betterLevel(best, level);
  }
  return best;
}

// ---------- Tiến độ ----------

/** Khóa sao câu: pattern:<khóa khung>|<concept>. */
export const patternKey = (lesson, slot) => `pattern:${frameKeyOf(lesson)}|${normalizeWord(slot.concept || slot.word)}`;
export const isPatternKey = (key) => String(key).startsWith('pattern:');

/** Sao khung: số concept khác nhau bé đã nói CẢ CÂU với khung này, gộp mọi bài (mục 5). */
export function frameStars(records, key) {
  const prefix = `pattern:${key}|`;
  return records.filter((r) => String(r.word).startsWith(prefix) && r.mastery > 0).length;
}

// ---------- Chọn hình, chọn trò chơi ----------

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Thứ tự hình "từ ít sao" (mục 4.5): chưa có sao câu → ít sao → luyện lâu nhất (chưa luyện = cũ nhất) → ngẫu nhiên.
 * @param {Map<string, object>} records khóa tiến độ → bản ghi
 * @returns {number[]} chỉ số hình trong bài
 */
export function orderSlots(lesson, records = new Map(), rng = Math.random) {
  const info = lesson.slots.map((slot, i) => {
    const r = records.get(patternKey(lesson, slot));
    return { i, stars: r?.mastery ?? 0, at: r?.lastPracticedAt ?? 0, tie: rng() };
  });
  return info.sort((a, b) => (a.stars > 0) - (b.stars > 0) || a.stars - b.stars || a.at - b.at || a.tie - b.tie).map((x) => x.i);
}

/** Hình cho phần B (4 đầu), C (3 kế tiếp, thiếu thì lấy lại từ đầu), D (theo thứ tự). */
export function planSlots(order) {
  const say = order.slice(0, SAY_ROUNDS);
  const rest = order.slice(SAY_ROUNDS);
  const tell = [...rest, ...order].slice(0, TELL_ROUNDS);
  return { say, tell, game: [...order] };
}

/**
 * Hai câu trò chơi (mục 3.D): kiểu chính không trùng lần học trước; bài có `ask` thì câu 2 là realLife
 * (kiểu chính đã là realLife thì câu 2 là listenTap); bài không có `ask` thì câu 2 là kiểu còn lại.
 */
export function pickGames(lesson, lastGame = null, rng = Math.random) {
  const valid = GAMES.filter((g) => g !== 'realLife' || lesson.ask);
  const pool = valid.length >= 2 ? valid.filter((g) => g !== lastGame) : valid;
  const main = pool[Math.floor(rng() * pool.length)];
  const second = lesson.ask ? (main === 'realLife' ? 'listenTap' : 'realLife') : valid.find((g) => g !== main);
  return [main, second];
}

/** Các bước của một bài (Học tiếp dựa vào stage + index). */
export function buildPatternSteps() {
  return [
    { stage: 'explore', index: 0 },
    ...Array.from({ length: SAY_ROUNDS }, (_, index) => ({ stage: 'say', index })),
    ...Array.from({ length: TELL_ROUNDS }, (_, index) => ({ stage: 'tell', index })),
    ...Array.from({ length: GAME_ROUNDS }, (_, index) => ({ stage: 'game', index })),
    { stage: 'song', index: 0 },
  ];
}

// ---------- Kiểm tra bài (báo lỗi, không tự sửa nội dung) ----------

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Kiểm tra bài mẫu câu (bài có sẵn, bài AI trả về, bài khôi phục). Nhận `slots` hoặc `words` (cách AI hay viết).
 * Chỉ tự điền chỗ THIẾU (concept ← word, sentenceVi ← frameVi + vi); nội dung sai thì báo lỗi.
 * @returns {{ ok: boolean, lesson: object|null, errors: string[], warnings: string[] }}
 */
export function validatePatternLesson(raw) {
  const errors = [];
  const warnings = [];
  if (!raw || typeof raw !== 'object') return { ok: false, lesson: null, errors: ['Bài mẫu câu không hợp lệ.'], warnings };
  const title = str(raw.title);
  if (!title) errors.push('Thiếu tên bài.');
  const frame = str(raw.frame);
  const blanks = (frame.match(BLANKS) ?? []).length;
  if (blanks !== 1) errors.push(`Khung câu cần đúng một chỗ trống ___ (đang có ${blanks}).`);
  if (frame && blanks === 1 && !frameMainWords({ frame }).length) errors.push('Khung câu cần có chữ ngoài chỗ trống.');
  const list = Array.isArray(raw.slots) ? raw.slots : Array.isArray(raw.words) ? raw.words : [];
  if (list.length < PATTERN_LIMITS.min || list.length > PATTERN_LIMITS.max) {
    errors.push(`Bài có ${list.length} từ. Mỗi bài ${PATTERN_LIMITS.min}–${PATTERN_LIMITS.max} từ.`);
  }
  const frameVi = str(raw.frameVi);
  const slots = [];
  const seenWord = new Set();
  const seenConcept = new Set();
  for (const [i, x] of list.entries()) {
    const word = str(x?.word ?? x?.en);
    if (!word) {
      errors.push(`Từ thứ ${i + 1} chưa có chữ.`);
      continue;
    }
    const concept = str(x.concept) || word;
    const article = str(x.article) || 'auto';
    if (!ARTICLES.includes(article)) errors.push(`Từ "${word}": article "${article}" không hợp lệ (a / an / none / auto).`);
    if (seenWord.has(normalizeWord(word))) errors.push(`Từ "${word}" bị trùng.`);
    else if (seenConcept.has(normalizeWord(concept))) errors.push(`Hình "${concept}" bị trùng.`);
    seenWord.add(normalizeWord(word));
    seenConcept.add(normalizeWord(concept));
    const vi = str(x.vi);
    const slot = { word, concept, emoji: str(x.emoji) || '⭐', vi, sentenceVi: str(x.sentenceVi) };
    if (article !== 'auto') slot.article = article;
    if (!slot.sentenceVi && frameVi) slot.sentenceVi = sentenceViOf({ frameVi }, slot);
    slots.push(slot);
  }
  if (errors.length) return { ok: false, lesson: null, errors, warnings };
  const lesson = { version: 1, kind: PATTERN_KIND, title, emoji: str(raw.emoji) || slots[0].emoji, frame, slots };
  for (const k of ['titleVi', 'frameVi', 'frameId', 'prompt', 'promptVi', 'ask', 'askVi', 'askTail', 'topic', 'builtin']) {
    if (str(raw[k])) lesson[k] = str(raw[k]);
  }
  if (lesson.frameId) lesson.frameId = frameKey(lesson.frameId);
  return { ok: true, lesson, errors, warnings };
}

// ---------- Bài có sẵn (mục 4.3): từ trùng bài Từ vựng có sẵn cùng chủ đề, concept = từ của bài đó (dùng lại ảnh) ----------

const S = (word, emoji, vi, sentenceVi, extra = {}) => ({ word, concept: extra.concept ?? word, emoji, vi, sentenceVi, ...extra });
const SEE_PROMPT = { prompt: 'What can you see? Tell me!', promptVi: 'Con thấy gì? Con nói đi!' };

const BUILTIN = [
  {
    builtin: 'patterns-weather', title: 'Weather', titleVi: 'Thời tiết', emoji: '🌦️', frame: 'It is ___.', frameVi: 'Trời ___.',
    prompt: "What's the weather? Tell me!", promptVi: 'Trời thế nào? Con nói đi!',
    ask: "Look outside! What's the weather today?", askVi: 'Con nhìn ra ngoài xem! Hôm nay trời thế nào?', askTail: 'today',
    slots: [S('sunny', '☀️', 'nắng', 'Trời nắng.'), S('rainy', '🌧️', 'mưa', 'Trời mưa.'), S('cloudy', '☁️', 'nhiều mây', 'Trời nhiều mây.'),
      S('windy', '🌬️', 'có gió', 'Trời có gió.'), S('hot', '🥵', 'nóng', 'Trời nóng.'), S('cold', '🥶', 'lạnh', 'Trời lạnh.')],
  },
  {
    builtin: 'patterns-feelings', title: 'Feelings', titleVi: 'Cảm xúc', emoji: '😊', frame: 'I am ___.', frameVi: 'Con ___.',
    prompt: 'How do you feel? Tell me!', promptVi: 'Con thấy thế nào? Con nói đi!',
    ask: 'How are you today?', askVi: 'Hôm nay con thấy thế nào?', askTail: 'today',
    slots: [S('happy', '😊', 'vui', 'Con vui.'), S('sad', '😢', 'buồn', 'Con buồn.'), S('angry', '😠', 'tức giận', 'Con tức giận.'),
      S('sleepy', '😴', 'buồn ngủ', 'Con buồn ngủ.'), S('hungry', '😋', 'đói', 'Con đói.'), S('scared', '😨', 'sợ', 'Con sợ.')],
  },
  {
    builtin: 'patterns-animals', title: 'Animals', titleVi: 'Con vật', emoji: '🐶', frame: 'I can see {a} ___.', frameVi: 'Con thấy ___.', ...SEE_PROMPT,
    slots: [S('dog', '🐶', 'con chó', 'Con thấy con chó.'), S('cat', '🐱', 'con mèo', 'Con thấy con mèo.'), S('cow', '🐮', 'con bò', 'Con thấy con bò.'),
      S('duck', '🦆', 'con vịt', 'Con thấy con vịt.'), S('pig', '🐷', 'con lợn', 'Con thấy con lợn.'), S('bird', '🐦', 'con chim', 'Con thấy con chim.')],
  },
  {
    builtin: 'patterns-food', title: 'Food', titleVi: 'Đồ ăn', emoji: '🍚', frame: 'I like ___.', frameVi: 'Con thích ___.',
    prompt: 'What do you like? Tell me!', promptVi: 'Con thích gì? Con nói đi!', ask: 'What do you like?', askVi: 'Con thích ăn gì?',
    slots: [S('rice', '🍚', 'cơm', 'Con thích cơm.'), S('bread', '🍞', 'bánh mì', 'Con thích bánh mì.'),
      S('eggs', '🥚', 'trứng', 'Con thích trứng.', { concept: 'egg' }), S('bananas', '🍌', 'chuối', 'Con thích chuối.', { concept: 'banana' }),
      S('apples', '🍎', 'táo', 'Con thích táo.', { concept: 'apple' }), S('milk', '🥛', 'sữa', 'Con thích sữa.')],
  },
  {
    builtin: 'patterns-colors', title: 'Colors', titleVi: 'Màu sắc', emoji: '🎨', frame: 'It is ___.', frameVi: 'Nó màu ___.',
    prompt: 'What color is it? Tell me!', promptVi: 'Màu gì đây? Con nói đi!',
    slots: [S('red', '🔴', 'đỏ', 'Nó màu đỏ.'), S('blue', '🔵', 'xanh dương', 'Nó màu xanh dương.'), S('yellow', '🟡', 'vàng', 'Nó màu vàng.'),
      S('green', '🟢', 'xanh lá', 'Nó màu xanh lá.'), S('pink', '🩷', 'hồng', 'Nó màu hồng.'), S('orange', '🟠', 'cam', 'Nó màu cam.')],
  },
  {
    builtin: 'patterns-vehicles', title: 'Vehicles', titleVi: 'Xe cộ', emoji: '🚗', frame: 'I can see {a} ___.', frameVi: 'Con thấy ___.', ...SEE_PROMPT,
    slots: [S('car', '🚗', 'xe ô tô', 'Con thấy xe ô tô.'), S('bus', '🚌', 'xe buýt', 'Con thấy xe buýt.'), S('train', '🚂', 'tàu hỏa', 'Con thấy tàu hỏa.'),
      S('plane', '✈️', 'máy bay', 'Con thấy máy bay.'), S('boat', '⛵', 'con thuyền', 'Con thấy con thuyền.'), S('bike', '🚲', 'xe đạp', 'Con thấy xe đạp.')],
  },
  {
    builtin: 'patterns-actions', title: 'Actions', titleVi: 'Con làm được', emoji: '🏃', frame: 'I can ___.', frameVi: 'Con biết ___.',
    prompt: 'What can you do? Tell me!', promptVi: 'Con biết làm gì? Con nói đi!',
    slots: [S('jump', '🦘', 'nhảy', 'Con biết nhảy.'), S('run', '🏃', 'chạy', 'Con biết chạy.'), S('clap', '👏', 'vỗ tay', 'Con biết vỗ tay.'),
      S('dance', '💃', 'nhảy múa', 'Con biết nhảy múa.'), S('swim', '🏊', 'bơi', 'Con biết bơi.'), S('sing', '🎤', 'hát', 'Con biết hát.')],
  },
  {
    builtin: 'patterns-body', title: 'Body', titleVi: 'Cơ thể', emoji: '👃', frame: 'I have {a} ___.', frameVi: 'Con có ___.',
    prompt: 'What do you have? Tell me!', promptVi: 'Con có gì? Con nói đi!',
    slots: [S('nose', '👃', 'cái mũi', 'Con có cái mũi.', { article: 'a' }), S('mouth', '👄', 'cái miệng', 'Con có cái miệng.', { article: 'a' }),
      S('eyes', '👀', 'đôi mắt', 'Con có đôi mắt.', { article: 'none' }), S('ears', '👂', 'đôi tai', 'Con có đôi tai.', { article: 'none' }),
      S('hands', '👐', 'đôi tay', 'Con có đôi tay.', { article: 'none' }), S('feet', '🦶', 'đôi chân', 'Con có đôi chân.', { article: 'none' })],
  },
];

/** Các bài mẫu câu có sẵn, thứ tự như mục 4.3 (Weather, Feelings trước). `builtin`: mã cố định để tự thêm một lần. */
export function builtInPatternLessons() {
  return BUILTIN.map((l) => ({
    version: 1, kind: PATTERN_KIND, topic: 'Sentences', frameId: frameKey(l.frame), ...l, slots: l.slots.map((s) => ({ ...s })),
  }));
}
