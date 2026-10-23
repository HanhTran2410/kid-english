// Góc bố mẹ → Quản lý bài → 📚 Thư viện bài (SPEC-drive.md mục 8): các file bài để sẵn trên GitHub (app/shared/),
// mỗi bài một nút "Nhập" (tải thẳng từ trang app, không cần đăng nhập) và "Copy link" (link nhập bài để gửi người khác).

import { h, toast, copyText, formatBytes } from '../../ui.js';
import { listLessons } from '../../db.js';
import { SHARED_DIR, SHARED_INDEX, downloadZip, zipImportLink, LinkError } from '../../link-import.js';

/**
 * @param {(file: File) => Promise<void>} importFile cách nhập giống "Nhập bài từ file"
 * @returns {{ btn: HTMLElement, box: HTMLElement }}
 */
export function sharedLibrary(app, importFile) {
  const box = h('div.shared-library', { hidden: true });
  const btn = h('button.btn', {
    type: 'button',
    text: '📚 Thư viện bài',
    onclick: () => {
      box.hidden = !box.hidden;
      if (!box.hidden && !box.childElementCount) load();
    },
  });

  async function load() {
    box.replaceChildren(h('p.muted', { text: 'Đang tải danh sách bài…' }));
    let index;
    try {
      const res = await fetch(SHARED_INDEX, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      index = await res.json();
    } catch {
      box.replaceChildren(h('p.muted', { text: '⚠️ Không tải được thư viện bài. Cần có mạng (thư viện nằm trên trang của app, không lưu offline).' }));
      return;
    }
    const have = new Set((await listLessons(app.db).catch(() => [])).map((l) => String(l.title).trim().toLowerCase()));
    const files = Array.isArray(index?.files) ? index.files : [];
    if (!files.length) {
      box.replaceChildren(h('p.muted', { text: 'Thư viện chưa có bài nào.' }));
      return;
    }
    box.replaceChildren(
      h('p.muted', { text: `${files.length} file. Bấm "Nhập" để thêm vào máy này; "Copy link" để gửi cho người khác (mở link là app điền sẵn).` }),
      h('ul.shared-list', {}, ...files.map((f) => {
        const owned = f.lessons > 0 && String(f.title).split(', ').every((t) => have.has(t.trim().toLowerCase()));
        const status = h('span.muted.shared-status', { text: owned ? '✓ Đã có' : '' });
        const importBtn = h('button.btn.small.primary', {
          type: 'button', text: 'Nhập',
          onclick: async () => {
            importBtn.disabled = true;
            status.textContent = 'Đang tải…';
            try {
              const { name, blob } = await downloadZip(new URL(`${SHARED_DIR}${f.file}`, location.href).href);
              status.textContent = '';
              await importFile(new File([blob], name, { type: 'application/zip' }));
            } catch (err) {
              status.textContent = `⚠️ ${err instanceof LinkError ? err.message : 'Không nhập được.'}`;
            } finally {
              importBtn.disabled = false;
            }
          },
        });
        return h('li.shared-item', { dataset: { file: f.file } },
          h('span.p-emoji', { text: f.emoji ?? '📘' }),
          h('span.grow', {}, h('b', { text: f.title }),
            h('span.lesson-meta', { text: `${f.titleVi ? `${f.titleVi} · ` : ''}${f.kindVi ?? ''}${f.images ? ` · ${f.images} ảnh` : ''} · ${formatBytes(f.size ?? 0)}` })),
          status,
          importBtn,
          h('button.btn.small', {
            type: 'button', text: 'Copy link',
            onclick: () => copyText(zipImportLink(f.file)).then((ok) => toast(ok ? 'Đã copy link nhập bài.' : 'Không copy được.')),
          }));
      })));
  }

  return { btn, box };
}
