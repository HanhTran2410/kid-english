// Chuông thông báo (SPEC-drive.md mục 10): có bản app mới, hoặc có bài mới / bài cập nhật trong Thư viện bài
// (app/shared/ trên GitHub). Kiểm tra lúc mở app, khi quay lại app và mỗi 30 phút; cần mạng, lỗi thì im lặng.
// "Bài mới" = file trong thư viện chưa từng thấy trên máy này (`librarySeen`: tên file|dung lượng). Lần đầu: lấy
// toàn bộ thư viện hiện có làm mốc (không báo cả thư viện cũ), sau đó chỉ báo file mới tải lên / file bị cập nhật.

import { APP_VERSION } from './app.js';
import { SHARED_INDEX } from './link-import.js';

const CHECK_EVERY_MS = 30 * 60_000;

/** Số phiên bản trong sw.js ("const VERSION = '0.35.0'"). */
export const parseSwVersion = (text) => String(text ?? '').match(/const VERSION = '([\d.]+)'/)?.[1] ?? null;

/** a mới hơn b (so từng số: 0.35.10 > 0.35.9). */
export function isNewer(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d > 0;
  }
  return false;
}

export const fileKey = (f) => `${f.file}|${f.size}`;

/**
 * File thư viện cần báo: chưa thấy lần nào (file mới) hoặc đã thấy với dung lượng khác (file được cập nhật).
 * `seen`: danh sách khóa đã thấy, null = lần đầu (trả về [] — cả thư viện hiện có thành mốc).
 * @returns {Array<object & { updated: boolean }>}
 */
export function libraryNews(files, seen) {
  if (!Array.isArray(seen)) return [];
  const keys = new Set(seen);
  const seenFiles = new Set(seen.map((k) => k.split('|')[0]));
  return files.filter((f) => !keys.has(fileKey(f))).map((f) => ({ ...f, updated: seenFiles.has(f.file) }));
}

// ---------- Trạng thái + người nghe (chuông ở màn hình chính, Góc bố mẹ) ----------
const state = { update: null, lessons: [], files: [] };
const listeners = new Set();
export const notices = () => state;
export const noticeCount = () => (state.update ? 1 : 0) + state.lessons.length;
export function onNotices(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  for (const fn of [...listeners]) fn(state);
}

/** Kiểm tra bản mới + thư viện. Lỗi mạng: giữ kết quả cũ. */
export async function checkNotices(app, fetchFn = (...a) => fetch(...a)) {
  try {
    const res = await fetchFn('sw.js', { cache: 'no-store' });
    const v = res.ok ? parseSwVersion(await res.text()) : null;
    state.update = v && isNewer(v, APP_VERSION) ? v : null;
  } catch {
    // offline
  }
  try {
    const res = await fetchFn(SHARED_INDEX, { cache: 'no-store' });
    if (res.ok) {
      const files = (await res.json())?.files ?? [];
      state.files = files;
      if (!Array.isArray(app.settings.librarySeen)) await app.setSetting('librarySeen', files.map(fileKey));
      state.lessons = libraryNews(files, app.settings.librarySeen);
    }
  } catch {
    // offline
  }
  emit();
  return state;
}

/** Đánh dấu đã xem (cả thư viện, hoặc một file vừa nhập). `files`: danh sách thư viện vừa tải (mặc định bản đã kiểm). */
export async function markLibrarySeen(app, file = null, files = state.files) {
  if (files !== state.files && files.length) state.files = files;
  const add = file ? files.filter((f) => f.file === file) : files;
  const seen = new Set([...(app.settings.librarySeen ?? []), ...add.map(fileKey)]);
  await app.setSetting('librarySeen', [...seen]);
  state.lessons = libraryNews(state.files, [...seen]);
  emit();
}

/** Bản mới đã tải xong (service worker chờ) — áp dụng; chưa tải thì nhờ tải rồi mở lại app. */
export async function applyUpdate(app) {
  const reg = app.swRegistration;
  if (reg?.waiting) {
    reg.waiting.postMessage({ type: 'SKIP_WAITING' }); // main.js tải lại trang khi bản mới nhận quyền
    return;
  }
  try {
    await reg?.update();
  } catch {
    // bỏ qua
  }
  if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  else location.reload();
}

/** Bắt đầu kiểm tra định kỳ (gọi một lần lúc mở app). */
export function startNotices(app) {
  const run = () => checkNotices(app).catch(() => {});
  setTimeout(run, 2000);
  setInterval(run, CHECK_EVERY_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') run();
  });
}
