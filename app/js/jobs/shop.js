// Trò Bán hàng (SPEC-jobs.md mục 3): khách (bạn thú) gọi món, bé đưa đúng món; từ mức 2 khách trả xu đồ chơi.
// Món, loại danh từ (a / an / some, số nhiều) và ảnh dùng chung với Cho Bông ăn (feed.js). File thuần để test được.

import { BUILTIN_FOODS, requestPhrase, countPhrase, thatPhrase } from '../feed.js';
import { PATIENTS } from '../doctor.js';

export const CASES_PER_ROUND = 3;
export const MAX_LEVEL = 3;
/** Số món trên kệ theo mức. */
export const SHELF_SIZE = { 1: 3, 2: 5, 3: 6 };
/** Từ mức 2: khách trả xu (số xu = số món đã mua, tối đa 3). */
export const MAX_COINS = 3;
/** Từ bài Food: đưa đúng món này thì ghi "đã gặp". */
export const FOOD_LESSON_WORDS = new Set(['rice', 'bread', 'egg', 'banana', 'milk', 'water']);

const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five'];
const NUMBERS_VI = ['không', 'một', 'hai', 'ba', 'bốn', 'năm'];
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const sellable = (f) => f.kind === 'food' || f.kind === 'drink';

/**
 * Kệ hàng của một lượt: mức 1 — 3 món dễ (món `easy` của Cho Bông ăn); mức 2 — 5 món, có 1 đồ uống;
 * mức 3 — 6 món, có 1 đồ uống. Không bán đồ không ăn được.
 */
export function makeShelf(level, { foods = BUILTIN_FOODS, rng = Math.random } = {}) {
  const size = SHELF_SIZE[level] ?? SHELF_SIZE[1];
  const meals = foods.filter((f) => f.kind === 'food');
  if (level <= 1) {
    const easy = meals.filter((f) => f.easy);
    return shuffle(easy.length >= size ? easy : meals, rng).slice(0, size);
  }
  const drink = shuffle(foods.filter((f) => f.kind === 'drink'), rng).slice(0, 1);
  return shuffle([...drink, ...shuffle(meals, rng).slice(0, size - drink.length)], rng);
}

/**
 * Món khách gọi: [{ id, count }].
 * - Mức 1: một món, 1 cái.
 * - Mức 2: một món; món đếm được thì 2 hoặc 3 cái (đôi khi 1), món khác 1.
 * - Mức 3: hai món khác nhau, mỗi món 1.
 */
export function makeOrder(shelf, level, { rng = Math.random, avoid = null } = {}) {
  const pool = shelf.filter(sellable);
  const fresh = pool.length > 1 && avoid ? pool.filter((f) => f.id !== avoid) : pool;
  const picks = shuffle(fresh, rng);
  if (level >= 3 && pool.length >= 2) {
    const second = shuffle(pool.filter((f) => f.id !== picks[0].id), rng)[0];
    return [{ id: picks[0].id, count: 1 }, { id: second.id, count: 1 }];
  }
  const food = picks[0];
  const count = level >= 2 && food.grammar === 'count' ? [1, 2, 2, 3][Math.floor(rng() * 4)] : 1;
  return [{ id: food.id, count }];
}

/**
 * Kế hoạch một lượt: kệ hàng + 3 khách (bạn thú khác nhau) với món gọi; hai khách liền nhau không gọi cùng món đầu.
 * SPEC-jobs2 SH1: thêm thùng hàng `stock` (bày kệ mở đầu lượt).
 * @returns {{ shelf: string[], cases: Array<{ customer: string, order: Array<{ id: string, count: number }> }>, stock: string[] }}
 */
export function planRound(level, { foods = BUILTIN_FOODS, rng = Math.random } = {}) {
  const shelfFoods = makeShelf(level, { foods, rng });
  const stock = makeStock(level, { foods, rng });
  const customers = shuffle(PATIENTS, rng);
  const cases = [];
  let last = null;
  for (let i = 0; i < CASES_PER_ROUND; i++) {
    const order = makeOrder(shelfFoods, level, { rng, avoid: last });
    last = order[0].id;
    cases.push({ customer: customers[i % customers.length].id, order });
  }
  return { shelf: shelfFoods.map((f) => f.id), cases, stock };
}

