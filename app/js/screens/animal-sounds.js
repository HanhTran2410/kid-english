// Trò Ai kêu thế? (SPEC-sounds.md): chọn kiểu (Con vật / Đồ vật / Trộn) → nghe tiếng kêu thật (file ghi âm; thiếu thì
// Bông đọc tiếng kêu) → "Who says moo?" / "What goes choo choo?" → bé chạm đúng trong 4 hình.
// Nhầm thì Bông nói tên + tiếng kêu của thứ vừa chạm rồi hỏi lại; nhầm 2 lần / 10 giây không chạm thì hình đúng sáng lên.
// 5 câu → Hoan hô + sticker. Hình = sticker Dán tranh (ảnh bố mẹ đã thay dùng luôn), không có thì emoji.

import { h } from '../ui.js';
import { play, audioContext, isAudioLocked } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';
import { createBunny, Teacher } from '../player/teacher.js';
import { runCompletion } from '../player/completion-stage.js';
import { markPracticed } from '../player/track.js';
import { scaled } from '../timing.js';
import { mediaBlob } from '../db.js';
import { loadSceneImages, itemFace } from './sticker-scene.js';
import {
  SOUND_BY_ID, KINDS, roundQuestions, cleanSoundsState, afterSoundsRound, soundUrl, SOUNDS_IMAGES, SOUNDS_AUDIO, MAX_SOUND_SECONDS,
  INTRO_LINES, soundLine, whoLine, yesLine, yourTurnLine, wrongLine, shortWrongLine,
} from '../animal-sounds.js';

const HINT_MS = 10_000;
const MAX_HINTS = 2;
const CAPTION_MS = 3500;
const TURN_MS = 1800; // sau "Can you say moo?": chờ bé kêu theo
const WRONG_LOCK_MS = 400; // vừa chạm nhầm: bỏ qua chạm NHẦM tiếp trong chừng này (chạm liên tục không tính nhiều lần)
const IDLE_PAUSE_MS = 120_000;
const SNAPSHOT_MS = 10 * 60_000;

const SOUND_MAX_MS = MAX_SOUND_SECONDS * 1000; // tiếng dài quá thì cắt ở đây

// Lượt đang chơi: app ra nền thì màn được dựng lại (continueDirectly) — chơi tiếp đúng câu.
let snapshot = null;
// File tiếng đã giải mã (dùng lại giữa các câu / các lần vào trò).
const decoded = new Map();

const KIND_LABEL = {
  animals: { emoji: '🐮', en: 'Animals', vi: 'Con vật', title: '🐮 Who says moo?' },
  things: { emoji: '🚂', en: 'Things', vi: 'Đồ vật', title: '🚂 What goes choo choo?' },
  mix: { emoji: '🎲', en: 'Mix', vi: 'Trộn cả hai', title: '🎲 What makes that sound?' },
};

/** Chọn kiểu: Con vật / Đồ vật / Trộn. */
export function animalSoundsHome(app) {
  app.root.className = 'child-screen bb-home as-home';
  const back = h('button.sp-back', { type: 'button', 'aria-label': 'Chọn kiểu', text: '🔊', onclick: () => { play('tap'); app.go('animal-sounds'); } });
  const grid = h('div.bb-modes');
  app.root.append(h('header.child-top', {}, homeButton(app), back), grid);
  grid.append(...KINDS.map((kind) => {
    const k = KIND_LABEL[kind];
    return h('button.home-btn.bb-mode.as-kind', {
      type: 'button', 'aria-label': k.vi, dataset: { kind },
      onclick: () => { play('tap'); app.go('animal-sounds-play', { kind }); },
    }, h('span.home-emoji', { text: k.emoji }), h('span.home-text', {}, h('span.home-en', { text: k.en }), h('span.home-vi', { text: k.vi })));
  }));
  app.speaker.speak(INTRO_LINES.mix[0]).catch(() => {});
}

/**
 * Ảnh + tiếng của trò: sticker Dán tranh (theo tên), ảnh bố mẹ thêm cho thứ không có sticker, tiếng bố mẹ thêm.
 * @returns {Promise<{ scene, image: Map<string,string>, audio: Map<string,object>, revoke: () => void }>}
 */
