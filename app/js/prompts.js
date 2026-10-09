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

/**
 * Prompt tạo bài học.
 * @param {{ topic: string, age?: number, duration?: number, level?: 'beginner'|'some',
 *           style?: 'fun'|'story', reviewWords?: string[], avoidWords?: string[] }} options
 *   avoidWords: các từ bé đã có ở bài khác, để AI không tạo trùng
 */
export function buildLessonPrompt({
  topic,
  age = 3,
  duration = DEFAULT_DURATION,
  level = 'beginner',
  style = 'fun',
  reviewWords = [],
  avoidWords = [],
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
  const avoid = [...new Set(avoidWords.map((w) => w.toLowerCase()))].filter((w) => !reviewSet.has(w)).slice(0, MAX_AVOID_WORDS);
  if (avoid.length) {
    lines.push(`- The child ALREADY LEARNED these words in other lessons. Do NOT use them as new words: ${avoid.join(', ')}.`);
  }

  lines.push(
    '- Every word needs "en", "vi" (Vietnamese meaning), and one "emoji". Do not repeat a word.',
    '- Every sentence has at most 6 words.',
    `- "imagePrompt": always end with this same style: "${IMAGE_STYLE}".`,
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
 * @param {{ words: string[], weakWords?: string[], age?: number }} options
 */
export function buildTeacherPrompt({ words, weakWords = [], age = 3 }) {
  const all = [...new Set([...words, ...weakWords])];
  return [
    `You are a kind, playful English teacher talking with a ${age}-year-old Vietnamese child by voice.`,
    'Speak slowly. Use very short sentences (at most 5 words). Praise the child a lot. Never say "wrong".',
    `Practise only these words: ${all.join(', ')}.`,
    weakWords.length ? `Spend extra time on: ${weakWords.join(', ')}.` : '',
    'Ask one simple question at a time, like "What\'s this?", "What does a cow say?", "Can you say cow?".',
    'If the child answers in Vietnamese or stays quiet, gently say the English word and ask them to repeat.',
    'Keep the whole talk under 10 minutes, then say goodbye happily.',
  ].filter(Boolean).join('\n');
}

/**
 * Prompt nhờ AI vẽ MỘT ảnh lưới cho cả bài (tiết kiệm lượt tạo ảnh miễn phí); app tự cắt ra từng ô.
 * @param {string[]} words theo đúng thứ tự trong bài
 * @param {{ cols: number, rows: number }} shape
 */
export function buildGridImagePrompt(words, { cols, rows }) {
  const cells = cols * rows;
  const list = words.slice(0, cells).map((w, i) => `${i + 1}. ${w}`).join('\n');
  const empty = cells > words.length
    ? `\nThe last ${cells - words.length} cell(s) must stay COMPLETELY EMPTY (plain white, no drawing).`
    : '';
  return [
    `Create ONE ${cols === rows ? 'square ' : ''}image: a grid of exactly ${cols} columns × ${rows} rows = ${cells} EQUAL cells, separated by thin light-gray lines.`,
    'Each cell shows exactly one object, large and centered, in this order (left to right, then top to bottom):',
    list + empty,
    `Style for every cell: ${IMAGE_STYLE}.`,
    'No text, no letters, no numbers, no borders around the image. Keep every object fully inside its own cell.',
  ].join('\n');
}
