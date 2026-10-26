// Bác sĩ nhí (SPEC-doctor.md), mốc D1 — mức 1: chạm chỗ đau → đưa đồ chữa → khỏe → 3 ca → sticker.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const saidSince = async (page, n, re) => (await spoken(page)).slice(n).some((t) => re.test(t));
const play = (page) => page.locator('.dr-play');

/** Ca đang khám + bước của nó ở mức 1 (theo data-case của bạn thú). */
async function currentCase(page) {
  const id = await page.locator('.dr-patient').getAttribute('data-case');
  return page.evaluate(async (caseId) => {
    const m = await import('/js/doctor.js');
    const c = m.CASE_BY_ID.get(caseId);
    const steps = m.stepsFor(c, 1);
    return { id: caseId, target: steps.find((s) => s.type === 'touch')?.target, item: steps.find((s) => s.type === 'treat')?.item };
  }, id);
}
const spot = (page, region) => page.locator(`.dr-spot[data-region="${region}"]`).first();

/** Rửa tay đầu lượt (SPEC-doctor2 DR1): dùng lần lượt các món có trong khay. */
async function washUp(page) {
  await expect(play(page)).toHaveAttribute('data-state', 'wash', { timeout: 15000 });
  for (const id of ['soap', 'rinse', 'towel', 'gloves']) {
    const item = page.locator(`.dr-item[data-item="${id}"]`);
    if (!(await item.count())) continue;
    await item.click();
    await expect(item).toHaveCount(0, { timeout: 15000 });
  }
}
/** Tặng sticker cho bạn thú vừa khỏi (đúng yêu cầu nếu có). */
async function giveSticker(page) {
  await expect(play(page)).toHaveAttribute('data-state', 'sticker', { timeout: 15000 });
  const want = await page.locator('.dr-patient').getAttribute('data-want');
  await page.locator(want ? `.dr-item[data-item^="st-${want}"]` : '.dr-item[data-item^="st-"]').first().click();
}

/** Ca mới (đo chiều cao) ở vị trí `at` của lượt (mặc định cuối — ca 1, 2 là ca bệnh như test cũ). */
const pinNewCase = (page, at = 2) => page.addInitScript((n) => { window.__kidTest = { doctorNewAt: n }; }, at);

/** Ca đo chiều cao: đếm hết khối (từ dưới lên), mức 2 chọn đúng thẻ số, mức 3 chạm bạn cao hơn. */
async function doCheckup(page) {
  await expect(play(page)).toHaveAttribute('data-state', 'measure', { timeout: 15000 });
  const heights = (await page.locator('.dr-measure').getAttribute('data-heights')).split(',').map(Number);
  for (const [w, n] of heights.entries()) {
    for (let i = 0; i < n; i++) {
      await expect(play(page)).toHaveAttribute('data-state', 'measure', { timeout: 15000 });
      await page.locator(`.dr-block[data-who="${w}"][data-i="${i}"]`).click();
      await expect(page.locator(`.dr-block[data-who="${w}"][data-i="${i}"]`)).toHaveClass(/lit/, { timeout: 15000 });
    }
  }
  await expect(play(page)).toHaveAttribute('data-state', /howmany|taller|sticker/, { timeout: 15000 });
  const st = await play(page).getAttribute('data-state');
  if (st === 'howmany') await page.locator(`.dr-item[data-item="n-${heights[0]}"]`).click();
  if (st === 'taller') await page.locator(`.dr-measure-pet[data-who="${heights[0] > heights[1] ? 0 : 1}"]`).click();
}

