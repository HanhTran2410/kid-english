// Trò Tô màu (SPEC-coloring.md): chọn nhóm (con vật / đồ vật / số / chữ cái) → chọn hình → chọn màu, chạm phần hình để tô.
// Bông giao việc "Color the wings pink!"; tô đúng thì hoan hô và giao việc tiếp.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';
import { createBunny } from '../player/teacher.js';
import {
  COLORS, COLOR_BY_ID, GROUPS, PICTURES, PICTURE_BY_ID, picturesIn, cleanColors, isComplete, pickRequest, applyColor, pictureSvg, paintPart,
  introSentence, pickSentence, requestSentence, nextRequestSentence, paintedSentence, trySentence, doneSentence, FREE_LINE, RESET_LINE,
} from '../coloring.js';

const CAPTION_MS = 3500;
const IDLE_PAUSE_MS = 120_000;
const BLINK_MS = 2400;

const savedAll = (app) => (app.settings.coloring && typeof app.settings.coloring === 'object' ? app.settings.coloring : {});

// ---------- Chọn hình ----------

export function coloringChooser(app, params = {}) {
  app.root.className = 'child-screen cl-choose';
  let group = GROUPS.some((g) => g.id === params.group) ? params.group
    : (GROUPS.some((g) => g.id === app.settings.coloringGroup) ? app.settings.coloringGroup : GROUPS[0].id);
  const back = h('button.sp-back', {
    type: 'button', 'aria-label': 'Về trò chơi', text: '🎲',
    onclick: () => {
      play('tap');
      app.go('play');
    },
  });
  const tabs = h('div.cl-tabs', { role: 'tablist' });
  const cards = h('div.cl-cards');
  app.root.append(h('header.child-top', {}, homeButton(app), back), tabs, cards);

  function render() {
    tabs.replaceChildren(...GROUPS.map((g) => h(`button.cl-tab${g.id === group ? '.on' : ''}`, {
      type: 'button', role: 'tab', 'aria-selected': String(g.id === group), 'aria-label': g.vi, dataset: { group: g.id },
      onclick: () => {
        if (g.id === group) return;
        play('tap');
        group = g.id;
        app.setSetting('coloringGroup', group).catch(() => {});
        render();
        app.speaker.speak(`${g.en}!`).catch(() => {});
      },
    }, h('span.cl-tab-emoji', { text: g.emoji }), h('span.cl-tab-text', {}, h('span.home-en', { text: g.en }), h('span.home-vi', { text: g.vi })))));
    const all = savedAll(app);
    cards.replaceChildren(...picturesIn(group).map((pic) => {
      const colors = cleanColors(pic, all[pic.id]);
      const label = pic.vi.charAt(0).toUpperCase() + pic.vi.slice(1);
      return h('button.cl-card', {
        type: 'button', 'aria-label': label, dataset: { pic: pic.id },
        onclick: () => {
          play('tap');
          app.go('coloring-play', { id: pic.id });
        },
      },
      h('span.cl-thumb', { html: pictureSvg(pic, colors) }),
      isComplete(pic, colors) ? h('span.cl-done', { text: '✨' }) : null,
      pic.group === 'numbers' || pic.group === 'letters' ? null
        : h('span.cl-card-text', {}, h('span.cl-card-en', { text: pic.en }), h('span.cl-card-vi', { text: pic.vi })));
    }));
  }
  render();
  app.speaker.speak("Let's color!").catch(() => {});
}

// ---------- Tô màu ----------

