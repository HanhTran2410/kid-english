// Các màn hình của bé: Bắt đầu, màn hình chính, danh sách bài, sticker, Bông đi ngủ (SPEC 4.1, 4.2, 4.8).

import { h, holdButton, wordVisual, toast } from '../ui.js';
import { play } from '../speech/sfx.js';
import { listLessons, getStickers } from '../db.js';
import { isLearned } from '../progress.js';
import { isBackupDue } from '../settings.js';
import { STICKERS } from '../stickers.js';
import { homeButton } from '../player/layout.js';
import { createBunny } from '../player/teacher.js';
import { MIC } from '../speech/microphone.js';
import { normalizeWord } from '../text.js';

export const PARENT_HOLD_MS = 3000;

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

function parentButton(app, { dot = false } = {}) {
  const btn = holdButton({
    label: '⚙️',
    title: 'Góc bố mẹ — nhấn giữ 3 giây',
    ms: PARENT_HOLD_MS,
    className: 'parent-hold',
    onHold: () => app.go('parent'),
    onShortTap: () => toast('Bố mẹ nhấn giữ ⚙️ 3 giây (đến khi vòng vàng đầy) để mở Góc bố mẹ.', 3500),
  });
  if (dot) btn.append(h('span.dot', { 'aria-label': 'Cần sao lưu' }));
  return h('div.parent-entry', {}, btn, h('span.parent-caption', { text: 'Bố mẹ (giữ 3 giây)' }));
}

const say = (app, text) => app.speaker.speak(text).catch(() => {});

// ---------- Bắt đầu ----------

export function startScreen(app) {
  app.root.className = 'child-screen start';
  const notes = [];
  if (isIOS() && !isStandalone()) {
    notes.push('Hãy mở app từ biểu tượng trên Màn hình chính. Mở trong Safari thì dữ liệu lưu riêng và có thể bị xóa sau 7 ngày không dùng.');
  }
  if (!app.speaker.hasEnglish) {
    notes.push('Máy chưa có giọng đọc tiếng Anh. Vào Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Anh để tải giọng.');
  }

  const btn = h('button.start-btn', {
    type: 'button',
    'aria-label': 'Bắt đầu',
    onclick: async () => {
      btn.disabled = true;
      await app.unlock();
      play('pop');
      app.go(app.timeUp ? 'sleep' : 'home');
    },
  }, h('span.start-bunny', { text: '🐰' }), h('span.start-label', { text: '▶' }));

  app.root.append(h('div.start-wrap', {}, btn));
  if (notes.length) app.root.append(h('div.start-notes', {}, ...notes.map((n) => h('p', { text: n }))));
}

// ---------- Màn hình chính ----------

export function homeScreen(app) {
  if (app.timeUp) {
    queueMicrotask(() => app.go('sleep'));
    return undefined;
  }
  app.root.className = 'child-screen home';
  const due = isBackupDue(app.settings) || Boolean(app.settings.storageFullAt);

  const big = (emoji, label, onTap, cls = '') => h(`button.home-btn${cls}`, {
    type: 'button',
    'aria-label': label,
    onclick: () => {
      play('tap');
      onTap();
    },
  }, h('span.home-emoji', { text: emoji }), h('span.home-label', { text: label }));

  const reviewBtn = big('⭐', 'Ôn tập', () => {
    if (reviewBtn.classList.contains('disabled')) say(app, "Let's learn a lesson first!");
    else app.go('review');
  }, '.review');

  const bunny = createBunny(app);
  app.root.append(
    h('header.home-top', {}, parentButton(app, { dot: due })),
    h('div.home-grid', {},
      big('📚', 'Bài học', () => app.go('lessons'), '.lessons'),
      reviewBtn,
      big('🐰', 'Học cùng Bông', () => app.go('learn'), '.learn')),
    h('div.home-bottom', {}, big('🎁', 'Sticker của bé', () => app.go('stickers'), '.stickers')),
    bunny.el,
  );

  app.db.getAll('progress').then((list) => {
    if (!list.some(isLearned)) reviewBtn.classList.add('disabled');
  });
  return () => bunny.destroy();
}

// ---------- Danh sách bài học ----------