async function openDoctor(page) {
  await fakeSpeech(page);
  await pinNewCase(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bác sĩ nhí' }).click();
  await washUp(page);
  await expect(play(page)).toHaveAttribute('data-state', 'touch', { timeout: 15000 });
}

/** Khám xong ca đang mở (chạm đúng chỗ, chạm đúng đồ), chờ sang ca sau / hoan hô. */
async function healCurrent(page) {
  await expect(play(page)).toHaveAttribute('data-state', /touch|measure/, { timeout: 15000 });
  if ((await play(page).getAttribute('data-state')) === 'measure') {
    await doCheckup(page);
    await giveSticker(page);
    return { id: 'checkup' };
  }
  const c = await currentCase(page);
  await spot(page, c.target).click();
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  await page.locator(`.dr-item[data-item="${c.item}"]`).click();
  await giveSticker(page);
  return c;
}

test('mức 1: vào phòng → chạm nhầm chỗ → câu nhầm; chạm đúng → khay 2 món; đưa nhầm → câu nhầm có tên, đồ đúng nhún; đưa đúng → khỏe → ca 2', async ({ page }) => {
  await openDoctor(page);
  const said = await spoken(page);
  expect(said).toContain('Hello! Come in!');
  expect(said).toContain('Hello, doctor!');
  expect(said).toContain('Where does it hurt? Touch it!');
  await expect(page.locator('.dr-count')).toHaveText('1/3');
  // Mức 1: chỗ đau nhấp nháy sẵn; khay ẩn ở bước chạm.
  await expect(page.locator('.dr-glow').first()).toBeAttached();
  await expect(page.locator('.dr-tray')).toHaveClass(/off/);
  const c = await currentCase(page);
  const other = ['nose', 'tummy', 'foot', 'head'].find((r) => r !== c.target);
  let n = (await spoken(page)).length;
  await spot(page, other).click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^That's my ${other === 'foot' ? 'foot' : other}! `))).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'touch');
  await spot(page, c.target).click();
  await expect.poll(() => saidSince(page, n, /^Yes! My /)).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  await expect(page.locator('.dr-item')).toHaveCount(2);
  await expect.poll(async () => (await spoken(page)).some((t) => / please!$/.test(t))).toBe(true);
  const wrong = await page.locator(`.dr-item:not([data-item="${c.item}"])`).getAttribute('data-item');
  n = (await spoken(page)).length;
  await page.locator(`.dr-item[data-item="${wrong}"]`).click();
  await expect.poll(() => saidSince(page, n, /^Hmm, (that's|those are) the .+\. I need .+!$/)).toBe(true);
  await expect(page.locator(`.dr-item[data-item="${c.item}"].hint`)).toHaveCount(1);
  await page.locator(`.dr-item[data-item="${c.item}"]`).click();
  await expect.poll(async () => (await spoken(page)).includes('I feel better! Thank you, doctor!'), { timeout: 15000 }).toBe(true);
  await giveSticker(page);
  await expect(page.locator('.dr-count')).toHaveText('2/3', { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'touch', { timeout: 15000 });
});

test('3 ca → Hoan hô + sticker; đếm lượt + seen một lần; ghi "đã gặp" cho từ bài Body (DOC-12)', async ({ page }) => {
  await openDoctor(page);
  const healed = [];
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.dr-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    healed.push(await healCurrent(page));
  }
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  // Màn hoan hô không bị cắt: hộp quà và nút ✔ nằm trọn trong màn hình.
  await expect(page.locator('.done-btn')).toBeInViewport({ ratio: 1, timeout: 15000 });
  await expect(page.locator('.gift')).toBeInViewport({ ratio: 1 });
  const game = await page.evaluate(() => window.kidEnglish.settings.doctorGame);
  expect(game.rounds).toBe(1);
  expect(game.level).toBe(1);
  expect(Object.values(game.seen).reduce((a, b) => a + b, 0)).toBe(3);
  const body = { hand: 'hands', foot: 'feet', nose: 'nose', mouth: 'mouth' };
  const words = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).map((p) => p.word));
  for (const c of healed) if (body[c.target]) expect(words).toContain(body[c.target]);
});

test('kéo đồ thả lên người bạn thú là được; thả ra ngoài thì về khay, không tính nhầm; ngón 2 chạm bạn thú lúc đang kéo bị bỏ qua (DOC-15)', async ({ page }) => {
  await openDoctor(page);
  const c = await currentCase(page);
  await spot(page, c.target).click();
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  const n = (await spoken(page)).length;
  const item = await page.locator(`.dr-item[data-item="${c.item}"]`).boundingBox();
  // Thả ra ngoài (góc trên trái màn): về khay, không có câu nhầm, vẫn ở bước chữa.
  await page.mouse.move(item.x + item.width / 2, item.y + item.height / 2);
  await page.mouse.down();
  await page.mouse.move(30, 200, { steps: 6 });
  // Đang kéo mà ngón 2 chạm bụng bạn thú: không nói lại triệu chứng.
  const belly = await spot(page, 'tummy').boundingBox();
  await page.locator('.dr-patient').dispatchEvent('pointerdown', {
    pointerId: 9, clientX: belly.x + belly.width / 2, clientY: belly.y + belly.height / 2, button: 0, bubbles: true,
  });
  await page.mouse.up();
  await page.waitForTimeout(300);
  expect(await saidSince(page, n, /^Hmm|hurts!$|^Achoo|^Ouch/)).toBe(false);
  await expect(play(page)).toHaveAttribute('data-state', 'treat');
  // Kéo thả lên bụng bạn thú (không cần đúng chỗ đau): nhận.
  const tummy = await spot(page, 'tummy').boundingBox();
  await page.mouse.move(item.x + item.width / 2, item.y + item.height / 2);
  await page.mouse.down();
  await page.mouse.move(tummy.x + tummy.width / 2, tummy.y + tummy.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await spoken(page)).includes('I feel better! Thank you, doctor!'), { timeout: 15000 }).toBe(true);
});

test('bước chữa: chạm bạn thú = nghe lại triệu chứng, không tính nhầm (DOC-06); chạm Bông y tá = nói lại câu xin', async ({ page }) => {
  await openDoctor(page);
  const c = await currentCase(page);
  await spot(page, c.target).click();
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  const say = await page.evaluate(async (id) => (await import('/js/doctor.js')).CASE_BY_ID.get(id).say[0], c.id);
  let n = (await spoken(page)).length;
  await spot(page, 'head').click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^${say.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))).toBe(true);
  await expect(page.locator('.dr-item.hint')).toHaveCount(0);
  await expect(play(page)).toHaveAttribute('data-state', 'treat');
  n = (await spoken(page)).length;
  await page.getByRole('button', { name: 'Bông y tá' }).click();
  await expect.poll(() => saidSince(page, n, / please!$/)).toBe(true);
});

