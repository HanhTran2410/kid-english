// Cài đặt và thông tin chẩn đoán (SPEC 4.6).

import { h, toast, formatBytes } from '../../ui.js';
import { englishVoices, isNoveltyVoice } from '../../speech/tts.js';
import { pickMimeType } from '../../speech/recorder.js';
import { LIMIT_OPTIONS } from '../../session.js';
import { isStandalone, characterName } from '../child.js';
import { parentLayout, goParent, section, field, notice } from './common.js';
import { driveSettingsSection } from './drive.js';
import { cleanFeedState } from '../../feed.js';
import { cleanHideState } from '../../hide-seek.js';
import { cleanPuzzleState, piecesForNext } from '../../puzzle.js';
import { cleanShapeState } from '../../shapes.js';
import { cleanMissingState } from '../../missing.js';
import { cleanSoundsState } from '../../animal-sounds.js';
import { cleanBubblesState } from '../../bubbles.js';
import { cleanJobState } from '../../jobs/levels.js';

export function settingsView(app) {
  const body = parentLayout(app, { title: 'Cài đặt & chẩn đoán', back: () => goParent(app) });
  const s = app.settings;

  const save = async (key, value, after) => {
    await app.setSetting(key, value);
    after?.();
    toast('Đã lưu.', 1200);
  };

  const name = h('input', { type: 'text', value: s.characterName, onchange: (e) => save('characterName', e.target.value.trim() || 'Bông') });

  const voices = englishVoices(app.speaker.voices);
  const voiceSel = h('select', {
    onchange: (e) => save('voiceURI', e.target.value || null, () => app.speaker.configure({ voiceURI: s.voiceURI, rate: s.rate })),
  }, h('option', { value: '', text: 'Tự chọn (en-US)' }),
  ...voices.map((v) => h('option', {
    value: v.voiceURI,
    text: `${v.name} (${v.lang})${isNoveltyVoice(v) ? ' — giọng hiệu ứng, không nên dùng' : ''}`,
    selected: v.voiceURI === s.voiceURI,
  })));

  const rateOut = h('output', { text: String(s.rate) });
  const rate = h('input', {
    type: 'range', min: '0.5', max: '1.2', step: '0.05', value: String(s.rate),
    oninput: (e) => { rateOut.textContent = e.target.value; },
    onchange: (e) => save('rate', Number(e.target.value), () => app.speaker.configure({ voiceURI: s.voiceURI, rate: s.rate })),
  });

  const check = (key, label, after) => h('label.check', {},
    h('input', { type: 'checkbox', checked: Boolean(s[key]), onchange: (e) => save(key, e.target.checked, after) }),
    h('span', { text: label }));

  const limit = h('select', { onchange: (e) => save('limitMinutes', e.target.value === 'off' ? null : Number(e.target.value)) },
    ...LIMIT_OPTIONS.map((m) => h('option', {
      value: m == null ? 'off' : String(m),
      text: m == null ? 'Tắt' : `${m} phút`,
      selected: m === s.limitMinutes,
    })));

  body.append(
    section('Nhân vật và giọng đọc',
      field('Tên nhân vật', name, 'Tên hiện trên màn hình chính (nút "Học cùng …"). Khi nói tiếng Anh, nhân vật xưng "I" nên không đọc tên. Tên app trên Màn hình chính iPhone vẫn là "Bông".'),
      field('Giọng đọc tiếng Anh', voiceSel, voices.length
        ? 'Giọng tốt xếp trên cùng. Nghe rè thì tải giọng Enhanced/Premium: Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Anh, rồi chọn lại ở đây.'
        : 'Máy chưa liệt kê giọng tiếng Anh nào.'),
      field('Tốc độ đọc', h('div.row', {}, rate, rateOut), 'Mặc định 0.8 (chậm hơn bình thường).'),
      h('button.btn', {
        type: 'button', text: '🔊 Nghe thử', onclick: () => app.speaker.speak('Hello! Can you say cow?').catch(() => {}),
      }),
      check('readVietnamese', 'Đọc nghĩa tiếng Việt khi bé gặp từ lần đầu trong bài'),
      app.speaker.hasVietnamese ? null : h('p.field-hint', { text: 'Máy chưa có giọng tiếng Việt nên app sẽ bỏ qua phần đọc nghĩa.' })),
    section('Nghe và ghi âm',
      check('recordVoice', 'Ghi âm giọng bé (mỗi từ mỗi ngày 1 bản)'),
      check('useRecognition', 'Dùng nhận dạng giọng nói', () => app.recognizer.setAllowed(s.useRecognition)),
      check('micOnlyWhenListening', 'Chỉ bật mic khi đang nghe bé', () => {
        if (s.micOnlyWhenListening) app.mic.release();
        else app.mic.start();
      }),
      h('p.field-hint', { text: `Bật thử nếu tiếng ${characterName(app)} bị rè hoặc nhỏ: khi mic mở, iPhone/iPad chuyển loa sang chế độ gọi thoại. Nếu máy hỏi quyền mic liên tục thì tắt lại.` }),
      h('p.field-hint', { text: 'Trên iOS, nhận dạng gửi giọng bé lên máy chủ Apple để xử lý và cần mạng. Tắt đi thì app chỉ đo âm lượng.' })),
    section('Bài từ vựng',
      check('wordReveal', 'Giới thiệu từ kiểu "ló dần": hình bị che, bé chạm mở dần, đoán "What\'s this?" rồi mới hiện')),
    section('Nói chuyện với ' + characterName(app),
      check('talkPhone', `📞 ${characterName(app)} gọi điện khi bắt đầu bài (chuông reo → bé chạm nghe máy → cuối bài chạm nút đỏ tắt máy)`)),
    feedSection(app, save, check),
    hideSection(app, save, check),
    puzzleSection(app, save, check),
    shapeSection(app, save),
    missingSection(app, save),
    soundsSection(app, save),
    bubblesSection(app, save),
    jobsSection(app, save),
    section('Thời gian',
      field('Giới hạn mỗi buổi', limit, `Giới hạn mềm: hết giờ vẫn cho học hết bài. Khi ${characterName(app)} ngủ, bố mẹ nhấn giữ 🌙 3 giây để cho thêm 15 phút.`)),
    driveSettingsSection(app),
    diagnostics(app));
}

