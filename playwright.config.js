import { defineConfig, devices } from '@playwright/test';
import { PREVIEW_HOST } from './e2e/helpers/server/constants.js';
import { findFreePort } from './e2e/helpers/server/utils.js';

// Playwright reloads this config in each worker: the main process picks the free port once and
// the workers inherit it through the environment, so they all reach the same preview server.
process.env.E2E_PORT ??= String(await findFreePort());

const PORT = process.env.E2E_PORT;
const BASE_URL = `http://${PREVIEW_HOST}:${PORT}/`;

/**
 * End-to-end tests of the built game in Chromium, Firefox and WebKit, on desktop and on touch
 * phones: the suite builds the site, serves `dist/` with `vite preview` on a free port, and plays
 * it in a real browser, which computes the layout that happy-dom does not.
 */
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: Boolean(process.env.CI),
  // One line per test with its duration, also on CI, where the default `dot` reporter shows none.
  reporter: 'list',
  use: { baseURL: BASE_URL },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // An Android phone, with touch, so Chromium's mobile layout and taps are played too.
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    // The narrowest supported phone, with touch, so the specs play it with taps.
    { name: 'mobile-webkit', use: { ...devices['iPhone SE'] } },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --host ${PREVIEW_HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
  },
});
