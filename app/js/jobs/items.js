// Ảnh món của Đầu bếp nhí và Nông trại: bố mẹ nhờ AI vẽ ảnh lưới (Góc bố mẹ → Ảnh Đóng vai), app cắt từng ô, bỏ nền trắng,
// lưu theo mã món. Món chưa có ảnh vẫn dùng emoji / hình vẽ sẵn của app.

import { h } from '../ui.js';
import { mediaBlob } from '../db.js';

export const JOB_ITEM_IMAGES = 'jobs:items';

/** Món theo nghề: `id` là mã lưu ảnh, `en` tên trong prompt, `vi` tên hiện cho bố mẹ, `draw` cách vẽ. */
export const JOB_ITEMS = {
  chef: [
    { id: 'bread', en: 'bread', vi: 'bánh mì', draw: 'One square slice of soft white sandwich bread with a light-brown crust, lying flat, seen slightly from above.' },
    { id: 'cheese', en: 'cheese', vi: 'phô mai', draw: 'One thin square slice of yellow cheese with a few round holes, lying flat, seen slightly from above.' },
    { id: 'tomato', en: 'tomato', vi: 'cà chua', draw: 'One round slice of red tomato showing the seeds inside, lying flat, seen slightly from above.' },
    { id: 'lettuce', en: 'lettuce', vi: 'xà lách', draw: 'One wavy green lettuce leaf, lying flat, seen slightly from above.' },
    { id: 'fried-egg', en: 'fried egg', vi: 'trứng ốp', draw: 'One fried egg: white with a round yellow yolk in the middle, seen from above.' },
    { id: 'milk', en: 'milk', vi: 'sữa', draw: 'One glass bottle of white milk.' },
    { id: 'egg', en: 'egg', vi: 'quả trứng', draw: 'One whole raw chicken egg in its light-brown shell, standing upright.' },
    { id: 'spoon', en: 'spoon', vi: 'cái thìa', draw: 'One big wooden mixing spoon, diagonal.' },
    { id: 'strawberry', en: 'strawberry', vi: 'quả dâu', draw: 'One red strawberry with a green leafy top.' },
    { id: 'cherry', en: 'cherry', vi: 'quả anh đào', draw: 'One shiny red cherry with a short stem.' },
    { id: 'blueberry', en: 'blueberry', vi: 'quả việt quất', draw: 'One round dark-blue blueberry with a small star-shaped crown on top.' },
    { id: 'star', en: 'star', vi: 'ngôi sao', draw: 'One yellow five-pointed sugar star cake topping.' },
    { id: 'candle', en: 'candle', vi: 'cây nến', draw: 'One thin striped birthday candle with a small lit flame.' },
  ],
  farm: [
    { id: 'hay', en: 'hay', vi: 'cỏ khô', draw: 'One small rectangular bale of golden hay tied with two strings.' },
    { id: 'grass', en: 'grass', vi: 'cỏ tươi', draw: 'One bunch of fresh green grass.' },
    { id: 'carrot', en: 'carrot', vi: 'cà rốt', draw: 'One orange carrot with green leaves on top.' },
    { id: 'corn', en: 'corn', vi: 'ngô', draw: 'One yellow corn cob with green husk leaves.' },
    { id: 'apple', en: 'apple', vi: 'táo', draw: 'One red apple with a small green leaf.' },
    { id: 'seeds', en: 'seeds', vi: 'hạt', draw: 'One small open cloth sack full of brown grain seeds, a few seeds spilling out.' },
  ],
};

/** Con vật Nông trại: mỗi con 2 ảnh (mã `<con>-hungry` vào xin ăn, `<con>-happy` ăn xong), đứng cạnh nhau trong lưới 4 × 3. */
const FARM_ANIMAL_LOOKS = [
  ['cow', 'cow', 'con bò', 'a black-and-white spotted cow'],
  ['sheep', 'sheep', 'con cừu', 'a fluffy white sheep'],
  ['horse', 'horse', 'con ngựa', 'a brown horse with a dark mane'],
  ['chicken', 'hen', 'con gà mái', 'a white hen with a red comb'],
  ['pig', 'pig', 'con lợn', 'a pink pig'],
  ['duck', 'duck', 'con vịt', 'a yellow duck with an orange beak'],
];
export const FARM_ANIMAL_ITEMS = FARM_ANIMAL_LOOKS.flatMap(([id, en, vi, look]) => [
  { id: `${id}-hungry`, en: `${en} (hungry)`, vi: `${vi} — đói`, draw: `${look}, full body, standing and facing the viewer, looking HUNGRY: mouth in a small round "o", big hopeful eyes looking up.` },
  { id: `${id}-happy`, en: `${en} (happy)`, vi: `${vi} — no`, draw: `The SAME ${look} as in its hungry picture (identical colors, size and pose), now HAPPY and full: big smile, eyes curved shut with joy.` },
]);
export const FARM_ANIMAL_PROMPT_NOTE = [
  '',
  'FARM ANIMAL RULES (the app swaps the two pictures of each animal in the same spot, so they must match)',
  '- Each row shows two animals; each animal appears twice side by side: first hungry, then happy.',
  '- The two pictures of one animal are the SAME character: same colors, same size, same pose and position — only the face changes.',
  '- Full body, centered, feet near the bottom of the cell, never cropped. No food, no fence, no grass, no other animals.',
  '- Pure flat white (#FFFFFF) background: no shadow, no scenery, no frame.',
].join('\n');

/** Thêm vào prompt ảnh lưới: nền trắng để app tự cắt nền; chỉ vẽ món. */
export const JOB_ITEM_PROMPT_NOTE = [
  '',
  'GAME ITEM RULES (the app cuts each picture out of its white background; the child drags it onto a plate, a cake or to a farm animal)',
  '- Draw ONLY the item itself: no hands, no people, no animals, no plate, no table.',
  '- It fills most of its cell, centered, with a continuous thick dark outline all around it.',
  '- Pure flat white (#FFFFFF) background: no shadow, no scenery, no frame.',
].join('\n');

/** Ảnh món đã lưu: { get(id) → url | undefined, revoke() }. */
export async function loadJobItemImages(app) {
  const urls = new Map();
  for (const img of await app.db.getAllByIndex('images', 'lessonId', JOB_ITEM_IMAGES).catch(() => [])) {
    urls.set(img.word, URL.createObjectURL(mediaBlob(img)));
  }
  return { get: (id) => urls.get(id), revoke: () => urls.forEach((u) => URL.revokeObjectURL(u)) };
}

/** Hình một món: ảnh của bố mẹ nếu có, không thì emoji (`props.text`) hoặc hình vẽ sẵn (`props.html`). */
export function itemFace(pics, id, tag, props = {}) {
  const url = pics?.get(id);
  if (!url) return h(tag, props);
  const { text, html, ...rest } = props;
  return h(`${tag}.jb-pic`, rest, h('img', { src: url, alt: '', draggable: false }));
}
