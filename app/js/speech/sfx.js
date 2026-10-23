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
  // Chuông điện thoại: hai nốt xen kẽ thật nhanh (reng reng), hai hồi.
  ring: (c) => {
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 6; i++) tone(c, { freq: i % 2 ? 1175 : 880, start: k * 0.5 + i * 0.05, duration: 0.05, gain: 0.12 });
    }
  },
  // Ló dần (SPEC-words-play mục 6): trống lăn nhỏ, "ta-da!", lấp lánh.
  drumroll: (c) => {
    for (let i = 0; i < 10; i++) noise(c, { start: i * 0.05, duration: 0.04, gain: 0.08 + i * 0.008, filter: 260 });
  },
  tada: (c) => {
    tone(c, { freq: 784, duration: 0.14, type: 'triangle', gain: 0.18 });
    tone(c, { freq: 1046, start: 0.14, duration: 0.5, type: 'triangle', gain: 0.2 });
    [1568, 2093, 2637].forEach((f, i) => tone(c, { freq: f, start: 0.2 + i * 0.06, duration: 0.18, gain: 0.06 }));
  },
  sparkle: (c) => [1568, 2093, 2637].forEach((f, i) => tone(c, { freq: f, start: i * 0.05, duration: 0.12, gain: 0.06 })),
  // Tắt máy: ba tiếng "tút" đi xuống.
  hangup: (c) => [620, 520, 420].forEach((f, i) => tone(c, { freq: f, start: i * 0.16, duration: 0.12, type: 'square', gain: 0.06 })),
  cheer: (c) => {
    [523, 659, 784, 1046].forEach((f, i) => tone(c, { freq: f, start: i * 0.12, duration: 0.35, type: 'triangle', gain: 0.18 }));
    for (let i = 0; i < 10; i++) noise(c, { start: 0.1 + i * 0.13 + Math.random() * 0.04, duration: 0.06, gain: 0.35 });
  },
  // Cho Bông ăn (SPEC-feed): đớp, nhai, ợ, bụng kêu — nhỏ hơn lời nói.
  chomp: (c) => {
    noise(c, { duration: 0.07, gain: 0.3, filter: 700 });
    tone(c, { freq: 260, endFreq: 140, duration: 0.1, type: 'triangle', gain: 0.12 });
  },
  munch: (c) => [0, 0.28, 0.56].forEach((t) => noise(c, { start: t, duration: 0.09, gain: 0.22, filter: 1100 })),
  burp: (c) => tone(c, { freq: 120, endFreq: 70, duration: 0.45, type: 'sawtooth', gain: 0.1 }),
  rumble: (c) => [0, 0.22].forEach((t) => tone(c, { freq: 90, endFreq: 60, start: t, duration: 0.2, type: 'triangle', gain: 0.14 })),
  // Bác sĩ nhí (SPEC-doctor): chuông cửa "ding dong", hỉ mũi, chải răng.
  doorbell: (c) => {
    tone(c, { freq: 784, duration: 0.5, gain: 0.18 });
    tone(c, { freq: 622, start: 0.35, duration: 0.7, gain: 0.18 });
  },
  honk: (c) => tone(c, { freq: 240, endFreq: 200, duration: 0.35, type: 'sawtooth', gain: 0.08 }),
  brush: (c) => [0, 0.2, 0.4, 0.6].forEach((t) => noise(c, { start: t, duration: 0.14, gain: 0.18, filter: 3000 })),
};

/** Phát hiệu ứng: 'tap' | 'pop' | 'ding' | 'boing' | 'whoosh' | 'cheer' | 'ring' | 'hangup' | 'drumroll' | 'tada' | 'sparkle' | 'chomp' | 'munch' | 'burp' | 'rumble' | 'doorbell' | 'honk' | 'brush'. Không có âm thanh thì bỏ qua. */
export function play(name) {
  const c = audioContext();
  if (!c || c.state !== 'running') return;
  try {
    SOUNDS[name]?.(c);
  } catch {
    // âm thanh phản hồi không được làm hỏng bài học
  }
}
