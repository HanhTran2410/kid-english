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
 * @param {File|Blob} file
 * @returns {Promise<{ blob: Blob, width: number, height: number, mimeType: string }>}
 */
export async function resizeImage(file, max = MAX_IMAGE_SIZE) {
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

  const scale = Math.min(1, max / Math.max(w0, h0));
  const width = Math.max(1, Math.round(w0 * scale));
  const height = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  source.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new ImageError('Không xử lý được ảnh này, hãy chọn ảnh khác.');
  return { blob, width, height, mimeType: 'image/jpeg' };
}
