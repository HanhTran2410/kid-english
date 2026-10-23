// Tạo app/shared/index.json — danh sách file bài trong thư viện bài trên GitHub (SPEC-drive.md mục 8).
// Chạy: node scripts/make-shared-index.mjs. Workflow deploy chạy lại trước khi đưa app lên GitHub Pages,
// nên bố mẹ chỉ cần tải file .zip vào app/shared/ (kể cả qua trang web GitHub) là thư viện tự cập nhật.

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const dir = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'app', 'shared');

/** Loại bài → nhãn + emoji mặc định (giống Quản lý bài). */
function kindOf(lesson) {
  if (lesson.kind === 'phrases' || Array.isArray(lesson.phrases)) return ['phrases', 'Câu nói'];
  if (lesson.kind === 'numbers' || Array.isArray(lesson.numbers)) return ['numbers', 'Số đếm'];
  if (lesson.kind === 'phonics' || Array.isArray(lesson.letters)) return ['phonics', 'Chữ cái'];
  if (lesson.kind === 'talk' || Array.isArray(lesson.turns)) return ['talk', 'Nói chuyện'];
  return ['words', 'Từ vựng'];
}
/** File ảnh của trò chơi (không có bài học): đặt tên theo trò. */
const GAME_FILES = {
  feed: ['🍌', 'Ảnh Cho Bông ăn'], hide: ['🙈', 'Ảnh Trốn tìm'], scene: ['🎨', 'Ảnh Dán tranh'], dress: ['👗', 'Đồ Mặc đồ'],
  puzzle: ['🧩', 'Ảnh Ghép hình'], missing: ['🔍', 'Ảnh Tìm đồ còn thiếu'], sounds: ['🐮', 'Ảnh & tiếng Ai kêu thế?'],
  doctor: ['🩺', 'Ảnh Bác sĩ nhí'], jobs: ['🧑‍⚕️', 'Ảnh Đóng vai'],
};

async function describe(file) {
  const zip = await JSZip.loadAsync(await readFile(path.join(dir, file)));
  const read = async (p) => JSON.parse(await zip.file(p)?.async('string') ?? 'null');
  const manifest = await read('manifest.json');
  if (manifest?.app !== 'kid-english') return null;
  const lessons = [];
  for (const f of zip.file(/^lessons\/[^/]+\.json$/)) lessons.push(JSON.parse(await f.async('string')));
  const images = (await read('images.json')) ?? [];
  const size = (await stat(path.join(dir, file))).size;
  if (lessons.length) {
    const [kind, kindVi] = kindOf(lessons[0]);
    return {
      file, kind, kindVi, emoji: lessons[0].emoji ?? '📘', title: lessons.map((l) => l.title).join(', '),
      titleVi: lessons.map((l) => l.titleVi).filter(Boolean).join(', '), lessons: lessons.length, images: images.length, size,
    };
  }
  const game = String(images[0]?.lessonId ?? '').split(':')[0];
  const [emoji, title] = GAME_FILES[game] ?? ['🖼️', 'Ảnh trò chơi'];
  return { file, kind: 'game', kindVi: 'Ảnh trò chơi', emoji, title, titleVi: '', lessons: 0, images: images.length, size };
}

const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith('.zip')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
const items = [];
for (const f of files) {
  try {
    const d = await describe(f);
    if (d) items.push(d);
    else console.warn(`Bỏ qua ${f}: không phải file của app.`);
  } catch (err) {
    console.warn(`Bỏ qua ${f}: ${err.message}`);
  }
}
await writeFile(path.join(dir, 'index.json'), `${JSON.stringify({ version: 1, files: items }, null, 2)}\n`);
console.log(`app/shared/index.json: ${items.length} file.`);
