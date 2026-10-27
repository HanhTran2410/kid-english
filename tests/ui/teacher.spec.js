// 👩‍🏫 Cô giáo nhí (SPEC-jobs.md mục 5): Bông nói tên hình (đôi khi sai), bé chấm ✅ / ❌; 5 hình → sticker.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const saidSince = async (page, n, re) => (await spoken(page)).slice(n).some((t) => re.test(t));
const play = (page) => page.locator('.tc-play');
const isRight = async (page) => (await page.locator('.tc-picture').getAttribute('data-right')) === 'true';

async function openTeacher(page, settings, before, { actionsAt = 4, roll = true } = {}) {
  await fakeSpeech(page);
  await page.addInitScript((n) => { window.__kidTest = { teacherActionsAt: n }; }, actionsAt);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('teacherGame', s), settings);
  if (before) await before();
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await expect(page.locator('.jb-job')).toHaveCount(await page.evaluate(async () => (await import('/js/screens/jobs.js')).JOBS.length));
  await page.getByRole('button', { name: 'Cô giáo nhí' }).click();
  await expect(play(page)).toHaveAttribute('data-state', 'bell', { timeout: 15000 });
  if (!roll) return;
  await doRoll(page);
  await expect(play(page)).toHaveAttribute('data-state', /judge|act/, { timeout: 15000 });
}
/** SPEC-jobs2 TE1: rung chuông rồi điểm danh đúng từng bạn (đọc `data-word` của bảng). */
async function doRoll(page) {
  await page.locator('.tc-bell').click();
  const n = await page.locator('.tc-pupil').count();
  for (let i = 0; i < n; i++) {
    await expect(play(page)).toHaveAttribute('data-state', 'roll', { timeout: 15000 });
    await expect(page.locator('.tc-pupil[data-here="true"]')).toHaveCount(i, { timeout: 15000 });
    await page.locator(`.tc-pupil[data-pupil="${await page.locator('.tc-picture').getAttribute('data-word')}"]`).click();
  }
}
/** SPEC-jobs2 TE1: ca Classroom actions — chạm đúng thẻ (mức 1: thẻ chưa dùng) đủ 3 lệnh. */
async function doActions(page) {
  for (let i = 0; i < 3; i++) {
    await expect(play(page)).toHaveAttribute('data-state', 'act', { timeout: 15000 });
    await expect(page.locator('.tc-card.used')).toHaveCount(i, { timeout: 15000 });
    const want = await page.locator('.tc-picture').getAttribute('data-word');
    await page.locator(want ? `.tc-card[data-action="${want}"]` : '.tc-card:not(.used)').first().click();
  }
}
/** SPEC-jobs2 TE2: phát đủ sao cho từng bạn (đọc `data-word` "bạn:số sao" của bảng). */
async function doStars(page) {
  for (let k = 0; k < 2; k++) {
    await expect(play(page)).toHaveAttribute('data-state', 'stars', { timeout: 15000 });
    const [pupil, n] = (await page.locator('.tc-picture').getAttribute('data-word')).split(':');
    for (let i = 0; i < Number(n); i++) {
      await expect(play(page)).toHaveAttribute('data-state', 'stars', { timeout: 15000 });
      await page.locator('.tc-starbox').click();
      await expect(page.locator(`.tc-pupil[data-pupil="${pupil}"]`)).toHaveAttribute('data-stars', String(i + 1), { timeout: 15000 });
    }
  }
}
async function judgeRight(page, i) {
  await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/5`, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', /judge|act/, { timeout: 15000 });
  if ((await play(page).getAttribute('data-state')) === 'act') return doActions(page);
  await page.getByRole('button', { name: (await isRight(page)) ? 'Đúng' : 'Sai' }).click();
}

test('mức 1: Bông giơ tay nói tên; JOBS-05 — chấm nhầm thì Bông nói lại, bé chọn lại (không sang câu), nhầm 2 lần nút đúng nhún; chấm đúng → câu 2', async ({ page }) => {
  await openTeacher(page);
  const said = await spoken(page);
  expect(said).toContain("Let's learn! I'm ready!");
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
    await expect(play(page)).toHaveAttribute('data-state', /judge|act/, { timeout: 15000 });
    if ((await play(page).getAttribute('data-state')) === 'judge' && !(await isRight(page))) wrong++;
    await judgeRight(page, i);
  }
  expect(wrong >= 2 && wrong <= 3).toBe(true);
  await expect.poll(async () => (await spoken(page)).includes('Thank you, teacher! I learned a lot!'), { timeout: 15000 }).toBe(true);
  // SPEC-jobs2 TE2: chào tạm biệt lớp (mức 1 không phát sao).
  await expect.poll(() => spoken(page)).toContain('Goodbye, class!');
  await expect.poll(() => spoken(page)).toContain('Goodbye, teacher!');
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
    await expect(page.locator('.tc-picture')).toHaveAttribute('data-kind', /color|count|actions/, { timeout: 15000 });
    await judgeRight(page, i);
  }
  expect((await spoken(page)).some((t) => /^I know! (It's a (red|blue|yellow|green|pink|orange) (ball|balloon|star)|I see (one|two|three) \w+)!$/.test(t))).toBe(true);
  await doStars(page);
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

// ---------- SPEC-jobs2 TE1: điểm danh + Classroom actions ----------
const setVisible = (page, s) => page.evaluate((v) => {
  Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}, s);
const nameOf = (page, id) => page.evaluate(async (x) => (await import('/js/doctor.js')).PATIENT_BY_ID.get(x).name, id);

test('TE1 mức 1: chuông → "Good morning, class!" → "Good morning, teacher!"; lớp 3 bạn; "Where\'s …?" bạn được gọi nhún sẵn; chạm nhầm → "I\'m …! … is over there!"; đúng → "Here!"; đủ → "Everyone is here!" → hình 1', async ({ page }) => {
  await openTeacher(page, null, null, { roll: false });
  await expect(page.locator('.tc-pupil')).toHaveCount(3);
  await expect(page.locator('.tc-answers')).toBeHidden();
  await expect.poll(() => spoken(page)).toContain('Ring the bell, teacher!');
  await page.locator('.tc-bell').click();
  await expect.poll(() => spoken(page)).toContain('Good morning, class!');
  await expect.poll(() => spoken(page)).toContain('Good morning, teacher!');
  await expect(play(page)).toHaveAttribute('data-state', 'roll', { timeout: 15000 });
  const want = await page.locator('.tc-picture').getAttribute('data-word');
  const wantName = await nameOf(page, want);
  await expect.poll(() => spoken(page)).toContain(`Where's ${wantName}?`);
  await expect(page.locator(`.tc-pupil[data-pupil="${want}"]`)).toHaveClass(/called/);
  const other = await page.locator(`.tc-pupil:not([data-pupil="${want}"])`).first().getAttribute('data-pupil');
  const otherName = await nameOf(page, other);
  let n = (await spoken(page)).length;
  await page.locator(`.tc-pupil[data-pupil="${other}"]`).click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^I'm ${otherName}! ${wantName} is over there!$`))).toBe(true);
  n = (await spoken(page)).length;
  await page.locator(`.tc-pupil[data-pupil="${want}"]`).click();
  await expect.poll(() => saidSince(page, n, /^Here!$/)).toBe(true);
  await expect(page.locator('.tc-pupil[data-here="true"]')).toHaveCount(1, { timeout: 15000 });
  for (let i = 1; i < 3; i++) {
    await expect(page.locator('.tc-pupil[data-here="true"]')).toHaveCount(i, { timeout: 15000 });
    await expect(play(page)).toHaveAttribute('data-state', 'roll', { timeout: 15000 });
    await page.locator(`.tc-pupil[data-pupil="${await page.locator('.tc-picture').getAttribute('data-word')}"]`).click();
  }
  await expect.poll(() => spoken(page)).toContain('Everyone is here!');
  await expect(play(page)).toHaveAttribute('data-state', 'judge', { timeout: 15000 });
  await expect(page.locator('.tc-class')).toBeHidden();
  await expect(page.locator('.tc-answers')).toBeVisible();
  await expect(page.locator('.jb-count')).toHaveText('1/5');
});

