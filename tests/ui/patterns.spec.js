// Mẫu câu (SPEC-patterns.md): nút 🌸 Mẫu câu, 8 bài có sẵn; phần A (chạm hình → hình vào chỗ trống → Bông đọc câu, ✓,
// nhắc rồi chỉ tự chọn MỘT hình); phần B nhận câu 3 mức (cả câu / một phần / từ khóa) — chỉ cả câu có sao; trò nghe → chạm
// không nói "Try again"; Học tiếp đúng bước.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const lastSaid = async (page) => (await spoken(page)).at(-1);
const pics = (page) => page.locator('.pt-pic');
const tapPic = (page, word) => page.locator(`.pt-pic[data-word="${word}"]`).dispatchEvent('click');

/**
 * Nhận dạng giả: bé "nói" theo `window.__kidSays` — 'full' (it is rainy), 'partial' (is rainy), 'keyword' (rainy), 'none'.
 * Từ khóa lấy từ hình đang sáng (.pt-pic.active). `window.__kidSaysQueue`: mỗi lần nghe lấy một kiểu theo thứ tự (hết thì
 * dùng `__kidSays`) — không phải đổi `__kidSays` đúng lúc (chế độ chạy nhanh rất dễ lệch lượt). `window.__kidHeard`: các
 * lần nghe { word, says }.
 */
async function fakeRecognizer(page, queue = []) {
  await page.evaluate((q) => {
    window.__kidSays = 'full';
    window.__kidSaysQueue = q;
    window.__kidHeard = [];
    const app = window.kidEnglish;
    app.recognizer = {
      enabled: true,
      reason: '',
      setAllowed() {},
      selfTest: async () => true,
      begin(onHeard) {
        const word = document.querySelector('.pt-pic.active')?.dataset.word ?? '';
        const frame = [...document.querySelectorAll('.pt-frame .pt-tok:not(.pt-after)')].map((t) => t.textContent).join(' ').toLowerCase();
        const says = window.__kidSaysQueue.shift() ?? window.__kidSays;
        window.__kidHeard.push({ word, says });
        const text = { full: `${frame} ${word}`, partial: `${frame.split(' ').slice(1).join(' ')} ${word}`, keyword: word, none: '' }[says];
        const heard = text ? [text] : [];
        setTimeout(() => heard.length && onHeard(heard), 30);
        return { stop: async () => heard };
      },
    };
  }, queue);
}
/** Thời gian nhắc / Bông tự chọn ở phần A (mili giây thật, không nhân hệ số chạy nhanh). */
const exploreTimers = (page, nudge, auto) => page.addInitScript(([n, a]) => {
  window.__kidTest = { ...(window.__kidTest ?? {}), patternNudgeMs: n, patternAutoMs: a };
}, [nudge, auto]);
/** Chạm hình cho tới khi được nhận (lúc Bông đang nói app bỏ qua chạm — đúng thiết kế). */
async function tapUntil(page, word, done) {
  await expect.poll(async () => {
    if (await done()) return true;
    await tapPic(page, word);
    return done();
  }, { timeout: 15_000, intervals: [150] }).toBe(true);
}

async function openLesson(page, title) {
  await page.getByRole('button', { name: 'Mẫu câu' }).click();
  await page.getByRole('button', { name: title, exact: true }).click();
  await expect(page.locator('.pt-poster')).toBeVisible();
}

test('nút 🌸 Mẫu câu: 8 bài có sẵn (Weather đầu, Body cuối), thẻ hiện khung câu; mở app lại không sinh bản sao', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Mẫu câu' }).click();
  const cards = page.locator('.lesson-card');
  await expect(cards).toHaveCount(8);
  await expect(cards.first()).toHaveAttribute('aria-label', 'Weather');
  await expect(cards.last()).toHaveAttribute('aria-label', 'Body');
  await expect(cards.first().locator('.lesson-frame')).toHaveText('It is ___.');
  await expect(page.locator('.lesson-card[aria-label="Animals"] .lesson-frame')).toHaveText('I can see ___.');
  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).filter((l) => l.kind === 'patterns').length)).toBe(8);
});

