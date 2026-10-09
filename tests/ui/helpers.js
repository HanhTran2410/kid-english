// Giả lập giọng đọc (máy test không có giọng) và tùy chọn tắt nhận dạng / mic.

export async function fakeSpeech(page, { recognition = false, mic = true } = {}) {
  await page.addInitScript(({ recognition, mic }) => {
    window.__spoken = [];
    class FakeUtterance {
      constructor(text) {
        this.text = text;
      }
    }
    window.SpeechSynthesisUtterance = FakeUtterance;
    const voices = [
      { name: 'Test English', lang: 'en-US', voiceURI: 'test-en', localService: true },
      { name: 'Test Vietnamese', lang: 'vi-VN', voiceURI: 'test-vi', localService: true },
    ];
    const synth = {
      speaking: false,
      getVoices: () => voices,
      speak(u) {
        if (u.text.trim()) window.__spoken.push(u.text);
        setTimeout(() => u.onend?.(), 5);
      },
      cancel() {},
      addEventListener() {},
      removeEventListener() {},
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    if (!recognition) {
      delete window.SpeechRecognition;
      delete window.webkitSpeechRecognition;
    }
    // Mic giả của Chromium có lúc im lặng → Bông gọi "Hello? Tap me!": giả làm bé chạm lại.
    setInterval(() => document.querySelector('.tap-me, .idle-pause')?.click(), 200);
    if (!mic) {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: () => Promise.reject(new DOMException('Không cho phép', 'NotAllowedError')) },
        configurable: true,
      });
    }
  }, { recognition, mic });
}

/** Mở app ở chế độ chạy nhanh, không service worker, bấm "Bắt đầu". */
export async function startApp(page) {
  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Bài học' }).waitFor();
}

/** Nhấn giữ một nút (⚙️ 3 giây, 🏠 1,5 giây...). */
export async function hold(page, locator, ms = 3200) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

export async function openParent(page) {
  await hold(page, page.getByRole('button', { name: /Góc bố mẹ/ }));
  await page.getByRole('heading', { name: 'Góc bố mẹ' }).waitFor();
}

/**
 * Học cho tới khi hết bài (màn Hoan hô): chạm vào lựa chọn khi có trò chơi, bấm ▶ khi có.
 * Trả về số lần đã chạm chọn hình.
 */
export async function playThrough(page, { stopAfterSteps = Infinity } = {}) {
  let taps = 0;
  for (let i = 0; i < 600; i++) {
    if (await page.locator('.done-btn').isVisible()) return taps;
    const progress = await page.locator('.progress-fill').evaluate((el) => parseFloat(el.style.width) || 0);
    if (progress >= stopAfterSteps) return taps;
    // Bước "làm theo" của bài câu: bé (bố mẹ) chạm ✔.
    const did = page.locator('.did-btn:not(.done)');
    if (await did.isVisible().catch(() => false)) await did.click({ timeout: 1000, force: true }).catch(() => {});
    const choice = page.locator('.choice:not(.shake)').first();
    if (await choice.isVisible().catch(() => false)) {
      await choice.click({ timeout: 1000 }).catch(() => {});
      taps++;
    }
    await page.waitForTimeout(150);
  }
  throw new Error('Không học hết được bài');
}
