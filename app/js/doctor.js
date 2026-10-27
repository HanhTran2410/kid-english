// Trò Bác sĩ nhí (SPEC-doctor.md): bạn thú đến phòng khám, Bông làm y tá hướng dẫn, bé chạm đúng chỗ đau
// rồi đưa dụng cụ khám / đồ chữa. Mỗi ca khai báo danh sách bước (mục 6.3); bước nào có từ mức nào ghi ở `from`.
// File này chỉ có dữ liệu + luật (chạy được trong node để test); màn chơi ở screens/doctor.js.

export const CASES_PER_ROUND = 3;
export const ROUNDS_TO_LEVEL_UP = 3;
/** D2 (0.41.0): chơi được cả 3 mức (bước khám, 11 ca, khay 3–4 món). */
export const PLAYABLE_LEVEL = 3;
/** Số món trong khay theo mức và loại bước (SPEC mục 7). */
export const TRAY_SIZE = {
  1: { check: 3, treat: 2 },
  2: { check: 3, treat: 3 },
  3: { check: 3, treat: 4 },
};
/** Chọn 3 ca: thử chừng này bộ để tránh hai ca cùng đồ chữa; không được thì dùng bộ cuối (mục 7.2). */
const PICK_TRIES = 20;
/** Trong một lượt, tối đa chừng này ca là ca bé ít gặp nhất. */
export const LEAST_SEEN_PER_ROUND = 2;

// ---------- Ảnh bố mẹ thay (mục 10) ----------
/** Ảnh đồ (dụng cụ khám + đồ chữa) theo mã đồ; ảnh nền phòng khám (một ảnh, mã BG_KEY). */
export const DOCTOR_ITEM_IMAGES = 'doctor:items';
export const DOCTOR_BG_IMAGES = 'doctor:bg';
export const BG_KEY = 'room';
export const BACKGROUND_PROMPT = [
  "A cheerful children's doctor's examination room for a toddler game, seen from the front.",
  'An empty, soft examination bed in the lower middle of the picture; keep the middle of the picture clear (a toy animal patient will sit on the bed).',
  'Pastel colours (light blue, pink, cream), simple flat shapes, thick soft outlines, a friendly cartoon style.',
  'No people, no animals, no needles, no blood, no medicine bottles, no text. Landscape 4:3.',
].join('\n');

// ---------- Vùng chạm (mục 5) ----------
/** `word`: tên trong câu ("my hand"); `body`: từ bài Body để ghi "đã gặp" (không có thì không ghi). */
export const REGIONS = {
  head: { word: 'head', vi: 'cái đầu' },
  eye: { word: 'eye', vi: 'con mắt', body: 'eyes', emoji: '👀' },
  ear: { word: 'ear', vi: 'cái tai', body: 'ears', emoji: '👂' },
  nose: { word: 'nose', vi: 'cái mũi', body: 'nose', emoji: '👃' },
  mouth: { word: 'mouth', vi: 'cái miệng', body: 'mouth', emoji: '👄' },
  tummy: { word: 'tummy', vi: 'cái bụng' },
  hand: { word: 'hand', vi: 'bàn tay', body: 'hands', emoji: '👐' },
  foot: { word: 'foot', vi: 'bàn chân', body: 'feet', emoji: '🦶' },
};

/**
 * Hình học vùng chạm trong viewBox 240 × 300 của bạn thú (chung cho cả 4 bạn).
 * Tầng 1 (mắt, mũi, miệng, tai, tay, chân) thắng tầng 2 (bụng), tầng 2 thắng tầng 3 (đầu):
 * "vùng nhỏ hơn thắng". Trong cùng tầng: tâm gần nhất thắng. Hai bên tai / mắt / tay / chân cùng một vùng.
 */
export const VIEW_W = 240;
export const VIEW_H = 300;
export const SPOTS = [
  { region: 'eye', x: 92, y: 88, r: 24, tier: 1 },
  { region: 'eye', x: 148, y: 88, r: 24, tier: 1 },
  { region: 'nose', x: 120, y: 112, r: 20, tier: 1 },
  { region: 'mouth', x: 120, y: 138, r: 22, tier: 1 },
  { region: 'ear', x: 62, y: 38, r: 28, tier: 1 },
  { region: 'ear', x: 178, y: 38, r: 28, tier: 1 },
  { region: 'hand', x: 40, y: 214, r: 30, tier: 1 },
  { region: 'hand', x: 200, y: 214, r: 30, tier: 1 },
  { region: 'foot', x: 80, y: 276, r: 28, tier: 1 },
  { region: 'foot', x: 160, y: 276, r: 28, tier: 1 },
  { region: 'tummy', x: 120, y: 222, r: 60, tier: 2 },
  { region: 'head', x: 120, y: 95, r: 76, tier: 3 },
];

/** Vùng tại điểm (x, y) trong viewBox; ngoài người bạn thú thì null. */
export function regionAt(x, y) {
  let best = null;
  for (const s of SPOTS) {
    const d = Math.hypot(x - s.x, y - s.y);
    if (d > s.r) continue;
    if (!best || s.tier < best.tier || (s.tier === best.tier && d < best.d)) best = { ...s, d };
  }
  return best?.region ?? null;
}

/** Điểm đại diện của một vùng (đồ bay tới đây). Ưu tiên bên phải bạn thú (bên trái màn hình) cho tự nhiên. */
export const regionPoint = (region, side = 1) => {
  const spots = SPOTS.filter((s) => s.region === region);
  return spots[Math.min(side, spots.length - 1)] ?? spots[0];
};

