// Góc bố mẹ — Google Drive (SPEC-drive.md): cài đặt, nút tải file bài lên Drive, nhập bài từ Drive.

import { h, toast, formatDateTime, copyText } from '../../ui.js';
import { appDrive, appFolder, loadGis, DriveError, DEFAULT_FOLDER, importLink, parseDriveLink, downloadPublicFile } from '../../drive.js';
import { section, field, notice } from './common.js';

const message = (err) => (err instanceof DriveError ? err.message : 'Có lỗi khi làm việc với Google Drive.');

/** Không bật được "ai có link đều xem được": giải thích theo lý do Google trả về. */
export function shareErrorMessage(err) {
  const text = `${err?.reason ?? ''} ${err?.message ?? ''}`;
  if (/publishOutNotPermitted|outside|domain|organi[sz]ation|invalidSharingRequest|sharing/i.test(text)) {
    return 'Không tạo được link nhập bài: tài khoản Google này không được chia sẻ file ra ngoài (thường gặp ở tài khoản công ty / trường học — quản trị viên chặn). '
      + 'Cách xử lý: dùng tài khoản Gmail cá nhân (Cài đặt → Google Drive → Kết nối thử, chọn Gmail cá nhân) rồi tải lên lại; hoặc nhờ quản trị viên cho phép chia sẻ ra ngoài. '
      + `File vẫn đã lên Drive — máy dùng cùng tài khoản có thể "Nhập bài từ Google Drive". (Chi tiết: ${err?.message ?? ''})`;
  }
  return `Đã tải lên nhưng không tạo được link nhập bài. ${message(err)}`;
}

/** Tải sẵn phần đăng nhập Google khi trang có nút Drive (để lúc bấm mở được cửa sổ đăng nhập ngay). */
export function prepareDrive(app) {
  if (appDrive(app)) loadGis().catch(() => {});
}

/** Mục "Google Drive" trong Cài đặt: Client ID, tên thư mục, kết nối thử, hướng dẫn thiết lập. */
export function driveSettingsSection(app) {
  prepareDrive(app);
  const s = app.settings;
  const clientId = h('input', { type: 'text', value: s.driveClientId ?? '', placeholder: 'xxxx.apps.googleusercontent.com', 'aria-label': 'Google Client ID', autocomplete: 'off', spellcheck: false });
  const folder = h('input', { type: 'text', value: s.driveFolderName || DEFAULT_FOLDER, 'aria-label': 'Thư mục trên Drive' });
  const apiKey = h('input', { type: 'text', value: s.driveApiKey ?? '', placeholder: 'AIza…', 'aria-label': 'Google API key', autocomplete: 'off', spellcheck: false });
  const status = h('p.muted');

  const saveBtn = h('button.btn', {
    type: 'button',
    text: 'Lưu',
    onclick: async () => {
      await app.setSetting('driveClientId', clientId.value.trim());
      await app.setSetting('driveFolderName', folder.value.trim() || DEFAULT_FOLDER);
      await app.setSetting('driveApiKey', apiKey.value.trim());
      prepareDrive(app);
      toast('Đã lưu. Bấm "Kết nối thử" để đăng nhập Google.', 2500);
    },
  });
  const testBtn = h('button.btn.primary', {
    type: 'button',
    text: 'Kết nối thử',
    onclick: async () => {
      const drive = appDrive(app);
      if (!drive) {
        toast('Dán Client ID rồi bấm Lưu trước.');
        return;
      }
      const ready = drive.auth.getToken(); // gọi ngay trong lúc chạm để mở được cửa sổ đăng nhập
      status.textContent = 'Đang đăng nhập Google…';
      try {
        await ready;
        await appFolder(app, drive);
        status.textContent = `✅ Đã kết nối. File bài sẽ được tải vào thư mục "${drive.folderName}" trên Google Drive.`;
      } catch (err) {
        status.textContent = `⚠️ ${message(err)}`;
      }
    },
  });

  const origin = location.origin;
  const guide = h('details.drive-guide', {},
    h('summary', { text: 'Hướng dẫn lấy Client ID (làm một lần, khoảng 10 phút, miễn phí)' }),
    h('ol', {},
      h('li', { text: 'Trên máy tính, mở console.cloud.google.com, đăng nhập Google của bạn, tạo dự án mới (ví dụ "Kid English").' }),
      h('li', { text: 'Vào "APIs & Services" → "Library", tìm "Google Drive API" → Enable.' }),
      h('li', { text: 'Vào "Google Auth Platform" (hoặc "OAuth consent screen") → Get started: tên app "Kid English", email của bạn, Audience: External → Create.' }),
      h('li', { text: 'Mục "Audience" → "Test users" → Add users: thêm email Google bạn sẽ dùng trên iPhone/iPad.' }),
      h('li', {}, 'Mục "Clients" → Create client → Application type: Web application → "Authorized JavaScript origins" → Add URI: ', h('code', { text: origin }), ' → Create.'),
      h('li', { text: 'Copy "Client ID" (dạng ….apps.googleusercontent.com), dán vào ô trên, bấm Lưu rồi "Kết nối thử". Làm bước này trên từng máy (iPhone, iPad…).' }),
      h('li', { text: 'Lần đầu Google báo "Google hasn\'t verified this app" vì đây là app riêng của bạn: bấm Continue, cho phép quyền Drive.' })),
    h('p', { text: 'API key — để máy khác nhập bài bằng link, không cần đăng nhập (chỉ cần trên máy GỬI bài):' }),
    h('ol', {},
      h('li', { text: 'Trong cùng dự án: "APIs & Services" → "Credentials" → Create credentials → API key.' }),
      h('li', {}, 'Bấm vào key vừa tạo → "Application restrictions": Websites → Add: ', h('code', { text: `${origin}/*` }),
        ' ; "API restrictions": Restrict key → chọn Google Drive API → Save.'),
      h('li', { text: 'Copy key (dạng AIza…), dán vào ô "Google API key" ở trên, bấm Lưu.' })),
    h('p.field-hint', { text: 'App chỉ được dùng các file và thư mục do chính app tạo trên Drive (quyền drive.file), không xem được file khác của bạn. File bài có link thì ai có link đều tải được (chỉ có nội dung bài và ảnh, không có giọng bé hay tiến độ).' }));

  return section('Google Drive (chia sẻ bài sang máy khác)',
    field('Google Client ID', clientId, 'Mỗi máy dán cùng một Client ID.'),
    field('Thư mục trên Drive', folder, 'App tự tạo thư mục này (nếu chưa có) và tải file bài vào đó.'),
    field('Google API key', apiKey, 'Không bắt buộc. Có key thì sau khi tải lên, app tạo "link nhập bài": máy khác dán link là nhập được, không cần đăng nhập Google.'),
    h('div.actions', {}, saveBtn, testBtn),
    status,
    h('p.field-hint', { text: 'Trên iPhone/iPad: nếu không mở được cửa sổ đăng nhập Google khi mở app từ Màn hình chính, hãy mở app bằng Safari để tải lên / nhập bài.' }),
    guide);
}

