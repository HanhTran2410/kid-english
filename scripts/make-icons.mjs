// Tạo icon PNG (iOS cần PNG cho Màn hình chính) từ app/icons/icon.svg bằng Chromium của Playwright.
// Chạy: node scripts/make-icons.mjs

import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const svg = await readFile(path.join(root, 'app/icons/icon.svg'), 'utf8');

// apple-touch-icon không bo góc (iOS tự bo), nền phủ kín.
const square = svg.replace('rx="112"', 'rx="0"');
const outputs = [
  ['icon-192.png', 192, svg],
  ['icon-512.png', 512, square],
  ['apple-touch-icon.png', 180, square],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, source] of outputs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${source.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: path.join(root, 'app/icons', name), omitBackground: true });
  console.log('Đã tạo', name);
}
await browser.close();