// ---------- Bạn thú ----------
export const PATIENTS = [
  // `pitch`: cao độ giọng (Bông y tá giọng thường = 1), mỗi bạn một giọng (SPEC-doctor mục 4.5).
  { id: 'teddy', name: 'Teddy', vi: 'Gấu Teddy', emoji: '🐻', pitch: 0.75 },
  { id: 'kitty', name: 'Kitty', vi: 'Mèo Kitty', emoji: '🐱', pitch: 1.45 },
  { id: 'puppy', name: 'Puppy', vi: 'Cún Puppy', emoji: '🐶', pitch: 1.25 },
  { id: 'piggy', name: 'Piggy', vi: 'Heo Piggy', emoji: '🐷', pitch: 0.9 },
];
export const PATIENT_BY_ID = new Map(PATIENTS.map((p) => [p.id, p]));

// ---------- Dụng cụ khám, đồ chữa (mục 6.1, 6.2) ----------
/**
 * Mọi cụm câu lưu sẵn cho từng đồ, không sinh từ mạo từ:
 * `ask` (câu xin / đưa), `wrong` (câu nhầm "Hmm, …"), `notThis` (câu "không phải", mức 2+), `the` (tên có "the").
 * `draw`: mô tả để AI vẽ ảnh lưới; `reuse`: tên để tìm ảnh có sẵn (bài học, sticker, trò khác) để dùng lại.
 */
export const TOOLS = [
  { id: 'stethoscope', kind: 'check', emoji: '🩺', name: 'stethoscope', vi: 'ống nghe', the: 'the stethoscope', wrong: "that's the stethoscope", notThis: 'not the stethoscope',
    draw: 'a toy stethoscope, blue tubing with a round silver chest piece', reuse: ['stethoscope'] },
  { id: 'thermometer', kind: 'check', emoji: '🌡️', name: 'thermometer', vi: 'nhiệt kế', the: 'the thermometer', wrong: "that's the thermometer", notThis: 'not the thermometer',
    draw: 'a simple digital thermometer, white with a small red tip', reuse: ['thermometer'] },
  { id: 'flashlight', kind: 'check', emoji: '🔦', name: 'flashlight', vi: 'đèn pin', the: 'the flashlight', wrong: "that's the flashlight", notThis: 'not the flashlight',
    draw: 'a small friendly yellow flashlight (torch) with a light beam', reuse: ['flashlight', 'torch'] },
];
export const TREATS = [
  { id: 'bandage', kind: 'treat', emoji: '🩹', name: 'bandage', vi: 'miếng băng dán', ask: 'a bandage', wrong: "that's the bandage", notThis: 'not the bandage',
    draw: 'one adhesive bandage strip (plaster), beige with dots', reuse: ['bandage', 'plaster'] },
  { id: 'medicine', kind: 'treat', emoji: '🥄', name: 'medicine', vi: 'thìa si-rô', ask: 'some medicine', wrong: "that's the medicine", notThis: 'not the medicine',
    draw: 'a spoon with pink syrup, no bottle, no pills', reuse: ['medicine', 'spoon'] },
  { id: 'tissue', kind: 'treat', emoji: '🧻', name: 'tissue', vi: 'giấy lau mũi', ask: 'a tissue', wrong: "that's the tissue", notThis: 'not the tissue',
    draw: 'a box of tissues with one tissue sticking out', reuse: ['tissue', 'tissues'] },
  { id: 'toothbrush', kind: 'treat', emoji: '🪥', name: 'toothbrush', vi: 'bàn chải đánh răng', ask: 'a toothbrush', wrong: "that's the toothbrush", notThis: 'not the toothbrush',
    draw: 'a small toothbrush for a child with a little toothpaste', reuse: ['toothbrush'] },
  { id: 'icepack', kind: 'treat', emoji: '🧊', name: 'ice pack', vi: 'túi chườm lạnh', ask: 'an ice pack', wrong: "that's the ice pack", notThis: 'not the ice pack',
    draw: 'a soft blue ice pack (cold pack)', reuse: ['ice pack'] },
  { id: 'drops', kind: 'treat', emoji: '💧', name: 'eye drops', vi: 'thuốc nhỏ mắt', ask: 'some eye drops', wrong: 'those are the eye drops', notThis: 'not the eye drops',
    draw: 'a small eye drop bottle with one drop', reuse: ['eye drops'] },
  { id: 'water', kind: 'treat', emoji: '🍵', name: 'warm water', vi: 'cốc nước ấm', ask: 'some warm water', wrong: "that's the warm water", notThis: 'not the warm water',
    draw: 'a cup of warm water with a little steam', reuse: ['warm water', 'water', 'cup'] },
  { id: 'blanket', kind: 'treat', emoji: '🛏️', name: 'blanket', vi: 'cái chăn', ask: 'a blanket', wrong: "that's the blanket", notThis: 'not the blanket',
    draw: 'a soft folded blanket', reuse: ['blanket'] },
];
export const ITEM_BY_ID = new Map([...TOOLS, ...TREATS].map((t) => [t.id, t]));

// ---------- Ca (mục 6.3) ----------
/**
 * `say`: triệu chứng lúc vào phòng; `remind`: nhắc lại sau câu nhầm chỗ ("That's my nose! My tummy hurts!");
 * `hurt`: tên chỗ đau trong câu "Yes! My …" (ca răng: tooth, dù vùng chạm là miệng);
 * `sign`: dấu hiệu vẽ trên người (screens/doctor.js); `steps`: các bước, `from` = mức thấp nhất có bước đó.
 */
