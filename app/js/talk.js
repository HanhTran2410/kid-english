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
export const TALK_BUILTIN_VERSION = 3;

/**
 * Thành viên gia đình có thể chọn trong hồ sơ (Mummy, Daddy mặc định có).
 * name / draw: tên ô và mô tả hình trong prompt ảnh — "Mummy" một mình dễ bị AI vẽ thành xác ướp, nên tên ô là "Mother" và
 * mô tả ghi rõ là mẹ (người), kèm dấu hiệu nhận ra từng người (ông bà tóc bạc, anh chị em là trẻ con). Tên ô ngắn, không
 * ngoặc (tên kiểu "Mother (Mummy)" bị AI viết lên ảnh như chú thích).
 */
export const FAMILY = [
  { id: 'mummy', en: 'Mummy', vi: 'Mẹ', emoji: '👩', name: 'Mother',
    draw: "a smiling young mother — a human woman, the child's mom — with shoulder-length brown hair and a pink top, upper body, waving warmly (a loving mom, not a bandaged Egyptian mummy)" },
  { id: 'daddy', en: 'Daddy', vi: 'Bố', emoji: '👨', name: 'Father',
    draw: "a smiling young father — a human man, the child's dad — with short dark hair and a blue shirt, upper body, waving warmly" },
  { id: 'grandma', en: 'Grandma', vi: 'Bà', emoji: '👵', name: 'Grandmother',
    draw: 'a smiling grandmother — an older human woman — with gray hair in a bun and round glasses, upper body' },
  { id: 'grandpa', en: 'Grandpa', vi: 'Ông', emoji: '👴', name: 'Grandfather',
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
 * 13 bài hội thoại có sẵn: 5 bài đầu (SPEC-talk mục 2 + 13.1, chủ đề Talk) + 8 bài theo chủ đề (SPEC-talk-topics.md): 6–8 lượt có mạch chuyện. `builtin`: mã cố định để tự thêm một lần;
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
    // ---------- Chủ đề mới (SPEC-talk-topics.md): Every day · Out & about · Play · Manners ----------
    {
      builtin: 'talk-meal', title: 'Mealtime', titleVi: 'Giờ ăn', emoji: '🍽️', topic: 'Every day', topicEmoji: '🏠',
      turns: [
        action('wash-hands', '🧼', 'Wash your hands first!', 'Rửa tay trước đã nào!', 'Scrub, scrub! Clean hands!', 'Kì cọ, kì cọ! Tay sạch rồi!', 'clap', { draw: 'two small hands washing with soap bubbles' }),
        { id: 'hungry', type: 'yesNo', ask: 'Are you hungry?', askVi: 'Con có đói không?',
          yes: { answer: 'Yes, I am!', answerVi: 'Có, con đói!', keywords: ['yes'], reply: "Let's eat!", replyVi: 'Mình ăn nào!', mood: 'happy' },
          no: { answer: "No, I'm not!", answerVi: 'Không, con không đói!', keywords: ['no'], reply: "Okay! Let's eat when you're ready.", replyVi: 'Được rồi! Khi nào con muốn thì mình ăn nhé.' } },
        { id: 'eat', type: 'choice', ask: 'What do you want to eat?', askVi: 'Con muốn ăn gì?', pool: 'foods', count: 3, remember: 'food',
          rememberReply: 'I know! You like {pick}!', rememberReplyVi: 'Bông biết mà! Con thích {pickVi}!' },
        { id: 'yummy', type: 'free', ask: 'Is it yummy?', askVi: 'Có ngon không con?', answer: 'Yummy, yummy!', answerVi: 'Ngon, ngon lắm!', keywords: ['yummy'],
          reply: 'Yummy in my tummy!', replyVi: 'Ngon ơi là ngon!', mood: 'happy' },
        { id: 'more', type: 'yesNo', ask: 'Do you want more?', askVi: 'Con có muốn ăn thêm không?',
          yes: { answer: 'More, please!', answerVi: 'Cho con thêm ạ!', keywords: ['more', 'please', 'yes'], reply: 'Here you are!', replyVi: 'Của con đây!', mood: 'happy' },
          no: { answer: 'All done!', answerVi: 'Con ăn xong rồi!', keywords: ['done', 'no'], reply: 'Okay! All done!', replyVi: 'Được rồi! Ăn xong rồi!' } },
        { id: 'ask-hungry', type: 'askBack', ...NOW_ASK, ask: 'Are you hungry?', askVi: 'Bạn có đói không?',
          reply: 'Yes! I want a carrot! Crunch, crunch!', replyVi: 'Có! Bông muốn ăn cà rốt! Rộp rộp!', keywords: ['hungry'],
          picture: '🥕', pictureKey: 'carrot', draw: 'an orange carrot' },
        action('tummy', '😋', 'Rub your tummy!', 'Xoa bụng nào!', 'Mmm! Full tummy!', 'Ừm! No bụng rồi!', 'hearts', { draw: 'a happy child rubbing a full tummy' }),
      ],
    },
    {
      builtin: 'talk-bath', title: 'Bath time', titleVi: 'Tắm & đánh răng', emoji: '🛁', topic: 'Every day', topicEmoji: '🏠',
      turns: [
        { id: 'bath', type: 'yesNo', ask: 'Is it bath time?', askVi: 'Đến giờ tắm chưa nhỉ?', picture: '🛁', draw: 'a bathtub full of bubbles',
          yes: { answer: 'Yes!', answerVi: 'Rồi ạ!', keywords: ['yes'], reply: 'Yay! Splash time!', replyVi: 'Hoan hô! Té nước nào!', mood: 'happy' },
          no: { answer: 'Not yet!', answerVi: 'Chưa ạ!', keywords: ['not', 'no'], reply: "Okay! Let's brush our teeth first!", replyVi: 'Được rồi! Mình đánh răng trước nhé!' } },
        { id: 'in-bath', type: 'choice', ask: "What's in the bath?", askVi: 'Trong bồn tắm có gì nhỉ?',
          choices: [
            choice('duck', '🦆', 'A duck!', 'Con vịt!', { reply: 'Quack, quack!', replyVi: 'Cạp cạp!', draw: 'a yellow rubber duck' }),
            choice('boat', '⛵', 'A boat!', 'Cái thuyền!', { reply: 'Toot, toot!', replyVi: 'Tu tu!', draw: 'a small toy boat' }),
            choice('bubbles', '🫧', 'Bubbles!', 'Bong bóng!', { keywords: ['bubble', 'bubbles'], reply: 'Pop, pop, pop!', replyVi: 'Bụp, bụp, bụp!', mood: 'surprise', draw: 'soap bubbles' }),
          ] },
        action('splash', '💦', 'Splash, splash!', 'Té nước nào!', 'Wow! Big splash!', 'Ồ! Té nước to quá!', 'confetti', { draw: 'water splashing' }),
        { id: 'hair', type: 'free', ask: 'Wash your hair. Rub, rub!', askVi: 'Gội đầu nào. Xoa, xoa!', answer: 'Rub, rub!', answerVi: 'Xoa, xoa!', keywords: ['rub'],
          reply: 'So clean!', replyVi: 'Sạch quá!', mood: 'happy' },
        action('brush', '🪥', 'Brush your teeth! Brush, brush, brush!', 'Đánh răng nào! Chải, chải, chải!', 'Shiny teeth!', 'Răng sáng bóng!', 'confetti', { draw: 'a toothbrush with toothpaste' }),
        { id: 'ask-brush', type: 'askBack', ...NOW_ASK, ask: 'Did you brush your teeth?', askVi: 'Bạn đánh răng chưa?',
          reply: 'Yes! Look! So shiny!', replyVi: 'Rồi! Nhìn này! Sáng bóng!', keywords: ['brush', 'teeth'], mood: 'happy' },
        action('smile', '😁', 'Show me your smile!', 'Cười cho Bông xem nào!', 'What a clean smile!', 'Nụ cười sạch quá!', 'hearts', { draw: 'a big smile with clean white teeth' }),
      ],
    },
    {
      builtin: 'talk-bed', title: 'Bedtime', titleVi: 'Đi ngủ', emoji: '🌙', topic: 'Every day', topicEmoji: '🏠',
      outro: 'Sweet dreams, {name}!', outroVi: 'Chúc {name} ngủ ngon!',
      turns: [
        { id: 'sleepy', type: 'yesNo', ask: 'Are you sleepy?', askVi: 'Con buồn ngủ chưa?',
          yes: { answer: 'Yes, I am.', answerVi: 'Con buồn ngủ rồi.', keywords: ['yes'], reply: "Let's get ready for bed.", replyVi: 'Mình chuẩn bị đi ngủ nhé.', mood: 'sleep' },
          no: { answer: "No, I'm not!", answerVi: 'Con chưa buồn ngủ!', keywords: ['no'], reply: 'Okay! One more story!', replyVi: 'Được rồi! Thêm một câu chuyện nữa nhé!' } },
        action('pajamas', '👕', 'Put on your pajamas!', 'Mặc đồ ngủ nào!', 'Cozy pajamas!', 'Đồ ngủ êm quá!', 'clap', { draw: 'cozy children pajamas' }),
        { id: 'sleep-with', type: 'choice', ask: 'What do you sleep with?', askVi: 'Con ngủ với gì?',
          choices: [
            choice('teddy', '🧸', 'My teddy!', 'Gấu bông của con!', { reply: 'Hello, teddy!', replyVi: 'Chào gấu bông!', draw: 'a brown teddy bear' }),
            choice('bunny', '🐰', 'My bunny!', 'Thỏ bông của con!', { reply: 'Like me!', replyVi: 'Giống Bông!', mood: 'surprise', draw: 'a soft toy bunny' }),
            choice('blanket', '🛏️', 'My blanket!', 'Cái chăn của con!', { reply: 'So warm!', replyVi: 'Ấm quá!', draw: 'a soft folded blanket' }),
          ] },
        { id: 'story', type: 'choice', ask: 'Which story?', askVi: 'Con muốn nghe chuyện nào?',
          choices: [
            choice('bear', '🐻', 'The bear story!', 'Chuyện con gấu!', { reply: 'Once upon a time, a big brown bear…', replyVi: 'Ngày xửa ngày xưa, có một chú gấu nâu to…', draw: 'a friendly brown bear' }),
            choice('rocket', '🚀', 'The rocket story!', 'Chuyện tên lửa!', { reply: 'Once upon a time, a rocket flew to the moon…', replyVi: 'Ngày xửa ngày xưa, có một tên lửa bay lên mặt trăng…', draw: 'a rocket flying to the moon' }),
            choice('fish', '🐟', 'The fish story!', 'Chuyện con cá!', { reply: 'Once upon a time, a little fish…', replyVi: 'Ngày xửa ngày xưa, có một chú cá nhỏ…', draw: 'a little blue fish' }),
          ] },
        action('yawn', '🥱', 'Big yawn! Aaah!', 'Ngáp thật to nào! A…', 'Sleepy, sleepy…', 'Buồn ngủ, buồn ngủ…', 'hearts', { mood: 'sleep', draw: 'a sleepy child yawning' }),
        { id: 'good-night', type: 'greeting', ask: 'Good night, {name}!', askVi: 'Chúc {name} ngủ ngon!', answer: 'Good night!', answerVi: 'Chúc ngủ ngon!', keywords: ['night'] },
        { id: 'night-bong', type: 'askBack', intro: 'Now you say good night to me!', introVi: 'Giờ con chúc Bông ngủ ngon nhé!',
          ask: 'Good night, Bông!', askVi: 'Chúc Bông ngủ ngon!', reply: 'Good night! Sweet dreams!', replyVi: 'Chúc ngủ ngon! Mơ đẹp nhé!', keywords: ['night'], mood: 'sleep' },
        action('close-eyes', '😴', 'Close your eyes. Shh…', 'Nhắm mắt lại nào. Suỵt…', 'Sleep tight!', 'Ngủ ngon nhé!', 'hearts', { mood: 'sleep', draw: 'a child sleeping in bed under the moon' }),
      ],
    },
    {
      builtin: 'talk-park', title: 'At the park', titleVi: 'Công viên', emoji: '🛝', topic: 'Out & about', topicEmoji: '🌳',
      turns: [
        { id: 'go-park', type: 'yesNo', ask: 'Do you want to go to the park?', askVi: 'Con có muốn đi công viên không?',
          yes: { answer: "Yes! Let's go!", answerVi: 'Có! Đi thôi!', keywords: ['yes', 'go'], reply: "Yay! Let's go!", replyVi: 'Hoan hô! Đi thôi!', mood: 'happy' },
          no: { answer: 'No, thank you.', answerVi: 'Không ạ, cảm ơn.', keywords: ['no', 'thank'], reply: "Okay! Maybe next time! Let's pretend!", replyVi: 'Được rồi! Lần sau nhé! Mình chơi giả vờ nào!' } },
        action('shoes', '👟', 'Put on your shoes!', 'Đi giày vào nào!', "Ready! Let's go!", 'Xong rồi! Đi thôi!', 'clap', { draw: 'a pair of small sneakers' }),
        { id: 'play-what', type: 'choice', ask: 'What do you want to play?', askVi: 'Con muốn chơi gì?',
          choices: [
            choice('slide', '🛝', 'The slide!', 'Cầu trượt!', { reply: 'Whee! Down we go!', replyVi: 'Uiii! Trượt xuống nào!', mood: 'happy', draw: 'a playground slide' }),
            choice('swing', '🎠', 'The swing!', 'Xích đu!', { reply: 'Up and down! Up and down!', replyVi: 'Lên rồi xuống! Lên rồi xuống!', draw: 'a playground swing' }),
            choice('ball', '⚽', 'The ball!', 'Quả bóng!', { reply: 'Kick! Goal!', replyVi: 'Sút! Vào rồi!', mood: 'surprise', draw: 'a soccer ball' }),
          ] },
        action('run', '🏃', 'Run, run, run!', 'Chạy, chạy, chạy!', 'You are so fast!', 'Con chạy nhanh quá!', 'confetti', { draw: 'a child running happily' }),
        { id: 'wait', type: 'askBack', intro: 'Bông is too slow! Say it!', introVi: 'Bông chậm quá! Con gọi Bông đi!',
          ask: 'Wait for me!', askVi: 'Chờ con với!', reply: "Okay! I'm waiting for you!", replyVi: 'Được rồi! Bông chờ con đây!', keywords: ['wait'], mood: 'surprise' },
        { id: 'see', type: 'choice', ask: 'What can you see?', askVi: 'Con nhìn thấy gì?',
          choices: [
            choice('bird', '🐦', 'A bird!', 'Con chim!', { reply: 'Tweet, tweet!', replyVi: 'Chíp chíp!', draw: 'a little bird' }),
            choice('dog', '🐶', 'A dog!', 'Con chó!', { reply: 'Woof, woof!', replyVi: 'Gâu gâu!', draw: 'a cute puppy' }),
            choice('flower', '🌸', 'A flower!', 'Bông hoa!', { reply: 'So pretty!', replyVi: 'Đẹp quá!', mood: 'happy', draw: 'a pink flower' }),
          ] },
        action('bye-park', '👋', 'Time to go home! Wave bye-bye to the park!', 'Về nhà thôi! Vẫy tay tạm biệt công viên nào!', 'Bye-bye, park! See you soon!', 'Tạm biệt công viên! Hẹn gặp lại!', 'hearts', { draw: 'a waving hand' }),
      ],
    },
    {
      builtin: 'talk-weather', title: 'Weather', titleVi: 'Thời tiết', emoji: '☀️', topic: 'Out & about', topicEmoji: '🌳',
      turns: [
        { id: 'weather', type: 'choice', ask: "What's the weather like today?", askVi: 'Hôm nay trời thế nào?',
          choices: [
            choice('sunny', '☀️', "It's sunny!", 'Trời nắng!', { reply: "Sunny! Let's put on a hat!", replyVi: 'Trời nắng! Mình đội mũ nhé!', mood: 'happy', draw: 'a bright smiling sun' }),
            choice('rainy', '🌧️', "It's rainy!", 'Trời mưa!', { keywords: ['rain', 'rainy'], reply: "Rainy! Let's get an umbrella!", replyVi: 'Trời mưa! Mình lấy ô nhé!', draw: 'a rain cloud with raindrops' }),
            choice('cold', '🥶', "It's cold!", 'Trời lạnh!', { reply: "Brr! Let's put on a coat!", replyVi: 'Brr! Mình mặc áo khoác nhé!', mood: 'surprise', draw: 'a snowy cold day with a snowflake' }),
          ] },
        { id: 'need', type: 'choice', ask: 'What do you need?', askVi: 'Con cần gì nào?',
          choices: [
            choice('hat', '🧢', 'My hat!', 'Mũ của con!', { reply: "Here's your hat!", replyVi: 'Mũ của con đây!', draw: 'a child sun hat' }),
            choice('umbrella', '☂️', 'My umbrella!', 'Ô của con!', { reply: "Here's your umbrella!", replyVi: 'Ô của con đây!', draw: 'an open umbrella' }),
            choice('coat', '🧥', 'My coat!', 'Áo khoác của con!', { reply: "Here's your coat!", replyVi: 'Áo khoác của con đây!', draw: 'a warm winter coat' }),
          ] },
        action('make-rain', '🌧️', 'Make the rain! Pitter-patter!', 'Làm mưa nào! Tí tách!', 'Pitter-patter, pitter-patter!', 'Tí tách, tí tách!', 'confetti', { draw: 'raindrops falling from a cloud' }),
        { id: 'like-rain', type: 'yesNo', ask: 'Do you like the rain?', askVi: 'Con có thích mưa không?', picture: '☔', draw: 'an umbrella in the rain',
          ...yesNo({ reply: 'Me too! Splash in the puddles!', replyVi: 'Bông cũng thích! Nhảy vũng nước nào!', mood: 'happy' },
            { reply: "That's okay! Let's stay inside!", replyVi: 'Không sao! Mình ở trong nhà nhé!' }) },
        { id: 'ask-sun', type: 'askBack', ...NOW_ASK, ask: 'Do you like the sun?', askVi: 'Bạn có thích mặt trời không?',
          reply: "Yes! I like the sun! It's warm!", replyVi: 'Có! Bông thích mặt trời! Ấm lắm!', keywords: ['sun'], mood: 'happy' },
        action('rainbow', '🌈', 'Look! A rainbow! Say wow!', 'Nhìn kìa! Cầu vồng! Nói "wow" nào!', 'Wow! So pretty!', 'Ồ! Đẹp quá!', 'confetti', { draw: 'a colorful rainbow' }),
        { id: 'hello-sun', type: 'free', ask: 'Bye-bye, rain! Hello, sun!', askVi: 'Tạm biệt mưa! Chào mặt trời!', answer: 'Hello, sun!', answerVi: 'Chào mặt trời!', keywords: ['hello', 'sun'],
          reply: 'The sun says hello!', replyVi: 'Mặt trời chào con đấy!', mood: 'happy' },
      ],
    },
    {
      builtin: 'talk-toys', title: 'My toys', titleVi: 'Đồ chơi', emoji: '🧸', topic: 'Play', topicEmoji: '🧸',
      turns: [
        { id: 'ball', type: 'free', ask: "What's this?", askVi: 'Đây là gì?', picture: '⚽', draw: 'a colorful ball',
          answer: "It's a ball!", answerVi: 'Đây là quả bóng!', keywords: ['ball'], reply: 'Yes! A ball! Bounce, bounce!', replyVi: 'Đúng rồi! Quả bóng! Nảy, nảy!' },
        { id: 'car', type: 'free', ask: "What's this?", askVi: 'Đây là gì?', picture: '🚗', draw: 'a red toy car',
          answer: "It's a car!", answerVi: 'Đây là ô tô!', keywords: ['car'], reply: 'Beep, beep!', replyVi: 'Bim bim!', mood: 'surprise' },
        { id: 'play-with', type: 'choice', ask: 'What do you want to play with?', askVi: 'Con muốn chơi gì?',
          choices: [
            choice('teddy', '🧸', 'My teddy!', 'Gấu bông!', { reply: 'Big hug, teddy!', replyVi: 'Ôm gấu bông thật chặt!', draw: 'a brown teddy bear' }),
            choice('blocks', '🧱', 'My blocks!', 'Đồ xếp hình!', { keywords: ['block', 'blocks'], reply: 'Build it up! Tall, tall!', replyVi: 'Xếp lên nào! Cao, cao!', draw: 'a stack of colorful toy blocks' }),
            choice('train', '🚂', 'My train!', 'Tàu hỏa!', { reply: 'Choo-choo!', replyVi: 'Xình xịch!', mood: 'happy', draw: 'a toy train' }),
          ] },
        { id: 'ask-play', type: 'askBack', ...NOW_ASK, ask: 'Can I play too?', askVi: 'Mình chơi cùng được không?',
          reply: "Yes! Let's play together!", replyVi: 'Được chứ! Mình chơi cùng nhau nhé!', keywords: ['play'], mood: 'happy' },
        { id: 'turn', type: 'yesNo', ask: 'Can I have a turn?', askVi: 'Cho Bông chơi một lượt được không?',
          yes: { answer: 'Yes, here you are!', answerVi: 'Được, của Bông đây!', keywords: ['yes', 'here'], reply: 'Thank you! You are so kind!', replyVi: 'Cảm ơn con! Con tốt quá!', mood: 'happy' },
          no: { answer: 'Not now!', answerVi: 'Chưa được!', keywords: ['not', 'no'], reply: 'Okay! I can wait!', replyVi: 'Được rồi! Bông chờ được!' } },
        { id: 'my-turn', type: 'greeting', ask: "I had a turn. Now it's your turn!", askVi: 'Bông chơi rồi. Giờ đến lượt con!', answer: 'My turn!', answerVi: 'Đến lượt con!', keywords: ['turn'] },
        action('tidy', '🧺', 'Tidy up time! Put the toys away!', 'Dọn đồ chơi nào! Cất đồ chơi đi!', 'All clean! Good job!', 'Sạch rồi! Giỏi quá!', 'clap', { draw: 'a basket full of toys' }),
      ],
    },
    {
      builtin: 'talk-hide', title: 'Hide and seek', titleVi: 'Trốn tìm', emoji: '🙈', topic: 'Play', topicEmoji: '🧸',
      turns: [
        { id: 'play-hide', type: 'yesNo', ask: "Let's play hide and seek! Okay?", askVi: 'Mình chơi trốn tìm nhé! Được không?',
          yes: { answer: 'Okay!', answerVi: 'Được ạ!', keywords: ['okay', 'yes'], reply: 'Yay!', replyVi: 'Hoan hô!', mood: 'happy' },
          no: { answer: 'No, thank you.', answerVi: 'Không ạ, cảm ơn.', keywords: ['no', 'thank'], reply: "Okay! Maybe next time! Let's pretend!", replyVi: 'Được rồi! Lần sau nhé! Mình chơi giả vờ nào!' } },
        action('count', '🙈', 'Close your eyes and count! One, two, three!', 'Nhắm mắt lại và đếm nào! Một, hai, ba!', 'Ready or not, here I come!', 'Xong chưa? Bông đến đây!', 'confetti', { draw: 'a child covering eyes with hands' }),
        { id: 'where-bong', type: 'askBack', intro: 'Now you call me!', introVi: 'Giờ con gọi Bông đi!',
          ask: 'Where are you, Bông?', askVi: 'Bông ở đâu?', reply: "I'm here! Can you find me?", replyVi: 'Bông ở đây! Con tìm thấy Bông không?', keywords: ['where'] },
        { id: 'where-am-i', type: 'choice', ask: 'Where am I?', askVi: 'Bông ở đâu nhỉ?',
          choices: [
            choice('bed', '🛏️', 'Under the bed!', 'Dưới gầm giường!', { keywords: ['bed', 'under'], reply: 'Peekaboo! I was under the bed!', replyVi: 'Ú òa! Bông nấp dưới gầm giường!', mood: 'surprise', draw: 'a white bunny hiding under a bed' }),
            choice('box', '📦', 'In the box!', 'Trong hộp!', { keywords: ['box'], reply: 'Peekaboo! I was in the box!', replyVi: 'Ú òa! Bông nấp trong hộp!', mood: 'surprise', draw: 'a white bunny peeking out of a cardboard box' }),
            choice('tree', '🌳', 'Behind the tree!', 'Sau cái cây!', { keywords: ['tree', 'behind'], reply: 'Peekaboo! I was behind the tree!', replyVi: 'Ú òa! Bông nấp sau cái cây!', mood: 'surprise', draw: 'a white bunny hiding behind a tree' }),
          ] },
        { id: 'peekaboo', type: 'greeting', ask: 'Peekaboo!', askVi: 'Ú òa!', answer: 'Peekaboo!', answerVi: 'Ú òa!', keywords: ['peekaboo', 'boo'] },
        action('your-turn-hide', '🫣', 'Your turn to hide! Cover your eyes!', 'Đến lượt con trốn! Che mắt lại nào!', 'Where is {name}? … There you are!', '{name} đâu rồi? … A, đây rồi!', 'hearts',
          { replyNoProfile: 'Where are you? … There you are!', replyViNoProfile: 'Con đâu rồi? … A, đây rồi!', draw: 'a child peeking between fingers' }),
        { id: 'again', type: 'yesNo', ask: 'Do you want to play again?', askVi: 'Con có muốn chơi nữa không?',
          yes: { answer: 'Yes, again!', answerVi: 'Có, chơi nữa!', keywords: ['yes', 'again'], reply: 'Yay! Next time, okay?', replyVi: 'Hoan hô! Lần sau chơi tiếp nhé?', mood: 'happy' },
          no: { answer: 'No, thank you.', answerVi: 'Không ạ, cảm ơn.', keywords: ['no', 'thank'], reply: 'Okay! That was fun!', replyVi: 'Được rồi! Vui quá!' } },
      ],
    },
    {
      builtin: 'talk-manners', title: 'Please & thank you', titleVi: 'Lễ phép', emoji: '🙏', topic: 'Manners', topicEmoji: '🙏',
      turns: [
        { id: 'want', type: 'choice', ask: 'What do you want?', askVi: 'Con muốn gì nào?', pool: 'foods', count: 3, remember: 'food',
          reply: 'Good asking! You said please!', replyVi: 'Con xin giỏi quá! Con nói "please" rồi!',
          rememberReply: 'I know! You like {pick}!', rememberReplyVi: 'Bông biết mà! Con thích {pickVi}!' },
        { id: 'thank-you', type: 'free', ask: 'Here you are!', askVi: 'Của con đây!', answer: 'Thank you!', answerVi: 'Con cảm ơn!', keywords: ['thank'],
          reply: "You're welcome!", replyVi: 'Không có gì!', mood: 'happy' },
        { id: 'help-carrot', type: 'yesNo', ask: 'Oops! I dropped my carrot. Can you help me?', askVi: 'Ối! Bông làm rơi cà rốt. Con giúp Bông được không?',
          picture: '🥕', pictureKey: 'carrot', draw: 'an orange carrot',
          yes: { answer: 'Yes, I can!', answerVi: 'Được ạ!', keywords: ['yes', 'can'], reply: 'Thank you! You are so kind!', replyVi: 'Cảm ơn con! Con tốt quá!', mood: 'happy' },
          no: { answer: 'Not now.', answerVi: 'Chưa được ạ.', keywords: ['not', 'no'], reply: "That's okay. I can do it!", replyVi: 'Không sao. Bông tự nhặt được!' } },
        { id: 'help-me', type: 'askBack', intro: 'Now you ask Bông for help!', introVi: 'Giờ con nhờ Bông giúp nhé!',
          ask: 'Help me, please!', askVi: 'Bông giúp con với!', reply: 'Of course! I can help you!', replyVi: 'Tất nhiên rồi! Bông giúp con!', keywords: ['help'], mood: 'happy' },
        { id: 'sorry', type: 'free', ask: "Oh! I bumped you. I'm sorry!", askVi: 'Ôi! Bông va vào con. Bông xin lỗi!', answer: "That's okay!", answerVi: 'Không sao đâu!', keywords: ['okay'],
          reply: 'Thank you! Friends?', replyVi: 'Cảm ơn con! Mình vẫn là bạn nhé?', mood: 'happy' },
        { id: 'ask-cookie', type: 'askBack', ...NOW_ASK, ask: 'Can I have a cookie, please?', askVi: 'Cho con một cái bánh quy được không ạ?',
          reply: 'Yes! Here you are!', replyVi: 'Được chứ! Của con đây!', keywords: ['cookie', 'please'], picture: '🍪', pictureKey: 'cookie', draw: 'a round chocolate chip cookie' },
        action('say-thanks', '🙏', "Let's say thank you! Hands together!", 'Mình khoanh tay cảm ơn nào!', "Thank you! You're welcome!", 'Cảm ơn! Không có gì!', 'hearts', { draw: 'two small hands pressed together saying thank you' }),
      ],
    },
  ];
  return lessons.map((l) => ({
    version: 2, kind: TALK_KIND, topic: 'Talk', builtinVersion: TALK_BUILTIN_VERSION,
    outro: 'That was fun! See you, {name}!', outroVi: 'Vui quá! Hẹn gặp lại {name}!', ...l,
  }));
}