/** Số xu khách trả (mức 2+): số món đã mua, tối đa 3. Mức 1 không có bước trả tiền. */
export const coinsFor = (order, level) => (level >= 2 ? Math.min(MAX_COINS, order.reduce((n, o) => n + o.count, 0)) : 0);

/** Còn thiếu bao nhiêu cái mỗi món (`got`: mã → số đã đưa). */
export const remaining = (order, got = {}) => order.map((o) => ({ ...o, left: o.count - (got[o.id] ?? 0) })).filter((o) => o.left > 0);
export const orderDone = (order, got = {}) => remaining(order, got).length === 0;

// ---------- Câu nói: mỗi câu [tiếng Anh, tiếng Việt] ----------
/** "two apples" / "a banana" / đang đưa dở: "one more apple". */
function wantPhrase(food, item, got) {
  if (got > 0) return `${NUMBERS[item.left]} more ${item.left === 1 ? food.en : food.plural}`;
  return countPhrase(food, item.left);
}
const viPhrase = (food, n) => (n > 1 ? `${NUMBERS_VI[n]} ${food.vi}` : food.vi);

export const WELCOME_LINE = ['Hello! Welcome to our shop!', 'Xin chào! Mời bạn vào cửa hàng!'];
export const HERE_YOU_ARE_LINE = ['Here you are!', 'Của bạn đây!'];
export const MONEY_LINE = ["Here's the money!", 'Tiền đây ạ!'];
export const TAP_COINS_LINE = ['Put the coins in the box!', 'Con bỏ xu vào hộp nhé!'];
export const THANKS_LINE = ['Thank you!', 'Cảm ơn bạn!'];
export const CLOSED_LINE = ['The shop is closed! Great job!', 'Cửa hàng đóng cửa rồi! Con bán hàng giỏi quá!'];

/** Khách gọi món: "Can I have a banana, please?" (đang đưa dở: phần còn thiếu, "one more apple"). */
export function orderLine(order, foodById, got = {}) {
  const left = remaining(order, got);
  const en = left.map((o) => wantPhrase(foodById(o.id), o, got[o.id] ?? 0)).join(' and ');
  const vi = left.map((o) => viPhrase(foodById(o.id), o.left)).join(' và ');
  return [`Can I have ${en}, please?`, `Cho tớ ${vi} nhé!`];
}
/** Đưa nhầm: "Hmm, that's an apple. Can I have a banana, please?" */
export function wrongLine(given, order, foodById, got = {}) {
  const ask = orderLine(order, foodById, got);
  return [`Hmm, ${thatPhrase(given)}. ${ask[0]}`, `Ừm, đó là ${given.vi}. ${ask[1]}`];
}
/** Đưa thêm món đã đủ: "I have that already! Can I have …?" */
export function enoughLine(order, foodById, got = {}) {
  const ask = orderLine(order, foodById, got);
  return [`I have that already! ${ask[0]}`, `Tớ có món đó rồi! ${ask[1]}`];
}
/** Đếm khi đưa từng cái (món nhiều cái): "One!", "Two!". */
export const countLine = (n) => [`${capital(NUMBERS[n])}!`, `${capital(NUMBERS_VI[n])}!`];
/** Đếm xu: "One coin!", "Two coins!". */
export const coinLine = (n) => [`${capital(NUMBERS[n])} ${n === 1 ? 'coin' : 'coins'}!`, `${capital(NUMBERS_VI[n])} đồng xu!`];
/** Câu xin một món (dùng cho bong bóng / test): "a banana", "some milk". */
export { requestPhrase };

