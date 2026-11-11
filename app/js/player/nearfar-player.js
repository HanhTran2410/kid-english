// Mẫu câu "Gần – xa" (SPEC-patterns2.md mục 4, P2): nền tranh của Dán tranh, mỗi lần một cặp đồ — đồ gần to ở vùng gần,
// đồ xa nhỏ ở vùng xa. "This" → Bông đi tới đứng sát đồ gần, bàn tay 👇 chạm, vòng sáng; "That" → Bông đứng ở chỗ của
// mình, tay chỉ 👉, đường chấm chạy tới đồ xa. A. Xem và nói theo (3 cặp) → B. Hỏi – đáp (4 câu) → C. "Bring it close!"
// (2 câu: bé chạm hoặc kéo đồ sang đúng vùng) → đọc nhanh như bài hát.
// Câu hỏi phần B lưu cùng chỗ dừng (`lesson.nearPlan`): Học tiếp không chọn lại.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { RESULT } from '../speech/listen.js';
import { isAbort } from '../timing.js';
import { hasRecordingToday } from '../db.js';
import { LEVEL, betterLevel } from '../patterns.js';
import { SCENE_BY_ID } from '../sticker-scenes.js';
import {
  isNearFarLesson, NEAR_FAR_ZONES, FAR_SCALE, pairItems, nearSentence, nearSentenceVi, nearQuestion, nearKey, nearRecords,
  nearPlan, nearLevel, buildNearSteps, bringItem, bringCommand, bringCommandVi,
} from '../patterns2.js';
import { loadSceneImages, itemFace, sceneArt } from '../screens/sticker-scene.js';
import { activityLayout } from './layout.js';
import { Teacher } from './teacher.js';
import { startIndexFor, resumeAfter } from './plan.js';
import { runSkippable, endSkippable } from './stage-kit.js';
import { runCompletion } from './completion-stage.js';
import { markSentence, markPracticed, saveRecording, markPhrasePick } from './track.js';