test('ra nền ngay sau khi chạm đúng → quay lại đúng ca, ở bước chữa; tiến độ Body không ghi hai lần (DOC-08); 🧹 khám lại cùng ca từ ca 1 (DOC-07)', async ({ page }) => {
  await openDoctor(page);
  const c = await currentCase(page);
  const patient = await page.locator('.dr-patient').getAttribute('data-patient');
  await spot(page, c.target).click();
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  await expect(page.locator('.dr-patient')).toHaveAttribute('data-case', c.id);
  await expect(page.locator('.dr-patient')).toHaveAttribute('data-patient', patient);
  await expect(page.locator('.dr-count')).toHaveText('1/3');
  const count = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).reduce((a, p) => a + (p.practiceCount ?? 0), 0));
  expect(count).toBe({ hand: 1, foot: 1, nose: 1, mouth: 1 }[c.target] ?? 0);
  // Khỏi ca 1, sang ca 2 rồi 🧹: về ca 1, cùng bạn thú, cùng bệnh; seen / rounds không tính lại lượt.
  await page.locator(`.dr-item[data-item="${c.item}"]`).click();
  await giveSticker(page);
  await expect(page.locator('.dr-count')).toHaveText('2/3', { timeout: 15000 });
  await page.getByRole('button', { name: 'Khám lại' }).click();
  // 🧹 khám lại: làm lại từ rửa tay (SPEC-doctor2 mục 8).
  await washUp(page);
  await expect(page.locator('.dr-count')).toHaveText('1/3');
  await expect(page.locator('.dr-patient')).toHaveAttribute('data-case', c.id);
  await expect(play(page)).toHaveAttribute('data-state', 'touch', { timeout: 15000 });
  expect((await page.evaluate(() => window.kidEnglish.settings.doctorGame)).rounds).toBe(0);
});

test('giọng đọc lỗi: phụ đề vẫn hiện, chơi hết lượt được', async ({ page }) => {
  await fakeSpeech(page);
  await page.addInitScript(() => {
    // Giọng đọc báo lỗi ngay mỗi câu.
    window.addEventListener('DOMContentLoaded', () => {
      window.__kidTest = { doctorNewAt: 2 };
      window.speechSynthesis.speak = (u) => {
        window.__spoken.push(u.text);
        setTimeout(() => u.onerror?.({ error: 'synthesis-failed' }), 5);
      };
    });
  });
  await startApp(page);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bác sĩ nhí' }).click();
  await expect(page.locator('.dr-say .caption-en')).toBeVisible({ timeout: 15000 });
  await washUp(page);
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.dr-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    await healCurrent(page);
  }
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});

// ---------- Ảnh bố mẹ thêm (SPEC mục 10) ----------
/** Ảnh vuông màu để thử (canvas → png). */
const addImage = (page, lessonId, word) => page.evaluate(async ({ lessonId, word }) => {
  const db = await import('/js/db.js');
  const png = await new Promise((r) => {
    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 80;
    const g = c.getContext('2d');
    g.fillStyle = '#e33';
    g.fillRect(10, 10, 60, 60);
    c.toBlob(r, 'image/png');
  });
  await db.setWordImage(window.kidEnglish.db, { lessonId, word, blob: png, mimeType: 'image/png', width: 80, height: 80 });
}, { lessonId, word });
const doctorImages = (page) => page.evaluate(async () => (await window.kidEnglish.db.getAllByIndex('images', 'lessonId', 'doctor:items')).map((i) => i.word).sort());

