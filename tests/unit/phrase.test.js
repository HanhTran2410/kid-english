import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePhraseLesson, autoChunks, chunksMatch, defaultRequired, effectiveMotion, phraseKey, isPhraseLesson,
  lessonKind, phraseOverlap,
} from '../../app/js/phrase.js';
import { parseLesson } from '../../app/js/lesson.js';
import { matches } from '../../app/js/match.js';
import { emptyProgress, onDid, onAttempt, wordRecords, phraseRecords } from '../../app/js/progress.js';
import { buildPhraseLessonPrompt } from '../../app/js/prompts.js';

const good = {
  version: 2,
  kind: 'phrases',
  title: 'Morning',
  emoji: '🌅',
  routine: true,
  phrases: [
    { id: 'p1', en: 'Wake up', vi: 'Thức dậy', emoji: '⏰', motion: 'stand-up', requiredKeywords: ['wake up'], chunks: ['Wake up'] },
    { id: 'p2', en: 'Wash your face', vi: 'Rửa mặt', emoji: '🧼', motion: 'wash', requiredKeywords: ['wash'], keywords: ['face'], chunks: ['Wash', 'your face'] },
    { id: 'p3', en: 'Put on your shirt', vi: 'Mặc áo', emoji: '👕', motion: 'put-on', requiredKeywords: ['put on'], keywords: ['shirt'] },
  ],
  commands: ['p1', 'p2'],
};

test('bài câu hợp lệ: nhận, không cảnh báo, giữ thứ tự và routine', () => {
  const r = validatePhraseLesson(good);
  assert.equal(r.ok, true, r.errors.join());
  assert.deepEqual(r.warnings, []);
  assert.equal(r.lesson.kind, 'phrases');
  assert.equal(r.lesson.routine, true);
  assert.deepEqual(r.lesson.phrases.map((p) => p.id), ['p1', 'p2', 'p3']);
  assert.deepEqual(r.lesson.phrases[2].chunks, ['Put on', 'your shirt'], 'thiếu chunks thì app tự chia');
});

test('parseLesson nhận ra bài câu, bài từ vựng vẫn như cũ', () => {
  const r = parseLesson(`Here you go:\n\`\`\`json\n${JSON.stringify(good)}\n\`\`\``);
  assert.equal(r.ok, true);
  assert.equal(isPhraseLesson(r.lesson), true);
  assert.equal(lessonKind({ title: 'Animals', words: [] }), 'words', 'bài cũ không có kind là từ vựng');
});

test('lỗi nặng: thiếu title / phrases, ít hơn 2 câu, câu thiếu en/vi', () => {
  assert.match(validatePhraseLesson({ phrases: good.phrases }).errors[0], /title/);
  assert.match(validatePhraseLesson({ title: 'X' }).errors[0], /phrases/);
  assert.match(validatePhraseLesson({ title: 'X', phrases: [good.phrases[0]] }).errors[0], /ít nhất 2 câu/);
  assert.match(validatePhraseLesson({ title: 'X', phrases: [good.phrases[0], { en: 'Sit down' }] }).errors[0], /thiếu nghĩa tiếng Việt/);
});

test('lỗi nhẹ: motion lạ → none, câu dài, chunks sai, id trùng, commands mã lạ, trùng câu', () => {
  const r = validatePhraseLesson({
    title: 'X',
    phrases: [
      { id: 'a', en: 'Please put on your nice warm red hat', vi: 'Đội mũ', emoji: '🧢', motion: 'dance', chunks: ['Put on', 'hat'] },
      { id: 'a', en: 'Sit down', vi: 'Ngồi xuống' },
      { en: 'sit  down!', vi: 'Ngồi' },
    ],
    commands: ['p1', 'zz'],
  });
  assert.equal(r.ok, true);
  const [hat, sit] = r.lesson.phrases;
  assert.equal(r.lesson.phrases.length, 2, 'trùng câu giữ câu đầu');
  assert.equal(hat.motion, 'none');
  assert.deepEqual(hat.requiredKeywords, ['put'], 'thiếu từ khóa → từ đầu tiên không phải từ phụ');
  assert.equal(sit.emoji, '🖼️');
  assert.deepEqual(r.lesson.phrases.map((p) => p.id), ['p1', 'p2'], 'id trùng → đặt lại');
  assert.deepEqual(r.lesson.commands, ['p1']);
  const w = r.warnings.join('\n');
  for (const re of [/dài hơn 5 từ/, /"dance" không có/, /chia cụm không khớp/, /bị trùng/, /mã câu không tồn tại \(zz\)/, /đặt lại p1/]) {
    assert.match(w, re);
  }
});

