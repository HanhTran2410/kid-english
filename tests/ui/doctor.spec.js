// Bác sĩ nhí (SPEC-doctor.md), mốc D1 — mức 1: chạm chỗ đau → đưa đồ chữa → khỏe → 3 ca → sticker.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const saidSince = async (page, n, re) => (await spoken(page)).slice(n).some((t) => re.test(t));
const play = (page) => page.locator('.dr-play');

/** Ca đang khám + bước của nó ở mức 1 (theo data-case của bạn thú). */
async function currentCase(page) {
  const id = await page.locator('.dr-patient').getAttribute('data-case');
  return page.evaluate(async (caseId) => {
    const m = await import('/js/doctor.js');
    const c = m.CASE_BY_ID.get(caseId);
    const steps = m.stepsFor(c, 1);
    return { id: caseId, target: steps.find((s) => s.type === 'touch')?.target, item: steps.find((s) => s.type === 'treat')?.item };
  }, id);
}
const spot = (page, region) => page.locator(`.dr-spot[data-region="${region}"]`).first();

async function openDoctor(page) {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bác sĩ nhí' }).click();
  await expect(play(page)).toHaveAttribute('data-state', 'touch', { timeout: 15000 });
}

/** Khám xong ca đang mở (chạm đúng chỗ, chạm đúng đồ), chờ sang ca sau / hoan hô. */
async function healCurrent(page) {
  await expect(play(page)).toHaveAttribute('data-state', 'touch', { timeout: 15000 });
  const c = await currentCase(page);
  await spot(page, c.target).click();
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  await page.locator(`.dr-item[data-item="${c.item}"]`).click();
  return c;
}

test('mức 1: vào phòng → chạm nhầm chỗ → câu nhầm; chạm đúng → khay 2 món; đưa nhầm → câu nhầm có tên, đồ đúng nhún; đưa đúng → khỏe → ca 2', async ({ page }) => {
  await openDoctor(page);
  const said = await spoken(page);
  expect(said).toContain('Hello! Come in!');
  expect(said).toContain('Hello, doctor!');
  expect(said).toContain('Where does it hurt? Touch it!');
  await expect(page.locator('.dr-count')).toHaveText('1/3');
  // Mức 1: chỗ đau nhấp nháy sẵn; khay ẩn ở bước chạm.
  await expect(page.locator('.dr-glow').first()).toBeAttached();
  await expect(page.locator('.dr-tray')).toHaveClass(/off/);
  const c = await currentCase(page);
  const other = ['nose', 'tummy', 'foot', 'head'].find((r) => r !== c.target);
  let n = (await spoken(page)).length;
  await spot(page, other).click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^That's my ${other === 'foot' ? 'foot' : other}! `))).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'touch');
  await spot(page, c.target).click();
  await expect.poll(() => saidSince(page, n, /^Yes! My /)).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  await expect(page.locator('.dr-item')).toHaveCount(2);
  await expect.poll(async () => (await spoken(page)).some((t) => / please!$/.test(t))).toBe(true);
  const wrong = await page.locator(`.dr-item:not([data-item="${c.item}"])`).getAttribute('data-item');
  n = (await spoken(page)).length;
  await page.locator(`.dr-item[data-item="${wrong}"]`).click();
  await expect.poll(() => saidSince(page, n, /^Hmm, (that's|those are) the .+\. I need .+!$/)).toBe(true);
  await expect(page.locator(`.dr-item[data-item="${c.item}"].hint`)).toHaveCount(1);
  await page.locator(`.dr-item[data-item="${c.item}"]`).click();
  await expect.poll(async () => (await spoken(page)).includes('I feel better! Thank you, doctor!'), { timeout: 15000 }).toBe(true);
  await expect(page.locator('.dr-count')).toHaveText('2/3', { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'touch', { timeout: 15000 });
});

test('3 ca → Hoan hô + sticker; đếm lượt + seen một lần; ghi "đã gặp" cho từ bài Body (DOC-12)', async ({ page }) => {
  await openDoctor(page);
  const healed = [];
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.dr-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    healed.push(await healCurrent(page));
  }
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  // Màn hoan hô không bị cắt: hộp quà và nút ✔ nằm trọn trong màn hình.
  await expect(page.locator('.done-btn')).toBeInViewport({ ratio: 1, timeout: 15000 });
  await expect(page.locator('.gift')).toBeInViewport({ ratio: 1 });
  const game = await page.evaluate(() => window.kidEnglish.settings.doctorGame);
  expect(game.rounds).toBe(1);
  expect(game.level).toBe(1);
  expect(Object.values(game.seen).reduce((a, b) => a + b, 0)).toBe(3);
  const body = { hand: 'hands', foot: 'feet', nose: 'nose', mouth: 'mouth' };
  const words = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).map((p) => p.word));
  for (const c of healed) if (body[c.target]) expect(words).toContain(body[c.target]);
});

test('kéo đồ thả lên người bạn thú là được; thả ra ngoài thì về khay, không tính nhầm; ngón 2 chạm bạn thú lúc đang kéo bị bỏ qua (DOC-15)', async ({ page }) => {
  await openDoctor(page);
  const c = await currentCase(page);
  await spot(page, c.target).click();
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  const n = (await spoken(page)).length;
  const item = await page.locator(`.dr-item[data-item="${c.item}"]`).boundingBox();
  // Thả ra ngoài (góc trên trái màn): về khay, không có câu nhầm, vẫn ở bước chữa.
  await page.mouse.move(item.x + item.width / 2, item.y + item.height / 2);
  await page.mouse.down();
  await page.mouse.move(30, 200, { steps: 6 });
  // Đang kéo mà ngón 2 chạm bụng bạn thú: không nói lại triệu chứng.
  const belly = await spot(page, 'tummy').boundingBox();
  await page.locator('.dr-patient').dispatchEvent('pointerdown', {
    pointerId: 9, clientX: belly.x + belly.width / 2, clientY: belly.y + belly.height / 2, button: 0, bubbles: true,
  });
  await page.mouse.up();
  await page.waitForTimeout(300);
  expect(await saidSince(page, n, /^Hmm|hurts!$|^Achoo|^Ouch/)).toBe(false);
  await expect(play(page)).toHaveAttribute('data-state', 'treat');
  // Kéo thả lên bụng bạn thú (không cần đúng chỗ đau): nhận.
  const tummy = await spot(page, 'tummy').boundingBox();
  await page.mouse.move(item.x + item.width / 2, item.y + item.height / 2);
  await page.mouse.down();
  await page.mouse.move(tummy.x + tummy.width / 2, tummy.y + tummy.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await spoken(page)).includes('I feel better! Thank you, doctor!'), { timeout: 15000 }).toBe(true);
});

