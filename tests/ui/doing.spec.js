// Mẫu câu "Ai đang làm gì?" (SPEC-patterns2.md, P1): tab riêng trong Mẫu câu; ngôi nhà ô cửa theo Hồ sơ của bé;
// phần A (2 người làm mẫu → bé nói "I am …"), phần B (hỏi – đáp); nhận câu 3 mức, mời nói lại tối đa một lần; sao theo người;
// Học tiếp giữ nguyên người và câu hỏi.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());

/**
 * Nhận dạng giả: bé "nói" về người đang sáng (.dg-win.active) và hành động có emoji đang hiện trong ô đó.
 * `window.__kidSaysQueue`: mỗi lần nghe lấy một kiểu — 'full' (Daddy is brushing / I am brushing), 'partial'
 * (I is brushing), 'keyword' (brushing), 'none' (không nói). Hết hàng đợi thì 'full'. `__kidHeard`: các lần nghe.
 */
async function fakeRecognizer(page, queue = []) {
  await page.evaluate(async (q) => {
    const app = window.kidEnglish;
    const lessons = (await app.db.getAll('lessons')).filter((l) => l.style === 'doing');
    window.__ingOf = new Map(lessons.flatMap((l) => l.actions).map((a) => [a.emoji, a.en.split(' ')[0]]));
    window.__kidSaysQueue = q;
    window.__kidHeard = [];
    app.recognizer = {
      enabled: true,
      reason: '',
      setAllowed() {},
      selfTest: async () => true,
      begin(onHeard) {
        const win = document.querySelector('.dg-win.active');
        const person = win?.dataset.person ?? '';
        const ing = window.__ingOf.get(win?.querySelector('.dg-thing')?.textContent) ?? '';
        const name = win?.querySelector('.dg-name')?.textContent ?? '';
        const says = window.__kidSaysQueue.shift() ?? 'full';
        window.__kidHeard.push({ person, ing, says });
        const subject = person === 'me' ? 'I am' : `${name} is`;
        const text = { full: `${subject} ${ing}`, partial: `${person === 'me' ? 'I is' : 'is'} ${ing}`, keyword: ing, none: '' }[says];
        const heard = text ? [text] : [];
        setTimeout(() => heard.length && onHeard(heard), 30);
        return { stop: async () => heard };
      },
    };
  }, queue);
}

async function openDoing(page, title) {
  await page.getByRole('button', { name: 'Mẫu câu' }).click();
  await page.locator('.topic-tab[data-topic="Who is doing?"]').click();
  await page.getByRole('button', { name: title, exact: true }).click();
  await expect(page.locator('.dg-house')).toBeVisible();
}

const lessonByTitle = (page, title) => page.evaluate(async (t) => (await window.kidEnglish.db.getAll('lessons')).find((l) => l.title === t && l.style === 'doing'), title);
/** Phần C "Who is…?": tự chạm đúng người (cho các test chạy hết bài). */
async function autoWho(page) {
  await page.evaluate(() => setInterval(() => {
    if (document.querySelector('.stage')?.dataset.stage !== 'doing-who') return;
    const id = document.querySelector('.dg-scene')?.dataset.whoTarget;
    document.querySelector(`.dg-win[data-person="${id}"]`)?.click();
  }, 150));
}

const people = (page) => page.locator('.dg-win').evaluateAll((els) => els.map((e) => e.dataset.person));

test('tab "Who is doing?" trong Mẫu câu: 4 bài, thẻ hiện "I am ___ing."', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Mẫu câu' }).click();
  await page.locator('.topic-tab[data-topic="Who is doing?"]').click();
  const cards = page.locator('.lesson-card');
  await expect(cards).toHaveCount(4);
  await expect(cards.locator('.lesson-title')).toHaveText(['Morning', 'At home', 'Play time', 'Bedtime']);
  await expect(cards.first().locator('.lesson-frame')).toHaveText('I am ___ing.');
});

