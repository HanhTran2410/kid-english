// Góc trò chơi (nút 🎲 Play, SPEC-scenes mục 11): mỗi trò một thẻ to — Dán tranh, Chọn từ (trò tổng hợp), Chọn số.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { listLessons } from '../db.js';
import { homeButton } from '../player/layout.js';
import { NUMBER_KIND } from '../numbers.js';

export function gamesScreen(app) {
  app.root.className = 'child-screen games';
  const grid = h('div.home-grid.games-grid');
  app.root.append(h('header.child-top', {}, homeButton(app)), grid);

  const card = (icon, en, vi, cls, onTap) => h(`button.home-btn.game-btn${cls}`, {
    type: 'button',
    'aria-label': vi,
    onclick: () => {
      play('tap');
      onTap();
    },
  }, h('span.home-emoji', { text: icon }), h('span.home-text', {}, h('span.home-en', { text: en }), h('span.home-vi', { text: vi })));

  grid.append(
    card('🎨', 'Sticker Play', 'Dán tranh', '.game-scenes', () => app.go('sticker-scenes')),
    card('🎲', 'Pick it', 'Chọn từ', '.game-mix', () => app.go('play-mix')),
  );
  // Trò chơi số có sẵn (Chọn số 1–10, 11–20): mở thẳng trò chơi.
  listLessons(app.db).then((lessons) => {
    for (const lesson of lessons.filter((l) => l.kind === NUMBER_KIND && l.mode === 'game').reverse()) {
      grid.append(card(lesson.emoji || '🎯', lesson.title, lesson.titleVi || lesson.title, '.game-number',
        () => app.go('number-lesson', { lessonId: lesson.id, start: 'begin' })));
    }
  });
  app.speaker.speak("Let's play a game!").catch(() => {});
}
