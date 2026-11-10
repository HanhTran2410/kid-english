// Mẫu câu mở rộng (SPEC-patterns2.md): kiểu bài "Ai đang làm gì?" (`style: 'doing'`) và "Gần – xa" (`style: 'nearFar'`).
// "Ai đang làm gì?": bài chỉ ghi các hành động; app tự ghép câu theo người (is / am, his / her / my), chọn người trong
// nhà, nhận câu bé nói. "Gần – xa": 3 cặp đồ (gần, xa) trên nền tranh của Dán tranh; This is … / That is ….
// Không phụ thuộc DOM để chạy được trong Node (test).

import { normalizeWord, tokenize } from './text.js';
import { matches } from './match.js';
import { PATTERN_KIND, LEVEL, betterLevel, expandSpeech } from './patterns.js';
import { MOTION_NAMES } from './phrase.js';
import { SCENE_BY_ID, ITEM_BY_ID } from './sticker-scenes.js';

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

// ======================================================================================================
// 👉 Gần – xa (`nearFar`, mục 4): This is … (gần, Bông chạm) / That is … (xa, Bông chỉ tay).
// ======================================================================================================

export const NEAR_FAR_STYLE = 'nearFar';
/** Tab riêng trong danh sách Mẫu câu (mục 2). */
export const NEAR_TOPIC = 'This and that';
export const NEAR_TOPIC_EMOJI = '👉';
export const NEAR_PAIRS = 3;
export const NEAR_ASK_ROUNDS = 4; // phần B: 2 câu "this", 2 câu "that"
export const FAR_SCALE = 0.4; // đồ ở vùng xa nhỏ bằng ~40% đồ ở vùng gần (mục 4.1)

export const isNearFarLesson = (lesson) => lesson?.kind === PATTERN_KIND && lesson.style === NEAR_FAR_STYLE;

/**
 * Hai vùng đặt đồ và chỗ đứng của Bông theo từng tranh (khung 400 × 300, [x, y, rộng, cao]) — mục 4.1:
 * vùng xa ở nửa trên (chân trời / trên đồi), vùng gần ở phần ba dưới cùng, chọn ở chỗ trống của tranh; chỗ đứng của Bông
 * ngoài cả hai vùng.
 */
export const NEAR_FAR_ZONES = {
  park: { far: [200, 92, 60, 52], near: [14, 214, 140, 56], bong: [318, 206, 72, 56] },
  farm: { far: [150, 96, 90, 52], near: [12, 214, 120, 56], bong: [306, 206, 84, 56] },
  beach: { far: [158, 118, 60, 54], near: [166, 214, 112, 56], bong: [310, 206, 84, 56] },
  garden: { far: [150, 96, 90, 52], near: [12, 214, 140, 56], bong: [300, 206, 90, 56] },
  street: { far: [252, 18, 120, 64], near: [16, 222, 140, 56], bong: [300, 214, 90, 56] },
};

/**
 * Mạo từ của sticker dùng được ở Gần – xa (mọi sticker của các tranh trong NEAR_FAR_ZONES) — mục 4.4, không tự đoán.
 * 'none': This is ice cream. Đồ số nhiều (sunglasses…) không có trong bảng: chưa dùng được (these / those để sau).
 */
export const ARTICLES = {
  // farm
  cow: 'a', pig: 'a', horse: 'a', sheep: 'a', goat: 'a', chicken: 'a', chick: 'a', duck: 'a', dog: 'a', cat: 'a', rabbit: 'a',
  tractor: 'a', carrot: 'a', corn: 'none', apple: 'an', egg: 'an',
  // beach
  fish: 'a', crab: 'a', shell: 'a', octopus: 'an', dolphin: 'a', whale: 'a', shark: 'a', turtle: 'a', seal: 'a', shrimp: 'a',
  lobster: 'a', boat: 'a', ball: 'a', 'ice cream': 'none', 'palm tree': 'a',
  // park
  bird: 'a', butterfly: 'a', bee: 'a', ladybug: 'a', squirrel: 'a', snail: 'a', kite: 'a', balloon: 'a', bicycle: 'a', scooter: 'a',
  flower: 'a', leaf: 'a',
  // street
  car: 'a', bus: 'a', taxi: 'a', 'police car': 'a', 'fire truck': 'a', ambulance: 'an', truck: 'a', motorbike: 'a', helicopter: 'a',
  plane: 'a', 'traffic light': 'a',
  // garden
  caterpillar: 'a', ant: 'an', hedgehog: 'a', sunflower: 'a', rose: 'a', mushroom: 'a', strawberry: 'a',
};

