// Mẫu câu mở rộng (SPEC-patterns2.md): kiểu bài "Ai đang làm gì?" (`style: 'doing'`).
// Bài chỉ ghi các hành động; app tự ghép câu theo người (is / am, his / her / my), chọn người trong nhà, nhận câu bé nói.
// Không phụ thuộc DOM để chạy được trong Node (test).

import { normalizeWord, tokenize } from './text.js';
import { matches } from './match.js';
import { PATTERN_KIND, LEVEL, betterLevel, expandSpeech } from './patterns.js';
import { MOTION_NAMES } from './phrase.js';

export const DOING_STYLE = 'doing';
/** Tab riêng trong danh sách Mẫu câu (SPEC-patterns2 mục 2). */
export const DOING_TOPIC = 'Who is doing?';
export const DOING_TOPIC_EMOJI = '👨‍👩‍👧';
export const DOING_LIMITS = { min: 3, max: 4 };
export const ASK_ROUNDS = 3; // phần B
export const MAX_CAST = 3; // số người trên màn (không kể ô Me)

export const isDoingLesson = (lesson) => lesson?.kind === PATTERN_KIND && lesson.style === DOING_STYLE;

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Người (mục 3.3) ----------

/** Thứ tự người trong nhà như Hồ sơ của bé (FAMILY của talk.js). */
export const FAMILY_ORDER = ['mummy', 'daddy', 'grandma', 'grandpa', 'brother', 'sister'];

const person = (id, name, ask, gender, vi, alias = []) => ({
  id, name, ask, gender, vi, pron: gender === 'm' ? 'he' : 'she', pos: gender === 'm' ? 'his' : 'her', be: 'is', alias,
});

/** `name`: câu kể; `ask`: câu hỏi (What is your brother doing?); `alias`: các cách bé hay gọi (nhận câu). */
const PEOPLE = new Map([
  ['daddy', person('daddy', 'Daddy', 'Daddy', 'm', 'Bố', ['daddy', 'dad', 'father', 'papa'])],
  ['mummy', person('mummy', 'Mummy', 'Mummy', 'f', 'Mẹ', ['mummy', 'mommy', 'mum', 'mom', 'mother', 'mama'])],
  ['grandpa', person('grandpa', 'Grandpa', 'Grandpa', 'm', 'Ông', ['grandpa', 'grandad', 'granddad', 'grandfather'])],
  ['grandma', person('grandma', 'Grandma', 'Grandma', 'f', 'Bà', ['grandma', 'granny', 'grandmother'])],
  ['brother', person('brother', 'My brother', 'your brother', 'm', 'Anh / em trai', ['brother'])],
  ['sister', person('sister', 'My sister', 'your sister', 'f', 'Chị / em gái', ['sister'])],
]);

/** Bé (ô Me). */
const ME = { id: 'me', name: 'I', ask: 'you', gender: null, vi: 'Con', pron: 'i', pos: 'my', be: 'am', alias: [] };

/**
 * Thông tin một người: daddy… sister, `bong` (Bông vào làm người thứ hai khi nhà chỉ có một người — Bông là nữ), `me`.
 * @param {string} bongName tên nhân vật bố mẹ đặt ở Cài đặt
 */
export function personOf(id, bongName = 'Bông') {
  if (id === 'me') return ME;
  if (id === 'bong') return person('bong', bongName, bongName, 'f', bongName, [normalizeWord(bongName), 'bong', 'bunny']);
  return PEOPLE.get(id) ?? PEOPLE.get('daddy');
}

/** Cụm hành động với sở hữu đã điền: "brushing {pos} teeth" + "his" → "brushing his teeth". */
export const actionText = (action, pos) => action.en.replace('{pos}', pos);

/** Câu kể: "Daddy is brushing his teeth." / "I am brushing my teeth!" */
export function statement(p, action) {
  const text = `${capital(p.name)} ${p.be} ${actionText(action, p.pos)}`;
  return p.id === 'me' ? `${text}!` : `${text}.`;
}

