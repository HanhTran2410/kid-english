// Service worker: cache toàn bộ phần code để chạy offline (SPEC mục 2).
// Mỗi lần sửa code: tăng VERSION (trùng APP_VERSION trong js/app.js) để máy tải bản mới.
// Thêm/bớt file trong app/ thì cập nhật ASSETS (test tests/unit/sw.test.js sẽ báo nếu thiếu).

const VERSION = '0.1.14';
const CACHE = `kid-english-${VERSION}`;

const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'fonts/nunito-latin-700-normal.woff2',
  'fonts/nunito-latin-800-normal.woff2',
  'fonts/nunito-latin-ext-700-normal.woff2',
  'fonts/nunito-latin-ext-800-normal.woff2',
  'fonts/nunito-vietnamese-700-normal.woff2',
  'fonts/nunito-vietnamese-800-normal.woff2',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'js/app.js',
  'js/backup.js',
  'js/bong.js',
  'js/db.js',
  'js/image.js',
  'js/lesson.js',
  'js/main.js',
  'js/match.js',
  'js/player/completion-stage.js',
  'js/player/conversation-stage.js',
  'js/player/layout.js',
  'js/player/lesson-player.js',
  'js/player/plan.js',
  'js/player/quiz-stage.js',
  'js/player/stage-kit.js',
  'js/player/story-stage.js',
  'js/player/teacher.js',
  'js/player/track.js',
  'js/player/visuals.js',
  'js/player/vocabulary-stage.js',
  'js/progress.js',
  'js/prompts.js',
  'js/samples.js',
  'js/screens/child.js',
  'js/screens/learn.js',
  'js/screens/parent/backup.js',
  'js/screens/parent/common.js',
  'js/screens/parent/create.js',
  'js/screens/parent/index.js',
  'js/screens/parent/lessons.js',
  'js/screens/parent/recordings.js',
  'js/screens/parent/settings.js',
  'js/screens/parent/stickers.js',
  'js/screens/review.js',
  'js/session.js',
  'js/settings.js',
  'js/speech/listen.js',
  'js/speech/microphone.js',
  'js/speech/recognition.js',
  'js/speech/recorder.js',
  'js/speech/sfx.js',
  'js/speech/tts.js',
  'js/stickers.js',
  'js/text.js',
  'js/timing.js',
  'js/ui.js',
  'lessons/animals.json',
  'lessons/colors.json',
  'vendor/jszip.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((a) => new Request(a, { cache: 'reload' })))));
  // Không skipWaiting ngay: bản mới chỉ áp dụng ở lần mở sau hoặc khi bố mẹ bấm "Cập nhật ngay".
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('kid-english-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Mở app (điều hướng) → luôn trả index.html đã cache.
    if (request.mode === 'navigate') {
      return (await cache.match('index.html')) ?? fetch(request);
    }
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      return await fetch(request);
    } catch {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