/** Tên tiếng Việt của sticker (phụ đề "Đây là … / Kia là …"). */
export const NEAR_VI = {
  cow: 'con bò', pig: 'con lợn', horse: 'con ngựa', sheep: 'con cừu', goat: 'con dê', chicken: 'con gà', chick: 'con gà con',
  duck: 'con vịt', dog: 'con chó', cat: 'con mèo', rabbit: 'con thỏ', tractor: 'máy cày', carrot: 'củ cà rốt', corn: 'bắp ngô',
  apple: 'quả táo', egg: 'quả trứng', fish: 'con cá', crab: 'con cua', shell: 'vỏ ốc', octopus: 'con bạch tuộc', dolphin: 'cá heo',
  whale: 'cá voi', shark: 'cá mập', turtle: 'con rùa', seal: 'hải cẩu', shrimp: 'con tôm', lobster: 'tôm hùm', boat: 'con thuyền',
  ball: 'quả bóng', 'ice cream': 'kem', 'palm tree': 'cây dừa', bird: 'con chim', butterfly: 'con bướm', bee: 'con ong',
  ladybug: 'bọ rùa', squirrel: 'con sóc', snail: 'con ốc sên', kite: 'con diều', balloon: 'quả bóng bay', bicycle: 'xe đạp',
  scooter: 'xe trượt', flower: 'bông hoa', leaf: 'chiếc lá', car: 'ô tô', bus: 'xe buýt', taxi: 'xe taxi', 'police car': 'xe cảnh sát',
  'fire truck': 'xe cứu hỏa', ambulance: 'xe cứu thương', truck: 'xe tải', motorbike: 'xe máy', helicopter: 'trực thăng',
  plane: 'máy bay', 'traffic light': 'đèn giao thông', caterpillar: 'con sâu', ant: 'con kiến', hedgehog: 'con nhím',
  sunflower: 'hoa hướng dương', rose: 'hoa hồng', mushroom: 'cây nấm', strawberry: 'quả dâu',
};

/** Đồ thêm (mục 4.3): đồ xa hay gặp nhưng không phải sticker, dùng cho mọi tranh. */
export const EXTRA_ITEMS = {
  tree: { en: 'tree', vi: 'cái cây', emoji: '🌳', article: 'a' },
  house: { en: 'house', vi: 'ngôi nhà', emoji: '🏠', article: 'a' },
  mountain: { en: 'mountain', vi: 'ngọn núi', emoji: '⛰️', article: 'a' },
  sun: { en: 'sun', vi: 'mặt trời', emoji: '☀️', article: 'the' },
  cloud: { en: 'cloud', vi: 'đám mây', emoji: '☁️', article: 'a' },
  rainbow: { en: 'rainbow', vi: 'cầu vồng', emoji: '🌈', article: 'a' },
};

/**
 * Một đồ của bài Gần – xa theo mã (sticker của tranh hoặc đồ thêm): { id, en, vi, emoji, article, sticker }.
 * `article` riêng của bài (bố mẹ ghi) thắng bảng ARTICLES. Không có thì null.
 */
export function nearItem(id, article = null) {
  const extra = EXTRA_ITEMS[id];
  if (extra) return { id, ...extra, article: article || extra.article, sticker: false };
  const it = ITEM_BY_ID.get(id);
  if (!it) return null;
  return { id, en: it.name, vi: NEAR_VI[it.name] ?? it.name, emoji: it.emoji, article: article || ARTICLES[it.name] || null, sticker: true };
}

const withArticle = (item) => (item.article === 'none' ? item.en : `${item.article} ${item.en}`);
const NEAR_WORD = { this: 'This', that: 'That' };
const NEAR_WORD_VI = { this: 'Đây', that: 'Kia' };

/** "This is a flower." / "That is the sun." / "This is ice cream." */
export const nearSentence = (which, item) => `${NEAR_WORD[which]} is ${withArticle(item)}.`;
/** "Đây là bông hoa." / "Kia là cái cây." */
export const nearSentenceVi = (which, item) => `${NEAR_WORD_VI[which]} là ${item.vi}.`;
/** Câu hỏi phần B. */
export const nearQuestion = (which) => `What is ${which}?`;

/** Khóa sao câu: near:<this|that>|<tên đồ>. */
export const nearKey = (which, item) => `near:${which}|${normalizeWord(item.en)}`;
export const isNearKey = (key) => String(key).startsWith('near:');
export const nearRecords = (records) => records.filter((r) => isNearKey(r.word));

/** Đồ của một cặp: { near, far } (đã có mạo từ). */
export const pairItems = (pair) => ({ near: nearItem(pair.near, pair.nearArticle), far: nearItem(pair.far, pair.farArticle) });

