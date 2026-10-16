// Trò Cho Bông ăn (SPEC-feed.md): Bông xin món ("I want a banana!"), bé kéo hoặc chạm món trong khay để đưa vào miệng.
// Đúng thì Bông nhai, bụng no thêm; nhầm thì Bông lắc đầu và xin lại. Đủ 5 đơn vị ăn thì no → ngủ → vòng mới.
// Trạng thái (mục 8): requesting ⇄ processing → full. Trong lúc nhận món, khay khóa (không nhận chồng, không tính trùng).

import { h } from '../ui.js';
import { mediaBlob } from '../db.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';
import { bongSvg } from '../bong.js';
import { scaled } from '../timing.js';
import {
  FEED_FOOD_IMAGES, FEED_BONG_IMAGES, FEED_BG_IMAGES, BELLY, allFoods, makeTray, pickRequest, cleanFeedState, afterRound,
  requestLine, remindLine, wrongLine, yuckLine, countLine, HUNGRY_LINE, AGAIN_LINE, YUMMY_LINE, FULL_LINE, GIGGLE_LINE,
} from '../feed.js';

const DRAG_START_PX = 8;
const HINT_AFTER_WRONG = 2; // lần nhầm thứ 2 trong cùng lượt: món cần tìm sáng lên
const NUDGE_MS = 12_000;
const MAX_NUDGES = 2;
const CHEW_MS = 900; // tư thế nhai hiện ít nhất chừng này
const FLY_MS = 380;
const SLEEP_MS = 2000;
const ZONE_GROW = 0.15; // vùng thả = khung Bông nới thêm 15% mỗi phía
const ZONE_HYSTERESIS = 24; // miệng chỉ ngậm lại khi món ra xa vùng thả thêm 24 px
const CAPTION_MS = 3500;
const IDLE_PAUSE_MS = 120_000;
const SNAPSHOT_MS = 10 * 60_000;
const MOOD = { hungry: 'happy', open: 'eat', chew: 'chew', no: 'yuck', full: 'full', sleep: 'sleep' };

// Vòng đang chơi dở: app ra nền thì màn bị dựng lại (continueDirectly) — chơi tiếp đúng lượt (mục 9).
let snapshot = null;

/** Ảnh trò chơi (SPEC-feed mục 7): ảnh món, ảnh Bông theo tư thế, ảnh nền. */
export async function loadFeedImages(app) {
  const urls = [];
  const out = { food: new Map(), bong: new Map(), bg: null };
  for (const [lessonId, key] of [[FEED_FOOD_IMAGES, 'food'], [FEED_BONG_IMAGES, 'bong'], [FEED_BG_IMAGES, 'bg']]) {
    for (const img of await app.db.getAllByIndex('images', 'lessonId', lessonId).catch(() => [])) {
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      if (key === 'bg') out.bg = url;
      else out[key].set(img.word, url);
    }
  }
  return { ...out, revoke: () => urls.forEach((u) => URL.revokeObjectURL(u)) };
}

/** Hình một món: ảnh bố mẹ thêm, hỏng / chưa có thì emoji. */
export function foodFace(food, images, cls = 'fd-face') {
  const emoji = () => h(`span.${cls}.emoji`, { text: food.emoji, 'aria-hidden': 'true' });
  const url = images?.food.get(food.id);
  if (!url) return emoji();
  const img = h(`img.${cls}`, { src: url, alt: '', draggable: false });
  img.addEventListener('error', () => img.replaceWith(emoji()), { once: true });
  return img;
}

