// Góc bố mẹ → Ảnh & tiếng Ai kêu thế? (SPEC-sounds mục 6): mỗi con vật / đồ vật một ô —
// nghe thử tiếng đang dùng, thay tiếng (ghi âm bằng mic / chọn file), dùng lại tiếng có sẵn;
// ảnh: thứ có sticker Dán tranh thì thay ở Ảnh Dán tranh, thứ không có (bát đĩa, điện thoại) thì thay ở đây.

import { h, toast } from '../../ui.js';
import { setWordImage, removeWordImage } from '../../db.js';
import { resizeImage, cutOutSticker } from '../../image.js';
import { dayKey } from '../../text.js';
import { applyBackup, BackupError } from '../../backup.js';
import { audioContext, unlockAudio } from '../../speech/sfx.js';
import { VoiceRecorder, canRecord } from '../../speech/recorder.js';
import {
  ANIMALS, THINGS, SOUNDS_IMAGES, SOUNDS_AUDIO, MAX_SOUND_SECONDS, MAX_SOUND_MB, hasSticker,
} from '../../animal-sounds.js';
import { loadSoundAssets, soundFace, soundSource, playSoundFile } from '../animal-sounds.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { imageErrorMessage } from './lessons.js';
import { mediaShareSection } from './media-share.js';

const SOURCE_TEXT = { custom: '🎙️ Tiếng bố mẹ thêm', file: '🔊 Tiếng thật có sẵn', voice: '🗣️ Giọng đọc' };

/** Nhận ảnh / tiếng Ai kêu thế? từ máy khác (mới hơn thắng). Dùng chung cho trang này và Quản lý bài. */
export async function acceptSoundsPayload(app, payload) {
  const images = payload.images.filter((img) => String(img.lessonId ?? '').startsWith('sounds:'));
  if (images.length) {
    await applyBackup(app.db, { ...payload, lessons: [], images, frameSets: [], recordings: [], progress: [], stickers: [], settings: [] }, 'merge');
  }
  return { images: images.length };
}

/** Kiểm tra file tiếng: đúng loại, không quá lớn, giải mã được (máy phát được). Trả về thời lượng (giây). */
async function checkAudio(blob) {
  if (blob.size > MAX_SOUND_MB * 1024 * 1024) throw new Error(`File tiếng lớn quá (tối đa ${MAX_SOUND_MB} MB).`);
  const ctx = audioContext();
  if (!ctx) return null;
  try {
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    return buffer.duration;
  } catch {
    throw new Error('Máy không đọc được file tiếng này. Hãy chọn file mp3 hoặc m4a.');
  }
}

