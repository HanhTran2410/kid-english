// Trang chọn nghề (SPEC-jobs mục 2.1): Bông hỏi "What do you want to be today?", mỗi nghề đã làm xong một thẻ to.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';

/** Các nghề đã làm (thêm nghề mới vào đây khi xong). `screen`: tên màn chơi. */
export const JOBS = [
  { id: 'doctor', emoji: '🩺', en: 'Doctor', vi: 'Bác sĩ nhí', screen: 'doctor' },
  { id: 'shop', emoji: '🛒', en: 'Shopkeeper', vi: 'Bán hàng', screen: 'shop' },
  { id: 'post', emoji: '📮', en: 'Postman', vi: 'Bưu tá', screen: 'post' },
  { id: 'teacher', emoji: '👩‍🏫', en: 'Teacher', vi: 'Cô giáo nhí', screen: 'teacher' },
];

export function jobsScreen(app) {
  app.root.className = 'child-screen bb-home jb-home';
  const back = h('button.sp-back', {
    type: 'button', 'aria-label': 'Về trò chơi', text: '🎲',
    onclick: () => {
      play('tap');
      app.go('play');
    },
  });
  const grid = h('div.bb-modes.jb-jobs');
  app.root.append(h('header.child-top', {}, homeButton(app), back), grid);
  grid.append(...JOBS.map((job) => h(`button.home-btn.bb-mode.jb-job.jb-job-${job.id}`, {
    type: 'button', 'aria-label': job.vi, dataset: { job: job.id },
    onclick: () => {
      play('tap');
      app.go(job.screen);
    },
  }, h('span.home-emoji', { text: job.emoji }), h('span.home-text', {}, h('span.home-en', { text: job.en }), h('span.home-vi', { text: job.vi })))));
  app.speaker.speak('What do you want to be today?').catch(() => {});
}
