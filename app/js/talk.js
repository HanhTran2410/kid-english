// "Nói chuyện với Bông" (SPEC-talk.md): bài hội thoại hỏi – đáp, hồ sơ của bé, ghép câu theo hồ sơ.
// Các hàm đều thuần (không phụ thuộc DOM), test được trong Node.

import { NUMBER_WORDS } from './numbers.js';

export const TALK_KIND = 'talk';
export const TURN_TYPES = ['greeting', 'free', 'choice', 'yesNo', 'askBack', 'action'];
/** Nét mặt của Bông (bong.js). */
export const MOODS = ['happy', 'surprise', 'sad', 'sleep'];
/** Hiệu ứng khi bé chạm ở lượt động tác. */
export const EFFECTS = ['clap', 'hearts', 'confetti'];
/** Phiên bản nội dung 5 bài có sẵn: tăng khi đổi lượt để bài đã có trên máy tự cập nhật (SPEC-talk mục 13.4). */
export const TALK_BUILTIN_VERSION = 2;

/**
 * Thành viên gia đình có thể chọn trong hồ sơ (Mummy, Daddy mặc định có).
 * name / draw: tên ô và mô tả hình trong prompt ảnh — "Mummy" một mình dễ bị AI vẽ thành xác ướp, nên luôn ghi rõ là
 * mẹ (người), kèm dấu hiệu nhận ra từng người (ông bà tóc bạc, anh chị em là trẻ con).
 */
export const FAMILY = [
  { id: 'mummy', en: 'Mummy', vi: 'Mẹ', emoji: '👩', name: 'Mother (Mummy)',
    draw: "a smiling young mother — a human woman, the child's mom — with shoulder-length brown hair and a pink top, upper body, waving warmly (a loving mom, not a bandaged Egyptian mummy)" },
  { id: 'daddy', en: 'Daddy', vi: 'Bố', emoji: '👨', name: 'Father (Daddy)',
    draw: "a smiling young father — a human man, the child's dad — with short dark hair and a blue shirt, upper body, waving warmly" },
  { id: 'grandma', en: 'Grandma', vi: 'Bà', emoji: '👵', name: 'Grandmother (Grandma)',
    draw: 'a smiling grandmother — an older human woman — with gray hair in a bun and round glasses, upper body' },
  { id: 'grandpa', en: 'Grandpa', vi: 'Ông', emoji: '👴', name: 'Grandfather (Grandpa)',
    draw: 'a smiling grandfather — an older human man — with short gray hair and a gray mustache, upper body' },
  { id: 'brother', en: 'my brother', vi: 'anh / em trai', emoji: '👦', name: 'Brother',
    draw: 'a cheerful young boy — a human child about 6 years old — in a green T-shirt, full body, clearly a child (smaller than the adults)' },
  { id: 'sister', en: 'my sister', vi: 'chị / em gái', emoji: '👧', name: 'Sister',
    draw: 'a cheerful young girl — a human child about 6 years old — with two pigtails and a yellow dress, full body, clearly a child (smaller than the adults)' },
];

/** Ảnh thật của người trong gia đình (Hồ sơ của bé): kho `images`, không thuộc bài nào nên không đi kèm khi chia sẻ bài. */
export const PROFILE_IMAGES = 'profile:family';
export const familyPhotoKey = (memberId) => `family:${memberId}`;

/** Màu thích (hồ sơ + lựa chọn trong bài): Bông đáp theo màu bé chọn. */
export const COLOR_POOL = [
  { id: 'red', en: 'red', vi: 'đỏ', emoji: '🔴', reply: 'Red! Like an apple!', replyVi: 'Màu đỏ! Giống quả táo!' },
  { id: 'blue', en: 'blue', vi: 'xanh dương', emoji: '🔵', reply: 'Blue! Like the sky!', replyVi: 'Xanh dương! Giống bầu trời!' },
  { id: 'yellow', en: 'yellow', vi: 'vàng', emoji: '🟡', reply: 'Yellow! Like the sun!', replyVi: 'Màu vàng! Giống ông mặt trời!' },
  { id: 'green', en: 'green', vi: 'xanh lá', emoji: '🟢', reply: 'Green! Like a leaf!', replyVi: 'Xanh lá! Giống chiếc lá!' },
  { id: 'pink', en: 'pink', vi: 'hồng', emoji: '🌸', reply: 'Pink! Like my ears!', replyVi: 'Màu hồng! Giống tai Bông!' },
  { id: 'purple', en: 'purple', vi: 'tím', emoji: '🟣', reply: 'Purple! Like grapes!', replyVi: 'Màu tím! Giống quả nho!' },
  { id: 'orange', en: 'orange', vi: 'cam', emoji: '🟠', reply: 'Orange! Like an orange!', replyVi: 'Màu cam! Giống quả cam!' },
];

