// Mức của các trò đóng vai nghề (SPEC-jobs mục 2.2): cài đặt `<nghề>Game` = { level, rounds, lock, seen }.
// File thuần (không phụ thuộc giao diện) để test được trong node.

export const ROUNDS_TO_LEVEL_UP = 3;

/** Dữ liệu hỏng → mức 1, 0 lượt, không khóa; `seen` chỉ giữ mã hợp lệ (`validId`). */
export function cleanJobState(saved, { maxLevel = 3, validId = () => true } = {}) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const ok = (n) => Number.isInteger(n) && n >= 1 && n <= maxLevel;
  const lock = ok(s.lock) ? s.lock : null;
  const seen = {};
  if (s.seen && typeof s.seen === 'object') {
    for (const [id, n] of Object.entries(s.seen)) if (validId(id) && Number.isInteger(n) && n > 0) seen[id] = n;
  }
  return { level: lock ?? (ok(s.level) ? s.level : 1), rounds: Number.isInteger(s.rounds) && s.rounds >= 0 ? s.rounds : 0, lock, seen };
}
/** Xong một lượt: đủ 3 lượt ở mức hiện tại thì lên một mức (tới `maxLevel`). Khóa mức: không đếm. */
export function afterJobRound(state, { maxLevel = 3 } = {}) {
  if (state.lock) return { ...state, level: state.lock, rounds: 0 };
  const rounds = state.rounds + 1;
  if (state.level < maxLevel && rounds >= ROUNDS_TO_LEVEL_UP) return { ...state, level: state.level + 1, rounds: 0 };
  return { ...state, rounds };
}
/** Một ca xong: `seen` của ca +1. */
export const afterSeen = (state, id) => ({ ...state, seen: { ...state.seen, [id]: (state.seen[id] ?? 0) + 1 } });

/**
 * Lập kế hoạch lượt có kiểm tra (SPEC-jobs3 mục 2.2): bốc `make()` tới khi `ok(plan)`, tối đa `tries` lần; vẫn không được thì
 * dùng `fallback()` (kế hoạch cố định của mức) — không bao giờ vào lượt với yêu cầu không làm được.
 */
export function planChecked(make, ok, fallback, tries = 50) {
  for (let i = 0; i < tries; i++) {
    const plan = make();
    if (ok(plan)) return plan;
  }
  return fallback();
}

/**
 * Chống chạm trùng (SPEC-jobs3 mục 2.3): mỗi mã chỉ "nhận" được một lần (`take` → true lần đầu, false các lần sau).
 * `list()` để lưu vào bản chơi tiếp; `claims(saved)` dựng lại từ bản lưu.
 */
export function claims(list = []) {
  const taken = new Set(list);
  return {
    take(id) {
      if (taken.has(id)) return false;
      taken.add(id);
      return true;
    },
    has: (id) => taken.has(id),
    list: () => [...taken],
    clear: () => taken.clear(),
  };
}

/** Xáo trộn / bốc ngẫu nhiên (dùng chung cho các nghề mới; `rng` để test lặp lại được). */
export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];
export const randInt = (lo, hi, rng = Math.random) => lo + Math.floor(rng() * (hi - lo + 1));
/** Ưu tiên mã ít gặp (`seen` thấp) rồi ngẫu nhiên (SPEC-jobs3 mục 2.7). */
export function leastSeen(ids, seen = {}, rng = Math.random) {
  return shuffle(ids, rng).sort((a, b) => (seen[a] ?? 0) - (seen[b] ?? 0));
}
/** Số đếm 1–10 bằng chữ. */
export const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

