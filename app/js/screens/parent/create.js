// Tạo bài: form → Copy prompt → Dán bài → Xem trước → Lưu (SPEC mục 3).

import { h, toast, copyText } from '../../ui.js';
import { buildLessonPrompt, DURATIONS } from '../../prompts.js';
import { pickWordsForPrompt } from '../../progress.js';
import { parseLesson, createLessonRecord } from '../../lesson.js';
import { listLessons } from '../../db.js';
import { quizQuestions } from '../../player/plan.js';
import { parentLayout, goParent, section, notice, speakButton, field } from './common.js';

const TOPICS = ['Animals', 'Food', 'Colors', 'Toys', 'Family', 'Vehicles', 'At the park', 'Fruits', 'Body', 'Weather'];

function radios(name, options, value) {
  return h('div.radios', {}, ...options.map(([v, label]) => h('label.radio', {},
    h('input', { type: 'radio', name, value: String(v), checked: String(v) === String(value) }),
    h('span', { text: label }))));
}

const radioValue = (form, name) => form.querySelector(`input[name="${name}"]:checked`)?.value;

export function createView(app) {
  const body = parentLayout(app, { title: 'Tạo bài học', back: () => goParent(app) });
  const topic = h('input', { type: 'text', placeholder: 'Ví dụ: Animals, Fruits, My house…', value: 'Animals' });
  const chips = h('div.chips', {}, ...TOPICS.map((t) => h('button.chip', {
    type: 'button', text: t, onclick: () => { topic.value = t; },
  })));
  const age = h('input', { type: 'number', min: '2', max: '8', value: '3' });
  const review = h('input', { type: 'checkbox', checked: true });
  const reviewInfo = h('span.field-hint');
  const promptBox = h('details.prompt-box', { hidden: true }, h('summary', { text: 'Xem prompt' }), h('pre'));

  let reviewWords = [];
  app.db.getAll('progress').then((list) => {
    reviewWords = pickWordsForPrompt(list, 2).map((r) => r.word);
    reviewInfo.textContent = reviewWords.length ? `Từ sẽ ôn: ${reviewWords.join(', ')}` : 'Chưa có từ nào cần ôn.';
  });

  const form = h('form.form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const words = review.checked ? reviewWords : [];
      const prompt = buildLessonPrompt({
        topic: topic.value.trim() || 'Animals',
        age: Number(age.value) || 3,
        duration: Number(radioValue(form, 'duration')),
        level: radioValue(form, 'level'),
        style: radioValue(form, 'style'),
        reviewWords: words,
      });
      await app.setSetting('lastPromptReviewWords', words);
      promptBox.querySelector('pre').textContent = prompt;
      promptBox.hidden = false;
      const ok = await copyText(prompt);
      toast(ok ? 'Đã copy prompt. Mở ChatGPT hoặc Gemini, dán vào và gửi.' : 'Không copy được tự động — hãy mở "Xem prompt" và copy tay.');
      nextBtn.hidden = false;
    },
  },
  section('📚 Chủ đề', chips, field('Hoặc tự gõ', topic)),
  section('Bé và bài học',
    field('👶 Tuổi', age),
    field('⏱️ Thời lượng', radios('duration', Object.entries(DURATIONS).map(([m, n]) => [m, `${m} phút (${n} từ)`]), 10)),
    field('🎯 Trình độ', radios('level', [['beginner', 'Mới bắt đầu'], ['some', 'Đã biết ít']], 'beginner')),
    field('🎨 Kiểu bài', radios('style', [['fun', 'Vui nhộn'], ['story', 'Kể chuyện']], 'fun')),
    h('label.check', {}, review, h('span', { text: '☑️ Ôn lại từ chưa thuộc (tối đa 2 từ)' })),
    reviewInfo),
  h('div.actions', {}, h('button.btn.primary.big', { type: 'submit', text: 'Copy prompt' })));

  const nextBtn = h('button.btn.big', { type: 'button', text: 'Đã có bài từ AI → Dán bài', hidden: true, onclick: () => goParent(app, 'paste') });
  body.append(
    notice('info', '1. Chọn thông tin rồi bấm "Copy prompt". 2. Mở ChatGPT hoặc Gemini, dán vào và gửi. 3. Copy toàn bộ câu trả lời rồi quay lại bấm "Dán bài".'),
    form, promptBox, nextBtn);
}

