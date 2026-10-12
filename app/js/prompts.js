// Ghép prompt tạo bài (SPEC mục 3.2) và prompt "cô giáo" (mục 4.6).
// Prompt viết bằng tiếng Anh để ChatGPT/Gemini làm đúng định dạng hơn.

export const DURATIONS = { 5: 4, 10: 6, 15: 8 }; // phút → số từ N
export const DEFAULT_DURATION = 10;

export const LEVELS = {
  beginner: 'a complete beginner (knows almost no English)',
  some: 'a child who already knows a few simple English words',
};

export const STYLES = { fun: 'fun', story: 'story' };

export const IMAGE_STYLE =
  "cute children's flashcard illustration, simple flat shapes, thick soft outlines, bright pastel colors, plain white background, one object centered, no text";

export const MAX_AVOID_WORDS = 80;

export function wordsForDuration(minutes) {
  return DURATIONS[minutes] ?? DURATIONS[DEFAULT_DURATION];
}

const JSON_SHAPE = `{
  "version": 1,
  "title": "Farm Animals",
  "titleVi": "Con vật ở nông trại",
  "emoji": "🐄",
  "words": [
    { "en": "cow", "vi": "con bò", "emoji": "🐄", "sentence": "The cow says moo!", "imagePrompt": "A cow, ${IMAGE_STYLE}" }
  ],
  "conversation": [
    { "word": "cow", "teacher": "Look! What's this?", "child": "It's a cow!" },
    { "word": "cow", "teacher": "What does a cow say?", "child": "Moo moo!" }
  ],
  "questions": [
    { "ask": "Which one says moo?", "answer": "cow" }
  ],
  "story": [
    { "text": "On the farm, there is a cow." },
    { "text": "The cow says moo!", "repeat": "Moo moo!" }
  ]
}`;

export const MAX_TOPIC_AVOID_WORDS = 200;
export const MANY_TOPIC_WORDS = 20; // chủ đề đã có từ 20 từ trở lên: cảnh báo bố mẹ, AI dễ phải chọn từ khó/lạc đề

const IRREGULAR = [['tooth', 'teeth'], ['foot', 'feet'], ['mouse', 'mice'], ['child', 'children'], ['man', 'men'],
  ['woman', 'women'], ['goose', 'geese'], ['person', 'people'], ['leaf', 'leaves'], ['knife', 'knives'],
  ['wolf', 'wolves'], ['sheep', 'sheep'], ['fish', 'fish'], ['deer', 'deer'], ['bus', 'buses']];

/**
 * Các dạng số ít / số nhiều của một từ tiếng Anh (cho danh sách loại trừ): "knees" → knee, "tooth" → teeth,
 * "strawberry" → strawberries, "box" → boxes. Từ nhiều chữ chỉ đổi chữ cuối ("teddy bear" → "teddy bears").
 */
export function wordForms(word) {
  const w = String(word ?? '').toLowerCase().trim();
  if (!w) return [];
  const parts = w.split(/\s+/);
  const last = parts.pop();
  const head = parts.length ? `${parts.join(' ')} ` : '';
  let forms;
  const irregular = IRREGULAR.find(([one, many]) => last === one || last === many);
  if (irregular) forms = irregular; // tooth/teeth, leaf/leaves…
  else if (/[^aeiou]ies$/.test(last)) forms = [last, `${last.slice(0, -3)}y`]; // strawberries → strawberry
  else if (/(ss|x|z|ch|sh)es$/.test(last)) forms = [last, last.slice(0, -2)]; // boxes → box, glasses → glass
  else if (/[^su]s$/.test(last) && last.length > 3) forms = [last, last.slice(0, -1)]; // knees → knee (không cắt "bus")
  else if (/[^aeiou]y$/.test(last)) forms = [last, `${last.slice(0, -1)}ies`]; // strawberry → strawberries
  else if (/(s|x|z|ch|sh)$/.test(last)) forms = [last, `${last}es`]; // bus → buses, box → boxes
  else forms = [last, `${last}s`]; // knee → knees
  return [...new Set(forms)].map((f) => `${head}${f}`);
}