export const CASES = [
  {
    id: 'cut-hand', level: 1, sign: 'cut-hand', hurt: 'hand',
    say: ['Ouch! My hand hurts!', 'Ui da! Tay tớ đau quá!'], remind: ['My hand hurts!', 'Tay tớ đau cơ!'],
    steps: [{ type: 'touch', target: 'hand' }, { type: 'treat', item: 'bandage' }],
  },
  {
    id: 'cut-foot', level: 1, sign: 'cut-foot', hurt: 'foot',
    say: ['Ouch! My foot hurts!', 'Ui da! Chân tớ đau quá!'], remind: ['My foot hurts!', 'Chân tớ đau cơ!'],
    steps: [{ type: 'touch', target: 'foot' }, { type: 'treat', item: 'bandage' }],
  },
  {
    id: 'tummy', level: 1, sign: 'tummy', hurt: 'tummy',
    say: ['My tummy hurts!', 'Bụng tớ đau quá!'], remind: ['My tummy hurts!', 'Bụng tớ đau cơ!'],
    steps: [{ type: 'touch', target: 'tummy' }, { type: 'check', item: 'stethoscope', from: 2 }, { type: 'treat', item: 'medicine' }],
  },
  {
    id: 'runny-nose', level: 1, sign: 'runny-nose', hurt: 'nose',
    say: ['Achoo! My nose!', 'Hắt xì! Mũi tớ!'], remind: ['My nose is runny!', 'Mũi tớ chảy nước cơ!'],
    steps: [{ type: 'touch', target: 'nose' }, { type: 'treat', item: 'tissue' }],
  },
  {
    id: 'tooth', level: 1, sign: 'tooth', hurt: 'tooth',
    say: ['My tooth hurts!', 'Răng tớ đau quá!'], remind: ['My tooth hurts!', 'Răng tớ đau cơ!'],
    steps: [{ type: 'touch', target: 'mouth' }, { type: 'check', item: 'flashlight', from: 2 }, { type: 'treat', item: 'toothbrush' }],
  },
  {
    id: 'ear-bug', level: 2, sign: null, hurt: 'ear',
    say: ['My ear feels funny!', 'Tai tớ nghe lạ lắm!'], remind: ['My ear feels funny!', 'Tai tớ lạ lắm cơ!'],
    steps: [{ type: 'touch', target: 'ear' }, { type: 'check', item: 'flashlight', from: 2, effect: 'bug' }],
  },
  {
    id: 'eye', level: 2, sign: 'eye', hurt: 'eye',
    say: ['Something in my eye!', 'Có gì bay vào mắt tớ!'], remind: ['Something in my eye!', 'Mắt tớ cộm quá!'],
    steps: [{ type: 'touch', target: 'eye' }, { type: 'treat', item: 'drops' }],
  },
  {
    id: 'bump', level: 2, sign: 'bump', hurt: 'head',
    say: ['Ouch! I bumped my head!', 'Ui da! Tớ bị cộc đầu!'], remind: ['My head hurts!', 'Đầu tớ đau cơ!'],
    steps: [{ type: 'touch', target: 'head' }, { type: 'treat', item: 'icepack' }],
  },
  {
    id: 'sleepy', level: 2, sign: 'sleepy', hurt: null, face: 'sleepy',
    say: ["I'm so sleepy…", 'Tớ buồn ngủ quá…'], remind: ["I'm so sleepy…", 'Tớ buồn ngủ quá…'],
    steps: [{ type: 'treat', item: 'blanket' }],
  },
  {
    id: 'fever', level: 3, sign: 'fever', hurt: 'head',
    say: ['I feel hot. My head hurts.', 'Tớ thấy nóng. Đầu tớ đau.'], remind: ['My head hurts!', 'Đầu tớ đau cơ!'],
    steps: [{ type: 'touch', target: 'head' }, { type: 'check', item: 'thermometer', from: 2 }, { type: 'treat', item: 'icepack' }],
  },
  {
    id: 'cough', level: 3, sign: 'cough', hurt: null,
    say: ['Cough! Cough!', 'Khụ! Khụ!'], remind: ['Cough! Cough!', 'Khụ! Khụ!'],
    steps: [{ type: 'check', item: 'stethoscope', from: 2 }, { type: 'treat', item: 'water' }],
  },
];
export const CASE_BY_ID = new Map(CASES.map((c) => [c.id, c]));

/** Các bước của một ca ở một mức (chỉ bước có `from` ≤ mức). */
export const stepsFor = (c, level) => c.steps.filter((s) => (s.from ?? 1) <= level);
/** Ca có ở mức này (gồm cả ca của mức thấp hơn). */
export const casesFor = (level) => CASES.filter((c) => c.level <= level);
/** Đồ chữa cuối của ca (để tránh hai ca cùng đồ chữa trong một lượt). */
const lastItem = (c, level) => stepsFor(c, level).at(-1)?.item ?? null;

// ---------- Ngẫu nhiên ----------
const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Khay của một bước (mục 7.1): đúng một đồ đúng + đồ gây nhiễu cùng loại (dụng cụ khám / đồ chữa), không trùng, xáo vị trí.
 * @returns {string[]} mã đồ
 */
