// Tải file bài lên Thư viện bài trên GitHub (SPEC-drive.md mục 9): GitHub REST API (cho gọi thẳng từ trình duyệt)
// với "fine-grained token" bố mẹ tạo — chỉ repo của app, chỉ quyền Contents (đọc + ghi). Token chỉ lưu trên máy này,
// không bao giờ nằm trong file sao lưu / file chia sẻ (backup.js bỏ SECRET_SETTINGS).
// Mỗi lần tải lên = một commit vào app/shared/ → workflow deploy tự cập nhật thư viện sau 1–2 phút.

export const API = 'https://api.github.com';
export const SHARED_PATH = 'app/shared';
export const BRANCH = 'main';

export class GitHubError extends Error {
  constructor(message, code = '') {
    super(message);
    this.code = code;
  }
}

/** "owner/repo" hợp lệ (chữ, số, - _ .). */
export const parseRepo = (s) => {
  const m = String(s ?? '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$|\/$/g, '').match(/^([\w.-]+)\/([\w.-]+)$/);
  return m ? `${m[1]}/${m[2]}` : null;
};

/** Repo của app đoán từ địa chỉ GitHub Pages (<owner>.github.io/<repo>/), không thì repo gốc của app. */
export function defaultRepo(loc = globalThis.location) {
  const m = String(loc?.hostname ?? '').match(/^([\w-]+)\.github\.io$/i);
  const repo = String(loc?.pathname ?? '').split('/').filter(Boolean)[0];
  return m && repo ? `${m[1]}/${repo}` : 'HanhTran2410/kid-english';
}

/** Tên file an toàn trong thư mục shared/ (chữ thường, số, - . _). */
export const safeFileName = (name) => String(name).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'bai-hoc.zip';

/** Blob → base64 (API Contents nhận nội dung dạng base64). */
export async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Gọi GitHub API; lỗi thành câu dễ hiểu cho bố mẹ. */
async function call(token, path, { method = 'GET', body, fetchFn = (...a) => fetch(...a) } = {}) {
  let res;
  try {
    res = await fetchFn(`${API}${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new GitHubError('Không kết nối được GitHub. Kiểm tra mạng rồi thử lại.', 'offline');
  }
  if (res.status === 401) throw new GitHubError('Token GitHub sai hoặc đã hết hạn. Tạo token mới rồi dán lại ở Cài đặt → GitHub.', 'token');
  if (res.status === 403) throw new GitHubError('Token không có quyền ghi vào repo này (cần quyền Contents: Read and write cho đúng repo).', 'denied');
  return res;
}

/**
 * Kiểm tra token + repo: repo có tồn tại và token được ghi không.
 * @returns {Promise<{ repo: string, canWrite: boolean, private: boolean }>}
 */
export async function checkAccess(token, repo, fetchFn) {
  const res = await call(token, `/repos/${repo}`, { fetchFn });
  if (res.status === 404) throw new GitHubError(`Không thấy repo ${repo} (sai tên, hoặc token không được chọn repo này).`, 'notfound');
  if (!res.ok) throw new GitHubError(`GitHub báo lỗi ${res.status}.`);
  const data = await res.json();
  return { repo: data.full_name ?? repo, canWrite: Boolean(data.permissions?.push), private: Boolean(data.private) };
}

/** Thông tin một file trong repo (sha để ghi đè), không có thì null. */
export async function getFile(token, repo, path, fetchFn) {
  const res = await call(token, `/repos/${repo}/contents/${path}?ref=${BRANCH}`, { fetchFn });
  if (res.status === 404) return null;
  if (!res.ok) throw new GitHubError(`GitHub báo lỗi ${res.status} khi đọc ${path}.`);
  const data = await res.json();
  return { sha: data.sha, size: data.size };
}

/**
 * Tải (hoặc ghi đè, khi có `sha`) một file vào repo trên nhánh main.
 * @returns {Promise<{ path: string, created: boolean }>}
 */
export async function putFile(token, repo, path, blob, { message, sha = null, fetchFn } = {}) {
  const res = await call(token, `/repos/${repo}/contents/${path}`, {
    method: 'PUT', fetchFn,
    body: { message, content: await blobToBase64(blob), branch: BRANCH, ...(sha ? { sha } : {}) },
  });
  if (res.status === 409 || res.status === 422) throw new GitHubError('File trên GitHub vừa bị đổi ở chỗ khác. Thử tải lên lại.', 'conflict');
  if (!res.ok) throw new GitHubError(`Không tải lên được (GitHub báo lỗi ${res.status}).`);
  return { path, created: res.status === 201 };
}
