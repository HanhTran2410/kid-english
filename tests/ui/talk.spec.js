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
  // Không hỏi tuổi bé (chỉ còn lượt bé hỏi tuổi Bông), không giơ ngón tay.
  expect(said.some((t) => /^Wow,|^Show me/.test(t))).toBe(false);
  expect(said).toContain("I'm two! I'm a small bunny!");
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

/** Chơi bài; khi có lựa chọn mang mã trong `want` thì chạm đúng lựa chọn đó (còn lại chạm lựa chọn đầu tiên). */
async function playChoosing(page, want) {
  const wanted = want.map((w) => `.talk-choice[data-id="${w}"]`).join(',');
  for (let i = 0; i < 400; i++) {
    if (await page.locator('.done-btn').isVisible()) return;
    const target = page.locator(wanted).first();
    if (await target.isVisible().catch(() => false)) {
      await target.click({ timeout: 1000 }).catch(() => {});
    } else {
      const any = page.locator('.choice').first();
      if (await any.isVisible().catch(() => false)) await any.click({ timeout: 1000 }).catch(() => {});
    }
    await page.waitForTimeout(150);
  }
  throw new Error('Không học hết được bài');
}

const tinyPng = (page, color) => page.evaluate((c) => {
  const cv = document.createElement('canvas');
  cv.width = 120;
  cv.height = 120;
  const g = cv.getContext('2d');
  g.fillStyle = c;
  g.fillRect(0, 0, 120, 120);
  return cv.toDataURL('image/png').split(',')[1];
}, color);

test('Hello & Goodbye dài hơn: Bông đáp theo lựa chọn, lượt chạm đập tay / vẫy tay, thanh tiến độ có hộp quà', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await page.getByRole('button', { name: 'Hello & Goodbye', exact: true }).click();
  await expect(page.locator('.talk-hopper')).toBeVisible();
  await expect(page.locator('.talk-goal')).toHaveText('🎁');
  await playChoosing(page, ['sleepy', 'night', 'yes']);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  const said = await spoken(page);
  for (const line of ['How are you today?', "Sleepy? Let's stretch! Up, up, up!", 'Good night! Sweet dreams!', "Yay! Let's play!",
    'Give me a high five!', 'High five! Yay!', 'Wave bye-bye!', 'Bye-bye! See you tomorrow!']) {
    expect(said).toContain(line);
  }
  // Lượt động tác không tính sao.
  const rec = await progressOf(page, 'talk:talk-hello:high-five');
  expect(rec.mastery).toBe(0);
});

test('lượt có điều kiện: bé chọn buồn → Bông ôm; đói → hỏi ăn gì, Bông nhớ món thích trong hồ sơ', async ({ page }) => {
  await fakeSpeech(page, { mic: false });
  await startApp(page);
  await setProfile(page, { name: 'Na', age: 3, food: 'ice cream' });
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await page.getByRole('button', { name: 'How are you?', exact: true }).click();
  await playChoosing(page, ['sad', 'yes', 'ice-cream']);
  const said = await spoken(page);
  for (const line of ["Oh no! Here's a big hug!", 'Give me a hug!', "Me too! Let's eat!", 'What do you want to eat?', 'Ice cream, please!', 'I know! You like ice cream!']) {
    expect(said).toContain(line);
  }
  expect(said).not.toContain('Yummy! Cold ice cream!');

  // Học lại, chọn vui + không đói: không ôm, không hỏi ăn gì.
  await page.locator('.done-btn').click();
  await page.evaluate(() => { window.__spoken.length = 0; });
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await page.getByRole('button', { name: 'How are you?', exact: true }).click();
  await playChoosing(page, ['happy', 'no']);
  const again = await spoken(page);
  expect(again).toContain("Yay! I'm happy too!");
  expect(again).not.toContain('Give me a hug!');
  expect(again).not.toContain('What do you want to eat?');
  expect(again).toContain("Okay! Let's drink some water!");
});

