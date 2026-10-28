import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';
import { CSP_HEADER_NAME, EVERY_PAGE_PATTERN, HEADERS_FILE } from './server/constants.js';
import { findHeaderValue, parseHeaderRules } from './server/utils.js';

/** The Content Security Policy that Cloudflare Pages sends with every page of the site. */
const PAGE_POLICY = findHeaderValue({
  headers: parseHeaderRules(readFileSync(HEADERS_FILE, 'utf8')).get(EVERY_PAGE_PATTERN),
  name: CSP_HEADER_NAME,
});

if (PAGE_POLICY === null) {
  throw new Error(`No ${CSP_HEADER_NAME} for ${EVERY_PAGE_PATTERN} in ${HEADERS_FILE}`);
}

/**
 * The Playwright `test`, with a page that gets the Content Security Policy of `_headers`, which
 * `vite preview` leaves out, and that fails its test on any uncaught error or console error of the
 * game, a violation of that policy included.
 */
export const test = base.extend({
  contentSecurityPolicy: [
    async ({ page }, use) => {
      await page.route('**/*', async (route) => {
        const isPage = route.request().resourceType() === 'document';
        if (!isPage) return route.continue();

        const response = await route.fetch();
        await route.fulfill({
          response,
          headers: { ...response.headers(), [CSP_HEADER_NAME.toLowerCase()]: PAGE_POLICY },
        });
      });
      await use(PAGE_POLICY);
    },
    { auto: true },
  ],
  pageErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
