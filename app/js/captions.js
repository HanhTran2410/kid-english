// Phụ đề khi bé / bố mẹ chạm 🔊 nghe lại câu hỏi: câu tiếng Anh + câu tiếng Việt (SPEC.md mục 4.4, app 0.8.3).
// Câu hỏi của app theo một số mẫu cố định → dịch theo mẫu; có nghĩa tiếng Việt của từ / câu thì ghép vào.

import { NUMBER_WORDS } from './numbers.js';

const digit = (word) => {
  const i = NUMBER_WORDS.indexOf(String(word).toLowerCase());
  return i > 0 ? String(i) : word;
};

/** "three apples" → "3 apples" (số đếm viết bằng chữ số cho dễ hiểu). */
const withDigits = (text) => String(text).replace(/\b[a-z]+\b/gi, (w) => (NUMBER_WORDS.indexOf(w.toLowerCase()) > 0 ? digit(w) : w));

/**
 * Dịch câu hỏi của app sang tiếng Việt (để bố mẹ hiểu Bông đang hỏi gì).
 * @param {string} en câu Bông hỏi
 * @param {string} [meaning] nghĩa tiếng Việt của từ / câu trong câu hỏi (nếu có)
 * @returns {string} câu tiếng Việt ('' nếu không nhận ra mẫu câu)
 */
export function translateQuestion(en, meaning = '') {
  const s = String(en ?? '').trim();
  const m = meaning ? ` (${meaning})` : '';
  const rules = [
    [/^Your turn! Tap a picture!$/, () => 'Đến lượt bé! Chạm vào một hình để nghe từ đó.'],
    [/^Ten! Your turn! Tap and count!$/, () => 'Mười! Đến lượt bé: chạm vào từng đồ vật còn lại để đếm tiếp.'],
    [/^Your turn! Tap and count!$/, () => 'Đến lượt bé! Chạm vào từng đồ vật để đếm.'],
    [/^Your turn! (.+)!$/, (x) => `Đến lượt bé! Làm theo: "${x}"${m}. Làm xong thì chạm ✔.`],
    [/^Where is the (.+)\?$/, (x) => `"${x}"${m} ở đâu? Bé chạm vào hình đúng.`],
    [/^Which one is: (.+)\?$/, (x) => `Hình nào là "${x}"${m}? Bé chạm vào hình đúng.`],
    [/^Which one is (.+)\?$/, (x) => `Cái nào là "${x}"${m}? Bé chạm vào hình đúng.`],
    [/^Where are (.+)\?$/, (x) => `Nhóm nào có ${withDigits(x)}? Bé chạm vào nhóm đúng.`],
    [/^Find number (\w+)!$/, (x) => `Tìm số ${digit(x)}!`],
    [/^How many (.+)\?$/, (x) => `Có bao nhiêu ${x}? Bé đếm rồi chọn số đúng.`],
    [/^Which one starts with (\w)\?$/, (x) => `Hình nào bắt đầu bằng chữ ${x}?`],
    [/^Which one has (\w)\?$/, (x) => `Hình nào có chữ ${x}?`],
    [/^Big (\w)\. Find the small (\w)!$/, (x) => `Đây là chữ ${x} hoa. Bé tìm chữ ${x.toLowerCase()} thường!`],
    [/^(.+)! Which letter\?$/, (x) => `"${x}" — từ này có chữ cái nào? Bé chọn chữ đúng.`],
    [/^Pop the (\w)!$/, (x) => `Chạm vào quả bóng có chữ ${x}!`],
    [/^Can you say: (.+)\?$/, (x) => `Bé nói theo được không: "${x}"${m}?`],
    [/^(.+)!$/, (x) => `Làm theo: "${x}"${m}. Làm xong thì chạm ✔.`], // lệnh trong trò "Bông says"
  ];
  for (const [re, fn] of rules) {
    const hit = s.match(re);
    if (hit) return fn(hit[1]);
  }
  return meaning ? `Nghĩa: ${meaning}` : '';
}