/** Câu tiếng Việt: "Bố đang đánh răng." / "Con đang đánh răng." */
export const statementVi = (p, action) => `${p.vi} đang ${action.vi}.`;

/** Bé nói theo câu của mình: nối dần "I am…" → "brushing my teeth!" */
export const chunkedMe = (action) => ['I am…', `${actionText(action, 'my')}!`];

/** Khen câu bé nói về mình: "You are brushing your teeth!" */
export const youLine = (action) => `You are ${actionText(action, 'your')}!`;

/** Câu hỏi "What … doing?" */
export const whatQuestion = (p) => (p.id === 'me' ? 'What are you doing?' : `What is ${p.ask} doing?`);

/** Câu hỏi "Who …?" (dùng "their" để không lộ đáp án là nam hay nữ); bài có `who` thì dùng câu đó. */
export const whoQuestion = (action) => action.who || `Who is ${actionText(action, 'their')}?`;

/** Câu cả nhà cùng làm: "We are dancing!" */
export const togetherLine = (action) => `We are ${actionText(action, 'our')}!`;

// ---------- Chọn người (mục 3.1a) ----------

/**
 * Người có mặt trong lượt (không kể ô Me), theo thứ tự Hồ sơ.
 * Chưa tích ai → Daddy + Mummy; một người → thêm Bông; hơn 3 người → 3 người ít sao nhất, cố gắng có cả nam lẫn nữ.
 * @param {string[]} family mã người bố mẹ đã tích ở Hồ sơ
 * @param {{ score?: (id: string) => number }} [opts] điểm "đã học" của từng người (ít hơn → ưu tiên)
 */
export function castFor(family = [], { score = () => 0 } = {}) {
  const ids = FAMILY_ORDER.filter((id) => family.includes(id));
  if (!ids.length) return ['daddy', 'mummy'];
  if (ids.length === 1) return [ids[0], 'bong'];
  if (ids.length <= MAX_CAST) return ids;
  const ranked = [...ids].sort((a, b) => score(a) - score(b) || ids.indexOf(a) - ids.indexOf(b));
  const pick = ranked.slice(0, MAX_CAST);
  const genders = new Set(pick.map((id) => personOf(id).gender));
  if (genders.size === 1) {
    const other = ranked.slice(MAX_CAST).find((id) => !genders.has(personOf(id).gender));
    if (other) pick[MAX_CAST - 1] = other;
  }
  return FAMILY_ORDER.filter((id) => pick.includes(id));
}

/**
 * Hai người làm mẫu cho từng hành động ở phần A: ưu tiên 1 nam + 1 nữ; ưu tiên người chưa có ở hành động trước,
 * rồi người ít được chọn hơn (để ai cũng được làm).
 * @returns {string[][]} mỗi hành động một cặp mã người
 */
export function pickPairs(cast, count, rng = Math.random) {
  const pairs = [];
  for (let a = 0; a < cast.length; a++) for (let b = a + 1; b < cast.length; b++) pairs.push([cast[a], cast[b]]);
  const mixed = pairs.filter(([a, b]) => personOf(a).gender !== personOf(b).gender);
  const pool = mixed.length ? mixed : pairs;
  const used = new Map(cast.map((id) => [id, 0]));
  const out = [];
  let prev = [];
  for (let i = 0; i < count; i++) {
    const scored = pool.map((pair) => ({
      pair,
      score: pair.filter((id) => prev.includes(id)).length * 10 + pair.reduce((s, id) => s + used.get(id), 0),
      tie: rng(),
    })).sort((x, y) => x.score - y.score || x.tie - y.tie);
    const [a, b] = scored[0].pair;
    // Người nam nói trước (Daddy … his, rồi Mummy … her) — thứ tự cố định để bé quen nhịp.
    const pair = personOf(a).gender === 'f' && personOf(b).gender === 'm' ? [b, a] : [a, b];
    out.push(pair);
    for (const id of pair) used.set(id, used.get(id) + 1);
    prev = pair;
  }
  return out;
}