test('Góc bố mẹ → Ảnh Bác sĩ nhí: dùng lại ảnh có sẵn (ảnh bài học "toothbrush", ảnh Trốn tìm "spoon" cho si-rô); "Dùng emoji" bỏ ảnh', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await addImage(page, 'my-lesson', 'toothbrush');
  await addImage(page, 'hide:items', 'spoon');
  const { openParent } = await import('./helpers.js');
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Bác sĩ nhí/ }).click();
  await expect(page.locator('.sp-admin-item[data-item]')).toHaveCount(11);
  await expect(page.locator('.sp-admin-item[data-item="medicine"]').getByRole('button', { name: 'Ảnh có sẵn (1)…' })).toBeVisible();
  await page.getByRole('button', { name: 'Dùng lại ảnh đã có (2 đồ)' }).click();
  await expect.poll(() => doctorImages(page)).toEqual(['medicine', 'toothbrush']);
  await expect(page.locator('.sp-admin-item[data-item="toothbrush"] img.dr-admin-face')).toHaveCount(1);
  // Ảnh gốc không đổi (sao chép, không chuyển).
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAllByIndex('images', 'lessonId', 'my-lesson')).length)).toBe(1);
  await page.locator('.sp-admin-item[data-item="toothbrush"]').getByRole('button', { name: 'Dùng emoji' }).click();
  await expect.poll(() => doctorImages(page)).toEqual(['medicine']);
});

test('trò chơi dùng ảnh đồ bố mẹ thêm (khay) và ảnh nền phòng khám', async ({ page }) => {
  await fakeSpeech(page);
  await pinNewCase(page);
  await startApp(page);
  for (const id of ['bandage', 'medicine', 'tissue', 'toothbrush', 'icepack', 'drops', 'water', 'blanket']) await addImage(page, 'doctor:items', id);
  await addImage(page, 'doctor:bg', 'room');
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bác sĩ nhí' }).click();
  await washUp(page);
  await expect(play(page)).toHaveAttribute('data-state', 'touch', { timeout: 15000 });
  await expect(page.locator('.dr-stage.has-bg')).toHaveCount(1);
  const c = await currentCase(page);
  await spot(page, c.target).click();
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  await expect(page.locator('.dr-item img.dr-item-img')).toHaveCount(2);
});

// ---------- D2: mức 2–3 (bước khám, 11 ca), giọng bạn thú, Cài đặt ----------
/** Khám xong ca đang mở ở `level`: làm lần lượt mọi bước (chạm / khám / chữa) theo dữ liệu ca. */
async function healAt(page, level) {
  await expect(play(page)).toHaveAttribute('data-state', /touch|check|treat|measure/, { timeout: 15000 });
  if ((await play(page).getAttribute('data-state')) === 'measure') {
    await doCheckup(page);
    await giveSticker(page);
    return { id: 'checkup', steps: [] };
  }
  const id = await page.locator('.dr-patient').getAttribute('data-case');
  const steps = await page.evaluate(async ([caseId, lv]) => {
    const m = await import('/js/doctor.js');
    return m.stepsFor(m.CASE_BY_ID.get(caseId), lv);
  }, [id, level]);
  for (const [k, s] of steps.entries()) {
    await expect(play(page)).toHaveAttribute('data-state', s.type, { timeout: 15000 });
    if (s.type === 'touch') await spot(page, s.target).click();
    else await page.locator(`.dr-item[data-item="${s.item}"]`).click();
    if (k < steps.length - 1) await expect(play(page)).toHaveAttribute('data-state', steps[k + 1].type, { timeout: 15000 });
  }
  await giveSticker(page);
  return { id, steps };
}

