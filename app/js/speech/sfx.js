// Âm thanh phản hồi tạo bằng Web Audio, không cần file âm thanh (SPEC mục 2).

let ctx = null;

/** AudioContext dùng chung cho hiệu ứng và đo âm lượng mic. */
export function audioContext() {
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Mở khóa âm thanh (gọi trong lúc chạm). */
export async function unlockAudio() {
  const c = audioContext();
  if (!c) return;
  if (c.state !== 'running') {
    try {
      await c.resume();
    } catch {
      // bỏ qua: lần chạm sau sẽ thử lại
    }
  }
  // Phát một mẫu im lặng để iOS cho phép phát âm thanh.
  const buffer = c.createBuffer(1, 1, 22050);
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.connect(c.destination);
  src.start(0);
}

export const isAudioLocked = () => !ctx || ctx.state !== 'running';

function tone(c, { freq, endFreq = freq, start = 0, duration = 0.2, type = 'sine', gain = 0.25 }) {
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

function noise(c, { start = 0, duration = 0.08, gain = 0.3, filter = 1500 }) {
  const t = c.currentTime + start;
  const length = Math.ceil(c.sampleRate * duration);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = filter;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t);
}

const SOUNDS = {
  tap: (c) => tone(c, { freq: 660, duration: 0.07, gain: 0.12 }),
  pop: (c) => tone(c, { freq: 420, endFreq: 900, duration: 0.12, gain: 0.2 }),
  ding: (c) => {
    tone(c, { freq: 1046, duration: 0.6, gain: 0.2 });
    tone(c, { freq: 1568, start: 0.08, duration: 0.6, gain: 0.15 });
  },
  boing: (c) => tone(c, { freq: 320, endFreq: 180, duration: 0.25, type: 'triangle', gain: 0.15 }),
  whoosh: (c) => noise(c, { duration: 0.35, gain: 0.25, filter: 900 }),
  cheer: (c) => {
    [523, 659, 784, 1046].forEach((f, i) => tone(c, { freq: f, start: i * 0.12, duration: 0.35, type: 'triangle', gain: 0.18 }));
    for (let i = 0; i < 10; i++) noise(c, { start: 0.1 + i * 0.13 + Math.random() * 0.04, duration: 0.06, gain: 0.35 });
  },
};

/** Phát hiệu ứng: 'tap' | 'pop' | 'ding' | 'boing' | 'whoosh' | 'cheer'. Không có âm thanh thì bỏ qua. */
export function play(name) {
  const c = audioContext();
  if (!c || c.state !== 'running') return;
  try {
    SOUNDS[name]?.(c);
  } catch {
    // âm thanh phản hồi không được làm hỏng bài học
  }
}
