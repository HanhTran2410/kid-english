// Âm & ghép vần — Jolly Phonics (SPEC-jolly.md): dữ liệu nhóm 1, file âm, đáp án, không đọc âm rời bằng giọng máy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SOUNDS, GROUP_1, BLEND_WORDS, BLEND_BY, builtInJollyLessons, buildJollySteps, startChoices, letterChoicesFor, blendChoices,
  soundUrl, soundKey, MEET_INTRO, START_Q, LETTER_Q, BLEND_LISTEN, BLEND_Q,
} from '../../app/js/jolly.js';
import { wordRecords, soundRecords } from '../../app/js/progress.js';
import { collectItems } from '../../app/js/mix.js';

const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../app');

test('nhóm 1 đúng thứ tự Jolly s-a-t-i-p-n; mỗi âm có file ghi âm thật trong app/sounds/phonics/', async () => {
  assert.deepEqual(GROUP_1, ['s', 'a', 't', 'i', 'p', 'n']);
  for (const s of GROUP_1) await access(path.join(appDir, soundUrl(s)));
  assert.equal(soundKey('s'), 'sound:s');
});

test('từ có âm đầu bắt đầu đúng âm; từ ghép chỉ dùng âm nhóm 1 và viết đúng bằng các âm đó', () => {
  for (const s of SOUNDS) {
    assert.equal(s.words.length, 3);
    for (const w of s.words) assert.ok(w.en.startsWith(s.sound) && w.emoji, `${s.sound}: ${w.en}`);
    assert.ok(s.action && s.story.length === 2);
  }
  for (const w of BLEND_WORDS) {
    assert.ok(w.sounds.every((x) => GROUP_1.includes(x)), w.en);
    assert.equal(w.sounds.join(''), w.en);
    if (w.picture) assert.ok(w.emoji, w.en);
  }
  assert.ok(BLEND_WORDS.filter((w) => w.picture).length >= 8);
});

test('bài có sẵn: 3 bài Jolly, bước đúng (gặp âm → nghe âm đầu → tìm chữ, rồi ghép âm); lượt ghép có trong danh sách từ', () => {
  const lessons = builtInJollyLessons();
  assert.deepEqual(lessons.map((l) => l.builtin), ['jolly-1-sat', 'jolly-1-ipn', 'jolly-1-blend']);
  for (const l of lessons) {
    assert.equal(l.kind, 'phonics');
    assert.equal(l.mode, 'jolly');
    for (const b of l.blends) assert.ok(BLEND_BY.has(b), b);
  }
  const s1 = buildJollySteps(lessons[0]).map((x) => x.stage);
  assert.deepEqual(s1.slice(0, 3), ['meet', 'start', 'letter']);
  assert.deepEqual(s1.slice(-2), ['blend', 'blend']);
  assert.ok(buildJollySteps(lessons[2]).every((x) => x.stage === 'blend'));
  // Từ 2 âm trước từ có hình (bài 2).
  const b2 = lessons[1].blends.map((b) => BLEND_BY.get(b).sounds.length);
  assert.deepEqual(b2, [...b2].sort((a, b) => a - b));
});

test('đáp án: nghe âm đầu (1 hình đúng âm, 2 hình âm khác); tìm chữ (không trùng, có chữ đúng); ghép âm (từ đúng + 2 từ có hình khác)', () => {
  for (const s of GROUP_1) for (let i = 0; i < 30; i++) {
    const { answer, choices } = startChoices(s);
    assert.equal(choices.length, 3);
    assert.ok(answer.en.startsWith(s));
    assert.equal(choices.filter((w) => w.en.startsWith(s)).length, 1);
    const letters = letterChoicesFor(s, ['s', 'a', 't']);
    assert.equal(new Set(letters).size, 3);
    assert.ok(letters.includes(s));
  }
  for (const w of BLEND_WORDS.filter((x) => x.picture)) for (let i = 0; i < 20; i++) {
    const c = blendChoices(w);
    assert.equal(c.length, 3);
    assert.equal(new Set(c.map((x) => x.en)).size, 3);
    assert.ok(c.includes(w) && c.every((x) => x.picture));
  }
});

test('câu Bông nói bằng giọng máy không có chữ cái đứng một mình (giọng máy sẽ đọc tên chữ thay vì âm)', () => {
  const lines = [MEET_INTRO, ...START_Q, ...LETTER_Q, BLEND_LISTEN, BLEND_Q, ...SOUNDS.flatMap((s) => s.story)];
  // Chỉ "a" (mạo từ) và "I" là từ một chữ hợp lệ; chữ cái khác đứng riêng sẽ bị đọc thành tên chữ.
  const singles = (line) => (line.match(/(?<![a-z'])[a-z](?![a-z'])/gi) ?? []).filter((x) => x !== 'a' && x !== 'I');
  for (const line of lines) assert.deepEqual(singles(line), [], line);
  assert.deepEqual(singles('Which one starts with s?'), ['s']);
});

test('tiến độ âm `sound:` không lẫn vào từ vựng; bài Jolly không đưa vào Ôn tập (không hỏi tên chữ)', () => {
  const records = [{ word: 'sound:s' }, { word: 'letter:s' }, { word: 'sun' }];
  assert.deepEqual(wordRecords(records).map((r) => r.word), ['sun']);
  assert.deepEqual(soundRecords(records).map((r) => r.word), ['sound:s']);
  assert.deepEqual(collectItems(builtInJollyLessons().map((l, i) => ({ ...l, id: i + 1 }))), []);
});
