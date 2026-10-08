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