export async function loadSoundAssets(app) {
  const scene = await loadSceneImages(app.db).catch(() => null);
  const urls = [];
  const image = new Map();
  for (const img of await app.db.getAllByIndex('images', 'lessonId', SOUNDS_IMAGES).catch(() => [])) {
    const url = URL.createObjectURL(mediaBlob(img));
    urls.push(url);
    image.set(img.word, url);
  }
  const audio = new Map((await app.db.getAllByIndex('images', 'lessonId', SOUNDS_AUDIO).catch(() => [])).map((r) => [r.word, r]));
  return { scene, image, audio, revoke: () => { scene?.revoke?.(); urls.forEach((u) => URL.revokeObjectURL(u)); } };
}

/** Hình một thứ: ảnh bố mẹ thêm ở trang Ai kêu thế? → sticker Dán tranh → emoji. */
export function soundFace(item, assets) {
  const url = assets?.image.get(item.id);
  if (!url) return itemFace(item, assets?.scene);
  const emoji = () => document.createTextNode(item.emoji);
  const img = h('img.sp-img', { src: url, alt: '', draggable: 'false' });
  img.addEventListener('error', () => img.replaceWith(emoji()), { once: true });
  return img;
}

/** Nguồn tiếng của một thứ: 'custom' (bố mẹ thêm) | 'file' (có sẵn trong app) | 'voice' (giọng đọc). */
export const soundSource = (item, assets) => (assets?.audio.has(item.id) ? 'custom' : soundUrl(item.id) ? 'file' : 'voice');

/**
 * Phát tiếng thật của một thứ qua WebAudio (iOS đã mở khóa từ lần chạm "Bắt đầu"): tiếng bố mẹ thêm → file có sẵn.
 * Trả về true nếu đã phát; false nếu không có / âm thanh bị khóa / lỗi → người gọi dùng giọng đọc.
 */
export async function playSoundFile(item, { assets = null, isCurrent = () => true, setStop = () => {} } = {}) {
  const custom = assets?.audio.get(item.id);
  const url = soundUrl(item.id);
  if ((!custom && !url) || isAudioLocked()) return false;
  const ctx = audioContext();
  if (!ctx) return false;
  try {
    const cacheKey = custom ? `custom:${custom.id}` : url;
    let buffer = decoded.get(cacheKey);
    if (!buffer) {
      let data;
      if (custom) data = await mediaBlob(custom).arrayBuffer();
      else {
        const res = await fetch(url);
        if (!res.ok) return false;
        data = await res.arrayBuffer();
      }
      buffer = await ctx.decodeAudioData(data);
      decoded.set(cacheKey, buffer);
    }
    if (!isCurrent()) return true; // bị câu khác thay trong lúc tải: không phát
    await new Promise((resolve) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      let timer = null;
      const done = () => {
        clearTimeout(timer);
        resolve();
      };
      const stop = () => {
        try {
          src.stop();
        } catch {
          // đã dừng
        }
        done();
      };
      timer = setTimeout(stop, Math.min(buffer.duration * 1000 + 50, SOUND_MAX_MS));
      src.onended = done;
      setStop(stop);
      src.start();
    });
    return true;
  } catch {
    return false;
  }
}

