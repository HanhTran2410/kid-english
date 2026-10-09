// Ghi tiến độ và ghi âm trong lúc bé học. Lỗi lưu (ví dụ bộ nhớ đầy) không được làm hỏng bài học.

import { updateProgress, addRecording, isQuotaError } from '../db.js';
import { onPracticed, onSpoke, onPickedCorrectFirstTry, onPickedWrong, onDid, onAttempt } from '../progress.js';
import { RESULT } from '../speech/listen.js';

async function safely(app, fn) {
  try {
    return await fn();
  } catch (err) {
    if (isQuotaError(err)) {
      // Bộ nhớ đầy: bỏ qua việc lưu, Góc bố mẹ sẽ hiện cảnh báo (SPEC mục 4.9).
      app.setSetting('storageFullAt', Date.now()).catch(() => {});
    } else {
      console.error(err);
    }
    return null;
  }
}

export const spoke = (result) => result === RESULT.MATCH || result === RESULT.VOICE;

export const markPracticed = (app, word, emoji) =>
  safely(app, () => updateProgress(app.db, word, emoji, (p) => onPracticed(p)));

export const markSpoke = (app, word, emoji) =>
  safely(app, () => updateProgress(app.db, word, emoji, (p) => onSpoke(p)));

export const markPickedRight = (app, word, emoji) =>
  safely(app, () => updateProgress(app.db, word, emoji, onPickedCorrectFirstTry));

export const markPickedWrong = (app, word, emoji) =>
  safely(app, () => updateProgress(app.db, word, emoji, onPickedWrong));

export const saveRecording = (app, lessonId, word, recording) =>
  safely(app, () => addRecording(app.db, { lessonId, word, ...recording }));

/** Bé làm theo câu và chạm ✔ (SPEC-v1.0 mục 8). */
export const markDid = (app, key, emoji) =>
  safely(app, () => updateProgress(app.db, key, emoji, (p) => onDid(p)));

/** Chọn hình ở trò D: ghi lịch sử; chỉ +1 khi được phép (đúng ngay lần đầu, một lần mỗi lượt). Không bao giờ trừ. */
export const markPhrasePick = (app, key, emoji, { firstTry, award }) =>
  safely(app, () => updateProgress(app.db, key, emoji, (p) => {
    const withAttempt = onAttempt(p, firstTry);
    return award ? onPickedCorrectFirstTry(withAttempt) : withAttempt;
  }));
