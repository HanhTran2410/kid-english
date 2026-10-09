// Thu nhỏ ảnh bố mẹ chọn xuống 512px và lưu dạng Blob (SPEC mục 3 bước 5).

export const MAX_IMAGE_SIZE = 512;

export class ImageError extends Error {}

function loadWithImgElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode'));
    };
    img.src = url;
  });
}

/**
 * Số cột × hàng của ảnh lưới cho n từ. Dùng lưới VUÔNG khi có thể vì AI tạo ảnh (Gemini, ChatGPT)
 * thường vẽ ảnh vuông và hay bỏ qua số cột yêu cầu.
 */
export function gridShape(n) {
  if (n <= 2) return { cols: 2, rows: 1 };
  if (n <= 4) return { cols: 2, rows: 2 };
  if (n <= 9) return { cols: 3, rows: 3 };
  if (n <= 12) return { cols: 4, rows: 3 };
  return { cols: 4, rows: 4 };
}

/** Các kiểu lưới bố mẹ chọn được khi app đoán sai. */
export const GRID_OPTIONS = [
  { cols: 2, rows: 1 }, { cols: 2, rows: 2 }, { cols: 3, rows: 2 }, { cols: 2, rows: 3 }, { cols: 3, rows: 3 },
  { cols: 4, rows: 2 }, { cols: 2, rows: 4 }, { cols: 4, rows: 3 }, { cols: 3, rows: 4 }, { cols: 4, rows: 4 },
];

/**
 * Đếm số dải có hình theo một chiều (cột hoặc hàng) từ "độ đậm" của từng vạch.
 * @param {number[]} profile tỉ lệ điểm có nét vẽ trên mỗi vạch (0..1)
 */
export function countBands(profile, { minInk = 0.01, minBand = 0.06, mergeGap = 0.025 } = {}) {
  const n = profile.length;
  const runs = [];
  let start = -1;
  for (let i = 0; i <= n; i++) {
    const inked = i < n && profile[i] > minInk;
    if (inked && start < 0) start = i;
    if (!inked && start >= 0) {
      runs.push([start, i]);
      start = -1;
    }
  }
  // Gộp các dải cách nhau quá gần (ví dụ hai mắt trong cùng một ô).
  const merged = [];
  for (const r of runs) {
    const last = merged.at(-1);
    if (last && r[0] - last[1] < mergeGap * n) last[1] = r[1];
    else merged.push([...r]);
  }
  return merged.filter(([a, b]) => b - a >= minBand * n).length;
}

/** Đoán lưới của ảnh: đếm số cột/hàng có hình (nền trắng và đường kẻ xám nhạt không tính là hình). */
function detectGrid(source, w0, h0) {
  const size = 240;
  const scale = size / Math.max(w0, h0);
  const w = Math.max(1, Math.round(w0 * scale));
  const hgt = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = hgt;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, hgt);
  const { data } = ctx.getImageData(0, 0, w, hgt);
  const colInk = new Array(w).fill(0);
  const rowInk = new Array(hgt).fill(0);
  for (let y = 0; y < hgt; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (lum < 205 || sat > 40) {
        colInk[x]++;
        rowInk[y]++;
      }
    }
  }
  const cols = countBands(colInk.map((c) => c / hgt));
  const rows = countBands(rowInk.map((c) => c / w));
  if (cols < 1 || rows < 1 || cols > 5 || rows > 5 || cols * rows < 2) return null;
  return { cols, rows };
}

async function decode(file) {
  if (!file || (file.type && !file.type.startsWith('image/'))) {
    throw new ImageError('File này không phải ảnh. Hãy chọn ảnh khác.');
  }
  let source;
  try {
    source = await createImageBitmap(file);
  } catch {
    try {
      source = await loadWithImgElement(file);
    } catch {
      throw new ImageError('Không đọc được ảnh này, hãy chọn ảnh khác.');
    }
  }
  const w0 = source.width || source.naturalWidth;
  const h0 = source.height || source.naturalHeight;
  if (!w0 || !h0) throw new ImageError('Không đọc được ảnh này, hãy chọn ảnh khác.');
  return { source, w0, h0 };
}

/** Vẽ vùng (sx, sy, sw, sh) của ảnh ra JPEG, cạnh dài tối đa `max`. */
async function crop(source, sx, sy, sw, sh, max) {
  const scale = Math.min(1, max / Math.max(sw, sh));
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new ImageError('Không xử lý được ảnh này, hãy chọn ảnh khác.');
  return { blob, width, height, mimeType: 'image/jpeg' };
}

/**
 * Thu nhỏ một ảnh.
 * @param {File|Blob} file
 * @returns {Promise<{ blob: Blob, width: number, height: number, mimeType: string }>}
 */
export async function resizeImage(file, max = MAX_IMAGE_SIZE) {
  const { source, w0, h0 } = await decode(file);
  const out = await crop(source, 0, 0, w0, h0, max);
  source.close?.();
  return out;
}

/**
 * Đọc ảnh lưới và đoán số cột/hàng.
 * @returns {Promise<{ source, w0: number, h0: number, detected: { cols: number, rows: number } | null }>}
 */
export async function loadGridImage(file) {
  const { source, w0, h0 } = await decode(file);
  let detected = null;
  try {
    detected = detectGrid(source, w0, h0);
  } catch {
    detected = null;
  }
  return { source, w0, h0, detected };
}

/**
 * Cắt ảnh lưới thành MỌI ô (trái → phải, trên → dưới), bỏ một chút viền mỗi ô để không dính đường kẻ.
 * @returns {Promise<Array<{ blob: Blob, width: number, height: number, mimeType: string }>>}
 */
export async function sliceGrid({ source, w0, h0 }, { cols, rows }, max = MAX_IMAGE_SIZE) {
  const cw = w0 / cols;
  const ch = h0 / rows;
  const inset = Math.min(cw, ch) * 0.04;
  const tiles = [];
  for (let i = 0; i < cols * rows; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    tiles.push(await crop(source, c * cw + inset, r * ch + inset, cw - 2 * inset, ch - 2 * inset, max));
  }
  return tiles;
}
