// Góc bố mẹ — GitHub (SPEC-drive.md mục 9): cài đặt token + repo, nút "Tải lên Thư viện bài (GitHub)" ở Chia sẻ bài,
// tự tải lên khi tạo bài mới / sửa bài đã có trong thư viện (bật trong Cài đặt).
// Token chỉ ở máy này (không vào file sao lưu). Repo công khai: chỉ tải bài không có ảnh người thật.

import { h, toast, copyText, confirmDialog } from '../../ui.js';
import { APP_VERSION } from '../../app.js';
import { createBackup } from '../../backup.js';
import { lessonFileName } from '../../lesson.js';
import { zipImportLink } from '../../link-import.js';
import { GitHubError, SHARED_PATH, parseRepo, defaultRepo, safeFileName, checkAccess, getFile, putFile } from '../../github.js';
import { scaled } from '../../timing.js';
import { section, field, notice } from './common.js';

const AUTO_DELAY_MS = 15_000; // rời trang bài 15 giây (không quay lại) thì mới tự tải lên — để bố mẹ thêm ảnh xong
const timers = new Map(); // mã bài → hẹn giờ tự tải lên
const errorText = (err) => (err instanceof GitHubError ? err.message : 'Có lỗi khi tải lên GitHub.');

export const githubRepo = (app) => parseRepo(app.settings.githubRepo) ?? defaultRepo();
export const githubReady = (app) => Boolean(String(app.settings.githubToken ?? '').trim());

/** Dấu hiệu nội dung bài (đổi khi sửa bài / thêm ảnh) để biết có cần tải lại không. */
async function lessonSig(app, lesson) {
  const images = await app.db.getAllByIndex('images', 'lessonId', lesson.id).catch(() => []);
  const last = images.reduce((m, i) => Math.max(m, i.createdAt ?? 0), 0);
  return `${lesson.updatedAt ?? lesson.createdAt ?? 0}|${lesson.title}|${images.length}|${last}|${JSON.stringify(lesson).length}`;
}

/**
 * Tải một bài lên app/shared/ của repo. Tên file theo bài ("08-family.zip"); file cùng tên mà KHÔNG phải bài này
 * (bài của máy khác trùng số) thì: tải tay → hỏi ghi đè; tự tải → đặt tên khác ("-2", "-3"…).
 * @returns {Promise<{ file: string, created: boolean } | null>} null nếu bố mẹ không đồng ý ghi đè
 */
export async function uploadLesson(app, lesson, { auto = false } = {}) {
  const token = String(app.settings.githubToken ?? '').trim();
  if (!token) throw new GitHubError('Chưa có token GitHub (Góc bố mẹ → Cài đặt → GitHub).', 'token');
  const repo = githubRepo(app);
  const mine = app.settings.githubUploads?.[lesson.id]?.file;
  let file = mine ?? safeFileName(lessonFileName(lesson));
  let existing = await getFile(token, repo, `${SHARED_PATH}/${file}`);
  if (existing && !mine) {
    if (auto) {
      const base = file.replace(/\.zip$/, '');
      for (let i = 2; existing && i < 20; i++) {
        file = `${base}-${i}.zip`;
        existing = await getFile(token, repo, `${SHARED_PATH}/${file}`);
      }
    } else if (!await confirmDialog(`Thư viện đã có file ${file} (có thể là bài khác cùng số). Ghi đè bằng bài "${lesson.title}"?`, { okText: 'Ghi đè', danger: true })) {
      return null;
    }
  }
  const made = await createBackup(app.db, { lessonIds: [lesson.id], appVersion: APP_VERSION });
  const result = await putFile(token, repo, `${SHARED_PATH}/${file}`, made.blob, {
    message: `Thư viện bài: ${existing ? 'cập nhật' : 'thêm'} "${lesson.title}" (${file})`, sha: existing?.sha ?? null,
  });
  const uploads = { ...(app.settings.githubUploads ?? {}), [lesson.id]: { file, sig: await lessonSig(app, lesson), at: Date.now() } };
  await app.setSetting('githubUploads', uploads);
  await app.setSetting('githubPending', (app.settings.githubPending ?? []).filter((id) => id !== lesson.id));
  return { file, created: result.created };
}

