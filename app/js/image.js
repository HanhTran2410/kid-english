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

/**
 * Tìm các đường kẻ chia ô theo một chiều.
 * @param {number[]} lineFrac tỉ lệ điểm "giống đường kẻ" (xám, không phải nền trắng) trên mỗi vạch (0..1)
 * @returns {number[]} vị trí (chỉ số vạch) tâm các đường kẻ BÊN TRONG, bỏ viền ngoài sát mép ảnh
 */
export function findDividerLines(lineFrac, { minFrac = 0.8, edge = 0.04, maxThick = 0.02 } = {}) {
  const n = lineFrac.length;
  const lines = [];
  let start = -1;
  for (let i = 0; i <= n; i++) {
    const on = i < n && lineFrac[i] >= minFrac;
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      // Dải xám dày (vỉa hè, mặt đường, bức tường…) không phải đường kẻ mảnh.
      if (i - start <= Math.max(2, maxThick * n)) lines.push((start + i - 1) / 2);
      start = -1;
    }
  }
  return lines.filter((c) => c > edge * n && c < (1 - edge) * n);
}

/**
 * Biết trước kiểu lưới (ví dụ prompt khung hình yêu cầu 3×4): tìm đường kẻ GẦN các vị trí k/count.
 * Trả về vị trí các đường kẻ, hoặc null nếu có vị trí không thấy đường kẻ rõ.
 */
export function findExpectedLines(lineFrac, count, { minFrac = 0.6, window = 0.06 } = {}) {
  const n = lineFrac.length;
  const lines = [];
  for (let k = 1; k < count; k++) {
    const center = (n * k) / count;
    const from = Math.max(0, Math.floor(center - window * n));
    const to = Math.min(n - 1, Math.ceil(center + window * n));
    // Các dải đủ đậm trong cửa sổ; lấy dải GẦN vị trí k/count nhất (nét vẽ khác có thể nằm gần đó).
    let best = null;
    for (let i = from; i <= to; i++) {
      if (lineFrac[i] < minFrac) continue;
      let j = i;
      while (j < to && lineFrac[j + 1] >= minFrac) j++;
      const mid = (i + j) / 2;
      if (best == null || Math.abs(mid - center) < Math.abs(best - center)) best = mid;
      i = j;
    }
    if (best == null) return null;
    lines.push(best);
  }
  return lines;
}

/** Đường kẻ chia ô phải cách đều tương đối (ô gần bằng nhau), không thì bỏ qua. */
function evenlySpaced(lines, n) {
  const edges = [0, ...lines, n];
  const sizes = edges.slice(1).map((e, i) => e - edges[i]);
  const avg = n / sizes.length;
  return sizes.every((sz) => Math.abs(sz - avg) < avg * 0.25);
}

/**
 * Đoán lưới của ảnh.
 * Cách 1 (chính xác): tìm các đường kẻ xám chạy suốt ảnh → biết số ô và VỊ TRÍ ranh giới thật để cắt.
 * Cách 2 (dự phòng, ảnh không có đường kẻ): đếm số cột/hàng có hình (nền trắng không tính).
 * Biết trước kiểu lưới (`expected`, ví dụ prompt yêu cầu 3×4) thì ưu tiên tìm đường kẻ đúng chỗ của kiểu lưới đó:
 * tranh có mảng xám chạy ngang (vỉa hè, sàn nhà…) không làm app đoán sai.
 * @param {{ cols: number, rows: number }} [expected]
 * @returns {{ cols: number, rows: number, xs?: number[], ys?: number[] } | null} xs/ys: ranh giới (theo ảnh gốc)
 */
function detectGrid(source, w0, h0, expected = null) {
  const size = 400;
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
  const colLine = new Array(w).fill(0);
  const rowLine = new Array(hgt).fill(0);
  // Chỉ xám nhạt (đường kẻ prompt yêu cầu), không tính nét đen của hình (mép sàn, viền cửa…).
  const colLight = new Array(w).fill(0);
  const rowLight = new Array(hgt).fill(0);
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
      // Điểm "giống đường kẻ": xám (ít màu), không phải nền trắng.
      if (lum < 242 && sat < 28) {
        colLine[x]++;
        rowLine[y]++;
        if (lum >= 140) {
          colLight[x]++;
          rowLight[y]++;
        }
      }
    }
  }

  const profiles = [[colLine, rowLine], [colLight, rowLight]].map(([c, r]) => [c.map((v) => v / hgt), r.map((v) => v / w)]);
  const result = (vLines, hLines) => ({
    cols: vLines.length + 1,
    rows: hLines.length + 1,
    xs: [0, ...vLines.map((x) => x / scale), w0],
    ys: [0, ...hLines.map((y) => y / scale), h0],
  });

  // Cách 0: biết trước kiểu lưới → tìm đường kẻ quanh đúng các vị trí k/cột, k/hàng.
  if (expected) {
    for (const [cp, rp] of [...profiles].reverse()) {
      const vLines = findExpectedLines(cp, expected.cols);
      const hLines = findExpectedLines(rp, expected.rows);
      if (vLines && hLines) return result(vLines, hLines);
    }
  }

  for (const [cp, rp] of profiles) {
    const vLines = findDividerLines(cp);
    const hLines = findDividerLines(rp);
    const cols = vLines.length + 1;
    const rows = hLines.length + 1;
    if (cols * rows >= 2 && cols <= 5 && rows <= 5 && evenlySpaced(vLines, w) && evenlySpaced(hLines, hgt)) {
      return result(vLines, hLines);
    }
  }

  const bandCols = countBands(colInk.map((c) => c / hgt));
  const bandRows = countBands(rowInk.map((c) => c / w));
  if (bandCols < 1 || bandRows < 1 || bandCols > 5 || bandRows > 5 || bandCols * bandRows < 2) return null;
  return { cols: bandCols, rows: bandRows };
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
 * Đọc ảnh lưới và đoán số cột/hàng (biết trước kiểu lưới `expected` thì ưu tiên kiểu đó).
 * @returns {Promise<{ source, w0: number, h0: number, detected: { cols: number, rows: number } | null }>}
 */
