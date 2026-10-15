// Màn Dán tranh (SPEC-scenes.md): bé kéo sticker vào tranh, Bông nói câu có giới từ và thỉnh thoảng giao việc.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { getStickers } from '../db.js';
import { STICKER_BY_ID } from '../stickers.js';
import { homeButton } from '../player/layout.js';
import { createBunny } from '../player/teacher.js';
import {
  SCENES, SCENE_BY_ID, MAX_PER_SCENE, DROPS_PER_REQUEST,
  zoneAt, zoneBox, placedSentence, requestSentence, ownedStickers, remaining, cleanPlacements, pickRequest,
} from '../sticker-scenes.js';

const DRAG_START_PX = 8; // dịch ngón tay quá chừng này thì là kéo, không phải chạm
const STICKER_SIZE = 0.1; // cỡ sticker trong tranh: 10% chiều rộng tranh (khớp 10cqw trong CSS)
const CAPTION_MS = 3500;
const IDLE_PAUSE_MS = 120_000; // 2 phút không chạm → không tính giờ (SPEC mục 4.9)

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const round1 = (n) => Math.round(n * 10) / 10;

export function stickerSceneScreen(app, params = {}) {
  const signal = app.startActivity();
  app.root.className = 'child-screen sp-play';
  const state = { ...(app.settings.stickerScenes ?? {}) };
  let scene = SCENE_BY_ID.get(params.scene) ?? SCENE_BY_ID.get(state.last) ?? SCENES[0];
  let owned = {};
  let placed = []; // [{ s, x, y }] của tranh đang mở
  let selected = null; // sticker đang chọn trong khay (chạm sticker → chạm chỗ trong tranh)
  let request = null; // việc Bông giao: { sticker, zone }
  let lastRequest = null;
  let freeDrops = 0;
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
      if (request) talk([requestLine(request)]);
    },
  });
  const tabs = h('nav.sp-tabs', { 'aria-label': 'Tranh' }, ...SCENES.map((s) => h('button.sp-tab', {
    type: 'button',
    'aria-label': s.vi,
    dataset: { scene: s.id },
    text: s.emoji,
    onclick: () => {
      play('tap');
      if (s !== scene) openScene(s);
    },
  })));
  const albumBtn = h('button.sp-album', {
    type: 'button',
    'aria-label': 'Album sticker',
    text: '🎁',
    onclick: () => {
      play('tap');
      app.go('stickers');
    },
  });
  const art = h('div.sp-art', { 'aria-hidden': 'true' });
  const layer = h('div.sp-layer');
  const sceneEl = h('div.sp-scene', {}, art, layer);
  const tray = h('div.sp-tray', { 'aria-label': 'Khay sticker' });
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), albumBtn, tabs, requestCard, bongBtn),
    h('div.sp-wrap', {}, sceneEl),
    tray,
  );

  // ---------- Bông nói + phụ đề ----------
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
  /**
   * Đọc lần lượt các câu [en, vi]; câu mới thay câu cũ (lượt cũ dừng sau câu đang đọc).
   * Phụ đề giữ suốt lúc Bông đọc, đọc xong thêm ~3 giây rồi ẩn.
   */
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
  const requestLine = (r) => [requestSentence(r.sticker, r.zone), `Đặt ${r.sticker.emoji} ${r.zone.vi}`];
  const placedLine = (sticker, zone) => [placedSentence(sticker, zone), `${sticker.emoji} ${zone.vi}`];

  // ---------- Vẽ ----------
  function save() {
    state.last = scene.id;
    state[scene.id] = placed;
    app.setSetting('stickerScenes', { ...state }).catch(() => {});
  }

  function renderPlaced() {
    layer.replaceChildren(...placed.map((p, index) => {
      const sticker = STICKER_BY_ID.get(p.s);
      const zone = zoneAt(scene, p.x, p.y);
      const el = h('button.placed', {
        type: 'button',
        'aria-label': `${capital(sticker.name)} ${zone.en}`,
        dataset: { sticker: p.s, zone: zone.id },
        style: { left: `${p.x}%`, top: `${p.y}%` },
        text: sticker.emoji,
      });
      el.addEventListener('pointerdown', (e) => beginPress(e, { kind: 'placed', index, el, sid: p.s }));
      return el;
    }));
    renderTarget();
  }

  function renderTarget() {
    sceneEl.querySelector('.zone-target')?.remove();
    requestCard.hidden = !request;
    for (const b of tray.children) b.classList.toggle('wanted', Boolean(request) && b.dataset.sticker === request.sticker.id);
    if (!request) return;
    requestCard.textContent = request.sticker.emoji;
    requestCard.dataset.sticker = request.sticker.id;
    sceneEl.insertBefore(zoneDiv('zone-target', request.zone), layer);
  }

  function zoneDiv(cls, zone) {
    const box = zoneBox(zone);
    return h(`div.${cls}`, {
      dataset: { zone: zone.id },
      style: { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` },
    });
  }

  function flash(zone) {
    const el = zoneDiv('zone-flash', zone);
    sceneEl.insertBefore(el, layer);
    setTimeout(() => el.remove(), 1000);
  }

  function renderTray() {
    const list = ownedStickers(owned);
    if (!list.length) {
      tray.replaceChildren(h('p.tray-empty', { text: 'Học bài để nhận sticker nhé! 🎁' }));
      return;
    }
    tray.replaceChildren(...list.map((s) => {
      const btn = h('button.tray-sticker', {
        type: 'button', 'aria-label': capital(s.name), dataset: { sticker: s.id },
      }, h('span.tray-emoji', { text: s.emoji }), h('span.tray-left'));
      btn.addEventListener('pointerdown', (e) => beginPress(e, { kind: 'tray', sid: s.id }));
      return btn;
    }));
    updateTray();
  }

  function updateTray() {
    [...tray.querySelectorAll('.tray-sticker')].forEach((btn, i) => {
      const id = btn.dataset.sticker;
      const left = remaining(owned, placed, id);
      btn.classList.toggle('used-up', left <= 0);
      btn.classList.toggle('selected', selected === id);
      btn.classList.toggle('hint', i === 0 && !placed.length && !selected);
      btn.lastChild.textContent = owned[id].count > 1 ? String(Math.max(0, left)) : '';
    });
    renderTarget();
  }

  function openScene(s, { greet = true } = {}) {
    scene = s;
    placed = cleanPlacements(state[s.id], owned);
    request = null;
    lastRequest = null;
    freeDrops = 0;
    selected = null;
    sceneEl.dataset.scene = s.id;
    sceneEl.setAttribute('aria-label', s.vi);
    for (const b of tabs.children) b.classList.toggle('active', b.dataset.scene === s.id);
    art.innerHTML = `<svg viewBox="0 0 400 300" preserveAspectRatio="none">${s.svg}</svg>`;
    renderPlaced();
    updateTray();
    save();
    if (greet) talk([[s.intro, s.vi]]);
  }

  // ---------- Dán, giao việc ----------
  function put(id, xPct, yPct, from = -1) {
    if (from < 0 && (remaining(owned, placed, id) <= 0 || placed.length >= MAX_PER_SCENE)) {
      play('boing');
      return;
    }
    if (from >= 0) placed.splice(from, 1);
    const pos = { s: id, x: round1(clamp(xPct, 3, 97)), y: round1(clamp(yPct, 4, 96)) };
    placed.push(pos);
    const sticker = STICKER_BY_ID.get(id);
    const zone = zoneAt(scene, pos.x, pos.y);
    selected = null;
    play('pop');
    flash(zone);
    save();

    if (request && request.sticker.id === id && request.zone.id === zone.id) {
      lastRequest = request;
      request = null;
      freeDrops = 0;
      renderPlaced();
      updateTray();
      play('cheer');
      bunny.set('clap');
      setTimeout(() => bunny.set('idle'), 1600);
      talk([[`Yay! ${placedSentence(sticker, zone)}`, `Giỏi quá! ${sticker.emoji} ${zone.vi}`]]);
      return;
    }
    const lines = [placedLine(sticker, zone)];
    freeDrops += 1;
    if (!request && freeDrops >= DROPS_PER_REQUEST) {
      request = pickRequest(scene, owned, placed, lastRequest);
      if (request) lines.push(requestLine(request));
    }
    renderPlaced();
    updateTray();
    talk(lines);
  }

  function remove(index) {
    placed.splice(index, 1);
    play('whoosh');
    save();
    renderPlaced();
    updateTray();
  }

  function giveRequest() {
    if (!ownedStickers(owned).length) {
      talk([["Let's learn a lesson first!", 'Học bài để nhận sticker nhé!']]);
      return;
    }
    // Đang có việc: chỉ nhắc lại, không giao việc mới.
    if (!request) {
      request = pickRequest(scene, owned, placed, lastRequest);
      freeDrops = 0;
      renderTarget();
    }
    // Không còn việc nào làm được (mọi sticker đã ở mọi chỗ…): Bông khen, bé chơi tự do.
    if (!request) talk([['Great job!', 'Giỏi quá!']]);
    else talk([requestLine(request)]);
  }

  // ---------- Chạm / kéo (một ngón tay một lúc) ----------
  function beginPress(e, target) {
    if (press || e.button > 0) return;
    e.stopPropagation();
    press = { ...target, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, dragging: false };
  }

  const inRect = (r, cx, cy) => cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;

  function pctIn(cx, cy) {
    const r = sceneEl.getBoundingClientRect();
    if (!inRect(r, cx, cy)) return null;
    return { x: ((cx - r.left) / r.width) * 100, y: ((cy - r.top) / r.height) * 100 };
  }

  function startDrag(e) {
    if (press.kind === 'tray' && remaining(owned, placed, press.sid) <= 0) {
      play('boing');
      press = null;
      return;
    }
    press.dragging = true;
    press.el?.classList.add('lifted');
    selected = null;
    updateTray();
    play('tap');
    const size = sceneEl.getBoundingClientRect().width * STICKER_SIZE;
    ghost = h('div.drag-ghost', { text: STICKER_BY_ID.get(press.sid).emoji, style: { fontSize: `${size}px` } });
    document.body.append(ghost);
    moveGhost(e);
  }

  function moveGhost(e) {
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
  }

  function endDrag() {
    ghost?.remove();
    ghost = null;
  }

  sceneEl.addEventListener('pointerdown', (e) => beginPress(e, { kind: 'scene' }));

  window.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    if (!press.dragging) {
      if (press.kind === 'scene' || Math.hypot(e.clientX - press.x0, e.clientY - press.y0) < DRAG_START_PX) return;
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
      const at = pctIn(e.clientX, e.clientY);
      // Thả trong tranh: đặt / đổi chỗ. Thả vào khay: sticker về khay.
      // Thả chỗ khác (thanh trên, mép màn hình): sticker đã dán quay về chỗ cũ, sticker từ khay về khay.
      if (p.kind === 'placed') {
        if (at) put(p.sid, at.x, at.y, p.index);
        else if (inRect(tray.getBoundingClientRect(), e.clientX, e.clientY)) remove(p.index);
        else p.el.classList.remove('lifted');
      } else if (at) {
        put(p.sid, at.x, at.y);
      }
      return;
    }
    tap(p, e);
  }, { signal });

  // Khay vuốt ngang: trình duyệt nhận cử chỉ cuộn → hủy lần chạm.
  window.addEventListener('pointercancel', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    press.el?.classList.remove('lifted');
    press = null;
    endDrag();
  }, { signal });

  function tap(p, e) {
    if (p.kind === 'tray') {
      const sticker = STICKER_BY_ID.get(p.sid);
      if (remaining(owned, placed, p.sid) <= 0) play('boing');
      else {
        play('pop');
        selected = selected === p.sid ? null : p.sid;
        updateTray();
      }
      talk([[`${capital(sticker.name)}!`, sticker.emoji]]);
    } else if (p.kind === 'placed') {
      const sticker = STICKER_BY_ID.get(p.sid);
      const { x, y } = placed[p.index];
      p.el.classList.remove('bounce');
      void p.el.offsetWidth;
      p.el.classList.add('bounce');
      play('pop');
      talk([placedLine(sticker, zoneAt(scene, x, y))]);
    } else if (selected) {
      const at = pctIn(e.clientX, e.clientY);
      if (at) put(selected, at.x, at.y);
    }
  }

  // ---------- Thời gian: 2 phút không chạm thì không tính giờ ----------
  const idleTimer = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  getStickers(app.db).then((list) => {
    if (signal.aborted) return;
    owned = list;
    renderTray();
    openScene(scene);
  });

  return () => {
    clearInterval(idleTimer);
    clearTimeout(captionTimer);
    endDrag();
    bunny.destroy();
  };
}