test('bước chữa: chạm bạn thú = nghe lại triệu chứng, không tính nhầm (DOC-06); chạm Bông y tá = nói lại câu xin', async ({ page }) => {
  await openDoctor(page);
  const c = await currentCase(page);
  await spot(page, c.target).click();
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  const say = await page.evaluate(async (id) => (await import('/js/doctor.js')).CASE_BY_ID.get(id).say[0], c.id);
  let n = (await spoken(page)).length;
  await spot(page, 'head').click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^${say.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))).toBe(true);
  await expect(page.locator('.dr-item.hint')).toHaveCount(0);
  await expect(play(page)).toHaveAttribute('data-state', 'treat');
  n = (await spoken(page)).length;
  await page.getByRole('button', { name: 'Bông y tá' }).click();
  await expect.poll(() => saidSince(page, n, / please!$/)).toBe(true);
});

test('ra nền ngay sau khi chạm đúng → quay lại đúng ca, ở bước chữa; tiến độ Body không ghi hai lần (DOC-08); 🧹 khám lại cùng ca từ ca 1 (DOC-07)', async ({ page }) => {
  await openDoctor(page);
  const c = await currentCase(page);
  const patient = await page.locator('.dr-patient').getAttribute('data-patient');
  await spot(page, c.target).click();
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  await expect(page.locator('.dr-patient')).toHaveAttribute('data-case', c.id);
  await expect(page.locator('.dr-patient')).toHaveAttribute('data-patient', patient);
  await expect(page.locator('.dr-count')).toHaveText('1/3');
  const count = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).reduce((a, p) => a + (p.practiceCount ?? 0), 0));
  expect(count).toBe({ hand: 1, foot: 1, nose: 1, mouth: 1 }[c.target] ?? 0);
  // Khỏi ca 1, sang ca 2 rồi 🧹: về ca 1, cùng bạn thú, cùng bệnh; seen / rounds không tính lại lượt.
  await page.locator(`.dr-item[data-item="${c.item}"]`).click();
  await expect(page.locator('.dr-count')).toHaveText('2/3', { timeout: 15000 });
  await page.getByRole('button', { name: 'Khám lại' }).click();
  await expect(page.locator('.dr-count')).toHaveText('1/3');
  await expect(page.locator('.dr-patient')).toHaveAttribute('data-case', c.id);
  await expect(play(page)).toHaveAttribute('data-state', 'touch', { timeout: 15000 });
  expect((await page.evaluate(() => window.kidEnglish.settings.doctorGame)).rounds).toBe(0);
});

