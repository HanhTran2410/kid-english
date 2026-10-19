// Trò Bông trốn tìm (SPEC-hide.md): Bông đếm → đi nấp → bé chạm chỗ nấp để tìm (nhầm thì có bất ngờ, gợi ý đôi tai),
// tìm thấy thì "Peekaboo! I'm under the bed!". Đổi vai: bé chọn chỗ trốn, Bông đi hỏi từng chỗ "Is Na under the bed?".
// Máy trạng thái (mục 8): intro → counting → searching → found; swapIntro → childHiding → bongSeeking → foundChild.
// Mã lượt: hẹn giờ / câu nói của lượt cũ không được đổi trạng thái lượt mới.

import { h } from '../ui.js';
import { mediaBlob, getWordImage } from '../db.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';
import { createBunny } from '../player/teacher.js';
import { bongSvg } from '../bong.js';
import { scaled } from '../timing.js';
import { PROFILE_IMAGES, familyPhotoKey } from '../talk.js';
import {
  W, H, ROOMS, ROOM_BY_ID, earsBox, HIDE_BG_IMAGES, HIDE_BONG_IMAGES, HIDE_ITEM_IMAGES, roomSvg, spotAt, nextHide, seekPlan, surpriseFor,
  cleanHideState, notLine, foundLines, askLine, foundChildLine, surpriseLine, COUNT_WORDS,
  INTRO_LINE, READY_LINE, WHERE_LINE, SWAP_LINE, HIDE_LINE, NO_LINE, YOUR_TURN_LINE, SUGGEST_SWAP_LINE,
} from '../hide-seek.js';

