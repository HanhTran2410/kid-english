// Mục "Phonics" (SPEC-phonics.md): chữ cái + âm chính qua các từ quen thuộc, học kiểu sơ đồ tư duy.
// Dữ liệu có sẵn (26 chữ, chạy offline) và các hàm thuần (không phụ thuộc DOM), test được trong Node.

export const PHONICS_KIND = 'phonics';

/**
 * Từ cho từng chữ: bắt đầu bằng ÂM CHÍNH của chữ (A /æ/: ant, apple — không dùng "arm"). Chữ X: từ CÓ âm /ks/ (box, fox).
 * Chữ khó có ít từ quen thuộc đúng âm + có emoji thì dùng 3–5 từ.
 */
const RAW = {
  a: ['ant 🐜', 'apple 🍎', 'alligator 🐊', 'ambulance 🚑', 'astronaut 🧑‍🚀', 'axe 🪓'],
  b: ['ball ⚽', 'bear 🐻', 'banana 🍌', 'bus 🚌', 'bee 🐝', 'book 📖'],
  c: ['cat 🐱', 'car 🚗', 'cake 🍰', 'cup 🥤', 'cow 🐮', 'carrot 🥕'],
  d: ['dog 🐶', 'duck 🦆', 'drum 🥁', 'door 🚪', 'dinosaur 🦕', 'donut 🍩'],
  e: ['egg 🥚', 'elephant 🐘', 'elf 🧝', 'envelope ✉️', 'eggplant 🍆'],
  f: ['fish 🐟', 'frog 🐸', 'flower 🌸', 'fork 🍴', 'fire 🔥', 'feather 🪶'],
  g: ['goat 🐐', 'grapes 🍇', 'gift 🎁', 'girl 👧', 'guitar 🎸', 'gorilla 🦍'],
  h: ['hat 🎩', 'horse 🐴', 'house 🏠', 'heart ❤️', 'hen 🐔', 'hand ✋'],
  i: ['insect 🐛', 'iguana 🦎', 'igloo 🧊', 'ink 🖋️', 'ill 🤒'],
  j: ['juice 🧃', 'jeans 👖', 'jacket 🧥', 'jet 🛩️', 'jaguar 🐆', 'jar 🫙'],
  k: ['kite 🪁', 'key 🔑', 'king 🤴', 'kangaroo 🦘', 'koala 🐨', 'kiwi 🥝'],
  l: ['lion 🦁', 'leaf 🍃', 'lemon 🍋', 'lamp 💡', 'ladybug 🐞', 'log 🪵'],
  m: ['moon 🌙', 'monkey 🐵', 'milk 🥛', 'mouse 🐭', 'mushroom 🍄', 'map 🗺️'],
  n: ['nose 👃', 'nut 🥜', 'net 🥅', 'nest 🪺', 'noodles 🍜', 'nurse 🧑‍⚕️'],
  o: ['octopus 🐙', 'orange 🍊', 'ox 🐂', 'otter 🦦', 'olive 🫒'],
  p: ['pig 🐷', 'pen 🖊️', 'pizza 🍕', 'panda 🐼', 'pear 🍐', 'penguin 🐧'],
  q: ['queen 👸', 'question ❓', 'quilt 🛏️'],
  r: ['rabbit 🐰', 'rain 🌧️', 'robot 🤖', 'rocket 🚀', 'ring 💍', 'rainbow 🌈'],
  s: ['sun ☀️', 'sock 🧦', 'snake 🐍', 'star ⭐', 'spoon 🥄', 'sandwich 🥪'],
  t: ['tiger 🐯', 'train 🚂', 'tree 🌳', 'tomato 🍅', 'turtle 🐢', 'toothbrush 🪥'],
  u: ['umbrella ☂️', 'up ⬆️', 'upside down 🙃'],
  v: ['van 🚐', 'violin 🎻', 'volcano 🌋', 'vase 🏺', 'vest 🦺', 'vegetables 🥦'],
  w: ['watermelon 🍉', 'whale 🐳', 'wolf 🐺', 'worm 🪱', 'window 🪟', 'watch ⌚'],
  x: ['box 📦', 'fox 🦊', 'six 6️⃣', 'taxi 🚕'],
  y: ['yo-yo 🪀', 'yarn 🧶', 'yellow 🟡', 'yacht ⛵', 'yawn 🥱'],
  z: ['zebra 🦓', 'zero 0️⃣', 'zipper 🤐', 'zigzag 〰️'],
};

export const ALPHABET = Object.keys(RAW);

/** Chữ cái + các từ; `inside`: chữ X — âm nằm trong từ, không ở đầu. */
export const LETTERS = ALPHABET.map((letter) => ({
  letter,
  inside: letter === 'x',
  words: RAW[letter].map((s) => {
    const i = s.lastIndexOf(' ');
    return { en: s.slice(0, i), emoji: s.slice(i + 1) };
  }),
}));

export const LETTER_BY = new Map(LETTERS.map((l) => [l.letter, l]));

/** Mỗi chữ một màu cố định (dùng ở thẻ chữ, chữ tô trong từ, bóng bay). */
const COLORS = ['#e5484d', '#f76b15', '#d99a00', '#2fb380', '#3b82f6', '#8b5cf6', '#ec4899', '#0d9488', '#a0522d', '#4f46e5'];
export const letterColor = (letter) => COLORS[ALPHABET.indexOf(letter) % COLORS.length] ?? '#3d2c5e';