test('phần A: Bông đọc khung, chạm mẫu "sunny"; bé chạm "rainy" → hình vào chỗ trống, "It is rainy!", ✓; đủ hình thì sang phần B', async ({ page }) => {
  await exploreTimers(page, 1e9, 1e9); // bé tự chạm: Bông không tự chọn trong lúc test
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Weather');
  await expect(pics(page)).toHaveCount(6);
  await expect.poll(() => spoken(page)).toContain('Weather! It is…');
  await expect.poll(() => spoken(page)).toContain('It is sunny!');
  await expect.poll(() => lastSaid(page)).toBe('Your turn! Tap a picture!');
  await expect(page.locator('.pt-pic[data-word="sunny"]')).toHaveClass(/done/);
  await tapUntil(page, 'rainy', async () => /done/.test(await page.locator('.pt-pic[data-word="rainy"]').getAttribute('class')));
  await expect(page.locator('.pt-blank .pt-fill')).toContainText('rainy');
  await expect.poll(() => lastSaid(page)).toBe('It is rainy!');
  await expect(page.locator('.pt-pic[data-word="rainy"]')).toHaveClass(/done/);
  await expect(page.locator('.pt-say')).toHaveText('Trời mưa.');
  for (const w of ['cloudy', 'windy', 'hot', 'cold']) {
    await tapUntil(page, w, async () => /done/.test(await page.locator(`.pt-pic[data-word="${w}"]`).getAttribute('class')));
    // Hình cuối xong là app sang phần sau ngay (máy test không có mic): kiểm tra câu đã đọc, không phải câu cuối cùng.
    await expect.poll(() => spoken(page)).toContain(`It is ${w}!`);
  }
  // Đủ hình thì sang phần B (máy test không có mic nên phần B có thể đã qua nhanh — chỉ cần đã rời phần A).
  await expect(page.locator('.stage')).toHaveAttribute('data-stage', /^pattern-(say|tell|game|song)$/);
});

test('phần A: bé không chạm → nhắc "Tap a picture!", rồi Bông chỉ tự chọn MỘT hình và chờ tiếp', async ({ page }) => {
  await exploreTimers(page, 800, 1600); // nhắc sau 0,8 s, tự chọn sau 1,6 s (thời gian thật)
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Animals');
  await expect.poll(() => spoken(page)).toContain('Your turn! Tap a picture!');
  // Mỗi lần Bông tự chọn đúng MỘT hình, và trước mỗi lần đều có lời nhắc "Tap a picture!" (chờ bé, không đi liền).
  const done = page.locator('.pt-pic.done');
  await expect(done).toHaveCount(2, { timeout: 10_000 });
  const nudgesAt2 = (await spoken(page)).filter((t) => t === 'Tap a picture!').length;
  expect(nudgesAt2).toBeGreaterThanOrEqual(1);
  await expect(done).toHaveCount(3, { timeout: 10_000 });
  const nudgesAt3 = (await spoken(page)).filter((t) => t === 'Tap a picture!').length;
  expect(nudgesAt3).toBeGreaterThan(nudgesAt2);
  // Câu Bông đọc giữa hai lần nhắc chỉ có MỘT câu "I can see …".
  const said = await spoken(page);
  const lastTwoNudges = said.map((t, i) => (t === 'Tap a picture!' ? i : -1)).filter((i) => i >= 0).slice(-2);
  expect(said.slice(lastTwoNudges[0], lastTwoNudges[1]).filter((t) => t.startsWith('I can see ')).length).toBe(1);
});

