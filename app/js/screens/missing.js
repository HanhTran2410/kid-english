// Trò Tìm đồ còn thiếu (SPEC-missing.md): tranh đầy đủ → vài đồ "bay mất" thành bóng trắng → bé kéo đồ đúng từ khay vào bóng.
// Kéo nhầm thì đồ nảy về khay (Bông nói tên / "not there"), sai 2 lần thì bóng đúng lấp lánh. Đủ đồ → đọc lại tên → tranh khác;
// 5 tranh → Hoan hô + sticker. Dùng cảnh / sticker / ảnh của Dán tranh và cảnh riêng (ảnh `missing:`).

import { h } from '../ui.js';
import { mediaBlob } from '../db.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';
import { createBunny, Teacher } from '../player/teacher.js';
import { runCompletion } from '../player/completion-stage.js';
import { markPracticed } from '../player/track.js';
import { scaled } from '../timing.js';
import { normalizeWord } from '../text.js';
import { loadSceneImages } from './sticker-scene.js';
import {
  W, H, LEVELS, PICTURE_BY_ID, PICTURES_PER_ROUND, MISSING_BG_IMAGES, MISSING_ITEM_IMAGES, sceneOf, itemOf, pickMissing, pickDistractors,
  roundPictures, judgeDrop, cleanMissingState, afterMissingRound, ITEM_LINES,
  MISSING_LINE, WHAT_LINE, NOT_THERE_LINE, WHAT_HERE_LINE, yesLine, nameLine, notBelongLine, allBackLine,
} from '../missing.js';

const DRAG_START_PX = 8;
const SNAP_MS = 300;
const HINT_MS = 10_000;
const MAX_HINTS = 2;
const CAPTION_MS = 3500;
const IDLE_PAUSE_MS = 120_000;
const SNAPSHOT_MS = 10 * 60_000;

// Lượt đang chơi: app ra nền thì màn được dựng lại (continueDirectly) — giữ tranh và các đồ đã đặt.
let snapshot = null;

/** Ảnh: Dán tranh (sticker + nền) và cảnh riêng (`missing:items`, `missing:bg`). */
export async function loadMissingImages(app) {
  const scene = await loadSceneImages(app.db);
  const urls = [];
  const own = { item: new Map(), bg: new Map() };
  for (const [lessonId, key] of [[MISSING_ITEM_IMAGES, 'item'], [MISSING_BG_IMAGES, 'bg']]) {
    for (const img of await app.db.getAllByIndex('images', 'lessonId', lessonId).catch(() => [])) {
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      own[key].set(img.word, url);
    }
  }
  return { scene, own, revoke: () => { scene.revoke?.(); urls.forEach((u) => URL.revokeObjectURL(u)); } };
}

/** Ảnh có nền trong suốt không (xét viền ảnh thu nhỏ)? Không có thì phủ trắng sẽ ra ô chữ nhật → bóng dùng emoji. */
export function hasTransparentEdge(img) {
  try {
    const n = 24;
    const c = document.createElement('canvas');
    c.width = n;
    c.height = n;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, n, n);
    const d = ctx.getImageData(0, 0, n, n).data;
    let clear = 0;
    let edge = 0;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (x !== 0 && y !== 0 && x !== n - 1 && y !== n - 1) continue;
        edge += 1;
        if (d[(y * n + x) * 4 + 3] < 128) clear += 1;
      }
    }
    return clear / edge >= 0.5;
  } catch {
    return false;
  }
}

/**
 * Hình đồ vật: ảnh (cảnh riêng → ảnh `missing:items`; cảnh Dán tranh → sticker) hoặc emoji.
 * `ghost`: dùng làm bóng trắng — ảnh không có nền trong suốt thì đổi sang emoji (không để thành ô trắng).
 */
