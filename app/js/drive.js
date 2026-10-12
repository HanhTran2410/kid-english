// Google Drive (SPEC-drive.md): đăng nhập Google ngay trong trình duyệt (Google Identity Services, không cần server),
// rồi gọi Drive API để tải file bài lên một thư mục riêng và nhập bài từ thư mục đó ở máy khác.
// Quyền `drive.file`: app chỉ thấy file và thư mục do CHÍNH app tạo, không đọc được các file khác trong Drive.

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const FOLDER_MIME = 'application/vnd.google-apps.folder';
export const DEFAULT_FOLDER = 'Kid English';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

export class DriveError extends Error {
  constructor(message, code = 'error') {
    super(message);
    this.code = code;
  }
}

// ---------- Đăng nhập ----------

let gisPromise = null;

/** Tải thư viện đăng nhập Google (chỉ khi bố mẹ dùng Drive, cần mạng). */
export function loadGis() {
  if (globalThis.google?.accounts?.oauth2) return Promise.resolve();
  gisPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gisPromise = null;
      reject(new DriveError('Không tải được phần đăng nhập Google. Kiểm tra mạng rồi thử lại.', 'offline'));
    };
    document.head.append(s);
  });
  return gisPromise;
}

/** Giữ "vé" truy cập Google (khoảng 1 giờ). Hết hạn thì xin lại — phải xin trong lúc bố mẹ chạm (cửa sổ đăng nhập). */
export class DriveAuth {
  constructor(clientId) {
    this.clientId = clientId;
    this.token = null;
    this.expiresAt = 0;
  }

  get valid() {
    return Boolean(this.token) && Date.now() < this.expiresAt - 60_000;
  }

  forget() {
    this.token = null;
    this.expiresAt = 0;
  }

  /**
   * Lấy vé truy cập. Gọi NGAY trong sự kiện chạm (trước mọi `await`) để trình duyệt cho mở cửa sổ đăng nhập.
   * @returns {Promise<string>}
   */
  getToken() {
    if (this.valid) return Promise.resolve(this.token);
    const oauth2 = globalThis.google?.accounts?.oauth2;
    if (!oauth2) {
      loadGis().catch(() => {});
      return Promise.reject(new DriveError('Đang tải phần đăng nhập Google, bấm lại sau vài giây.', 'loading'));
    }
    return new Promise((resolve, reject) => {
      const client = oauth2.initTokenClient({
        client_id: this.clientId,
        scope: DRIVE_SCOPE,
        callback: (resp) => {
          if (resp?.error || !resp?.access_token) {
            reject(new DriveError('Google chưa cho phép truy cập Drive.', resp?.error ?? 'denied'));
            return;
          }
          this.token = resp.access_token;
          this.expiresAt = Date.now() + (Number(resp.expires_in) || 3600) * 1000;
          resolve(this.token);
        },
        error_callback: (err) => {
          reject(new DriveError(err?.type === 'popup_failed_to_open'
            ? 'Không mở được cửa sổ đăng nhập Google. Trên iPhone: mở app bằng Safari (không mở từ Màn hình chính) rồi thử lại.'
            : 'Chưa đăng nhập Google (cửa sổ đăng nhập đã đóng).', err?.type ?? 'popup'));
        },
      });
      client.requestAccessToken();
    });
  }
}

// ---------- Drive API ----------

const quote = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

export class DriveClient {
  /**
   * @param {() => Promise<string>} getToken
   * @param {typeof fetch} [fetchFn]
   */
  constructor(getToken, fetchFn = (...args) => fetch(...args)) {
    this.getToken = getToken;
    this.fetch = fetchFn;
    this.onUnauthorized = null;
  }