/** Món thích (hồ sơ + lựa chọn "What do you want to eat?"). */
export const FOOD_POOL = [
  { id: 'bananas', en: 'bananas', vi: 'chuối', emoji: '🍌', reply: 'Yummy! A yellow banana!', replyVi: 'Ngon quá! Một quả chuối vàng!' },
  { id: 'rice', en: 'rice', vi: 'cơm', emoji: '🍚', reply: 'Yummy! A bowl of rice!', replyVi: 'Ngon quá! Một bát cơm!' },
  { id: 'cookies', en: 'cookies', vi: 'bánh quy', emoji: '🍪', reply: 'Yummy! Crunchy cookies!', replyVi: 'Ngon quá! Bánh quy giòn tan!' },
  { id: 'apples', en: 'apples', vi: 'táo', emoji: '🍎', reply: 'Yummy! A red apple!', replyVi: 'Ngon quá! Một quả táo đỏ!' },
  { id: 'noodles', en: 'noodles', vi: 'mì', emoji: '🍜', reply: 'Yummy! Hot noodles!', replyVi: 'Ngon quá! Mì nóng hổi!' },
  { id: 'ice-cream', en: 'ice cream', vi: 'kem', emoji: '🍦', reply: 'Yummy! Cold ice cream!', replyVi: 'Ngon quá! Kem mát lạnh!' },
  { id: 'milk', en: 'milk', vi: 'sữa', emoji: '🥛', reply: 'Yummy! A glass of milk!', replyVi: 'Ngon quá! Một cốc sữa!' },
];

const POOLS = {
  colors: COLOR_POOL.map((c) => ({ ...c, answer: `I like ${c.en}!`, answerVi: `Con thích màu ${c.vi}!`, keywords: [c.en], draw: `a big ${c.en} paint splash` })),
  foods: FOOD_POOL.map((f) => ({ ...f, answer: `${f.en.charAt(0).toUpperCase()}${f.en.slice(1)}, please!`, answerVi: `Con muốn ăn ${f.vi}!`, keywords: [f.en.split(' ')[0]], draw: f.en })),
};

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

/** Lời khen khi bé nói (đổi ngẫu nhiên cho đỡ nhàm). */
export const PRAISES = ['Great job!', 'Wonderful!', 'Super!', 'Yay!'];

/** Câu chung của Bông + bản tiếng Việt (phụ đề khi chạm 🔊). */
export const COMMON_VI = {
  'Great job!': 'Giỏi lắm!',
  'Wonderful!': 'Tuyệt vời!',
  'Super!': 'Siêu quá!',
  'Yay!': 'Hoan hô!',
  'Good try!': 'Con cố gắng tốt lắm!',
  'Your turn!': 'Đến lượt con!',
  "Let's talk!": 'Mình nói chuyện nhé!',
};

const cap = (s) => (s ? `${s.charAt(0).toUpperCase()}${s.slice(1)}` : s);

/** "One, two, three!" — Bông đếm tới tuổi của bé. */
export const countUpTo = (n) => `${cap(NUMBER_WORDS.slice(1, n + 1).join(', '))}!`;

/**
 * Thay {name}, {age} (bằng chữ), {ageNumber}, {ageCount} ("One, two, three!") theo hồ sơ.
 * Không có tên thì bỏ luôn ", {name}" (không đọc chỗ trống).
 */
