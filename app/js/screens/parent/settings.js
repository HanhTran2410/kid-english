// Cài đặt và thông tin chẩn đoán (SPEC 4.6).

import { h, toast, formatBytes } from '../../ui.js';
import { englishVoices } from '../../speech/tts.js';
import { pickMimeType } from '../../speech/recorder.js';
import { LIMIT_OPTIONS } from '../../session.js';
import { isStandalone } from '../child.js';
import { parentLayout, goParent, section, field, notice } from './common.js';

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
  ...voices.map((v) => h('option', { value: v.voiceURI, text: `${v.name} (${v.lang})`, selected: v.voiceURI === s.voiceURI })));

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
      field('Tên nhân vật', name, 'Tên chỉ hiện trên màn hình; khi nói tiếng Anh Bông xưng "I".'),
      field('Giọng đọc tiếng Anh', voiceSel, voices.length ? null : 'Máy chưa liệt kê giọng tiếng Anh nào.'),
      field('Tốc độ đọc', h('div.row', {}, rate, rateOut), 'Mặc định 0.8 (chậm hơn bình thường).'),
      h('button.btn', {
        type: 'button', text: '🔊 Nghe thử', onclick: () => app.speaker.speak('Hello! Can you say cow?').catch(() => {}),
      }),
      check('readVietnamese', 'Đọc nghĩa tiếng Việt khi bé gặp từ lần đầu trong bài'),
      app.speaker.hasVietnamese ? null : h('p.field-hint', { text: 'Máy chưa có giọng tiếng Việt nên app sẽ bỏ qua phần đọc nghĩa.' })),
    section('Nghe và ghi âm',
      check('recordVoice', 'Ghi âm giọng bé (mỗi từ mỗi ngày 1 bản)'),
      check('useRecognition', 'Dùng nhận dạng giọng nói', () => app.recognizer.setAllowed(s.useRecognition)),
      h('p.field-hint', { text: 'Trên iOS, nhận dạng gửi giọng bé lên máy chủ Apple để xử lý và cần mạng. Tắt đi thì app chỉ đo âm lượng.' })),
    section('Thời gian',
      field('Giới hạn mỗi buổi', limit, 'Giới hạn mềm: hết giờ vẫn cho học hết bài. Khi Bông ngủ, bố mẹ nhấn giữ 🌙 3 giây để cho thêm 15 phút.')),
    diagnostics(app));
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
