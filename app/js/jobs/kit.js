// Khung chung của các trò đóng vai nghề (SPEC-jobs.md mục 2; tách từ Bác sĩ nhí, SPEC-doctor.md):
// đầu màn (🏠 🎲 🧹, tên trò, số ca, Bông phụ giúp đội mũ theo nghề), sân khấu, hàng phụ đề có hình người nói, khay đồ
// kéo / chạm, đồ bay, nhắc sau 10 giây, mã lượt (epoch), lưu để chơi tiếp khi app ra nền, hoan hô + sticker, mức.
// Mỗi nghề chỉ viết dữ liệu + câu (file thuần) và phần vẽ / thao tác riêng.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';
import { createBunny, Teacher } from '../player/teacher.js';
import { runCompletion } from '../player/completion-stage.js';
import { scaled } from '../timing.js';

export const NUDGE_MS = 10_000;
export const MAX_NUDGES = 2;
export const WRONG_LOCK_MS = 400; // nhầm cùng một chỗ / cùng một đồ trong chừng này: gộp thành một lần nhầm
const DRAG_START_PX = 8;
const FLY_MS = 380;
const CAPTION_MS = 3500;
const IDLE_PAUSE_MS = 120_000;
const SNAPSHOT_MS = 10 * 60_000;

export const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
export const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, scaled(ms)));
export function restartAnim(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

export { cleanJobState, afterJobRound, afterSeen, ROUNDS_TO_LEVEL_UP } from './levels.js';

// ---------- Lưu để chơi tiếp khi app ra nền (mỗi nghề một bản) ----------
const snapshots = new Map();
export const saveSnap = (job, data) => snapshots.set(job, { ...data, savedAt: Date.now() });
export const clearSnap = (job) => snapshots.delete(job);
/** Bản lưu còn dùng được: màn được dựng lại sau khi ra nền, chưa quá 10 phút, cùng mức. */
export function takeSnap(job, { level, continueDirectly }) {
  const s = snapshots.get(job);
  return continueDirectly && s && Date.now() - s.savedAt < SNAPSHOT_MS && s.level === level ? s : null;
}

/**
 * Dựng màn chơi chung. `opts`:
 * - `job`, `className` (class của root), `title`, `helperLabel` (tên Bông), `cap` (mũ của Bông: 'nurse' | 'shop' | …);
 * - `icon(who)`: hình người nói ở phụ đề ('bong' → 🐰); `onTalk(who | null)`: ai đang nói (để nhân vật nhún);
 * - `onReset()` (🧹), `onHelper()` (chạm Bông);
 * - `nudge`: { ready(), key(), fire(rearm) } — nhắc sau 10 giây không thao tác;
 * - `tray`: { face(id), label(id), canGive(), dropOk(x, y), give(id, from) } — kéo / chạm đồ trong khay.
 */
export function jobScreen(app, opts) {
  const signal = app.startActivity();
  app.root.className = `child-screen jb-play ${opts.className}`;
  let epoch = 0;
  let talking = false;

  // ---------- Giao diện ----------
  const bunny = createBunny(app);
  const helper = h('button.sp-bong.jb-helper', {
    type: 'button', 'aria-label': opts.helperLabel ?? 'Bông',
    onclick: () => {
      play('tap');
      opts.onHelper?.();
    },
  }, bunny.el, h(`span.jb-cap.jb-cap-${opts.cap ?? 'nurse'}`, { 'aria-hidden': 'true' }));
  const back = h('button.sp-back', {
    type: 'button', 'aria-label': 'Chọn nghề', text: '🎲',
    onclick: () => {
      play('tap');
      app.go('jobs');
    },
  });
  const resetBtn = h('button.sp-back', {
    type: 'button', 'aria-label': opts.resetLabel ?? 'Chơi lại', text: '🧹',
    onclick: () => {
      play('tap');
      opts.onReset?.();
    },
  });
  const count = h('span.ms-count.jb-count');
  const stage = h(`div.jb-stage.${opts.stageClass ?? 'jb-stage-plain'}`);
  const sayBox = h('div.ms-say.jb-say');
  const trayEl = h('div.jb-tray.off', { 'aria-label': opts.trayLabel ?? 'Khay đồ' });
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), back, resetBtn, h('span.sp-title', { text: opts.title }), count, helper),
    stage, sayBox, trayEl,
  );

  // ---------- Nói + phụ đề (hàng riêng, có hình người nói) ----------
  let talkGen = 0;
  let captionTimer = null;
  function caption(en, vi, who) {
    clearTimeout(captionTimer);
    sayBox.replaceChildren(h('div.caption.sp-caption', { 'aria-live': 'polite', dataset: { who } },
      h('span.caption-en', {}, h('span.dr-who.jb-who', { text: opts.icon?.(who) ?? '🐰', 'aria-hidden': 'true' }), en),
      vi ? h('span.caption-vi', { text: vi }) : null));
  }
  /**
   * Một hàng nói: câu mới thay câu cũ. `lines`: [{ who, line: [en, vi] }]. Trả về false nếu bị thay / rời màn.
   * Giọng đọc lỗi thì vẫn đi tiếp (phụ đề vẫn hiện), bé không bị kẹt.
   */
  async function talk(lines) {
    const gen = ++talkGen;
    talking = true;
    try {
      for (const { who, line: [en, vi] } of lines) {
        if (gen !== talkGen || signal.aborted) return false;
        caption(en, vi, who);
        opts.onTalk?.(who);
        try {
          await app.speaker.speak(en, { signal });
        } catch {
          if (signal.aborted) return false;
        }
      }
    } finally {
      if (gen === talkGen) {
        talking = false;
        opts.onTalk?.(null);
      }
    }
    if (gen === talkGen) captionTimer = setTimeout(() => sayBox.replaceChildren(), CAPTION_MS);
    return gen === talkGen;
  }

  // ---------- Nhắc khi 10 giây không thao tác ----------
  let nudgeTimer = null;
  function clearNudge() {
    clearTimeout(nudgeTimer);
    nudgeTimer = null;
  }
  function armNudge() {
    clearNudge();
    const cfg = opts.nudge;
    if (!cfg?.ready()) return;
    const k = cfg.key();
    nudgeTimer = setTimeout(() => {
      if (k !== cfg.key() || !cfg.ready() || app.idlePaused || signal.aborted) return;
      // Đang nói: đếm lại — nhắc chỉ khi bé thật sự đang chờ.
      if (talking) {
        armNudge();
        return;
      }
      cfg.fire(() => k === cfg.key() && armNudge());
    }, scaled(NUDGE_MS));
  }

  // ---------- Đồ bay ----------
  const flying = new Set();
  function ghost(face, cls = '') {
    const g = h(`div.dr-fly.jb-fly${cls}`, {}, face);
    document.body.append(g);
    flying.add(g);
    return g;
  }
  /** Đồ bay từ `from` tới điểm `to` (tọa độ màn hình). Trả về phần tử đang bay (người gọi gỡ đi). */
  async function flyTo(face, from, to) {
    const g = ghost(face);
    Object.assign(g.style, { left: `${to.x}px`, top: `${to.y}px` });
    const ms = reduceMotion() ? 0 : scaled(FLY_MS);
    if (ms && from) {
      await g.animate([
        { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px)` },
        { transform: 'translate(0, 0)' },
      ], { duration: ms, easing: 'ease-in-out' }).finished.catch(() => {});
    }
    return g;
  }
  /** Đồ (đang bay / đang kéo) bay về chỗ của nó trong khay rồi biến mất. */
  async function flyBack(g, id) {
    const item = trayItem(id);
    const ms = reduceMotion() ? 0 : scaled(FLY_MS);
    if (item && ms) {
      const to = center(item.getBoundingClientRect());
      const from = center(g.getBoundingClientRect());
      await g.animate([{ transform: 'translate(0, 0)' }, { transform: `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(0.6)`, opacity: 0.4 }],
        { duration: ms, easing: 'ease-out' }).finished.catch(() => {});
    }
    removeGhost(g);
  }
  function removeGhost(g) {
    g?.remove();
    flying.delete(g);
  }

  // ---------- Khay: kéo / chạm đồ ----------
  let press = null;
  let dragGhost = null;
  const trayItem = (id) => trayEl.querySelector(`[data-item="${id}"]`);
  function renderTray(ids) {
    trayEl.classList.toggle('off', !ids.length);
    trayEl.replaceChildren(...ids.map((id) => {
      const btn = h('button.dr-item.jb-item', { type: 'button', 'aria-label': opts.tray.label(id), dataset: { item: id } }, opts.tray.face(id));
      btn.addEventListener('pointerdown', (e) => beginPress(e, id));
      return btn;
    }));
  }
  const setHint = (id) => {
    for (const el of trayEl.children) el.classList.toggle('hint', el.dataset.item === id);
  };
  function beginPress(e, id) {
    if (press || e.button > 0) return;
    e.preventDefault();
    press = { id, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, dragging: false };
  }
  function endDrag() {
    dragGhost?.remove();
    dragGhost = null;
    trayEl.querySelector('.lifted')?.classList.remove('lifted');
  }
  if (opts.tray) {
    window.addEventListener('pointermove', (e) => {
      if (!press || e.pointerId !== press.pointerId) return;
      if (!press.dragging) {
        if (Math.hypot(e.clientX - press.x0, e.clientY - press.y0) < DRAG_START_PX) return;
        press.dragging = true;
        play('tap');
        dragGhost = h('div.dr-fly.dr-drag.jb-fly', {}, opts.tray.face(press.id));
        document.body.append(dragGhost);
        trayItem(press.id)?.classList.add('lifted');
      }
      e.preventDefault();
      dragGhost.style.left = `${e.clientX}px`;
      dragGhost.style.top = `${e.clientY}px`;
    }, { signal, passive: false });

    window.addEventListener('pointerup', (e) => {
      if (!press || e.pointerId !== press.pointerId) return;
      const p = press;
      press = null;
      if (p.dragging) {
        const at = { x: e.clientX, y: e.clientY };
        const g = dragGhost;
        dragGhost = null;
        endDrag();
        // Thả vào chỗ nhận (người bạn thú / túi khách…): đưa; ra ngoài thì đồ về khay, không tính nhầm.
        if (opts.tray.dropOk(at.x, at.y) && opts.tray.canGive()) {
          g.remove();
          opts.tray.give(p.id, at);
        } else {
          flying.add(g);
          flyBack(g, p.id);
        }
        return;
      }
      const item = trayItem(p.id);
      if (item && opts.tray.canGive()) opts.tray.give(p.id, center(item.getBoundingClientRect()));
    }, { signal });

    window.addEventListener('pointercancel', (e) => {
      if (!press || e.pointerId !== press.pointerId) return;
      press = null;
      endDrag();
    }, { signal });
  }

  // Bé chạm bất cứ đâu: tính lại thời gian nhắc.
  app.root.addEventListener('pointerdown', () => armNudge(), { signal });
  const idleTimer = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  // ---------- Trạng thái, hủy việc cũ ----------
  /** Đổi trạng thái; `active` = đang chờ bé thao tác (khay sáng, nhận đồ). */
  function setState(s, active) {
    app.root.dataset.state = s;
    trayEl.classList.toggle('locked', !active);
  }
  /** Hủy mọi việc đang chạy (câu nói, nhắc, kéo dở, đồ đang bay) và đổi mã lượt: việc cũ không đụng vào việc mới. */
  function cancelAll() {
    epoch += 1;
    talkGen += 1;
    clearNudge();
    app.speaker.cancel?.();
    endDrag();
    press = null;
    for (const g of flying) g.remove();
    flying.clear();
  }

  /** Hoan hô + sticker (một lần), rồi về trang chọn nghề. Gọi `beforeCompletion` để ghi lượt. */
  async function finishRound(beforeCompletion) {
    cancelAll();
    beforeCompletion?.();
    renderTray([]);
    sayBox.replaceChildren();
    // Màn hoan hô cần cả chiều cao: ẩn hàng phụ đề + khay, sân khấu cuộn được (hộp quà, nút ✔ không bị che).
    app.root.classList.add('jb-done');
    const teacher = new Teacher(app, { signal, bunny, stage });
    try {
      await runCompletion({ app, teacher, stage, signal });
      if (!signal.aborted) app.go('jobs');
    } catch {
      // rời màn giữa chừng
    }
  }

  const extraCleanups = [];
  function cleanup() {
    cancelAll();
    clearInterval(idleTimer);
    clearTimeout(captionTimer);
    bunny.destroy();
    extraCleanups.forEach((fn) => fn());
  }

  return {
    signal, stage, sayBox, trayEl, count, bunny, helper,
    get epoch() { return epoch; },
    get talking() { return talking; },
    get pressing() { return Boolean(press); },
    talk, armNudge, clearNudge, setState, cancelAll, finishRound,
    renderTray, trayItem, setHint, flyTo, flyBack, removeGhost,
    onCleanup: (fn) => extraCleanups.push(fn),
    cleanup,
  };
}