// ---------- Tiến độ (mục 5) ----------

/** Khóa sao câu theo từng người: doing:<base>|<personId>. */
export const doingKey = (action, personId) => `doing:${normalizeWord(action.base)}|${personId}`;
export const isDoingKey = (key) => String(key).startsWith('doing:');
export const doingRecords = (records) => records.filter((r) => isDoingKey(r.word));

/**
 * Ba câu hỏi phần B: đúng một câu về bé, hai câu về người khác; các cặp (người, hành động) khác nhau,
 * ưu tiên cặp chưa có sao, ít sao, luyện lâu rồi. Câu về bé nằm giữa.
 * @param {Map<string, object>} records khóa tiến độ → bản ghi
 * @returns {{ person: string, action: number }[]}
 */
export function planQuestions(cast, actions, records = new Map(), rng = Math.random) {
  const rank = (personId) => actions.map((action, i) => {
    const r = records.get(doingKey(action, personId));
    return { person: personId, action: i, stars: r?.mastery ?? 0, at: r?.lastPracticedAt ?? 0, tie: rng() };
  });
  const order = (list) => list.sort((a, b) => (a.stars > 0) - (b.stars > 0) || a.stars - b.stars || a.at - b.at || a.tie - b.tie);
  const me = order(rank('me'))[0];
  const others = order(cast.flatMap(rank));
  const picked = [];
  // Cặp chưa có sao trước hết; trong đó ưu tiên hai người khác nhau, hành động khác câu về bé.
  const fresh = (q) => q.stars === 0;
  const newPerson = (q) => !picked.some((p) => p.person === q.person);
  const passes = [
    (q) => fresh(q) && newPerson(q) && q.action !== me.action,
    (q) => fresh(q) && newPerson(q),
    fresh,
    (q) => newPerson(q) && q.action !== me.action,
    newPerson,
    () => true,
  ];
  for (const pass of passes) {
    for (const q of others) {
      if (picked.length >= ASK_ROUNDS - 1) break;
      if (!picked.includes(q) && !picked.some((p) => p.person === q.person && p.action === q.action) && pass(q)) picked.push(q);
    }
  }
  return [picked[0], me, picked[1]].filter(Boolean).map(({ person: p, action }) => ({ person: p, action }));
}

/** Các bước của một bài (P1: A xem và nói theo từng hành động, B hỏi – đáp). */
export function buildDoingSteps(lesson) {
  return [
    ...lesson.actions.map((_, index) => ({ stage: 'watch', index })),
    ...Array.from({ length: ASK_ROUNDS }, (_, index) => ({ stage: 'ask', index })),
  ];
}

/**
 * Kế hoạch của một lượt (cast, cặp người phần A, câu hỏi phần B): lưu cùng chỗ dừng để Học tiếp không chọn lại.
 * Kế hoạch đã lưu còn hợp lệ (cùng số hành động, người có thật) thì dùng lại.
 */
export function doingPlan(lesson, { family, records = new Map(), saved = null, rng = Math.random }) {
  const n = lesson.actions.length;
  const known = (id) => id === 'bong' || FAMILY_ORDER.includes(id);
  if (saved && Array.isArray(saved.cast) && saved.cast.every(known) && saved.pairs?.length === n
    && saved.pairs.every((p) => p.length === 2 && p.every((id) => saved.cast.includes(id)))
    && saved.questions?.length && saved.questions.every((q) => (q.person === 'me' || saved.cast.includes(q.person)) && q.action >= 0 && q.action < n)) {
    return saved;
  }
  const score = (id) => lesson.actions.reduce((s, a) => s + (records.get(doingKey(a, id))?.mastery ?? 0), 0);
  const cast = castFor(family, { score });
  return { cast, pairs: pickPairs(cast, n, rng), questions: planQuestions(cast, lesson.actions, records, rng) };
}