export function itemFace(item, images, ownScene, { ghost = false } = {}) {
  const url = ownScene ? images?.own.item.get(normalizeWord(item.id)) : images?.scene.sticker.get(normalizeWord(item.name));
  const emoji = () => h('span.ms-emoji', { text: item.emoji });
  if (!url) return emoji();
  const img = h('img.ms-img', { src: url, alt: '', draggable: false });
  img.addEventListener('error', () => img.replaceWith(emoji()), { once: true });
  if (ghost) {
    const check = () => { if (img.isConnected && !hasTransparentEdge(img)) img.replaceWith(emoji()); };
    if (img.complete && img.naturalWidth) queueMicrotask(check);
    else img.addEventListener('load', check, { once: true });
  }
  return img;
}

function sceneBackground(scene, images) {
  const url = scene.own ? images?.own.bg.get(scene.id) : images?.scene.background.get(scene.id);
  if (url) return h('img.ms-bg', { src: url, alt: '', draggable: false });
  return h('div.ms-bg', { html: `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${scene.svg}</svg>` });
}

const box = (s) => ({ left: `${((s.x - s.size / 2) / W) * 100}%`, top: `${((s.y - s.size / 2) / H) * 100}%`, width: `${(s.size / W) * 100}%`, height: `${(s.size / H) * 100}%` });
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function missingScreen(app, params = {}) {
  const signal = app.startActivity();
  app.root.className = 'child-screen ms-play';
  const state = cleanMissingState(app.settings.missingGame);
  const level = LEVELS[state.level];
  let images = null;
  let token = 0;
  let order = [];
  let index = 0;
  let pic = null; // { picture, scene, holes, tray, wrongs, done }
  let busy = false;
  let press = null;
  let ghost = null;
  let hintTimer = null;
  let hints = 0;
  let talking = false;

  // ---------- Giao diện ----------
  const bunny = createBunny(app);
  const bongBtn = h('button.sp-bong', { type: 'button', 'aria-label': 'Bông', onclick: () => { play('tap'); askAgain(); } }, bunny.el);
  const back = h('button.sp-back', { type: 'button', 'aria-label': 'Về trò chơi', text: '🎲', onclick: () => { play('tap'); app.go('play'); } });
  const againBtn = h('button.sp-back', { type: 'button', 'aria-label': 'Làm lại tranh này', text: '🔁', onclick: () => { play('tap'); startPicture(); } });
  const count = h('span.ms-count');
  const scene = h('div.ms-scene');
  const sayBox = h('div.ms-say');
  const tray = h('div.ms-tray', { 'aria-label': 'Các đồ vật' });
  const nextBtn = h('button.btn.primary.ms-next', { type: 'button', hidden: true, onclick: () => goNext() }, '➡️ Next');
  const stage = h('div.ms-stage', {}, scene);
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), back, againBtn, h('span.sp-title', { text: "🔍 What's missing?" }), count, bongBtn),
    stage, sayBox, h('div.ms-bottom', {}, tray, nextBtn),
  );

  // ---------- Nói + phụ đề (hàng riêng) ----------
  let talkGen = 0;
  let captionTimer = null;
  function caption(en, vi) {
    clearTimeout(captionTimer);
    sayBox.replaceChildren(h('div.caption.sp-caption', { 'aria-live': 'polite' },
      h('span.caption-en', { text: en }), vi ? h('span.caption-vi', { text: vi }) : null));
  }
  async function talk(lines) {
    const gen = ++talkGen;
    talking = true;
    try {
      for (const [en, vi] of lines) {
        if (gen !== talkGen || signal.aborted) return;
        caption(en, vi);
        try {
          await app.speaker.speak(en, { signal });
        } catch {
          return;
        }
      }
    } finally {
      if (gen === talkGen) talking = false;
    }
    if (gen === talkGen) captionTimer = setTimeout(() => sayBox.replaceChildren(), CAPTION_MS);
  }
  const hush = () => {
    talkGen += 1;
    talking = false;
    app.speaker.cancel?.();
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, scaled(ms)));

  // ---------- Vẽ ----------
  const face = (item, opts) => itemFace(item, images, pic.scene.own, opts);
  function renderScene() {
    const items = pic.picture.items.map((s) => {
      const item = itemOf(pic.scene, s.item);
      const hole = pic.holes.find((x) => x.slot === s);
      const el = h(`div.ms-item${hole && !hole.filled ? '.ms-ghost' : ''}${pic.faint ? '.faint' : ''}`, {
        style: box(s), dataset: { item: s.item, ...(hole ? { hole: hole.key } : {}) },
      }, face(item, { ghost: Boolean(hole && !hole.filled) }));
      if (hole && !hole.filled) {
        el.addEventListener('click', () => {
          play('tap');
          bounce(el);
          talk([WHAT_HERE_LINE]);
          armHint();
        });
      }
      return el;
    });
    scene.replaceChildren(sceneBackground(pic.scene, images), h('div.ms-layer', {}, ...items));
    scene.dataset.picture = pic.picture.id;
  }
  function renderTray() {
    tray.replaceChildren(...pic.tray.filter((t) => !t.placed).map((t) => {
      const el = h('button.ms-piece', { type: 'button', 'aria-label': t.item.name, dataset: { key: t.key, distractor: t.distractor ? '1' : '' } }, face(t.item));
      el.addEventListener('pointerdown', (e) => beginPress(e, t));
      return el;
    }));
  }
  function bounce(el) {
    if (!el) return;
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
  }
  const holeEl = (key) => scene.querySelector(`.ms-item[data-hole="${key}"]`);
  const trayEl = (key) => tray.querySelector(`.ms-piece[data-key="${key}"]`);
  function glow(key, ms = 2000) {
    const el = holeEl(key);
    if (!el) return;
    el.classList.add('glow');
    setTimeout(() => el.classList.remove('glow'), ms);
  }
  function snap() {
    snapshot = { savedAt: Date.now(), order, index, level: state.level, picture: pic.picture.id,
      holes: pic.holes.map((x) => ({ key: x.key, filled: x.filled })), tray: pic.tray.map((t) => ({ key: t.key, distractor: t.distractor, scene: t.scene, placed: t.placed })) };
  }

  // ---------- Gợi ý ----------
  // 10 giây không làm gì (không tính lúc Bông đang nói / bé đang kéo / đồ đang bay): bóng còn trống lấp lánh, đồ đúng trong khay nhún.
  // Tối đa 2 lần mỗi tranh; chạm bóng / chạm Bông không tính là sai và không thêm lượt gợi ý.
  function armHint() {
    clearTimeout(hintTimer);
    if (hints >= MAX_HINTS || !pic || pic.done) return;
    const t = token;
    hintTimer = setTimeout(() => {
      if (t !== token || app.idlePaused || !pic || pic.done) return;
      if (talking || press || busy) {
        armHint(); // đang bận: đếm lại từ đầu
        return;
      }
      // Ưu tiên đồ bé đã nhầm nhiều nhất, không thì bóng đầu tiên còn trống.
      const open = pic.holes.filter((x) => !x.filled);
      const hole = open.sort((a, b) => (pic.wrongs[b.key] ?? 0) - (pic.wrongs[a.key] ?? 0))[0];
      if (!hole) return;
      hints += 1;
      glow(hole.key);
      bounce(trayEl(hole.key));
      armHint();
    }, scaled(HINT_MS));
  }
  function askAgain() {
    if (!pic || pic.done) return;
    talk([WHAT_LINE]);
    const hole = pic.holes.find((x) => !x.filled);
    if (hole) glow(hole.key, 1200);
  }

  // ---------- Tranh ----------
  async function startPicture(resume = null) {
    const t = ++token;
    hush();
    clearTimeout(hintTimer);
    hints = 0;
    busy = false;
    nextBtn.hidden = true;
    const picture = PICTURE_BY_ID.get(order[index]);
    const sc = sceneOf(picture.scene);
    let holes;
    let trayItems;
    if (resume) {
      holes = resume.holes.map((r) => ({ ...r, slot: picture.items.find((s) => s.item === r.key) }));
      trayItems = resume.tray.map((r) => ({ ...r, item: r.distractor ? itemOf(sceneOf(r.scene), r.key) : itemOf(sc, r.key) }));
    } else {
      const seen = new Map(); // tên → số lần đã gặp (tiến độ từ vựng): ưu tiên đồ bé ít gặp
      for (const rec of await app.db.getAll('progress').catch(() => [])) seen.set(rec.word, rec.practiceCount ?? 0);
      if (t !== token) return;
      holes = pickMissing(picture, level.missing, { seen }).map((slot) => ({ key: slot.item, slot, filled: false }));
      const dis = pickDistractors(picture, level.distractors).map((x) => ({ key: x.id, item: x, scene: x.scene, distractor: true, placed: false }));
      trayItems = [...holes.map((x) => ({ key: x.key, item: itemOf(sc, x.key), distractor: false, placed: false })), ...dis]
        .sort(() => Math.random() - 0.5);
    }
    pic = { picture, scene: sc, holes, tray: trayItems, wrongs: {}, done: false, faint: level.faint };
    count.textContent = `${index + 1}/${order.length}`;
    app.root.dataset.state = 'playing';
    // Xem tranh đầy đủ trước (cả 3 mức: 2 / 1,5 / 1 giây), rồi đồ "bay mất" thành bóng trắng.
    const preview = !resume;
    if (preview) {
      const filled = pic.holes.map((x) => x.filled);
      pic.holes.forEach((x) => { x.filled = true; });
      renderScene();
      tray.replaceChildren();
      await wait(level.previewMs);
      if (t !== token || signal.aborted) return;
      pic.holes.forEach((x, i) => { x.filled = filled[i]; });
      play('whoosh');
    }
    renderScene();
    renderTray();
    snap();
    if (resume) {
      talk([WHAT_LINE]);
      armHint();
      return;
    }
    await talk([MISSING_LINE, WHAT_LINE]);
    if (t === token) armHint();
  }

  function right(t, hole, ghostEl) {
    hole.filled = true;
    t.placed = true;
    play('pop');
    snap();
    const target = holeEl(hole.key)?.getBoundingClientRect();
    const finish = () => {
      ghostEl?.remove();
      busy = false;
      renderScene();
      renderTray();
      markPracticed(app, t.item.name, t.item.emoji);
      const extra = ITEM_LINES[t.item.name] ?? ITEM_LINES[t.key];
      if (pic.holes.every((x) => x.filled)) {
        done();
        return;
      }
      talk([yesLine(t.item), ...(extra ? [extra] : [])]);
      armHint();
    };
    if (!target || !ghostEl || reduceMotion()) finish();
    else ghostEl.animate([{ left: ghostEl.style.left, top: ghostEl.style.top }, { left: `${target.left}px`, top: `${target.top}px` }],
      { duration: scaled(SNAP_MS), easing: 'ease-out', fill: 'forwards' }).finished.then(finish, finish);
  }

  function wrong(t, ghostEl) {
    pic.wrongs[t.key] = (pic.wrongs[t.key] ?? 0) + 1;
    play('boing');
    if (t.distractor) talk([notBelongLine(t.item)]);
    else {
      if (pic.wrongs[t.key] >= 2 && hints < MAX_HINTS) {
        hints += 1; // sai 2 lần → gợi ý (tính vào tối đa 2 lần mỗi tranh)
        glow(t.key);
        bounce(trayEl(t.key));
      }
      talk([NOT_THERE_LINE]);
    }
    flyBack(ghostEl, t.key);
    armHint();
  }

  async function done() {
    if (pic.done) return;
    pic.done = true;
    const t = token;
    clearTimeout(hintTimer);
    app.root.dataset.state = 'done';
    play('tada');
    const found = pic.holes.map((x) => itemOf(pic.scene, x.key));
    for (const x of pic.holes) bounce(holeEl(x.key) ?? scene.querySelector(`.ms-item[data-item="${x.key}"]`));
    await talk([yesLine(found.at(-1)), allBackLine(found)]);
    if (t !== token || signal.aborted) return;
    nextBtn.hidden = false;
    nextBtn.disabled = false;
  }

  async function goNext() {
    if (nextBtn.disabled) return;
    nextBtn.disabled = true; // bấm liên tục: chỉ một lần
    play('tap');
    if (index + 1 < order.length) {
      index += 1;
      startPicture();
      return;
    }
    // Hết lượt: Hoan hô + sticker, đếm lượt để lên mức (áp dụng lượt sau).
    token += 1;
    snapshot = null;
    app.setSetting('missingGame', afterMissingRound(state)).catch(() => {});
    nextBtn.hidden = true;
    tray.replaceChildren();
    sayBox.replaceChildren();
    const teacher = new Teacher(app, { signal, bunny, stage });
    try {
      await runCompletion({ app, teacher, stage, signal });
      if (!signal.aborted) app.go('play');
    } catch {
      // rời màn giữa chừng
    }
  }

  // ---------- Kéo / thả (điểm thả = vị trí ngón tay, như Ghép hình) ----------
  function beginPress(e, t) {
    if (press || busy || !pic || pic.done || e.button > 0) return;
    e.preventDefault();
    press = { t, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, dragging: false };
  }
  function flyBack(el, key) {
    const item = trayEl(key);
    item?.classList.remove('lifted');
    const finish = () => {
      el?.remove();
      busy = false;
    };
    if (!item || !el || reduceMotion()) {
      finish();
      return;
    }
    const r = item.getBoundingClientRect();
    el.animate([{ left: el.style.left, top: el.style.top }, { left: `${r.left}px`, top: `${r.top}px` }],
      { duration: scaled(SNAP_MS), easing: 'ease-out', fill: 'forwards' }).finished.then(finish, finish);
  }

  window.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    if (!press.dragging) {
      if (Math.hypot(e.clientX - press.x0, e.clientY - press.y0) < DRAG_START_PX) return;
      press.dragging = true;
      hush();
      const r = scene.getBoundingClientRect();
      const size = Math.max(56, (r.width / W) * 56);
      ghost = h('div.ms-drag', { style: { width: `${size}px`, height: `${size}px` } }, face(press.t.item));
      document.body.append(ghost);
      trayEl(press.t.key)?.classList.add('lifted');
      play('tap');
    }
    e.preventDefault();
    ghost.style.left = `${e.clientX - ghost.offsetWidth / 2}px`;
    ghost.style.top = `${e.clientY - ghost.offsetHeight / 2}px`;
  }, { signal, passive: false });

  window.addEventListener('pointerup', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    const p = press;
    press = null;
    if (!p.dragging) {
      // Chạm (không kéo): đồ nhún, Bông nói tên nó — không tự đặt.
      bounce(trayEl(p.t.key));
      talk([nameLine(p.t.item)]);
      armHint();
      return;
    }
    const el = ghost;
    ghost = null;
    if (busy) {
      flyBack(el, p.t.key);
      return;
    }
    busy = true;
    const r = scene.getBoundingClientRect();
    const pt = { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    const verdict = judgeDrop(pic.holes, p.t.distractor ? `x:${p.t.key}` : p.t.key, pt, p.t.distractor);
    if (verdict === 'right') right(p.t, pic.holes.find((x) => x.key === p.t.key), el);
    else if (verdict === 'wrong') wrong(p.t, el);
    else flyBack(el, p.t.key);
  }, { signal });

  window.addEventListener('pointercancel', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    const p = press;
    press = null;
    if (ghost) {
      const el = ghost;
      ghost = null;
      flyBack(el, p.t.key);
    }
  }, { signal });

  const idlePause = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  loadMissingImages(app).then((loaded) => {
    images = loaded;
    if (signal.aborted) return;
    const s = snapshot;
    if (params.continueDirectly && s && Date.now() - s.savedAt < SNAPSHOT_MS && s.level === state.level) {
      order = s.order;
      index = s.index;
      startPicture(s);
    } else {
      order = roundPictures(Math.random, PICTURES_PER_ROUND);
      index = 0;
      startPicture();
    }
  });

  return () => {
    token += 1;
    hush();
    clearTimeout(hintTimer);
    clearTimeout(captionTimer);
    clearInterval(idlePause);
    ghost?.remove();
    document.querySelectorAll('.ms-drag').forEach((el) => el.remove());
    bunny.destroy();
    images?.revoke();
  };
}
