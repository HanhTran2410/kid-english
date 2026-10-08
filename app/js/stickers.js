// Bộ sưu tập sticker (SPEC mục 4.8).

export const STICKERS = [
  ['lion', '🦁'], ['tiger', '🐯'], ['monkey', '🐵'], ['panda', '🐼'], ['koala', '🐨'],
  ['elephant', '🐘'], ['giraffe', '🦒'], ['zebra', '🦓'], ['penguin', '🐧'], ['owl', '🦉'],
  ['frog', '🐸'], ['turtle', '🐢'], ['dolphin', '🐬'], ['whale', '🐳'], ['octopus', '🐙'],
  ['butterfly', '🦋'], ['bee', '🐝'], ['ladybug', '🐞'], ['unicorn', '🦄'], ['dinosaur', '🦕'],
  ['apple', '🍎'], ['banana', '🍌'], ['strawberry', '🍓'], ['watermelon', '🍉'], ['cherry', '🍒'],
  ['ice cream', '🍦'], ['cake', '🍰'], ['cookie', '🍪'], ['lollipop', '🍭'], ['donut', '🍩'],
  ['car', '🚗'], ['bus', '🚌'], ['train', '🚂'], ['airplane', '✈️'], ['rocket', '🚀'],
  ['boat', '⛵'], ['star', '⭐'], ['rainbow', '🌈'], ['sun', '🌞'], ['balloon', '🎈'],
].map(([name, emoji]) => ({ id: name.replace(/\s+/g, '-'), name, emoji }));

export const STICKER_BY_ID = new Map(STICKERS.map((s) => [s.id, s]));

/**
 * Chọn sticker để tặng: ưu tiên sticker bé chưa có; đủ bộ rồi thì ngẫu nhiên.
 * @param {Record<string, {count:number}>|Map<string,{count:number}>} owned
 */
export function pickSticker(owned, rng = Math.random) {
  const has = (id) => (owned instanceof Map ? owned.has(id) : Boolean(owned?.[id]));
  const missing = STICKERS.filter((s) => !has(s.id));
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
