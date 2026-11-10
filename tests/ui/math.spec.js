// Mục Toán (SPEC-math.md, đợt M-a): màn hình chính 10 nút, bài To – nhỏ (L1) và Nhiều – ít (L4): xem mẫu, 6 câu,
// sai lần 1 / 2, ▶ bỏ qua, không chạm, Học tiếp, sao và mức, thêm bài mẫu không trùng, Góc bố mẹ.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const question = (page) => page.locator('.mt-question:not(.demo)');

async function openMath(page, title, { progress = null } = {}) {
  await fakeSpeech(page);
  await startApp(page);
  if (progress) {
    await page.evaluate((p) => window.kidEnglish.db.put('progress', {
      emoji: '', mastery: 0, practiceCount: 0, lastPracticedAt: null, lastVoiceDay: null, ...p,
    }), progress);
  }
  await page.getByRole('button', { name: 'Toán' }).click();
  await page.getByRole('button', { name: title }).click();
}

/** Xem mẫu: bấm ▶ qua 3 lượt (Bông không tự chuyển lượt). `before(i)`: chạy trước khi bấm ▶ ở lượt i. */
async function skipDemo(page, before = null) {
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.mt-question.demo')).toBeVisible();
    await before?.(i);
    await page.locator('.next-btn').click();
  }
  await expect(question(page)).toBeVisible();
}

const lessonRecord = (page, title) => page.evaluate(async (t) => (await window.kidEnglish.db.getAll('lessons')).find((l) => l.title === t), title);
const progressOf = (page, key) => page.evaluate((k) => window.kidEnglish.db.get('progress', k), key);

/** Chạm đáp án đúng của câu đang hỏi, chờ sang câu sau (hoặc màn Hoan hô). */
async function answerRight(page) {
  const q = question(page);
  await q.evaluate((el) => { el.dataset.old = '1'; }); // đánh dấu câu này để chờ câu sau thay vào
  const ans = await q.getAttribute('data-answer');
  await q.locator(`[data-pick="${ans}"]`).click();
  await expect(page.locator('.mt-question[data-old]')).toHaveCount(0, { timeout: 10000 }); // câu sau đã dựng (hoặc hết bài)
}
async function pickWrong(page) {
  const q = question(page);
  const ans = await q.getAttribute('data-answer');
  await q.locator(`[data-pick]:not([data-pick="${ans}"])`).first().click();
}

test('MATH-30: màn hình chính 10 nút, nút ≥ 72 px, không cuộn ở iPhone SE, iPad dọc, iPad ngang', async ({ page }) => {
  await fakeSpeech(page);
  for (const vp of [{ width: 375, height: 667 }, { width: 820, height: 1180 }, { width: 1180, height: 820 }]) {
    await page.setViewportSize(vp);
    await startApp(page);
    const buttons = page.locator('.home-grid .home-btn');
    await expect(buttons).toHaveCount(10);
    await expect(page.locator('.home-grid .home-btn.math')).toContainText('Math');
    for (const box of await buttons.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()))) {
      expect(box.height).toBeGreaterThanOrEqual(72);
      expect(box.bottom).toBeLessThanOrEqual(vp.height);
    }
    expect(await page.evaluate(() => document.scrollingElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
  }
});

test('MATH-01/16/28/29: To – nhỏ mức 1 — xem mẫu, 6 câu đúng ngay → Hoan hô, +2⭐, lên mức 2, thống kê kiểu câu', async ({ page }) => {
  await openMath(page, 'Big and small');
  await skipDemo(page, async (i) => {
    if (i === 2) await expect.poll(() => spoken(page)).toContain('The elephant is bigger than the mouse!');
  });
  for (let i = 0; i < 6; i++) {
    await expect(question(page)).toHaveAttribute('data-type', 'big'); // mức 1 chỉ hỏi "big"
    await answerRight(page);
  }
  await expect(page.locator('.done-btn')).toBeVisible({ timeout: 15000 });
  const lines = await spoken(page);
  expect(lines).toContain('Which one is big?');
  expect(lines.some((t) => /^Yes! This [a-z ]+ is big\. That [a-z ]+ is small\.$/.test(t))).toBe(true);
  const p = await progressOf(page, 'math:l1');
  expect(p.mastery).toBe(2);
  expect(p.level).toBe(2);
  expect(p.types.big).toEqual({ asked: 6, first: 6, wrong: 0 });
  const lesson = await lessonRecord(page, 'Big and small');
  expect(lesson.resume).toBeNull();
  expect(lesson.timesCompleted).toBe(1);
});