test('TE1 mức 2: lớp 4 bạn, bạn được gọi không nhún sẵn; nhầm 2 lần → bạn đúng nhún; ra nền giữa lúc điểm danh → quay lại giữ bạn đã "Here!"', async ({ page }) => {
  await openTeacher(page, { level: 2, rounds: 0, lock: 2, seen: {} }, null, { roll: false });
  await expect(page.locator('.tc-pupil')).toHaveCount(4);
  await page.locator('.tc-bell').click();
  await expect(play(page)).toHaveAttribute('data-state', 'roll', { timeout: 15000 });
  const want = await page.locator('.tc-picture').getAttribute('data-word');
  await expect(page.locator('.tc-pupil.called')).toHaveCount(0);
  const others = await page.locator(`.tc-pupil:not([data-pupil="${want}"])`).evaluateAll((els) => els.map((e) => e.dataset.pupil));
  await page.locator(`.tc-pupil[data-pupil="${others[0]}"]`).click();
  await page.locator(`.tc-pupil[data-pupil="${others[1]}"]`).click();
  await expect(page.locator(`.tc-pupil[data-pupil="${want}"]`)).toHaveClass(/nudge/);
  await page.locator(`.tc-pupil[data-pupil="${want}"]`).click();
  await expect(page.locator('.tc-pupil[data-here="true"]')).toHaveCount(1, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'roll', { timeout: 15000 });
  const next = await page.locator('.tc-picture').getAttribute('data-word');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'roll', { timeout: 15000 });
  await expect(page.locator('.tc-pupil[data-here="true"]')).toHaveCount(1);
  await expect(page.locator('.tc-picture')).toHaveAttribute('data-word', next);
});

