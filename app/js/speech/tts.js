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

// iOS/macOS có sẵn nhiều giọng "vui" nghe như robot (Albert, Bad News, Zarvox…) và giọng Eloquence (Eddy, Grandpa…).
// Các giọng này xếp đầu danh sách theo bảng chữ cái nên phải loại ra, nếu không tiếng Anh sẽ bị rè/méo.
const NOVELTY_NAMES = new Set([
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'good news', 'jester', 'organ',
  'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox', 'fred', 'junior', 'kathy', 'ralph',
  'eddy', 'flo', 'grandma', 'grandpa', 'reed', 'rocko', 'sandy', 'shelley',
]);
const NICE_NAMES = /^(samantha|ava|allison|susan|zoe|nicky|evan|tom|joelle|noelle|nathan|karen|daniel|moira|tessa|serena|linh)/i;

/** Đánh giá giọng: càng cao càng nên dùng. Giọng robot bị điểm âm. */
export function voiceScore(v) {
  const name = String(v.name ?? '').toLowerCase().replace(/\s*\(.*\)\s*$/, '');
  const uri = String(v.voiceURI ?? '').toLowerCase();
  if (NOVELTY_NAMES.has(name) || uri.includes('speech.synthesis.voice') || uri.includes('eloquence')) return -100;
  let score = 0;
  if (/premium/.test(uri) || /premium/i.test(v.name)) score += 50;
  else if (/enhanced/.test(uri) || /enhanced/i.test(v.name)) score += 40;
  else if (/siri/.test(uri)) score += 30;
  if (NICE_NAMES.test(v.name ?? '')) score += 10;
  if (v.localService) score += 2;
  if (v.default) score += 1;
  return score;
}

export const isNoveltyVoice = (v) => voiceScore(v) < 0;

/**
 * Chọn giọng: đúng giọng bố mẹ đã chọn (nếu máy còn) → giọng tốt nhất cùng ngôn ngữ, ưu tiên đúng vùng (en-US).
 * @param {SpeechSynthesisVoice[]} voices
 * @param {string} lang ví dụ 'en-US', 'vi-VN'
 */
export function pickVoice(voices, lang, preferredURI = null) {
  if (preferredURI) {
    const chosen = voices.find((v) => v.voiceURI === preferredURI);
    if (chosen && chosen.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase())) return chosen;
  }
  const norm = (l) => String(l).toLowerCase().replace('_', '-');
  const family = voices.filter((v) => norm(v.lang).startsWith(norm(lang).slice(0, 2)));
  const score = (v) => voiceScore(v) + (norm(v.lang) === norm(lang) ? 5 : 0);
  return [...family].sort((a, b) => score(b) - score(a))[0] ?? null;
}

/** Giọng tiếng Anh, giọng tốt trước, giọng robot ở cuối. */
export const englishVoices = (voices) => voices
  .filter((v) => /^en/i.test(v.lang))
  .sort((a, b) => voiceScore(b) - voiceScore(a));

export class Speaker {
  constructor() {
    this.voices = [];
    this.en = null;
    this.vi = null;
    this.rate = 0.8;
    this.speaking = false;
    /** Số câu đã gửi cho giọng đọc (để biết có câu mới sau khi hủy). */
    this.spokenCount = 0;
    this.listeners = new Set();
  }

  get supported() {
    return Boolean(synth());
  }

  async init({ voiceURI = null, rate = 0.8 } = {}) {
    this.voiceURI = voiceURI;
    this.voices = await loadVoices();
    this.configure({ voiceURI, rate });
    // iOS có lúc trả danh sách giọng muộn (hoặc đổi sau khi tải giọng mới): cập nhật lại khi có thay đổi.
    synth()?.addEventListener?.('voiceschanged', () => {
      this.voices = synth().getVoices();
      this.configure({ voiceURI: this.voiceURI, rate: this.rate });
    });
  }

  configure({ voiceURI = null, rate = this.rate } = {}) {
    this.voiceURI = voiceURI;
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

  /** Mở khóa giọng đọc trên iOS: PHẢI gọi ngay trong lúc chạm, trước mọi `await`. */
  unlock() {
    const s = synth();
    if (!s) return;
    if (s.paused) s.resume();
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    s.speak(u);
  }

  /** Gỡ kẹt khi app quay lại từ nền (iOS hay để hàng đợi giọng đọc ở trạng thái kẹt). */
  reset() {
    const s = synth();
    if (!s) return;
    s.cancel();
    if (s.paused) s.resume();
    this.setSpeaking(false);
  }

  /**
   * Đọc một câu. Luôn kết thúc: nếu iOS không báo đã đọc xong thì hết thời gian chờ sẽ tự đi tiếp.
   * Nếu câu không bắt đầu được (giọng đọc bị kẹt) thì gỡ kẹt và thử lại một lần.
   * @param {string} text
   * @param {{ lang?: 'en'|'vi', signal?: AbortSignal, rate?: number }} [options]
   */
  speak(text, { lang = 'en', signal, rate } = {}) {
    const s = synth();
    const voice = lang === 'vi' ? this.vi : this.en;
    if (!s || !text || (lang === 'vi' && !voice)) return Promise.resolve();
    if (signal?.aborted) return Promise.reject(abortError());

    return new Promise((resolve, reject) => {
      const speed = rate ?? (lang === 'vi' ? Math.max(this.rate, 0.9) : this.rate);
      let finished = false;
      let current = null;
      let started = false;
      let retried = false;
      let startTimer = null;
      const maxMs = scaled((1200 + text.length * 110) / speed + 3000);

      const finish = (err) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        clearTimeout(startTimer);
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

      const attempt = () => {
        const u = new SpeechSynthesisUtterance(text);
        if (voice) u.voice = voice;
        u.lang = voice?.lang ?? (lang === 'vi' ? 'vi-VN' : 'en-US');
        u.rate = speed;
        current = u;
        // Chỉ xử lý sự kiện của câu đang đọc (câu bị hủy khi thử lại sẽ báo lỗi "canceled").
        u.onstart = () => {
          if (u === current) started = true;
        };
        u.onend = () => u === current && finish();
        u.onerror = () => u === current && finish();
        if (s.paused) s.resume();
        this.spokenCount++;
        s.speak(u);
        // Không bắt đầu được sau 1,5 giây → giọng đọc bị kẹt: gỡ kẹt và thử lại một lần.
        startTimer = setTimeout(() => {
          if (finished || started || retried) return;
          retried = true;
          current = null;
          s.cancel();
          if (s.paused) s.resume();
          attempt();
        }, scaled(1500));
      };

      // Chỉ hủy khi thật sự còn câu đang đọc: gọi cancel() ngay trước speak() trên Safari đôi khi làm mất câu mới.
      if (s.speaking || s.pending) s.cancel();
      this.setSpeaking(true);
      attempt();
    });
  }

  cancel() {
    const s = synth();
    this.setSpeaking(false);
    if (!s) return;
    s.cancel();
    // Safari iOS: cancel() đôi khi không dừng câu vừa bắt đầu đọc (rời bài rồi Bông vẫn nói).
    // Hủy lại vài lần sau đó, chỉ khi chưa có câu mới để không cắt nhầm câu của màn hình sau.
    const mark = this.spokenCount;
    for (const ms of [100, 350, 900]) {
      setTimeout(() => {
        if (this.spokenCount === mark) s.cancel();
      }, ms);
    }
  }
}