export function fillText(text, profile) {
  const p = normalizeProfile(profile);
  let s = String(text ?? '');
  if (!p.name) s = s.replace(/,?\s*\{name\}/g, '');
  return s.trim()
    .replace(/\{name\}/g, p.name)
    .replace(/\{ageCount\}/g, p.age ? countUpTo(p.age) : '')
    .replace(/\{age\}/g, p.age ? NUMBER_WORDS[p.age] : '')
    .replace(/\{ageNumber\}/g, p.age ? String(p.age) : '')
    .replace(/\s{2,}/g, ' ');
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

/** Giá trị hồ sơ (màu / món) đổi sang mã lựa chọn trong kho ("ice cream" → "ice-cream"). */
const profileChoiceId = (pool, value) => POOLS[pool]?.find((c) => c.en === value || c.id === value)?.id ?? null;

/**
 * Lựa chọn lấy từ kho (màu / món): `count` mục đầu; nếu hồ sơ có món / màu thích mà chưa có trong số đó thì thay mục cuối
 * (để Bông "nhớ" được — SPEC-talk mục 13.2).
 */
export function poolChoices(pool, count, profileValue = '') {
  const all = POOLS[pool] ?? [];
  const list = all.slice(0, count);
  const fav = profileChoiceId(pool, profileValue);
  if (fav && !list.some((c) => c.id === fav)) list[list.length - 1] = all.find((c) => c.id === fav);
  return list;
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
  const side = (c) => ({
    ...c,
    answer: fillText(c.answer, p),
    answerVi: fillText(c.answerVi ?? '', p),
    ...(c.reply != null ? { reply: fillText(c.reply, p), replyVi: fillText(c.replyVi ?? '', p) } : {}),
  });
  let choices = turn.choices;
  if (turn.pool) choices = poolChoices(turn.pool, turn.count ?? 3, turn.remember ? p[turn.remember] : '');
  if (choices) out.choices = choices.map(side);
  // Bông "nhớ" hồ sơ: bé chọn đúng món / màu thích → câu đáp riêng ("I know! You like red!").
  if (turn.remember && turn.rememberReply) {
    const fav = POOLS[turn.pool]?.find((c) => c.id === profileChoiceId(turn.pool, p[turn.remember]));
    if (fav) {
      out.favorite = fav.id;
      out.rememberReply = fillText(turn.rememberReply.replace(/\{pick\}/g, fav.en), p);
      out.rememberReplyVi = fillText(String(turn.rememberReplyVi ?? '').replace(/\{pickVi\}/g, fav.vi), p);
    } else {
      delete out.rememberReply;
      delete out.rememberReplyVi;
    }
  }
  if (turn.yes) out.yes = side(turn.yes);
  if (turn.no) out.no = side(turn.no);
  return out;
}

/** Các lượt của một bài cho hồ sơ này (bỏ lượt thiếu hồ sơ). */
export const lessonTurns = (lesson, profile) => (lesson.turns ?? []).map((t) => resolveTurn(t, profile)).filter(Boolean);

/** Lượt có điều kiện (`onlyIf`): chỉ chạy khi bé đã chọn đúng lựa chọn đó ở lượt trước (vd. có đói mới hỏi ăn gì). */
export const turnAllowed = (turn, picks = {}) => !turn.onlyIf || picks[turn.onlyIf.turn] === turn.onlyIf.pick;

/** Khóa tiến độ của một lượt: talk:<mã bài>:<mã lượt> (mã bài có sẵn ổn định giữa các máy). */
export const talkKey = (lesson, turnId) => `talk:${lesson.builtin ?? lesson.id}:${turnId}`;

export const isTalkLesson = (lesson) => lesson?.kind === TALK_KIND || Array.isArray(lesson?.turns);

/**
 * Các hình trong bài (hình của lượt, nút động tác, hình từng lựa chọn) — bố mẹ thay được bằng ảnh (SPEC-talk mục 13.3).
 * `key` là khóa ảnh trong kho `images` của bài (một hình dùng ở nhiều lượt thì chung một ảnh); `name` là tên ô trong prompt ảnh.
 * @returns {{ key: string, emoji: string, label: string, draw: string, name: string }[]}
 */
export function talkPictures(lesson) {
  const out = new Map();
  const add = (key, emoji, label, draw, name) => {
    if (key && emoji && !out.has(key)) out.set(key, { key, emoji, label, draw: draw || label, name: name || cap(key.replace(/-/g, ' ')) });
  };
  for (const t of lesson.turns ?? []) {
    if (t.picture) add(t.pictureKey ?? t.id, t.picture, t.ask, t.draw, t.pictureName);
    if (t.type === 'action') add(t.id, t.emoji, t.ask, t.draw, t.pictureName);
    const choices = t.pool ? POOLS[t.pool] ?? [] : t.choices ?? [];
    for (const c of choices) add(c.id, c.emoji, c.answer, c.draw, c.name);
  }
  return [...out.values()];
}

/** Khóa ảnh của một lựa chọn / lượt (để tìm ảnh bố mẹ đã thêm). */
export const pictureKeyOfTurn = (turn) => turn.pictureKey ?? turn.id;

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
    if (['askBack', 'action'].includes(t.type) && !t.reply) errors.push(`${where}: thiếu "reply".`);
    if (t.type === 'action' && !t.emoji) errors.push(`${where}: lượt động tác thiếu "emoji".`);
    if (t.type === 'choice' && !t.pool && !(Array.isArray(t.choices) && t.choices.length >= 2 && t.choices.every((c) => c.id && c.emoji && c.answer))) {
      errors.push(`${where}: "choices" cần ít nhất 2 lựa chọn có id, emoji, answer.`);
    }
    if (t.pool && !POOLS[t.pool]) errors.push(`${where}: kho lựa chọn "${t.pool}" không có.`);
    if (t.type === 'yesNo' && !(t.yes?.answer && t.no?.answer)) errors.push(`${where}: thiếu "yes" / "no".`);
    if (t.onlyIf && !ids.has(t.onlyIf.turn)) errors.push(`${where}: "onlyIf" phải trỏ tới một lượt phía trước.`);
    if (t.mood && !MOODS.includes(t.mood)) errors.push(`${where}: nét mặt "${t.mood}" không có.`);
    if (t.effect && !EFFECTS.includes(t.effect)) errors.push(`${where}: hiệu ứng "${t.effect}" không có.`);
  }
  return { ok: !errors.length, errors };
}

