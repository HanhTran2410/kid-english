// Sao lưu / Khôi phục (SPEC 4.6). Sao lưu làm 2 bước để iOS cho mở bảng Chia sẻ.

import { h, toast, confirmDialog, formatBytes, formatDateTime } from '../../ui.js';
import { createBackup, readBackup, applyBackup, estimateBackupSize, BackupError } from '../../backup.js';
import { loadSettings } from '../../settings.js';
import { APP_VERSION } from '../../app.js';
import { parentLayout, goParent, section, notice } from './common.js';

async function saveFile(blob, filename) {
  const file = new File([blob], filename, { type: 'application/zip' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return false; // bố mẹ bấm hủy
    }
  }
  // Dự phòng: tải về.
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

export function backupView(app) {
  const body = parentLayout(app, { title: 'Sao lưu / Khôi phục', back: () => goParent(app) });

  // ----- Sao lưu -----
  const withRec = h('input', { type: 'checkbox', checked: true });
  const estimate = h('span.muted');
  const updateEstimate = async () => {
    estimate.textContent = ' (đang tính…)';
    const bytes = await estimateBackupSize(app.db, { includeRecordings: withRec.checked });
    estimate.textContent = ` — khoảng ${formatBytes(bytes)}`;
  };
  withRec.addEventListener('change', updateEstimate);
  updateEstimate();

  const status = h('p.muted');
  const saveBtn = h('button.btn.primary.big', { type: 'button', text: '2. Lưu file', hidden: true });
  let made = null;
  const makeBtn = h('button.btn.big', {
    type: 'button',
    text: '1. Tạo bản sao lưu',
    onclick: async () => {
      makeBtn.disabled = true;
      status.textContent = 'Đang tạo file…';
      try {
        made = await createBackup(app.db, { includeRecordings: withRec.checked, appVersion: APP_VERSION });
        status.textContent = `Đã tạo ${made.filename} (${formatBytes(made.blob.size)}). Bấm "Lưu file" để lưu vào Files/iCloud.`;
        saveBtn.hidden = false;
      } catch (err) {
        console.error(err);
        status.textContent = 'Không tạo được bản sao lưu. Hãy thử bỏ chọn "Kèm ghi âm".';
      } finally {
        makeBtn.disabled = false;
      }
    },
  });
  saveBtn.addEventListener('click', async () => {
    if (!made) return;
    if (await saveFile(made.blob, made.filename)) {
      await app.setSetting('lastBackupAt', Date.now());
      toast('Đã sao lưu.');
    }
  });

  const last = app.settings.lastBackupAt ? `Lần sao lưu gần nhất: ${formatDateTime(app.settings.lastBackupAt)}` : 'Chưa sao lưu lần nào.';

  // ----- Khôi phục -----
  const fileInput = h('input', { type: 'file', accept: '.zip,application/zip' });
  const restoreBox = h('div');
  fileInput.addEventListener('change', async () => {
    restoreBox.replaceChildren();
    const file = fileInput.files?.[0];
    if (!file) return;
    let payload;
    try {
      payload = await readBackup(file);
    } catch (err) {
      restoreBox.append(notice('error', err instanceof BackupError ? err.message : 'Không đọc được file sao lưu.'));
      return;
    }
    const c = payload.manifest.counts ?? {};
    const apply = async (mode) => {
      if (mode === 'replace') {
        const ok1 = await confirmDialog('Thay thế TOÀN BỘ dữ liệu hiện có bằng file sao lưu?', { okText: 'Thay thế', danger: true });
        if (!ok1) return;
        const ok2 = await confirmDialog('Chắc chắn chứ? Bài học, tiến độ, ghi âm và sticker hiện có sẽ mất.', { okText: 'Chắc chắn', danger: true });
        if (!ok2) return;
      }
      await applyBackup(app.db, payload, mode);
      app.settings = await loadSettings(app.db);
      app.speaker.configure({ voiceURI: app.settings.voiceURI, rate: app.settings.rate });
      app.recognizer.setAllowed(app.settings.useRecognition);
      toast('Đã khôi phục.');
      goParent(app);
    };
    restoreBox.append(
      notice('info', `File ngày ${formatDateTime(payload.manifest.exportedAt)}: ${c.lessons ?? payload.lessons.length} bài, `
        + `${payload.images.length} ảnh, ${payload.recordings.length} ghi âm, ${payload.stickers.length} loại sticker.`),
      h('div.actions', {},
        h('button.btn.primary', { type: 'button', text: 'Gộp với dữ liệu hiện có', onclick: () => apply('merge') }),
        h('button.btn.danger', { type: 'button', text: 'Thay thế toàn bộ', onclick: () => apply('replace') })));
  });

  body.append(
    section('Sao lưu',
      h('p', { text: last }),
      h('label.check', {}, withRec, h('span', { text: 'Kèm ghi âm' }), estimate),
      h('div.actions', {}, makeBtn, saveBtn),
      status),
    section('Khôi phục',
      h('p', { text: 'Chọn file kid-english-backup-….zip. App kiểm tra toàn bộ file trước rồi mới ghi, file hỏng thì dữ liệu hiện có không bị ảnh hưởng.' }),
      fileInput,
      restoreBox));
}
