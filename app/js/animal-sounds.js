// Trò Ai kêu thế? (SPEC-sounds.md): nghe tiếng kêu ("Moo! Moo!" / tiếng còi tàu), Bông hỏi "Who says moo?" /
// "What goes choo choo?", bé chạm đúng con vật / đồ vật trong 4 hình.
// Tiếng thật: file ghi âm CC0 / public domain trong app/sounds/ (SOUND_FILES); thiếu file thì Bông đọc tiếng kêu bằng giọng máy.
// Con vật / đồ vật dùng lại sticker của Dán tranh khi có (cùng mã, cùng ảnh bố mẹ đã thay), không thì emoji.

import { ITEM_BY_ID } from './sticker-scenes.js';

export const QUESTIONS_PER_ROUND = 5;
export const ROUNDS_TO_LEVEL_UP = 3;
/** Luôn 4 hình để chọn (2 hình quá dễ đoán). */
export const CHOICES = 4;
export const KINDS = ['animals', 'things', 'mix'];
/** Mức: nhóm được hỏi (quen trước) theo kiểu. Nhóm của mức cao gồm cả nhóm của mức thấp hơn. Trộn = cả hai nhóm. */
export const LEVELS = {
  1: { animals: 6, things: 6 },
  2: { animals: 10, things: 9 },
  3: { animals: 15, things: 11 },
};

/**
 * Ảnh / tiếng bố mẹ thêm (Góc bố mẹ → Ảnh & tiếng Ai kêu thế?), lưu trong kho ảnh theo mã thứ:
 * - SOUNDS_IMAGES: ảnh cho thứ KHÔNG có sticker Dán tranh (bát đĩa, điện thoại); thứ có sticker thì thay ở Ảnh Dán tranh;
 * - SOUNDS_AUDIO: tiếng thay cho bất kỳ thứ nào (ghi âm / chọn file) — ưu tiên hơn file có sẵn.
 */
export const SOUNDS_IMAGES = 'sounds:images';
export const SOUNDS_AUDIO = 'sounds:audio';
/** Tiếng bố mẹ thêm: tối đa chừng này giây được phát / ghi âm; file quá chừng này MB thì không nhận. */
export const MAX_SOUND_SECONDS = 5;
export const MAX_SOUND_MB = 3;

/** File tiếng thật đã có trong app/sounds/<id>.mp3 (nguồn + giấy phép: app/sounds/CREDITS.md). */
export const SOUND_FILES = new Set([
  'cow', 'dog', 'cat', 'duck', 'pig', 'sheep', 'chicken', 'horse', 'bird', 'lion', 'frog', 'monkey', 'owl', 'bee', 'snake', 'car', 'train', 'phone', 'clock', 'drum', 'dishes', 'plane', 'fire-truck', 'bicycle', 'helicopter', 'motorbike',
]);
export const soundUrl = (id) => (SOUND_FILES.has(id) ? `sounds/${id}.mp3` : null);

/**
 * Con vật theo thứ tự quen → lạ. `says`: tiếng kêu (trong câu hỏi), `sound`: Bông giả tiếng kêu khi không có file,
 * `vi`: tên tiếng Việt (có "con").
 */
