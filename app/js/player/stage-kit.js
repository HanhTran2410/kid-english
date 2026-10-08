// Phần dùng chung giữa các phần của bài học.

import { scaled, abortError, isAbort } from '../timing.js';
import { play } from '../speech/sfx.js';

/**
 * Chạy một bước. Bấm ▶ thì bỏ qua bước đang làm (dừng Bông nói/nghe) và đi tiếp.
 * Rời màn hình (🏠, app bị chuyển sang nền) thì dừng hẳn.
 * @param {object} ctx có app, teacher, nextBtn; ctx.signal được đặt thành signal của bước
 * @param {AbortSignal} activitySignal
 * @param {() => Promise<void>} fn
 * @returns {Promise<boolean>} true nếu bước bị bỏ qua
 */
export async function runSkippable(ctx, activitySignal, fn) {
  const step = new AbortController();
  const stopStep = () => step.abort();
  const onNext = () => {
    play('tap');
    step.abort();
  };
  activitySignal.addEventListener('abort', stopStep, { once: true });
  ctx.nextBtn.addEventListener('click', onNext);
  ctx.nextBtn.hidden = false;
  ctx.signal = step.signal;
  ctx.teacher.signal = step.signal;
  try {
    await fn();
    return false;
  } catch (err) {
    if (!isAbort(err) || activitySignal.aborted) throw err;
    return true;
  } finally {
    activitySignal.removeEventListener('abort', stopStep);
    ctx.nextBtn.removeEventListener('click', onNext);
    ctx.signal = activitySignal;
    ctx.teacher.signal = activitySignal;
    if (step.signal.aborted && !activitySignal.aborted) {
      ctx.app.speaker.cancel();
      ctx.app.listening = false;
      ctx.teacher.bunny.set('idle');
    }
  }
}

/** Màn Hoan hô: ẩn nút ▶, dùng signal của cả hoạt động. */
export function endSkippable(ctx, activitySignal) {
  ctx.nextBtn.hidden = true;
  ctx.signal = activitySignal;
  ctx.teacher.signal = activitySignal;
}

/**
 * Chờ một chút rồi tự sang bước tiếp (SPEC 4.3 A). Chạm vào hình thì Bông đọc lại và chờ thêm.
 * (Nút ▶ do runSkippable xử lý.)
 */
export function waitAdvance(ctx, { ms = 2000, picture = null, onPicture = null } = {}) {
  const { signal, app } = ctx;
  return new Promise((resolve, reject) => {
    let timer = null;
    let busy = false;
    const cleanup = () => {
      clearTimeout(timer);
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
    picture?.addEventListener('click', onPic);
    signal.addEventListener('abort', onAbort, { once: true });
    arm();
  });
}