test('DO-01: Hồ sơ mặc định → nhà có Mummy, Daddy, Me; phần A: Daddy … his, Mummy … her, rồi bé "I am …"; cả câu → sao theo người; xong bài', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await fakeRecognizer(page);
  await openDoing(page, 'Morning');
  await expect(page.locator('.dg-win')).toHaveCount(3);
  expect(await people(page)).toEqual(['mummy', 'daddy', 'me']);
  await expect.poll(() => spoken(page), { timeout: 20_000 }).toContain('You are brushing your teeth!');
  const said = await spoken(page);
  const at = (t) => said.indexOf(t);
  expect(at('Look! Daddy is brushing his teeth.')).toBeGreaterThan(-1);
  expect(at('Mummy is brushing her teeth.')).toBeGreaterThan(at('Look! Daddy is brushing his teeth.'));
  expect(at('And you? What are you doing?')).toBeGreaterThan(at('Mummy is brushing her teeth.'));
  expect(at('brushing my teeth!')).toBeGreaterThan(at('I am…'));
  expect(at('Great job!')).toBeGreaterThan(at('brushing my teeth!'));
  // Hết bài: phần B có câu hỏi về bé + câu hỏi về người trong nhà; Hoan hô.
  await autoWho(page);
  await expect(page.locator('.done-btn')).toBeVisible({ timeout: 60_000 });
  const all = await spoken(page);
  expect(all).toContain('What are you doing?');
  expect(all.some((t) => /^What is (Daddy|Mummy) doing\?$/.test(t))).toBe(true);
  expect(all.some((t) => /Grandma|Grandpa|brother|sister/.test(t))).toBe(false);
  // Sao câu lưu theo từng người.
  const keys = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).filter((r) => r.word.startsWith('doing:')).map((r) => [r.word, r.mastery]));
  expect(keys).toContainEqual(['doing:brush|me', 1]);
  expect(keys.every(([k]) => /\|(me|daddy|mummy)$/.test(k))).toBe(true);
});

test('DO-11: Hồ sơ chỉ tích Mummy → Bông vào làm người thứ hai ("Bông is …"); DO-04: Brother → "My brother is …"; ô Me bé trai', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.setSetting('childProfile', { name: 'Na', family: ['mummy'] }));
  await fakeRecognizer(page);
  await openDoing(page, 'At home');
  expect(await people(page)).toEqual(['mummy', 'bong', 'me']);
  await expect(page.locator('.dg-me .dg-name')).toHaveText('Na');
  await expect.poll(() => spoken(page), { timeout: 20_000 }).toContain('Bông is cooking.');
  await page.evaluate(() => window.kidEnglish.go('patterns'));

  await page.evaluate(() => window.kidEnglish.setSetting('childProfile', { family: ['brother', 'grandma'], kid: 'boy' }));
  await page.locator('.topic-tab[data-topic="Who is doing?"]').click();
  await page.getByRole('button', { name: 'Play time', exact: true }).click();
  await expect(page.locator('.dg-house')).toBeVisible();
  expect(await people(page)).toEqual(['grandma', 'brother', 'me']);
  // Ô Me: chưa có ảnh, Hồ sơ "bé trai" → hình bé trai vẽ sẵn.
  await expect(page.locator('.dg-me .dg-kid svg')).toHaveCount(1);
  await expect.poll(() => spoken(page), { timeout: 20_000 }).toContain('Look! My brother is playing ball.');
  await autoWho(page);
  await expect(page.locator('.done-btn')).toBeVisible({ timeout: 60_000 });
  expect((await lessonByTitle(page, 'Play time')).resume).toBeNull();
});

test('DO-07 / DO-08: nói "I is brushing" → khen + mời nói lại MỘT lần; không nói → không mời quá một lần, vẫn đi tiếp', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  // Hành động 1: một phần câu rồi cả câu. Hành động 2: không nói hai lần.
  await fakeRecognizer(page, ['partial', 'full', 'none', 'none']);
  await openDoing(page, 'Morning');
  await expect.poll(() => spoken(page), { timeout: 20_000 }).toContain('Look! Daddy is washing his face.');
  const said = await spoken(page);
  expect(said).toContain('Good! I am brushing my teeth!');
  expect(said.filter((t) => t === 'Say it with me: I am brushing my teeth!')).toHaveLength(1);
  await expect.poll(() => spoken(page), { timeout: 30_000 }).toContain('Look! Daddy is eating breakfast.');
  const after = await spoken(page);
  expect(after.filter((t) => t === "Let's try! I am washing my face!").length).toBeLessThanOrEqual(1);
  expect(after.filter((t) => t.startsWith('Say it with me: I am washing'))).toHaveLength(0);
});