// ---------- Nhận câu bé nói (mục 3.5) ----------

/**
 * Từ khóa của hành động: `base` (thường là dạng nguyên mẫu; có thể là từ dễ nói nhất, ví dụ "bath" của "taking a bath")
 * + dạng -ing (từ đầu của `en`).
 */
export const actionKeywords = (action) => [...new Set([normalizeWord(action.base), tokenize(action.en)[0]].filter(Boolean))];

/**
 * Mức câu bé nói về người `p` đang làm `action` (lấy phương án nhận dạng tốt nhất):
 * cả câu = chủ ngữ đúng (tên hoặc đại từ; bé: I) + to be đúng + từ khóa; một phần = từ khóa + một từ chính (gồm cả
 * nhầm chủ ngữ / đại từ); từ khóa = chỉ từ khóa. Phần sau từ khóa (my teeth, a book) không bắt buộc.
 */
export function doingLevel(alternatives, p, action) {
  const keys = actionKeywords(action);
  const subject = p.id === 'me' ? ['i'] : [...p.alias, p.pron];
  const mainWords = new Set(['i', 'am', 'is', 'are', 'he', 'she', 'you', ...subject]);
  let best = LEVEL.NONE;
  for (const alt of alternatives ?? []) {
    const words = tokenize(expandSpeech(alt));
    const rest = words.filter((t) => !mainWords.has(t));
    if (!rest.length || !matches([rest.join(' ')], keys)) continue;
    const has = new Set(words);
    const full = p.id === 'me' ? has.has('i') && has.has('am') : subject.some((w) => has.has(w)) && has.has('is');
    const any = [...mainWords].some((w) => has.has(w));
    best = betterLevel(best, full ? LEVEL.FULL : any ? LEVEL.PARTIAL : LEVEL.KEYWORD);
  }
  return best;
}

// ---------- Kiểm tra bài (báo lỗi, không tự sửa nội dung) ----------

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Kiểm tra bài "Ai đang làm gì?" (bài có sẵn, bài AI trả về, bài khôi phục).
 * @returns {{ ok: boolean, lesson: object|null, errors: string[], warnings: string[] }}
 */
export function validateDoingLesson(raw) {
  const errors = [];
  const warnings = [];
  if (!raw || typeof raw !== 'object') return { ok: false, lesson: null, errors: ['Bài "Ai đang làm gì?" không hợp lệ.'], warnings };
  const title = str(raw.title);
  if (!title) errors.push('Thiếu tên bài.');
  const list = Array.isArray(raw.actions) ? raw.actions : [];
  if (list.length < DOING_LIMITS.min || list.length > DOING_LIMITS.max) {
    errors.push(`Bài có ${list.length} hành động. Mỗi bài ${DOING_LIMITS.min}–${DOING_LIMITS.max} hành động.`);
  }
  const motions = MOTION_NAMES;
  const actions = [];
  const bases = new Set();
  for (const [i, x] of list.entries()) {
    const en = str(x?.en);
    const base = normalizeWord(str(x?.base));
    const label = en || `thứ ${i + 1}`;
    if (!en) {
      errors.push(`Hành động thứ ${i + 1} chưa có chữ (en).`);
      continue;
    }
    const first = en.split(/\s+/)[0];
    if (!/^[a-z]+ing$/i.test(first)) errors.push(`"${first}" không phải dạng -ing. Viết hành động như "cooking", "brushing {pos} teeth".`);
    if ((en.match(/\{pos\}/g) ?? []).length > 1) errors.push(`"${en}": {pos} chỉ dùng tối đa một lần.`);
    if (!base || /\s/.test(base)) errors.push(`Hành động "${label}": base phải là một từ (ví dụ "cook").`);
    else if (bases.has(base)) errors.push(`Hai hành động trùng base "${base}".`);
    bases.add(base);
    const motion = str(x?.motion) || 'none';
    if (!motions.includes(motion)) errors.push(`Hành động "${label}": motion "${motion}" không có. Chọn một trong: ${motions.join(', ')}.`);
    const vi = str(x?.vi);
    if (!vi) errors.push(`Hành động "${label}" chưa có tiếng Việt (vi).`);
    const action = { en, base, vi, emoji: str(x?.emoji) || '⭐', motion };
    if (str(x?.who)) action.who = str(x.who);
    actions.push(action);
  }
  const together = normalizeWord(str(raw.together));
  if (together && !bases.has(together)) errors.push(`together "${together}" không phải base của hành động nào trong bài.`);
  if (errors.length) return { ok: false, lesson: null, errors, warnings };
  const lesson = {
    version: 1, kind: PATTERN_KIND, style: DOING_STYLE, title, emoji: str(raw.emoji) || actions[0].emoji, actions,
    together: together || actions[0].base,
  };
  for (const k of ['titleVi', 'topic', 'topicEmoji', 'builtin']) if (str(raw[k])) lesson[k] = str(raw[k]);
  return { ok: true, lesson, errors, warnings };
}