test('MATH-17/18: sai lần 1 → câu mô tả đúng đồ bé chọn + hỏi lại; sai lần 2 → đáp án sáng, "Look! …"', async ({ page }) => {
  await openMath(page, 'Big and small', { progress: { word: 'math:l1', mastery: 2, level: 2 } });
  await skipDemo(page);
  const type = await question(page).getAttribute('data-type');
  const ask = type === 'big' ? 'Which one is big?' : 'Which one is small?';
  await expect.poll(async () => (await spoken(page)).filter((t) => t === ask).length).toBe(1);
  await pickWrong(page);
  const said = type === 'big' ? 'That one is small.' : 'That one is big.'; // mô tả cái bé vừa chọn
  await expect.poll(() => spoken(page)).toContain(said);
  await expect.poll(async () => (await spoken(page)).filter((t) => t === ask).length).toBe(2); // hỏi lại
  await pickWrong(page);
  await expect(question(page).locator('.mt-glow')).toHaveCount(1);
  await expect.poll(async () => (await spoken(page)).some((t) => t.startsWith('Look! This '))).toBe(true);
  await expect.poll(async () => (await lessonRecord(page, 'Big and small')).resume.results[0]).toEqual({ first: false, wrong: 2, revealed: true, skipped: false });
});

test('MATH-19: không chạm → nhắc câu hỏi đúng một lần → hiện đáp án, không tính đúng / sai', async ({ page }) => {
  await openMath(page, 'Big and small');
  await skipDemo(page);
  await expect.poll(async () => (await spoken(page)).some((t) => t.startsWith('Look! This ')), { timeout: 15000 }).toBe(true);
  const lines = await spoken(page);
  const look = lines.findIndex((t) => t.startsWith('Look! This '));
  expect(lines.slice(0, look).filter((t) => t === 'Which one is big?').length).toBe(2);
  await expect.poll(async () => (await lessonRecord(page, 'Big and small')).resume.results[0]).toEqual({ first: false, wrong: 0, revealed: true, skipped: false });
});

test('MATH-20: ▶ khi bé đang trả lời → bỏ qua câu (hiện đáp án), không tính đúng ngay', async ({ page }) => {
  await openMath(page, 'Big and small');
  await skipDemo(page);
  await expect.poll(() => spoken(page)).toContain('Which one is big?');
  await page.locator('.next-btn').click();
  await expect(question(page).locator('.mt-glow')).toHaveCount(1);
  await expect.poll(async () => (await lessonRecord(page, 'Big and small')).resume.results[0]).toEqual({ first: false, wrong: 0, revealed: true, skipped: true });
});