/** Cho Bông ăn (SPEC-feed mục 4): khóa mức, bất ngờ vui. */
function feedSection(app, save, check) {
  const state = cleanFeedState(app.settings.feed);
  const level = h('select', {
    onchange: (e) => {
      const lock = e.target.value === 'auto' ? null : Number(e.target.value);
      save('feed', { ...cleanFeedState(app.settings.feed), lock, ...(lock ? { level: lock, rounds: 0 } : {}) });
    },
  }, ...[['auto', `Tự lên mức (đang ở mức ${state.level})`], ['1', 'Mức 1 — 3 món dễ'], ['2', 'Mức 2 — 5 món, có đồ uống'], ['3', 'Mức 3 — đếm (two cookies)']]
    .map(([value, text]) => h('option', { value, text, selected: value === String(state.lock ?? 'auto') })));
  return section(`Cho ${characterName(app)} ăn`,
    field('Mức chơi Cho Bông ăn', level, 'Tự lên mức sau 2 lần no bụng ở mỗi mức.'),
    check('feedSilly', '🧦 Bất ngờ vui: thỉnh thoảng có đồ không ăn được trong khay (mức 2) — "Yuck! A sock!"'));
}

/** Bông trốn tìm (SPEC-hide mục 3, 8): mức gợi ý, đếm đến mấy, lượt đổi vai. */
function hideSection(app, save, check) {
  const state = cleanHideState(app.settings.hideSeek);
  const level = h('select', { onchange: (e) => save('hideSeek', { ...cleanHideState(app.settings.hideSeek), level: e.target.value }) },
    h('option', { value: 'easy', text: 'Dễ — tai Bông luôn thò ra một chút', selected: state.level === 'easy' }),
    h('option', { value: 'normal', text: 'Thường — tai thò ra sau 2 lần nhầm hoặc 10 giây', selected: state.level === 'normal' }));
  const count = h('select', { onchange: (e) => save('hideSeek', { ...cleanHideState(app.settings.hideSeek), count: Number(e.target.value) }) },
    h('option', { value: '5', text: 'Đếm đến 5', selected: state.count === 5 }),
    h('option', { value: '10', text: 'Đếm đến 10', selected: state.count === 10 }));
  return section(`${characterName(app)} trốn tìm`,
    field('Gợi ý', level),
    field('Đếm', count, `Bé chạm ${characterName(app)} để bỏ qua phần đếm.`),
    check('hideSeekSwap', '🙋 Đổi vai: bé đi trốn, Bông đi tìm ("Is Na under the bed?")'));
}