/** Ô hiện "link nhập bài" + nút Copy (copy ngay trong lúc chạm). */
function linkView(link) {
  const input = h('input.link-out', { type: 'text', value: link, readOnly: true, 'aria-label': 'Link nhập bài', onfocus: (e) => e.target.select() });
  return h('div.drive-link', {},
    h('p', { text: '🔗 Link nhập bài — gửi link này (Zalo, tin nhắn…). Máy kia: Quản lý bài → "Nhập bài từ link" → dán link. Không cần đăng nhập Google.' }),
    h('div.row', {}, input, h('button.btn.small', {
      type: 'button',
      text: 'Copy link',
      onclick: () => copyText(link).then((ok) => toast(ok ? 'Đã copy link nhập bài.' : 'Không copy được, hãy chọn và copy trong ô link.')),
    })));
}

/**
 * Nút "Tải lên Google Drive" cho một file đã tạo. Có API key thì sau khi tải lên, bật "ai có link đều xem được"
 * và hiện "link nhập bài" (SPEC-drive mục 7).
 * @param {() => ({ blob: Blob, filename: string } | null)} getFile
 * @returns {{ btn: HTMLElement, linkBox: HTMLElement }}
 */
export function driveUploadButton(app, getFile, status) {
  prepareDrive(app);
  const linkBox = h('div');
  const btn = h('button.btn.primary', {
    type: 'button',
    text: '3. Tải lên Google Drive',
    hidden: true,
    onclick: async () => {
      const drive = appDrive(app);
      const made = getFile();
      if (!drive || !made) return;
      const ready = drive.auth.getToken(); // gọi ngay trong lúc chạm để mở được cửa sổ đăng nhập
      btn.disabled = true;
      linkBox.replaceChildren();
      status.textContent = 'Đang tải lên Google Drive…';
      try {
        await ready;
        const folderId = await appFolder(app, drive);
        const f = await drive.client.upload(folderId, made.filename, made.blob);
        status.textContent = `✅ Đã tải lên Google Drive: ${drive.folderName}/${f.name}${f.replaced ? ' (thay file cũ cùng tên)' : ''}. Trên máy kia (cùng tài khoản Google): Quản lý bài → "Nhập bài từ Google Drive".`;
        const apiKey = String(app.settings.driveApiKey ?? '').trim();
        if (apiKey) {
          // File đã lên Drive; bước bật chia sẻ link lỗi thì báo riêng (không coi là tải lên thất bại).
          try {
            await drive.client.makePublic(f.id);
            linkBox.replaceChildren(linkView(importLink(f.id, apiKey)));
          } catch (err) {
            linkBox.replaceChildren(notice('error', shareErrorMessage(err)));
          }
        } else {
          linkBox.replaceChildren(h('p.field-hint', { text: 'Muốn máy khác nhập bằng link (không cần đăng nhập Google): thêm "Google API key" ở Cài đặt → Google Drive.' }));
        }
        toast('Đã tải lên Google Drive.');
      } catch (err) {
        status.textContent = `⚠️ ${message(err)}`;
      } finally {
        btn.disabled = false;
      }
    },
  });
  return { btn, linkBox };
}

