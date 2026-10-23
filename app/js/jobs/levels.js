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

