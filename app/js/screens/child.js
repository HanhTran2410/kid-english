// Các màn hình của bé: Bắt đầu, màn hình chính, danh sách bài, sticker, Bông đi ngủ (SPEC 4.1, 4.2, 4.8).

import { h, holdButton, wordVisual, toast } from '../ui.js';
import { play } from '../speech/sfx.js';
import { listLessons, getStickers, mediaBlob } from '../db.js';
import { isLearned, wordRecords } from '../progress.js';
import { isBackupDue } from '../settings.js';
import { STICKERS } from '../stickers.js';
import { homeButton } from '../player/layout.js';
import { createBunny } from '../player/teacher.js';
import { MIC } from '../speech/microphone.js';
import { normalizeWord } from '../text.js';
import { groupByTopic } from '../lesson.js';
import { lessonKind, PHRASE_KIND, WORDS_KIND } from '../phrase.js';

const ALL = '__all__';
import { bongElement } from '../bong.js';

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

/** Tên nhân vật bố mẹ đặt trong Cài đặt (mặc định Bông). */
export const characterName = (app) => String(app.settings?.characterName ?? '').trim() || 'Bông';

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
  }, bongElement('start-bunny'), h('span.start-label', { text: '▶' }));

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

  // icon: emoji hoặc phần tử (Bông); en: chữ to; vi: chữ nhỏ bên dưới (cũng là tên nút cho trình đọc màn hình).
  const big = (icon, en, vi, onTap, cls = '') => h(`button.home-btn${cls}`, {
    type: 'button',
    'aria-label': vi,
    onclick: () => {
      play('tap');
      onTap();
    },
  },
  typeof icon === 'string' ? h('span.home-emoji', { text: icon }) : icon,
  h('span.home-text', {}, h('span.home-en', { text: en }), h('span.home-vi', { text: vi })));

  const reviewBtn = big('⭐', 'Review', 'Ôn tập', () => {
    if (reviewBtn.classList.contains('disabled')) say(app, "Let's learn a lesson first!");
    else app.go('review');
  }, '.review');

  const bunny = createBunny(app);
  app.root.append(
    h('header.home-top', {}, parentButton(app, { dot: due })),
    h('div.home-grid', {},
      big('📚', 'Lessons', 'Bài học', () => app.go('lessons'), '.lessons'),
      big('💬', 'Phrases', 'Câu nói', () => app.go('phrases'), '.phrases'),
      reviewBtn,
      big(bongElement('home-bong'), `Learn with ${characterName(app)}`, `Học cùng ${characterName(app)}`, () => app.go('learn'), '.learn')),
    h('div.home-bottom', {}, big('🎁', 'My Stickers', 'Sticker của bé', () => app.go('stickers'), '.stickers')),
    bunny.el,
  );

  app.db.getAll('progress').then((list) => {
    if (!wordRecords(list).some(isLearned)) reviewBtn.classList.add('disabled');
  });
  return () => bunny.destroy();
}

// ---------- Danh sách bài học ----------

/**
 * Danh sách bài của bé: bài từ vựng (mặc định) hoặc bài câu (`kind: 'phrases'`, SPEC-v1.0 mục 6.2).
 */