test('bài hội thoại cũ (0.9.0) trên máy tự lên bản mới: thêm lượt, giữ tên bài và sao đã có', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const { db } = window.kidEnglish;
    const lesson = (await db.getAll('lessons')).find((l) => l.builtin === 'talk-likes');
    lesson.turns = lesson.turns.filter((t) => ['color', 'apples', 'dogs'].includes(t.id));
    delete lesson.builtinVersion;
    lesson.title = 'Bé thích gì';
    await db.put('lessons', lesson);
    await db.put('progress', { word: 'talk:talk-likes:color', emoji: '❤️', mastery: 2, practiceCount: 3, lastPracticedAt: Date.now(), lastVoiceDay: null });
  });
  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  const lesson = await page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).find((l) => l.builtin === 'talk-likes'));
  expect(lesson.title).toBe('Bé thích gì');
  expect(lesson.turns.map((t) => t.id)).toEqual(['color', 'animal', 'apples', 'dogs', 'ask-like', 'like-bong', 'heart']);
  expect((await progressOf(page, 'talk:talk-likes:color')).mastery).toBe(2);
});

test('ảnh: bố mẹ thêm ảnh cho nút đập tay và ảnh thật của mẹ → bài hiện ảnh thay emoji; ảnh gia đình không thuộc bài nào', async ({ page }) => {
  await fakeSpeech(page, { mic: false });
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Hồ sơ của bé' }).click();
  await page.locator('.family-row', { hasText: 'Mummy' }).locator('input[type=file]')
    .setInputFiles({ name: 'mum.png', mimeType: 'image/png', buffer: Buffer.from(await tinyPng(page, '#f39'), 'base64') });
  await expect(page.locator('.family-row', { hasText: 'Mummy' }).locator('img.family-thumb')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ảnh của Mummy' })).toHaveText('📷 Đổi ảnh');

  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: 'Quản lý bài' }).click();
  await page.getByRole('button', { name: /Hello & Goodbye/ }).click();
  await expect(page.getByRole('heading', { name: /Ảnh cho từng hình/ })).toBeVisible();
  await page.locator('li[data-pic="high-five"] input[type=file]')
    .setInputFiles({ name: 'hand.png', mimeType: 'image/png', buffer: Buffer.from(await tinyPng(page, '#3a9'), 'base64') });
  await expect(page.locator('li[data-pic="high-five"] img.thumb')).toBeVisible();

  // Ảnh gia đình không gắn với bài My family (gói chia sẻ bài chỉ lấy ảnh của bài).
  const familyLessonImages = await page.evaluate(async () => {
    const lesson = (await window.kidEnglish.db.getAll('lessons')).find((l) => l.builtin === 'talk-family');
    return (await window.kidEnglish.db.getAllByIndex('images', 'lessonId', lesson.id)).length;
  });
  expect(familyLessonImages).toBe(0);

  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await expect(page.locator('.lesson-card[aria-label="Hello & Goodbye"] img')).toBeVisible();
  // Nút động tác chỉ hiện chốc lát ở chế độ chạy nhanh: ghi lại lúc ảnh xuất hiện.
  await page.evaluate(() => {
    new MutationObserver(() => {
      if (document.querySelector('.talk-action img.talk-action-emoji[data-pic="high-five"]')) window.__sawHighFive = true;
      if (document.querySelector('.bubble.bong img.bubble-pic.photo')) window.__sawMum = true;
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page.getByRole('button', { name: 'Hello & Goodbye', exact: true }).click();
  await playChoosing(page, []);
  expect(await page.evaluate(() => window.__sawHighFive)).toBe(true);
  await page.locator('.done-btn').click();
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await page.getByRole('button', { name: 'My family', exact: true }).click();
  await page.waitForFunction(() => window.__sawMum === true, null, { timeout: 30000 });
});

test('bài có sẵn trong máy còn mô tả hình cũ (cùng số phiên bản) → mở app tự cập nhật; prompt ảnh My family ghi "Mother (Mummy)", không "One mummy"', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const { db } = window.kidEnglish;
    const lesson = (await db.getAll('lessons')).find((l) => l.builtin === 'talk-family');
    for (const t of lesson.turns) if (t.id === 'mummy') { t.draw = 'Mummy'; delete t.pictureName; }
    await db.put('lessons', lesson);
  });
  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await openParent(page);
  await page.getByRole('button', { name: 'Quản lý bài' }).click();
  await page.getByRole('button', { name: /My family/ }).click();
  await page.getByRole('button', { name: 'Copy prompt ảnh lưới' }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain('Cell 1 — Mother (Mummy): a smiling young mother');
  expect(prompt).not.toMatch(/One mummy|— Mummy:/);
});
