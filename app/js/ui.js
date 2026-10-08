// Hàm dựng giao diện dùng chung.

/**
 * Tạo phần tử: h('button.big', { onclick, text: 'Hi' }, child1, child2)
 * props: class, text, html, style, dataset, on<event>, và mọi thuộc tính khác (aria-*, type, ...).
 */
export function h(tagSpec, props = {}, ...children) {
  const [tag, ...classes] = tagSpec.split('.');
  const el = document.createElement(tag || 'div');
  if (classes.length) el.classList.add(...classes);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.classList.add(...String(value).split(/\s+/).filter(Boolean));
    else if (key === 'text') el.textContent = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else if (key in el && typeof value !== 'string') el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

/**
 * Nút nhấn giữ: phải giữ `ms` mili giây mới kích hoạt, có vòng tiến độ (để bé không bấm nhầm).
 */
export function holdButton({ label, title, ms = 3000, className = '', onHold, onShortTap }) {
  const btn = h('button.hold-btn', {
    type: 'button', class: className, 'aria-label': title ?? label, title: title ?? '',
  }, h('span.hold-ring'), h('span.hold-label', { text: label }));
  btn.style.setProperty('--hold-ms', `${ms}ms`);
  let timer = null;
  let pressedAt = 0;
  const cancel = () => {
    clearTimeout(timer);
    timer = null;
    btn.classList.remove('holding');
  };
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pressedAt = Date.now();
    btn.classList.add('holding');
    timer = setTimeout(() => {
      cancel();
      pressedAt = 0;
      onHold();
    }, ms);
  });
  btn.addEventListener('pointerup', () => {
    // Bấm nhẹ (chưa giữ đủ lâu): nhắc cách mở.
    if (timer && pressedAt && Date.now() - pressedAt < 600) onShortTap?.();
    cancel();
  });
  for (const ev of ['pointerleave', 'pointercancel']) btn.addEventListener(ev, cancel);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  return btn;
}

/** Hình của một từ: ảnh nếu có, không thì emoji to. */
export function wordVisual(visual, className = '') {
  const box = h('div.visual', { class: className });
  if (visual?.url) box.append(h('img', { src: visual.url, alt: visual.word ?? '', draggable: 'false' }));
  else box.append(h('span.emoji', { text: visual?.emoji || '❓' }));
  return box;
}

/** Hiện ⭐ theo mastery (0–5). */
export function stars(n, max = 5) {
  return '⭐'.repeat(n) + '☆'.repeat(Math.max(0, max - n));
}

export function toast(message, ms = 2500) {
  const el = h('div.toast', { role: 'status', text: message });
  document.body.append(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, ms);
}

/**
 * Hộp thoại xác nhận cho bố mẹ.
 * @returns {Promise<boolean>}
 */
export function confirmDialog(message, { okText = 'Đồng ý', cancelText = 'Hủy', danger = false } = {}) {
  return new Promise((resolve) => {
    const close = (value) => {
      overlay.remove();
      resolve(value);
    };
    const overlay = h('div.dialog-overlay', {},
      h('div.dialog', { role: 'dialog', 'aria-modal': 'true' },
        h('p', { text: message }),
        h('div.dialog-actions', {},
          h('button.btn', { type: 'button', text: cancelText, onclick: () => close(false) }),
          h(`button.btn.${danger ? 'danger' : 'primary'}`, { type: 'button', text: okText, onclick: () => close(true) }),
        )));
    document.body.append(overlay);
  });
}

/** Định dạng dung lượng: 18 MB, 450 KB. */
export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "3 ngày trước", "hôm nay". */
export function timeAgo(ts, now = Date.now()) {
  if (!ts) return 'chưa học';
  const days = Math.floor((now - ts) / 86400000);
  if (days <= 0) return 'hôm nay';
  if (days === 1) return 'hôm qua';
  return `${days} ngày trước`;
}

export function formatDateTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Copy chữ vào bộ nhớ tạm, có cách dự phòng khi Clipboard API không dùng được. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = h('textarea', { style: { position: 'fixed', opacity: '0' } });
    area.value = text;
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}
