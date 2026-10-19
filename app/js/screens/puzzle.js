// Trò Ghép hình cùng Bông (SPEC-puzzle.md): chọn cách chơi (ghép bộ phận / ghép cả bức tranh) → chọn hình → ghép.
// Kéo mảnh từ khay thả vào khung: đúng (điểm neo của chính mảnh, trong bán kính hút) thì hút vào chỗ, sai thì nảy về
// khay ("Oops! Try again!", lần 2 "Look! Here!" + chỗ đúng sáng), thả ra ngoài thì về khay không nói gì.
// Mã lượt: hẹn giờ / câu nói / hoạt ảnh của lượt cũ không được đổi trạng thái lượt mới.

import { h } from '../ui.js';
import { mediaBlob, getWordImage } from '../db.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';
import { createBunny } from '../player/teacher.js';
import { scaled } from '../timing.js';
import { markPracticed } from '../player/track.js';
import { COLOR_BY_ID, cleanColors } from '../coloring.js';
import { soundOf } from '../word-play.js';
import { FAMILY, PROFILE_IMAGES, familyPhotoKey } from '../talk.js';
import {
  FRAME, PART_PUZZLES, PUZZLE_PHOTOS, MIN_PHOTO_PX, partPuzzle, judgeDrop, gridCells, piecesForNext, cleanPuzzleState, afterDone,
  cropSquare, cleanPuzzlePhotos, makeLine, whereLine, yesPartLine, namePartLine, doneLine, familyDoneLine,
  OOPS_LINE, LOOK_LINE, PICTURE_LINE, YES_LINE, GOOD_LINE,
} from '../puzzle.js';

const DRAG_START_PX = 8;
const SNAP_MS = 320;
const GLOW_MS = 1000;
const CAPTION_MS = 3500;
const IDLE_PAUSE_MS = 120_000;
const SNAPSHOT_MS = 10 * 60_000;
const INK = '#2b2b2b';
const GHOST_FILL = '#ece6f5';
const GHOST_LINE = '#b8a9d6';

// Lượt đang ghép dở: app ra nền thì màn được dựng lại (continueDirectly) — giữ các mảnh đã đặt (mục 7).
let snapshot = null;

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------- Vẽ hình ghép bộ phận ----------
/** Màu mới nhất của hình (Tô màu): phần đã tô dùng màu đó, chưa tô / tẩy trắng / dữ liệu hỏng dùng màu mặc định. */
export function partColors(app, pic) {
  let saved = {};
  try {
    saved = cleanColors(pic, app.settings.coloring?.[pic.id]);
  } catch {
    saved = {};
  }
  return Object.fromEntries(pic.parts.map((p) => [p.id, COLOR_BY_ID.get(saved[p.id] ?? p.colors[0])?.hex ?? '#ffffff']));
}

function partShape(p, hex, ghost = false) {
  if (ghost) {
    return `<g class="pz-ghost" data-slot="${p.id}" fill="${GHOST_FILL}" stroke="${GHOST_LINE}" stroke-width="2.5" stroke-dasharray="6 5" stroke-linejoin="round">${p.shapes}</g>`;
  }
  if (p.line) {
    return `<g data-part="${p.id}" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${INK}" stroke-width="13">${p.shapes}</g><g stroke="${hex}" stroke-width="7">${p.shapes}</g></g>`;
  }
  return `<g data-part="${p.id}" fill="${hex}" stroke="${INK}" stroke-width="3" stroke-linejoin="round">${p.shapes}</g>`;
}

/** Cả hình trên khung 200 × 200: mảnh chưa đặt là bóng mờ, mảnh đã đặt + phần vẽ sẵn có màu; lớp theo dữ liệu Tô màu. */
export function partBoardSvg(puzzle, colors, placed) {
  const pieceIds = new Set(puzzle.order);
  const parts = puzzle.pic.parts.map((p) => partShape(p, colors[p.id], pieceIds.has(p.id) && !placed.has(p.id))).join('');
  const details = puzzle.pic.details
    ? `<g pointer-events="none" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="pz-details">${puzzle.pic.details}</g>`
    : '';
  return `<svg viewBox="0 0 ${FRAME} ${FRAME}" xmlns="http://www.w3.org/2000/svg">${parts}${details}</svg>`;
}