// ---------- Bài có sẵn (mục 3.4) ----------

const A = (en, base, vi, emoji, motion) => ({ en, base, vi, emoji, motion });

const BUILTIN = [
  {
    builtin: 'doing-morning', title: 'Morning', titleVi: 'Buổi sáng', emoji: '🌅', together: 'brush',
    actions: [A('brushing {pos} teeth', 'brush', 'đánh răng', '🪥', 'brush'), A('washing {pos} face', 'wash', 'rửa mặt', '🧼', 'wash'),
      A('eating breakfast', 'eat', 'ăn sáng', '🍞', 'eat'), A('getting dressed', 'dress', 'mặc quần áo', '👕', 'none')],
  },
  {
    builtin: 'doing-home', title: 'At home', titleVi: 'Ở nhà', emoji: '🏠', together: 'cook',
    actions: [A('cooking', 'cook', 'nấu ăn', '🍳', 'stir'), A('reading a book', 'read', 'đọc sách', '📖', 'none'),
      A('watching TV', 'watch', 'xem ti vi', '📺', 'none'), A('cleaning', 'clean', 'dọn dẹp', '🧹', 'push')],
  },
  {
    builtin: 'doing-play', title: 'Play time', titleVi: 'Giờ chơi', emoji: '🎈', together: 'dance',
    actions: [A('playing ball', 'play', 'chơi bóng', '⚽', 'kick'), A('drawing', 'draw', 'vẽ tranh', '🖍️', 'none'),
      A('singing', 'sing', 'hát', '🎵', 'dance'), A('dancing', 'dance', 'nhảy múa', '💃', 'dance')],
  },
  {
    builtin: 'doing-bedtime', title: 'Bedtime', titleVi: 'Giờ đi ngủ', emoji: '🌙', together: 'sleep',
    actions: [A('taking a bath', 'bath', 'tắm', '🛁', 'wash'), A('drinking milk', 'drink', 'uống sữa', '🥛', 'drink'),
      A('reading a story', 'story', 'đọc truyện', '📚', 'none'), A('sleeping', 'sleep', 'ngủ', '💤', 'sleep')],
  },
];

/** Các bài "Ai đang làm gì?" có sẵn (tab riêng trong Mẫu câu). `builtin`: mã cố định để tự thêm một lần. */
export function builtInDoingLessons() {
  return BUILTIN.map((l) => ({
    version: 1, kind: PATTERN_KIND, style: DOING_STYLE, topic: DOING_TOPIC, topicEmoji: DOING_TOPIC_EMOJI,
    ...l, actions: l.actions.map((a) => ({ ...a })),
  }));
}