export function trayFor(step, level, { rng = Math.random } = {}) {
  const pool = step.type === 'check' ? TOOLS : TREATS;
  const size = Math.min(TRAY_SIZE[level]?.[step.type] ?? 2, pool.length);
  const others = shuffle(pool.filter((t) => t.id !== step.item), rng).slice(0, size - 1);
  return shuffle([ITEM_BY_ID.get(step.item), ...others], rng).map((t) => t.id);
}

/**
 * 3 ca của một lượt (mục 7.2), luôn trả về kết quả:
 * 1. 3 ca khác nhau trong nhóm của mức (bắt buộc);
 * 2. tối đa 2 ca bé ít gặp nhất (`seen`: mã ca → số lần khỏi), còn lại ngẫu nhiên;
 * 3. nên: không có hai ca cùng đồ chữa cuối — thử tối đa 20 bộ, không đạt thì dùng bộ cuối.
 * Mỗi ca một bạn thú khác nhau.
 * @returns {Array<{ id: string, patient: string }>}
 */
export function pickCases(level, { seen = {}, rng = Math.random, pool = casesFor(level), n = CASES_PER_ROUND } = {}) {
  const count = (c) => (Number.isInteger(seen?.[c.id]) ? seen[c.id] : 0);
  let pick = [];
  for (let i = 0; i < PICK_TRIES; i++) {
    const bySeen = shuffle(pool, rng).sort((a, b) => count(a) - count(b));
    const least = bySeen.slice(0, Math.min(LEAST_SEEN_PER_ROUND, n));
    const rest = shuffle(bySeen.slice(least.length), rng).slice(0, n - least.length);
    pick = shuffle([...least, ...rest], rng);
    const items = pick.map((c) => lastItem(c, level));
    if (new Set(items).size === items.length) break;
  }
  const patients = shuffle(PATIENTS, rng);
  return pick.map((c, i) => ({ id: c.id, patient: patients[i % patients.length].id }));
}

// ---------- Câu nói (mục 6.4): mỗi câu [tiếng Anh, tiếng Việt] ----------
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const COME_IN_LINE = ['Hello! Come in!', 'Chào bạn! Mời bạn vào!'];
export const HELLO_DOCTOR_LINE = ['Hello, doctor!', 'Chào bác sĩ!'];
export const WHERE_LINE = ['Where does it hurt? Touch it!', 'Bạn đau ở đâu? Con chạm vào nhé!'];
export const HOW_HELP_LINE = ['How can we help?', 'Mình giúp bạn thế nào nhỉ?'];
export const BETTER_LINE = ['I feel better! Thank you, doctor!', 'Tớ khỏe rồi! Cảm ơn bác sĩ!'];
export const GREAT_LINE = ['I feel great! Thank you, doctor!', 'Tớ khỏe lắm rồi! Cảm ơn bác sĩ!'];
export const GOOD_JOB_LINE = ['Great job, doctor!', 'Bác sĩ giỏi quá!'];
export const BYE_LINE = ['Bye-bye!', 'Tạm biệt!'];
export const ALL_BETTER_LINE = ["All better! You're a great doctor!", 'Các bạn khỏe hết rồi! Con là bác sĩ giỏi!'];

/** Chạm đúng chỗ đau: "Yes! My tummy." */
export const yesTouchLine = (c) => {
  const word = c.hurt ?? stepsFor(c, 3).find((s) => s.type === 'touch')?.target;
  const vi = word === 'tooth' ? 'cái răng' : REGIONS[word]?.vi ?? word;
  return [`Yes! My ${word}.`, `Đúng rồi! ${capital(vi)} của tớ.`];
};
/** Chạm nhầm chỗ: "That's my nose! My tummy hurts!" */
export const wrongTouchLine = (region, c) => [`That's my ${REGIONS[region].word}! ${c.remind[0]}`, `Đó là ${REGIONS[region].vi} của tớ! ${c.remind[1]}`];
/** Bước khám: Bông gọi tên dụng cụ. */
export const checkLine = (item) => [`Let's check! Use ${ITEM_BY_ID.get(item).the}.`, `Mình khám nào! Dùng ${ITEM_BY_ID.get(item).vi} nhé.`];
/** Bước chữa mức 1: bạn thú xin đồ có tên ("A bandage, please!"). */
export const askLine = (item) => [`${capital(ITEM_BY_ID.get(item).ask)}, please!`, `Cho tớ ${ITEM_BY_ID.get(item).vi} nhé!`];
/** Câu xin của bước chữa / khám: mức 1 có tên đồ; mức 2+ Bông hỏi "How can we help?" (bước khám luôn có tên). */
export const stepPrompt = (step, level) => {
  if (step.type === 'touch') return { who: 'bong', line: WHERE_LINE };
  if (step.type === 'check') return { who: 'bong', line: checkLine(step.item) };
  return level <= 1 ? { who: 'patient', line: askLine(step.item) } : { who: 'bong', line: HOW_HELP_LINE };
};

/**
 * Câu khi đưa nhầm đồ (mục 4.3). Bước có tên (khám mọi mức, chữa mức 1): "Hmm, that's the toothbrush. I need a bandage!"
 * (bước khám: "… Use the flashlight!"), đồ đúng nhún ngay. Chữa mức 2+: lần 1 "Hmm, not the toothbrush.", từ lần 2 nói tên đồ cần.
 * @returns {{ line: [string, string], hint: boolean }}
 */
