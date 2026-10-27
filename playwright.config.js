import { defineConfig, devices } from '@playwright/test';
import { PREVIEW_HOST } from './e2e/helpers/server/constants.js';
import { findFreePort } from './e2e/helpers/server/utils.js';

// Playwright reloads this config in each worker: the main process picks the free port once and
// the workers inherit it through the environment, so they all reach the same preview server.
process.env.E2E_PORT ??= String(await findFreePort());

const PORT = process.env.E2E_PORT;
const BASE_URL = `http://${PREVIEW_HOST}:${PORT}/`;

/**
 * End-to-end tests of the built game in Chromium and WebKit: the suite builds the site, serves
 * `dist/` with `vite preview` on a free port, and plays it in a real browser, which computes the
 * layout that happy-dom does not.
 */
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: Boolean(process.env.CI),
  use: { baseURL: BASE_URL },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --host ${PREVIEW_HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
  },
});