test('chia cụm và kiểm tra cụm', () => {
  assert.deepEqual(autoChunks('Put on your shirt', ['put on']), ['Put on', 'your shirt']);
  assert.deepEqual(autoChunks('Wash your face', ['wash']), ['Wash', 'your face']);
  assert.deepEqual(autoChunks('Sit down', ['sit']), ['Sit down']);
  assert.equal(chunksMatch('Wash your face!', ['Wash', 'your face']), true);
  assert.equal(chunksMatch('Wash your face', ['Wash', 'face']), false);
  assert.deepEqual(defaultRequired("Let's brush your teeth"), ['brush']);
});

test('hiệu ứng: thiếu vật thì dự phòng none; trên ảnh chỉ dùng hiệu ứng nhẹ', () => {
  assert.equal(effectiveMotion('open', { hasObject: true }), 'open');
  assert.equal(effectiveMotion('open', { hasObject: false }), 'none');
  assert.equal(effectiveMotion('wash', { hasObject: false }), 'wash');
  assert.equal(effectiveMotion('turn-on', { isImage: true }), 'glow');
  assert.equal(effectiveMotion('jump', { isImage: true }), 'bounce');
  assert.equal(effectiveMotion('xyz'), 'none');
});

test('nói được câu chỉ khi nghe ra từ khóa bắt buộc (động từ), không chỉ danh từ', () => {
  const required = ['put on'];
  assert.equal(matches('put on shirt', required), true);
  assert.equal(matches('put on your shirt', required), true);
  assert.equal(matches('shirt', required), false, 'chỉ nói danh từ không tính');
  assert.equal(matches('', required), false);
  assert.equal(matches(['hello', 'wash my face'], ['wash']), true);
});

test('tiến độ câu: khóa riêng, làm theo +1 mỗi ngày tối đa 2⭐, chọn sai không trừ', () => {
  assert.equal(phraseKey('Wash your face!'), 'phrase:wash your face');
  const day = new Date(2026, 9, 9, 9).getTime();
  let r = emptyProgress('phrase:wash your face');
  r = onDid(r, day);
  r = onDid(r, day + 1000);
  assert.equal(r.mastery, 1, 'cùng ngày chỉ +1');
  r = onDid(onDid(r, day + 86400000), day + 2 * 86400000);
  assert.equal(r.mastery, 2, 'tối đa 2⭐');
  r = onAttempt(onAttempt(r, false), true);
  assert.deepEqual(r.attempts, { right: 1, wrong: 1 });
  assert.equal(r.mastery, 2, 'chọn sai không trừ');
  const all = [{ word: 'cow' }, { word: 'phrase:wake up' }];
  assert.deepEqual(wordRecords(all).map((x) => x.word), ['cow']);
  assert.deepEqual(phraseRecords(all).map((x) => x.word), ['phrase:wake up']);
});

test('câu trùng với bài câu khác', () => {
  const other = { title: 'Bath', kind: 'phrases', phrases: [{ en: 'Wash your face' }] };
  assert.deepEqual(phraseOverlap(validatePhraseLesson(good).lesson, [other, { title: 'Animals', words: [] }]),
    [{ phrase: 'Wash your face', lessonTitle: 'Bath' }]);
});

test('prompt tạo bài câu: đủ luật chính', () => {
  const p = buildPhraseLessonPrompt({ situation: 'Getting dressed', count: 6, level: 'some', avoidPhrases: ['Open the door'] });
  assert.match(p, /situation: "Getting dressed"/);
  assert.match(p, /exactly 6 short, friendly commands/);
  assert.match(p, /3 to 5 words/);
  assert.match(p, /"motion": exactly one of: open, close, put-on/);
  assert.match(p, /"requiredKeywords": the main verb/);
  assert.match(p, /joined with spaces, give EXACTLY the phrase/);
  assert.match(p, /Do NOT repeat them: open the door/);
  assert.match(p, /"kind": "phrases"/);
});

test('bài câu mẫu Morning hợp lệ, không cảnh báo, 4 câu theo thứ tự', async () => {
  const { readFile } = await import('node:fs/promises');
  const r = parseLesson(await readFile(new URL('../../app/lessons/morning.json', import.meta.url), 'utf8'));
  assert.equal(r.ok, true, r.errors.join());
  assert.deepEqual(r.warnings, []);
  assert.deepEqual(r.lesson.phrases.map((p) => p.en), ['Wake up', 'Wash your face', 'Brush your teeth', 'Put on your shirt']);
  assert.equal(r.lesson.routine, true);
});

