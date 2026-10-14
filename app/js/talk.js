// "Nói chuyện với Bông" (SPEC-talk.md): bài hội thoại hỏi – đáp, hồ sơ của bé, ghép câu theo hồ sơ.
// Các hàm đều thuần (không phụ thuộc DOM), test được trong Node.

import { NUMBER_WORDS } from './numbers.js';

export const TALK_KIND = 'talk';
export const TURN_TYPES = ['greeting', 'free', 'choice', 'yesNo', 'askBack'];

/** Thành viên gia đình có thể chọn trong hồ sơ (Mummy, Daddy mặc định có). */
export const FAMILY = [
  { id: 'mummy', en: 'Mummy', vi: 'Mẹ', emoji: '👩' },
  { id: 'daddy', en: 'Daddy', vi: 'Bố', emoji: '👨' },
  { id: 'grandma', en: 'Grandma', vi: 'Bà', emoji: '👵' },
  { id: 'grandpa', en: 'Grandpa', vi: 'Ông', emoji: '👴' },
  { id: 'brother', en: 'my brother', vi: 'anh / em trai', emoji: '👦' },
  { id: 'sister', en: 'my sister', vi: 'chị / em gái', emoji: '👧' },
];

export const DEFAULT_PROFILE = { name: '', age: null, color: '', food: '', family: ['mummy', 'daddy'] };

/** Hồ sơ đã chuẩn hóa (thiếu trường thì lấy mặc định). */
export function normalizeProfile(p = {}) {
  const age = Number(p?.age);
  return {
    name: String(p?.name ?? '').trim(),
    age: Number.isInteger(age) && age >= 2 && age <= 6 ? age : null,
    color: String(p?.color ?? '').trim(),
    food: String(p?.food ?? '').trim(),
    family: Array.isArray(p?.family) && p.family.length ? p.family.filter((f) => FAMILY.some((m) => m.id === f)) : [...DEFAULT_PROFILE.family],
  };
}

/** Câu chung của Bông + bản tiếng Việt (phụ đề khi chạm 🔊). */
export const COMMON_VI = {
  'Great job!': 'Giỏi lắm!',
  'Good try!': 'Con cố gắng tốt lắm!',
  'Your turn!': 'Đến lượt con!',
  "Let's talk!": 'Mình nói chuyện nhé!',
};

/**
 * Thay {name}, {age} (bằng chữ), {ageNumber} theo hồ sơ. Không có tên thì bỏ luôn ", {name}" (không đọc chỗ trống).
 */
export function fillText(text, profile) {
  const p = normalizeProfile(profile);
  let s = String(text ?? '');
  if (!p.name) s = s.replace(/,?\s*\{name\}/g, '');
  return s.trim()
    .replace(/\{name\}/g, p.name)
    .replace(/\{age\}/g, p.age ? NUMBER_WORDS[p.age] : '')
    .replace(/\{ageNumber\}/g, p.age ? String(p.age) : '');
}

/** Lượt có dùng được với hồ sơ này không (`needs`: "age", "family:mummy"…). */
export function turnAvailable(turn, profile) {
  const p = normalizeProfile(profile);
  return (turn.needs ?? []).every((need) => {
    if (need === 'age') return Boolean(p.age);
    if (need === 'name') return Boolean(p.name);
    if (need.startsWith('family:')) return p.family.includes(need.slice('family:'.length));
    return true;
  });
}

/**
 * Lượt đã ghép hồ sơ: mọi câu đã thay placeholder, chọn bản "…NoProfile" khi chưa có tên. null = bỏ lượt.
 */
export function resolveTurn(turn, profile) {
  if (!turnAvailable(turn, profile)) return null;
  const p = normalizeProfile(profile);
  const pick = (key) => (!p.name && turn[`${key}NoProfile`] != null ? turn[`${key}NoProfile`] : turn[key]);
  const f = (key) => fillText(pick(key) ?? '', p);
  const out = { ...turn };
  for (const key of ['ask', 'askVi', 'answer', 'answerVi', 'reply', 'replyVi', 'intro', 'introVi']) {
    if (turn[key] != null) out[key] = f(key);
  }
  out.keywords = (turn.keywords ?? []).map((k) => fillText(k, p)).filter(Boolean);
  if (p.age && (turn.keywords ?? []).includes('{age}')) out.keywords.push(String(p.age));
  const side = (c) => ({ ...c, answer: fillText(c.answer, p), answerVi: fillText(c.answerVi ?? '', p) });
  if (turn.choices) out.choices = turn.choices.map(side);
  if (turn.yes) out.yes = side(turn.yes);
  if (turn.no) out.no = side(turn.no);
  return out;
}

