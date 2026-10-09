// Cảnh của một câu (SPEC-v1.0 mục 2.2): Bông (SVG của app) + vật (emoji) + hiệu ứng chuyển động theo động từ.

import { h } from '../ui.js';
import { bongElement } from '../bong.js';
import { MOTIONS, effectiveMotion } from '../phrase.js';
import { MISSING_EMOJI } from '../lesson.js';

/** Emoji phụ cho từng hiệu ứng (bọt nước, bàn tay vẫy…). */
function effectLayer(motion) {
  const fx = h('div.scene-fx', { 'aria-hidden': 'true' });
  const add = (text, i = 0, cls = '') => fx.append(h(`span.fx${cls ? `.${cls}` : ''}`, { text, style: { '--i': String(i) } }));
  const overlay = MOTIONS[motion]?.overlay;
  if (motion === 'wash') for (let i = 0; i < 5; i++) add(i % 2 ? '💧' : '🫧', i, 'bubble');
  else if (motion === 'sleep') for (let i = 0; i < 3; i++) add('💤', i, 'zzz');
  else if (motion === 'go') for (let i = 0; i < 3; i++) add('👣', i, 'step');
  else if (overlay) add(overlay, 0, 'main');
  if (['open', 'clap', 'turn-on'].includes(motion)) for (let i = 0; i < 3; i++) add('✨', i, 'spark');
  return fx;
}

/**
 * @param {{ emoji?: string, motion?: string, small?: boolean, label?: string }} options
 * @returns {{ el: HTMLElement, motion: string, play: (times?: number) => void }}
 */
export function createScene({ emoji = '', motion = 'none', small = false, label = '' } = {}) {
  const hasObject = Boolean(emoji) && emoji !== MISSING_EMOJI;
  const used = effectiveMotion(motion, { hasObject });
  const el = h('div.scene', {
    class: small ? 'small' : '',
    dataset: { motion: used },
    role: label ? 'img' : null,
    'aria-label': label || null,
  },
  bongElement('scene-bong', { mood: used === 'sleep' ? 'sleep' : 'happy' }),
  hasObject ? h('div.scene-object', {}, h('span.emoji', { text: emoji })) : null,
  effectLayer(used));

  return {
    el,
    motion: used,
    /** Chạy hiệu ứng (mặc định 2 lần); gọi lại thì chạy lại từ đầu. */
    play(times = 2) {
      el.classList.remove('playing');
      el.style.setProperty('--times', String(times));
      void el.offsetWidth; // chạy lại animation
      el.classList.add('playing');
    },
  };
}