test('MATH-22/26/27: chạm nhanh hai lần chỉ tính lần đầu; thoát giữa lượt → Học tiếp vào đúng câu; thoát không cộng sao', async ({ page }) => {
  await openMath(page, 'Big and small');
  await skipDemo(page);
  // Chạm nhanh hai đồ: lần đầu (đúng) được tính, lần sau không làm gì.
  const q = question(page);
  const ans = await q.getAttribute('data-answer');
  await q.locator(`[data-pick="${ans}"]`).click();
  await q.locator(`[data-pick]:not([data-pick="${ans}"])`).click({ force: true });
  await expect(q.locator('.mt-wrong')).toHaveCount(0);
  // Câu vừa chốt → Học tiếp vào câu sau.
  await expect.poll(async () => (await lessonRecord(page, 'Big and small')).resume.index).toBe(1);
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await page.getByRole('button', { name: 'Toán' }).click();
  await page.getByRole('button', { name: 'Big and small' }).click();
  await page.getByRole('button', { name: 'Học tiếp' }).click();
  await expect(question(page)).toBeVisible(); // không xem lại phần mẫu
  await expect(page.locator('.mt-question.demo')).toHaveCount(0);
  const before = await lessonRecord(page, 'Big and small');
  expect(before.resume.index).toBe(1);
  expect(before.resume.results).toEqual([{ first: true, wrong: 0, revealed: false, skipped: false }]);
  // Câu chưa chốt (mới hỏi) → thoát → vào lại đúng câu đó.
  const qs = before.resume.questions;
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await page.getByRole('button', { name: 'Toán' }).click();
  await page.getByRole('button', { name: 'Big and small' }).click();
  await page.getByRole('button', { name: 'Học tiếp' }).click();
  await expect(question(page)).toHaveAttribute('data-answer', qs[1].answer);
  expect((await lessonRecord(page, 'Big and small')).resume.index).toBe(1);
  expect((await progressOf(page, 'math:l1')).mastery).toBe(0); // chưa xong lượt: không cộng sao
});

test('MATH-12/23/24: Nhiều – ít mức 3 — chạm đếm không đếm trùng, có nút The same, vừa màn iPhone SE', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openMath(page, 'More or fewer', { progress: { word: 'math:l4', mastery: 4, level: 3 } });
  await expect.poll(() => spoken(page)).toContain("Let's count!");
  await skipDemo(page);
  const q = question(page);
  await expect(q.locator('.mt-same')).toBeVisible();
  const lesson = await lessonRecord(page, 'More or fewer');
  expect(lesson.resume.questions.filter((x) => x.type === 'same')).toHaveLength(1);
  // Chạm một đồ hai lần: chỉ đếm "One" một lần.
  const ones = async () => (await spoken(page)).filter((t) => t === 'One').length; // phần mẫu cũng đã đếm "One"
  const before = await ones();
  const first = q.locator('.mt-plate-box[data-pick="left"] .mt-count').first();
  await first.click();
  await first.click();
  await expect(first.locator('.mt-count-no')).toHaveText('1');
  await expect.poll(ones).toBe(before + 1);
  await page.waitForTimeout(300);
  expect(await ones()).toBe(before + 1);
  await expect(q.locator('.mt-count.counted')).toHaveCount(1);
  // Chạm đồ để đếm không phải là chọn đĩa.
  expect((await lessonRecord(page, 'More or fewer')).resume.results).toEqual([]);
  // Mọi đồ ≥ 44 px, không chồng nhau, nằm trong màn hình.
  const boxes = await q.locator('.mt-count').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
  for (const [i, a] of boxes.entries()) {
    expect(a.width).toBeGreaterThanOrEqual(43.5);
    expect(a.height).toBeGreaterThanOrEqual(43.5);
    expect(a.right).toBeLessThanOrEqual(375);
    expect(a.bottom).toBeLessThanOrEqual(667);
    for (const b of boxes.slice(i + 1)) {
      const overlap = a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
      expect(overlap).toBe(false);
    }
  }
  for (let i = 0; i < 6; i++) await answerRight(page);
  await expect(page.locator('.done-btn')).toBeVisible({ timeout: 15000 });
  const lines = await spoken(page);
  expect(lines).toContain('Yes! They are the same!');
  expect(lines.some((t) => /^Yes! This plate has (more|fewer) [a-z]+\.$/.test(t))).toBe(true);
});

