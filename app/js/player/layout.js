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
  app.root.className = `child-screen activity ${extraClass}`.trim();
  app.root.append(
    h('header.activity-top', {}, homeButton(app), h('div.progress', { 'aria-hidden': 'true' }, fill)),
    stage,
    bunny.el,
    nextBtn,
  );
  return {
    stage,
    bunny,
    nextBtn,
    setProgress(fraction) {
      fill.style.width = `${Math.round(fraction * 100)}%`;
    },
  };
}
