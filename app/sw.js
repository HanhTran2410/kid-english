// Service worker: cache toàn bộ phần code để chạy offline (SPEC mục 2).
// Mỗi lần sửa code: tăng VERSION (trùng APP_VERSION trong js/app.js) để máy tải bản mới.
// Thêm/bớt file trong app/ thì cập nhật ASSETS (test tests/unit/sw.test.js sẽ báo nếu thiếu).
// Thư viện bài app/shared/ (file .zip + index.json) KHÔNG lưu offline: tải từ mạng khi bố mẹ mở Thư viện bài.

const VERSION = '0.44.0';
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
  'js/phrase.js',
  'js/numbers.js',
  'js/player/completion-stage.js',
  'js/player/conversation-stage.js',
  'js/player/flipbook.js',
  'js/player/phrase-player.js',
  'js/player/phrase-stages.js',
  'js/player/number-player.js',
  'js/player/number-stages.js',
  'js/player/layout.js',
  'js/player/lesson-player.js',
  'js/player/plan.js',
  'js/player/quiz-stage.js',
  'js/player/scene.js',
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
  'js/screens/sticker-scene.js',
  'js/screens/games.js',
  'js/screens/dress-up.js',
  'js/dress-up.js',
  'js/coloring.js',
  'js/screens/coloring.js',
  'js/feed.js',
  'js/screens/feed.js',
  'js/hide-seek.js',
  'js/screens/hide-seek.js',
  'js/puzzle.js',
  'js/screens/puzzle.js',
  'js/shapes.js',
  'js/player/shape-stages.js',
  'js/missing.js',
  'js/animal-sounds.js',
  'js/bubbles.js',
  'js/screens/missing.js',
  'js/screens/animal-sounds.js',
  'js/screens/bubbles.js',
  'js/doctor.js',
  'js/patients.js',
  'js/screens/doctor.js',
  'js/jobs/kit.js',
  'js/jobs/levels.js',
  'js/jobs/shop.js',
  'js/jobs/post.js',
  'js/jobs/teacher.js',
  'js/jobs/police.js',
  'js/jobs/fire.js',
  'js/jobs/backgrounds.js',
  'js/link-import.js',
  'js/jolly.js',
  'js/player/jolly-stages.js',
  'js/github.js',
  'js/notices.js',
  'js/screens/jobs.js',
  'js/screens/notice-bell.js',
  'js/screens/shop.js',
  'js/screens/post.js',
  'js/screens/teacher.js',
  'js/screens/police.js',
  'js/screens/fire.js',
  'js/screens/parent/scenes.js',
  'js/screens/parent/dress.js',
  'js/screens/parent/feed.js',
  'js/screens/parent/doctor.js',
  'js/screens/parent/jobs.js',
  'js/screens/parent/library.js',
  'js/screens/parent/github.js',
  'js/screens/parent/hide.js',
  'js/screens/parent/puzzle.js',
  'js/screens/parent/missing.js',
  'js/screens/parent/sounds.js',
  'js/screens/parent/media-share.js',
  'js/screens/parent/backup.js',
  'js/screens/parent/common.js',
  'js/screens/parent/create.js',
  'js/screens/parent/index.js',
  'js/screens/parent/lessons.js',
  'js/screens/parent/recordings.js',
  'js/screens/parent/settings.js',
  'js/screens/parent/stickers.js',
  'js/mix.js',
  'js/captions.js',
  'js/talk.js',
  'js/player/talk-player.js',
  'js/player/talk-stages.js',
  'js/player/talk-phone.js',
  'js/player/reveal.js',
  'js/word-play.js',
  'js/screens/parent/profile.js',
  'js/phonics.js',
  'js/player/phonics-player.js',
  'js/player/phonics-stages.js',
  'js/drive.js',
  'js/screens/parent/drive.js',
  'js/player/mix-player.js',
  'js/session.js',
  'js/settings.js',
  'js/speech/listen.js',
  'js/speech/microphone.js',
  'js/speech/recognition.js',
  'js/speech/recorder.js',
  'js/speech/sfx.js',
  'js/speech/tts.js',
  'js/stickers.js',
  'js/sticker-scenes.js',
  'js/text.js',
  'js/timing.js',
  'js/ui.js',
  'lessons/animals.json',
  'lessons/colors.json',
  'sounds/phonics/s.mp3',
  'sounds/phonics/a.mp3',
  'sounds/phonics/t.mp3',
  'sounds/phonics/i.mp3',
  'sounds/phonics/p.mp3',
  'sounds/phonics/n.mp3',
  'sounds/cow.mp3',
  'sounds/dog.mp3',
  'sounds/cat.mp3',
  'sounds/duck.mp3',
  'sounds/pig.mp3',
  'sounds/sheep.mp3',
  'sounds/chicken.mp3',
  'sounds/horse.mp3',
  'sounds/bird.mp3',
  'sounds/lion.mp3',
  'sounds/frog.mp3',
  'sounds/monkey.mp3',
  'sounds/owl.mp3',
  'sounds/bee.mp3',
  'sounds/snake.mp3',
  'sounds/car.mp3',
  'sounds/train.mp3',
  'sounds/phone.mp3',
  'sounds/clock.mp3',
  'sounds/drum.mp3',
  'sounds/dishes.mp3',
  'sounds/plane.mp3',
  'sounds/fire-truck.mp3',
  'sounds/bicycle.mp3',
  'sounds/helicopter.mp3',
  'sounds/motorbike.mp3',
  'lessons/body.json',
  'lessons/family.json',
  'lessons/food.json',
  'lessons/vehicles.json',
  'lessons/feelings.json',
  'lessons/weather.json',
  'lessons/morning.json',
  'lessons/actions.json',
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