test('D2 mức 2: có bước khám (Bông gọi tên dụng cụ, khay 3 món), đồ chữa không gọi tên ("How can we help?"); bạn thú nói giọng khác Bông; ca tai thấy bọ; 3 ca → sticker', async ({ page }) => {
  await fakeSpeech(page);
  await pinNewCase(page);
  await startApp(page);
  // Ưu tiên ca có bước khám (tummy, tooth, ear-bug): các ca khác coi như đã gặp nhiều.
  await page.evaluate(() => window.kidEnglish.setSetting('doctorGame', {
    level: 2, rounds: 0, lock: 2, seen: { 'cut-hand': 9, 'cut-foot': 9, 'runny-nose': 9, eye: 9, bump: 9, sleepy: 9 },
  }));
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bác sĩ nhí' }).click();
  await washUp(page);
  let sawCheck = false;
  const ids = [];
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.dr-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    const before = (await spoken(page)).length;
    const { id, steps } = await healAt(page, 2);
    ids.push(id);
    if (steps.some((s) => s.type === 'check')) sawCheck = true;
    if (id === 'ear-bug') await expect.poll(() => saidSince(page, before, /^Let me look… A little bug! Bye-bye, bug!$/)).toBe(true);
  }
  expect(sawCheck).toBe(true);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  const said = await spoken(page);
  expect(said.some((t) => /^Let's check! Use the (stethoscope|flashlight|thermometer)\.$/.test(t))).toBe(true);
  expect(said).toContain('How can we help?');
  // Bạn thú không xin đồ chữa có tên (câu xin sticker "A blue one, please!" thì có — SPEC-doctor2).
  expect(said.some((t) => / please!$/.test(t) && !/^A (red|blue|yellow|green) (one|star|heart|circle|square), please!$/.test(t))).toBe(false);
  // Bạn thú ("Hello, doctor!") nói giọng cao độ khác; Bông ("Hello! Come in!") giọng thường.
  const voice = await page.evaluate(() => window.__spoken.map((t, i) => [t, window.__pitches[i]]));
  expect(voice.filter(([t]) => t === 'Hello, doctor!').every(([, p]) => p !== 1)).toBe(true);
  expect(voice.filter(([t]) => t === 'Hello! Come in!').every(([, p]) => p === 1)).toBe(true);
  expect(ids.length).toBe(3);
});

test('D2 mức 3: chơi hết lượt với 11 ca (sốt: nhiệt kế; ho: không chạm), khay chữa 4 món; Cài đặt có "Mức chơi Bác sĩ nhí" khóa được mức', async ({ page }) => {
  await fakeSpeech(page);
  await pinNewCase(page);
  await startApp(page);
  const others = ['cut-hand', 'cut-foot', 'tummy', 'runny-nose', 'tooth', 'ear-bug', 'eye', 'bump', 'sleepy'];
  await page.evaluate((o) => window.kidEnglish.setSetting('doctorGame', { level: 3, rounds: 0, lock: 3, seen: Object.fromEntries(o.map((id) => [id, 9])) }), others);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bác sĩ nhí' }).click();
  await washUp(page);
  const ids = [];
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.dr-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    const state = await play(page).getAttribute('data-state');
    const id = state === 'measure' ? 'checkup' : await page.locator('.dr-patient').getAttribute('data-case');
    if (id === 'cough') expect(['check', 'enter']).toContain(state);
    ids.push((await healAt(page, 3)).id);
  }
  // Ca ít gặp nhất (sốt, ho) luôn được chọn.
  expect(ids).toEqual(expect.arrayContaining(['fever', 'cough']));
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  const said = await spoken(page);
  expect(said).toContain('You feel warm!');
  expect(said).toContain('Cough! Cough!');
});

test('D2: Cài đặt → "Mức chơi Bác sĩ nhí" có 3 mức, chọn mức 3 thì khóa mức 3', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const { openParent } = await import('./helpers.js');
  await openParent(page);
  await page.getByRole('button', { name: /Cài đặt/ }).click();
  const sel = page.locator('label, .field').filter({ hasText: 'Mức chơi Bác sĩ nhí' }).locator('select');
  await expect(sel.locator('option')).toHaveCount(4);
  await sel.selectOption('3');
  await expect.poll(() => page.evaluate(() => window.kidEnglish.settings.doctorGame)).toMatchObject({ level: 3, lock: 3 });
});

