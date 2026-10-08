// Nghe lại giọng bé: lọc, nghe, xóa từng bản, chọn nhiều / chọn tất cả (SPEC 4.6).

import { h, confirmDialog, formatBytes, formatDateTime, toast } from '../../ui.js';
import { listLessons, filterRecordings, deleteRecordings, recordingStats } from '../../db.js';
import { parentLayout, goParent, section } from './common.js';

const DAY = 86400000;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Khoảng ngày theo lựa chọn của bộ lọc. */
function dateRange(preset, olderDays, from, to) {
  const now = Date.now();
  switch (preset) {
    case 'today': return { from: startOfToday() };
    case '7': return { from: now - 7 * DAY };
    case '30': return { from: now - 30 * DAY };
    case 'older': return { to: now - (Number(olderDays) || 30) * DAY };
    case 'custom': return {
      from: from ? new Date(`${from}T00:00:00`).getTime() : undefined,
      to: to ? new Date(`${to}T23:59:59`).getTime() : undefined,
    };
    default: return {};
  }
}

export function recordingsView(app) {
  const body = parentLayout(app, { title: 'Nghe lại giọng bé', back: () => goParent(app) });
  let all = [];
  let lessons = [];
  let shown = [];
  let selecting = false;
  const selected = new Set();
  let player = null;

  const stats = h('p.stats');
  const lessonSel = h('select');
  const wordSel = h('select');
  const presetSel = h('select', {},
    ...[['all', 'Mọi ngày'], ['today', 'Hôm nay'], ['7', '7 ngày qua'], ['30', '30 ngày qua'], ['older', 'Cũ hơn … ngày'], ['custom', 'Tự chọn ngày']]
      .map(([v, t]) => h('option', { value: v, text: t })));
  const olderInput = h('input', { type: 'number', min: '1', value: '30', hidden: true, 'aria-label': 'Số ngày' });
  const fromInput = h('input', { type: 'date', hidden: true, 'aria-label': 'Từ ngày' });
  const toInput = h('input', { type: 'date', hidden: true, 'aria-label': 'Đến ngày' });
  const list = h('ul.rec-list');
  const selectToggle = h('button.btn', { type: 'button', text: 'Chọn nhiều' });
  const selectAll = h('button.btn', { type: 'button', text: 'Chọn tất cả', hidden: true });
  const deleteSelected = h('button.btn.danger', { type: 'button', text: 'Xóa (0)', hidden: true });

  const lessonTitle = (id) => lessons.find((l) => l.id === id)?.title ?? '(bài đã xóa)';

  function render() {
    olderInput.hidden = presetSel.value !== 'older';
    fromInput.hidden = toInput.hidden = presetSel.value !== 'custom';
    shown = filterRecordings(all, {
      lessonId: lessonSel.value || undefined,
      word: wordSel.value || undefined,
      ...dateRange(presetSel.value, olderInput.value, fromInput.value, toInput.value),
    });
    const total = recordingStats(all);
    stats.textContent = `${total.count} bản ghi · ${formatBytes(total.bytes)}` + (shown.length !== all.length ? ` — đang hiện ${shown.length}` : '');
    for (const id of [...selected]) if (!shown.some((r) => r.id === id)) selected.delete(id);
    selectAll.hidden = deleteSelected.hidden = !selecting;
    selectToggle.textContent = selecting ? 'Xong' : 'Chọn nhiều';
    deleteSelected.textContent = `Xóa (${selected.size})`;
    deleteSelected.disabled = selected.size === 0;

    list.replaceChildren(...shown.map((r) => {
      const box = selecting ? h('input', {
        type: 'checkbox',
        checked: selected.has(r.id),
        'aria-label': 'Chọn',
        onchange: (e) => {
          if (e.target.checked) selected.add(r.id);
          else selected.delete(r.id);
          render();
        },
      }) : null;
      return h('li.rec-row', {},
        box,
        h('button.btn.icon', { type: 'button', text: '▶️', 'aria-label': `Nghe ${r.word}`, onclick: () => play(r) }),
        h('span.grow', {}, h('b', { text: r.word }), h('span.muted', { text: ` · ${lessonTitle(r.lessonId)}` }),
          h('br'), h('span.muted', { text: `${formatDateTime(r.date)} · ${(r.durationMs / 1000).toFixed(1)} giây` })),
        h('button.btn.icon', { type: 'button', text: '🗑️', 'aria-label': `Xóa ${r.word}`, onclick: () => remove([r.id]) }));
    }));
    if (!shown.length) list.append(h('li.muted', { text: all.length ? 'Không có bản ghi nào khớp bộ lọc.' : 'Chưa có bản ghi nào.' }));
  }

  function play(r) {
    if (player) {
      player.pause();
      URL.revokeObjectURL(player.src);
    }
    player = new Audio(URL.createObjectURL(r.blob));
    player.play().catch(() => toast('Máy không phát được bản ghi này.'));
  }

  async function remove(ids) {
    const firstLesson = shown.find((r) => ids.includes(r.id))?.lessonId;
    const sameLesson = ids.every((id) => shown.find((r) => r.id === id)?.lessonId === firstLesson);
    const where = lessonSel.value && sameLesson ? ` của bài ${lessonTitle(firstLesson)}` : '';
    const ok = await confirmDialog(`Xóa ${ids.length} bản ghi${where}?`, { okText: 'Xóa', danger: true });
    if (!ok) return;
    await deleteRecordings(app.db, ids);
    for (const id of ids) selected.delete(id);
    all = all.filter((r) => !ids.includes(r.id));
    toast(`Đã xóa ${ids.length} bản ghi.`);
    render();
  }

  selectToggle.addEventListener('click', () => {
    selecting = !selecting;
    selected.clear();
    render();
  });
  selectAll.addEventListener('click', () => {
    for (const r of shown) selected.add(r.id);
    render();
  });
  deleteSelected.addEventListener('click', () => selected.size && remove([...selected]));
  for (const el of [lessonSel, wordSel, presetSel, olderInput, fromInput, toInput]) el.addEventListener('change', render);

  body.append(
    section(null, stats,
      h('div.filters', {},
        h('label', {}, 'Bài: ', lessonSel),
        h('label', {}, 'Từ: ', wordSel),
        h('label', {}, 'Ngày: ', presetSel), olderInput, fromInput, toInput),
      h('div.actions', {}, selectToggle, selectAll, deleteSelected)),
    section(null, list));

  (async () => {
    [all, lessons] = await Promise.all([app.db.getAll('recordings'), listLessons(app.db)]);
    lessonSel.replaceChildren(h('option', { value: '', text: 'Tất cả' }),
      ...lessons.map((l) => h('option', { value: l.id, text: l.title })));
    const words = [...new Set(all.map((r) => r.word))].sort();
    wordSel.replaceChildren(h('option', { value: '', text: 'Tất cả' }), ...words.map((w) => h('option', { value: w, text: w })));
    render();
  })();

  return () => {
    if (player) {
      player.pause();
      URL.revokeObjectURL(player.src);
    }
  };
}