test('phần B: nói cả câu → "Great job!" + sao câu; chỉ từ khóa → "Yes! …" + mời nói lại một lần, không có sao; một phần câu → "Good! …"', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  // Lần nghe 1: cả câu; 2–3: chỉ từ khóa (lần đầu + lần mời nói lại); 4: một phần câu.
  await fakeRecognizer(page, ['full', 'keyword', 'keyword', 'partial']);
  await page.evaluate(() => { window.__kidSays = 'none'; }); // hết hàng đợi: bé im lặng (không nâng mức tốt nhất của câu)
  await openLesson(page, 'Weather');
  await page.locator('.next-btn').click(); // bỏ qua phần A
  await expect(page.locator('.stage')).toHaveAttribute('data-stage', 'pattern-say');
  await expect.poll(() => page.evaluate(() => window.__kidHeard.length), { timeout: 20_000 }).toBeGreaterThanOrEqual(4);
  const heard = await page.evaluate(() => window.__kidHeard);
  const [w1, w2, , w3] = heard.map((x) => x.word);
  expect(heard[2].word).toBe(w2); // lần mời nói lại vẫn là câu 2

  // Câu 1: cả câu → "Great job!" + sao câu.
  await expect.poll(() => spoken(page)).toContain('Great job!');
  await expect.poll(() => page.evaluate(async (k) => (await window.kidEnglish.db.get('progress', k))?.mastery ?? 0, `pattern:it is ___|${w1}`)).toBe(1);

  // Câu 2: chỉ từ khóa → khen + mời nói lại; lần mời vẫn chỉ từ khóa → không có sao.
  const cap = w2.charAt(0).toUpperCase() + w2.slice(1);
  await expect.poll(() => spoken(page)).toContain(`Yes! ${cap}! It is ${w2}!`);
  expect(await spoken(page)).toContain(`Say it with me: It is ${w2}!`);
  const rec2 = await page.evaluate(async (k) => window.kidEnglish.db.get('progress', k), `pattern:it is ___|${w2}`);
  expect(rec2?.mastery ?? 0).toBe(0);

  // Câu 3: một phần câu → "Good! …", mức tốt nhất 'partial'.
  await expect.poll(() => spoken(page), { timeout: 15_000 }).toContain(`Good! It is ${w3}!`);
  await expect.poll(() => page.evaluate(async (k) => (await window.kidEnglish.db.get('progress', k))?.bestLevel, `pattern:it is ___|${w3}`)).toBe('partial');
});

test('trò nghe → chạm (Animals, lần trước là reveal): chạm nhầm → "That\'s a …! Can you find the …?", không bao giờ "Try again"', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  // Đặt sẵn chỗ dừng ở phần trò chơi; lần học trước kiểu chính là reveal → lần này kiểu chính là listenTap.
  await page.evaluate(async () => {
    const db = window.kidEnglish.db;
    const lesson = (await db.getAll('lessons')).find((l) => l.builtin === 'patterns-animals');
    await db.put('lessons', { ...lesson, lastGame: 'reveal', resume: { stage: 'game', index: 0, savedAt: Date.now(), progress: 0.7 } });
  });
  await page.getByRole('button', { name: 'Mẫu câu' }).click();
  await page.getByRole('button', { name: 'Animals', exact: true }).click();
  await page.getByRole('button', { name: 'Học tiếp' }).click();
  await expect.poll(async () => (await lastSaid(page))?.startsWith('I can see '), { timeout: 15_000 }).toBe(true);
  const target = (await lastSaid(page)).match(/^I can see an? (\w+)!$/)[1];
  const wrong = await page.locator(`.pt-pic:not([data-word="${target}"])`).first().getAttribute('data-word');
  // Chạm lúc Bông đang nói thì app bỏ qua (đúng thiết kế): chạm lại tới khi được nhận.
  await tapUntil(page, wrong, async () => (await spoken(page)).includes(`That's a ${wrong}! Can you find the ${target}?`));
  await tapUntil(page, target, async () => (await spoken(page)).includes(`Yes! I can see a ${target}!`));
  expect((await spoken(page)).some((t) => /try again/i.test(t))).toBe(false);
});

test('Học tiếp: ra nền rồi quay lại trong phần B → tiếp đúng phần B, các hình phần A vẫn có ✓', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openLesson(page, 'Weather');
  await page.locator('.next-btn').click();
  await expect(page.locator('.stage')).toHaveAttribute('data-stage', 'pattern-say');
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(page.locator('.stage')).toHaveAttribute('data-stage', 'pattern-say');
  await expect(page.locator('.pt-pic.done')).toHaveCount(6);
});
