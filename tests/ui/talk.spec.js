// Nói chuyện với Bông (SPEC-talk.md): danh sách bài hội thoại, hồ sơ của bé, bong bóng chat, 5 kiểu lượt, sao.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, playThrough, openParent } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken);
const setProfile = (page, profile) => page.evaluate((p) => window.kidEnglish.setSetting('childProfile', p), profile);
const progressOf = (page, key) => page.evaluate(async (k) => (await window.kidEnglish.db.get('progress', k)) ?? null, key);

test('nút đổi thành "Nói chuyện với Bông": 5 bài hội thoại + thẻ Ôn từ đã học (màn Học cùng Bông cũ); không có nút thứ 9', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await expect(page.locator('.home-grid .home-btn')).toHaveCount(8);
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(6);
  await expect(page.locator('.lesson-card').first()).toHaveAttribute('aria-label', 'Hello & Goodbye');
  await expect(page.locator('.lesson-card').last()).toHaveAttribute('aria-label', 'Ôn từ đã học');
  await page.getByRole('button', { name: 'Ôn từ đã học' }).click();
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  expect((await spoken(page)).length).toBeGreaterThan(2);
  // Mở app lại không sinh bản sao bài hội thoại.
  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).filter((l) => l.kind === 'talk').length)).toBe(5);
});

test('About me có hồ sơ (Na, 3 tuổi): hỏi tên → "Nice to meet you, Na!", tuổi đọc bằng chữ, đổi vai; bong bóng "Bé đã nói!"; sao tối đa 1 lần/lượt/ngày', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await setProfile(page, { name: 'Na', age: 3 });
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await page.getByRole('button', { name: 'About me', exact: true }).click();
  await expect(page.locator('.bubble.bong').first()).toContainText("What's your name?");
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  const said = await spoken(page);
  for (const line of ["What's your name?", 'Nice to meet you, Na!', 'How old are you?', 'Wow, three!', 'Now you ask me!',
    'My name is Bông!', 'That was fun! See you, Na!']) {
    expect(said).toContain(line);
  }
  expect(said.join(' ')).not.toMatch(/\{|wrong/i);

  // Học lại trong cùng ngày: không cộng thêm sao.
  const first = await progressOf(page, 'talk:talk-about-me:name');
  await page.locator('.done-btn').click();
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await page.getByRole('button', { name: 'About me', exact: true }).click();
  await playThrough(page);
  const again = await progressOf(page, 'talk:talk-about-me:name');
  // Trong cùng một ngày, mỗi lượt được ghi nhận tối đa 1 lần (mic giả có thể im lặng ở lần đầu).
  expect(again.mastery).toBeGreaterThanOrEqual(first.mastery);
  expect(again.mastery).toBeLessThanOrEqual(1);
  expect(again.practiceCount).toBeGreaterThan(first.practiceCount);
});

test('chưa có hồ sơ: không đọc chỗ trống, gợi ý "Tell me your name!", bỏ lượt hỏi tuổi', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await page.getByRole('button', { name: 'About me', exact: true }).click();
  await expect(page.locator('.bubble.child').first()).toContainText(/Tell me your name!|Bé đã nói!/);
  await playThrough(page);
  const said = await spoken(page);
  expect(said).toContain('Nice to meet you!');
  expect(said).not.toContain('How old are you?');
  expect(said).toContain('That was fun! See you!');
  expect(said.join(' ')).not.toMatch(/\{name\}|\{age\}|, !/);
});

test('không có mic: chọn hình / có-không vẫn chơi hết (chỉ nghe), không ghi nhận "đã nói" (không cộng sao)', async ({ page }) => {
  await fakeSpeech(page, { mic: false });
  await startApp(page);
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await page.getByRole('button', { name: 'How are you?', exact: true }).click();
  await expect(page.locator('.talk-choice')).toHaveCount(3);
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  const said = await spoken(page);
  expect(said).toContain('Your turn!');
  expect(said.some((t) => /^I'm (happy|sad\.|sleepy\.)/.test(t))).toBe(true);
  expect(said.some((t) => /^(Yes, I am!|No, I'm not!)$/.test(t))).toBe(true);
  await expect(page.locator('.bubble.child.spoken')).toHaveCount(0);
  const rec = await progressOf(page, 'talk:talk-feelings:feel');
  expect(rec.mastery).toBe(0);
  expect(rec.practiceCount).toBeGreaterThan(0);
});

test('chạm 🔊 trong bài hội thoại: phụ đề dùng bản tiếng Việt có sẵn của câu hỏi', async ({ page }) => {
  await fakeSpeech(page, { mic: false });
  await page.goto('/?nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click({ force: true });
  await setProfile(page, { name: 'Na', age: 3 });
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click({ force: true });
  await page.getByRole('button', { name: 'About me', exact: true }).click({ force: true });
  const replay = page.getByRole('button', { name: 'Nghe lại câu hỏi' });
  await expect(replay).toBeVisible();
  await replay.click({ force: true });
  await expect(page.locator('.caption-en')).toHaveText("What's your name?");
  await expect(page.locator('.caption-vi')).toHaveText('Con tên là gì?');
});

test('Hồ sơ của bé: lưu tên, tuổi, gia đình → bài My family hỏi đúng người đã chọn', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Hồ sơ của bé' }).click();
  await page.getByLabel('Tên đọc bằng tiếng Anh').fill('Bin');
  await page.getByLabel('Tuổi').selectOption('4');
  await page.getByRole('checkbox', { name: /Grandma/ }).check();
  await page.getByRole('checkbox', { name: /Daddy/ }).uncheck();
  await page.getByRole('button', { name: '🔊 Nghe thử' }).click();
  await expect.poll(async () => (await spoken(page)).includes('My name is Bin. Nice to meet you, Bin!')).toBe(true);
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  expect(await page.evaluate(() => window.kidEnglish.settings.childProfile)).toMatchObject({ name: 'Bin', age: 4, family: ['mummy', 'grandma'] });

  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await page.getByRole('button', { name: 'My family', exact: true }).click();
  await playThrough(page);
  const said = await spoken(page);
  expect(said).toContain('Yes! Mummy!');
  expect(said).toContain('Yes! Grandma!');
  expect(said).not.toContain('Yes! Daddy!');
  expect(said).toContain('That was fun! See you, Bin!');
});

test('bấm ▶ liên tục giữa các lượt: không kẹt, không lỗi, vẫn học hết bài', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await page.getByRole('button', { name: 'I like…', exact: true }).click();
  for (let i = 0; i < 6; i++) await page.locator('.next-btn').click({ force: true }).catch(() => {});
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  expect(errors).toEqual([]);
});