  async call(url, options = {}) {
    const token = await this.getToken();
    let res;
    try {
      res = await this.fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } });
    } catch {
      throw new DriveError('Không kết nối được Google Drive. Kiểm tra mạng rồi thử lại.', 'offline');
    }
    if (res.status === 401) {
      this.onUnauthorized?.();
      throw new DriveError('Phiên đăng nhập Google đã hết. Bấm lại để đăng nhập.', 'auth');
    }
    if (res.status === 404) throw new DriveError('Không tìm thấy trên Google Drive.', 'notfound');
    if (!res.ok) throw new DriveError(`Google Drive báo lỗi (${res.status}).`, 'http');
    return res;
  }

  async json(url, options) {
    return (await this.call(url, options)).json();
  }

  async search(q, fields = 'files(id,name,modifiedTime,size)', orderBy = '') {
    const params = new URLSearchParams({ q, fields, spaces: 'drive', pageSize: '100' });
    if (orderBy) params.set('orderBy', orderBy);
    return (await this.json(`${API}/files?${params}`)).files ?? [];
  }

  /** Thư mục của app: dùng lại thư mục đã nhớ nếu còn, không thì tìm theo tên, không có thì tạo mới. */
  async ensureFolder(name, cachedId = null) {
    if (cachedId) {
      try {
        const f = await this.json(`${API}/files/${encodeURIComponent(cachedId)}?fields=id,name,trashed`);
        if (!f.trashed && f.name === name) return f.id;
      } catch (err) {
        if (err.code !== 'notfound') throw err;
      }
    }
    const found = await this.search(`name = ${quote(name)} and mimeType = '${FOLDER_MIME}' and trashed = false`, 'files(id,name)');
    if (found.length) return found[0].id;
    const created = await this.json(`${API}/files?fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: FOLDER_MIME }),
    });
    return created.id;
  }

  /** Tải file lên thư mục; đã có file cùng tên thì ghi đè (không tạo bản trùng). */
  async upload(folderId, filename, blob, mimeType = 'application/zip') {
    const existing = await this.search(`name = ${quote(filename)} and ${quote(folderId)} in parents and trashed = false`, 'files(id,name)');
    if (existing.length) {
      const f = await this.json(`${UPLOAD}/files/${encodeURIComponent(existing[0].id)}?uploadType=media&fields=id,name`, {
        method: 'PATCH',
        headers: { 'Content-Type': mimeType },
        body: blob,
      });
      return { ...f, replaced: true };
    }
    const boundary = `kidenglish${Math.random().toString(36).slice(2)}`;
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
      JSON.stringify({ name: filename, parents: [folderId], mimeType }),
      `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
      blob,
      `\r\n--${boundary}--`,
    ]);
    const f = await this.json(`${UPLOAD}/files?uploadType=multipart&fields=id,name`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    return { ...f, replaced: false };
  }

  /** Các file bài (.zip) trong thư mục, mới sửa trước. */
  async listLessonFiles(folderId) {
    const files = await this.search(`${quote(folderId)} in parents and trashed = false and mimeType != '${FOLDER_MIME}'`,
      'files(id,name,modifiedTime,size)', 'modifiedTime desc');
    return files.filter((f) => /\.zip$/i.test(f.name));
  }

  async download(fileId) {
    return (await this.call(`${API}/files/${encodeURIComponent(fileId)}?alt=media`)).blob();
  }
}

// ---------- Dùng trong app ----------

/**
 * Drive của app theo Client ID trong cài đặt (một lần đăng nhập dùng cho cả buổi).
 * @returns {{ auth: DriveAuth, client: DriveClient, folderName: string } | null} null nếu chưa thiết lập
 */
export function appDrive(app) {
  const clientId = String(app.settings.driveClientId ?? '').trim();
  if (!clientId) return null;
  if (app.drive?.auth.clientId !== clientId) {
    const auth = new DriveAuth(clientId);
    const client = new DriveClient(() => auth.getToken());
    client.onUnauthorized = () => auth.forget();
    app.drive = { auth, client };
  }
  return { ...app.drive, folderName: String(app.settings.driveFolderName ?? '').trim() || DEFAULT_FOLDER };
}

/** Thư mục của app trên Drive (nhớ id để lần sau không phải tìm). */
export async function appFolder(app, drive) {
  const remembered = app.settings.driveFolder;
  const cached = remembered?.name === drive.folderName ? remembered.id : null;
  const id = await drive.client.ensureFolder(drive.folderName, cached);
  if (id !== cached) await app.setSetting('driveFolder', { id, name: drive.folderName });
  return id;
}
