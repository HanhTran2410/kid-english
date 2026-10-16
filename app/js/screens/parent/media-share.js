// Chia sẻ ảnh của trò chơi sang máy khác (Dán tranh — SPEC-scenes mục 10.5; Mặc đồ — SPEC-dressup mục 12):
// dùng lại cách chia sẻ bài — tạo file .zip → gửi file (AirDrop, Zalo…) / Google Drive; máy kia nhập từ file, Drive, link.

import { h, toast } from '../../ui.js';
import { createBackup, readBackup, BackupError } from '../../backup.js';
import { APP_VERSION } from '../../app.js';
import { appDrive } from '../../drive.js';
import { section } from './common.js';
import { saveFile } from './backup.js';
import { driveUploadButton, driveImportButton, linkImportButton } from './drive.js';

/**
 * @param {object} opts
 * @param {string} opts.what tên nội dung trong thông báo ("ảnh Dán tranh", "đồ Mặc đồ")
 * @param {string} opts.intro câu giải thích (máy này có gì, máy kia nhập ở đâu)
 * @param {boolean} opts.canMake có gì để gửi không
 * @param {object} opts.backup tùy chọn createBackup (lessonIds, settingsKeys, filename)
 * @param {(payload: object) => Promise<string>} opts.accept nhập dữ liệu trong file; trả về câu báo kết quả;
 *   ném BackupError nếu file không có gì dùng được
 * @param {() => void} opts.done sau khi nhập xong (tải lại trang)
 */
export function mediaShareSection(app, { what, intro, canMake, backup, accept, done }) {
  const status = h('p.muted');
  let made = null;
  const sendBtn = h('button.btn.primary', {
    type: 'button',
    text: '2. Gửi file',
    hidden: true,
    onclick: async () => {
      if (made && await saveFile(made.blob, made.filename)) toast(`Đã xuất file ${what}.`);
    },
  });
  const makeBtn = h('button.btn', {
    type: 'button',
    text: '1. Tạo file',
    disabled: !canMake,
    onclick: async () => {
      makeBtn.disabled = true;
      try {
        made = await createBackup(app.db, { appVersion: APP_VERSION, ...backup });
        status.textContent = `Đã tạo ${made.filename} (${made.counts.images} ảnh). Bấm "Gửi file" để lưu vào Files/iCloud hoặc gửi AirDrop, Zalo…${appDrive(app) ? ', hoặc "Tải lên Google Drive".' : ''}`;
        sendBtn.hidden = false;
        driveBtn.hidden = !appDrive(app);
      } catch (err) {
        console.error(err);
        status.textContent = 'Không tạo được file.';
      } finally {
        makeBtn.disabled = false;
      }
    },
  });
  const { btn: driveBtn, linkBox } = driveUploadButton(app, () => made, status);

  const importFile = async (file) => {
    try {
      toast(await accept(await readBackup(file)), 3500);
      done();
    } catch (err) {
      toast(err instanceof BackupError ? err.message : 'Không đọc được file.', 4000);
    }
  };
  const input = h('input', { type: 'file', accept: '.zip,application/zip', hidden: true });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (file) await importFile(file);
  });
  const fromDrive = driveImportButton(app, importFile);
  const fromLink = linkImportButton(app, importFile);

  return section('Chia sẻ sang máy khác',
    h('p', { text: intro }),
    h('div.actions', {}, makeBtn, sendBtn, driveBtn),
    status,
    linkBox,
    h('div.actions', {},
      h('button.btn.primary', { type: 'button', text: 'Nhập từ file', onclick: () => input.click() }),
      input,
      fromDrive.btn,
      fromLink.btn),
    fromLink.box,
    fromDrive.box);
}
