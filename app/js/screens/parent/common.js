// Khung chung cho các trang của Góc bố mẹ.

import { h } from '../../ui.js';

/**
 * @param {{ title: string, back?: () => void }} options back = null ở trang menu
 * @returns {HTMLElement} vùng nội dung
 */
export function parentLayout(app, { title, back }) {
  app.root.className = 'parent-screen';
  const body = h('div.parent-body');
  app.root.append(
    h('header.parent-top', {},
      back ? h('button.btn.back', { type: 'button', text: '← Quay lại', onclick: back }) : null,
      h('h1', { text: title })),
    body,
  );
  return body;
}

export const goParent = (app, view = 'menu', params = {}) => app.go('parent', { view, ...params });

export function section(title, ...children) {
  return h('section.panel', {}, title ? h('h2', { text: title }) : null, ...children);
}

export function notice(kind, ...children) {
  return h(`div.notice.${kind}`, {}, ...children);
}

/** Nút 🔊 nghe thử một câu. */
export function speakButton(app, text, lang = 'en') {
  return h('button.btn.icon', {
    type: 'button',
    'aria-label': `Nghe: ${text}`,
    title: 'Nghe thử',
    text: '🔊',
    onclick: () => app.speaker.speak(text, { lang }).catch(() => {}),
  });
}

export function field(label, control, hint) {
  return h('label.field', {}, h('span.field-label', { text: label }), control, hint ? h('span.field-hint', { text: hint }) : null);
}