export function coloringScreen(app, params = {}) {
  const signal = app.startActivity();
  app.root.className = 'child-screen cl-play';
  const pic = PICTURE_BY_ID.get(params.id) ?? PICTURES[0];
  let colors = cleanColors(pic, savedAll(app)[pic.id]);
  let selected = COLOR_BY_ID.has(app.settings.coloringColor) ? app.settings.coloringColor : 'red';
  let request = null;
  const asked = new Set();
  let celebrated = isComplete(pic, colors); // đã tô xong từ trước: không hoan hô lại khi mở
  let hinted = false;

  // ---------- Giao diện ----------
  const bunny = createBunny(app);
  const bongBtn = h('button.sp-bong', {
    type: 'button', 'aria-label': 'Bông giao việc',
    onclick: () => {
      play('tap');
      newRequest();
    },
  }, bunny.el);
  const requestCard = h('button.sp-request.cl-request', {
    type: 'button', 'aria-label': 'Nghe lại việc', hidden: true, text: '🖌️',
    onclick: () => {
      play('tap');
      if (!request) return;
      blink(request.part.id);
      talk([requestSentence(request.part, request.color)]);
    },
  });
  const back = h('button.sp-back', {
    type: 'button', 'aria-label': 'Chọn hình khác', text: '🖍️',
    onclick: () => {
      play('tap');
      app.go('coloring', { group: pic.group });
    },
  });
  const resetBtn = h('button.sp-back', {
    type: 'button', 'aria-label': 'Tô lại', text: '🧹', hidden: !Object.keys(colors).length,
    onclick: () => {
      play('tap');
      const close = () => overlay.remove();
      const overlay = h('div.choice-overlay', { onclick: (e) => e.target === overlay && close() },
        h('div.choice-pair', {},
          h('button.choice-big.restart', {
            type: 'button', 'aria-label': 'Xóa hết màu', text: '✔',
            onclick: () => {
              close();
              resetAll();
            },
          }),
          h('button.choice-big.continue', { type: 'button', 'aria-label': 'Không xóa', text: '✖', onclick: close })));
      app.root.append(overlay);
      talk([['Start again?', 'Tô lại từ đầu nhé?']]);
    },
  });
  const paper = h('div.cl-paper', { dataset: { pic: pic.id } });
  const palette = h('div.cl-palette', { role: 'radiogroup', 'aria-label': 'Hộp màu' });
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), back, resetBtn,
      h('span.sp-title', { text: `🖍️ ${pic.en.charAt(0).toUpperCase()}${pic.en.slice(1)}` }), requestCard, bongBtn),
    h('div.cl-stage', {}, paper),
    palette,
  );

  // ---------- Nói + phụ đề ----------
  let talkGen = 0;
  let captionEl = null;
  let captionTimer = null;
  function caption(en, vi) {
    clearTimeout(captionTimer);
    captionEl?.remove();
    captionEl = h('div.caption.sp-caption', { 'aria-live': 'polite' },
      h('span.caption-en', { text: en }), vi ? h('span.caption-vi', { text: vi }) : null);
    app.root.append(captionEl);
  }
  async function talk(lines) {
    const gen = ++talkGen;
    for (const [en, vi] of lines) {
      if (gen !== talkGen || signal.aborted) return;
      caption(en, vi);
      try {
        await app.speaker.speak(en, { signal });
      } catch {
        return;
      }
    }
    if (gen === talkGen) captionTimer = setTimeout(() => captionEl?.remove(), CAPTION_MS);
  }

  // ---------- Vẽ ----------
  const partEl = (id) => paper.querySelector(`[data-part="${id}"]`);

  function renderPaper() {
    paper.innerHTML = pictureSvg(pic, colors);
  }

  function renderPalette() {
    palette.replaceChildren(...COLORS.map((c) => h(`button.cl-swatch${c.id === selected ? '.on' : ''}`, {
      type: 'button', role: 'radio', 'aria-checked': String(c.id === selected), 'aria-label': `Màu ${c.vi}`,
      dataset: { color: c.id }, style: { '--c': c.hex },
      onclick: () => pick(c.id),
    })));
    updateHints();
  }

  function updateHints() {
    for (const btn of palette.children) btn.classList.toggle('wanted', hinted && request?.color.id === btn.dataset.color);
    requestCard.hidden = !request;
    requestCard.dataset.wantPart = request?.part.id ?? '';
    requestCard.dataset.wantColor = request?.color.id ?? '';
    resetBtn.hidden = !Object.keys(colors).length;
  }

  let blinkTimer = null;
  function blink(id) {
    clearTimeout(blinkTimer);
    paper.querySelectorAll('.cl-wanted').forEach((el) => el.classList.remove('cl-wanted'));
    const el = partEl(id);
    if (!el) return;
    el.classList.add('cl-wanted');
    blinkTimer = setTimeout(() => el.classList.remove('cl-wanted'), BLINK_MS);
  }

  function save() {
    app.setSetting('coloring', { ...savedAll(app), [pic.id]: { ...colors } }).catch(() => {});
  }

  // ---------- Chọn màu, tô, giao việc ----------
  function pick(id) {
    play('tap');
    selected = id;
    app.setSetting('coloringColor', id).catch(() => {});
    for (const btn of palette.children) {
      const on = btn.dataset.color === id;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-checked', String(on));
    }
    talk([pickSentence(COLOR_BY_ID.get(id))]);
  }

  function paint(partId) {
    const p = pic.parts.find((x) => x.id === partId);
    const el = partEl(partId);
    if (!p || !el) return;
    const color = COLOR_BY_ID.get(selected);
    colors = applyColor(colors, partId, selected);
    paintPart(el, p, selected);
    el.classList.remove('cl-pop', 'cl-wanted');
    void el.getBoundingClientRect();
    el.classList.add('cl-pop');
    play('pop');
    save();

    const lines = [];
    const said = paintedSentence(p, color);
    const done = request && request.part.id === partId && request.color.id === selected;
    if (done) {
      play('cheer');
      bunny.set('clap');
      setTimeout(() => bunny.set('idle'), 1600);
      lines.push([`Yay! ${said[0]}`, `Giỏi quá! ${said[1]}`]);
      asked.add(partId);
      request = pickRequest(pic, colors, asked);
      hinted = false;
    } else {
      lines.push(said);
      if (request && request.part.id === partId) {
        hinted = true; // đúng phần, khác màu: giờ mới gợi ý màu cần tìm
        lines.push(trySentence(request.color));
      }
    }
    if (!celebrated && isComplete(pic, colors)) {
      celebrated = true;
      setTimeout(() => play('tada'), 500);
      paper.classList.add('cl-celebrate');
      setTimeout(() => paper.classList.remove('cl-celebrate'), 2000);
      lines.push(doneSentence(pic));
      if (!request) lines.push(FREE_LINE);
    }
    if (done) {
      if (request) {
        lines.push(nextRequestSentence(request.part, request.color));
        setTimeout(() => request && blink(request.part.id), 600);
      } else if (!lines.includes(FREE_LINE)) lines.push(FREE_LINE);
    }
    updateHints();
    talk(lines);
  }

  /** Việc mới (chạm Bông): giao hết rồi thì giao lại từ đầu. */
  function newRequest() {
    const current = request?.part.id;
    if (current) asked.add(current);
    request = pickRequest(pic, colors, asked);
    if (!request) {
      asked.clear();
      // Giao lại từ đầu, tránh đúng phần vừa giao (hình chỉ có một phần thì đành giao lại phần đó).
      request = pickRequest(pic, colors, new Set(current ? [current] : [])) ?? pickRequest(pic, colors, asked);
    }
    hinted = false;
    updateHints();
    if (!request) return talk([FREE_LINE]);
    blink(request.part.id);
    return talk([requestSentence(request.part, request.color)]);
  }

  function resetAll() {
    colors = {};
    asked.clear();
    celebrated = false;
    hinted = false;
    play('whoosh');
    save();
    renderPaper();
    request = pickRequest(pic, colors, asked);
    updateHints();
    talk([RESET_LINE, ...(request ? [requestSentence(request.part, request.color)] : [])]);
  }

  paper.addEventListener('click', (e) => {
    const el = e.target.closest?.('[data-part]');
    if (el) paint(el.dataset.part);
  }, { signal });

  const idleTimer = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  renderPaper();
  renderPalette();
  request = pickRequest(pic, colors, asked);
  updateHints();
  talk([introSentence(pic), request ? requestSentence(request.part, request.color) : FREE_LINE]);
  if (request) setTimeout(() => !signal.aborted && request && blink(request.part.id), 800);

  return () => {
    clearInterval(idleTimer);
    clearTimeout(captionTimer);
    clearTimeout(blinkTimer);
    bunny.destroy();
  };
}
