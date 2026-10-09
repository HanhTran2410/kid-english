// Trạng thái chung của app: dữ liệu, giọng nói, điều hướng màn hình, thời gian buổi học.

import { Speaker } from './speech/tts.js';
import { Microphone, MIC } from './speech/microphone.js';
import { Recognizer } from './speech/recognition.js';
import { unlockAudio, isAudioLocked } from './speech/sfx.js';
import { saveSetting } from './settings.js';
import { resumeSession, addTime, extend, isTimeUp } from './session.js';
import { h } from './ui.js';
import { bongElement } from './bong.js';

export const APP_VERSION = '0.1.15';

const SESSION_SAVE_EVERY_MS = 15000;

export class App {
  constructor(root) {
    this.root = root;
    this.db = null;
    this.settings = null;
    this.speaker = new Speaker();
    this.mic = new Microphone();
    this.recognizer = new Recognizer();
    this.screens = new Map();
    this.current = null;
    this.cleanup = null;
    this.activity = null;
    this.listening = false;
    this.idlePaused = false;
    this.lastTouchAt = Date.now();
    this.recognitionTested = false;
    this.wakeLock = null;
    this.swRegistration = null;
    this.interruptedScreen = null;
    this.session = null;

    this.mic.canSampleNoise = () => !this.speaker.speaking && !this.listening;
    document.addEventListener('pointerdown', () => {
      this.lastTouchAt = Date.now();
    }, { capture: true });
    document.addEventListener('visibilitychange', () => this.onVisibilityChange());
  }

  // ---------- Điều hướng ----------

  register(name, render) {
    this.screens.set(name, render);
  }

  /** Chuyển màn hình. Màn hình là hàm (app, params) → hàm dọn dẹp (tùy chọn). */
  go(name, params = {}) {
    this.stopActivity();
    try {
      this.cleanup?.();
    } catch (err) {
      console.error(err);
    }
    this.cleanup = null;
    this.root.replaceChildren();
    this.root.className = '';
    this.current = { name, params };
    const render = this.screens.get(name);
    if (!render) throw new Error(`Không có màn hình ${name}`);
    this.cleanup = render(this, params) ?? null;
    window.scrollTo(0, 0);
  }

  /** Bắt đầu một hoạt động của bé (bài học, ôn tập...). Trả về signal để hủy khi rời màn hình. */
  startActivity() {
    this.stopActivity();
    this.activity = new AbortController();
    this.idlePaused = false;
    this.keepAwake(true);
    return this.activity.signal;
  }

  stopActivity() {
    if (this.activity) {
      this.activity.abort();
      this.activity = null;
    }
    this.speaker.cancel();
    this.listening = false;
    this.idlePaused = false;
    this.keepAwake(false);
    this.saveSession();
  }

  get inActivity() {
    return Boolean(this.activity && !this.activity.signal.aborted);
  }

  // ---------- Cài đặt ----------

  async setSetting(key, value) {
    this.settings[key] = value;
    await saveSetting(this.db, key, value);
  }

  // ---------- Âm thanh, mic ----------

  /** Gọi trong lúc bé/bố mẹ chạm nút "Bắt đầu": mở khóa âm thanh, xin mic một lần mỗi buổi. */
  async unlock() {
    // Giọng đọc phải được mở khóa NGAY trong lúc chạm (trước mọi await), không thì iOS có lúc im lặng.
    this.speaker.unlock();
    await unlockAudio();
    if (this.mic.status !== MIC.OK || !this.mic.stream?.active) {
      if (this.mic.status !== MIC.DENIED) await this.mic.start();
    }
    if (!this.recognitionTested && this.mic.ready) {
      this.recognitionTested = true;
      this.recognizer.setAllowed(this.settings.useRecognition);
      // Tự kiểm tra chạy nền, lỗi thì tự tắt cho cả buổi. Chỉ chờ khi sắp tắt mic ngay sau đó.
      const test = this.recognizer.selfTest();
      if (this.settings.micOnlyWhenListening) await test;
    }
    // Chỉ bật mic khi nghe bé: đã xin quyền xong thì tắt mic ngay để tiếng Bông không bị rè.
    if (this.settings.micOnlyWhenListening && this.mic.ready) this.mic.release();
  }

  get audioLocked() {
    return isAudioLocked();
  }

  // ---------- Thời gian buổi học (SPEC mục 4.6) ----------

  startSessionClock() {
    this.session = resumeSession(this.settings.session);
    let sinceSave = 0;
    setInterval(() => {
      const counting = this.inActivity && !this.idlePaused && document.visibilityState === 'visible';
      if (!counting) return;
      this.session = addTime(this.session, 1000);
      sinceSave += 1000;
      if (sinceSave >= SESSION_SAVE_EVERY_MS) {
        sinceSave = 0;
        this.saveSession();
      }
    }, 1000);
  }

  saveSession() {
    if (this.db && this.session) saveSetting(this.db, 'session', this.session).catch(() => {});
  }

  get timeUp() {
    return Boolean(this.session) && isTimeUp(this.session, this.settings.limitMinutes);
  }

  extendTime() {
    this.session = extend(this.session);
    this.saveSession();
  }

  /** Sau mỗi hoạt động: hết giờ thì Bông đi ngủ, không thì về màn hình chính. */
  finishActivity() {
    this.go(this.timeUp ? 'sleep' : 'home');
  }

  // ---------- Giữ màn hình sáng (SPEC mục 4.9) ----------

  async keepAwake(on) {
    try {
      if (on && !this.wakeLock && navigator.wakeLock && document.visibilityState === 'visible') {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } else if (!on && this.wakeLock) {
        const lock = this.wakeLock;
        this.wakeLock = null;
        await lock.release();
      }
    } catch {
      // iOS cũ không hỗ trợ: README hướng dẫn chỉnh Tự động khóa.
    }
  }

  // ---------- App bị chuyển sang nền (SPEC mục 4.9) ----------

  onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      this.saveSession();
      if (this.inActivity) {
        this.interruptedScreen = this.current;
        this.stopActivity();
      }
      return;
    }
    // Quay lại app: gỡ kẹt giọng đọc; iOS đã tắt âm thanh/mic → cần một lần chạm "Bắt đầu".
    this.speaker.reset();
    if (this.interruptedScreen || (this.isChildScreen() && this.audioLocked)) this.showResumeOverlay();
    else if (this.inActivity) this.keepAwake(true);
  }

  isChildScreen() {
    return this.current && !String(this.current.name).startsWith('parent') && this.current.name !== 'start';
  }

  showResumeOverlay() {
    if (document.querySelector('.resume-overlay')) return;
    const target = this.interruptedScreen;
    this.interruptedScreen = null;
    const overlay = h('div.resume-overlay', {},
      h('button.start-btn', {
        type: 'button',
        'aria-label': 'Bắt đầu',
        onclick: async () => {
          overlay.remove();
          await this.unlock();
          if (target) this.go(target.name, { ...target.params, continueDirectly: true });
        },
      }, bongElement('start-bunny'), h('span.start-label', { text: '▶' })));
    document.body.append(overlay);
  }
}
