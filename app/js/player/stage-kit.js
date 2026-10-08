// Phần dùng chung giữa các phần của bài học.

import { scaled, abortError, isAbort } from '../timing.js';

/**
 * Chờ để sang bước tiếp: tự sang sau `ms` (SPEC 4.3 A), nút ▶️ để sang ngay,
 * chạm vào hình thì Bông đọc lại và chờ thêm.
 */
export function waitAdvance(ctx, { ms = 2000, picture = null, onPicture = null } = {}) {
  const { nextBtn, signal, app } = ctx;
  return new Promise((resolve, reject) => {
    let timer = null;
    let busy = false;
    const cleanup = () => {
      clearTimeout(timer);
      nextBtn.hidden = true;
      nextBtn.removeEventListener('click', onNext);
      picture?.removeEventListener('click', onPic);
      signal.removeEventListener('abort', onAbort);
    };
    const finish = () => {
      cleanup();
      resolve();
    };
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(finish, scaled(ms));
    };
    const onNext = () => {
      if (!app.speaker.speaking) finish();
    };
    const onPic = async () => {
      if (busy || app.speaker.speaking || !onPicture) return;
      busy = true;
      clearTimeout(timer);
      try {
        await onPicture();
      } catch (err) {
        if (isAbort(err)) return;
      } finally {
        busy = false;
      }
      arm();
    };
    const onAbort = () => {
      cleanup();
      reject(abortError());
    };
    nextBtn.hidden = false;
    nextBtn.addEventListener('click', onNext);
    picture?.addEventListener('click', onPic);
    signal.addEventListener('abort', onAbort, { once: true });
    arm();
  });
}