// ---------- SPEC-jobs2 SH1: bày kệ (mở đầu lượt) + đưa túi, chào khách (cuối mỗi ca) ----------
/** Trái cây (theo mã món của Cho Bông ăn). */
export const FRUIT_IDS = new Set(['banana', 'apple', 'orange', 'grapes', 'strawberry', 'watermelon', 'mango', 'coconut']);
export const GROUPS = ['fruit', 'drink', 'other'];
export const GROUP_INFO = {
  fruit: { emoji: '🍎', en: 'Fruit', vi: 'Trái cây', basket: 'fruit' },
  drink: { emoji: '🥤', en: 'Drinks', vi: 'Đồ uống', basket: 'drinks' },
  other: { emoji: '🍕', en: 'Other food', vi: 'Đồ ăn khác', basket: 'food' },
};
/** Số món trong thùng hàng theo mức. */
export const STOCK_SIZE = { 1: 3, 2: 4, 3: 4 };
/** Nhóm của món: đồ uống / trái cây / đồ ăn khác; đồ không ăn được → null. */
export function foodGroup(f) {
  if (!f) return null;
  if (f.kind === 'drink') return 'drink';
  if (f.kind !== 'food') return null;
  return FRUIT_IDS.has(f.id) ? 'fruit' : 'other';
}
/** Giỏ của mức: mức 1–2 Fruit + Drinks; mức 3 thêm Other food. */
export const groupsFor = (level) => (level >= 3 ? GROUPS : GROUPS.slice(0, 2));

/**
 * Thùng hàng (sinh sẵn): mỗi giỏ của mức có ít nhất một món, còn lại ngẫu nhiên, không trùng.
 * Món bố mẹ thêm (đã lọc) dùng được; nhóm nào thiếu thì lấy từ danh sách món có sẵn.
 */
export function makeStock(level, { foods = BUILTIN_FOODS, rng = Math.random } = {}) {
  const groups = groupsFor(level);
  const size = STOCK_SIZE[level] ?? STOCK_SIZE[1];
  const pools = {};
  for (const g of groups) {
    const own = foods.filter((f) => foodGroup(f) === g);
    pools[g] = shuffle(own.length ? own : BUILTIN_FOODS.filter((f) => foodGroup(f) === g), rng);
  }
  const picks = groups.map((g) => pools[g].shift());
  const rest = shuffle(groups.flatMap((g) => pools[g]), rng);
  while (picks.length < size && rest.length) picks.push(rest.shift());
  return shuffle(picks, rng).map((f) => f.id);
}

const subject = (f) => capital(f.grammar === 'count' ? f.plural : f.en);
const isAre = (f) => (f.grammar === 'mass' ? 'is' : 'are');
/** "Bananas are fruit!" / "Milk is a drink!" / "Bread is food!" */
export function groupLine(f) {
  const g = foodGroup(f);
  if (g === 'drink') return [`${capital(f.en)} is a drink!`, `${capital(f.vi)} là đồ uống!`];
  if (g === 'fruit') return [`${subject(f)} ${isAre(f)} fruit!`, `${capital(f.vi)} là trái cây!`];
  return [`${subject(f)} ${isAre(f)} food!`, `${capital(f.vi)} là đồ ăn!`];
}
/** Giỏ sai: "Milk is a drink! Put it in the drinks basket." */
export function wrongBasketLine(f) {
  const g = GROUP_INFO[foodGroup(f)];
  const [en, vi] = groupLine(f);
  return [`${en} Put it in the ${g.basket} basket.`, `${vi} Con bỏ vào giỏ ${g.vi.toLowerCase()} nhé.`];
}
/** Mở đầu lượt: mức 1 chạm từng món; mức 2–3 xếp đúng giỏ. */
export const stockLine = (level) => (level <= 1
  ? ["Let's fill the shop! Tap the food.", 'Mình bày hàng nào! Con chạm vào từng món nhé.']
  : ["Let's fill the shop! Put the food in the right basket.", 'Mình bày hàng nào! Con xếp từng món vào đúng giỏ nhé.']);
export const OPEN_LINE = ['The shop is open!', 'Cửa hàng mở cửa rồi!'];
export const BAG_LINE = ['Put it in the bag!', 'Con bỏ đồ vào túi nhé!'];
export const giveBagLine = (name) => [`Give it to ${name}!`, `Con đưa túi cho ${name} nào!`];
export const NICE_DAY_LINE = ['Have a nice day!', 'Chúc bạn một ngày vui vẻ!'];
export const YOU_TOO_LINE = ['You too!', 'Bạn cũng vậy nhé!'];
export const BYE_LINE = ['Bye-bye!', 'Tạm biệt!'];
