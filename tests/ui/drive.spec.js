// Chia sẻ bài qua Google Drive (SPEC-drive.md). Google được giả lập: đăng nhập giả + Drive API giả (bộ nhớ trong test),
// dùng chung cho 2 "máy" (2 trình duyệt riêng) để kiểm tra trọn đường: máy A tải lên → máy B nhập bài.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const CLIENT_ID = 'test-client.apps.googleusercontent.com';
const API_KEY = 'AIza-test-key';

function fakeGoogle() {
  const files = new Map();
  let next = 1;
  const stats = { uploads: 0, logins: 0 };
  const visible = (f, q) => {
    const name = q.match(/name = '((?:[^'\\]|\\.)*)'/)?.[1]?.replace(/\\(.)/g, '$1');
    const parent = q.match(/'([^']+)' in parents/)?.[1];
    if (f.trashed || (name != null && f.name !== name) || (parent && !f.parents?.includes(parent))) return false;
    if (q.includes("mimeType = 'application/vnd.google-apps.folder'") && !f.folder) return false;
    if (q.includes("mimeType != 'application/vnd.google-apps.folder'") && f.folder) return false;
    return true;
  };
  const handler = async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const send = (body, status = 200, contentType = 'application/json') => route.fulfill({
      status, contentType, body: typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body),
      headers: { 'access-control-allow-origin': '*' },
    });
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    }
    // Tải công khai bằng API key (không đăng nhập): chỉ file đã bật "ai có link".
    const id = url.pathname.match(/\/files\/([^/]+)$/)?.[1];
    if (url.searchParams.has('key')) {
      if (url.searchParams.get('key') !== API_KEY) return send({}, 403);
      const f = files.get(id);
      if (!f?.public) return send({}, 404);
      return url.searchParams.get('alt') === 'media' ? send(f.body, 200, 'application/zip') : send({ name: f.name });
    }
    if (req.headers().authorization !== 'Bearer token-ok') return send({}, 401);
    const perm = url.pathname.match(/\/files\/([^/]+)\/permissions$/)?.[1];
    if (perm && req.method() === 'POST') {
      const body = JSON.parse(req.postData());
      if (body.type === 'anyone' && body.role === 'reader') files.get(perm).public = true;
      return send({ id: 'perm1' });
    }
    const upload = url.pathname.startsWith('/upload/');
    if (!upload && !id && req.method() === 'GET') {
      const list = [...files.values()].filter((f) => visible(f, url.searchParams.get('q'))).sort((a, b) => b.t - a.t);
      return send({ files: list.map((f) => ({ id: f.id, name: f.name, modifiedTime: new Date(f.t).toISOString() })) });
    }
    if (!upload && !id && req.method() === 'POST') {
      const meta = JSON.parse(req.postData());
      const f = { id: `f${next++}`, name: meta.name, folder: true, t: Date.now() };
      files.set(f.id, f);
      return send({ id: f.id });
    }
    if (upload && req.method() === 'POST') {
      const buf = req.postDataBuffer();
      const text = buf.toString('latin1');
      const meta = JSON.parse(text.match(/\r\n\r\n(\{.*?\})\r\n--/s)[1]);
      const start = text.indexOf('\r\n\r\n', text.indexOf('Content-Type: application/zip')) + 4;
      const end = text.lastIndexOf('\r\n--');
      const f = { id: `f${next++}`, name: meta.name, parents: meta.parents, body: buf.subarray(start, end), t: Date.now() };
      files.set(f.id, f);
      stats.uploads++;
      return send({ id: f.id, name: f.name });
    }
    if (upload && req.method() === 'PATCH') {
      const f = files.get(id);
      f.body = req.postDataBuffer();
      f.t = Date.now();
      stats.uploads++;
      return send({ id: f.id, name: f.name });
    }
    if (id && url.searchParams.get('alt') === 'media') return send(files.get(id).body, 200, 'application/zip');
    if (id) return files.has(id) ? send({ id, name: files.get(id).name, trashed: false }) : send({}, 404);
    return send({}, 500);
  };
  return { files, stats, handler };
}

/** Một "máy": trình duyệt riêng (IndexedDB riêng), đăng nhập Google giả, Drive giả dùng chung. */
async function device(browser, google, { apiKey = '' } = {}) {
  const context = await browser.newContext({ baseURL: 'http://localhost:4173/', reducedMotion: 'reduce' });
  const page = await context.newPage();
  await fakeSpeech(page);
  await page.addInitScript(() => {
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: (cfg) => ({
            requestAccessToken: () => {
              window.__logins = (window.__logins ?? 0) + 1;
              setTimeout(() => cfg.callback({ access_token: 'token-ok', expires_in: 3600 }), 20);
            },
          }),
        },
      },
    };
  });
  await page.route('https://www.googleapis.com/**', google.handler);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: /Cài đặt/ }).click();
  await page.getByLabel('Google Client ID').fill(CLIENT_ID);
  if (apiKey) await page.getByLabel('Google API key').fill(apiKey);
  await page.getByRole('button', { name: 'Lưu', exact: true }).last().click();
  return { context, page };
}

