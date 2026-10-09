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

/** Số cột × hàng của ảnh lưới cho n từ (ảnh ngang, đọc từ trái sang phải, trên xuống dưới). */
export function gridShape(n) {
  if (n <= 2) return { cols: 2, rows: 1 };
  if (n <= 4) return { cols: 2, rows: 2 };
  if (n <= 6) return { cols: 3, rows: 2 };
  if (n <= 8) return { cols: 4, rows: 2 };
  if (n <= 9) return { cols: 3, rows: 3 };
  return { cols: 4, rows: 3 };
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
 * Cắt ảnh lưới thành từng ô (trái → phải, trên → dưới), bỏ một chút viền mỗi ô để không dính đường kẻ.
 * @returns {Promise<Array<{ blob: Blob, width: number, height: number, mimeType: string }>>}
 */
export async function sliceGrid(file, { cols, rows, count }, max = MAX_IMAGE_SIZE) {
  const { source, w0, h0 } = await decode(file);
  const cw = w0 / cols;
  const ch = h0 / rows;
  const inset = Math.min(cw, ch) * 0.04;
  const tiles = [];
  for (let i = 0; i < Math.min(count, cols * rows); i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    tiles.push(await crop(source, c * cw + inset, r * ch + inset, cw - 2 * inset, ch - 2 * inset, max));
  }
  source.close?.();
  return tiles;
}