/**
 * "Nhập bài từ link": dán link nhập bài (hoặc link Google Drive thường nếu máy này có API key) → tải về → nhập.
 * Không cần đăng nhập Google.
 * @param {(file: File) => Promise<void>} importFile
 */
export function linkImportButton(app, importFile) {
  const input = h('input', { type: 'url', placeholder: 'Dán link nhập bài…', 'aria-label': 'Link bài học', autocomplete: 'off' });
  const go = h('button.btn.primary', {
    type: 'button',
    text: 'Nhập',
    onclick: async () => {
      const parsed = parseDriveLink(input.value);
      if (!parsed) {
        toast('Link không đúng. Hãy dán "link nhập bài" từ máy gửi.', 3500);
        return;
      }
      const key = parsed.key || String(app.settings.driveApiKey ?? '').trim();
      if (!key) {
        toast('Link này là link Google Drive thường. Hãy dán "link nhập bài" (nút Copy link ở máy gửi).', 4500);
        return;
      }
      go.disabled = true;
      status.textContent = 'Đang tải bài từ Google Drive…';
      try {
        const { name, blob } = await downloadPublicFile(parsed.id, key);
        status.textContent = '';
        await importFile(new File([blob], name, { type: 'application/zip' }));
      } catch (err) {
        status.textContent = `⚠️ ${message(err)}`;
      } finally {
        go.disabled = false;
      }
    },
  });
  const status = h('p.muted');
  const box = h('div.link-import', { hidden: true }, h('div.row', {}, input, go), status);
  const btn = h('button.btn', {
    type: 'button',
    text: 'Nhập bài từ link',
    onclick: () => {
      box.hidden = false;
      input.focus();
    },
  });
  // Mở app bằng link nhập bài (Safari): điền sẵn link.
  if (app.pendingImportLink) {
    input.value = app.pendingImportLink;
    app.pendingImportLink = null;
    box.hidden = false;
  }
  return { btn, box };
}

/**
 * Nút "Nhập bài từ Google Drive": liệt kê file bài trong thư mục của app, chạm một file để nhập.
 * @param {(file: File) => Promise<void>} importFile cách nhập giống "Nhập bài từ file"
 */
export function driveImportButton(app, importFile) {
  prepareDrive(app);
  const box = h('div.drive-files');
  const btn = h('button.btn', {
    type: 'button',
    text: 'Nhập bài từ Google Drive',
    onclick: async () => {
      const drive = appDrive(app);
      if (!drive) {
        toast('Chưa thiết lập Google Drive: Góc bố mẹ → Cài đặt → Google Drive.', 3500);
        return;
      }
      const ready = drive.auth.getToken(); // gọi ngay trong lúc chạm để mở được cửa sổ đăng nhập
      box.replaceChildren(h('p.muted', { text: 'Đang mở Google Drive…' }));
      try {
        await ready;
        const folderId = await appFolder(app, drive);
        const files = await drive.client.listLessonFiles(folderId);
        if (!files.length) {
          box.replaceChildren(h('p.muted', { text: `Thư mục "${drive.folderName}" chưa có file bài nào.` }));
          return;
        }
        box.replaceChildren(h('p.muted', { text: `Chọn bài trong thư mục "${drive.folderName}":` }),
          h('ul.drive-file-list', {}, ...files.map((f) => h('li', {}, h('button.btn.small', {
            type: 'button',
            text: `⬇️ ${f.name}`,
            onclick: async (e) => {
              e.currentTarget.disabled = true;
              try {
                const blob = await drive.client.download(f.id);
                await importFile(new File([blob], f.name, { type: 'application/zip' }));
              } catch (err) {
                toast(message(err), 4000);
              }
            },
          }), h('span.muted', { text: ` ${f.modifiedTime ? formatDateTime(Date.parse(f.modifiedTime)) : ''}` })))));
      } catch (err) {
        box.replaceChildren(h('p.muted', { text: `⚠️ ${message(err)}` }));
      }
    },
  });
  return { btn, box };
}