test('các bước bài câu: A–B–C cho từng câu rồi D cho từng câu', async () => {
  const { buildPhraseSteps } = await import('../../app/js/phrase.js');
  const steps = buildPhraseSteps({ phrases: [{}, {}] });
  assert.deepEqual(steps.map((s) => `${s.stage}${s.index}`), ['watch0', 'do0', 'say0', 'watch1', 'do1', 'say1', 'pick0', 'pick1']);
});

test('khung hình: chia nhóm 4 câu/ảnh, 3 bước, gán mặc định, gom theo thứ tự bước, phát hiện trùng', async () => {
  const { frameGroups, frameSteps, defaultFrameMapping, collectFrames } = await import('../../app/js/phrase.js');
  const lesson = { phrases: Array.from({ length: 6 }, (_, i) => ({ id: `p${i + 1}`, en: `Do ${i + 1}`, framePrompts: i === 0 ? ['a', 'b', 'c', 'd'] : ['x'] })) };
  const groups = frameGroups(lesson);
  assert.deepEqual(groups.map((g) => [g.from, g.to, g.shape.cols, g.shape.rows]), [[1, 4, 3, 4], [5, 6, 3, 2]]);
  assert.deepEqual(frameSteps(lesson.phrases[0]), ['a', 'b', 'c']);
  assert.equal(frameSteps(lesson.phrases[1]).length, 3);
  const mapping = defaultFrameMapping(groups[1], { cols: 3, rows: 3 });
  assert.deepEqual(mapping, ['p5:0', 'p5:1', 'p5:2', 'p6:0', 'p6:1', 'p6:2', '', '', '']);
  const swapped = ['p5:2', 'p5:0', 'p5:1', '', '', '', '', '', ''];
  const { ok, sets } = collectFrames(swapped, ['T0', 'T1', 'T2']);
  assert.equal(ok, true);
  assert.deepEqual(sets.get('p5'), ['T1', 'T2', 'T0'], 'theo thứ tự bước');
  assert.equal(collectFrames(['p5:0', 'p5:0'], ['A', 'B']).duplicate, 'p5:0');
});

test('prompt khung hình: lưới tuyệt đối, Bông nhất quán không bị cắt, mỗi hàng 1 hoạt động 3 khung, bối cảnh giữ nguyên', async () => {
  const { buildFramesPrompt } = await import('../../app/js/prompts.js');
  const p = buildFramesPrompt([
    { en: 'Wake up', scene: 'a bedroom with a bed and an alarm clock', steps: ['Bông sleeps in bed', 'The alarm rings', 'Bông sits up'] },
    { en: 'Wash your face', steps: ['Bông turns on the tap', 'Bông splashes water', 'Bông smiles'] },
  ]);
  assert.match(p, /EXACT 3-column × 2-row grid: 6 equal cells in total/);
  assert.match(p, /aspect ratio 3:2 \(width:height\) so that every cell is square/);
  assert.match(p, /exactly 2 straight vertical divider line\(s\) and exactly 1 straight horizontal divider line\(s\)/);
  assert.match(p, /never crop her head, ears, arms, legs or feet/);
  assert.match(p, /exactly 3 consecutive frames \(NOT 2 steps of one activity\)/);
  assert.match(p, /### ROW 1 — WAKE UP\nSetting that stays IDENTICAL in all 3 cells of this row \(same positions, same scale\): a bedroom with a bed and an alarm clock\.\nCell 1 — frame 1 of 3: Bông sleeps in bed\./);
  assert.match(p, /### ROW 2 — WASH YOUR FACE\nKeep the same background and the same props/);
  assert.match(p, /No body part, prop, water drop, motion mark or shadow may touch or cross a divider line/);
  assert.match(p, /FINAL CHECK: exactly 6 equal cells in 3 columns and 2 rows/);
  assert.doesNotMatch(p, /\bdoor\b/, 'không nhắc đồ vật không có trong bài');
  const one = buildFramesPrompt([{ en: 'Wake up', steps: ['a', 'b', 'c'] }]);
  assert.match(one, /3-column × 1-row grid: 3 equal cells/);
  assert.match(one, /exactly 0 straight horizontal divider line/);
  assert.match(one, /showing 1 separate 3-frame activity/);
});

test('bài câu giữ frameScene; nhóm làm từng câu là lưới 3×1', async () => {
  const { singlePhraseGroup } = await import('../../app/js/phrase.js');
  const r = validatePhraseLesson({ ...good, phrases: good.phrases.map((p) => ({ ...p, frameScene: 'a bathroom sink' })) });
  assert.equal(r.lesson.phrases[0].frameScene, 'a bathroom sink');
  const g = singlePhraseGroup(r.lesson, 1);
  assert.deepEqual([g.from, g.to, g.shape.cols, g.shape.rows, g.phrases[0].id], [2, 2, 3, 1, 'p2']);
});
