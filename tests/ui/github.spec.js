// Tải bài lên Thư viện bài trên GitHub (SPEC-drive.md mục 9) — GitHub API được giả lập (page.route).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

/** Giả lập GitHub API: repo ghi được; file chưa có (404) trừ khi `existing`; ghi lại các lần PUT. */
async function fakeGitHub(page, { existing = [] } = {}) {
  const puts = [];
  await page.route('https://api.github.com/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'PUT') {
      puts.push({ path: url.pathname, body: JSON.parse(req.postData()) });
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    }
    if (/\/contents\//.test(url.pathname)) {
      const name = url.pathname.split('/').pop();
      return existing.includes(name)
        ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sha: 'OLD', size: 1 }) })
        : route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ full_name: 'HanhTran2410/kid-english', permissions: { push: true }, private: false }) });
  });
  return puts;
}
const firstLessonId = (page) => page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).sort((a, b) => a.no - b.no)[0].id);

test('Cài đặt → GitHub: dán token → Kiểm tra → "Dùng được"; token không có trong bản sao lưu đầy đủ', async ({ page }) => {
  await fakeGitHub(page);
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: /Cài đặt/ }).click();
  await page.getByLabel('Token GitHub').fill('github_pat_TEST');
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await expect(page.getByText(/✅ Dùng được: tải lên HanhTran2410\/kid-english\/app\/shared/)).toBeVisible();
  expect(await page.evaluate(() => window.kidEnglish.settings.githubToken)).toBe('github_pat_TEST');
  const hasToken = await page.evaluate(async () => {
    const { createBackup } = await import('/js/backup.js');
    const made = await createBackup(window.kidEnglish.db, { appVersion: 'x' });
    const zip = await window.JSZip.loadAsync(made.blob);
    return (await zip.file('settings.json').async('string')).includes('github_pat_TEST');
  });
  expect(hasToken).toBe(false);
});

test('Chia sẻ bài → "☁️ Tải lên Thư viện bài (GitHub)" → hỏi xác nhận → PUT file .zip vào app/shared/ → hiện link nhập bài', async ({ page }) => {
  const puts = await fakeGitHub(page);
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.setSetting('githubToken', 'github_pat_TEST'));
  const id = await firstLessonId(page);
  await openParent(page);
  await page.evaluate((lessonId) => import('/js/screens/parent/common.js').then((m) => m.goParent(window.kidEnglish, 'lesson', { lessonId })), id);
  await page.getByRole('button', { name: '☁️ Tải lên Thư viện bài (GitHub)' }).click();
  await page.getByRole('button', { name: 'Tải lên', exact: true }).click();
  await expect(page.getByText(/Đã tải lên .+\.zip\. Khoảng 1–2 phút nữa/)).toBeVisible();
  expect(puts).toHaveLength(1);
  expect(puts[0].path).toMatch(/^\/repos\/HanhTran2410\/kid-english\/contents\/app\/shared\/[\w.-]+\.zip$/);
  expect(puts[0].body.content.length).toBeGreaterThan(100);
  expect(puts[0].body.sha).toBeUndefined();
  await expect(page.getByLabel('Link nhập bài GitHub')).toHaveValue(/#zip=shared%2F[\w.-]+\.zip$/);
  expect(Object.keys(await page.evaluate(() => window.kidEnglish.settings.githubUploads))).toContain(id);
});

test('Tự tải lên (bật trong Cài đặt): bài mới chờ → mở Quản lý bài thì tải lên; bài đã trong thư viện sửa xong rời trang → tự tải lại (ghi đè, có sha)', async ({ page }) => {
  const puts = await fakeGitHub(page, { existing: ['already-there.zip'] });
  await fakeSpeech(page);
  await startApp(page);
  const id = await firstLessonId(page);
  await page.evaluate(async (lessonId) => {
    const app = window.kidEnglish;
    await app.setSetting('githubToken', 'github_pat_TEST');
    await app.setSetting('githubAutoUpload', true);
    const g = await import('/js/screens/parent/github.js');
    await g.markNewLesson(app, lessonId);
  }, id);
  await openParent(page);
  await page.getByRole('button', { name: /Quản lý bài/ }).click();
  await expect.poll(() => puts.length).toBe(1);
  expect(await page.evaluate(() => window.kidEnglish.settings.githubPending)).toEqual([]);
  // Bài đã có trong thư viện (file already-there.zip) mà nội dung đổi: rời trang bài → tự tải lại, ghi đè bằng sha.
  await page.evaluate((lessonId) => window.kidEnglish.setSetting('githubUploads', { [lessonId]: { file: 'already-there.zip', sig: 'cũ', at: 1 } }), id);
  await page.evaluate((lessonId) => import('/js/screens/parent/common.js').then((m) => m.goParent(window.kidEnglish, 'lesson', { lessonId })), id);
  await page.getByRole('button', { name: /Quản lý bài|←|Quay lại/ }).first().click().catch(() => page.evaluate(() => import('/js/screens/parent/common.js').then((m) => m.goParent(window.kidEnglish, 'lessons'))));
  await expect.poll(() => puts.length, { timeout: 10000 }).toBe(2);
  expect(puts[1].path).toMatch(/\/app\/shared\/already-there\.zip$/);
  expect(puts[1].body.sha).toBe('OLD');
});
