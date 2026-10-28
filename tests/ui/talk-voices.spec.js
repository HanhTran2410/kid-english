// SPEC-talk mục 16: câu mẫu của bé chỉ ở bong bóng bên phải ("Con nói:"), đọc bằng "giọng bạn nhỏ" (giọng thứ hai + cao
// giọng); Bông giọng chính; ai đang nói thì bong bóng người đó sáng.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

/** Mỗi câu được đọc: giọng, cao độ, bong bóng nào đang sáng, các câu đang nằm trong bong bóng Bông. */
async function recordTalk(page, opts) {
  await fakeSpeech(page, opts);
  await page.addInitScript(() => {
    window.__talk = [];
    const s = window.speechSynthesis;
    const speak = s.speak.bind(s);
    s.speak = (u) => {
      window.__talk.push({
        text: u.text, voice: u.voice?.name ?? '', pitch: u.pitch ?? 1,
        child: Boolean(document.querySelector('.bubble.child.talking')),
        label: document.querySelector('.bubble.child.talking .bubble-label')?.textContent ?? '',
        bong: Boolean(document.querySelector('.bubble.bong.talking')),
        bongTexts: [...document.querySelectorAll('.bubble.bong .bubble-text')].map((e) => e.textContent),
      });
      speak(u);
    };
  });
}
/** Chơi hết bài, gặp hàng lựa chọn thì chạm ô đầu. */
async function playLesson(page) {
  for (let i = 0; i < 400; i++) {
    if (await page.locator('.done-btn').isVisible()) return;
    await page.evaluate(() => {
      document.querySelector('.call-answer, .call-hangup')?.click();
      const row = [...document.querySelectorAll('.chat-choices')].filter((r) => !r.querySelector('.correct')).pop();
      (row?.querySelector('.talk-choice') ?? (row ? null : document.querySelector('.choice')))?.click();
    });
    await page.waitForTimeout(150);
  }
  throw new Error('Không học hết được bài');
}
async function openLesson(page, name) {
  await startApp(page);
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await page.getByRole('button', { name, exact: true }).click();
}
const MODELS = /^(I like (\w+|dogs|cats|bunnies)!|Yes, I do!|No, I don't!|What do you like\?)$/;

test('TV1 + TV3 + TV6 (máy 2 giọng): chọn hình → câu mẫu của bé KHÔNG nằm trong bong bóng Bông, có "Con nói:", đọc giọng thứ hai cao giọng, bong bóng bé sáng; câu của Bông giọng chính, bong bóng Bông sáng', async ({ page }) => {
  await recordTalk(page, { altVoice: true });
  await openLesson(page, 'I like…');
  await playLesson(page);
  const talk = await page.evaluate(() => window.__talk);
  const models = talk.filter((r) => r.child);
  expect(models.length).toBeGreaterThan(2);
  for (const r of models) {
    expect(r).toMatchObject({ voice: 'Test English Two', pitch: 1.3, bong: false, label: 'Con nói:' });
    expect(r.bongTexts).not.toContain(r.text); // không có bong bóng Bông nói câu của bé
  }
  expect(models.some((r) => /^I like /.test(r.text))).toBe(true);
  const bong = talk.filter((r) => r.bong);
  expect(bong.map((r) => r.text)).toContain('What color do you like?');
  for (const r of bong) expect(r).toMatchObject({ voice: 'Test English', pitch: 1, child: false });
  // Mọi câu mẫu của bé (kể cả lượt đổi vai "What do you like?") chỉ đọc bằng giọng bạn nhỏ.
  for (const r of talk.filter((x) => MODELS.test(x.text))) expect(r.voice).toBe('Test English Two');
});

test('TV2 (máy 1 giọng): câu mẫu của bé cao giọng hơn câu của Bông', async ({ page }) => {
  await recordTalk(page);
  await openLesson(page, 'I like…');
  await playLesson(page);
  const talk = await page.evaluate(() => window.__talk);
  expect(talk.filter((r) => r.child).every((r) => r.pitch > 1)).toBe(true);
  expect(talk.filter((r) => r.bong).every((r) => r.pitch === 1)).toBe(true);
});

test('TV5: chọn hình xong, 🔊 trên đầu màn đọc lại câu hỏi của Bông (không phải câu mẫu của bé)', async ({ page }) => {
  await recordTalk(page);
  await openLesson(page, 'I like…');
  await page.locator('.call-answer').click({ timeout: 20000 }).catch(() => {});
  await page.locator('.chat-choices .talk-choice').first().click({ timeout: 20000 });
  await expect(page.locator('.bubble.child.hint')).toHaveCount(1, { timeout: 15000 });
  await page.locator('.replay-btn').click();
  // Fake speech chạy nhanh nên có thể đã sang câu hỏi sau: chỉ cần là câu hỏi của Bông, không phải câu mẫu của bé.
  await expect(page.locator('.caption-en')).toHaveText(/^(What color|Which animal) .+\?$/);
});
