// Flipbook: phát lần lượt các khung hình của một câu như phim hoạt hình (SPEC-v1.0 mục 2.3).
// Cùng giao diện với cảnh emoji (createScene): { el, motion, play(times) }.

import { h } from '../ui.js';
import { scaled } from '../timing.js';

const FRAME_MS = 700;
const LAST_FRAME_MS = 1100;

/**
 * @param {string[]} urls ảnh của từng khung, đúng thứ tự
 * @param {{ small?: boolean, label?: string, onError?: () => void }} [options]
 */
export function createFlipbook(urls, { small = false, label = '', onError = null } = {}) {
  const frames = urls.map((src) => h('img.flip-frame', { src, alt: '', draggable: 'false' }));
  let failed = false;
  for (const img of frames) {
    img.addEventListener('error', () => {
      // Khung không đọc được → báo để thay bằng cảnh emoji (một lần).
      if (!failed) {
        failed = true;
        onError?.();
      }
    }, { once: true });
  }
  const el = h('div.scene.flipbook', {
    class: small ? 'small' : '',
    role: label ? 'img' : null,
    'aria-label': label || null,
  }, ...frames);

  let timers = [];
  const show = (i) => frames.forEach((f, k) => f.classList.toggle('on', k === i));
  const stop = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  // Lúc đứng yên: khung giữa (đang làm hành động) dễ hiểu nhất.
  show(Math.min(1, frames.length - 1));

  return {
    el,
    motion: 'flipbook',
    /** Phát các khung `times` lần, dừng ở khung cuối (hành động đã xong). */
    play(times = 2) {
      stop();
      let at = 0;
      for (let t = 0; t < times; t++) {
        frames.forEach((_, k) => {
          timers.push(setTimeout(() => show(k), scaled(at)));
          at += k === frames.length - 1 ? LAST_FRAME_MS : FRAME_MS;
        });
      }
    },
    stop,
  };
}
