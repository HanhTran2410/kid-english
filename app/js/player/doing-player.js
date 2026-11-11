// Mẫu câu "Ai đang làm gì?" (SPEC-patterns2.md): ngôi nhà nhiều ô cửa — mỗi người trong nhà một ô, ô cuối là bé (Me).
// A. Xem và nói theo (từng hành động: 2 người làm mẫu → bé nói "I am …") → B. Hỏi – đáp (3 câu) → C. "Who is…?" (2 câu,
// bé chạm đúng người) → Kết thúc: cả nhà cùng làm, "We are …!" (không chấm) → Hoan hô.
// Kế hoạch lượt (người có mặt, cặp người, câu hỏi) lưu cùng chỗ dừng: Học tiếp không chọn lại.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { RESULT } from '../speech/listen.js';
import { isAbort, scaled } from '../timing.js';
import { mediaBlob, getWordImage, hasRecordingToday } from '../db.js';
import { LEVEL, betterLevel } from '../patterns.js';
import {
  isDoingLesson, personOf, statement, statementVi, whatQuestion, chunkedMe, youLine, actionText, actionKeywords,
  doingPlan, doingLevel, doingKey, doingRecords, buildDoingSteps, whoQuestion, thatsName, togetherAction, everybodyLine,
  togetherLine, togetherVi,
} from '../patterns2.js';
import { normalizeProfile, PROFILE_IMAGES, familyPhotoKey } from '../talk.js';
import { familySvg } from '../jobs/family.js';
import { dollSvg } from '../dress-up.js';
import { bongElement } from '../bong.js';
import { characterName } from '../screens/child.js';
import { activityLayout } from './layout.js';
import { Teacher } from './teacher.js';
import { startIndexFor, resumeAfter } from './plan.js';
import { runSkippable, endSkippable } from './stage-kit.js';
import { runCompletion } from './completion-stage.js';
import { markSentence, saveRecording, markPhrasePick } from './track.js';

const HINT_MS = 4000; // phần B: 4 giây chưa nói → chữ mờ của hành động

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Hình của một người: ảnh thật (Hồ sơ của bé) → hình vẽ. Ô Me: ảnh thật → bé trai / bé gái theo Hồ sơ → ✨ + tên.
 * @returns {Promise<HTMLElement>}
 */
async function faceOf(app, id, urls, profile) {
  if (id === 'bong') return bongElement('dg-bong');
  const img = await getWordImage(app.db, PROFILE_IMAGES, familyPhotoKey(id));
  if (img) {
    const url = URL.createObjectURL(mediaBlob(img));
    urls.push(url);
    return h('img.dg-photo', { src: url, alt: '' });
  }
  if (id === 'me') {
    if (profile.kid === 'boy' || profile.kid === 'girl') return h('span.dg-art.dg-kid', { html: dollSvg(profile.kid) });
    return h('span.dg-sparkle', { text: '✨' });
  }
  return h('span.dg-art', { html: familySvg(id, 'happy') });
}