test('DO-09 / DO-12: ra khỏi bài sau hành động 1 → Học tiếp: cùng người, cùng câu hỏi, đi tiếp hành động 2', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.setSetting('childProfile', { family: ['daddy', 'grandma', 'grandpa'] }));
  await fakeRecognizer(page);
  // Giữ câu đầu của hành động 2 ("Look! … drinking milk.") tới khi bị hủy: bài dừng đúng ở bước 2 (chế độ chạy nhanh
  // đi qua các bước rất nhanh, chờ chỗ dừng bằng cách hỏi liên tục dễ lỡ). Phải chặn ở `speaker.speak` như shapes2.spec.js.
  await page.evaluate(() => {
    const sp = window.kidEnglish.speaker;
    const speak = sp.speak.bind(sp);
    sp.speak = (text, opts = {}) => {
      if (!/^Look! .* drinking milk\.$/.test(text)) return speak(text, opts);
      window.__spoken.push(text);
      return new Promise((_, reject) => opts.signal?.addEventListener('abort', () => reject(new DOMException('Đã dừng', 'AbortError')), { once: true }));
    };
  });
  await openDoing(page, 'Bedtime');
  await expect.poll(() => spoken(page), { timeout: 20_000 }).toContainEqual(expect.stringMatching(/drinking milk\.$/));
  expect((await lessonByTitle(page, 'Bedtime')).resume.index).toBe(1);
  await page.evaluate(() => window.kidEnglish.go('patterns'));
  const before = await lessonByTitle(page, 'Bedtime');
  // Bố mẹ sửa Hồ sơ giữa lượt: lượt đang dở vẫn giữ người cũ.
  await page.evaluate(() => window.kidEnglish.setSetting('childProfile', { family: ['sister'] }));
  await page.evaluate(() => { window.__spoken.length = 0; });
  await page.locator('.topic-tab[data-topic="Who is doing?"]').click();
  await page.getByRole('button', { name: 'Bedtime', exact: true }).click();
  await page.getByRole('button', { name: 'Học tiếp' }).click();
  await expect(page.locator('.dg-house')).toBeVisible();
  expect(await people(page)).toEqual([...before.doingPlan.cast, 'me']);
  const name = { daddy: 'Daddy', grandma: 'Grandma', grandpa: 'Grandpa' }[before.doingPlan.pairs[1][0]];
  await expect.poll(() => spoken(page), { timeout: 20_000 }).toContain(`Look! ${name} is drinking milk.`);
  expect((await lessonByTitle(page, 'Bedtime')).doingPlan).toEqual(before.doingPlan);
  expect((await spoken(page)).some((t) => t.includes('taking a bath'))).toBe(false);
});

test('DO-14: phần C "Who is…?" — mỗi người một việc, ô Me mờ; chạm nhầm lần 1 → "That\'s …"; đúng → "Yes! …"; kết thúc "Everybody is … We are …"', async ({ page }) => {
  await fakeSpeech(page, { recognition: true });
  await startApp(page);
  await fakeRecognizer(page);
  await openDoing(page, 'At home');
  await page.waitForFunction(() => document.querySelector('.stage')?.dataset.stage === 'doing-who', null, { timeout: 60_000 });
  // Mỗi người trong cast có một đồ vật khác nhau; ô Me mờ.
  await expect(page.locator('.dg-win.dim[data-person="me"]')).toHaveCount(1);
  const things = await page.locator('.dg-win.pick .dg-thing').allTextContents();
  expect(new Set(things).size).toBe(things.length);
  await expect.poll(async () => (await spoken(page)).some((t) => /^Who is .+\?$/.test(t))).toBe(true);
  const target = await page.locator('.dg-scene').getAttribute('data-who-target');
  const wrong = await page.locator('.dg-win.pick').evaluateAll((els, t) => els.map((e) => e.dataset.person).find((id) => id !== t), target);
  await page.locator(`.dg-win[data-person="${wrong}"]`).click();
  await expect.poll(async () => (await spoken(page)).some((t) => /^That's (Daddy|Mummy)\. (Daddy|Mummy) is .+! Who is .+\?$/.test(t))).toBe(true);
  await page.locator(`.dg-win[data-person="${target}"]`).click();
  await expect.poll(async () => (await spoken(page)).some((t) => /^Yes! (Daddy|Mummy) is .+!$/.test(t))).toBe(true);
  await autoWho(page);
  await expect(page.locator('.done-btn')).toBeVisible({ timeout: 60_000 });
  expect(await spoken(page)).toContain('Everybody is cooking! We are cooking!');
});