/** Bài vừa tạo (Tạo bài → Lưu bài): đánh dấu chờ tự tải lên nếu đã bật. */
export async function markNewLesson(app, lessonId) {
  if (!app.settings.githubAutoUpload || !githubReady(app)) return;
  await app.setSetting('githubPending', [...new Set([...(app.settings.githubPending ?? []), lessonId])]);
}

/** Tự tải lên một bài nếu cần: bài mới đang chờ, hoặc bài đã trong thư viện mà nội dung / ảnh đổi. Lỗi chỉ báo nhẹ. */
export async function autoUploadIfNeeded(app, lessonId) {
  if (!app.settings.githubAutoUpload || !githubReady(app)) return;
  const lesson = await app.db.get('lessons', lessonId).catch(() => null);
  if (!lesson) {
    if ((app.settings.githubPending ?? []).includes(lessonId)) await app.setSetting('githubPending', app.settings.githubPending.filter((id) => id !== lessonId));
    return;
  }
  const pending = (app.settings.githubPending ?? []).includes(lessonId);
  const prev = app.settings.githubUploads?.[lessonId];
  if (!pending && !(prev && prev.sig !== await lessonSig(app, lesson))) return;
  try {
    const r = await uploadLesson(app, lesson, { auto: true });
    if (r) toast(`☁️ Đã tự tải "${lesson.title}" lên Thư viện bài (${r.file}).`, 3500);
  } catch (err) {
    toast(`⚠️ Chưa tự tải được "${lesson.title}" lên GitHub: ${errorText(err)}`, 5000);
  }
}

/** Rời trang chi tiết bài: hẹn tự tải lên sau 15 giây (vào lại đúng bài này thì hủy). */
export function scheduleAutoUpload(app, lessonId) {
  clearTimeout(timers.get(lessonId));
  if (!app.settings.githubAutoUpload || !githubReady(app)) return;
  timers.set(lessonId, setTimeout(() => {
    timers.delete(lessonId);
    autoUploadIfNeeded(app, lessonId);
  }, scaled(AUTO_DELAY_MS)));
}
export const cancelAutoUpload = (lessonId) => {
  clearTimeout(timers.get(lessonId));
  timers.delete(lessonId);
};

/** Mở Quản lý bài: tải ngay các bài mới còn chờ (bố mẹ đã rời trang bài). */
export async function flushPendingUploads(app) {
  for (const id of app.settings.githubPending ?? []) if (!timers.has(id)) await autoUploadIfNeeded(app, id);
}

/** Nút "Tải lên Thư viện bài (GitHub)" trong Chia sẻ bài. */
export function githubUploadButton(app, lesson, status) {
  const linkBox = h('div');
  const done = app.settings.githubUploads?.[lesson.id];
  const btn = h('button.btn', {
    type: 'button',
    text: done ? '☁️ Cập nhật trên Thư viện bài' : '☁️ Tải lên Thư viện bài (GitHub)',
    hidden: !githubReady(app),
    onclick: async () => {
      if (!done && !await confirmDialog(`Tải bài "${lesson.title}" lên Thư viện bài? Repo GitHub công khai: ai cũng tải được. Chỉ tải bài không có ảnh người thật (ảnh gia đình, ảnh bé).`, { okText: 'Tải lên' })) return;
      btn.disabled = true;
      status.textContent = 'Đang tải lên GitHub…';
      try {
        const r = await uploadLesson(app, lesson);
        if (!r) {
          status.textContent = 'Chưa tải lên.';
          return;
        }
        status.textContent = `Đã tải lên ${r.file}. Khoảng 1–2 phút nữa bài hiện trong 📚 Thư viện bài trên mọi máy.`;
        const link = zipImportLink(r.file);
        linkBox.replaceChildren(h('div.row', {},
          h('input', { type: 'text', value: link, readOnly: true, 'aria-label': 'Link nhập bài GitHub' }),
          h('button.btn.small', { type: 'button', text: 'Copy link', onclick: () => copyText(link).then((ok) => toast(ok ? 'Đã copy link nhập bài.' : 'Không copy được.')) })));
      } catch (err) {
        status.textContent = `⚠️ ${errorText(err)}`;
      } finally {
        btn.disabled = false;
      }
    },
  });
  return { btn, linkBox };
}