test('MATH-02/03/04: bài mẫu thêm một lần; xóa rồi mở lại không tự thêm; "Thêm lại bài mẫu" không tạo bản trùng, giữ sao', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const mathTitles = () => page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).filter((l) => l.kind === 'math').map((l) => l.title).sort());
  expect(await mathTitles()).toEqual(['Big and small', 'Heavy and light', 'Long and short', 'More or fewer', 'Small, medium, big', 'Tall and short']);
  // Danh sách bài Toán xếp theo mã bài L1 → L6.
  await page.getByRole('button', { name: 'Toán' }).click();
  await expect(page.locator('.lesson-card .lesson-title')).toHaveText(['Big and small', 'Tall and short', 'Long and short', 'More or fewer', 'Small, medium, big', 'Heavy and light']);
  await page.evaluate(async () => {
    const db = window.kidEnglish.db;
    const l1 = (await db.getAll('lessons')).find((l) => l.builtin === 'math-l1');
    await db.delete('lessons', l1.id);
    await db.put('progress', { word: 'math:l1', emoji: '🍎', mastery: 3, practiceCount: 3, lastPracticedAt: 1, lastVoiceDay: null, level: 2 });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Toán' }).waitFor();
  expect(await mathTitles()).toEqual(['Big and small', 'Heavy and light', 'Long and short', 'More or fewer', 'Small, medium, big', 'Tall and short'].filter((t) => t !== 'Big and small'));
  await openParent(page);
  await page.getByRole('button', { name: 'Quản lý bài' }).click();
  // "Thêm lại bài mẫu" thêm cả các bài mẫu khác rồi vẽ lại trang: chờ số bài đứng yên.
  const settle = async () => {
    let last = -1;
    for (;;) {
      const n = await page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).length);
      if (n === last) break;
      last = n;
      await page.waitForTimeout(700);
    }
    await page.getByRole('heading', { name: 'Quản lý bài' }).waitFor();
  };
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Thêm lại bài mẫu' }).click();
    await settle();
  }
  expect(await mathTitles()).toEqual(['Big and small', 'Heavy and light', 'Long and short', 'More or fewer', 'Small, medium, big', 'Tall and short']);
  // Góc bố mẹ: trang bài Toán có sao cũ (gắn với mã bài), mức, nút đặt mức.
  await page.locator('.lesson-row', { hasText: 'Big and small' }).click();
  await expect(page.getByText('⭐⭐⭐')).toBeVisible();
  await expect(page.getByText(/Mức 2 \/ 3/)).toBeVisible();
  await page.getByRole('button', { name: 'Mức 3' }).click();
  await expect.poll(async () => (await progressOf(page, 'math:l1')).level).toBe(3);
});

// ---------- Đợt M-b ----------

const boxesOf = (page) => question(page).locator('.mt-thing').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));

test('Cao – thấp: xem mẫu (hươu cao cổ), hai đồ chung đường đáy, 6 câu đúng → Hoan hô', async ({ page }) => {
  await openMath(page, 'Tall and short');
  await skipDemo(page, async (i) => {
    if (i === 2) await expect.poll(() => spoken(page)).toContain('The giraffe is taller than the mouse!');
  });
  await expect(question(page)).toHaveAttribute('data-type', 'tall'); // mức 1 chỉ hỏi "tall"
  const [a, b] = await boxesOf(page);
  expect(Math.abs(a.bottom - b.bottom)).toBeLessThan(2); // chung đường đáy
  for (let i = 0; i < 6; i++) await answerRight(page);
  await expect(page.locator('.done-btn')).toBeVisible({ timeout: 15000 });
  expect(await spoken(page)).toContain('Which one is tall?');
  expect((await spoken(page)).some((t) => /^Yes! This [a-z]+ is tall\. That [a-z]+ is short\.$/.test(t))).toBe(true);
  expect((await progressOf(page, 'math:l2')).mastery).toBe(2);
});

