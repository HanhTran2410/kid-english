// Test giao diện trên Chrome máy tính, kích thước iPad (SPEC mục 8).
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/ui',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/',
    viewport: { width: 1180, height: 820 },
    hasTouch: false,
    contextOptions: { reducedMotion: 'reduce' },
    permissions: ['microphone'],
    launchOptions: {
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
    },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node scripts/serve.mjs 4173',
    url: 'http://localhost:4173/',
    reuseExistingServer: true,
  },
});