const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, scaled(ms)));
const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function feedScreen(app, params = {}) {
  const signal = app.startActivity();
  app.root.className = 'child-screen fd-play';
  const foods = allFoods(app.settings.feedCustom);
  const byId = (id) => foods.find((f) => f.id === id);
  const silly = app.settings.feedSilly !== false;
  let progress = cleanFeedState(app.settings.feed);
  let images = null;
  let round = 0; // mã vòng: hẹn giờ / câu nói của vòng cũ không được đụng vào vòng mới
  let state = 'start'; // requesting | processing | full
  let belly = 0;
  let tray = [];
  let request = null;
  let last = null;
  let pose = null;
  let press = null;
  let dragGhost = null;
  let mouthOpen = false;
  let nudgeTimer = null;
  const flying = new Set();

  // ---------- Giao diện ----------
  const wish = h('button.sp-request.fd-wish', {
    type: 'button', 'aria-label': 'Bông muốn gì', hidden: true,
    onclick: () => {
      play('tap');
      giggle();
    },
  });
  const back = h('button.sp-back', {
    type: 'button', 'aria-label': 'Về trò chơi', text: '🎲',
    onclick: () => {
      play('tap');
      app.go('play');
    },
  });
  const resetBtn = h('button.sp-back', {
    type: 'button', 'aria-label': 'Chơi lại', text: '🧹',
    onclick: () => {
      play('tap');
      newRound(false);
    },
  });
  const art = h('div.fd-art');
  const bong = h('button.fd-bong', {
    type: 'button', 'aria-label': 'Bông',
    onclick: () => giggle(),
  }, art);
  const zzz = h('div.fd-zzz', { text: 'zZz', hidden: true, 'aria-hidden': 'true' });
  const bellyEl = h('div.fd-belly', { 'aria-label': 'Bụng Bông' }, ...Array.from({ length: BELLY }, () => h('span.fd-dot')));
  const stage = h('div.fd-stage', {}, h('div.fd-bong-wrap', {}, bong, zzz, bellyEl));
  const trayEl = h('div.fd-tray', { 'aria-label': 'Khay đồ ăn' });
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), back, resetBtn, h('span.sp-title', { text: '🍌 Feed Bông' }), wish),
    stage,
    trayEl,
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
  /** Nói lần lượt; câu mới hủy chuỗi cũ. Trả về khi nói xong (hoặc bị thay). */
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
  function setPose(p) {
    if (p === pose) return;
    pose = p;
    bong.dataset.pose = p;
    const url = images?.bong.get(p === 'sleep' ? 'full' : p);
    if (url) {
      const img = h('img.fd-bong-img', { src: url, alt: '', draggable: false });
      img.addEventListener('error', () => { art.innerHTML = bongSvg({ mood: MOOD[p] }); }, { once: true });
      art.replaceChildren(img);
    } else art.innerHTML = bongSvg({ mood: MOOD[p] });
  }
  function renderBelly() {
    [...bellyEl.children].forEach((dot, i) => dot.classList.toggle('on', i < belly));
    bellyEl.dataset.belly = String(belly);
  }
  function renderTray() {
    trayEl.replaceChildren(...tray.map((f) => {
      const btn = h('button.fd-food', { type: 'button', 'aria-label': f.en, dataset: { food: f.id } }, foodFace(f, images));
      btn.addEventListener('pointerdown', (e) => beginPress(e, f.id));
      return btn;
    }));
  }
  function renderWish() {
    wish.hidden = !request;
    if (!request) return;
    const { food, count, got } = request;
    wish.dataset.food = food.id;
    wish.dataset.count = String(count);
    wish.dataset.got = String(got);
    wish.replaceChildren(...Array.from({ length: Math.min(count, 3) }, () => foodFace(food, images, 'fd-wish-face')),
      count > 1 ? h('span.fd-count', { text: `${got}/${count}` }) : '');
  }
  const trayItem = (id) => trayEl.querySelector(`[data-food="${id}"]`);
  function setHint(on) {
    for (const el of trayEl.children) el.classList.toggle('hint', on && el.dataset.food === request?.food.id);
  }
  function wiggleWanted() {
    const el = request && trayItem(request.food.id);
    if (!el) return;
    el.classList.remove('nudge');
    void el.offsetWidth;
    el.classList.add('nudge');
  }
  function lock(on) {
    trayEl.classList.toggle('locked', on);
    app.root.dataset.state = state;
  }

  function saveProgress() {
    app.setSetting('feed', { level: progress.level, rounds: progress.rounds, lock: progress.lock }).catch(() => {});
  }
  function snap() {
    snapshot = {
      savedAt: Date.now(), level: progress.level, belly, last, tray: tray.map((f) => f.id),
      request: request && { food: request.food.id, count: request.count, got: request.got, wrong: request.wrong },
    };
  }

  // ---------- Nhắc khi bé chưa làm gì (mục 3.5) ----------
  function clearNudge() {
    clearTimeout(nudgeTimer);
    nudgeTimer = null;
  }
  function startNudge() {
    clearNudge();
    if (state !== 'requesting') return;
    nudgeTimer = setTimeout(() => {
      if (state !== 'requesting' || !request || request.nudges >= MAX_NUDGES || app.idlePaused) return;
      request.nudges += 1;
      wiggleWanted();
      talk([remindLine(request)]);
      startNudge();
    }, scaled(NUDGE_MS));
  }

  // ---------- Vòng, lượt ----------
  function cancelAll() {
    round += 1;
    clearNudge();
    talkGen += 1;
    app.speaker.cancel?.();
    endDrag();
    press = null;
    for (const g of flying) g.remove();
    flying.clear();
    zzz.hidden = true;
  }

  function newRound(again) {
    cancelAll();
    belly = 0;
    last = null;
    const firstRound = progress.level >= 3 && progress.rounds === 0;
    tray = makeTray(progress.level, { foods, silly });
    request = pickRequest(tray, { level: progress.level, firstRound, bellyLeft: BELLY });
    if (request) request.nudges = 0;
    state = 'requesting';
    lock(false);
    setPose('hungry');
    renderTray();
    renderBelly();
    renderWish();
    snap();
    play('rumble');
    talk([again ? AGAIN_LINE : HUNGRY_LINE, ...(request ? [requestLine(request)] : [])]);
    startNudge();
  }

  function nextRequest() {
    last = request?.food.id ?? last;
    const firstRound = progress.level >= 3 && progress.rounds === 0;
    request = pickRequest(tray, { level: progress.level, last, bellyLeft: BELLY - belly, firstRound });
    if (request) request.nudges = 0;
    tray = shuffle(tray); // món đúng không cố định một chỗ
    state = 'requesting';
    lock(false);
    setPose('hungry');
    renderTray();
    renderWish();
    snap();
    if (request) talk([requestLine(request)]);
    startNudge();
  }

  function giggle() {
    if (state !== 'requesting' || !request) return;
    bong.classList.remove('giggle');
    void bong.offsetWidth;
    bong.classList.add('giggle');
    talk([GIGGLE_LINE, remindLine(request)]);
    startNudge();
  }

  // ---------- Đưa món ----------
  const mouthPoint = () => {
    const r = bong.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.7 };
  };
  /** Món bay từ điểm `from` tới miệng Bông. Trả về phần tử đang bay (để nuốt / bay về khay). */
  async function flyIn(food, from) {
    const ghost = h('div.fd-fly', {}, foodFace(food, images));
    const to = mouthPoint();
    Object.assign(ghost.style, { left: `${to.x}px`, top: `${to.y}px` });
    document.body.append(ghost);
    flying.add(ghost);
    const ms = reduceMotion() ? 0 : scaled(FLY_MS);
    if (ms) {
      await ghost.animate([
        { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(1)` },
        { transform: 'translate(0, 0) scale(0.8)' },
      ], { duration: ms, easing: 'ease-in' }).finished.catch(() => {});
    }
    return ghost;
  }
  async function swallow(ghost) {
    const ms = reduceMotion() ? 0 : scaled(160);
    if (ms) await ghost.animate([{ transform: 'scale(0.8)', opacity: 1 }, { transform: 'scale(0.1)', opacity: 0 }], { duration: ms }).finished.catch(() => {});
    ghost.remove();
    flying.delete(ghost);
  }
  /** Món bay về chỗ của nó trong khay. */
  async function flyBack(ghost, id) {
    const item = trayItem(id);
    const ms = reduceMotion() ? 0 : scaled(FLY_MS);
    if (item && ms) {
      const to = center(item.getBoundingClientRect());
      const from = center(ghost.getBoundingClientRect());
      await ghost.animate([{ transform: 'translate(0, 0)' }, { transform: `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(0.6)`, opacity: 0.4 }],
        { duration: ms, easing: 'ease-out' }).finished.catch(() => {});
    }
    ghost.remove();
    flying.delete(ghost);
  }

  /** Bé đưa một món (kéo-thả vào Bông hoặc chạm). Một lần = một đơn vị; trong lúc xử lý không nhận món khác. */
  async function feed(id, from) {
    if (state !== 'requesting' || !request) return;
    const food = byId(id);
    if (!food) return;
    const r = round;
    const alive = () => r === round && !signal.aborted;
    state = 'processing';
    lock(true);
    clearNudge();
    setPose('open');
    const ghost = await flyIn(food, from);
    if (!alive()) return;

    if (food.id === request.food.id) {
      // Đúng: cập nhật bụng / bộ đếm NGAY (một lần duy nhất), rồi mới tới hoạt ảnh + câu nói.
      belly += 1;
      request.got += 1;
      const done = request.got >= request.count;
      snap();
      play('chomp');
      swallow(ghost);
      setPose('chew');
      play('munch');
      renderBelly();
      renderWish();
      setHint(false);
      const line = request.count > 1 ? countLine(request.got, done) : YUMMY_LINE;
      await Promise.all([talk([line]), wait(CHEW_MS)]);
      if (!alive()) return;
      if (belly >= BELLY) {
        full(r);
        return;
      }
      if (done) {
        nextRequest();
        return;
      }
      state = 'requesting';
      lock(false);
      setPose('hungry');
      startNudge();
      return;
    }

    // Nhầm (hoặc đồ không ăn được): lắc đầu, nói tên món, món bay về khay. Bụng không đổi.
    request.wrong += 1;
    snap();
    play('boing');
    setPose('no');
    bong.classList.remove('shake');
    void bong.offsetWidth;
    bong.classList.add('shake');
    flyBack(ghost, id);
    await talk([food.kind === 'silly' ? yuckLine(food) : wrongLine(food, request)]);
    if (!alive()) return;
    if (request.wrong >= HINT_AFTER_WRONG) setHint(true);
    state = 'requesting';
    lock(false);
    setPose('hungry');
    startNudge();
  }

  async function full(r) {
    const alive = () => r === round && !signal.aborted;
    state = 'full';
    lock(true);
    request = null;
    renderWish();
    setPose('full');
    snap();
    setTimeout(() => alive() && play('burp'), scaled(700));
    await talk([FULL_LINE]);
    if (!alive()) return;
    setPose('sleep');
    zzz.hidden = false;
    await wait(SLEEP_MS);
    if (!alive()) return;
    zzz.hidden = true;
    progress = afterRound(progress);
    saveProgress();
    newRound(true);
  }

  // ---------- Kéo / chạm ----------
  function beginPress(e, id) {
    if (press || e.button > 0) return;
    e.preventDefault();
    press = { id, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, dragging: false };
  }
  function zoneRect(extra = 0) {
    const r = bong.getBoundingClientRect();
    const gx = r.width * ZONE_GROW + extra;
    const gy = r.height * ZONE_GROW + extra;
    return { left: r.left - gx, right: r.right + gx, top: r.top - gy, bottom: r.top + r.height * 0.9 + extra };
  }
  const inside = (z, x, y) => x >= z.left && x <= z.right && y >= z.top && y <= z.bottom;
  function startDrag(e) {
    press.dragging = true;
    play('tap');
    dragGhost = h('div.fd-fly.fd-drag', {}, foodFace(byId(press.id), images));
    document.body.append(dragGhost);
    trayItem(press.id)?.classList.add('lifted');
    moveDrag(e);
  }
  function moveDrag(e) {
    dragGhost.style.left = `${e.clientX}px`;
    dragGhost.style.top = `${e.clientY}px`;
    if (state !== 'requesting') return;
    // Miệng há có vùng đệm: vào vùng thả thì há, ra xa hơn vùng thả + 24 px mới ngậm.
    const open = mouthOpen ? inside(zoneRect(ZONE_HYSTERESIS), e.clientX, e.clientY) : inside(zoneRect(), e.clientX, e.clientY);
    if (open !== mouthOpen) {
      mouthOpen = open;
      setPose(open ? 'open' : 'hungry');
    }
  }
  function endDrag() {
    dragGhost?.remove();
    dragGhost = null;
    trayEl.querySelector('.lifted')?.classList.remove('lifted');
    mouthOpen = false;
  }

  window.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    if (!press.dragging) {
      if (Math.hypot(e.clientX - press.x0, e.clientY - press.y0) < DRAG_START_PX) return;
      startDrag(e);
    }
    e.preventDefault();
    moveDrag(e);
  }, { signal, passive: false });

  window.addEventListener('pointerup', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    const p = press;
    press = null;
    if (p.dragging) {
      const at = { x: e.clientX, y: e.clientY };
      const hit = inside(zoneRect(), at.x, at.y);
      const ghost = dragGhost;
      dragGhost = null;
      endDrag();
      if (hit && state === 'requesting') {
        ghost.remove();
        feed(p.id, at);
      } else {
        // Thả ra ngoài (hoặc Bông đang bận): món bay về khay, không tính gì.
        if (state === 'requesting') setPose('hungry');
        flying.add(ghost);
        flyBack(ghost, p.id);
      }
      return;
    }
    // Chạm (không kéo): món tự bay vào miệng.
    const item = trayItem(p.id);
    if (item && state === 'requesting') feed(p.id, center(item.getBoundingClientRect()));
  }, { signal });

  window.addEventListener('pointercancel', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    press = null;
    endDrag();
    if (state === 'requesting') setPose('hungry');
  }, { signal });

  // Bé chạm / kéo bất cứ đâu: tính lại thời gian nhắc.
  app.root.addEventListener('pointerdown', () => startNudge(), { signal });

  const idleTimer = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  /** Quay lại sau khi app ra nền: chơi tiếp đúng lượt (mục 9). */
  function resume(s) {
    cancelAll();
    belly = s.belly;
    last = s.last;
    tray = s.tray.map(byId).filter(Boolean);
    const food = s.request && byId(s.request.food);
    request = food ? { ...s.request, food, nudges: 0 } : null;
    renderTray();
    renderBelly();
    if (belly >= BELLY) {
      // Đang no / ngủ dở: vào thẳng vòng mới.
      progress = afterRound(progress);
      saveProgress();
      newRound(true);
      return;
    }
    if (!request || request.got >= request.count) {
      nextRequest();
      return;
    }
    state = 'requesting';
    lock(false);
    setPose('hungry');
    renderWish();
    if (request.wrong >= HINT_AFTER_WRONG) setHint(true);
    talk([remindLine(request)]);
    startNudge();
  }

  loadFeedImages(app).then((loaded) => {
    images = loaded;
    if (signal.aborted) return;
    if (images.bg) stage.style.backgroundImage = `url("${images.bg}")`;
    pose = null; // vẽ lại Bông bằng ảnh vừa nạp (nếu có)
    const s = snapshot;
    if (params.continueDirectly && s && Date.now() - s.savedAt < SNAPSHOT_MS && s.level === progress.level && s.tray.length) resume(s);
    else newRound(false);
  });
  setPose('hungry');

  return () => {
    cancelAll();
    clearInterval(idleTimer);
    clearTimeout(captionTimer);
    images?.revoke();
  };
}
