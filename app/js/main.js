// Khởi động app và đăng ký các màn hình.

import { App } from './app.js';
import { toast } from './ui.js';
import { openDatabase, migrateMedia, ensureLessonNumbers } from './db.js';
import { loadSettings } from './settings.js';
import { seedSamplesOnce, upgradePhraseSamples, upgradePhonicsLessons, upgradeTalkLessons } from './samples.js';
import { startScreen, homeScreen, lessonsScreen, stickersScreen, sleepScreen } from './screens/child.js';
import { lessonScreen } from './player/lesson-player.js';
import { phraseLessonScreen } from './player/phrase-player.js';
import { numberLessonScreen } from './player/number-player.js';
import { phonicsLessonScreen } from './player/phonics-player.js';
import { mixScreen } from './player/mix-player.js';
import { learnScreen } from './screens/learn.js';
import { talkLessonScreen } from './player/talk-player.js';
import { stickerSceneScreen, scenePickerScreen } from './screens/sticker-scene.js';
import { gamesScreen } from './screens/games.js';
import { dressUpChooser, dressUpScreen } from './screens/dress-up.js';
import { coloringChooser, coloringScreen } from './screens/coloring.js';
import { feedScreen } from './screens/feed.js';
import { hideSeekScreen } from './screens/hide-seek.js';
import { puzzleHome, puzzleList, puzzleScreen } from './screens/puzzle.js';
import { missingScreen } from './screens/missing.js';
import { animalSoundsHome, animalSoundsScreen } from './screens/animal-sounds.js';
import { doctorScreen } from './screens/doctor.js';
import { jobsScreen } from './screens/jobs.js';
import { shopScreen } from './screens/shop.js';
import { postScreen } from './screens/post.js';
import { teacherScreen } from './screens/teacher.js';
import { policeScreen } from './screens/police.js';
import { fireScreen } from './screens/fire.js';
import { bubblesHome, bubblesScreen } from './screens/bubbles.js';
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

  // Mở app bằng "link nhập bài" (SPEC-drive mục 7: Google Drive; mục 8: GitHub #zip=): giữ link để điền sẵn ở Quản lý bài, bỏ phần # khỏi thanh địa chỉ.
  if (/[#&](drive|zip)=/.test(location.hash)) {
    app.pendingImportLink = location.href;
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    setTimeout(() => toast('Có link nhập bài: vào Góc bố mẹ → Quản lý bài → "Nhập bài từ link" (link đã điền sẵn).', 6000), 1500);
  }

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
  await ensureLessonNumbers(app.db);
  upgradePhraseSamples(app).catch(() => {});
  upgradePhonicsLessons(app).catch(() => {});
  await upgradeTalkLessons(app).catch(() => {});
  // Chuyển ảnh/ghi âm cũ (lưu dạng Blob) sang dạng Safari đọc lại ổn định hơn.
  migrateMedia(app.db).catch((err) => console.warn('migrateMedia', err));
  await app.speaker.init({ voiceURI: app.settings.voiceURI, rate: app.settings.rate });
  app.recognizer.setAllowed(app.settings.useRecognition);
  app.startSessionClock();

  app.register('start', startScreen);
  app.register('home', homeScreen);
  app.register('lessons', lessonsScreen);
  app.register('lesson', lessonScreen);
  app.register('phrases', (a) => lessonsScreen(a, { kind: 'phrases' }));
  app.register('phrase-lesson', phraseLessonScreen);
  app.register('numbers', (a) => lessonsScreen(a, { kind: 'numbers' }));
  app.register('number-lesson', numberLessonScreen);
  app.register('phonics', (a) => lessonsScreen(a, { kind: 'phonics' }));
  app.register('phonics-lesson', phonicsLessonScreen);
  app.register('review', (a) => mixScreen(a, { mode: 'review' }));
  // Góc trò chơi (SPEC-scenes mục 11): Dán tranh, Chọn từ (trò tổng hợp), Chọn số.
  app.register('play', gamesScreen);
  app.register('play-mix', (a) => mixScreen(a, { mode: 'play' }));
  // "Nói chuyện với Bông" (SPEC-talk): danh sách bài hội thoại + thẻ "Ôn từ đã học" (màn Học cùng Bông cũ).
  app.register('learn', (a) => lessonsScreen(a, { kind: 'talk' }));
  app.register('learn-review', learnScreen);
  app.register('talk-lesson', talkLessonScreen);
  app.register('stickers', stickersScreen);
  // Dán tranh (SPEC-scenes.md): chọn tranh → kéo sticker vào tranh, Bông nói câu có giới từ.
  app.register('sticker-scenes', scenePickerScreen);
  app.register('sticker-scene', stickerSceneScreen);
  // Mặc đồ (SPEC-dressup.md): chọn bé trai / bé gái → mặc đồ.
  app.register('dress-up', dressUpChooser);
  app.register('dress-up-play', dressUpScreen);
  // Tô màu (SPEC-coloring.md): chọn hình → chọn màu, chạm phần hình để tô.
  app.register('coloring', coloringChooser);
  app.register('coloring-play', coloringScreen);
  // Cho Bông ăn (SPEC-feed.md): kéo / chạm đúng món vào miệng Bông.
  app.register('feed', feedScreen);
  // Bông trốn tìm (SPEC-hide.md): bé tìm Bông theo giới từ; đổi vai thì Bông đi tìm bé.
  app.register('hide-seek', hideSeekScreen);
  // Ghép hình cùng Bông (SPEC-puzzle.md): ghép bộ phận / ghép cả bức tranh.
  app.register('puzzle', puzzleHome);
  app.register('puzzle-list', puzzleList);
  app.register('puzzle-play', puzzleScreen);
  // Tìm đồ còn thiếu (SPEC-missing.md): kéo đồ vào bóng trắng của đồ bị mất.
  app.register('missing', missingScreen);
  // Ai kêu thế? (SPEC-sounds.md) và Bắt bong bóng (SPEC-bubbles.md).
  app.register('animal-sounds', animalSoundsHome);
  app.register('animal-sounds-play', animalSoundsScreen);
  app.register('bubbles', bubblesHome);
  app.register('bubbles-play', bubblesScreen);
  // Đóng vai nghề (SPEC-jobs.md): trang chọn nghề; Bác sĩ nhí (SPEC-doctor.md), Bán hàng, Bưu tá, Cô giáo nhí, Cảnh sát, Cứu hỏa.
  app.register('jobs', jobsScreen);
  app.register('doctor', doctorScreen);
  app.register('shop', shopScreen);
  app.register('post', postScreen);
  app.register('teacher', teacherScreen);
  app.register('police', policeScreen);
  app.register('fire', fireScreen);
  app.register('sleep', sleepScreen);
  app.register('parent', parentScreen);

  app.go('start');
  registerServiceWorker(app);
}

boot();
