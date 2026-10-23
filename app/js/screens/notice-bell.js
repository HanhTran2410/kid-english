// Chuông thông báo 🔔 (SPEC-drive.md mục 10) ở màn hình chính và Góc bố mẹ: chỉ hiện khi có tin (bản app mới,
// bài mới / bài cập nhật trong Thư viện bài). Bấm chuông mở bảng: Cập nhật ngay; Nhập từng bài / Nhập hết; Để sau.

import { h, toast } from '../ui.js';
import { APP_VERSION } from '../app.js';
import { play } from '../speech/sfx.js';
import { BackupError } from '../backup.js';
import { SHARED_DIR, downloadZip, LinkError } from '../link-import.js';
import { notices, noticeCount, onNotices, markLibrarySeen, applyUpdate } from '../notices.js';
import { importPackage } from './parent/lessons.js';

const sizeText = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Tải một file trong thư viện về và nhập (như "Nhập bài từ file"). Trả về câu tóm tắt. */
async function importShared(app, f) {
  const { name, blob } = await downloadZip(new URL(`${SHARED_DIR}${f.file}`, location.href).href);
  const summary = await importPackage(app, new File([blob], name, { type: 'application/zip' }));
  await markLibrarySeen(app, f.file);
  return summary;
}
const errorText = (err) => (err instanceof LinkError || err instanceof BackupError ? err.message : 'Không nhập được bài này.');

/** Nút chuông (tự ẩn khi không có tin, tự cập nhật số khi có tin mới). */
export function noticeBell(app) {
  const badge = h('span.notice-badge');
  const btn = h('button.notice-bell', {
    type: 'button', 'aria-label': 'Thông báo', hidden: true,
    onclick: () => {
      play('tap');
      openPanel(app);
    },
  }, h('span.notice-icon', { text: '🔔', 'aria-hidden': 'true' }), badge);
  const render = () => {
    const n = noticeCount();
    btn.hidden = n === 0;
    badge.textContent = String(n);
    btn.setAttribute('aria-label', `Thông báo (${n})`);
  };
  render();
  // Màn hình đã đổi (chuông không còn trên trang): lần có tin sau thì tự gỡ người nghe.
  const off = onNotices(() => (btn.isConnected ? render() : off()));
  return btn;
}

/** Bảng thông báo (phủ trên màn hình hiện tại). */
function openPanel(app) {
  document.querySelector('.notice-panel-wrap')?.remove();
  const list = h('div.notice-list');
  const close = () => {
    wrap.remove();
    off();
  };
  const wrap = h('div.notice-panel-wrap', { onclick: (e) => { if (e.target === wrap) close(); } },
    h('div.notice-panel', { role: 'dialog', 'aria-label': 'Thông báo' },
      h('div.notice-head', {}, h('b', { text: '🔔 Thông báo' }),
        h('button.btn.small', { type: 'button', text: '✕', 'aria-label': 'Đóng', onclick: close })),
      list));
  const render = () => {
    const s = notices();
    const rows = [];
    if (s.update) {
      rows.push(h('div.notice-row.notice-update', {},
        h('span.grow', {}, h('b', { text: `Có bản mới ${s.update}` }), h('span.muted', { text: ` (đang dùng ${APP_VERSION})` })),
        h('button.btn.small.primary', {
          type: 'button', text: 'Cập nhật ngay',
          onclick: (e) => {
            e.currentTarget.disabled = true;
            e.currentTarget.textContent = 'Đang cập nhật…';
            applyUpdate(app);
          },
        })));
    }
    if (s.lessons.length) {
      rows.push(h('div.notice-sub', { text: `📚 Thư viện bài có ${s.lessons.length} bài mới / cập nhật:` }));
      for (const f of s.lessons) {
        const status = h('span.muted.notice-status');
        const btn = h('button.btn.small.primary', {
          type: 'button', text: f.updated ? 'Cập nhật' : 'Nhập',
          onclick: async () => {
            btn.disabled = true;
            status.textContent = 'Đang nhập…';
            try {
              toast(`${await importShared(app, f)}.`, 3500);
            } catch (err) {
              status.textContent = `⚠️ ${errorText(err)}`;
              btn.disabled = false;
            }
          },
        });
        rows.push(h('div.notice-row', { dataset: { file: f.file } },
          h('span.p-emoji', { text: f.emoji ?? '📘' }),
          h('span.grow', {}, h('b', { text: f.title }), h('span.muted', { text: ` · ${f.updated ? 'bản cập nhật · ' : ''}${f.kindVi ?? ''} · ${sizeText(f.size ?? 0)}` }), status),
          btn));
      }
      const all = h('button.btn.primary', {
        type: 'button', text: `Nhập hết (${s.lessons.length})`,
        onclick: async () => {
          all.disabled = true;
          let ok = 0;
          for (const f of [...notices().lessons]) {
            try {
              await importShared(app, f);
              ok++;
            } catch {
              // bài lỗi: vẫn để trong danh sách
            }
          }
          toast(`Đã nhập ${ok} bài từ Thư viện bài.`, 3500);
          all.disabled = false;
        },
      });
      rows.push(h('div.actions', {}, all,
        h('button.btn', { type: 'button', text: 'Để sau', onclick: () => markLibrarySeen(app).then(close) })));
    }
    if (!rows.length) rows.push(h('p.muted', { text: 'Không có thông báo mới.' }));
    list.replaceChildren(...rows);
  };
  const off = onNotices(render);
  render();
  document.body.append(wrap);
}
