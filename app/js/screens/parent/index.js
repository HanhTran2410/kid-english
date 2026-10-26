// Góc bố mẹ: menu và điều hướng giữa các trang (SPEC 4.6).

import { h, toast, copyText, stars, timeAgo } from '../../ui.js';
import { APP_VERSION } from '../../app.js';
import { listLessons, getStickers } from '../../db.js';
import { isBackupDue } from '../../settings.js';
import { STICKERS } from '../../stickers.js';
import { buildTeacherPrompt } from '../../prompts.js';
import { pickWordsForPrompt, isLearned, KNOWN_MASTERY, wordRecords, phraseRecords, numberRecords, letterRecords, soundRecords } from '../../progress.js';
import { isWordLesson } from '../../phrase.js';
import { isStandalone, micProblem } from '../child.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { createView, pasteView, phraseCreateView } from './create.js';
import { lessonsView, lessonDetailView } from './lessons.js';
import { recordingsView } from './recordings.js';
import { settingsView } from './settings.js';
import { backupView } from './backup.js';
import { bongElement } from '../../bong.js';
import { stickersAdminView } from './stickers.js';
import { profileView } from './profile.js';
import { scenesView, sceneDetailView } from './scenes.js';
import { dressAdminView } from './dress.js';
import { feedAdminView } from './feed.js';
import { hideAdminView } from './hide.js';
import { puzzleAdminView } from './puzzle.js';
import { missingAdminView } from './missing.js';
import { soundsAdminView } from './sounds.js';
import { doctorAdminView } from './doctor.js';
import { jobsAdminView } from './jobs.js';

const VIEWS = {
  menu: menuView,
  create: createView,
  'create-phrases': phraseCreateView,
  paste: pasteView,
  lessons: lessonsView,
  lesson: lessonDetailView,
  progress: progressView,
  recordings: recordingsView,
  settings: settingsView,
  backup: backupView,
  stickers: stickersAdminView,
  profile: profileView,
  scenes: scenesView,
  scene: sceneDetailView,
  dress: dressAdminView,
  feed: feedAdminView,
  hide: hideAdminView,
  puzzle: puzzleAdminView,
  missing: missingAdminView,
  sounds: soundsAdminView,
  doctor: doctorAdminView,
  jobs: jobsAdminView,
};

export function parentScreen(app, params = {}) {
  const view = VIEWS[params.view] ?? menuView;
  return view(app, params);
}