// ---------- SPEC-doctor2 DR1: rửa tay đầu lượt, tặng sticker cho bạn thú ----------
const setVisibility = (page, v) => page.evaluate((s) => {
  Object.defineProperty(document, 'visibilityState', { value: s, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}, v);
async function enterDoctor(page, settings, newAt = 2) {
  await fakeSpeech(page);
  await pinNewCase(page, newAt);
  await startApp(page);
  await page.evaluate((s) => window.kidEnglish.setSetting('doctorGame', s), settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bác sĩ nhí' }).click();
  await expect(play(page)).toHaveAttribute('data-state', 'wash', { timeout: 15000 });
}

test('DR1 mức 1: rửa tay 3 món thứ tự tùy ý (không găng), món dùng rồi rời khay; "Clean hands!" → ca 1; khỏi bệnh → xin sticker, cái nào cũng được, câu cảm ơn khớp sticker → ca 2', async ({ page }) => {
  await enterDoctor(page, { level: 1, rounds: 0, lock: 1, seen: {} });
  await expect.poll(() => spoken(page)).toContain("Doctors wash their hands! Let's wash!");
  await expect(page.locator('.dr-tray .dr-item')).toHaveCount(3);
  await expect(page.locator('.dr-item[data-item="gloves"]')).toHaveCount(0);
  for (const [id, line] of [['towel', 'Dry your hands!'], ['soap', 'Rub, rub, rub!'], ['rinse', 'Rinse!']]) {
    await page.locator(`.dr-item[data-item="${id}"]`).click();
    await expect(page.locator(`.dr-item[data-item="${id}"]`)).toHaveCount(0, { timeout: 15000 });
    await expect.poll(() => spoken(page)).toContain(line);
  }
  await expect.poll(() => spoken(page)).toContain("Clean hands! Let's help our friends!");
  const c = await currentCase(page);
  await expect(play(page)).toHaveAttribute('data-state', 'touch', { timeout: 15000 });
  await spot(page, c.target).click();
  await expect(play(page)).toHaveAttribute('data-state', 'treat', { timeout: 15000 });
  await page.locator(`.dr-item[data-item="${c.item}"]`).click();
  await expect(play(page)).toHaveAttribute('data-state', 'sticker', { timeout: 15000 });
  await expect.poll(() => spoken(page)).toContain('Can I have a sticker, please?');
  await expect(page.locator('.dr-tray .dr-item')).toHaveCount(3);
  const id = await page.locator('.dr-tray .dr-item').nth(1).getAttribute('data-item');
  const [, color, shape] = id.split('-');
  await page.locator(`.dr-item[data-item="${id}"]`).click();
  await expect.poll(() => spoken(page)).toContain(`A ${color} ${shape}! I love it!`);
  await expect(page.locator('.dr-count')).toHaveText('2/3', { timeout: 15000 });
});

test('DR1 mức 2: rửa tay đúng thứ tự — sai thứ tự → "Soap first!", không mất món đã dùng; có găng; sticker theo màu: nhầm → "That\'s a … A blue one, please!", không ghi tiến độ màu', async ({ page }) => {
  await enterDoctor(page, { level: 2, rounds: 0, lock: 2, seen: {} });
  await expect(page.locator('.dr-tray .dr-item')).toHaveCount(4);
  const n = (await spoken(page)).length;
  await expect(async () => {
    await page.locator('.dr-item[data-item="towel"]').click();
    expect(await saidSince(page, n, /^Soap first!$/)).toBe(true);
  }).toPass({ timeout: 15000 });
  await expect(page.locator('.dr-item[data-item="towel"]')).toHaveCount(1);
  await page.locator('.dr-item[data-item="soap"]').click();
  await expect(page.locator('.dr-item[data-item="soap"]')).toHaveCount(0, { timeout: 15000 });
  const m = (await spoken(page)).length;
  await expect(async () => {
    await page.locator('.dr-item[data-item="gloves"]').click();
    expect(await saidSince(page, m, /^Water first!$/)).toBe(true);
  }).toPass({ timeout: 15000 });
  await expect(page.locator('.dr-tray .dr-item')).toHaveCount(3);
  for (const id of ['rinse', 'towel', 'gloves']) {
    await page.locator(`.dr-item[data-item="${id}"]`).click();
    await expect(page.locator(`.dr-item[data-item="${id}"]`)).toHaveCount(0, { timeout: 15000 });
  }
  await expect.poll(() => spoken(page)).toContain('Gloves on! Ready!');
  await expect(page.locator('.dr-wash')).toHaveClass(/gloves/);
  await healAtNoSticker(page, 2);
  await expect(play(page)).toHaveAttribute('data-state', 'sticker', { timeout: 15000 });
  const want = await page.locator('.dr-patient').getAttribute('data-want');
  const color = want.replace(/-$/, '');
  await expect.poll(() => spoken(page)).toContain(`A ${color} one, please!`);
  const wrong = await page.locator(`.dr-tray .dr-item:not([data-item^="st-${color}-"])`).first().getAttribute('data-item');
  const [, wc, ws] = wrong.split('-');
  const k = (await spoken(page)).length;
  await expect(async () => {
    await page.locator(`.dr-item[data-item="${wrong}"]`).click();
    expect(await saidSince(page, k, new RegExp(`^That's a ${wc} ${ws}\\. A ${color} one, please!$`))).toBe(true);
  }).toPass({ timeout: 15000 });
  await page.locator(`.dr-item[data-item^="st-${color}-"]`).click();
  await expect(page.locator('.dr-count')).toHaveText('2/3', { timeout: 15000 });
  // Đã nhầm trước khi đúng: không ghi màu "đã gặp".
  expect(await page.evaluate((c) => window.kidEnglish.db.get('progress', c), color)).toBeFalsy();
});

test('DR1 mức 3: sticker màu + hình — đúng một cái khớp; đúng ngay lần đầu → ghi màu + hình đã gặp; ra nền trước khi dán → quay lại vẫn xin sticker; sau khi dán → ca sau', async ({ page }) => {
  await enterDoctor(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  await washUp(page);
  await healAtNoSticker(page, 3);
  await expect(play(page)).toHaveAttribute('data-state', 'sticker', { timeout: 15000 });
  await expect(page.locator('.dr-tray .dr-item')).toHaveCount(4);
  const want = await page.locator('.dr-patient').getAttribute('data-want');
  const [color, shape] = want.split('-');
  await expect(page.locator(`.dr-item[data-item="st-${color}-${shape}"]`)).toHaveCount(1);
  await expect(page.locator(`.dr-item[data-item^="st-${color}-"]`)).toHaveCount(2);
  await expect(page.locator(`.dr-item[data-item$="-${shape}"]`)).toHaveCount(2);
  await setVisibility(page, 'hidden');
  await setVisibility(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'sticker', { timeout: 15000 });
  await expect(page.locator('.dr-count')).toHaveText('1/3');
  await expect(page.locator('.dr-patient')).toHaveAttribute('data-want', want);
  await page.locator(`.dr-item[data-item="st-${color}-${shape}"]`).click();
  await expect.poll(() => spoken(page)).toContain(`A ${color} ${shape}! I love it!`);
  await expect(page.locator('.dr-count')).toHaveText('2/3', { timeout: 15000 });
  const words = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).map((p) => p.word));
  expect(words).toEqual(expect.arrayContaining([color, shape]));
  await setVisibility(page, 'hidden');
  await setVisibility(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', /touch|check|treat/, { timeout: 15000 });
  await expect(page.locator('.dr-count')).toHaveText('2/3');
});

/** Khám chữa xong ca đang mở, dừng ở bước tặng sticker. */
async function healAtNoSticker(page, level) {
  await expect(play(page)).toHaveAttribute('data-state', /touch|check|treat/, { timeout: 15000 });
  const id = await page.locator('.dr-patient').getAttribute('data-case');
  const steps = await page.evaluate(async ([caseId, lv]) => {
    const m = await import('/js/doctor.js');
    return m.stepsFor(m.CASE_BY_ID.get(caseId), lv);
  }, [id, level]);
  for (const [k, s] of steps.entries()) {
    await expect(play(page)).toHaveAttribute('data-state', s.type, { timeout: 15000 });
    if (s.type === 'touch') await spot(page, s.target).click();
    else await page.locator(`.dr-item[data-item="${s.item}"]`).click();
    if (k < steps.length - 1) await expect(play(page)).toHaveAttribute('data-state', steps[k + 1].type, { timeout: 15000 });
  }
}

// ---------- SPEC-doctor2 DR2: ca Đo chiều cao ----------
test('DR2 mức 1: ca đo — "Am I growing?", khối cần chạm nhấp nháy; chạm bỏ khối → "From the bottom!", không đếm, không tính nhầm; đếm xong "You\'re N blocks tall!" → "I\'m growing!" → sticker → ca sau', async ({ page }) => {
  await enterDoctor(page, { level: 1, rounds: 0, lock: 1, seen: {} }, 0);
  await washUp(page);
  await expect(play(page)).toHaveAttribute('data-state', 'measure', { timeout: 15000 });
  await expect(page.locator('.dr-count')).toHaveText('1/3');
  await expect.poll(() => spoken(page)).toContain('Hello, doctor! Am I growing?');
  const n = Number(await page.locator('.dr-measure').getAttribute('data-heights'));
  expect(n >= 1 && n <= 3).toBe(true);
  await expect(page.locator('.dr-block[data-i="0"]')).toHaveClass(/next/);
  if (n >= 2) {
    const k = (await spoken(page)).length;
    await expect(async () => {
      await page.locator('.dr-block[data-i="1"]').click();
      expect(await saidSince(page, k, /^From the bottom! One…$/)).toBe(true);
    }).toPass({ timeout: 15000 });
    await expect(page.locator('.dr-block.lit')).toHaveCount(0);
  }
  for (let i = 0; i < n; i++) {
    await page.locator(`.dr-block[data-i="${i}"]`).click();
    await expect(page.locator('.dr-block.lit')).toHaveCount(i + 1, { timeout: 15000 });
  }
  const word = ['', 'one block', 'two blocks', 'three blocks'][n];
  await expect.poll(() => spoken(page)).toContain(`You're ${word} tall!`);
  await expect.poll(() => spoken(page)).toContain("I'm growing!");
  await giveSticker(page);
  await expect(page.locator('.dr-count')).toHaveText('2/3', { timeout: 15000 });
  expect((await page.evaluate(() => window.kidEnglish.settings.doctorGame)).seen.checkup).toBe(1);
});

test('DR2 mức 2: đếm 2–5 khối rồi "How many blocks?" — thẻ số sai → "That\'s x. Let\'s count again!"; đúng → "Yes! N blocks!"; đã nhầm thì không ghi số "đã gặp"', async ({ page }) => {
  await enterDoctor(page, { level: 2, rounds: 0, lock: 2, seen: {} }, 0);
  await washUp(page);
  await expect(play(page)).toHaveAttribute('data-state', 'measure', { timeout: 15000 });
  const n = Number(await page.locator('.dr-measure').getAttribute('data-heights'));
  expect(n >= 2 && n <= 5).toBe(true);
  await expect(page.locator('.dr-block.next')).toHaveCount(0);
  for (let i = 0; i < n; i++) {
    await page.locator(`.dr-block[data-i="${i}"]`).click();
    await expect(page.locator('.dr-block.lit')).toHaveCount(i + 1, { timeout: 15000 });
  }
  await expect(play(page)).toHaveAttribute('data-state', 'howmany', { timeout: 15000 });
  await expect(page.locator('.dr-tray .dr-item')).toHaveCount(3);
  const wrong = await page.locator(`.dr-tray .dr-item:not([data-item="n-${n}"])`).first().getAttribute('data-item');
  const x = Number(wrong.slice(2));
  const words = ['zero', 'one', 'two', 'three', 'four', 'five'];
  const k = (await spoken(page)).length;
  await expect(async () => {
    await page.locator(`.dr-item[data-item="${wrong}"]`).click();
    expect(await saidSince(page, k, new RegExp(`^That's ${words[x]}\\. Let's count again!$`))).toBe(true);
  }).toPass({ timeout: 15000 });
  await page.locator(`.dr-item[data-item="n-${n}"]`).click();
  await expect.poll(() => spoken(page)).toContain(`Yes! ${words[n].charAt(0).toUpperCase()}${words[n].slice(1)} blocks!`);
  await giveSticker(page);
  await expect(page.locator('.dr-count')).toHaveText('2/3', { timeout: 15000 });
  expect(await page.evaluate((key) => window.kidEnglish.db.get('progress', key), `number:${n}`)).toBeFalsy();
});

test('DR2 mức 3: hai bạn khác chiều cao, đo lần lượt; ra nền giữa lúc đếm → quay lại giữ khối đã đếm; "Who is taller?" — chạm bạn thấp → câu nhầm; bạn cao → "X is taller! Y is shorter!"', async ({ page }) => {
  await enterDoctor(page, { level: 3, rounds: 0, lock: 3, seen: {} }, 0);
  await washUp(page);
  await expect(play(page)).toHaveAttribute('data-state', 'measure', { timeout: 15000 });
  const [a, b] = (await page.locator('.dr-measure').getAttribute('data-heights')).split(',').map(Number);
  expect(a).not.toBe(b);
  await expect(page.locator('.dr-measure-pet')).toHaveCount(2);
  await page.locator('.dr-block[data-who="0"][data-i="0"]').click();
  await expect(page.locator('.dr-block[data-who="0"].lit')).toHaveCount(1, { timeout: 15000 });
  await setVisibility(page, 'hidden');
  await setVisibility(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'measure', { timeout: 15000 });
  await expect(page.locator('.dr-block[data-who="0"].lit')).toHaveCount(1);
  await expect(page.locator('.dr-measure')).toHaveAttribute('data-heights', `${a},${b}`);
  for (const [w, n] of [[0, a], [1, b]]) {
    for (let i = w === 0 ? 1 : 0; i < n; i++) {
      await expect(play(page)).toHaveAttribute('data-state', 'measure', { timeout: 15000 });
      await page.locator(`.dr-block[data-who="${w}"][data-i="${i}"]`).click();
      await expect(page.locator(`.dr-block[data-who="${w}"][data-i="${i}"]`)).toHaveClass(/lit/, { timeout: 15000 });
    }
  }
  await expect(play(page)).toHaveAttribute('data-state', 'taller', { timeout: 15000 });
  const tall = a > b ? 0 : 1;
  const names = await page.locator('.dr-measure-pet').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  const k = (await spoken(page)).length;
  await expect(async () => {
    await page.locator(`.dr-measure-pet[data-who="${1 - tall}"]`).click();
    expect(await saidSince(page, k, new RegExp(`^That's ${names[1 - tall]}\\. ${names[1 - tall]} is shorter\\. Who is taller\\?$`))).toBe(true);
  }).toPass({ timeout: 15000 });
  await page.locator(`.dr-measure-pet[data-who="${tall}"]`).click();
  await expect.poll(() => spoken(page)).toContain(`${names[tall]} is taller! ${names[1 - tall]} is shorter!`);
  await giveSticker(page);
  await expect(page.locator('.dr-count')).toHaveText('2/3', { timeout: 15000 });
});