test('máy A tải bài lên Google Drive (thư mục Kid English) → máy B nhập bài từ Google Drive', async ({ browser }) => {
  const google = fakeGoogle();

  // ----- Máy A: kết nối thử, tạo file bài, tải lên -----
  const a = await device(browser, google);
  await a.page.getByRole('button', { name: 'Kết nối thử' }).click();
  await expect(a.page.getByText(/Đã kết nối.*"Kid English"/)).toBeVisible();
  await a.page.evaluate(() => window.kidEnglish.go('parent', { view: 'lessons' }));
  await a.page.getByRole('button', { name: /Animals/ }).click();
  await a.page.getByRole('button', { name: '1. Tạo file bài' }).click();
  const upload = a.page.getByRole('button', { name: '3. Tải lên Google Drive' });
  await expect(upload).toBeVisible();
  await upload.click();
  await expect(a.page.getByText(/Đã tải lên Google Drive: Kid English\/\d+-animals\.zip/)).toBeVisible();
  // Tải lại cùng file: ghi đè, không tạo bản trùng.
  await upload.click();
  await expect(a.page.getByText(/thay file cũ cùng tên/)).toBeVisible();
  expect([...google.files.values()].filter((f) => !f.folder)).toHaveLength(1);
  expect([...google.files.values()].filter((f) => f.folder).map((f) => f.name)).toEqual(['Kid English']);

  // ----- Máy B: xóa bài Animals có sẵn, rồi nhập lại từ Drive -----
  const b = await device(browser, google);
  await b.page.evaluate(() => window.kidEnglish.go('parent', { view: 'lessons' }));
  await b.page.getByRole('button', { name: /Animals/ }).click();
  await b.page.getByRole('button', { name: 'Xóa bài này' }).click();
  await b.page.getByRole('button', { name: 'Xóa bài', exact: true }).click();
  await expect(b.page.getByRole('button', { name: /Animals/ })).toHaveCount(0);

  await b.page.getByRole('button', { name: 'Nhập bài từ Google Drive' }).click();
  const file = b.page.getByRole('button', { name: /⬇️ \d+-animals\.zip/ });
  await expect(file).toBeVisible();
  await file.click();
  await expect(b.page.getByRole('status').filter({ hasText: 'nhập 1 bài mới' })).toBeVisible();
  await expect(b.page.getByRole('button', { name: /Animals/ })).toBeVisible();
  // Đăng nhập một lần cho cả buổi (vé còn hạn thì không hỏi lại).
  expect(await b.page.evaluate(() => window.__logins)).toBe(1);

  await a.context.close();
  await b.context.close();
});

test('chưa thiết lập Google Drive: không có nút tải lên, có hướng dẫn chỗ thiết lập', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Quản lý bài' }).click();
  await page.getByRole('button', { name: /Animals/ }).click();
  await page.getByRole('button', { name: '1. Tạo file bài' }).click();
  await expect(page.getByRole('button', { name: '2. Gửi file' })).toBeVisible();
  await expect(page.getByRole('button', { name: '3. Tải lên Google Drive' })).toBeHidden();
  await expect(page.getByText('Muốn tải thẳng lên Google Drive: Góc bố mẹ → Cài đặt → Google Drive.')).toBeVisible();
});

test('link nhập bài: máy A (có API key) tải lên → copy link → máy C chưa thiết lập gì, không đăng nhập, dán link là nhập được', async ({ browser }) => {
  const google = fakeGoogle();
  const a = await device(browser, google, { apiKey: API_KEY });
  await a.page.evaluate(() => window.kidEnglish.go('parent', { view: 'lessons' }));
  await a.page.getByRole('button', { name: /Colors/ }).click();
  await a.page.getByRole('button', { name: '1. Tạo file bài' }).click();
  await a.page.getByRole('button', { name: '3. Tải lên Google Drive' }).click();
  const linkInput = a.page.getByLabel('Link nhập bài');
  await expect(linkInput).toBeVisible();
  const link = await linkInput.inputValue();
  expect(link).toMatch(/#drive=f\d+&key=AIza-test-key$/);
  expect([...google.files.values()].find((f) => f.name.endsWith('colors.zip')).public).toBe(true);

  // Máy C: trình duyệt mới, không Client ID, không API key, không đăng nhập Google.
  const context = await browser.newContext({ baseURL: 'http://localhost:4173/', reducedMotion: 'reduce' });
  const c = await context.newPage();
  await fakeSpeech(c);
  await c.route('https://www.googleapis.com/**', google.handler);
  await startApp(c);
  await c.evaluate(() => window.kidEnglish.go('parent', { view: 'lessons' }));
  await c.getByRole('button', { name: /Colors/ }).click();
  await c.getByRole('button', { name: 'Xóa bài này' }).click();
  await c.getByRole('button', { name: 'Xóa bài', exact: true }).click();
  await expect(c.getByRole('button', { name: /Colors/ })).toHaveCount(0);

  await c.getByRole('button', { name: 'Nhập bài từ link' }).click();
  await c.getByLabel('Link bài học').fill('xin chào');
  await c.getByRole('button', { name: 'Nhập', exact: true }).click();
  await expect(c.getByRole('status').filter({ hasText: 'Link không đúng' })).toBeVisible();
  await c.getByLabel('Link bài học').fill(link);
  await c.getByRole('button', { name: 'Nhập', exact: true }).click();
  await expect(c.getByRole('status').filter({ hasText: 'nhập 1 bài mới' })).toBeVisible();
  await expect(c.getByRole('button', { name: /Colors/ })).toBeVisible();
  expect(await c.evaluate(() => window.__logins ?? 0)).toBe(0);

  // Mở app bằng chính link nhập bài: ô link được điền sẵn ở Quản lý bài, phần # bị xóa khỏi thanh địa chỉ.
  const d = await context.newPage();
  await fakeSpeech(d);
  await d.goto(`/?fast&nosw${link.slice(link.indexOf('#'))}`);
  await d.getByRole('button', { name: 'Bắt đầu' }).click();
  await d.evaluate(() => window.kidEnglish.go('parent', { view: 'lessons' }));
  await expect(d.getByLabel('Link bài học')).toHaveValue(/#drive=f\d+&key=AIza-test-key/);
  expect(await d.evaluate(() => location.hash)).toBe('');

  await a.context.close();
  await context.close();
});
