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
 * @returns {{ shelf: string[], cases: Array<{ customer: string, order: Array<{ id: string, count: number }> }> }}
 */
export function planRound(level, { foods = BUILTIN_FOODS, rng = Math.random } = {}) {
  const shelfFoods = makeShelf(level, { foods, rng });
  const customers = shuffle(PATIENTS, rng);
  const cases = [];
  let last = null;
  for (let i = 0; i < CASES_PER_ROUND; i++) {
    const order = makeOrder(shelfFoods, level, { rng, avoid: last });
    last = order[0].id;
    cases.push({ customer: customers[i % customers.length].id, order });
  }
  return { shelf: shelfFoods.map((f) => f.id), cases };
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
export const THANKS_LINE = ['Thank you! Bye-bye!', 'Cảm ơn! Tạm biệt!'];
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