/** Dựng ngôi nhà: các ô cửa theo thứ tự cast, ô Me cuối (khung vàng, to hơn). */
async function createHouse(app, cast, urls) {
  const profile = normalizeProfile(app.settings.childProfile);
  const bongName = characterName(app);
  const wins = new Map();
  for (const id of [...cast, 'me']) {
    const p = personOf(id, bongName);
    const label = id === 'me' ? (profile.name || 'Me') : p.name.replace(/^My /, '');
    const thing = h('span.dg-thing', { 'aria-hidden': 'true' });
    const win = h(`div.dg-win${id === 'me' ? '.dg-me' : ''}`, { dataset: { person: id } },
      h('span.dg-face', {}, await faceOf(app, id, urls, profile)), h('span.dg-name', { text: label }), thing);
    wins.set(id, { win, thing });
  }
  const line = h('p.dg-line', { 'aria-live': 'polite' });
  const vi = h('p.dg-vi');
  const el = h('div.dg-scene', {},
    h('div.dg-house', {}, h('div.dg-roof', { 'aria-hidden': 'true' }), h('div.dg-windows', { dataset: { count: String(wins.size) } }, ...[...wins.values()].map((w) => w.win))),
    h('div.dg-say', {}, line, vi));

  return {
    el,
    /** Người `id` đang làm `action`: ô sáng, đồ vật trong ô chuyển động (motion "none": nảy nhẹ một lần). Ô khác trống. */
    act(id, action, { fly = false } = {}) {
      for (const [pid, w] of wins) {
        const on = pid === id;
        w.win.classList.toggle('active', on);
        w.thing.textContent = on ? action.emoji : '';
        w.thing.dataset.motion = on ? action.motion : '';
        w.thing.classList.remove('pop');
        if (on) {
          void w.thing.getBoundingClientRect();
          w.thing.classList.add('pop');
        }
      }
      if (fly && !reducedMotion()) wins.get(id)?.thing.animate?.([{ transform: 'translateX(-60%) scale(0.5)', opacity: 0.3 }, { transform: 'none', opacity: 1 }], { duration: scaled(450), easing: 'ease-out' });
    },
    clear() {
      for (const w of wins.values()) {
        w.win.classList.remove('active', 'dim', 'pick');
        w.thing.textContent = '';
        w.thing.dataset.motion = '';
      }
    },
    /**
     * Phần C: mỗi người trong cast đang làm một việc khác nhau (đồ vật trong ô, không ô nào sáng để không lộ đáp án);
     * ô Me mờ đi, không chạm được. `assign`: [{ person, action }].
     */
    actMany(assign) {
      for (const [pid, w] of wins) {
        const a = assign.find((x) => x.person === pid);
        w.win.classList.remove('active');
        w.win.classList.toggle('dim', pid === 'me');
        w.win.classList.toggle('pick', Boolean(a));
        w.thing.textContent = a ? a.action.emoji : '';
        w.thing.dataset.motion = a ? a.action.motion : '';
      }
    },
    /** Kết thúc: cả nhà (cast + Me) cùng làm một việc, mọi ô sáng. */
    actAll(action) {
      for (const w of wins.values()) {
        w.win.classList.remove('dim', 'pick');
        w.win.classList.add('active');
        w.thing.textContent = action.emoji;
        w.thing.dataset.motion = action.motion;
      }
    },
    /** Người bé chạm nhầm nảy nhẹ. */
    bounce(id) {
      const win = wins.get(id)?.win;
      if (!win) return;
      win.classList.remove('dg-bounce');
      void win.offsetWidth;
      win.classList.add('dg-bounce');
    },
    show(text, textVi = '', { ghost = false } = {}) {
      line.textContent = text;
      line.classList.toggle('ghost', ghost);
      vi.textContent = textVi;
    },
    win: (id) => wins.get(id)?.win ?? null,
  };
}

/**
 * @param {{ lessonId: string, start?: 'begin'|'resume', continueDirectly?: boolean }} params
 */
export function doingLessonScreen(app, { lessonId, start = 'begin', continueDirectly = false }) {
  const layout = activityLayout(app, 'doing-lesson');
  const signal = app.startActivity();
  const urls = [];

  const saveLesson = async (lesson) => {
    try {
      await app.db.put('lessons', lesson);
    } catch (err) {
      console.error(err);
    }
  };

  async function run() {
    const lesson = await app.db.get('lessons', lessonId);
    if (!isDoingLesson(lesson) || !lesson.actions?.length) {
      app.go('patterns');
      return;
    }
    const steps = buildDoingSteps(lesson);
    const resume = start === 'resume' || continueDirectly;
    let i = resume ? startIndexFor(steps, lesson.resume) : 0;
    const records = new Map(doingRecords(await app.db.getAll('progress')).map((r) => [r.word, r]));
    const family = normalizeProfile(app.settings.childProfile).family;
    const plan = doingPlan(lesson, { family, records, saved: resume && lesson.resume ? lesson.doingPlan : null });
    if (plan !== lesson.doingPlan || (!resume && lesson.resume)) {
      lesson.doingPlan = plan;
      if (!resume) lesson.resume = null;
      await saveLesson(lesson);
    }

    const house = await createHouse(app, plan.cast, urls);
    layout.stage.replaceChildren(house.el);
    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage, replayBtn: layout.replayBtn });
    const ctx = { app, teacher, lesson, signal, house, plan, stage: layout.stage, nextBtn: layout.nextBtn };

    const run1 = (step) => (step.stage === 'watch' ? runWatch(ctx, step.index)
      : step.stage === 'ask' ? runAsk(ctx, plan.questions[step.index % plan.questions.length])
        : step.stage === 'who' ? runWho(ctx, plan.who[step.index % plan.who.length], step.index) : runTogether(ctx));
    for (; i < steps.length; i++) {
      layout.setProgress(i / steps.length);
      const step = steps[i];
      layout.stage.dataset.stage = `doing-${step.stage}`;
      await runSkippable(ctx, signal, () => run1(step));
      lesson.resume = resumeAfter(steps, i);
      await saveLesson(lesson);
    }

    layout.setProgress(1);
    lesson.timesCompleted = (lesson.timesCompleted ?? 0) + 1;
    lesson.resume = null;
    lesson.doingPlan = null;
    await saveLesson(lesson);
    layout.stage.dataset.stage = 'done';
    house.clear();
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
    urls.forEach((u) => URL.revokeObjectURL(u));
  };
}