const HINT_AFTER_WRONG = 2;
const HINT_IDLE_MS = 10_000;
const WRONG_TALK_DELAY_MS = 600; // bất ngờ + tiếng hiệu ứng trước, câu "Not under the bed!" sau
const SURPRISE_MS = 1800;
const SWAP_SUGGEST_EVERY = 3;
const SEEK_STEP_MS = 700;
const CAPTION_MS = 3500;
const IDLE_PAUSE_MS = 120_000;
const SNAPSHOT_MS = 10 * 60_000;
const EARS_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <g transform="rotate(-12 34 60)"><ellipse cx="34" cy="58" rx="15" ry="40" fill="#fff8ee" stroke="#e9d5bd" stroke-width="3"/><ellipse cx="34" cy="62" rx="7" ry="28" fill="#ffb3c7"/></g>
  <g transform="rotate(12 66 60)"><ellipse cx="66" cy="58" rx="15" ry="40" fill="#fff8ee" stroke="#e9d5bd" stroke-width="3"/><ellipse cx="66" cy="62" rx="7" ry="28" fill="#ffb3c7"/></g></svg>`;

// Lượt đang chơi dở: app ra nền thì màn được dựng lại (continueDirectly) — chơi tiếp cùng chỗ nấp (mục 9).
let snapshot = null;

/** Ảnh trò chơi (SPEC-hide mục 7): ảnh phòng, Bông theo tư thế, bất ngờ, ảnh bé. */
export async function loadHideImages(app) {
  const urls = [];
  const out = { bg: new Map(), bong: new Map(), items: new Map(), kid: null };
  const add = (img) => {
    const url = URL.createObjectURL(mediaBlob(img));
    urls.push(url);
    return url;
  };
  for (const [lessonId, key] of [[HIDE_BG_IMAGES, 'bg'], [HIDE_BONG_IMAGES, 'bong'], [HIDE_ITEM_IMAGES, 'items']]) {
    for (const img of await app.db.getAllByIndex('images', 'lessonId', lessonId).catch(() => [])) out[key].set(img.word, add(img));
  }
  const kid = await getWordImage(app.db, PROFILE_IMAGES, familyPhotoKey('me')).catch(() => null);
  if (kid) out.kid = add(kid);
  return { ...out, revoke: () => urls.forEach((u) => URL.revokeObjectURL(u)) };
}

const pctBox = ([x, y, w, h]) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(w / W) * 100}%`, height: `${(h / H) * 100}%` });
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, scaled(ms)));
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function hideSeekScreen(app, params = {}) {
  const signal = app.startActivity();
  app.root.className = 'child-screen hs-play';
  let progress = cleanHideState(app.settings.hideSeek);
  const swapOn = () => app.settings.hideSeekSwap !== false;
  const childName = () => String(app.settings.childProfile?.name ?? '').trim();
  let room = ROOM_BY_ID.get(progress.room);
  let images = null;
  let token = 0; // mã lượt
  let actGen = 0; // mã thao tác (chạm nhầm liên tiếp)
  let state = 'start';
  let mode = 'seek';
  let spot = null; // chỗ Bông nấp
  let childSpot = null; // chỗ bé nấp (đổi vai)
  let bag = [];
  let last = null;
  let wrongs = 0;
  let earsOn = false;
  let skipping = false;
  let sessionRounds = 0;
  let surpriseOffset = 0;
  let idleTimer = null;

  // ---------- Giao diện ----------
  const bunny = createBunny(app);
  const bongBtn = h('button.sp-bong', { type: 'button', 'aria-label': 'Bông', onclick: () => skipCount() }, bunny.el);
  const back = h('button.sp-back', { type: 'button', 'aria-label': 'Về trò chơi', text: '🎲', onclick: () => { play('tap'); app.go('play'); } });
  const roomBtn = h('button.sp-back', { type: 'button', 'aria-label': 'Đổi phòng', text: '🏡', onclick: () => { play('tap'); pickRoom(); } });
  const swapBtn = h('button.sp-back.hs-swap', { type: 'button', 'aria-label': 'Đổi vai', text: '🙋', hidden: true, onclick: () => { play('tap'); startSwap(); } });
  const bg = h('div.hs-bg');
  const spotsEl = h('div.hs-spots', { 'aria-hidden': 'true' });
  const layer = h('div.hs-layer');
  const ears = h('div.hs-ears', { hidden: true, 'aria-hidden': 'true' });
  const bong = h('div.hs-bong', { hidden: true, 'aria-hidden': 'true' });
  const kid = h('div.hs-kid', { hidden: true, 'aria-label': 'Bé' });
  const cover = h('div.hs-cover', { hidden: true }, h('span.hs-hands', { text: '🙈' }), h('span.hs-number'));
  const phrase = h('div.hs-phrase', { hidden: true });
  const scene = h('div.hs-scene', { role: 'img' }, bg, spotsEl, layer, cover, phrase);
  layer.append(kid, ears, bong);
  const again = h('button.btn.primary.hs-again', { type: 'button', hidden: true, onclick: () => { play('tap'); startSeek(); } }, '🔁 Again!');
  const swapBig = h('button.btn.hs-again.hs-swap-big', { type: 'button', hidden: true, onclick: () => { play('tap'); startSwap(); } }, '🙋 Đổi vai');
  const sayBox = h('div.hs-say'); // phụ đề nằm hàng riêng dưới tranh: không che đồ vật bé cần chạm
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), back, roomBtn, h('span.sp-title', { text: '🙈 Hide and seek' }), swapBtn, bongBtn),
    h('div.hs-stage', {}, scene),
    sayBox,
    h('div.hs-actions', {}, again, swapBig),
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
    sayBox.append(captionEl);
  }
  async function talk(lines) {
    const gen = ++talkGen;
    for (const [en, vi] of lines) {
      if (gen !== talkGen || signal.aborted) return false;
      caption(en, vi);
      try {
        await app.speaker.speak(en, { signal });
      } catch {
        return false;
      }
    }
    if (gen === talkGen) captionTimer = setTimeout(() => captionEl?.remove(), CAPTION_MS);
    return gen === talkGen;
  }
  function hush() {
    talkGen += 1;
    app.speaker.cancel?.();
  }

  // ---------- Trạng thái ----------
  const newToken = () => {
    token += 1;
    actGen += 1;
    clearTimeout(idleTimer);
    hush();
    return token;
  };
  const alive = (t) => t === token && !signal.aborted;
  function setState(s) {
    state = s;
    app.root.dataset.state = s;
    app.root.dataset.mode = mode;
  }
  function snap() {
    scene.dataset.hide = spot?.id ?? ''; // chỗ Bông đang nấp (để test; không hiện ra màn hình)
    snapshot = {
      savedAt: Date.now(), room: room.id, mode, state, spot: spot?.id ?? null, bag: [...bag], last, sessionRounds, wrongs, earsOn,
    };
  }

  // ---------- Vẽ ----------
  function renderRoom() {
    const url = images?.bg.get(room.id);
    if (url) {
      const img = h('img.hs-bg-img', { src: url, alt: '' });
      img.addEventListener('error', () => { bg.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${roomSvg(room)}</svg>`; }, { once: true });
      bg.replaceChildren(img);
    } else {
      bg.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${roomSvg(room)}</svg>`;
    }
    scene.setAttribute('aria-label', room.en);
    scene.dataset.room = room.id;
    spotsEl.replaceChildren(...room.spots.map((s) => h('div.hs-spot', { dataset: { spot: s.id }, style: pctBox(s.rect) })));
  }
  /** Hình Bông theo tư thế: ảnh bố mẹ thêm, thiếu / hỏng thì Bông vẽ sẵn. */
  function bongArt(pose) {
    const url = images?.bong.get(pose);
    const svg = () => bongSvg({ mood: pose === 'boo' ? 'surprise' : pose === 'cover' ? 'sleep' : 'happy' });
    if (!url) {
      bong.innerHTML = svg();
      return;
    }
    const img = h('img', { src: url, alt: '', draggable: false });
    img.addEventListener('error', () => { bong.innerHTML = svg(); }, { once: true });
    bong.replaceChildren(img);
  }
  function placeBong(s, pose, cls = '') {
    bongArt(pose);
    const [x, y, w, h] = s ? s.rect : [W / 2 - 1, H / 2 - 1, 2, 2];
    const size = 110;
    const left = clamp(x + w / 2 - size / 2, 0, W - size);
    const top = clamp(y + h / 2 - size / 2, 0, H - size);
    Object.assign(bong.style, pctBox([left, top, size, size]));
    bong.className = `hs-bong ${cls}`.trim();
    bong.dataset.pose = pose;
    bong.hidden = false;
  }
  function hideBong() {
    bong.hidden = true;
    bong.replaceChildren();
  }
  function showEars() {
    if (!spot || earsOn) return;
    earsOn = true;
    const url = images?.bong.get('peek');
    if (url) {
      const img = h('img', { src: url, alt: '', draggable: false });
      img.addEventListener('error', () => { ears.innerHTML = EARS_SVG; }, { once: true });
      ears.replaceChildren(img);
    } else ears.innerHTML = EARS_SVG;
    Object.assign(ears.style, pctBox(earsBox(spot)));
    ears.dataset.peek = spot.peek;
    ears.dataset.spot = spot.id;
    ears.hidden = false;
    snap();
  }
  function hideEars() {
    earsOn = false;
    ears.hidden = true;
  }
  function wiggle(el) {
    if (!el) return;
    el.classList.remove('wiggle');
    void el.offsetWidth;
    el.classList.add('wiggle');
  }
  const spotEl = (id) => spotsEl.querySelector(`[data-spot="${id}"]`);
  function clearLayer() {
    hideEars();
    hideBong();
    layer.querySelectorAll('.hs-surprise').forEach((el) => el.remove());
    kid.hidden = true;
    cover.hidden = true;
    phrase.hidden = true;
    again.hidden = true;
    swapBig.hidden = true;
    scene.classList.remove('hiding');
  }
  /** Cụm dưới tranh, giới từ nhấp nháy: **under** the bed. */
  function showPhrase(s) {
    phrase.replaceChildren(h('b.hs-prep', { text: s.prep }), ` ${s.phrase.slice(s.prep.length + 1)}`);
    phrase.hidden = false;
  }
  function updateSwapBtn() {
    swapBtn.hidden = !swapOn() || sessionRounds < 1 || mode !== 'seek' || !['searching', 'found'].includes(state);
  }

  // ---------- Bé đi tìm ----------
  async function startSeek(resume = null) {
    const t = newToken();
    mode = 'seek';
    clearLayer();
    wrongs = resume?.wrongs ?? 0;
    surpriseOffset = Math.floor(Math.random() * room.surprises.length);
    if (resume) {
      spot = room.spots.find((s) => s.id === resume.spot) ?? null;
      bag = resume.bag;
      last = resume.last;
    }
    if (!spot || !resume) {
      const picked = nextHide(room, { bag, last });
      spot = picked.spot;
      bag = picked.bag;
      last = spot.id;
    }
    skipping = false;
    if (resume) {
      if (resume.earsOn) showEars();
      await search(t, WHERE_LINE);
      return;
    }
    setState('intro');
    updateSwapBtn();
    snap();
    placeBong(null, 'boo', 'center');
    await talk([INTRO_LINE]);
    if (!alive(t)) return;
    // Đếm: màn tối, hai tay che mắt, mỗi số hiện đúng lúc đọc. Chỉ chạm Bông mới bỏ qua.
    setState('counting');
    snap();
    cover.hidden = false;
    for (let i = 0; i < progress.count && !skipping; i++) {
      cover.querySelector('.hs-number').textContent = String(i + 1);
      if (i === 1) {
        hideBong();
        play('whoosh'); // tiếng sột soạt khi Bông chạy đi nấp
      }
      await talk([[`${capital(COUNT_WORDS[i])}!`, String(i + 1)]]);
      if (!alive(t)) return;
    }
    await search(t, READY_LINE);
  }

  /** Bé chạm Bông khi đang mở đầu / đếm: bỏ phần còn lại, sang tìm ngay (chỉ một lần). */
  function skipCount() {
    if (mode === 'seek' && (state === 'intro' || state === 'counting') && !skipping) {
      skipping = true;
      play('tap');
      hush();
      return;
    }
    if (state === 'searching') wiggle(earsOn ? ears : null);
  }

  async function search(t, line) {
    hideBong();
    cover.hidden = true;
    setState('searching');
    updateSwapBtn();
    snap();
    if (progress.level === 'easy') showEars();
    await talk([line]);
    if (alive(t) && state === 'searching') armIdle(t);
  }

  /** Mức Thường: 10 giây không chạm (tính từ khi nói xong câu hỏi) thì thò tai. */
  function armIdle(t) {
    clearTimeout(idleTimer);
    if (earsOn || progress.level === 'easy') return;
    idleTimer = setTimeout(() => {
      if (alive(t) && state === 'searching' && !app.idlePaused) showEars();
    }, scaled(HINT_IDLE_MS));
  }

  function wrongTap(s, t) {
    const a = ++actGen;
    hush();
    clearTimeout(idleTimer);
    layer.querySelectorAll('.hs-surprise').forEach((el) => el.remove());
    wrongs += 1;
    snap();
    wiggle(spotEl(s.id));
    // 1) Bất ngờ bật ra + tiếng hiệu ứng (Bông chưa nói).
    const x = surpriseFor(room, wrongs - 1, surpriseOffset);
    const url = images?.items.get(x.id);
    const face = url ? h('img', { src: url, alt: '' }) : h('span.hs-surprise-emoji', { text: x.emoji });
    const [rx, ry, rw, rh] = s.rect;
    const size = 64;
    const pop = h('button.hs-surprise', {
      type: 'button', 'aria-label': x.en, dataset: { surprise: x.id },
      style: pctBox([clamp(rx + rw / 2 - size / 2, 0, W - size), clamp(ry + rh / 2 - size / 2, 0, H - size), size, size]),
      onclick: (e) => {
        e.stopPropagation();
        talk([surpriseLine(x)]);
      },
    }, face, h('span.hs-surprise-name', { text: x.en }));
    layer.append(pop);
    play('pop');
    if (earsOn) {
      wiggle(ears);
      play('sparkle'); // khúc khích
    }
    if (progress.level === 'normal' && wrongs >= HINT_AFTER_WRONG) showEars();
    // 2) Một câu ngắn về chỗ không có Bông. 3) Bất ngờ thu lại.
    setTimeout(() => {
      if (a !== actGen || !alive(t) || state !== 'searching') return;
      talk([notLine(s, wrongs % 3 === 0)]).then(() => {
        if (a === actGen && alive(t) && state === 'searching') armIdle(t);
      });
    }, scaled(WRONG_TALK_DELAY_MS));
    setTimeout(() => pop.remove(), scaled(SURPRISE_MS));
  }

  async function found(t) {
    actGen += 1;
    clearTimeout(idleTimer);
    setState('found');
    hideEars();
    layer.querySelectorAll('.hs-surprise').forEach((el) => el.remove());
    placeBong(spot, 'boo', 'boo');
    play('cheer');
    showPhrase(spot);
    snap();
    await talk(foundLines(spot));
    if (!alive(t)) return;
    sessionRounds += 1;
    progress = { ...progress, rounds: progress.rounds + 1 };
    app.setSetting('hideSeek', progress).catch(() => {});
    again.hidden = false;
    updateSwapBtn();
    snap();
    if (swapOn() && sessionRounds % SWAP_SUGGEST_EVERY === 0) {
      swapBig.hidden = false;
      await talk([SUGGEST_SWAP_LINE]);
    }
  }

  // ---------- Đổi vai: bé đi trốn ----------
  async function startSwap(skipIntro = false) {
    if (!swapOn()) return;
    const t = newToken();
    mode = 'swap';
    clearLayer();
    childSpot = null;
    swapBtn.hidden = true;
    if (!skipIntro) {
      setState('swapIntro');
      snap();
      placeBong(null, 'cover', 'center');
      await talk([SWAP_LINE]);
      for (let i = 0; i < 5; i++) {
        if (!alive(t)) return;
        await talk([[`${capital(COUNT_WORDS[i])}!`, String(i + 1)]]);
      }
      if (!alive(t)) return;
    }
    hideBong();
    setState('childHiding');
    snap();
    scene.classList.add('hiding');
    showKidAt(null);
    await talk([HIDE_LINE]);
  }

  function showKidAt(s) {
    const url = images?.kid;
    const kidEmoji = app.settings.dressUp?.kid === 'boy' ? '👦' : app.settings.dressUp?.kid === 'girl' ? '👧' : '🧒';
    if (url) {
      const img = h('img', { src: url, alt: '', draggable: false });
      img.addEventListener('error', () => kid.replaceChildren(h('span', { text: kidEmoji })), { once: true });
      kid.replaceChildren(img);
    } else kid.replaceChildren(h('span', { text: kidEmoji }));
    const size = 70;
    const box = s
      ? [clamp(s.rect[0] + s.rect[2] / 2 - size / 2, 0, W - size), clamp(s.rect[1] + s.rect[3] / 2 - size / 2, 0, H - size), size, size]
      : [8, H - size - 8, size, size];
    Object.assign(kid.style, pctBox(box));
    kid.classList.remove('gone', 'out');
    kid.hidden = false;
  }

  async function childHides(s, t) {
    setState('bongSeeking');
    scene.classList.remove('hiding');
    childSpot = s;
    snap();
    showKidAt(s);
    play('whoosh');
    kid.classList.add('gone'); // bé "chui" vào chỗ nấp
    await wait(400);
    if (!alive(t)) return;
    kid.hidden = true;
    // Bông đi tìm: 0–2 chỗ sai, chỗ thứ ≤ 3 chắc chắn đúng.
    for (const guess of seekPlan(room, s.id)) {
      placeBong(guess, 'seek', 'seek');
      await wait(SEEK_STEP_MS);
      if (!alive(t)) return;
      await talk([askLine(guess, childName())]);
      if (!alive(t)) return;
      if (guess.id !== s.id) {
        await talk([NO_LINE]);
        if (!alive(t)) return;
        continue;
      }
      setState('foundChild');
      showKidAt(s);
      kid.classList.add('out');
      play('cheer');
      showPhrase(s);
      await talk([foundChildLine(s)]);
      if (!alive(t)) return;
      await talk([YOUR_TURN_LINE]);
      if (!alive(t)) return;
      startSeek();
      return;
    }
  }

  // ---------- Chạm ----------
  const toScene = (e) => {
    const r = scene.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  scene.addEventListener('click', (e) => {
    const { x, y } = toScene(e);
    const s = spotAt(room, x, y);
    if (!s) return; // chạm ngoài mọi chỗ nấp: không có gì
    const t = token;
    if (state === 'searching') {
      if (s.id === spot.id) found(t);
      else wrongTap(s, t);
    } else if (state === 'childHiding') {
      play('tap');
      childHides(s, t);
    }
    // intro / counting / found / Bông đang tìm: chạm vào phòng không có tác dụng.
  }, { signal });

  // Kéo hình bé vào chỗ nấp (không bắt buộc — chạm chỗ nấp cũng được).
  let drag = null;
  kid.addEventListener('pointerdown', (e) => {
    if (state !== 'childHiding') return;
    e.preventDefault();
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY };
    kid.setPointerCapture?.(e.pointerId);
  }, { signal });
  kid.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    kid.style.transform = `translate(${e.clientX - drag.x0}px, ${e.clientY - drag.y0}px)`;
  }, { signal });
  kid.addEventListener('pointerup', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    kid.style.transform = '';
    if (state !== 'childHiding') return;
    const { x, y } = toScene(e);
    const s = spotAt(room, x, y);
    if (s) childHides(s, token);
  }, { signal });

  // ---------- Đổi phòng ----------
  function pickRoom() {
    const close = () => overlay.remove();
    const overlay = h('div.choice-overlay', { onclick: (e) => e.target === overlay && close() },
      h('div.hs-rooms', {}, ...ROOMS.map((r) => h(`button.hs-room${r.id === room.id ? '.on' : ''}`, {
        type: 'button', 'aria-label': r.vi, dataset: { room: r.id },
        onclick: () => {
          close();
          if (r.id === room.id) return;
          room = r;
          bag = [];
          last = null;
          spot = null;
          progress = { ...progress, room: r.id };
          app.setSetting('hideSeek', progress).catch(() => {});
          renderRoom();
          startSeek();
          app.speaker.speak(`The ${r.en}!`).catch(() => {});
        },
      }, h('span.hs-room-emoji', { text: r.emoji }), h('span.home-en', { text: capital(r.en) }), h('span.home-vi', { text: r.vi })))));
    app.root.append(overlay);
  }

  const idlePause = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  /** Quay lại sau khi app ra nền (mục 9). */
  function resume(s) {
    bag = s.bag;
    last = s.last;
    sessionRounds = s.sessionRounds;
    if (s.mode === 'swap') {
      startSwap(true);
      return;
    }
    if (s.state === 'found') {
      newToken();
      spot = room.spots.find((sp) => sp.id === s.spot) ?? null;
      if (!spot) {
        startSeek();
        return;
      }
      clearLayer();
      mode = 'seek';
      setState('found');
      placeBong(spot, 'boo', 'boo');
      showPhrase(spot);
      again.hidden = false;
      updateSwapBtn();
      return;
    }
    startSeek(s);
  }

  loadHideImages(app).then((loaded) => {
    images = loaded;
    if (signal.aborted) return;
    renderRoom();
    const s = snapshot;
    if (params.continueDirectly && s && Date.now() - s.savedAt < SNAPSHOT_MS && s.room === room.id) resume(s);
    else startSeek();
  });

  return () => {
    token += 1;
    hush();
    clearTimeout(idleTimer);
    clearTimeout(captionTimer);
    clearInterval(idlePause);
    bunny.destroy();
    images?.revoke();
  };
}
