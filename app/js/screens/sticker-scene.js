// Dán tranh (SPEC-scenes.md): chọn tranh, rồi bé kéo sticker theo chủ đề tranh vào tranh; Bông nói câu có giới từ
// và thỉnh thoảng giao việc.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { mediaBlob } from '../db.js';
import { normalizeWord } from '../text.js';
import { homeButton } from '../player/layout.js';
import { createBunny } from '../player/teacher.js';
import {
  SCENES, SCENE_BY_ID, ITEM_BY_ID, MAX_PER_SCENE, DROPS_PER_REQUEST, STICKER_IMAGES, BACKGROUND_IMAGES,
  zoneAt, zoneBox, placedSentence, requestSentence, cleanPlacements, pickRequest, findSentence, pickFind,
} from '../sticker-scenes.js';

const DRAG_START_PX = 8; // dịch ngón tay quá chừng này thì là kéo, không phải chạm
const STICKER_SIZE = 0.1; // cỡ sticker trong tranh: 10% chiều rộng tranh (khớp 10cqw trong CSS)
const CAPTION_MS = 3500;
const IDLE_PAUSE_MS = 120_000; // 2 phút không chạm → không tính giờ (SPEC mục 4.9)

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Ảnh bố mẹ đã thay (SPEC-scenes mục 10): sticker theo tên, tranh theo mã tranh.
 * @returns {Promise<{ sticker: Map<string,string>, background: Map<string,string>, revoke: () => void }>}
 */
export async function loadSceneImages(db) {
  const urls = [];
  const toMap = (list) => new Map(list.map((img) => {
    const url = URL.createObjectURL(mediaBlob(img));
    urls.push(url);
    return [img.word, url];
  }));
  const [stickers, backgrounds] = await Promise.all([
    db.getAllByIndex('images', 'lessonId', STICKER_IMAGES),
    db.getAllByIndex('images', 'lessonId', BACKGROUND_IMAGES),
  ]);
  return {
    sticker: toMap(stickers),
    background: toMap(backgrounds),
    revoke: () => urls.forEach((u) => URL.revokeObjectURL(u)),
  };
}

/** Hình của sticker: ảnh bố mẹ đã thay, không thì emoji. */
export function itemFace(item, images) {
  const url = images?.sticker.get(normalizeWord(item.name));
  return url ? h('img.sp-img', { src: url, alt: '', draggable: 'false' }) : document.createTextNode(item.emoji);
}

/** Nền của tranh: ảnh bố mẹ đã thay, không thì hình vẽ SVG có sẵn. */
export function sceneArt(scene, images) {
  const art = h('div.sp-art', { 'aria-hidden': 'true' });
  const url = images?.background.get(scene.id);
  if (url) art.append(h('img.sp-bg', { src: url, alt: '', draggable: 'false' }));
  else art.innerHTML = `<svg viewBox="0 0 400 300" preserveAspectRatio="none">${scene.svg}</svg>`;
  return art;
}

// ---------- Chọn tranh ----------

export function scenePickerScreen(app) {
  app.root.className = 'child-screen sp-picker';
  const grid = h('div.sp-cards');
  const back = h('button.sp-back', {
    type: 'button',
    'aria-label': 'Về trò chơi',
    text: '🎲',
    onclick: () => {
      play('tap');
      app.go('play');
    },
  });
  app.root.append(h('header.child-top', {}, homeButton(app), back), grid);
  let images = null;
  loadSceneImages(app.db).then((loaded) => {
    images = loaded;
    const state = app.settings.stickerScenes ?? {};
    grid.replaceChildren(...SCENES.map((scene) => {
      const n = cleanPlacements(state[scene.id]).length;
      return h(`button.sp-card${state.last === scene.id ? '.last' : ''}`, {
        type: 'button',
        'aria-label': scene.vi,
        dataset: { scene: scene.id },
        onclick: () => {
          play('tap');
          app.go('sticker-scene', { scene: scene.id });
        },
      },
      h('div.sp-thumb', {}, sceneArt(scene, images), n ? h('span.sp-thumb-count', { text: `${n}` }) : null),
      h('span.sp-card-text', {}, h('span.sp-card-en', { text: `${scene.emoji} ${scene.en}` }), h('span.sp-card-vi', { text: scene.vi })));
    }));
  });
  say(app, 'Pick a picture!');
  return () => images?.revoke();
}

const say = (app, text) => app.speaker.speak(text).catch(() => {});

// ---------- Dán tranh ----------