const sayIt = (text) => text.replace(/\.$/, '!');

/** Nghe bé nói câu của người `p` (mục 3.5): kết quả nghe + mức câu. */
async function hearLine(ctx, p, action, { maxMs = 5500 } = {}) {
  const { app, teacher, lesson } = ctx;
  const line = sayIt(statement(p, action));
  const keepVoice = app.settings.recordVoice && app.mic.ready && !(await hasRecordingToday(app.db, line));
  const levelOf = (alts) => doingLevel(alts, p, action);
  const outcome = await teacher.hear(actionKeywords(action), {
    record: keepVoice, maxMs,
    matcher: (alts) => levelOf(alts) !== LEVEL.NONE,
    stopWhen: (alts) => levelOf(alts) === LEVEL.FULL,
  });
  if (outcome.recording) await saveRecording(app, lesson.id, line, outcome.recording);
  const level = outcome.result === RESULT.MATCH ? levelOf(outcome.heard ?? []) : LEVEL.NONE;
  return { result: outcome.result, level: level === LEVEL.NONE && outcome.result === RESULT.MATCH ? LEVEL.KEYWORD : level };
}

async function praiseFull(ctx, p, action) {
  const { teacher, house } = ctx;
  play('ding');
  teacher.celebrate(house.win(p.id));
  teacher.bunny.set('clap');
  await teacher.say('Great job!');
  teacher.bunny.set('idle');
  await teacher.say(p.id === 'me' ? youLine(action) : sayIt(statement(p, action)));
}

/**
 * Nghe bé nói rồi phản hồi theo mức (không bao giờ nói "sai"). Mời nói lại tối đa MỘT lần; im lặng hai lần thì Bông nói
 * mẫu rồi đi tiếp. Ghi sao câu (chỉ cả câu) theo từng người.
 * @param {{ firstMs?: number, onSilent?: () => void }} [opts] phần B: lần nghe đầu ngắn hơn, im lặng thì hiện chữ mờ gợi ý
 */
async function respond(ctx, p, action, { firstMs, onSilent } = {}) {
  const { teacher, app } = ctx;
  const line = sayIt(statement(p, action));
  let { result, level } = await hearLine(ctx, p, action, firstMs ? { maxMs: firstMs } : undefined);
  let best = level;
  if (result === RESULT.LISTEN_ONLY) {
    // Không có mic: Bông nói mẫu, đi tiếp.
    await teacher.say(line);
    await teacher.say('Good!');
  } else if (level === LEVEL.FULL) {
    await praiseFull(ctx, p, action);
  } else if (level === LEVEL.PARTIAL || level === LEVEL.KEYWORD) {
    play('pop');
    await teacher.say(level === LEVEL.PARTIAL ? `Good! ${line}` : `Yes! ${line}`);
    await teacher.say(`Say it with me: ${line}`);
    ({ result, level } = await hearLine(ctx, p, action));
    best = betterLevel(best, level);
    if (level === LEVEL.FULL) await praiseFull(ctx, p, action);
    else if (result !== RESULT.SILENT) await teacher.say('Good!');
  } else if (result === RESULT.VOICE) {
    play('pop');
    await teacher.say(`Good try! ${line}`);
  } else {
    // Im lặng: (phần B) chữ mờ gợi ý; Bông mời một lần, im lặng nữa thì nói mẫu rồi đi tiếp.
    onSilent?.();
    await teacher.say(`Let's try! ${line}`);
    ({ result, level } = await hearLine(ctx, p, action));
    best = betterLevel(best, level);
    if (level === LEVEL.FULL) await praiseFull(ctx, p, action);
    else if (level !== LEVEL.NONE) await teacher.say(`Yes! ${line}`);
    else if (result === RESULT.VOICE) await teacher.say('Good try!');
    else await teacher.say(line);
  }
  await markSentence(app, doingKey(action, p.id), action.emoji, best === LEVEL.NONE ? null : best);
  await teacher.checkPresence();
}

// ---------- A. Xem và nói theo ----------

