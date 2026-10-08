// Khung màn hình hoạt động của bé: nút 🏠 (nhấn giữ), thanh tiến độ, vùng nội dung, Bông, nút ▶.

import { h, holdButton } from '../ui.js';
import { createBunny } from './teacher.js';

export const HOME_HOLD_MS = 1500;

export function homeHoldButton(app) {
  return holdButton({
    label: '🏠',
    title: 'Giữ để về màn hình chính',
    ms: HOME_HOLD_MS,
    className: 'home-hold',
    onHold: () => app.go('home'),
  });
}

export function activityLayout(app, extraClass = '') {
  const fill = h('div.progress-fill');
  const stage = h('main.stage');
  const bunny = createBunny(app);
  const nextBtn = h('button.next-btn', { type: 'button', 'aria-label': 'Tiếp', text: '▶', hidden: true });
  app.root.className = `child-screen activity ${extraClass}`.trim();
  app.root.append(
    h('header.activity-top', {}, homeHoldButton(app), h('div.progress', { 'aria-hidden': 'true' }, fill)),
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
