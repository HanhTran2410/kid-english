// Gộp đo âm lượng + nhận dạng + ghi âm → KHỚP / CÓ TIẾNG / IM LẶNG / CHỈ NGHE (SPEC mục 4.3.1).

import { matches } from '../match.js';
import { sleep, checkAbort, scaled } from '../timing.js';
import { VoiceRecorder, canRecord } from './recorder.js';
import { audioContext } from './sfx.js';

export const RESULT = {
  MATCH: 'match',
  VOICE: 'voice',
  SILENT: 'silent',
  LISTEN_ONLY: 'listen-only',
};

const TICK_MS = 50;
const VOICED_MIN_MS = 150; // có tiếng liên tục tối thiểu để tính là bé nói
const END_SILENCE_MS = 1200; // bé nói xong rồi im lặng chừng này thì dừng nghe sớm

/** Quyết định kết quả từ những gì đã đo được. */
export function decideResult({ micReady, matched, voiced, heardAnything }) {
  if (!micReady) return RESULT.LISTEN_ONLY;
  if (matched) return RESULT.MATCH;
  if (voiced || heardAnything) return RESULT.VOICE;
  return RESULT.SILENT;
}

/**
 * Nghe bé nói một lượt.
 * @param {{ mic: import('./microphone.js').Microphone, recognizer: import('./recognition.js').Recognizer,
 *           keywords: string[], record?: boolean, maxMs?: number, signal?: AbortSignal,
 *           onLevel?: (ratio: number) => void }} options
 * @returns {Promise<{ result: string, recording: null | { blob: Blob, mimeType: string, durationMs: number } }>}
 */
export async function listen({ mic, recognizer, keywords, record = false, maxMs = 5500, signal, onLevel }) {
  if (!mic?.ready) {
    // Chế độ chỉ nghe: chờ 3 giây cho bé nói theo, không đánh giá.
    await sleep(3000, signal);
    return { result: RESULT.LISTEN_ONLY, recording: null };
  }

  // AudioContext bị iOS tạm dừng (sau cuộc gọi, khi mic vừa bật…) thì đo âm lượng luôn ra 0: thử bật lại.
  const ctx = audioContext();
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});

  // Chờ một chút sau khi Bông nói xong để mic không thu nhầm tiếng Bông.
  await sleep(300, signal);

  let recorder = null;
  if (record && canRecord()) {
    try {
      recorder = new VoiceRecorder(mic.stream);
      recorder.start();
    } catch {
      recorder = null;
    }
  }

  let matched = false;
  const session = recognizer?.enabled
    ? recognizer.begin((alts) => {
      if (matches(alts, keywords)) matched = true;
    })
    : null;

  const threshold = mic.threshold();
  let voicedMs = 0;
  let voiced = false;
  let lastVoiceAt = 0;
  let matchedAt = 0;
  const started = performance.now();
  const tick = scaled(TICK_MS);

  try {
    for (;;) {
      await sleep(TICK_MS, signal);
      const now = performance.now();
      const level = mic.level();
      onLevel?.(Math.min(1, level / (threshold * 4)));
      if (level > threshold) {
        voicedMs += tick;
        lastVoiceAt = now;
        if (voicedMs >= scaled(VOICED_MIN_MS)) voiced = true;
      }
      if (matched && !matchedAt) matchedAt = now;
      if (now - started >= scaled(maxMs)) break;
      if (voiced && now - lastVoiceAt > scaled(END_SILENCE_MS)) break;
      if (matchedAt && now - matchedAt > scaled(400)) break;
    }
  } catch (err) {
    recorder?.cancel();
    await session?.stop();
    throw err;
  } finally {
    onLevel?.(0);
  }

  const heard = session ? await session.stop() : [];
  if (!matched && heard.length) matched = matches(heard, keywords);
  const recording = recorder ? await recorder.stop() : null;
  checkAbort(signal);

  const result = decideResult({ micReady: true, matched, voiced, heardAnything: heard.some((h) => h.trim()) });
  const keep = recording && result !== RESULT.SILENT && recording.blob.size > 0;
  return { result, recording: keep ? recording : null };
}