export function lessonsScreen(app) {
  app.root.className = 'child-screen lessons';
  const grid = h('div.lesson-grid');
  const urls = [];
  app.root.append(h('header.child-top', {}, homeButton(app)), grid);

  const open = (lesson) => {
    play('tap');
    if (!lesson.resume) {
      app.go('lesson', { lessonId: lesson.id, start: 'begin' });
      return;
    }
    // Bài đang học dở: hai lựa chọn Học tiếp / Học lại (SPEC 4.2).
    const close = () => overlay.remove();
    const overlay = h('div.choice-overlay', { onclick: (e) => e.target === overlay && close() },
      h('div.choice-pair', {},
        h('button.choice-big.continue', {
          type: 'button', 'aria-label': 'Học tiếp', text: '▶️',
          onclick: () => {
            close();
            app.go('lesson', { lessonId: lesson.id, start: 'resume' });
          },
        }),
        h('button.choice-big.restart', {
          type: 'button', 'aria-label': 'Học lại', text: '🔄',
          onclick: () => {
            close();
            app.go('lesson', { lessonId: lesson.id, start: 'begin' });
          },
        })));
    app.root.append(overlay);
    say(app, 'Continue? Or start again?');
  };

  (async () => {
    const lessons = await listLessons(app.db);
    for (const lesson of lessons) {
      const images = await app.db.getAllByIndex('images', 'lessonId', lesson.id);
      const firstKey = normalizeWord(lesson.words[0]?.en ?? '');
      const cover = images.find((img) => img.word === firstKey) ?? null;
      let url = null;
      if (cover) {
        url = URL.createObjectURL(cover.blob);
        urls.push(url);
      }
      const n = lesson.timesCompleted ?? 0;
      grid.append(h('button.lesson-card', {
        type: 'button', 'aria-label': lesson.title, onclick: () => open(lesson),
      },
      wordVisual({ url, emoji: lesson.emoji, word: lesson.title }, 'cover'),
      h('span.lesson-title', { text: lesson.title }),
      h('span.lesson-stars', { text: n ? (n <= 5 ? '⭐'.repeat(n) : `⭐×${n}`) : '' }),
      lesson.resume ? h('span.resume-bar', {}, h('span', { style: { width: `${Math.round((lesson.resume.progress ?? 0) * 100)}%` } })) : null));
    }
    if (!lessons.length) grid.append(h('div.empty', { text: '📭' }));
  })();

  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}

// ---------- Bộ sưu tập sticker ----------

export function stickersScreen(app) {
  app.root.className = 'child-screen stickers';
  const grid = h('div.sticker-grid');
  const counter = h('span.sticker-count');
  app.root.append(h('header.child-top', {}, homeButton(app), counter), grid);

  getStickers(app.db).then((owned) => {
    const have = STICKERS.filter((s) => owned[s.id]).length;
    counter.textContent = `${have}/${STICKERS.length}`;
    for (const s of STICKERS) {
      const rec = owned[s.id];
      const cell = rec
        ? h('button.sticker.owned', {
          type: 'button',
          'aria-label': s.name,
          onclick: () => {
            cell.classList.remove('bounce');
            void cell.offsetWidth;
            cell.classList.add('bounce');
            play('pop');
            say(app, `${s.name.charAt(0).toUpperCase()}${s.name.slice(1)}!`);
          },
        }, h('span.sticker-emoji', { text: s.emoji }), rec.count > 1 ? h('span.sticker-times', { text: `×${rec.count}` }) : null)
        : h('div.sticker.missing', { 'aria-label': 'Chưa có' }, h('span.sticker-emoji', { text: s.emoji }), h('span.sticker-q', { text: '❓' }));
      grid.append(cell);
    }
  });
}

// ---------- Hết giờ: Bông đi ngủ (SPEC 4.6) ----------

export function sleepScreen(app) {
  app.root.className = 'child-screen sleep';
  const moon = holdButton({
    label: '🌙',
    title: 'Bố mẹ nhấn giữ 3 giây để cho học thêm 15 phút',
    ms: PARENT_HOLD_MS,
    className: 'moon-hold',
    onHold: () => {
      app.extendTime();
      app.go('home');
    },
  });
  app.root.append(
    h('header.home-top', {}, parentButton(app)),
    h('div.sleep-wrap', {}, h('div.sleep-bunny', { text: '🐰' }), h('div.sleep-z', { text: '💤' })),
    h('div.sleep-moon', {}, moon),
  );
  say(app, "I'm sleepy! Bye-bye!");
}

/** Bé có thể nói không (để Góc bố mẹ hiện hướng dẫn bật mic). */
export const micProblem = (app) => [MIC.DENIED, MIC.UNAVAILABLE, MIC.LOST].includes(app.mic.status);