const HINT_MS = 4000; // phần B: 4 giây chưa nói → chữ mờ của câu trả lời
const WALK_MS = 850; // Bông đi tới / đi về (khớp transition trong CSS)
const FLY_MS = 750; // đồ bay sang vùng kia (khớp transition .nf-mover)
const ZONE_PAD = 14; // thả gần mép vùng (khung 400 × 300) vẫn tính là trong vùng

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const W = 400;
const H = 300;
const center = ([x, y, w, hh]) => ({ x: x + w / 2, y: y + hh / 2 });
const pct = (p) => ({ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` });

/**
 * Dựng tranh Gần – xa: nền (ảnh bố mẹ đã thay hoặc hình vẽ), chỗ đồ gần / xa, Bông (chuyển con thỏ ở góc màn vào
 * tranh — vẫn giữ các trạng thái nói / nghe / vỗ tay), bàn tay, vòng sáng, đường chấm, dòng câu dưới tranh.
 */
function createNearScene(lesson, images, bunny) {
  const scene = SCENE_BY_ID.get(lesson.scene);
  const zones = NEAR_FAR_ZONES[lesson.scene];
  const near = center(zones.near);
  const far = center(zones.far);
  const stand = center(zones.bong);
  // Đứng sát đồ gần: ngay bên phải vùng gần, cao ngang đồ.
  const beside = { x: Math.min(zones.near[0] + zones.near[2] + 30, W - 30), y: near.y - 6 };
  // Bàn tay khi chỉ: phía trên – bên trái Bông ở chỗ đứng.
  const pointFrom = { x: stand.x - 34, y: stand.y - 22 };

  const nearEl = h('div.nf-item.nf-near', { style: pct(near) });
  const farEl = h('div.nf-item.nf-far', { style: { ...pct(far), '--far': String(FAR_SCALE) } });
  const ring = h('div.nf-ring', { style: pct({ x: near.x, y: near.y + 22 }), 'aria-hidden': 'true' });
  const hand = h('div.nf-hand', { 'aria-hidden': 'true' });
  const dash = h('div.nf-dash', { 'aria-hidden': 'true', html: `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><line x1="${pointFrom.x}" y1="${pointFrom.y}" x2="${far.x}" y2="${far.y}"/></svg>` });
  bunny.el.classList.add('nf-bong');
  // Phần C: đồ di chuyển được — cỡ theo vùng (gần to, xa nhỏ), kéo thì to / nhỏ dần theo độ cao.
  const mover = h('div.nf-item.nf-mover', { hidden: true, role: 'button', tabindex: '0' });
  const sceneEl = h('div.nf-scene', { dataset: { scene: lesson.scene }, 'aria-label': scene.vi }, sceneArt(scene, images), ring, dash, farEl, nearEl, mover, hand, bunny.el);
  const word = h('b.nf-word');
  const rest = h('span.nf-rest');
  const line = h('p.nf-line', { 'aria-live': 'polite' }, word, rest);
  const vi = h('p.nf-vi');
  const el = h('div.nf-wrap', {}, sceneEl, h('div.nf-say', {}, line, vi));

  const placeBong = (p) => Object.assign(bunny.el.style, pct(p));
  const placeMover = (zone) => {
    mover.dataset.zone = zone;
    mover.style.removeProperty('--t');
    Object.assign(mover.style, pct(zone === 'near' ? near : far));
  };
  // Kéo đồ (pointer): đồ đi theo ngón tay, to / nhỏ dần theo độ cao giữa hai vùng; thả ra → sự kiện `nfdrop` với vùng dưới
  // ngón tay ('near' | 'far' | null). Không ai nhận (đang bay / Bông đang nói) thì đồ trôi về chỗ cũ.
  let drag = null;
  const unitsAt = (e) => {
    const r = sceneEl.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const inZone = (pt, [x, y, w, hh]) => pt.x >= x - ZONE_PAD && pt.x <= x + w + ZONE_PAD && pt.y >= y - ZONE_PAD && pt.y <= y + hh + ZONE_PAD;
  mover.addEventListener('pointerdown', (e) => {
    if (drag || mover.hidden) return;
    e.preventDefault();
    try { mover.setPointerCapture(e.pointerId); } catch { /* sự kiện giả lập: không có con trỏ thật */ }
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, zone: mover.dataset.zone };
  });
  mover.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    drag.moved = true;
    mover.classList.add('dragging');
    const pt = unitsAt(e);
    Object.assign(mover.style, pct(pt));
    // Cỡ đồ theo độ cao: ở chân trời nhỏ (vùng xa), ở tiền cảnh to (vùng gần).
    const t = Math.min(1, Math.max(0, (pt.y - far.y) / (near.y - far.y)));
    mover.style.setProperty('--t', t.toFixed(3));
  });
  const endDrag = (e, cancelled = false) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    mover.classList.remove('dragging');
    let detail;
    if (!d.moved && !cancelled) detail = { kind: 'tap', handled: false };
    else {
      const pt = unitsAt(e);
      const zone = cancelled ? null : inZone(pt, zones.near) ? 'near' : inZone(pt, zones.far) ? 'far' : null;
      detail = { kind: 'drop', zone, handled: false };
    }
    mover.dispatchEvent(new CustomEvent('nfmove', { detail }));
    if (!detail.handled) placeMover(d.zone);
  };
  mover.addEventListener('pointerup', (e) => endDrag(e));
  mover.addEventListener('pointercancel', (e) => endDrag(e, true));
  placeBong(stand);
  const face = (item) => (item.sticker ? itemFace({ name: item.en, emoji: item.emoji }, images) : document.createTextNode(item.emoji));
  const walk = (teacher) => (reducedMotion() ? Promise.resolve() : teacher.pause(WALK_MS));
  const bounce = (node) => {
    node.classList.remove('nf-pop');
    void node.offsetWidth;
    node.classList.add('nf-pop');
  };

  return {
    el,
    nearEl,
    farEl,
    /** Đặt cặp đồ của lượt: đồ gần ở vùng gần (to), đồ xa ở vùng xa (nhỏ). */
    show(items) {
      nearEl.replaceChildren(face(items.near));
      nearEl.setAttribute('aria-label', items.near.en);
      farEl.replaceChildren(face(items.far));
      farEl.setAttribute('aria-label', items.far.en);
    },
    /** "This": Bông đi tới đứng sát đồ gần, bàn tay 👇 chạm đồ, vòng sáng dưới chân đồ. */
    async touchNear(teacher) {
      sceneEl.dataset.mode = 'this';
      hand.textContent = '';
      placeBong(beside);
      await walk(teacher);
      hand.textContent = '👇';
      Object.assign(hand.style, pct({ x: near.x, y: zones.near[1] - 4 }), { rotate: '0deg' });
      bounce(nearEl);
    },
    /** "That": Bông về chỗ của mình, tay chỉ ra xa (👉 / 👈 xoay theo hướng), đường chấm chạy tới đồ xa. */
    async pointFar(teacher) {
      const back = sceneEl.dataset.mode === 'this';
      sceneEl.dataset.mode = 'that';
      hand.textContent = '';
      placeBong(stand);
      if (back) await walk(teacher);
      const dx = far.x - pointFrom.x;
      const dy = far.y - pointFrom.y;
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      hand.textContent = dx < 0 ? '👈' : '👉';
      Object.assign(hand.style, pct(pointFrom), { rotate: `${dx < 0 ? deg - 180 : deg}deg` });
      dash.classList.remove('nf-draw');
      void dash.offsetWidth;
      dash.classList.add('nf-draw');
      bounce(farEl);
    },
    mover,
    /** Phần C: chỉ hiện đồ cần đưa, đặt ở vùng `zone` ('near' | 'far'). */
    bringStart(item, zone) {
      nearEl.hidden = true;
      farEl.hidden = true;
      mover.hidden = false;
      mover.replaceChildren(face(item));
      mover.setAttribute('aria-label', item.en);
      mover.classList.add('nf-still');
      placeMover(zone);
      void mover.offsetWidth;
      mover.classList.remove('nf-still');
    },
    /** Đồ bay sang vùng `zone` (to lên / nhỏ lại theo vùng). */
    async flyTo(teacher, zone) {
      placeMover(zone);
      await (reducedMotion() ? Promise.resolve() : teacher.pause(FLY_MS));
      bounce(mover);
    },
    bringEnd() {
      mover.hidden = true;
      nearEl.hidden = false;
      farEl.hidden = false;
    },
    /** Dòng chữ tự do (câu lệnh phần C). */
    sayText(which, en, viText) {
      line.dataset.which = which;
      line.classList.remove('ghost');
      word.textContent = en.split(' ')[0];
      rest.textContent = ` ${en.split(' ').slice(1).join(' ')}`;
      vi.textContent = viText;
    },
    /** Về chỗ, không chạm / chỉ gì. */
    rest() {
      sceneEl.dataset.mode = '';
      hand.textContent = '';
      placeBong(stand);
    },
    /** Dòng câu dưới tranh: chữ This / That có màu riêng (trùng màu vòng sáng / đường chấm). */
    say(which, item, { question = false, ghost = false } = {}) {
      line.dataset.which = which;
      line.classList.toggle('ghost', ghost);
      if (question) {
        word.textContent = '';
        rest.textContent = nearQuestion(which);
        vi.textContent = which === 'this' ? 'Đây là gì?' : 'Kia là gì?';
        return;
      }
      const text = nearSentence(which, item);
      word.textContent = text.split(' ')[0];
      rest.textContent = ` ${text.split(' ').slice(1).join(' ')}`;
      vi.textContent = ghost ? '' : nearSentenceVi(which, item);
    },
  };
}

/**
 * @param {{ lessonId: string, start?: 'begin'|'resume', continueDirectly?: boolean }} params
 */
export function nearFarLessonScreen(app, { lessonId, start = 'begin', continueDirectly = false }) {
  const layout = activityLayout(app, 'nearfar-lesson');
  const signal = app.startActivity();
  let images = null;

  const saveLesson = async (lesson) => {
    try {
      await app.db.put('lessons', lesson);
    } catch (err) {
      console.error(err);
    }
  };

  async function run() {
    const lesson = await app.db.get('lessons', lessonId);
    if (!isNearFarLesson(lesson) || !NEAR_FAR_ZONES[lesson.scene] || lesson.pairs?.length < 1) {
      app.go('patterns');
      return;
    }
    const steps = buildNearSteps(lesson);
    const resume = start === 'resume' || continueDirectly;
    let i = resume ? startIndexFor(steps, lesson.resume) : 0;
    const records = new Map(nearRecords(await app.db.getAll('progress')).map((r) => [r.word, r]));
    const plan = nearPlan(lesson, { records, saved: resume && lesson.resume ? lesson.nearPlan : null });
    if (plan !== lesson.nearPlan || (!resume && lesson.resume)) {
      lesson.nearPlan = plan;
      if (!resume) lesson.resume = null;
      await saveLesson(lesson);
    }

    images = await loadSceneImages(app.db);
    const scene = createNearScene(lesson, images, layout.bunny);
    layout.stage.replaceChildren(scene.el);
    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage, replayBtn: layout.replayBtn });
    const ctx = {
      app, teacher, lesson, signal, scene, plan, stage: layout.stage, nextBtn: layout.nextBtn,
      // Phần C: lưu ngay khi đồ tới vùng đích (ra nền rồi quay lại thì đồ vẫn ở đó).
      savePlan: async () => {
        lesson.nearPlan = plan;
        await saveLesson(lesson);
      },
    };

    const runStep = (step) => (step.stage === 'watch' ? runWatch(ctx, step.index)
      : step.stage === 'ask' ? runAsk(ctx, plan.questions[step.index % plan.questions.length])
        : step.stage === 'bring' ? runBring(ctx, plan.bring[step.index % plan.bring.length], step.index) : runSong(ctx));
    for (; i < steps.length; i++) {
      layout.setProgress(i / steps.length);
      const step = steps[i];
      layout.stage.dataset.stage = `near-${step.stage}`;
      await runSkippable(ctx, signal, () => runStep(step));
      lesson.resume = resumeAfter(steps, i);
      await saveLesson(lesson);
    }

    layout.setProgress(1);
    lesson.timesCompleted = (lesson.timesCompleted ?? 0) + 1;
    lesson.resume = null;
    lesson.nearPlan = null;
    await saveLesson(lesson);
    layout.stage.dataset.stage = 'done';
    // Màn Hoan hô: Bông về góc màn như mọi bài.
    layout.bunny.el.classList.remove('nf-bong');
    layout.bunny.el.removeAttribute('style');
    app.root.append(layout.bunny.el);
    endSkippable(ctx, signal);
    await runCompletion(ctx);
    app.finishActivity();
  }

  run().catch((err) => {
    if (isAbort(err)) return;
    console.error(err);
    app.go('home');
  });

  return () => {
    layout.bunny.destroy();
    images?.revoke();
  };
}

const sayIt = (text) => text.replace(/\.$/, '!');

/** Nghe bé nói câu this / that về `item` (mục 4.5): kết quả nghe + mức câu + nói nhầm this / that. */
async function hearLine(ctx, which, item, { maxMs = 5500 } = {}) {
  const { app, teacher, lesson } = ctx;
  const line = sayIt(nearSentence(which, item));
  const keepVoice = app.settings.recordVoice && app.mic.ready && !(await hasRecordingToday(app.db, line));
  const levelOf = (alts) => nearLevel(alts, which, item).level;
  const outcome = await teacher.hear([item.en], {
    record: keepVoice, maxMs,
    matcher: (alts) => levelOf(alts) !== LEVEL.NONE,
    stopWhen: (alts) => levelOf(alts) === LEVEL.FULL,
  });
  if (outcome.recording) await saveRecording(app, lesson.id, line, outcome.recording);
  if (outcome.result !== RESULT.MATCH) return { result: outcome.result, level: LEVEL.NONE, swapped: false };
  const r = nearLevel(outcome.heard ?? [], which, item);
  return { result: outcome.result, level: r.level === LEVEL.NONE ? LEVEL.KEYWORD : r.level, swapped: r.swapped };
}

async function praiseFull(ctx, which, item) {
  const { teacher, scene } = ctx;
  play('ding');
  teacher.celebrate(which === 'this' ? scene.nearEl : scene.farEl);
  teacher.bunny.set('clap');
  await teacher.say('Great job!');
  teacher.bunny.set('idle');
  await teacher.say(sayIt(nearSentence(which, item)));
}

/** Bông làm lại động tác của câu (đi lại chạm / đứng chỉ) — khi bé nói nhầm this / that. */
const gesture = (ctx, which) => (which === 'this' ? ctx.scene.touchNear(ctx.teacher) : ctx.scene.pointFar(ctx.teacher));

/**
 * Nghe bé nói rồi phản hồi theo mức (không bao giờ nói "sai"). Mời nói lại tối đa MỘT lần; im lặng hai lần thì Bông nói
 * mẫu rồi đi tiếp. Nói nhầm this / that: Bông làm mẫu lại câu đúng kèm động tác. Ghi sao câu (chỉ cả câu) và "đã luyện"
 * cho tên đồ ở kho từ chung.
 * @param {{ firstMs?: number, onSilent?: () => void }} [opts] phần B: lần nghe đầu ngắn hơn, im lặng thì hiện chữ mờ gợi ý
 */
async function respond(ctx, which, item, { firstMs, onSilent } = {}) {
  const { teacher, app } = ctx;
  const line = sayIt(nearSentence(which, item));
  let { result, level, swapped } = await hearLine(ctx, which, item, firstMs ? { maxMs: firstMs } : undefined);
  let best = level;
  if (result === RESULT.LISTEN_ONLY) {
    // Không có mic: Bông nói mẫu, đi tiếp.
    await teacher.say(line);
    await teacher.say('Good!');
  } else if (level === LEVEL.FULL) {
    await praiseFull(ctx, which, item);
  } else if (level === LEVEL.PARTIAL || level === LEVEL.KEYWORD) {
    play('pop');
    if (swapped) await gesture(ctx, which);
    await teacher.say(level === LEVEL.PARTIAL ? `Good! ${line}` : `Yes! ${line}`);
    await teacher.say(`Say it with me: ${line}`);
    ({ result, level } = await hearLine(ctx, which, item));
    best = betterLevel(best, level);
    if (level === LEVEL.FULL) await praiseFull(ctx, which, item);
    else if (result !== RESULT.SILENT) await teacher.say('Good!');
  } else if (result === RESULT.VOICE) {
    play('pop');
    await teacher.say(`Good try! ${line}`);
  } else {
    onSilent?.();
    await teacher.say(`Let's try! ${line}`);
    ({ result, level } = await hearLine(ctx, which, item));
    best = betterLevel(best, level);
    if (level === LEVEL.FULL) await praiseFull(ctx, which, item);
    else if (level !== LEVEL.NONE) await teacher.say(`Yes! ${line}`);
    else if (result === RESULT.VOICE) await teacher.say('Good try!');
    else await teacher.say(line);
  }
  await markSentence(app, nearKey(which, item), item.emoji, best === LEVEL.NONE ? null : best);
  await markPracticed(app, item.en, item.emoji);
  await teacher.checkPresence();
}

