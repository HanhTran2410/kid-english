// Chủ đề mới cho Nói chuyện với Bông (SPEC-talk-topics.md): tab chủ đề, máy cũ tự thêm 8 bài, câu đáp theo lựa chọn,
// câu kết Bedtime có / không tên, Please & thank you không có món thích, chơi hết một bài mỗi tab → sticker.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const setProfile = (page, profile) => page.evaluate((p) => window.kidEnglish.setSetting('childProfile', p), profile);
const talkLessons = (page) => page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).filter((l) => l.kind === 'talk'));

async function openTalk(page) {
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await expect(page.locator('.lesson-card')).not.toHaveCount(0);
}

/** Chơi bài; lựa chọn có mã trong `want` thì chạm đúng lựa chọn đó, còn lại chạm lựa chọn đầu tiên. */
async function playChoosing(page, want = []) {
  for (let i = 0; i < 400; i++) {
    if (await page.locator('.done-btn').isVisible()) return;
    // Đọc và bấm trong CÙNG một bước trong trang (tránh hàng lựa chọn hiện ra giữa hai lần kiểm tra → bấm nhầm ô đầu):
    // hàng lựa chọn hội thoại chưa chọn → ô muốn chọn (nếu có) hoặc ô đầu; không có hàng thì nút lựa chọn khác (Ôn tập…).
    await page.evaluate((w) => {
      const row = [...document.querySelectorAll('.chat-choices')].filter((r) => !r.querySelector('.correct')).pop();
      const choices = row ? [...row.querySelectorAll('.talk-choice')] : [];
      const pick = choices.find((c) => w.includes(c.dataset.id)) ?? choices[0] ?? (row ? null : document.querySelector('.choice'));
      pick?.click();
    }, want);
    await page.waitForTimeout(150);
  }
  throw new Error('Không học hết được bài');
}

test('TC01/TC13: tab ⭐ All / Talk / Every day / Out & about / Play / Manners đúng số bài; thẻ Ôn từ đã học ở cuối mọi tab', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openTalk(page);
  await expect(page.locator('.topic-tab')).toHaveText(['⭐All', '👋Talk', '🏠Every day', '🌳Out & about', '🧸Play', '🙏Manners']);
  for (const [topic, titles] of [
    ['Talk', ['Hello & Goodbye', 'About me', 'How are you?', 'I like…', 'My family']],
    ['Every day', ['Mealtime', 'Bath time', 'Bedtime']],
    ['Out & about', ['At the park', 'Weather']],
    ['Play', ['My toys', 'Hide and seek']],
    ['Manners', ['Please & thank you']],
  ]) {
    await page.locator(`.topic-tab[data-topic="${topic}"]`).click();
    const labels = await page.locator('.lesson-card').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    expect(labels).toEqual([...titles, 'Ôn từ đã học']);
  }
});

test('TC02–04: máy cũ chỉ có 5 bài (có sao, đã đổi tên một bài) → mở app 2 lần: thêm đúng 8 bài, không trùng; bài cũ giữ tên, sao', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const OLD = ['talk-hello', 'talk-about-me', 'talk-feelings', 'talk-likes', 'talk-family'];
  await page.evaluate(async (old) => {
    const { db } = window.kidEnglish;
    for (const l of await db.getAll('lessons')) if (l.kind === 'talk' && !old.includes(l.builtin)) await db.delete('lessons', l.id);
    const likes = (await db.getAll('lessons')).find((l) => l.builtin === 'talk-likes');
    likes.title = 'Bé thích gì';
    await db.put('lessons', likes);
    await db.put('progress', { word: 'talk:talk-likes:color', emoji: '❤️', mastery: 2, practiceCount: 3, lastPracticedAt: Date.now(), lastVoiceDay: null });
    await window.kidEnglish.setSetting('talkLessonsSeeded', old);
  }, OLD);
  expect((await talkLessons(page)).length).toBe(5);
  for (let i = 0; i < 2; i++) {
    await page.goto('/?fast&nosw');
    await page.getByRole('button', { name: 'Bắt đầu' }).click();
    await expect.poll(async () => (await talkLessons(page)).length).toBe(13);
  }
  const lessons = await talkLessons(page);
  expect(new Set(lessons.map((l) => l.builtin)).size).toBe(13);
  expect(lessons.find((l) => l.builtin === 'talk-likes').title).toBe('Bé thích gì');
  expect((await page.evaluate(async () => window.kidEnglish.db.get('progress', 'talk:talk-likes:color'))).mastery).toBe(2);
});

test('TC05/TC06/TC08: Bedtime có tên — chọn chăn + truyện tên lửa, nhánh 👎 → Bông đáp đúng lựa chọn; câu kết "Sweet dreams, Na!" → sticker', async ({ page }) => {
  await fakeSpeech(page, { mic: false });
  await startApp(page);
  await setProfile(page, { name: 'Na', age: 3 });
  await openTalk(page);
  await page.getByRole('button', { name: 'Bedtime', exact: true }).click();
  await playChoosing(page, ['no', 'blanket', 'rocket']);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  const said = await spoken(page);
  for (const line of ['Are you sleepy?', "No, I'm not!", 'Okay! One more story!', 'What do you sleep with?', 'My blanket!', 'So warm!',
    'The rocket story!', 'Once upon a time, a rocket flew to the moon…', 'Good night, Na!', 'Sweet dreams, Na!']) {
    expect(said).toContain(line);
  }
  expect(said).not.toContain('Hello, teddy!');
  expect(said.some((t) => t.includes('{'))).toBe(false);
});

test('TC09/TC10/TC14: chưa có hồ sơ — Bedtime kết "Sweet dreams!"; Please & thank you không có món thích → câu đáp thường; mỗi tab chơi hết một bài → sticker', async ({ page }) => {
  test.setTimeout(240000);
  await fakeSpeech(page, { mic: false });
  await startApp(page);
  for (const [title, want] of [['Bedtime', []], ['Please & thank you', []], ['At the park', ['no']], ['Hide and seek', ['box']]]) {
    await page.evaluate(() => { window.__spoken.length = 0; });
    await openTalk(page);
    await page.getByRole('button', { name: title, exact: true }).click();
    await playChoosing(page, want);
    await expect(page.locator('.prize-sticker')).toBeVisible();
    const said = await spoken(page);
    expect(said.some((t) => t.includes('{'))).toBe(false);
    if (title === 'Bedtime') {
      expect(said).toContain('Good night!');
      expect(said).toContain('Sweet dreams!');
    }
    if (title === 'Please & thank you') {
      expect(said).toContain('Good asking! You said please!');
      expect(said.some((t) => t.startsWith('I know!'))).toBe(false);
      expect(said).not.toContain('Say thank you with a hug!');
    }
    if (title === 'At the park') expect(said).toContain("Okay! Maybe next time! Let's pretend!");
    if (title === 'Hide and seek') {
      expect(said).toContain('Peekaboo! I was in the box!');
      expect(said).toContain('Where are you? … There you are!');
    }
    await page.locator('.done-btn').click();
  }
});
