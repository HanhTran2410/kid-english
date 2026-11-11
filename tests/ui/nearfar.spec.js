// Mẫu câu "Gần – xa" (SPEC-patterns2.md mục 4, P2): tab "This and that"; This → Bông đứng sát + chạm đồ gần (👇, vòng sáng),
// That → Bông chỉ tay + đường chấm tới đồ xa; đồ gần to, đồ xa nhỏ; nhận câu 3 mức, nói nhầm this / that; sao câu;
// Học tiếp giữ nguyên câu hỏi phần B.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());

/**
 * Nhận dạng giả: bé "nói" về đồ đang được chạm / chỉ (theo `data-mode` của tranh). `window.__kidSaysQueue`: mỗi lần nghe
 * lấy một kiểu — 'full' (That is a kite), 'partial' (It is a kite), 'swapped' (This is a kite khi đồ ở xa),
 * 'keyword' (kite), 'none'. Hết hàng đợi thì 'full'.
 */
async function fakeRecognizer(page, queue = []) {
  await page.evaluate((q) => {
    const app = window.kidEnglish;
    window.__kidSaysQueue = q;
    window.__kidHeard = [];
    app.recognizer = {
      enabled: true,
      reason: '',
      setAllowed() {},
      selfTest: async () => true,
      begin(onHeard) {
        const scene = document.querySelector('.nf-scene');
        const which = scene?.dataset.mode || 'this';
        const name = scene?.querySelector(which === 'this' ? '.nf-near' : '.nf-far')?.getAttribute('aria-label') ?? '';
        const says = window.__kidSaysQueue.shift() ?? 'full';
        window.__kidHeard.push({ which, name, says });
        const other = which === 'this' ? 'that' : 'this';
        const text = { full: `${which} is a ${name}`, partial: `it is a ${name}`, swapped: `${other} is a ${name}`, keyword: name, none: '' }[says];
        const heard = text ? [text] : [];
        setTimeout(() => heard.length && onHeard(heard), 30);
        return { stop: async () => heard };
      },
    };
  }, queue);
}

async function openNear(page, title) {
  await page.getByRole('button', { name: 'Mẫu câu' }).click();
  await page.locator('.topic-tab[data-topic="This and that"]').click();
  await page.getByRole('button', { name: title, exact: true }).click();
  await expect(page.locator('.nf-scene')).toBeVisible();
}
const lessonByTitle = (page, title) => page.evaluate(async (t) => (await window.kidEnglish.db.getAll('lessons')).find((l) => l.title === t && l.style === 'nearFar'), title);
/** Phần C "Bring it close!": tự chạm đồ (đồ tự bay tới vùng đích) — cho các test chạy hết bài. */
async function autoBring(page) {
  await page.evaluate(() => setInterval(() => {
    if (document.querySelector('.stage')?.dataset.stage !== 'near-bring') return;
    const m = document.querySelector('.nf-mover:not([hidden])');
    if (!m) return;
    const r = m.getBoundingClientRect();
    const o = { pointerId: 9, bubbles: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 };
    m.dispatchEvent(new PointerEvent('pointerdown', o));
    m.dispatchEvent(new PointerEvent('pointerup', o));
  }, 200));
}

const centerOf = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

test('tab "This and that" trong Mẫu câu: 5 bài, thẻ hiện "This · That"', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Mẫu câu' }).click();
  await page.locator('.topic-tab[data-topic="This and that"]').click();
  const cards = page.locator('.lesson-card');
  await expect(cards).toHaveCount(5);
  await expect(cards.locator('.lesson-title')).toHaveText(['In the park', 'On the farm', 'At the beach', 'In the garden', 'In the street']);
  await expect(cards.first().locator('.lesson-frame')).toHaveText('This · That');
});