const RAW_ANIMALS = [
  ['cow', 'con bò', 'moo', 'Moo! Moo!'],
  ['dog', 'con chó', 'woof', 'Woof! Woof!'],
  ['cat', 'con mèo', 'meow', 'Meow! Meow!'],
  ['duck', 'con vịt', 'quack', 'Quack! Quack!'],
  ['pig', 'con lợn', 'oink', 'Oink! Oink!'],
  ['sheep', 'con cừu', 'baa', 'Baa! Baa!'],
  ['chicken', 'con gà', 'cluck', 'Cluck! Cluck!'],
  ['horse', 'con ngựa', 'neigh', 'Neigh!'],
  ['bird', 'con chim', 'tweet', 'Tweet! Tweet!'],
  ['lion', 'con sư tử', 'roar', 'Roar!'],
  ['frog', 'con ếch', 'ribbit', 'Ribbit! Ribbit!'],
  ['monkey', 'con khỉ', 'ooh ooh', 'Ooh ooh! Aah aah!'],
  ['owl', 'con cú', 'hoot', 'Hoot! Hoot!'],
  ['bee', 'con ong', 'buzz', 'Buzz! Buzz!'],
  ['snake', 'con rắn', 'hiss', 'Hiss!'],
];
/** Đồ vật theo thứ tự quen → lạ. `plural`: danh từ số nhiều ("The dishes go clink clink!"). */
const RAW_THINGS = [
  ['car', 'ô tô', 'beep beep', 'Beep beep!'],
  ['train', 'tàu hỏa', 'choo choo', 'Choo choo!'],
  ['phone', 'điện thoại', 'ring ring', 'Ring ring!', '☎️'],
  ['clock', 'đồng hồ', 'tick tock', 'Tick tock! Tick tock!'],
  ['drum', 'cái trống', 'boom boom', 'Boom! Boom!'],
  ['dishes', 'bát đĩa', 'clink clink', 'Clink! Clink!', '🍽️', true],
  ['plane', 'máy bay', 'zoom', 'Zoooom!'],
  ['fire-truck', 'xe cứu hỏa', 'nee naw', 'Nee naw! Nee naw!'],
  ['bicycle', 'xe đạp', 'ding ding', 'Ding ding!'],
  ['helicopter', 'trực thăng', 'chop chop', 'Chop chop chop!'],
  ['motorbike', 'xe máy', 'vroom', 'Vroom! Vroom!'],
];

/** Tên + emoji theo sticker Dán tranh (cùng mã → cùng ảnh); đồ không có sticker thì dùng tên / emoji riêng. */
function fromSticker(id, emoji) {
  const item = ITEM_BY_ID.get(id);
  return { name: item?.name ?? id.replace(/-/g, ' '), emoji: item?.emoji ?? emoji };
}
export const ANIMALS = RAW_ANIMALS.map(([id, vi, says, sound]) => ({ id, kind: 'animals', ...fromSticker(id), vi, says, sound, plural: false }));
export const THINGS = RAW_THINGS.map(([id, vi, says, sound, emoji, plural = false]) => ({ id, kind: 'things', ...fromSticker(id, emoji), vi, says, sound, plural }));
export const ALL_SOUNDS = [...ANIMALS, ...THINGS];
export const SOUND_BY_ID = new Map(ALL_SOUNDS.map((a) => [a.id, a]));
/** Thứ có sticker Dán tranh (ảnh thay ở Ảnh Dán tranh) hay không (ảnh thay ở trang Ai kêu thế?). */
export const hasSticker = (a) => ITEM_BY_ID.has(a.id);
/** Tên cũ (0.26): vẫn dùng được. */
export const ANIMAL_BY_ID = SOUND_BY_ID;

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const isAnimal = (a) => a.kind === 'animals';
const goes = (a) => (a.plural ? 'go' : 'goes');

// ---------- Câu nói ----------
export const INTRO_LINES = {
  animals: ['Listen! Who says that?', 'Nghe này! Con gì kêu thế nhỉ?'],
  things: ['Listen! What makes that sound?', 'Nghe này! Cái gì kêu thế nhỉ?'],
  mix: ['Listen! What makes that sound?', 'Nghe này! Cái gì kêu thế nhỉ?'],
};
export const INTRO_LINE = INTRO_LINES.animals;
/** Phụ đề không nói tên (không lộ đáp án). */
export const soundLine = (a) => [a.sound, '(Tiếng kêu)'];
export const whoLine = (a) => (isAnimal(a)
  ? [`Who says ${a.says}?`, `Con gì kêu "${a.says}" nhỉ?`]
  : [`What goes ${a.says}?`, `Cái gì kêu "${a.says}" nhỉ?`]);
export const yesLine = (a) => (isAnimal(a)
  ? [`Yes! The ${a.name} says ${a.says}!`, `Đúng rồi! ${capital(a.vi)} kêu "${a.says}"!`]
  : [`Yes! The ${a.name} ${goes(a)} ${a.says}!`, `Đúng rồi! ${capital(a.vi)} kêu "${a.says}"!`]);