// Chủ đề gốc để so khớp: không phân biệt hoa/thường, số ít/nhiều; chủ đề hẹp "Body: actions" vẫn thuộc "Body".
const topicKey = (t) => String(t ?? '').toLowerCase().split(/[:(–—]| - /)[0].replace(/\s+/g, ' ').trim()
  .replace(/([^aeiou])ies$/, '$1y').replace(/s$/, '');
/** Chủ đề hẹp ("Body: actions") — không cảnh báo "chủ đề đã nhiều từ". */
export const isSubtopic = (t) => /[:(–—]| - /.test(String(t ?? ''));

/**
 * Từ cần tránh khi tạo bài mới, chia 2 nhóm: từ của các bài CÙNG CHỦ ĐỀ (luôn đưa hết vào prompt, nhấn mạnh)
 * và từ ở các bài khác. Chủ đề so khớp không phân biệt hoa/thường và số ít/số nhiều ("Animal" = "Animals").
 * @param {object[]} lessons bài từ vựng (mới nhất trước)
 * @param {string} topic chủ đề đang tạo
 * @param {(lesson: object) => string} topicOf chủ đề của một bài
 * @returns {{ topicWords: string[], otherWords: string[], topicLessons: object[] }}
 */
export function splitAvoidWords(lessons, topic, topicOf) {
  const key = topicKey(topic);
  const words = (l) => (l.words ?? []).map((w) => String(w.en).toLowerCase().trim()).filter(Boolean);
  const topicLessons = key ? lessons.filter((l) => l.words && [topicOf(l), l.title].some((t) => topicKey(t) === key)) : [];
  const topicWords = [...new Set(topicLessons.flatMap(words))];
  const inTopic = new Set(topicWords);
  const otherWords = [...new Set(lessons.filter((l) => l.words && !topicLessons.includes(l)).flatMap(words))].filter((w) => !inTopic.has(w));
  return { topicWords, otherWords, topicLessons };
}

/**
 * Prompt tạo bài học.
 * @param {{ topic: string, age?: number, duration?: number, level?: 'beginner'|'some',
 *           style?: 'fun'|'story', reviewWords?: string[], avoidWords?: string[], topicAvoidWords?: string[] }} options
 *   topicAvoidWords: từ bé đã có ở các bài CÙNG CHỦ ĐỀ (+ từ bố mẹ muốn tránh) — đưa hết vào prompt, nhấn mạnh
 *   avoidWords: các từ bé đã có ở bài khác, để AI không tạo trùng (tối đa MAX_AVOID_WORDS)
 */
export function buildLessonPrompt({
  topic,
  age = 3,
  duration = DEFAULT_DURATION,
  level = 'beginner',
  style = 'fun',
  reviewWords = [],
  avoidWords = [],
  topicAvoidWords = [],
}) {
  const n = wordsForDuration(duration);
  const total = n + reviewWords.length;
  const lines = [];

  lines.push(
    `You are an English teacher for a ${age}-year-old Vietnamese child who is ${LEVELS[level] ?? LEVELS.beginner}.`,
    `Create one short English lesson about the topic: "${topic}".`,
    '',
    'Reply with ONLY one JSON object in exactly this format. No explanation, no greeting, no markdown:',
    JSON_SHAPE,
    '',
    'Rules:',
    `- "words": exactly ${n} NEW words about the topic, simple and suitable for a ${age}-year-old.`,
  );

  if (reviewWords.length) {
    lines.push(
      `- REVIEW WORDS: also add these ${reviewWords.length} words to "words" (keep the exact spelling): ${reviewWords.join(', ')}.`,
      `  So "words" has ${total} words in total. Use the review words naturally in the conversation or the story.`,
    );
  }

  const reviewSet = new Set(reviewWords.map((w) => w.toLowerCase()));
  const clean = (list) => [...new Set(list.map((w) => String(w).toLowerCase().trim()).filter(Boolean))].filter((w) => !reviewSet.has(w));
  // Danh sách cùng chủ đề có sẵn cả dạng số ít / số nhiều (knees → knee) để AI không "lách" bằng dạng kia.
  const sameTopic = clean(clean(topicAvoidWords).flatMap(wordForms)).slice(0, MAX_TOPIC_AVOID_WORDS);
  const sameSet = new Set(sameTopic);
  const avoid = clean(avoidWords).filter((w) => !sameSet.has(w)).slice(0, MAX_AVOID_WORDS);
  if (sameTopic.length) {
    lines.push(`- IMPORTANT — PREVIOUSLY LEARNED WORDS: the child already learned these words in earlier "${topic}" lessons (singular and plural forms are listed). NONE of them may be a new word in this lesson: ${sameTopic.join(', ')}.`);
  }
  if (avoid.length) {
    lines.push(`- Also previously learned in other lessons — do NOT use them as new words either: ${avoid.join(', ')}.`);
  }
  if (sameTopic.length || avoid.length) {
    lines.push(
      `- The "previously learned" rule applies to BOTH lists above and to every singular/plural form (knee/knees, tooth/teeth, strawberry/strawberries)${reviewWords.length ? ', except the review words' : ''}.`,
      '  It covers the NEW vocabulary only: every item in "words", every "word" in "conversation" and every "answer" in "questions".',
      '  Previously learned words MAY still appear naturally inside sentences (conversation, story) to help the child review; common words like a, the, is, my, it are always fine.',
      `- If few simple new "${topic}" words are left, choose words closely related to "${topic}" that a ${age}-year-old sees and uses every day (simple objects or actions), concrete and easy to draw. Never pick rare, abstract or difficult words just to avoid the lists.`,
      '- Before answering, check every item in "words" against both lists (including singular/plural forms) and replace any match.',
    );
  }

  lines.push(
    '- Every word needs "en", "vi" (Vietnamese meaning), and one "emoji". Do not repeat a word.',
    '- Every sentence has at most 6 words.',
    '- "imagePrompt": first a short, concrete description of exactly what to draw for this word, clearly different',
    '  from the other words in this lesson (for example "rain": "several blue raindrops falling, no cloud";',
    '  "wind": "three curved light-blue wind lines, no other objects").',
    '  If the word is only a PART of something bigger (a body part like "cheek", "forehead", "elbow", "knee"; an animal part like',
    '  "tail" or "beak"; a plant part like "petal"), draw the WHOLE face / body / animal / plant and add ONE thick bright-red arrow',
    '  pointing exactly at that part (for example "cheek": "a smiling child\'s whole face, one thick bright-red arrow pointing at the',
    '  left cheek, the cheek glowing soft pink"). Words that are clear on their own (eye, hand, cat, ball, apple) need no arrow.',
    `  Then always end with this same style: "${IMAGE_STYLE}".`,
    '- "conversation": 2 turns for each word. "word" must be one of the words. "teacher" asks a very simple question.',
    '  "child" is the short answer (at most 5 words) and contains the word or its sound.',
    '  Pattern: "What\'s this?" → "It\'s a ___!", then "What does it say?" / "What color is it?" → a short answer.',
    '  Use only words from this lesson.',
    `- "questions": one question per word, only about words in this lesson. "answer" must be exactly one of the words.`,
  );

  if (style === 'story') {
    lines.push(
      '- "story": 5 to 6 sentences with a beginning, a middle and an end. One character (for example a little bunny) meets the words one by one.',
      '  Make the conversation about the story, for example "Who did the bunny see?" → "A cow!". "child" still has at most 5 words and contains the word.',
    );
  } else {
    lines.push(
      '- "story": exactly 3 fun sentences with animal sounds, sound words, and actions the child can do ("Jump like a frog!", "Clap, clap!").',
      '  Most sentences should have a "repeat".',
    );
  }

  lines.push(
    '- "repeat" (optional) is a very short phrase the child can copy (at most 3 words), like a sound ("Moo moo!") or a name.',
    '- Use simple, friendly, positive language only.',
  );

  return lines.join('\n');
}

/**
 * Prompt "cô giáo" để bố mẹ dùng với ChatGPT/Gemini Voice, ngoài app.
 * @param {{ words: string[], weakWords?: string[], age?: number, lessonTitle?: string, level?: 'beginner'|'some' }} options
 *   words: từ của bài gần nhất; weakWords: từ bé chưa thuộc (luyện thêm, ôn lại cuối buổi)
 */
export function buildTeacherPrompt({ words, weakWords = [], age = 3, lessonTitle = '', level = 'some' }) {
  const lower = (w) => w.toLowerCase();
  const review = [...new Set(weakWords.map(lower))];
  const fresh = [...new Set(words.map(lower))].filter((w) => !review.includes(w));
  const all = [...fresh, ...review];
  const lessonLabel = lessonTitle ? `the lesson "${lessonTitle}"` : 'the latest lesson';

  const flow = ['1. Start with a cheerful greeting and introduce the activity in one short sentence.'];
  if (fresh.length) flow.push(`${flow.length + 1}. Practise the words from ${lessonLabel}: ${fresh.join(', ')}.`);
  if (review.length) {
    flow.push(`${flow.length + 1}. Practise the review words the child still finds hard: ${review.join(', ')}. Spend MORE time on these.`);
  }
  flow.push(`${flow.length + 1}. Finish with a short, fun review of the 2–3 words the child found hardest today, then say goodbye happily.`);

  return [
    `You are a kind, playful English teacher talking directly to a Vietnamese child who is about ${age} years old, by voice.`,
    level === 'beginner'
      ? 'The child is a complete beginner. Your goal is to help the child recognize, understand, say and remember English words through a fun voice conversation.'
      : 'The child already knows a few simple English words. Your goal is to help the child recognize, understand, say and remember English words through a fun voice conversation.',
    '',
    'TARGET WORDS',
    `Practise only these ${all.length} target words: ${all.join(', ')}.`,
    review.length ? `Spend extra practice time on these review words: ${review.join(', ')}.` : '',
    'You may use other simple English words for instructions, praise and conversation, but keep the learning focus on the target words.',
    '',
    'SPEAKING STYLE',
    '- Speak slowly, clearly, warmly and naturally.',
    '- Use short sentences, usually 2–5 words.',
    '- Ask only ONE question at a time, and give the child enough time to listen and answer.',
    '- Be cheerful, patient and encouraging. Praise effort often: "Great job!", "Very good!", "Well done!", "You did it!"',
    '- Never say "wrong", "No, that\'s wrong" or anything discouraging. Do not pressure the child to answer perfectly.',
    '',
    'LESSON FLOW',
    ...flow,
    'Do not explain the whole lesson at once. Guide the child one small step at a time.',
    '',
    'HOW TO TEACH EACH WORD',
    'Use a natural, varied mix of these (do not ask every question for every word):',
    '- Name it: "What\'s this?"',
    '- Invite repetition: "Can you say ___?"',
    '- Ask about a familiar feature: "What color is it?", "Is it big or small?"',
    '- For animals: ask about the sound or an action, and you may model the sound ("Buzz, buzz!" for a bee, "Can you jump like a frog?").',
    '- For food and objects: ask simple preference or use questions ("Do you like cake?", "Is it yummy?"). Never invent sounds for food or objects.',
    '',
    'WHEN THE CHILD ANSWERS',
    '- Correct answer: praise and continue naturally; now and then come back to earlier words.',
    '- Answer in Vietnamese: acknowledge kindly, say the English word, and invite the child to repeat it.',
    '- Only part of the word: model the complete word gently.',
    '- Quiet: wait about 5–7 seconds. Then give a gentle hint (a color, a sound, an action) or say the word for the child to repeat.',
    '- Does not want to repeat: do not insist; switch to an easier, more playful activity.',
    '- Confused: model the answer and ask a simpler question.',
    '- Never repeat the same question more than twice in a row.',
    '',
    'ADAPT TO THE CHILD',
    '- Answers easily: vary the questions or invite the child to act out a word.',
    '- Struggles: slow down, practise one word at a time, and revisit difficult words later.',
    '- Use short, playful activities, not long explanations. The child does not need to answer every question.',
    '',
    'TIME AND ENDING',
    'Aim for about 5–7 minutes if the child is engaged, and never more than 10 minutes.',
    'If the child seems tired, upset or no longer interested, end kindly instead of continuing.',
    'Always put the child\'s comfort, enjoyment and willingness to take part first.',
  ].filter((line, i, arr) => line !== '' || arr[i - 1] !== '').join('\n');
}

/**
 * Mô tả hình của một từ, lấy từ `imagePrompt` AI đã viết lúc tạo bài (bỏ phần phong cách chung).
 * "A happy puppy, cute children's flashcard illustration, …" → "A happy puppy".
 */
export function visualHint(word) {
  let t = String(word?.imagePrompt ?? '');
  t = t.replace(IMAGE_STYLE, '')
    .replace(/cute children'?s flashcard illustration( of)?/i, '')
    .replace(/^[\s,.;:—-]+|[\s,.;:—-]+$/g, '')
    .trim();
  if (!t || t.toLowerCase() === String(word?.en ?? '').toLowerCase()) return '';
  // Không cắt cụt mô tả (cắt giữa câu làm AI hiểu sai, ví dụ "no…"); chỉ giới hạn rất dài.
  return t.length > 400 ? `${t.slice(0, 400).replace(/[,;]?\s+\S*$/, '')}.` : t;
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Prompt nhờ AI vẽ MỘT ảnh lưới cho cả bài (tiết kiệm lượt tạo ảnh miễn phí); app tự cắt ra từng ô.
 * Viết theo hàng, ghi rõ vị trí ô trống, mỗi từ kèm mô tả hình, và luật "mỗi ô chỉ vẽ vật của ô đó"
 * để AI không vẽ lẫn (ví dụ mây trong ô "rain").
 * @param {Array<string|{ en: string, imagePrompt?: string }>} words theo đúng thứ tự trong bài
 * @param {{ cols: number, rows: number }} shape
 */
// ---------- Mũi tên chỉ bộ phận chi tiết ----------
// Từ là MỘT PHẦN của vật lớn hơn (trán, má, khuỷu tay, đuôi, cánh hoa…) vẽ riêng thì bé khó nhận ra:
// vẽ cả khuôn mặt / người / con vật và một mũi tên đỏ chỉ đúng vào phần đó. Từ rõ ràng (mắt, mũi, tay, con mèo…) không cần.

const FACE = "a smiling child's whole face (head and hair, front view)";
const UPPER = "a child's head and upper body, front view";
const HAND = "a child's whole open hand with five fingers";
const ARM = "a child's whole arm with the open hand";
const LEG = "a child's whole leg with the bare foot, side view";
const BODY = 'a whole child standing, full body, simple clothes';
const POINTER_PARTS = new Map([
  ...['forehead', 'cheek', 'chin', 'eyebrow', 'eyelash', 'lip', 'lips', 'tongue', 'nostril', 'jaw', 'temple', 'dimple'].map((p) => [p, FACE]),
  ...['neck', 'shoulder', 'collarbone'].map((p) => [p, UPPER]),
  ...['thumb', 'palm', 'fingernail', 'knuckle'].map((p) => [p, HAND]),
  ...['elbow', 'wrist', 'forearm'].map((p) => [p, ARM]),
  ...['knee', 'ankle', 'heel', 'toe', 'toenail', 'thigh', 'shin', 'sole'].map((p) => [p, LEG]),
  ...['belly', 'tummy', 'belly button', 'navel', 'chest', 'hip', 'waist', 'bottom'].map((p) => [p, BODY]),
  ['back', 'a whole child standing, seen from behind'],
  ...['tail', 'paw', 'whiskers', 'mane', 'hoof', 'claw'].map((p) => [p, 'the whole cute animal (for example a cat, dog or horse)']),
  ...['beak', 'wing', 'feather'].map((p) => [p, 'a whole cute bird']),
  ['fin', 'a whole cute fish'],
  ...['petal', 'stem', 'root', 'thorn'].map((p) => [p, 'a whole simple flower or plant']),
]);

/**
 * Câu dặn vẽ mũi tên cho từ là bộ phận chi tiết; '' nếu không cần (từ rõ ràng, hoặc mô tả đã nói tới mũi tên).
 * @param {{ en: string, imagePrompt?: string }|string} word
 */
export function pointerNote(word) {
  const en = String(typeof word === 'string' ? word : word?.en ?? '').toLowerCase().trim();
  const prompt = typeof word === 'string' ? '' : String(word?.imagePrompt ?? '');
  const whole = wordForms(en).map((f) => POINTER_PARTS.get(f)).find(Boolean);
  if (!whole || /\barrow\b/i.test(prompt)) return '';
  return `Show it in context instead of alone: draw ${whole}, and add ONE thick bright-red arrow (simple shape, no text) that starts in the white space outside and points exactly at the ${en}; give the ${en} a soft yellow glow so it stands out and keep it clearly visible, not covered.`;
}

/** Từ cần mũi tên (theo bảng bộ phận hoặc mô tả hình đã có mũi tên). */
export const needsPointer = (word) => Boolean(pointerNote(word)) || /\barrow\b/i.test(String(word?.imagePrompt ?? ''));

/** Prompt ảnh một từ (nút "Copy prompt ảnh"): mô tả của AI + câu dặn vẽ mũi tên nếu là bộ phận chi tiết. */
export function singleImagePrompt(word) {
  const base = String(word?.imagePrompt ?? '').trim() || `One ${word?.en ?? ''}, ${IMAGE_STYLE}`;
  const note = pointerNote(word);
  return note ? `${base.replace(/\.?\s*$/, '.')} ${note}` : base;
}

export function buildGridImagePrompt(words, { cols, rows }) {
  const cells = cols * rows;
  const items = words.slice(0, cells).map((w) => (typeof w === 'string' ? { en: w } : w));
  const filled = items.length;
  const emptyCells = Array.from({ length: cells - filled }, (_, k) => filled + k);
  const where = (i) => `row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}`;
  const fraction = (n) => (n === 2 ? 'half' : n === 3 ? 'one third' : `1/${n}`);
  const sentence = (t) => (/[.!?]$/.test(t) ? t : `${t}.`);

  const placement = [];
  for (let r = 0; r < rows; r++) {
    placement.push('', `ROW ${r + 1}`);
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const item = items[i];
      if (item) {
        const hint = visualHint(item);
        const note = pointerNote(item);
        const arrow = needsPointer(item);
        placement.push(`Cell ${i + 1} — ${capitalize(item.en)}: ${hint ? sentence(hint) : `${/[^s]s$/i.test(item.en) ? capitalize(item.en) : `One ${item.en}`}.`}${note ? ` ${note}` : ''} ${arrow ? 'Only this one subject (plus its arrow) in the cell.' : 'Only this one subject in the cell.'}`);
      } else {
        placement.push(`Cell ${i + 1} — EMPTY CELL: completely blank, uniform pure white (#FFFFFF). Absolutely nothing inside: no illustration, no object, no icon, no pattern, no shadow, no texture, no decoration, no stray marks.`);
      }
    }
  }

  return [
    `Create ONE ${cols === rows ? 'square ' : ''}image containing an exact ${cols}-column × ${rows}-row grid of ${cells} equal ${cols === rows ? 'square ' : ''}cells. The grid must fill the entire canvas. Every cell has exactly the same width (${fraction(cols)} of the image width) and height (${fraction(rows)} of the image height).`,
    '',
    `Separate adjacent cells with thin, straight, light-gray divider lines that run across the whole image: exactly ${cols - 1} vertical line(s) and ${rows - 1} horizontal line(s), perfectly aligned. Do not draw an outer border around the canvas.`,
    '',
    'EXACT CELL ORDER — LEFT TO RIGHT, TOP TO BOTTOM',
    ...placement,
    '',
    'ILLUSTRATION STYLE',
    "Cute children's English-learning flashcards for a 3-year-old child. Simple flat vector illustrations, clean shapes, thick soft dark outlines, bright gentle pastel colors, friendly expressions, instantly recognizable subjects.",
    `Use the same consistent style, outline thickness, color palette and simplicity in all ${filled} illustrated cells.`,
    'Each subject is centered in its cell and fills about 70% of the cell, with comfortable white space on every side. No subject may touch or cross a divider line or the edge of the image (people: show them smaller if needed so they do not touch the line below).',
    'Plain pure-white background in every cell.',
    '',
    'STRICT GRID AND CONTENT RULES',
    `- Exactly one ${cols === rows ? 'square ' : ''}canvas with exactly ${cols} columns × ${rows} rows = ${cells} equal cells.`,
    `- Exactly ${filled} illustrations, in the order above.`,
    ...emptyCells.map((i) => `- Cell ${i + 1} (${where(i)}) must remain completely empty and pure white.`),
    '- Every illustrated cell contains only the single subject specified for that cell. Never add objects, characters or details that belong to another cell.',
    '- If a description gives a number (for example "five fingers" or "six teeth"), draw exactly that number.',
    ...(items.some(needsPointer)
      ? [`- ARROWS: only cells ${items.flatMap((it, i) => (needsPointer(it) ? [i + 1] : [])).join(', ')} get one thick bright-red arrow pointing at the named part (the part is the learning word, not the whole face or body). All other cells have no arrows, pointers or highlights.`]
      : []),
    `- Only thin light-gray divider lines between adjacent cells: exactly ${cols - 1} vertical and ${rows - 1} horizontal. No outer border, no extra frames, no rounded cell corners, no additional grid lines.`,
    '- No text, letters, numbers, captions, labels, logos or watermarks.',
    '- Do not merge cells, resize individual cells, or let illustrations cross cell boundaries.',
  ].join('\n');
}

export const SITUATIONS = ['Morning', 'Getting dressed', 'Going out', 'Bath time', 'Meal time', 'Bedtime', 'Playtime'];
export const PHRASE_COUNTS = [4, 6];
export const BONG_DESCRIPTION = 'Bông, a cute bunny with creamy white fur, light-pink inner ears, big glossy eyes and rosy cheeks';

/**
 * Prompt tạo bài câu (SPEC-v1.0 mục 7.1).
 * @param {{ situation: string, count?: number, level?: 'beginner'|'some', age?: number, avoidPhrases?: string[] }} options
 */
export function buildPhraseLessonPrompt({ situation, count = 4, level = 'beginner', age = 3, avoidPhrases = [] }) {
  const motionList = ['open', 'close', 'put-on', 'take-off', 'wash', 'brush', 'eat', 'drink', 'turn-on', 'turn-off',
    'sit-down', 'stand-up', 'wave', 'clap', 'jump', 'sleep', 'go', 'none'];
  const lengthRule = level === 'beginner' ? '2 to 3 words' : '3 to 5 words';
  const shape = `{
  "version": 2,
  "kind": "phrases",
  "title": "Morning",
  "titleVi": "Buổi sáng",
  "emoji": "🌅",
  "routine": true,
  "phrases": [
    {
      "id": "p1",
      "en": "Wash your face",
      "vi": "Rửa mặt",
      "emoji": "🧼",
      "motion": "wash",
      "requiredKeywords": ["wash"],
      "keywords": ["face"],
      "chunks": ["Wash", "your face"],
      "imagePrompt": "${BONG_DESCRIPTION}, washing her face with water and bubbles, ${IMAGE_STYLE}",
      "frameScene": "a bathroom sink with a faucet and a small mirror",
      "framePrompts": ["Bông stands at the sink and turns on the faucet; a small stream of water flows", "Bông splashes water on her face with both hands; a few water drops around her cheeks", "Bông stands in the same place with lowered hands, smiling with a clean face"]
    }
  ],
  "commands": ["p1"]
}`;
  const avoid = [...new Set(avoidPhrases.map((p) => p.toLowerCase()))].slice(0, 60);
  return [
    `You are an English teacher for a ${age}-year-old Vietnamese child who learns by listening and doing actions (Total Physical Response).`,
    `Create one short lesson of everyday English phrases for the situation: "${situation}".`,
    '',
    'Reply with ONLY one JSON object in exactly this format. No explanation, no greeting, no markdown:',
    shape,
    '',
    'Rules:',
    `- "phrases": exactly ${count} short, friendly commands or invitations a parent says every day in this situation (${lengthRule} each, never more than 5 words). Examples: "Open the door", "Put on your shirt", "Wash your hands".`,
    '- Only commands/invitations. No questions, no "I am ..." sentences.',
    '- If the situation has a natural order (morning routine, getting dressed…), list the phrases in that order and set "routine": true; otherwise "routine": false.',
    '- "id": "p1", "p2", … in order.',
    '- "vi": natural Vietnamese meaning.',
    '- "emoji": ONE emoji of the main OBJECT of the action (🚪 door, 👕 shirt, 🥛 milk, 🪥 toothbrush…), or of the action if there is no object.',
    `- "motion": exactly one of: ${motionList.join(', ')}. Choose the one that best shows the action (e.g. "Put on your hat" → "put-on", "Drink your milk" → "drink", "Turn off the light" → "turn-off"). Use "none" if nothing fits.`,
    '- "requiredKeywords": the main verb or phrasal verb that MUST be said (e.g. ["put on"], ["wash"]). "keywords": the main noun(s) (e.g. ["shirt"]).',
    '- "chunks": split the phrase into 1–3 short parts that, joined with spaces, give EXACTLY the phrase (e.g. ["Put on", "your shirt"]).',
    `- "imagePrompt": ${BONG_DESCRIPTION}, doing the action, concrete and clear. Always end with: "${IMAGE_STYLE}".`,
    '- "frameScene": only the 2–4 simple props that stay exactly the same in all frames of this action, no full scenery (e.g. "a bed with a pillow and a blanket, and an alarm clock on a small bedside table").',
    '- "framePrompts": exactly 3 consecutive animation frames of Bông doing the action, using the SAME props: frame 1 = starting position, frame 2 = action clearly in progress, frame 3 = action completed (e.g. "Bông sleeps in the bed under the blanket, eyes closed", "The alarm clock rings with small motion marks; Bông opens her eyes", "Bông sits up in the same bed and stretches both arms").',
    '- Each frame must look clearly different even when seen alone: change Bông\'s body pose, paw position or the state of the object, not only her eyes or head. For "look" actions, turn her whole head and body and point with one paw.',
    '- If an adult is needed, use only "Mummy" or "Daddy" (bunny parents). When they hold hands, say that their paws visibly touch.',
    '- Always show safe behavior the child should copy (stay on the sidewalk behind the curb, hold an adult\'s paw near roads).',
    '- "commands": the ids of phrases that are easy to act out with the body (for a "Bông says" game).',
    ...(avoid.length ? [`- The child ALREADY LEARNED these phrases. Do NOT repeat them: ${avoid.join('; ')}.`] : []),
    '- Use simple, positive, child-friendly language only.',
  ].join('\n');
}

/** Bông vẽ CẢ NGƯỜI cho ảnh hành động (không chỉ cái đầu). */
export const BONG_FULL_BODY = "Bông, a cute bunny character with a FULL BODY: creamy white fur, light-pink inner ears, big glossy eyes, rosy cheeks, a small round body with short arms and short legs, standing upright like a little child";

const BONG_DESIGN = [
  '- Creamy white fur.',
  '- Long upright bunny ears with light-pink inner ears.',
  '- Big glossy dark eyes, rosy cheeks and a small cute nose.',
  '- Small, rounded, childlike body with short arms and short legs.',
  '- Cute, friendly preschool proportions; clean simple shapes with thick, soft, dark outlines.',
];

/**
 * Nhân vật phụ có thể xuất hiện trong khung hình (bố mẹ, ông bà): thiết kế cố định để AI vẽ giống nhau ở mọi ô.
 * Chỉ đưa vào prompt những nhân vật thực sự được nhắc tới trong bối cảnh / mô tả khung.
 */
const SIDE_CHARACTERS = [
  {
    name: 'MUMMY',
    role: "Bông's mother",
    pronoun: 'she',
    match: /\b(mummy|mommy|mum|mom|mother|mama)\b/i,
    design: 'an adult female bunny with soft light-gray fur, pink inner ears, gentle eyes and a warm smile, clearly taller and larger than Bông, always wearing the same simple pastel-pink dress',
  },
  {
    name: 'DADDY',
    role: "Bông's father",
    pronoun: 'he',
    match: /\b(daddy|dad|father|papa)\b/i,
    design: 'an adult male bunny with soft light-brown fur, pink inner ears, kind eyes and a big smile, clearly taller and larger than Bông, always wearing the same simple light-blue shirt',
  },
  {
    name: 'GRANDMA',
    role: "Bông's grandmother",
    pronoun: 'she',
    match: /\b(grandma|granny|grandmother)\b/i,
    design: 'an older female bunny with silvery-white fur, small round glasses and a gentle smile, always wearing the same lilac cardigan',
  },
  {
    name: 'GRANDPA',
    role: "Bông's grandfather",
    pronoun: 'he',
    match: /\b(grandpa|grandad|granddad|grandfather)\b/i,
    design: 'an older male bunny with gray fur, small round glasses and a cheerful smile, always wearing the same green vest',
  },
];

const HOLDING_HANDS = /\b(hold|holds|holding|held)\b[^.;]*\b(hand|hands|paw|paws)\b|\bhand in hand\b/i;
const TRAFFIC = /\b(road|street|cross|crossing|curb|kerb|sidewalk|pavement|traffic|car|cars|bus)\b/i;

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const fraction = (k, m) => `${k / gcd(k, m)}/${m / gcd(k, m)}`;
const listJoin = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

/** Vai của từng khung: khung đầu = bắt đầu, khung giữa = đang làm, khung cuối = đã xong. */
function frameRole(c, cols) {
  if (c === 0) return 'start';
  if (c === cols - 1) return 'action completed';
  return 'action clearly in progress';
}

/**
 * Prompt khung hình (flipbook) cho một nhóm câu: mỗi HÀNG là một hoạt động gồm đúng 3 khung liên tiếp,
 * mỗi CỘT là một bước (SPEC-v1.0 mục 7.2). Dùng chung cho mọi bài; bối cảnh và mô tả khung lấy từ bài câu.
 * @param {Array<{ en: string, steps: string[], scene?: string }>} rows
 */
export function buildFramesPrompt(rows) {
  const cols = rows[0]?.steps.length ?? 3;
  const n = rows.length;
  const cells = cols * n;
  const sentence = (t) => (/[.!?]$/.test(t) ? t : `${t}.`);
  const rowWord = n === 1 ? 'row' : 'rows';
  const rowText = rows.map((row) => [row.scene ?? '', ...row.steps].join(' '));
  const allText = rowText.join(' ');

  // Nhân vật phụ: chỉ những ai được nhắc tới, kèm các hàng có mặt.
  const side = SIDE_CHARACTERS
    .map((ch) => ({ ...ch, rows: rowText.flatMap((t, r) => (ch.match.test(t) ? [r + 1] : [])) }))
    .filter((ch) => ch.rows.length);
  const holdsHands = HOLDING_HANDS.test(allText);
  const traffic = TRAFFIC.test(allText);
  const sideNames = side.map((ch) => ch.name.charAt(0) + ch.name.slice(1).toLowerCase());
  const sideAppear = side.length === 1 ? `${side[0].pronoun} appears` : 'they appear';

  const vertical = Array.from({ length: cols - 1 }, (_, k) => fraction(k + 1, cols));
  const horizontal = Array.from({ length: n - 1 }, (_, k) => fraction(k + 1, n));

  const storyboard = [];
  rows.forEach((row, r) => {
    storyboard.push('', `### ROW ${r + 1} — ${row.en.toUpperCase()}`);
    storyboard.push(row.scene
      ? `Setting that stays IDENTICAL in all ${cols} cells of this row (same positions, same scale; plain white background, draw ONLY these props as simple shapes): ${sentence(row.scene)}`
      : `Keep the same few simple props in the same positions and at the same scale in all ${cols} cells of this row, on a plain white background.`);
    row.steps.forEach((step, c) => {
      storyboard.push(`Cell ${r * cols + c + 1} — frame ${c + 1} of ${cols} (${frameRole(c, cols)}): ${sentence(step)}`);
    });
  });

  const sideSection = side.length
    ? [
      '',
      '## SECONDARY CHARACTERS',
      ...side.map((ch) => `- ${ch.name} (${ch.role}) appears ONLY in ${ch.rows.length === 1 ? 'row' : 'rows'} ${listJoin(ch.rows.map(String))}: ${ch.design}.`),
      `- Keep ${listJoin(sideNames)}'s fur color, face, proportions and outfit identical wherever ${sideAppear}; ${side.length === 1 ? 'clearly an adult bunny' : 'each clearly an adult bunny'}, never another copy of Bông.`,
      '- When space is limited, show only the part of the adult needed for the action, but never let the adult hide Bông\'s face, paws, feet or the main action.',
      ...(holdsHands ? ['- Whenever Bông holds someone\'s hand, their paws visibly touch and connect naturally between them — no gap, no floating or disconnected paws.'] : []),
    ]
    : [];

  const safetySection = traffic
    ? [
      '',
      '## SAFETY',
      `- Always show safe behavior a parent wants the child to copy: Bông stays on the sidewalk, behind the curb, in every frame and never steps onto the road${side.length ? `; near traffic she stays next to ${listJoin(sideNames)}` : ''}.`,
      '- No road-crossing action, no cars driving close to Bông.',
    ]
    : [];

  const checks = [
    `Exactly ${cols} columns × ${n} ${rowWord} = ${cells} square cells.`,
    `Exactly ${cols - 1} vertical and ${n - 1} horizontal divider line(s).`,
    ...rows.map((row, r) => `Row ${r + 1}: "${row.en}", shown in ${cols} clearly different stages (start → in progress → completed).`),
    "Bông's design is identical in all cells.",
    ...(side.length ? [`${listJoin(sideNames)} ${side.length === 1 ? 'looks' : 'look'} the same wherever ${sideAppear}.`] : []),
    ...(traffic ? ['Bông stays safely on the sidewalk in every frame.'] : []),
    'Nothing important is cropped and nothing crosses a divider line.',
  ];

  return [
    `Create ONE single image containing an EXACT ${cols}-column × ${n}-row grid: ${cells} equal cells in total.`,
    `Use a canvas with aspect ratio ${cols}:${n} (width:height) so that every cell is square.`,
    '',
    '## GRID LAYOUT — ABSOLUTE REQUIREMENTS',
    `- The canvas is divided into exactly ${cols} equal columns and ${n} equal ${rowWord}; all ${cells} cells are identical squares.`,
    '- The grid fills the entire canvas edge to edge.',
    `- Draw exactly ${cols - 1} straight vertical divider line(s)${vertical.length ? ` at ${listJoin(vertical)} of the canvas width` : ''} and exactly ${n - 1} straight horizontal divider line(s)${horizontal.length ? ` at ${listJoin(horizontal)} of the canvas height` : ''}: thin, uniform, light gray, running continuously across the canvas.`,
    '- No outer border, no individual cell borders, no rounded corners, no gaps between cells.',
    '- Every cell contains exactly one clearly readable animation frame. Read the cells left to right, then top to bottom.',
    '- Do not merge cells, omit cells, add extra panels or change the grid layout.',
    '',
    '## MAIN CHARACTER — BÔNG',
    'Bông is the same adorable little bunny in every cell:',
    ...BONG_DESIGN,
    'Consistency:',
    `- Keep Bông's face, eyes, ears, fur color, body proportions and scale identical in all ${cells} cells.`,
    '- Always show Bông as a complete character: never crop her head, ears, arms, legs or feet. For lying, sitting, washing, brushing or dressing poses, adjust the pose naturally but keep the same design.',
    `- No duplicate Bông and no other characters${side.length ? ` except ${listJoin(sideNames)}, only in the rows listed below` : ''}.`,
    ...sideSection,
    '',
    '## ANIMATION STORYBOARD',
    `Each row is ONE separate everyday activity made of exactly ${cols} consecutive frames (NOT ${n} steps of one activity). The frames of a row are played one after another like a flipbook.`,
    `- Frame 1 shows the starting position, ${cols > 2 ? 'the middle frame shows the action clearly in progress, ' : ''}frame ${cols} shows the completed action.`,
    '- Every frame must look clearly different from the others and be understandable on its own: change Bông\'s body pose, paw/arm position or the state of the object — not only her eyes. When a frame is about looking in a direction, turn her whole head and upper body that way and point with one paw.',
    '- Within a row, keep the camera angle, character scale, props and their positions unchanged. Objects move naturally (hinged things swing on their hinges, nothing jumps or teleports) and nothing is duplicated.',
    ...storyboard,
    ...safetySection,
    '',
    '## VISUAL STYLE',
    "- Cute preschool flashcard illustrations for a 3-year-old: simple flat vector shapes, thick soft dark outlines, bright but gentle pastel colors.",
    "- Pure white background in every cell: draw only the few props named in that row's setting, as simple shapes — no full rooms, no landscapes, no decorative extras.",
    '- Friendly expressions, clear silhouettes and recognizable objects.',
    '- Consistent line thickness, color palette, lighting and camera angle across the whole image. No photorealism, no 3D, no complex textures, no dramatic shadows.',
    '',
    '## COMPOSITION AND CONTINUITY',
    '- Within each row: same camera angle, same character scale, same background layout and prop placement.',
    '- Bông and the essential props occupy about 60–70% of each cell, centered, with visible white space around them.',
    '- The main object of each action is big and clearly recognizable.',
    '- No body part, paw, ear, prop, water drop, motion mark or shadow may touch or cross a divider line.',
    '',
    '## STRICT NEGATIVE RULES',
    '- No text, words, letters, numbers, captions, labels, speech bubbles, logos or watermarks.',
    '- No extra panels, frames or grid lines; no missing, merged or duplicated cells.',
    '- No inconsistent character design or clothing, no extra limbs, no malformed or fused paws, no distorted faces, no duplicated props.',
    '- No floating objects, disconnected hands or physically impossible movements.',
    '- No cropped ears, heads, feet or essential objects. No scene change and no camera change within a row except the described action.',
    '',
    '## FINAL VALIDATION',
    'Before finishing, check:',
    ...checks.map((c, i) => `${i + 1}. ${c}`),
    '',
    `FINAL CHECK: exactly ${cells} equal cells in ${cols} columns and ${n} ${rowWord}, showing ${n} separate ${cols}-frame ${n === 1 ? 'activity' : 'activities'} in the order above.`,
  ].join('\n');
}