export function wrongItemLine(given, step, level, wrongs) {
  const g = ITEM_BY_ID.get(given);
  const need = ITEM_BY_ID.get(step.item);
  const named = step.type === 'check' || level <= 1;
  const needEn = step.type === 'check' ? `Use ${need.the}!` : `I need ${need.ask}!`;
  const needVi = step.type === 'check' ? `Dùng ${need.vi} cơ!` : `Tớ cần ${need.vi} cơ!`;
  if (named) return { line: [`Hmm, ${g.wrong}. ${needEn}`, `Ừm, đó là ${g.vi}. ${needVi}`], hint: true };
  if (wrongs <= 1) return { line: [`Hmm, ${g.notThis}.`, `Ừm, không phải ${g.vi}.`], hint: false };
  return { line: [needEn, needVi], hint: true };
}

/** Câu khi đưa đúng đồ (mục 6.4): ai nói + câu. */
export const DONE_LINES = {
  bandage: { who: 'patient', line: ['A bandage! Thank you!', 'Miếng băng dán! Cảm ơn bác sĩ!'] },
  medicine: { who: 'bong', line: ["Here's your medicine.", 'Thuốc của bạn đây.'] },
  tissue: { who: 'bong', line: ['Blow!', 'Hỉ mũi nào!'] },
  toothbrush: { who: 'bong', line: ['Brush, brush!', 'Đánh răng nào!'] },
  drops: { who: 'patient', line: ['Blink, blink!', 'Chớp chớp!'] },
  icepack: { who: 'patient', line: ['Nice and cool!', 'Mát quá!'] },
  water: { who: 'patient', line: ['Mmm, warm water.', 'Ừm, nước ấm.'] },
  blanket: { who: 'bong', line: ['Time to rest.', 'Nghỉ một chút nhé.'] },
  stethoscope: { who: 'bong', line: ['Listen! Thump, thump.', 'Nghe này! Thình thịch.'] },
  thermometer: { who: 'bong', line: ['You feel warm!', 'Bạn hơi nóng!'] },
  flashlight: { who: 'bong', line: ['Open wide! Say aah!', 'Há miệng ra! Nói "a" nào!'] },
};
/** Câu khám riêng theo ca (ca ho nghe "Breathe in…", ca tai soi thấy bọ). */
export const doneLine = (c, step) => {
  if (step.item === 'stethoscope' && c.id === 'cough') return { who: 'bong', line: ['Breathe in… breathe out.', 'Hít vào… thở ra.'] };
  if (step.effect === 'bug') return { who: 'bong', line: ['Let me look… A little bug! Bye-bye, bug!', 'Để mình xem… Một chú bọ nhỏ! Tạm biệt bọ nhé!'] };
  return DONE_LINES[step.item];
};
export const betterLine = (c) => (c.face === 'sleepy' ? GREAT_LINE : BETTER_LINE);

// ---------- Mức, tiến độ (mục 7.3) ----------
export function cleanDoctorState(saved, { maxLevel = PLAYABLE_LEVEL } = {}) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const ok = (n) => Number.isInteger(n) && n >= 1 && n <= maxLevel;
  const lock = ok(s.lock) ? s.lock : null;
  const seen = {};
  if (s.seen && typeof s.seen === 'object') {
    for (const [id, n] of Object.entries(s.seen)) if ((CASE_BY_ID.has(id) || NEW_CASE_IDS.includes(id)) && Number.isInteger(n) && n > 0) seen[id] = n;
  }
  return {
    level: lock ?? (ok(s.level) ? s.level : 1),
    rounds: Number.isInteger(s.rounds) && s.rounds >= 0 ? s.rounds : 0,
    lock,
    seen,
  };
}

/** Xong một lượt (3 ca): đủ 3 lượt ở mức hiện tại thì lên một mức (tới mức chơi được cao nhất). Khóa mức: không đếm. */
export function afterDoctorRound(state, { maxLevel = PLAYABLE_LEVEL } = {}) {
  if (state.lock) return { ...state, level: state.lock, rounds: 0 };
  const rounds = state.rounds + 1;
  if (state.level < maxLevel && rounds >= ROUNDS_TO_LEVEL_UP) return { ...state, level: state.level + 1, rounds: 0 };
  return { ...state, rounds };
}

/** Một ca vừa khỏi: `seen` của ca +1. */
export const afterHealed = (state, caseId) => ({ ...state, seen: { ...state.seen, [caseId]: (state.seen[caseId] ?? 0) + 1 } });

