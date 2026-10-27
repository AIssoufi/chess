import { test as base, expect } from '@playwright/test';

/**
 * The Playwright `test`, with a page that fails its test on any uncaught error or console error
 * of the game.
 */
export const test = base.extend({
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