/** Khóa tiến độ của chữ (không lẫn với từ vựng). */
export const letterKey = (letter) => `letter:${letter}`;

export const isPhonicsLesson = (lesson) => lesson?.kind === PHONICS_KIND || Array.isArray(lesson?.letters);

const GROUPS = [['a', 'f'], ['g', 'l'], ['m', 'r'], ['s', 'v'], ['w', 'z']];

/** 5 bài có sẵn: A–F, G–L, M–R, S–V, W–Z (SPEC-phonics mục 4). `builtin`: mã cố định để tự thêm một lần. */
export function builtInPhonicsLessons() {
  return GROUPS.map(([from, to]) => {
    const letters = ALPHABET.slice(ALPHABET.indexOf(from), ALPHABET.indexOf(to) + 1)
      .map((l) => ({ letter: l, inside: LETTER_BY.get(l).inside, words: LETTER_BY.get(l).words.map((w) => ({ ...w })) }));
    const title = `Letters ${from.toUpperCase()}–${to.toUpperCase()}`;
    return {
      version: 2, kind: PHONICS_KIND, builtin: `phonics-${from}-${to}`, title, titleVi: `Chữ cái ${from.toUpperCase()}–${to.toUpperCase()}`,
      topic: 'Phonics', emoji: letters[0].words[0].emoji, letters,
    };
  });
}

/** Vị trí chữ cần tô trong từ: chữ đầu (hoặc chữ x ở trong từ). */
export function highlightIndex(word, letter) {
  const i = String(word).toLowerCase().indexOf(letter);
  return i < 0 ? 0 : i;
}

/** Câu Bông nói ở giữa sơ đồ: "A! A is for ant!" — chữ X: "X! Box has X!". */
export function letterIntro(entry) {
  const L = entry.letter.toUpperCase();
  const first = entry.words[0]?.en ?? '';
  return entry.inside ? `${L}! ${cap(first)} has ${L}!` : `${L}! ${L} is for ${first}!`;
}

/** Câu hỏi tìm từ đúng âm: "Which one starts with A?" — chữ X: "Which one has X?". */
export const findQuestion = (entry) => (entry.inside
  ? `Which one has ${entry.letter.toUpperCase()}?`
  : `Which one starts with ${entry.letter.toUpperCase()}?`);

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Các bước của bài phonics (SPEC-phonics mục 5, 6): với từng chữ: sơ đồ → tìm từ đúng âm;
 * cuối bài: chữ hoa – chữ thường, nghe từ chọn chữ (mỗi trò tối đa 4 lượt), bắt bóng chữ.
 */
export function buildPhonicsSteps(lesson, rounds = 4) {
  const steps = [];
  lesson.letters.forEach((_, index) => steps.push({ stage: 'map', index }, { stage: 'find', index }));
  if (lesson.letters.length >= 2) {
    for (let i = 0; i < Math.min(rounds, lesson.letters.length); i++) steps.push({ stage: 'case', index: i });
    for (let i = 0; i < Math.min(rounds, lesson.letters.length); i++) steps.push({ stage: 'hear', index: i });
    steps.push({ stage: 'pop', index: 0 });
  }
  return steps;
}

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Cặp chữ thường dễ nhầm hình: không cho cùng làm thẻ. */
const CONFUSABLE = [['b', 'd'], ['p', 'q'], ['b', 'p'], ['d', 'q'], ['m', 'w'], ['n', 'u']];
const confusable = (a, b) => CONFUSABLE.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

/**
 * Thẻ chữ để chọn: chữ đúng + chữ khác (ưu tiên chữ trong bài), không trùng, không có cặp dễ nhầm (b/d, p/q…).
 * @param {string[]} pool chữ ưu tiên lấy làm thẻ sai (chữ của bài)
 */
export function letterChoices(letter, pool, rng = Math.random, count = 3) {
  const chosen = [letter];
  const candidates = [...shuffle(pool.filter((l) => l !== letter), rng), ...shuffle(ALPHABET.filter((l) => l !== letter && !pool.includes(l)), rng)];
  for (const l of candidates) {
    if (chosen.length >= count) break;
    if (chosen.some((c) => confusable(c, l))) continue;
    chosen.push(l);
  }
  return shuffle(chosen, rng);
}

/**
 * Hình cho câu "Which one starts with A?": 1 từ của chữ này + từ của chữ KHÁC (không bắt đầu bằng chữ này).
 * @param {object[]} letters các chữ của bài (để lấy từ của chữ khác)
 */
export function findChoices(entry, letters, rng = Math.random, count = 3) {
  const answer = shuffle(entry.words, rng)[0];
  const others = shuffle(letters.length > 1 ? letters : LETTERS, rng)
    .filter((l) => l.letter !== entry.letter)
    .flatMap((l) => shuffle(l.words, rng).slice(0, 1))
    .filter((w) => (entry.inside ? !w.en.toLowerCase().includes(entry.letter) : !w.en.toLowerCase().startsWith(entry.letter)));
  const wrong = shuffle(others, rng).slice(0, count - 1);
  return { answer, choices: shuffle([answer, ...wrong], rng) };
}

/** Lượt "bắt bóng chữ": các chữ cần bắt (mỗi chữ của bài một lần, tối đa 6), xáo trộn. */
export function popTargets(lesson, rng = Math.random, max = 6) {
  return shuffle(lesson.letters.map((l) => l.letter), rng).slice(0, max);
}
