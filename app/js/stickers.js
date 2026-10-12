// Bộ sưu tập sticker (SPEC mục 4.8): 100 sticker chia 5 album × 20. Thứ tự và mã (id) của sticker cũ không đổi
// để sticker bé đã có vẫn giữ nguyên.

export const ALBUM_SIZE = 20;

export const STICKERS = [
  ['lion', '🦁'], ['tiger', '🐯'], ['monkey', '🐵'], ['panda', '🐼'], ['koala', '🐨'],
  ['elephant', '🐘'], ['giraffe', '🦒'], ['zebra', '🦓'], ['penguin', '🐧'], ['owl', '🦉'],
  ['frog', '🐸'], ['turtle', '🐢'], ['dolphin', '🐬'], ['whale', '🐳'], ['octopus', '🐙'],
  ['butterfly', '🦋'], ['bee', '🐝'], ['ladybug', '🐞'], ['unicorn', '🦄'], ['dinosaur', '🦕'],
  ['apple', '🍎'], ['banana', '🍌'], ['strawberry', '🍓'], ['watermelon', '🍉'], ['cherry', '🍒'],
  ['ice cream', '🍦'], ['cake', '🍰'], ['cookie', '🍪'], ['lollipop', '🍭'], ['donut', '🍩'],
  ['car', '🚗'], ['bus', '🚌'], ['train', '🚂'], ['airplane', '✈️'], ['rocket', '🚀'],
  ['boat', '⛵'], ['star', '⭐'], ['rainbow', '🌈'], ['sun', '🌞'], ['balloon', '🎈'],
  // Album 3: thú cưng, nông trại, biển
  ['cat', '🐱'], ['dog', '🐶'], ['rabbit', '🐰'], ['fox', '🦊'], ['bear', '🐻'],
  ['pig', '🐷'], ['cow', '🐮'], ['horse', '🐴'], ['chick', '🐥'], ['duck', '🦆'],
  ['parrot', '🦜'], ['flamingo', '🦩'], ['peacock', '🦚'], ['crab', '🦀'], ['shark', '🦈'],
  ['seal', '🦭'], ['snail', '🐌'], ['hedgehog', '🦔'], ['sloth', '🦥'], ['kangaroo', '🦘'],
  // Album 4: đồ ăn
  ['grapes', '🍇'], ['orange', '🍊'], ['pineapple', '🍍'], ['peach', '🍑'], ['pear', '🍐'],
  ['lemon', '🍋'], ['avocado', '🥑'], ['carrot', '🥕'], ['corn', '🌽'], ['pizza', '🍕'],
  ['burger', '🍔'], ['fries', '🍟'], ['popcorn', '🍿'], ['pancakes', '🥞'], ['cupcake', '🧁'],
  ['candy', '🍬'], ['chocolate', '🍫'], ['milk', '🥛'], ['cheese', '🧀'], ['honey', '🍯'],
  // Album 5: xe, đồ chơi, thiên nhiên
  ['fire truck', '🚒'], ['police car', '🚓'], ['ambulance', '🚑'], ['tractor', '🚜'], ['bicycle', '🚲'],
  ['helicopter', '🚁'], ['robot', '🤖'], ['teddy bear', '🧸'], ['kite', '🪁'], ['ball', '⚽'],
  ['drum', '🥁'], ['guitar', '🎸'], ['crown', '👑'], ['gift', '🎁'], ['flower', '🌸'],
  ['sunflower', '🌻'], ['moon', '🌙'], ['snowman', '⛄'], ['cloud', '☁️'], ['castle', '🏰'],
].map(([name, emoji]) => ({ id: name.replace(/\s+/g, '-'), name, emoji }));

export const STICKER_BY_ID = new Map(STICKERS.map((s) => [s.id, s]));

/** 5 album, mỗi album 20 sticker; biểu tượng album là sticker đầu tiên. */
export const ALBUMS = Array.from({ length: Math.ceil(STICKERS.length / ALBUM_SIZE) }, (_, i) => {
  const stickers = STICKERS.slice(i * ALBUM_SIZE, (i + 1) * ALBUM_SIZE);
  return { index: i, emoji: stickers[0].emoji, stickers };
});

const hasIn = (owned) => (id) => (owned instanceof Map ? owned.has(id) : Boolean(owned?.[id]));

/** Album đang sưu tập: album đầu tiên còn thiếu sticker (đủ hết thì album cuối). */
export function currentAlbum(owned) {
  const has = hasIn(owned);
  return ALBUMS.find((a) => a.stickers.some((s) => !has(s.id))) ?? ALBUMS.at(-1);
}

/**
 * Chọn sticker để tặng: ưu tiên sticker bé chưa có trong album đang sưu tập (đủ album này mới sang album sau);
 * đủ cả bộ rồi thì ngẫu nhiên.
 * @param {Record<string, {count:number}>|Map<string,{count:number}>} owned
 */
export function pickSticker(owned, rng = Math.random) {
  const has = hasIn(owned);
  const missing = currentAlbum(owned).stickers.filter((s) => !has(s.id));
  const pool = missing.length ? missing : STICKERS;
  return pool[Math.floor(rng() * pool.length)];
}

/** Bản ghi sticker sau khi được tặng thêm một lần. */
export function awardSticker(record, id, now = Date.now()) {
  if (!record) return { id, firstEarnedAt: now, count: 1 };
  return { ...record, count: record.count + 1 };
}

/** Gộp khi khôi phục: lấy count cao hơn, ngày nhận đầu sớm hơn. */
export function mergeSticker(current, incoming) {
  if (!current) return incoming;
  if (!incoming) return current;
  return {
    ...current,
    count: Math.max(current.count, incoming.count),
    firstEarnedAt: Math.min(current.firstEarnedAt, incoming.firstEarnedAt),
  };
}