// ---------- A. Xem và nói theo ----------

export async function runWatch(ctx, index) {
  const { teacher, scene, lesson } = ctx;
  const items = pairItems(lesson.pairs[index]);
  scene.show(items);
  if (index === 0) await teacher.say(`${lesson.title}!`);
  await scene.touchNear(teacher);
  scene.say('this', items.near);
  await teacher.say(`Look! ${nearSentence('this', items.near)}`);
  await respond(ctx, 'this', items.near);
  await scene.pointFar(teacher);
  scene.say('that', items.far);
  await teacher.say(nearSentence('that', items.far));
  await respond(ctx, 'that', items.far);
  scene.rest();
  await teacher.pause(400);
}

// ---------- B. Hỏi – đáp ----------

export async function runAsk(ctx, question) {
  const { teacher, scene, lesson } = ctx;
  const items = pairItems(lesson.pairs[question.pair]);
  const item = question.which === 'this' ? items.near : items.far;
  scene.show(items);
  await gesture(ctx, question.which);
  scene.say(question.which, item, { question: true });
  await teacher.say(nearQuestion(question.which));
  await respond(ctx, question.which, item, {
    firstMs: HINT_MS, // listen() tự nhân hệ số thời gian (?fast)
    onSilent: () => scene.say(question.which, item, { ghost: true }),
  });
  scene.say(question.which, item);
  await teacher.pause(500);
  scene.rest();
}