/** Các lượt của một bài cho hồ sơ này (bỏ lượt thiếu hồ sơ). */
export const lessonTurns = (lesson, profile) => (lesson.turns ?? []).map((t) => resolveTurn(t, profile)).filter(Boolean);

/** Khóa tiến độ của một lượt: talk:<mã bài>:<mã lượt> (mã bài có sẵn ổn định giữa các máy). */
export const talkKey = (lesson, turnId) => `talk:${lesson.builtin ?? lesson.id}:${turnId}`;

export const isTalkLesson = (lesson) => lesson?.kind === TALK_KIND || Array.isArray(lesson?.turns);

/** Kiểm tra bài hội thoại: đúng `type`, đủ trường theo `type`, mã lượt không trùng. */
export function validateTalkLesson(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') return { ok: false, errors: ['Bài hội thoại không hợp lệ.'] };
  if (!String(raw.title ?? '').trim()) errors.push('Thiếu tên bài.');
  const turns = Array.isArray(raw.turns) ? raw.turns : [];
  if (!turns.length) errors.push('Bài không có lượt nào.');
  const ids = new Set();
  for (const [i, t] of turns.entries()) {
    const where = `Lượt ${i + 1}`;
    if (!t?.id || ids.has(t.id)) errors.push(`${where}: thiếu hoặc trùng mã.`);
    ids.add(t?.id);
    if (!TURN_TYPES.includes(t?.type)) { errors.push(`${where}: kiểu "${t?.type}" không có.`); continue; }
    if (!t.ask) errors.push(`${where}: thiếu "ask".`);
    if (['greeting', 'free'].includes(t.type) && !t.answer) errors.push(`${where}: thiếu "answer".`);
    if (t.type === 'askBack' && !t.reply) errors.push(`${where}: thiếu "reply".`);
    if (t.type === 'choice' && !(Array.isArray(t.choices) && t.choices.length >= 2 && t.choices.every((c) => c.id && c.emoji && c.answer))) {
      errors.push(`${where}: "choices" cần ít nhất 2 lựa chọn có id, emoji, answer.`);
    }
    if (t.type === 'yesNo' && !(t.yes?.answer && t.no?.answer)) errors.push(`${where}: thiếu "yes" / "no".`);
  }
  return { ok: !errors.length, errors };
}

const choice = (id, emoji, answer, answerVi, keywords = [id]) => ({ id, emoji, answer, answerVi, keywords });

