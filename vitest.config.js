import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    // Model tests run in Node.js; a test of DOM code opts into happy-dom with a
    // `// @vitest-environment happy-dom` comment on its first line.
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['app/js/**/*.js'],
      reporter: ['text', 'html'],
      // Just under the measured figures, so a change that leaves code untested fails the CI.
      thresholds: { lines: 100, functions: 100, statements: 99, branches: 98 },
    },
  },
});
