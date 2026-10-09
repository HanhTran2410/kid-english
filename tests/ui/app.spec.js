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
  const card = page.getByRole('button', { name: 'Fruits', exact: true });
  await expect(card).toBeVisible();
  await expect(card.locator('.lesson-stars')).toHaveText('');
  await card.click();

  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  await page.locator('.done-btn').click();

  await page.getByRole('button', { name: 'Bài học' }).click();
  await expect(page.getByRole('button', { name: 'Fruits', exact: true }).locator('.lesson-stars')).toHaveText('⭐');

  const spoken = await page.evaluate(() => window.__spoken);
  expect(spoken).toContain('apple!');
  expect(spoken).not.toContain('quả táo!'); // mặc định không đọc nghĩa tiếng Việt
  expect(spoken).toContain('Listen and say!');
  expect(spoken).toContain('Which one is yellow?');
  expect(spoken).toContain('Hooray! You did it!');
  expect(spoken).not.toContain('Wrong'); // không bao giờ nói "sai"
});

test('không có nhận dạng giọng nói và không có mic: bài vẫn chạy hết (chế độ chỉ nghe)', async ({ page }) => {
  await fakeSpeech(page, { recognition: false, mic: false });
  await startApp(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Colors', exact: true }).click();
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
  await page.getByRole('button', { name: 'Animals', exact: true }).click();
  // Chờ học xong 3 thẻ từ (bước thứ 4 đang chạy).
  await expect.poll(async () => page.evaluate(async () => {
    const lessons = await window.kidEnglish.db.getAll('lessons');
    return lessons.find((l) => l.title === 'Animals')?.resume?.index ?? -1;
  }), { timeout: 30_000 }).toBeGreaterThanOrEqual(3);

  await page.reload();
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Bài học' }).click();
  const card = page.getByRole('button', { name: 'Animals', exact: true });
  await expect(card.locator('.resume-bar')).toBeVisible();
  const resume = await page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).find((l) => l.title === 'Animals').resume);

  await card.click();
  await expect(page.getByRole('button', { name: 'Học tiếp' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Học lại' })).toBeVisible();
  await page.getByRole('button', { name: 'Học tiếp' }).click();
  const words = ['dog', 'cat', 'cow', 'duck', 'pig', 'bird'];
  await expect(page.locator('.word-label')).toHaveText(words[resume.index]);

  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Animals', exact: true }).click();
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
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();

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
  await page.getByRole('button', { name: 'Animals', exact: true }).click();
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
  await page.getByRole('button', { name: 'Animals', exact: true }).click();
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

test('nút ▶ luôn hiện và bấm là sang bước tiếp ngay; nút 🏠 bấm là về menu chính', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  // Từ màn danh sách bài, bấm 🏠 là về menu chính.
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await expect(page.getByRole('button', { name: 'Học cùng Bông' })).toBeVisible();

  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Animals', exact: true }).click();
  await expect(page.locator('.word-label')).toHaveText('dog');
  const next = page.getByRole('button', { name: 'Tiếp' });
  await expect(next).toBeVisible();
  await next.click();
  await expect(page.locator('.word-label')).toHaveText('cat');
  await next.click();
  await expect(page.locator('.word-label')).toHaveText('cow');

  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await expect(page.getByRole('button', { name: 'Học cùng Bông' })).toBeVisible();
  // Chỗ dừng đã được lưu để "Học tiếp".
  await page.getByRole('button', { name: 'Bài học' }).click();
  await expect(page.getByRole('button', { name: 'Animals', exact: true }).locator('.resume-bar')).toBeVisible();
});

test('bấm nhẹ ⚙️ thì hiện hướng dẫn nhấn giữ; màn hình chính có chữ giải thích', async ({ page }) => {
  await startApp(page);
  for (const label of ['Bài học', 'Ôn tập', 'Học cùng Bông', 'Sticker của bé', 'Bố mẹ (giữ 3 giây)']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: /Góc bố mẹ/ }).click();
  await expect(page.getByRole('status')).toContainText('nhấn giữ ⚙️ 3 giây');
});

test('Góc bố mẹ: bớt từng sticker và xóa hết sticker', async ({ page }) => {
  await startApp(page);
  await page.evaluate(async () => {
    const db = window.kidEnglish.db;
    await db.put('stickers', { id: 'lion', firstEarnedAt: 1, count: 2 });
    await db.put('stickers', { id: 'frog', firstEarnedAt: 2, count: 1 });
  });
  await openParent(page);
  await page.getByRole('button', { name: 'Sticker của bé' }).click();
  await expect(page.getByRole('heading', { name: /Bé có 2\/40 loại sticker \(3 lần nhận\)/ })).toBeVisible();
  await page.getByRole('button', { name: 'Bớt 1 sticker lion' }).click();
  await expect(page.getByRole('heading', { name: /\(2 lần nhận\)/ })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa hết sticker' }).click();
  await page.locator('.dialog').getByRole('button', { name: 'Xóa hết' }).click();
  await expect(page.getByText(/Bé chưa có sticker nào/)).toBeVisible();

  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: 'Về màn hình của bé' }).click();
  await page.getByRole('button', { name: 'Sticker của bé' }).click();
  await expect(page.locator('.sticker-count')).toHaveText('0/40');
});

test('chọn đúng hình thì sao bay ra ngay trên hình đó', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Animals', exact: true }).click();
  const next = page.getByRole('button', { name: 'Tiếp' });
  // Bấm ▶ để sang nhanh tới phần trò chơi.
  for (let i = 0; i < 40 && !(await page.locator('.choice').first().isVisible()); i++) {
    await next.click();
    await page.waitForTimeout(80);
  }
  await expect.poll(() => page.evaluate(() => window.kidEnglish.speaker.speaking)).toBe(false);
  // Chọn đúng đáp án của câu Bông vừa hỏi.
  const answers = { woof: 'dog', meow: 'cat', moo: 'cow', quack: 'duck', oink: 'pig', fly: 'bird' };
  const ask = await page.evaluate(() => window.__spoken.filter((t) => t.startsWith('Which one')).at(-1));
  const answer = answers[Object.keys(answers).find((k) => ask.includes(k))];
  const dog = page.locator(`.choice[data-word="${answer}"]`);
  await expect(dog).toBeVisible();
  // Ghi lại vị trí chùm sao ngay lúc nó xuất hiện (ở chế độ chạy nhanh, câu tiếp theo hiện ra rất sớm).
  await page.evaluate(() => {
    window.__burst = null;
    new MutationObserver((records) => {
      for (const r of records) {
        for (const n of r.addedNodes) {
          if (n.classList?.contains('star-burst') && n.classList.contains('on-target')) {
            const correct = document.querySelector('.choice.correct');
            window.__burst = { b: n.getBoundingClientRect().toJSON(), d: correct?.getBoundingClientRect().toJSON() };
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
  for (let i = 0; i < 10 && !(await page.evaluate(() => window.__burst)); i++) {
    await page.locator('.idle-pause').click({ timeout: 300 }).catch(() => {});
    await dog.click({ timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(100);
  }
  const { b, d } = await page.evaluate(() => window.__burst);
  const center = (r) => [r.x + r.width / 2, r.y + r.height / 2];
  const [bx, by] = center(b);
  const [dx, dy] = center(d);
  expect(Math.abs(bx - dx)).toBeLessThan(20);
  expect(Math.abs(by - dy)).toBeLessThan(20);
});

test('tạo bài: bấm Copy prompt là copy được ngay, prompt dặn AI tránh từ đã có', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Tạo bài học' }).click();
  await expect(page.getByText(/tránh \d+ từ bé đã có/)).toBeVisible();
  await page.getByRole('button', { name: 'Copy prompt' }).click();
  await expect(page.getByRole('status')).toContainText('Đã copy prompt');
  // Clipboard trên Windows đổi xuống dòng thành \r\n.
  const copied = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n');
  expect(copied).toContain('Create one short English lesson about the topic: "Animals"');
  expect(copied).toMatch(/ALREADY LEARNED.*dog/);
  await expect(page.getByLabel('Prompt')).toHaveValue(copied);
  await expect(page.getByRole('link', { name: 'Mở ChatGPT' })).toBeVisible();
});

test('ảnh lưới: app tự đoán lưới thật (AI vẽ 3×3 thay vì yêu cầu), chọn từ cho từng ô, bỏ ô thừa', async ({ page }) => {
  await startApp(page);
  // Giống ảnh AI vẽ: nền trắng, đường kẻ xám nhạt, mỗi ô một hình màu ở giữa; 3×3 = 9 ô (bài có 6 từ).
  const colors = ['#f00', '#0a0', '#00f', '#fa0', '#0aa', '#a0a', '#888', '#888', '#888'];
  const png = await page.evaluate(async (colors) => {
    const c = document.createElement('canvas');
    c.width = 900; c.height = 900;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 900, 900);
    g.strokeStyle = '#e4e4e4';
    g.lineWidth = 6;
    for (const v of [300, 600]) {
      g.beginPath(); g.moveTo(v, 0); g.lineTo(v, 900); g.stroke();
      g.beginPath(); g.moveTo(0, v); g.lineTo(900, v); g.stroke();
    }
    colors.forEach((color, i) => {
      g.fillStyle = color;
      g.beginPath();
      g.arc((i % 3) * 300 + 150, Math.floor(i / 3) * 300 + 150, 90, 0, Math.PI * 2);
      g.fill();
    });
    return c.toDataURL('image/png').split(',')[1];
  }, colors);
  await openParent(page);
  await page.getByRole('button', { name: 'Quản lý bài' }).click();
  await page.getByRole('button', { name: /Animals/ }).click();
  await expect(page.getByRole('heading', { name: /Ảnh lưới.*3×3/ })).toBeVisible();
  await page.locator('section', { hasText: 'Ảnh lưới' }).locator('input[type=file]')
    .setInputFiles({ name: 'grid.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });

  await expect(page.getByLabel('Kiểu lưới')).toHaveValue('3x3');
  await expect(page.getByLabel('Kiểu lưới').locator('option:checked')).toContainText('app đoán');
  await expect(page.locator('.grid-cell')).toHaveCount(9);
  // Mặc định theo thứ tự; 3 ô thừa ở cuối là "bỏ qua".
  await expect(page.getByLabel('Từ cho ô 1')).toHaveValue('dog');
  await expect(page.getByLabel('Từ cho ô 7')).toHaveValue('');

  // Chọn trùng từ thì báo lỗi.
  await page.getByLabel('Từ cho ô 7').selectOption('dog');
  await page.getByRole('button', { name: 'Lưu các ảnh này' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'đang được chọn cho 2 ô' })).toBeVisible();
  await page.getByLabel('Từ cho ô 7').selectOption('');

  // Đổi kiểu lưới thì cắt lại.
  await page.getByLabel('Kiểu lưới').selectOption('2x2');
  await expect(page.locator('.grid-cell')).toHaveCount(4);
  await page.getByLabel('Kiểu lưới').selectOption('3x3');
  await expect(page.locator('.grid-cell')).toHaveCount(9);

  await page.getByRole('button', { name: 'Lưu các ảnh này' }).click();
  await expect(page.locator('img.thumb')).toHaveCount(6);
  // Ô thứ 2 (cat) phải là hình tròn màu xanh lá ở giữa.
  const color = await page.evaluate(async () => {
    const lessons = await window.kidEnglish.db.getAll('lessons');
    const id = lessons.find((l) => l.title === 'Animals').id;
    const imgs = await window.kidEnglish.db.getAllByIndex('images', 'lessonId', id);
    const cat = imgs.find((i) => i.word === 'cat');
    const bmp = await createImageBitmap(new Blob([cat.data], { type: cat.mimeType }));
    const c = document.createElement('canvas');
    c.width = bmp.width; c.height = bmp.height;
    const g = c.getContext('2d');
    g.drawImage(bmp, 0, 0);
    return Array.from(g.getImageData(bmp.width / 2, bmp.height / 2, 1, 1).data.slice(0, 3));
  });
  expect(color[1]).toBeGreaterThan(120);
  expect(color[0]).toBeLessThan(60);
});

test('chia sẻ bài: xuất file bài rồi nhập lại trên máy khác', async ({ page, browser }) => {
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Quản lý bài' }).click();
  await page.getByRole('button', { name: /Colors/ }).click();
  await page.getByRole('button', { name: '1. Tạo file bài' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '2. Gửi file' }).click();
  const file = await (await download).path();
  expect((await download).suggestedFilename()).toMatch(/^kid-english-bai-colors-\d{4}-\d{2}-\d{2}\.zip$/);

  // "Máy khác": context mới, xóa bài Colors có sẵn rồi nhập file.
  const other = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await fakeSpeech(other);
  await startApp(other);
  await other.evaluate(async () => {
    const app = window.kidEnglish;
    for (const l of await app.db.getAll('lessons')) if (l.title === 'Colors') await app.db.delete('lessons', l.id);
  });
  await openParent(other);
  await other.getByRole('button', { name: 'Quản lý bài' }).click();
  await expect(other.getByRole('button', { name: /Colors/ })).toHaveCount(0);
  await other.locator('input[type=file]').setInputFiles(file);
  await expect(other.getByRole('status')).toContainText('Đã nhập 1 bài mới');
  await expect(other.getByRole('button', { name: /Colors/ })).toBeVisible();

  // Sửa bài trên máy đầu (đổi tên) rồi chia sẻ lại → máy kia cập nhật bài đã có, không tạo bài trùng.
  await page.getByLabel('Tên bài').fill('Colors đẹp');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('button', { name: '1. Tạo file bài' }).click();
  const download2 = page.waitForEvent('download');
  await page.getByRole('button', { name: '2. Gửi file' }).click();
  await other.locator('input[type=file]').setInputFiles(await (await download2).path());
  await expect(other.getByRole('status').filter({ hasText: 'cập nhật 1 bài đã có' })).toBeVisible();
  await expect(other.getByRole('button', { name: /Colors đẹp/ })).toBeVisible();
  await expect(other.locator('.lesson-row', { hasText: 'Colors' })).toHaveCount(1);

  // Nhập lại file cũ thì không đổi gì.
  await other.locator('input[type=file]').setInputFiles(file);
  await expect(other.getByRole('status').filter({ hasText: 'Không có gì thay đổi' })).toBeVisible();
  await other.context().close();
});

test('học xong: hộp quà mở nắp, sticker bay vào, rồi mới hiện nút ✔', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Colors', exact: true }).click();
  await playThrough(page);
  await expect(page.locator('.gift')).toBeVisible();
  await expect(page.locator('.gift.wiggle')).toBeAttached();
  const opacity = await page.locator('.prize-sticker').evaluate((el) => getComputedStyle(el).opacity);
  expect(Number(opacity)).toBeLessThan(0.1);
});

test('bài cùng tên được đặt "Animals 2"; danh sách bài chia tab theo chủ đề', async ({ page }) => {
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Dán bài' }).click();
  await page.getByPlaceholder(/Dán toàn bộ câu trả lời/).fill(JSON.stringify({
    title: 'Animals', emoji: '🐸',
    words: [{ en: 'frog', vi: 'con ếch', emoji: '🐸' }, { en: 'lion', vi: 'sư tử', emoji: '🦁' }],
  }));
  await page.getByRole('button', { name: 'Kiểm tra bài' }).click();
  await expect(page.getByText(/sẽ được lưu là "Animals 2"/)).toBeVisible();
  await page.getByRole('button', { name: 'Lưu bài' }).click();
  await expect(page.getByLabel('Tên bài')).toHaveValue('Animals 2');
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: 'Về màn hình của bé' }).click();

  await page.getByRole('button', { name: 'Bài học' }).click();
  const tabs = page.locator('.topic-tab');
  await expect(tabs).toHaveText(['⭐All', '🐸Animals', '🌈Colors']);
  await expect(page.locator('.lesson-card')).toHaveCount(3);
  await page.locator('.topic-tab', { hasText: 'Colors' }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(1);
  await page.locator('.topic-tab', { hasText: 'Animals' }).click();
  await expect(page.locator('.lesson-card .lesson-title')).toHaveText(['Animals 2', 'Animals']);
  await expect(page.getByRole('button', { name: 'Animals 2' }).locator('.lesson-words')).toHaveText('🐸🦁');
});

test('ảnh không đọc được thì hiện emoji thay vì biểu tượng ảnh hỏng', async ({ page }) => {
  await startApp(page);
  await page.evaluate(async () => {
    const db = window.kidEnglish.db;
    const animals = (await db.getAll('lessons')).find((l) => l.title === 'Animals');
    await db.put('images', {
      id: 'broken', lessonId: animals.id, word: 'dog', data: new TextEncoder().encode('không phải ảnh').buffer,
      mimeType: 'image/jpeg', createdAt: Date.now(),
    });
  });
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Animals', exact: true }).click();
  await expect(page.locator('.word-label')).toHaveText('dog');
  await expect(page.locator('.visual.big .emoji')).toHaveText('🐶');
  await expect(page.locator('.visual.big img')).toHaveCount(0);
});
