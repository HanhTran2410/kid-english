// Nhận dạng giọng nói: chỉ là phần bổ sung (SPEC mục 4.3.1).
// Báo lỗi bất kỳ lúc nào (kể cả mất mạng giữa buổi) → tắt cho cả buổi, chỉ còn đo âm lượng.

import { scaled } from '../timing.js';

const SR = () => globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;

// Các lỗi không có nghĩa là nhận dạng hỏng.
const HARMLESS = new Set(['no-speech', 'aborted']);

export class Recognizer {
  constructor() {
    this.enabled = Boolean(SR());
    this.reason = this.enabled ? '' : 'Trình duyệt không có nhận dạng giọng nói';
    this.active = null;
  }

  disable(reason) {
    this.enabled = false;
    this.reason = reason;
    this.active?.abort();
  }

  /** Bố mẹ tắt trong Cài đặt. */
  setAllowed(allowed) {
    if (!allowed) this.disable('Bố mẹ đã tắt trong Cài đặt');
    else if (SR() && !this.enabled && this.reason === 'Bố mẹ đã tắt trong Cài đặt') {
      this.enabled = true;
      this.reason = '';
    }
  }

  /** Tự kiểm tra đầu buổi: khởi động thử, lỗi thì tắt cho cả buổi. */
  async selfTest() {
    if (!this.enabled) return false;
    return new Promise((resolve) => {
      let rec;
      try {
        rec = this.create();
      } catch (err) {
        this.disable(`Không khởi động được (${err.message})`);
        resolve(false);
        return;
      }
      const timer = setTimeout(() => finish(true), scaled(1500));
      const finish = (ok, reason) => {
        clearTimeout(timer);
        rec.onerror = rec.onstart = rec.onend = null;
        try {
          rec.abort();
        } catch {
          // đã dừng
        }
        if (!ok) this.disable(reason);
        resolve(ok);
      };
      rec.onstart = () => setTimeout(() => finish(true), scaled(300));
      rec.onerror = (e) => (HARMLESS.has(e.error) ? finish(true) : finish(false, `Lỗi khi tự kiểm tra: ${e.error}`));
      try {
        rec.start();
      } catch (err) {
        finish(false, `Không khởi động được (${err.message})`);
      }
    });
  }

  create() {
    const rec = new (SR())();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.maxAlternatives = 5;
    rec.continuous = false;
    return rec;
  }

  /**
   * Bắt đầu nghe. Trả về { stop(): Promise<string[]> } — các phương án câu đã nghe được.
   * @param {(alternatives: string[]) => void} [onHeard] gọi mỗi khi nghe được chữ (để dừng sớm khi đã khớp)
   */
  begin(onHeard) {
    if (!this.enabled) return { stop: async () => [] };
    const heard = new Set();
    let ended = false;
    let endResolve;
    const endPromise = new Promise((r) => {
      endResolve = r;
    });
    let rec;
    try {
      rec = this.create();
    } catch (err) {
      this.disable(`Không khởi động được (${err.message})`);
      return { stop: async () => [] };
    }
    this.active = rec;

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        for (let k = 0; k < event.results[i].length; k++) heard.add(event.results[i][k].transcript);
      }
      onHeard?.([...heard]);
    };
    rec.onerror = (e) => {
      if (!HARMLESS.has(e.error)) this.disable(`Lỗi khi nghe: ${e.error}`);
    };
    rec.onend = () => {
      ended = true;
      if (this.active === rec) this.active = null;
      endResolve();
    };
    try {
      rec.start();
    } catch (err) {
      this.disable(`Không khởi động được (${err.message})`);
      ended = true;
      endResolve();
    }

    return {
      stop: async () => {
        if (!ended) {
          try {
            rec.stop();
          } catch {
            // đã dừng
          }
          // Chờ kết quả cuối cùng một chút, không chờ mãi.
          await Promise.race([endPromise, new Promise((r) => setTimeout(r, scaled(1000)))]);
          if (!ended) rec.abort();
        }
        return [...heard];
      },
    };
  }
}