const choice = (id, emoji, answer, answerVi, extra = {}) => ({ id, emoji, answer, answerVi, keywords: [id], ...extra });
const yesNo = (yes, no) => ({
  yes: { answer: 'Yes, I do!', answerVi: 'Có, con thích!', keywords: ['yes'], ...yes },
  no: { answer: "No, I don't!", answerVi: 'Không, con không thích!', keywords: ['no'], ...no },
});
const action = (id, emoji, ask, askVi, reply, replyVi, effect, extra = {}) => ({ id, type: 'action', emoji, ask, askVi, reply, replyVi, effect, ...extra });
const NOW_ASK = { intro: 'Now you ask me!', introVi: 'Giờ con hỏi Bông nhé!' };

/**
 * 5 bài hội thoại có sẵn (SPEC-talk mục 2 + 13.1): 6–8 lượt có mạch chuyện. `builtin`: mã cố định để tự thêm một lần;
 * mã lượt cũ (hello, name, age, feel, color…) giữ nguyên để không mất sao.
 */
export function builtInTalkLessons() {
  const lessons = [
    {
      builtin: 'talk-hello', title: 'Hello & Goodbye', titleVi: 'Chào hỏi', emoji: '👋',
      turns: [
        { id: 'hello', type: 'greeting', ask: 'Hello, {name}!', askVi: 'Chào {name}!', answer: 'Hello!', answerVi: 'Xin chào!', keywords: ['hello', 'hi'] },
        { id: 'say-hello', type: 'askBack', intro: 'Now you say hello to me!', introVi: 'Giờ con chào Bông nhé!',
          ask: 'Hello, Bông!', askVi: 'Chào Bông!', reply: "Hello! I'm happy to see you!", replyVi: 'Chào con! Bông vui được gặp con!', keywords: ['hello', 'hi'] },
        { id: 'today', type: 'choice', ask: 'How are you today?', askVi: 'Hôm nay con thấy thế nào?',
          choices: [
            choice('happy', '😊', "I'm happy!", 'Con vui!', { reply: "Me too! I'm happy too!", replyVi: 'Bông cũng vui!', mood: 'happy', draw: 'a happy smiling child face' }),
            choice('sleepy', '😴', "I'm sleepy.", 'Con buồn ngủ.', { reply: "Sleepy? Let's stretch! Up, up, up!", replyVi: 'Buồn ngủ à? Mình vươn vai nào!', mood: 'sleep', draw: 'a sleepy yawning child face' }),
            choice('hungry', '😋', "I'm hungry!", 'Con đói!', { reply: "Hungry? Let's eat something yummy soon!", replyVi: 'Đói à? Lát nữa mình ăn món ngon nhé!', mood: 'surprise', draw: 'a hungry child licking lips' }),
          ] },
        { id: 'morning', type: 'choice', ask: 'Is it morning or night?', askVi: 'Bây giờ là buổi sáng hay buổi tối?',
          choices: [
            choice('morning', '☀️', 'Good morning!', 'Chào buổi sáng!', { reply: 'Good morning, sunshine!', replyVi: 'Chào buổi sáng, nắng ơi!', draw: 'a smiling morning sun' }),
            choice('night', '🌙', 'Good night!', 'Chúc ngủ ngon!', { reply: 'Good night! Sweet dreams!', replyVi: 'Chúc ngủ ngon! Mơ đẹp nhé!', mood: 'sleep', draw: 'a sleeping moon with stars' }),
          ] },
        { id: 'play', type: 'yesNo', ask: 'Do you want to play with me?', askVi: 'Con có muốn chơi với Bông không?',
          ...yesNo(
            { answerVi: 'Có, con muốn!', reply: "Yay! Let's play!", replyVi: 'Hoan hô! Mình chơi nào!', mood: 'happy' },
            { answer: 'No, thank you.', answerVi: 'Không ạ, cảm ơn.', keywords: ['no', 'thank'], reply: 'Okay! Maybe later!', replyVi: 'Được rồi! Để lát nữa nhé!', mood: 'surprise' }) },
        action('high-five', '✋', 'Give me a high five!', 'Đập tay với Bông nào!', 'High five! Yay!', 'Đập tay! Hoan hô!', 'clap', { draw: 'a hand giving a high five' }),
        { id: 'goodbye', type: 'greeting', ask: 'Goodbye, {name}!', askVi: 'Tạm biệt {name}!', answer: 'Bye-bye!', answerVi: 'Tạm biệt!', keywords: ['bye', 'goodbye'] },
        action('wave', '👋', 'Wave bye-bye!', 'Vẫy tay tạm biệt nào!', 'Bye-bye! See you tomorrow!', 'Tạm biệt! Mai gặp lại nhé!', 'hearts', { draw: 'a waving hand' }),
      ],
      outro: 'That was fun, {name}!', outroVi: 'Vui quá, {name}!',
    },
    {
      builtin: 'talk-about-me', title: 'About me', titleVi: 'Về bé', emoji: '🙋',
      turns: [
        { id: 'name', type: 'free', ask: "What's your name?", askVi: 'Con tên là gì?',
          answer: 'My name is {name}.', answerVi: 'Con tên là {name}.',
          answerNoProfile: 'Tell me your name!', answerNoProfileVi: 'Con nói tên con nhé!',
          reply: 'Nice to meet you, {name}!', replyVi: 'Rất vui được gặp con, {name}!' },
        { id: 'age', type: 'free', needs: ['age'], ask: 'How old are you?', askVi: 'Con mấy tuổi?',
          answer: "I'm {age}!", answerVi: 'Con {ageNumber} tuổi!', keywords: ['{age}'], reply: 'Wow, {age}!', replyVi: 'Ồ, {ageNumber} tuổi!', mood: 'surprise' },
        action('fingers', '🖐️', 'Show me {age} fingers!', 'Giơ {ageNumber} ngón tay cho Bông xem nào!', '{ageCount} You are {age}!', 'Đếm nào! Con {ageNumber} tuổi!', 'confetti',
          { needs: ['age'], draw: 'a child hand holding up fingers' }),
        { id: 'ask-name', type: 'askBack', ...NOW_ASK,
          ask: "What's your name?", askVi: 'Bạn tên là gì?', reply: 'My name is Bông!', replyVi: 'Mình tên là Bông!', keywords: ['name'] },
        { id: 'ask-age', type: 'askBack', ...NOW_ASK,
          ask: 'How old are you?', askVi: 'Bạn mấy tuổi?', reply: "I'm two! I'm a small bunny!", replyVi: 'Bông 2 tuổi! Bông là thỏ con!', keywords: ['old'] },
        { id: 'fav-color', type: 'choice', ask: "What's your favorite color?", askVi: 'Con thích màu gì nhất?', pool: 'colors', count: 3, remember: 'color',
          rememberReply: 'I know! You like {pick}!', rememberReplyVi: 'Bông biết mà! Con thích màu {pickVi}!' },
        action('high-five', '✋', 'High five, {name}!', 'Đập tay nào, {name}!', 'Yay! You are awesome!', 'Hoan hô! Con giỏi quá!', 'clap', { draw: 'a hand giving a high five' }),
      ],
    },
    {
      builtin: 'talk-feelings', title: 'How are you?', titleVi: 'Con thấy thế nào?', emoji: '😊',
      turns: [
        { id: 'feel', type: 'choice', ask: 'How are you, {name}?', askVi: 'Con thấy thế nào, {name}?',
          choices: [
            choice('happy', '😀', "I'm happy!", 'Con vui!', { reply: "Yay! I'm happy too!", replyVi: 'Hoan hô! Bông cũng vui!', mood: 'happy', draw: 'a happy smiling child face' }),
            choice('sad', '😢', "I'm sad.", 'Con buồn.', { reply: "Oh no! Here's a big hug!", replyVi: 'Ôi! Bông ôm con một cái thật chặt!', mood: 'sad', draw: 'a sad child face with a small tear' }),
            choice('sleepy', '😴', "I'm sleepy.", 'Con buồn ngủ.', { reply: "Sleepy? Let's stretch! Up, up, up!", replyVi: 'Buồn ngủ à? Mình vươn vai nào!', mood: 'sleep', draw: 'a sleepy yawning child face' }),
          ] },
        action('hug', '🤗', 'Give me a hug!', 'Ôm Bông nào!', 'A big hug! Now you feel better!', 'Ôm thật chặt! Con thấy đỡ hơn rồi!', 'hearts',
          { onlyIf: { turn: 'feel', pick: 'sad' }, draw: 'a child and a bunny hugging' }),
        { id: 'ask-feel', type: 'askBack', ...NOW_ASK,
          ask: 'How are you?', askVi: 'Bạn thấy thế nào?', reply: "I'm happy! Thank you!", replyVi: 'Bông vui lắm! Cảm ơn con!', keywords: ['how'] },
        { id: 'hungry', type: 'yesNo', ask: 'Are you hungry?', askVi: 'Con có đói không?',
          yes: { answer: 'Yes, I am!', answerVi: 'Có, con đói!', keywords: ['yes'], reply: "Me too! Let's eat!", replyVi: 'Bông cũng đói! Mình ăn nào!', mood: 'happy' },
          no: { answer: "No, I'm not!", answerVi: 'Không, con không đói!', keywords: ['no'], reply: "Okay! Let's drink some water!", replyVi: 'Được rồi! Mình uống nước nhé!' } },
        { id: 'eat', type: 'choice', ask: 'What do you want to eat?', askVi: 'Con muốn ăn gì?', pool: 'foods', count: 3, remember: 'food',
          onlyIf: { turn: 'hungry', pick: 'yes' },
          rememberReply: 'I know! You like {pick}!', rememberReplyVi: 'Bông biết mà! Con thích {pickVi}!' },
        action('smile', '😁', "Let's smile together!", 'Mình cùng cười nào!', 'What a big smile!', 'Nụ cười thật tươi!', 'confetti', { draw: 'a big happy grin' }),
      ],
    },
    {
      builtin: 'talk-likes', title: 'I like…', titleVi: 'Con thích…', emoji: '❤️',
      turns: [
        { id: 'color', type: 'choice', ask: 'What color do you like?', askVi: 'Con thích màu gì?', pool: 'colors', count: 4, remember: 'color',
          rememberReply: 'I know! You like {pick}!', rememberReplyVi: 'Bông biết mà! Con thích màu {pickVi}!' },
        { id: 'animal', type: 'choice', ask: 'Which animal do you like?', askVi: 'Con thích con vật nào?',
          choices: [
            choice('dog', '🐶', 'I like dogs!', 'Con thích chó!', { reply: 'Woof woof!', replyVi: 'Gâu gâu!', draw: 'a cute puppy' }),
            choice('cat', '🐱', 'I like cats!', 'Con thích mèo!', { reply: 'Meow meow!', replyVi: 'Meo meo!', draw: 'a cute kitten' }),
            choice('bunny', '🐰', 'I like bunnies!', 'Con thích thỏ!', { keywords: ['bunny', 'bunnies', 'rabbit'], reply: 'Like me! Hop, hop, hop!', replyVi: 'Giống Bông! Nhảy, nhảy, nhảy!', mood: 'surprise', draw: 'a cute white bunny' }),
          ] },
        { id: 'apples', type: 'yesNo', ask: 'Do you like apples?', askVi: 'Con có thích táo không?', picture: '🍎', draw: 'a red apple',
          ...yesNo({ reply: 'Apples are yummy!', replyVi: 'Táo ngon lắm!' }, { reply: "That's okay!", replyVi: 'Không sao đâu!' }) },
        { id: 'dogs', type: 'yesNo', ask: 'Do you like dogs?', askVi: 'Con có thích chó không?', picture: '🐶', pictureKey: 'dog',
          ...yesNo({ reply: 'Dogs are so cute!', replyVi: 'Chó dễ thương lắm!' }, { reply: "That's okay!", replyVi: 'Không sao đâu!' }) },
        { id: 'ask-like', type: 'askBack', ...NOW_ASK,
          ask: 'What do you like?', askVi: 'Bạn thích gì?', reply: 'I like carrots! Crunch, crunch!', replyVi: 'Bông thích cà rốt! Rộp rộp!', keywords: ['like'],
          picture: '🥕', pictureKey: 'carrot', draw: 'an orange carrot' },
        { id: 'like-bong', type: 'yesNo', ask: 'Do you like Bông?', askVi: 'Con có thích Bông không?',
          ...yesNo({ reply: 'I like you too!', replyVi: 'Bông cũng thích con!', mood: 'happy' },
            { reply: 'Oh! I still like you!', replyVi: 'Ôi! Bông vẫn thích con!', mood: 'surprise' }) },
        action('heart', '❤️', 'Send me a heart!', 'Gửi Bông một trái tim nào!', 'Thank you! I love it!', 'Cảm ơn con! Bông thích lắm!', 'hearts', { draw: 'a big red heart' }),
      ],
    },
    {
      builtin: 'talk-family', title: 'My family', titleVi: 'Gia đình', emoji: '👨‍👩‍👧',
      turns: [
        ...FAMILY.map((m) => ({
          id: m.id, type: 'free', needs: [`family:${m.id}`], picture: m.emoji, photo: familyPhotoKey(m.id), draw: m.draw, pictureName: m.name,
          ask: 'Who is this?', askVi: 'Đây là ai?',
          answer: `It's ${m.en}!`, answerVi: `Đây là ${m.vi}!`, keywords: [m.en.replace(/^my /, '').toLowerCase()],
          reply: `Yes! ${cap(m.en)}!`, replyVi: `Đúng rồi! ${cap(m.vi)}!`,
        })),
        { id: 'love-mummy', type: 'yesNo', needs: ['family:mummy'], ask: 'Do you love Mummy?', askVi: 'Con có yêu mẹ không?',
          picture: '👩', pictureKey: 'mummy', photo: familyPhotoKey('mummy'),
          ...yesNo({ answerVi: 'Có, con yêu mẹ!', reply: 'Mummy loves you too!', replyVi: 'Mẹ cũng yêu con!', mood: 'happy' },
            { answerVi: 'Không ạ!', reply: 'Mummy loves you very much!', replyVi: 'Mẹ yêu con nhiều lắm!', mood: 'surprise' }) },
        action('kiss-mummy', '😘', 'Give Mummy a kiss!', 'Hôn mẹ một cái nào!', 'Mwah! Mummy is so happy!', 'Chụt! Mẹ vui lắm!', 'hearts',
          { needs: ['family:mummy'], pictureName: 'Kiss for Mother', draw: 'a happy little human child blowing a kiss, with one small red heart floating from the lips' }),
        { id: 'who-bong', type: 'askBack', intro: 'Now point at me and ask!', introVi: 'Giờ con chỉ vào Bông và hỏi nhé!',
          ask: 'Who is this?', askVi: 'Đây là ai?', reply: "It's me, Bông!", replyVi: 'Là Bông đây!', keywords: ['who'], mood: 'happy' },
        action('group-hug', '🤗', 'Family hug!', 'Cả nhà ôm nhau nào!', 'I love your family!', 'Bông yêu gia đình con!', 'hearts', { pictureName: 'Family hug', draw: 'a happy human family hugging together: a mother, a father and one small child' }),
      ],
    },
  ];
  return lessons.map((l) => ({
    version: 2, kind: TALK_KIND, topic: 'Talk', builtinVersion: TALK_BUILTIN_VERSION,
    outro: 'That was fun! See you, {name}!', outroVi: 'Vui quá! Hẹn gặp lại {name}!', ...l,
  }));
}
