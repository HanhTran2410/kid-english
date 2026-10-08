// Giới hạn thời gian mỗi buổi (SPEC mục 4.6): giới hạn mềm, bố mẹ cho học thêm.
// Thời gian chỉ được cộng khi bé đang học (người gọi quyết định lúc nào gọi addTime).

export const NEW_SESSION_GAP_MS = 60 * 60 * 1000; // không dùng app quá 1 tiếng → buổi mới
export const EXTEND_MS = 15 * 60 * 1000;
export const LIMIT_OPTIONS = [15, 20, 30, null]; // null = tắt giới hạn
export const DEFAULT_LIMIT_MINUTES = 15;

export function newSession(now = Date.now()) {
  return { usedMs: 0, extraMs: 0, lastSeenAt: now };
}

/** Lấy buổi hiện tại, hoặc bắt đầu buổi mới nếu đã nghỉ quá 1 tiếng. */
export function resumeSession(state, now = Date.now()) {
  if (!state || now - state.lastSeenAt > NEW_SESSION_GAP_MS) return newSession(now);
  return { ...state, lastSeenAt: now };
}

/** Cộng thời gian bé đã học. */
export function addTime(state, ms, now = Date.now()) {
  return { ...state, usedMs: state.usedMs + Math.max(0, ms), lastSeenAt: now };
}

/** Bố mẹ cho học thêm 15 phút. */
export function extend(state, now = Date.now()) {
  return { ...state, extraMs: state.extraMs + EXTEND_MS, lastSeenAt: now };
}

/** Đã hết giờ chưa. limitMinutes = null nghĩa là tắt giới hạn. */
export function isTimeUp(state, limitMinutes) {
  if (limitMinutes == null) return false;
  return state.usedMs >= limitMinutes * 60 * 1000 + state.extraMs;
}