/** Bản xem trước bài học: từ, hội thoại, trò chơi, truyện; mỗi câu có 🔊. */
export function lessonPreview(app, lesson) {
  const list = (items) => h('ul.preview-list', {}, ...items);
  return h('div.preview', {},
    h('h2.preview-title', {}, `${lesson.emoji} ${lesson.title}`, lesson.titleVi ? h('span.muted', { text: ` — ${lesson.titleVi}` }) : null),
    section(`Từ (${lesson.words.length})`, list(lesson.words.map((w) => h('li', {},
      h('span.p-emoji', { text: w.emoji }), h('b', { text: w.en }), h('span.muted', { text: w.vi }),
      speakButton(app, w.en), speakButton(app, w.vi, 'vi'))))),
    lesson.conversation.length ? section(`Hội thoại (${lesson.conversation.length} lượt)`, list(lesson.conversation.map((t) => h('li', {},
      h('span', { text: `🐰 ${t.teacher}` }), speakButton(app, t.teacher),
      h('span', { text: `👶 ${t.child}` }), speakButton(app, t.child))))) : null,
    section(lesson.questions.length ? `Trò chơi (${lesson.questions.length} câu)` : 'Trò chơi (app tự tạo câu hỏi)',
      list(quizQuestions(lesson).map((q) => h('li', {}, h('span', { text: `${q.ask} → ${q.answer}` }), speakButton(app, q.ask))))),
    lesson.story.length ? section(`Truyện (${lesson.story.length} câu)`, list(lesson.story.map((s) => h('li', {},
      h('span', { text: s.text }), speakButton(app, s.text),
      s.repeat ? h('span.repeat-tag', { text: `bé nói: ${s.repeat}` }) : null)))) : null);
}

export function pasteView(app) {
  const body = parentLayout(app, { title: 'Dán bài', back: () => goParent(app) });
  const area = h('textarea.paste-area', { rows: '10', placeholder: 'Dán toàn bộ câu trả lời của ChatGPT/Gemini vào đây…' });
  const result = h('div.paste-result');

  const check = async () => {
    result.replaceChildren();
    const parsed = parseLesson(area.value, { reviewWords: app.settings.lastPromptReviewWords ?? [] });
    if (!parsed.ok) {
      result.append(notice('error', h('b', { text: 'Chưa lưu được bài:' }), h('ul', {}, ...parsed.errors.map((e) => h('li', { text: e })))));
      return;
    }
    const lessons = await listLessons(app.db);
    if (lessons.some((l) => l.title.trim().toLowerCase() === parsed.lesson.title.toLowerCase())) {
      parsed.warnings.push(`Đã có bài tên "${parsed.lesson.title}". Vẫn lưu được.`);
    }
    if (parsed.warnings.length) {
      result.append(notice('warn', h('b', { text: 'App đã tự sửa một số chỗ:' }), h('ul', {}, ...parsed.warnings.map((w) => h('li', { text: w })))));
    }
    const save = h('button.btn.primary.big', {
      type: 'button',
      text: 'Lưu bài',
      onclick: async () => {
        save.disabled = true;
        const record = createLessonRecord(parsed.lesson);
        await app.db.put('lessons', record);
        await app.setSetting('lastPromptReviewWords', []);
        toast('Đã lưu bài. Bé đã thấy bài này trong 📚.');
        goParent(app, 'lesson', { lessonId: record.id });
      },
    });
    result.append(lessonPreview(app, parsed.lesson), h('div.actions.sticky', {}, save));
  };

  body.append(
    notice('info', 'App tự bỏ phần chữ thừa (```json, lời chào…). Sau khi kiểm tra sẽ có bản xem trước, bấm Lưu thì bé mới thấy bài.'),
    area,
    h('div.actions', {},
      h('button.btn', {
        type: 'button',
        text: 'Dán từ bộ nhớ tạm',
        onclick: async () => {
          try {
            area.value = await navigator.clipboard.readText();
            check();
          } catch {
            toast('Hãy nhấn giữ vào ô trên và chọn "Dán".');
          }
        },
      }),
      h('button.btn.primary', { type: 'button', text: 'Kiểm tra bài', onclick: check })),
    result);
}
