// Trò chơi Mặc đồ (SPEC-dressup.md): chọn bé trai / bé gái → chạm hoặc kéo đồ trong tủ vào người bạn nhỏ;
// bạn nhỏ nói "I'm wearing…", Bông thỉnh thoảng giao việc ("It's cold! Put on your scarf!").

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';
import { createBunny } from '../player/teacher.js';
import {
  KIDS, ITEMS, ITEM_BY_ID, WEARS_PER_REQUEST, itemBoxes, wear, cleanOutfit, layerOrder,
  wearSentence, takeOffSentence, requestSentence, wearVi, takeOffVi, requestVi, pickRequest, dollSvg,
} from '../dress-up.js';

const DRAG_START_PX = 8;
const CAPTION_MS = 3500;
const IDLE_PAUSE_MS = 120_000;
const KID_LABEL = { boy: { emoji: '👦', en: 'Boy', vi: 'Bé trai' }, girl: { emoji: '👧', en: 'Girl', vi: 'Bé gái' } };

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const loadState = (app) => {
  const saved = app.settings.dressUp ?? {};
  return { kid: KIDS.includes(saved.kid) ? saved.kid : null, outfits: { ...(saved.outfits ?? {}) } };
};

/** Món đồ vẽ bằng emoji kéo giãn vừa khung (SVG để giãn được cả chiều ngang lẫn dọc). */
function itemArt(item) {
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><text x="50" y="54" font-size="92" text-anchor="middle" dominant-baseline="central">${item.emoji}</text></svg>`;
}

// ---------- Chọn bé ----------

export function dressUpChooser(app) {
  app.root.className = 'child-screen du-choose';
  const state = loadState(app);
  const btn = (kid) => h(`button.du-kid${state.kid === kid ? '.last' : ''}`, {
    type: 'button',
    'aria-label': KID_LABEL[kid].vi,
    onclick: () => {
      play('tap');
      app.go('dress-up-play', { kid });
    },
  }, h('div.du-kid-doll', { html: dollSvg(kid) }),
  h('span.home-text', {}, h('span.home-en', { text: KID_LABEL[kid].en }), h('span.home-vi', { text: KID_LABEL[kid].vi })));
  const back = h('button.sp-back', {
    type: 'button', 'aria-label': 'Về trò chơi', text: '🎲',
    onclick: () => {
      play('tap');
      app.go('play');
    },
  });
  app.root.append(h('header.child-top', {}, homeButton(app), back), h('div.du-kids', {}, btn('boy'), btn('girl')));
  app.speaker.speak('Who do you want to dress?').catch(() => {});
}

// ---------- Mặc đồ ----------

export function dressUpScreen(app, params = {}) {
  const signal = app.startActivity();
  app.root.className = 'child-screen du-play';
  const state = loadState(app);
  const kid = KIDS.includes(params.kid) ? params.kid : (state.kid ?? 'girl');
  let outfit = cleanOutfit(state.outfits[kid]);
  let request = null;
  let lastRequest = null;
  let wears = 0;
  let press = null;
  let ghost = null;

  // ---------- Giao diện ----------
  const bunny = createBunny(app);
  const bongBtn = h('button.sp-bong', {
    type: 'button',
    'aria-label': 'Bông giao việc',
    onclick: () => {
      play('tap');
      giveRequest();
    },
  }, bunny.el);
  const requestCard = h('button.sp-request', {
    type: 'button',
    'aria-label': 'Nghe lại việc',
    hidden: true,
    onclick: () => {
      play('tap');
      if (request) {
        showWanted();
        talk([[requestSentence(request), requestVi(request)]]);
      }
    },
  });
  const kidBtn = h('button.sp-back', {
    type: 'button', 'aria-label': 'Đổi bé', text: KID_LABEL[kid].emoji,
    onclick: () => {
      play('tap');
      app.go('dress-up');
    },
  });
  const resetBtn = h('button.sp-back', {
    type: 'button',
    'aria-label': 'Cởi hết',
    text: '🧹',
    hidden: true,
    onclick: () => {
      play('tap');
      const close = () => overlay.remove();
      const overlay = h('div.choice-overlay', { onclick: (e) => e.target === overlay && close() },
        h('div.choice-pair', {},
          h('button.choice-big.restart', {
            type: 'button', 'aria-label': 'Cởi hết đồ', text: '✔',
            onclick: () => {
              close();
              undressAll();
            },
          }),
          h('button.choice-big.continue', { type: 'button', 'aria-label': 'Không cởi', text: '✖', onclick: close })));
      app.root.append(overlay);
      talk([['Take off everything?', 'Cởi hết đồ ra nhé?']]);
    },
  });
  const worn = h('div.du-worn-layer');
  const doll = h('div.du-doll', { 'aria-label': KID_LABEL[kid].vi, dataset: { kid } }, h('div.du-body', { html: dollSvg(kid) }), worn);
  const tray = h('div.sp-tray.du-tray', { 'aria-label': 'Tủ đồ' });
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), kidBtn, resetBtn, h('span.sp-title', { text: '👗 Dress up' }), requestCard, bongBtn),
    h('div.du-stage', {}, doll),
    tray,
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
  const requestLine = (item) => [requestSentence(item), requestVi(item)];

  // ---------- Vẽ ----------
  function save() {
    state.kid = kid;
    state.outfits[kid] = outfit;
    app.setSetting('dressUp', { kid, outfits: { ...state.outfits } }).catch(() => {});
  }

  function renderWorn() {
    worn.replaceChildren(...layerOrder(outfit).flatMap((id) => {
      const item = ITEM_BY_ID.get(id);
      return itemBoxes(item).map((b) => {
        const el = h(`button.du-piece${b.mirror ? '.mirror' : ''}`, {
          type: 'button',
          'aria-label': capital(item.name),
          dataset: { item: id, slot: item.slot },
          style: { left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` },
          html: itemArt(item),
        });
        el.addEventListener('pointerdown', (e) => beginPress(e, { kind: 'worn', id, el }));
        return el;
      });
    }));
    resetBtn.hidden = !outfit.length;
    updateTray();
  }

  function renderTray() {
    tray.replaceChildren(...ITEMS.map((item) => {
      const btn = h('button.tray-sticker.du-cloth', {
        type: 'button', 'aria-label': capital(item.name), dataset: { item: item.id },
      }, h('span.tray-emoji', { text: item.emoji }), h('span.du-check', { text: '✔' }));
      btn.addEventListener('pointerdown', (e) => beginPress(e, { kind: 'tray', id: item.id }));
      return btn;
    }));
    updateTray();
  }

  function updateTray() {
    [...tray.children].forEach((btn, i) => {
      btn.classList.toggle('on', outfit.includes(btn.dataset.item));
      btn.classList.toggle('wanted', Boolean(request) && btn.dataset.item === request.id);
      btn.classList.toggle('hint', i === 0 && !outfit.length);
    });
    requestCard.hidden = !request;
    if (request) requestCard.textContent = request.emoji;
    if (request) requestCard.dataset.item = request.id;
  }

  function showWanted() {
    const btn = request && tray.querySelector(`[data-item="${request.id}"]`);
    if (!btn) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }

  // ---------- Mặc, cởi, giao việc ----------
  function putOn(id) {
    const item = ITEM_BY_ID.get(id);
    outfit = wear(outfit, id).outfit;
    play('pop');
    save();
    renderWorn();
    for (const el of worn.querySelectorAll(`[data-item="${id}"]`)) el.classList.add('pop-in');
    if (request && request.id === id) {
      lastRequest = request;
      request = null;
      wears = 0;
      updateTray();
      play('cheer');
      bunny.set('clap');
      setTimeout(() => bunny.set('idle'), 1600);
      talk([[`Yay! ${wearSentence(item)}`, `Giỏi quá! ${wearVi(item)}`]]);
      return;
    }
    const lines = [[wearSentence(item), wearVi(item)]];
    wears += 1;
    if (!request && wears >= WEARS_PER_REQUEST) {
      request = pickRequest(outfit, lastRequest);
      if (request) {
        lines.push(requestLine(request));
        updateTray();
        showWanted();
      }
    }
    talk(lines);
  }

  function takeOff(id) {
    const item = ITEM_BY_ID.get(id);
    outfit = outfit.filter((o) => o !== id);
    play('whoosh');
    save();
    renderWorn();
    talk([[takeOffSentence(item), takeOffVi(item)]]);
  }

  function undressAll() {
    outfit = [];
    request = null;
    lastRequest = null;
    wears = 0;
    play('whoosh');
    save();
    renderWorn();
    talk([["Let's start again!", 'Mình mặc lại từ đầu nhé!']]);
  }

  function giveRequest() {
    if (!request) {
      request = pickRequest(outfit, lastRequest);
      wears = 0;
      updateTray();
    }
    if (!request) talk([['Great job!', 'Giỏi quá!']]);
    else {
      showWanted();
      talk([requestLine(request)]);
    }
  }

  // ---------- Chạm / kéo ----------
  function beginPress(e, target) {
    if (press || e.button > 0) return;
    e.stopPropagation();
    press = { ...target, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, dragging: false };
  }

  const onDoll = (cx, cy) => {
    const r = doll.getBoundingClientRect();
    return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
  };

  function startDrag(e) {
    press.dragging = true;
    if (press.kind === 'worn') for (const el of worn.querySelectorAll(`[data-item="${press.id}"]`)) el.classList.add('lifted');
    play('tap');
    const size = Math.min(140, doll.getBoundingClientRect().width * 0.45);
    ghost = h('div.drag-ghost', { text: ITEM_BY_ID.get(press.id).emoji, style: { fontSize: `${size}px` } });
    document.body.append(ghost);
    moveGhost(e);
  }
  function moveGhost(e) {
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    doll.classList.toggle('drop-here', onDoll(e.clientX, e.clientY));
  }
  function endDrag() {
    ghost?.remove();
    ghost = null;
    doll.classList.remove('drop-here');
  }

  window.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    if (!press.dragging) {
      if (Math.hypot(e.clientX - press.x0, e.clientY - press.y0) < DRAG_START_PX) return;
      startDrag(e);
    }
    e.preventDefault();
    moveGhost(e);
  }, { signal, passive: false });

  window.addEventListener('pointerup', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    const p = press;
    press = null;
    if (p.dragging) {
      endDrag();
      const inside = onDoll(e.clientX, e.clientY);
      if (p.kind === 'tray' && inside) putOn(p.id);
      else if (p.kind === 'worn' && !inside) takeOff(p.id);
      else renderWorn(); // thả lại chỗ cũ / ra ngoài khi kéo từ tủ: không đổi gì
      return;
    }
    if (p.kind === 'tray') {
      // Chạm món trong tủ: mặc ngay (đang mặc rồi thì nói lại câu).
      if (outfit.includes(p.id)) talk([[wearSentence(ITEM_BY_ID.get(p.id)), wearVi(ITEM_BY_ID.get(p.id))]]);
      else putOn(p.id);
    } else {
      const item = ITEM_BY_ID.get(p.id);
      for (const el of worn.querySelectorAll(`[data-item="${p.id}"]`)) {
        el.classList.remove('bounce');
        void el.offsetWidth;
        el.classList.add('bounce');
      }
      play('pop');
      talk([[wearSentence(item), wearVi(item)]]);
    }
  }, { signal });

  window.addEventListener('pointercancel', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    press = null;
    endDrag();
    renderWorn();
  }, { signal });

  const idleTimer = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  renderTray();
  renderWorn();
  save();
  talk([["Let's get dressed!", 'Mình mặc đồ nhé!']]);

  return () => {
    clearInterval(idleTimer);
    clearTimeout(captionTimer);
    endDrag();
    bunny.destroy();
  };
}