export function stickerSceneScreen(app, params = {}) {
  const signal = app.startActivity();
  app.root.className = 'child-screen sp-play';
  const state = { ...(app.settings.stickerScenes ?? {}) };
  const scene = SCENE_BY_ID.get(params.scene) ?? SCENE_BY_ID.get(state.last) ?? SCENES[0];
  let images = null;
  let placed = cleanPlacements(state[scene.id]); // [{ s, x, y }]
  let selected = null; // sticker đang chọn trong khay (chạm sticker → chạm chỗ trong tranh)
  let request = null; // việc Bông giao: { sticker, zone }
  let lastRequest = null;
  // Bông hỏi ngược "Where is the lion?" (xen kẽ với việc dán): sticker cần tìm, lần chạm nhầm.
  let find = null;
  let lastFindId = null;
  let findMisses = 0;
  let lastKind = null; // 'put' | 'find'
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
      if (request) {
        showWanted();
        talk([requestLine(request)]);
      } else if (find) talk([findLine(find)]);
    },
  });
  const backBtn = h('button.sp-back', {
    type: 'button',
    'aria-label': 'Chọn tranh khác',
    text: '🖼️',
    onclick: () => {
      play('tap');
      app.go('sticker-scenes');
    },
  });
  // Dán lại từ đầu: hỏi lại bằng 2 nút hình to (✔ / ✖) để bé không lỡ tay xóa hết tranh.
  const resetBtn = h('button.sp-back.sp-reset', {
    type: 'button',
    'aria-label': 'Dán lại từ đầu',
    text: '🧹',
    hidden: true,
    onclick: () => {
      play('tap');
      const close = () => overlay.remove();
      const overlay = h('div.choice-overlay', { onclick: (e) => e.target === overlay && close() },
        h('div.choice-pair', {},
          h('button.choice-big.restart', {
            type: 'button',
            'aria-label': 'Xóa hết, dán lại',
            text: '✔',
            onclick: () => {
              close();
              clearAll();
            },
          }),
          h('button.choice-big.continue', { type: 'button', 'aria-label': 'Không xóa', text: '✖', onclick: close })));
      app.root.append(overlay);
      talk([['Start again?', 'Dán lại từ đầu?']]);
    },
  });
  const layer = h('div.sp-layer');
  const sceneEl = h('div.sp-scene', { 'aria-label': scene.vi, dataset: { scene: scene.id } }, layer);
  const tray = h('div.sp-tray', { 'aria-label': 'Khay sticker' });
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), backBtn, resetBtn, h('span.sp-title', { text: `${scene.emoji} ${scene.en}` }), requestCard, bongBtn),
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
  const findLine = (sticker) => [findSentence(sticker), `${sticker.emoji} ở đâu nhỉ?`];

  // ---------- Vẽ ----------
  function save() {
    state.last = scene.id;
    state[scene.id] = placed;
    app.setSetting('stickerScenes', { ...state }).catch(() => {});
  }

  function renderPlaced() {
    resetBtn.hidden = !placed.length;
    layer.replaceChildren(...placed.map((p, index) => {
      const sticker = ITEM_BY_ID.get(p.s);
      const zone = zoneAt(scene, p.x, p.y);
      const el = h('button.placed', {
        type: 'button',
        'aria-label': `${capital(sticker.name)} ${zone.en}`,
        dataset: { sticker: p.s, zone: zone.id },
        style: { left: `${p.x}%`, top: `${p.y}%` },
      }, itemFace(sticker, images));
      el.addEventListener('pointerdown', (e) => beginPress(e, { kind: 'placed', index, el, sid: p.s }));
      return el;
    }));
    renderTarget();
  }

  function renderTarget() {
    sceneEl.querySelector('.zone-target')?.remove();
    requestCard.hidden = !request && !find;
    requestCard.classList.toggle('find', Boolean(find));
    for (const b of tray.children) b.classList.toggle('wanted', Boolean(request) && b.dataset.sticker === request.sticker.id);
    if (find) {
      requestCard.replaceChildren(itemFace(find, images), h('span.sp-ask', { text: '?' }));
      requestCard.dataset.sticker = find.id;
      requestCard.dataset.kind = 'find';
      return;
    }
    requestCard.dataset.kind = 'put';
    if (!request) return;
    requestCard.replaceChildren(itemFace(request.sticker, images));
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
    tray.replaceChildren(...scene.items.map((s) => {
      const btn = h('button.tray-sticker', {
        type: 'button', 'aria-label': capital(s.name), dataset: { sticker: s.id },
      }, h('span.tray-emoji', {}, itemFace(s, images)));
      btn.addEventListener('pointerdown', (e) => beginPress(e, { kind: 'tray', sid: s.id }));
      return btn;
    }));
    updateTray();
  }

  function updateTray() {
    const full = placed.length >= MAX_PER_SCENE;
    [...tray.querySelectorAll('.tray-sticker')].forEach((btn, i) => {
      btn.classList.toggle('used-up', full);
      btn.classList.toggle('selected', selected === btn.dataset.sticker);
      btn.classList.toggle('hint', i === 0 && !placed.length && !selected);
    });
    renderTarget();
  }

  // ---------- Dán, giao việc ----------
  function put(id, xPct, yPct, from = -1) {
    if (from < 0 && placed.length >= MAX_PER_SCENE) {
      play('boing');
      return;
    }
    if (from >= 0) placed.splice(from, 1);
    const pos = { s: id, x: round1(clamp(xPct, 3, 97)), y: round1(clamp(yPct, 4, 96)) };
    placed.push(pos);
    const sticker = ITEM_BY_ID.get(id);
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
    let asked = false;
    if (!request && !find && freeDrops >= DROPS_PER_REQUEST) {
      const task = newTask();
      asked = task === 'put';
      if (task === 'put') lines.push(requestLine(request));
      else if (task === 'find') lines.push(findLine(find));
    }
    renderPlaced();
    updateTray();
    if (asked) showWanted();
    talk(lines);
  }

  /** Khay cuộn tới sticker Bông đang cần (sticker cuối khay có thể đang nằm ngoài màn hình). */
  function showWanted() {
    const btn = request && tray.querySelector(`.tray-sticker[data-sticker="${request.sticker.id}"]`);
    if (!btn) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }

  /**
   * Việc mới: xen kẽ "dán vào chỗ" và "tìm sticker" (khi tranh có đủ loại sticker để hỏi).
   * @returns {'put' | 'find' | null}
   */
  function newTask() {
    freeDrops = 0;
    findMisses = 0;
    if (lastKind === 'put') {
      find = pickFind(placed, lastFindId);
      if (find) {
        lastKind = 'find';
        renderTarget();
        return 'find';
      }
    }
    request = pickRequest(scene, placed, lastRequest);
    if (request) lastKind = 'put';
    renderTarget();
    return request ? 'put' : null;
  }

  /** Bé chạm một sticker trong tranh khi Bông đang hỏi "Where is …?". */
  function answerFind(p) {
    const sticker = ITEM_BY_ID.get(p.sid);
    const { x, y } = placed[p.index];
    if (p.sid === find.id) {
      lastFindId = find.id;
      find = null;
      findMisses = 0;
      freeDrops = 0;
      renderTarget();
      play('cheer');
      bunny.set('clap');
      setTimeout(() => bunny.set('idle'), 1600);
      talk([[`Yes! ${placedSentence(sticker, zoneAt(scene, x, y))}`, `Đúng rồi! ${sticker.emoji} ${zoneAt(scene, x, y).vi}`]]);
      return;
    }
    findMisses += 1;
    play('boing');
    // Nhầm 2 lần: sticker đúng nhún để gợi ý.
    if (findMisses >= 2) {
      for (const el of layer.querySelectorAll(`.placed[data-sticker="${find.id}"]`)) {
        el.classList.remove('bounce');
        void el.offsetWidth;
        el.classList.add('bounce');
      }
    }
    talk([[`That's the ${sticker.name}! ${findSentence(find)}`, `Đó là ${sticker.emoji}! ${find.emoji} ở đâu nhỉ?`]]);
  }

  function clearAll() {
    placed = [];
    find = null;
    request = null;
    lastRequest = null;
    lastKind = null;
    freeDrops = 0;
    selected = null;
    play('whoosh');
    save();
    renderPlaced();
    updateTray();
    talk([["Let's start again!", 'Mình dán lại từ đầu nhé!']]);
  }

  function remove(index) {
    placed.splice(index, 1);
    // Bỏ hết sticker đang được hỏi khỏi tranh: thôi hỏi.
    if (find && !placed.some((p) => p.s === find.id)) find = null;
    play('whoosh');
    save();
    renderPlaced();
    updateTray();
  }

  function giveRequest() {
    // Đang có việc: chỉ nhắc lại, không giao việc mới.
    if (find) {
      talk([findLine(find)]);
      return;
    }
    if (!request) newTask();
    if (find) talk([findLine(find)]);
    // Không còn việc nào làm được (tranh đầy…): Bông khen, bé chơi tự do.
    else if (!request) talk([['Great job!', 'Giỏi quá!']]);
    else {
      showWanted();
      talk([requestLine(request)]);
    }
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
    if (press.kind === 'tray' && placed.length >= MAX_PER_SCENE) {
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
    ghost = h('div.drag-ghost', { style: { fontSize: `${size}px` } }, itemFace(ITEM_BY_ID.get(press.sid), images));
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
      const sticker = ITEM_BY_ID.get(p.sid);
      play('pop');
      selected = selected === p.sid ? null : p.sid;
      updateTray();
      talk([[`${capital(sticker.name)}!`, sticker.emoji]]);
    } else if (p.kind === 'placed' && find) {
      answerFind(p);
    } else if (p.kind === 'placed') {
      const sticker = ITEM_BY_ID.get(p.sid);
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

  loadSceneImages(app.db).catch(() => null).then((loaded) => {
    images = loaded;
    if (signal.aborted) {
      images?.revoke();
      return;
    }
    sceneEl.prepend(sceneArt(scene, images));
    renderTray();
    renderPlaced();
    save();
    talk([[scene.intro, scene.vi]]);
  });

  return () => {
    clearInterval(idleTimer);
    clearTimeout(captionTimer);
    endDrag();
    bunny.destroy();
    images?.revoke();
  };
}
