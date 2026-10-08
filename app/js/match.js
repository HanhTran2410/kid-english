// So khớp lỏng câu bé nói (kết quả nhận dạng giọng nói) với từ cần nói.
// Cố ý dễ dãi: máy nghe giọng trẻ em kém, và kết quả chỉ dùng để khen ("Great job!" hay "Good try!").

import { normalizeWord, tokenize } from './text.js';

// Từ không mang nghĩa chính, bỏ qua khi lấy từ khóa trong câu mẫu của bé.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'it', "it's", 'its', 'is', 'are', 'am', 'i', "i'm", 'me', 'my',
  'this', 'that', 'these', 'those', 'yes', 'no', 'and', 'or', 'to', 'of', 'in', 'on',
  'at', 'with', 'he', 'she', 'they', 'we', 'you', 'his', 'her', 'look', 'see', 'say',
  'says', "what's", 'what', 'oh', 'wow',
]);

/** Khóa gần đúng theo cách phát âm: "cow", "kow", "cao" đều thành "ka". */
export function soundKey(word) {
  let w = normalizeWord(word).replace(/[^a-z]/g, '');
  w = w
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/[cq]/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/(.)\1+/g, '$1')
    .replace(/([aeiou])[wy]/g, '$1')
    .replace(/[aeiouy]+/g, 'a')
    .replace(/h/g, '');
  return w;
}

function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/** Hai từ đơn có được coi là giống nhau không. */
export function similarWord(heard, target) {
  const h = normalizeWord(heard);
  const t = normalizeWord(target);
  if (!h || !t) return false;
  if (h === t) return true;
  if (h === `${t}s` || t === `${h}s`) return true;
  const kh = soundKey(h);
  const kt = soundKey(t);
  if (kh && kh === kt) return true;
  const maxDistance = t.length >= 5 ? 2 : 1;
  return levenshtein(h, t) <= maxDistance;
}

/** Câu `heard` có chứa cụm `target` (một hoặc nhiều từ) không. */
function containsPhrase(heardTokens, target) {
  const targetTokens = tokenize(target);
  if (!targetTokens.length) return false;
  if (targetTokens.length === 1) {
    return heardTokens.some((t) => similarWord(t, targetTokens[0]))
      // "icecream" nghe liền ↔ "ice cream"
      || similarWord(heardTokens.join(''), targetTokens[0]);
  }
  for (let i = 0; i + targetTokens.length <= heardTokens.length; i++) {
    if (targetTokens.every((tt, k) => similarWord(heardTokens[i + k], tt))) return true;
  }
  return heardTokens.some((t) => similarWord(t, targetTokens.join('')));
}

/** Các từ khóa cần nghe: từ của lượt + các từ chính trong câu mẫu của bé (SPEC 4.3 B). */
export function keywordsFor(word, childSentence = '') {
  const keys = [];
  if (word) keys.push(normalizeWord(word));
  for (const t of tokenize(childSentence)) {
    if (!STOPWORDS.has(t) && !keys.includes(t)) keys.push(t);
  }
  return keys;
}

/**
 * Bé có nói đúng hoặc gần đúng một trong các từ khóa không.
 * @param {string|string[]} heard một hoặc nhiều phương án nhận dạng
 * @param {string[]} keywords
 */
export function matches(heard, keywords) {
  const alternatives = Array.isArray(heard) ? heard : [heard];
  return alternatives.some((alt) => {
    const tokens = tokenize(alt);
    if (!tokens.length) return false;
    return keywords.some((k) => containsPhrase(tokens, k));
  });
}
