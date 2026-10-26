// Âm & ghép vần — kiểu Jolly Phonics (SPEC-jolly.md): học ÂM của chữ (không phải tên chữ) theo thứ tự s-a-t-i-p-n,
// mỗi âm một động tác + câu chuyện; ghép âm thành từ bằng tai (p-i-n → pin). Âm rời luôn phát từ file ghi âm thật
// (app/sounds/phonics/<âm>.mp3) — giọng đọc của máy chỉ đọc từ trọn vẹn và câu của Bông.
// Bài lưu như bài phonics (`kind: 'phonics'`, `mode: 'jolly'`, có `letters`) để dùng chung khung bài, tab, ảnh, sao lưu.

import { PHONICS_KIND } from './phonics.js';

export const JOLLY_MODE = 'jolly';
export const JOLLY_TOPIC = 'Sounds';
export const soundUrl = (s) => `sounds/phonics/${s}.mp3`;
/** Khóa tiến độ của âm (riêng, không lẫn `letter:` của mục ABC — tên chữ và âm là hai việc khác nhau). */
export const soundKey = (s) => `sound:${s}`;
export const isJollyLesson = (lesson) => lesson?.mode === JOLLY_MODE;

/**
 * Nhóm 1 (s a t i p n). `action`: động tác cho bố mẹ làm cùng bé; `story`: câu Bông kể (phần âm rời phát file:
 * `story` là [trước, sau] — Bông nói "trước", phát âm, nói "sau"); `words`: từ có âm đầu đúng âm (nghe – chọn hình).
 */
export const SOUNDS = [
  { sound: 's', color: '#2f9e44', action: 'Tay lượn như con rắn', story: ['The snake says', '!'], words: [{ en: 'sun', emoji: '☀️' }, { en: 'sock', emoji: '🧦' }, { en: 'snake', emoji: '🐍' }] },
  { sound: 'a', color: '#e8590c', action: 'Ngón tay bò lên cánh tay như kiến', story: ['Ants on my arm!', '!'], words: [{ en: 'ant', emoji: '🐜' }, { en: 'apple', emoji: '🍎' }, { en: 'alligator', emoji: '🐊' }] },
  { sound: 't', color: '#1c7ed6', action: 'Quay đầu trái phải như xem tennis', story: ['Watch the tennis!', '!'], words: [{ en: 'tiger', emoji: '🐯' }, { en: 'teddy', emoji: '🧸' }, { en: 'tent', emoji: '⛺' }] },
  { sound: 'i', color: '#ae3ec9', action: 'Ngón tay làm râu chuột ở mũi', story: ['The little mouse says', '!'], words: [{ en: 'insect', emoji: '🐛' }, { en: 'ink', emoji: '🖋️' }, { en: 'igloo', emoji: '🧊' }] },
  { sound: 'p', color: '#e64980', action: 'Thổi nến sinh nhật', story: ['Blow out the candles!', '!'], words: [{ en: 'pig', emoji: '🐷' }, { en: 'pen', emoji: '🖊️' }, { en: 'pizza', emoji: '🍕' }] },
  { sound: 'n', color: '#0c8599', action: 'Dang tay như máy bay', story: ['The plane goes', '!'], words: [{ en: 'nest', emoji: '🪺' }, { en: 'nose', emoji: '👃' }, { en: 'net', emoji: '🥅' }] },
];
export const SOUND_BY = new Map(SOUNDS.map((s) => [s.sound, s]));
export const GROUP_1 = SOUNDS.map((s) => s.sound);

/** Từ ghép được chỉ bằng âm nhóm 1. `sounds`: các âm theo thứ tự; `picture`: có hình để chọn (từ 2 âm không có hình rõ). */
export const BLEND_WORDS = [
  { en: 'at', sounds: ['a', 't'], picture: false },
  { en: 'in', sounds: ['i', 'n'], picture: false },
  { en: 'it', sounds: ['i', 't'], picture: false },
  { en: 'an', sounds: ['a', 'n'], picture: false },
  { en: 'sat', sounds: ['s', 'a', 't'], picture: false },
  { en: 'ant', sounds: ['a', 'n', 't'], emoji: '🐜', picture: true },
  { en: 'pin', sounds: ['p', 'i', 'n'], emoji: '📌', picture: true },
  { en: 'pan', sounds: ['p', 'a', 'n'], emoji: '🍳', picture: true },
  { en: 'tap', sounds: ['t', 'a', 'p'], emoji: '🚰', picture: true },
  { en: 'nap', sounds: ['n', 'a', 'p'], emoji: '😴', picture: true },
  { en: 'sit', sounds: ['s', 'i', 't'], emoji: '🪑', picture: true },
  { en: 'sip', sounds: ['s', 'i', 'p'], emoji: '🥤', picture: true },
  { en: 'tin', sounds: ['t', 'i', 'n'], emoji: '🥫', picture: true },
];
export const BLEND_BY = new Map(BLEND_WORDS.map((w) => [w.en, w]));