/** Ghép hình (SPEC-puzzle mục 5.3, 5.1): khóa mức ghép tranh, nhóm ảnh gia đình. */
function puzzleSection(app, save, check) {
  const state = cleanPuzzleState(app.settings.puzzle);
  const level = h('select', {
    onchange: (e) => save('puzzle', { ...cleanPuzzleState(app.settings.puzzle), lock: e.target.value === 'auto' ? null : Number(e.target.value) }),
  }, ...[['auto', `Tự lên mức (tranh kế tiếp: ${piecesForNext({ ...state, lock: null })} mảnh)`], ['1', 'Mức 1 — 2 rồi 4 mảnh'], ['2', 'Mức 2 — 6 mảnh'], ['3', 'Mức 3 — 9 mảnh']]
    .map(([value, text]) => h('option', { value, text, selected: value === String(state.lock ?? 'auto') })));
  return section('Ghép hình',
    field('Ghép cả bức tranh — số mảnh', level, 'Tự lên: 2 tranh 2 mảnh → 4 tranh 4 mảnh → 5 tranh 6 mảnh → 9 mảnh. Khóa mức thì vẫn đếm số tranh đã ghép.'),
    check('puzzleFamily', '👨‍👩‍👧 Có ảnh gia đình (Hồ sơ của bé) trong danh sách ghép tranh'));
}

/** Đếm hình (SPEC-shapes mục 4.3): khóa mức. */
function shapeSection(app, save) {
  const state = cleanShapeState(app.settings.shapeCount);
  const level = h('select', {
    onchange: (e) => {
      const lock = e.target.value === 'auto' ? null : Number(e.target.value);
      save('shapeCount', { ...cleanShapeState(app.settings.shapeCount), lock, ...(lock ? { level: lock } : {}) });
    },
  }, ...[['auto', `Tự lên mức (đang ở mức ${state.level})`], ['1', 'Mức 1 — tròn, vuông, tam giác; đếm đến 5'], ['2', 'Mức 2 — thêm chữ nhật, sao, tim; đến 10 + chọn số']]
    .map(([value, text]) => h('option', { value, text, selected: value === String(state.lock ?? 'auto') })));
  return section('Đếm hình', field('Mức chơi Đếm hình', level, 'Tự lên mức 2 sau 3 lượt chơi xong ở mức 1.'));
}

/** Tìm đồ còn thiếu (SPEC-missing mục 5): khóa mức. */
function missingSection(app, save) {
  const state = cleanMissingState(app.settings.missingGame);
  const level = h('select', {
    onchange: (e) => {
      const lock = e.target.value === 'auto' ? null : Number(e.target.value);
      save('missingGame', { ...cleanMissingState(app.settings.missingGame), lock, ...(lock ? { level: lock } : {}) });
    },
  }, ...[['auto', `Tự lên mức (đang ở mức ${state.level})`], ['1', 'Mức 1 — thiếu 1 đồ'], ['2', 'Mức 2 — thiếu 2 đồ + 1 đồ lạ'], ['3', 'Mức 3 — thiếu 3 đồ + 2 đồ lạ, bóng mờ hơn']]
    .map(([value, text]) => h('option', { value, text, selected: value === String(state.lock ?? 'auto') })));
  return section('Tìm đồ còn thiếu', field('Mức chơi Tìm đồ còn thiếu', level, 'Tự lên mức sau 3 lượt chơi xong.'));
}

/** Khóa mức của một trò (Ai kêu thế?, Bắt bong bóng): Tự lên mức / mức 1–3. */
function levelSelect(app, save, key, clean, options) {
  const state = clean(app.settings[key]);
  return h('select', {
    onchange: (e) => {
      const lock = e.target.value === 'auto' ? null : Number(e.target.value);
      save(key, { ...clean(app.settings[key]), lock, ...(lock ? { level: lock } : {}) });
    },
  }, ...[['auto', `Tự lên mức (đang ở mức ${state.level})`], ...options]
    .map(([value, text]) => h('option', { value, text, selected: value === String(state.lock ?? 'auto') })));
}

/** Ai kêu thế? (SPEC-sounds mục 4): khóa mức. */
function soundsSection(app, save) {
  const sel = levelSelect(app, save, 'soundsGame', cleanSoundsState,
    [['1', 'Mức 1 — 6 con vật / 6 đồ vật quen'], ['2', 'Mức 2 — 10 con vật / 9 đồ vật'], ['3', 'Mức 3 — cả 15 con vật / 11 đồ vật']]);
  return section('Ai kêu thế?', field('Mức chơi Ai kêu thế?', sel, 'Luôn 4 hình để chọn. Tự lên mức sau 3 lượt chơi xong.'));
}

