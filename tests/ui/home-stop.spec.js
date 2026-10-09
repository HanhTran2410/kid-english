// Bấm 🏠 khi đang học bài câu: giọng đọc phải dừng và không đọc thêm câu nào của bài.
import { test, expect } from '@playwright/test';

test('bấm 🏠 giữa bài câu: giọng đọc dừng, không đọc thêm câu nào', async ({ page }) => {
  await page.addInitScript(() => {
    window.__log = [];
    window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
    const voices = [{ name: 'Test English', lang: 'en-US', voiceURI: 'x', localService: true }];
    let cur = null;
    const synth = {
      speaking: false, pending: false, paused: false,
      getVoices: () => voices,
      speak(u) {
        if (!u.text.trim()) return;
        window.__log.push(`${location.hash}|${document.querySelector('.home-btn-small') ? 'act' : 'home'}|speak:${u.text}`);
        cur = u; synth.speaking = true;
        setTimeout(() => u.onstart?.(), 5);
        u.__t = setTimeout(() => { synth.speaking = false; u.onend?.(); }, 1500);
      },
      cancel() { window.__log.push('cancel'); if (cur) { clearTimeout(cur.__t); synth.speaking = false; cur = null; } },
      resume() {}, addEventListener() {}, removeEventListener() {},
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    delete window.SpeechRecognition; delete window.webkitSpeechRecognition;
  });
  await page.goto('/?nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Câu nói' }).click();
  await page.getByRole('button', { name: 'Morning', exact: true }).click();
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.__log.push('--- HOME ---'));
  await page.locator('.home-btn-small').click();
  await page.waitForTimeout(6000);
  console.log((await page.evaluate(() => window.__log)).join('\n'));
});
