// Góc trò chơi (nút 🎲 Play, SPEC-scenes mục 11): mỗi trò một thẻ to — Dán tranh, Mặc đồ, Tô màu, Cho Bông ăn, Chọn từ (trò tổng hợp).
// Trò Chọn số đã có ở mục Số đếm nên không nhắc lại ở đây.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';

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
    card('👗', 'Dress up', 'Mặc đồ', '.game-dress', () => app.go('dress-up')),
    card('🖍️', 'Coloring', 'Tô màu', '.game-color', () => app.go('coloring')),
    card('🍌', 'Feed Bông', 'Cho Bông ăn', '.game-feed', () => app.go('feed')),
    card('🎲', 'Pick it', 'Chọn từ', '.game-mix', () => app.go('play-mix')),
  );
  app.speaker.speak("Let's play a game!").catch(() => {});
}