export async function loadGridImage(file, expected = null) {
  const { source, w0, h0 } = await decode(file);
  let detected = null;
  try {
    detected = detectGrid(source, w0, h0, expected);
  } catch {
    detected = null;
  }
  return { source, w0, h0, detected };
}

/**
 * Cắt ảnh lưới thành MỌI ô (trái → phải, trên → dưới), bỏ một chút viền mỗi ô để không dính đường kẻ.
 * @returns {Promise<Array<{ blob: Blob, width: number, height: number, mimeType: string }>>}
 */
export async function sliceGrid({ source, w0, h0, detected }, { cols, rows }, max = MAX_IMAGE_SIZE, { inset: insetPart = 0.04 } = {}) {
  // Cắt theo đúng vị trí đường kẻ nếu đã tìm thấy và khớp kiểu lưới; không thì chia đều.
  const useLines = detected?.xs && detected.cols === cols && detected.rows === rows;
  const xs = useLines ? detected.xs : Array.from({ length: cols + 1 }, (_, i) => (w0 * i) / cols);
  const ys = useLines ? detected.ys : Array.from({ length: rows + 1 }, (_, i) => (h0 * i) / rows);
  const tiles = [];
  for (let i = 0; i < cols * rows; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const cw = xs[c + 1] - xs[c];
    const ch = ys[r + 1] - ys[r];
    const inset = Math.min(cw, ch) * insetPart;
    tiles.push(await crop(source, xs[c] + inset, ys[r] + inset, cw - 2 * inset, ch - 2 * inset, max));
  }
  return tiles;
}

// ---------- Dán tranh: sticker cắt nền, ảnh tranh 4:3 (SPEC-scenes mục 10) ----------

/**
 * Mặt nạ nền trắng: loang từ mép ảnh qua các điểm SÁNG (cả 3 kênh màu ≥ `soft`) — nền trắng nối với mép ảnh
 * thành trong suốt, chỗ trắng nằm trong viền của hình vẫn giữ. Điểm gần trắng (≥ `hard`) trong suốt hẳn, điểm
 * sáng vừa (giữa soft và hard, thường là mép khử răng cưa) trong suốt một phần.
 * @param {Uint8ClampedArray|number[]} rgba dữ liệu điểm ảnh (4 số mỗi điểm)
 * @returns {Uint8ClampedArray} độ đục (0–255) cho từng điểm
 */
export function whiteBackgroundAlpha(rgba, width, height, { hard = 238, soft = 200 } = {}) {
  const n = width * height;
  const alpha = new Uint8ClampedArray(n).fill(255);
  const light = (i) => Math.min(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
  const seen = new Uint8Array(n);
  const queue = [];
  const push = (i) => {
    if (seen[i] || light(i) < soft) return;
    seen[i] = 1;
    queue.push(i);
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q];
    const v = light(i);
    alpha[i] = v >= hard ? 0 : Math.round((255 * (hard - v)) / (hard - soft));
    const x = i % width;
    if (x > 0) push(i - 1);
    if (x < width - 1) push(i + 1);
    if (i >= width) push(i - width);
    if (i < n - width) push(i + width);
  }
  return alpha;
}

/**
 * Sticker từ một ô ảnh lưới: bỏ nền trắng (thành trong suốt), cắt sát hình (chừa `pad`, mặc định 4%), xuất PNG.
 * Ô không còn gì (ô trống) thì báo lỗi.
 */
