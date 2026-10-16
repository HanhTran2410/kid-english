// Góc bố mẹ → Đồ Mặc đồ (SPEC-dressup mục 11): thay ảnh từng món, ảnh lưới nhiều món, thêm đồ mới
// (dành cho bé trai / bé gái / cả hai), xóa đồ đã thêm.

import { h, toast, copyText, confirmDialog } from '../../ui.js';
import { setWordImage, removeWordImage } from '../../db.js';
import { resizeImage, cutOutSticker } from '../../image.js';
import {
  ITEMS, SLOTS, DRESS_IMAGES, KIDS, imageKey, itemIcon, itemBox, setCustomItems,
} from '../../dress-up.js';
import { loadDressImages } from '../dress-up.js';
import { parentLayout, goParent, section, notice, field } from './common.js';
import { gridSection, imageErrorMessage } from './lessons.js';

const KID_VI = { boy: 'Bé trai', girl: 'Bé gái' };
const GRID_GROUP = 9; // ảnh lưới 3 × 3: AI vẽ đúng hơn lưới lớn

/** Phần thêm vào prompt ảnh đồ: chỉ vẽ món đồ (không người), viền đậm, nền trắng để app tự cắt nền. */
export const CLOTHING_PROMPT_NOTE = [
  '',
  "CLOTHING RULES (children's paper-doll dress-up game; the app cuts each picture out of its white background)",
  '- Draw ONLY the clothing item or accessory itself, front view, laid flat and upright: no person, no mannequin, no hanger, no body parts.',
  '- It fills most of its cell, centered, with a continuous thick dark outline all around it.',
  '- Pairs (shoes, socks, boots, sandals) are drawn as a pair side by side.',
  '- Pure flat white (#FFFFFF) background: no shadow, no scenery, no frame.',
].join('\n');

/** Hình dạng ảnh nên vẽ, theo khung đặt món đồ trên người bạn nhỏ. */
function shapeHint(item) {
  const [, , w, h] = itemBox(item);
  const r = w / h;
  if (r > 1.6) return 'a wide landscape image (about 5:2)';
  if (r > 1.15) return 'a landscape image (about 4:3)';
  if (r < 0.6) return 'a tall portrait image (about 1:2)';
  if (r < 0.87) return 'a portrait image (about 3:4)';
  return 'a square image';
}

export const clothingPrompt = (item) => `One ${item.name} for a children's paper-doll dress-up game for a 3-year-old: cute simple flat vector style, bright gentle colors, ${shapeHint(item)}.${CLOTHING_PROMPT_NOTE.replace('in its cell', 'in the image').replace('its cell', 'the image')}`;

export function dressAdminView(app) {
  const body = parentLayout(app, { title: 'Đồ Mặc đồ', back: () => goParent(app) });
  const reload = () => goParent(app, 'dress');
  const urls = [];
  let images = null;

  loadDressImages(app).then((loaded) => {
    images = loaded;
    body.append(
      notice('info', 'Đồ có sẵn là hình vẽ, bé chơi được ngay. Muốn đẹp hơn: thay ảnh từng món (Copy prompt → AI vẽ → Chọn ảnh) hoặc vẽ nhiều món một lần bằng ảnh lưới. App tự bỏ nền trắng và đặt món đồ vừa chỗ trên người bạn nhỏ. Có thể thêm đồ mới cho bé trai, bé gái hoặc cả hai.'),
      addSection(app, reload),
      ...groups().map(([title, items]) => itemsSection(app, title, items, images.map, reload)),
      ...gridSections(app, urls, reload),
    );
  });
  return () => {
    images?.revoke();
    urls.forEach((u) => URL.revokeObjectURL(u));
  };
}

/** Nhóm đồ theo bé: riêng bé gái, riêng bé trai, dùng chung. */
function groups() {
  const only = (kid) => ITEMS.filter((it) => it.kids.length === 1 && it.kids[0] === kid);
  return [
    ['👧 Đồ riêng bé gái', only('girl')],
    ['👦 Đồ riêng bé trai', only('boy')],
    ['👫 Đồ dùng chung', ITEMS.filter((it) => it.kids.length === KIDS.length)],
  ];
}

function itemsSection(app, title, items, map, reload) {
  return section(`${title} (${items.length} món)`, h('div.sp-admin-items', {}, ...items.map((item) => {
    const key = imageKey(item);
    const has = map.has(key);
    const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      try {
        const small = await resizeImage(file);
        await setWordImage(app.db, { lessonId: DRESS_IMAGES, word: item.name, ...await cutOutSticker(small.blob) });
        toast(`Đã lưu ảnh ${item.name}.`);
        reload();
      } catch (err) {
        toast(imageErrorMessage(err), 4000);
      }
    });
    return h('div.sp-admin-item', { dataset: { item: item.id } },
      h('span.du-admin-face.checker', { html: itemIcon(item, map) }),
      h('span', { text: item.name }),
      h('span.muted', { text: `${item.vi}${item.custom ? ' · đồ đã thêm' : ''}` }),
      h('button.btn.small', {
        type: 'button',
        text: 'Copy prompt',
        onclick: () => copyText(clothingPrompt(item)).then((ok) => toast(ok ? 'Đã copy prompt.' : 'Không copy được.')),
      }),
      h('button.btn.small', { type: 'button', text: has ? 'Thay ảnh' : 'Chọn ảnh', onclick: () => input.click() }),
      has && !item.custom ? h('button.btn.small.danger', {
        type: 'button',
        text: 'Dùng hình vẽ',
        onclick: async () => {
          await removeWordImage(app.db, DRESS_IMAGES, item.name);
          reload();
        },
      }) : null,
      item.custom ? h('button.btn.small.danger', {
        type: 'button',
        text: 'Xóa món',
        onclick: async () => {
          if (!await confirmDialog(`Xóa món "${item.name}" khỏi tủ đồ?`, { danger: true, okText: 'Xóa' })) return;
          await app.setSetting('dressUpCustom', (app.settings.dressUpCustom ?? []).filter((c) => c.id !== item.id));
          await removeWordImage(app.db, DRESS_IMAGES, item.name);
          setCustomItems(app.settings.dressUpCustom);
          toast(`Đã xóa ${item.name}.`);
          reload();
        },
      }) : null,
      input);
  })));
}

