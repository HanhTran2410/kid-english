// Góc bố mẹ — Hồ sơ của bé (SPEC-talk mục 3): tên đọc bằng tiếng Anh, tuổi, màu / món thích, gia đình.
// Chỉ lưu trên máy (cài đặt, đi cùng sao lưu), không gửi đi đâu.

import { h, toast } from '../../ui.js';
import { NUMBER_WORDS } from '../../numbers.js';
import { FAMILY, normalizeProfile } from '../../talk.js';
import { parentLayout, goParent, section, field } from './common.js';

const COLORS = ['red', 'blue', 'yellow', 'green', 'pink', 'purple', 'orange'];
const FOODS = ['apples', 'bananas', 'cookies', 'noodles', 'rice', 'ice cream', 'milk'];

export function profileView(app) {
  const body = parentLayout(app, { title: 'Hồ sơ của bé', back: () => goParent(app) });
  const p = normalizeProfile(app.settings.childProfile);

  const name = h('input', { type: 'text', value: p.name, placeholder: 'Ví dụ: Na, Bin, Mi', 'aria-label': 'Tên đọc bằng tiếng Anh', autocomplete: 'off' });
  const age = h('select', { 'aria-label': 'Tuổi' },
    h('option', { value: '', text: '— chưa chọn —' }),
    ...[2, 3, 4, 5, 6].map((n) => h('option', { value: String(n), text: `${n} tuổi (${NUMBER_WORDS[n]})`, selected: p.age === n })));
  const select = (label, list, value) => h('select', { 'aria-label': label },
    h('option', { value: '', text: '— không bắt buộc —' }),
    ...list.map((x) => h('option', { value: x, text: x, selected: value === x })));
  const color = select('Màu thích', COLORS, p.color);
  const food = select('Món thích', FOODS, p.food);
  const family = FAMILY.map((m) => h('label.check', {},
    h('input', { type: 'checkbox', value: m.id, checked: p.family.includes(m.id) }),
    h('span', { text: `${m.emoji} ${m.en} — ${m.vi}` })));

  const listen = h('button.btn', {
    type: 'button',
    text: '🔊 Nghe thử',
    onclick: () => {
      const n = name.value.trim();
      app.speaker.speak(n ? `My name is ${n}. Nice to meet you, ${n}!` : 'Tell me your name!').catch(() => {});
    },
  });
  const save = h('button.btn.primary', {
    type: 'button',
    text: 'Lưu',
    onclick: async () => {
      const chosen = family.map((l) => l.querySelector('input')).filter((i) => i.checked).map((i) => i.value);
      const profile = normalizeProfile({
        name: name.value, age: age.value ? Number(age.value) : null, color: color.value, food: food.value, family: chosen,
      });
      await app.setSetting('childProfile', profile);
      toast('Đã lưu hồ sơ của bé.');
    },
  });

  body.append(
    section('Bé tên là gì?',
      field('Tên đọc bằng tiếng Anh', name, 'Tên gọi để Bông đọc (không phải tên khai sinh): viết không dấu, ngắn — Na, Bin, Mi… Bấm "Nghe thử" để nghe giọng đọc tiếng Anh đọc tên, chưa hay thì đổi cách viết.'),
      h('div.actions', {}, listen)),
    section('Tuổi và sở thích',
      field('Tuổi', age, 'Bông hỏi "How old are you?" → bé trả lời "I\'m three!". Chưa chọn tuổi thì Bông bỏ câu hỏi tuổi.'),
      field('Màu thích (không bắt buộc)', color),
      field('Món thích (không bắt buộc)', food)),
    section('Gia đình', h('p.field-hint', { text: 'Bài "My family" chỉ hỏi về những người được chọn (Bông hiện hình và hỏi "Who is this?"). Không chọn ai thì dùng Mummy và Daddy.' }), ...family),
    section(null, h('div.actions', {}, save), h('p.field-hint', { text: 'Hồ sơ chỉ lưu trên máy này (có trong file sao lưu), không gửi đi đâu.' })),
  );
}