/** Cài đặt → GitHub: repo, token (ô mật khẩu), kiểm tra, tự tải lên. */
export function githubSettingsSection(app) {
  const status = h('p.muted');
  const repo = h('input', { type: 'text', value: githubRepo(app), placeholder: 'owner/repo', 'aria-label': 'Repo GitHub', autocomplete: 'off' });
  const token = h('input', {
    type: 'password', value: app.settings.githubToken ?? '', placeholder: 'github_pat_…', 'aria-label': 'Token GitHub', autocomplete: 'off',
  });
  const auto = h('input', { type: 'checkbox', checked: Boolean(app.settings.githubAutoUpload), 'aria-label': 'Tự tải lên Thư viện bài' });
  const save = async () => {
    const r = parseRepo(repo.value);
    if (!r) {
      toast('Repo phải có dạng owner/repo, ví dụ HanhTran2410/kid-english.', 4000);
      return false;
    }
    await app.setSetting('githubRepo', r === defaultRepo() ? null : r);
    await app.setSetting('githubToken', token.value.trim());
    return true;
  };
  repo.addEventListener('change', save);
  token.addEventListener('change', save);
  auto.addEventListener('change', () => app.setSetting('githubAutoUpload', auto.checked));
  const check = h('button.btn', {
    type: 'button', text: 'Kiểm tra',
    onclick: async () => {
      if (!await save()) return;
      if (!token.value.trim()) {
        status.textContent = 'Chưa dán token.';
        return;
      }
      status.textContent = 'Đang kiểm tra…';
      try {
        const r = await checkAccess(token.value.trim(), githubRepo(app));
        status.textContent = r.canWrite
          ? `✅ Dùng được: tải lên ${r.repo}/${SHARED_PATH}.${r.private ? ' (Repo riêng tư — trang app trên GitHub Pages vẫn công khai.)' : ''}`
          : `⚠️ Token đọc được ${r.repo} nhưng không có quyền ghi. Sửa token: Contents → Read and write.`;
      } catch (err) {
        status.textContent = `⚠️ ${errorText(err)}`;
      }
    },
  });
  return section('GitHub — Thư viện bài',
    h('p', { text: 'Tải bài lên Thư viện bài (📚 trong Quản lý bài) bằng một nút bấm, không cần lên github.com. Cần một "token" GitHub, tạo một lần:' }),
    h('ol.field-hint', {},
      h('li', { text: 'github.com → ảnh đại diện → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.' }),
      h('li', { text: 'Repository access: Only select repositories → chọn đúng repo của app.' }),
      h('li', { text: 'Permissions → Repository permissions → Contents: Read and write (chỉ quyền này). Hạn dùng tùy bạn.' }),
      h('li', { text: 'Generate token → copy → dán vào ô Token dưới đây → Kiểm tra.' })),
    field('Repo', repo),
    field('Token', token, 'Chỉ lưu trên máy này, không nằm trong file sao lưu / file chia sẻ. Ai mở được Góc bố mẹ trên máy này cũng tải lên được — chỉ dán token trên máy của bạn.'),
    h('div.actions', {}, check),
    status,
    h('label.check', {}, auto, h('span', { text: ' Tự tải lên Thư viện bài khi tạo bài mới, và khi sửa / thêm ảnh cho bài đã có trong thư viện' })),
    notice('warn', 'Repo công khai: ai cũng tải được bài trong thư viện. Không tải bài có ảnh người thật (ảnh gia đình, ảnh bé).'));
}