test('Dài – ngắn mức 3: xếp trên – dưới, thẳng đầu trái; hỏi dạng -er; sai lần 1 mô tả đúng đồ bé chọn', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openMath(page, 'Long and short', { progress: { word: 'math:l3', mastery: 4, level: 3 } });
  await skipDemo(page);
  const [a, b] = await boxesOf(page);
  expect(Math.abs(a.left - b.left)).toBeLessThan(2); // thẳng đầu trái
  expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1); // trên – dưới
  expect(Math.max(a.right, b.right)).toBeLessThanOrEqual(375);
  const type = await question(page).getAttribute('data-type');
  expect(['longer', 'shorter']).toContain(type);
  await pickWrong(page);
  await expect.poll(() => spoken(page)).toContain(type === 'longer' ? 'That one is shorter.' : 'That one is longer.');
});

test('Nặng – nhẹ mức 2: bập bênh nghiêng về bên nặng rồi Bông mới hỏi; sai lần 1 → "The … is light / heavy."', async ({ page }) => {
  await openMath(page, 'Heavy and light', { progress: { word: 'math:l6', mastery: 2, level: 2 } });
  await skipDemo(page, async (i) => {
    if (i === 0) await expect.poll(() => spoken(page)).toContain('The balloon is light.');
  });
  const lesson = await lessonRecord(page, 'Heavy and light');
  const q = lesson.resume.questions[0];
  const heavySide = q.left.item === q.heavy ? 'left' : 'right';
  await expect(page.locator('.mt-seesaw')).toHaveAttribute('data-tilt', heavySide);
  const ask = q.type === 'heavy' ? 'Which one is heavy?' : 'Which one is light?';
  await expect.poll(() => spoken(page)).toContain(ask);
  // Bên nặng thấp hơn bên nhẹ (ván đã nghiêng xong).
  const heavyBox = await question(page).locator(`[data-pick="${heavySide}"]`).boundingBox();
  const lightBox = await question(page).locator(`[data-pick="${heavySide === 'left' ? 'right' : 'left'}"]`).boundingBox();
  expect(heavyBox.y).toBeGreaterThan(lightBox.y + 10);
  await pickWrong(page);
  const pickedId = q.answer === 'left' ? q.right.item : q.left.item;
  const name = { elephant: 'elephant', watermelon: 'watermelon', pumpkin: 'pumpkin', balloon: 'balloon', leaf: 'leaf', grape: 'grape', strawberry: 'strawberry' }[pickedId];
  await expect.poll(() => spoken(page)).toContain(`The ${name} is ${pickedId === q.heavy ? 'heavy' : 'light'}.`);
  await answerRight(page);
  expect((await lessonRecord(page, 'Heavy and light')).resume.results[0]).toEqual({ first: false, wrong: 1, revealed: false, skipped: false });
});

/** Kéo một đồ (chuột thật: pointerdown → move → up) vào ô đích. */
async function drag(page, item, slot) {
  const a = await item.boundingBox();
  const b = await slot.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 });
  await page.mouse.up();
}