// ---------- SPEC-doctor2 DR1: rửa tay đầu lượt, tặng sticker cho bạn thú sau mỗi ca ----------
const shuffleList = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Đồ rửa tay (mục 3): mỗi món một câu khi dùng. Găng chỉ từ mức 2. */
export const WASH_ITEMS = [
  { id: 'soap', emoji: '🧼', name: 'soap', vi: 'xà phòng', line: ['Rub, rub, rub!', 'Xoa, xoa, xoa!'] },
  // Mã 'rinse' (không phải 'water'): 'water' là nước ấm của ca ho.
  { id: 'rinse', emoji: '💧', name: 'water', vi: 'nước', line: ['Rinse!', 'Xả nước nào!'] },
  { id: 'towel', emoji: '', name: 'towel', vi: 'khăn', line: ['Dry your hands!', 'Lau khô tay nào!'] },
  { id: 'gloves', emoji: '🧤', name: 'gloves', vi: 'găng tay', line: ['Gloves on! Ready!', 'Đeo găng rồi! Sẵn sàng!'] },
];
export const WASH_BY = new Map(WASH_ITEMS.map((x) => [x.id, x]));
/** Các món rửa tay của mức, theo thứ tự đúng (mức 1 dùng thứ tự nào cũng được). */
export const washFor = (level) => (level >= 2 ? ['soap', 'rinse', 'towel', 'gloves'] : ['soap', 'rinse', 'towel']);
/** Món cần dùng tiếp theo (mức 2–3); mức 1 → null (món nào cũng được). */
export const nextWash = (level, washed) => (level >= 2 ? washFor(level).find((id) => !washed.includes(id)) ?? null : null);
export const WASH_START_LINE = ["Doctors wash their hands! Let's wash!", 'Bác sĩ rửa tay trước nhé! Mình rửa tay nào!'];
export const WASH_DONE_LINE = ["Clean hands! Let's help our friends!", 'Tay sạch rồi! Mình giúp các bạn nào!'];
/** Mức 2–3 dùng sai thứ tự: "Soap first!" */
export const washFirstLine = (want) => [`${capital(WASH_BY.get(want).name)} first!`, `${capital(WASH_BY.get(want).vi)} trước nhé!`];

/** Sticker tặng bạn thú (mục 4): hình × màu. */
export const STICKER_SHAPES = [
  { id: 'star', vi: 'ngôi sao' }, { id: 'heart', vi: 'trái tim' }, { id: 'circle', vi: 'hình tròn' }, { id: 'square', vi: 'hình vuông' },
];
export const STICKER_COLORS = [
  { id: 'red', vi: 'đỏ', hex: '#fa5252' }, { id: 'blue', vi: 'xanh dương', hex: '#339af0' },
  { id: 'yellow', vi: 'vàng', hex: '#fcc419' }, { id: 'green', vi: 'xanh lá', hex: '#51cf66' },
];
const SHAPE_VI = new Map(STICKER_SHAPES.map((x) => [x.id, x.vi]));
const COLOR_VI = new Map(STICKER_COLORS.map((x) => [x.id, x.vi]));
export const stickerId = (st) => `st-${st.color}-${st.shape}`;
/** Sticker có khớp yêu cầu không (một hàm cho mọi mức): `want` rỗng = cái nào cũng đúng. */
export const matchesSticker = (st, want) => !want || ((!want.color || st.color === want.color) && (!want.shape || st.shape === want.shape));

/**
 * Bộ sticker + yêu cầu của một ca (sinh sẵn lúc lập kế hoạch lượt):
 * - mức 1: 3 sticker khác nhau, không yêu cầu;
 * - mức 2: 3 sticker khác màu, yêu cầu theo màu;
 * - mức 3: 4 sticker, yêu cầu màu + hình; đúng một cái khớp cả hai, có một cái cùng màu khác hình và một cái cùng hình khác màu.
 */
export function planSticker(level, { rng = Math.random } = {}) {
  const colors = shuffleList(STICKER_COLORS.map((x) => x.id), rng);
  const shapes = shuffleList(STICKER_SHAPES.map((x) => x.id), rng);
  if (level >= 3) {
    const [c, c2, c3] = colors;
    const [sh, s2, s3] = shapes;
    const set = [{ color: c, shape: sh }, { color: c, shape: s2 }, { color: c2, shape: sh }, { color: c3, shape: s3 }];
    return { set: shuffleList(set, rng), want: { color: c, shape: sh } };
  }
  if (level === 2) {
    const set = colors.slice(0, 3).map((color) => ({ color, shape: shapes[Math.floor(rng() * shapes.length)] }));
    return { set, want: { color: set[Math.floor(rng() * set.length)].color } };
  }
  return { set: colors.slice(0, 3).map((color, i) => ({ color, shape: shapes[i] })), want: null };
}

const stickerName = (st) => `${st.color} ${st.shape}`;
const stickerNameVi = (st) => `${SHAPE_VI.get(st.shape)} ${COLOR_VI.get(st.color)}`;
export const STICKER_ASK_LINE = ['Can I have a sticker, please?', 'Cho tớ một nhãn dán được không?'];
/** Yêu cầu (mức 2: "A blue one, please!"; mức 3: "A yellow star, please!"). */
export const stickerWantLine = (want) => (want.shape
  ? [`A ${want.color} ${want.shape}, please!`, `Cho tớ ${SHAPE_VI.get(want.shape)} ${COLOR_VI.get(want.color)} nhé!`]
  : [`A ${want.color} one, please!`, `Cho tớ cái màu ${COLOR_VI.get(want.color)} nhé!`]);
/** Đúng — nói theo chính sticker bé chọn: "A blue star! I love it!" */
export const stickerLoveLine = (st) => [`A ${stickerName(st)}! I love it!`, `${capital(stickerNameVi(st))}! Tớ thích lắm!`];
/** Nhầm — tên sticker vừa chạm + nhắc yêu cầu: "That's a green heart. A blue one, please!" */
export const stickerWrongLine = (st, want) => {
  const [en, vi] = stickerWantLine(want);
  return [`That's a ${stickerName(st)}. ${en}`, `Đó là ${stickerNameVi(st)}. ${vi}`];
};

