// Giọng đọc bằng Web Speech API. Chọn giọng theo ngôn ngữ, không ghi cứng tên giọng (SPEC mục 2).

import { scaled, abortError } from '../timing.js';

const synth = () => globalThis.speechSynthesis;

/** Đợi danh sách giọng (iOS/Chrome trả về rỗng ở lần gọi đầu, phải chờ `voiceschanged`). */
export function loadVoices(timeoutMs = 2500) {
  const s = synth();
  if (!s) return Promise.resolve([]);
  const now = s.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const finish = () => {
      s.removeEventListener?.('voiceschanged', finish);
      resolve(s.getVoices());
    };
    s.addEventListener?.('voiceschanged', finish);
    setTimeout(finish, timeoutMs);
  });
}

const quality = (v) => (/premium/i.test(v.name) ? 3 : /enhanced/i.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0);

/**
 * Chọn giọng: đúng giọng bố mẹ đã chọn (nếu máy còn) → đúng ngôn ngữ (en-US) → cùng họ ngôn ngữ (en-*).
 * @param {SpeechSynthesisVoice[]} voices
 * @param {string} lang ví dụ 'en-US', 'vi-VN'
 */
export function pickVoice(voices, lang, preferredURI = null) {
  if (preferredURI) {
    const chosen = voices.find((v) => v.voiceURI === preferredURI);
    if (chosen && chosen.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase())) return chosen;
  }
  const norm = (l) => l.toLowerCase().replace('_', '-');
  const best = (list) => [...list].sort((a, b) => quality(b) - quality(a))[0] ?? null;
  const exact = voices.filter((v) => norm(v.lang) === norm(lang));
  if (exact.length) return best(exact);
  const family = voices.filter((v) => norm(v.lang).startsWith(norm(lang).slice(0, 2)));
  return best(family);
}

export const englishVoices = (voices) => voices.filter((v) => /^en/i.test(v.lang));

export class Speaker {
  constructor() {
    this.voices = [];
    this.en = null;
    this.vi = null;
    this.rate = 0.8;
    this.speaking = false;
    this.listeners = new Set();
  }

  get supported() {
    return Boolean(synth());
  }

  async init({ voiceURI = null, rate = 0.8 } = {}) {
    this.voices = await loadVoices();
    this.configure({ voiceURI, rate });
  }

  configure({ voiceURI = null, rate = this.rate } = {}) {
    this.en = pickVoice(this.voices, 'en-US', voiceURI);
    this.vi = pickVoice(this.voices, 'vi-VN');
    this.rate = rate;
  }

  get hasEnglish() {
    // Một số trình duyệt không liệt kê giọng nhưng vẫn đọc được; chỉ coi là thiếu khi có danh sách mà không có giọng Anh.
    return this.supported && (this.voices.length === 0 || Boolean(this.en));
  }

  get hasVietnamese() {
    return Boolean(this.vi);
  }

  /** Theo dõi trạng thái đang nói (để Bông nhún nhảy). */
  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setSpeaking(value) {
    this.speaking = value;
    for (const fn of this.listeners) fn(value);
  }

  /** Mở khóa âm thanh trên iOS: phải gọi trong lúc chạm. */
  unlock() {
    const s = synth();
    if (!s) return;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    s.speak(u);
  }

  /**
   * Đọc một câu. Luôn kết thúc: nếu iOS không báo đã đọc xong thì hết thời gian chờ sẽ tự đi tiếp.
   * @param {string} text
   * @param {{ lang?: 'en'|'vi', signal?: AbortSignal, rate?: number }} [options]
   */
  speak(text, { lang = 'en', signal, rate } = {}) {
    const s = synth();
    const voice = lang === 'vi' ? this.vi : this.en;
    if (!s || !text || (lang === 'vi' && !voice)) return Promise.resolve();
    if (signal?.aborted) return Promise.reject(abortError());

    return new Promise((resolve, reject) => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? (lang === 'vi' ? 'vi-VN' : 'en-US');
      u.rate = rate ?? (lang === 'vi' ? Math.max(this.rate, 0.9) : this.rate);

      let finished = false;
      const maxMs = scaled((1200 + text.length * 110) / u.rate + 1500);
      const finish = (err) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        this.setSpeaking(false);
        if (err) reject(err);
        else resolve();
      };
      const timer = setTimeout(() => finish(), maxMs);
      const onAbort = () => {
        s.cancel();
        finish(abortError());
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      u.onend = () => finish();
      u.onerror = () => finish();

      s.cancel(); // tránh hàng đợi bị kẹt trên iOS
      this.setSpeaking(true);
      s.speak(u);
    });
  }

  cancel() {
    synth()?.cancel();
    this.setSpeaking(false);
  }
}
