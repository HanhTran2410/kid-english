// Ghi âm giọng bé. Chọn định dạng lúc chạy (SPEC mục 2).

export const MIME_CANDIDATES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];

/** Định dạng ghi âm đầu tiên trình duyệt hỗ trợ, hoặc '' nếu không có. */
export function pickMimeType(isTypeSupported) {
  const check = isTypeSupported ?? ((t) => globalThis.MediaRecorder?.isTypeSupported?.(t) ?? false);
  return MIME_CANDIDATES.find((t) => {
    try {
      return check(t);
    } catch {
      return false;
    }
  }) ?? '';
}

export const canRecord = () => Boolean(globalThis.MediaRecorder) && pickMimeType() !== '';

export class VoiceRecorder {
  constructor(stream) {
    this.mimeType = pickMimeType();
    this.chunks = [];
    this.recorder = new MediaRecorder(stream, this.mimeType ? { mimeType: this.mimeType } : undefined);
    this.recorder.ondataavailable = (e) => {
      if (e.data?.size) this.chunks.push(e.data);
    };
  }

  start() {
    this.startedAt = performance.now();
    this.recorder.start();
  }

  /** Dừng và trả về bản ghi. */
  stop() {
    return new Promise((resolve) => {
      const finish = () => {
        const mimeType = (this.recorder.mimeType || this.mimeType || 'audio/mp4').split(';')[0];
        resolve({
          blob: new Blob(this.chunks, { type: mimeType }),
          mimeType,
          durationMs: Math.round(performance.now() - this.startedAt),
        });
      };
      if (this.recorder.state === 'inactive') return finish();
      this.recorder.onstop = finish;
      this.recorder.stop();
    });
  }

  cancel() {
    this.recorder.onstop = null;
    if (this.recorder.state !== 'inactive') this.recorder.stop();
    this.chunks = [];
  }
}