/** Ảnh lưới: chia mọi món thành nhóm 9 món (3 × 3). */
function gridSections(app, urls, reload) {
  const out = [];
  for (let i = 0; i < ITEMS.length; i += GRID_GROUP) {
    const items = ITEMS.slice(i, i + GRID_GROUP);
    out.push(gridSection(app, { id: DRESS_IMAGES, words: items.map((it) => ({ en: it.name })) }, urls,
      `Ảnh lưới ${out.length + 1} — ${items.map((it) => it.name).join(', ')}`,
      { promptNote: `\n${CLOTHING_PROMPT_NOTE}`, process: (tile) => cutOutSticker(tile.blob), onSaved: reload, previewClass: 'checker' }));
  }
  return out;
}

/** Thêm đồ mới: tên Anh / Việt, chỗ mặc, dành cho ai, số nhiều, ảnh. */
function addSection(app, reload) {
  const name = h('input', { type: 'text', placeholder: 'ví dụ: raincoat, pajamas, tutu', autocomplete: 'off' });
  const vi = h('input', { type: 'text', placeholder: 'ví dụ: áo mưa', autocomplete: 'off' });
  const slot = h('select', {}, ...SLOTS.map((s) => h('option', { value: s.id, text: `${s.emoji} ${s.vi}` })));
  slot.value = 'top';
  const kids = h('select', {},
    h('option', { value: 'girl', text: '👧 Bé gái' }),
    h('option', { value: 'boy', text: '👦 Bé trai' }),
    h('option', { value: 'both', text: '👫 Cả hai' }));
  kids.value = 'both';
  const plural = h('input', { type: 'checkbox' });
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true });

  const draft = () => {
    const en = name.value.trim().replace(/\s+/g, ' ');
    return { name: en, vi: vi.value.trim(), slot: slot.value, kids: kids.value === 'both' ? [...KIDS] : [kids.value], plural: plural.checked };
  };
  const problem = (d) => {
    if (!d.name) return 'Nhập tên tiếng Anh của món đồ.';
    if (!/^[a-z][a-z '-]*$/i.test(d.name)) return 'Tên tiếng Anh chỉ gồm chữ cái (a–z), dấu cách, dấu gạch.';
    if (ITEMS.some((it) => imageKey(it) === imageKey(d))) return `Đã có món "${d.name}" trong tủ đồ.`;
    return '';
  };

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const d = draft();
    const err = problem(d);
    if (err) {
      toast(err, 4000);
      return;
    }
    try {
      const small = await resizeImage(file);
      const pic = await cutOutSticker(small.blob);
      await setWordImage(app.db, { lessonId: DRESS_IMAGES, word: d.name, ...pic });
      const item = { id: `c-${Date.now().toString(36)}`, ...d };
      await app.setSetting('dressUpCustom', [...(app.settings.dressUpCustom ?? []), item]);
      setCustomItems(app.settings.dressUpCustom);
      toast(`Đã thêm ${d.name} cho ${d.kids.map((k) => KID_VI[k]).join(' và ')}.`, 3500);
      reload();
    } catch (e) {
      toast(imageErrorMessage(e), 4000);
    }
  });

  return section('＋ Thêm đồ mới',
    field('Tên tiếng Anh (bé sẽ nghe "I\'m wearing a …!")', name),
    field('Tên tiếng Việt (phụ đề)', vi),
    field('Mặc ở đâu', slot, 'App đặt ảnh vào đúng chỗ này trên người bạn nhỏ. Mặc món mới thì món cũ cùng chỗ tự cởi ra.'),
    field('Dành cho', kids),
    h('label.check', {}, plural, h('span', { text: ' Tên số nhiều (như jeans, socks, boots) — bé nói "I\'m wearing …" không có "a"' })),
    h('div.actions', {},
      h('button.btn', {
        type: 'button',
        text: 'Copy prompt ảnh',
        onclick: () => {
          const d = draft();
          if (!d.name) {
            toast('Nhập tên tiếng Anh trước.');
            return;
          }
          copyText(clothingPrompt({ ...d, art: null, slot: d.slot })).then((ok) => toast(ok ? 'Đã copy prompt ảnh.' : 'Không copy được.'));
        },
      }),
      h('button.btn.primary', {
        type: 'button',
        text: 'Chọn ảnh & thêm vào tủ đồ',
        onclick: () => {
          const err = problem(draft());
          if (err) toast(err, 4000);
          else input.click();
        },
      })),
    input);
}

