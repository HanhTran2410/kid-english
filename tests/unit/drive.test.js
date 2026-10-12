import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DriveClient, DriveError, FOLDER_MIME } from '../../app/js/drive.js';

/**
 * Google Drive giả trong bộ nhớ: đủ để kiểm tra app gọi đúng API (tìm/tạo thư mục, tải lên, ghi đè, liệt kê, tải về).
 */
function fakeDrive() {
  const files = new Map(); // id → { id, name, mimeType, parents, trashed, modifiedTime, body }
  let next = 1;
  const calls = [];
  const json = (status, data) => ({ ok: status < 400, status, json: async () => data, blob: async () => data });
  const matches = (f, q) => {
    const name = q.match(/name = '((?:[^'\\]|\\.)*)'/)?.[1]?.replace(/\\(.)/g, '$1');
    const parent = q.match(/'([^']+)' in parents/)?.[1];
    if (name != null && f.name !== name) return false;
    if (parent && !f.parents?.includes(parent)) return false;
    if (q.includes(`mimeType = '${FOLDER_MIME}'`) && f.mimeType !== FOLDER_MIME) return false;
    if (q.includes(`mimeType != '${FOLDER_MIME}'`) && f.mimeType === FOLDER_MIME) return false;
    return !f.trashed;
  };
  const fetchFn = async (url, opts = {}) => {
    const u = new URL(url);
    calls.push({ method: opts.method ?? 'GET', path: u.pathname, query: Object.fromEntries(u.searchParams), auth: opts.headers?.Authorization });
    if (opts.headers?.Authorization !== 'Bearer good') return json(401, {});
    const id = u.pathname.match(/\/files\/([^/]+)$/)?.[1];
    const upload = u.pathname.startsWith('/upload/');
    if (!upload && u.pathname.endsWith('/drive/v3/files') && (opts.method ?? 'GET') === 'GET') {
      const list = [...files.values()].filter((f) => matches(f, u.searchParams.get('q')));
      if (u.searchParams.get('orderBy') === 'modifiedTime desc') list.sort((a, b) => b.modifiedTime - a.modifiedTime);
      return json(200, { files: list.map(({ body, ...f }) => ({ ...f, modifiedTime: new Date(f.modifiedTime).toISOString() })) });
    }
    if (!upload && u.pathname.endsWith('/drive/v3/files') && opts.method === 'POST') {
      const meta = JSON.parse(opts.body);
      const f = { id: `id${next++}`, ...meta, modifiedTime: Date.now() };
      files.set(f.id, f);
      return json(200, { id: f.id });
    }
    if (u.pathname.includes('/upload/') && opts.method === 'POST') {
      const text = await opts.body.text();
      const meta = JSON.parse(text.match(/\r\n\r\n(\{.*?\})\r\n--/s)[1]);
      const f = { id: `id${next++}`, ...meta, modifiedTime: Date.now() + next, body: text };
      files.set(f.id, f);
      return json(200, { id: f.id, name: f.name });
    }
    if (u.pathname.includes('/upload/') && opts.method === 'PATCH') {
      const f = files.get(id);
      f.body = opts.body;
      f.modifiedTime = Date.now() + next++;
      return json(200, { id: f.id, name: f.name });
    }
    if (id && u.searchParams.get('alt') === 'media') return json(200, files.get(id)?.body);
    if (id) return files.has(id) ? json(200, files.get(id)) : json(404, {});
    return json(500, {});
  };
  return { files, calls, fetchFn };
}

const client = (fake, token = 'good') => new DriveClient(async () => token, fake.fetchFn);

test('thư mục của app: chưa có thì tạo, có rồi thì dùng lại (theo tên hoặc id đã nhớ), id đã nhớ bị xóa thì tìm/tạo lại', async () => {
  const fake = fakeDrive();
  const c = client(fake);
  const id = await c.ensureFolder('Kid English');
  assert.equal(fake.files.get(id).mimeType, FOLDER_MIME);
  assert.equal(await c.ensureFolder('Kid English'), id, 'tìm theo tên');
  assert.equal(await c.ensureFolder('Kid English', id), id, 'dùng id đã nhớ');
  fake.files.get(id).trashed = true;
  const again = await c.ensureFolder('Kid English', id);
  assert.notEqual(again, id, 'thư mục cũ đã vào thùng rác → tạo thư mục mới');
  assert.equal(await c.ensureFolder('Kid English', 'không-có'), again, 'id lạ (404) → tìm theo tên');
  assert.equal(await c.ensureFolder("Bé's lessons"), (await c.ensureFolder("Bé's lessons")), 'tên có dấu nháy');
});