export async function runWatch(ctx, index) {
  const { teacher, house, lesson, plan, app } = ctx;
  const action = lesson.actions[index];
  const bongName = characterName(app);
  const [a, b] = plan.pairs[index].map((id) => personOf(id, bongName));
  if (index === 0) await teacher.say(`${lesson.title}!`);
  for (const [k, p] of [a, b].entries()) {
    house.act(p.id, action);
    house.show(statement(p, action), statementVi(p, action));
    await teacher.say(k === 0 ? `Look! ${statement(p, action)}` : statement(p, action));
    await teacher.pause(300);
  }
  // Đến lượt bé: đồ vật bay sang ô Me.
  const me = personOf('me');
  house.act('me', action, { fly: true });
  house.show(whatQuestion(me), 'Con làm thử nào!');
  await teacher.say('And you? What are you doing?');
  await teacher.pause(600);
  const [lead, rest] = chunkedMe(action);
  house.show(statement(me, action), statementVi(me, action));
  await teacher.say(lead);
  await teacher.pause(250);
  await teacher.say(rest);
  await respond(ctx, me, action);
  await teacher.pause(400);
}

// ---------- B. Hỏi – đáp ----------

export async function runAsk(ctx, question) {
  const { teacher, house, lesson, app } = ctx;
  const action = lesson.actions[question.action];
  const p = personOf(question.person, characterName(app));
  house.act(p.id, action);
  house.show(whatQuestion(p), '');
  await teacher.say(whatQuestion(p));
  await respond(ctx, p, action, {
    firstMs: HINT_MS, // listen() tự nhân hệ số thời gian (?fast)
    onSilent: () => house.show(actionText(action, p.pos), '', { ghost: true }),
  });
  house.show(statement(p, action), statementVi(p, action));
  await teacher.pause(500);
}

// ---------- C. Trò chơi "Who is…?" ----------

/**
 * Mỗi người trong cast làm một việc khác nhau; Bông hỏi "Who is sleeping?", bé chạm đúng người. Chạm nhầm lần 1 → người đó
 * nảy, "That's Mummy. Mummy is cooking! Who is sleeping?"; lần 2 → Bông chỉ đáp án rồi đi tiếp. Chạm lại cùng một người sai
 * không tính là lần 2; chạm lúc Bông đang nói thì bỏ qua (waitTap); ô Me mờ, không chạm được. Đúng ngay lần đầu → +1 sao câu.
 */
export async function runWho(ctx, round, index) {
  const { teacher, house, app } = ctx;
  const bongName = characterName(app);
  const target = round.assign.find((a) => a.person === round.target);
  const tp = personOf(round.target, bongName);
  const question = whoQuestion(target.action);
  house.actMany(round.assign);
  house.el.dataset.whoTarget = round.target; // cho test
  if (index === 0) await teacher.say("Let's play! Listen and touch!");
  house.show(question, 'Ai đang ' + target.action.vi + '?');
  await teacher.ask(question);
  const wins = round.assign.map((a) => house.win(a.person)).filter(Boolean);
  const wrongs = new Set();
  for (;;) {
    const tapped = await teacher.waitTap(wins);
    const id = tapped.dataset.person;
    if (id === round.target) {
      await markPhrasePick(app, doingKey(target.action, id), target.action.emoji, { firstTry: wrongs.size === 0, award: wrongs.size === 0 });
      tapped.classList.add('active');
      play('ding');
      teacher.celebrate(tapped);
      teacher.bunny.set('clap');
      house.show(statement(tp, target.action), statementVi(tp, target.action));
      await teacher.say(`Yes! ${sayIt(statement(tp, target.action))}`);
      teacher.bunny.set('idle');
      break;
    }
    if (wrongs.has(id)) continue; // chạm lại cùng người sai: không tính lần 2
    wrongs.add(id);
    house.bounce(id);
    if (wrongs.size >= 2) {
      house.win(round.target)?.classList.add('active');
      house.show(statement(tp, target.action), statementVi(tp, target.action));
      await teacher.say(`Look! ${sayIt(statement(tp, target.action))}`);
      break;
    }
    const p = personOf(id, bongName);
    const act = round.assign.find((a) => a.person === id).action;
    await teacher.say(`That's ${thatsName(p)}. ${sayIt(statement(p, act))} ${question}`);
  }
  teacher.endQuestion();
  await teacher.pause(700);
}

// ---------- Kết thúc: cả nhà cùng làm ----------

/** "Everybody is dancing! We are dancing!" — bé nói theo, không chấm. */
export async function runTogether(ctx) {
  const { teacher, house, lesson } = ctx;
  const action = togetherAction(lesson);
  house.actAll(action);
  house.show(togetherLine(action), togetherVi(action));
  await teacher.say(everybodyLine(action));
  await teacher.say('Say it with me!');
  const { result } = await teacher.hear(actionKeywords(action), { maxMs: 4500 });
  play(result === RESULT.MATCH || result === RESULT.VOICE ? 'ding' : 'pop');
  teacher.bunny.set('clap');
  await teacher.say(`Yay! ${togetherLine(action)}`);
  teacher.bunny.set('idle');
  await teacher.pause(400);
}