/** 5 bài hội thoại có sẵn (SPEC-talk mục 2). `builtin`: mã cố định để tự thêm một lần. */
export function builtInTalkLessons() {
  const lessons = [
    {
      builtin: 'talk-hello', title: 'Hello & Goodbye', titleVi: 'Chào hỏi', emoji: '👋',
      turns: [
        { id: 'hello', type: 'greeting', ask: 'Hello, {name}!', askVi: 'Chào {name}!', answer: 'Hello!', answerVi: 'Xin chào!', keywords: ['hello', 'hi'] },
        { id: 'say-hello', type: 'askBack', intro: 'Now you say hello to me!', introVi: 'Giờ con chào Bông nhé!',
          ask: 'Hello, Bông!', askVi: 'Chào Bông!', reply: "Hello! I'm happy to see you!", replyVi: 'Chào con! Bông vui được gặp con!', keywords: ['hello', 'hi'] },
        { id: 'goodbye', type: 'greeting', ask: 'Goodbye, {name}!', askVi: 'Tạm biệt {name}!', answer: 'Bye-bye!', answerVi: 'Tạm biệt!', keywords: ['bye', 'goodbye'] },
      ],
    },
    {
      builtin: 'talk-about-me', title: 'About me', titleVi: 'Về bé', emoji: '🙋',
      turns: [
        { id: 'name', type: 'free', ask: "What's your name?", askVi: 'Con tên là gì?',
          answer: 'My name is {name}.', answerVi: 'Con tên là {name}.',
          answerNoProfile: 'Tell me your name!', answerNoProfileVi: 'Con nói tên con nhé!',
          reply: 'Nice to meet you, {name}!', replyVi: 'Rất vui được gặp con, {name}!' },
        { id: 'age', type: 'free', needs: ['age'], ask: 'How old are you?', askVi: 'Con mấy tuổi?',
          answer: "I'm {age}!", answerVi: 'Con {ageNumber} tuổi!', keywords: ['{age}'], reply: 'Wow, {age}!', replyVi: 'Ồ, {ageNumber} tuổi!' },
        { id: 'ask-name', type: 'askBack', intro: 'Now you ask me!', introVi: 'Giờ con hỏi Bông nhé!',
          ask: "What's your name?", askVi: 'Bạn tên là gì?', reply: 'My name is Bông!', replyVi: 'Mình tên là Bông!', keywords: ['name'] },
      ],
    },
    {
      builtin: 'talk-feelings', title: 'How are you?', titleVi: 'Con thấy thế nào?', emoji: '😊',
      turns: [
        { id: 'feel', type: 'choice', ask: 'How are you, {name}?', askVi: 'Con thấy thế nào, {name}?',
          choices: [choice('happy', '😀', "I'm happy!", 'Con vui!'), choice('sad', '😢', "I'm sad.", 'Con buồn.'),
            choice('sleepy', '😴', "I'm sleepy.", 'Con buồn ngủ.')] },
        { id: 'ask-feel', type: 'askBack', intro: 'Now you ask me!', introVi: 'Giờ con hỏi Bông nhé!',
          ask: 'How are you?', askVi: 'Bạn thấy thế nào?', reply: "I'm happy! Thank you!", replyVi: 'Bông vui lắm! Cảm ơn con!', keywords: ['how'] },
        { id: 'hungry', type: 'yesNo', ask: 'Are you hungry?', askVi: 'Con có đói không?',
          yes: { answer: 'Yes, I am!', answerVi: 'Có, con đói!', keywords: ['yes'] },
          no: { answer: "No, I'm not!", answerVi: 'Không, con không đói!', keywords: ['no'] } },
      ],
    },
    {
      builtin: 'talk-likes', title: 'I like…', titleVi: 'Con thích…', emoji: '❤️',
      turns: [
        { id: 'color', type: 'choice', ask: 'What color do you like?', askVi: 'Con thích màu gì?',
          choices: [choice('red', '🔴', 'I like red!', 'Con thích màu đỏ!'), choice('blue', '🔵', 'I like blue!', 'Con thích màu xanh dương!'),
            choice('yellow', '🟡', 'I like yellow!', 'Con thích màu vàng!'), choice('green', '🟢', 'I like green!', 'Con thích màu xanh lá!')] },
        { id: 'apples', type: 'yesNo', ask: 'Do you like apples?', askVi: 'Con có thích táo không?', picture: '🍎',
          yes: { answer: 'Yes, I do!', answerVi: 'Có, con thích!', keywords: ['yes'] },
          no: { answer: "No, I don't!", answerVi: 'Không, con không thích!', keywords: ['no'] } },
        { id: 'dogs', type: 'yesNo', ask: 'Do you like dogs?', askVi: 'Con có thích chó không?', picture: '🐶',
          yes: { answer: 'Yes, I do!', answerVi: 'Có, con thích!', keywords: ['yes'] },
          no: { answer: "No, I don't!", answerVi: 'Không, con không thích!', keywords: ['no'] } },
      ],
    },
    {
      builtin: 'talk-family', title: 'My family', titleVi: 'Gia đình', emoji: '👨‍👩‍👧',
      turns: FAMILY.map((m) => ({
        id: m.id, type: 'free', needs: [`family:${m.id}`], picture: m.emoji,
        ask: 'Who is this?', askVi: 'Đây là ai?',
        answer: `It's ${m.en}!`, answerVi: `Đây là ${m.vi}!`, keywords: [m.en.replace(/^my /, '').toLowerCase()],
        reply: `Yes! ${m.en.charAt(0).toUpperCase()}${m.en.slice(1)}!`, replyVi: `Đúng rồi! ${m.vi.charAt(0).toUpperCase()}${m.vi.slice(1)}!`,
      })),
    },
  ];
  return lessons.map((l) => ({ version: 2, kind: TALK_KIND, topic: 'Talk', outro: 'That was fun! See you, {name}!', outroVi: 'Vui quá! Hẹn gặp lại {name}!', ...l }));
}