/** Một mảnh (chỉ bộ phận đó) — viewBox là khung bao của nó, nên vẽ ở cỡ nào cũng khớp đúng tọa độ khi đặt vào. */
function pieceSvg(piece, hex) {
  const [x, y, w, hh] = piece.box;
  return `<svg viewBox="${x - 4} ${y - 4} ${w + 8} ${hh + 8}" xmlns="http://www.w3.org/2000/svg">${partShape(piece, hex)}</svg>`;
}

/** Ảnh của hình Tô màu (màu mới nhất) dạng data URL — dùng cho ghép tranh nhóm "Con vật và đồ vật". */
function svgPictureUrl(app, puzzle) {
  const colors = partColors(app, puzzle.pic);
  const all = new Set(puzzle.order);
  const svg = partBoardSvg(puzzle, colors, all).replace('<svg ', '<svg style="background:#ffffff" ');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Cắt ảnh thành ô vuông (vị trí start / center / end) → URL ảnh (để chia mảnh lúc chơi, không lưu lại). */
async function squareUrl(blob, pos = 'center', urls = []) {
  const bmp = await createImageBitmap(blob);
  const { sx, sy, size } = cropSquare(bmp.width, bmp.height, pos);
  const out = Math.min(size, 900);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  canvas.getContext('2d').drawImage(bmp, sx, sy, size, size, 0, 0, out, out);
  bmp.close?.();
  const square = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  const url = URL.createObjectURL(square);
  urls.push(url);
  return url;
}

// ---------- Danh sách tranh (ghép cả bức tranh) ----------
/**
 * Bốn nhóm (mục 5.1): Từ vựng (theo bài, mỗi từ ảnh mới nhất), Con vật và đồ vật (luôn có), Gia đình (bật / tắt),
 * Ảnh của bố mẹ. Dựng lại mỗi lần mở: ảnh nguồn đã xóa thì thẻ biến mất.
 */
export async function gridGroups(app) {
  const groups = [];
  const byWord = new Map();
  const lessons = await app.db.getAll('lessons').catch(() => []);
  for (const lesson of lessons) {
    for (const img of await app.db.getAllByIndex('images', 'lessonId', lesson.id).catch(() => [])) {
      if (String(img.word).includes(':')) continue; // ảnh trong bài hội thoại (pic:…) không phải ảnh từ
      if ((img.width && img.width < MIN_PHOTO_PX) || (img.height && img.height < MIN_PHOTO_PX)) continue;
      const prev = byWord.get(img.word);
      if (!prev || img.createdAt > prev.img.createdAt) byWord.set(img.word, { img, lesson });
    }
  }
  const lessonsWithCards = new Map();
  for (const [word, { img, lesson }] of byWord) {
    const w = (lesson.words ?? []).find((x) => String(x.en ?? '').toLowerCase() === word) ?? { en: word };
    const card = { key: `grid:word:${word}`, kind: 'word', lessonId: lesson.id, word, en: w.en ?? word, vi: w.vi ?? '', sound: soundOf(w), emoji: w.emoji, img };
    if (!lessonsWithCards.has(lesson.id)) lessonsWithCards.set(lesson.id, { lesson, cards: [] });
    lessonsWithCards.get(lesson.id).cards.push(card);
  }
  const vocab = [...lessonsWithCards.values()].flatMap(({ lesson, cards }) => cards.map((c) => ({ ...c, group: lesson.title })));
  if (vocab.length) groups.push({ id: 'words', emoji: '📚', en: 'Words', vi: 'Từ vựng', cards: vocab });
  groups.push({
    id: 'svg', emoji: '🐾', en: 'Animals & things', vi: 'Con vật và đồ vật',
    cards: PART_PUZZLES.map((p) => {
      const pz = partPuzzle(p.picture);
      return { key: `grid:svg:${p.picture}`, kind: 'svg', id: p.picture, en: pz.pic.en, vi: pz.pic.vi, sound: '' };
    }),
  });
  if (app.settings.puzzleFamily !== false) {
    const people = [{ id: 'me', en: 'you', vi: 'con', emoji: '🧒' }, ...FAMILY];
    const fam = [];
    for (const m of people) {
      const img = await getWordImage(app.db, PROFILE_IMAGES, familyPhotoKey(m.id)).catch(() => null);
      if (img) fam.push({ key: `grid:family:${m.id}`, kind: 'family', member: m, en: m.en, vi: m.vi, img, crop: app.settings.puzzleCrop?.[m.id] ?? 'center' });
    }
    if (fam.length) groups.push({ id: 'family', emoji: '👨‍👩‍👧', en: 'Family', vi: 'Gia đình', cards: fam });
  }
  const photos = [];
  for (const p of cleanPuzzlePhotos(app.settings.puzzlePhotos)) {
    const img = await getWordImage(app.db, PUZZLE_PHOTOS, p.id).catch(() => null);
    if (img) photos.push({ key: `grid:photo:${p.id}`, kind: 'photo', id: p.id, en: p.en, vi: p.vi, img, crop: p.crop });
  }
  if (photos.length) groups.push({ id: 'photos', emoji: '📷', en: 'My photos', vi: 'Ảnh của bố mẹ', cards: photos });
  return groups;
}

/** Ảnh vuông của một thẻ ghép tranh. */
async function cardImageUrl(app, card, urls) {
  if (card.kind === 'svg') return svgPictureUrl(app, partPuzzle(card.id));
  return squareUrl(mediaBlob(card.img), card.crop ?? 'center', urls);
}

const savedPuzzle = (app) => cleanPuzzleState(app.settings.puzzle);
const saveMode = (app, mode) => app.setSetting('puzzle', { ...savedPuzzle(app), mode }).catch(() => {});
const backToGames = (app) => h('button.sp-back', { type: 'button', 'aria-label': 'Về trò chơi', text: '🎲', onclick: () => { play('tap'); app.go('play'); } });

// ---------- Chọn cách chơi ----------
export function puzzleHome(app) {
  app.root.className = 'child-screen pz-home';
  const last = savedPuzzle(app).mode;
  const card = (mode, icon, en, vi, sub) => h(`button.pz-mode${mode === last ? '.last' : ''}`, {
    type: 'button', 'aria-label': vi, dataset: { mode },
    onclick: () => {
      play('tap');
      saveMode(app, mode);
      app.go('puzzle-list', { mode });
    },
  }, h('span.pz-mode-icon', { text: icon }), h('span.home-en', { text: en }), h('span.home-vi', { text: vi }), h('span.pz-mode-sub', { text: sub }));
  app.root.append(
    h('header.child-top', {}, homeButton(app), backToGames(app)),
    h('div.pz-modes', {},
      card('parts', '🦋', 'Body parts', 'Ghép bộ phận', 'head, body, wings, tail…'),
      card('grid', '🖼️', 'Whole picture', 'Ghép cả bức tranh', 'con vật, đồ vật, gia đình')));
  app.speaker.speak("Let's make a puzzle!").catch(() => {});
}

// ---------- Chọn hình ----------
export function puzzleList(app, params = {}) {
  app.root.className = 'child-screen pz-list';
  const mode = params.mode === 'grid' ? 'grid' : 'parts';
  const urls = [];
  const back = h('button.sp-back', { type: 'button', 'aria-label': 'Chọn cách chơi', text: '🧩', onclick: () => { play('tap'); app.go('puzzle'); } });
  const body = h('div.pz-groups');
  app.root.append(h('header.child-top', {}, homeButton(app), backToGames(app), back), body);
  const state = savedPuzzle(app);
  const cardBtn = (key, label, face, text) => h('button.pz-card', {
    type: 'button', 'aria-label': label, dataset: { card: key },
    onclick: () => {
      play('tap');
      app.go('puzzle-play', { mode, card: key });
    },
  }, face, state.done[key] ? h('span.pz-done', { text: '✨' }) : null, text ? h('span.pz-card-text', { text }) : null);

  if (mode === 'parts') {
    body.append(h('div.pz-cards', {}, ...PART_PUZZLES.map((p) => {
      const pz = partPuzzle(p.picture);
      const face = h('span.pz-thumb', { html: partBoardSvg(pz, partColors(app, pz.pic), new Set(pz.order)) });
      return cardBtn(`parts:${p.picture}`, pz.pic.vi, face, pz.pic.en);
    })));
  } else {
    gridGroups(app).then((groups) => {
      body.replaceChildren(...groups.map((g) => h('section.pz-group', { dataset: { group: g.id } },
        h('h2.pz-group-title', {}, h('span', { text: `${g.emoji} ${g.en}` }), h('span.muted', { text: ` · ${g.vi}` })),
        h('div.pz-cards', {}, ...g.cards.map((c) => {
          let face;
          if (c.kind === 'svg') face = h('img.pz-thumb', { src: svgPictureUrl(app, partPuzzle(c.id)), alt: '' });
          else {
            face = h('img.pz-thumb', { alt: '' });
            squareUrl(mediaBlob(c.img), c.crop ?? 'center', urls).then((u) => { face.src = u; }).catch(() => face.closest('.pz-card')?.remove());
          }
          return cardBtn(c.key, c.kind === 'family' ? c.member.vi : (c.vi || c.en), face, c.kind === 'family' ? c.member.vi : c.en);
        })))));
    });
  }
  app.speaker.speak(mode === 'parts' ? 'Body parts!' : 'Pictures!').catch(() => {});
  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}

// ---------- Màn ghép ----------
export function puzzleScreen(app, params = {}) {
  const signal = app.startActivity();
  app.root.className = 'child-screen pz-play';
  const mode = params.mode === 'grid' ? 'grid' : 'parts';
  const key = String(params.card ?? '');
  const urls = [];
  let token = 0;
  let round = null; // { targets, wrongs, n, done, pieces, card, puzzle, colors, url }
  let busy = false; // mảnh đang hút / nảy về: khay khóa
  let press = null;
  let ghost = null;
  let nextKey = null;

  // ---------- Giao diện ----------
  const bunny = createBunny(app);
  const bongBtn = h('button.sp-bong', { type: 'button', 'aria-label': 'Bông', onclick: () => { play('tap'); askAgain(); } }, bunny.el);
  const listBtn = h('button.sp-back', { type: 'button', 'aria-label': 'Chọn hình khác', text: '🧩', onclick: () => { play('tap'); app.go('puzzle-list', { mode }); } });
  const againBtn = h('button.sp-back', { type: 'button', 'aria-label': 'Ghép lại', text: '🔁', onclick: () => { play('tap'); againBtn.disabled = true; start(true); } });
  const title = h('span.sp-title');
  const board = h('div.pz-board');
  const frame = h('div.pz-frame', {}, board);
  const sayBox = h('div.pz-say');
  const tray = h('div.pz-tray', { 'aria-label': 'Các mảnh ghép' });
  const nextBtn = h('button.btn.primary.pz-next', { type: 'button', hidden: true, onclick: () => goNext() }, '➡️ Next');
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), backToGames(app), listBtn, againBtn, title, bongBtn),
    h('div.pz-stage', {}, frame),
    sayBox,
    h('div.pz-bottom', {}, tray, nextBtn),
  );

  // ---------- Nói + phụ đề (hàng riêng, cao cố định) ----------
  let talkGen = 0;
  let captionTimer = null;
  function caption(en, vi) {
    clearTimeout(captionTimer);
    sayBox.replaceChildren(h('div.caption.sp-caption', { 'aria-live': 'polite' },
      h('span.caption-en', { text: en }), vi ? h('span.caption-vi', { text: vi }) : null));
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
    if (gen === talkGen) captionTimer = setTimeout(() => sayBox.replaceChildren(), CAPTION_MS);
  }
  function hush() {
    talkGen += 1;
    app.speaker.cancel?.();
  }

  // ---------- Vẽ ----------
  const placed = () => new Set(round.targets.filter((t) => t.placed).map((t) => t.id));
  function renderBoard() {
    if (mode === 'parts') {
      board.innerHTML = partBoardSvg(round.puzzle, round.colors, placed());
      return;
    }
    const { url } = round;
    board.replaceChildren(h('img.pz-guide', { src: url, alt: '' }), ...round.targets.map((t) => {
      const [x, y, w, hh] = t.box;
      const slot = h('div.pz-slot', { dataset: { slot: t.id }, style: { left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${hh * 100}%` } });
      if (t.placed) Object.assign(slot.style, cellBackground(t, url));
      slot.classList.toggle('filled', Boolean(t.placed));
      return slot;
    }));
  }
  function cellBackground(t, url) {
    const pos = (i, k) => (k > 1 ? `${(i / (k - 1)) * 100}%` : '0%');
    return {
      backgroundImage: `url("${url}")`, backgroundSize: `${t.cols * 100}% ${t.rows * 100}%`,
      backgroundPosition: `${pos(t.col, t.cols)} ${pos(t.row, t.rows)}`,
    };
  }
  function pieceFace(t) {
    if (mode === 'parts') return h('span.pz-piece-art', { html: pieceSvg(t, round.colors[t.id]) });
    return h('span.pz-cell', { style: cellBackground(t, round.url) });
  }
  function renderTray() {
    const left = round.trayOrder.map((id) => round.targets.find((t) => t.id === id)).filter((t) => !t.placed);
    tray.replaceChildren(...left.map((t) => {
      const el = h('button.pz-piece', { type: 'button', 'aria-label': t.en ?? `piece ${t.id}`, dataset: { piece: t.id } }, pieceFace(t));
      if (mode === 'grid') {
        // Mảnh lưới giữ đúng tỉ lệ ô (cạnh ngắn ≥ 64 px).
        const ratio = (1 / t.cols) / (1 / t.rows);
        const short = 72;
        el.style.width = `${ratio >= 1 ? short * ratio : short}px`;
        el.style.height = `${ratio >= 1 ? short : short / ratio}px`;
      }
      el.addEventListener('pointerdown', (e) => beginPress(e, t.id));
      return el;
    }));
    tray.hidden = !left.length;
  }
  /** Chỗ đúng của mảnh sáng lên (gợi ý). */
  function glow(id, ms = GLOW_MS) {
    const el = mode === 'parts' ? board.querySelector(`[data-slot="${id}"]`) : board.querySelector(`.pz-slot[data-slot="${id}"]`);
    if (!el) return;
    el.classList.add('glow');
    setTimeout(() => el.classList.remove('glow'), ms); // gợi ý chỉ là hình, không chặn lượt: luôn sáng đủ thời gian thật
  }
  function nudgeTray(id) {
    const el = tray.querySelector(`[data-piece="${id}"]`);
    if (!el) return;
    el.classList.remove('nudge');
    void el.offsetWidth;
    el.classList.add('nudge');
  }
  function snap() {
    if (!round) return;
    snapshot = { savedAt: Date.now(), key, mode, n: round.n, placed: [...placed()], wrongs: { ...round.wrongs }, trayOrder: round.trayOrder };
  }

  // ---------- Lượt ----------
  const currentAsk = () => (mode === 'parts' ? round.targets.find((t) => !t.placed) : null);
  function askAgain() {
    if (!round || round.done) return;
    const t = currentAsk();
    if (t) {
      nudgeTray(t.id);
      talk([whereLine(t)]);
    } else talk([PICTURE_LINE]);
  }

  async function loadCard() {
    if (mode === 'parts') {
      const puzzle = partPuzzle(key.replace(/^parts:/, ''));
      if (!puzzle) return null;
      return { puzzle, colors: partColors(app, puzzle.pic), name: puzzle.pic };
    }
    const groups = await gridGroups(app);
    const cards = groups.flatMap((g) => g.cards);
    const i = cards.findIndex((c) => c.key === key);
    if (i < 0) return null;
    nextKey = cards[(i + 1) % cards.length]?.key ?? null;
    const card = cards[i];
    return { card, url: await cardImageUrl(app, card, urls) };
  }

  async function start(again = false, resume = null) {
    const t = ++token;
    hush();
    busy = false;
    nextBtn.hidden = true;
    frame.className = 'pz-frame';
    const loaded = round?.loadedKey === key && again ? round.loaded : await loadCard();
    if (t !== token || signal.aborted) return;
    if (!loaded) {
      app.go('puzzle-list', { mode });
      return;
    }
    if (mode === 'parts') {
      const { puzzle } = loaded;
      const next = PART_PUZZLES[(PART_PUZZLES.findIndex((p) => p.picture === puzzle.picture) + 1) % PART_PUZZLES.length];
      nextKey = `parts:${next.picture}`;
      round = {
        loaded, loadedKey: key, puzzle, colors: loaded.colors, done: false, wrongs: {}, n: null,
        targets: puzzle.pieces.map((p) => ({ ...p, placed: false })),
      };
      title.textContent = `🧩 ${puzzle.pic.en.charAt(0).toUpperCase()}${puzzle.pic.en.slice(1)}`;
    } else {
      // 🔁 / ra nền giữ số mảnh của tranh đang chơi; lượt mới mới lấy số mảnh theo bộ đếm.
      const n = resume?.n ?? (again && round ? round.n : piecesForNext(savedPuzzle(app)));
      round = {
        loaded, loadedKey: key, url: loaded.url, card: loaded.card, done: false, wrongs: {}, n,
        targets: gridCells(n).map((c) => ({ ...c, placed: false })),
      };
      title.textContent = '🧩 Puzzle';
    }
    round.trayOrder = resume?.trayOrder ?? shuffle(round.targets.map((x) => x.id));
    if (resume) {
      for (const tg of round.targets) tg.placed = resume.placed.includes(tg.id);
      round.wrongs = resume.wrongs;
    }
    app.root.dataset.state = 'playing';
    app.root.dataset.pieces = String(round.targets.length);
    frame.dataset.card = key;
    renderBoard();
    renderTray();
    againBtn.disabled = false;
    snap();
    if (resume) {
      askAgain();
      return;
    }
    const intro = mode === 'parts' ? makeLine(round.puzzle.pic) : PICTURE_LINE;
    const first = currentAsk();
    if (first) nudgeTray(first.id);
    await talk([intro, ...(first ? [whereLine(first)] : [])]);
  }

  function right(t, ghostEl) {
    t.placed = true;
    play('pop');
    snap();
    const finish = () => {
      ghostEl?.remove();
      renderBoard();
      renderTray();
      busy = false;
      if (round.targets.every((x) => x.placed)) {
        done();
        return;
      }
      const ask = currentAsk();
      if (mode === 'parts') {
        talk([yesPartLine(t), ...(ask ? [whereLine(ask)] : [])]);
        if (ask) nudgeTray(ask.id);
      } else {
        const count = round.targets.filter((x) => x.placed).length;
        talk([count % 3 === 0 ? GOOD_LINE : YES_LINE]);
      }
    };
    flyTo(ghostEl, targetRect(t), finish);
  }

  function wrong(t, ghostEl) {
    round.wrongs[t.id] = (round.wrongs[t.id] ?? 0) + 1;
    play('boing');
    snap();
    const second = round.wrongs[t.id] >= 2;
    if (second) glow(t.id, 2000);
    talk([second ? LOOK_LINE : OOPS_LINE]);
    flyBack(ghostEl, t.id);
  }

  async function done() {
    if (round.done) return; // câu hoàn thành + tiến độ chỉ một lần
    round.done = true;
    const t = token;
    app.root.dataset.state = 'done';
    frame.classList.add('done', `dance-${mode === 'parts' ? round.puzzle.dance : 'bounce'}`);
    play('tada');
    const progress = afterDone(savedPuzzle(app), key, mode === 'grid' ? round.n : null);
    app.setSetting('puzzle', { ...progress, mode }).catch(() => {});
    snapshot = null;
    let line;
    if (mode === 'parts') line = doneLine(round.puzzle.pic);
    else if (round.card.kind === 'family') line = familyDoneLine(round.card.member);
    else line = doneLine({ en: round.card.en, vi: round.card.vi, sound: round.card.sound });
    if (round.card?.kind === 'word') markPracticed(app, round.card.en, round.card.emoji);
    await talk([line]);
    if (t !== token || signal.aborted) return;
    nextBtn.hidden = false;
    nextBtn.disabled = false;
  }

  function goNext() {
    if (nextBtn.disabled) return;
    nextBtn.disabled = true; // bấm liên tục: chỉ một lượt mới
    play('tap');
    app.go('puzzle-play', { mode, card: nextKey ?? key });
  }

  // ---------- Kéo / thả ----------
  const frameScale = () => {
    const r = board.getBoundingClientRect();
    return { r, s: r.width / (mode === 'parts' ? FRAME : 1) };
  };
  /** Ô trên màn hình của chỗ đích (để mảnh bay tới). */
  function targetRect(t) {
    const { r, s } = frameScale();
    const [x, y, w, hh] = t.box;
    const pad = mode === 'parts' ? 4 : 0;
    return { left: r.left + (x - pad) * s, top: r.top + (y - pad) * s, width: (w + 2 * pad) * s, height: (hh + 2 * pad) * s };
  }
  function makeGhost(t) {
    const rect = targetRect(t); // mảnh kéo hiện đúng cỡ như khi đã đặt
    const el = h('div.pz-ghost-piece', { style: { width: `${rect.width}px`, height: `${rect.height}px` } }, pieceFace(t));
    document.body.append(el);
    return el;
  }
  function moveGhost(e) {
    const w = ghost.offsetWidth;
    const hh = ghost.offsetHeight;
    ghost.style.left = `${e.clientX - w / 2}px`;
    ghost.style.top = `${e.clientY - hh / 2}px`;
  }
  function flyTo(el, rect, then) {
    const ms = reduceMotion() || !el ? 0 : scaled(SNAP_MS);
    if (!ms) {
      then();
      return;
    }
    el.animate([{ left: el.style.left, top: el.style.top }, { left: `${rect.left}px`, top: `${rect.top}px` }], { duration: ms, easing: 'ease-out', fill: 'forwards' })
      .finished.then(then, then);
  }
  function flyBack(el, id) {
    const item = tray.querySelector(`[data-piece="${id}"]`);
    item?.classList.remove('lifted');
    const finish = () => {
      el?.remove();
      busy = false;
    };
    if (!item || !el) {
      finish();
      return;
    }
    const r = item.getBoundingClientRect();
    flyTo(el, { left: r.left + r.width / 2 - el.offsetWidth / 2, top: r.top + r.height / 2 - el.offsetHeight / 2 }, finish);
  }

  function beginPress(e, id) {
    if (press || busy || !round || round.done || e.button > 0) return; // một lần chỉ một mảnh
    e.preventDefault();
    press = { id, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, dragging: false };
  }

  window.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    if (!press.dragging) {
      if (Math.hypot(e.clientX - press.x0, e.clientY - press.y0) < DRAG_START_PX) return;
      press.dragging = true;
      hush(); // câu đọc tên mảnh / câu hỏi đang nói bị hủy khi bắt đầu kéo
      const t = round.targets.find((x) => x.id === press.id);
      ghost = makeGhost(t);
      tray.querySelector(`[data-piece="${press.id}"]`)?.classList.add('lifted');
      play('tap');
    }
    e.preventDefault();
    moveGhost(e);
    // Mức dễ: chỗ đúng của chính mảnh sáng nhẹ khi mảnh tới gần.
    if (mode === 'parts' || round.n <= 4) {
      const t = round.targets.find((x) => x.id === press.id);
      const { r, s } = frameScale();
      const near = Math.hypot((e.clientX - r.left) / s - t.anchor.x, (e.clientY - r.top) / s - t.anchor.y) <= t.radius * 1.6;
      const el = mode === 'parts' ? board.querySelector(`[data-slot="${t.id}"]`) : board.querySelector(`.pz-slot[data-slot="${t.id}"]`);
      el?.classList.toggle('near', near);
    }
  }, { signal, passive: false });

  window.addEventListener('pointerup', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    const p = press;
    press = null;
    const t = round?.targets.find((x) => x.id === p.id);
    if (!t) return;
    board.querySelectorAll('.near').forEach((el) => el.classList.remove('near'));
    if (!p.dragging) {
      // Chạm (không kéo): mảnh nhún, Bông nói tên mảnh, chỗ đúng sáng 1 giây — không tự đặt mảnh.
      nudgeTray(t.id);
      glow(t.id);
      if (mode === 'parts') talk([namePartLine(t)]);
      else play('tap');
      return;
    }
    const el = ghost;
    ghost = null;
    if (busy) {
      flyBack(el, t.id);
      return;
    }
    busy = true;
    const { r, s } = frameScale();
    // Điểm neo của mảnh = tâm mảnh đang kéo = vị trí ngón tay (mảnh luôn được đặt giữa ngón tay). Không đo khung của mảnh:
    // máy bật "giảm chuyển động" có transition rất ngắn, đo ngay lúc thả vẫn ra vị trí cũ → thả đúng mà tính trượt.
    const c = { x: e.clientX, y: e.clientY };
    const verdict = judgeDrop(round.targets, t.id, { x: (c.x - r.left) / s, y: (c.y - r.top) / s });
    if (verdict === 'right') right(t, el);
    else if (verdict === 'wrong') wrong(t, el);
    else flyBack(el, t.id); // ra ngoài: về khay, không nói gì
  }, { signal });

  window.addEventListener('pointercancel', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    const p = press;
    press = null;
    if (ghost) {
      const el = ghost;
      ghost = null;
      flyBack(el, p.id);
    }
  }, { signal });

  const idlePause = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  const s = snapshot;
  const resume = params.continueDirectly && s && s.key === key && s.mode === mode && Date.now() - s.savedAt < SNAPSHOT_MS ? s : null;
  start(false, resume);

  return () => {
    token += 1;
    hush();
    clearTimeout(captionTimer);
    clearInterval(idlePause);
    ghost?.remove();
    document.querySelectorAll('.pz-ghost-piece').forEach((el) => el.remove());
    bunny.destroy();
    urls.forEach((u) => URL.revokeObjectURL(u));
  };
}
