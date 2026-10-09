// Khởi động app và đăng ký các màn hình.

import { App } from './app.js';
import { openDatabase, migrateMedia } from './db.js';
import { loadSettings } from './settings.js';
import { seedSamplesOnce } from './samples.js';
import { startScreen, homeScreen, lessonsScreen, stickersScreen, sleepScreen } from './screens/child.js';
import { lessonScreen } from './player/lesson-player.js';
import { reviewScreen } from './screens/review.js';
import { learnScreen } from './screens/learn.js';
import { parentScreen } from './screens/parent/index.js';

async function registerServiceWorker(app) {
  if (!('serviceWorker' in navigator) || new URLSearchParams(location.search).has('nosw')) return;
  try {
    // Lần đầu cài, service worker nhận quyền điều khiển trang: không cần tải lại.
    // Chỉ tải lại khi một bản mới thay bản cũ.
    const hadController = Boolean(navigator.serviceWorker.controller);
    const reg = await navigator.serviceWorker.register('sw.js');
    app.swRegistration = reg;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading || !hadController) return;
      reloading = true;
      location.reload();
    });
    // Bản mới đã tải từ lần trước: áp dụng ngay lúc mở app (trước khi bé bắt đầu học).
    if (reg.waiting && navigator.serviceWorker.controller) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  } catch (err) {
    console.warn('Không đăng ký được service worker', err);
  }
}

function fatal(message) {
  document.getElementById('app').innerHTML = '';
  const p = document.createElement('p');
  p.className = 'fatal';
  p.textContent = message;
  document.getElementById('app').append(p);
}

async function boot() {
  const app = new App(document.getElementById('app'));
  window.kidEnglish = app; // để soi lỗi qua Safari Web Inspector

  try {
    app.db = await openDatabase();
  } catch (err) {
    console.error(err);
    fatal('Không mở được bộ nhớ của app. Nếu đang dùng chế độ Duyệt web riêng tư, hãy tắt đi rồi mở lại.');
    return;
  }
  app.settings = await loadSettings(app.db);
  if (app.settings.firstUseAt == null) await app.setSetting('firstUseAt', Date.now());

  navigator.storage?.persist?.().catch(() => {});
  await seedSamplesOnce(app);
  // Chuyển ảnh/ghi âm cũ (lưu dạng Blob) sang dạng Safari đọc lại ổn định hơn.
  migrateMedia(app.db).catch((err) => console.warn('migrateMedia', err));
  await app.speaker.init({ voiceURI: app.settings.voiceURI, rate: app.settings.rate });
  app.recognizer.setAllowed(app.settings.useRecognition);
  app.startSessionClock();

  app.register('start', startScreen);
  app.register('home', homeScreen);
  app.register('lessons', lessonsScreen);
  app.register('lesson', lessonScreen);
  app.register('review', reviewScreen);
  app.register('learn', learnScreen);
  app.register('stickers', stickersScreen);
  app.register('sleep', sleepScreen);
  app.register('parent', parentScreen);

  app.go('start');
  registerServiceWorker(app);
}

boot();
