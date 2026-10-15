// Trò chơi Mặc đồ (SPEC-dressup.md): chọn bé trai / bé gái → chạm hoặc kéo đồ trong tủ vào người bạn nhỏ;
// chạm bạn nhỏ để xoay người (xem sau lưng — ba lô); bạn nhỏ nói "I'm wearing…", Bông thỉnh thoảng giao việc.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';
import { createBunny } from '../player/teacher.js';
import {
  KIDS, ITEMS, ITEM_BY_ID, WEARS_PER_REQUEST, wear, cleanOutfit, viewFor, itemIcon,
  wearSentence, takeOffSentence, requestSentence, wearVi, takeOffVi, requestVi, pickRequest, dollSvg,
} from '../dress-up.js';

const DRAG_START_PX = 8;
const CAPTION_MS = 3500;
const IDLE_PAUSE_MS = 120_000;
const TURN_MS = 180; // nửa vòng xoay (thu hẹp → đổi mặt → mở rộng)
const KID_LABEL = { boy: { emoji: '👦', en: 'Boy', vi: 'Bé trai' }, girl: { emoji: '👧', en: 'Girl', vi: 'Bé gái' } };

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const loadState = (app) => {
  const saved = app.settings.dressUp ?? {};
  return { kid: KIDS.includes(saved.kid) ? saved.kid : null, outfits: { ...(saved.outfits ?? {}) } };
};

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
  }, h('div.du-kid-doll', { html: dollSvg(kid, 'front', cleanOutfit(state.outfits[kid])) }),
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
  let view = 'front';
  let request = null;
  let lastRequest = null;
  let wears = 0;
  let press = null;
  let ghost = null;
  let turnTimer = null;

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
  const turnBtn = h('button.sp-back', {
    type: 'button', 'aria-label': 'Xoay người', text: '🔄',
    onclick: () => {
      play('tap');
      turn();
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
  const art = h('div.du-art');
  const doll = h('div.du-doll', { 'aria-label': KID_LABEL[kid].vi, dataset: { kid, view } }, art);
  const tray = h('div.sp-tray.du-tray', { 'aria-label': 'Tủ đồ' });
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), kidBtn, turnBtn, resetBtn, h('span.sp-title', { text: '👗 Dress up' }), requestCard, bongBtn),
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

  /** Vẽ lại bạn nhỏ; `pop`: món vừa mặc nảy lên. */
  function renderDoll(pop = null) {
    art.innerHTML = dollSvg(kid, view, outfit);
    doll.dataset.view = view;
    doll.setAttribute('data-worn', outfit.join(' '));
    if (pop) art.querySelector(`[data-item="${pop}"]`)?.classList.add('pop-in');
    resetBtn.hidden = !outfit.length;
    updateTray();
  }

  /** Xoay người: thu hẹp → đổi mặt → mở rộng. */
  function turn(to = view === 'front' ? 'back' : 'front', then = null) {
    clearTimeout(turnTimer);
    if (to === view) {
      then?.();
      return;
    }
    art.classList.add('flip');
    turnTimer = setTimeout(() => {
      view = to;
      renderDoll();
      art.classList.remove('flip');
      then?.();
    }, TURN_MS);
  }

  function renderTray() {
    tray.replaceChildren(...ITEMS.map((item) => {
      const btn = h('button.tray-sticker.du-cloth', {
        type: 'button', 'aria-label': capital(item.name), dataset: { item: item.id },
      }, h('span.du-icon', { html: itemIcon(item) }), h('span.du-check', { text: '✔' }));
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
    if (request) {
      requestCard.innerHTML = itemIcon(request);
      requestCard.dataset.item = request.id;
    }
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
    // Ba lô: quay lưng cho thấy; món không thấy ở mặt đang xem (kính khi quay lưng): quay lại.
    const show = viewFor(item, view);
    if (show !== view) turn(show, () => art.querySelector(`[data-item="${id}"]`)?.classList.add('pop-in'));
    else renderDoll(id);
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
    renderDoll();
    talk([[takeOffSentence(item), takeOffVi(item)]]);
  }

  function undressAll() {
    outfit = [];
    request = null;
    lastRequest = null;
    wears = 0;
    play('whoosh');
    save();
    renderDoll();
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

  // Chạm bạn nhỏ: xoay người. Bắt đầu kéo trên một món đang mặc: kéo món đó ra để cởi.
  doll.addEventListener('pointerdown', (e) => {
    const id = e.target.closest?.('[data-item]')?.dataset.item ?? null;
    beginPress(e, { kind: 'doll', id });
  });

  const onDoll = (cx, cy) => {
    const r = doll.getBoundingClientRect();
    return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
  };

  function startDrag(e) {
    if (press.kind === 'doll' && !press.id) {
      press = null; // kéo trên người (không trúng món nào): bỏ qua
      return;
    }
    press.dragging = true;
    if (press.kind === 'doll') art.querySelector(`[data-item="${press.id}"]`)?.classList.add('lifted');
    play('tap');
    const size = Math.min(150, doll.getBoundingClientRect().width * 0.6);
    ghost = h('div.drag-ghost.du-ghost', { html: itemIcon(ITEM_BY_ID.get(press.id)), style: { width: `${size}px`, height: `${size}px` } });
    document.body.append(ghost);
    moveGhost(e);
  }
  function moveGhost(e) {
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    doll.classList.toggle('drop-here', press?.kind === 'tray' && onDoll(e.clientX, e.clientY));
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
      if (!press) return;
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
      else if (p.kind === 'doll' && !inside) takeOff(p.id);
      else renderDoll(); // thả lại chỗ cũ: không đổi gì
      return;
    }
    if (p.kind === 'tray') {
      // Chạm món trong tủ: mặc ngay (đang mặc rồi thì nói lại câu).
      if (outfit.includes(p.id)) talk([[wearSentence(ITEM_BY_ID.get(p.id)), wearVi(ITEM_BY_ID.get(p.id))]]);
      else putOn(p.id);
    } else {
      play('whoosh');
      turn();
      talk([['Turn around!', view === 'front' ? 'Quay lưng lại nào!' : 'Quay lại nào!']]);
    }
  }, { signal });

  window.addEventListener('pointercancel', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    press = null;
    endDrag();
    renderDoll();
  }, { signal });

  const idleTimer = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  renderTray();
  renderDoll();
  save();
  talk([["Let's get dressed!", 'Mình mặc đồ nhé!']]);

  return () => {
    clearInterval(idleTimer);
    clearTimeout(captionTimer);
    clearTimeout(turnTimer);
    endDrag();
    bunny.destroy();
  };
}