export function animalSoundsScreen(app, params = {}) {
  const signal = app.startActivity();
  const kind = KINDS.includes(params.kind) ? params.kind : 'animals';
  app.root.className = 'child-screen as-play';
  const state = cleanSoundsState(app.settings.soundsGame);
  let images = null;
  let token = 0;
  let questions = [];
  let index = 0;
  let wrongs = 0;
  let hints = 0;
  let solved = false;
  let hintTimer = null;
  let talking = false;
  let lockedUntil = 0;

  // ---------- Giao diện ----------
  const bunny = createBunny(app);
  const current = () => SOUND_BY_ID.get(questions[index]?.answer);
  const bongBtn = h('button.sp-bong', { type: 'button', 'aria-label': 'Nghe lại', onclick: () => { play('tap'); replay(); } }, bunny.el);
  const back = h('button.sp-back', { type: 'button', 'aria-label': 'Về trò chơi', text: '🎲', onclick: () => { play('tap'); app.go('play'); } });
  const count = h('span.ms-count.as-count');
  const listen = h('button.as-listen', { type: 'button', 'aria-label': 'Nghe tiếng kêu', onclick: () => { play('tap'); replay(); } },
    h('span.as-listen-icon', { text: '🔊' }), h('span.as-listen-text', { text: 'Listen!' }));
  const cards = h('div.as-cards');
  const stage = h('div.as-stage', {}, listen, cards);
  const sayBox = h('div.ms-say.as-say');
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), back, h('span.sp-title', { text: KIND_LABEL[kind].title }), count, bongBtn),
    stage, sayBox,
  );

  // ---------- Nói + phụ đề (hàng riêng) ----------
  let talkGen = 0;
  let captionTimer = null;
  function caption(en, vi) {
    clearTimeout(captionTimer);
    sayBox.replaceChildren(h('div.caption.sp-caption', { 'aria-live': 'polite' },
      h('span.caption-en', { text: en }), vi ? h('span.caption-vi', { text: vi }) : null));
  }
  /**
   * Một hàng nói duy nhất: câu mới thay câu cũ (giọng đọc cắt câu đang đọc). Trả về false nếu bị câu khác thay / rời màn.
   * Giọng đọc lỗi (máy không đọc được) thì vẫn đi tiếp — phụ đề vẫn hiện, bé không bị kẹt.
   */
  let stopSound = null;
  async function talk(lines) {
    const gen = ++talkGen;
    stopSound?.();
    stopSound = null;
    talking = true;
    try {
      for (const [en, vi, opts] of lines) {
        if (gen !== talkGen || signal.aborted) return false;
        caption(en, vi);
        // Dòng tiếng kêu: phát file ghi âm thật nếu có; không được thì Bông đọc "Moo! Moo!".
        if (opts?.sound) {
          const played = await playSoundFile(opts.sound, {
            assets: images,
            isCurrent: () => gen === talkGen && !signal.aborted,
            setStop: (fn) => { stopSound = fn; },
          });
          app.root.dataset.soundFrom = played ? soundSource(opts.sound, images) : 'voice';
          if (played) continue;
        }
        try {
          await app.speaker.speak(en, { signal });
        } catch {
          if (signal.aborted) return false;
        }
      }
    } finally {
      if (gen === talkGen) talking = false;
    }
    if (gen === talkGen) captionTimer = setTimeout(() => sayBox.replaceChildren(), CAPTION_MS);
    return gen === talkGen;
  }
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, scaled(ms)));
  const bounce = (el) => {
    if (!el) return;
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
  };
  const cardOf = (id) => cards.querySelector(`.as-card[data-animal="${id}"]`);
  function glow(id) {
    const el = cardOf(id);
    if (!el) return;
    el.classList.add('glow');
    setTimeout(() => el.classList.remove('glow'), 2500);
  }

  // ---------- Câu hỏi ----------
  function render() {
    const q = questions[index];
    count.textContent = `${index + 1}/${questions.length}`;
    cards.dataset.choices = String(q.choices.length);
    cards.replaceChildren(...q.choices.map((id) => {
      const a = SOUND_BY_ID.get(id);
      return h('button.as-card', {
        type: 'button', 'aria-label': a.name, dataset: { animal: id },
        onclick: () => choose(id),
      }, h('span.as-face', {}, soundFace(a, images)));
    }));
  }

  /** Giữ để chơi tiếp sau khi app ra nền: câu đang hỏi + số lần nhầm / gợi ý. Đã trả lời đúng thì giữ câu SAU. */
  function snap(at = index) {
    snapshot = { savedAt: Date.now(), kind, level: state.level, questions, index: at, wrongs: at === index ? wrongs : 0, hints: at === index ? hints : 0 };
  }

  async function ask(intro = false, resume = null) {
    const t = ++token;
    wrongs = resume?.wrongs ?? 0;
    hints = resume?.hints ?? 0;
    solved = false;
    clearTimeout(hintTimer);
    render();
    snap();
    app.root.dataset.state = 'asking';
    const a = current();
    await talk([...(intro ? [INTRO_LINES[kind]] : []), [...soundLine(a), { sound: a }], whoLine(a)]);
    if (t !== token || signal.aborted) return;
    app.root.dataset.state = 'answer';
    armHint();
  }

  function replay() {
    const a = current();
    if (!a || solved) return;
    talk([[...soundLine(a), { sound: a }], whoLine(a)]);
    armHint();
  }

  // 10 giây không chạm (không tính lúc Bông đang nói): con đúng sáng lên + nghe lại tiếng kêu. Tối đa 2 lần / câu.
  function armHint() {
    clearTimeout(hintTimer);
    if (hints >= MAX_HINTS || solved) return;
    const t = token;
    hintTimer = setTimeout(() => {
      if (t !== token || solved || app.idlePaused || signal.aborted) return; // ra nền: activity bị dừng, không đếm gợi ý
      // Bông đang nói (câu hỏi, nghe lại, câu nhầm): đếm lại từ đầu — gợi ý chỉ tính khi bé thật sự đang chờ.
      if (talking) {
        armHint();
        return;
      }
      hints += 1;
      snap();
      glow(current().id);
      talk([[...soundLine(current()), { sound: current() }]]);
      armHint();
    }, scaled(HINT_MS));
  }

  async function choose(id) {
    if (solved || !questions.length) return;
    const t = token;
    const a = current();
    const el = cardOf(id);
    if (id === a.id) {
      solved = true;
      clearTimeout(hintTimer);
      play('cheer');
      el?.classList.add('right');
      bounce(el);
      bunny.set('clap');
      setTimeout(() => bunny.set('idle'), 1600);
      markPracticed(app, a.name, a.emoji);
      snap(index + 1); // ra nền lúc đang khen: quay lại là câu sau, không hỏi lại / ghi tiến độ hai lần
      app.root.dataset.state = 'right';
      const done = await talk([yesLine(a), yourTurnLine(a)]);
      if (!done || t !== token) return;
      await wait(TURN_MS);
      if (t !== token || signal.aborted) return;
      next();
      return;
    }
    // Chạm nhầm liên tục (chạm đúp, chạm loạn): chỉ tính một lần trong WRONG_LOCK_MS. Chạm đúng thì luôn nhận.
    if (Date.now() < lockedUntil) return;
    wrongs += 1;
    lockedUntil = Date.now() + WRONG_LOCK_MS;
    play('boing');
    el?.classList.remove('shake');
    void el?.offsetWidth;
    el?.classList.add('shake');
    // Nhầm 2 lần: con đúng sáng lên (tính vào số gợi ý).
    if (wrongs >= 2 && hints < MAX_HINTS) {
      hints += 1;
      glow(a.id);
    }
    snap();
    // Nhầm 1–2 lần: nói tên + tiếng kêu con vừa chạm, giả lại tiếng kêu, hỏi lại. Từ lần 3: câu ngắn (không đọc cả tràng).
    const tapped = SOUND_BY_ID.get(id);
    await talk(wrongs <= 2 ? [wrongLine(tapped), [...soundLine(a), { sound: a }], whoLine(a)] : [shortWrongLine(tapped), whoLine(a)]);
    if (t === token) armHint();
  }

  function next() {
    if (index + 1 < questions.length) {
      index += 1;
      ask();
      return;
    }
    finishRound();
  }

  /** Hết 5 câu: Hoan hô + sticker (một lần), đếm lượt để lên mức (áp dụng lượt sau). */
  async function finishRound() {
    token += 1;
    solved = true;
    snapshot = null;
    clearTimeout(hintTimer);
    app.setSetting('soundsGame', afterSoundsRound(state)).catch(() => {});
    app.root.dataset.state = 'done';
    cards.replaceChildren();
    listen.hidden = true;
    sayBox.replaceChildren();
    const teacher = new Teacher(app, { signal, bunny, stage });
    try {
      await runCompletion({ app, teacher, stage, signal });
      if (!signal.aborted) app.go('play');
    } catch {
      // rời màn giữa chừng
    }
  }

  const idlePause = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  loadSoundAssets(app).catch(() => null).then(async (loaded) => {
    images = loaded;
    if (signal.aborted) return;
    const s = snapshot;
    if (params.continueDirectly && s && s.kind === kind && Date.now() - s.savedAt < SNAPSHOT_MS && s.level === state.level) {
      questions = s.questions;
      // Ra nền ngay sau khi trả lời đúng câu cuối: quay lại là hoan hô luôn.
      if (s.index >= questions.length) {
        index = questions.length - 1;
        finishRound();
        return;
      }
      index = s.index;
      ask(false, s);
      return;
    }
    const seen = new Map();
    for (const rec of await app.db.getAll('progress').catch(() => [])) seen.set(rec.word, rec.practiceCount ?? 0);
    if (signal.aborted) return;
    questions = roundQuestions(state.level, { kind, seen });
    index = 0;
    ask(true);
  });

  return () => {
    token += 1;
    talkGen += 1;
    stopSound?.();
    clearTimeout(hintTimer);
    clearTimeout(captionTimer);
    clearInterval(idlePause);
    bunny.destroy();
    images?.revoke();
  };
}