export const yourTurnLine = (a) => [`Can you say ${a.says}?`, `Con kêu "${a.says}" thử xem!`];
export const wrongLine = (a) => (isAnimal(a)
  ? [`That's the ${a.name}! The ${a.name} says ${a.says}!`, `Đó là ${a.vi}! ${capital(a.vi)} kêu "${a.says}"!`]
  : [`${a.plural ? 'Those are' : "That's"} the ${a.name}! The ${a.name} ${goes(a)} ${a.says}!`, `Đó là ${a.vi}! ${capital(a.vi)} kêu "${a.says}"!`]);
/** Nhầm từ lần 3 trong cùng câu: câu ngắn, không đọc lại cả tràng. */
export const shortWrongLine = (a) => [`${a.plural ? 'Those are' : "That's"} the ${a.name}!`, `Đó là ${a.vi}!`];
export const nameLine = (a) => [`The ${a.name}!`, capital(a.vi)];

// ---------- Câu hỏi ----------
/** Trong 5 câu, tối đa chừng này câu là thứ bé ít gặp nhất; còn lại chọn ngẫu nhiên (không dồn hết vào thứ lạ). */
export const LEAST_SEEN_PER_ROUND = 3;

/** Nhóm được hỏi của một kiểu ở một mức (gồm cả nhóm của mức thấp hơn). */
export function groupFor(kind, level) {
  const sizes = LEVELS[level] ?? LEVELS[1];
  if (kind === 'things') return THINGS.slice(0, sizes.things);
  if (kind === 'mix') return [...ANIMALS.slice(0, sizes.animals), ...THINGS.slice(0, sizes.things)];
  return ANIMALS.slice(0, sizes.animals);
}

/**
 * Câu hỏi của một lượt: `n` đáp án khác nhau trong nhóm của kiểu + mức.
 * - Tối đa LEAST_SEEN_PER_ROUND thứ bé ít gặp nhất (`seen`: tên → số lần, bằng nhau thì ngẫu nhiên), còn lại ngẫu nhiên.
 * - Thứ tự câu xáo trộn. Mỗi câu: đáp án + 3 thứ khác trong nhóm, không trùng nhau, xáo vị trí thẻ (luôn 4 hình).
 * @returns {Array<{ answer: string, choices: string[] }>}
 */
export function roundQuestions(level, { kind = 'animals', seen = new Map(), rng = Math.random, n = QUESTIONS_PER_ROUND } = {}) {
  const group = groupFor(kind, level);
  const bySeen = shuffle(group, rng).sort((a, b) => (seen.get(a.name) ?? 0) - (seen.get(b.name) ?? 0));
  const least = bySeen.slice(0, Math.min(LEAST_SEEN_PER_ROUND, n));
  const rest = shuffle(bySeen.slice(least.length), rng).slice(0, n - least.length);
  const answers = shuffle([...least, ...rest], rng);
  return answers.map((a) => ({
    answer: a.id,
    choices: shuffle([a, ...shuffle(group.filter((x) => x.id !== a.id), rng).slice(0, CHOICES - 1)], rng).map((x) => x.id),
  }));
}

// ---------- Mức ----------
export function cleanSoundsState(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const lock = [1, 2, 3].includes(s.lock) ? s.lock : null;
  return { level: lock ?? ([1, 2, 3].includes(s.level) ? s.level : 1), rounds: Number.isInteger(s.rounds) && s.rounds >= 0 ? s.rounds : 0, lock };
}

/**
 * Chơi xong một lượt (đủ 5 câu, bất kể nhầm bao nhiêu lần; mọi kiểu đếm chung): đủ 3 lượt ở mức hiện tại thì lên một mức
 * (tối đa 3), `rounds` về 0. Bố mẹ khóa mức: giữ mức, không đếm lượt (mở khóa thì đếm lại từ 0). Áp dụng từ lượt sau.
 */
export function afterSoundsRound(state) {
  if (state.lock) return { ...state, level: state.lock, rounds: 0 };
  const rounds = state.rounds + 1;
  if (state.level < 3 && rounds >= ROUNDS_TO_LEVEL_UP) return { ...state, level: state.level + 1, rounds: 0 };
  return { ...state, rounds };
}
