// Chờ có thể hủy (AbortSignal) và hệ số thời gian cho test giao diện (?fast → chạy nhanh gấp 50 lần).

export const TIME_SCALE = (() => {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').has('fast') ? 0.02 : 1;
  } catch {
    return 1;
  }
})();

export const scaled = (ms) => Math.round(ms * TIME_SCALE);

export function abortError() {
  return new DOMException('Đã dừng', 'AbortError');
}

export const isAbort = (err) => err?.name === 'AbortError';

/** Chờ `ms` mili giây (đã nhân hệ số), hủy được bằng signal. */
export function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, scaled(ms));
    function onAbort() {
      clearTimeout(timer);
      reject(abortError());
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Ném AbortError nếu signal đã bị hủy. */
export function checkAbort(signal) {
  if (signal?.aborted) throw abortError();
}
