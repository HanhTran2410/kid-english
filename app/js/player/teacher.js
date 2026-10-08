// Thỏ Bông: nói, nghe, khen, chờ bé chạm, gọi bé khi bé bỏ đi (SPEC mục 4.3, 4.9).

import { h } from '../ui.js';
import { listen, RESULT } from '../speech/listen.js';
import { play } from '../speech/sfx.js';
import { sleep, scaled, abortError } from '../timing.js';

const IDLE_CALL_MS = 20_000; // 20 giây không chạm → Bông gọi bé
const IDLE_PAUSE_MS = 120_000; // 2 phút → tạm dừng, không tính giờ
const SILENT_STREAK_CHECK = 3; // 3 lượt im lặng liên tiếp → kiểm tra bé còn ở đó không

export function createBunny(app) {
  const el = h('div.bunny', { 'aria-hidden': 'true', dataset: { state: 'idle' } },
    h('span.bunny-wave'),
    h('span.bunny-face', { text: '🐰' }));
  const off = app.speaker.onChange((speaking) => el.classList.toggle('talk', speaking));
  return {
    el,
    set(state) {
      el.dataset.state = state;
    },
    setLevel(ratio) {
      el.style.setProperty('--level', String(ratio));
    },
    destroy: off,
  };
}

export class Teacher {
  /**
   * @param {import('../app.js').App} app
   * @param {{ signal: AbortSignal, bunny: ReturnType<typeof createBunny>, stage: HTMLElement }} options
   */
  constructor(app, { signal, bunny, stage }) {
    this.app = app;
    this.signal = signal;
    this.bunny = bunny;
    this.stage = stage;
    this.silentStreak = 0;
  }

  say(text, options = {}) {
    return this.app.speaker.speak(text, { signal: this.signal, ...options });
  }

  sayVi(text) {
    return this.say(text, { lang: 'vi' });
  }

  pause(ms) {
    return sleep(ms, this.signal);
  }

  /** Nghe bé nói một lượt (SPEC 4.3.1). */
  async hear(keywords, { record = false } = {}) {
    const { app } = this;
    if (!app.mic.ready) await this.say('Your turn!');
    this.bunny.set('listen');
    app.listening = true;
    let outcome;
    try {
      outcome = await listen({
        mic: app.mic,
        recognizer: app.recognizer,
        keywords,
        record,
        signal: this.signal,
        onLevel: (r) => this.bunny.setLevel(r),
      });
    } finally {
      app.listening = false;
      this.bunny.set('idle');
    }
    this.silentStreak = outcome.result === RESULT.SILENT ? this.silentStreak + 1 : 0;
    return outcome;
  }

  /** Khen theo kết quả nghe. Không bao giờ nói "sai". */
  async praise(result) {
    if (result === RESULT.MATCH) {
      play('ding');
      this.celebrate();
      this.bunny.set('clap');
      await this.say('Great job!');
    } else if (result === RESULT.VOICE) {
      play('pop');
      this.bunny.set('clap');
      await this.say('Good try!');
    } else if (result === RESULT.SILENT) {
      await this.say("Let's try!");
    }
    this.bunny.set('idle');
  }

  /** Sao bay lên khi bé làm tốt. */
  celebrate() {
    const burst = h('div.star-burst', { 'aria-hidden': 'true' },
      ...Array.from({ length: 8 }, (_, i) => h('span', { text: '⭐', style: { '--i': String(i) } })));
    this.stage.append(burst);
    setTimeout(() => burst.remove(), 1400);
  }

  /** Sau nhiều lượt im lặng mà bé không chạm gì: Bông gọi bé, chờ bé chạm. */
  async checkPresence() {
    if (this.silentStreak < SILENT_STREAK_CHECK) return;
    if (Date.now() - this.app.lastTouchAt < scaled(IDLE_CALL_MS)) return;
    this.silentStreak = 0;
    const overlay = h('button.tap-me', { type: 'button', 'aria-label': 'Chạm để tiếp tục' }, h('span', { text: '👆' }));
    this.stage.append(overlay);
    try {
      await this.waitTap([overlay], { callFirst: true });
    } finally {
      overlay.remove();
    }
  }

  /**
   * Chờ bé chạm vào một trong các phần tử. Bỏ qua lần chạm khi Bông đang nói.
   * Không chạm 20 giây → Bông gọi; 2 phút → tạm dừng (không tính giờ) cho đến khi bé chạm.
   * @returns {Promise<HTMLElement>}
   */
  waitTap(targets, { callFirst = false } = {}) {
    const { app } = this;
    return new Promise((resolve, reject) => {
      let idleTimer = null;
      // Chỉ tính thời gian bé không chạm kể từ lúc bắt đầu chờ (trước đó bé có thể đang ngồi nghe).
      const waitStartedAt = Date.now();
      let calledAt = waitStartedAt;
      let pauseOverlay = null;

      const cleanup = () => {
        clearInterval(idleTimer);
        for (const t of targets) t.removeEventListener('click', onTap);
        this.signal.removeEventListener('abort', onAbort);
        pauseOverlay?.remove();
        app.idlePaused = false;
      };
      const onTap = (event) => {
        if (app.speaker.speaking) return;
        cleanup();
        resolve(event.currentTarget);
      };
      const onAbort = () => {
        cleanup();
        reject(abortError());
      };

      for (const t of targets) t.addEventListener('click', onTap);
      this.signal.addEventListener('abort', onAbort, { once: true });
      if (callFirst) this.say('Hello? Tap me!').catch(() => {});

      idleTimer = setInterval(() => {
        const idle = Date.now() - Math.max(app.lastTouchAt, calledAt);
        const sinceTouch = Date.now() - Math.max(app.lastTouchAt, waitStartedAt);
        if (!pauseOverlay && sinceTouch > scaled(IDLE_PAUSE_MS)) {
          // Tạm dừng: không tính giờ cho đến khi bé quay lại chạm.
          app.idlePaused = true;
          pauseOverlay = h('button.idle-pause', { type: 'button', 'aria-label': 'Chạm để tiếp tục' },
            h('span.idle-bunny', { text: '😴' }), h('span', { text: '👆' }));
          pauseOverlay.addEventListener('click', () => {
            pauseOverlay.remove();
            pauseOverlay = null;
            app.idlePaused = false;
            calledAt = Date.now();
          });
          document.body.append(pauseOverlay);
        } else if (!pauseOverlay && idle > scaled(IDLE_CALL_MS) && !app.speaker.speaking) {
          calledAt = Date.now();
          this.say('Hello? Tap me!').catch(() => {});
        }
      }, scaled(1000));
    });
  }
}