// ---------- SPEC-doctor2 DR2: ca Đo chiều cao (thay 1 ca bệnh) ----------
/** Mã ca kiểu mới (không có trong CASES — không có bước chạm / khám / chữa). */
export const NEW_CASE_IDS = ['checkup', 'eyes'];
const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];
const NUM_VI = ['không', 'một', 'hai', 'ba', 'bốn', 'năm'];
const between = (lo, hi, rng) => lo + Math.floor(rng() * (hi - lo + 1));

/**
 * Ca đo chiều cao (sinh sẵn): mức 1: một bạn 1–3 khối; mức 2: một bạn 2–5 khối + 3 thẻ số (đúng một thẻ);
 * mức 3: hai bạn, chiều cao khác nhau trong 2–5 ("Who is taller?").
 */
export function planCheckup(level, patients, { rng = Math.random } = {}) {
  if (level >= 3) {
    const a = between(2, 5, rng);
    let b = between(2, 4, rng);
    if (b >= a) b += 1;
    return { id: 'checkup', patient: patients[0], patient2: patients[1], heights: [a, b] };
  }
  const n = level <= 1 ? between(1, 3, rng) : between(2, 5, rng);
  const c = { id: 'checkup', patient: patients[0], heights: [n] };
  if (level === 2) {
    const others = shuffleList([1, 2, 3, 4, 5].filter((x) => x !== n), rng).slice(0, 2);
    c.choices = shuffleList([n, ...others], rng);
  }
  return c;
}

/**
 * Kế hoạch một lượt (SPEC-doctor2 mục 2): 2 ca bệnh (chọn như cũ, ưu tiên ít gặp) + 1 ca mới ở vị trí ngẫu nhiên
 * (mức 1: đo chiều cao; mức 2–3: đo chiều cao hoặc khám mắt — loại ít gặp hơn, `eyeWords`: từ bé đã học cho bảng hình);
 * mỗi ca có bộ sticker sinh sẵn; bạn thú khác nhau (ca đo mức 3 có hai bạn).
 */
export function planDoctorRound(level, { seen = {}, rng = Math.random, eyeWords = [] } = {}) {
  const ill = pickCases(level, { seen, rng, n: CASES_PER_ROUND - 1 });
  const used = new Set(ill.map((c) => c.patient));
  const free = shuffleList(PATIENTS.map((p) => p.id).filter((id) => !used.has(id)), rng);
  const extra = level >= 2 && pickNewCase(seen, rng) === 'eyes' ? planEyes(level, free[0], { words: eyeWords, rng }) : planCheckup(level, free, { rng });
  const cases = [...ill];
  // Chỉ test UI đặt `window.__kidTest.doctorNewAt` để cố định chỗ ca mới; bình thường ngẫu nhiên.
  const pinned = globalThis.__kidTest?.doctorNewAt;
  cases.splice(Number.isInteger(pinned) ? pinned : Math.floor(rng() * (cases.length + 1)), 0, extra);
  return cases.map((c) => ({ ...c, sticker: planSticker(level, { rng }) }));
}

const blocks = (n) => (n === 1 ? 'block' : 'blocks');
export const CHECKUP_HELLO_LINE = ['Hello, doctor! Am I growing?', 'Chào bác sĩ! Tớ có cao lên không?'];
export const MEASURE_LINE = ["Let's measure! Count the blocks!", 'Mình đo nào! Đếm các khối nhé!'];
export const FROM_BOTTOM_LINE = ['From the bottom! One…', 'Đếm từ dưới lên nhé! Một…'];
export const GROWING_LINE = ["I'm growing!", 'Tớ cao lên rồi!'];
export const HOW_MANY_BLOCKS_LINE = ['How many blocks?', 'Mấy khối nhỉ?'];
export const TALLER_Q_LINE = ['Who is taller?', 'Bạn nào cao hơn?'];
/** Đếm khối: "One!" */
export const blockCountLine = (n) => [`${capital(NUM_WORDS[n])}!`, `${capital(NUM_VI[n])}!`];
/** "You're three blocks tall!" / "You're one block tall!" */
export const tallLine = (n) => [`You're ${NUM_WORDS[n]} ${blocks(n)} tall!`, `Bạn cao ${NUM_VI[n]} khối!`];
/** Mức 2 đúng: "Yes! Three blocks!" */
export const rightBlocksLine = (n) => [`Yes! ${capital(NUM_WORDS[n])} ${blocks(n)}!`, `Đúng rồi! ${capital(NUM_VI[n])} khối!`];
/** Mức 2 nhầm: "That's four. Let's count again!" */
export const wrongBlocksLine = (x) => [`That's ${NUM_WORDS[x]}. Let's count again!`, `Đó là số ${NUM_VI[x]}. Mình đếm lại nhé!`];
/** Mức 3: "Teddy is taller! Kitty is shorter!" (tên theo dữ liệu thật). */
export const tallerLine = (tall, short) => [`${tall} is taller! ${short} is shorter!`, `${tall} cao hơn! ${short} thấp hơn!`];
/** Mức 3 nhầm: "That's Kitty. Kitty is shorter. Who is taller?" */
export const wrongTallerLine = (name) => [`That's ${name}. ${name} is shorter. Who is taller?`, `Đó là ${name}. ${name} thấp hơn. Bạn nào cao hơn?`];

