// Chạy một bài hội thoại (SPEC-talk.md): các lượt đã ghép hồ sơ của bé → câu kết → Hoan hô.
// Dùng chung khung màn hình, nút ▶ (bỏ qua lượt), 🔊 (nghe lại + phụ đề), 🏠, Học tiếp / Học lại.

import { isAbort } from '../timing.js';
import { h } from '../ui.js';
import { mediaBlob } from '../db.js';
import { isTalkLesson, lessonTurns, fillText, turnAllowed, PROFILE_IMAGES } from '../talk.js';
import { activityLayout } from './layout.js';
import { Teacher } from './teacher.js';
import { startIndexFor, resumeAfter } from './plan.js';
import { runSkippable, endSkippable } from './stage-kit.js';
import { runCompletion } from './completion-stage.js';
import { chatView, runTalkTurn, talkOutro } from './talk-stages.js';

/**
 * @param {{ lessonId: string, start?: 'begin'|'resume' }} params
 */
export function talkLessonScreen(app, { lessonId, start = 'begin' }) {
  const layout = activityLayout(app, 'talk-lesson');
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
    if (!isTalkLesson(lesson)) {
      app.go('learn');
      return;
    }
    const profile = app.settings.childProfile;
    // Lượt được ghép theo hồ sơ LÚC CHẠY (đổi hồ sơ thì lần học sau dùng ngay); thiếu hồ sơ thì bỏ lượt / dùng câu dự phòng.
    const turns = lessonTurns(lesson, profile);
    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage, replayBtn: layout.replayBtn });
    // Ảnh bố mẹ đã thêm cho các hình của bài + ảnh gia đình thật trong Hồ sơ của bé (SPEC-talk mục 13.3).
    const pictures = new Map();
    for (const owner of [lesson.id, PROFILE_IMAGES]) {
      const images = await app.db.getAllByIndex('images', 'lessonId', owner);
      for (const img of images.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))) {
        const url = URL.createObjectURL(mediaBlob(img));
        urls.push(url);
        pictures.set(img.word, url);
      }
    }
    const ctx = { app, teacher, lesson, signal, stage: layout.stage, nextBtn: layout.nextBtn, pictures };
    chatView(ctx);
    // Thanh tiến độ: Bông nhảy dần tới hộp quà 🎁 ở cuối bài.
    const bar = app.root.querySelector('.activity-top .progress');
    const hopper = h('span.talk-hopper', { 'aria-hidden': 'true', text: '🐰' });
    bar?.classList.add('talk-progress');
    bar?.append(hopper, h('span.talk-goal', { 'aria-hidden': 'true', text: '🎁' }));
    const setProgress = (f) => {
      layout.setProgress(f);
      hopper.style.setProperty('--p', String(f));
    };
    const picks = {}; // lượt → lựa chọn của bé (cho lượt có `onlyIf`)

    const steps = turns.map((t, index) => ({ stage: 'turn', index, id: t.id }));
    const resume = start === 'resume';
    let i = resume ? startIndexFor(steps, lesson.resume) : 0;
    if (!resume && lesson.resume) {
      lesson.resume = null;
      await saveLesson(lesson);
    }

    for (; i < steps.length; i++) {
      setProgress(i / Math.max(1, steps.length));
      const turn = turns[i];
      if (turnAllowed(turn, picks)) {
        layout.stage.dataset.stage = `talk-${turn.type}`;
        await runSkippable(ctx, signal, async () => {
          picks[turn.id] = await runTalkTurn(ctx, turn);
        });
      }
      lesson.resume = resumeAfter(steps, i);
      await saveLesson(lesson);
    }

    await runSkippable(ctx, signal, () => talkOutro(ctx, fillText(lesson.outro ?? '', profile), fillText(lesson.outroVi ?? '', profile)));
    setProgress(1);
    lesson.timesCompleted = (lesson.timesCompleted ?? 0) + 1;
    lesson.resume = null;
    await saveLesson(lesson);
    layout.stage.dataset.stage = 'done';
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
