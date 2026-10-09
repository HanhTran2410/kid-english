// Góc bố mẹ: menu và điều hướng giữa các trang (SPEC 4.6).

import { h, toast, copyText, stars, timeAgo } from '../../ui.js';
import { APP_VERSION } from '../../app.js';
import { listLessons, getStickers } from '../../db.js';
import { isBackupDue } from '../../settings.js';
import { STICKERS } from '../../stickers.js';
import { buildTeacherPrompt } from '../../prompts.js';
import { pickWordsForPrompt, isLearned, KNOWN_MASTERY } from '../../progress.js';
import { isStandalone, micProblem } from '../child.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { createView, pasteView } from './create.js';
import { lessonsView, lessonDetailView } from './lessons.js';
import { recordingsView } from './recordings.js';
import { settingsView } from './settings.js';
import { backupView } from './backup.js';
import { bongElement } from '../../bong.js';
import { stickersAdminView } from './stickers.js';

const VIEWS = {
  menu: menuView,
  create: createView,
  paste: pasteView,
  lessons: lessonsView,
  lesson: lessonDetailView,
  progress: progressView,
  recordings: recordingsView,
  settings: settingsView,
  backup: backupView,
  stickers: stickersAdminView,
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
      item('＋', 'Tạo bài học', () => goParent(app, 'create')),
      item('📋', 'Dán bài', () => goParent(app, 'paste')),
      item('📚', 'Quản lý bài', () => goParent(app, 'lessons')),
      item('📈', 'Bé đã học', () => goParent(app, 'progress')),
      item('🎙️', 'Nghe lại giọng bé', () => goParent(app, 'recordings')),
      item('👩‍🏫', 'Copy prompt "cô giáo"', () => copyTeacherPrompt(teacherPrompt)),
      item('💾', 'Sao lưu / Khôi phục', () => goParent(app, 'backup'), due),
      item('🎁', 'Sticker của bé', () => goParent(app, 'stickers')),
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
  const lessons = await listLessons(app.db);
  const progress = await app.db.getAll('progress');
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
    const learned = list.filter(isLearned).sort((a, b) => a.mastery - b.mastery || a.word.localeCompare(b.word));
    if (!learned.length) {
      body.append(section(null, h('p', { text: 'Bé chưa học từ nào.' })));
      return;
    }
    const known = learned.filter((r) => r.mastery >= KNOWN_MASTERY).length;
    body.append(section(`${known}/${learned.length} từ đã thuộc (từ 3⭐)`,
      h('ul.progress-list', {}, ...learned.map((r) => h('li', {},
        h('span.p-emoji', { text: r.emoji || '•' }),
        h('span.p-word', { text: r.word }),
        h('span.p-stars', { text: stars(r.mastery) }),
        h('span.p-meta', { text: `gặp ${r.practiceCount} lần · ${timeAgo(r.lastPracticedAt)}` }))))));
  });
}