/** Bắt bong bóng (SPEC-bubbles mục 4): khóa mức. */
function bubblesSection(app, save) {
  const sel = levelSelect(app, save, 'bubblesGame', cleanBubblesState,
    [['1', 'Mức 1 — 3 loại, số 1–5, bay chậm'], ['2', 'Mức 2 — 4 loại, số 1–10'], ['3', 'Mức 3 — 6 loại, bay nhanh hơn']]);
  return section('Bắt bong bóng', field('Mức chơi Bắt bong bóng', sel, 'Tự lên mức sau 3 lượt chơi xong.'));
}

/** Đóng vai nghề (SPEC-jobs J6): khóa mức từng nghề. Bác sĩ nhí mới có mức 1 nên không có ô chọn. */
const JOB_LEVELS = [
  ['shopGame', 'Bán hàng', ['Mức 1 — 3 món, mua 1 cái', 'Mức 2 — mua nhiều cái + trả xu', 'Mức 3 — mua hai món + trả xu']],
  ['postGame', 'Bưu tá', ['Mức 1 — theo màu nhà', 'Mức 2 — theo số nhà', 'Mức 3 — màu / số / tên bạn thú']],
  ['teacherGame', 'Cô giáo nhí', ['Mức 1 — Bông nói sai khác hẳn', 'Mức 2 — Bông nói sai gần giống', 'Mức 3 — màu và số']],
  ['policeGame', 'Cảnh sát giúp bạn', ['Mức 1 — theo màu', 'Mức 2 — màu + to / nhỏ', 'Mức 3 — có bụi cây, tìm bạn bị lạc']],
  ['fireGame', 'Lính cứu hỏa', ['Mức 1 — 1–3 ngọn lửa', 'Mức 2 — đếm số lửa + cứu bạn trên cây', 'Mức 3 — dập theo chỗ Bông gọi']],
];
function jobsSection(app, save) {
  const clean = (v) => cleanJobState(v);
  return section('Đóng vai nghề', ...JOB_LEVELS.map(([key, name, labels]) => field(`Mức chơi ${name}`,
    levelSelect(app, save, key, clean, labels.map((text, i) => [String(i + 1), text])),
    'Tự lên mức sau 3 lượt chơi xong. Khóa mức thì không đếm lượt.')));
}

function diagnostics(app) {
  const rows = h('dl.diag');
  const add = (k, v) => rows.append(h('dt', { text: k }), h('dd', { text: v }));
  const r = app.recognizer;
  add('Nhận dạng giọng nói', r.enabled ? 'Đang dùng' : `Không dùng — ${r.reason || 'chưa kiểm tra'}`);
  add('Mic', { ok: 'Đang dùng', denied: 'Bị từ chối', unavailable: 'Không có', lost: 'Bị ngắt', off: 'Chưa bật' }[app.mic.status] ?? app.mic.status);
  add('Định dạng ghi âm', pickMimeType() || 'Không ghi âm được trên máy này');
  add('Mở từ Màn hình chính', isStandalone() ? 'Có' : 'Không (đang mở trong trình duyệt)');
  add('Giữ màn hình sáng', 'wakeLock' in navigator ? 'Có hỗ trợ' : 'Không hỗ trợ — hãy chỉnh Tự động khóa lâu hơn');
  add('Giọng tiếng Anh đang dùng', app.speaker.en ? `${app.speaker.en.name} (${app.speaker.en.lang})` : 'Mặc định của máy');
  add('Giọng tiếng Việt', app.speaker.vi ? `${app.speaker.vi.name} (${app.speaker.vi.lang})` : 'Không có');

  const storage = h('dd', { text: '…' });
  rows.append(h('dt', { text: 'Bộ nhớ' }), storage);
  (async () => {
    try {
      const persisted = await navigator.storage?.persisted?.();
      const est = await navigator.storage?.estimate?.();
      storage.textContent = `${est ? `đã dùng ${formatBytes(est.usage ?? 0)}` : ''}${persisted ? ' · lưu lâu dài' : ' · chưa được lưu lâu dài'}`;
    } catch {
      storage.textContent = 'không rõ';
    }
  })();

  const voiceList = h('details', {}, h('summary', { text: `Danh sách giọng đọc (${app.speaker.voices.length})` }),
    h('ul.voice-list', {}, ...app.speaker.voices.map((v) => h('li', { text: `${v.name} — ${v.lang}${v.localService ? '' : ' (mạng)'}` }))));

  return section('Thông tin chẩn đoán', rows, voiceList,
    notice('info', 'Mẹo: bật "Truy cập được hướng dẫn" (Cài đặt → Trợ năng) để bé không thoát được khỏi app.'));
}