function menuView(app) {
  const body = parentLayout(app, { title: 'Góc bố mẹ' });
  const warnings = h('div.warnings');
  const due = isBackupDue(app.settings);
  // Ghép sẵn prompt "cô giáo" để lúc bấm copy được ngay (iOS chặn copy sau một bước chờ).
  let teacherPrompt = '';
  buildTeacherPromptFor(app).then((p) => { teacherPrompt = p; });

  const item = (emoji, label, onClick, badge = false) => h('button.menu-item', { type: 'button', onclick: onClick },
    h('span.menu-emoji', { text: emoji }), h('span', { text: label }), badge ? h('span.badge', { text: '!' }) : null);

  body.append(
    warnings,
    h('nav.menu', {},
      item('＋', 'Tạo bài học (từ vựng)', () => goParent(app, 'create')),
      item('💬', 'Tạo bài câu', () => goParent(app, 'create-phrases')),
      item('📋', 'Dán bài', () => goParent(app, 'paste')),
      item('📚', 'Quản lý bài', () => goParent(app, 'lessons')),
      item('🧒', 'Hồ sơ của bé', () => goParent(app, 'profile')),
      item('📈', 'Bé đã học', () => goParent(app, 'progress')),
      item('🎙️', 'Nghe lại giọng bé', () => goParent(app, 'recordings')),
      item('👩‍🏫', 'Copy prompt "cô giáo"', () => copyTeacherPrompt(teacherPrompt)),
      item('💾', 'Sao lưu / Khôi phục', () => goParent(app, 'backup'), due),
      item('🎁', 'Sticker của bé', () => goParent(app, 'stickers')),
      item('🎨', 'Ảnh Dán tranh (tranh + sticker)', () => goParent(app, 'scenes')),
      item('👗', 'Đồ Mặc đồ (thay ảnh, thêm đồ)', () => goParent(app, 'dress')),
      item('🍌', 'Ảnh Cho Bông ăn (ảnh món, ảnh Bông, thêm món)', () => goParent(app, 'feed')),
      item('🙈', 'Ảnh Trốn tìm (ảnh phòng, ảnh Bông, bất ngờ)', () => goParent(app, 'hide')),
      item('🧩', 'Ảnh Ghép hình (ảnh riêng, vị trí cắt ảnh gia đình)', () => goParent(app, 'puzzle')),
      item('🔍', 'Ảnh Tìm đồ còn thiếu (cảnh riêng: mâm cơm, giờ tắm…)', () => goParent(app, 'missing')),
      item('🐮', 'Ảnh & tiếng Ai kêu thế? (ghi âm / chọn file tiếng kêu)', () => goParent(app, 'sounds')),
      item('🩺', 'Ảnh Bác sĩ nhí (ảnh đồ, ảnh nền phòng khám)', () => goParent(app, 'doctor')),
      item('🧑‍⚕️', 'Ảnh Đóng vai (ảnh nền từng nghề)', () => goParent(app, 'jobs')),
      item('⚙️', 'Cài đặt & chẩn đoán', () => goParent(app, 'settings'))),
    h('button.exit-to-child', { type: 'button', onclick: () => app.go('home') },
      bongElement('menu-bong'), h('span', { text: 'Về màn hình của bé' })),
  );

  // Cảnh báo cho bố mẹ (SPEC 4.9).
  if (due) warnings.append(notice('warn', 'Đã hơn 7 ngày chưa sao lưu. Hãy vào "Sao lưu / Khôi phục" để lưu dữ liệu của bé ra file.'));
  if (app.settings.storageFullAt) {
    warnings.append(notice('error', 'Bộ nhớ đầy: một số ghi âm hoặc ảnh chưa được lưu. Hãy xóa bớt ghi âm cũ trong "Nghe lại giọng bé".',
      h('button.btn.small', {
        type: 'button', text: 'Đã hiểu',
        onclick: async (e) => {
          await app.setSetting('storageFullAt', null);
          e.target.closest('.notice').remove();
        },
      })));
  }
  if (micProblem(app)) {
    warnings.append(notice('warn', 'App chưa dùng được mic nên đang ở chế độ chỉ nghe. Trên iPad: Cài đặt → Safari → Micrô (hoặc Cài đặt → Quyền riêng tư → Micrô) → cho phép, rồi mở lại app.'));
  }
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !isStandalone()) {
    warnings.append(notice('warn', 'Đang mở trong Safari. Hãy chọn Chia sẻ → "Thêm vào Màn hình chính" và mở app từ biểu tượng đó.'));
  }
  if (!app.speaker.hasEnglish) {
    warnings.append(notice('error', 'Máy chưa có giọng đọc tiếng Anh. Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Anh.'));
  }

  const stickerLine = h('p.muted');
  getStickers(app.db).then((owned) => {
    const n = STICKERS.filter((s) => owned[s.id]).length;
    stickerLine.textContent = `Sticker của bé: ${n}/${STICKERS.length}`;
  });

  const footer = h('footer.parent-footer', {}, stickerLine, h('p.muted', { text: `Phiên bản ${APP_VERSION}` }));
  if (app.swRegistration?.waiting) {
    footer.append(h('button.btn.primary', {
      type: 'button',
      text: 'Có bản mới — Cập nhật ngay',
      onclick: () => app.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' }),
    }));
  }
  body.append(footer);
}

async function buildTeacherPromptFor(app) {
  const lessons = (await listLessons(app.db)).filter(isWordLesson);
  const progress = wordRecords(await app.db.getAll('progress'));
  const latest = lessons[0];
  return buildTeacherPrompt({
    words: latest?.words.map((w) => w.en) ?? [],
    lessonTitle: latest?.title ?? '',
    weakWords: pickWordsForPrompt(progress, 5).map((r) => r.word),
  });
}

