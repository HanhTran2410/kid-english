import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideResult, RESULT } from '../../app/js/speech/listen.js';
import { pickVoice } from '../../app/js/speech/tts.js';
import { pickMimeType } from '../../app/js/speech/recorder.js';

test('kết quả nghe: khớp / có tiếng / im lặng / chỉ nghe', () => {
  assert.equal(decideResult({ micReady: false, matched: true, voiced: true }), RESULT.LISTEN_ONLY);
  assert.equal(decideResult({ micReady: true, matched: true, voiced: false }), RESULT.MATCH);
  assert.equal(decideResult({ micReady: true, matched: false, voiced: true }), RESULT.VOICE);
  assert.equal(decideResult({ micReady: true, matched: false, voiced: false, heardAnything: true }), RESULT.VOICE);
  assert.equal(decideResult({ micReady: true, matched: false, voiced: false, heardAnything: false }), RESULT.SILENT);
});

const v = (name, lang, extra = {}) => ({ name, lang, voiceURI: `${name}-${lang}`, localService: true, ...extra });
const voices = [
  v('Daniel', 'en-GB'),
  v('Samantha', 'en-US'),
  v('Ava (Enhanced)', 'en-US'),
  v('Linh', 'vi-VN'),
  v('Remote', 'en-US', { localService: false }),
];

test('chọn giọng theo ngôn ngữ, ưu tiên giọng Enhanced/Premium', () => {
  assert.equal(pickVoice(voices, 'en-US').name, 'Ava (Enhanced)');
  assert.equal(pickVoice(voices, 'vi-VN').name, 'Linh');
});

test('giọng bố mẹ đã chọn được ưu tiên nếu máy còn giọng đó', () => {
  assert.equal(pickVoice(voices, 'en-US', 'Daniel-en-GB').name, 'Daniel');
  assert.equal(pickVoice(voices, 'en-US', 'không-còn').name, 'Ava (Enhanced)');
});

test('không có en-US thì dùng giọng en-* bất kỳ; không có vi-VN thì null', () => {
  assert.equal(pickVoice([v('Daniel', 'en-GB')], 'en-US').name, 'Daniel');
  assert.equal(pickVoice([v('Daniel', 'en-GB')], 'vi-VN'), null);
  assert.equal(pickVoice([v('Karen', 'en_AU')], 'en-US').name, 'Karen');
});

test('định dạng ghi âm theo thứ tự mp4 → webm opus → webm', () => {
  assert.equal(pickMimeType(() => true), 'audio/mp4');
  assert.equal(pickMimeType((t) => t.startsWith('audio/webm')), 'audio/webm;codecs=opus');
  assert.equal(pickMimeType((t) => t === 'audio/webm'), 'audio/webm');
  assert.equal(pickMimeType(() => false), '');
});

test('không chọn giọng robot của iOS (Albert, Bad News, Eloquence…) dù đứng đầu danh sách', async () => {
  const { voiceScore, englishVoices } = await import('../../app/js/speech/tts.js');
  const ios = [
    v('Albert', 'en-US', { voiceURI: 'com.apple.speech.synthesis.voice.Albert' }),
    v('Bad News', 'en-US', { voiceURI: 'com.apple.speech.synthesis.voice.BadNews' }),
    v('Eddy (English (US))', 'en-US', { voiceURI: 'com.apple.eloquence.en-US.Eddy' }),
    v('Grandpa (English (US))', 'en-US', { voiceURI: 'com.apple.eloquence.en-US.Grandpa' }),
    v('Daniel', 'en-GB', { voiceURI: 'com.apple.voice.compact.en-GB.Daniel' }),
    v('Samantha', 'en-US', { voiceURI: 'com.apple.voice.compact.en-US.Samantha' }),
  ];
  assert.equal(pickVoice(ios, 'en-US').name, 'Samantha');
  assert.ok(voiceScore(ios[0]) < 0 && voiceScore(ios[2]) < 0);
  const premium = v('Ava (Premium)', 'en-US', { voiceURI: 'com.apple.voice.premium.en-US.Ava' });
  assert.equal(pickVoice([...ios, premium], 'en-US').name, 'Ava (Premium)');
  // Danh sách trong Cài đặt: giọng tốt trước, giọng robot cuối.
  assert.equal(englishVoices([...ios, premium])[0].name, 'Ava (Premium)');
  assert.equal(englishVoices(ios).at(-1).name.startsWith('Albert') || voiceScore(englishVoices(ios).at(-1)) < 0, true);
  // Chỉ có giọng en-GB tốt và en-US robot → chọn en-GB.
  assert.equal(pickVoice([ios[0], ios[4]], 'en-US').name, 'Daniel');
});

test('giọng đọc bị kẹt (câu không bắt đầu) thì gỡ kẹt và đọc lại một lần; không hủy câu khi không có gì đang đọc', async () => {
  const log = [];
  let swallowFirst = true;
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  globalThis.speechSynthesis = {
    speaking: false, pending: false, paused: false,
    getVoices: () => [],
    cancel() { log.push('cancel'); },
    resume() { log.push('resume'); },
    speak(u) {
      log.push(`speak:${u.text}`);
      if (swallowFirst) { swallowFirst = false; return; } // iOS nuốt mất câu đầu
      setTimeout(() => { u.onstart?.(); u.onend?.(); }, 10);
    },
  };
  try {
    const { Speaker } = await import('../../app/js/speech/tts.js');
    const speaker = new Speaker();
    const t0 = Date.now();
    await speaker.speak('Cow!');
    assert.deepEqual(log, ['speak:Cow!', 'cancel', 'speak:Cow!']);
    assert.ok(Date.now() - t0 < 3000);
    log.length = 0;
    await speaker.speak('Dog!');
    assert.deepEqual(log, ['speak:Dog!'], 'không gọi cancel() trước speak() khi không có câu nào đang đọc');
  } finally {
    delete globalThis.speechSynthesis;
    delete globalThis.SpeechSynthesisUtterance;
  }
});
