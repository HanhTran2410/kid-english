// Tạo bài: form → Copy prompt → Dán bài → Xem trước → Lưu (SPEC mục 3).

import { h, toast, copyText } from '../../ui.js';
import { buildLessonPrompt, DURATIONS, MAX_AVOID_WORDS, buildPhraseLessonPrompt, SITUATIONS, PHRASE_COUNTS } from '../../prompts.js';
import { isPhraseLesson, phraseOverlap } from '../../phrase.js';
import { createScene } from '../../player/scene.js';
import { pickWordsForPrompt, markUsedInPrompt, isUnknown, KNOWN_MASTERY, wordRecords } from '../../progress.js';
import { parseLesson, createLessonRecord, overlapWithLessons, uniqueTitle, baseTitle, nextLessonNo } from '../../lesson.js';
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
  const MAX_REVIEW = 2;
  const reviewBox = h('div.review-picker');
  const avoidInfo = h('p.field-hint');

  // Đọc dữ liệu trước, để lúc bấm "Copy prompt" ghép prompt và copy ngay (iOS chặn copy sau một bước chờ).
  let avoidWords = [];
  const selectedReview = () => [...reviewBox.querySelectorAll('input:checked')].map((i) => i.value);

  // Từ cần ôn: bố mẹ tự chọn (tối đa 2). App tích sẵn 2 từ chưa thuộc theo cách XOAY VÒNG.
  Promise.all([app.db.getAll('progress'), listLessons(app.db)]).then(([allProgress, lessons]) => {
    const progress = wordRecords(allProgress);
    const weak = progress.filter(isUnknown);
    const suggested = new Set(pickWordsForPrompt(progress, MAX_REVIEW, app.settings.reviewUsedAt ?? {}).map((r) => r.word));
    const starsOf = new Map(progress.map((r) => [r.word, r.mastery]));
    const weakKeys = new Set(weak.map((r) => r.word));
    const others = [...new Set(lessons.flatMap((l) => (l.words ?? []).map((w) => w.en.toLowerCase())))]
      .filter((w) => !weakKeys.has(w)).sort();

    const onChange = () => {
      const full = selectedReview().length >= MAX_REVIEW;
      for (const input of reviewBox.querySelectorAll('input')) input.disabled = full && !input.checked;
    };
    const chip = (word, note) => h('label.review-chip', {},
      h('input', { type: 'checkbox', value: word, checked: suggested.has(word), onchange: onChange }),
      h('span', { text: word }), note ? h('span.muted', { text: note }) : null);

    reviewBox.replaceChildren(
      weak.length
        ? h('div.review-group', {}, h('span.field-hint', { text: `Từ chưa thuộc (dưới ${KNOWN_MASTERY}⭐) — app đã tích sẵn ${suggested.size} từ, lần sau sẽ xoay sang từ khác:` }),
          h('div.review-chips', {}, ...weak
            .sort((a, b) => a.mastery - b.mastery || a.word.localeCompare(b.word))
            .map((r) => chip(r.word, '⭐'.repeat(starsOf.get(r.word) ?? 0) || '☆'))))
        : h('p.field-hint', { text: 'Máy này chưa có từ nào "chưa thuộc" (tiến độ của bé nằm trên máy bé học). Có thể chọn từ bất kỳ bên dưới.' }),
      others.length
        ? h('details.review-group', {}, h('summary', { text: `Chọn từ khác trong các bài (${others.length} từ)` }),
          h('div.review-chips', {}, ...others.map((w) => chip(w))))
        : null,
    );
    onChange();
  });
  listLessons(app.db).then((lessons) => {
    avoidWords = [...new Set(lessons.flatMap((l) => (l.words ?? []).map((w) => w.en.toLowerCase())))];
    avoidInfo.textContent = avoidWords.length
      ? `Để không trùng, prompt dặn AI tránh ${Math.min(avoidWords.length, MAX_AVOID_WORDS)} từ bé đã có ở các bài khác.`
      : '';
  });

  const promptArea = h('textarea.prompt-area', { rows: '8', readonly: true, 'aria-label': 'Prompt' });
  const result = h('div.prompt-result', { hidden: true },
    notice('info', 'Nếu chưa copy được: chạm vào ô dưới → "Chọn tất cả" → "Sao chép".'),
    promptArea,
    h('div.actions', {},
      h('button.btn', {
        type: 'button',
        text: 'Copy lại',
        onclick: () => {
          copyText(promptArea.value).then((ok) => toast(ok ? 'Đã copy prompt.' : 'Chưa copy được, hãy copy tay trong ô trên.'));
        },
      }),
      h('a.btn', { href: 'https://chatgpt.com/', target: '_blank', rel: 'noopener', text: 'Mở ChatGPT' }),
      h('a.btn', { href: 'https://gemini.google.com/app', target: '_blank', rel: 'noopener', text: 'Mở Gemini' })),
    h('button.btn.primary.big', { type: 'button', text: 'Đã có bài từ AI → Dán bài', onclick: () => goParent(app, 'paste') }));

  const form = h('form.form', {
    onsubmit: (e) => {
      e.preventDefault();
      const words = selectedReview();
      const prompt = buildLessonPrompt({
        topic: topic.value.trim() || 'Animals',
        age: Number(age.value) || 3,
        duration: Number(radioValue(form, 'duration')),
        level: radioValue(form, 'level'),
        style: radioValue(form, 'style'),
        reviewWords: words,
        avoidWords,
      });
      // Copy NGAY, trước mọi bước chờ.
      const copied = copyText(prompt);
      promptArea.value = prompt;
      result.hidden = false;
      copied.then((ok) => {
        toast(ok ? 'Đã copy prompt. Mở ChatGPT hoặc Gemini, dán vào và gửi.' : 'Chưa copy được tự động — hãy copy tay trong ô prompt.', 4000);
        result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      app.setSetting('lastPromptReviewWords', words);
      if (words.length) app.setSetting('reviewUsedAt', markUsedInPrompt(app.settings.reviewUsedAt ?? {}, words));
      app.setSetting('lastPromptTopic', topic.value.trim());
    },
  },
  section('📚 Chủ đề', chips, field('Hoặc tự gõ', topic)),
  section('Bé và bài học',
    field('👶 Tuổi', age),
    field('⏱️ Thời lượng', radios('duration', Object.entries(DURATIONS).map(([m, n]) => [m, `${m} phút (${n} từ)`]), 10)),
    field('🎯 Trình độ', radios('level', [['beginner', 'Mới bắt đầu'], ['some', 'Đã biết ít']], 'beginner')),
    field('🎨 Kiểu bài', radios('style', [['fun', 'Vui nhộn'], ['story', 'Kể chuyện']], 'fun')),
    h('div.field', {}, h('span.field-label', { text: `☑️ Từ cần ôn (tối đa ${MAX_REVIEW} từ, AI thêm vào bài)` }), reviewBox),
    avoidInfo),
  h('div.actions', {}, h('button.btn.primary.big', { type: 'submit', text: 'Copy prompt' })));

  body.append(
    notice('info', '1. Chọn thông tin rồi bấm "Copy prompt". 2. Mở ChatGPT hoặc Gemini, dán vào và gửi. 3. Copy toàn bộ câu trả lời rồi quay lại bấm "Dán bài".'),
    form, result);
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
    const titles = lessons.map((l) => l.title);
    const finalTitle = uniqueTitle(parsed.lesson.title, titles);
    if (finalTitle !== parsed.lesson.title) {
      parsed.warnings.push(`Đã có bài tên "${parsed.lesson.title}" — bài này sẽ được lưu là "${finalTitle}".`);
    }
    const phrases = isPhraseLesson(parsed.lesson);
    const overlap = phrases ? [] : overlapWithLessons(parsed.lesson, lessons, app.settings.lastPromptReviewWords ?? []);
    const repeated = phrases ? phraseOverlap(parsed.lesson, lessons) : [];
    if (repeated.length) {
      parsed.warnings.push(`${repeated.length}/${parsed.lesson.phrases.length} câu đã có ở bài khác: `
        + `${repeated.map((o) => `${o.phrase} (${o.lessonTitle})`).join(', ')}. Vẫn lưu được.`);
    }
    if (overlap.length) {
      parsed.warnings.push(`${overlap.length}/${parsed.lesson.words.length} từ đã có ở bài khác: `
        + `${overlap.map((o) => `${o.word} (${o.lessonTitle})`).join(', ')}. Vẫn lưu được; muốn bài mới hoàn toàn thì nhờ AI đổi từ.`);
    }
    if (parsed.warnings.length) {
      result.append(notice('warn', h('b', { text: 'App đã tự sửa một số chỗ:' }), h('ul', {}, ...parsed.warnings.map((w) => h('li', { text: w })))));
    }
    const save = h('button.btn.primary.big', {
      type: 'button',
      text: 'Lưu bài',
      onclick: async () => {
        save.disabled = true;
        const record = createLessonRecord({ ...parsed.lesson, title: finalTitle });
        // Chủ đề (để chia tab): chủ đề đã chọn lúc tạo prompt, không có thì theo tên bài.
        record.topic = app.settings.lastPromptTopic || baseTitle(parsed.lesson.title);
        record.no = nextLessonNo(await listLessons(app.db));
        await app.db.put('lessons', record);
        await app.setSetting('lastPromptReviewWords', []);
        await app.setSetting('lastPromptTopic', '');
        toast('Đã lưu bài. Bé đã thấy bài này trong 📚.');
        goParent(app, 'lesson', { lessonId: record.id });
      },
    });
    result.append(phrases ? phrasePreview(app, parsed.lesson) : lessonPreview(app, parsed.lesson), h('div.actions.sticky', {}, save));
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

/** Xem trước bài câu: từng câu có cảnh hiệu ứng, 🔊, nghĩa. */
export function phrasePreview(app, lesson) {
  return h('div.preview', {},
    h('h2.preview-title', {}, `${lesson.emoji} ${lesson.title}`, lesson.titleVi ? h('span.muted', { text: ` — ${lesson.titleVi}` }) : null),
    section(`Câu (${lesson.phrases.length})${lesson.routine ? ' — theo thứ tự' : ''}`,
      h('ul.phrase-admin-list', {}, ...lesson.phrases.map((p) => {
        const scene = createScene({ emoji: p.emoji, motion: p.motion, small: true });
        return h('li.phrase-admin', {},
          h('div.scene-box', {}, scene.el),
          h('div.grow', {},
            h('b', { text: p.en }), speakButton(app, p.en),
            h('div.muted', { text: `${p.vi} · hiệu ứng: ${scene.motion} · nói được khi nghe ra: ${p.requiredKeywords.join(', ')}` }),
            h('button.btn.small', { type: 'button', text: '▶ Xem', onclick: () => scene.play(1) })));
      }))));
}

/** Tạo bài câu (SPEC-v1.0 mục 6.3): tình huống, số câu, trình độ → Copy prompt. */
export function phraseCreateView(app) {
  const body = parentLayout(app, { title: 'Tạo bài câu', back: () => goParent(app) });
  const situation = h('input', { type: 'text', placeholder: 'Ví dụ: Morning, Bath time…', value: 'Morning' });
  const chips = h('div.chips', {}, ...SITUATIONS.map((t) => h('button.chip', {
    type: 'button', text: t, onclick: () => { situation.value = t; },
  })));
  let avoidPhrases = [];
  listLessons(app.db).then((lessons) => {
    avoidPhrases = lessons.filter(isPhraseLesson).flatMap((l) => l.phrases.map((p) => p.en));
  });

  const promptArea = h('textarea.prompt-area', { rows: '8', readonly: true, 'aria-label': 'Prompt' });
  const result = h('div.prompt-result', { hidden: true },
    notice('info', 'Nếu chưa copy được: chạm vào ô dưới → "Chọn tất cả" → "Sao chép".'),
    promptArea,
    h('div.actions', {},
      h('a.btn', { href: 'https://chatgpt.com/', target: '_blank', rel: 'noopener', text: 'Mở ChatGPT' }),
      h('a.btn', { href: 'https://gemini.google.com/app', target: '_blank', rel: 'noopener', text: 'Mở Gemini' })),
    h('button.btn.primary.big', { type: 'button', text: 'Đã có bài từ AI → Dán bài', onclick: () => goParent(app, 'paste') }));

  const form = h('form.form', {
    onsubmit: (e) => {
      e.preventDefault();
      const prompt = buildPhraseLessonPrompt({
        situation: situation.value.trim() || 'Morning',
        count: Number(radioValue(form, 'count')),
        level: radioValue(form, 'level'),
        avoidPhrases,
      });
      const copied = copyText(prompt); // copy NGAY trong lúc chạm (iOS)
      promptArea.value = prompt;
      result.hidden = false;
      copied.then((ok) => {
        toast(ok ? 'Đã copy prompt. Mở ChatGPT hoặc Gemini, dán vào và gửi.' : 'Chưa copy được tự động — hãy copy tay trong ô prompt.', 4000);
        result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      app.setSetting('lastPromptReviewWords', []);
      app.setSetting('lastPromptTopic', situation.value.trim());
    },
  },
  section('🏠 Tình huống trong ngày', chips, field('Hoặc tự gõ', situation)),
  section('Bài câu',
    field('💬 Số câu', radios('count', PHRASE_COUNTS.map((n) => [n, `${n} câu`]), 4)),
    field('🎯 Trình độ', radios('level', [['beginner', 'Câu 2–3 từ'], ['some', 'Câu 3–5 từ']], 'beginner'))),
  h('div.actions', {}, h('button.btn.primary.big', { type: 'submit', text: 'Copy prompt' })));

  body.append(
    notice('info', 'Bài câu dạy bé câu ngắn dùng hằng ngày (Open the door, Wash your face…). Bé nghe, xem Bông làm, làm theo rồi nói theo.'),
    form, result);
}
