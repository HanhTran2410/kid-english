// Hàm xử lý chữ và ngày dùng chung. Không phụ thuộc DOM để chạy được cả trong Node (test).

/** Chuẩn hóa một từ/cụm từ để so sánh: chữ thường, bỏ khoảng trắng thừa, bỏ dấu câu ở hai đầu. */
export function normalizeWord(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

/** Tách câu thành các từ (chữ thường, không dấu câu). "It's a cow!" → ["it's", "a", "cow"] */
export function tokenize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .split(/[^\p{L}\p{N}']+/u)
    .map((t) => t.replace(/^'+|'+$/g, ''))
    .filter(Boolean);
}

/** Số từ trong câu. */
export function wordCount(text) {
  return tokenize(text).length;
}

/** Khóa ngày theo giờ máy, dạng YYYY-MM-DD. */
export function dayKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const DAY_MS = 24 * 60 * 60 * 1000;
