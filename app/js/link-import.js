// Nhập bài từ link (SPEC-drive.md mục 7–8): link Google Drive (như trước) hoặc link file .zip trên GitHub —
// thư viện bài của app (app/shared/ trên GitHub Pages), link github.com/…/blob/…, raw.githubusercontent.com, hoặc link
// .zip bất kỳ cho phép tải trực tiếp. "Link nhập bài" GitHub có dạng <app>#zip=<đường dẫn file> (phần sau # không gửi đi).

import { parseDriveLink } from './drive.js';

export const SHARED_DIR = 'shared/';
export const SHARED_INDEX = 'shared/index.json';

export class LinkError extends Error {}

/** Đổi link trang GitHub của file (…/blob/<nhánh>/… hoặc …/raw/<nhánh>/…) thành link tải thẳng raw.githubusercontent.com. */
export function githubRawUrl(url) {
  const m = String(url).match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/i);
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3].replace(/[?#].*$/, '')}` : null;
}

const isZipPath = (u) => /\.zip$/i.test(u.pathname);

/**
 * Đọc link bố mẹ dán. `base`: địa chỉ app (để hiểu đường dẫn tương đối như "shared/08-family.zip").
 * @returns {{ type: 'zip', url: string } | { type: 'drive', id: string, key: string|null } | null}
 */
export function parseImportLink(text, base = globalThis.location?.href ?? 'https://example.invalid/') {
  const s = String(text ?? '').trim();
  if (!s) return null;
  // Link nhập bài GitHub của app: …#zip=<đường dẫn file>.
  const hash = s.match(/[#&]zip=([^&\s]+)/);
  if (hash) {
    try {
      return { type: 'zip', url: new URL(decodeURIComponent(hash[1]), s.startsWith('http') ? s : base).href };
    } catch {
      return null;
    }
  }
  const raw = githubRawUrl(s);
  if (raw) return /\.zip$/i.test(raw) ? { type: 'zip', url: raw } : null;
  let url = null;
  try {
    url = new URL(s, /^[a-z]+:/i.test(s) ? undefined : base);
  } catch {
    url = null;
  }
  if (url && /^https?:$/.test(url.protocol) && isZipPath(url)) return { type: 'zip', url: url.href };
  const drive = parseDriveLink(s);
  return drive ? { type: 'drive', ...drive } : null;
}

/** "Link nhập bài" GitHub để gửi cho người khác: mở app là có link điền sẵn ở Quản lý bài. */
export function zipImportLink(file, base = `${globalThis.location?.origin ?? ''}${globalThis.location?.pathname ?? '/'}`) {
  return `${base}#zip=${encodeURIComponent(`${SHARED_DIR}${file}`)}`;
}

/**
 * Tải file .zip từ link (cần trang đó cho phép tải trực tiếp — GitHub Pages / raw.githubusercontent.com có).
 * @returns {Promise<{ name: string, blob: Blob }>}
 */
export async function downloadZip(url, fetchFn = (...args) => fetch(...args)) {
  let res;
  try {
    res = await fetchFn(url, { cache: 'no-store' });
  } catch {
    throw new LinkError('Không tải được file. Kiểm tra mạng; nếu link không phải GitHub / Google Drive thì hãy tải file về máy rồi bấm "Nhập bài từ file".');
  }
  if (res.status === 404) throw new LinkError('Không tìm thấy file (link sai, hoặc file đã bị xóa / đổi tên).');
  if (!res.ok) throw new LinkError(`Không tải được file (lỗi ${res.status}).`);
  const name = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'bai-hoc.zip');
  return { name, blob: await res.blob() };
}
