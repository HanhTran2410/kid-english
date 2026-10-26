// 👩‍🏫 Cô giáo nhí (SPEC-jobs.md mục 5): Bông nói tên hình (đôi khi sai), bé chấm ✅ / ❌; 5 hình → sticker.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const saidSince = async (page, n, re) => (await spoken(page)).slice(n).some((t) => re.test(t));
const play = (page) => page.locator('.tc-play');
const isRight = async (page) => (await page.locator('.tc-picture').getAttribute('data-right')) === 'true';

async function openTeacher(page, settings, before) {
  await fakeSpeech(page);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('teacherGame', s), settings);
  if (before) await before();
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await expect(page.locator('.jb-job')).toHaveCount(await page.evaluate(async () => (await import('/js/screens/jobs.js')).JOBS.length));
  await page.getByRole('button', { name: 'Cô giáo nhí' }).click();
  await expect(play(page)).toHaveAttribute('data-state', 'judge', { timeout: 15000 });
}
async function judgeRight(page, i) {
  await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/5`, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'judge', { timeout: 15000 });
  await page.getByRole('button', { name: (await isRight(page)) ? 'Đúng' : 'Sai' }).click();
}

test('mức 1: Bông giơ tay nói tên; JOBS-05 — chấm nhầm thì Bông nói lại, bé chọn lại (không sang câu), nhầm 2 lần nút đúng nhún; chấm đúng → câu 2', async ({ page }) => {
  await openTeacher(page);
  const said = await spoken(page);
  expect(said).toContain("Good morning, teacher! I'm ready!");
  expect(said.some((t) => /^I know! (It's|They're) .+!$/.test(t))).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('1/5');
  const right = await isRight(page);
  const wrongBtn = page.getByRole('button', { name: right ? 'Sai' : 'Đúng' });
  const rightBtn = page.getByRole('button', { name: right ? 'Đúng' : 'Sai' });
  let n = (await spoken(page)).length;
  await wrongBtn.click();
  await expect.poll(() => saidSince(page, n, /^Hmm, are you sure\? Look again!$/)).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'judge');
  await expect(page.locator('.jb-count')).toHaveText('1/5');
  await page.waitForTimeout(450);
  await wrongBtn.click();
  await expect(rightBtn).toHaveClass(/nudge/);
  n = (await spoken(page)).length;
  await rightBtn.click();
  if (right) await expect.poll(() => saidSince(page, n, /^Yay! I'm right!$/)).toBe(true);
  else {
    await expect.poll(() => saidSince(page, n, /^Oops! What is it\?$/)).toBe(true);
    await expect.poll(() => saidSince(page, n, /^(It's|They're) .+! Thank you, teacher!$/), { timeout: 15000 }).toBe(true);
  }
  await expect(page.locator('.jb-count')).toHaveText('2/5', { timeout: 15000 });
  await expect(page.locator('.tc-star[data-done="true"]')).toHaveCount(1);
});

test('5 hình → Hoan hô + sticker; đếm lượt; 2–3 câu Bông nói sai', async ({ page }) => {
  await openTeacher(page);
  let wrong = 0;
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/5`, { timeout: 15000 });
    await expect(play(page)).toHaveAttribute('data-state', 'judge', { timeout: 15000 });
    if (!(await isRight(page))) wrong++;
    await judgeRight(page, i);
  }
  expect(wrong >= 2 && wrong <= 3).toBe(true);
  await expect.poll(async () => (await spoken(page)).includes('Thank you, teacher! I learned a lot!'), { timeout: 15000 }).toBe(true);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  expect((await page.evaluate(() => window.kidEnglish.settings.teacherGame)).rounds).toBe(1);
});

test('hình dùng ảnh bài học (ảnh mới nhất của từ); ra nền rồi quay lại đúng hình đang chấm', async ({ page }) => {
  await openTeacher(page, null, () => page.evaluate(async () => {
    const db = await import('/js/db.js');
    const t = await import('/js/jobs/teacher.js');
    const png = await new Promise((r) => { const c = document.createElement('canvas'); c.width = 60; c.height = 60; c.getContext('2d').fillRect(10, 10, 40, 40); c.toBlob(r, 'image/png'); });
    for (const n of t.NOUNS) await db.setWordImage(window.kidEnglish.db, { lessonId: 'my-lesson', word: n.en, blob: png, mimeType: 'image/png', width: 60, height: 60 });
  }));
  await expect(page.locator('.tc-picture img.tc-img')).toHaveCount(1);
  await judgeRight(page, 0);
  await expect(page.locator('.jb-count')).toHaveText('2/5', { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'judge', { timeout: 15000 });
  const word = await page.locator('.tc-picture').getAttribute('data-word');
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'judge', { timeout: 15000 });
  await expect(page.locator('.jb-count')).toHaveText('2/5');
  await expect(page.locator('.tc-picture')).toHaveAttribute('data-word', word);
  await expect(page.locator('.tc-star[data-done="true"]')).toHaveCount(1);
});

test('mức 3: đồ tô màu / nhiều con, câu "It\'s a red ball!" / "I see two cats!"; chơi hết lượt', async ({ page }) => {
  await openTeacher(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.tc-picture')).toHaveAttribute('data-kind', /color|count/, { timeout: 15000 });
    await judgeRight(page, i);
  }
  expect((await spoken(page)).some((t) => /^I know! (It's a (red|blue|yellow|green|pink|orange) (ball|balloon|star)|I see (one|two|three) \w+)!$/.test(t))).toBe(true);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});

test('ảnh thật (512 × 640, ảnh dọc) trên bảng: thẻ hình nằm trọn trong bảng đen (không tràn ra ngoài), cả màn ngang lẫn dọc', async ({ page }) => {
  for (const size of [{ width: 1920, height: 990 }, { width: 1180, height: 820 }, { width: 390, height: 760 }]) {
    await page.setViewportSize(size);
    await openTeacher(page, null, () => page.evaluate(async () => {
      // Ảnh vuông 512px (như ảnh AI) cho mọi từ của các bài trên máy.
      const db = await import('/js/db.js');
      const png = await new Promise((r) => {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 640;
        const g = c.getContext('2d');
        g.fillStyle = '#ffc9c9';
        g.fillRect(0, 0, 512, 640);
        c.toBlob(r, 'image/png');
      });
      const t = await import('/js/jobs/teacher.js');
      for (const n of t.NOUNS) await db.setWordImage(window.kidEnglish.db, { lessonId: 'my-lesson', word: n.en, blob: png, mimeType: 'image/png', width: 512, height: 640 });
    }));
    await expect(page.locator('.tc-picture img.tc-img')).toHaveCount(1, { timeout: 15000 });
    const [board, pic] = await Promise.all(['.tc-board', '.tc-picture'].map((sel) => page.locator(sel).boundingBox()));
    expect(pic.x).toBeGreaterThanOrEqual(board.x);
    expect(pic.y).toBeGreaterThanOrEqual(board.y);
    expect(pic.x + pic.width).toBeLessThanOrEqual(board.x + board.width + 0.5);
    expect(pic.y + pic.height).toBeLessThanOrEqual(board.y + board.height + 0.5);
  }
});