export function soundsAdminView(app) {
  const body = parentLayout(app, { title: 'Ảnh & tiếng Ai kêu thế?', back: () => goParent(app) });
  const reload = () => goParent(app, 'sounds');
  let assets = null;
  let recording = null; // { recorder, item, timer }

  loadSoundAssets(app).then((loaded) => {
    assets = loaded;
    body.append(
      notice('info', `Mỗi con vật / đồ vật: nghe thử tiếng đang dùng, thay bằng tiếng bố mẹ ghi âm hoặc chọn file (mp3 / m4a, tối đa ${MAX_SOUND_SECONDS} giây được phát). Tiếng bố mẹ thêm được ưu tiên hơn tiếng thật có sẵn; không có tiếng nào thì Bông đọc tiếng kêu.`),
      notice('info', 'Ảnh: các thứ có trong Dán tranh dùng chung ảnh sticker — thay ở Góc bố mẹ → Ảnh Dán tranh. Bát đĩa và điện thoại không có trong Dán tranh nên thay ảnh ngay ở đây.'),
      h('div.actions', {}, h('button.btn', { type: 'button', text: '🎨 Mở Ảnh Dán tranh', onclick: () => goParent(app, 'scenes') })),
      itemsSection('🐮 Con vật', ANIMALS),
      itemsSection('🚂 Đồ vật', THINGS),
      shareSection(),
    );
  });

  async function saveAudio(item, blob, mimeType) {
    try {
      const seconds = await checkAudio(blob);
      await setWordImage(app.db, { lessonId: SOUNDS_AUDIO, word: item.id, blob, mimeType: mimeType || blob.type || 'audio/mp4' });
      toast(seconds && seconds > MAX_SOUND_SECONDS
        ? `Đã lưu tiếng ${item.vi} (dài ${Math.round(seconds)} giây — khi chơi chỉ phát ${MAX_SOUND_SECONDS} giây đầu).`
        : `Đã lưu tiếng ${item.vi}.`, 3500);
      reload();
    } catch (err) {
      toast(err.message || 'Không lưu được tiếng.', 4000);
    }
  }

  async function startRecording(item, btn) {
    if (recording) return;
    await unlockAudio().catch(() => {});
    const status = await app.mic.start();
    if (status !== 'ok' || !app.mic.stream) {
      toast('Không mở được mic. Hãy cho phép dùng mic trong Cài đặt của máy.', 4000);
      return;
    }
    const recorder = new VoiceRecorder(app.mic.stream);
    recorder.start();
    btn.textContent = '⏹ Dừng';
    btn.classList.add('danger');
    const timer = setTimeout(() => stopRecording(), MAX_SOUND_SECONDS * 1000);
    recording = { recorder, item, timer };
  }

  async function stopRecording() {
    if (!recording) return;
    const { recorder, item, timer } = recording;
    recording = null;
    clearTimeout(timer);
    const rec = await recorder.stop();
    app.mic.release();
    if (rec.durationMs < 300 || !rec.blob.size) {
      toast('Bản ghi ngắn quá, thử lại nhé.');
      reload();
      return;
    }
    await saveAudio(item, rec.blob, rec.mimeType);
  }

  function itemsSection(title, list) {
    return section(`${title} (${list.length})`, h('div.sp-admin-items.as-admin-items', {}, ...list.map((item) => {
      const source = soundSource(item, assets);
      const audioInput = h('input', { type: 'file', accept: 'audio/*,.mp3,.m4a,.wav,.aac', hidden: true });
      audioInput.addEventListener('change', async () => {
        const f = audioInput.files?.[0];
        audioInput.value = '';
        if (f) await saveAudio(item, f, f.type);
      });
      const imageInput = h('input', { type: 'file', accept: 'image/*', hidden: true });
      imageInput.addEventListener('change', async () => {
        const f = imageInput.files?.[0];
        imageInput.value = '';
        if (!f) return;
        try {
          await setWordImage(app.db, { lessonId: SOUNDS_IMAGES, word: item.id, ...await cutOutSticker((await resizeImage(f)).blob) });
          toast(`Đã lưu ảnh ${item.vi}.`);
          reload();
        } catch (err) {
          toast(imageErrorMessage(err), 4000);
        }
      });
      const recBtn = h('button.btn.small', {
        type: 'button', text: '🎙️ Ghi âm', hidden: !canRecord(),
        onclick: () => (recording ? stopRecording() : startRecording(item, recBtn)),
      });
      const ownImage = !hasSticker(item);
      const hasOwnImage = assets.image.has(item.id);
      return h('div.sp-admin-item', { dataset: { item: item.id, source } },
        h('span.fd-admin-face.checker', {}, soundFace(item, assets)),
        h('span', { text: item.name }),
        h('span.muted', { text: `${item.vi} — "${item.says}"` }),
        h('span.as-admin-source', { text: SOURCE_TEXT[source] }),
        h('button.btn.small', {
          type: 'button', text: '▶ Nghe',
          onclick: async () => {
            await unlockAudio().catch(() => {});
            if (!await playSoundFile(item, { assets })) app.speaker.speak(item.sound).catch(() => {});
          },
        }),
        recBtn,
        h('button.btn.small', { type: 'button', text: '📁 Chọn file tiếng', onclick: () => audioInput.click() }),
        source === 'custom' ? h('button.btn.small.danger', {
          type: 'button', text: '↩ Dùng tiếng có sẵn',
          onclick: async () => {
            await removeWordImage(app.db, SOUNDS_AUDIO, item.id);
            toast(`Đã bỏ tiếng bố mẹ thêm cho ${item.vi}.`);
            reload();
          },
        }) : null,
        ownImage ? h('button.btn.small', { type: 'button', text: hasOwnImage ? 'Thay ảnh' : 'Chọn ảnh', onclick: () => imageInput.click() }) : null,
        ownImage && hasOwnImage ? h('button.btn.small.danger', {
          type: 'button', text: 'Dùng emoji',
          onclick: async () => {
            await removeWordImage(app.db, SOUNDS_IMAGES, item.id);
            reload();
          },
        }) : null,
        audioInput, imageInput);
    })));
  }

  function shareSection() {
    return mediaShareSection(app, {
      what: 'ảnh & tiếng Ai kêu thế?',
      intro: 'Gửi tiếng bố mẹ đã thêm (và ảnh bát đĩa / điện thoại) sang máy khác. Trên máy kia: Góc bố mẹ → Ảnh & tiếng Ai kêu thế? → "Nhập từ file" (hoặc Quản lý bài → "Nhập bài từ file"). Ảnh sticker chia sẻ ở trang Ảnh Dán tranh.',
      canMake: assets.image.size + assets.audio.size > 0,
      backup: { lessonIds: [SOUNDS_IMAGES, SOUNDS_AUDIO], filename: `ai-keu-the-${dayKey()}.zip` },
      accept: async (payload) => {
        const got = await acceptSoundsPayload(app, payload);
        if (!got.images) throw new BackupError('File này không có ảnh / tiếng Ai kêu thế?.');
        return `Đã nhận ${got.images} ảnh / tiếng (mới hơn thay cũ).`;
      },
      done: reload,
    });
  }

  return () => {
    if (recording) {
      clearTimeout(recording.timer);
      recording.recorder.cancel();
      recording = null;
      app.mic.release();
    }
    assets?.revoke();
  };
}