test('TE1 mức 1: ca Classroom actions — "What do we do, teacher?", 3 thẻ, chạm thẻ nào cũng được → "Stand up!" / … cả lớp làm; thẻ đã dùng không tính; 3 lệnh → "That was fun!" → ⭐', async ({ page }) => {
  await openTeacher(page, null, null, { actionsAt: 0 });
  await expect(play(page)).toHaveAttribute('data-state', 'act', { timeout: 15000 });
  await expect(page.locator('.tc-card')).toHaveCount(3);
  await expect(page.locator('.tc-class')).toBeVisible();
  await expect.poll(() => spoken(page)).toContain('What do we do, teacher?');
  const first = await page.locator('.tc-card').first().getAttribute('data-action');
  const cmd = { 'stand-up': 'Stand up!', 'sit-down': 'Sit down!', clap: 'Clap your hands!' }[first];
  let n = (await spoken(page)).length;
  await page.locator(`.tc-card[data-action="${first}"]`).click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^${cmd}$`))).toBe(true);
  await expect(page.locator('.tc-card.used')).toHaveCount(1);
  await expect(play(page)).toHaveAttribute('data-state', 'act', { timeout: 15000 });
  n = (await spoken(page)).length;
  await page.locator(`.tc-card[data-action="${first}"]`).click();
  await page.waitForTimeout(300);
  expect(await saidSince(page, n, new RegExp(`^${cmd}$`))).toBe(false);
  for (let i = 1; i < 3; i++) {
    await expect(play(page)).toHaveAttribute('data-state', 'act', { timeout: 15000 });
    await expect(page.locator('.tc-card.used')).toHaveCount(i, { timeout: 15000 });
    await page.locator('.tc-card:not(.used)').first().click();
  }
  await expect.poll(() => spoken(page)).toContain('That was fun!');
  await expect(page.locator('.tc-star[data-done="true"]')).toHaveCount(1, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'judge', { timeout: 15000 });
  await expect(page.locator('.jb-count')).toHaveText('2/5');
});

test('TE1 mức 2: 5 thẻ; bạn xin "Can we …, teacher?"; thẻ sai → "That\'s …. We want to …!"; đúng → lệnh, ghi đã gặp (đúng ngay lần đầu); ra nền giữa ca → cùng lệnh thứ mấy', async ({ page }) => {
  await openTeacher(page, { level: 2, rounds: 0, lock: 2, seen: {} }, null, { actionsAt: 0 });
  await expect(play(page)).toHaveAttribute('data-state', 'act', { timeout: 15000 });
  await expect(page.locator('.tc-card')).toHaveCount(5);
  const want = await page.locator('.tc-picture').getAttribute('data-word');
  const info = await page.evaluate(async (id) => { const a = (await import('/js/jobs/teacher.js')).ACTION_BY_ID.get(id); return { we: a.we, cmd: a.cmd, word: a.word }; }, want);
  await expect.poll(() => spoken(page)).toContain(`Can we ${info.we}, teacher?`);
  const wrong = await page.locator(`.tc-card:not([data-action="${want}"])`).first().getAttribute('data-action');
  const short = await page.evaluate(async (id) => (await import('/js/jobs/teacher.js')).ACTION_BY_ID.get(id).short, wrong);
  let n = (await spoken(page)).length;
  await page.locator(`.tc-card[data-action="${wrong}"]`).click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^That's ${short}\\. We want to ${info.we}!$`))).toBe(true);
  n = (await spoken(page)).length;
  await page.locator(`.tc-card[data-action="${want}"]`).click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^${info.cmd.replace('!', '')}!$`))).toBe(true);
  // Lệnh 2: đúng ngay → ghi đã gặp.
  await expect(page.locator('.tc-card.used')).toHaveCount(1);
  await expect(play(page)).toHaveAttribute('data-state', 'act', { timeout: 15000 });
  const want2 = await page.locator('.tc-picture').getAttribute('data-word');
  const word2 = await page.evaluate(async (id) => (await import('/js/jobs/teacher.js')).ACTION_BY_ID.get(id).word, want2);
  await page.locator(`.tc-card[data-action="${want2}"]`).click();
  await expect.poll(() => page.evaluate(async (w) => (await window.kidEnglish.db.getAll('progress')).some((p) => p.word === w), word2)).toBe(true);
  expect(await page.evaluate(async (w) => (await window.kidEnglish.db.getAll('progress')).some((p) => p.word === w), info.word)).toBe(false);
  await expect(page.locator('.tc-card.used')).toHaveCount(2, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'act', { timeout: 15000 });
  const want3 = await page.locator('.tc-picture').getAttribute('data-word');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'act', { timeout: 15000 });
  await expect(page.locator('.tc-picture')).toHaveAttribute('data-word', want3);
  await expect(page.locator('.tc-card.used')).toHaveCount(2);
  await page.locator(`.tc-card[data-action="${want3}"]`).click();
  await expect(page.locator('.tc-star[data-done="true"]')).toHaveCount(1, { timeout: 15000 });
});

// ---------- SPEC-jobs2 TE2: phát sao cuối buổi ----------
test('TE2 mức 2: hết 5 việc → "… star(s) for …!" → chạm hộp sao, sao bay vào vở bạn, Bông đếm; chạm thừa → "I have … Thank you!" (không thêm sao); 2 bạn → "Goodbye, class!" → "Goodbye, teacher!" → sticker', async ({ page }) => {
  await openTeacher(page, { level: 2, rounds: 0, lock: 2, seen: {} });
  for (let i = 0; i < 5; i++) await judgeRight(page, i);
  await expect(play(page)).toHaveAttribute('data-state', 'stars', { timeout: 15000 });
  await expect(page.locator('.tc-class')).toBeVisible();
  await expect(page.locator('.tc-answers')).toBeHidden();
  const [pupil, n] = (await page.locator('.tc-picture').getAttribute('data-word')).split(':');
  const name = await nameOf(page, pupil);
  const word = ['zero', 'One', 'Two', 'Three'][Number(n)];
  await expect.poll(() => spoken(page)).toContain(`${word} ${n === '1' ? 'star' : 'stars'} for ${name}!`);
  let k = (await spoken(page)).length;
  for (let i = 0; i < Number(n) - 1; i++) {
    await expect(play(page)).toHaveAttribute('data-state', 'stars', { timeout: 15000 });
    await page.locator('.tc-starbox').click();
    await expect(page.locator(`.tc-pupil[data-pupil="${pupil}"]`)).toHaveAttribute('data-stars', String(i + 1), { timeout: 15000 });
  }
  // Sao cuối và chạm thừa liền nhau (cùng một bước, như bé chạm hai lần thật nhanh) → bạn nói đã đủ, không thêm sao.
  await expect(play(page)).toHaveAttribute('data-state', 'stars', { timeout: 15000 });
  await page.evaluate(() => {
    const box = document.querySelector('.tc-starbox');
    box.click();
    box.click();
  });
  await expect.poll(() => saidSince(page, k, /^One!$/)).toBe(true);
  await expect.poll(() => saidSince(page, k, new RegExp(`^I have ${word.toLowerCase()} stars?! Thank you!$`))).toBe(true);
  await expect(page.locator(`.tc-pupil[data-pupil="${pupil}"]`)).toHaveAttribute('data-stars', n);
  await expect.poll(() => spoken(page)).toContain('Thank you, teacher!');
  await doStars2(page, pupil);
  await expect.poll(() => spoken(page)).toContain('Goodbye, class!');
  await expect.poll(() => spoken(page)).toContain('Goodbye, teacher!');
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});

/** Bạn thứ hai (sau khi bạn đầu đã đủ sao). */
async function doStars2(page, first) {
  await expect.poll(async () => (await play(page).getAttribute('data-state')) === 'stars'
    && !(await page.locator('.tc-picture').getAttribute('data-word')).startsWith(`${first}:`), { timeout: 15000 }).toBe(true);
  const [pupil, n] = (await page.locator('.tc-picture').getAttribute('data-word')).split(':');
  for (let i = 0; i < Number(n); i++) {
    await expect(play(page)).toHaveAttribute('data-state', 'stars', { timeout: 15000 });
    await page.locator('.tc-starbox').click();
    await expect(page.locator(`.tc-pupil[data-pupil="${pupil}"]`)).toHaveAttribute('data-stars', String(i + 1), { timeout: 15000 });
  }
}

test('TE2 mức 3: 2–3 sao mỗi bạn; ra nền sau sao đầu → quay lại cùng bạn, vẫn còn sao đã phát', async ({ page }) => {
  await openTeacher(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  for (let i = 0; i < 5; i++) await judgeRight(page, i);
  await expect(play(page)).toHaveAttribute('data-state', 'stars', { timeout: 15000 });
  const [pupil, n] = (await page.locator('.tc-picture').getAttribute('data-word')).split(':');
  expect(Number(n)).toBeGreaterThanOrEqual(2);
  await page.locator('.tc-starbox').click();
  await expect(page.locator(`.tc-pupil[data-pupil="${pupil}"]`)).toHaveAttribute('data-stars', '1', { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'stars', { timeout: 15000 });
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'stars', { timeout: 15000 });
  await expect(page.locator('.tc-picture')).toHaveAttribute('data-word', `${pupil}:${n}`);
  await expect(page.locator(`.tc-pupil[data-pupil="${pupil}"]`)).toHaveAttribute('data-stars', '1');
  for (let i = 1; i < Number(n); i++) {
    await expect(play(page)).toHaveAttribute('data-state', 'stars', { timeout: 15000 });
    await page.locator('.tc-starbox').click();
    await expect(page.locator(`.tc-pupil[data-pupil="${pupil}"]`)).toHaveAttribute('data-stars', String(i + 1), { timeout: 15000 });
  }
  await doStars2(page, pupil);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});