// ---------- C. Trò chơi "Bring it close!" ----------

/** Chờ bé chạm / thả đồ (sự kiện `nfmove`); rời bước (▶, 🏠) thì dừng. Chỉ nhận lúc đang chờ. */
function waitMove(ctx) {
  const { mover } = ctx.scene;
  return new Promise((resolve, reject) => {
    const onMove = (e) => {
      e.detail.handled = true;
      cleanup();
      resolve(e.detail);
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException('Đã dừng', 'AbortError'));
    };
    const cleanup = () => {
      mover.removeEventListener('nfmove', onMove);
      ctx.signal.removeEventListener('abort', onAbort);
    };
    mover.addEventListener('nfmove', onMove);
    ctx.signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Đồ đang ở SAI vùng; Bông nói "This is a bird! Bring it close!" (hoặc "That is a cat! Put it far away!") kèm động tác.
 * Chạm đồ → đồ tự bay tới vùng đích; kéo → chỉ xong khi thả trong vùng đích. Thả vào vùng sai → trôi về, tính một lần
 * sai; thả chỗ khác → trôi về, không tính. Sai lần 1 → Bông nói mẫu lại kèm động tác; lần 2 → Bông tự đưa đồ tới.
 * Đồ tới vùng đích do bé đưa → +1 sao câu (một lần mỗi lượt). Đồ đã tới (Học tiếp) → chỉ đọc lại câu.
 */
export async function runBring(ctx, round, index) {
  const { teacher, scene, lesson, app } = ctx;
  const item = bringItem(lesson, round);
  const from = round.which === 'this' ? 'far' : 'near';
  const to = round.which === 'this' ? 'near' : 'far';
  const praise = async (prefix) => {
    await gesture(ctx, round.which);
    scene.say(round.which, item);
    await teacher.say(`${prefix}${sayIt(nearSentence(round.which, item))}`);
  };
  scene.bringStart(item, round.done ? to : from);
  try {
    if (round.done) {
      await praise('');
      return;
    }
    if (index === 0) await teacher.say("Let's play! Bring it close or put it far away!");
    const command = bringCommand(round.which, item);
    await gesture(ctx, round.which);
    scene.sayText(round.which, command, bringCommandVi(round.which, item));
    await teacher.ask(command, { vi: bringCommandVi(round.which, item) });
    let wrong = 0;
    for (;;) {
      const move = await waitMove(ctx);
      if (move.kind === 'tap' || move.zone === to) {
        // Bé đưa tới đúng vùng (chạm thì đồ tự bay; kéo thả đúng chỗ thì đặt vào giữa vùng).
        teacher.endQuestion();
        await scene.flyTo(teacher, to);
        round.done = true;
        await ctx.savePlan();
        await markPhrasePick(app, nearKey(round.which, item), item.emoji, { firstTry: wrong === 0, award: true });
        play('ding');
        teacher.celebrate(scene.mover);
        teacher.bunny.set('clap');
        await praise('Yes! ');
        teacher.bunny.set('idle');
        break;
      }
      await scene.flyTo(teacher, from); // trôi về chỗ cũ
      if (move.zone !== from) continue; // thả giữa hai vùng / ngoài tranh: không tính sai
      wrong++;
      if (wrong >= 2) {
        teacher.endQuestion();
        await teacher.say('Look!');
        await scene.flyTo(teacher, to);
        round.done = true;
        await ctx.savePlan();
        await praise('');
        break;
      }
      await gesture(ctx, round.which);
      await teacher.say(command);
    }
    await teacher.pause(500);
  } finally {
    teacher.endQuestion();
    scene.bringEnd();
    scene.rest();
  }
}

// ---------- Kết thúc: đọc nhanh các cặp như bài hát ----------

export async function runSong(ctx) {
  const { teacher, scene, lesson } = ctx;
  await teacher.say("Let's sing!");
  for (const pair of lesson.pairs) {
    const items = pairItems(pair);
    scene.show(items);
    await scene.touchNear(teacher);
    scene.say('this', items.near);
    await teacher.say(sayIt(nearSentence('this', items.near)));
    await scene.pointFar(teacher);
    scene.say('that', items.far);
    await teacher.say(sayIt(nearSentence('that', items.far)));
  }
  scene.rest();
}