/**
 * Bốn câu hỏi phần B: 2 "this" (đồ gần), 2 "that" (đồ xa), xen kẽ this – that; ưu tiên đồ chưa có sao, ít sao, luyện lâu rồi.
 * @returns {{ which: 'this'|'that', pair: number }[]}
 */
export function planNearQuestions(lesson, records = new Map(), rng = Math.random) {
  const pick = (which) => lesson.pairs.map((p, pair) => {
    const item = pairItems(p)[which === 'this' ? 'near' : 'far'];
    const r = records.get(nearKey(which, item));
    return { which, pair, stars: r?.mastery ?? 0, at: r?.lastPracticedAt ?? 0, tie: rng() };
  }).sort((a, b) => (a.stars > 0) - (b.stars > 0) || a.stars - b.stars || a.at - b.at || a.tie - b.tie).slice(0, NEAR_ASK_ROUNDS / 2);
  const [t, f] = [pick('this'), pick('that')];
  return [t[0], f[0], t[1], f[1]].filter(Boolean).map(({ which, pair }) => ({ which, pair }));
}

/** Các bước: A xem và nói theo (3 cặp) → B hỏi – đáp (4 câu) → đọc nhanh các cặp như bài hát. */
export function buildNearSteps(lesson) {
  return [
    ...lesson.pairs.map((_, index) => ({ stage: 'watch', index })),
    ...Array.from({ length: NEAR_ASK_ROUNDS }, (_, index) => ({ stage: 'ask', index })),
    { stage: 'song', index: 0 },
  ];
}

/** Kế hoạch lượt (câu hỏi phần B), lưu cùng chỗ dừng; kế hoạch đã lưu còn hợp lệ thì dùng lại (Học tiếp không chọn lại). */
export function nearPlan(lesson, { records = new Map(), saved = null, rng = Math.random } = {}) {
  const n = lesson.pairs.length;
  if (saved?.questions?.length === NEAR_ASK_ROUNDS
    && saved.questions.every((q) => (q.which === 'this' || q.which === 'that') && q.pair >= 0 && q.pair < n)) return saved;
  return { questions: planNearQuestions(lesson, records, rng) };
}

/**
 * Mức câu bé nói (mục 4.5), lấy phương án nhận dạng tốt nhất:
 * cả câu = đúng this / that + is + tên đồ (mạo từ không bắt buộc); một phần = tên đồ + is / it, hoặc nói nhầm this / that
 * (`swapped`: Bông làm mẫu lại kèm động tác); từ khóa = chỉ có tên đồ.
 * @returns {{ level: string, swapped: boolean }}
 */