export async function cutOutSticker(blob, max = 320, { pad: padRatio = 0.04 } = {}) {
  const { source, w0, h0 } = await decode(blob);
  const scale = Math.min(1, max / Math.max(w0, h0));
  const width = Math.max(1, Math.round(w0 * scale));
  const height = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, width, height);
  source.close?.();
  const img = ctx.getImageData(0, 0, width, height);
  const alpha = whiteBackgroundAlpha(img.data, width, height);
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let i = 0; i < alpha.length; i++) {
    img.data[i * 4 + 3] = alpha[i];
    if (alpha[i] > 40) {
      const x = i % width;
      const y = (i - x) / width;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) throw new ImageError('Ô này không có hình.');
  ctx.putImageData(img, 0, 0);
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * padRatio);
  const sx = Math.max(0, x0 - pad);
  const sy = Math.max(0, y0 - pad);
  const sw = Math.min(width, x1 + pad + 1) - sx;
  const sh = Math.min(height, y1 + pad + 1) - sy;
  const out = document.createElement('canvas');
  out.width = sw;
  out.height = sh;
  out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  const png = await new Promise((resolve) => out.toBlob(resolve, 'image/png'));
  if (!png) throw new ImageError('Không xử lý được ảnh này, hãy chọn ảnh khác.');
  return { blob: png, width: sw, height: sh, mimeType: 'image/png' };
}

/** Vùng cắt giữa ảnh theo đúng tỉ lệ `ratio` (rộng / cao), bỏ bớt hai bên hoặc trên dưới. */
export function coverCrop(w0, h0, ratio) {
  if (w0 / h0 > ratio) {
    const sw = h0 * ratio;
    return { sx: (w0 - sw) / 2, sy: 0, sw, sh: h0 };
  }
  const sh = w0 / ratio;
  return { sx: 0, sy: (h0 - sh) / 2, sw: w0, sh };
}

/** Ảnh tranh: cắt giữa đúng tỉ lệ 4:3, cạnh dài tối đa `max`. */
export async function resizeCover(file, ratio = 4 / 3, max = 1200) {
  const { source, w0, h0 } = await decode(file);
  const { sx, sy, sw, sh } = coverCrop(w0, h0, ratio);
  const out = await crop(source, sx, sy, sw, sh, max);
  source.close?.();
  return out;
}

// ---------- Ảnh lưới cảnh (SPEC-art): bỏ lề trắng quanh từng ô sau khi cắt ----------
/**
 * Khung chứa phần CÓ HÌNH của ảnh (điểm có kênh màu nhỏ nhất < `limit`, tức không gần trắng), nới thêm `pad` (phần
 * cạnh ngắn) cho đỡ sát; trả về null nếu cả ảnh gần trắng. Hàm thuần — test được.
 * @returns {{ x: number, y: number, w: number, h: number } | null}
 */
export function contentBox(rgba, width, height, { limit = 235, pad = 0.02 } = {}) {
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (rgba[i + 3] < 16 || Math.min(rgba[i], rgba[i + 1], rgba[i + 2]) >= limit) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  const p = Math.round(Math.min(width, height) * pad);
  const x = Math.max(0, x0 - p);
  const y = Math.max(0, y0 - p);
  return { x, y, w: Math.min(width, x1 + p + 1) - x, h: Math.min(height, y1 + p + 1) - y };
}

/**
 * Ô có KHUNG THẺ (AI hay vẽ mỗi ô một thẻ bo góc viền xám): khung là phần "có hình" ngoài cùng nên `contentBox` lấy cả
 * khung. Dò lại bên trong (lùi 4% khỏi mép khung): nếu hình thật nhỏ hẳn so với vùng trong (≤ 85% diện tích) thì đó là thẻ
 * có khung → lấy khung hình bên trong; ảnh tràn kín ô (vd. cảnh rửa tay) thì giữ khung cũ. Hàm thuần — test được.
 */
export function innerBox(rgba, width, height, box) {
  if (!box) return box;
  const m = Math.round(Math.min(box.w, box.h) * 0.04);
  if (m < 2) return box;
  const iw = box.w - 2 * m;
  const ih = box.h - 2 * m;
  if (iw < 8 || ih < 8) return box;
  const sub = new Uint8ClampedArray(iw * ih * 4);
  for (let y = 0; y < ih; y++) {
    const from = ((box.y + m + y) * width + box.x + m) * 4;
    sub.set(rgba.subarray(from, from + iw * 4), y * iw * 4);
  }
  const inner = contentBox(sub, iw, ih);
  if (!inner || inner.w * inner.h > 0.85 * iw * ih) return box;
  return { x: box.x + m + inner.x, y: box.y + m + inner.y, w: inner.w, h: inner.h };
}

/**
 * Cắt bỏ lề trắng quanh một ô ảnh lưới (AI hay vẽ ô lệch, có lề / khe trắng không đều). Không tìm được hình thì giữ nguyên.
 * @param {{ blob: Blob }} tile
 */
export async function trimWhiteMargin(tile, max = MAX_IMAGE_SIZE) {
  const { source, w0, h0 } = await decode(tile.blob);
  try {
    // Dò khung trên bản thu nhỏ cho nhanh, rồi cắt trên ảnh gốc.
    const k = Math.min(1, 240 / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * k));
    const hgt = Math.max(1, Math.round(h0 * k));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = hgt;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, w, hgt);
    const data = ctx.getImageData(0, 0, w, hgt).data;
    const box = innerBox(data, w, hgt, contentBox(data, w, hgt));
    if (!box || (box.w >= w - 1 && box.h >= hgt - 1)) return tile;
    return await crop(source, box.x / k, box.y / k, box.w / k, box.h / k, max);
  } finally {
    source.close?.();
  }
}