function copyTeacherPrompt(prompt) {
  if (!prompt) {
    toast('Đang chuẩn bị prompt, bấm lại sau giây lát.');
    return;
  }
  copyText(prompt).then((ok) => toast(ok ? 'Đã copy prompt "cô giáo". Mở ChatGPT/Gemini Voice và dán vào.' : 'Không copy được, hãy thử lại.'));
}

function progressView(app) {
  const body = parentLayout(app, { title: 'Bé đã học', back: () => goParent(app) });
  app.db.getAll('progress').then((list) => {
    const sorted = (records) => records.filter(isLearned).sort((a, b) => a.mastery - b.mastery || a.word.localeCompare(b.word));
    const words = sorted(wordRecords(list));
    const phrases = sorted(phraseRecords(list));
    const numbers = numberRecords(list).filter(isLearned).sort((a, b) => Number(a.word.split(':')[1]) - Number(b.word.split(':')[1]));
    const letters = letterRecords(list).filter(isLearned).sort((a, b) => a.word.localeCompare(b.word));
    const sounds = soundRecords(list).filter(isLearned).sort((a, b) => a.word.localeCompare(b.word));
    if (!words.length && !phrases.length && !numbers.length && !letters.length && !sounds.length) {
      body.append(section(null, h('p', { text: 'Bé chưa học từ, câu, số hay chữ cái nào.' })));
      return;
    }
    const row = (r, label, extra = '') => h('li', {},
      h('span.p-emoji', { text: r.emoji || '•' }),
      h('span.p-word', { text: label }),
      h('span.p-stars', { text: stars(r.mastery) }),
      h('span.p-meta', { text: `gặp ${r.practiceCount} lần · ${timeAgo(r.lastPracticedAt)}${extra}` }));
    const known = (records) => records.filter((r) => r.mastery >= KNOWN_MASTERY).length;
    if (words.length) {
      body.append(section(`Từ vựng — ${known(words)}/${words.length} từ đã thuộc (từ 3⭐)`,
        h('ul.progress-list', {}, ...words.map((r) => row(r, r.word)))));
    }
    if (phrases.length) {
      body.append(section(`Câu nói — ${known(phrases)}/${phrases.length} câu đã thuộc (từ 3⭐)`,
        h('ul.progress-list', {}, ...phrases.map((r) => row(r, r.word.replace(/^phrase:/, ''),
          r.attempts ? ` · chọn hình: đúng ngay ${r.attempts.right}, sai ${r.attempts.wrong}` : '')))));
    }
    if (numbers.length) {
      body.append(section(`Số đếm — ${known(numbers)}/${numbers.length} số đã thuộc (từ 3⭐)`,
        h('ul.progress-list', {}, ...numbers.map((r) => row(r, r.word.replace(/^number:/, 'số '),
          r.attempts ? ` · chọn: đúng ngay ${r.attempts.right}, sai ${r.attempts.wrong}` : '')))));
    }
    if (letters.length) {
      body.append(section(`Chữ cái — ${known(letters)}/${letters.length} chữ đã thuộc (từ 3⭐)`,
        h('ul.progress-list', {}, ...letters.map((r) => row(r, `chữ ${r.word.replace(/^letter:/, '').toUpperCase()}`,
          r.attempts ? ` · chọn: đúng ngay ${r.attempts.right}, sai ${r.attempts.wrong}` : '')))));
    }
    if (sounds.length) {
      body.append(section(`Âm (Jolly) — ${known(sounds)}/${sounds.length} âm đã thuộc (từ 3⭐)`,
        h('ul.progress-list', {}, ...sounds.map((r) => row(r, `âm /${r.word.replace(/^sound:/, '')}/`,
          r.attempts ? ` · chọn: đúng ngay ${r.attempts.right}, sai ${r.attempts.wrong}` : '')))));
    }
  });
}
