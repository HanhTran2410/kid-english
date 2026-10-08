import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, hold, openParent, playThrough } from './helpers.js';

const PASTED = `Sure! Here is your lesson 😊

\`\`\`json
{
  "version": 1,
  "id": "lesson-from-ai",
  "title": "Fruits",
  "titleVi": "Trái cây",
  "emoji": "🍎",
  "words": [
    { "en": "apple", "vi": "quả táo", "emoji": "🍎" },
    { "en": "banana", "vi": "quả chuối", "emoji": "🍌" },
    { "en": "grape", "vi": "quả nho", "emoji": "🍇" }
  ],
  "conversation": [
    { "word": "apple", "teacher": "What's this?", "child": "It's an apple!" },
    { "word": "kiwi", "teacher": "What's this?", "child": "It's a kiwi!" }
  ],
  "questions": [
    { "ask": "Which one is yellow?", "answer": "banana" }
  ],
  "story": [
    { "text": "I like apples.", "repeat": "Yummy!" },
    "Bananas are yellow."
  ]
}
\`\`\`
Have fun!`;

test.beforeEach(async ({ page }) => {
  await fakeSpeech(page);
});

test('nhập bài → xem trước → lưu → bài có trong danh sách → học hết bài → số ⭐ tăng', async ({ page }) => {
  await startApp(page);
  await openParent(page);

  await page.getByRole('button', { name: 'Dán bài' }).click();
  await page.getByPlaceholder(/Dán toàn bộ câu trả lời/).fill(PASTED);
  await page.getByRole('button', { name: 'Kiểm tra bài' }).click();

  // Lỗi nhẹ được tự sửa và cảnh báo; bản xem trước có đủ các phần.
  await expect(page.getByText('App đã tự sửa một số chỗ:')).toBeVisible();
  await expect(page.getByText(/dùng từ "kiwi" không có trong bài, đã bỏ/)).toBeVisible();
  await expect(page.getByRole('heading', { name: /Fruits/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Từ (3)' })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu bài' }).click();

  // Sau khi lưu: trang bài học để thêm ảnh.
  await expect(page.getByRole('heading', { name: 'Ảnh cho từng từ' })).toBeVisible();
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: 'Về màn hình của bé' }).click();

  await page.getByRole('button', { name: 'Bài học' }).click();
  const card = page.getByRole('button', { name: 'Fruits' });
  await expect(card).toBeVisible();
  await expect(card.locator('.lesson-stars')).toHaveText('');
  await card.click();

  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  await page.locator('.done-btn').click();

  await page.getByRole('button', { name: 'Bài học' }).click();
  await expect(page.getByRole('button', { name: 'Fruits' }).locator('.lesson-stars')).toHaveText('⭐');

  const spoken = await page.evaluate(() => window.__spoken);
  expect(spoken).toContain('apple!');
  expect(spoken).toContain('quả táo!'); // đọc nghĩa tiếng Việt lần đầu
  expect(spoken).toContain('Which one is yellow?');
  expect(spoken).toContain('Hooray! You did it!');
  expect(spoken).not.toContain('Wrong'); // không bao giờ nói "sai"
});