test('NF-01 / NF-03: This → Bông đứng sát + 👇 chạm đồ gần, vòng sáng; That → Bông về chỗ, chỉ tay + đường chấm; đồ xa ≈ 40% đồ gần', async ({ page }) => {
  await fakeSpeech(page, { recognition: true });
  await page.goto('/?nosw'); // tốc độ thật để đo vị trí Bông sau khi đi
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await fakeRecognizer(page, ['none', 'none', 'none', 'none']); // bé im lặng: Bông chờ nghe, giữ nguyên tư thế để đo
  await openNear(page, 'In the park');
  const scene = page.locator('.nf-scene');
  await expect(scene).toHaveAttribute('data-mode', 'this', { timeout: 15000 });
  await page.waitForTimeout(1000); // Bông đi xong
  const near = await page.locator('.nf-near').boundingBox();
  const far = await page.locator('.nf-far').boundingBox();
  const sceneBox = await scene.boundingBox();
  expect(far.height / near.height).toBeGreaterThan(0.3);
  expect(far.height / near.height).toBeLessThan(0.5);
  await expect(page.locator('.nf-hand')).toHaveText('👇');
  await expect(page.locator('.nf-scene .bunny')).toHaveCount(1); // Bông ở trong tranh
  const bongNear = centerOf(await page.locator('.nf-scene .bunny').boundingBox());
  expect(Math.abs(bongNear.x - centerOf(near).x)).toBeLessThan(sceneBox.width * 0.3); // đứng sát đồ gần
  expect(await page.locator('.nf-ring').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  await expect(page.locator('.nf-line')).toHaveAttribute('data-which', 'this');
  await expect(page.locator('.nf-line')).toContainText('This is a flower.');

  await expect(scene).toHaveAttribute('data-mode', 'that', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await expect(page.locator('.nf-hand')).toHaveText(/👉|👈/);
  const bongFar = centerOf(await page.locator('.nf-scene .bunny').boundingBox());
  expect(bongFar.x - bongNear.x).toBeGreaterThan(sceneBox.width * 0.2); // về chỗ của mình
  expect(await page.locator('.nf-dash').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  expect(await page.locator('.nf-ring').evaluate((e) => getComputedStyle(e).opacity)).toBe('0');
  await expect(page.locator('.nf-line')).toContainText('That is a tree.');
});

test('cả bài: nói cả câu → khen, sao câu near:this|… / near:that|…; phần B hỏi What is this / that; đọc nhanh như bài hát → Hoan hô', async ({ page }) => {
  await fakeSpeech(page, { recognition: true });
  await startApp(page);
  await fakeRecognizer(page);
  await openNear(page, 'In the park');
  await autoBring(page);
  await expect(page.locator('.done-btn')).toBeVisible({ timeout: 30000 });
  const lines = await spoken(page);
  for (const s of ['In the park!', 'Look! This is a flower.', 'That is a tree.', 'Look! This is a ball.', 'That is a kite.', 'What is this?', 'What is that?', "Let's sing!", 'This is a dog!', 'That is a bird!']) {
    expect(lines).toContain(s);
  }
  expect(lines.filter((t) => t === 'Great job!').length).toBeGreaterThanOrEqual(10); // 6 câu phần A + 4 câu phần B
  const stars = await page.evaluate(async () => Object.fromEntries((await window.kidEnglish.db.getAll('progress'))
    .filter((r) => r.word.startsWith('near:')).map((r) => [r.word, r.mastery])));
  for (const k of ['near:this|flower', 'near:that|tree', 'near:this|ball', 'near:that|kite', 'near:this|dog', 'near:that|bird']) expect(stars[k]).toBeGreaterThanOrEqual(1);
  const lesson = await lessonByTitle(page, 'In the park');
  expect(lesson.resume).toBeNull();
  expect(lesson.timesCompleted).toBe(1);
});

test('NF-05 / NF-06: "It is a flower" → một phần câu, Bông nói mẫu + mời nói lại; nói nhầm this / that → Bông làm lại động tác, không chấm sai', async ({ page }) => {
  await fakeSpeech(page, { recognition: true });
  await startApp(page);
  await fakeRecognizer(page, ['partial', 'full', 'swapped', 'full']);
  await openNear(page, 'In the park');
  await expect.poll(() => spoken(page)).toContain('Say it with me: This is a flower!');
  expect(await spoken(page)).toContain('Good! This is a flower!');
  // Câu "That is a tree." — bé nói "This is a tree": Bông nói mẫu đúng (kèm chỉ tay lại), không nói "wrong".
  await expect.poll(() => spoken(page)).toContain('Say it with me: That is a tree!');
  const lines = await spoken(page);
  expect(lines).toContain('Good! That is a tree!');
  expect(lines.some((t) => /wrong|no,/i.test(t))).toBe(false);
  const heard = await page.evaluate(() => window.__kidHeard);
  expect(heard.slice(0, 4).map((x) => `${x.which}:${x.name}:${x.says}`)).toEqual(['this:flower:partial', 'this:flower:full', 'that:tree:swapped', 'that:tree:full']);
});

test('Học tiếp: ra giữa phần B → vào lại đúng câu hỏi, cùng kế hoạch (không chọn lại)', async ({ page }) => {
  await fakeSpeech(page, { recognition: true });
  await startApp(page);
  await fakeRecognizer(page);
  await openNear(page, 'On the farm');
  // Mỗi câu phần B qua rất nhanh (?fast): bắt ngay khung hình đầu tiên của phần B rồi về màn hình chính.
  await page.waitForFunction(() => document.querySelector('.stage')?.dataset.stage === 'near-ask', null, { polling: 'raf', timeout: 20000 });
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  const before = await lessonByTitle(page, 'On the farm');
  expect(before.resume.stage).toBe('ask');
  const said = (await spoken(page)).length;
  await page.getByRole('button', { name: 'Mẫu câu' }).click();
  await page.getByRole('button', { name: 'On the farm', exact: true }).click();
  await page.getByRole('button', { name: 'Học tiếp' }).click();
  // Câu đầu tiên sau khi vào lại là câu hỏi phần B (không xem lại phần A).
  await expect.poll(async () => (await spoken(page)).slice(said).filter((t) => t !== 'Continue? Or start again?')[0]).toMatch(/^What is (this|that)\?$/);
  const after = await lessonByTitle(page, 'On the farm');
  expect(after.nearPlan).toEqual(before.nearPlan);
});

/** Kéo đồ (chuột thật) tới điểm (x, y) theo khung 400 × 300 của tranh. */
async function dragTo(page, x, y) {
  const m = await page.locator('.nf-mover').boundingBox();
  const s = await page.locator('.nf-scene').boundingBox();
  await page.mouse.move(m.x + m.width / 2, m.y + m.height / 2);
  await page.mouse.down();
  // Kéo vòng qua giữa tranh trước (thả lại đúng chỗ cũ mà không kéo đi đâu thì app hiểu là chạm).
  await page.mouse.move(s.x + s.width * 0.5, s.y + s.height * 0.55, { steps: 6 });
  await page.mouse.move(s.x + (x / 400) * s.width, s.y + (y / 300) * s.height, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(900); // đồ trôi về / bay tới (hiệu ứng thật 0,75 giây)
}

test('NF-07 / NF-08 / NF-11: "Bring it close!" — thả giữa hai vùng không tính sai; thả vùng sai → Bông nói lại; chạm → đồ bay tới đích; ra nền rồi vào lại đồ vẫn ở đích', async ({ page }) => {
  await fakeSpeech(page, { recognition: true });
  await startApp(page);
  await fakeRecognizer(page);
  await openNear(page, 'In the park');
  await page.waitForFunction(() => document.querySelector('.stage')?.dataset.stage === 'near-bring', null, { polling: 'raf', timeout: 30000 });
  const lesson = await lessonByTitle(page, 'In the park');
  const round = lesson.nearPlan.bring[0];
  const from = round.which === 'this' ? 'far' : 'near';
  const to = round.which === 'this' ? 'near' : 'far';
  const mover = page.locator('.nf-mover');
  await expect(mover).toHaveAttribute('data-zone', from);
  const command = round.which === 'this' ? /^This is .+! Bring it close!$/ : /^That is .+! Put it far away!$/;
  await expect.poll(async () => (await spoken(page)).filter((t) => command.test(t)).length).toBe(1);
  // Thả giữa hai vùng (giữa tranh, bên phải) → trôi về, không tính sai.
  await dragTo(page, 330, 170);
  await expect(mover).toHaveAttribute('data-zone', from);
  // Thả vào vùng sai (chính vùng đang ở) → trôi về, tính một lần sai: Bông nói lại câu lệnh.
  const fromCenter = { park: { near: [84, 242], far: [230, 118] } }.park[from];
  await dragTo(page, fromCenter[0], fromCenter[1]);
  await expect.poll(async () => (await spoken(page)).filter((t) => command.test(t)).length).toBe(2);
  // Chạm → đồ tự bay tới vùng đích.
  await page.waitForTimeout(300);
  const b = await mover.boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(mover).toHaveAttribute('data-zone', to);
  await expect.poll(async () => (await spoken(page)).some((t) => /^Yes! (This|That) is .+!$/.test(t))).toBe(true);
  await expect.poll(async () => (await lessonByTitle(page, 'In the park')).nearPlan.bring[0].done).toBe(true);
  // Ra nền rồi vào lại (Học tiếp): đồ vẫn ở vùng đích, không phải đưa lại.
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await page.getByRole('button', { name: 'Mẫu câu' }).click();
  await page.getByRole('button', { name: 'In the park', exact: true }).click();
  await page.getByRole('button', { name: 'Học tiếp' }).click();
  const r2 = (await lessonByTitle(page, 'In the park')).resume;
  if (r2?.stage === 'bring' && r2.index === 0) {
    await expect(mover).toHaveAttribute('data-zone', to);
  }
  await autoBring(page);
  await expect(page.locator('.done-btn')).toBeVisible({ timeout: 30000 });
  const stars = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).filter((r) => r.word.startsWith('near:')).length);
  expect(stars).toBeGreaterThan(0);
});

test('Góc bố mẹ: Tạo bài mẫu câu có 3 kiểu — prompt "Ai đang làm gì?" (motion), "Gần – xa" (mã sticker + mạo từ); Bé đã học có sao khung', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const db = window.kidEnglish.db;
    const rec = (word, mastery) => ({ word, emoji: '', mastery, practiceCount: 1, lastPracticedAt: 1, lastVoiceDay: null });
    for (const r of [rec('doing:cook|me', 1), rec('doing:read|me', 2), rec('doing:cook|daddy', 1), rec('doing:cook|mummy', 1), rec('near:this|flower', 1), rec('near:that|tree', 0)]) await db.put('progress', r);
  });
  await openParent(page);
  await page.getByRole('button', { name: 'Tạo bài mẫu câu' }).click();
  const prompt = page.locator('.prompt-area');
  await page.getByText('👉 Gần – xa').click();
  await page.getByText('🚜 Nông trại').click();
  await page.getByRole('button', { name: 'Copy prompt' }).click();
  await expect(prompt).toHaveValue(/"style": "nearFar"/);
  await expect(prompt).toHaveValue(/"scene": "farm"/);
  await expect(prompt).toHaveValue(/egg \(egg, an\)/);
  await expect(prompt).toHaveValue(/sun \(sun, the\)/);
  await page.getByText('👨‍👩‍👧 Ai đang làm gì?').click();
  await expect(page.getByText('Chọn tranh (tranh của Dán tranh có vùng gần / xa)')).toBeHidden();
  await page.getByRole('button', { name: 'Copy prompt' }).click();
  await expect(prompt).toHaveValue(/"style": "doing"/);
  await expect(prompt).toHaveValue(/"motion": exactly one of: .*brush/);
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: 'Bé đã học' }).click();
  await expect(page.getByText('Mẫu câu — bé nói được khung câu')).toBeVisible();
  const rows = page.locator('.progress-list').first().locator('li');
  await expect(rows.nth(0)).toContainText('I am …ing');
  await expect(rows.nth(0)).toContainText('với 2 hành động');
  await expect(rows.nth(1)).toContainText('với 1 hành động'); // He is: Daddy
  await expect(rows.nth(2)).toContainText('với 1 hành động'); // She is: Mummy
  await expect(rows.nth(3)).toContainText('với 1 đồ'); // This is
  await expect(rows.nth(4)).toContainText('chưa có'); // That is: tree chưa có sao
});