// ---------- SPEC-art ART1: hình rửa tay (ảnh lưới 6 ô bố mẹ thêm, chưa có thì hình vẽ sẵn) ----------
export const WASH_IMAGES = 'doctor:wash';
/** 6 ô của ảnh lưới rửa tay, theo thứ tự ô (trái → phải, trên → dưới). */
export const WASH_FRAMES = ['dirty', 'soapy', 'rinse', 'clean', 'gloves', 'ready'];
export const WASH_FRAME_VI = { dirty: 'tay bẩn', soapy: 'tay đầy bọt', rinse: 'tay dưới vòi nước', clean: 'tay sạch, lấp lánh', gloves: 'tay đeo găng', ready: 'tay đeo găng giơ ngón cái' };
export const WASH_GRID_PROMPT = [
  'A 3x2 grid of EXACTLY six square pictures (3 columns, 2 rows — not 4 columns, no repeated pictures) on a plain white background, separated by thin white gaps.',
  'All six pictures show the SAME pair of small child hands from the front, same size and same position, above the SAME white sink with a tap:',
  '1) hands with a few small mud spots;',
  '2) hands covered in white soap foam;',
  '3) hands under running water from the tap, foam washing away;',
  '4) clean dry hands with small sparkles;',
  '5) hands wearing light-blue medical gloves;',
  '6) gloved hands giving a thumbs-up.',
  'Soft cartoon style for a toddler game, thick soft outlines, pastel colours, no text, no faces.',
].join('\n');
const WASH_FRAME_OF = { soap: 'soapy', rinse: 'rinse', towel: 'clean', gloves: 'gloves' };
/**
 * Hình rửa tay theo món VỪA dùng (mức 1 dùng thứ tự tùy ý — hình luôn khớp việc bé vừa làm);
 * dùng đủ món: mức 2–3 → 'ready' (đeo găng, ngón cái), mức 1 → 'clean'.
 */
export function washFrame(washed, level) {
  if (washFor(level).every((id) => washed.includes(id))) return level >= 2 ? 'ready' : 'clean';
  return WASH_FRAME_OF[washed[washed.length - 1]] ?? 'dirty';
}

// ---------- SPEC-doctor2 DR3: ca Khám mắt bằng bảng hình ----------
/** Bộ hình mặc định (máy mới / chưa học đủ từ). */
export const DEFAULT_EYE_WORDS = [
  { en: 'cat', emoji: '🐱' }, { en: 'dog', emoji: '🐶' }, { en: 'fish', emoji: '🐟' },
  { en: 'apple', emoji: '🍎' }, { en: 'ball', emoji: '⚽' }, { en: 'car', emoji: '🚗' },
];
export const EYE_ASKS = 3;
/** Từ dùng được trên bảng hình: một từ, chỉ chữ cái, không phải số nhiều (câu "Point to the fish!"). */
export const eyeWordOk = (en) => /^[a-z]+$/i.test(String(en ?? '')) && !/[^s]s$/i.test(en) && en.length >= 2;

/** Ca mới ở mức 2–3: đo chiều cao hay khám mắt — loại bé ít gặp hơn (`seen`), bằng nhau thì ngẫu nhiên. */
export function pickNewCase(seen = {}, rng = Math.random) {
  const a = seen.checkup ?? 0;
  const b = seen.eyes ?? 0;
  if (a !== b) return a < b ? 'checkup' : 'eyes';
  return rng() < 0.5 ? 'checkup' : 'eyes';
}

/**
 * Ca khám mắt (sinh sẵn): bảng 3 hình (mức 2) / 4 hình (mức 3) từ `words` (từ bé đã học, có emoji), thiếu thì bù bằng bộ
 * mặc định; không lặp từ; 3 câu hỏi là 3 hình khác nhau đều có trên bảng.
 */
export function planEyes(level, patient, { words = [], rng = Math.random } = {}) {
  const n = level >= 3 ? 4 : 3;
  const seenEn = new Set();
  const pool = [];
  for (const w of [...shuffleList(words.filter((w) => eyeWordOk(w.en) && w.emoji), rng), ...shuffleList(DEFAULT_EYE_WORDS, rng)]) {
    const en = String(w.en).toLowerCase();
    if (seenEn.has(en)) continue;
    seenEn.add(en);
    pool.push({ en, emoji: w.emoji });
    if (pool.length >= n) break;
  }
  return { id: 'eyes', patient, chart: pool, asks: shuffleList(pool, rng).slice(0, EYE_ASKS).map((w) => w.en) };
}

export const EYES_HELLO_LINE = ['Hello, doctor! Can you check my eyes?', 'Chào bác sĩ! Bác sĩ khám mắt cho tớ nhé?'];
export const COVER_LINE = ['Cover one eye!', 'Che một mắt lại nào!'];
export const GLASSES_ITEM = { id: 'glasses', emoji: '👓', name: 'glasses' };
export const SEE_BETTER_LINE = ['Wow! Now I can see better!', 'Ồ! Giờ tớ nhìn rõ hơn rồi!'];
/** "Point to the fish!" */
export const pointLine = (w) => [`Point to the ${w}!`, `Con chỉ vào "${w}" nhé!`];
/** Bạn thú: "I see the fish!" */
export const seeLine = (w) => [`I see the ${w}!`, `Tớ thấy "${w}" rồi!`];
/** Nhầm: "That's the cat. Where's the fish?" */
export const wrongEyeLine = (x, w) => [`That's the ${x}. Where's the ${w}?`, `Đó là "${x}". "${w}" đâu nhỉ?`];
/** Chỉ nói về bạn thú này: "Teddy needs glasses!" */
export const needGlassesLine = (name) => [`${name} needs glasses!`, `${name} cần đeo kính!`];