/**
 * 3 bài có sẵn (SPEC-jolly mục 3). `blends`: các lượt ghép âm cuối bài — từ 2 âm trước (xem Bông ghép), rồi từ có hình (chọn hình).
 */
const LESSONS = [
  { builtin: 'jolly-1-sat', title: 'Sounds s a t', titleVi: 'Âm s a t', emoji: '🐍', sounds: ['s', 'a', 't'], blends: ['at', 'sat'] },
  { builtin: 'jolly-1-ipn', title: 'Sounds i p n', titleVi: 'Âm i p n', emoji: '🐭', sounds: ['i', 'p', 'n'], blends: ['in', 'it', 'pin', 'tin', 'sip'] },
  { builtin: 'jolly-1-blend', title: 'Blend it! s a t i p n', titleVi: 'Ghép âm s a t i p n', emoji: '🧩', sounds: [], blends: ['an', 'at', 'ant', 'pan', 'tap', 'nap', 'sit', 'pin'] },
];

export function builtInJollyLessons() {
  return LESSONS.map((l) => ({
    version: 2, kind: PHONICS_KIND, mode: JOLLY_MODE, builtin: l.builtin, title: l.title, titleVi: l.titleVi, topic: JOLLY_TOPIC, emoji: l.emoji,
    // `letters`: dùng chung cấu trúc bài phonics (ảnh từ, thẻ bài); bài ghép âm liệt kê cả 6 âm để làm đáp án nhiễu.
    letters: (l.sounds.length ? l.sounds : GROUP_1).map((s) => ({ letter: s, sound: `/${s}/`, inside: false, words: SOUND_BY.get(s).words.map((w) => ({ ...w })) })),
    blends: [...l.blends],
    blendOnly: !l.sounds.length,
  }));
}

/**
 * Các bước của bài Jolly: với từng âm: gặp âm → nghe âm đầu → tìm chữ; cuối bài: các lượt ghép âm.
 * Bài "Blend it!" chỉ có các lượt ghép âm.
 */
export function buildJollySteps(lesson) {
  const steps = [];
  if (!lesson.blendOnly) lesson.letters.forEach((_, index) => steps.push({ stage: 'meet', index }, { stage: 'start', index }, { stage: 'letter', index }));
  (lesson.blends ?? []).forEach((_, index) => steps.push({ stage: 'blend', index }));
  return steps;
}

const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Hình cho "Which one starts with [s]?": 1 từ của âm này + 2 từ của âm KHÁC trong nhóm (âm đầu khác). */
export function startChoices(sound, rng = Math.random, count = 3) {
  const answer = shuffle(SOUND_BY.get(sound).words, rng)[0];
  const wrong = shuffle(SOUNDS.filter((s) => s.sound !== sound), rng).slice(0, count - 1).map((s) => shuffle(s.words, rng)[0]);
  return { answer, choices: shuffle([answer, ...wrong], rng) };
}

/** Thẻ chữ cho "Find the letter!": âm đúng + âm khác (ưu tiên âm của bài), không trùng. */
export function letterChoicesFor(sound, pool, rng = Math.random, count = 3) {
  const others = [...shuffle(pool.filter((s) => s !== sound), rng), ...shuffle(GROUP_1.filter((s) => s !== sound && !pool.includes(s)), rng)];
  return shuffle([sound, ...others.slice(0, count - 1)], rng);
}

/** Hình cho lượt ghép âm (từ có hình): từ đúng + 2 từ có hình khác, không trùng âm đầu với từ đúng khi đủ lựa chọn. */
export function blendChoices(word, rng = Math.random, count = 3) {
  const pics = BLEND_WORDS.filter((w) => w.picture && w.en !== word.en);
  const diffStart = pics.filter((w) => w.sounds[0] !== word.sounds[0]);
  const pool = diffStart.length >= count - 1 ? diffStart : pics;
  return shuffle([word, ...shuffle(pool, rng).slice(0, count - 1)], rng);
}

// ---------- Câu nói (phần âm rời phát file, không bao giờ đọc bằng giọng máy) ----------
export const MEET_INTRO = "Listen! Here's a new sound!";
export const START_Q = ['Which one starts with', '?'];
export const LETTER_Q = ['Find the letter for', '!'];
export const BLEND_LISTEN = 'Listen!';
export const BLEND_Q = 'What is it?';
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