test('Nhỏ – vừa – to: kéo sai ô → đồ bay về, Bông mô tả đồ đó; kéo đúng cả 3 → Hoan hô từng bộ; một ô không có 2 đồ', async ({ page }) => {
  await openMath(page, 'Small, medium, big');
  await skipDemo(page, async (i) => {
    if (i === 0) await expect.poll(() => spoken(page)).toContain('Small, medium, big!');
  });
  const q = question(page);
  await expect.poll(() => spoken(page)).toContain('Put them in order: small, medium, big!');
  await expect(q.locator('.mt-ghost')).toHaveCount(3); // mức 1: bóng mờ đúng cỡ
  // Kéo cái to vào ô nhỏ: bay về khay, "That one is big."
  await drag(page, q.locator('.mt-tray [data-rank="2"]'), q.locator('.mt-slot[data-slot="0"]'));
  await expect.poll(() => spoken(page)).toContain('That one is big.');
  await expect(q.locator('.mt-tray [data-rank="2"]')).toHaveCount(1);
  await expect(q.locator('.mt-slot .mt-drag')).toHaveCount(0);
  // Đặt đúng cái nhỏ, rồi thử kéo cái vừa vào ô đã có đồ (ô nhỏ): không được, bay về (lần sai thứ 2 → Bông xếp nốt).
  await drag(page, q.locator('.mt-tray [data-rank="0"]'), q.locator('.mt-slot[data-slot="0"]'));
  await expect(q.locator('.mt-slot[data-slot="0"] [data-rank="0"]')).toHaveCount(1);
  await expect.poll(() => spoken(page)).toContain('Small!');
  await drag(page, q.locator('.mt-tray [data-rank="1"]'), q.locator('.mt-slot[data-slot="0"]'));
  for (const s of [0, 1, 2]) await expect(q.locator(`.mt-slot[data-slot="${s}"] .mt-drag`)).toHaveCount(1); // Bông xếp nốt, mỗi ô 1 đồ
  await expect.poll(() => spoken(page)).toContain('Look! Small, medium, big!');
  await expect.poll(async () => (await lessonRecord(page, 'Small, medium, big')).resume.results[0]).toEqual({ first: false, wrong: 2, revealed: true, skipped: false });
  // Các bộ sau: kéo đúng cả 3.
  for (let set = 1; set < 6; set++) {
    await expect.poll(async () => (await lessonRecord(page, 'Small, medium, big'))?.resume?.index ?? 6).toBe(set);
    const cur = question(page);
    await expect(cur.locator('.mt-tray .mt-drag')).toHaveCount(3);
    for (const rank of [0, 1, 2]) {
      await drag(page, cur.locator(`.mt-tray [data-rank="${rank}"]`), cur.locator(`.mt-slot[data-slot="${rank}"]`));
      await expect(cur.locator(`.mt-slot[data-slot="${rank}"] [data-rank="${rank}"]`)).toHaveCount(1);
    }
  }
  await expect(page.locator('.done-btn')).toBeVisible({ timeout: 15000 });
  expect(await spoken(page)).toContain('Yes! Small, medium, big!');
  const p = await progressOf(page, 'math:l5');
  expect(p.mastery).toBe(2); // 5/6 bộ đúng ngay → +2
  expect(p.types.order).toEqual({ asked: 6, first: 5, wrong: 2 });
});

test('ảnh Toán: bố mẹ thêm ảnh đồ vật → bài dùng ảnh thay emoji; đồ chưa có ảnh vẫn là emoji; Góc bố mẹ có ảnh lưới 16 ô', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 32;
    cv.getContext('2d').fillRect(4, 4, 24, 24);
    const data = await (await new Promise((r) => cv.toBlob(r, 'image/png'))).arrayBuffer();
    for (const w of ['apple', 'ball', 'teddy', 'star', 'duck', 'car']) {
      await window.kidEnglish.db.put('images', { id: `t-${w}`, lessonId: 'math:items', word: w, data, mimeType: 'image/png', width: 32, height: 32, createdAt: 1 });
    }
  });
  await page.getByRole('button', { name: 'Toán' }).click();
  await page.getByRole('button', { name: 'Big and small' }).click();
  await skipDemo(page);
  await expect(question(page).locator('.mt-pic img')).toHaveCount(2);
  await expect(question(page).locator('.mt-emoji:not(.mt-pic)')).toHaveCount(0);
  // Nhiều – ít: dâu / bánh quy chưa có ảnh → vẫn emoji.
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Toán/ }).click();
  await expect(page.getByText('có ảnh 6/16 đồ')).toBeVisible();
  await expect(page.locator('.mt-admin-pics img')).toHaveCount(6);
  await expect(page.locator('.mt-admin-pics .mt-admin-emoji')).toHaveCount(10);
  await expect(page.getByText(/Ảnh lưới — 10 đồ vật chưa có ảnh/)).toBeVisible();
});