test('tải lên: file mới vào đúng thư mục; tải lại cùng tên thì ghi đè, không tạo bản trùng', async () => {
  const fake = fakeDrive();
  const c = client(fake);
  const folder = await c.ensureFolder('Kid English');
  const first = await c.upload(folder, '01-animals.zip', new Blob(['v1']));
  assert.equal(first.replaced, false);
  assert.deepEqual(fake.files.get(first.id).parents, [folder]);
  assert.match(fake.files.get(first.id).body, /v1/);
  const second = await c.upload(folder, '01-animals.zip', new Blob(['v2']));
  assert.equal(second.replaced, true);
  assert.equal(second.id, first.id);
  assert.equal([...fake.files.values()].filter((f) => f.name === '01-animals.zip').length, 1);
  assert.ok(fake.calls.every((x) => x.auth === 'Bearer good'));
});

test('liệt kê file bài (.zip) trong thư mục, mới nhất trước; tải về đúng nội dung', async () => {
  const fake = fakeDrive();
  const c = client(fake);
  const folder = await c.ensureFolder('Kid English');
  const other = await c.ensureFolder('Other');
  await c.upload(folder, '01-animals.zip', new Blob(['a']));
  await c.upload(folder, '02-colors.zip', new Blob(['b']));
  await c.upload(other, '03-other.zip', new Blob(['c']));
  await c.upload(folder, 'notes.txt', new Blob(['x']), 'text/plain');
  const list = await c.listLessonFiles(folder);
  assert.deepEqual(list.map((f) => f.name), ['02-colors.zip', '01-animals.zip']);
  assert.match(String(await c.download(list[1].id)), /a/);
});

test('hết phiên đăng nhập (401): báo lỗi rõ và xóa vé để lần sau đăng nhập lại', async () => {
  const fake = fakeDrive();
  const c = client(fake, 'expired');
  let forgot = false;
  c.onUnauthorized = () => { forgot = true; };
  await assert.rejects(c.ensureFolder('Kid English'), (err) => err instanceof DriveError && err.code === 'auth');
  assert.equal(forgot, true);
  const offline = new DriveClient(async () => 'good', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(offline.ensureFolder('Kid English'), (err) => err.code === 'offline');
});

test('link nhập bài: tạo và đọc lại; đọc được link Google Drive thường và mã file', async () => {
  const { importLink, parseDriveLink } = await import('../../app/js/drive.js');
  const id = '1AbCdEfGhIjKlMnOpQrStUvWxYz_-12345';
  const link = importLink(id, 'AIzaKEY-123', 'https://hanhtran2410.github.io/kid-english/');
  assert.equal(link, `https://hanhtran2410.github.io/kid-english/#drive=${id}&key=AIzaKEY-123`);
  assert.deepEqual(parseDriveLink(link), { id, key: 'AIzaKEY-123' });
  assert.deepEqual(parseDriveLink(`  https://drive.google.com/file/d/${id}/view?usp=sharing `), { id, key: null });
  assert.deepEqual(parseDriveLink(`https://drive.google.com/open?id=${id}`), { id, key: null });
  assert.deepEqual(parseDriveLink(`https://drive.google.com/uc?export=download&id=${id}`), { id, key: null });
  assert.deepEqual(parseDriveLink(id), { id, key: null });
  assert.equal(parseDriveLink('xin chào'), null);
  assert.equal(parseDriveLink(''), null);
});

test('tải file công khai bằng API key (không đăng nhập); file chưa chia sẻ / key sai thì báo rõ', async () => {
  const { downloadPublicFile } = await import('../../app/js/drive.js');
  const seen = [];
  const fetchFn = async (url, opts) => {
    const u = new URL(url);
    seen.push({ auth: opts?.headers?.Authorization, key: u.searchParams.get('key') });
    if (!u.pathname.endsWith('/files/pub123456789012345678')) return { ok: false, status: 404 };
    if (u.searchParams.get('key') !== 'K') return { ok: false, status: 403 };
    if (u.searchParams.get('alt') === 'media') return { ok: true, status: 200, blob: async () => 'ZIP' };
    return { ok: true, status: 200, json: async () => ({ name: '01-animals.zip' }) };
  };
  assert.deepEqual(await downloadPublicFile('pub123456789012345678', 'K', fetchFn), { name: '01-animals.zip', blob: 'ZIP' });
  assert.ok(seen.every((x) => x.auth === undefined && x.key === 'K'), 'không gửi vé đăng nhập');
  await assert.rejects(downloadPublicFile('pub123456789012345678', 'sai', fetchFn), (err) => err.code === 'denied');
  await assert.rejects(downloadPublicFile('khac12345678901234567', 'K', fetchFn), (err) => err.code === 'notfound');
});

test('bật "ai có link đều xem được": quyền xem cho mọi người', async () => {
  const sent = [];
  const c = new DriveClient(async () => 'good', async (url, opts) => {
    sent.push({ url, opts });
    return { ok: true, status: 200, json: async () => ({ id: 'p1' }) };
  });
  await c.makePublic('file1');
  assert.match(sent[0].url, /\/drive\/v3\/files\/file1\/permissions/);
  assert.equal(sent[0].opts.method, 'POST');
  assert.deepEqual(JSON.parse(sent[0].opts.body), { role: 'reader', type: 'anyone' });
});