export function lessonsScreen(app, { kind = WORDS_KIND } = {}) {
  const playScreen = kind === PHRASE_KIND ? 'phrase-lesson' : 'lesson';
  app.lessonTabs ??= {};
  app.root.className = `child-screen lessons ${kind}`;
  const grid = h('div.lesson-grid');
  const urls = [];
  app.root.append(h('header.child-top', {}, homeButton(app)), grid);

  const open = (lesson) => {
    play('tap');
    if (!lesson.resume) {
      app.go(playScreen, { lessonId: lesson.id, start: 'begin' });
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
            app.go(playScreen, { lessonId: lesson.id, start: 'resume' });
          },
        }),
        h('button.choice-big.restart', {
          type: 'button', 'aria-label': 'Học lại', text: '🔄',
          onclick: () => {
            close();
            app.go(playScreen, { lessonId: lesson.id, start: 'begin' });
          },
        })));
    app.root.append(overlay);
    say(app, 'Continue? Or start again?');
  };

  const tabs = h('nav.topic-tabs', { 'aria-label': 'Chủ đề' });
  grid.before(tabs);

  const card = async (lesson) => {
    const items = lesson.words ?? lesson.phrases ?? [];
    let cover = null;
    if (lesson.words) {
      const images = await app.db.getAllByIndex('images', 'lessonId', lesson.id);
      const firstKey = normalizeWord(lesson.words[0]?.en ?? '');
      cover = images.find((img) => img.word === firstKey) ?? null;
    }
    let url = null;
    if (cover) {
      url = URL.createObjectURL(mediaBlob(cover));
      urls.push(url);
    }
    const n = lesson.timesCompleted ?? 0;
    return h('button.lesson-card', {
      type: 'button', 'aria-label': lesson.title, onclick: () => open(lesson),
    },
    wordVisual({ url, emoji: lesson.emoji, word: lesson.title }, 'cover'),
    h('span.lesson-title', { text: lesson.title }),
    // Hàng emoji các từ trong bài: bé chưa biết đọc vẫn phân biệt được "Animals" và "Animals 2".
    h('span.lesson-words', { text: items.slice(0, 4).map((w) => w.emoji).join('') }),
    h('span.lesson-stars', { text: n ? (n <= 5 ? '⭐'.repeat(n) : `⭐×${n}`) : '' }),
    lesson.resume ? h('span.resume-bar', {}, h('span', { style: { width: `${Math.round((lesson.resume.progress ?? 0) * 100)}%` } })) : null);
  };

  (async () => {
    const lessons = (await listLessons(app.db)).filter((l) => lessonKind(l) === kind);
    if (!lessons.length) {
      grid.append(h('div.empty', { text: '📭' }));
      return;
    }
    const cards = new Map();
    for (const l of lessons) cards.set(l.id, await card(l));
    const groups = groupByTopic(lessons);

    const show = (topic) => {
      app.lessonTabs[kind] = topic;
      for (const t of tabs.children) t.classList.toggle('active', t.dataset.topic === topic);
      const visible = topic === ALL ? lessons : groups.find((g) => g.topic === topic)?.lessons ?? lessons;
      grid.replaceChildren(...visible.map((l) => cards.get(l.id)));
    };
    const tab = (topic, emoji, label) => h('button.topic-tab', {
      type: 'button',
      dataset: { topic },
      onclick: () => {
        play('tap');
        show(topic);
        tabs.querySelector('.active')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      },
    }, h('span.topic-emoji', { text: emoji }), h('span', { text: label }));

    // Chỉ hiện tab khi có từ 2 chủ đề; chỉ có tab cho chủ đề đã có bài; nhiều thì vuốt ngang.
    if (groups.length >= 2) {
      tabs.append(tab(ALL, '⭐', 'All'), ...groups.map((g) => tab(g.topic, g.emoji, g.topic)));
    } else {
      tabs.hidden = true;
    }
    const saved = app.lessonTabs[kind];
    const remembered = saved && groups.some((g) => g.topic === saved) ? saved : ALL;
    show(groups.length >= 2 ? remembered : ALL);
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
        },
        h('span.sticker-emoji', { text: s.emoji }),
        h('span.sticker-name', { text: s.name.charAt(0).toUpperCase() + s.name.slice(1) }),
        rec.count > 1 ? h('span.sticker-times', { text: `×${rec.count}` }) : null)
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
    h('div.sleep-wrap', {}, bongElement('sleep-bunny', { mood: 'sleep' }), h('div.sleep-z', { text: '💤' })),
    h('div.sleep-moon', {}, moon),
  );
  say(app, "I'm sleepy! Bye-bye!");
}

/** Bé có thể nói không (để Góc bố mẹ hiện hướng dẫn bật mic). */
export const micProblem = (app) => [MIC.DENIED, MIC.UNAVAILABLE, MIC.LOST].includes(app.mic.status);
