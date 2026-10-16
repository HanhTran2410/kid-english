// Trò Tô màu (SPEC-coloring.md): dữ liệu hình, câu nói, chọn việc, đọc màu đã lưu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COLORS, COLOR_BY_ID, GROUPS, PICTURES, PICTURE_BY_ID, picturesIn, cleanColors, isComplete, pickRequest, applyColor, pictureSvg,
  introSentence, pickSentence, requestSentence, nextRequestSentence, paintedSentence, trySentence, doneSentence,
} from '../../app/js/coloring.js';

const color = (id) => COLOR_BY_ID.get(id);
const partOf = (picId, partId) => PICTURE_BY_ID.get(picId).parts.find((p) => p.id === partId);

test('10 màu có tên tiếng Anh / Việt; 4 nhóm: 5 con vật, 6 đồ vật, số 1–10, chữ A–Z', () => {
  assert.equal(COLORS.length, 10);
  assert.ok(COLORS.every((c) => c.en && c.vi && /^#[0-9a-f]{6}$/.test(c.hex)));
  assert.deepEqual(GROUPS.map((g) => g.id), ['animals', 'things', 'numbers', 'letters']);
  assert.equal(picturesIn('animals').length, 5);
  assert.equal(picturesIn('things').length, 6);
  assert.equal(picturesIn('numbers').length, 10);
  assert.equal(picturesIn('letters').length, 26);
});

test('mọi hình: mã không trùng, có phần, phần có tên en / vi, màu giao việc nằm trong hộp màu và không phải trắng', () => {
  assert.equal(new Set(PICTURES.map((p) => p.id)).size, PICTURES.length);
  for (const pic of PICTURES) {
    assert.ok(pic.en && pic.vi && pic.group, pic.id);
    assert.ok(pic.parts.length >= 1, pic.id);
    assert.equal(new Set(pic.parts.map((p) => p.id)).size, pic.parts.length, `${pic.id}: trùng mã phần`);
    for (const p of pic.parts) {
      assert.ok(p.en && p.vi && p.shapes, `${pic.id}.${p.id}`);
      assert.ok(p.colors.length >= 1, `${pic.id}.${p.id}`);
      assert.ok(p.colors.every((c) => COLOR_BY_ID.has(c) && c !== 'white'), `${pic.id}.${p.id}: ${p.colors}`);
    }
  }
});

test('số có đúng số ngôi sao; chữ cái có chữ hoa + chữ thường', () => {
  for (let n = 1; n <= 10; n++) {
    const svg = pictureSvg(PICTURE_BY_ID.get(`number-${n}`));
    const stars = svg.match(/data-part="stars"[^>]*>(.*?)<\/g>/)[1];
    assert.equal(stars.match(/<polygon/g).length, n, `số ${n}`);
  }
  assert.equal(partOf('number-3', 'stars').en, 'three stars');
  assert.equal(partOf('number-1', 'stars').en, 'star');
  const a = PICTURE_BY_ID.get('letter-a');
  assert.deepEqual(a.parts.map((p) => p.en), ['big A', 'small a']);
  assert.deepEqual(a.parts.map((p) => p.vi), ['chữ A hoa', 'chữ a thường']);
});

test('câu nói: giao việc, tô (is / are), đếm sao, thử màu khác, xong hình — có phụ đề tiếng Việt', () => {
  const wings = partOf('butterfly', 'wings');
  const body = partOf('butterfly', 'body');
  assert.deepEqual(requestSentence(wings, color('pink')), ['Color the wings pink!', 'Tô màu hồng cho cái cánh!']);
  assert.deepEqual(nextRequestSentence(body, color('black')), ['Now color the body black!', 'Giờ tô màu đen cho cái thân!']);
  assert.deepEqual(paintedSentence(wings, color('pink')), ['The wings are pink!', 'Cái cánh màu hồng!']);
  assert.deepEqual(paintedSentence(body, color('black')), ['The body is black!', 'Cái thân màu đen!']);
  assert.deepEqual(paintedSentence(partOf('number-3', 'stars'), color('yellow')), ['One, two, three! The three stars are yellow!', '3 ngôi sao màu vàng!']);
  assert.deepEqual(paintedSentence(partOf('number-1', 'stars'), color('red')), ['The star is red!', 'Ngôi sao màu đỏ!']);
  assert.deepEqual(pickSentence(color('green')), ['Green!', 'Màu xanh lá!']);
  assert.deepEqual(trySentence(color('pink')), ['Now try pink!', 'Giờ thử màu hồng nhé!']);
  const fly = PICTURE_BY_ID.get('butterfly');
  assert.deepEqual(introSentence(fly), ["Let's color the butterfly!", 'Mình tô con bướm nhé!']);
  assert.deepEqual(doneSentence(fly), ['Wow! A beautiful butterfly!', 'Con bướm đẹp quá!']);
});

test('chọn việc: ưu tiên phần chưa tô, không giao phần đã giao, màu khác màu đang có, giao hết thì null', () => {
  const fly = PICTURE_BY_ID.get('butterfly');
  const first = () => 0;
  const asked = new Set();
  // Đã tô cánh: việc đầu là phần chưa tô (râu là phần đầu tiên chưa tô).
  let r = pickRequest(fly, { wings: 'pink' }, asked, first);
  assert.equal(r.part.id, 'antennae');
  // Chỉ còn cánh chưa giao (đã tô hồng) → màu khác hồng.
  r = pickRequest(fly, { wings: 'pink', antennae: 'black', body: 'black', head: 'black' }, new Set(['antennae', 'body', 'head']), first);
  assert.equal(r.part.id, 'wings');
  assert.notEqual(r.color.id, 'pink');
  // Phần chỉ có một màu hợp lý và đã tô màu đó (chân bọ rùa đã đen): không giao nữa → hết việc thì null (tô tự do).
  const bug = PICTURE_BY_ID.get('ladybug');
  assert.equal(pickRequest(bug, { legs: 'black' }, new Set(['head', 'shell', 'spots']), first), null);
  r = pickRequest(bug, { legs: 'black' }, new Set(), () => 0.99);
  assert.notEqual(r.part.id, 'legs');
  assert.equal(pickRequest(fly, {}, new Set(fly.parts.map((p) => p.id))), null);
  // Lá cây đã xanh lá: không bao giờ bảo tô lá xanh lá lần nữa.
  const tree = PICTURE_BY_ID.get('tree');
  for (let i = 0; i < 20; i++) assert.notEqual(pickRequest(tree, { leaves: 'green' }, new Set()).part.id, 'leaves');
});

test('màu trắng là tẩy: phần về "chưa tô"; màu khác thì lưu', () => {
  assert.deepEqual(applyColor({ wings: 'pink' }, 'body', 'black'), { wings: 'pink', body: 'black' });
  assert.deepEqual(applyColor({ wings: 'pink', body: 'black' }, 'wings', 'white'), { body: 'black' });
  assert.deepEqual(applyColor({}, 'wings', 'white'), {});
});

test('màu đã lưu: bỏ mã phần / mã màu lạ; xong hình khi mọi phần có màu khác trắng', () => {
  const fly = PICTURE_BY_ID.get('butterfly');
  assert.deepEqual(cleanColors(fly, { wings: 'pink', tail: 'red', body: 'gold', head: 'black', antennae: 'white' }), { wings: 'pink', head: 'black' });
  assert.deepEqual(cleanColors(fly, null), {});
  assert.deepEqual(cleanColors(fly, 'hỏng'), {});
  const all = { antennae: 'black', wings: 'pink', body: 'black', head: 'black' };
  assert.equal(isComplete(fly, all), true);
  assert.equal(isComplete(fly, { ...all, body: 'white' }), false);
  assert.equal(isComplete(fly, { wings: 'pink' }), false);
});

test('SVG: mỗi phần một nhóm data-part có màu đã tô (chưa tô là giấy trắng); phần nét tô màu nét', () => {
  const svg = pictureSvg(PICTURE_BY_ID.get('butterfly'), { wings: 'pink', antennae: 'black' });
  assert.match(svg, /data-part="wings" data-color="pink"[^>]*style="fill:#f9a8d4"/);
  assert.match(svg, /data-part="body" data-color=""[^>]*style="fill:#ffffff"/);
  assert.match(svg, /data-part="antennae"[^>]*>.*class="cl-ink"[^>]*style="stroke:#3f3f46"/);
  assert.match(svg, /class="cl-detail" pointer-events="none"/);
});