test('không có nhận dạng giọng nói và không có mic: bài vẫn chạy hết (chế độ chỉ nghe)', async ({ page }) => {
  await fakeSpeech(page, { recognition: false, mic: false });
  await startApp(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Colors' }).click();
  await playThrough(page);
  await page.locator('.done-btn').click();
  const spoken = await page.evaluate(() => window.__spoken);
  expect(spoken).toContain('Your turn!');
  expect(spoken).not.toContain("Let's try!");

  await openParent(page);
  await expect(page.getByText(/chế độ chỉ nghe/)).toBeVisible();
});

test('học dở rồi tải lại trang: Học tiếp vào đúng chỗ dừng, Học lại về đầu bài', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Animals' }).click();
  // Chờ học xong 3 thẻ từ (bước thứ 4 đang chạy).
  await expect.poll(async () => page.evaluate(async () => {
    const lessons = await window.kidEnglish.db.getAll('lessons');
    return lessons.find((l) => l.title === 'Animals')?.resume?.index ?? -1;
  }), { timeout: 30_000 }).toBeGreaterThanOrEqual(3);

  await page.reload();
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Bài học' }).click();
  const card = page.getByRole('button', { name: 'Animals' });
  await expect(card.locator('.resume-bar')).toBeVisible();
  const resume = await page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).find((l) => l.title === 'Animals').resume);

  await card.click();
  await expect(page.getByRole('button', { name: 'Học tiếp' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Học lại' })).toBeVisible();
  await page.getByRole('button', { name: 'Học tiếp' }).click();
  const words = ['dog', 'cat', 'cow', 'duck', 'pig', 'bird'];
  await expect(page.locator('.word-label')).toHaveText(words[resume.index]);

  await hold(page, page.getByRole('button', { name: /Giữ để về màn hình chính/ }), 1800);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Animals' }).click();
  await page.getByRole('button', { name: 'Học lại' }).click();
  await expect(page.locator('.word-label')).toHaveText('dog');
});

test('Góc bố mẹ chỉ mở khi nhấn giữ 3 giây', async ({ page }) => {
  await startApp(page);
  const gear = page.getByRole('button', { name: /Góc bố mẹ/ });
  await gear.click();
  await page.waitForTimeout(500);
  await expect(page.getByRole('heading', { name: 'Góc bố mẹ' })).toHaveCount(0);
  await hold(page, gear, 1000);
  await expect(page.getByRole('heading', { name: 'Góc bố mẹ' })).toHaveCount(0);
  await openParent(page);
});

test('hết giờ thì Bông đi ngủ; nhấn giữ 🌙 cho học thêm', async ({ page }) => {
  await startApp(page);
  await page.evaluate(() => {
    const app = window.kidEnglish;
    app.session.usedMs = 16 * 60 * 1000;
    app.go('home');
  });
  await expect(page.locator('.sleep-bunny')).toBeVisible();
  expect(await page.evaluate(() => window.__spoken)).toContain("I'm sleepy! Bye-bye!");
  await hold(page, page.getByRole('button', { name: /cho học thêm 15 phút/ }));
  await expect(page.getByRole('button', { name: 'Bài học' })).toBeVisible();
});

test('bộ sưu tập sticker: học xong được sticker, chạm vào thì Bông đọc tên', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Sticker' }).click();
  await expect(page.locator('.sticker-count')).toHaveText('0/40');
  await hold(page, page.getByRole('button', { name: /Giữ để về màn hình chính/ }), 1800);

  await page.getByRole('button', { name: 'Học cùng Bông' }).click();
  await playThrough(page);
  await page.locator('.done-btn').click();

  await page.getByRole('button', { name: 'Sticker' }).click();
  await expect(page.locator('.sticker-count')).toHaveText('1/40');
  const owned = page.locator('.sticker.owned');
  await owned.click();
  const name = await owned.getAttribute('aria-label');
  const spoken = await page.evaluate(() => window.__spoken);
  expect(spoken.at(-1).toLowerCase()).toBe(`${name}!`);
});

test('ôn tập: chưa học từ nào thì nút mờ; học xong thì ôn được 6 từ', async ({ page }) => {
  await startApp(page);
  const review = page.getByRole('button', { name: 'Ôn tập' });
  await expect(review).toHaveClass(/disabled/);
  await review.click();
  expect(await page.evaluate(() => window.__spoken)).toContain("Let's learn a lesson first!");

  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Animals' }).click();
  await playThrough(page);
  await page.locator('.done-btn').click();

  await expect(review).not.toHaveClass(/disabled/);
  await review.click();
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
});

test('tắt mạng vẫn mở được app và học được bài đã lưu (service worker)', async ({ page, context }) => {
  await page.goto('/?fast');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Lần mở thứ hai: service worker đã điều khiển trang và cache xong.
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Animals' }).click();
  await expect(page.locator('.word-label')).toHaveText('dog');
  await context.setOffline(false);
});

test('nghe lại giọng bé: lọc theo bài, chọn tất cả rồi xóa', async ({ page }) => {
  await startApp(page);
  await page.evaluate(async () => {
    const app = window.kidEnglish;
    const lessons = await app.db.getAll('lessons');
    const now = Date.now();
    const add = (lesson, word, daysAgo) => app.db.put('recordings', {
      id: crypto.randomUUID(), lessonId: lesson.id, word, date: now - daysAgo * 86400000,
      blob: new Blob(['x'.repeat(1000)], { type: 'audio/webm' }), mimeType: 'audio/webm', durationMs: 1200,
    });
    const animals = lessons.find((l) => l.title === 'Animals');
    const colors = lessons.find((l) => l.title === 'Colors');
    await add(animals, 'dog', 0);
    await add(animals, 'cat', 10);
    await add(colors, 'red', 40);
  });
  await openParent(page);
  await page.getByRole('button', { name: 'Nghe lại giọng bé' }).click();
  await expect(page.locator('.stats')).toContainText('3 bản ghi');

  await page.getByLabel('Ngày:').selectOption('older');
  await expect(page.locator('.rec-row')).toHaveCount(1);
  await page.getByLabel('Ngày:').selectOption('all');

  await page.getByLabel('Bài:').selectOption({ label: 'Animals' });
  await expect(page.locator('.rec-row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Chọn nhiều' }).click();
  await page.getByRole('button', { name: 'Chọn tất cả' }).click();
  await page.getByRole('button', { name: 'Xóa (2)' }).click();
  await expect(page.getByText('Xóa 2 bản ghi của bài Animals?')).toBeVisible();
  await page.locator('.dialog').getByRole('button', { name: 'Xóa' }).click();
  await expect(page.locator('.stats')).toContainText('1 bản ghi');
});
