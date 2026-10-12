// Khung màn hình hoạt động của bé: nút 🏠, thanh tiến độ, vùng nội dung, Bông, nút ▶.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { createBunny } from './teacher.js';

/** Nút 🏠: bấm là về màn hình chính (chỗ đang học đã được lưu để "Học tiếp"). */
export function homeButton(app) {
  return h('button.home-btn-small', {
    type: 'button',
    'aria-label': 'Về màn hình chính',
    title: 'Về màn hình chính',
    text: '🏠',
    onclick: () => {
      play('tap');
      app.go('home');
    },
  });
}

export function activityLayout(app, extraClass = '') {
  const fill = h('div.progress-fill');
  const stage = h('main.stage');
  const bunny = createBunny(app);
  // Nút ▶ luôn hiện để sang bước tiếp ngay (bỏ qua phần đang làm).
  const nextBtn = h('button.next-btn', { type: 'button', 'aria-label': 'Tiếp', title: 'Sang bước tiếp', text: '▶' });
  // Nút 🔊: Bông đọc lại câu hỏi đang chờ bé trả lời (chỉ hiện khi có câu hỏi).
  const replayBtn = h('button.replay-btn', { type: 'button', 'aria-label': 'Nghe lại câu hỏi', title: 'Nghe lại câu hỏi', text: '🔊', hidden: true });
  app.root.className = `child-screen activity ${extraClass}`.trim();
  app.root.append(
    h('header.activity-top', {}, homeButton(app), h('div.progress', { 'aria-hidden': 'true' }, fill)),
    stage,
    bunny.el,
    replayBtn,
    nextBtn,
  );
  return {
    stage,
    bunny,
    nextBtn,
    replayBtn,
    setProgress(fraction) {
      fill.style.width = `${Math.round(fraction * 100)}%`;
    },
  };
}
