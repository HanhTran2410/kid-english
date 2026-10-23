// Trò Lính cứu hỏa (SPEC-jobs.md mục 7): dập những ngọn lửa nhỏ hoạt hình (Bông đếm), mức 2 hỏi "How many fires?",
// mức 3 Bông gọi chỗ ("The fire is on the roof!"); ca cứu bạn thú trên cây bằng thang (mức 2–3). File thuần để test được.

import { PATIENTS, PATIENT_BY_ID } from '../doctor.js';

export const CASES_PER_ROUND = 3;
export const MAX_LEVEL = 3;
/** Chỗ có thể có lửa trên ngôi nhà (thứ tự vẽ). Mức 3 chỉ dùng mái / cửa sổ / cửa (mỗi chỗ một ngọn). */
export const SPOTS = ['roof', 'window', 'door', 'window2', 'chimney'];
export const PLACES = { roof: ['on the roof', 'trên mái nhà'], window: ['in the window', 'ở cửa sổ'], door: ['by the door', 'cạnh cửa ra vào'] };
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
const between = (lo, hi, rng) => lo + Math.floor(rng() * (hi - lo + 1));

/**
 * Ca dập lửa: { kind: 'fire', resident, fires: [{ id, spot }], order? }.
 * - Mức 1: 1–3 ngọn; mức 2: 2–5 ngọn (hết lửa thì hỏi số); mức 3: 3 ngọn ở mái / cửa sổ / cửa, `order` = thứ tự Bông gọi.
 */
export function makeFireCase(level, resident, { rng = Math.random } = {}) {
  if (level >= 3) {
    const spots = ['roof', 'window', 'door'];
    return { kind: 'fire', resident, fires: spots.map((spot, i) => ({ id: `f${i}`, spot })), order: shuffle(spots.map((_, i) => `f${i}`), rng) };
  }
  const n = level <= 1 ? between(1, 3, rng) : between(2, 5, rng);
  const spots = shuffle(SPOTS, rng).slice(0, n);
  return { kind: 'fire', resident, fires: spots.map((spot, i) => ({ id: `f${i}`, spot })) };
}

/** 3 thẻ số khác nhau trong 1–5, có đúng một thẻ là `n`, xáo vị trí. */
export function numberChoices(n, { rng = Math.random } = {}) {
  const others = shuffle([1, 2, 3, 4, 5].filter((x) => x !== n), rng).slice(0, 2);
  return shuffle([n, ...others], rng);
}

/**
 * 3 ca của một lượt, mỗi ca một bạn thú khác nhau. Mức 2–3: đúng một ca cứu bạn trên cây (không có lửa), còn lại dập lửa.
 */
export function planRound(level, { rng = Math.random } = {}) {
  const residents = shuffle(PATIENTS, rng).slice(0, CASES_PER_ROUND).map((p) => p.id);
  const treeAt = level >= 2 ? Math.floor(rng() * CASES_PER_ROUND) : -1;
  return {
    cases: residents.map((resident, i) => {
      if (i === treeAt) return { kind: 'tree', resident };
      const c = makeFireCase(level, resident, { rng });
      return level === 2 ? { ...c, choices: numberChoices(c.fires.length, { rng }) } : c;
    }),
  };
}

// ---------- Câu nói: mỗi câu [tiếng Anh, tiếng Việt] ----------
export const ALARM_LINE = ["A little fire! Let's put it out!", 'Có đám cháy nhỏ! Mình dập lửa nào!'];
export const TAP_LINE = ['Tap the fire to spray water!', 'Con chạm vào ngọn lửa để phun nước nhé!'];
export const THANKS_LINE = ['Thank you, firefighter!', 'Cảm ơn chú lính cứu hỏa!'];
export const HOW_MANY_LINE = ['How many fires?', 'Có mấy đám lửa nhỉ?'];
export const TREE_LINE = ["Help! I can't get down!", 'Cứu tớ với! Tớ không xuống được!'];
export const LADDER_LINE = ["Let's use the ladder!", 'Mình dùng cái thang nào!'];
export const DOWN_LINE = ['Thank you! I am down!', 'Cảm ơn nhé! Tớ xuống được rồi!'];

/** Bông đếm khi tắt từng ngọn: "One!", "Two!". */
export const countLine = (n) => [`${capital(NUMBERS[n])}!`, `${capital(NUMBERS_VI[n])}!`];
/** Hết lửa: "One fire! All gone!" / "Three fires! All gone!" (theo số lửa thật). */
export const allGoneLine = (n) => [`${capital(NUMBERS[n])} ${n === 1 ? 'fire' : 'fires'}! All gone!`, `${capital(NUMBERS_VI[n])} đám lửa! Tắt hết rồi!`];
/** Mức 2, chọn đúng số: "Yes! Three fires!" */
export const rightNumberLine = (n) => [`Yes! ${capital(NUMBERS[n])} ${n === 1 ? 'fire' : 'fires'}!`, `Đúng rồi! ${capital(NUMBERS_VI[n])} đám lửa!`];
/** Mức 2, chọn nhầm: "That's four. Let's count again!" (không nói đáp án). */
export const wrongNumberLine = (x) => [`That's ${NUMBERS[x]}. Let's count again!`, `Đó là số ${NUMBERS_VI[x]}. Mình đếm lại nhé!`];
/** Mức 3: "The fire is on the roof!" */
export const whereLine = (spot) => [`The fire is ${PLACES[spot][0]}!`, `Lửa ở ${PLACES[spot][1]}!`];
/** Mức 3, chạm ngọn khác: "The fire on the roof first!" */
export const firstLine = (spot) => [`The fire ${PLACES[spot][0]} first!`, `Dập lửa ${PLACES[spot][1]} trước nhé!`];
/** Tên bạn thú (cho phụ đề / test). */
export const residentName = (id) => PATIENT_BY_ID.get(id)?.name ?? id;