export function nearLevel(alternatives, which, item) {
  const other = which === 'this' ? 'that' : 'this';
  const name = normalizeWord(item.en);
  const keys = [...new Set([name, name.split(' ').at(-1)])];
  const mainWords = new Set(['this', 'that', 'is', 'it', 'a', 'an', 'the', 'its']);
  let best = LEVEL.NONE;
  let swapped = false;
  for (const alt of alternatives ?? []) {
    const words = tokenize(expandSpeech(String(alt).replace(/\b(this|that|it)['’]s\b/gi, '$1 is')));
    const rest = words.filter((t) => !mainWords.has(t));
    if (!rest.length || !matches([rest.join(' ')], keys)) continue;
    const has = new Set(words);
    let level;
    if (has.has(which) && has.has('is')) level = LEVEL.FULL;
    else if (has.has(other) || has.has('is') || has.has('it') || has.has(which)) level = LEVEL.PARTIAL;
    else level = LEVEL.KEYWORD;
    const nowSwapped = has.has(other) && !has.has(which);
    if (betterLevel(best, level) !== best) {
      best = level;
      swapped = nowSwapped;
    } else if (level === best && nowSwapped) {
      swapped = true;
    }
  }
  return { level: best, swapped: best === LEVEL.FULL ? false : swapped };
}

/**
 * Kiểm tra bài Gần – xa (bài có sẵn, bài dán vào, bài khôi phục): đúng 3 cặp; tranh có hai vùng; đồ có trong tranh hoặc
 * là đồ thêm; có mạo từ; không trùng đồ; không đồ số nhiều. Báo lỗi rõ, không tự sửa.
 * @returns {{ ok: boolean, lesson: object|null, errors: string[], warnings: string[] }}
 */
export function validateNearFarLesson(raw) {
  const errors = [];
  const warnings = [];
  if (!raw || typeof raw !== 'object') return { ok: false, lesson: null, errors: ['Bài "Gần – xa" không hợp lệ.'], warnings };
  const title = str(raw.title);
  if (!title) errors.push('Thiếu tên bài.');
  const sceneId = str(raw.scene);
  const scene = SCENE_BY_ID.get(sceneId);
  if (!NEAR_FAR_ZONES[sceneId]) {
    errors.push(`Tranh "${sceneId}" chưa dùng được cho Gần – xa. Chọn một trong: ${Object.keys(NEAR_FAR_ZONES).join(', ')}.`);
  }
  const list = Array.isArray(raw.pairs) ? raw.pairs : [];
  if (list.length !== NEAR_PAIRS) errors.push(`Bài có ${list.length} cặp. Mỗi bài đúng ${NEAR_PAIRS} cặp (gần, xa).`);
  const seen = new Set();
  const pairs = [];
  for (const [i, p] of list.entries()) {
    const out = {};
    for (const side of ['near', 'far']) {
      const id = str(p?.[side]).toLowerCase().replace(/\s+/g, '-');
      const name = id.replace(/-/g, ' ');
      if (!id) {
        errors.push(`Cặp thứ ${i + 1} thiếu đồ ${side === 'near' ? 'gần' : 'xa'}.`);
        continue;
      }
      if (['grapes', 'socks', 'sunglasses', 'scissors'].includes(name)) {
        errors.push(`"${name}" là số nhiều — chưa dùng được ở Gần – xa.`);
        continue;
      }
      if (!(scene?.items.some((it) => it.id === id) || EXTRA_ITEMS[id])) {
        errors.push(`Sticker "${name}" không có trong tranh ${scene?.en ?? sceneId} (và không phải đồ thêm).`);
        continue;
      }
      const article = str(p?.[`${side}Article`]);
      if (article && !['a', 'an', 'the', 'none'].includes(article)) errors.push(`"${name}": article "${article}" không hợp lệ (a, an, the, none).`);
      if (!nearItem(id, article || null)?.article) errors.push(`"${name}" chưa có mạo từ (article: a / an / the / none).`);
      if (seen.has(id)) errors.push(`"${name}" có ở 2 cặp. Mỗi đồ chỉ dùng một lần.`);
      seen.add(id);
      out[side] = id;
      if (article) out[`${side}Article`] = article;
    }
    pairs.push(out);
  }
  if (errors.length) return { ok: false, lesson: null, errors, warnings };
  const lesson = { version: 1, kind: PATTERN_KIND, style: NEAR_FAR_STYLE, title, scene: sceneId, pairs, emoji: str(raw.emoji) || scene.emoji };
  for (const k of ['titleVi', 'topic', 'topicEmoji', 'builtin']) if (str(raw[k])) lesson[k] = str(raw[k]);
  return { ok: true, lesson, errors, warnings };
}

/** Các bài "Gần – xa" có sẵn (mục 4.3): đồ ở vùng xa là đồ to / ở xa thật, đồ ở vùng gần là đồ nhỏ cầm được. */
const NEAR_BUILTIN = [
  { builtin: 'near-park', title: 'In the park', titleVi: 'Ở công viên', emoji: '🌳', scene: 'park',
    pairs: [['flower', 'tree'], ['ball', 'kite'], ['dog', 'bird']] },
  { builtin: 'near-farm', title: 'On the farm', titleVi: 'Ở nông trại', emoji: '🚜', scene: 'farm',
    pairs: [['chick', 'cow'], ['egg', 'tractor'], ['rabbit', 'horse']] },
  { builtin: 'near-beach', title: 'At the beach', titleVi: 'Ở bãi biển', emoji: '🏖️', scene: 'beach',
    pairs: [['shell', 'boat'], ['crab', 'dolphin'], ['ball', 'palm-tree']] },
  { builtin: 'near-garden', title: 'In the garden', titleVi: 'Trong vườn', emoji: '🌻', scene: 'garden',
    pairs: [['ladybug', 'butterfly'], ['strawberry', 'sunflower'], ['snail', 'bird']] },
  // Đường phố: vùng xa là bầu trời trên dãy cửa hàng — dùng đồ bay (trực thăng, máy bay, chim) thay cho xe buýt.
  { builtin: 'near-street', title: 'In the street', titleVi: 'Trên đường phố', emoji: '🚦', scene: 'street',
    pairs: [['bicycle', 'helicopter'], ['dog', 'plane'], ['balloon', 'bird']] },
];

/** Các bài "Gần – xa" có sẵn (tab riêng trong Mẫu câu). `builtin`: mã cố định để tự thêm một lần. */
export function builtInNearFarLessons() {
  return NEAR_BUILTIN.map((l) => ({
    version: 1, kind: PATTERN_KIND, style: NEAR_FAR_STYLE, topic: NEAR_TOPIC, topicEmoji: NEAR_TOPIC_EMOJI,
    ...l, pairs: l.pairs.map(([near, far]) => ({ near, far })),
  }));
}