test('giọng đọc lỗi: phụ đề vẫn hiện, chơi hết lượt được', async ({ page }) => {
  await fakeSpeech(page);
  await page.addInitScript(() => {
    // Giọng đọc báo lỗi ngay mỗi câu.
    window.addEventListener('DOMContentLoaded', () => {
      window.speechSynthesis.speak = (u) => {
        window.__spoken.push(u.text);
        setTimeout(() => u.onerror?.({ error: 'synthesis-failed' }), 5);
      };
    });
  });
  await startApp(page);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bác sĩ nhí' }).click();
  await expect(page.locator('.dr-say .caption-en')).toBeVisible({ timeout: 15000 });
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.dr-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    await healCurrent(page);
  }
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});

// ---------- Ảnh bố mẹ thêm (SPEC mục 10) ----------
/** Ảnh vuông màu để thử (canvas → png). */
const addImage = (page, lessonId, word) => page.evaluate(async ({ lessonId, word }) => {
  const db = await import('/js/db.js');
  const png = await new Promise((r) => {
    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 80;
    const g = c.getContext('2d');
    g.fillStyle = '#e33';
    g.fillRect(10, 10, 60, 60);
    c.toBlob(r, 'image/png');
  });
  await db.setWordImage(window.kidEnglish.db, { lessonId, word, blob: png, mimeType: 'image/png', width: 80, height: 80 });
}, { lessonId, word });
const doctorImages = (page) => page.evaluate(async () => (await window.kidEnglish.db.getAllByIndex('images', 'lessonId', 'doctor:items')).map((i) => i.word).sort());

test('Góc bố mẹ → Ảnh Bác sĩ nhí: dùng lại ảnh có sẵn (ảnh bài học "toothbrush", ảnh Trốn tìm "spoon" cho si-rô); "Dùng emoji" bỏ ảnh', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await addImage(page, 'my-lesson', 'toothbrush');
  await addImage(page, 'hide:items', 'spoon');
  const { openParent } = await import('./helpers.js');
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Bác sĩ nhí/ }).click();
  await expect(page.locator('.sp-admin-item[data-item]')).toHaveCount(11);
  await expect(page.locator('.sp-admin-item[data-item="medicine"]').getByRole('button', { name: 'Ảnh có sẵn (1)…' })).toBeVisible();
  await page.getByRole('button', { name: 'Dùng lại ảnh đã có (2 đồ)' }).click();
  await expect.poll(() => doctorImages(page)).toEqual(['medicine', 'toothbrush']);
  await expect(page.locator('.sp-admin-item[data-item="toothbrush"] img.dr-admin-face')).toHaveCount(1);
  // Ảnh gốc không đổi (sao chép, không chuyển).
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAllByIndex('images', 'lessonId', 'my-lesson')).length)).toBe(1);
  await page.locator('.sp-admin-item[data-item="toothbrush"]').getByRole('button', { name: 'Dùng emoji' }).click();
  await expect.poll(() => doctorImages(page)).toEqual(['medicine']);
});

test('trò chơi dùng ảnh đồ bố mẹ thêm (khay) và ảnh nền phòng khám', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  for (const id of ['bandage', 'medicine', 'tissue', 'toothbrush', 'icepack', 'drops', 'water', 'blanket']) await addImage(page, 'doctor:items', id);
  await addImage(page, 'doctor:bg', 'room');
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bác sĩ nhí' }).click();
  await expect(play(page)).toHaveAttribute('data-state', 'touch', { timeout: 15000 });
  await expect(page.locator('.dr-stage.has-bg')).toHaveCount(1);
  const c = await currentCase(page);
  await spot(page, c.target).click();
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  await expect(page.locator('.dr-item img.dr-item-img')).toHaveCount(2);
});
