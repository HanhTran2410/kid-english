// Xin quyền mic một lần mỗi buổi và đo âm lượng (SPEC mục 4.3.1, mục 6).

import { audioContext } from './sfx.js';

export const MIC = { OFF: 'off', OK: 'ok', DENIED: 'denied', UNAVAILABLE: 'unavailable', LOST: 'lost' };

const MIN_THRESHOLD = 0.02;

export class Microphone {
  constructor() {
    this.status = MIC.OFF;
    this.stream = null;
    this.analyser = null;
    this.buffer = null;
    this.noiseFloor = 0.01;
    this.sampleTimer = null;
    /** Trả về true khi được phép đo tiếng ồn nền (không ai đang nói). */
    this.canSampleNoise = () => true;
  }

  get ready() {
    return this.status === MIC.OK;
  }

  async start() {
    if (this.status === MIC.OK && this.stream?.active) return this.status;
    if (!globalThis.navigator?.mediaDevices?.getUserMedia) {
      this.status = MIC.UNAVAILABLE;
      return this.status;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err) {
      this.status = err?.name === 'NotAllowedError' || err?.name === 'SecurityError' ? MIC.DENIED : MIC.UNAVAILABLE;
      return this.status;
    }

    const ctx = audioContext();
    if (ctx) {
      const source = ctx.createMediaStreamSource(this.stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.buffer = new Float32Array(this.analyser.fftSize);
      source.connect(this.analyser);
    }
    for (const track of this.stream.getAudioTracks()) {
      track.addEventListener('ended', () => {
        this.status = MIC.LOST;
      });
    }
    this.status = MIC.OK;
    this.startNoiseSampling();
    return this.status;
  }

  /** Âm lượng hiện tại (RMS, 0..1). */
  level() {
    if (!this.analyser) return 0;
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sum = 0;
    for (const v of this.buffer) sum += v * v;
    return Math.sqrt(sum / this.buffer.length);
  }

  /** Đo tiếng ồn nền liên tục lúc không ai nói: giảm nhanh, tăng chậm. */
  startNoiseSampling() {
    clearInterval(this.sampleTimer);
    this.sampleTimer = setInterval(() => {
      if (!this.canSampleNoise()) return;
      const l = this.level();
      this.noiseFloor = l < this.noiseFloor ? this.noiseFloor * 0.7 + l * 0.3 : this.noiseFloor * 0.98 + l * 0.02;
    }, 100);
  }

  /** Ngưỡng coi là "có tiếng". */
  threshold() {
    return Math.max(MIN_THRESHOLD, this.noiseFloor * 3);
  }

  stop() {
    clearInterval(this.sampleTimer);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.analyser = null;
    if (this.status === MIC.OK) this.status = MIC.OFF;
  }
}
